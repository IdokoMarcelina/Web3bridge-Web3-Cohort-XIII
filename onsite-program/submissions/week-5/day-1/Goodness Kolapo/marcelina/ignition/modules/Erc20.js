const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Erc20Module", (m) => {
  // Define constructor parameters
  const name = "MyToken";
  const symbol = "MTK";
  const decimals = 18;

  // Deploy the ERC20 contract with constructor arguments
  const erc20 = m.contract("ERC20", [name, symbol, decimals]);

  return { erc20 };
});