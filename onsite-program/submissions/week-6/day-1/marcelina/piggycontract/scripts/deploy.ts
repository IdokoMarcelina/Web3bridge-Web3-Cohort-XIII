const hre = require("hardhat");

async function main() {
  console.log("Deploying Piggy Bank Factory...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const PiggyBankFactory = await hre.ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();
  await factory.waitForDeployment();

  console.log("PiggyBankFactory deployed to:", await factory.getAddress());

  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();

  console.log("MockToken deployed to:", await mockToken.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("Factory Address:", await factory.getAddress());
  console.log("MockToken Address:", await mockToken.getAddress());
  console.log("Factory Admin:", deployer.address);
  
  return {
    factory: factory,
    mockToken: mockToken,
    deployer: deployer
  };
}


if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = main;