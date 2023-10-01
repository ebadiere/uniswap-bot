// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract UniswapV2Swap {

    IUniswapV2Router public immutable swapRouter;

    constructor(IUniswapV2Router _swapRouter){
        swapRouter = _swapRouter;
    }

    function swapSingleHopExactAmountIn(
        address tokenInAddress,
        address tokenOutAddress,
        uint amountIn,
        uint amountOutMin
    ) external returns (uint amountOut) {
        IERC20 tokenIn = IERC20(tokenInAddress);
    
        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        tokenIn.approve(address(swapRouter), amountIn);

        address[] memory path;
        path = new address[](2);
        path[0] = tokenInAddress;
        path[1] = tokenOutAddress;

        uint[] memory amounts = swapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );


        return amounts[1];
    }

    // Swap DAI -> WETH -> USDC
    function swapMultiHopExactAmountIn(
        address tokenInAddress,
        address[] memory path,
        uint amountIn,
        uint amountOutMin
    ) external returns (uint amountOut) {
        IERC20 tokenIn = IERC20(tokenInAddress);
    
        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        tokenIn.approve(address(swapRouter), amountIn);


        // address[] memory path;
        // path = new address[](3);
        // path[0] = DAI;
        // path[1] = WETH;
        // path[2] = USDC;

        uint[] memory amounts = swapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        // amounts[0] = DAI amount
        // amounts[1] = WETH amount
        // amounts[2] = USDC amount
        return amounts[2];
    }

    // Swap WETH to DAI
    // function swapSingleHopExactAmountOut(
    //     uint amountOutDesired,
    //     uint amountInMax
    // ) external returns (uint amountOut) {
    //     weth.transferFrom(msg.sender, address(this), amountInMax);
    //     weth.approve(address(swapRouter), amountInMax);

    //     address[] memory path;
    //     path = new address[](2);
    //     path[0] = WETH;
    //     path[1] = DAI;

    //     uint[] memory amounts = swapRouter.swapTokensForExactTokens(
    //         amountOutDesired,
    //         amountInMax,
    //         path,
    //         msg.sender,
    //         block.timestamp
    //     );

    //     // Refund WETH to msg.sender
    //     if (amounts[0] < amountInMax) {
    //         weth.transfer(msg.sender, amountInMax - amounts[0]);
    //     }

    //     return amounts[1];
    // }

    // Swap DAI -> WETH -> USDC
    // function swapMultiHopExactAmountOut(
    //     uint amountOutDesired,
    //     uint amountInMax
    // ) external returns (uint amountOut) {
    //     dai.transferFrom(msg.sender, address(this), amountInMax);
    //     dai.approve(address(swapRouter), amountInMax);

    //     address[] memory path;
    //     path = new address[](3);
    //     path[0] = DAI;
    //     path[1] = WETH;
    //     path[2] = USDC;

    //     uint[] memory amounts = swapRouter.swapTokensForExactTokens(
    //         amountOutDesired,
    //         amountInMax,
    //         path,
    //         msg.sender,
    //         block.timestamp
    //     );

    //     // Refund DAI to msg.sender
    //     if (amounts[0] < amountInMax) {
    //         dai.transfer(msg.sender, amountInMax - amounts[0]);
    //     }

    //     return amounts[2];
    // }

    // ToDo Implement Eth To Weth swap as a potential conveniece setup util
    
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface IWETH is IERC20 {
    function deposit() external payable;

    function withdraw(uint amount) external;
}