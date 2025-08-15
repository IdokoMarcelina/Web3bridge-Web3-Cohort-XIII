import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SVGTimeNFT to Lisk Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const SVGTimeNFT = await ethers.getContractFactory("SVGTimeNFT");
  const nft = await SVGTimeNFT.deploy();
  
  await nft.waitForDeployment();
  
  const contractAddress = await nft.getAddress();
  console.log("SVGTimeNFT deployed to:", contractAddress);
  
  console.log("Minting test NFT...");
  const mintTx = await nft.mint(deployer.address);
  await mintTx.wait();
  console.log("Minted NFT #0 to:", deployer.address);
  
  const tokenURI = await nft.tokenURI(0);
  console.log("Token URI generated successfully (length):", tokenURI.length);
  
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Lisk Sepolia");
  console.log("Block Explorer: https://sepolia-blockscout.lisk.com");
  console.log("View Contract:", `https://sepolia-blockscout.lisk.com/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });