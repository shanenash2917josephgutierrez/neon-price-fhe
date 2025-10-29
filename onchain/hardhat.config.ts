/**
 * Hardhat Configuration for PriceGuess FHE DApp
 *
 * This configuration file sets up the Hardhat development environment for:
 * - Solidity compilation with FHE support
 * - Local testing and deployment
 * - Sepolia testnet deployment
 * - Contract verification on Etherscan
 *
 * @see https://hardhat.org/config/
 */

import { config as loadEnv } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Load environment variables from parent directory
loadEnv({ path: "../.env" });

/**
 * Environment Variables
 * These should be defined in your .env file in the project root
 */
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/**
 * Hardhat Configuration
 */
const config: HardhatUserConfig = {
  /**
   * Solidity Compiler Configuration
   *
   * Version: 0.8.24 (required for @fhevm/solidity compatibility)
   * Optimizer: Enabled for gas efficiency (200 runs)
   * viaIR: Enabled to fix "stack too deep" errors common in FHE contracts
   *
   * @see https://docs.soliditylang.org/en/latest/using-the-compiler.html
   */
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for typical usage (200 runs)
      },
      viaIR: true, // Enable IR-based code generation (fixes stack depth issues)
      evmVersion: "cancun", // Use latest EVM version for Sepolia
    },
  },

  /**
   * Default Network
   * Uses local Hardhat network for testing by default
   */
  defaultNetwork: "hardhat",

  /**
   * Network Configurations
   */
  networks: {
    /**
     * Local Hardhat Network
     * - Fast local blockchain for testing
     * - Reset state between test runs
     * - No real ETH required
     */
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true, // Allow large contracts during development
      gas: "auto", // Automatic gas estimation
      gasPrice: "auto",
      // Uncomment to enable console.log in contracts during testing
      // loggingEnabled: true,
    },

    /**
     * Sepolia Testnet
     * - Public Ethereum test network
     * - Required for Zama FHE operations
     * - Free testnet ETH available from faucets
     *
     * Faucets:
     * - https://sepoliafaucet.com
     * - https://sepolia-faucet.pk910.de
     */
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gas: "auto",
      gasPrice: "auto",
      timeout: 120000, // 2 minutes timeout for slow RPC responses
    },

    /**
     * Localhost Network
     * For connecting to a local Ethereum node (e.g., Ganache)
     */
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },

  /**
   * Etherscan Configuration
   * For contract verification after deployment
   *
   * Usage: npx hardhat verify --network sepolia <contract-address> <constructor-args>
   * @see https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify
   */
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
    },
  },

  /**
   * Gas Reporter Configuration (optional)
   * Uncomment to enable gas usage reporting during tests
   */
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS === "true",
  //   currency: "USD",
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  // },

  /**
   * Path Configuration
   * Customize where Hardhat looks for files
   */
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  /**
   * Mocha Test Configuration
   * Configure test runner behavior
   */
  mocha: {
    timeout: 300000, // 5 minutes timeout for FHE operations
    bail: false, // Continue running tests after failure
  },

  /**
   * TypeChain Configuration
   * Auto-generate TypeScript bindings for contracts
   */
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

/**
 * Validate Configuration
 * Warn if critical environment variables are missing
 */
if (!PRIVATE_KEY && process.env.NODE_ENV !== "test") {
  console.warn("\n⚠️  WARNING: PRIVATE_KEY not set in .env file");
  console.warn("   Deployment to Sepolia will not be possible\n");
}

if (!ETHERSCAN_API_KEY && process.env.NODE_ENV !== "test") {
  console.warn("\n⚠️  WARNING: ETHERSCAN_API_KEY not set in .env file");
  console.warn("   Contract verification will not be possible\n");
}

export default config;
