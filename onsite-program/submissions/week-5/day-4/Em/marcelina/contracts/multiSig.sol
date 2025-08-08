// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract MultiSig {
    address[] public owners;
    uint public transactionCount;
    uint public required;

    struct Transaction {
        address payable destination;
        uint value;
        bool executed;
        bytes data;
    }

    mapping(uint => Transaction) public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;

    receive() external payable {}

    event TransactionSubmitted(uint indexed transactionId);
    event TransactionConfirmed(
        uint indexed transactionId,
        address indexed owner
    );
    event TransactionExecuted(uint indexed transactionId);

    function executeTransaction(uint transactionId) public {
        require(isConfirmed(transactionId));
        Transaction storage _tx = transactions[transactionId];
        (bool success, ) = _tx.destination.call{value: _tx.value}(_tx.data);
        require(success);
        emit TransactionExecuted(transactionId);
        _tx.executed = true;
    }

    function isConfirmed(uint transactionId) public view returns (bool) {
        return getConfirmationsCount(transactionId) >= required;
    }

    function getConfirmationsCount(
        uint transactionId
    ) public view returns (uint) {
        uint count;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                count++;
            }
        }
        return count;
    }

    function isOwner(address addr) public view returns (bool) {
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == addr) {
                return true;
            }
        }
        return false;
    }

    function submitTransaction(
        address payable dest,
        uint value,
        bytes calldata data
    ) external {
        uint id = addTransaction(dest, value, data);
        emit TransactionSubmitted(id);
        confirmTransaction(id);
    }

    function confirmTransaction(uint transactionId) public {
        require(isOwner(msg.sender));
        confirmations[transactionId][msg.sender] = true;
        emit TransactionConfirmed(transactionId, msg.sender);
        if (isConfirmed(transactionId)) {
            executeTransaction(transactionId);
        }
    }

    function addTransaction(
        address payable destination,
        uint value,
        bytes calldata data
    ) public returns (uint) {
        transactions[transactionCount] = Transaction(
            destination,
            value,
            false,
            data
        );
        transactionCount += 1;
        return transactionCount - 1;
    }

    constructor(address[] memory _owners, uint _confirmations) {
        require(_owners.length > 0);
        require(_confirmations > 0);
        require(_confirmations <= _owners.length);
        owners = _owners;
        required = _confirmations;
    }
}
