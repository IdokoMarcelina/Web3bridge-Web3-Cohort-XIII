import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("multiSigModule", (m) => {
  const owners = [
    "0x742d35Cc6634C0532925a3b8D400d1e8c8b0b8e3",
    "0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5",
    "0xfe9e8709d3215310075d67e3ed32a380ccf451c8"
  ];

  const requiredConfirmations = 2;

  const multiSig = m.contract("MultiSig", [owners, requiredConfirmations]);

  return { multiSig };
});
