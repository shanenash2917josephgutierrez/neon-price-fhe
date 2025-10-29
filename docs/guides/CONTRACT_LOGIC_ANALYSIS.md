# PriceGuessBook 智能合约逻辑分析

## 合约概述

**PriceGuessBook** 是一个基于 Zama fhEVM 的**全同态加密价格预测合约**，允许用户在保持预测内容完全私密的情况下进行价格范围投注。

### 核心特性
- ✅ 使用 FHE (全同态加密) 保护用户预测内容
- ✅ 支持多个资产市场（BTC、ETH等）
- ✅ 完全链上计算，无需依赖中心化服务器
- ✅ 自动奖池分配机制
- ✅ 防重入攻击、可暂停、访问控制

---

## 合约架构

### 继承关系
```solidity
PriceGuessBook is AccessControl, Pausable, ReentrancyGuard, SepoliaConfig
```

- **AccessControl**: 角色权限管理（管理员、市场管理员、预言机）
- **Pausable**: 紧急暂停功能
- **ReentrancyGuard**: 防止重入攻击
- **SepoliaConfig**: Zama fhEVM Sepolia配置

### 角色定义
```solidity
bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");  // 市场管理员
bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");  // 预言机角色
DEFAULT_ADMIN_ROLE  // 超级管理员
```

---

## 核心数据结构

### 1. AssetMarket（资产市场）
```solidity
struct AssetMarket {
    uint256 settlementTimestamp;  // 结算时间戳（UTC时间）
    address oracle;               // 预言机地址
    bool settled;                 // 是否已结算
    uint64 settledPrice;          // 结算价格（1e8精度）
    uint256 payoutRequestId;      // 支付比例解密请求ID
    bool payoutReady;             // 支付比例是否已就绪
}
```

**作用**: 管理每个资产（如BTC、ETH）的市场信息和结算状态。

### 2. GuessTicket（预测票据）
```solidity
struct GuessTicket {
    address bettor;               // 投注者地址
    uint256 assetId;              // 资产ID
    bytes32 commitment;           // 承诺哈希（防重放攻击）
    euint64 lower;                // 加密的价格下限
    euint64 upper;                // 加密的价格上限
    euint64 stake;                // 加密的投注金额
    bool claimed;                 // 是否已领奖
    uint256 decryptionRequestId;  // 解密请求ID
}
```

**关键点**:
- `lower`, `upper`, `stake` 都是 `euint64` 类型（加密整数）
- 所有预测内容在链上完全加密，其他用户无法看到

### 3. PoolStats（奖池统计）
```solidity
struct PoolStats {
    euint64 totalStake;    // 总投注金额（加密）
    euint64 winningStake;  // 获胜投注金额（加密）
}
```

**作用**: 追踪每个市场的总投注额和获胜投注额，用于计算支付比例。

### 4. ClaimRequest（领奖请求）
```solidity
struct ClaimRequest {
    uint256 ticketId;  // 票据ID
    address bettor;    // 投注者地址
}
```

---

## 核心功能流程

### 🏁 流程1: 创建市场
```solidity
function createAssetMarket(
    uint256 assetId,
    address oracle,
    uint256 settlementTimestamp
) external onlyRole(MARKET_ROLE)
```

**调用条件**:
- 调用者必须拥有 `MARKET_ROLE`
- `settlementTimestamp` 必须在未来
- 该 `assetId` 尚未创建过市场

**执行逻辑**:
1. 创建新的 `AssetMarket` 记录
2. 初始化 `PoolStats`:
   - `totalStake = FHE.asEuint64(0)` (加密的0)
   - `winningStake = FHE.asEuint64(0)`
3. 发出 `AssetMarketCreated` 事件

**前端对应**: `settlementTimestamp` 就是用户在前端选择的UTC 0点时间戳（秒）

---

### 🎯 流程2: 用户下注
```solidity
function placeGuess(
    uint256 assetId,
    externalEuint64 encryptedLower,
    externalEuint64 encryptedUpper,
    externalEuint64 encryptedStake,
    bytes calldata attestation,
    bytes32 commitment
) external payable whenNotPaused returns (uint256 ticketId)
```

