# Smart Contract Deployment Guide

## Prerequisites

1. **Install Dependencies**
   ```bash
   cd contracts
   npm install
   ```

2. **Get Polygon MATIC**
   - For **Polygon Amoy Testnet**: Get free testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - For **Polygon Mainnet**: Buy MATIC on exchanges and transfer to your wallet

3. **Create Deployer Wallet**
   - Generate a new wallet or use existing one
   - **NEVER commit private keys to git**
   - Save the private key securely

4. **Get Polygonscan API Key** (Optional, for verification)
   - Visit [Polygonscan](https://polygonscan.com/apis)
   - Create free account and generate API key

## Environment Setup

Create `contracts/.env` file:

```env
# Deployer wallet private key (without 0x prefix)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# RPC URLs
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com

# Polygonscan API Key (optional, for verification)
POLYGONSCAN_API_KEY=your_api_key_here
```

## Deployment Steps

### 1. Compile Contracts

```bash
npm run compile
```

Expected output: Compilation successful, artifacts generated.

### 2. Deploy to Testnet (Amoy)

```bash
npx hardhat run scripts/deploy-all.js --network amoy
```

**What happens:**
- Deploys FlowToken (ERC-20)
- Deploys FlowStaking contract
- Grants MINTER_ROLE to staking contract
- Deploys FractionalNFT template
- Deploys BountyEscrow
- Saves deployment info to `deployments/amoy.json`
- Verifies contracts on Polygonscan (if API key provided)

### 3. Deploy to Mainnet (Production)

```bash
npx hardhat run scripts/deploy-all.js --network polygon
```

⚠️ **IMPORTANT**: Deploying to mainnet costs real MATIC. Make sure you have sufficient balance.

### 4. Verify Deployment

Check the generated file: `deployments/[network].json`

```json
{
  "network": "amoy",
  "chainId": "80002",
  "deployer": "0x...",
  "timestamp": "2025-01-19T...",
  "contracts": {
    "FlowToken": "0x...",
    "FlowStaking": "0x...",
    "FractionalNFT": "0x...",
    "BountyEscrow": "0x..."
  }
}
```

### 5. Update Backend Configuration

Copy contract addresses to `backend/.env`:

```env
# From deployments/amoy.json or deployments/polygon.json
FLOW_TOKEN_CONTRACT_ADDRESS=0x...
FLOW_STAKING_CONTRACT_ADDRESS=0x...
FRACTIONAL_NFT_TEMPLATE_ADDRESS=0x...
BOUNTY_ESCROW_CONTRACT_ADDRESS=0x...

# Use appropriate RPC URL
POLYGON_RPC_URL=https://polygon-rpc.com  # or https://rpc-amoy.polygon.technology
```

### 6. Fund Staking Contract (Optional)

To enable staking rewards, send initial FLOW tokens to the staking contract:

```bash
# Connect to deployed contracts and transfer tokens
# Example using Hardhat console:
npx hardhat console --network amoy

> const FlowToken = await ethers.getContractFactory("FlowToken");
> const token = await FlowToken.attach("YOUR_FLOW_TOKEN_ADDRESS");
> await token.mint("YOUR_STAKING_CONTRACT_ADDRESS", ethers.parseEther("1000000"));
```

## Verification

If contracts weren't auto-verified during deployment, verify manually:

```bash
# FlowToken
npx hardhat verify --network amoy FLOW_TOKEN_ADDRESS

# FlowStaking
npx hardhat verify --network amoy STAKING_ADDRESS "FLOW_TOKEN_ADDRESS"

# FractionalNFT
npx hardhat verify --network amoy FRACTIONAL_NFT_ADDRESS

# BountyEscrow
npx hardhat verify --network amoy BOUNTY_ESCROW_ADDRESS "FLOW_TOKEN_ADDRESS"
```

## Testing Contracts

### Local Testing

```bash
npm test
```

### Testnet Testing

After deployment to Amoy testnet:

1. **Test Token Minting**
   ```bash
   npx hardhat console --network amoy
   > const token = await ethers.getContractAt("FlowToken", "TOKEN_ADDRESS")
   > await token.mint("RECIPIENT_ADDRESS", ethers.parseEther("100"))
   ```

2. **Test Staking**
   - Approve staking contract
   - Stake tokens
   - Wait and claim rewards

3. **Test NFT Minting**
   - Use backend API to mint NFTs
   - Verify on Polygonscan

## Troubleshooting

### "Insufficient funds" error
- Check deployer wallet has enough MATIC
- Testnet: Use faucet to get more
- Mainnet: Buy and transfer MATIC

### "Nonce too high" error
- Reset your account in MetaMask/wallet
- Or manually set nonce in deployment script

### "Verification failed"
- Wait 30-60 seconds after deployment
- Check Polygonscan API key is valid
- Manually verify using commands above

### "Contract already verified"
- Contract was already verified successfully
- Check on Polygonscan

## Security Checklist

Before mainnet deployment:

- [ ] Private keys stored securely (NOT in git)
- [ ] Contracts audited by professional auditors
- [ ] Tested extensively on testnet
- [ ] Role permissions configured correctly
- [ ] Owner addresses reviewed
- [ ] Gas limits tested
- [ ] Emergency pause mechanisms reviewed
- [ ] Upgrade paths considered

## Next Steps

After successful deployment:

1. ✅ Update backend environment variables
2. ✅ Configure Web3 services to use deployed contracts
3. ✅ Test NFT minting via backend API
4. ✅ Test staking functionality
5. ✅ Configure frontend to display contract addresses
6. ✅ Monitor contracts on Polygonscan
7. ✅ Set up alerts for important events (large stakes, NFT mints)

## Support

- Polygon Documentation: https://docs.polygon.technology/
- Hardhat Documentation: https://hardhat.org/docs
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
