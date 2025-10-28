/**
 * Contract Verification Script
 *
 * Verifies the deployed contract on Etherscan.
 * Reads deployment info and submits source code for verification.
 *
 * Usage: node scripts/verify-contract.cjs
 */

const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n========================================");
  console.log("🔍 Verifying Contract on Etherscan");
  console.log("========================================\n");

  // Read deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "sepolia-deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment file not found. Please deploy the contract first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const { contractAddress, deployer } = deployment;

  console.log("📝 Contract Address:", contractAddress);
  console.log("👤 Deployer Address:", deployer);
  console.log("\n⏳ Submitting verification...\n");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [deployer],
    });

    console.log("\n✅ Contract verified successfully!");
    console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
    } else {
      throw error;
    }
  }

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
