#!/bin/bash

echo "🔍 Self Protocol Verification Test"
echo "=================================="
echo ""

echo "📱 Testing verification status for your address..."
curl -s "http://localhost:3001/verification/status/0xFAc58ba0CCd5F5b81F7F4B5F6a28515d1a44b711" | jq '.'

echo ""
echo "📊 Contract statistics:"
curl -s "http://localhost:3001/verification/stats" | jq '.'

echo ""
echo "🎯 What should happen:"
echo "1. Your address should show isVerified: false (initially)"
echo "2. After Self Protocol verification completes:"
echo "   - Self Protocol calls your smart contract directly"
echo "   - Contract updates verification status"
echo "   - API returns isVerified: true"
echo "   - Frontend modal completes successfully"

echo ""
echo "✅ No temporary workarounds - pure on-chain verification!"