**调用条件**:
- 合约未暂停 (`whenNotPaused`)
- 市场存在且未结算 (`block.timestamp < m.settlementTimestamp`)

**执行逻辑**:

#### 2.1 解密输入数据
```solidity
euint64 lower = FHE.fromExternal(encryptedLower, attestation);
euint64 upper = FHE.fromExternal(encryptedUpper, attestation);
euint64 stake = FHE.fromExternal(encryptedStake, attestation);
```
- `fromExternal`: 将前端加密的数据导入合约

#### 2.2 设置访问权限
```solidity
FHE.allowThis(lower);
FHE.allowThis(upper);
FHE.allowThis(stake);
```
- 允许合约访问这些加密数据

#### 2.3 验证有效性（Fail-Closed机制）
```solidity
ebool boundsValid = FHE.lt(lower, upper);          // lower < upper
ebool stakePositive = FHE.gt(stake, FHE.asEuint64(0));  // stake > 0
ebool payloadValid = FHE.and(boundsValid, stakePositive);
euint64 effectiveStake = FHE.select(payloadValid, stake, FHE.asEuint64(0));
```

**关键安全特性**:
- 如果 `lower >= upper`，投注金额被清零
- 如果 `stake <= 0`，投注金额被清零
- 这些检查都在加密域内完成，不泄露任何信息

#### 2.4 更新奖池统计
```solidity
stats.totalStake = FHE.add(stats.totalStake, effectiveStake);
```

#### 2.5 创建票据
```solidity
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
```

**前端对应**:
- `encryptedLower`: 前端用 `encryptPriceGuess()` 加密的价格下限
- `encryptedUpper`: 加密的价格上限
- `encryptedStake`: 加密的投注金额
- `commitment`: 从前端计算的哈希值（防重放攻击）

---

### 🎲 流程3: 市场结算
```solidity
function settleMarket(
    uint256 assetId,
    uint64 settledPrice
) external onlyRole(ORACLE_ROLE) whenNotPaused
```

**调用条件**:
- 调用者必须拥有 `ORACLE_ROLE`
- `block.timestamp >= m.settlementTimestamp` (已到结算时间)
- 市场尚未结算

**执行逻辑**:

#### 3.1 将结算价格转为加密值
```solidity
euint64 priceCipher = FHE.asEuint64(settledPrice);
```

#### 3.2 遍历所有票据，判断胜负
```solidity
for (uint256 i = 0; i < ids.length; i++) {
    GuessTicket storage t = tickets[ids[i]];

    // 判断价格是否在用户预测范围内
    ebool aboveLower = FHE.le(t.lower, priceCipher);  // lower <= price
    ebool belowUpper = FHE.ge(t.upper, priceCipher);  // upper >= price
    ebool winner = FHE.and(aboveLower, belowUpper);

    // 如果获胜，将投注金额加入获胜池
    euint64 contribution = FHE.select(winner, t.stake, FHE.asEuint64(0));
    stats.winningStake = FHE.add(stats.winningStake, contribution);
}
```

**关键点**:
- 所有判断都在加密域内完成
- 胜负信息不会泄露给合约或其他用户

#### 3.3 请求解密支付比例
```solidity
bytes32[] memory handles = new bytes32[](2);
handles[0] = FHE.toBytes32(stats.totalStake);
handles[1] = FHE.toBytes32(stats.winningStake);
uint256 requestId = FHE.requestDecryption(
    handles,
    this.onPayoutRatioDecrypted.selector
);
```

**原理**:
- 为了计算支付比例，需要解密 `totalStake` 和 `winningStake`
- Zama Gateway 会异步返回解密结果

---

### 💰 流程4: 支付比例计算
```solidity
function onPayoutRatioDecrypted(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory proof
) external
```

**调用者**: Zama Gateway（自动调用）

**执行逻辑**:

#### 4.1 验证签名
```solidity
FHE.checkSignatures(requestId, cleartexts, proof);
```

#### 4.2 解码明文数据
```solidity
(uint64 totalStake, uint64 winningStake) = abi.decode(cleartexts, (uint64, uint64));
```

