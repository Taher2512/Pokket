#!/bin/bash

echo "🎉 NEW CONTRACT DEPLOYMENT SUCCESSFUL!"
echo "====================================="
echo ""

echo "📍 DEPLOYMENT DETAILS:"
echo "   Contract Address: 0xef4ebe946c8085D00Ea7d9AD0A157Fb79EA8c87f"
echo "   Deployer Address: 0xb267fe4AE336Aff480Bf7B28809d6D7B2fD1300e"
echo "   Private Key: 0x9a1703f155997943f7a13e7e39d024ba683be02506bc5c4afced5e77bb828bdc"
echo "   Network: Celo Alfajores Testnet"
echo ""

echo "✅ CONFIGURATION UPDATED:"
echo "   ✅ Backend .env - Contract address and private key set"
echo "   ✅ Frontend .env - Contract address updated"
echo ""

echo "💰 NEXT STEP - FUND THE DEPLOYER:"
echo "   1. Go to: https://faucet.celo.org/alfajores"
echo "   2. Enter address: 0xb267fe4AE336Aff480Bf7B28809d6D7B2fD1300e"
echo "   3. Request testnet CELO tokens"
echo ""

echo "🔄 AFTER FUNDING:"
echo "   1. Restart backend server: cd apps/backend && bun dev"
echo "   2. Test verification: node test-verification-setup.js"
echo "   3. Use 'Test Verification' button in frontend"
echo ""

echo "🧪 TEST THE SETUP:"
echo "   Current deployer balance:"

# Check balance
curl -s -X POST https://alfajores-forno.celo-testnet.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": ["0xb267fe4AE336Aff480Bf7B28809d6D7B2fD1300e", "latest"],
    "id": 1
  }' | grep -o '"result":"[^"]*"' | cut -d'"' -f4 | while read balance; do
    if [ "$balance" = "0x0" ]; then
      echo "   ❌ Balance: 0 CELO (Need to fund this address)"
    else
      echo "   ✅ Balance: $balance wei"
    fi
  done

echo ""
echo "🎯 VERIFICATION FLOW:"
echo "   1. User clicks 'Verify Identity' in frontend"
echo "   2. User clicks 'Test Verification (Demo)' button"
echo "   3. Backend uses private key to verify user on-chain"
echo "   4. User sees 'Verification Complete!' message"
echo "   5. Verification status shows as verified ✅"

echo ""
echo "🔗 USEFUL LINKS:"
echo "   • Faucet: https://faucet.celo.org/alfajores"
echo "   • Explorer: https://explorer.celo.org/alfajores"
echo "   • Contract: https://explorer.celo.org/alfajores/address/0xef4ebe946c8085D00Ea7d9AD0A157Fb79EA8c87f"