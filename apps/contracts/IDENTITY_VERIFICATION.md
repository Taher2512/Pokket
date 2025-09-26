# Pokket Identity Verification System

This document outlines the implementation of Self Protocol identity verification within the Pokket ecosystem, enabling users to perform on-chain KYC using government-issued documents.

## Overview

The Pokket Identity Verification System integrates Self Protocol's zero-knowledge proof technology to allow users to verify their identity using government-issued documents (passports, ID cards) while maintaining privacy. Verified users can display their verification status when others scan their QR codes, creating a trust layer for the Pokket ecosystem.

## Smart Contract Architecture

### PokketIdentityVerification.sol

Located: `apps/contracts/src/PokketIdentityVerification.sol`

This contract extends Self Protocol's `SelfVerificationRoot` to provide:

- **User Verification Tracking**: Maintains a mapping of verified users with timestamps and metadata
- **Admin Functions**: Owner-controlled configuration and scope management
- **Batch Operations**: Check multiple users' verification status in a single call
- **Emergency Controls**: Ability to revoke verifications when needed
- **Event Logging**: Comprehensive events for verification lifecycle tracking

#### Key Features

1. **Verification Storage**

   ```solidity
   mapping(address => VerificationData) public verifiedUsers;
   ```

2. **Custom Verification Hook**

   ```solidity
   function customVerificationHook(
       ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
       bytes memory userData
   ) internal override
   ```

3. **Public Interface**
   - `isUserVerified(address)`: Check if user is verified
   - `getUserVerificationDetails(address)`: Get full verification info
   - `batchCheckVerification(address[])`: Batch verification check
   - `getContractStats()`: Contract overview statistics

#### Admin Functions (Owner Only)

- `setConfigId(bytes32)`: Update verification configuration
- `setScope(uint256)`: Update verification scope
- `revokeVerification(address)`: Emergency verification revocation
- `transferOwnership(address)`: Transfer contract ownership

## Deployment Configuration

### Network Support

The system is designed for deployment on Celo networks:

**Celo Mainnet**

- Hub Address: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`
- RPC: `https://forno.celo.org`
- Explorer: `https://celoscan.io`
- Supports: Real passport verification

**Celo Sepolia (Testnet)**

- Hub Address: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- RPC: `https://forno.celo-sepolia.celo-testnet.org`
- Explorer: `https://celo-sepolia.blockscout.com`
- Supports: Mock passports for testing

### Deployment Script

Use the Foundry deployment script:

```bash
cd apps/contracts

# For testnet
forge script script/DeployPokketIdentityVerification.s.sol:DeployPokketIdentityVerification \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org \
  --broadcast \
  --verify

# For mainnet
forge script script/DeployPokketIdentityVerification.s.sol:DeployPokketIdentityVerification \
  --rpc-url https://forno.celo.org \
  --broadcast \
  --verify
```

## Integration Architecture

### Backend Integration

The backend will need to:

1. **Monitor Verification Events**: Listen for `UserVerified` events from the smart contract
2. **Cache Verification Status**: Store verification status for efficient QR code generation
3. **API Endpoints**: Provide verification status to frontend components

Example API structure:

```typescript
// GET /api/user/:address/verification
interface VerificationStatus {
  isVerified: boolean;
  verificationTimestamp?: number;
  metadata?: any;
}
```

### Frontend Integration

#### QR Code Enhancement

The existing `AddressQRCode.tsx` component already supports the enhanced 3-tab structure. For verification integration:

1. **Verification Badge**: Display verification status in QR codes
2. **Trust Indicators**: Show verification badges when scanning other users' codes
3. **KYC Initiation**: Provide UI flow to start identity verification process

#### Verification Flow UI

Future implementation will include:

1. **Verification Initiation**: Button to start Self Protocol verification
2. **QR Code Generation**: Self Protocol QR for mobile app scanning
3. **Status Tracking**: Real-time verification status updates
4. **Success Confirmation**: Post-verification success flow

## Self Protocol Integration

### Required Dependencies

```json
{
  "dependencies": {
    "@selfxyz/contracts": "^1.2.1"
  }
}
```

