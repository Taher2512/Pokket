#!/bin/bash

echo "🚀 Deploying New Pokket Identity Verification Contract"
echo "====================================================="

# Generate a new private key
echo "📝 Generating new private key..."
PRIVATE_KEY=$(openssl rand -hex 32)
PRIVATE_KEY="0x$PRIVATE_KEY"

echo "🔑 Generated private key: $PRIVATE_KEY"
echo ""

# Create temporary .env for deployment
echo "💾 Creating deployment configuration..."
cd /Applications/Blockchain/Ethereum/Pokket/apps/contracts

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "📋 Backed up existing .env to .env.backup"
fi

# Create new .env with generated private key
cat > .env << EOF
PRIVATE_KEY=$PRIVATE_KEY
RPC_URL=https://alfajores-forno.celo-testnet.org
EOF

echo "✅ Created deployment .env file"
echo ""

# Deploy the contract
echo "🚀 Deploying contract to Celo Alfajores testnet..."
echo "⏳ This may take a few moments..."

forge script script/DeploySimplePokketIdentityVerification.s.sol --rpc-url https://alfajores-forno.celo-testnet.org --broadcast

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    
    # Extract contract address from the broadcast files
    BROADCAST_DIR="broadcast/DeploySimplePokketIdentityVerification.s.sol/44787"
    if [ -d "$BROADCAST_DIR" ]; then
        LATEST_RUN=$(ls -t $BROADCAST_DIR/run-*.json | head -1)
        if [ -f "$LATEST_RUN" ]; then
            CONTRACT_ADDRESS=$(cat "$LATEST_RUN" | grep -o '"contractAddress":"0x[a-fA-F0-9]*"' | cut -d'"' -f4 | head -1)
            if [ ! -z "$CONTRACT_ADDRESS" ]; then
                echo "📍 Contract deployed at: $CONTRACT_ADDRESS"
                echo ""
                
                # Update backend .env
                echo "🔧 Updating backend configuration..."
                cd /Applications/Blockchain/Ethereum/Pokket/apps/backend
                
                # Update VERIFICATION_CONTRACT_ADDRESS
                if grep -q "VERIFICATION_CONTRACT_ADDRESS" .env; then
                    sed -i.bak "s/VERIFICATION_CONTRACT_ADDRESS=.*/VERIFICATION_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env
                else
                    echo "VERIFICATION_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env
                fi
                
                # Update VERIFICATION_PRIVATE_KEY
                if grep -q "VERIFICATION_PRIVATE_KEY" .env; then
                    sed -i.bak "s/VERIFICATION_PRIVATE_KEY=.*/VERIFICATION_PRIVATE_KEY=$PRIVATE_KEY/" .env
                else
                    echo "VERIFICATION_PRIVATE_KEY=$PRIVATE_KEY" >> .env
                fi
                
                echo "✅ Updated backend .env file"
                
                # Update frontend .env
                echo "🔧 Updating frontend configuration..."
                cd /Applications/Blockchain/Ethereum/Pokket/apps/web
                
                if grep -q "NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS" .env; then
                    sed -i.bak "s/NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env
                else
                    echo "NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env
                fi
                
                echo "✅ Updated frontend .env file"
                echo ""
                
                # Get deployer address for funding
                DEPLOYER_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
                
                echo "💰 IMPORTANT: Fund the deployer account!"
                echo "   Address: $DEPLOYER_ADDRESS"
                echo "   Faucet: https://faucet.celo.org/alfajores"
                echo ""
                
                echo "📋 DEPLOYMENT SUMMARY:"
                echo "   Contract Address: $CONTRACT_ADDRESS"
                echo "   Deployer Address: $DEPLOYER_ADDRESS"
                echo "   Private Key: $PRIVATE_KEY"
                echo "   Network: Celo Alfajores Testnet"
                echo ""
                
                echo "🎯 NEXT STEPS:"
                echo "1. Fund deployer address with Celo testnet tokens"
                echo "2. Restart your backend server (bun dev)"
                echo "3. Test verification with: node test-verification-setup.js"
                echo "4. Use 'Test Verification' button in frontend"
                
            else
                echo "❌ Could not extract contract address from deployment"
            fi
        fi
    fi
    
else
    echo "❌ Deployment failed!"
    echo "💡 Make sure you have forge installed and network is accessible"
fi

echo ""
echo "🔒 SECURITY NOTE:"
echo "   The private key is saved in your .env files"
echo "   Keep this secure and never commit to git"