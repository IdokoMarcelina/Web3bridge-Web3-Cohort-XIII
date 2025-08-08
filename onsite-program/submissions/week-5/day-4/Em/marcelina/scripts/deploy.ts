import { ethers, run } from "hardhat";

async function main() {
  const owners = [
    "0xAbc1234567890123456789012345678901234567",
    "0xDef9876543210987654321098765432109876543",
    "0x1234567890123456789012345678901234567890"
  ];
  const requiredConfirmations = 2;

  const MultiSig = await ethers.getContractFactory("MultiSig");
  const multiSig = await MultiSig.deploy(owners, requiredConfirmations);

  await multiSig.waitForDeployment();
  const address = await multiSig.getAddress();


  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log("🔍 Verifying...");
  await run("verify:verify", {
    address,
    constructorArguments: [owners, requiredConfirmations],
  });

  console.log("🎉 Verified successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
