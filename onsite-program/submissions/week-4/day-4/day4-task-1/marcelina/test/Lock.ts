import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagementSystem", function () {
  const Status = {
    ACTIVE: 0,
    DEFERRED: 1,
    RUSTICATED: 2
  };

  async function deploySchoolFixture() {
    const [owner, addr1, addr2, ...otherAccounts] = await hre.ethers.getSigners();

    const SchoolManagementSystem = await hre.ethers.getContractFactory("SchoolManagementSystem");
    const sms = await SchoolManagementSystem.deploy();

    return { sms, owner, addr1, addr2, otherAccounts };
  }

  // describe("Deployment", function () {
  //   it("Should deploy successfully", async function () {
  //     const { sms } = await loadFixture(deploySchoolFixture);
  //     expect(sms.address).to.properAddress;
  //   });
  // });

  describe("Student Registration", function () {
    it("Should register a student successfully", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Mimi", 20);
      
      const student = await sms.getStudent(1);
      expect(student.id).to.equal(1);
      expect(student.name).to.equal("Mimi");
      expect(student.age).to.equal(20);
      expect(student.status).to.equal(Status.ACTIVE);
    });

    it("Should increment student ID for each registration", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Mimi", 20);
      await sms.registerStudent("John", 22);
      
      const student1 = await sms.getStudent(1);
      const student2 = await sms.getStudent(2);
      
      expect(student1.id).to.equal(1);
      expect(student2.id).to.equal(2);
    });

    it("Should revert when age is 0", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await expect(sms.registerStudent("Mimi", 0)).to.be.revertedWith("Age must be greater than 0");
    });

    it("Should set default status to ACTIVE", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Test Student", 21);
      const student = await sms.getStudent(1);
      expect(student.status).to.equal(Status.ACTIVE);
    });
  });

  describe("Student Updates", function () {
    it("Should update student name and age successfully", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.updateStudent(1, "Alice Johnson", 21);
      
      const student = await sms.getStudent(1);
      expect(student.name).to.equal("Alice Johnson");
      expect(student.age).to.equal(21);
      expect(student.id).to.equal(1);
    });

    it("Should revert when updating non-existent student", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await expect(
        sms.updateStudent(999, "Non-existent", 25)
      ).to.be.revertedWith("Student not found");
    });

    it("Should revert when updating with age 0", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await expect(
        sms.updateStudent(1, "Alice Johnson", 0)
      ).to.be.revertedWith("Age must be greater than 0");
    });
  });

  describe("Student Retrieval", function () {
    it("Should get student by ID successfully", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      
      const student = await sms.getStudent(1);
      expect(student.id).to.equal(1);
      expect(student.name).to.equal("Alice Smith");
      expect(student.age).to.equal(20);
      expect(student.status).to.equal(Status.ACTIVE);
    });

    it("Should revert when getting non-existent student", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await expect(
        sms.getStudent(999)
      ).to.be.revertedWith("Student not found");
    });

    it("Should get all students successfully", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.registerStudent("Bob Johnson", 22);
      
      const allStudents = await sms.getAllStudents();
      
      expect(allStudents.length).to.equal(2);
      expect(allStudents[0].name).to.equal("Alice Smith");
      expect(allStudents[1].name).to.equal("Bob Johnson");
    });
  });

  describe("Student Status Management", function () {
    it("Should set student status to DEFERRED", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.setStudentStatus(1, Status.DEFERRED);
      
      const status = await sms.getStudentStatus(1);
      expect(status).to.equal(Status.DEFERRED);
    });

    it("Should set student status to RUSTICATED", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.setStudentStatus(1, Status.RUSTICATED);
      
      const status = await sms.getStudentStatus(1);
      expect(status).to.equal(Status.RUSTICATED);
    });

    it("Should revert when setting status for non-existent student", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await expect(
        sms.setStudentStatus(999, Status.DEFERRED)
      ).to.be.revertedWith("Student not found");
    });
  });

  describe("Student Deletion", function () {
    it("Should delete student successfully", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.deleteStudent(1);
      
      await expect(
        sms.getStudent(1)
      ).to.be.revertedWith("Student not found");
    });

    it("Should revert when deleting non-existent student", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await expect(
        sms.deleteStudent(999)
      ).to.be.revertedWith("Student not found");
    });

    it("Should not affect other students when deleting one", async function () {
      const { sms } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.registerStudent("Bob Johnson", 22);
      
      await sms.deleteStudent(1);
      
      const student2 = await sms.getStudent(2);
      expect(student2.name).to.equal("Bob Johnson");
      expect(student2.age).to.equal(22);
    });
  });

  describe("Access Control", function () {
    it("Should allow any address to register students", async function () {
      const { sms, addr1 } = await loadFixture(deploySchoolFixture);
      
      await sms.connect(addr1).registerStudent("Student by Addr1", 25);
      const student = await sms.getStudent(1);
      expect(student.name).to.equal("Student by Addr1");
    });

    it("Should allow any address to update students", async function () {
      const { sms, addr2 } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.connect(addr2).updateStudent(1, "Updated by Addr2", 30);
      
      const student = await sms.getStudent(1);
      expect(student.name).to.equal("Updated by Addr2");
    });

    it("Should allow any address to change student status", async function () {
      const { sms, addr1 } = await loadFixture(deploySchoolFixture);
      
      await sms.registerStudent("Alice Smith", 20);
      await sms.connect(addr1).setStudentStatus(1, Status.DEFERRED);
      
      const status = await sms.getStudentStatus(1);
      expect(status).to.equal(Status.DEFERRED);
    });

  
  });
});