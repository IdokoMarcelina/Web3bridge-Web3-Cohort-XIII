//SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Custom errors for better gas efficiency and clarity
error NotAuthorized(address caller);
error TeacherNotFound(address teacher);
error TeacherAlreadyExists(address teacher);
error TeacherNotEmployed(address teacher, string status);
error InsufficientContractBalance(uint256 required, uint256 available);
error InvalidSalaryAmount(uint256 amount);
error InvalidAddress(address addr);
error PaymentFailed(address teacher, uint256 amount);
error EmptyTeacherName();

// Interface for teacher management
interface ITeacherManagement {
    // Enums for teacher status
    enum EmploymentStatus { 
        UNEMPLOYED,     // 0 - Not employed
        EMPLOYED,       // 1 - Currently employed
        PROBATION,      // 2 - On probation
        TERMINATED      // 3 - Terminated
    }
    
    // Struct for teacher details
    struct Teacher {
        string name;
        address teacherAddress;
        uint256 salary;
        EmploymentStatus status;
        uint256 registrationDate;
        uint256 lastPaymentDate;
        uint256 totalPaymentsReceived;
    }
    
    // Events
    event TeacherRegistered(address indexed teacher, string name, uint256 salary);
    event TeacherStatusUpdated(address indexed teacher, EmploymentStatus oldStatus, EmploymentStatus newStatus);
    event SalaryUpdated(address indexed teacher, uint256 oldSalary, uint256 newSalary);
    event SalaryPaid(address indexed teacher, uint256 amount, uint256 timestamp);
    event FundsDeposited(address indexed depositor, uint256 amount);
    
    // Core functions
    function registerTeacher(address _teacher, string memory _name, uint256 _salary) external;
    function updateTeacherStatus(address _teacher, EmploymentStatus _status) external;
    function updateTeacherSalary(address _teacher, uint256 _newSalary) external;
    function paySalary(address _teacher) external;
    function getTeacherDetails(address _teacher) external view returns (Teacher memory);
    function isTeacherEmployed(address _teacher) external view returns (bool);
}

// Interface for salary disbursement
interface ISalaryDisbursement {
    function depositFunds() external payable;
    function withdrawFunds(uint256 _amount) external;
    function getContractBalance() external view returns (uint256);
    function batchPaySalaries(address[] memory _teachers) external;
}

