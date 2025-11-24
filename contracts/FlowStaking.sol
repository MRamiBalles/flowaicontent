// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FlowToken.sol";

contract FlowStaking is ReentrancyGuard, Ownable {
    FlowToken public flowToken;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 claimedRewards;
    }

    mapping(address => StakeInfo) public stakes;
    
    // Reward rate: 1 FLOW per second per 1000 staked (Example APY)
    uint256 public constant REWARD_RATE = 1; 
    uint256 public constant REWARD_DIVISOR = 1000;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _flowToken) Ownable(msg.sender) {
        flowToken = FlowToken(_flowToken);
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        
        // Transfer tokens from user to contract
        flowToken.transferFrom(msg.sender, address(this), _amount);

        // Update stake info
        if (stakes[msg.sender].amount > 0) {
            uint256 pending = calculateReward(msg.sender);
            stakes[msg.sender].claimedRewards += pending;
        }
        
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].timestamp = block.timestamp;
        
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external nonReentrant {
        require(stakes[msg.sender].amount >= _amount, "Insufficient stake");

        // Claim pending rewards first
        claimReward();

        stakes[msg.sender].amount -= _amount;
        flowToken.transfer(msg.sender, _amount);
        
        emit Withdrawn(msg.sender, _amount);
    }

    function claimReward() public nonReentrant {
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            stakes[msg.sender].timestamp = block.timestamp; // Reset timer
            // Mint new tokens as reward (Contract must have MINTER_ROLE)
            flowToken.mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function calculateReward(address _user) public view returns (uint256) {
        StakeInfo memory info = stakes[_user];
        if (info.amount == 0) return 0;

        uint256 duration = block.timestamp - info.timestamp;
        return (info.amount * duration * REWARD_RATE) / REWARD_DIVISOR;
    }
}
