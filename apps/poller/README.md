# Solana Cross-Chain Swap Poller

This service monitors user Solana balances and automatically triggers cross-chain swaps from SOL to PYUSD on Ethereum using the 1inch Fusion+ protocol.

## 🚀 Features

- **Real-time balance monitoring** - Checks SOL balances every 5 seconds
- **Automatic swap triggering** - Initiates swaps when balance > 0.009 SOL
- **Backend integration** - Fetches real users from your database
- **Secure key management** - Decrypts private keys using the same encryption as your auth service
- **Cross-chain swaps** - Converts SOL to PYUSD on Ethereum mainnet
- **Comprehensive logging** - Detailed logs for debugging and monitoring

## 📋 Prerequisites

1. **1inch API Key** - Get from [1inch Developer Portal](https://portal.1inch.dev/)
2. **Mainnet SOL** - Users need SOL in their wallets to trigger swaps
3. **Backend running** - The main backend service must be running on localhost:3001
4. **Environment setup** - Configure the `.env` file with your settings

## ⚙️ Setup

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Required environment variables:**
   ```env
   DEV_PORTAL_API_KEY=your_1inch_api_key_here
   ENCRYPTION_KEY=your_encryption_key_from_backend
   ADMIN_API_KEY=your_admin_api_key
   ```

## 🧪 Testing

### Test Setup

Run the test script to see which user will be used for testing:

```bash
bun run test
```

This will:

- Fetch a test user from your database
- Show their Solana and Ethereum addresses
- Display current SOL balance
- Provide instructions for testing

### Monitor Balance Changes

To monitor balance changes in real-time:

```bash
bun run test:monitor
```

### Manual Testing Steps

1. **Run the test script** to get the test user's Solana address
2. **Send SOL** to that address (at least 0.01 SOL recommended)
3. **Start the poller** in another terminal:
   ```bash
   bun run dev
   ```
4. **Watch the logs** - the poller will detect the balance and trigger a swap

## 🏃‍♂️ Running

### Development (with auto-reload):

```bash
bun run dev
```

### Production:

```bash
bun run start
```

## 📊 How It Works

1. **Polling Phase:**
   - Fetches users with Solana addresses from backend
   - Checks each user's SOL balance every 5 seconds
   - Logs current balances and status

2. **Swap Trigger:**
   - When balance > `MIN_SOL_BALANCE` (0.009 SOL)
   - Decrypts user's Solana private key
   - Initiates 1inch cross-chain swap

3. **Swap Process:**
   - Gets quote for SOL → PYUSD swap
   - Creates atomic swap order
   - Submits Solana transaction to escrow
   - Monitors for order fulfillment
   - Handles secret reveal for completion

4. **Result:**
   - User receives PYUSD on Ethereum
   - SOL is consumed in the swap process

## 🔧 Configuration

### Environment Variables

| Variable             | Description                     | Default                               |
| -------------------- | ------------------------------- | ------------------------------------- |
| `SOLANA_RPC_URL`     | Solana RPC endpoint             | `https://api.mainnet-beta.solana.com` |
| `BACKEND_URL`        | Backend API URL                 | `http://localhost:3001`               |
| `DEV_PORTAL_API_KEY` | 1inch API key                   | Required                              |
| `MIN_SOL_BALANCE`    | Minimum balance to trigger swap | `0.009`                               |
| `POLLING_INTERVAL`   | Check interval in ms            | `5000`                                |

### Swap Configuration

- **Source:** SOL (Solana mainnet)
- **Destination:** PYUSD (Ethereum mainnet)
- **Protocol:** 1inch Fusion+
- **Minimum amount:** 0.009 SOL

## 🔒 Security

- Private keys are encrypted in the database
- Decryption happens only when needed for swaps
- Admin API requires authentication
- No private keys are logged

## 📝 Logs

The poller provides detailed logs:

```
🔄 Starting balance check...
👥 Found 1 users with Solana keys from backend
🔍 Checking balance for user@example.com
💰 SOL Balance: 0.015000 SOL
🚨 BALANCE THRESHOLD EXCEEDED!
🔄 Triggering cross-chain swap...
✅ Swap completed successfully
```

## 🚨 Troubleshooting

### Common Issues

1. **"No users found"**
   - Check backend is running
   - Verify admin API key
   - Ensure users have Solana addresses

2. **"API key not configured"**
   - Set `DEV_PORTAL_API_KEY` in `.env`
   - Get API key from 1inch portal

3. **"Failed to decrypt private key"**
   - Verify `ENCRYPTION_KEY` matches backend
   - Check user has encrypted Solana key

4. **Swap fails**
   - Ensure sufficient SOL balance
   - Check 1inch API status
   - Verify network connectivity

### Debug Mode

Enable detailed logging by setting:

```env
DEBUG=1
```

## 🔗 Related Services

- **Backend API** - Provides user data and authentication
- **Frontend** - Displays QR codes and balances
- **1inch Fusion+** - Handles cross-chain swaps

## 📊 Monitoring

The service provides real-time status information:

- Active user count
- Balance check frequency
- Swap success/failure rates
- Network connectivity statusstall dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
