import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const USDCHolder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    await helpers.impersonateAccount(USDCHolder);
    await helpers.setBalance(USDCHolder, ethers.parseEther("100"));
    const signer = await ethers.getSigner(USDCHolder);
    console.log("Impersonating:", signer.address);

    const erc20 = (a: string) => ethers.getContractAt("IERC20", a);
    const USDCc = await erc20(USDC);
    const DAIc = await erc20(DAI);
    const router = await ethers.getContractAt("IUniswapV2Router02", ROUTER);

    const factoryAddr = await router.factory();
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddr);
    const pairAddr = await factory.getPair(DAI, WETH);
    const LP = await erc20(pairAddr);
    console.log("DAI-WETH Pair:", pairAddr);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    const usdcToSwap = ethers.parseUnits("2000", 6);
    await USDCc.connect(signer).approve(ROUTER, ethers.MaxUint256);
    const swapTx = await router.connect(signer).swapExactTokensForTokens(
        usdcToSwap,
        0,
        [USDC, DAI],
        signer.address,
        deadline
    );
    await swapTx.wait();
    console.log("Swapped USDC→DAI:", swapTx.hash);

    const daiDesired = ethers.parseUnits("1000", 18);
    const ethDesired = ethers.parseEther("0.5");
    await DAIc.connect(signer).approve(ROUTER, ethers.MaxUint256);

    const addTx = await router.connect(signer).addLiquidityETH(
        DAI,
        daiDesired,
        0,
        0,
        signer.address,
        deadline,
        { value: ethDesired }
    );
    await addTx.wait();
    console.log("addLiquidityETH tx:", addTx.hash);

    const lpBal = await LP.balanceOf(signer.address);
    console.log("LP After Add:", lpBal.toString());

    await LP.connect(signer).approve(ROUTER, lpBal);
    const rmTx = await router.connect(signer).removeLiquidityETHSupportingFeeOnTransferTokens(
        DAI,
        lpBal,
        0,
        0,
        signer.address,
        deadline
    );
    await rmTx.wait();
    console.log("removeLiquidityETHSupportingFeeOnTransferTokens tx:", rmTx.hash);

    const daiBal = await DAIc.balanceOf(signer.address);
    const ethBal = await signer.provider.getBalance(signer.address);
    const lpAfter = await LP.balanceOf(signer.address);

    console.log("DAI After:", ethers.formatUnits(daiBal, 18));
    console.log("ETH After:", ethers.formatUnits(ethBal, 18));
    console.log("LP After Removal:", lpAfter.toString());
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});