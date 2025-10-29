import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n========================================");
  console.log("🔄 Recreating BTC Market");
  console.log("========================================\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-deployment.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  console.log("📄 Contract Address:", deploymentInfo.contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Account:", signer.address);

  // Connect to contract
  const contract = await ethers.getContractAt(
    "PriceGuessBook",
    deploymentInfo.contractAddress
  );

  const assetId = 1n; // BTC

  // Step 1: Cancel existing market
  console.log("\n🔍 Step 1: Canceling existing market...");
  try {
    const existingMarket = await contract.markets(assetId);
    if (existingMarket.settlementTimestamp > 0n) {
      console.log("   Found existing market:");
      console.log("   - Settlement Time:", new Date(Number(existingMarket.settlementTimestamp) * 1000).toISOString());
      console.log("   - Settled:", existingMarket.settled ? "Yes" : "No");

      if (!existingMarket.settled) {
        console.log("\n   ⏳ Canceling market...");
        const cancelTx = await contract.cancelAssetMarket(
          assetId,
          "Recreating market with updated settlement time",
          { gasLimit: 500000 }
        );
        console.log("   📡 Cancel transaction sent:", cancelTx.hash);
        await cancelTx.wait();
        console.log("   ✅ Market canceled!");
      } else {
        console.log("   ✓ Market already settled/canceled");
      }
    }
  } catch (error: any) {
    console.log("   ℹ️  No existing market found or already canceled");
  }

  // Step 2: Create new market
  console.log("\n🔍 Step 2: Creating new market...");

  // Calculate settlement timestamp (48 hours from now)
  const settlementHours = 48;
  const settlementTimestamp = Math.floor(Date.now() / 1000) + (settlementHours * 3600);
  const settlementDate = new Date(settlementTimestamp * 1000);

  console.log("\n📋 New Market Details:");
  console.log("   Asset ID: 1 (BTC)");
  console.log("   Oracle:", signer.address);
  console.log("   Settlement:", settlementDate.toISOString());
  console.log("   Hours until settlement:", settlementHours);

  console.log("\n⏳ Creating market...");

  const createTx = await contract.createAssetMarket(
    assetId,
    signer.address, // Oracle address
    settlementTimestamp,
    { gasLimit: 1000000 }
  );

  console.log("📡 Transaction sent:", createTx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await createTx.wait();
  console.log("✅ Market created! Block:", receipt?.blockNumber);

  // Verify new market
  console.log("\n🔍 Verifying new market...");
  const market = await contract.markets(assetId);
  console.log("   Settlement Time:", new Date(Number(market.settlementTimestamp) * 1000).toISOString());
  console.log("   Oracle:", market.oracle);
  console.log("   Settled:", market.settled ? "Yes" : "No");

  // Summary
  console.log("\n========================================");
  console.log("✅ BTC Market Recreated Successfully!");
  console.log("========================================\n");

  console.log("Asset ID: 1 (BTC)");
  console.log("Settlement:", settlementDate.toISOString());
  console.log("Create Transaction:", createTx.hash);
  console.log("\nEtherscan URL:");
  console.log(`https://sepolia.etherscan.io/tx/${createTx.hash}\n`);
  console.log("\n💡 You can now place bets on the Terminal page!");
  console.log("   The market will be open for 48 hours.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Operation failed:", error);
    process.exit(1);
  });
