import { expect } from "chai";
import { ethers } from "hardhat";

describe("SWAPTEST", function () {
  let signer: any;
  let router: any;
  let SHIBA: any, WETH: any;

  const UNISWAP_V2_ROUTER_02_ADDRESS: string = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const WETH_ADDRESS: string = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const SHIBA_ADDRESS: string = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";

  const amountIn: any = ethers.parseEther('1000'); // Amount of tokenIn to swap (in Wei)
  const amountOutMinimum: any = ethers.parseEther('0'); // Minimum amount of tokenOut you want to receive (in Wei)
  const deadline: number = Math.floor(Date.now() / 1000) + 60 * 10; // Deadline (10 minutes from now)

  before(async function () {
    // Get the accounts from Hardhat
    [signer] = await ethers.getSigners();
 
    // Convert some ETH to WETH for testing
    const EthToWethContract = await ethers.getContractFactory("EthToWethConverter");
    const ethToWethConverter = await EthToWethContract.deploy(WETH_ADDRESS);
    await ethToWethConverter.convertEthToWeth({ value: ethers.parseEther("1000.00")});
    await ethToWethConverter.withdrawWeth();
    const WETHContract = await ethers.getContractFactory("WETH9");
    WETH = await WETHContract.attach(WETH_ADDRESS);
    const ownerInitialWethBalance = await WETH.balanceOf(signer.address);
    const ERC20Contract = await ethers.getContractFactory("ERC20");
    SHIBA = await ERC20Contract.attach(SHIBA_ADDRESS);

    // Load the Uniswap V2 Router contract
    router = await ethers.getContractAt('IUniswapV2Router02', UNISWAP_V2_ROUTER_02_ADDRESS);

    const UniswapV2Swap = await ethers.getContractFactory("UniswapV2Swap");
    const uniswap = await UniswapV2Swap.deploy(UNISWAP_V2_ROUTER_02_ADDRESS);

    console.log(`WETH Balance: ${ownerInitialWethBalance}`);
    console.log(`UniswapV2Swap deployed to ${uniswap.address}`);

  });

  it("should swap WETH for Shiba", async function () {

    // Check the current allowance for tokenIn
    const tokenIn = await ethers.getContractAt('contracts/UniswapV2FlashSwap.sol:IERC20', WETH_ADDRESS);
    const allowance = await tokenIn.allowance(signer.address, UNISWAP_V2_ROUTER_02_ADDRESS);

    // If the allowance is less than the amountIn, approve the Router to spend tokenIn
    if (allowance < amountIn) {
        const approveTx = await tokenIn.approve(UNISWAP_V2_ROUTER_02_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
        console.log('TokenIn approved for Router.');
    }

    const path = [WETH_ADDRESS, SHIBA_ADDRESS]; // Swap path

    // Define the swap parameters
    const params = {
        tokenIn: WETH_ADDRESS,
        tokenOut: SHIBA_ADDRESS,
        fee: 500, // 0.005% fee (for Uniswap V2)
        recipient: signer.address,
        deadline: deadline,
        amountIn: amountIn,
        path: path,
        to: signer.address,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0, // Set to 0 to disable price checks
    };

    // Execute the swap
    const swapTx = await router.swapExactTokensForTokens(
        params.amountIn,
        params.amountOutMinimum,
        params.path,
        params.to,
        params.deadline,
        { gasLimit: 300000 } // Specify a suitable gas limit
    );
    const swapReceipt = await swapTx.wait();

    // Print transaction hash and other details
    console.log('Swap transaction hash:', swapReceipt.transactionHash);
    const shibaAmount = await SHIBA.balanceOf(signer.address);
    console.log(`Shiba Balance: ${shibaAmount}`);

  });

});