// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WETH9 is ERC20, Ownable {
    constructor() ERC20("Wrapped Ether", "WETH") {}

    // Mint WETH tokens by wrapping ETH
    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    // Withdraw WETH tokens and receive ETH
    function withdraw(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient WETH balance");
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    // Fallback function allows users to deposit ETH by sending it to the contract
    receive() external payable {
        this.deposit();
    }

    // Owner can withdraw any ETH left in the contract
    function withdrawEthToOwner() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}