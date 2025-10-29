/**
 * Create Market Script
 *
 * This script creates a new asset market on the deployed PriceGuessBook contract.
 * Useful for adding new prediction markets after initial deployment.
 *
 * Usage: node scripts/create-market.cjs <assetId> <settlementHours>
 * Example: node scripts/create-market.cjs 3 24
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
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("\n📝 Usage: node scripts/create-market.cjs <assetId> <settlementHours>\n");
    console.log("Examples:");
    console.log("  node scripts/create-market.cjs 3 24   # Create market for asset ID 3, settle in 24 hours");
    console.log("  node scripts/create-market.cjs 4 168  # Create market for asset ID 4, settle in 7 days");
    console.log("");
    process.exit(1);
  }

  const assetId = parseInt(args[0]);
  const settlementHours = parseInt(args[1]);

  if (isNaN(assetId) || assetId <= 0) {
    console.error("❌ Invalid asset ID. Must be a positive integer.");
    process.exit(1);
  }

  if (isNaN(settlementHours) || settlementHours <= 0) {
    console.error("❌ Invalid settlement hours. Must be a positive integer.");
    process.exit(1);
  }

  return { assetId: BigInt(assetId), settlementHours };
}

/**
 * Main function
 */
async function main() {
  console.log("\n========================================");
  console.log("📊 Creating New Asset Market");
  console.log("========================================\n");

  // Parse arguments
  const { assetId, settlementHours } = parseArgs();

  // Load deployment info
  const deploymentInfo = loadDeploymentInfo();
  console.log("📄 Contract Address:", deploymentInfo.contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Creating market with account:", signer.address);

  // Connect to contract
  const contract = await ethers.getContractAt(
    "PriceGuessBook",
    deploymentInfo.contractAddress
  );

  // Check if market already exists
  console.log("\n🔍 Checking if market already exists...");
  try {
    const existingMarket = await contract.markets(assetId);
    if (existingMarket.settlementTimestamp > 0n) {
      console.error("❌ Market already exists for asset ID:", assetId.toString());
      console.log("   Settlement Time:", new Date(Number(existingMarket.settlementTimestamp) * 1000).toISOString());
      process.exit(1);
    }
  } catch (error) {
    // Market doesn't exist, continue
  }

  // Calculate settlement timestamp
  const settlementTimestamp = Math.floor(Date.now() / 1000) + (settlementHours * 3600);
  const settlementDate = new Date(settlementTimestamp * 1000);

  console.log("\n📋 Market Details:");
  console.log("   Asset ID:", assetId.toString());
  console.log("   Oracle:", signer.address);
  console.log("   Settlement:", settlementDate.toISOString());
  console.log("   Hours until settlement:", settlementHours);

  // Create market
  console.log("\n⏳ Creating market...");

  const tx = await contract.createAssetMarket(
    assetId,
    signer.address, // Oracle address
    settlementTimestamp,
    { gasLimit: 1000000 }
  );

  console.log("📡 Transaction sent:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Market created! Block:", receipt.blockNumber);

  // Verify market creation
  console.log("\n🔍 Verifying market...");
  const market = await contract.markets(assetId);
  console.log("   Settlement Time:", new Date(Number(market.settlementTimestamp) * 1000).toISOString());
  console.log("   Oracle:", market.oracle);
  console.log("   Settled:", market.settled ? "Yes" : "No");

  // Update deployment file
  console.log("\n💾 Updating deployment file...");

  if (!deploymentInfo.markets) {
    deploymentInfo.markets = {};
  }

  deploymentInfo.markets[`ASSET_${assetId}`] = {
    assetId: Number(assetId),
    oracle: signer.address,
    settlementTimestamp: settlementTimestamp,
    createdAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("✅ Deployment file updated");

  // Summary
  console.log("\n========================================");
  console.log("✅ Market Created Successfully!");
  console.log("========================================\n");

  console.log("Asset ID:", assetId.toString());
  console.log("Settlement:", settlementDate.toISOString());
  console.log("Transaction:", tx.hash);
  console.log("");
  console.log("Etherscan URL:");
  console.log(`https://sepolia.etherscan.io/tx/${tx.hash}\n`);
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Market creation failed:", error);
    process.exit(1);
  });
