import { ethers } from "hardhat";
import { IERC20 } from "../typechain-types";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Contract addresses (Ethereum Mainnet)
const ADDRESSES = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  UNISWAP_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  USDC_HOLDER: "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"
};

// Helper function to format tokens
const formatToken = (amount: bigint, decimals: number = 18): string => {
  return ethers.formatUnits(amount, decimals);
};

// Helper function to check balance
const checkBalance = async (token: IERC20, address: string, symbol: string, decimals: number = 18): Promise<bigint> => {
  const balance = await token.balanceOf(address);
  console.log(`${symbol} balance: ${formatToken(balance, decimals)}`);
  return balance;
};

// Helper function to approve tokens
const approveToken = async (token: IERC20, spender: string, amount: bigint, signer: any, symbol: string): Promise<void> => {
  const currentAllowance = await token.allowance(signer.address, spender);
  if (currentAllowance < amount) {
    console.log(`Approving ${symbol} for spending...`);
    const tx = await token.connect(signer).approve(spender, amount);
    await tx.wait();
    console.log(`✅ ${symbol} approved successfully`);
  } else {
    console.log(`✅ ${symbol} already has sufficient allowance`);
  }
};

const main = async () => {
  console.log("🚀 Starting Uniswap V2 interactions...\n");
  
  try {
    // Setup contracts
    const ROUTER = await ethers.getContractAt("IUniswapV2Router02", ADDRESSES.UNISWAP_ROUTER);
    const FACTORY = await ethers.getContractAt(
      "IUniswapV2Factory",
      await ROUTER.factory()
    );

    // Impersonate account with USDC
    await helpers.impersonateAccount(ADDRESSES.USDC_HOLDER);
    const impersonatedSigner = await ethers.getSigner(ADDRESSES.USDC_HOLDER);
    
    // Add some ETH to the impersonated account for gas
    await helpers.setBalance(ADDRESSES.USDC_HOLDER, ethers.parseEther("10"));

    // Get contract instances
    const USDC = await ethers.getContractAt("IERC20", ADDRESSES.USDC) as unknown as IERC20;
    const DAI = await ethers.getContractAt("IERC20", ADDRESSES.DAI) as unknown as IERC20;
    const WETH = await ethers.getContractAt("IERC20", ADDRESSES.WETH) as unknown as IERC20;

    console.log("📊 Initial balances:");
    const initialUSDC = await checkBalance(USDC, impersonatedSigner.address, "USDC", 6);
    const initialDAI = await checkBalance(DAI, impersonatedSigner.address, "DAI", 18);
    const initialETH = await ethers.provider.getBalance(impersonatedSigner.address);
    console.log(`ETH balance: ${formatToken(initialETH)} ETH\n`);

    // Define amounts
    const swapAmount = ethers.parseUnits("100", 6); // 100 USDC
    const minAmountOut = ethers.parseUnits("90", 18); // 90 DAI minimum
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    // Check if we have enough USDC
    if (initialUSDC < swapAmount) {
      throw new Error(`Insufficient USDC balance. Need ${formatToken(swapAmount, 6)}, have ${formatToken(initialUSDC, 6)}`);
    }

    /** -------------------- TOKEN APPROVALS -------------------- */
    console.log("🔐 Setting up token approvals...");
    await approveToken(USDC, ADDRESSES.UNISWAP_ROUTER, ethers.parseUnits("1000", 6), impersonatedSigner, "USDC");
    await approveToken(DAI, ADDRESSES.UNISWAP_ROUTER, ethers.parseUnits("1000", 18), impersonatedSigner, "DAI");
    console.log("");

    /** -------------------- EXACT INPUT SWAP -------------------- */
    console.log("💱 Executing swapExactTokensForTokens (USDC → DAI)...");
    
    const swapTx = await ROUTER.connect(impersonatedSigner).swapExactTokensForTokens(
      swapAmount,
      minAmountOut,
      [ADDRESSES.USDC, ADDRESSES.DAI],
      impersonatedSigner.address,
      deadline
    );
    await swapTx.wait();
    
    console.log("✅ Swap completed successfully!");
    await checkBalance(USDC, impersonatedSigner.address, "USDC", 6);
    const newDAIBalance = await checkBalance(DAI, impersonatedSigner.address, "DAI", 18);
    console.log("");

    /** -------------------- EXACT OUTPUT SWAP -------------------- */
    console.log("💱 Executing swapTokensForExactTokens (DAI → USDC)...");
    
    const exactOutAmount = ethers.parseUnits("50", 6); // Want exactly 50 USDC
    const maxAmountIn = ethers.parseUnits("100", 18); // Max 100 DAI
    
    if (newDAIBalance >= maxAmountIn) {
      const swapTx2 = await ROUTER.connect(impersonatedSigner).swapTokensForExactTokens(
        exactOutAmount,
        maxAmountIn,
        [ADDRESSES.DAI, ADDRESSES.USDC],
        impersonatedSigner.address,
        deadline
      );
      await swapTx2.wait();
      
      console.log("✅ Exact output swap completed!");
      await checkBalance(USDC, impersonatedSigner.address, "USDC", 6);
      await checkBalance(DAI, impersonatedSigner.address, "DAI", 18);
    } else {
      console.log("⚠️  Insufficient DAI balance for exact output swap");
    }
    console.log("");

    /** -------------------- ETH SWAPS -------------------- */
    console.log("💱 Executing ETH swaps...");
    
    // Swap ETH for USDC
    const ethAmount = ethers.parseEther("0.1");
    const minUSDCOut = ethers.parseUnits("200", 6); // Expect at least 200 USDC
    
    const ethSwapTx = await ROUTER.connect(impersonatedSigner).swapExactETHForTokens(
      minUSDCOut,
      [ADDRESSES.WETH, ADDRESSES.USDC],
      impersonatedSigner.address,
      deadline,
      { value: ethAmount }
    );
    await ethSwapTx.wait();
    
    console.log("✅ ETH → USDC swap completed!");
    const finalUSDC = await checkBalance(USDC, impersonatedSigner.address, "USDC", 6);
    console.log("");

    /** -------------------- LIQUIDITY OPERATIONS -------------------- */
    console.log("🏊 Adding liquidity...");
    
    const liquidityUSDC = ethers.parseUnits("50", 6);
    const liquidityDAI = ethers.parseUnits("50", 18);
    
    // Check if we have enough balance for liquidity
    const currentUSDC = await USDC.balanceOf(impersonatedSigner.address);
    const currentDAI = await DAI.balanceOf(impersonatedSigner.address);
    
    if (currentUSDC >= liquidityUSDC && currentDAI >= liquidityDAI) {
      const addLiquidityTx = await ROUTER.connect(impersonatedSigner).addLiquidity(
        ADDRESSES.USDC,
        ADDRESSES.DAI,
        liquidityUSDC,
        liquidityDAI,
        0, // Accept any amount of USDC
        0, // Accept any amount of DAI
        impersonatedSigner.address,
        deadline
      );
      await addLiquidityTx.wait();
      
      console.log("✅ Liquidity added successfully!");
      
      // Check LP token balance
      const pairAddress = await FACTORY.getPair(ADDRESSES.USDC, ADDRESSES.DAI);
      const lpToken = await ethers.getContractAt("IERC20", pairAddress);
      const lpBalance = await checkBalance(lpToken, impersonatedSigner.address, "LP", 18);
      
      if (lpBalance > 0) {
        console.log("🏊 Removing liquidity...");
        
        // Approve LP token for removal
        await approveToken(lpToken, ADDRESSES.UNISWAP_ROUTER, lpBalance, impersonatedSigner, "LP");
        
        const removeLiquidityTx = await ROUTER.connect(impersonatedSigner).removeLiquidity(
          ADDRESSES.USDC,
          ADDRESSES.DAI,
          lpBalance,
          0, // Accept any amount of USDC
          0, // Accept any amount of DAI
          impersonatedSigner.address,
          deadline
        );
        await removeLiquidityTx.wait();
        
        console.log("✅ Liquidity removed successfully!");
      }
    } else {
      console.log("⚠️  Insufficient balance for liquidity operations");
    }
    console.log("");

    /** -------------------- FINAL BALANCES -------------------- */
    console.log("📊 Final balances:");
    await checkBalance(USDC, impersonatedSigner.address, "USDC", 6);
    await checkBalance(DAI, impersonatedSigner.address, "DAI", 18);
    const finalETH = await ethers.provider.getBalance(impersonatedSigner.address);
    console.log(`ETH balance: ${formatToken(finalETH)} ETH`);
    
    console.log("\n🎉 All Uniswap V2 interactions completed successfully!");

  } catch (error: any) {
    console.error("❌ Error occurred:", error.message);
    
    // Provide more detailed error information
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.code) {
      console.error("Code:", error.code);
    }
    
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exitCode = 1;
});
