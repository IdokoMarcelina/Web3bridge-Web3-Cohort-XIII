// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

=
contract Lottery {
   
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public constant MAX_PLAYERS = 10;
    
    address[] public players;
    mapping(address => bool) public hasEntered;
    uint256 public lotteryId;
    address public recentWinner;
    uint256 public totalPrizePool;
    
   
    event PlayerJoined(address indexed player, uint256 indexed lotteryId, uint256 playersCount);
    event WinnerSelected(address indexed winner, uint256 indexed lotteryId, uint256 prizeAmount);
    event LotteryReset(uint256 indexed newLotteryId);
    
   
    modifier validEntry() {
        require(msg.value == ENTRY_FEE, "Must pay exactly 0.01 ETH to enter");
        require(!hasEntered[msg.sender], "Player has already entered this round");
        require(players.length < MAX_PLAYERS, "Lottery is full");
        _;
    }
    
   
    constructor() {
        lotteryId = 1;
    }
    
 
    function enterLottery() external payable validEntry {
      
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        totalPrizePool += msg.value;
        
        emit PlayerJoined(msg.sender, lotteryId, players.length);
        
      
        if (players.length == MAX_PLAYERS) {
            _selectWinner();
        }
    }
    
   
    function _selectWinner() internal {
        require(players.length == MAX_PLAYERS, "Not enough players to select winner");
       
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
        
      
        (bool success, ) = payable(winner).call{value: prizeAmount}("");
        require(success, "Failed to send prize to winner");
      
        _resetLottery();
    }
    
   
    function _resetLottery() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }
        
        players = new address[](0);
        totalPrizePool = 0;
        lotteryId++;
        
        emit LotteryReset(lotteryId);
    }
    
   
    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }
    
    
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
 
    function getLotteryId() external view returns (uint256) {
        return lotteryId;
    }
    
    function getRecentWinner() external view returns (address) {
        return recentWinner;
    }
    
  
    function hasPlayerEntered(address player) external view returns (bool) {
        return hasEntered[player];
    }
    
  
    function getPrizePool() external view returns (uint256) {
        return totalPrizePool;
    }
    
   
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    
    function getPlayersNeeded() external view returns (uint256) {
        if (players.length >= MAX_PLAYERS) {
            return 0;
        }
        return MAX_PLAYERS - players.length;
    }
}