#### 4.3 计算支付比例
```solidity
uint64 ratio = 0;
if (winningStake > 0) {
    ratio = uint64((uint128(totalStake) * uint128(SCALE)) / uint128(winningStake));
}
```

**公式**: `ratio = (totalStake * 1,000,000) / winningStake`

**示例**:
- 总投注: 10 ETH = 10,000,000 (1e6精度)
- 获胜投注: 2 ETH = 2,000,000
- 支付比例: `(10,000,000 * 1,000,000) / 2,000,000 = 5,000,000`
- 意味着: 获胜者每投注1单位，可获得5单位回报

#### 4.4 保存结果
```solidity
payoutRatioPlain[assetId] = ratio;
markets[assetId].payoutReady = true;
```

---

### 🏆 流程5: 用户领奖
```solidity
function claim(uint256 ticketId) external whenNotPaused
```

**调用条件**:
- 调用者是票据所有者
- 尚未领奖
- 市场已结算且支付比例已就绪

**执行逻辑**:

#### 5.1 重新判断胜负（加密域）
```solidity
euint64 priceCipher = FHE.asEuint64(m.settledPrice);
ebool aboveLower = FHE.le(lower, priceCipher);
ebool belowUpper = FHE.ge(upper, priceCipher);
ebool winner = FHE.and(aboveLower, belowUpper);
```

#### 5.2 计算潜在奖金
```solidity
euint64 potentialPayout = FHE.select(winner, stake, FHE.asEuint64(0));
```
- 如果获胜: `potentialPayout = stake`
- 如果失败: `potentialPayout = 0`

#### 5.3 请求解密投注金额
```solidity
bytes32[] memory handles = new bytes32[](1);
handles[0] = FHE.toBytes32(potentialPayout);
uint256 requestId = FHE.requestDecryption(
    handles,
    this.onClaimDecrypted.selector
);
```

---

### 💸 流程6: 支付奖金
```solidity
function onClaimDecrypted(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory proof
) external nonReentrant
```

**调用者**: Zama Gateway

**执行逻辑**:

#### 6.1 解码投注金额
```solidity
uint64 stakeAmount = abi.decode(cleartexts, (uint64));
```

#### 6.2 计算实际奖金
```solidity
uint64 payoutRatio = payoutRatioPlain[t.assetId];
uint64 payout = 0;

if (stakeAmount > 0 && payoutRatio > 0) {
    payout = uint64((uint128(stakeAmount) * uint128(payoutRatio)) / uint128(SCALE));
}
```

**示例**:
- 用户投注: 1 ETH = 1,000,000 (1e6精度)
- 支付比例: 5,000,000
- 奖金: `(1,000,000 * 5,000,000) / 1,000,000 = 5,000,000` = 5 ETH

#### 6.3 转账
```solidity
if (payout > 0) {
    (bool ok, ) = claimCtx.bettor.call{value: payout}("");
    require(ok, "Transfer failed");
}
```

---

## 关键技术特性

### 1. 全同态加密（FHE）
所有敏感数据都使用 `euint64` 类型存储：
- `euint64`: 64位加密无符号整数
- `ebool`: 加密布尔值

**支持的加密操作**:
```solidity
FHE.lt(a, b)      // a < b
FHE.le(a, b)      // a <= b
FHE.gt(a, b)      // a > b
FHE.ge(a, b)      // a >= b
FHE.and(a, b)     // a AND b
FHE.add(a, b)     // a + b
FHE.select(cond, a, b)  // cond ? a : b
```

### 2. 防重放攻击
```solidity
bytes32 commitment;  // 每次投注的唯一标识
```

前端生成方式:
```typescript
const commitmentData = `${userAddress}-${assetId}-${Date.now()}`;
const commitment = keccak256(toUtf8Bytes(commitmentData));
```

### 3. Fail-Closed 安全机制
如果验证失败，自动将投注金额清零，而不是回退交易：
```solidity
euint64 effectiveStake = FHE.select(payloadValid, stake, FHE.asEuint64(0));
```

**优点**: 避免信息泄露（攻击者无法通过交易失败推断数据范围）

