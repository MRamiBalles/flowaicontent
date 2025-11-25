# FlowAI Smart Contracts

This directory contains the Solidity smart contracts for the FlowAI platform's blockchain features.

## Contracts

### Core Token & DeFi
- **FlowToken.sol**: ERC-20 token with minting, burning, and role-based access control
- **FlowStaking.sol**: Stake FLOW tokens to earn rewards
- **BountyEscrow.sol**: Escrow system for creator bounties

### NFT System
- **FractionalNFT.sol**: Allows fractionalization of video NFTs into shares

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Create `.env` file:
```env
DEPLOYER_PRIVATE_KEY=your_wallet_private_key_without_0x
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### 3. Get Testnet MATIC
Visit https://faucet.polygon.technology/ and request testnet MATIC for Polygon Amoy testnet.

### 4. Deploy Contracts

**Deploy to Amoy Testnet:**
```bash
npm run deploy:amoy
```

**Deploy to Polygon Mainnet:**
```bash
npm run deploy:polygon
```

### 5. Save Contract Addresses
After deployment, check `deployments/amoy.json` or `deployments/polygon.json` for your contract addresses.

Copy these addresses to your backend `.env` file.

## Development

**Compile contracts:**
```bash
npm run compile
```

**Run tests:**
```bash
npm test
```

## Documentation

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions, troubleshooting, and security checklist.

## Contract Addresses

After deployment, your contract addresses will be saved in:
- `deployments/amoy.json` - Testnet deployment
- `deployments/polygon.json` - Mainnet deployment

## Security

⚠️ **IMPORTANT**: Never commit private keys to version control.

Before mainnet deployment:
- [ ] Get professional smart contract audit
- [ ] Test extensively on testnet
- [ ] Review all role permissions
- [ ] Verify upgrade paths
- [ ] Test emergency mechanisms

## Support

- [Hardhat Documentation](https://hardhat.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Polygon Documentation](https://docs.polygon.technology/)
