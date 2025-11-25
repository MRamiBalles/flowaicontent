// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalNFT is ERC20, ERC721Holder, Ownable {
    IERC721 public nftContract;
    uint256 public nftId;
    bool public initialized = false;

    // Dividend Tracking
    uint256 public constant MAGNITUDE = 2**128;
    uint256 public magnifiedDividendPerShare;
    mapping(address => int256) public magnifiedDividendCorrections;
    mapping(address => uint256) public withdrawnDividends;
    uint256 public totalDividendsDistributed;

    event DividendsDistributed(address indexed from, uint256 amount);
    event DividendWithdrawn(address indexed to, uint256 amount);

    constructor() ERC20("FlowAI Fractional Share", "F-SHARE") Ownable(msg.sender) {}

    function initialize(address _nftContract, uint256 _nftId, uint256 _supply) external onlyOwner {
        require(!initialized, "Already initialized");
        nftContract = IERC721(_nftContract);
        nftId = _nftId;

        // Transfer NFT to this contract (must be approved first)
        nftContract.safeTransferFrom(msg.sender, address(this), nftId);

        // Mint shares to owner
        _mint(msg.sender, _supply);
        initialized = true;
    }

    // Allow receiving revenue (royalties)
    receive() external payable {
        distributeDividends();
    }

    function distributeDividends() public payable {
        require(totalSupply() > 0, "No shares to distribute to");
        if (msg.value > 0) {
            magnifiedDividendPerShare = magnifiedDividendPerShare + (msg.value * MAGNITUDE / totalSupply());
            totalDividendsDistributed = totalDividendsDistributed + msg.value;
            emit DividendsDistributed(msg.sender, msg.value);
        }
    }

    function withdrawDividend() public {
        uint256 _withdrawableDividend = withdrawableDividendOf(msg.sender);
        if (_withdrawableDividend > 0) {
            withdrawnDividends[msg.sender] = withdrawnDividends[msg.sender] + _withdrawableDividend;
            emit DividendWithdrawn(msg.sender, _withdrawableDividend);
            (bool success,) = payable(msg.sender).call{value: _withdrawableDividend}("");
            require(success, "Transfer failed");
        }
    }

    function withdrawableDividendOf(address _owner) public view returns(uint256) {
        return accumulativeDividendOf(_owner) - withdrawnDividends[_owner];
    }

    function accumulativeDividendOf(address _owner) public view returns(uint256) {
        return uint256(int256(magnifiedDividendPerShare * balanceOf(_owner)) + magnifiedDividendCorrections[_owner]) / MAGNITUDE;
    }

    // Hook to update dividend corrections on transfer/mint/burn
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        super._beforeTokenTransfer(from, to, amount);

        if (from != address(0)) {
            magnifiedDividendCorrections[from] = magnifiedDividendCorrections[from] + int256(magnifiedDividendPerShare * amount);
        }
        if (to != address(0)) {
            magnifiedDividendCorrections[to] = magnifiedDividendCorrections[to] - int256(magnifiedDividendPerShare * amount);
        }
    }

    // Redemption: If you hold ALL shares, you can get the NFT back
    function redeem() external {
        require(balanceOf(msg.sender) == totalSupply(), "Must own all shares");
        
        // Burn all shares
        _burn(msg.sender, totalSupply());
        
        // Return NFT
        nftContract.safeTransferFrom(address(this), msg.sender, nftId);
        initialized = false;
    }
}
