// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FloToken
 * @dev FlowAI utility token for platform economy
 * 
 * Token Details:
 * - Name: FlowAI Token
 * - Symbol: FLO
 * - Decimals: 18
 * - Network: Polygon (low gas fees)
 * 
 * Use Cases:
 * - Tip creators
 * - Boost clips
 * - Purchase bounties
 * - Platform rewards
 */
contract FloToken is ERC20, Ownable {
    // Platform address (can mint tokens when users purchase)
    address public platform;
    
    // Mapping of user addresses to their token balances (off-chain tracking)
    mapping(address => uint256) public earned;
    mapping(address => uint256) public spent;
    
    // Events
    event TokensPurchased(address indexed user, uint256 amount, uint256 usdValue);
    event TokensEarned(address indexed user, uint256 amount, string reason);
    event TokensSpent(address indexed user, uint256 amount, string purpose);
    event TokensCashedOut(address indexed user, uint256 amount);
    
    constructor(address initialOwner) ERC20("FlowAI Token", "FLO") Ownable(initialOwner) {
        platform = initialOwner;
        
        // Mint initial supply to platform (100M tokens)
        _mint(platform, 100_000_000 * 10**decimals());
    }
    
    /**
     * @dev Modifier to restrict calls to platform only
     */
    modifier onlyPlatform() {
        require(msg.sender == platform, "Only platform can call this");
        _;
    }
    
    /**
     * @dev Mint tokens to user when they purchase with fiat
     * Called by backend after Stripe payment succeeds
     */
    function mintToPurchaser(address user, uint256 amount, uint256 usdValue) 
        external 
        onlyPlatform 
    {
        _mint(user, amount);
        emit TokensPurchased(user, amount, usdValue);
    }
    
    /**
     * @dev Award tokens to user for platform activity
     * Examples: viewing content (PoA), creating content, referrals
     */
    function awardTokens(address user, uint256 amount, string memory reason) 
        external 
        onlyPlatform 
    {
        _mint(user, amount);
        earned[user] += amount;
        emit TokensEarned(user, amount, reason);
    }
    
    /**
     * @dev Burn tokens when user cashes out
     * Platform burns tokens and sends fiat via Stripe
     */
    function cashOut(address user, uint256 amount) 
        external 
        onlyPlatform 
    {
        require(balanceOf(user) >= amount, "Insufficient balance");
        _burn(user, amount);
        emit TokensCashedOut(user, amount);
    }
    
    /**
     * @dev Track token spending (tips, boosts, etc)
     * Transfer happens separately, this just tracks purpose
     */
    function recordSpending(address user, uint256 amount, string memory purpose) 
        external 
        onlyPlatform 
    {
        spent[user] += amount;
        emit TokensSpent(user, amount, purpose);
    }
    
    /**
     * @dev Update platform address (in case of migration)
     */
    function updatePlatform(address newPlatform) external onlyOwner {
        require(newPlatform != address(0), "Invalid address");
        platform = newPlatform;
    }
    
    /**
     * @dev Get user's earning/spending stats
     */
    function getUserStats(address user) 
        external 
        view 
        returns (
            uint256 balance,
            uint256 totalEarned,
            uint256 totalSpent
        ) 
    {
        return (
            balanceOf(user),
            earned[user],
            spent[user]
        );
    }
}
