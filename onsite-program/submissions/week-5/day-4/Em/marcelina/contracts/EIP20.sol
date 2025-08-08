// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EIP20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint public totalSupply;
    mapping(address => uint) balances;

    constructor(uint _initialAmount, string memory _name, uint8 _decimals, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialAmount;
        balances[msg.sender] = _initialAmount;
    }

    function transfer(address _to, uint _value) public returns (bool) {
        require(balances[msg.sender] >= _value, "Insufficient");
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        return true;
    }

    function balanceOf(address _owner) public view returns (uint balance) {
        return balances[_owner];
    }
}
