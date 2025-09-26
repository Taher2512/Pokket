# Smart Contracts Setup Guide

This guide explains how to set up the Pokket Identity Verification smart contracts after cloning the repository.

## Prerequisites

Make sure you have the following installed:
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (includes forge, cast, and anvil)
- [Bun](https://bun.sh/) or Node.js (for running scripts)

## Setup Instructions

### 1. Navigate to Contracts Directory
```bash
cd apps/contracts
```

### 2. Install Foundry Dependencies
```bash
# Install forge-std (Foundry's standard library)
forge install foundry-rs/forge-std

# Install Self Protocol's proof-of-passport contracts
forge install zk-passport/proof-of-passport@main
```

### 3. Verify Installation
Check that dependencies are installed correctly:
```bash
ls lib/
# Should show: forge-std/ and proof-of-passport/
```

### 4. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```bash
# For deployment (use a test wallet only!)
PRIVATE_KEY=0x1234...your-private-key-here

# RPC URLs (defaults are provided)
CELO_ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_MAINNET_RPC_URL=https://forno.celo.org
```

### 5. Build Contracts
```bash
forge build
```

### 6. Run Tests
```bash
forge test -vvv
```

### 7. Deploy to Testnet (Optional)

If you want to deploy your own contract instance:

1. **Get testnet funds**: Visit [Celo Faucet](https://faucet.celo.org/alfajores) and request funds for your address
2. **Deploy contract**:
   ```bash
   forge script script/DeployPokketIdentityVerification.s.sol \
     --rpc-url $CELO_ALFAJORES_RPC_URL \
     --broadcast
   ```
3. **Update environment**: Copy the deployed contract address to your frontend `.env.local`

## Existing Deployment

A contract is already deployed to Celo Alfajores testnet:
- **Contract Address**: `0xbad8F4ffD864b4cB2E043C197c697C22f4B899Aa`
- **Network**: Celo Alfajores (Chain ID: 44787)
- **Explorer**: [View on Celo Explorer](https://explorer.celo.org/alfajores/address/0xbad8F4ffD864b4cB2E043C197c697C22f4B899Aa)

You can use this existing deployment without deploying your own contract.

## Troubleshooting

### Common Issues:

1. **"forge: command not found"**
   ```bash
   # Install Foundry
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Build fails with dependency errors**
   ```bash
   # Clean and reinstall dependencies
   rm -rf lib/
   forge install foundry-rs/forge-std
   forge install zk-passport/proof-of-passport@main
   forge build
   ```

3. **Tests fail**
   ```bash
   # Make sure all dependencies are installed
   forge install
   forge test -vvv
   ```

## File Structure

After setup, your contracts folder should look like:
```
apps/contracts/
├── lib/                    # Dependencies (ignored by git)
│   ├── forge-std/         # Foundry standard library
│   └── proof-of-passport/ # Self Protocol contracts
├── src/                   # Contract source code
├── test/                  # Test files
├── script/                # Deployment scripts
├── foundry.toml          # Foundry configuration
└── .env                  # Environment variables (create from .env.example)
```

## Next Steps

Once the contracts are set up:
1. Make sure the backend is configured with the contract address
2. Start the backend server: `cd ../backend && bun dev`
3. Start the frontend: `cd ../web && bun dev`
4. Test the verification flow in the web app

For more information about the verification system, see the main [README.md](../../README.md) and [SELF_PROTOCOL_INTEGRATION_SUMMARY.md](../../SELF_PROTOCOL_INTEGRATION_SUMMARY.md).