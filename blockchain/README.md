# ImpactPay Blockchain 
**Core Smart Contracts & Protocol Logic**

This directory contains the smart contracts, tests, and deployment scripts for the ImpactPay protocol on the Celo network. It utilizes a hybrid development environment with **Hardhat** for integration testing and **Foundry** for advanced security testing and scripting.

## 🏗 Project Structure

- `contracts/`: Core Solidity contracts.
  - `ImpactPay.sol`: Main protocol contract.
  - `MockERC20.sol`: Token for testing purposes.
- `foundry-tests/`: Foundry-based security and compliance tests.
- `test/`: Hardhat-based integration tests.
- `script/`: Foundry deployment and management scripts.
- `ignition/`: Hardhat Ignition deployment modules.

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/)
- [Foundry](https://getfoundry.sh/)

### Installation
```bash
bun install
```

### Compile
```bash
# Hardhat
bun run compile

# Foundry
forge build
```

### Testing
We maintain a dual-test suite to ensure maximum reliability.

```bash
# Run Hardhat Integration Tests
bun run test

# Run Foundry Security Tests
forge test
```

## 🛠 Deployment

To deploy to Celo Mainnet/Alfajores, ensure your `.env` is configured with a `DEPLOYER_PRIVATE_KEY`.

```bash
forge script script/DeployMainnet.s.sol --rpc-url <YOUR_RPC_URL> --broadcast
```

## 🔐 Security Audit Findings
A thorough security audit was performed on `ImpactPay.sol` (2026-04-24). Key resolutions include:
- Added creator/owner authorization to `claimFund`.
- Verified CEI pattern across all fund-handling functions.
- Addressed potential DoS vectors in scholarship refund loops.

Detailed logs are available in the root `DOCUMENT.md`.
