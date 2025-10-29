# PriceGuessBook Smart Contract

FHE-powered decentralized price prediction market smart contract built with Zama fhEVM.

## 📋 Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Sepolia
npm run deploy:sepolia
```

## 📁 Project Structure

```
onchain/
├── contracts/           # Solidity smart contracts
│   └── PriceGuessBook.sol
├── scripts/            # Deployment and utility scripts
│   ├── deploy-sepolia.cjs
│   ├── check-deployment.cjs
│   ├── create-market.cjs
│   ├── settle-market.cjs
│   ├── verify-contract.cjs
│   └── export-abi.cjs
├── test/               # Contract tests
│   └── PriceGuessBook.test.ts
├── deployments/        # Deployment artifacts
├── hardhat.config.ts   # Hardhat configuration
└── package.json        # Dependencies and scripts
```

## 🔧 Available Scripts

### Development
- `npm run compile` - Compile smart contracts
- `npm run clean` - Remove build artifacts
- `npm test` - Run all tests
- `npm run test:gas` - Run tests with gas reporting
- `npm run coverage` - Generate test coverage report

### Deployment
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:full` - Compile + Deploy + Export ABI
- `npm run deploy:check` - Deploy and verify

### Management
- `npm run check` - Check deployment status
- `npm run verify` - Verify contract on Etherscan
- `npm run export-abi` - Export ABI to frontend
- `npm run create:market <id> <hours>` - Create new market
- `npm run settle:market <id> <price>` - Settle market

## 📖 Documentation

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🛡️ Security

This contract uses:
- **Zama fhEVM** for fully homomorphic encryption
- **OpenZeppelin** contracts for role management and security
- **Hardhat** for testing and deployment

## ⚠️ Important Notes

1. **FHE Operations**: Gas costs are higher due to FHE encryption/decryption
2. **Settlement**: Payout calculations may take several minutes
3. **Testing**: Always test on Sepolia before mainnet deployment
4. **Private Keys**: Never commit `.env` file to version control

## 📄 License

MIT License
