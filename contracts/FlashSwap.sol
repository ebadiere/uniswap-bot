// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IUniswapV2Pair {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

contract FlashSwap {
    address private owner;
    address private uniswapV2Pair;
    address private uniswapV2Router;
    address private token0;
    address private token1;

    constructor(address _uniswapV2Pair, address _uniswapV2Router, address _token0, address _token1) {
        owner = msg.sender;
        uniswapV2Pair = _uniswapV2Pair;
        uniswapV2Router = _uniswapV2Router;
        token0 = _token0;
        token1 = _token1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function startFlashSwap(uint256 amount0Out, uint256 amount1Out) external onlyOwner {
        bytes memory data = abi.encode(msg.sender);
        IUniswapV2Pair(uniswapV2Pair).swap(amount0Out, amount1Out, address(this), data);
    }

    function uniswapV2Call(address sender, uint256 amount0, uint256 amount1, bytes calldata data) external {
        require(msg.sender == uniswapV2Pair, "Only callable by the Uniswap V2 Pair");

        address payable user = payable(abi.decode(data, (address)));
        
        // Logic for the flash swap
        // For example, arbitrage between two tokens or any other logic

        // Repay the flash loan
        if (amount0 > 0) {
            IERC20(token0).transfer(uniswapV2Pair, amount0);
        } else {
            IERC20(token1).transfer(uniswapV2Pair, amount1);
        }
    }

    // In case you want to withdraw tokens from the contract
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }
}