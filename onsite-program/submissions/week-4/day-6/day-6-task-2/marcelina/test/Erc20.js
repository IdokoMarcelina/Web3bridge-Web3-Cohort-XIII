import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20 Token", function () {
  async function deployERC20() {
    const [owner, addr1, addr2, addr3] = await hre.ethers.getSigners();

    const name = "Test Token";
    const symbol = "TEST";
    const decimals = 18;

    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const token = await ERC20.deploy(name, symbol, decimals);
    await token.waitForDeployment();

    return { token, owner, addr1, addr2, addr3, name, symbol, decimals };
  }

  describe("Deployment", function () {
    it("Should set the correct name, symbol, and decimals", async function () {
      const { token, name, symbol, decimals } = await loadFixture(deployERC20);

      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
      expect(await token.decimals()).to.equal(decimals);
    });

    it("Should have zero initial total supply", async function () {
      const { token } = await loadFixture(deployERC20);

      expect(await token.totalSupply()).to.equal(0);
    });

    it("Should have zero balance for all addresses initially", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);

      expect(await token.balanceOf(owner.address)).to.equal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to specified address", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);

      await token.mint(addr1.address, mintAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
    });

    it("Should emit Transfer event when minting", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("50", 18);

      await expect(token.mint(addr1.address, mintAmount))
        .to.emit(token, "Transfer")
        .withArgs(hre.ethers.ZeroAddress, addr1.address, mintAmount);
    });

    it("Should mint multiple times correctly", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const firstMint = hre.ethers.parseUnits("100", 18);
      const secondMint = hre.ethers.parseUnits("50", 18);

      await token.mint(addr1.address, firstMint);
      await token.mint(addr1.address, secondMint);

      expect(await token.balanceOf(addr1.address)).to.equal(firstMint + secondMint);
      expect(await token.totalSupply()).to.equal(firstMint + secondMint);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const transferAmount = hre.ethers.parseUnits("50", 18);

      await token.mint(owner.address, mintAmount);
      await token.transfer(addr1.address, transferAmount);

      expect(await token.balanceOf(owner.address)).to.equal(mintAmount - transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const transferAmount = hre.ethers.parseUnits("50", 18);

      await token.mint(owner.address, mintAmount);

      await expect(token.transfer(addr1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should fail when sender has insufficient balance", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const transferAmount = hre.ethers.parseUnits("50", 18);

      await expect(token.transfer(addr1.address, transferAmount))
        .to.be.reverted;
    });

    it("Should return true on successful transfer", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const transferAmount = hre.ethers.parseUnits("50", 18);

      await token.mint(owner.address, mintAmount);
      
      expect(await token.transfer.staticCall(addr1.address, transferAmount)).to.equal(true);
    });
  });

  describe("Approval", function () {
    it("Should approve spender for specified amount", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const approveAmount = hre.ethers.parseUnits("100", 18);

      await token.approve(addr1.address, approveAmount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("Should emit Approval event", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const approveAmount = hre.ethers.parseUnits("100", 18);

      await expect(token.approve(addr1.address, approveAmount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);
    });

    it("Should return true on successful approval", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const approveAmount = hre.ethers.parseUnits("100", 18);

      expect(await token.approve.staticCall(addr1.address, approveAmount)).to.equal(true);
    });

    it("Should overwrite previous approval", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);
      const firstApproval = hre.ethers.parseUnits("100", 18);
      const secondApproval = hre.ethers.parseUnits("200", 18);

      await token.approve(addr1.address, firstApproval);
      await token.approve(addr1.address, secondApproval);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(secondApproval);
    });
  });

  describe("TransferFrom", function () {
    it("Should transfer tokens on behalf of owner when approved", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const approveAmount = hre.ethers.parseUnits("50", 18);
      const transferAmount = hre.ethers.parseUnits("30", 18);

      await token.mint(owner.address, mintAmount);
      await token.approve(addr1.address, approveAmount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      expect(await token.balanceOf(owner.address)).to.equal(mintAmount - transferAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const approveAmount = hre.ethers.parseUnits("50", 18);
      const transferAmount = hre.ethers.parseUnits("30", 18);

      await token.mint(owner.address, mintAmount);
      await token.approve(addr1.address, approveAmount);

      await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr2.address, transferAmount);
    });

    it("Should fail when allowance is insufficient", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const approveAmount = hre.ethers.parseUnits("30", 18);
      const transferAmount = hre.ethers.parseUnits("50", 18);

      await token.mint(owner.address, mintAmount);
      await token.approve(addr1.address, approveAmount);

      await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
        .to.be.reverted;
    });

    it("Should fail when sender has insufficient balance", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployERC20);
      const approveAmount = hre.ethers.parseUnits("100", 18);
      const transferAmount = hre.ethers.parseUnits("50", 18);

      await token.approve(addr1.address, approveAmount);

      await expect(token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
        .to.be.reverted;
    });

    it("Should return true on successful transferFrom", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const approveAmount = hre.ethers.parseUnits("50", 18);
      const transferAmount = hre.ethers.parseUnits("30", 18);

      await token.mint(owner.address, mintAmount);
      await token.approve(addr1.address, approveAmount);

      expect(await token.connect(addr1).transferFrom.staticCall(owner.address, addr2.address, transferAmount))
        .to.equal(true);
    });
  });

  describe("Burning", function () {
    it("Should burn tokens from specified address", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const burnAmount = hre.ethers.parseUnits("30", 18);

      await token.mint(addr1.address, mintAmount);
      await token.burn(addr1.address, burnAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount - burnAmount);
      expect(await token.totalSupply()).to.equal(mintAmount - burnAmount);
    });

    it("Should emit Transfer event when burning", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);
      const burnAmount = hre.ethers.parseUnits("30", 18);

      await token.mint(addr1.address, mintAmount);

      await expect(token.burn(addr1.address, burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(addr1.address, hre.ethers.ZeroAddress, burnAmount);
    });

    it("Should fail when burning more than balance", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("50", 18);
      const burnAmount = hre.ethers.parseUnits("100", 18);

      await token.mint(addr1.address, mintAmount);

      await expect(token.burn(addr1.address, burnAmount))
        .to.be.reverted;
    });

    it("Should burn entire balance correctly", async function () {
      const { token, addr1 } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);

      await token.mint(addr1.address, mintAmount);
      await token.burn(addr1.address, mintAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(0);
      expect(await token.totalSupply()).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);

      await expect(token.transfer(addr1.address, 0))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
      
      expect(await token.balanceOf(owner.address)).to.equal(0);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should handle zero amount approvals", async function () {
      const { token, owner, addr1 } = await loadFixture(deployERC20);

      await expect(token.approve(addr1.address, 0))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, 0);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should handle self transfers", async function () {
      const { token, owner } = await loadFixture(deployERC20);
      const mintAmount = hre.ethers.parseUnits("100", 18);

      await token.mint(owner.address, mintAmount);
      await token.transfer(owner.address, mintAmount);

      expect(await token.balanceOf(owner.address)).to.equal(mintAmount);
    });
  });
});