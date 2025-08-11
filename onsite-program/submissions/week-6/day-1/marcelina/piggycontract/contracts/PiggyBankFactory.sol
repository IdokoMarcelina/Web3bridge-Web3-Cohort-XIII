// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBankFactory is Ownable {
    struct UserInfo {
        address[] piggyBanks;
        uint256 totalSavingsAccounts;
        bool exists;
    }

    mapping(address => UserInfo) public users;
    mapping(address => address) public piggyBankToUser; 
    address[] public allUsers;
    address[] public allPiggyBanks;

    event PiggyBankCreated(address indexed user, address indexed piggyBank, uint256 timestamp);
    event SavingsAccountCreated(address indexed user, address indexed piggyBank, uint256 accountId);

    constructor() {
        // Deployer becomes the admin
    }

    function createPiggyBank() external returns (address) {
        PiggyBank newPiggyBank = new PiggyBank(msg.sender, owner());
        address piggyBankAddress = address(newPiggyBank);

        if (!users[msg.sender].exists) {
            users[msg.sender].exists = true;
            allUsers.push(msg.sender);
        }

        users[msg.sender].piggyBanks.push(piggyBankAddress);
        piggyBankToUser[piggyBankAddress] = msg.sender;
        allPiggyBanks.push(piggyBankAddress);

        emit PiggyBankCreated(msg.sender, piggyBankAddress, block.timestamp);
        return piggyBankAddress;
    }

    function createSavingsAccount(
        address piggyBankAddress,
        uint256 lockPeriod,
        address tokenAddress
    ) external returns (uint256) {
        require(piggyBankToUser[piggyBankAddress] == msg.sender, "Not your piggy bank");
        
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        uint256 accountId = piggyBank.createSavingsAccount(lockPeriod, tokenAddress);

        users[msg.sender].totalSavingsAccounts++;

        emit SavingsAccountCreated(msg.sender, piggyBankAddress, accountId);
        return accountId;
    }

    function getUserPiggyBanks(address user) external view returns (address[] memory) {
        return users[user].piggyBanks;
    }

    function getUserTotalSavingsAccounts(address user) external view returns (uint256) {
        return users[user].totalSavingsAccounts;
    }

    function getUserBalanceInPiggyBank(
        address user, 
        address piggyBankAddress, 
        uint256 accountId
    ) external view returns (uint256) {
        require(piggyBankToUser[piggyBankAddress] == user, "Not user's piggy bank");
        
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        return piggyBank.getAccountBalance(accountId);
    }

    function getAllUserBalances(address user) 
        external 
        view 
        returns (
            address[] memory piggyBanks,
            uint256[][] memory balances,
            uint256[] memory accountCounts
        ) 
    {
        UserInfo memory userInfo = users[user];
        uint256 piggyBankCount = userInfo.piggyBanks.length;
        
        piggyBanks = new address[](piggyBankCount);
        balances = new uint256[][](piggyBankCount);
        accountCounts = new uint256[](piggyBankCount);

        for (uint256 i = 0; i < piggyBankCount; i++) {
            address piggyBankAddr = userInfo.piggyBanks[i];
            PiggyBank piggyBank = PiggyBank(piggyBankAddr);
            
            piggyBanks[i] = piggyBankAddr;
            accountCounts[i] = piggyBank.savingsAccountCount();
            
            (uint256[] memory bankBalances,,,,) = piggyBank.getAllAccountsInfo();


            balances[i] = bankBalances;
        }
    }

    function getAllUsersOverview() 
        external 
        view 
        onlyOwner 
        returns (
            address[] memory userAddresses,
            uint256[] memory piggyBankCounts,
            uint256[] memory totalSavingsAccounts
        ) 
    {
        uint256 userCount = allUsers.length;
        userAddresses = new address[](userCount);
        piggyBankCounts = new uint256[](userCount);
        totalSavingsAccounts = new uint256[](userCount);

        for (uint256 i = 0; i < userCount; i++) {
            address user = allUsers[i];
            userAddresses[i] = user;
            piggyBankCounts[i] = users[user].piggyBanks.length;
            totalSavingsAccounts[i] = users[user].totalSavingsAccounts;
        }
    }

    function getTotalStats() 
        external 
        view 
        returns (
            uint256 totalUsers,
            uint256 totalPiggyBanks,
            uint256 totalSavingsAccounts
        ) 
    {
        totalUsers = allUsers.length;
        totalPiggyBanks = allPiggyBanks.length;
        
        for (uint256 i = 0; i < allUsers.length; i++) {
            totalSavingsAccounts += users[allUsers[i]].totalSavingsAccounts;
        }
    }

    function getUserPiggyBankInfo(address user, address piggyBankAddress) 
        external 
        view 
        returns (
            uint256[] memory balances,
            uint256[] memory lockPeriods,
            uint256[] memory lockEndTimes,
            address[] memory tokenAddresses,
            bool[] memory isLocked
        ) 
    {
        require(piggyBankToUser[piggyBankAddress] == user, "Not user's piggy bank");
        
        PiggyBank piggyBank = PiggyBank(piggyBankAddress);
        return piggyBank.getAllAccountsInfo();
    }

    function getAllPiggyBanks() external view onlyOwner returns (address[] memory) {
        return allPiggyBanks;
    }

    function getAllUsers() external view onlyOwner returns (address[] memory) {
        return allUsers;
    }

    function userExists(address user) external view returns (bool) {
        return users[user].exists;
    }

    bool public paused = false;

    function pauseFactory() external onlyOwner {
        paused = true;
    }

    function unpauseFactory() external onlyOwner {
        paused = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Factory is paused");
        _;
    }
}