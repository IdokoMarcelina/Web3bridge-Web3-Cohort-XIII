// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IERC7432.sol";

contract DAOMembershipNFT is ERC721, ERC721Enumerable, Ownable, IERC7432 {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    // Role definitions
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Mapping from role => tokenId => account => Role struct
    mapping(bytes32 => mapping(uint256 => mapping(address => Role))) private _roles;
    
    constructor() ERC721("DAO Membership NFT", "DAONFT") {}
    
    function mint(address to) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        _mint(to, tokenId);
        return tokenId;
    }
    
    function grantRole(
        bytes32 role,
        uint256 tokenId,
        address account,
        uint64 expirationDate,
        bool revocable,
        bytes calldata data
    ) external override {
        require(_exists(tokenId), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || owner() == msg.sender,
            "Not authorized to grant role"
        );
        
        _roles[role][tokenId][account] = Role({
            role: role,
            account: account,
            tokenId: tokenId,
            expirationDate: expirationDate,
            revocable: revocable,
            data: data
        });
        
        emit RoleGranted(role, tokenId, account, expirationDate, revocable, data);
    }
    
    function revokeRole(bytes32 role, uint256 tokenId, address account) external override {
        require(_exists(tokenId), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || 
            owner() == msg.sender ||
            (_roles[role][tokenId][account].revocable && _roles[role][tokenId][account].account == msg.sender),
            "Not authorized to revoke role"
        );
        
        delete _roles[role][tokenId][account];
        emit RoleRevoked(role, tokenId, account);
    }
    
    function hasRole(bytes32 role, uint256 tokenId, address account) external view override returns (bool) {
        Role memory userRole = _roles[role][tokenId][account];
        return userRole.account != address(0) && 
               (userRole.expirationDate == 0 || userRole.expirationDate > block.timestamp);
    }
    
    function roleData(bytes32 role, uint256 tokenId, address account) external view override returns (bytes memory) {
        return _roles[role][tokenId][account].data;
    }
    
    function roleExpirationDate(bytes32 role, uint256 tokenId, address account) external view override returns (uint64) {
        return _roles[role][tokenId][account].expirationDate;
    }
    
    function isRoleRevocable(bytes32 role, uint256 tokenId, address account) external view override returns (bool) {
        return _roles[role][tokenId][account].revocable;
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return interfaceId == type(IERC7432).interfaceId || super.supportsInterface(interfaceId);
    }
    
    function _beforeTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
}

}