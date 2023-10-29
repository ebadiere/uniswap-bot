import { ethers } from 'ethers';

import config from '../config.json';
import { getTokenAndContract, getPairContract, getReserves, calculatePrice, simulate } from './helpers/helpers';
import { provider, uFactory, uRouter, sFactory, sRouter, arbitrage } from './helpers/initialization';

const arbFor: string = process.env.ARB_FOR || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; 
const arbAgainst: string = process.env.ARB_AGAINST || '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE';
const units: number = parseInt(process.env.UNITS || '0');
const difference: number = parseFloat(process.env.PRICE_DIFFERENCE || '0.5');
const gasLimit: number = parseInt(process.env.GAS_LIMIT || '600000');
const gasPrice: number = parseFloat(process.env.GAS_PRICE || '0.00000006');

let uPair: any, sPair: any, amount: any;
let isExecuting: boolean = false;

const main = async (): Promise<void> => {
  const { token0Contract, token1Contract, token0, token1 } = await getTokenAndContract(arbFor, arbAgainst, provider);
  uPair = await getPairContract(uFactory, token0.address, token1.address, provider);
  sPair = await getPairContract(sFactory, token0.address, token1.address, provider);

  console.log(`uPair Address: ${uPair.address}`);
  console.log(`sPair Address: ${sPair.address}\n`);

  uPair.on('Swap', async (): Promise<void> => {
    if (!isExecuting) {
      isExecuting = true;

      const priceDifference: number = await checkPrice('Uniswap', token0, token1);
      const routerPath: any = await determineDirection(priceDifference);

      if (!routerPath) {
        console.log(`No Arbitrage Currently Available\n`);
        console.log(`-----------------------------------------\n`);
        isExecuting = false;
        return;
      }

      const isProfitable: boolean = await determineProfitability(routerPath, token0Contract, token0, token1);

      if (!isProfitable) {
        console.log(`No Arbitrage Currently Available\n`);
        console.log(`-----------------------------------------\n`);
        isExecuting = false;
        return;
      }

      const receipt: any = await executeTrade(routerPath, token0Contract, token1Contract);

      isExecuting = false;
    }
  });

  sPair.on('Swap', async (): Promise<void> => {
    if (!isExecuting) {
      isExecuting = true;

      const priceDifference: number = await checkPrice('Sushiswap', token0, token1);
      const routerPath: any = await determineDirection(priceDifference);

      if (!routerPath) {
        console.log(`No Arbitrage Currently Available\n`);
        console.log(`-----------------------------------------\n`);
        isExecuting = false;
        return;
      }

      const isProfitable: boolean = await determineProfitability(routerPath, token0Contract, token0, token1);

      if (!isProfitable) {
        console.log(`No Arbitrage Currently Available\n`);
        console.log(`-----------------------------------------\n`);
        isExecuting = false;
        return;
      }

      const receipt: any = await executeTrade(routerPath, token0Contract, token1Contract);

      isExecuting = false;
    }
  });

  console.log("Waiting for swap event...");
};

const checkPrice = async (exchange: string, token0: any, token1: any): Promise<number> => {
  isExecuting = true;

  console.log(`Swap Initiated on ${exchange}, Checking Price...\n`);

  const currentBlock: number = await provider.getBlockNumber();

  const uPrice: Big = await calculatePrice(uPair);
  const sPrice: Big = await calculatePrice(sPair);

  const uFPrice: number = parseFloat(Number(uPrice).toFixed(units));
  const sFPrice: number = parseFloat(Number(sPrice).toFixed(units));
  const priceDifference: number = parseFloat((((uFPrice - sFPrice) / sFPrice) * 100).toFixed(2));

  console.log(`Current Block: ${currentBlock}`);
  console.log(`-----------------------------------------`);
  console.log(`UNISWAP   | ${token1.symbol}/${token0.symbol}\t | ${uFPrice}`);
  console.log(`SUSHISWAP | ${token1.symbol}/${token0.symbol}\t | ${sFPrice}\n`);
  console.log(`Percentage Difference: ${priceDifference}%\n`);

  return priceDifference;
};

const determineDirection = async (priceDifference: number): Promise<any> => {
  console.log(`Determining Direction...\n`);

  if (priceDifference >= difference) {

    console.log(`Potential Arbitrage Direction:\n`);
    console.log(`Buy\t -->\t Uniswap`);
    console.log(`Sell\t -->\t Sushiswap\n`);
    return [uRouter, sRouter];

  } else if (priceDifference <= -(difference)) {

    console.log(`Potential Arbitrage Direction:\n`);
    console.log(`Buy\t -->\t Sushiswap`);
    console.log(`Sell\t -->\t Uniswap\n`);
    return [sRouter, uRouter];

  } else {
    return null;
  }
};

