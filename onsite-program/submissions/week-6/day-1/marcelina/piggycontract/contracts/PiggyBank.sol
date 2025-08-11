
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PiggyBank is ReentrancyGuard, Ownable {
    struct SavingsAccount {
        uint256 balance;
        uint256 lockPeriod;
        uint256 lockEndTime;
        address tokenAddress; 
        bool exists;
    }

    mapping(uint256 => SavingsAccount) public savingsAccounts;
    uint256 public savingsAccountCount;
    address public factoryAdmin;
    address public user;

    event SavingsAccountCreated(uint256 indexed accountId, uint256 lockPeriod, address tokenAddress);
    event Deposit(uint256 indexed accountId, uint256 amount);
    event Withdrawal(uint256 indexed accountId, uint256 amount, bool earlyWithdrawal, uint256 fee);

    modifier onlyUser() {
        require(msg.sender == user, "Only user can call this function");
        _;
    }

    modifier validAccount(uint256 accountId) {
        require(accountId < savingsAccountCount && savingsAccounts[accountId].exists, "Invalid account ID");
        _;
    }

    constructor(address _user, address _factoryAdmin) {
        user = _user;
        factoryAdmin = _factoryAdmin;
        _transferOwnership(_user);
    }

    function createSavingsAccount(uint256 _lockPeriod, address _tokenAddress) 
        external 
        onlyUser 
        returns (uint256) 
    {
        require(_lockPeriod > 0, "Lock period must be greater than 0");

        uint256 accountId = savingsAccountCount;
        savingsAccounts[accountId] = SavingsAccount({
            balance: 0,
            lockPeriod: _lockPeriod,
            lockEndTime: 0,
            tokenAddress: _tokenAddress,
            exists: true
        });

        savingsAccountCount++;

        emit SavingsAccountCreated(accountId, _lockPeriod, _tokenAddress);
        return accountId;
    }

    function deposit(uint256 accountId, uint256 amount) 
        external 
        payable 
        onlyUser 
        validAccount(accountId) 
        nonReentrant 
    {
        SavingsAccount storage account = savingsAccounts[accountId];

        if (account.tokenAddress == address(0)) {
            require(msg.value == amount, "ETH amount mismatch");
            require(amount > 0, "Amount must be greater than 0");
        } else {
            require(msg.value == 0, "ETH not accepted for ERC20 deposits");
            require(amount > 0, "Amount must be greater than 0");
            
            IERC20 token = IERC20(account.tokenAddress);
            require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        }

        if (account.balance == 0) {
            account.lockEndTime = block.timestamp + account.lockPeriod;
        }

        account.balance += amount;

        emit Deposit(accountId, amount);
    }

    function withdraw(uint256 accountId, uint256 amount) 
        external 
        onlyUser 
        validAccount(accountId) 
        nonReentrant 
    {
        SavingsAccount storage account = savingsAccounts[accountId];
        require(account.balance >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");

        bool isEarlyWithdrawal = block.timestamp < account.lockEndTime;
        uint256 fee = 0;
        uint256 withdrawAmount = amount;

        if (isEarlyWithdrawal) {
            fee = (amount * 3) / 100;
            withdrawAmount = amount - fee;

            if (account.tokenAddress == address(0)) {
                (bool feeSuccess,) = payable(factoryAdmin).call{value: fee}("");
                require(feeSuccess, "Fee transfer failed");
            } else {
                IERC20 token = IERC20(account.tokenAddress);
                require(token.transfer(factoryAdmin, fee), "Fee transfer failed");
            }
        }

        account.balance -= amount;

        if (account.tokenAddress == address(0)) {
            (bool success,) = payable(user).call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20 token = IERC20(account.tokenAddress);
            require(token.transfer(user, withdrawAmount), "Token transfer failed");
        }

        emit Withdrawal(accountId, amount, isEarlyWithdrawal, fee);
    }

    function getAccountBalance(uint256 accountId) 
        external 
        view 
        validAccount(accountId) 
        returns (uint256) 
    {
        return savingsAccounts[accountId].balance;
    }

    function getAccountInfo(uint256 accountId) 
        external 
        view 
        validAccount(accountId) 
        returns (
            uint256 balance,
            uint256 lockPeriod,
            uint256 lockEndTime,
            address tokenAddress,
            bool isLocked
        ) 
    {
        SavingsAccount memory account = savingsAccounts[accountId];
        return (
            account.balance,
            account.lockPeriod,
            account.lockEndTime,
            account.tokenAddress,
            block.timestamp < account.lockEndTime
        );
    }

    function getAllAccountsInfo() 
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
        balances = new uint256[](savingsAccountCount);
        lockPeriods = new uint256[](savingsAccountCount);
        lockEndTimes = new uint256[](savingsAccountCount);
        tokenAddresses = new address[](savingsAccountCount);
        isLocked = new bool[](savingsAccountCount);

        for (uint256 i = 0; i < savingsAccountCount; i++) {
            if (savingsAccounts[i].exists) {
                balances[i] = savingsAccounts[i].balance;
                lockPeriods[i] = savingsAccounts[i].lockPeriod;
                lockEndTimes[i] = savingsAccounts[i].lockEndTime;
                tokenAddresses[i] = savingsAccounts[i].tokenAddress;
                isLocked[i] = block.timestamp < savingsAccounts[i].lockEndTime;
            }
        }
    }

    function emergencyWithdraw(uint256 accountId, address to) 
        external 
        validAccount(accountId) 
    {
        require(msg.sender == factoryAdmin, "Only factory admin");
        
        SavingsAccount storage account = savingsAccounts[accountId];
        uint256 amount = account.balance;
        account.balance = 0;

        if (account.tokenAddress == address(0)) {
            (bool success,) = payable(to).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20 token = IERC20(account.tokenAddress);
            require(token.transfer(to, amount), "Token transfer failed");
        }
    }
}