# Mainnet Deployment

Steps to deploy Stream Payments to Sui Mainnet.

## Prerequisites

- Sui CLI with mainnet configured
- Mainnet SUI for gas (publish uses ~0.1–0.5 SUI)

## 1. Configure Sui CLI for mainnet

```bash
sui client switch env mainnet
# Or add to ~/.sui/sui_config.yaml
```

## 2. Publish the Move package

```bash
cd sui
sui client publish --gas-budget 100000000
```

Copy the **Package ID** from the output.

## 3. Configure frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```
VITE_SUI_CHAIN=sui:mainnet
VITE_SUI_STREAM_PACKAGE_ID=0x<your_mainnet_package_id>
VITE_SUI_STREAM_MODULE=stream
VITE_SUI_CLOCK_OBJECT_ID=0x6
```

## 4. Verify on Suiexplorer

Open `https://suiexplorer.com/object/<package_id>?network=mainnet`

## 5. Update submission data

Add mainnet package ID and tx digest to `docs/sui-submission/DEPLOYMENT_DATA.md`.
