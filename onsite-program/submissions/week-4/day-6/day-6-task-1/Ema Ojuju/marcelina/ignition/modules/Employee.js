

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EmployeeManagementSystem", (m) => {
  
  const EmployeeManagementSystem = m.contract("EmployeeManagementSystem");

  return { EmployeeManagementSystem };
});