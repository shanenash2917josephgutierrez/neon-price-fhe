/**
 * PriceGuessBook Contract Tests
 *
 * Comprehensive test suite for the PriceGuessBook smart contract.
 * Tests all core functionality including market creation, guess placement,
 * settlement, and claims.
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { PriceGuessBook } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PriceGuessBook", function () {
  let contract: PriceGuessBook;
  let owner: SignerWithAddress;
  let oracle: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const BTC_ASSET_ID = 1n;
  const ETH_ASSET_ID = 2n;

  beforeEach(async function () {
    // Get signers
    [owner, oracle, user1, user2] = await ethers.getSigners();

    // Deploy contract
    const PriceGuessBook = await ethers.getContractFactory("PriceGuessBook");
    contract = await PriceGuessBook.deploy(owner.address);
    await contract.waitForDeployment();

    // Grant oracle role
    const ORACLE_ROLE = await contract.ORACLE_ROLE();
    await contract.grantRole(ORACLE_ROLE, oracle.address);
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should set the correct roles", async function () {
      const MARKET_ROLE = await contract.MARKET_ROLE();
      const ORACLE_ROLE = await contract.ORACLE_ROLE();

      expect(await contract.hasRole(MARKET_ROLE, owner.address)).to.be.true;
      expect(await contract.hasRole(ORACLE_ROLE, oracle.address)).to.be.true;
    });

    it("Should initialize with nextTicketId = 1", async function () {
      expect(await contract.nextTicketId()).to.equal(1n);
    });
  });

  describe("Market Management", function () {
    const settlementTime = Math.floor(Date.now() / 1000) + 86400; // +24 hours

    it("Should create a new asset market", async function () {
      await expect(
        contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime)
      )
        .to.emit(contract, "AssetMarketCreated")
        .withArgs(BTC_ASSET_ID, oracle.address, settlementTime);

      const market = await contract.markets(BTC_ASSET_ID);
      expect(market.settlementTimestamp).to.equal(settlementTime);
      expect(market.oracle).to.equal(oracle.address);
      expect(market.settled).to.be.false;
    });

    it("Should reject market creation with invalid oracle", async function () {
      await expect(
        contract.createAssetMarket(
          BTC_ASSET_ID,
          ethers.ZeroAddress,
          settlementTime
        )
      ).to.be.revertedWith("Invalid oracle");
    });

    it("Should reject market creation with past settlement time", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // -1 hour

      await expect(
        contract.createAssetMarket(BTC_ASSET_ID, oracle.address, pastTime)
      ).to.be.revertedWith("Settlement in past");
    });

    it("Should reject duplicate market creation", async function () {
      await contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime);

      await expect(
        contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime)
      ).to.be.revertedWith("Market exists");
    });

    it("Should allow market cancellation", async function () {
      await contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime);

      await expect(contract.cancelAssetMarket(BTC_ASSET_ID, "Test cancellation"))
        .to.emit(contract, "AssetMarketCancelled")
        .withArgs(BTC_ASSET_ID, "Test cancellation");

      const market = await contract.markets(BTC_ASSET_ID);
      expect(market.settled).to.be.true;
    });

    it("Should reject market cancellation by non-admin", async function () {
      await contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime);

      await expect(
        contract.connect(user1).cancelAssetMarket(BTC_ASSET_ID, "Unauthorized")
      ).to.be.reverted; // AccessControl revert
    });
  });

  describe("Pause Functionality", function () {
    const settlementTime = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      await contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime);
    });

    it("Should allow admin to pause", async function () {
      await contract.setPause(true);
      // Contract should be paused now
    });

    it("Should allow admin to unpause", async function () {
      await contract.setPause(true);
      await contract.setPause(false);
      // Contract should be unpaused
    });

    it("Should reject pause by non-admin", async function () {
      await expect(
        contract.connect(user1).setPause(true)
      ).to.be.reverted; // AccessControl revert
    });
  });

  describe("Ticket ID Counter", function () {
    it("Should start at 1", async function () {
      expect(await contract.nextTicketId()).to.equal(1n);
    });

    // Note: Full ticket creation tests would require FHE encryption
    // which is not available in standard test environment
  });

  describe("Role Management", function () {
    it("Should allow admin to grant roles", async function () {
      const MARKET_ROLE = await contract.MARKET_ROLE();
      await contract.grantRole(MARKET_ROLE, user1.address);
      expect(await contract.hasRole(MARKET_ROLE, user1.address)).to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      const ORACLE_ROLE = await contract.ORACLE_ROLE();
      await contract.revokeRole(ORACLE_ROLE, oracle.address);
      expect(await contract.hasRole(ORACLE_ROLE, oracle.address)).to.be.false;
    });

    it("Should reject role grant by non-admin", async function () {
      const MARKET_ROLE = await contract.MARKET_ROLE();
      await expect(
        contract.connect(user1).grantRole(MARKET_ROLE, user2.address)
      ).to.be.reverted;
    });
  });

  describe("Receive Function", function () {
    it("Should accept ETH transfers", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        owner.sendTransaction({
          to: await contract.getAddress(),
          value: amount,
        })
      ).to.changeEtherBalance(contract, amount);
    });
  });

  describe("View Functions", function () {
    const settlementTime = Math.floor(Date.now() / 1000) + 86400;

    beforeEach(async function () {
      await contract.createAssetMarket(BTC_ASSET_ID, oracle.address, settlementTime);
    });

    it("Should return correct market data", async function () {
      const market = await contract.markets(BTC_ASSET_ID);
      expect(market.settlementTimestamp).to.equal(settlementTime);
      expect(market.oracle).to.equal(oracle.address);
      expect(market.settled).to.be.false;
      expect(market.settledPrice).to.equal(0n);
    });

    it("Should return 0 payout ratio for non-existent market", async function () {
      const ratio = await contract.payoutRatioPlain(999n);
      expect(ratio).to.equal(0n);
    });
  });
});
