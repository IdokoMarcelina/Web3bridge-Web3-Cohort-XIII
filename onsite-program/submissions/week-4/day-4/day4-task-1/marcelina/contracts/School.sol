// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;



contract SchoolManagementSystem {

     enum Status { ACTIVE, DEFERRED, RUSTICATED }

     struct Student {
        uint256 id;
        string name;
        uint256 age;
        Status status;
     }

        mapping(uint256 => Student) private students;
        uint256 private nextId;
        

        function registerStudent(string memory _name, uint256 _age) public {

            nextId = nextId + 1;
            require(_age > 0, "Age must be greater than 0");
            students[nextId] = Student(nextId, _name, _age, Status.ACTIVE);  
        }

        function updateStudent(uint256 _id, string memory _name, uint256 _age) public {
            require(_age > 0, "Age must be greater than 0");
            require(students[_id].id != 0, "Student not found");
            students[_id].name = _name;
            students[_id].age = _age;
        }

        function getStudent(uint256 _id) public view returns (Student memory) {
            require(students[_id].id != 0, "Student not found");
            return students[_id];
        }

        function getAllStudents() public view returns (Student[] memory) {
            Student[] memory allStudents = new Student[](nextId);
            for (uint256 i = 1; i <= nextId; i++) {
                allStudents[i - 1] = students[i];
            }
            return allStudents;
        }

        function setStudentStatus(uint256 _id, Status _status) public {
            require(students[_id].id != 0, "Student not found");
            students[_id].status = _status;
        }

        function getStudentStatus(uint256 _id) public view returns (Status) {
            require(students[_id].id != 0, "Student not found");
            return students[_id].status;
        }

        function deleteStudent(uint256 _id) public {
            require(students[_id].id != 0, "Student not found");
            delete students[_id];
        }

        

   
}
