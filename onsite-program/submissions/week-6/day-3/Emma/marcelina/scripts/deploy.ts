const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Token-Gated DAO...");
  
  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy DAOMembershipNFT
  const DAOMembershipNFT = await ethers.getContractFactory("DAOMembershipNFT");
  const membershipNFT = await DAOMembershipNFT.deploy();
  await membershipNFT.deployed();
  console.log("DAOMembershipNFT deployed to:", membershipNFT.address);
  
  // Deploy TokenGatedDAO
  const TokenGatedDAO = await ethers.getContractFactory("TokenGatedDAO");
  const dao = await TokenGatedDAO.deploy(membershipNFT.address);
  await dao.deployed();
  console.log("TokenGatedDAO deployed to:", dao.address);
  
  // Setup roles
  console.log("\nSetting up roles...");
  
  // Mint NFTs and assign roles
  const tokenId1 = await membershipNFT.mint(user1.address);
  await tokenId1.wait();
  console.log("Minted NFT with tokenId 1 to:", user1.address);
  
  const tokenId2 = await membershipNFT.mint(user2.address);
  await tokenId2.wait();
  console.log("Minted NFT with tokenId 2 to:", user2.address);
  
  // Grant roles
  const VOTER_ROLE = await membershipNFT.VOTER_ROLE();
  const PROPOSER_ROLE = await membershipNFT.PROPOSER_ROLE();
  
  // Grant voter role to user1
  await membershipNFT.grantRole(
    VOTER_ROLE,
    1,
    user1.address,
    0, // No expiration
    true, // Revocable
    "0x" // No additional data
  );
  console.log("Granted VOTER_ROLE to user1 for tokenId 1");
  
  // Grant proposer and voter role to user2
  await membershipNFT.grantRole(
    VOTER_ROLE,
    2,
    user2.address,
    0,
    true,
    "0x"
  );
  
  await membershipNFT.grantRole(
    PROPOSER_ROLE,
    2,
    user2.address,
    0,
    true,
    "0x"
  );
  console.log("Granted VOTER_ROLE and PROPOSER_ROLE to user2 for tokenId 2");
  
  console.log("\n=== Deployment Summary ===");
  console.log("DAOMembershipNFT:", membershipNFT.address);
  console.log("TokenGatedDAO:", dao.address);
  console.log("Deployer:", deployer.address);
  console.log("User1 (Voter):", user1.address);
  console.log("User2 (Proposer + Voter):", user2.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });