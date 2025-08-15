import { ethers } from "hardhat";

async function main() {
  const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
  
  if (contractAddress === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("Please update the contractAddress in the script!");
    process.exit(1);
  }
  
  const [signer] = await ethers.getSigners();
  console.log("Testing SVGTimeNFT at:", contractAddress);
  console.log("Using signer:", signer.address);
  
  const contract = new ethers.Contract(
    contractAddress,
    [
      "function getCurrentTime() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
      "function tokenURI(uint256 tokenId) external view returns (string memory)",
      "function name() external view returns (string memory)",
      "function symbol() external view returns (string memory)",
      "function balanceOf(address owner) external view returns (uint256)",
      "function ownerOf(uint256 tokenId) external view returns (address)"
    ],
    signer
  );
  
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`Contract: ${name} (${symbol})`);
    
    console.log("\n=== Current Blockchain Time ===");
    const currentTime = await contract.getCurrentTime();
    console.log("Current blockchain time:", {
      year: currentTime[0].toString(),
      month: currentTime[1].toString(), 
      day: currentTime[2].toString(),
      hour: currentTime[3].toString(),
      minute: currentTime[4].toString(),
      second: currentTime[5].toString()
    });
    
    try {
      const owner = await contract.ownerOf(0);
      console.log("Token #0 owner:", owner);
      
      console.log("\n=== Generating SVG for Token #0 ===");
      const tokenURI = await contract.tokenURI(0);
      
      const base64Data = tokenURI.split(',')[1];
      const jsonData = Buffer.from(base64Data, 'base64').toString();
      const metadata = JSON.parse(jsonData);
      
      console.log("NFT Metadata:");
      console.log("Name:", metadata.name);
      console.log("Description:", metadata.description);
      
      const svgBase64 = metadata.image.split(',')[1];
      const svgContent = Buffer.from(svgBase64, 'base64').toString();
      
      console.log("\n=== Generated SVG Content ===");
      console.log(svgContent);
      
      const fs = require('fs');
      fs.writeFileSync('generated-nft.svg', svgContent);
      console.log("\n SVG saved to generated-nft.svg - you can open this in a browser!");
      
    } catch (error: any) {
      if (error.message.includes("Token does not exist")) {
        console.log(" Token #0 doesn't exist yet. Deploy and mint first!");
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error("Error testing contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });