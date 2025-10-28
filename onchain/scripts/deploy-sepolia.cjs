/**
 * Deployment Script for PriceGuessBook Contract on Sepolia Testnet
 *
 * This script:
 * 1. Deploys the PriceGuessBook contract
 * 2. Creates initial asset markets (BTC, ETH)
 * 3. Outputs contract address and configuration
 * 4. Saves deployment info to a JSON file
 *
 * Usage: npx hardhat run scripts/deploy-sepolia.cjs --network sepolia
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Main deployment function
 */
async function main() {
  console.log("\n========================================");
  console.log("🚀 Deploying PriceGuessBook to Sepolia");
  console.log("========================================\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  WARNING: Low balance! Deployment may fail.");
    console.warn("   Please ensure you have at least 0.1 ETH for deployment and gas.");
  }

  console.log("\n⏳ Deploying contract...\n");

  // Deploy PriceGuessBook contract
  const PriceGuessBook = await ethers.getContractFactory("PriceGuessBook");
  const contract = await PriceGuessBook.deploy(deployer.address);

  // Wait for deployment
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed to:", contractAddress);
  console.log("📋 Deployer (admin):", deployer.address);

  // Create initial asset markets
  console.log("\n⏳ Creating initial asset markets...\n");

  // Asset IDs
  const BTC_ID = 1n;
  const ETH_ID = 2n;

  // Settlement time: 24 hours from now
  const settlementTimestamp = Math.floor(Date.now() / 1000) + 86400; // +24 hours

  try {

    // Create BTC market
    console.log("Creating BTC market (ID: 1)...");
    const tx1 = await contract.createAssetMarket(
      BTC_ID,
      deployer.address, // Oracle address (deployer for testing)
      settlementTimestamp,
      { gasLimit: 1000000 }
    );
    await tx1.wait();
    console.log("✅ BTC market created");

    // Create ETH market
    console.log("Creating ETH market (ID: 2)...");
    const tx2 = await contract.createAssetMarket(
      ETH_ID,
      deployer.address, // Oracle address
      settlementTimestamp,
      { gasLimit: 1000000 }
    );
    await tx2.wait();
    console.log("✅ ETH market created");

    console.log("\n📊 Market Details:");
    console.log("   Settlement Time:", new Date(settlementTimestamp * 1000).toISOString());
    console.log("   Oracle Address:", deployer.address);

  } catch (error) {
    console.error("\n❌ Error creating markets:", error.message);
    console.log("   Markets can be created manually after deployment.");
  }

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    markets: {
      BTC: {
        assetId: 1,
        oracle: deployer.address,
        settlementTimestamp: settlementTimestamp,
      },
      ETH: {
        assetId: 2,
        oracle: deployer.address,
        settlementTimestamp: settlementTimestamp,
      },
    },
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, "sepolia-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Output configuration for frontend
  console.log("\n========================================");
  console.log("📋 Frontend Configuration");
  console.log("========================================\n");
  console.log("Add this to your .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`VITE_SEPOLIA_CHAIN_ID=11155111`);
  console.log("");

  console.log("\n========================================");
  console.log("🔐 Next Steps");
  console.log("========================================\n");
  console.log("1. Verify the contract:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress} "${deployer.address}"`);
  console.log("");
  console.log("2. Update frontend .env with contract address");
  console.log("");
  console.log("3. Test the contract:");
  console.log("   npx hardhat test --network sepolia");
  console.log("");
  console.log("✅ Deployment complete!\n");

  return {
    contract,
    contractAddress,
    deployer: deployer.address,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
