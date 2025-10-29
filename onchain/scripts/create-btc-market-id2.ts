import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n========================================");
  console.log("📊 Creating BTC Market (Asset ID 2)");
  console.log("========================================\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-deployment.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  console.log("📄 Contract Address:", deploymentInfo.contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Creating market with account:", signer.address);

  // Connect to contract
  const contract = await ethers.getContractAt(
    "PriceGuessBook",
    deploymentInfo.contractAddress
  );

  // Use Asset ID 2 (since ID 1 is occupied)
  const assetId = 2n;
  console.log("\n🔍 Checking if market already exists for Asset ID 2...");
  try {
    const existingMarket = await contract.markets(assetId);
    if (existingMarket.settlementTimestamp > 0n) {
      console.log("⚠️  Market already exists for Asset ID 2");
      console.log("   Settlement Time:", new Date(Number(existingMarket.settlementTimestamp) * 1000).toISOString());
      console.log("   Oracle:", existingMarket.oracle);
      console.log("   Settled:", existingMarket.settled ? "Yes" : "No");
      return;
    }
  } catch (error) {
    // Market doesn't exist, continue
  }

  // Calculate settlement timestamp (48 hours from now)
  const settlementHours = 48;
  const settlementTimestamp = Math.floor(Date.now() / 1000) + (settlementHours * 3600);
  const settlementDate = new Date(settlementTimestamp * 1000);

  console.log("\n📋 Market Details:");
  console.log("   Asset ID: 2 (BTC - New Market)");
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
  console.log("✅ Market created! Block:", receipt?.blockNumber);

  // Verify market creation
  console.log("\n🔍 Verifying market...");
  const market = await contract.markets(assetId);
  console.log("   Settlement Time:", new Date(Number(market.settlementTimestamp) * 1000).toISOString());
  console.log("   Oracle:", market.oracle);
  console.log("   Settled:", market.settled ? "Yes" : "No");

  // Summary
  console.log("\n========================================");
  console.log("✅ BTC Market Created Successfully!");
  console.log("========================================\n");

  console.log("Asset ID: 2 (BTC)");
  console.log("Settlement:", settlementDate.toISOString());
  console.log("Transaction:", tx.hash);
  console.log("\nEtherscan URL:");
  console.log(`https://sepolia.etherscan.io/tx/${tx.hash}\n`);

  console.log("\n💡 Important: Update frontend to use Asset ID 2 for BTC predictions");
  console.log("   File: src/pages/Terminal.tsx");
  console.log("   Change: assetId={1n} → assetId={2n}\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Market creation failed:", error);
    process.exit(1);
  });
