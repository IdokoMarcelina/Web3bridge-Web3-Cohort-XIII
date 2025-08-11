import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
// import hre, {ethers} from "hardhat";
import {ethers} from "ethers";


describe("PiggyBank System", function () {

  async function deployFixture() {
    const [owner, user, factoryAdmin, other] = await hre.ethers.getSigners();

    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const token = await MockToken.deploy();
    await token.waitForDeployment();

    const PiggyBank = await hre.ethers.getContractFactory("PiggyBank");
    const piggyBank = await PiggyBank.deploy(user.address, factoryAdmin.address);
    await piggyBank.waitForDeployment();

    return { piggyBank, token, owner, user, factoryAdmin, other };
  }

  it("should create a savings account", async function () {
    const { piggyBank, user, token } = await deployFixture();

    await expect(
      piggyBank.connect(user).createSavingsAccount(60 * 60 * 24, token.target)
    )
      .to.emit(piggyBank, "SavingsAccountCreated")
      .withArgs(0, 60 * 60 * 24, token.target);

    const info = await piggyBank.getAccountInfo(0);
    expect(info.lockPeriod).to.equal(60 * 60 * 24);
    expect(info.tokenAddress).to.equal(token.target);
  });

  it("should deposit ETH into savings account", async function () {
    const { piggyBank, user } = await deployFixture();

    await piggyBank.connect(user).createSavingsAccount(3600, hre.ethers.ZeroAddress);

    await expect(
      piggyBank.connect(user).deposit(0, hre.ethers.parseEther("1"), { value: hre.ethers.parseEther("1") })
    )
      .to.emit(piggyBank, "Deposit")
      .withArgs(0, hre.ethers.parseEther("1"));

    const balance = await piggyBank.getAccountBalance(0);
    expect(balance).to.equal(hre.ethers.parseEther("1"));
  });

  it("should deposit ERC20 tokens into savings account", async function () {
    const { piggyBank, token, user } = await deployFixture();

    await piggyBank.connect(user).createSavingsAccount(3600, token.target);

    await token.mint(user.address, hre.ethers.parseEther("100"));
    await token.connect(user).approve(piggyBank.target, hre.ethers.parseEther("10"));

    await expect(
      piggyBank.connect(user).deposit(0, hre.ethers.parseEther("10"))
    )
      .to.emit(piggyBank, "Deposit")
      .withArgs(0, hre.ethers.parseEther("10"));

    const balance = await piggyBank.getAccountBalance(0);
    expect(balance).to.equal(hre.ethers.parseEther("10"));
  });

  it("should allow early ETH withdrawal with fee", async function () {
    const { piggyBank, user, factoryAdmin } = await deployFixture();

    await piggyBank.connect(user).createSavingsAccount(3600, hre.ethers.ZeroAddress);

    await piggyBank.connect(user).deposit(0, hre.ethers.parseEther("1"), { value: hre.ethers.parseEther("1") });

    const userBalBefore = await hre.ethers.provider.getBalance(user.address);
    const factoryBalBefore = await hre.ethers.provider.getBalance(factoryAdmin.address);

    await expect(
      piggyBank.connect(user).withdraw(0, hre.ethers.parseEther("1"))
    )
      .to.emit(piggyBank, "Withdrawal")
      .withArgs(0, hre.ethers.parseEther("1"), true, hre.ethers.parseEther("0.03"));

    const factoryBalAfter = await hre.ethers.provider.getBalance(factoryAdmin.address);
    expect(factoryBalAfter - factoryBalBefore).to.equal(hre.ethers.parseEther("0.03"));

    const balance = await piggyBank.getAccountBalance(0);
    expect(balance).to.equal(0);
  });

  it("should allow factory admin to perform emergency withdraw", async function () {
    const { piggyBank, user, factoryAdmin, other } = await deployFixture();

    await piggyBank.connect(user).createSavingsAccount(3600, hre.ethers.ZeroAddress);

    await piggyBank.connect(user).deposit(0, hre.ethers.parseEther("2"), { value: hre.ethers.parseEther("2") });

    await piggyBank.connect(factoryAdmin).emergencyWithdraw(0, other.address);

    const bal = await hre.ethers.provider.getBalance(other.address);
    expect(bal).to.be.gt(0);
  });


  

});
