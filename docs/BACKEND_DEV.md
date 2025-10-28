# PriceGuess Backend Development Guide

## 概述
`PriceGuessBook` 合约支持价格区间预测。用户提交的上下限与下注金额均以 FHE 密文形式传入，链上维护区间集合并在价格喂价到来时判断是否命中，随后通过网关解密收益。

## 角色
- `DEFAULT_ADMIN_ROLE`：部署者，授予其他角色。
- `MARKET_ROLE`：创建资产市场、配置预言机。
- `ORACLE_ROLE`：写入最终结算价格或触发结算流程。
- `GATEWAY_ROLE`：接收网关回调。

## 数据结构
### `AssetMarket`
- `uint256 assetId`
- `uint256 settlementTimestamp`
- `address priceOracle`
- `bool settled`
- `uint64 settledPrice`

### `GuessTicket`
- `address bettor`
- `uint256 assetId`
- `bytes32 commitment`
- `externalEuint64 encryptedLower`
- `externalEuint64 encryptedUpper`
- `externalEuint64 encryptedStake`
- `bool claimed`

### `PoolStats`
- `euint64 encryptedTotalStake`
- `euint64 encryptedWinningStake`

## 事件
- `AssetMarketCreated(uint256 indexed assetId, uint256 settlementTimestamp)`
- `GuessPlaced(uint256 indexed assetId, address indexed bettor)`
- `MarketSettled(uint256 indexed assetId, uint64 settledPrice, uint256 requestId)`
- `GuessPayout(uint256 indexed ticketId, address indexed bettor, uint64 payout)`

## 核心函数

### `createAssetMarket`
```solidity
function createAssetMarket(uint256 assetId, address priceOracle, uint256 settlementTimestamp) external onlyRole(MARKET_ROLE)
```
- 保存价格预言机地址、结算时间。
- 初始化 `PoolStats` 中的密态总额为零。

### `placeGuess`
```solidity
function placeGuess(uint256 assetId, externalEuint64 encryptedLower, externalEuint64 encryptedUpper, externalEuint64 encryptedStake, bytes calldata proof, bytes32 commitment) external
```
- 验证当前时间 < `settlementTimestamp`。
- 导入密文：
  ```solidity
  euint64 lower = FHE.fromExternal(encryptedLower, proof);
  euint64 upper = FHE.fromExternal(encryptedUpper, proof);
  euint64 stake = FHE.fromExternal(encryptedStake, proof);
  FHE.allowThis(lower);
  FHE.allowThis(upper);
  FHE.allowThis(stake);
  ```
- 使用 `FHE.lt`、`FHE.gt` 进行区间顺序校验，非法则 revert。
- 更新 `PoolStats.encryptedTotalStake = FHE.add(...);`
- 记录 `GuessTicket`，commitment 防止重放。

### `settleMarket`
```solidity
function settleMarket(uint256 assetId, uint64 settledPrice) external onlyRole(ORACLE_ROLE)
```
- 写入价格并标记市场结算。
- 对所有票据执行密态判断：
  ```solidity
  ebool isAboveLower = FHE.lte(tickets[i].encryptedLower, FHE.asEuint64(settledPrice));
  ebool isBelowUpper = FHE.gte(tickets[i].encryptedUpper, FHE.asEuint64(settledPrice));
  ebool isWinner = FHE.and(isAboveLower, isBelowUpper);
  euint64 winningStake = FHE.select(isWinner, FHE.fromExternal(tickets[i].encryptedStake, proof), FHE.asEuint64(0));
  pool.encryptedWinningStake = FHE.add(pool.encryptedWinningStake, winningStake);
  ```
- 采用 Division Invariance：前端下注金额乘以 `SCALE = 1e6`，这里用 `FHE.mul` 缩放后除以常量。
- 生成解密请求：
  ```solidity
  euint64 payoutRatio = FHE.div(FHE.mul(pool.encryptedTotalStake, FHE.asEuint64(SCALE)), pool.encryptedWinningStake);
  uint256 requestId = gateway.requestDecryption(uint256(euint64.unwrap(payoutRatio)), address(this), block.timestamp, false, false);
  emit MarketSettled(assetId, settledPrice, requestId);
  ```

### `claim`
```solidity
function claim(uint256 ticketId, bytes calldata proofLower, bytes calldata proofUpper, bytes calldata proofStake) external
```
- 检查票据归属、是否已领取。
- 通过 `FHE.fromExternal` 导入区间和金额，再和解得的价格比较。
- 若命中，计算奖金 = `stake * payoutRatio / SCALE`。
- 向用户转账并发出 `GuessPayout`。

### `gatewayCallback`
```solidity
function gatewayCallback(uint256 requestId, uint64 payoutRatioPlain) external onlyRole(GATEWAY_ROLE)
```
- 记录 `decryptedPayoutRatio`，供 `claim` 读取。

## FHE 注意事项
- 区间上下限使用 `externalEuint64`，单位为 wei（可以代表价格乘以 1e8）。
- 使用 `FHE.select` 构造 fail-closed 流程，确保失败票据返回 0。
- 任何密文写入后调用 `FHE.allowThis`，若需要用户查看票据可添加 `FHE.allow(cipher, bettor)`。

## Solidity 骨架
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

contract PriceGuessBook is AccessControl {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    struct AssetMarket {
        uint256 settlementTimestamp;
        bool settled;
        uint64 settledPrice;
    }

    mapping(uint256 => AssetMarket) public markets;

    constructor(address admin, address gateway) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ROLE, admin);
        _grantRole(GATEWAY_ROLE, gateway);
    }
}
```

## Hardhat 配置
```ts
import { defineConfig } from "hardhat/config";
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";

export default defineConfig({
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  fhEVM: {
    gatewayUrl: process.env.FHE_GATEWAY_URL!,
  },
});
```

## 测试策略
- **区间校验**：构造非法区间，确认合约拒绝。
- **结算逻辑**：模拟不同价格落点，验证赢家/输家处理正确。
- **解密回调**：确保只有网关可写入 `payoutRatio`。
- **重入与重复领取**：`claim` 前后应防止多次领取。

## 部署流程
1. 配置 `.env` 并部署主合约。
2. 调用 `createAssetMarket` 创建示例资产（BTC、ETH）。
3. 注册预言机服务，定期调用 `settleMarket`。
4. 后端监听 `MarketSettled` 与 `GuessPayout` 同步前端列表。

## 安全建议
- Commitment 建议加入链上 nonce，避免重放。
- 价格输入采用可信链下服务签名并走 `ORACLE_ROLE`。
- `payoutRatio` 为 0 时应提供退款路径，避免零除风险。
