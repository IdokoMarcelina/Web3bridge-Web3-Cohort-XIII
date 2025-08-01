//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//Deployed Addresses 0x5FbDB2315678afecb367f032d93F642f64180aa3

contract TodoList {
    struct Todo {
        string title;
        string description;
        bool status;
        uint256 timestamp;
    }
    
    struct User {
        string school;
        bool exists;
    }
    
    mapping(address => Todo[]) public userTodos;
    
    mapping(address => User) public users;
    
    event TodoCreated(address indexed user, uint256 indexed todoIndex, string title);
    event TodoUpdated(address indexed user, uint256 indexed todoIndex, string title);
    event TodoStatusToggled(address indexed user, uint256 indexed todoIndex, bool status);
    event TodoDeleted(address indexed user, uint256 indexed todoIndex);
    event UserSchoolUpdated(address indexed user, string school);
    
    function setSchool(string memory _school) external {
        users[msg.sender].school = _school;
        users[msg.sender].exists = true;
        emit UserSchoolUpdated(msg.sender, _school);
    }
    
    function createTodo(string memory _title, string memory _description) external {
        Todo memory newTodo = Todo({
            title: _title,
            description: _description,
            status: false,
            timestamp: block.timestamp
        });
        
        userTodos[msg.sender].push(newTodo);
        
        emit TodoCreated(msg.sender, userTodos[msg.sender].length - 1, _title);
    }
    
    function updateTodo(uint256 _index, string memory _newTitle, string memory _newDescription) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        
        userTodos[msg.sender][_index].title = _newTitle;
        userTodos[msg.sender][_index].description = _newDescription;
        
        emit TodoUpdated(msg.sender, _index, _newTitle);
    }
    
    function toggleTodoStatus(uint256 _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        
        userTodos[msg.sender][_index].status = !userTodos[msg.sender][_index].status;
        
        emit TodoStatusToggled(msg.sender, _index, userTodos[msg.sender][_index].status);
    }
    
    function getTodos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }
    
    function getUserTodos(address _user) external view returns (Todo[] memory) {
        return userTodos[_user];
    }
    
    function getUserSchool(address _user) external view returns (string memory) {
        return users[_user].school;
    }
    
    function getMySchool() external view returns (string memory) {
        return users[msg.sender].school;
    }
    
    function deleteTodo(uint256 _index) external {
        require(_index < userTodos[msg.sender].length, "Invalid index");
        
        userTodos[msg.sender][_index] = userTodos[msg.sender][userTodos[msg.sender].length - 1];
        userTodos[msg.sender].pop();
        
        emit TodoDeleted(msg.sender, _index);
    }
    
    
    function getTodoCount(address _user) external view returns (uint256) {
        return userTodos[_user].length;
    }
    

    function getMyTodoCount() external view returns (uint256) {
        return userTodos[msg.sender].length;
    }
}