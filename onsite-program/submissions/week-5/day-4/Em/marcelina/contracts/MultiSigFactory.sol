// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./multiSig.sol";

contract MultiSigFactory {
    address[] public deployedWallets;

    event MultiSigCreated(address wallet, address[] owners, uint256 requiredConfirmations);

    function createMultiSig(address[] memory _owners, uint256 _requiredConfirmations) external returns (address) {
        MultiSig wallet = new MultiSig(_owners, _requiredConfirmations);
        deployedWallets.push(address(wallet));

        emit MultiSigCreated(address(wallet), _owners, _requiredConfirmations);
        return address(wallet);
    }

    function getDeployedWallets() external view returns (address[] memory) {
        return deployedWallets;
    }
}
