// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


// Deployed Addresses

// EMS - 0x5FbDB2315678afecb367f032d93F642f64180aa3

import "./Istaff.sol";
import "./Error.sol";

contract EmployeeManagementSystem is Istaff {
    using Error for *;

    address public owner;
    mapping(address => Staff) private staffRecords;

    receive() external payable {}

    function setOwner(address _owner) external {
        if (owner != address(0)) revert Error.AlreadyRegistered();
        owner = _owner;
    }

    function registerStaff(
        address staffAddress,
        string calldata fullName,
        Role role,
        uint salary
    ) external override {
        if (msg.sender != owner) revert Error.NotAuthorized();
        if (staffRecords[staffAddress].salary > 0)
            revert Error.AlreadyRegistered();

        staffRecords[staffAddress] = Staff({
            fullName: fullName,
            role: role,
            status: Status.Employed,
            salary: salary
        });
    }

    function updateStatus(
        address staffAddress,
        Status status
    ) external override {
        if (msg.sender != owner) revert Error.NotAuthorized();
        if (staffRecords[staffAddress].salary == 0)
            revert Error.StaffNotFound();

        staffRecords[staffAddress].status = status;
    }

    function paySalary(address staffAddress) external payable override {
        if (msg.sender != owner) revert Error.NotAuthorized();

        Staff memory staff = staffRecords[staffAddress];

        if (staff.salary == 0) revert Error.StaffNotFound();
        if (staff.status != Status.Employed)
            revert Error.NotEligibleForPayment();
        if (address(this).balance < staff.salary)
            revert Error.InsufficientContractBalance();

        payable(staffAddress).transfer(staff.salary);
    }

    function getStaff(
        address staffAddress
    ) external view override returns (Staff memory) {
        if (staffRecords[staffAddress].salary == 0)
            revert Error.StaffNotFound();
        return staffRecords[staffAddress];
    }
}
