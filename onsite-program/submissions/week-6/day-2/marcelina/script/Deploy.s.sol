// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/UniswapPermitSwap.sol";
import "../src/MockERC20Permit.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
       
        address uniswapRouter;
        uint256 chainId = block.chainid;
        
        if (chainId == 1) {
           
            uniswapRouter = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        } else if (chainId == 11155111) {
          
            uniswapRouter = 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008;
        } else {
            
            uniswapRouter = address(0x1234567890123456789012345678901234567890);
        }
        
    
        UniswapPermitSwap permitSwap = new UniswapPermitSwap(uniswapRouter);
        
        console.log("UniswapPermitSwap deployed to:", address(permitSwap));
        console.log("Uniswap Router:", uniswapRouter);
        
      
        if (chainId != 1) {
            MockERC20Permit tokenA = new MockERC20Permit("Token A", "TKNA", 1000000e18);
            MockERC20Permit tokenB = new MockERC20Permit("Token B", "TKNB", 1000000e18);
            
            console.log("Mock Token A deployed to:", address(tokenA));
            console.log("Mock Token B deployed to:", address(tokenB));
        }
        
        vm.stopBroadcast();
    }
}