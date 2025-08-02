

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Error {
    error AlreadyRegistered();
    error StaffNotFound();
    error NotEligibleForPayment();
    error InsufficientContractBalance();
    error NotAuthorized();
}
