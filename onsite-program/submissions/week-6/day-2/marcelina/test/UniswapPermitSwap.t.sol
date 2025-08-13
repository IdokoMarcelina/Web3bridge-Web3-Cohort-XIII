// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/UniswapPermitSwap.sol";
import "../src/MockERC20Permit.sol";

contract UniswapPermitSwapTest is Test {
    UniswapPermitSwap public permitSwap;
    MockERC20Permit public tokenA;
    MockERC20Permit public tokenB;
    
    address public constant UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    address public user;
    uint256 public userPrivateKey;
    
    function setUp() public {
       
        userPrivateKey = 0x1234;
        user = vm.addr(userPrivateKey);
       
        permitSwap = new UniswapPermitSwap(UNISWAP_ROUTER);
        tokenA = new MockERC20Permit("Token A", "TKNA", 1000000e18);
        tokenB = new MockERC20Permit("Token B", "TKNB", 1000000e18);
        
       
        tokenA.mint(user, 10000e18);
        tokenB.mint(user, 10000e18);
        
        
        vm.label(address(permitSwap), "PermitSwap");
        vm.label(address(tokenA), "TokenA");
        vm.label(address(tokenB), "TokenB");
        vm.label(user, "User");
    }
    
    function testPermitGeneration() public {
        uint256 amount = 1000e18;
        uint256 deadline = block.timestamp + 1 hours;
        
       
        (uint8 v, bytes32 r, bytes32 s) = _generatePermitSignature(
            address(tokenA),
            user,
            address(permitSwap),
            amount,
            deadline,
            userPrivateKey
        );
        
   
        assertTrue(v == 27 || v == 28, "Invalid v value");
        assertTrue(r != bytes32(0), "Invalid r value");
        assertTrue(s != bytes32(0), "Invalid s value");
    }
    
    function testSwapExactTokensForTokensWithPermit() public {
        uint256 amountIn = 1000e18;
        uint256 amountOutMin = 1e18;
        uint256 deadline = block.timestamp + 1 hours;
        
       
        (uint8 v, bytes32 r, bytes32 s) = _generatePermitSignature(
            address(tokenA),
            user,
            address(permitSwap),
            amountIn,
            deadline,
            userPrivateKey
        );
        
      
        UniswapPermitSwap.SwapParams memory swapParams = UniswapPermitSwap.SwapParams({
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
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
        
        uint256 initialBalanceA = tokenA.balanceOf(user);
        
    
        vm.mockCall(
            UNISWAP_ROUTER,
            abi.encodeWithSignature(
                "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)"
            ),
            abi.encode([amountIn, amountOutMin])
        );
        
       
        vm.startPrank(user);
        
        vm.expectRevert();
        permitSwap.swapExactTokensForTokensWithPermit(swapParams, permitParams);
        
        vm.stopPrank();
    }
    
    function testPermitParameters() public {
        assertEq(tokenA.name(), "Token A");
        assertEq(tokenA.symbol(), "TKNA");
        assertEq(tokenA.DOMAIN_SEPARATOR(), _computeDomainSeparator(address(tokenA)));
    }
    
    function _generatePermitSignature(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint256 privateKey
    ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 domainSeparator = MockERC20Permit(token).DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                MockERC20Permit(token).nonces(owner),
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        
        return vm.sign(privateKey, digest);
    }
    
    function _computeDomainSeparator(address token) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(MockERC20Permit(token).name())),
                keccak256(bytes("1")),
                block.chainid,
                token
            )
        );
    }
}