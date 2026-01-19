# 🚀 Deployment Guide

## Prerequisites

1. **Install Clarinet** (if not already):
```bash
# macOS
brew install clarinet

# Or download from:
# https://github.com/hirosystems/clarinet/releases
```

2. **Get Testnet STX**:
   - Go to https://explorer.hiro.so/sandbox/faucet?chain=testnet
   - Enter your testnet address
   - Request STX (needed for deployment fees)

---

## Step 1: Generate Deployment

```bash
cd "streaming payments"
clarinet deployments generate --testnet
```

This creates `deployments/default.testnet-plan.yaml`

---

## Step 2: Configure Deployment

Edit `deployments/default.testnet-plan.yaml`:

```yaml
---
id: 0
name: Deployment
network: testnet
stacks-node: "https://stacks-node-api.testnet.stacks.co"
bitcoin-node: "https://blockstream.info/testnet/api"
plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: mock-usdcx
            expected-sender: YOUR_TESTNET_ADDRESS
            cost: 10000
            path: contracts/mock-usdcx.clar
            anchor-block-only: true
            clarity-version: 2
        - contract-publish:
            contract-name: usdcx-streaming
            expected-sender: YOUR_TESTNET_ADDRESS
            cost: 15000
            path: contracts/usdcx-streaming.clar
            anchor-block-only: true
            clarity-version: 2
```

Replace `YOUR_TESTNET_ADDRESS` with your actual testnet address (e.g., `ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG`)

---

## Step 3: Deploy

```bash
clarinet deployments apply --testnet
```

Follow the prompts. You'll need to sign the transactions.

**Expected output:**
```
Contract mock-usdcx deployed at ST2CY5V39....mock-usdcx
Contract usdcx-streaming deployed at ST2CY5V39....usdcx-streaming
```

---

## Step 4: Verify Deployment

Check your contracts on the explorer:
- https://explorer.hiro.so/txid/YOUR_TX_ID?chain=testnet

Or search for your address:
- https://explorer.hiro.so/address/YOUR_ADDRESS?chain=testnet

---

## Step 5: Update Frontend

Edit `frontend/src/App.tsx`:

```typescript
// Change this line to your deployed address:
const CONTRACT_ADDRESS = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"; // Your testnet address
```

---

## Step 6: Test on Testnet

1. **Mint test tokens**:
   - Connect your wallet to the frontend
   - Call the faucet function on mock-usdcx

2. **Create a stream**:
   - Enter a recipient address
   - Set amount and duration
   - Click "Create Stream"

3. **Wait for confirmation** (~10-30 seconds on testnet)

4. **Claim funds**:
   - Switch to recipient wallet
   - Click "Claim"

---

## Alternative: Deploy via Hiro Platform

1. Go to https://platform.hiro.so
2. Create a new project
3. Upload your `.clar` files
4. Deploy with one click

---

## Using Real USDCx (Mainnet)

For mainnet with real USDCx:

1. Replace `mock-usdcx` with the real USDCx contract address
2. The real USDCx on Stacks mainnet is at:
   ```
   SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-susdc
   ```
   (Verify this address before using!)

3. Update your contract to use the real token trait

---

## Troubleshooting

### "Insufficient balance"
- Get more testnet STX from the faucet
- Wait a few minutes for funds to arrive

### "Contract already exists"
- Change the contract name or use a different address

### "Transaction failed"
- Check the explorer for error details
- Verify your contract compiles: `clarinet check`

### "Wallet not connecting"
- Make sure you're on testnet in your wallet
- Clear browser cache and try again

---

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying USDCx Streaming to Testnet..."

# Check contracts compile
clarinet check
if [ $? -ne 0 ]; then
    echo "❌ Contract check failed"
    exit 1
fi

# Generate deployment
clarinet deployments generate --testnet

# Apply deployment
clarinet deployments apply --testnet

echo "✅ Deployment complete!"
echo "📝 Update CONTRACT_ADDRESS in frontend/src/App.tsx"
```

Run with:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## After Deployment

1. **Record your contract addresses**
2. **Update the frontend**
3. **Test all functions**
4. **Record your demo video!**

Good luck with your hackathon! 🏆
