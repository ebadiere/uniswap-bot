import { ethers, Contract, providers } from "ethers";
import Big from 'big.js';

import IUniswapV2Pair from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import IERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json';

interface Token {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
}

async function getTokenAndContract(_token0Address: string, _token1Address: string, _provider: providers.Provider): Promise<{ token0Contract: Contract, token1Contract: Contract, token0: Token, token1: Token }> {
    const token0Contract = new ethers.Contract(_token0Address, IERC20.abi, _provider);
    const token1Contract = new ethers.Contract(_token1Address, IERC20.abi, _provider);

    const token0: Token = {
        address: _token0Address,
        decimals: 18,
        symbol: await token0Contract.symbol(),
        name: await token0Contract.name()
    };

    const token1: Token = {
        address: _token1Address,
        decimals: 18,
        symbol: await token1Contract.symbol(),
        name: await token1Contract.name()
    };

    return { token0Contract, token1Contract, token0, token1 };
}

async function getPairAddress(_V2Factory: Contract, _token0: string, _token1: string): Promise<string> {
    const pairAddress = await _V2Factory.getPair(_token0, _token1);
    return pairAddress;
}

async function getPairContract(_V2Factory: Contract, _token0: string, _token1: string, _provider: providers.Provider): Promise<Contract> {
    const pairAddress = await getPairAddress(_V2Factory, _token0, _token1);
    const pairContract = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, _provider);
    return pairContract;
}

async function getReserves(_pairContract: Contract): Promise<[Big, Big]> {
    const reserves = await _pairContract.getReserves();
    return [Big(reserves.reserve0), Big(reserves.reserve1)];
}

async function calculatePrice(_pairContract: Contract): Promise<Big> {
    const [x, y] = await getReserves(_pairContract);
    return x.div(y);
}

async function calculateDifference(_uPrice: number, _sPrice: number): Promise<string> {
    return (((_uPrice - _sPrice) / _sPrice) * 100).toFixed(2);
}

async function simulate(amount: number, _routerPath: Contract[], _token0: Token, _token1: Token): Promise<{ amountIn: number, amountOut: number }> {
    const trade1 = await _routerPath[0].getAmountsOut(amount, [_token0.address, _token1.address]);
    const trade2 = await _routerPath[1].getAmountsOut(trade1[1], [_token1.address, _token0.address]);

    const amountIn = Number(ethers.utils.formatUnits(trade1[0], 'ether'));
    const amountOut = Number(ethers.utils.formatUnits(trade2[1], 'ether'));

    return { amountIn, amountOut };
}

export {
    getTokenAndContract,
    getPairAddress,
    getPairContract,
    getReserves,
    calculatePrice,
    calculateDifference,
    simulate
};