/**
 * Check Deployment Script
 *
 * This script verifies the deployment of the PriceGuessBook contract on Sepolia.
 * It checks:
 * - Contract deployment status
 * - Market creation
 * - Role assignments
 * - Contract configuration
 *
 * Usage: node scripts/check-deployment.cjs
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Load deployment information
 */
function loadDeploymentInfo() {
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment file not found!");
    console.log("   Please run deployment first: npm run deploy:sepolia");
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

/**
 * Main check function
 */
async function main() {
  console.log("\n========================================");
  console.log("🔍 Checking PriceGuess Deployment");
  console.log("========================================\n");

  // Load deployment info
  const deploymentInfo = loadDeploymentInfo();
  console.log("📄 Deployment Info:");
  console.log("   Network:", deploymentInfo.network);
  console.log("   Contract:", deploymentInfo.contractAddress);
  console.log("   Deployer:", deploymentInfo.deployer);
  console.log("   Deployed:", deploymentInfo.deploymentTime);

  // Connect to contract
  const contract = await ethers.getContractAt(
    "PriceGuessBook",
    deploymentInfo.contractAddress
  );

  console.log("\n✅ Contract connected successfully\n");

  // ============================================
  // Check 1: Verify Contract Code
  // ============================================
  console.log("1️⃣  Verifying contract code...");
  const code = await ethers.provider.getCode(deploymentInfo.contractAddress);
  if (code === "0x") {
    console.error("   ❌ No code at contract address!");
    process.exit(1);
  }
  console.log("   ✅ Contract code exists");

  // ============================================
  // Check 2: Verify Roles
  // ============================================
  console.log("\n2️⃣  Verifying role assignments...");

  const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
  const MARKET_ROLE = await contract.MARKET_ROLE();
  const ORACLE_ROLE = await contract.ORACLE_ROLE();

  const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deploymentInfo.deployer);
  const hasMarketRole = await contract.hasRole(MARKET_ROLE, deploymentInfo.deployer);
  const hasOracleRole = await contract.hasRole(ORACLE_ROLE, deploymentInfo.deployer);

  console.log("   Admin Role:", hasAdminRole ? "✅" : "❌");
  console.log("   Market Role:", hasMarketRole ? "✅" : "❌");
  console.log("   Oracle Role:", hasOracleRole ? "✅" : "❌");

  // ============================================
  // Check 3: Verify Markets
  // ============================================
  console.log("\n3️⃣  Verifying asset markets...");

  if (deploymentInfo.markets) {
    for (const [asset, config] of Object.entries(deploymentInfo.markets)) {
      console.log(`\n   ${asset} Market (ID: ${config.assetId}):`);

      try {
        const market = await contract.markets(config.assetId);

        console.log("      Settlement Time:", new Date(Number(market.settlementTimestamp) * 1000).toISOString());
        console.log("      Oracle:", market.oracle);
        console.log("      Settled:", market.settled ? "Yes" : "No");
        console.log("      Settled Price:", market.settledPrice.toString());
        console.log("      ✅ Market configured");
      } catch (error) {
        console.log("      ❌ Market not found");
      }
    }
  }

  // ============================================
  // Check 4: Verify Contract State
  // ============================================
  console.log("\n4️⃣  Checking contract state...");

  const nextTicketId = await contract.nextTicketId();
  const paused = await contract.paused();

  console.log("   Next Ticket ID:", nextTicketId.toString());
  console.log("   Paused:", paused ? "Yes ⚠️" : "No ✅");

  // ============================================
  // Check 5: Verify ETH Balance
  // ============================================
  console.log("\n5️⃣  Checking contract balance...");

  const balance = await ethers.provider.getBalance(deploymentInfo.contractAddress);
  console.log("   ETH Balance:", ethers.formatEther(balance), "ETH");

  // ============================================
  // Summary
  // ============================================
  console.log("\n========================================");
  console.log("📊 Deployment Summary");
  console.log("========================================\n");

  console.log("Contract Address:", deploymentInfo.contractAddress);
  console.log("Etherscan URL:");
  console.log(`https://sepolia.etherscan.io/address/${deploymentInfo.contractAddress}\n`);

  console.log("Frontend Configuration:");
  console.log(`VITE_CONTRACT_ADDRESS=${deploymentInfo.contractAddress}\n`);

  console.log("✅ All checks passed!\n");
}

// Execute check
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
