import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Ludo contract...");

  // Get the ContractFactory and Signers here
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Deploy the Ludo contract
  const Ludo = await ethers.getContractFactory("Ludo");
  const ludo = await Ludo.deploy();

  console.log("Waiting for deployment...");
  await ludo.waitForDeployment();

  const ludoAddress = await ludo.getAddress();
  console.log("Ludo contract deployed to:", ludoAddress);

  // Verify deployment
  const gameInfo = await ludo.getGameInfo();
  console.log("Game initialized. Active:", gameInfo.isActive);
  console.log("Total players:", gameInfo.totalPlayers.toString());

  return ludo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
