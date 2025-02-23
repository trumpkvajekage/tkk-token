# TrumpKvajeKage (TKK) Token

TrumpKvajeKage (TKK) is a Solana-based token designed with a total supply of 125 billion tokens, a 1% transfer fee, and a 3-year exponential vesting schedule (k=0.5) for 75 billion tokens. This repository contains the scripts and metadata necessary to create, launch, and manage the token on Solana Mainnet.

## Token Details
- **Total Supply**: 125,000,000,000 TKK (9 decimals).
- **Transfer Fee**: 1% (100 basis points), max 5 TKK per transfer, burned daily.
- **Initial Allocation**:
  - 25B TKK: Unlocked in Primary Wallet.
  - 25B TKK: Transferred to Second Wallet.
  - 75B TKK: Locked in vesting vault, released over 1,095 days.
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

## Usage
- **Update Configuration**:
- Replace RPC endpoint in scripts (e.g., QuickNode URL for privacy).
- Set `YourProgramIDHere` in `createSolanaToken.js` and `startProject.js` with deployed vesting program ID.
- Provide `wallet.json` with funded keypair.
- **Run Scripts**:
- Initialize: `node scripts/createSolanaToken.js`.
- Launch: `node scripts/startProject.js` (after updating placeholders).
- Automate Burns: Deploy `dailyFeeBurn.js` to AWS Lambda with environment variables.

## Anonymity
- **Execution**: Use a VPN and private RPC endpoint (e.g., QuickNode) to mask IP during script runs.
- **Wallet**: Keep `wallet.json` encrypted (e.g., `openssl enc -aes-256-cbc`) and avoid linking public key to identity.
- **GitHub**: Commits don’t expose IP—use pseudonymous account details.

## Socials
- Telegram: [https://t.me/Trump_Kvaje_Kage](https://t.me/Trump_Kvaje_Kage)
- Twitter: [https://x.com/trumpkvajekage?s=11](https://x.com/trumpkvajekage?s=11)
- Reddit: [https://www.reddit.com/r/TrumpKvajeKage/](https://www.reddit.com/r/TrumpKvajeKage/)
- Discord: [https://discord.gg/CAGubNKE](https://discord.gg/CAGubNKE)
- GitHub: [https://github.com/trumpkvajekage](https://github.com/trumpkvajekage)

## Contributing
Feel free to fork, review, or suggest improvements via issues or pull requests. Ensure anonymity practices align with the project’s ethos.
