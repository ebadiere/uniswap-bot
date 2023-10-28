import { ethers } from "hardhat";

async function main() {
  
  const UniswapV2FlashSwap = await ethers.getContractFactory("UniswapV2FlashSwap");
  const uniswapV2FlashSwap = await UniswapV2FlashSwap.deploy();

  await uniswapV2FlashSwap.deployed();

  console.log(
    ` deployed to ${uniswapV2FlashSwap.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});