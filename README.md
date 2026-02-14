# Stream Payments

<p align="center">
  <img src="https://img.shields.io/badge/Sui-Move-6fbcf0?style=for-the-badge" alt="Sui" />
  <img src="https://img.shields.io/badge/React-Vite-61dafb?style=for-the-badge" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <strong>Real-time payment streams on Sui</strong>
</p>

<p align="center">
  Stream money like streaming music. Pay by the second, not by the month.
</p>

---

## The Problem

Traditional payments are **all-or-nothing**:
- Pay employees once a month → they wait 30 days
- Grant funding released in bulk → no accountability
- Subscriptions charge upfront → no flexibility

## The Solution

**Stream Payments** enables continuous, real-time payments on Sui:
- **Payroll** — Employees earn every second they work
- **Grants** — Funding flows as milestones progress
- **Subscriptions** — Pay only for what you use
- **Vesting** — Token unlocks happen continuously

---

## Quick Start

```bash
# 1. Publish the Move package
cd sui
sui client publish --gas-budget 100000000

# 2. Configure frontend
cd ../frontend
cp .env.example .env
# Edit .env: VITE_SUI_STREAM_PACKAGE_ID=0x<your_package_id>

# 3. Run
npm install && npm run dev
# Open http://localhost:5173
```

See [docs/QUICK_START_SUI.md](docs/QUICK_START_SUI.md) for full setup.

---

## Architecture (Sui)

```
SENDER                              RECIPIENT
   │                                     ▲
   │  create_stream()                    │ claim()
   │  coin + start/end                   │
   ▼                                     │
┌─────────────────────────────────────────────────┐
│  streaming_payment::stream (Move)                │
│  Stream<T> ─────────────────────────────────────│
│  • sender, recipient, total_amount               │
│  • withdrawn_amount, start/end_time_ms           │
│  • optional cliff_time_ms (cliff vesting)        │
│  • Events: StreamCreated | Claimed | Cancelled   │
└─────────────────────────────────────────────────┘
```

---

## Project Structure

```
streaming-payment/
├── sui/                    # Move package
│   ├── sources/stream.move  # create_stream, claim, cancel
│   └── Move.toml
├── frontend/                # React + Vite + @mysten/dapp-kit
│   ├── src/App.tsx
│   ├── config.sui.ts
│   └── .env.example
├── docs/
│   ├── QUICK_START_SUI.md
│   ├── FRONTEND_SETUP.md
│   ├── sui-architecture.md
│   └── sui-submission/
└── README.md
```

---

## Move API

| Function | Description |
|----------|-------------|
| `create_stream<T>(recipient, coin, start_ms, end_ms)` | Linear vesting from start to end |
| `create_stream_with_cliff<T>(recipient, coin, start_ms, cliff_ms, end_ms)` | Cliff vesting: no vest until cliff, then linear to end |
| `claim<T>(stream, clock)` | Recipient withdraws vested funds |
| `cancel<T>(stream, clock)` | Sender cancels; recipient keeps vested, sender refunded |

Error codes: see [docs/sui-architecture.md](docs/sui-architecture.md#move-error-codes-streammove).

---

## Frontend Features

| Feature | Description |
|---------|-------------|
| Sui Wallet Connect | Sui Wallet, Suiet, Ethos, Surf |
| Real-time progress | Live vesting progress per stream |
| One-click claim / cancel | Claim vested funds, cancel and refund |
| Presets | Amount and duration presets per use case |
| Stream history | View completed and cancelled streams |
| Error messages | Move error codes mapped to user-friendly text |

---

## Security

| Check | Status |
|-------|--------|
| Only recipient can claim | ✅ |
| Only sender can cancel | ✅ |
| Cannot over-claim | ✅ |
| Event logging | ✅ |

---

## License

MIT