const determineProfitability = async (_routerPath: any, _token0Contract: any, _token0: any, _token1: any): Promise<boolean> => {
  console.log(`Determining Profitability...\n`);

  let reserves: any, exchangeToBuy: string, exchangeToSell: string;

  if (_routerPath[0].address == uRouter.address) {
    reserves = await getReserves(sPair);
    exchangeToBuy = 'Uniswap';
    exchangeToSell = 'Sushiswap';
  } else {
    reserves = await getReserves(uPair);
    exchangeToBuy = 'Sushiswap';
    exchangeToSell = 'Uniswap';
  }

  console.log(`Reserves on ${_routerPath[1].address}`);
  console.log(`SHIB: ${Number(ethers.utils.formatUnits(reserves[0].toString(), 'ether')).toFixed(0)}`);
  console.log(`WETH: ${ethers.utils.formatUnits(reserves[1].toString(), 'ether')}\n`);

  try {

    let result: any = await _routerPath[0].getAmountsIn(reserves[0], [_token0.address, _token1.address]);

    const token0In: any = result[0];
    const token1In: any = result[1];

    result = await _routerPath[1].getAmountsOut(token1In, [_token1.address, _token0.address]);

    console.log(`Estimated amount of WETH needed to buy enough Shib on ${exchangeToBuy}\t\t| ${ethers.utils.formatUnits(token0In, 'ether')}`);
    console.log(`Estimated amount of WETH returned after swapping SHIB on ${exchangeToSell}\t| ${ethers.utils.formatUnits(result[1], 'ether')}\n`);

    const { amountIn, amountOut } = await simulate(token0In, _routerPath, _token0, _token1);
    const amountDifference: number = amountOut - amountIn;
    const estimatedGasCost: number = gasLimit * gasPrice;

    let account: any;
    if (process.env.PRIVATE_KEY) {
      account = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    }

    const ethBalanceBefore: string = account ? ethers.utils.formatUnits(await account.getBalance(), 'ether') : 'N/A';
    const ethBalanceAfter: number | string = account ? Number(ethBalanceBefore) - estimatedGasCost : 'N/A';

    const wethBalanceBefore: number = Number(ethers.utils.formatUnits(await _token0Contract.balanceOf(account?.address), 'ether'));
    const wethBalanceAfter: number = amountDifference + wethBalanceBefore;
    const wethBalanceDifference: number = wethBalanceAfter - wethBalanceBefore;

    const data = {
      eth: {
          'ETH Balance Before': ethBalanceBefore,
          'ETH Balance After': ethBalanceAfter,
          'ETH Spent (gas)': estimatedGasCost
      },
      separator1: '-',
      weth: {
          'WETH Balance BEFORE': wethBalanceBefore,
          'WETH Balance AFTER': wethBalanceAfter,
          'WETH Gained/Lost': wethBalanceDifference
      },
      separator2: '-',
      totals: {
          'Total Gained/Lost': wethBalanceDifference - estimatedGasCost
      }
    };
  

    console.table(data);
    console.log();

    if (amountOut < amountIn) {
      return false;
    }

    amount = token0In;
    return true;

  } catch (error) {
    console.log(error);
    console.log(`\nError occured while trying to determine profitability...\n`);
    console.log(`This can typically happen because of liquidity issues, see README for more information.\n`);
    return false;
  }
};

const executeTrade = async (_routerPath: any, _token0Contract: any, _token1Contract: any): Promise<void> => {
  console.log(`Attempting Arbitrage...\n`);

  let startOnUniswap: boolean;

  if (_routerPath[0]._address == uRouter._address) {
    startOnUniswap = true;
  } else {
    startOnUniswap = false;
  }

  let account: any;
  if (process.env.PRIVATE_KEY) {
    account = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  }

  const tokenBalanceBefore: any = await _token0Contract.balanceOf(account?.address);
  const ethBalanceBefore: any = account ? await account.getBalance() : 'N/A';

  if (config.PROJECT_SETTINGS.isDeployed) {
    // const estimatedGasCost: any = await arbitrage.estimateGas.flashSwap(amount);
    console.log(`DEBUG: Amount: ${amount}`);
    const transaction: any = await arbitrage.connect(account).flashSwap(amount);
    const receipt: any = await transaction.wait();
  }

  console.log(`Trade Complete:\n`);

  const tokenBalanceAfter: any = await _token0Contract.balanceOf(account.address);
  const ethBalanceAfter: any = await account.getBalance();

  const tokenBalanceDifference: any = tokenBalanceAfter - tokenBalanceBefore;
  const ethBalanceDifference: any = ethBalanceBefore - ethBalanceAfter;

  const data: any = {
    eth: {
      'ETH Balance Before': ethers.utils.formatUnits(ethBalanceBefore, 'ether'),
      'ETH Balance After': ethers.utils.formatUnits(ethBalanceAfter, 'ether'),
      'ETH Spent (gas)': ethers.utils.formatUnits(ethBalanceDifference.toString(), 'ether'),
    },
    separator1: '-',
    weth: {
      'WETH Balance BEFORE': ethers.utils.formatUnits(tokenBalanceBefore, 'ether'),
      'WETH Balance AFTER': ethers.utils.formatUnits(tokenBalanceAfter, 'ether'),
      'WETH Gained/Lost': ethers.utils.formatUnits(tokenBalanceDifference.toString(), 'ether'),
    },
    separator2: '-',
    totals: {
      'Total Gained/Lost': `${ethers.utils.formatUnits((tokenBalanceDifference - ethBalanceDifference).toString(), 'ether')} ETH`
    }
  };

  console.table(data);
};

main();