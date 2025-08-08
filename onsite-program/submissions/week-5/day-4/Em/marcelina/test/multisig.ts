import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Contract, Signer } from "ethers";

describe("MultiSig", function () {
  async function deployMultiSigFixture() {
    const [owner1, owner2, owner3, otherAccount] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredConfirmations = 2;

    const MultiSig = await ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSig.deploy(owners, requiredConfirmations);
    await multiSig.waitForDeployment();

    return {
      multiSig,
      owners,
      requiredConfirmations,
      owner1,
      owner2,
      owner3,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owners", async function () {
      const { multiSig, owners, owner1, owner2, owner3 } = await loadFixture(
        deployMultiSigFixture
      );

      expect(await multiSig.owners(0)).to.equal(owners[0]);
      expect(await multiSig.owners(1)).to.equal(owners[1]);
      expect(await multiSig.owners(2)).to.equal(owners[2]);

      expect(await multiSig.isOwner(owner1.address)).to.be.true;
      expect(await multiSig.isOwner(owner2.address)).to.be.true;
      expect(await multiSig.isOwner(owner3.address)).to.be.true;
    });

    it("Should set the right required confirmations", async function () {
      const { multiSig, requiredConfirmations } = await loadFixture(
        deployMultiSigFixture
      );

      expect(await multiSig.required()).to.equal(requiredConfirmations);
    });
  });

  describe("Transaction Management", function () {
    it("Should allow owner to submit transaction", async function () {
      const { multiSig, owner1, otherAccount } = await loadFixture(
        deployMultiSigFixture
      );

      const destination = otherAccount.address;
      const value = ethers.parseEther("1");
      const data = "0x";

      const tx = await multiSig
        .connect(owner1)
        .submitTransaction(destination, value, data);
      await expect(tx).to.emit(multiSig, "TransactionSubmitted");
    });

    it("Should confirm and execute transaction when required confirmations met", async function () {
      const { multiSig, owner1, owner2, otherAccount } = await loadFixture(
        deployMultiSigFixture
      );

      await owner1.sendTransaction({
        to: await multiSig.getAddress(),
        value: ethers.parseEther("5"),
      });

      const destination = otherAccount.address;
      const value = ethers.parseEther("1");
      const data = "0x";

      await multiSig
        .connect(owner1)
        .submitTransaction(destination, value, data);

      const confirmTx = await multiSig
        .connect(owner2)
        .confirmTransaction(0);

      await expect(confirmTx).to.emit(multiSig, "TransactionExecuted");
    });
  });

  describe("Storing and Transferring Ether", function () {
    it("Should store and transfer ether correctly", async function () {
      const { multiSig, owner1, owner2 } = await loadFixture(
        deployMultiSigFixture
      );

      const oneEther = ethers.parseEther("1");

      await owner1.sendTransaction({
        to: await multiSig.getAddress(),
        value: oneEther,
      });

      const balance = await ethers.provider.getBalance(
        await multiSig.getAddress()
      );
      expect(balance).to.equal(oneEther);

      const balanceBefore = await ethers.provider.getBalance(owner2.address);

      await multiSig
        .connect(owner1)
        .submitTransaction(owner2.address, oneEther, "0x");

      await multiSig.connect(owner2).confirmTransaction(0);

      const finalBalance = await ethers.provider.getBalance(owner2.address);
      const contractBalance = await ethers.provider.getBalance(
        await multiSig.getAddress()
      );

      expect(contractBalance).to.equal(0);
      expect(finalBalance).to.be.greaterThan(balanceBefore); 
    });
  });

  describe("Storing and Transferring ERC20 tokens", function () {
    it("Should store and transfer ERC20 tokens", async function () {
      const { multiSig, owner1, owner2 } = await loadFixture(
        deployMultiSigFixture
      );

      const EIP20 = await ethers.getContractFactory("EIP20"); // make sure this is your token
      const initialSupply = 10000;
      const token = await EIP20.deploy(initialSupply, "MyToken", 1, "MT");
      await token.waitForDeployment();

      await token.transfer(await multiSig.getAddress(), initialSupply);
      const storedBalance = await token.balanceOf(await multiSig.getAddress());
      expect(storedBalance).to.equal(initialSupply);

      const iface = new ethers.Interface([
        "function transfer(address to, uint amount)",
      ]);
      const data = iface.encodeFunctionData("transfer", [
        owner2.address,
        initialSupply,
      ]);

      await multiSig
        .connect(owner1)
        .submitTransaction(token.target, 0, data);
      await multiSig.connect(owner2).confirmTransaction(0);

      const finalContractBalance = await token.balanceOf(
        await multiSig.getAddress()
      );
      const finalRecipientBalance = await token.balanceOf(owner2.address);

      expect(finalContractBalance).to.equal(0);
      expect(finalRecipientBalance).to.equal(initialSupply);
    });

  

  });

});
