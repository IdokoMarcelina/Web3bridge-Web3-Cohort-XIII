// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IERC7432.sol";
import "../tokens/DAOMembershipNFT.sol";

contract TokenGatedDAO is Ownable {
    using Counters for Counters.Counter;
    
    DAOMembershipNFT public membershipNFT;
    Counters.Counter private _proposalIds;
    
    enum ProposalStatus { Pending, Active, Succeeded, Defeated, Executed }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public votingPeriod = 3 days;
    uint256 public quorum = 2; // Minimum votes needed
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor(address _membershipNFT) {
        membershipNFT = DAOMembershipNFT(_membershipNFT);
    }
    
    modifier hasProposerRole() {
        require(checkRole(membershipNFT.PROPOSER_ROLE(), msg.sender), "Not authorized to propose");
        _;
    }
    
    modifier hasVoterRole() {
        require(checkRole(membershipNFT.VOTER_ROLE(), msg.sender), "Not authorized to vote");
        _;
    }
    
    function checkRole(bytes32 role, address account) public view returns (bool) {
        uint256 balance = membershipNFT.balanceOf(account);
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = membershipNFT.tokenOfOwnerByIndex(account, i);
            if (membershipNFT.hasRole(role, tokenId, account)) {
                return true;
            }
        }
        return false;
    }
    
    function createProposal(string calldata description) external hasProposerRole returns (uint256) {
        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();
        
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.status = ProposalStatus.Active;
        
        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external hasVoterRole {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }
        
        emit VoteCast(proposalId, msg.sender, support);
        
        // Check if proposal should be finalized
        if (block.timestamp > proposal.endTime) {
            _finalizeProposal(proposalId);
        }
    }
    
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        
        _finalizeProposal(proposalId);
    }
    
    function _finalizeProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        
        if (totalVotes >= quorum && proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Succeeded;
        } else {
            proposal.status = ProposalStatus.Defeated;
        }
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Succeeded, "Proposal not succeeded");
        
        proposal.status = ProposalStatus.Executed;
        emit ProposalExecuted(proposalId);
        
        // Add custom execution logic here
    }
    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 startTime,
        uint256 endTime,
        ProposalStatus status
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.status
        );
    }
    
    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }
    
    function setQuorum(uint256 _quorum) external onlyOwner {
        quorum = _quorum;
    }
}