### Frontend SDK (Future Implementation)

The frontend will integrate Self Protocol's SDK to:

1. **Generate Verification QR**: Create QR codes for mobile app scanning
2. **Handle Callbacks**: Process verification completion callbacks
3. **Status Polling**: Monitor verification progress

Example integration pattern:

```typescript
import { SelfSDK } from "@selfxyz/sdk";

const sdk = new SelfSDK({
  apiKey: process.env.SELF_API_KEY,
  contractAddress: process.env.POKKET_VERIFICATION_CONTRACT,
  network: "celo",
});

// Generate verification QR
const qrCode = await sdk.generateVerificationQR({
  userAddress,
  requestedFields: ["first_name", "last_name", "nationality", "date_of_birth"],
});
```

## Security Considerations

### Access Control

1. **Owner-Only Functions**: Critical functions restricted to contract owner
2. **Verification Integrity**: Only Self Protocol hub can trigger verifications
3. **Emergency Controls**: Owner can revoke verifications in emergencies

### Privacy Protection

1. **Zero-Knowledge Proofs**: Personal data never exposed on-chain
2. **Selective Disclosure**: Users choose which attributes to reveal
3. **Metadata Encryption**: Sensitive metadata can be encrypted

### Audit Trail

1. **Event Logging**: All verification actions logged with events
2. **Timestamp Tracking**: Verification timestamps for audit purposes
3. **Configuration Changes**: All admin actions emit events

## Testing

### Smart Contract Tests

Comprehensive test suite covers:

- Initial contract state validation
- Admin function access control
- Verification status tracking
- Batch operation functionality
- Edge cases and error conditions

Run tests:

```bash
cd apps/contracts
forge test -vv
```

### Integration Testing

Future testing will include:

1. **End-to-End Flow**: Complete verification process testing
2. **Mobile App Integration**: Testing with Self Protocol mobile apps
3. **Frontend Integration**: UI component testing with verification states

## Configuration

### Environment Variables

```bash
# Deployment
PRIVATE_KEY=<your_private_key>
CELO_RPC_URL=<celo_rpc_endpoint>

# Contract Configuration
POKKET_VERIFICATION_SCOPE=<verification_scope_id>
POKKET_CONFIG_ID=<verification_config_id>

# Frontend Integration (Future)
SELF_API_KEY=<self_protocol_api_key>
VERIFICATION_CONTRACT_ADDRESS=<deployed_contract_address>
```

### Verification Configuration

Self Protocol configuration defines:

1. **Requested Fields**: Which identity attributes to request
2. **Document Types**: Supported document types (passport, ID card)
3. **Verification Scope**: Application-specific verification scope

## Future Enhancements

### Planned Features

1. **Tiered Verification**: Different verification levels (basic, enhanced, premium)
2. **Batch Verification**: Admin tools for bulk verification management
3. **Verification Analytics**: Dashboard for verification statistics
4. **Integration Webhooks**: Real-time verification status notifications

### Scalability Considerations

1. **Layer 2 Integration**: Consider Celo Layer 2 solutions for lower costs
2. **Off-chain Indexing**: Index verification events for faster queries
3. **Caching Strategy**: Implement efficient verification status caching

## Support and Resources

- **Self Protocol Docs**: [docs.self.xyz](https://docs.self.xyz)
- **Celo Documentation**: [docs.celo.org](https://docs.celo.org)
- **Self Protocol Telegram**: [Self Protocol Support](https://t.me/selfprotocolbuilder)
- **Contract Repository**: `apps/contracts/src/PokketIdentityVerification.sol`

## Status

✅ **Smart Contract**: Complete implementation with comprehensive testing  
🔄 **Deployment**: Ready for testnet/mainnet deployment  
⏳ **Frontend Integration**: Awaiting Self Protocol frontend SDK documentation  
⏳ **Backend Integration**: Pending contract deployment and event monitoring setup  
⏳ **Mobile App Integration**: Requires Self Protocol mobile app integration

The smart contract infrastructure is complete and tested. Next steps require Self Protocol frontend integration documentation to implement the client-side verification flows.
