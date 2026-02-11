# Sui Deployment Data (Monthly Submission)

Use this file to track deployment artifacts for Sui program monthly submissions (e.g., grants, ecosystem programs, RFPs).

---

## Package Info

| Field | Value |
|-------|-------|
| **Package ID** | `0x698c2d42a1f82ba1ab0d92eae781485c57928d4034427cd438470777df9cae28` |
| **Module** | `stream` |
| **Package Name** | `streaming_payment` |
| **Chain** | Testnet |
| **Deployed At** | 2026-02-11 |

---

## Transaction Digests

Record key transaction digests for verification:

| Action | Tx Digest | Notes |
|--------|-----------|-------|
| Package publish | `6HHc7CCJLQtL7U7Za7GXetCcKRXFNqdCg1UfumbQF2si` | Initial deployment |
| Create stream (sample) | `0x<tx_digest>` | Optional demo tx |
| Claim (sample) | `0x<tx_digest>` | Optional demo tx |

---

## Explorer Links

- **Package**: https://suiexplorer.com/object/0x698c2d42a1f82ba1ab0d92eae781485c57928d4034427cd438470777df9cae28?network=testnet
- **Tx (publish)**: https://suiexplorer.com/txblock/6HHc7CCJLQtL7U7Za7GXetCcKRXFNqdCg1UfumbQF2si?network=testnet

---

## How to Fill This In

1. **Get testnet SUI** (if needed):
   - Visit https://faucet.sui.io
   - Enter your address: `sui client active-address`
   - Request tokens

2. **Publish the package**:
   ```bash
   cd sui
   sui client publish --gas-budget 100000000
   ```

3. **Copy the Package ID** from the publish output (or `Move.lock` after publish).

4. **Update**:
   - `streaming-payment/frontend/.env` → `VITE_SUI_STREAM_PACKAGE_ID=0x<your_package_id>`
   - This file → Package ID and tx digest rows

5. **Verify** on [Suiexplorer](https://suiexplorer.com) (Testnet/Mainnet as applicable).
