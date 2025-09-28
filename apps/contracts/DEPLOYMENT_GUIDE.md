# Pokket Identity Verification Setup Guide

This guide will help you deploy the SELF identity verification contract and integrate it with your Pokket application.

## Prerequisites

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup --install 0.3.0
   ```

2. **Install SELF Contracts**:
   ```bash
   cd apps/contracts
   forge install selfxyz/self-contracts
   ```

3. **Set up environment variables**:
   Create a `.env` file in `apps/contracts/`:
   ```bash
   PRIVATE_KEY=your_private_key_here
   CELOSCAN_API_KEY=your_celoscan_api_key_here
   ```

## Step 1: Deploy the Contract

1. **Navigate to contracts directory**:
   ```bash
   cd apps/contracts
   ```

2. **Deploy to Celo Sepolia (Testnet)**:
   ```bash
   forge script script/DeployPokketIdentityVerification.s.sol:DeployPokketIdentityVerification \
     --rpc-url celo_sepolia \
     --broadcast \
     --verify
   ```

3. **Note the deployed contract address** from the output.

## Step 2: Configure SELF Protocol

1. **Go to SELF Configuration Tools**: https://tools.self.xyz

2. **Create a verification configuration**:
   - Set minimum age: 18
   - Countries: Allow all (or specific countries)
   - OFAC: Disabled for testnet
   - Document type: Aadhar card (Indian ID)

3. **Calculate the scope**:
   - Use your deployed contract address
   - Use scope seed: "pokket-identity-verification"
   - The scope will be automatically calculated

4. **Get the config ID** from the SELF tools after creating your configuration.

## Step 3: Update Contract Configuration

After getting the config ID from SELF tools, you may need to update your contract:

```solidity
// If your contract needs to be updated with the correct config ID
// This might be handled automatically in the constructor
```

## Step 4: Update Frontend Configuration

Update your frontend `.env` file:

```bash
NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=0x_YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_SELF_APP_NAME="Pokket Wallet"
NEXT_PUBLIC_SELF_SCOPE="pokket-identity-verification"
```

## Step 5: Frontend Integration

The contract is designed to handle the verification flow and return:

### Data Retrieved from SELF Verification:

1. **Nullifier ID**: Unique identifier for the user (anonymous)
2. **User Information**:
   - Full name
   - Age  
   - Nationality (typically "IN" for Indian users)
   - Issuing state (which Indian state issued the Aadhar)
   - Date of birth

3. **Address Mapping**:
   - ETH Address (from your keypair generation)
   - SOL Address (from your keypair generation)
   - Nullifier ID mapping

### Contract Functions:

```solidity
// Get verification by nullifier ID
function getVerificationByNullifier(bytes32 nullifierId) external view returns (UserVerificationData memory);

// Get verification by ETH address
function getVerificationByAddress(address ethAddress) external view returns (UserVerificationData memory);

// Check if user is verified
function isUserVerified(address ethAddress) external view returns (bool);

// Get nullifier by address
function getNullifierByAddress(address ethAddress) external view returns (bytes32);
```

## Step 6: Update Backend Integration

Update your backend to interact with the deployed contract:

```typescript
// Backend integration example
const verificationContract = new ethers.Contract(
  process.env.VERIFICATION_CONTRACT_ADDRESS,
  contractABI,
  provider
);

// Check if user is verified
const isVerified = await verificationContract.isUserVerified(userEthAddress);

// Get user verification data
const verificationData = await verificationContract.getVerificationByAddress(userEthAddress);

// Extract data:
// - verificationData.nullifierId (bytes32)
// - verificationData.name (string)
// - verificationData.nationality (string)
// - verificationData.age (uint256)
// - verificationData.issuingState (string)
// - verificationData.ethAddress (address)
// - verificationData.solAddress (address)
```

## Step 7: Testing

1. **Use the SELF mobile app** to scan the QR code
2. **Complete Aadhar verification** in the app
3. **Check the contract** to see if verification data was stored
4. **Verify the nullifier mapping** works correctly

## Important Notes

- The **nullifierId** is the key identifier that links to user's verification
- Users remain **anonymous** - only the nullifier and disclosed attributes are stored
- The **scope** ensures verification can't be replayed across different applications
- **ETH and SOL addresses** are linked to the nullifier for transaction mapping

## Expected Contract Events

When verification is successful, you'll see these events:

```solidity
event UserVerified(
    bytes32 indexed nullifierId,
    address indexed ethAddress, 
    address indexed solAddress,
    string name,
    string nationality,
    uint256 age,
    string issuingState,
    uint256 timestamp
);

event AddressesLinked(
    bytes32 indexed nullifierId,
    address indexed ethAddress,
    address indexed solAddress
);
```

## Troubleshooting

1. **"Chain not supported" error**: Update Foundry to version 0.3.0
2. **"Waiting for app" in SELF mobile**: Check contract address and scope match
3. **Verification fails**: Ensure frontend config matches contract config exactly

## Next Steps

After successful deployment and verification:

1. The **nullifierId** can be used as the primary key for user identification
2. **ETH/SOL addresses** are mapped to the nullifier for transactions
3. **User verification status** can be checked before allowing certain operations
4. **Verified user data** (name, age, nationality) can be displayed in the UI