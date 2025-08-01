
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AccessManagerModule", (m) => {
  
  const accessManager = m.contract("Web3BridgeGarageAccess");

  return { accessManager };
});