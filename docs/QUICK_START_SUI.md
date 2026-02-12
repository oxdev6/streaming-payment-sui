# Quick Start — Sui

Get Stream Payments running on Sui in 5 minutes.

## Prerequisites

- [Sui CLI](https://docs.sui.io/build/install) installed
- [Node.js](https://nodejs.org/) 18+
- Sui wallet (Sui Wallet, Suiet, Ethos, etc.)

## 1. Clone & install

```bash
git clone https://github.com/oxdev6/streaming-payment-sui.git
cd streaming-payment-sui/frontend
npm install
```

## 2. Get testnet SUI

Visit [faucet.sui.io](https://faucet.sui.io) and request tokens for your wallet address.

## 3. Publish the Move package

```bash
cd ../sui
sui client publish --gas-budget 100000000
```

Copy the **Package ID** from the output (e.g. `0x698c2d42a1f82ba1ab0d92eae781485c57928d4034427cd438470777df9cae28`).

## 4. Configure frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env` and set:

```
VITE_SUI_CHAIN=sui:testnet
VITE_SUI_STREAM_PACKAGE_ID=0x<your_package_id>
VITE_SUI_STREAM_MODULE=stream
VITE_SUI_CLOCK_OBJECT_ID=0x6
```

## 5. Run

```bash
npm run dev
```

Open **http://localhost:5173**. Connect your wallet, create a stream, and claim.

## Links

- [Full frontend setup](./FRONTEND_SETUP.md)
- [Deployment data](./sui-submission/DEPLOYMENT_DATA.md)
