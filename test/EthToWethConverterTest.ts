import { expect } from "chai";
// import { ethers } from "ethers";
import { ethers } from "hardhat";

describe("EthToWethConverterTest", function () {
  let converter: any;
  let owner: any;
  let WETH: any;
  const ethToConvert: ethers.BigNumberish = ethers.parseEther("1.0"); // 1 ETH
  const WETH_ADDRESS: string = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Replace with the actual WETH contract address

  before(async function () {
    // Deploy the EthToWethConverter contract
    const Converter = await ethers.getContractFactory("EthToWethConverter");
    converter = await Converter.deploy(WETH_ADDRESS); // Replace with the actual WETH contract address
    await converter.waitForDeployment();
    

    // Get the owner's address
    [owner] = await ethers.getSigners();

    // Get the WETH contract interface
    const WETHContract = await ethers.getContractFactory("WETH9");
    WETH = await WETHContract.attach(WETH_ADDRESS); // Replace with the actual WETH contract address
  });

  it("Should allow the owner to convert ETH to WETH", async function () {
    // Get the owner's initial WETH balance
    const ownerInitialWethBalance: ethers.BigNumberish = await WETH.balanceOf(owner.address);

    // Convert ETH to WETH
    await converter.connect(owner).convertEthToWeth({ value: ethToConvert });

    await converter.withdrawWeth();

    // Get the owner's updated WETH balance
    const ownerUpdatedWethBalance: ethers.BigNumberish = await WETH.balanceOf(owner.address);

    // Check that the owner's WETH balance increased by 1 ETH
    expect(ownerUpdatedWethBalance - ownerInitialWethBalance).to.equal(ethToConvert);
  });

});