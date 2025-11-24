// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BountyEscrow
 * @dev Smart contract for brand bounties marketplace
 * Brands post bounties → Creators submit → Voting → Winner gets paid
 */
contract BountyEscrow is ReentrancyGuard, Ownable {
    
    struct Bounty {
        bytes32 id;
        address brand;
        uint256 amount;
        uint256 deadline;
        string requirements;
        BountyStatus status;
        uint256 votingEndTime;
    }
    
    struct Entry {
        bytes32 bountyId;
        address creator;
        string videoUrl;
        uint256 voteCount;
        bool withdrawn;
    }
    
    enum BountyStatus {
        Active,
        VotingPeriod,
        Completed,
        Cancelled
    }
    
    // State variables
    mapping(bytes32 => Bounty) public bounties;
    mapping(bytes32 => Entry[]) public bountyEntries;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    uint256 public platformFeePercent = 15; // 15% platform fee
    address public platformWallet;
    
    // Events
    event BountyCreated(bytes32 indexed bountyId, address indexed brand, uint256 amount);
    event EntrySubmitted(bytes32 indexed bountyId, address indexed creator, bytes32 entryId);
    event VoteCast(bytes32 indexed bountyId, bytes32 indexed entryId, address voter);
    event BountyCompleted(bytes32 indexed bountyId, address indexed winner, uint256 amount);
    event BountyCancelled(bytes32 indexed bountyId);
    
    constructor(address _platformWallet) {
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Create new bounty with escrow
     */
    function createBounty(
        bytes32 bountyId,
        uint256 deadline,
        string memory requirements
    ) external payable {
        require(msg.value > 0, "Bounty amount must be greater than 0");
        require(bounties[bountyId].amount == 0, "Bounty ID already exists");
        require(deadline > block.timestamp, "Deadline must be in future");
        
        bounties[bountyId] = Bounty({
            id: bountyId,
            brand: msg.sender,
            amount: msg.value,
            deadline: deadline,
            requirements: requirements,
            status: BountyStatus.Active,
            votingEndTime: 0
        });
        
        emit BountyCreated(bountyId, msg.sender, msg.value);
    }
    
    /**
     * @dev Submit entry to bounty
     */
    function submitEntry(
        bytes32 bountyId,
        string memory videoUrl
    ) external {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.amount > 0, "Bounty does not exist");
        require(bounty.status == BountyStatus.Active, "Bounty not active");
        require(block.timestamp < bounty.deadline, "Bounty deadline passed");
        
        bytes32 entryId = keccak256(abi.encodePacked(bountyId, msg.sender, block.timestamp));
        
        bountyEntries[bountyId].push(Entry({
            bountyId: bountyId,
            creator: msg.sender,
            videoUrl: videoUrl,
            voteCount: 0,
            withdrawn: false
        }));
        
        emit EntrySubmitted(bountyId, msg.sender, entryId);
    }
    
    /**
     * @dev Start voting period (called after deadline)
     */
    function startVoting(bytes32 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.amount > 0, "Bounty does not exist");
        require(bounty.status == BountyStatus.Active, "Bounty not active");
        require(block.timestamp >= bounty.deadline, "Deadline not reached");
        require(bountyEntries[bountyId].length > 0, "No entries submitted");
        
        bounty.status = BountyStatus.VotingPeriod;
        bounty.votingEndTime = block.timestamp + 7 days;
    }
    
    /**
     * @dev Cast vote for entry
     */
    function vote(bytes32 bountyId, uint256 entryIndex) external {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.status == BountyStatus.VotingPeriod, "Not in voting period");
        require(block.timestamp < bounty.votingEndTime, "Voting period ended");
        require(!hasVoted[bountyId][msg.sender], "Already voted");
        require(entryIndex < bountyEntries[bountyId].length, "Invalid entry index");
        
        hasVoted[bountyId][msg.sender] = true;
        bountyEntries[bountyId][entryIndex].voteCount++;
        
        bytes32 entryId = keccak256(abi.encodePacked(
            bountyId,
            bountyEntries[bountyId][entryIndex].creator,
            entryIndex
        ));
        
        emit VoteCast(bountyId, entryId, msg.sender);
    }
    
    /**
     * @dev Release funds to winner after voting
     */
    function releaseFunds(bytes32 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.amount > 0, "Bounty does not exist");
        require(bounty.status == BountyStatus.VotingPeriod, "Not in voting period");
        require(block.timestamp >= bounty.votingEndTime, "Voting still active");
        
        // Find winner (most votes)
        uint256 winningIndex = 0;
        uint256 highestVotes = 0;
        
        for (uint256 i = 0; i < bountyEntries[bountyId].length; i++) {
            if (bountyEntries[bountyId][i].voteCount > highestVotes) {
                highestVotes = bountyEntries[bountyId][i].voteCount;
                winningIndex = i;
            }
        }
        
        require(highestVotes > 0, "No votes cast");
        
        Entry storage winningEntry = bountyEntries[bountyId][winningIndex];
        
        // Calculate amounts
        uint256 platformFee = (bounty.amount * platformFeePercent) / 100;
        uint256 creatorPayout = bounty.amount - platformFee;
        
        // Mark completed
        bounty.status = BountyStatus.Completed;
        
        // Transfer funds
        payable(platformWallet).transfer(platformFee);
        payable(winningEntry.creator).transfer(creatorPayout);
        
        emit BountyCompleted(bountyId, winningEntry.creator, creatorPayout);
    }
    
    /**
     * @dev Cancel bounty and refund (only before deadline)
     */
    function cancelBounty(bytes32 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.amount > 0, "Bounty does not exist");
        require(msg.sender == bounty.brand, "Only brand can cancel");
        require(bounty.status == BountyStatus.Active, "Bounty not active");
        require(block.timestamp < bounty.deadline, "Cannot cancel after deadline");
        
        uint256 refundAmount = bounty.amount;
        bounty.status = BountyStatus.Cancelled;
        bounty.amount = 0;
        
        payable(msg.sender).transfer(refundAmount);
        
        emit BountyCancelled(bountyId);
    }
    
    /**
     * @dev Get entries for bounty
     */
    function getEntries(bytes32 bountyId) external view returns (Entry[] memory) {
        return bountyEntries[bountyId];
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 20, "Fee cannot exceed 20%");
        platformFeePercent = newFeePercent;
    }
    
    /**
     * @dev Update platform wallet (only owner)
     */
    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        platformWallet = newWallet;
    }
}
