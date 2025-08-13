
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC7432 {
    struct Role {
        bytes32 role;
        address account;
        uint256 tokenId;
        uint64 expirationDate;
        bool revocable;
        bytes data;
    }

    event RoleGranted(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed account,
        uint64 expirationDate,
        bool revocable,
        bytes data
    );

    event RoleRevoked(
        bytes32 indexed role,
        uint256 indexed tokenId,
        address indexed account
    );

    function grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external;

    function revokeRole(bytes32 role, uint256 tokenId, address account) external;

    function hasRole(bytes32 role, uint256 tokenId, address account) external view returns (bool);

    function roleData(bytes32 role, uint256 tokenId, address account) external view returns (bytes memory);

    function roleExpirationDate(bytes32 role, uint256 tokenId, address account) external view returns (uint64);

    function isRoleRevocable(bytes32 role, uint256 tokenId, address account) external view returns (bool);
}