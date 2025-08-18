// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Ludo {
    enum PlayerColor { NONE, RED, GREEN, BLUE, YELLOW }
    
    struct Player {
        address playerAddress;
        string name;
        PlayerColor color;
        uint256 score;
        bool isRegistered;
        uint256[4] tokenPositions;
        uint256 tokensInHome; 
    }
    
    struct GameState {
        bool isActive;
        uint256 currentPlayerIndex;
        uint256 totalPlayers;
        address winner;
        uint256 gameStartTime;
    }
    
    mapping(address => Player) public players;
    mapping(PlayerColor => address) public colorToPlayer;
    mapping(uint256 => PlayerColor) public indexToColor;
    
    address[] public playerAddresses;
    GameState public gameState;
    
    uint256 private constant MAX_PLAYERS = 4;
    uint256 private constant BOARD_SIZE = 52;
    uint256 private constant HOME_BASE = 100;
    uint256 private constant SAFE_ZONE_BASE = 200;
    uint256 private constant WINNING_POSITION = 256;
    
    event PlayerRegistered(address indexed player, string name, PlayerColor color);
    event GameStarted(uint256 totalPlayers);
    event DiceRolled(address indexed player, uint256 diceValue);
    event TokenMoved(address indexed player, uint256 tokenIndex, uint256 fromPosition, uint256 toPosition);
    event PlayerWon(address indexed winner, PlayerColor color);
    event TokenCaptured(address indexed capturer, address indexed captured, uint256 position);
    
    modifier onlyRegisteredPlayer() {
        require(players[msg.sender].isRegistered, "Player not registered");
        _;
    }
    
    modifier gameActive() {
        require(gameState.isActive, "Game is not active");
        _;
    }
    
    modifier currentPlayer() {
        require(playerAddresses[gameState.currentPlayerIndex] == msg.sender, "Not your turn");
        _;
    }
    
    constructor() {
        gameState.isActive = false;
        gameState.totalPlayers = 0;
    }
    
    function registerPlayer(string memory _name, PlayerColor _color) external {
        require(gameState.totalPlayers < MAX_PLAYERS, "Game is full");
        require(!players[msg.sender].isRegistered, "Player already registered");
        require(_color != PlayerColor.NONE, "Invalid color");
        require(colorToPlayer[_color] == address(0), "Color already taken");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        Player storage newPlayer = players[msg.sender];
        newPlayer.playerAddress = msg.sender;
        newPlayer.name = _name;
        newPlayer.color = _color;
        newPlayer.score = 0;
        newPlayer.isRegistered = true;
        newPlayer.tokensInHome = 4;
        
        for (uint256 i = 0; i < 4; i++) {
            newPlayer.tokenPositions[i] = HOME_BASE + uint256(_color);
        }
        
        playerAddresses.push(msg.sender);
        colorToPlayer[_color] = msg.sender;
        indexToColor[gameState.totalPlayers] = _color;
        gameState.totalPlayers++;
        
        emit PlayerRegistered(msg.sender, _name, _color);
        
       
        if (gameState.totalPlayers == MAX_PLAYERS) {
            startGame();
        }
    }
    
    function startGame() public {
        require(gameState.totalPlayers >= 2, "Need at least 2 players to start");
        require(!gameState.isActive, "Game already active");
        
        gameState.isActive = true;
        gameState.currentPlayerIndex = 0;
        gameState.gameStartTime = block.timestamp;
        
        emit GameStarted(gameState.totalPlayers);
    }
    
    function rollDice() external onlyRegisteredPlayer gameActive currentPlayer returns (uint256) {
        uint256 diceValue = _generateRandomNumber() + 1; 
        
        emit DiceRolled(msg.sender, diceValue);
        
        if (!canPlayerMove(msg.sender, diceValue)) {
            nextTurn();
        }
        
        return diceValue;
    }
    
    function moveToken(uint256 tokenIndex, uint256 diceValue) external onlyRegisteredPlayer gameActive currentPlayer {
        require(tokenIndex < 4, "Invalid token index");
        
        Player storage player = players[msg.sender];
        uint256 currentPosition = player.tokenPositions[tokenIndex];
        
        require(canMoveToken(msg.sender, tokenIndex, diceValue), "Cannot move this token");
        
        uint256 newPosition = calculateNewPosition(msg.sender, tokenIndex, diceValue);
        
        checkForCapture(newPosition, msg.sender);
        
        uint256 oldPosition = player.tokenPositions[tokenIndex];
        player.tokenPositions[tokenIndex] = newPosition;
        
        if (oldPosition >= HOME_BASE && oldPosition < SAFE_ZONE_BASE && newPosition < HOME_BASE) {
            player.tokensInHome--;
        }
        
        emit TokenMoved(msg.sender, tokenIndex, oldPosition, newPosition);
        
        if (hasPlayerWon(msg.sender)) {
            gameState.winner = msg.sender;
            gameState.isActive = false;
            player.score += 1000; 
            emit PlayerWon(msg.sender, player.color);
            return;
        }
        
    
        if (diceValue != 6) {
            nextTurn();
        }
    }
    
    function canPlayerMove(address playerAddr, uint256 diceValue) public view returns (bool) {
        Player storage player = players[playerAddr];
        
        for (uint256 i = 0; i < 4; i++) {
            if (canMoveToken(playerAddr, i, diceValue)) {
                return true;
            }
        }
        return false;
    }
    
    function canMoveToken(address playerAddr, uint256 tokenIndex, uint256 diceValue) public view returns (bool) {
        Player storage player = players[playerAddr];
        uint256 currentPosition = player.tokenPositions[tokenIndex];
        
        
        if (currentPosition >= HOME_BASE && currentPosition < SAFE_ZONE_BASE) {
            return diceValue == 6;
        }
        
        
        if (currentPosition == WINNING_POSITION) {
            return false;
        }
        
        uint256 newPosition = calculateNewPosition(playerAddr, tokenIndex, diceValue);
        
        
        return newPosition <= WINNING_POSITION;
    }
    
    function calculateNewPosition(address playerAddr, uint256 tokenIndex, uint256 diceValue) public view returns (uint256) {
        Player storage player = players[playerAddr];
        uint256 currentPosition = player.tokenPositions[tokenIndex];
        
       
        if (currentPosition >= HOME_BASE && currentPosition < SAFE_ZONE_BASE) {
            if (diceValue == 6) {
                return getStartPosition(player.color);
            }
            return currentPosition; 
        }
        
        if (currentPosition < BOARD_SIZE) {
            uint256 newPos = currentPosition + diceValue;
            
            if (shouldEnterSafeZone(playerAddr, currentPosition, diceValue)) {
                uint256 stepsIntoSafeZone = newPos - getHomeEntryPosition(player.color);
                return SAFE_ZONE_BASE + uint256(player.color) * 10 + stepsIntoSafeZone - 1;
            }
            
            if (newPos >= BOARD_SIZE) {
                newPos = newPos - BOARD_SIZE;
            }
            
            return newPos;
        }
        
        if (currentPosition >= SAFE_ZONE_BASE && currentPosition < WINNING_POSITION) {
            uint256 newPos = currentPosition + diceValue;
            if (newPos > SAFE_ZONE_BASE + uint256(player.color) * 10 + 5) {
                return WINNING_POSITION; 
            }
            return newPos;
        }
        
        return currentPosition;
    }
    
    function shouldEnterSafeZone(address playerAddr, uint256 currentPos, uint256 diceValue) internal view returns (bool) {
        Player storage player = players[playerAddr];
        uint256 homeEntry = getHomeEntryPosition(player.color);
        uint256 newPos = currentPos + diceValue;
        
        return currentPos < homeEntry && newPos >= homeEntry;
    }
    
    function getStartPosition(PlayerColor color) internal pure returns (uint256) {
        if (color == PlayerColor.RED) return 1;
        if (color == PlayerColor.GREEN) return 14;
        if (color == PlayerColor.BLUE) return 27;
        if (color == PlayerColor.YELLOW) return 40;
        return 0;
    }
    
    function getHomeEntryPosition(PlayerColor color) internal pure returns (uint256) {
        if (color == PlayerColor.RED) return 51;
        if (color == PlayerColor.GREEN) return 12;
        if (color == PlayerColor.BLUE) return 25;
        if (color == PlayerColor.YELLOW) return 38;
        return 0;
    }
    
    function checkForCapture(uint256 position, address currentPlayer) internal {
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            address opponent = playerAddresses[i];
            if (opponent == currentPlayer) continue;
            
            Player storage opponentPlayer = players[opponent];
            for (uint256 j = 0; j < 4; j++) {
                if (opponentPlayer.tokenPositions[j] == position && position < BOARD_SIZE) {
                    opponentPlayer.tokenPositions[j] = HOME_BASE + uint256(opponentPlayer.color);
                    opponentPlayer.tokensInHome++;
                    
                    players[currentPlayer].score += 50;
                    
                    emit TokenCaptured(currentPlayer, opponent, position);
                    break;
                }
            }
        }
    }
    
    function hasPlayerWon(address playerAddr) public view returns (bool) {
        Player storage player = players[playerAddr];
        
        for (uint256 i = 0; i < 4; i++) {
            if (player.tokenPositions[i] != WINNING_POSITION) {
                return false;
            }
        }
        return true;
    }
    
    function nextTurn() internal {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.totalPlayers;
    }
    
    function _generateRandomNumber() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            playerAddresses.length
        ))) % 6;
    }
    
    function getPlayer(address playerAddr) external view returns (
        string memory name,
        PlayerColor color,
        uint256 score,
        bool isRegistered,
        uint256[4] memory tokenPositions,
        uint256 tokensInHome
    ) {
        Player storage player = players[playerAddr];
        return (
            player.name,
            player.color,
            player.score,
            player.isRegistered,
            player.tokenPositions,
            player.tokensInHome
        );
    }
    
    function getCurrentPlayer() external view returns (address) {
        if (gameState.totalPlayers == 0) return address(0);
        return playerAddresses[gameState.currentPlayerIndex];
    }
    
    function getGameInfo() external view returns (
        bool isActive,
        uint256 totalPlayers,
        address currentPlayer,
        address winner,
        uint256 gameStartTime
    ) {
        return (
            gameState.isActive,
            gameState.totalPlayers,
            gameState.totalPlayers > 0 ? playerAddresses[gameState.currentPlayerIndex] : address(0),
            gameState.winner,
            gameState.gameStartTime
        );
    }
    
    function getAvailableColors() external view returns (PlayerColor[] memory) {
        PlayerColor[] memory available = new PlayerColor[](MAX_PLAYERS);
        uint256 count = 0;
        
        PlayerColor[4] memory allColors = [
            PlayerColor.RED,
            PlayerColor.GREEN,
            PlayerColor.BLUE,
            PlayerColor.YELLOW
        ];
        
        for (uint256 i = 0; i < allColors.length; i++) {
            if (colorToPlayer[allColors[i]] == address(0)) {
                available[count] = allColors[i];
                count++;
            }
        }
        
        PlayerColor[] memory result = new PlayerColor[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }
        
        return result;
    }
    
    function getAllPlayers() external view returns (address[] memory) {
        return playerAddresses;
    }
}
