import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { assert, expect } from "chai";
import hre, { ethers } from "hardhat";


const NAME = "Mimi";
const SALARY = ethers.parseEther("100");

describe("Employee", function () {

  async function deployemployeefixture() {
    const [owner, address1, ...otherAccount] = await hre.ethers.getSigners();

    const Employee = await hre.ethers.getContractFactory("EmployeeManagementSystem");
    const employee = await Employee.deploy();

    return { employee, address1, owner, otherAccount };
  }

  describe("Register", function () {
    it("Should be able to register a new employee", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, SALARY);

      const employeeDetails = await employee.get_staff_details(address1);
      expect(employeeDetails.fullName).to.equal(NAME);
      expect(employeeDetails.salary).to.equal(SALARY);
      expect(employeeDetails.role).to.equal(0);
    });

    it("Should not allow registering an employee if not owner", async function () {
      const { employee, address1 } = await loadFixture(deployemployeefixture);

      const register = employee.registerStaff(address1, NAME, SALARY) ;
      await expect(register).to.be.revertedWithCustomError(employee, "NotAuthorized");
    });

    it("Should not be able to register already exist employee", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);

      await employee.registerStaff(address1, NAME, SALARY);
      const fake =  employee.registerStaff(address1, NAME, SALARY);

      await expect(fake).to.be.revertedWithCustomError(employee, "AlreadyRegistered");
     
    });
  });

  describe("Update Role", function () {
   
    it("Should be able to update employee role", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, SALARY);

      await employee.updateEmployeeRole(address1, 1);
      const employeeDetails = await employee.get_staff_details(address1);
      expect(employeeDetails.role).to.eq(1);
    });

    it("Should not be able to update employee role if not owner", async function () {
      const { employee, address1, owner, otherAccount } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, 0);

      const update = employee.updateEmployeeRole(address1, 1);
      await expect(update).to.be.revertedWithCustomError(employee, "StaffNotFound");
    });

  });

  describe("Update Status", function () {
    it("Should be able to update employee status", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, SALARY);

      await employee.updateStatus(address1, 1);
      const employeeDetails = await employee.get_staff_details(address1);
      expect(employeeDetails.status).to.eq(1);
    });

    it("should check that salary is greater than zero", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, 0);

      const update = employee.updateStatus(address1, 1);
      await expect(update).to.be.revertedWithCustomError(employee, "StaffNotFound");
    });
    
  });

  describe("Pay Salary", function () {
    it("Should be able to pay employee salary", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, SALARY);

      const balanceBefore = await ethers.provider.getBalance(address1);
      await employee.paySalary(address1, { value: SALARY });
      const balanceAfter = await ethers.provider.getBalance(address1);

      expect(balanceAfter).to.equal(balanceBefore + SALARY);
    });

    it("Should not allow paying salary if employee is not registered", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);

      const pay = employee.paySalary(address1, { value: SALARY });
      await expect(pay).to.be.revertedWithCustomError(employee, "StaffNotFound");
    });
    

  })

  describe("Get Staff", function () {
    it("Should be able to get all staff", async function () {
      const { employee, address1, owner } = await loadFixture(deployemployeefixture);

      await employee.setOwner(owner);
      await employee.registerStaff(address1, NAME, SALARY);

      const staffDetails = await employee.get_staff_details(address1);
      expect(staffDetails.fullName).to.equal(NAME);
      expect(staffDetails.salary).to.equal(SALARY);
      expect(staffDetails.role).to.equal(0);
    });
  });

    // it("Should not allow paying salary if not enough contract balance", async function () {
    //   const { employee, address1, owner } = await loadFixture(deployemployeefixture);

    //   await employee.setOwner(owner);
    //   await employee.registerStaff(address1, NAME, SALARY);

    //   const pay = employee.paySalary(address1, { value: ethers.parseEther("50") });
    //   await expect(pay).to.be.revertedWithCustomError(employee, "InsufficientContractBalance");
    // });

  // }

  
});
  