// Main school management contract implementing the interfaces
contract SchoolManagementSystem is ITeacherManagement, ISalaryDisbursement {
    
    // State variables
    address public admin;
    address public principal;
    uint256 public totalTeachers;
    uint256 public totalSalariesPaid;
    
    // Mappings
    mapping(address => Teacher) public teachers;
    mapping(address => bool) public isRegisteredTeacher;
    address[] public teachersList;
    
    // Modifiers
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }
    
    modifier onlyAdminOrPrincipal() {
        if (msg.sender != admin && msg.sender != principal) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }
    
    modifier teacherExists(address _teacher) {
        if (!isRegisteredTeacher[_teacher]) {
            revert TeacherNotFound(_teacher);
        }
        _;
    }
    
    modifier validAddress(address _addr) {
        if (_addr == address(0)) {
            revert InvalidAddress(_addr);
        }
        _;
    }
    
    modifier validSalary(uint256 _salary) {
        if (_salary == 0) {
            revert InvalidSalaryAmount(_salary);
        }
        _;
    }
    
    // Constructor
    constructor(address _principal) validAddress(_principal) {
        admin = msg.sender;
        principal = _principal;
    }
    
    // Receive function to accept ether deposits
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    // ===========================================
    // TEACHER MANAGEMENT FUNCTIONS
    // ===========================================
    
    /**
     * @dev Register a new teacher
     * @param _teacher Address of the teacher
     * @param _name Name of the teacher
     * @param _salary Agreed salary amount in wei
     */
    function registerTeacher(
        address _teacher, 
        string memory _name, 
        uint256 _salary
    ) 
        external 
        override 
        onlyAdminOrPrincipal 
        validAddress(_teacher)
        validSalary(_salary)
    {
        if (isRegisteredTeacher[_teacher]) {
            revert TeacherAlreadyExists(_teacher);
        }
        
        if (bytes(_name).length == 0) {
            revert EmptyTeacherName();
        }
        
        // Create teacher record
        teachers[_teacher] = Teacher({
            name: _name,
            teacherAddress: _teacher,
            salary: _salary,
            status: EmploymentStatus.EMPLOYED,
            registrationDate: block.timestamp,
            lastPaymentDate: 0,
            totalPaymentsReceived: 0
        });
        
        isRegisteredTeacher[_teacher] = true;
        teachersList.push(_teacher);
        totalTeachers++;
        
        emit TeacherRegistered(_teacher, _name, _salary);
    }
    
    /**
     * @dev Update teacher employment status
     * @param _teacher Address of the teacher
     * @param _status New employment status
     */
    function updateTeacherStatus(address _teacher, EmploymentStatus _status) 
        external 
        override 
        onlyAdminOrPrincipal 
        teacherExists(_teacher) 
    {
        EmploymentStatus oldStatus = teachers[_teacher].status;
        teachers[_teacher].status = _status;
        
        emit TeacherStatusUpdated(_teacher, oldStatus, _status);
    }
    
    /**
     * @dev Update teacher salary
     * @param _teacher Address of the teacher
     * @param _newSalary New salary amount
     */
    function updateTeacherSalary(address _teacher, uint256 _newSalary) 
        external 
        override 
        onlyAdminOrPrincipal 
        teacherExists(_teacher)
        validSalary(_newSalary)
    {
        uint256 oldSalary = teachers[_teacher].salary;
        teachers[_teacher].salary = _newSalary;
        
        emit SalaryUpdated(_teacher, oldSalary, _newSalary);
    }
    
    /**
     * @dev Pay salary to a specific teacher
     * @param _teacher Address of the teacher
     */
    function paySalary(address _teacher) 
        external 
        override 
        onlyAdminOrPrincipal 
        teacherExists(_teacher) 
    {
        Teacher storage teacher = teachers[_teacher];
        
        // Check if teacher is employed or on probation (both can receive salary)
        if (teacher.status != EmploymentStatus.EMPLOYED && 
            teacher.status != EmploymentStatus.PROBATION) {
            revert TeacherNotEmployed(_teacher, _getStatusString(teacher.status));
        }
        
        uint256 salaryAmount = teacher.salary;
        
        // Check contract balance
        if (address(this).balance < salaryAmount) {
            revert InsufficientContractBalance(salaryAmount, address(this).balance);
        }
        
        // Update teacher records before transfer (CEI pattern)
        teacher.lastPaymentDate = block.timestamp;
        teacher.totalPaymentsReceived += salaryAmount;
        totalSalariesPaid += salaryAmount;
        
        // Transfer salary using call for better gas handling
        (bool success, ) = payable(_teacher).call{value: salaryAmount}("");
        if (!success) {
            // Revert the state changes if payment fails
            teacher.lastPaymentDate = 0;
            teacher.totalPaymentsReceived -= salaryAmount;
            totalSalariesPaid -= salaryAmount;
            revert PaymentFailed(_teacher, salaryAmount);
        }
        
        emit SalaryPaid(_teacher, salaryAmount, block.timestamp);
    }
    
    /**
     * @dev Batch pay salaries to multiple teachers
     * @param _teachers Array of teacher addresses
     */
    function batchPaySalaries(address[] memory _teachers) external override onlyAdminOrPrincipal {
        for (uint256 i = 0; i < _teachers.length; i++) {
            address teacher = _teachers[i];
            
            // Skip if teacher doesn't exist or isn't employed
            if (!isRegisteredTeacher[teacher]) continue;
            if (teachers[teacher].status != EmploymentStatus.EMPLOYED && 
                teachers[teacher].status != EmploymentStatus.PROBATION) continue;
            
            // Skip if insufficient balance
            if (address(this).balance < teachers[teacher].salary) continue;
            
            // Pay salary (internal call to avoid external call restrictions)
            _paySalaryInternal(teacher);
        }
    }
    
    /**
     * @dev Internal function to pay salary (used by batch payment)
     */
    function _paySalaryInternal(address _teacher) internal {
        Teacher storage teacher = teachers[_teacher];
        uint256 salaryAmount = teacher.salary;
        
        // Update records
        teacher.lastPaymentDate = block.timestamp;
        teacher.totalPaymentsReceived += salaryAmount;
        totalSalariesPaid += salaryAmount;
        
        // Transfer salary
        (bool success, ) = payable(_teacher).call{value: salaryAmount}("");
        if (success) {
            emit SalaryPaid(_teacher, salaryAmount, block.timestamp);
        } else {
            // Revert state changes if payment fails
            teacher.lastPaymentDate = 0;
            teacher.totalPaymentsReceived -= salaryAmount;
            totalSalariesPaid -= salaryAmount;
        }
    }
    
    // ===========================================
    // SALARY DISBURSEMENT FUNCTIONS
    // ===========================================
    
    /**
     * @dev Deposit funds to the contract
     */
    function depositFunds() external payable override {
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw funds from contract (admin only)
     * @param _amount Amount to withdraw
     */
    function withdrawFunds(uint256 _amount) external override onlyAdmin {
        if (address(this).balance < _amount) {
            revert InsufficientContractBalance(_amount, address(this).balance);
        }
        
        (bool success, ) = payable(admin).call{value: _amount}("");
        if (!success) {
            revert PaymentFailed(admin, _amount);
        }
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view override returns (uint256) {
        return address(this).balance;
    }
    
    // ===========================================
    // VIEW FUNCTIONS
    // ===========================================
    
    /**
     * @dev Get teacher details
     * @param _teacher Address of the teacher
     */
    function getTeacherDetails(address _teacher) 
        external 
        view 
        override 
        teacherExists(_teacher) 
        returns (Teacher memory) 
    {
        return teachers[_teacher];
    }
    
    /**
     * @dev Check if teacher is currently employed
     * @param _teacher Address of the teacher
     */
    function isTeacherEmployed(address _teacher) 
        external 
        view 
        override 
        returns (bool) 
    {
        if (!isRegisteredTeacher[_teacher]) return false;
        return teachers[_teacher].status == EmploymentStatus.EMPLOYED;
    }
    
    /**
     * @dev Get all teachers (pagination recommended for large datasets)
     */
    function getAllTeachers() external view returns (address[] memory) {
        return teachersList;
    }
    
    /**
     * @dev Get teachers by status
     * @param _status Employment status to filter by
     */
    function getTeachersByStatus(EmploymentStatus _status) 
        external 
        view 
        returns (address[] memory) 
    {
        address[] memory result = new address[](totalTeachers);
        uint256 count = 0;
        
        for (uint256 i = 0; i < teachersList.length; i++) {
            if (teachers[teachersList[i]].status == _status) {
                result[count] = teachersList[i];
                count++;
            }
        }
        
        // Resize array to actual count
        address[] memory finalResult = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
    /**
     * @dev Get school statistics
     */
    function getSchoolStats() external view returns (
        uint256 _totalTeachers,
        uint256 _employedTeachers,
        uint256 _probationTeachers,
        uint256 _totalSalariesPaid,
        uint256 _contractBalance
    ) {
        uint256 employed = 0;
        uint256 probation = 0;
        
        for (uint256 i = 0; i < teachersList.length; i++) {
            if (teachers[teachersList[i]].status == EmploymentStatus.EMPLOYED) {
                employed++;
            } else if (teachers[teachersList[i]].status == EmploymentStatus.PROBATION) {
                probation++;
            }
        }
        
        return (
            totalTeachers,
            employed,
            probation,
            totalSalariesPaid,
            address(this).balance
        );
    }
    
    // ===========================================
    // ADMIN FUNCTIONS
    // ===========================================
    
    /**
     * @dev Change principal (admin only)
     * @param _newPrincipal Address of new principal
     */
    function changePrincipal(address _newPrincipal) 
        external 
        onlyAdmin 
        validAddress(_newPrincipal) 
    {
        principal = _newPrincipal;
    }
    
    /**
     * @dev Transfer admin role (current admin only)
     * @param _newAdmin Address of new admin
     */
    function transferAdmin(address _newAdmin) 
        external 
        onlyAdmin 
        validAddress(_newAdmin) 
    {
        admin = _newAdmin;
    }
    
    // ===========================================
    // HELPER FUNCTIONS
    // ===========================================
    
    /**
     * @dev Convert employment status enum to string
     */
    function _getStatusString(EmploymentStatus _status) internal pure returns (string memory) {
        if (_status == EmploymentStatus.UNEMPLOYED) return "UNEMPLOYED";
        if (_status == EmploymentStatus.EMPLOYED) return "EMPLOYED";
        if (_status == EmploymentStatus.PROBATION) return "PROBATION";
        if (_status == EmploymentStatus.TERMINATED) return "TERMINATED";
        return "UNKNOWN";
    }
    
    /**
     * @dev Get employment status as string
     * @param _teacher Address of the teacher
     */
    function getTeacherStatusString(address _teacher) 
        external 
        view 
        teacherExists(_teacher) 
        returns (string memory) 
    {
        return _getStatusString(teachers[_teacher].status);
    }
}