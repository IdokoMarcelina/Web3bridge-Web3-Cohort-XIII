import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
  const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  await helpers.impersonateAccount(USDCHolder);
  const impersonatedSigner = await ethers.getSigner(USDCHolder);

  const DAI = await ethers.getContractAt("IERC20", DAIAddress);
  const ROUTER = await ethers.getContractAt("IUniswapV2Router02", UNIRouter);

  const amountTokenDesired = ethers.parseUnits("10000", 18); 
  const amountETHDesired = ethers.parseUnits("100", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; 


  console.log("Getting Token Balance...");
  // Balance before adding liquidity
  const daiBalanceBefore = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceBefore = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);
 
  console.log("DAI Balance Before:", ethers.formatUnits(daiBalanceBefore, 18));
  console.log("ETH Balance Before:", ethers.formatUnits(ethBalanceBefore, 18));

  
  // Approve DAI for the Uniswap Router
  console.log("Approving tokens for Uniswap Router...");
  await DAI.connect(impersonatedSigner).approve(UNIRouter, amountTokenDesired);


  // Add liquidity
  console.log("Adding liquidity to Uniswap...");
  const tx = await ROUTER.connect(impersonatedSigner).addLiquidityETH(
    DAIAddress,
    amountTokenDesired,
    0,
    0,
    impersonatedSigner.address,
    deadline,
    { value: amountETHDesired }
  );
  await tx.wait();

  console.log("addLiquidityETH executed at:", tx.hash);


  // Balance after adding liquidity
  const daiBalanceAfter = await DAI.balanceOf(impersonatedSigner.address);
  const ethBalanceAfter = await impersonatedSigner.provider.getBalance(impersonatedSigner.address);

  console.log("DAI Balance After:", ethers.formatUnits(daiBalanceAfter, 18));
  console.log("ETH Balance After:", ethers.formatUnits(ethBalanceAfter, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});