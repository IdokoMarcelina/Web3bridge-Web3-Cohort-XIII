import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOMembershipNFT, TokenGatedDAO } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TokenGatedDAO", function () {
  let membershipNFT: DAOMembershipNFT;
  let dao: TokenGatedDAO;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy DAOMembershipNFT
    const DAOMembershipNFTFactory = await ethers.getContractFactory("DAOMembershipNFT");
    membershipNFT = (await DAOMembershipNFTFactory.deploy()) as DAOMembershipNFT;
    await membershipNFT.waitForDeployment();

    // Deploy TokenGatedDAO
    const TokenGatedDAOFactory = await ethers.getContractFactory("TokenGatedDAO");
    dao = (await TokenGatedDAOFactory.deploy(membershipNFT.target)) as TokenGatedDAO;
    await dao.waitForDeployment();

    // Setup roles
    const VOTER_ROLE = await membershipNFT.VOTER_ROLE();
    const PROPOSER_ROLE = await membershipNFT.PROPOSER_ROLE();

    // Mint NFTs
    await membershipNFT.mint(user1.address);
    await membershipNFT.mint(user2.address);

    // Grant roles
    await membershipNFT.grantRole(VOTER_ROLE, 1, user1.address, 0, true, "0x");
    await membershipNFT.grantRole(VOTER_ROLE, 2, user2.address, 0, true, "0x");
    await membershipNFT.grantRole(PROPOSER_ROLE, 2, user2.address, 0, true, "0x");
  });

  describe("Role Management", function () {
    it("Should grant and check roles correctly", async function () {
      const VOTER_ROLE = await membershipNFT.VOTER_ROLE();

      expect(await membershipNFT.hasRole(VOTER_ROLE, 1, user1.address)).to.be.true;
      expect(await dao.checkRole(VOTER_ROLE, user1.address)).to.be.true;
      expect(await dao.checkRole(VOTER_ROLE, user3.address)).to.be.false;
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow users with PROPOSER_ROLE to create proposals", async function () {
      await expect(dao.connect(user2).createProposal("Test proposal"))
        .to.emit(dao, "ProposalCreated");
    });

    it("Should reject proposals from users without PROPOSER_ROLE", async function () {
      await expect(dao.connect(user1).createProposal("Test proposal"))
        .to.be.revertedWith("Not authorized to propose");
    });
  });

  describe("Voting", function () {
    it("Should allow users with VOTER_ROLE to vote", async function () {
      await dao.connect(user2).createProposal("Test proposal");

      await expect(dao.connect(user1).vote(1, true))
        .to.emit(dao, "VoteCast");
    });

    it("Should reject votes from users without VOTER_ROLE", async function () {
      await dao.connect(user2).createProposal("Test proposal");

      await expect(dao.connect(user3).vote(1, true))
        .to.be.revertedWith("Not authorized to vote");
    });

    it("Should prevent double voting", async function () {
      await dao.connect(user2).createProposal("Test proposal");
      await dao.connect(user1).vote(1, true);

      await expect(dao.connect(user1).vote(1, false))
        .to.be.revertedWith("Already voted");
    });
  });
});
