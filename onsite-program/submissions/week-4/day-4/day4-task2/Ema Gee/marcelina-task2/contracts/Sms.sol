// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

//Deployed Addresses 0x5FbDB2315678afecb367f032d93F642f64180aa3

contract SchoolManagementSystem {
    
    enum Status { ACTIVE, DEFERRED, RUSTICATED }
    
    struct Student {
        uint256 studentId;
        string fullName;
        uint256 studentAge;
        Status currentStatus;
        bool isActive;
        uint256 enrollmentDate;
    }
    
    mapping(uint256 => Student) public students;
    mapping(uint256 => bool) public studentExists;
    
    uint256[] public activeStudentIds;
    mapping(uint256 => uint256) private studentIdToIndex; 
    
    uint256 private idCounter = 1;
    uint256 public totalActiveStudents;
    
    event StudentEnrolled(uint256 indexed studentId, string fullName, uint256 studentAge);
    event StudentInfoModified(uint256 indexed studentId, string fullName, uint256 studentAge);
    event StudentRemoved(uint256 indexed studentId);
    event StudentStatusUpdated(uint256 indexed studentId, Status newStatus);
    
    modifier validStudentId(uint256 _studentId) {
        require(_studentId > 0 && _studentId < idCounter, "Student ID does not exist");
        require(studentExists[_studentId], "Student not found");
        require(students[_studentId].isActive, "Student has been removed");
        _;
    }
    
    function enrollStudent(string memory _fullName, uint256 _studentAge) public returns (uint256) {
        require(bytes(_fullName).length > 0, "Name cannot be empty");
        require(_studentAge > 0 && _studentAge <= 150, "Invalid age");
        
        uint256 newStudentId = idCounter;
        
        students[newStudentId] = Student({
            studentId: newStudentId,
            fullName: _fullName,
            studentAge: _studentAge,
            currentStatus: Status.ACTIVE,
            isActive: true,
            enrollmentDate: block.timestamp
        });
        
        studentExists[newStudentId] = true;
        
        activeStudentIds.push(newStudentId);
        studentIdToIndex[newStudentId] = activeStudentIds.length - 1;
        totalActiveStudents++;
        
        idCounter++;
        
        emit StudentEnrolled(newStudentId, _fullName, _studentAge);
        return newStudentId;
    }
    
    function modifyStudentInfo(uint256 _studentId, string memory _fullName, uint256 _studentAge) 
        public 
        validStudentId(_studentId) 
    {
        require(bytes(_fullName).length > 0, "Name cannot be empty");
        require(_studentAge > 0 && _studentAge <= 150, "Invalid age");
        
        students[_studentId].fullName = _fullName;
        students[_studentId].studentAge = _studentAge;
        
        emit StudentInfoModified(_studentId, _fullName, _studentAge);
    }
    
    function removeStudent(uint256 _studentId) public validStudentId(_studentId) {
        students[_studentId].isActive = false;
        
        _removeFromActiveList(_studentId);
        totalActiveStudents--;
        
        emit StudentRemoved(_studentId);
    }
    
    function updateStudentStatus(uint256 _studentId, Status _newStatus) 
        public 
        validStudentId(_studentId) 
    {
        students[_studentId].currentStatus = _newStatus;
        
        emit StudentStatusUpdated(_studentId, _newStatus);
    }
    
    function retrieveStudentInfo(uint256 _studentId) 
        public 
        view 
        validStudentId(_studentId)
        returns (
            uint256 studentId, 
            string memory fullName, 
            uint256 studentAge, 
            Status currentStatus,
            uint256 enrollmentDate
        ) 
    {
        Student memory student = students[_studentId];
        return (
            student.studentId,
            student.fullName,
            student.studentAge,
            student.currentStatus,
            student.enrollmentDate
        );
    }
    
    function getStudentByIndex(uint256 _index) 
        public 
        view 
        returns (Student memory) 
    {
        require(_index < activeStudentIds.length, "Index out of bounds");
        uint256 studentId = activeStudentIds[_index];
        return students[studentId];
    }
    
    function fetchAllActiveStudents() public view returns (Student[] memory) {
        Student[] memory activeStudentList = new Student[](totalActiveStudents);
        
        for (uint256 i = 0; i < activeStudentIds.length; i++) {
            uint256 studentId = activeStudentIds[i];
            if (students[studentId].isActive) {
                activeStudentList[i] = students[studentId];
            }
        }
        
        return activeStudentList;
    }
    
    function getTotalActiveStudents() public view returns (uint256) {
        return totalActiveStudents;
    }
    
    function filterStudentsByStatus(Status _targetStatus) public view returns (Student[] memory) {
        uint256 matchingCount = 0;
        for (uint256 i = 0; i < activeStudentIds.length; i++) {
            uint256 studentId = activeStudentIds[i];
            if (students[studentId].isActive && students[studentId].currentStatus == _targetStatus) {
                matchingCount++;
            }
        }
        
        Student[] memory filteredStudents = new Student[](matchingCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < activeStudentIds.length; i++) {
            uint256 studentId = activeStudentIds[i];
            if (students[studentId].isActive && students[studentId].currentStatus == _targetStatus) {
                filteredStudents[resultIndex] = students[studentId];
                resultIndex++;
            }
        }
        
        return filteredStudents;
    }
    
    function getStudentsByStatusCount(Status _targetStatus) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < activeStudentIds.length; i++) {
            uint256 studentId = activeStudentIds[i];
            if (students[studentId].isActive && students[studentId].currentStatus == _targetStatus) {
                count++;
            }
        }
        return count;
    }
    
    function isStudentActive(uint256 _studentId) public view returns (bool) {
        return studentExists[_studentId] && students[_studentId].isActive;
    }
    
    function getActiveStudentIds() public view returns (uint256[] memory) {
        uint256[] memory activeIds = new uint256[](totalActiveStudents);
        uint256 index = 0;
        
        for (uint256 i = 0; i < activeStudentIds.length; i++) {
            uint256 studentId = activeStudentIds[i];
            if (students[studentId].isActive) {
                activeIds[index] = studentId;
                index++;
            }
        }
        
        return activeIds;
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
    
    function _removeFromActiveList(uint256 _studentId) private {
        uint256 indexToRemove = studentIdToIndex[_studentId];
        uint256 lastIndex = activeStudentIds.length - 1;
        
        if (indexToRemove != lastIndex) {
            uint256 lastStudentId = activeStudentIds[lastIndex];
            activeStudentIds[indexToRemove] = lastStudentId;
            studentIdToIndex[lastStudentId] = indexToRemove;
        }
        
        activeStudentIds.pop();
        delete studentIdToIndex[_studentId];
    }
    
    function cleanupInactiveStudents() public {
        uint256[] memory newActiveIds = new uint256[](totalActiveStudents);
        uint256 newIndex = 0;
        
        for (uint256 i = 0; i < activeStudentIds.length; i++) {
            uint256 studentId = activeStudentIds[i];
            if (students[studentId].isActive) {
                newActiveIds[newIndex] = studentId;
                studentIdToIndex[studentId] = newIndex;
                newIndex++;
            } else {
                delete studentIdToIndex[studentId];
            }
        }
        
        delete activeStudentIds;
        for (uint256 i = 0; i < newIndex; i++) {
            activeStudentIds.push(newActiveIds[i]);
        }
    }
}