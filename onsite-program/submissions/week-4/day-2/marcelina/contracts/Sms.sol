// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract SchoolManagementSystem {
    
    enum Status { ACTIVE, DEFERRED, RUSTICATED }
    
    struct Student {
        uint256 studentId;
        string fullName;
        uint256 studentAge;
        Status currentStatus;
        bool isActive;
    }
    
    Student[] public studentRecords;
    uint256 private idCounter = 1;
    
    function enrollStudent(string memory _fullName, uint256 _studentAge) public returns (uint256) {
        require(bytes(_fullName).length > 0, "Name cannot be empty");
        require(_studentAge > 0 && _studentAge <= 150, "Invalid age");
        
        Student memory newEnrollment = Student({
            studentId: idCounter,
            fullName: _fullName,
            studentAge: _studentAge,
            currentStatus: Status.ACTIVE,
            isActive: true
        });
        
        studentRecords.push(newEnrollment);
        
        idCounter++;
        return idCounter - 1;
    }
    
    function modifyStudentInfo(uint256 _studentId, string memory _fullName, uint256 _studentAge) public {
        require(_studentId > 0 && _studentId < idCounter, "This Student ID does not exist");
        require(bytes(_fullName).length > 0, "Name cannot be empty");
        require(_studentAge > 0 && _studentAge <= 150, "Invalid age");
        
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].studentId == _studentId && studentRecords[_index].isActive) {
                studentRecords[_index].fullName = _fullName;
                studentRecords[_index].studentAge = _studentAge;
                return;
            }
        }
        revert("Student not found or has been deleted");
    }
    
    function removeStudent(uint256 _studentId) public {
        require(_studentId > 0 && _studentId < idCounter, "Student ID does not exist");
        
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].studentId == _studentId && studentRecords[_index].isActive) {
                studentRecords[_index].isActive = false;
                return;
            }
        }
        revert("Student not found or has been deleted");
    }
    
    function updateStudentStatus(uint256 _studentId, Status _newStatus) public {
        require(_studentId > 0 && _studentId < idCounter, "Student ID does not exist");
        
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].studentId == _studentId && studentRecords[_index].isActive) {
                studentRecords[_index].currentStatus = _newStatus;
                return;
            }
        }
        revert("Student not found or has been deleted");
    }
    
    function retrieveStudentInfo(uint256 _studentId) 
        public 
        view 
        returns (uint256 studentId, string memory fullName, uint256 studentAge, Status currentStatus) 
    {
        require(_studentId > 0 && _studentId < idCounter, "Student ID does not exist");
        
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].studentId == _studentId && studentRecords[_index].isActive) {
                return (
                    studentRecords[_index].studentId,
                    studentRecords[_index].fullName,
                    studentRecords[_index].studentAge,
                    studentRecords[_index].currentStatus
                );
            }
        }
        revert("Student not found or has been deleted");
    }
    
    function fetchAllActiveStudents() public view returns (Student[] memory) {
        uint256 activeStudentCount = 0;
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].isActive) {
                activeStudentCount++;
            }
        }
        
        Student[] memory activeStudentList = new Student[](activeStudentCount);
        uint256 listIndex = 0;
        
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].isActive) {
                activeStudentList[listIndex] = studentRecords[_index];
                listIndex++;
            }
        }
        
        return activeStudentList;
    }
    
    function getTotalActiveStudents() public view returns (uint256) {
        uint256 totalCount = 0;
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].isActive) {
                totalCount++;
            }
        }
        return totalCount;
    }
    
    function filterStudentsByStatus(Status _targetStatus) public view returns (Student[] memory) {
        uint256 matchingCount = 0;
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].isActive && studentRecords[_index].currentStatus == _targetStatus) {
                matchingCount++;
            }
        }
        
        Student[] memory filteredStudents = new Student[](matchingCount);
        uint256 resultIndex = 0;
        
        for (uint256 _index = 0; _index < studentRecords.length; _index++) {
            if (studentRecords[_index].isActive && studentRecords[_index].currentStatus == _targetStatus) {
                filteredStudents[resultIndex] = studentRecords[_index];
                resultIndex++;
            }
        }
        
        return filteredStudents;
    }
    
    function convertStatusToText(Status _currentStatus) public pure returns (string memory) {
        if (_currentStatus == Status.ACTIVE) {
            return "ACTIVE";
        } else if (_currentStatus == Status.DEFERRED) {
            return "DEFERRED";
        } else if (_currentStatus == Status.RUSTICATED) {
            return "RUSTICATED";
        }
        return "UNKNOWN";
    }
}