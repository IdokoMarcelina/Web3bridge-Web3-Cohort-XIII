// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SVGTimeNFTModule = buildModule("SVGTimeNFTModule", (m) => {


  const SVGTimeNFT = m.contract("SVGTimeNFT");

  return { SVGTimeNFT };
});

export default SVGTimeNFTModule;
