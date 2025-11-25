// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FloToken
 * @dev FlowAI utility token for platform economy
 * 
 * Token Details:
 * - Name: FlowAI Token
 * - Symbol: FLO
 * - Decimals: 18
 * - Network: Polygon (low gas fees)
 * - Max Supply: 1,000,000,000 (1 Billion)
 * 
 * Use Cases:
 * - Tip creators
 * - Boost clips
 * - Purchase bounties
 * - Platform rewards
 */
contract FloToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Max Supply: 1 Billion Tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    // Mapping of user addresses to their token balances (off-chain tracking)
    mapping(address => uint256) public earned;
    mapping(address => uint256) public spent;
    
    // Events
    event TokensPurchased(address indexed user, uint256 amount, uint256 usdValue);
    event TokensEarned(address indexed user, uint256 amount, string reason);
    event TokensSpent(address indexed user, uint256 amount, string purpose);
    event TokensCashedOut(address indexed user, uint256 amount);
    
    constructor(address initialAdmin) ERC20("FlowAI Token", "FLO") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
        
        // Mint initial supply to admin (100M tokens)
        _mint(initialAdmin, 100_000_000 * 10**decimals());
    }
    
    /**
     * @dev Pause token transfers in case of emergency
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Hook to check pause status before transfer
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "ERC20Pausable: token transfer while paused");
    }

    /**
     * @dev Generic mint function for authorized roles (e.g. Staking contract)
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Mint tokens to user when they purchase with fiat
     * Called by backend after Stripe payment succeeds
     */
    function mintToPurchaser(address user, uint256 amount, uint256 usdValue) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(user, amount);
        emit TokensPurchased(user, amount, usdValue);
    }
    
    /**
     * @dev Award tokens to user for platform activity
     * Examples: viewing content (PoA), creating content, referrals
     */
    function awardTokens(address user, uint256 amount, string memory reason) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
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
        onlyRole(MINTER_ROLE) 
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
        onlyRole(MINTER_ROLE) 
    {
        spent[user] += amount;
        emit TokensSpent(user, amount, purpose);
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
