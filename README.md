# TrumpKvajeKage (TKK) Token

TrumpKvajeKage (TKK) is a Solana-based token designed with a total supply of 1 billion tokens, a 1% transfer fee, and a 3-year exponential vesting schedule (k=0.5) for 600 million tokens. This repository contains the scripts and metadata necessary to create, launch, and manage the token on Solana Mainnet.

## Token Details
- **Total Supply**: 1,000,000,000 TKK (9 decimals).
- **Transfer Fee**: 1% (100 basis points), max 5 TKK per transfer, burned daily.
- **Initial Allocation**:
  - 200M TKK: Unlocked in Primary Wallet.
  - 200M TKK: Transferred to Second Wallet.
  - 600M TKK: Locked in vesting vault, released over 1,095 days.
- **Vesting Schedule**: Exponential (k=0.5), starting when triggered, releasing 600M TKK to Primary Wallet.

## Repository Structure
- **scripts/**: Core JavaScript scripts for token management.
  - `createSolanaToken.js`: Initializes the mint, allocates tokens, sets up vesting vault with 0% initial fee.
  - `startProject.js`: Sets 1% transfer fee and triggers vesting start.
  - `dailyFeeBurn.js`: Withdraws and burns transfer fees daily (AWS Lambda-ready).
- **metadata/**: Token metadata and assets.
  - `tkk-metadata.json`: Metadata including name, symbol, and socials.
  - `trumpkvajekage.png`: Token image (optional).

## Prerequisites
- **Node.js**: v18.x or later (`brew install node` on macOS).
- **Solana CLI**: For wallet creation (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`).
- **Dependencies**: Install via npm:
  ```bash
  npm install @solana/web3.js @solana/spl-token @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata
