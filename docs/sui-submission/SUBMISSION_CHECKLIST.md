# Sui Program Monthly Submission Checklist

Use this checklist when preparing submissions for Sui ecosystem programs (grants, RFPs, etc.).

---

## Repo Structure

- [x] `sui/` – Move package (`stream` module)
- [x] `sui/sources/stream.move` – Core streaming logic
- [x] `frontend/` – React + Vite app wired to Sui
- [x] `docs/sui-architecture.md` – Technical design
- [x] `docs/sui-submission/` – Submission data and checklist

---

## Required Data

- [ ] **Package ID** – From `sui client publish` (see `DEPLOYMENT_DATA.md`)
- [ ] **Tx digest** – Publish transaction (for verification)
- [ ] **Chain** – Testnet or Mainnet

---

## Pre-Submission

- [ ] Get testnet SUI from https://faucet.sui.io (if publishing to testnet)
- [ ] Publish package to Sui Testnet/Mainnet
- [ ] Fill `docs/sui-submission/DEPLOYMENT_DATA.md`
- [ ] Configure `frontend/.env` with `VITE_SUI_STREAM_PACKAGE_ID`
- [ ] Verify package on Suiexplorer
- [ ] Run frontend: `cd frontend && npm run dev`
- [ ] Smoke-test: create stream, claim (if possible)

---

## Submission Package

Bundle these for monthly submission:

1. **Deployment data**: `docs/sui-submission/DEPLOYMENT_DATA.md` (filled)
2. **Repo link**: GitHub/GitLab URL
3. **Package link**: Suiexplorer link to package object
4. **Tx link**: Suiexplorer link to publish tx
5. **README** (or project overview) with:
   - What the project does
   - How to run (clone, publish, configure `.env`, `npm run dev`)
   - Links to package and tx

---

## Quick Commands

```bash
# Get testnet SUI (if needed)
# Visit https://faucet.sui.io and enter: sui client active-address

# Publish
cd sui && sui client publish --gas-budget 100000000

# Run frontend (after setting VITE_SUI_STREAM_PACKAGE_ID in .env)
cd frontend && npm install && npm run dev
```
