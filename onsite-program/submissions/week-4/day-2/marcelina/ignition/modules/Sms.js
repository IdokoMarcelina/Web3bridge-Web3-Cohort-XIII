const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SchoolManagementSystemModule", (m) => {
  
  const schoolManagementSystem = m.contract("SchoolManagementSystem");

  return { schoolManagementSystem };
});