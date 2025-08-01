const { vars } = require("hardhat/config");

require("@nomicfoundation/hardhat-toolbox");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
   'lisk-sepolia':{

    url: "https://rpc.sepolia-api.lisk.com",
    accounts: [vars.get("PRIVATE_KEY")], 

    }},
  }
