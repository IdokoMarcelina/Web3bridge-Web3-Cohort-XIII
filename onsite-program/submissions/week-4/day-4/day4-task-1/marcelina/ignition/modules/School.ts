// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const SchoolModule = buildModule("SchoolModule", (m) => {
  

  const school = m.contract("SchoolManagementSystem");

  return { school };
});

export default SchoolModule;
