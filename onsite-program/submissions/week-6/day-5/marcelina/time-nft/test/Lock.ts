import { expect } from "chai";
import { ethers } from "hardhat";
import { SVGTimeNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SVGTimeNFT", function () {
  let nft: SVGTimeNFT;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const SVGTimeNFT = await ethers.getContractFactory("SVGTimeNFT");
    nft = await SVGTimeNFT.deploy();
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nft.name()).to.equal("SVG Time NFT");
      expect(await nft.symbol()).to.equal("SVGTIME");
    });
  });

  describe("Minting", function () {
    it("Should mint NFT to specified address", async function () {
      await nft.mint(addr1.address);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should only allow owner to mint", async function () {
      await expect(nft.connect(addr1).mint(addr1.address))
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("SVG Generation", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address);
    });

    it("Should generate tokenURI with valid base64 encoded JSON", async function () {
      const tokenURI = await nft.tokenURI(0);
      
      expect(tokenURI).to.include("data:application/json;base64,");
      
      const base64Data = tokenURI.split(',')[1];
      const jsonData = Buffer.from(base64Data, 'base64').toString();
      const metadata = JSON.parse(jsonData);
      
      expect(metadata.name).to.equal("Time NFT #0");
      expect(metadata.description).to.include("blockchain time");
      expect(metadata.image).to.include("data:image/svg+xml;base64,");
    });

    it("Should generate SVG with current time", async function () {
      const tokenURI = await nft.tokenURI(0);
      
      const base64Data = tokenURI.split(',')[1];
      const jsonData = Buffer.from(base64Data, 'base64').toString();
      const metadata = JSON.parse(jsonData);
      
      const svgBase64 = metadata.image.split(',')[1];
      const svgContent = Buffer.from(svgBase64, 'base64').toString();
      
      expect(svgContent).to.include('<svg');
      expect(svgContent).to.include('Blockchain Time');
      expect(svgContent).to.include('Block:');
      expect(svgContent).to.include('Timestamp:');
    });

    it("Should return current blockchain time", async function () {
      const currentTime = await nft.getCurrentTime();
      
      expect(currentTime.length).to.equal(6);
      
      expect(Number(currentTime[0])).to.be.greaterThan(2023);
      
      expect(Number(currentTime[1])).to.be.within(1, 12);
      
      expect(Number(currentTime[2])).to.be.within(1, 31);
      
      expect(Number(currentTime[3])).to.be.within(0, 23);
      
      expect(Number(currentTime[4])).to.be.within(0, 59);
      
      expect(Number(currentTime[5])).to.be.within(0, 59);
    });

    it("Should generate different timestamps when time passes", async function () {
      const tokenURI1 = await nft.tokenURI(0);
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      
      const tokenURI2 = await nft.tokenURI(0);
      
      expect(tokenURI1).to.not.equal(tokenURI2);
    });
  });

  describe("Edge Cases", function () {
    it("Should revert for non-existent token", async function () {
      await expect(nft.tokenURI(999))
        .to.be.revertedWith("Token does not exist");
    });
  });
});