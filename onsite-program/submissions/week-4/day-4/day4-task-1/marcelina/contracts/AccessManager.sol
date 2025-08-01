// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//0x5FbDB2315678afecb367f032d93F642f64180aa3 deployed contract address

contract Web3BridgeGarageAccess {
    
    enum Status {
        EMPLOYED,
        TERMINATED
    }
    

    enum EmployeeRole {
        MediaTeam,
        Mentors,
        Managers,
        SocialMediaTeam,
        TechnicianSupervisors,
        KitchenStaff
    }
    

    struct Employee {
        string name;
        EmployeeRole role;
        Status status;
    }
    
   
    mapping(address => Employee) public employees;
    
    address[] public employeeList;
    

    function addEmployee(address _employeeAddress, string memory _name, EmployeeRole _role) external {
        employees[_employeeAddress] = Employee(_name, _role, Status.EMPLOYED);
        employeeList.push(_employeeAddress);
    }
    
   
    function canAccessGarage(address _employeeAddress) external view returns (bool) {
        Employee memory employee = employees[_employeeAddress];
        
     
        if (employee.status == Status.TERMINATED) {
            return false;
        };
        
    
        if (employee.role == EmployeeRole.MediaTeam || 
            employee.role == EmployeeRole.Mentors || 
            employee.role == EmployeeRole.Managers) {
            return true;
        }
        
        return false;
    }
    

    function getAllEmployees() external view returns (address[] memory) {
        return employeeList;
    }
    

    function getEmployeeDetails(address _employeeAddress) external view returns (Employee memory) {
        return employees[_employeeAddress];
    }
    
 
    function updateEmployeeStatus(address _employeeAddress, Status _newStatus) external {
        employees[_employeeAddress].status = _newStatus;
    }
}