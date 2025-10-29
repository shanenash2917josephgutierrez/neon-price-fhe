/**
 * Settle Market Script
 *
 * This script settles an asset market with a final price.
 * Can only be called by the oracle role after settlement time.
 *
 * Usage: node scripts/settle-market.cjs <assetId> <settledPrice>
 * Example: node scripts/settle-market.cjs 1 95000.50
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
    console.log("\n📝 Usage: node scripts/settle-market.cjs <assetId> <settledPrice>\n");
    console.log("Examples:");
    console.log("  node scripts/settle-market.cjs 1 95000.50  # Settle BTC market at $95,000.50");
    console.log("  node scripts/settle-market.cjs 2 3500.25   # Settle ETH market at $3,500.25");
    console.log("\nNote: Price will be scaled by 1e8 (satoshi-like precision)");
    console.log("");
    process.exit(1);
  }

  const assetId = parseInt(args[0]);
  const price = parseFloat(args[1]);

  if (isNaN(assetId) || assetId <= 0) {
    console.error("❌ Invalid asset ID. Must be a positive integer.");
    process.exit(1);
  }

  if (isNaN(price) || price <= 0) {
    console.error("❌ Invalid price. Must be a positive number.");
    process.exit(1);
  }

  // Scale price by 1e8 (satoshi-like precision)
  const settledPrice = BigInt(Math.floor(price * 1e8));

  return { assetId: BigInt(assetId), price, settledPrice };
}

/**
 * Main function
 */
async function main() {
  console.log("\n========================================");
  console.log("⚖️  Settling Asset Market");
  console.log("========================================\n");

  // Parse arguments
  const { assetId, price, settledPrice } = parseArgs();

  // Load deployment info
  const deploymentInfo = loadDeploymentInfo();
  console.log("📄 Contract Address:", deploymentInfo.contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Settling with account:", signer.address);

  // Connect to contract
  const contract = await ethers.getContractAt(
    "PriceGuessBook",
    deploymentInfo.contractAddress
  );

  // Check oracle role
  console.log("\n🔍 Verifying oracle role...");
  const ORACLE_ROLE = await contract.ORACLE_ROLE();
  const hasOracleRole = await contract.hasRole(ORACLE_ROLE, signer.address);

  if (!hasOracleRole) {
    console.error("❌ Account does not have ORACLE_ROLE");
    console.log("   Current account:", signer.address);
    process.exit(1);
  }
  console.log("✅ Oracle role verified");

  // Check market exists
  console.log("\n🔍 Checking market...");
  const market = await contract.markets(assetId);

  if (market.settlementTimestamp === 0n) {
    console.error("❌ Market does not exist for asset ID:", assetId.toString());
    process.exit(1);
  }

  if (market.settled) {
    console.error("❌ Market already settled");
    console.log("   Settled Price:", (Number(market.settledPrice) / 1e8).toFixed(2));
    process.exit(1);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const settlementTime = Number(market.settlementTimestamp);

  console.log("   Settlement Time:", new Date(settlementTime * 1000).toISOString());
  console.log("   Current Time:", new Date(currentTime * 1000).toISOString());

  if (currentTime < settlementTime) {
    console.error("❌ Settlement time has not been reached yet");
    const hoursRemaining = Math.ceil((settlementTime - currentTime) / 3600);
    console.log(`   Please wait ${hoursRemaining} hours`);
    process.exit(1);
  }

  console.log("✅ Market ready for settlement");

  // Display settlement details
  console.log("\n📋 Settlement Details:");
  console.log("   Asset ID:", assetId.toString());
  console.log("   Settled Price:", `$${price.toFixed(2)}`);
  console.log("   Scaled Price:", settledPrice.toString());
  console.log("   Oracle:", signer.address);

  // Settle market
  console.log("\n⏳ Settling market...");

  const tx = await contract.settleMarket(
    assetId,
    settledPrice,
    { gasLimit: 3000000 } // High gas limit for FHE operations
  );

  console.log("📡 Transaction sent:", tx.hash);
  console.log("⏳ Waiting for confirmation (this may take a while due to FHE operations)...");

  const receipt = await tx.wait();
  console.log("✅ Market settled! Block:", receipt.blockNumber);

  // Verify settlement
  console.log("\n🔍 Verifying settlement...");
  const settledMarket = await contract.markets(assetId);
  console.log("   Settled:", settledMarket.settled ? "Yes ✅" : "No ❌");
  console.log("   Settled Price:", (Number(settledMarket.settledPrice) / 1e8).toFixed(2));

  // Check payout ratio (may not be ready immediately)
  try {
    const payoutRatio = await contract.payoutRatioPlain(assetId);
    if (payoutRatio > 0n) {
      console.log("   Payout Ratio:", (Number(payoutRatio) / 1e6).toFixed(6));
    } else {
      console.log("   Payout Ratio: Not yet calculated (waiting for decryption)");
    }
  } catch (error) {
    console.log("   Payout Ratio: Not yet available");
  }

  // Summary
  console.log("\n========================================");
  console.log("✅ Market Settled Successfully!");
  console.log("========================================\n");

  console.log("Asset ID:", assetId.toString());
  console.log("Settled Price:", `$${price.toFixed(2)}`);
  console.log("Transaction:", tx.hash);
  console.log("");
  console.log("Etherscan URL:");
  console.log(`https://sepolia.etherscan.io/tx/${tx.hash}\n`);

  console.log("⏳ Note: Payout calculations may take several minutes due to FHE decryption.");
  console.log("   Users can claim their winnings once payout ratios are ready.\n");
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Settlement failed:", error);
    process.exit(1);
  });
