// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PriceGuessBook
 * @notice FHE-enabled range prediction registry that keeps user wagers private.
 * @dev    Implements Zama fhEVM best practices: encrypted storage, ACL updates,
 *         decryption requests via the gateway, and division invariance (1e6 scale).
 */
contract PriceGuessBook is AccessControl, Pausable, ReentrancyGuard, SepoliaConfig {
    // ----------------------------------------------------------
    // Roles & constants
    // ----------------------------------------------------------
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    uint64 private constant SCALE = 1_000_000;

    // ----------------------------------------------------------
    // Domain structs
    // ----------------------------------------------------------
    struct AssetMarket {
        uint256 settlementTimestamp;
        address oracle;
        bool settled;
        uint64 settledPrice;
        uint256 payoutRequestId;
        bool payoutReady;
    }

    struct GuessTicket {
        address bettor;
        uint256 assetId;
        bytes32 commitment;
        euint64 lower;
        euint64 upper;
        euint64 stake;
        bool claimed;
        uint256 decryptionRequestId;
    }

    struct PoolStats {
        euint64 totalStake;
        euint64 winningStake;
    }

    struct ClaimRequest {
        uint256 ticketId;
        address bettor;
    }

    // ----------------------------------------------------------
    // Storage
    // ----------------------------------------------------------
    uint256 public nextTicketId = 1;

    mapping(uint256 => AssetMarket) public markets;
    mapping(uint256 => PoolStats) public pool;
    mapping(uint256 => GuessTicket) public tickets;
    mapping(uint256 => uint256[]) public marketTickets;

    mapping(uint256 => uint256) private requestToAsset;
    mapping(uint256 => bool) private payoutRequestActive;
    mapping(uint256 => ClaimRequest) private pendingClaims;
    mapping(uint256 => uint64) public payoutRatioPlain;

    // ----------------------------------------------------------
    // Events
    // ----------------------------------------------------------
    event AssetMarketCreated(uint256 indexed assetId, address indexed oracle, uint256 settlementTimestamp);
    event AssetMarketCancelled(uint256 indexed assetId, string reason);
    event GuessPlaced(uint256 indexed ticketId, uint256 indexed assetId, address indexed bettor, bytes32 commitment);
    event MarketSettled(uint256 indexed assetId, uint64 settledPrice, uint256 requestId);
    event PayoutRatioReady(uint256 indexed assetId, uint64 payoutRatio, uint256 requestId);
    event ClaimQueued(uint256 indexed ticketId, uint256 requestId);
    event ClaimFulfilled(uint256 indexed ticketId, address indexed bettor, uint64 payout);

    // ----------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------
    constructor(address admin) {
        require(admin != address(0), "Invalid admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    // ----------------------------------------------------------
    // Market management
    // ----------------------------------------------------------
    function createAssetMarket(uint256 assetId, address oracle, uint256 settlementTimestamp)
        external
        onlyRole(MARKET_ROLE)
    {
        require(oracle != address(0), "Invalid oracle");
        require(settlementTimestamp > block.timestamp, "Settlement in past");
        AssetMarket storage m = markets[assetId];
        require(m.settlementTimestamp == 0, "Market exists");

        m.settlementTimestamp = settlementTimestamp;
        m.oracle = oracle;

        PoolStats storage stats = pool[assetId];
        stats.totalStake = FHE.asEuint64(0);
        stats.winningStake = FHE.asEuint64(0);

        emit AssetMarketCreated(assetId, oracle, settlementTimestamp);
    }

    function cancelAssetMarket(uint256 assetId, string calldata reason) external onlyRole(MARKET_ROLE) {
        AssetMarket storage m = markets[assetId];
        require(m.settlementTimestamp != 0, "Unknown market");
        m.settled = true;
        emit AssetMarketCancelled(assetId, reason);
    }

    // ----------------------------------------------------------
    // Prediction lifecycle
    // ----------------------------------------------------------
    function placeGuess(
        uint256 assetId,
        externalEuint64 encryptedLower,
        externalEuint64 encryptedUpper,
        externalEuint64 encryptedStake,
        bytes calldata attestation,
        bytes32 commitment
    ) external payable whenNotPaused returns (uint256 ticketId) {
        AssetMarket storage m = markets[assetId];
        require(m.settlementTimestamp != 0, "Unknown market");
        require(block.timestamp < m.settlementTimestamp, "Market closed");

        euint64 lower = FHE.fromExternal(encryptedLower, attestation);
        euint64 upper = FHE.fromExternal(encryptedUpper, attestation);
        euint64 stake = FHE.fromExternal(encryptedStake, attestation);

        FHE.allowThis(lower);
        FHE.allowThis(upper);
        FHE.allowThis(stake);

        // Fail-closed sanitisation: invalid predicates zero-out the stake.
        ebool boundsValid = FHE.lt(lower, upper);
        ebool stakePositive = FHE.gt(stake, FHE.asEuint64(0));
        ebool payloadValid = FHE.and(boundsValid, stakePositive);
        euint64 effectiveStake = FHE.select(payloadValid, stake, FHE.asEuint64(0));

        PoolStats storage stats = pool[assetId];
        stats.totalStake = FHE.add(stats.totalStake, effectiveStake);
        FHE.allowThis(stats.totalStake);

        ticketId = nextTicketId++;
        tickets[ticketId] = GuessTicket({
            bettor: msg.sender,
            assetId: assetId,
            commitment: commitment,
            lower: lower,
            upper: upper,
            stake: effectiveStake,
            claimed: false,
            decryptionRequestId: 0
        });
        marketTickets[assetId].push(ticketId);

        emit GuessPlaced(ticketId, assetId, msg.sender, commitment);
    }

    function settleMarket(uint256 assetId, uint64 settledPrice) external onlyRole(ORACLE_ROLE) whenNotPaused {
        AssetMarket storage m = markets[assetId];
        require(m.settlementTimestamp != 0, "Unknown market");
        require(block.timestamp >= m.settlementTimestamp, "Too early");
        require(!m.settled, "Already settled");

        PoolStats storage stats = pool[assetId];
        euint64 priceCipher = FHE.asEuint64(settledPrice);

        uint256[] storage ids = marketTickets[assetId];
        for (uint256 i = 0; i < ids.length; i++) {
            GuessTicket storage t = tickets[ids[i]];
        ebool aboveLower = FHE.le(t.lower, priceCipher);
        ebool belowUpper = FHE.ge(t.upper, priceCipher);
            ebool winner = FHE.and(aboveLower, belowUpper);
            euint64 contribution = FHE.select(winner, t.stake, FHE.asEuint64(0));
            stats.winningStake = FHE.add(stats.winningStake, contribution);
            FHE.allowThis(stats.winningStake);
        }

        // Request decryption of both totalStake and winningStake
        // We will calculate the ratio in plaintext after decryption
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(stats.totalStake);
        handles[1] = FHE.toBytes32(stats.winningStake);
        uint256 requestId = FHE.requestDecryption(handles, this.onPayoutRatioDecrypted.selector);

        m.settled = true;
        m.settledPrice = settledPrice;
        m.payoutRequestId = requestId;

        requestToAsset[requestId] = assetId;
        payoutRequestActive[requestId] = true;

        emit MarketSettled(assetId, settledPrice, requestId);
    }

    function onPayoutRatioDecrypted(uint256 requestId, bytes memory cleartexts, bytes memory proof) external {
        FHE.checkSignatures(requestId, cleartexts, proof);
        require(payoutRequestActive[requestId], "Unknown request");
        uint256 assetId = requestToAsset[requestId];

        // Decode totalStake and winningStake
        (uint64 totalStake, uint64 winningStake) = abi.decode(cleartexts, (uint64, uint64));

        // Calculate payout ratio in plaintext
        // ratio = (totalStake * SCALE) / winningStake
        uint64 ratio = 0;
        if (winningStake > 0) {
            ratio = uint64((uint128(totalStake) * uint128(SCALE)) / uint128(winningStake));
        }

        payoutRatioPlain[assetId] = ratio;
        markets[assetId].payoutReady = true;

        delete requestToAsset[requestId];
        delete payoutRequestActive[requestId];

        emit PayoutRatioReady(assetId, ratio, requestId);
    }

    function claim(uint256 ticketId) external whenNotPaused {
        GuessTicket storage t = tickets[ticketId];
        require(t.bettor == msg.sender, "Not bettor");
        require(!t.claimed, "Already claimed");
        require(t.decryptionRequestId == 0, "Claim pending");

        AssetMarket storage m = markets[t.assetId];
        require(m.settled, "Market not settled");
        require(m.payoutReady, "Payout not ready");

        euint64 lower = t.lower;
        euint64 upper = t.upper;
        euint64 stake = t.stake;
        euint64 priceCipher = FHE.asEuint64(m.settledPrice);
        ebool aboveLower = FHE.le(lower, priceCipher);
        ebool belowUpper = FHE.ge(upper, priceCipher);
        ebool winner = FHE.and(aboveLower, belowUpper);

        // Calculate potential payout: (stake * payoutRatio) / SCALE
        // We'll decrypt the stake and do the calculation in plaintext
        euint64 potentialPayout = FHE.select(winner, stake, FHE.asEuint64(0));

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(potentialPayout);
        uint256 requestId = FHE.requestDecryption(handles, this.onClaimDecrypted.selector);

        pendingClaims[requestId] = ClaimRequest({ticketId: ticketId, bettor: msg.sender});
        t.decryptionRequestId = requestId;

        emit ClaimQueued(ticketId, requestId);
    }

    function onClaimDecrypted(uint256 requestId, bytes memory cleartexts, bytes memory proof) external nonReentrant {
        FHE.checkSignatures(requestId, cleartexts, proof);
        ClaimRequest memory claimCtx = pendingClaims[requestId];
        require(claimCtx.ticketId != 0, "Unknown claim");

        uint64 stakeAmount = abi.decode(cleartexts, (uint64));

        // Calculate actual payout using the payout ratio
        GuessTicket storage t = tickets[claimCtx.ticketId];
        uint64 payoutRatio = payoutRatioPlain[t.assetId];
        uint64 payout = 0;

        if (stakeAmount > 0 && payoutRatio > 0) {
            payout = uint64((uint128(stakeAmount) * uint128(payoutRatio)) / uint128(SCALE));
        }

        t.claimed = true;
        t.decryptionRequestId = 0;

        delete pendingClaims[requestId];

        if (payout > 0) {
            (bool ok, ) = claimCtx.bettor.call{value: payout}("");
            require(ok, "Transfer failed");
        }

        emit ClaimFulfilled(claimCtx.ticketId, claimCtx.bettor, payout);
    }

    // ----------------------------------------------------------
    // Admin utilities
    // ----------------------------------------------------------
    function setPause(bool pauseContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (pauseContract) {
            _pause();
        } else {
            _unpause();
        }
    }

    receive() external payable {}
}
