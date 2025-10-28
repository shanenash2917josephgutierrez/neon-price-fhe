# PriceGuess - Encrypted Price Prediction Terminal

A fully homomorphic encryption (FHE) powered decentralized application for making encrypted price predictions on cryptocurrency assets. Built with Zama's fhEVM technology, ensuring complete privacy of predictions until settlement.

## 🌟 Project Overview

**PriceGuess** is an encrypted prediction market where users can:
- Place confidential bets on cryptocurrency price ranges
- Keep predictions private using FHE encryption
- Claim winnings after market settlement
- Experience a sci-fi themed terminal interface

### Key Features

- **🔐 Full Homomorphic Encryption**: All predictions are encrypted on-chain using Zama fhEVM
- **🎯 Range Prediction**: Predict whether prices will fall within a specified range
- **💰 Automated Payouts**: Smart contract calculates and distributes winnings
- **🎨 Cyberpunk UI**: Matrix-inspired terminal interface with neon aesthetics
- **🔗 Web3 Integration**: Seamless wallet connection with RainbowKit

## 🛠️ Technical Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Web3**: Wagmi v2 + RainbowKit v2
- **FHE SDK**: @zama-fhe/relayer-sdk@0.2.0
- **State Management**: Zustand + TanStack Query
- **Animations**: Framer Motion

### Smart Contract
- **Language**: Solidity ^0.8.24
- **FHE Library**: @fhevm/solidity@^0.8.0
- **Framework**: Hardhat ^2.22.3
- **Testing**: Chai + Hardhat Toolbox
- **Network**: Sepolia Testnet

## 📋 Prerequisites

- Node.js v20.11.1 or higher
- npm or yarn
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
# Clone the repository
git clone https://github.com/shanenash2917josephgutierrez/neon-price-fhe
cd neon-price-fhe

# Install frontend dependencies
npm install

