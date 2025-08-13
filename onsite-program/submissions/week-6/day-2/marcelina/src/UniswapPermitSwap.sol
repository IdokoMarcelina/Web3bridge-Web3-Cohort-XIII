// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";


contract UniswapPermitSwap is ReentrancyGuard {
    IUniswapV2Router02 public immutable uniswapRouter;
    
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address to;
        uint256 deadline;
    }
    
    struct PermitParams {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    
    event SwapWithPermit(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(address _uniswapRouter) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
    }
    

    function swapExactTokensForTokensWithPermit(
        SwapParams calldata swapParams,
        PermitParams calldata permitParams
    ) external nonReentrant returns (uint256[] memory amounts) {
     
        IERC20Permit(swapParams.tokenIn).permit(
            msg.sender,
            address(this),
            permitParams.value,
            permitParams.deadline,
            permitParams.v,
            permitParams.r,
            permitParams.s
        );
        
        IERC20(swapParams.tokenIn).transferFrom(
            msg.sender,
            address(this),
            swapParams.amountIn
        );
        
        IERC20(swapParams.tokenIn).approve(
            address(uniswapRouter),
            swapParams.amountIn
        );
        
        address[] memory path = new address[](2);
        path[0] = swapParams.tokenIn;
        path[1] = swapParams.tokenOut;
        
        amounts = uniswapRouter.swapExactTokensForTokens(
            swapParams.amountIn,
            swapParams.amountOutMin,
            path,
            swapParams.to,
            swapParams.deadline
        );
        
        emit SwapWithPermit(
            msg.sender,
            swapParams.tokenIn,
            swapParams.tokenOut,
            swapParams.amountIn,
            amounts[1]
        );
        
        return amounts;
    }
   
    function swapExactETHForTokensWithPermit(
        SwapParams calldata swapParams,
        PermitParams calldata permitParams
    ) external payable nonReentrant returns (uint256[] memory amounts) {
        require(msg.value == swapParams.amountIn, "Incorrect ETH amount");
        require(swapParams.tokenIn == uniswapRouter.WETH(), "TokenIn must be WETH");
        
    
        address[] memory path = new address[](2);
        path[0] = swapParams.tokenIn; 
        path[1] = swapParams.tokenOut;
        
    
        amounts = uniswapRouter.swapExactETHForTokens{value: msg.value}(
            swapParams.amountOutMin,
            path,
            swapParams.to,
            swapParams.deadline
        );
        
        emit SwapWithPermit(
            msg.sender,
            swapParams.tokenIn,
            swapParams.tokenOut,
            swapParams.amountIn,
            amounts[1]
        );
        
        return amounts;
    }
    
    
    function swapExactTokensForETHWithPermit(
        SwapParams calldata swapParams,
        PermitParams calldata permitParams
    ) external nonReentrant returns (uint256[] memory amounts) {
        require(swapParams.tokenOut == uniswapRouter.WETH(), "TokenOut must be WETH");
        
     
        IERC20Permit(swapParams.tokenIn).permit(
            msg.sender,
            address(this),
            permitParams.value,
            permitParams.deadline,
            permitParams.v,
            permitParams.r,
            permitParams.s
        );
        
        IERC20(swapParams.tokenIn).transferFrom(
            msg.sender,
            address(this),
            swapParams.amountIn
        );
        
        IERC20(swapParams.tokenIn).approve(
            address(uniswapRouter),
            swapParams.amountIn
        );
        
        address[] memory path = new address[](2);
        path[0] = swapParams.tokenIn;
        path[1] = swapParams.tokenOut; // WETH
        
        amounts = uniswapRouter.swapExactTokensForETH(
            swapParams.amountIn,
            swapParams.amountOutMin,
            path,
            swapParams.to,
            swapParams.deadline
        );
        
        emit SwapWithPermit(
            msg.sender,
            swapParams.tokenIn,
            swapParams.tokenOut,
            swapParams.amountIn,
            amounts[1]
        );
        
        return amounts;
    }
    
  
    function recoverToken(address token, uint256 amount) external {
        IERC20(token).transfer(msg.sender, amount);
    }
}