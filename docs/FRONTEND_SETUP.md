# Frontend Setup (Sui)

## 1. Install Dependencies

```bash
cd frontend
npm install
```

## 2. Configure Environment

Copy the example env and fill in your deployed package ID:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUI_CHAIN=sui:testnet
VITE_SUI_STREAM_PACKAGE_ID=0x<your_package_id>
VITE_SUI_STREAM_MODULE=stream
VITE_SUI_CLOCK_OBJECT_ID=0x6
```

| Variable | Description |
|----------|-------------|
| `VITE_SUI_CHAIN` | `sui:testnet`, `sui:mainnet`, or `sui:devnet` |
| `VITE_SUI_STREAM_PACKAGE_ID` | From `sui client publish` output |
| `VITE_SUI_STREAM_MODULE` | Module name (`stream`) |
| `VITE_SUI_CLOCK_OBJECT_ID` | Sui Clock object (`0x6`) |

## 3. Run

```bash
npm run dev
```

Open http://localhost:5173

## Getting the Package ID

1. Publish the Move package:
   ```bash
   cd sui
   sui client publish --gas-budget 100000000
   ```

2. The package ID appears in the output (e.g. `0x1234...abcd`).

3. Paste it into `VITE_SUI_STREAM_PACKAGE_ID` in `frontend/.env`.
