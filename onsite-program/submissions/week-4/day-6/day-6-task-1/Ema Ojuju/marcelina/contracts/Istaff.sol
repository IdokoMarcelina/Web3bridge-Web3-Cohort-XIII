// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface Istaff {
    enum Role { Mentor, Gateman, Cleaner }
    enum Status { Employed, Unemployed, Probation }

    struct Staff {
        string fullName;
        Role role;
        Status status;
        uint salary;
    }

    function registerStaff(address staffAddress, string calldata fullName, Role role, uint salary) external;
    function updateStatus(address staffAddress, Status status) external;
    function paySalary(address staffAddress) external payable;
    function getStaff(address staffAddress) external view returns (Staff memory);
}