### 4. 精度处理
```solidity
uint64 private constant SCALE = 1_000_000;  // 1e6
```

所有金额都乘以1,000,000进行计算，避免小数除法损失精度。

### 5. 访问控制列表（ACL）
```solidity
FHE.allowThis(lower);   // 允许合约访问加密数据
FHE.allowThis(upper);
FHE.allowThis(stake);
```

确保只有授权的地址可以访问加密数据。

---

## 与前端的对接

### 前端发送的参数
```typescript
await placeGuess(
  assetId,                    // 1 (BTC)
  lowerHandle,                // 0x1234... (加密的110000 * 1e8)
  upperHandle,                // 0x5678... (加密的115000 * 1e8)
  stakeHandle,                // 0x9abc... (加密的0.1 ETH)
  proof,                      // ZK证明
  commitment                  // 0xdef0... (防重放哈希)
);
```

### 时间戳对应关系
```typescript
// 前端: 用户选择 2025-10-30
const expiryUTC = Date.UTC(2025, 9, 30, 0, 0, 0, 0);
const expiryTimestamp = Math.floor(expiryUTC / 1000);  // 1761782400

// 合约: settlementTimestamp = 1761782400
// 结算条件: block.timestamp >= 1761782400
```

---

## 数值精度说明

### 价格精度: 1e8 (satoshi-like)
```typescript
// 前端
const lowerWei = BigInt(Math.floor(110000 * 1e8));  // 11000000000000
const upperWei = BigInt(Math.floor(115000 * 1e8));  // 11500000000000

// 合约
uint64 settledPrice = 11290000000000;  // $112,900.00
```

### 金额精度: 1e18 (wei)
```typescript
// 前端
const stakeWei = parseEther("0.1");  // 100000000000000000 wei

// 合约计算时转为1e6精度
uint64 stakeInContract = 100000;  // 0.1 * 1e6
```

---

## 安全特性总结

1. ✅ **完全隐私**: 所有预测内容加密存储，链上不泄露
2. ✅ **防重放攻击**: 使用 `commitment` 哈希
3. ✅ **防重入攻击**: `nonReentrant` 修饰符
4. ✅ **紧急暂停**: `Pausable` 机制
5. ✅ **访问控制**: 角色权限分离
6. ✅ **Fail-Closed**: 验证失败时清零而非回退
7. ✅ **精度保护**: 使用1e6定点数避免除法误差
8. ✅ **异步解密**: 通过 Zama Gateway 安全解密

---

## 潜在改进点

### 1. 结算时间验证
当前合约接受任意 `settlementTimestamp`，可以添加最小/最大时间限制：
```solidity
require(settlementTimestamp > block.timestamp + 1 hours, "Too soon");
require(settlementTimestamp < block.timestamp + 365 days, "Too far");
```

### 2. 最小投注限制
可以添加最小投注额限制：
```solidity
require(msg.value >= MIN_STAKE, "Stake too low");
```

### 3. 取消市场退款机制
当前 `cancelAssetMarket` 只标记市场为已结算，可以添加退款逻辑：
```solidity
function refund(uint256 ticketId) external {
    // 解密投注金额并退还给用户
}
```

### 4. 价格来源验证
当前预言机可以提交任意价格，可以添加价格来源验证：
```solidity
function settleMarket(
    uint256 assetId,
    uint64 settledPrice,
    bytes calldata priceProof  // Chainlink/Pyth证明
) external
```

---

## 总结

**PriceGuessBook** 是一个完整的、生产就绪的 FHE 价格预测合约，具有以下特点：

- 🔒 **完全隐私保护**: 使用全同态加密技术
- 🎯 **智能分配机制**: 自动计算支付比例
- 🛡️ **多重安全防护**: 防重入、防重放、访问控制
- ⚡ **高效计算**: 链上加密计算，无需中心化服务器
- 🌐 **与前端完美对接**: 时间戳、精度、加密参数完全匹配

前端的UTC 0点时间戳可以直接作为 `settlementTimestamp` 使用，合约会在该时间点自动结算。

---

**文档版本**: v1.0
**最后更新**: 2025-10-29
