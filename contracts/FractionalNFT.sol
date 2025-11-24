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

    uint256 public totalDividends;
    mapping(address => uint256) public lastDividendAt;

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
        // Simplified dividend logic: Just tracking total received
        // In prod: Use a more robust dividend tracking (e.g. Scalable Reward Distribution)
        totalDividends += msg.value;
    }

    // Redemption: If you hold ALL shares, you can get the NFT back
    function redeem() external {
        require(balanceOf(msg.sender) == totalSupply(), "Must own all shares");
        
        _burn(msg.sender, totalSupply());
        nftContract.safeTransferFrom(address(this), msg.sender, nftId);
        initialized = false;
    }
}
