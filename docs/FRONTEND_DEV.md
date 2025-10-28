# PriceGuess Frontend Development Guide

## 概述
`price-guess-terminal` 提供科幻交易所风格的双页面体验，用户可预测加密资产的价格区间。所有区间选择与投注金额在浏览器侧通过 FHE SDK 加密后提交，保证竞猜隐私。

## 应用身份
- **App Name**: `price-guess-terminal`
- **Package Path**: `apps/price-guess-terminal`
- **Design System**: 主题 *Neon Trading Floor*，采用暗灰底、霓虹绿与紫色线框，营造量化氛围。

| Token | Hex |
|-------|-----|
| Primary | `#06080F` |
| Secondary | `#10B981` |
| Accent | `#7C3AED` |
| Surface | `#111827` |
| Background | `#020617` |
| Gradient | `linear-gradient(150deg, #020617 0%, #111827 50%, #7C3AED 100%)` |

## 技术栈
- Next.js 14 + TypeScript
- Tailwind CSS + Framer Motion（价格闪烁动画）
- Wagmi v2 + RainbowKit (MetaMask、WalletConnect、Frame)
- `@zama-fhe/relayer-sdk/bundle` 提供密文生成
- TanStack Query 获取链上市场与外部价格 API（Coingecko / Binance）
- Zustand 管理本地下注草稿与图表设置
- Lightweight Charts 渲染价格区间与实时 K 线

## 布局与导航
- `app/layout.tsx` 安装 Provider、主题与 `RealtimeTicker`。
- 顶部 `TradingHeader` 展示资产选择、实时价格、连接钱包按钮。
- 左侧 `AssetSidebar` 提供资产列表与筛选。

## 路由
- `/` — Landing：品牌故事、功能亮点、实时价格展示、CTA “Enter Terminal”。
- `/app` — 预测终端：区间输入、下注签名、已提交票据。
- `/app/positions` — 历史区间预测列表，展示解密后的输赢情况。

## Landing 组件

### HeroTicker
- 文件：`components/landing/HeroTicker.tsx`
- 内容：巨幅价格显示、霓虹标题、双 CTA。
- 动画：Motion 循环数字效果、霓虹边框脉冲。

### FeatureMatrix
- 文件：`components/landing/FeatureMatrix.tsx`
- 特色：隐私、实时、自治、可视化。
- 样式：网格卡片 + 霓虹外发光。

### DataPartnersSection
- 文件：`components/landing/DataPartners.tsx`
- 展示集成的价格数据来源、链上网络支持。

## DApp 核心组件

### RangeSelector
- 文件：`components/app/RangeSelector.tsx`
- 功能：选择目标时间段与价格区间（下限、上限），实时显示当前价格。
- 校验：下限 < 上限，区间跨度合理。

### BetPanel
- 文件：`components/app/BetPanel.tsx`
- 流程：
  1. 输入下注金额。
  2. 调用 `encryptPriceGuess` 加密价格上下限与金额。
  3. 执行交易 `placeGuess(assetId, lowerHandle, upperHandle, stakeHandle, proof)`。
- 提示：显示“Encrypted before broadcast”。

### PositionTable
- 文件：`components/app/PositionTable.tsx`
- 内容：列出历史票据、区间、创建时间、密态状态；当比赛结束并解密后显示结果。

## FHE 集成示例
```typescript
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";

let cachedInstance: Awaited<ReturnType<typeof createInstance>> | null = null;

export async function ensureFheInstance() {
  if (cachedInstance) return cachedInstance;
  await initSDK();
  cachedInstance = await createInstance(SepoliaConfig);
  return cachedInstance;
}

export async function encryptPriceGuess(contractAddress: `0x${string}`, wallet: `0x${string}`, lower: bigint, upper: bigint, stakeWei: bigint) {
  const fhe = await ensureFheInstance();
  const input = fhe.createEncryptedInput(contractAddress, wallet);
  input.add64(lower);
  input.add64(upper);
  input.add64(stakeWei);
  const { handles, inputProof } = await input.encrypt();
  return {
    lowerHandle: handles[0],
    upperHandle: handles[1],
    stakeHandle: handles[2],
    proof: inputProof,
  };
}
```

## 状态管理
- `useTerminalStore`：保存选中资产、区间输入、下注金额、SDK 状态。
- `useMarketsQuery`：轮询链上市场，订阅 `GuessSettled` 事件刷新。
- `EncryptionBanner`：若 SDK 初始化失败或浏览器缺少 COOP/COEP 提示操作指南。

## 测试
- 单元测试：验证 RangeSelector 边界条件、BetPanel 输入校验。
- 集成测试：Cypress 自动化下注流程，断言发送交易前存在 `encryptPriceGuess` 调用。
- 视觉测试：确保暗色 + 霓虹主题在高对比模式下仍可读。
