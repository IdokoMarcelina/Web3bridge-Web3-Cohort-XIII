import { ethers } from "hardhat";

async function main() {
  console.log(" Deploying Lottery Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  console.log(" Deploying Lottery...");
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();

  const lotteryAddress = await lottery.getAddress();
  console.log(" Lottery deployed to:", lotteryAddress);

  console.log("\n📋 Contract Configuration:");
  console.log(`Entry Fee: ${ethers.formatEther(await lottery.ENTRY_FEE())} ETH`);
  console.log(`Max Players: ${await lottery.MAX_PLAYERS()}`);
  console.log(`Initial Lottery ID: ${await lottery.getLotteryId()}`);
  console.log(`Initial Players Count: ${await lottery.getPlayersCount()}`);

  console.log("\n Deployment Summary:");
  console.log("=" + "=".repeat(50));
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Contract Address: ${lotteryAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Entry Fee: 0.01 ETH`);
  console.log(`Max Players per Round: 10`);
  console.log(`Auto Winner Selection: Enabled`);
  console.log(`Auto Reset: Enabled`);

  console.log("\n Next Steps:");
  console.log("1. Save the contract address for future reference");
  console.log("2. Verify the contract on Etherscan (if deploying to mainnet/testnet)");
  console.log("3. Test the contract with a few transactions");
  console.log("4. Share the contract address with users");

  console.log("\n Deployment completed successfully!");

  return lotteryAddress;
}

main()
  .then((address) => {
    console.log(`\n🔗 Contract deployed at: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(" Deployment failed:");
    console.error(error);
    process.exit(1);
  });
