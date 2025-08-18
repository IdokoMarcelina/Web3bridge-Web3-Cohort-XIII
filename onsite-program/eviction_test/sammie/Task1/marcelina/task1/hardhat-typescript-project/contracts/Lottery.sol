// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Lottery
 * @dev A decentralized lottery contract where players pay 0.01 ETH to enter
 * @dev Automatically selects a winner when 10 players have joined
 * @dev Winner receives the entire prize pool and lottery resets for next round
 */
contract Lottery {
    // Constants
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    // State variables
    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public lotteryId;
    address public recentWinner;
    uint256 public totalPrizePool;
    
    // Events
    event PlayerJoined(address indexed player, uint256 indexed lotteryId, uint256 playersCount);
    event WinnerSelected(address indexed winner, uint256 indexed lotteryId, uint256 prizeAmount);
    event LotteryReset(uint256 indexed newLotteryId);
    
    // Modifiers
    modifier validEntry() {
        require(msg.value == ENTRY_FEE, "Must pay exactly 0.01 ETH to enter");
        require(!hasEntered[msg.sender], "Player has already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        _;
    }
    
    /**
     * @dev Constructor initializes the first lottery round
     */
    constructor() {
        lotteryId = 1;
    }
    
    /**
     * @dev Allows a player to enter the lottery by paying the entry fee
     * @dev Automatically triggers winner selection when 10th player joins
     */
    function enterLottery() external payable validEntry {
        // Add player to the list
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        totalPrizePool += msg.value;
        
        emit PlayerJoined(msg.sender, lotteryId, players.length);
        
        // If we have 10 players, automatically select winner
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
    /**
     * @dev Internal function to select winner and distribute prize
     * @dev Uses block properties for pseudo-randomness (not production-ready)
     */
    function _selectWinner() internal {
        require(players.length == MAX_PLAYERS, "Not enough players to select winner");
        
        // Generate pseudo-random index
        // NOTE: This is not truly random and not suitable for production
        // Consider using Chainlink VRF or similar oracle for true randomness
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.difficulty,
                    block.number,
                    players
                )
            )
        ) % players.length;
        
        address winner = players[randomIndex];
        recentWinner = winner;
        uint256 prizeAmount = totalPrizePool;
        
        emit WinnerSelected(winner, lotteryId, prizeAmount);
        
        // Transfer prize to winner
        (bool success, ) = payable(winner).call{value: prizeAmount}("");
        require(success, "Failed to send prize to winner");
        
        // Reset lottery for next round
        _resetLottery();
    }
    
    /**
     * @dev Internal function to reset lottery state for next round
     */
    function _resetLottery() internal {
        // Clear players array
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        
        players = new address[](0);
        totalPrizePool = 0;
        lotteryId++;
        
        emit LotteryReset(lotteryId);
    }
    
    /**
     * @dev Get the current number of players in the lottery
     * @return Number of players currently entered
     */
    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }
    
    /**
     * @dev Get all current players
     * @return Array of player addresses
     */
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    /**
     * @dev Get the current lottery ID
     * @return Current lottery round ID
     */
    function getLotteryId() external view returns (uint256) {
        return lotteryId;
    }
    
    /**
     * @dev Get the recent winner (winner of the last completed round)
     * @return Address of the most recent winner
     */
    function getRecentWinner() external view returns (address) {
        return recentWinner;
    }
    
    /**
     * @dev Check if a specific address has entered the current round
     * @param player Address to check
     * @return True if player has entered, false otherwise
     */
    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
    
    /**
     * @dev Get the current prize pool amount
     * @return Current prize pool in wei
     */
    function getPrizePool() external view returns (uint256) {
        return totalPrizePool;
    }
    
    /**
     * @dev Get contract balance (should match prize pool)
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get how many more players needed to start the draw
     * @return Number of players still needed
     */
    function getPlayersNeeded() external view returns (uint256) {
        if (players.length >= MAX_PLAYERS) {
            return 0;
        }
        return MAX_PLAYERS - players.length;
    }
}
