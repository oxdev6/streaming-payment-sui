# 💸 USDCx Streaming Payments

<p align="center">
  <img src="https://img.shields.io/badge/Stacks-Clarity_2.4-F7931E?style=for-the-badge&logo=bitcoin" alt="Stacks" />
  <img src="https://img.shields.io/badge/USDCx-Stablecoin-2775CA?style=for-the-badge" alt="USDCx" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>🌊 Real-time payment streams on Stacks blockchain</strong>
</p>

<p align="center">
  Stream money like streaming music. Pay by the second, not by the month.
</p>

---

## 🎯 The Problem

Traditional payments are **all-or-nothing**:
- Pay employees once a month → they wait 30 days
- Grant funding released in bulk → no accountability
- Subscriptions charge upfront → no flexibility

## ✨ The Solution

**USDCx Streaming** enables continuous, real-time payments:
- 💼 **Payroll**: Employees earn every second they work
- 🎯 **Grants**: Funding flows as milestones progress
- 📺 **Subscriptions**: Pay only for what you use
- 🤝 **Vesting**: Token unlocks happen continuously

---

## 🚀 Quick Start

```bash
# 1. Test the smart contract
cd "streaming payments"
clarinet test

# 2. Launch the frontend
cd frontend
npm install
npm run dev

# 3. Open http://localhost:5173
```

---

## 🎬 Demo

### Watch Money Flow in Real-Time

1. **Create a stream** → Lock 100 USDCx for 60 seconds
2. **Watch the progress bar** → Money flows continuously
3. **Claim anytime** → Recipient withdraws earned funds
4. **Cancel if needed** → Both parties get fair share

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    SENDER                                      RECIPIENT       │
│       │                                            ▲           │
│       │   create-stream()                         │ claim()   │
│       │   100 USDCx / 60 blocks                   │           │
│       ▼                                            │           │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                 usdcx-streaming.clar                     │ │
│   │                                                          │ │
│   │   Stream #42                                             │ │
│   │   ┌────────────────────────────────────┐                 │ │
│   │   │ sender: ST1ABC...                  │                 │ │
│   │   │ recipient: ST2XYZ...               │                 │ │
│   │   │ amount: 100 USDCx                  │                 │ │
│   │   │ start: block 1000                  │                 │ │
│   │   │ end: block 1060                    │                 │ │
│   │   │ withdrawn: 0 → 50 → 100            │                 │ │
│   │   └────────────────────────────────────┘                 │ │
│   │                                                          │ │
│   │   Events: stream-created | stream-claimed | cancelled    │ │
│   └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│                           ▼                                    │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                 USDCx (SIP-010)                          │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
streaming-payments/
├── contracts/
│   ├── usdcx-streaming.clar    # Main streaming contract
│   └── mock-usdcx.clar         # SIP-010 test token
├── tests/
│   └── usdcx-stream_test.ts    # Comprehensive test suite
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # React + TypeScript + Stacks.js
│   │   ├── main.tsx
│   │   └── index.css           # Tailwind CSS
│   ├── package.json
│   └── tailwind.config.js
├── deployments/
│   └── default.testnet-plan.yaml
├── Clarinet.toml
├── DEPLOY.md                   # Deployment guide
└── README.md
```

---

## 📜 Smart Contract API

### `create-stream`

```clarity
(create-stream stream-id recipient amount duration token)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream-id` | `uint` | Unique identifier |
| `recipient` | `principal` | Who receives funds |
| `amount` | `uint` | Total amount (6 decimals) |
| `duration` | `uint` | Blocks until complete |
| `token` | `ft-trait` | SIP-010 token |

### `claim`

```clarity
(claim stream-id token)
```

Recipient withdraws all vested (earned) funds.

### `cancel-stream`

```clarity
(cancel-stream stream-id token)
```

Sender cancels. Recipient keeps vested, sender gets refund.

### Read-Only Functions

| Function | Returns |
|----------|---------|
| `(get-stream id)` | Full stream data |
| `(get-claimable id)` | Available to claim |
| `(get-vested id)` | Total unlocked |
| `(get-progress id)` | 0-100% complete |
| `(get-total-streams)` | Analytics counter |

---

## 🧪 Testing

```bash
clarinet test
```

**Coverage:**
- ✅ Create stream (valid + invalid params)
- ✅ Claim (partial, multiple, full)
- ✅ Cancel (mid-stream, after claims)
- ✅ Authorization checks
- ✅ Full lifecycle test

---

## 🎨 Frontend Features

| Feature | Description |
|---------|-------------|
| 🔌 Wallet Connect | Hiro Wallet / Xverse |
| 📊 Real-time Progress | Updates every 100ms |
| 💰 One-click Claim | Instant fund withdrawal |
| 📈 Live Stats | Balance, streamed, active |
| 🌙 Dark Theme | Professional UI |
| 📱 Responsive | Works on mobile |

---

## 🚀 Deployment

### Testnet

```bash
# 1. Get testnet STX
# Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet

# 2. Deploy
clarinet deployments apply --testnet

# 3. Update frontend
# Edit CONTRACT_ADDRESS in frontend/src/App.tsx
```

See `DEPLOY.md` for detailed instructions.

---

## 🔐 Security

| Check | Status |
|-------|--------|
| Only recipient can claim | ✅ |
| Only sender can cancel | ✅ |
| Cannot over-claim | ✅ |
| Safe math (no overflow) | ✅ |
| Event logging | ✅ |
| No reentrancy (Clarity) | ✅ |

---

## 💡 Error Codes

| Code | Meaning |
|------|---------|
| `u100` | Stream ID already exists |
| `u101` | Invalid duration |
| `u102` | Transfer failed |
| `u103` | Not the recipient |
| `u104` | Nothing to claim |
| `u105` | Claim failed |
| `u106` | Stream not found |
| `u107` | Not the sender |
| `u108` | Refund failed |
| `u109` | Invalid amount |
| `u110` | Cannot stream to self |

---

## 🗺️ Roadmap

- [x] Core streaming contract
- [x] SIP-010 integration
- [x] React frontend
- [x] Wallet connection
- [ ] Cliff vesting
- [ ] Multi-recipient streams
- [ ] Stream NFT receipts
- [ ] Mainnet deployment

---

## 🏆 Built For

<p align="center">
  <strong>Stacks Hackathon 2024</strong>
</p>

<p align="center">
  Demonstrating programmatic USDCx control with real-time payment streaming.
</p>

---

## 📄 License

MIT — use it, fork it, build on it.

---

<p align="center">
  <strong>Built with 💜 for the Stacks ecosystem</strong>
</p>
