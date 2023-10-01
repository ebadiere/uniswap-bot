// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./WETH9.sol"; // Import the WETH9 contract interface

contract EthToWethConverter {
    address public owner;
    WETH9 public wethToken; // WETH contract instance

    constructor(address payable _wethAddress) {
        owner = msg.sender;
        wethToken = WETH9(_wethAddress); // Initialize the WETH contract instance
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    // Function to deposit ETH and receive WETH tokens in return
    function convertEthToWeth() external payable onlyOwner {
        require(msg.value > 0, "Please send some ETH for conversion");

        // Deposit ETH and mint WETH tokens
        wethToken.deposit{value: msg.value}();

        // Optionally, you can transfer the WETH tokens to another address
        // wethToken.transfer(destinationAddress, wethToken.balanceOf(address(this)));
    }

    // Function to withdraw any remaining WETH tokens to the owner
    function withdrawWeth() external onlyOwner {
        uint256 wethBalance = wethToken.balanceOf(address(this));
        require(wethBalance > 0, "No WETH balance to withdraw");

        // Transfer the WETH tokens to the owner
        wethToken.transfer(owner, wethBalance);
    }

    // Function to check the contract's WETH balance
    function getWethBalance() external view returns (uint256) {
        return wethToken.balanceOf(address(this));
    }

    // Fallback function to accept incoming Ether (in case someone sends ETH directly)
    receive() external payable {
        // Do nothing, just accept the Ether
    }
}