# Install backend dependencies
cd onchain
npm install
cd ..
\`\`\`

### 2. Environment Configuration

Create a \`.env\` file in the root directory:

\`\`\`bash
# Project Information
PROJECT_NAME=价格预测游戏
PROJECT_EN_NAME=PriceGuess
PROJECT_INDEX=8

# GitHub Configuration
GITHUB_USERNAME=your-github-username
GITHUB_EMAIL=your-email@example.com
GITHUB_PAT=your-github-personal-access-token
GITHUB_LINK=https://github.com/your-username/your-repo

# Vercel Configuration
VERCEL_TOKEN=your-vercel-token

# Wallet Configuration
ADDRESS=your-wallet-address
PRIVATE_KEY=your-private-key-with-0x-prefix
EMAIL=your-email@example.com

# Frontend Environment Variables
VITE_CONTRACT_ADDRESS=deployed-contract-address
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
VITE_APP_NAME=PriceGuess
VITE_APP_DESCRIPTION=Encrypted price prediction terminal powered by FHE
VITE_APP_URL=http://localhost:5173

# Backend/Deployment Variables
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your-etherscan-api-key
\`\`\`

### 3. Smart Contract Deployment

\`\`\`bash
# Compile contracts
cd onchain
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npm run deploy:sepolia

# Verify contract (after deployment)
npm run verify

# Export ABI to frontend
npm run export-abi
\`\`\`

After deployment, update \`VITE_CONTRACT_ADDRESS\` in \`.env\` with the deployed contract address.

### 4. Run Frontend

\`\`\`bash
# Return to root directory
cd ..

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

Visit http://localhost:5173 to see the application.

## 📁 Project Structure

\`\`\`
08_PriceGuess/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── terminal/           # Terminal-specific components
│   │   │   ├── BetPanel.tsx    # Bet placement with FHE encryption
│   │   │   ├── RangeSelector.tsx # Price range selector
│   │   │   └── PositionTable.tsx # User positions display
│   │   ├── landing/            # Landing page components
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/                   # Page components
│   │   ├── Landing.tsx         # Marketing landing page
│   │   ├── Terminal.tsx        # Trading terminal
│   │   └── Positions.tsx       # User positions page
│   ├── config/                  # Configuration files
│   │   ├── wagmi.ts            # Wagmi & RainbowKit config
│   │   └── contract.ts         # Contract ABI & address
│   ├── hooks/                   # Custom React hooks
│   │   └── useContract.ts      # Contract interaction hooks
│   ├── utils/                   # Utility functions
│   │   ├── fheInstance.ts      # FHE SDK initialization
│   │   └── encryption.ts       # FHE encryption helpers
│   ├── store/                   # State management
│   │   └── terminalStore.ts    # Terminal state (Zustand)
│   └── App.tsx                  # App entry point
│
├── onchain/                     # Smart contract code
│   ├── contracts/              # Solidity contracts
│   │   └── PriceGuessBook.sol  # Main FHE prediction contract
│   ├── scripts/                # Deployment & utility scripts
│   │   ├── deploy-sepolia.cjs  # Deployment script
│   │   ├── verify-contract.cjs # Verification script
│   │   └── export-abi.cjs      # ABI export script
│   ├── test/                   # Contract tests
│   │   └── PriceGuessBook.test.ts
│   ├── deployments/            # Deployment artifacts
│   ├── hardhat.config.ts       # Hardhat configuration
│   └── package.json            # Backend dependencies
│
├── docs/                        # Documentation
│   ├── FRONTEND_DEV.md         # Frontend development guide
│   └── BACKEND_DEV.md          # Backend development guide
│
├── .env                         # Environment variables
├── package.json                 # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS config
└── README.md                    # This file
\`\`\`

## 🔐 FHE Implementation Details

### Encryption Flow

1. **User Input**: User selects price range and bet amount
2. **Client-Side Encryption**: FHE SDK encrypts data in browser
3. **Transaction Submission**: Encrypted handles + proof sent to contract
4. **On-Chain Storage**: Contract stores encrypted predictions
5. **Settlement**: Oracle submits settlement price
6. **Decryption**: Gateway decrypts winning stakes
7. **Payout**: Winners claim their proportional share

### Smart Contract Architecture

#### Core Data Structures

\`\`\`solidity
struct AssetMarket {
    uint256 settlementTimestamp;
    address oracle;
    bool settled;
    uint64 settledPrice;
    uint256 payoutRequestId;
    bool payoutReady;
}

struct GuessTicket {
    address bettor;
    uint256 assetId;
    bytes32 commitment;
    euint64 lower;          // Encrypted lower bound
    euint64 upper;          // Encrypted upper bound
    euint64 stake;          // Encrypted stake amount
    bool claimed;
    uint256 decryptionRequestId;
}

struct PoolStats {
    euint64 totalStake;     // Total encrypted stakes
    euint64 winningStake;   // Sum of winning encrypted stakes
}
\`\`\`

#### Key Functions

- **placeGuess()**: Submit encrypted price prediction
- **settleMarket()**: Settle market with final price
- **claim()**: Claim winnings after settlement
- **onPayoutRatioDecrypted()**: Gateway callback for payout ratio
- **onClaimDecrypted()**: Gateway callback for individual claims

### FHE Best Practices Applied

✅ **Correct Type Usage**: Using \`externalEuint64\` for encrypted inputs
✅ **ACL Management**: Calling \`FHE.allowThis()\` after operations
✅ **Fail-Closed Security**: Using \`FHE.select()\` for conditional logic
✅ **Gateway Integration**: Proper decryption request handling
✅ **Division Invariance**: Avoiding encrypted division by decrypting first
✅ **Commitment Scheme**: Preventing replay attacks with commitment hashes

## 🧪 Testing

### Contract Tests

\`\`\`bash
cd onchain
npm run test
\`\`\`

Test coverage includes:
- Deployment and initialization
- Market creation and management
- Role-based access control
- Pause functionality
- View functions
- ETH receiving

### Frontend Testing

\`\`\`bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Manual testing checklist:
# ✓ Wallet connection (MetaMask, WalletConnect)
# ✓ Range selection
# ✓ FHE encryption (check console logs)
# ✓ Transaction submission
# ✓ Transaction confirmation
\`\`\`

## 📊 Gas Estimates

| Operation | Estimated Gas | Notes |
|-----------|--------------|-------|
| placeGuess | ~2,000,000 | Includes FHE encryption operations |
| claim | ~1,500,000 | Includes decryption request |
| createMarket | ~1,000,000 | Admin only |
| settleMarket | ~3,000,000 | Loops through all tickets |

*Note: Gas costs are higher due to FHE operations on-chain*

## 🎨 UI Features

### Neon Trading Floor Theme

- **Primary Color**: `#06080F` (Deep Space)
- **Secondary Color**: `#10B981` (Neon Green)
- **Accent Color**: `#7C3AED` (Neon Purple)
- **Background**: Gradient with digital rain effect

