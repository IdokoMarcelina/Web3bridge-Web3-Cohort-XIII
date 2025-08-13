// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/UniswapPermitSwap.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract SwapWithPermit is Script {
    function run() external {
        uint256 userPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(userPrivateKey);
        
     
        address permitSwapAddress = vm.envAddress("PERMIT_SWAP_ADDRESS");
        address tokenInAddress = vm.envAddress("TOKEN_IN_ADDRESS");
        address tokenOutAddress = vm.envAddress("TOKEN_OUT_ADDRESS");
        
        UniswapPermitSwap permitSwap = UniswapPermitSwap(permitSwapAddress);
        IERC20Permit tokenIn = IERC20Permit(tokenInAddress);
        
       
        uint256 amountIn = 1000e18; 
        uint256 amountOutMin = 1e18; 
        uint256 deadline = block.timestamp + 1 hours;
        
        console.log("Preparing permit signature...");
        console.log("User:", user);
        console.log("Token In:", tokenInAddress);
        console.log("Amount In:", amountIn);
        
        vm.startBroadcast(userPrivateKey);
        
    
        uint256 nonce = tokenIn.nonces(user);
        
      
        bytes32 domainSeparator = tokenIn.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                user,
                address(permitSwap),
                amountIn,
                nonce,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, digest);
        
       
        UniswapPermitSwap.SwapParams memory swapParams = UniswapPermitSwap.SwapParams({
            tokenIn: tokenInAddress,
            tokenOut: tokenOutAddress,
            amountIn: amountIn,
            amountOutMin: amountOutMin,
            to: user,
            deadline: deadline
        });
        
        UniswapPermitSwap.PermitParams memory permitParams = UniswapPermitSwap.PermitParams({
            value: amountIn,
            deadline: deadline,
            v: v,
            r: r,
            s: s
        });
        
        console.log("Executing swap with permit...");
       
        uint256[] memory amounts = permitSwap.swapExactTokensForTokensWithPermit(
            swapParams,
            permitParams
        );
        
        console.log("Swap completed!");
        console.log("Amount In:", amounts[0]);
        console.log("Amount Out:", amounts[1]);
        
        vm.stopBroadcast();
    }
}