const { ethers } = require("hardhat");

async function main() {
  const name = "MyToken";
  const symbol = "MTK";
  const decimals = 18;

  const ERC20 = await ethers.getContractFactory("ERC20");
  const erc20 = await ERC20.deploy(name, symbol, decimals);

  await erc20.deployed();

  console.log(`ERC20 deployed to: ${erc20.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