### Components

1. **Landing Page**: Hero section, features, data partners
2. **Terminal**: Range selector, bet panel, live price ticker
3. **Positions**: Historical bets, settlement status, claim interface

## 🔧 Development

### Frontend Development

\`\`\`bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

### Contract Development

\`\`\`bash
cd onchain

# Clean build artifacts
npm run clean

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to local network
npx hardhat node  # Terminal 1
npm run deploy:sepolia  # Terminal 2 (with local network)
\`\`\`

## 🚢 Deployment

### Smart Contract Deployment

\`\`\`bash
# 1. Ensure .env is configured with PRIVATE_KEY and SEPOLIA_RPC_URL
# 2. Ensure you have Sepolia ETH (~0.5 ETH recommended)

# Deploy contract
cd onchain
npm run deploy:sepolia

# Output will include:
# - Contract address
# - Deployer address
# - Initial market creation (BTC, ETH)
# - Deployment info saved to deployments/sepolia-deployment.json

# Verify on Etherscan
npm run verify

# Export ABI to frontend
npm run export-abi
\`\`\`

### Frontend Deployment (Vercel)

\`\`\`bash
# 1. Update .env with deployed CONTRACT_ADDRESS
# 2. Ensure VERCEL_TOKEN is set

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or use the Vercel dashboard for GitHub integration
\`\`\`

## 📖 API Documentation

### Smart Contract ABI

The contract ABI is automatically exported to \`src/config/contract.ts\` after running \`npm run export-abi\`.

### Frontend Hooks

#### useMarket(assetId)
Read market information for a specific asset.

\`\`\`typescript
const { data: market, isLoading } = useMarket(1n); // BTC market
\`\`\`

#### usePlaceGuess()
Place an encrypted guess.

\`\`\`typescript
const { placeGuess, isPending, isConfirmed } = usePlaceGuess();

await placeGuess(
  assetId,
  encryptedLower,
  encryptedUpper,
  encryptedStake,
  proof,
  commitment
);
\`\`\`

#### useClaim()
Claim winnings from a ticket.

\`\`\`typescript
const { claim, isPending, isConfirmed } = useClaim();

await claim(ticketId);
\`\`\`

## 🔐 Security Considerations

1. **FHE Encryption**: All predictions are encrypted client-side before submission
2. **Commitment Scheme**: Prevents replay attacks using unique commitment hashes
3. **ACL Management**: Proper access control for encrypted data
4. **Fail-Closed Mode**: Invalid predictions result in zero stake
5. **ReentrancyGuard**: Protects claim function from reentrancy attacks
6. **Role-Based Access**: Admin, Market, and Oracle roles for contract management

## 🐛 Troubleshooting

### Common Issues

**FHE SDK fails to initialize**
- Ensure browser supports WebAssembly
- Check COOP/COEP headers (handled automatically by Vite)
- Clear browser cache and reload

**Contract compilation fails with "Stack too deep"**
- Ensure \`viaIR: true\` is set in hardhat.config.ts
- Already configured in this project

**Transaction fails with "Invalid oracle"**
- Ensure market is created by admin
- Check that oracle address is valid

**Wallet connection fails**
- Ensure you're on Sepolia testnet
- Check WalletConnect project ID is valid
- Try refreshing the page

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Zama**: For the fhEVM technology and FHE SDK
- **RainbowKit**: For the excellent wallet connection UI
- **shadcn/ui**: For the beautiful UI components
- **Hardhat**: For the development framework

## 📧 Contact

- **GitHub**: [@shanenash2917josephgutierrez](https://github.com/shanenash2917josephgutierrez)
- **Email**: tilapia.fold-0t@icloud.com
- **Project Link**: [https://github.com/shanenash2917josephgutierrez/neon-price-fhe](https://github.com/shanenash2917josephgutierrez/neon-price-fhe)

---

**Built with ❤️ using Zama FHE Technology**
