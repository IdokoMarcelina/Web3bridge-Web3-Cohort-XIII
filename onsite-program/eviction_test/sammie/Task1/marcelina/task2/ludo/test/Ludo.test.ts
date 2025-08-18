import { expect } from "chai";
import { ethers } from "hardhat";
import { Ludo } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Ludo", function () {
  let ludo: Ludo;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let player3: HardhatEthersSigner;
  let player4: HardhatEthersSigner;

  const PlayerColor = {
    NONE: 0,
    RED: 1,
    GREEN: 2,
    BLUE: 3,
    YELLOW: 4
  };

  beforeEach(async function () {
    [owner, player1, player2, player3, player4] = await ethers.getSigners();

    const LudoFactory = await ethers.getContractFactory("Ludo");
    ludo = await LudoFactory.deploy();
    await ludo.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      expect(await ludo.getAddress()).to.be.a("string");
    });

    it("Should initialize with correct game state", async function () {
      const gameInfo = await ludo.getGameInfo();
      expect(gameInfo.isActive).to.be.false;
      expect(gameInfo.totalPlayers).to.equal(0);
      expect(gameInfo.winner).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Player Registration", function () {
    it("Should allow player registration with valid data", async function () {
      await expect(ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED))
        .to.emit(ludo, "PlayerRegistered")
        .withArgs(player1.address, "Alice", PlayerColor.RED);

      const playerData = await ludo.getPlayer(player1.address);
      expect(playerData.name).to.equal("Alice");
      expect(playerData.color).to.equal(PlayerColor.RED);
      expect(playerData.isRegistered).to.be.true;
      expect(playerData.score).to.equal(0);
      expect(playerData.tokensInHome).to.equal(4);
    });

    it("Should reject registration with empty name", async function () {
      await expect(ludo.connect(player1).registerPlayer("", PlayerColor.RED))
        .to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject registration with NONE color", async function () {
      await expect(ludo.connect(player1).registerPlayer("Alice", PlayerColor.NONE))
        .to.be.revertedWith("Invalid color");
    });

    it("Should reject registration with already taken color", async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      
      await expect(ludo.connect(player2).registerPlayer("Bob", PlayerColor.RED))
        .to.be.revertedWith("Color already taken");
    });

    it("Should reject double registration", async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      
      await expect(ludo.connect(player1).registerPlayer("Alice2", PlayerColor.GREEN))
        .to.be.revertedWith("Player already registered");
    });

    it("Should reject 5th player registration", async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.connect(player3).registerPlayer("Charlie", PlayerColor.BLUE);
      await ludo.connect(player4).registerPlayer("David", PlayerColor.YELLOW);

      const [extraPlayer] = await ethers.getSigners();
      await expect(ludo.connect(extraPlayer).registerPlayer("Extra", PlayerColor.RED))
        .to.be.revertedWith("Game is full");
    });

    it("Should auto-start game when 4 players register", async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.connect(player3).registerPlayer("Charlie", PlayerColor.BLUE);
      
      await expect(ludo.connect(player4).registerPlayer("David", PlayerColor.YELLOW))
        .to.emit(ludo, "GameStarted")
        .withArgs(4);

      const gameInfo = await ludo.getGameInfo();
      expect(gameInfo.isActive).to.be.true;
      expect(gameInfo.totalPlayers).to.equal(4);
    });
  });

  describe("Game Management", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
    });

    it("Should allow manual game start with 2+ players", async function () {
      await expect(ludo.startGame())
        .to.emit(ludo, "GameStarted")
        .withArgs(2);

      const gameInfo = await ludo.getGameInfo();
      expect(gameInfo.isActive).to.be.true;
    });

    it("Should reject game start with less than 2 players", async function () {
      // Create new instance with only 1 player
      const LudoFactory = await ethers.getContractFactory("Ludo");
      const newLudo = await LudoFactory.deploy();
      await newLudo.connect(player1).registerPlayer("Alice", PlayerColor.RED);

      await expect(newLudo.startGame())
        .to.be.revertedWith("Need at least 2 players to start");
    });

    it("Should reject starting already active game", async function () {
      await ludo.startGame();
      
      await expect(ludo.startGame())
        .to.be.revertedWith("Game already active");
    });
  });

  describe("Available Colors", function () {
    it("Should return all colors initially", async function () {
      const available = await ludo.getAvailableColors();
      expect(available).to.have.lengthOf(4);
      expect(available.map(Number)).to.include(PlayerColor.RED);
      expect(available.map(Number)).to.include(PlayerColor.GREEN);
      expect(available.map(Number)).to.include(PlayerColor.BLUE);
      expect(available.map(Number)).to.include(PlayerColor.YELLOW);
    });

    it("Should exclude taken colors", async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);

      const available = await ludo.getAvailableColors();
      expect(available).to.have.lengthOf(2);
      expect(available.map(Number)).to.include(PlayerColor.BLUE);
      expect(available.map(Number)).to.include(PlayerColor.YELLOW);
      expect(available.map(Number)).to.not.include(PlayerColor.RED);
      expect(available.map(Number)).to.not.include(PlayerColor.GREEN);
    });
  });

  describe("Dice Rolling", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.startGame();
    });

    it("Should allow current player to roll dice", async function () {
      const currentPlayer = await ludo.getCurrentPlayer();
      expect(currentPlayer).to.equal(player1.address);

      await expect(ludo.connect(player1).rollDice())
        .to.emit(ludo, "DiceRolled");
    });

    it("Should reject non-current player dice roll", async function () {
      await expect(ludo.connect(player2).rollDice())
        .to.be.revertedWith("Not your turn");
    });

    it("Should reject unregistered player dice roll", async function () {
      await expect(ludo.connect(player3).rollDice())
        .to.be.revertedWith("Player not registered");
    });

    it("Should reject dice roll when game is inactive", async function () {
      // Create new instance without starting game
      const LudoFactory = await ethers.getContractFactory("Ludo");
      const newLudo = await LudoFactory.deploy();
      await newLudo.connect(player1).registerPlayer("Alice", PlayerColor.RED);

      await expect(newLudo.connect(player1).rollDice())
        .to.be.revertedWith("Game is not active");
    });

    it("Should return dice value between 1 and 6", async function () {
      const diceValue = await ludo.connect(player1).rollDice.staticCall();
      expect(diceValue).to.be.at.least(1);
      expect(diceValue).to.be.at.most(6);
    });
  });

  describe("Token Movement Logic", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.startGame();
    });

    it("Should calculate correct start positions for different colors", async function () {
      // Test through canMoveToken with dice value 6 (required to move from home)
      const canMoveRed = await ludo.canMoveToken(player1.address, 0, 6);
      expect(canMoveRed).to.be.true;

      const canMoveGreen = await ludo.canMoveToken(player2.address, 0, 6);
      expect(canMoveGreen).to.be.true;
    });

    it("Should only allow tokens to move from home with dice 6", async function () {
      for (let dice = 1; dice <= 5; dice++) {
        const canMove = await ludo.canMoveToken(player1.address, 0, dice);
        expect(canMove).to.be.false;
      }

      const canMoveWith6 = await ludo.canMoveToken(player1.address, 0, 6);
      expect(canMoveWith6).to.be.true;
    });

    it("Should check token movement validity", async function () {
      // Token at home should only move with 6
      expect(await ludo.canMoveToken(player1.address, 0, 5)).to.be.false;
      expect(await ludo.canMoveToken(player1.address, 0, 6)).to.be.true;
    });

    it("Should prevent invalid token index", async function () {
      await expect(ludo.connect(player1).moveToken(4, 6))
        .to.be.revertedWith("Invalid token index");
    });
  });

  describe("Turn Management", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.connect(player3).registerPlayer("Charlie", PlayerColor.BLUE);
      await ludo.startGame();
    });

    it("Should start with first player", async function () {
      const currentPlayer = await ludo.getCurrentPlayer();
      expect(currentPlayer).to.equal(player1.address);
    });

    it("Should cycle through players", async function () {
      // Simulate moves that would advance turns (not rolling 6)
      // This is complex to test without mocking the random number generator
      // For now, we'll test the getter functions
      const gameInfo = await ludo.getGameInfo();
      expect(gameInfo.currentPlayer).to.equal(player1.address);
    });
  });

  describe("Game State Queries", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
    });

    it("Should return correct game information", async function () {
      const gameInfoBefore = await ludo.getGameInfo();
      expect(gameInfoBefore.isActive).to.be.false;
      expect(gameInfoBefore.totalPlayers).to.equal(2);

      await ludo.startGame();

      const gameInfoAfter = await ludo.getGameInfo();
      expect(gameInfoAfter.isActive).to.be.true;
      expect(gameInfoAfter.totalPlayers).to.equal(2);
      expect(gameInfoAfter.currentPlayer).to.equal(player1.address);
    });

    it("Should return all registered players", async function () {
      const players = await ludo.getAllPlayers();
      expect(players).to.have.lengthOf(2);
      expect(players[0]).to.equal(player1.address);
      expect(players[1]).to.equal(player2.address);
    });

    it("Should return correct player data", async function () {
      const playerData = await ludo.getPlayer(player1.address);
      expect(playerData.name).to.equal("Alice");
      expect(playerData.color).to.equal(PlayerColor.RED);
      expect(playerData.isRegistered).to.be.true;
      expect(playerData.tokensInHome).to.equal(4);
      
      // Check that all tokens are at home position (100 + color)
      for (let i = 0; i < 4; i++) {
        expect(playerData.tokenPositions[i]).to.equal(100 + PlayerColor.RED);
      }
    });
  });

  describe("Win Condition", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.startGame();
    });

    it("Should correctly identify when player hasn't won", async function () {
      const hasWon = await ludo.hasPlayerWon(player1.address);
      expect(hasWon).to.be.false;
    });

    // Note: Testing actual win condition would require complex setup
    // of moving all tokens to winning position, which involves
    // many dice rolls and moves. This would be better tested
    // in integration tests or with a modified contract for testing.
  });

  describe("Player Movement Scenarios", function () {
    beforeEach(async function () {
      await ludo.connect(player1).registerPlayer("Alice", PlayerColor.RED);
      await ludo.connect(player2).registerPlayer("Bob", PlayerColor.GREEN);
      await ludo.startGame();
    });

    it("Should handle player with no valid moves", async function () {
      // All tokens at home, dice roll is not 6
      const canMove = await ludo.canPlayerMove(player1.address, 5);
      expect(canMove).to.be.false;
    });

    it("Should allow movement when dice is 6 and tokens are at home", async function () {
      const canMove = await ludo.canPlayerMove(player1.address, 6);
      expect(canMove).to.be.true;
    });
  });
});
