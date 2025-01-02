# RugSafe Protocol - dApp

![RugSafe Logo](https://rugsafe.io/_next/static/media/logo5.7217ba98.png)

RugSafe is a cutting-edge multichain protocol designed to address and mitigate rug-pull risks in decentralized finance (DeFi). This Next.js DApp provides an intuitive interface for users to interact with RugSafe's features, including vaults, DEX, perpetuals, liquidity pools, and rug detector intents.

| Status Type          | Status                                                                 |
|----------------------|-------------------------------------------------------------------------|
| **Development Build**| [![Development Build](https://github.com/rugsafe/dapp/actions/workflows/pipeline.yml/badge.svg)](https://github.com/rugsafe/dapp/actions/workflows/pipeline.yml) |
| **Issues**           | [![Issues](https://img.shields.io/github/issues/rugsafe/dapp.svg)](https://github.com/rugsafe/dapp/issues) |
| **Last Commit**      | [![Last commit](https://img.shields.io/github/last-commit/rugsafe/dapp.svg)](https://github.com/rugsafe/dapp/commits/main) |
| **License**          | [![License](https://img.shields.io/badge/license-APACHE-blue.svg)](https://github.com/rugsafe/dapp/blob/main/LICENSE) |

## Protocol Overview

The RugSafe DApp integrates recovery mechanisms and financial instruments to empower DeFi users through:

1. **Vaults**: Securely deposit rugged tokens to receive anti-coins.
2. **Perpetual Contracts**: Advanced trading instruments with collateralized leverage.
3. **Decentralized Exchange (DEX)**: Swap rugged tokens, anti-coins, and stable assets.
4. **Liquidity Pools**: Add/remove liquidity and view pool statistics.
5. **Rug Detector Intents**: Configure monitoring bots for proactive asset protection.

## Key Features

### Vaults
- **Token Recovery**: Deposit rugged tokens to mint anti-coins.
- **Anti-Coins**: Inversely pegged to rugged tokens for stability.
- **Secure Tracking**: Manage vault assets efficiently.

### Perpetuals
- **Leverage Trading**: Initiate long or short positions.
- **Collateral Management**: Add/remove collateral dynamically.
- **Liquidation Mechanisms**: Protect under-collateralized positions.

### DEX
- **Trading Infrastructure**: Swap assets with ease.
- **Market Stability**: Monitor prices for anti-coin pegging.
- **Liquidity Support**: Incentivize providers with rewards.

### Liquidity Pools
- **Pool Statistics**: View detailed data about liquidity pools.
- **Add Liquidity**: Stake assets into pools for rewards.
- **Remove Liquidity**: Manage existing positions seamlessly.

### Rug Detector Intents
- **Intent Configuration**: Set automated intents for asset protection.
- **Proactive Monitoring**: Utilize bots for liquidity and risk assessment.
- **Custom Triggers**: Define actions based on your preferences.

## This Repository

This repository contains the Next.js implementation of RugSafe's DApp. It features:

1. **Vault Interaction**: Secure rugged tokens and mint anti-coins.
2. **DEX Interaction**: Swap assets directly within the DApp.
3. **Perpetual Trading**: Manage and trade leveraged positions.
4. **Liquidity Management**: Add or remove liquidity from pools.
5. **Rug Detection**: Set and manage intents for automated monitoring.

## Quick Start

### Setting Up the Environment

Ensure you have the following tools installed:
- **Node.js**: [Download Node.js](https://nodejs.org/)
- **Yarn**: [Install Yarn](https://classic.yarnpkg.com/en/docs/install)
- **Docker**: (Optional) for running backend services locally.

### Installation

Clone the repository:
\`\`\`bash
git clone https://github.com/rugsafe/nextjs-dapp.git
cd nextjs-dapp
\`\`\`

Install dependencies:
\`\`\`bash
yarn install
\`\`\`

### Development

Run the development server:
\`\`\`bash
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production Build

Build the application:
\`\`\`bash
yarn build
\`\`\`

Start the production server:
\`\`\`bash
yarn start
\`\`\`


---

## Contributing

We welcome contributions to RugSafe! Join our community and help shape the future of DeFi:
- **Discord**: [Join our community](https://discord.gg/ecMQ2D6nsu)
- **Telegram**: [Join the chat](https://t.me/rugsafe)

---

## License

RugSafe dApp is released under the [MIT License](LICENSE).

---

**Note**: This repository is under active development and may undergo significant changes. For a detailed understanding of RugSafe, refer to our [white paper](https://rugsafe.io/assets/paper/rugsafe.pdf).
