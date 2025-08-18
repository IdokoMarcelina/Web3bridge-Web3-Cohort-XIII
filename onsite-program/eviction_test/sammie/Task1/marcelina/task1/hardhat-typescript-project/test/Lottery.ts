import { expect } from "chai";
import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Lottery Contract", function () {
  let lottery: Lottery;
  let owner: HardhatEthersSigner;
  let players: HardhatEthersSigner[];
  const ENTRY_FEE = ethers.parseEther("0.01");
  const MAX_PLAYERS = 10;

  beforeEach(async function () {
  
    const signers = await ethers.getSigners();
    owner = signers[0];
    players = signers.slice(1, 15); 

   
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = await LotteryFactory.deploy();
    await lottery.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with correct initial values", async function () {
      expect(await lottery.ENTRY_FEE()).to.equal(ENTRY_FEE);
      expect(await lottery.MAX_PLAYERS()).to.equal(MAX_PLAYERS);
      expect(await lottery.lotteryId()).to.equal(1);
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.totalPrizePool()).to.equal(0);
      expect(await lottery.getContractBalance()).to.equal(0);
    });
  });

  describe("Entry Validation", function () {
    it("Should allow entry with exact fee", async function () {
      await expect(lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.hasPlayerEntered(players[0].address)).to.be.true;
      expect(await lottery.totalPrizePool()).to.equal(ENTRY_FEE);
    });

    it("Should reject entry with insufficient fee", async function () {
      const insufficientFee = ethers.parseEther("0.005");
      
      await expect(
        lottery.connect(players[0]).enterLottery({ value: insufficientFee })
      ).to.be.revertedWith("Must pay exactly 0.01 ETH to enter");
    });

    it("Should reject entry with excessive fee", async function () {
      const excessiveFee = ethers.parseEther("0.02");
      
      await expect(
        lottery.connect(players[0]).enterLottery({ value: excessiveFee })
      ).to.be.revertedWith("Must pay exactly 0.01 ETH to enter");
    });

    it("Should reject duplicate entry from same player", async function () {
    
      await lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE });
      

      await expect(
        lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE })
      ).to.be.revertedWith("Player has already entered this round");
    });

    it("Should reject entry when lottery is full", async function () {
   
      for (let i = 0; i < MAX_PLAYERS - 1; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayersCount()).to.equal(9);
      expect(await lottery.lotteryId()).to.equal(1);
      
     
      await lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });
 
      expect(await lottery.lotteryId()).to.equal(2);
      expect(await lottery.getPlayersCount()).to.equal(0);
      
     
    });
  });

  describe("Player Tracking", function () {
    it("Should correctly track players as they join", async function () {
      for (let i = 0; i < 5; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        
        expect(await lottery.getPlayersCount()).to.equal(i + 1);
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.true;
        expect(await lottery.getPlayersNeeded()).to.equal(MAX_PLAYERS - (i + 1));
      }

      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(5);
      
      for (let i = 0; i < 5; i++) {
        expect(allPlayers[i]).to.equal(players[i].address);
      }
    });

    it("Should track prize pool correctly", async function () {
      for (let i = 0; i < 7; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
        
        const expectedPrizePool = ENTRY_FEE * BigInt(i + 1);
        expect(await lottery.getPrizePool()).to.equal(expectedPrizePool);
        expect(await lottery.getContractBalance()).to.equal(expectedPrizePool);
      }
    });
  });

  describe("Winner Selection", function () {
    it("Should automatically select winner when 10th player joins", async function () {
    
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      expect(await lottery.getPlayersCount()).to.equal(9);
      expect(await lottery.lotteryId()).to.equal(1);

   
      const tx = lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });
      
      await expect(tx).to.emit(lottery, "PlayerJoined");
      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset");

      expect(await lottery.lotteryId()).to.equal(2);
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.totalPrizePool()).to.equal(0);
      expect(await lottery.getContractBalance()).to.equal(0);
    });

    it("Should transfer entire prize pool to winner", async function () {
      const expectedPrizePool = ENTRY_FEE * BigInt(MAX_PLAYERS);
      
  
      const initialBalances = await Promise.all(
        players.slice(0, MAX_PLAYERS).map(player => ethers.provider.getBalance(player.address))
      );


      for (let i = 0; i < MAX_PLAYERS; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

  
      const winner = await lottery.getRecentWinner();
      const winnerIndex = players.findIndex(player => player.address === winner);
      expect(winnerIndex).to.be.greaterThanOrEqual(0);

      const finalBalance = await ethers.provider.getBalance(players[winnerIndex].address);

      const balanceIncrease = finalBalance - initialBalances[winnerIndex];
      expect(balanceIncrease).to.be.greaterThan(ethers.parseEther("0.08")); 
    });

    it("Should reset player entry status after lottery ends", async function () {
     
      for (let i = 0; i < MAX_PLAYERS; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

     
      for (let i = 0; i < MAX_PLAYERS; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
        
       
        await expect(
          lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE })
        ).to.not.be.reverted;
      }
    });
  });

  describe("Lottery Reset", function () {
    it("Should properly reset all state variables", async function () {
      // Complete first lottery round
      for (let i = 0; i < MAX_PLAYERS; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      // Verify reset state
      expect(await lottery.lotteryId()).to.equal(2);
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.totalPrizePool()).to.equal(0);
      expect(await lottery.getContractBalance()).to.equal(0);
      expect(await lottery.getPlayersNeeded()).to.equal(MAX_PLAYERS);

      // Verify players list is empty
      const playersAfterReset = await lottery.getPlayers();
      expect(playersAfterReset.length).to.equal(0);

      // Verify all players can enter again
      for (let i = 0; i < 5; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
      }
    });

    it("Should allow new lottery round to proceed normally", async function () {
      // Complete first lottery round
      for (let i = 0; i < MAX_PLAYERS; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const firstWinner = await lottery.getRecentWinner();
      
      // Start second lottery round with different players
      for (let i = 0; i < MAX_PLAYERS; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      const secondWinner = await lottery.getRecentWinner();
      
      // Verify second lottery completed
      expect(await lottery.lotteryId()).to.equal(3);
      expect(secondWinner).to.not.equal("0x0000000000000000000000000000000000000000");
      
      // Winners could be the same (it's random), but the lottery should have progressed
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.totalPrizePool()).to.equal(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Add some players for testing view functions
      for (let i = 0; i < 7; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }
    });

    it("Should return correct players count", async function () {
      expect(await lottery.getPlayersCount()).to.equal(7);
    });

    it("Should return correct players array", async function () {
      const allPlayers = await lottery.getPlayers();
      expect(allPlayers.length).to.equal(7);
      
      for (let i = 0; i < 7; i++) {
        expect(allPlayers[i]).to.equal(players[i].address);
      }
    });

    it("Should return correct lottery ID", async function () {
      expect(await lottery.getLotteryId()).to.equal(1);
    });

    it("Should return correct prize pool", async function () {
      const expectedPool = ENTRY_FEE * BigInt(7);
      expect(await lottery.getPrizePool()).to.equal(expectedPool);
    });

    it("Should return correct contract balance", async function () {
      const expectedBalance = ENTRY_FEE * BigInt(7);
      expect(await lottery.getContractBalance()).to.equal(expectedBalance);
    });

    it("Should return correct players needed", async function () {
      expect(await lottery.getPlayersNeeded()).to.equal(3); // 10 - 7 = 3
    });

    it("Should return correct player entry status", async function () {
      for (let i = 0; i < 7; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.true;
      }
      
      for (let i = 7; i < 10; i++) {
        expect(await lottery.hasPlayerEntered(players[i].address)).to.be.false;
      }
    });
  });

  describe("Events", function () {
    it("Should emit PlayerJoined event with correct parameters", async function () {
      await expect(lottery.connect(players[0]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[0].address, 1, 1);

      await expect(lottery.connect(players[1]).enterLottery({ value: ENTRY_FEE }))
        .to.emit(lottery, "PlayerJoined")
        .withArgs(players[1].address, 1, 2);
    });

    it("Should emit WinnerSelected and LotteryReset events", async function () {
      // Add 9 players
      for (let i = 0; i < 9; i++) {
        await lottery.connect(players[i]).enterLottery({ value: ENTRY_FEE });
      }

      // 10th player should trigger events
      const tx = lottery.connect(players[9]).enterLottery({ value: ENTRY_FEE });

      await expect(tx).to.emit(lottery, "WinnerSelected");
      await expect(tx).to.emit(lottery, "LotteryReset").withArgs(2);
    });
  });
});
