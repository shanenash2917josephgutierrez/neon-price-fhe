# PriceGuessBook Smart Contract Deployment Guide

Complete guide for deploying, testing, and managing the PriceGuessBook FHE smart contract.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Compilation](#compilation)
4. [Testing](#testing)
5. [Deployment to Sepolia](#deployment-to-sepolia)
6. [Post-Deployment](#post-deployment)
7. [Market Management](#market-management)
8. [Troubleshooting](#troubleshooting)
9. [Scripts Reference](#scripts-reference)

---

## Prerequisites

### Required Software

```bash
# Node.js (v20.11.1 or higher)
node --version

# npm or yarn
npm --version
```

### Required Accounts

1. **Sepolia Testnet Account**
   - Get testnet ETH from faucets:
     - https://sepoliafaucet.com
     - https://sepolia-faucet.pk910.de
   - Recommended balance: 0.5 ETH

2. **Etherscan API Key** (optional, for verification)
   - Sign up at: https://etherscan.io/register
   - Get API key from: https://etherscan.io/myapikey

---

## Environment Setup

### 1. Install Dependencies

```bash
cd onchain
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (`../`):

```bash
# Contract Deployment
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=0x... # Your wallet private key (with 0x prefix)
ADDRESS=0x... # Your wallet address

# Contract Verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Frontend Configuration
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

⚠️ **Security Warning**: Never commit `.env` file to git. It's already in `.gitignore`.

---

## Compilation

### Compile Contracts

```bash
npm run compile
```

**Expected Output:**
```
Compiled 1 Solidity file successfully
```

### Clean Build Artifacts

```bash
npm run clean
```

This removes:
- `artifacts/`
- `cache/`
- `typechain-types/`

### Verify Compilation Settings

Hardhat is configured with:
- **Solidity Version**: 0.8.24
- **Optimizer**: Enabled (200 runs)
- **viaIR**: Enabled (fixes stack too deep errors)
- **EVM Version**: Cancun

See `hardhat.config.ts` for details.

---

## Testing

### Run All Tests

```bash
npm test
```

**Test Suite Includes:**
- ✅ Contract deployment
- ✅ Role management
- ✅ Market creation
- ✅ Pause functionality
- ✅ ETH transfers

### Run Tests with Gas Reporting

```bash
npm run test:gas
```

### Run Specific Test File

```bash
npx hardhat test test/PriceGuessBook.test.ts
```

### Run Tests with Coverage

```bash
npm run coverage
```

Generates coverage report in `coverage/` directory.

---

## Deployment to Sepolia

### Step 1: Verify Environment

Check that your environment is properly configured:

```bash
# Check your wallet balance
npx hardhat run scripts/check-balance.cjs --network sepolia
```

### Step 2: Deploy Contract

**Option A: Quick Deployment**
```bash
npm run deploy:sepolia
```

**Option B: Full Deployment (Compile + Deploy + Export ABI)**
```bash
npm run deploy:full
```

**Deployment Process:**
1. Deploys PriceGuessBook contract
2. Creates initial markets (BTC, ETH)
3. Saves deployment info to `deployments/sepolia-deployment.json`
4. Outputs contract address for frontend configuration

**Expected Output:**
```
========================================
🚀 Deploying PriceGuessBook to Sepolia
========================================

📝 Deploying with account: 0x...
💰 Account balance: 1.5 ETH

⏳ Deploying contract...

✅ Contract deployed to: 0x...
📋 Deployer (admin): 0x...

⏳ Creating initial asset markets...

Creating BTC market (ID: 1)...
✅ BTC market created
Creating ETH market (ID: 2)...
✅ ETH market created

📊 Market Details:
   Settlement Time: 2025-10-30T...
   Oracle Address: 0x...

💾 Deployment info saved to: deployments/sepolia-deployment.json

========================================
📋 Frontend Configuration
========================================

Add this to your .env file:
VITE_CONTRACT_ADDRESS=0x...
VITE_SEPOLIA_CHAIN_ID=11155111

✅ Deployment complete!
```

### Step 3: Verify Deployment

```bash
npm run check
```

This verifies:
- ✅ Contract code exists on-chain
- ✅ Role assignments are correct
- ✅ Markets are configured
- ✅ Contract state is valid

---

## Post-Deployment

### 1. Verify Contract on Etherscan

**Automatic Verification:**
```bash
npm run verify
```

**Manual Verification:**
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "<DEPLOYER_ADDRESS>"
```

Example:
```bash
npx hardhat verify --network sepolia 0xAbC123... "0xDeF456..."
```

### 2. Update Frontend Configuration

Copy the contract address to your frontend `.env` file:

```bash
# In project root .env
VITE_CONTRACT_ADDRESS=0x... # From deployment output
```

### 3. Export ABI to Frontend

```bash
npm run export-abi
```

This copies the contract ABI to `src/config/contract.ts`.

---

## Market Management

### Check Current Markets

```bash
npm run check
```

### Create New Market

```bash
# Usage: npm run create:market <assetId> <settlementHours>
npm run create:market 3 24

# Examples:
npm run create:market 3 24    # SOL, settles in 24 hours
npm run create:market 4 168   # BNB, settles in 7 days
```

**Asset ID Mapping:**
- 1 = BTC
- 2 = ETH
- 3 = SOL
- 4 = BNB
- (Add more as needed)

### Settle Market

```bash
# Usage: npm run settle:market <assetId> <settledPrice>
npm run settle:market 1 95000.50

# Examples:
npm run settle:market 1 95000.50  # Settle BTC at $95,000.50
npm run settle:market 2 3500.25   # Settle ETH at $3,500.25
```

**Requirements:**
- Must have ORACLE_ROLE
- Settlement time must have passed
- Market must not already be settled

**Note:** Price is automatically scaled by 1e8 (satoshi-like precision).

---

## Troubleshooting

### Common Errors

#### 1. "Insufficient funds for gas"

**Problem:** Not enough ETH in your wallet.

**Solution:**
```bash
# Check balance
npx hardhat console --network sepolia
> ethers.provider.getBalance("YOUR_ADDRESS")

# Get testnet ETH from faucets
```

#### 2. "Nonce too high"

**Problem:** Transaction nonce mismatch.

**Solution:**
```bash
# Reset local nonce
rm -rf cache/
npm run compile
```

#### 3. "Stack too deep" compilation error

**Problem:** Complex function requires IR compilation.

**Solution:** Already configured in `hardhat.config.ts`:
```typescript
viaIR: true
```

#### 4. "Invalid oracle"

**Problem:** Trying to create market with zero address.

**Solution:**
```bash
# Ensure you're using a valid address
npm run create:market <assetId> <hours>
```

#### 5. "Market already exists"

**Problem:** Trying to create duplicate market.

**Solution:**
```bash
# Check existing markets
npm run check

# Use different asset ID
```

### Getting Help

If you encounter issues:

1. Check the error message carefully
2. Review `deployments/sepolia-deployment.json`
3. Verify network configuration in `hardhat.config.ts`
4. Check Sepolia Etherscan for transaction status
5. Consult Hardhat documentation: https://hardhat.org/docs

---

## Scripts Reference

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run clean` | Remove build artifacts |
| `npm test` | Run all tests |
| `npm run test:gas` | Run tests with gas reporting |
| `npm run coverage` | Generate test coverage report |

### Deployment Scripts

| Command | Description |
|---------|-------------|
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run deploy:full` | Compile + Deploy + Export ABI |
| `npm run deploy:check` | Deploy and verify |

### Management Scripts

| Command | Description |
|---------|-------------|
| `npm run check` | Check deployment status |
| `npm run verify` | Verify contract on Etherscan |
| `npm run export-abi` | Export ABI to frontend |
| `npm run create:market <id> <hours>` | Create new market |
| `npm run settle:market <id> <price>` | Settle market |

### Utility Scripts

| Command | Description |
|---------|-------------|
| `npm run node` | Start local Hardhat node |
| `npm run console` | Open Hardhat console (Sepolia) |

---

## Deployment Checklist

### Pre-Deployment

- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env` file
- [ ] Have at least 0.5 ETH on Sepolia
- [ ] Compile contracts successfully (`npm run compile`)
- [ ] Pass all tests (`npm test`)

### Deployment

- [ ] Deploy contract (`npm run deploy:sepolia`)
- [ ] Save contract address
- [ ] Verify deployment (`npm run check`)
- [ ] Verify on Etherscan (`npm run verify`)

### Post-Deployment

- [ ] Export ABI to frontend (`npm run export-abi`)
- [ ] Update frontend `.env` with contract address
- [ ] Test contract interaction from frontend
- [ ] Create additional markets if needed
- [ ] Document deployment details

---

## Security Best Practices

1. **Private Key Management**
   - Never commit `.env` to git
   - Use hardware wallet for mainnet
   - Keep backup of private key secure

2. **Role Management**
   - Only grant ORACLE_ROLE to trusted addresses
   - Use multi-sig for DEFAULT_ADMIN_ROLE on mainnet
   - Document all role grants

3. **Testing**
   - Always test on Sepolia before mainnet
   - Test all market scenarios
   - Verify FHE encryption works correctly

4. **Monitoring**
   - Monitor contract for unexpected behavior
   - Set up alerts for large transactions
   - Regularly check contract balance

---

## Network Information

### Sepolia Testnet

- **Chain ID**: 11155111
- **RPC URL**: https://ethereum-sepolia-rpc.publicnode.com
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucets**:
  - https://sepoliafaucet.com
  - https://sepolia-faucet.pk910.de

### Contract Gas Limits

| Operation | Gas Limit | Notes |
|-----------|-----------|-------|
| `placeGuess` | 2,000,000 | FHE encryption operations |
| `claim` | 1,500,000 | Decryption request |
| `createMarket` | 1,000,000 | Admin only |
| `settleMarket` | 3,000,000 | Loops through tickets |

---

## Example Workflow

### Complete Deployment Workflow

```bash
# 1. Install and compile
npm install
npm run compile

# 2. Run tests
npm test

# 3. Deploy to Sepolia
npm run deploy:full

# 4. Verify deployment
npm run check

# 5. Verify on Etherscan
npm run verify

# 6. Create additional market
npm run create:market 3 24

# 7. After 24 hours, settle market
npm run settle:market 3 125.50
```

### Frontend Integration Workflow

```bash
# 1. Deploy contract
cd onchain
npm run deploy:full

# 2. Export ABI
npm run export-abi

# 3. Update frontend .env
cd ..
echo "VITE_CONTRACT_ADDRESS=<deployed-address>" >> .env

# 4. Test frontend
npm run dev
```

---

## Additional Resources

### Documentation

- **Hardhat**: https://hardhat.org/docs
- **Zama fhEVM**: https://docs.zama.ai/fhevm
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts
- **Ethers.js**: https://docs.ethers.org/v6/

### Tools

- **Sepolia Faucet**: https://sepoliafaucet.com
- **Etherscan**: https://sepolia.etherscan.io
- **Hardhat Network**: https://hardhat.org/hardhat-network/

### Support

- **GitHub Issues**: [Your Repository Issues]
- **Hardhat Discord**: https://hardhat.org/discord
- **Zama Community**: https://docs.zama.ai/community

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
**Author**: PriceGuess Development Team
