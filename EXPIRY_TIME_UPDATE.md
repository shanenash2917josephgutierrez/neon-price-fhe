# 预测到期时间更新说明

## 更新内容

将预测到期时间统一改为**用户选择日期的下一个UTC 0点**（UTC午夜 00:00:00）。

## 修改文件

### 1. `src/components/terminal/RangeSelector.tsx`

#### 修改前：
- 使用 `datetime-local` 输入类型
- 用户可以选择具体的时间（精确到分钟）
- 最小时间：当前时间+1小时
- 验证：到期时间必须至少是当前时间1小时后

#### 修改后：
- 使用 `date` 输入类型
- 用户只选择日期
- 最小日期：明天（UTC）
- 到期时间自动设置为所选日期的UTC午夜（00:00:00）
- 验证：到期日期必须至少是明天的UTC 00:00

#### 关键代码变更：

```typescript
// 辅助函数：获取最小日期（UTC明天）
const getMinDate = () => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const year = tomorrow.getUTCFullYear();
  const month = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 时间戳计算：转换为UTC午夜
const [year, month, day] = expiryDate.split('-').map(Number);
const expiryUTC = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
const expiryTimestamp = Math.floor(expiryUTC / 1000); // Unix时间戳（秒）
```

#### UI更新：

```tsx
<Label htmlFor="expiry" className="font-mono text-sm flex items-center gap-2">
  <Calendar className="w-4 h-4 text-primary" />
  <Clock className="w-4 h-4 text-primary" />
  PREDICTION EXPIRY DATE (UTC 00:00)
</Label>
<Input
  id="expiry"
  type="date"  // 从 datetime-local 改为 date
  value={expiryDate}
  min={getMinDate()}
  onChange={(e) => setExpiryDate(e.target.value)}
  className="font-mono border-2 border-muted focus:border-primary"
/>
<p className="text-xs text-muted-foreground font-mono">
  Prediction will expire at UTC midnight (00:00) of selected date
</p>
```

### 2. `src/components/terminal/BetPanel.tsx`

#### 修改内容：
更新到期时间显示格式，明确显示UTC时区和00:00时间。

#### 关键代码变更：

```typescript
<div className="border-t border-border/50 pt-3">
  <div className="text-xs text-muted-foreground font-mono mb-1">
    EXPIRES ON (UTC 00:00)  // 明确标注UTC 00:00
  </div>
  <div className="font-mono text-sm text-primary">
    {new Date(expiryTimestamp * 1000).toUTCString().split(' ').slice(0, 4).join(' ')}
    // 显示格式：Thu, 30 Oct 2025
  </div>
  <div className="text-xs text-muted-foreground font-mono mt-1">
    {Math.floor((expiryTimestamp - Date.now() / 1000) / 3600)} hours from now
  </div>
</div>
```

## 用户体验改进

### 修改前：
1. 用户需要选择具体的日期和时间（年-月-日 时:分）
2. 可能因时区差异导致混淆
3. 不同用户可能选择不同的到期时间

### 修改后：
1. ✅ 用户只需选择日期
2. ✅ 所有预测统一在UTC午夜结算
3. ✅ 避免时区混淆
4. ✅ 更简洁的用户界面
5. ✅ 明确标注UTC时区

## 技术细节

### 时间戳转换

```typescript
// 用户选择日期：2025-10-30
const [year, month, day] = '2025-10-30'.split('-').map(Number);
// year = 2025, month = 10, day = 30

// 转换为UTC午夜时间戳
const expiryUTC = Date.UTC(2025, 9, 30, 0, 0, 0, 0);
// month参数从0开始，所以10月 = 9
// 结果：1761782400000 (毫秒)

// 转换为Unix时间戳（秒）
const expiryTimestamp = Math.floor(expiryUTC / 1000);
// 结果：1761782400
```

### 验证逻辑

```typescript
// 获取明天的UTC午夜时间
const tomorrow = new Date();
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const tomorrowUTC = Date.UTC(
  tomorrow.getUTCFullYear(),
  tomorrow.getUTCMonth(),
  tomorrow.getUTCDate(),
  0, 0, 0, 0
);

// 验证：到期时间必须 >= 明天UTC午夜
if (expiryUTC < tomorrowUTC) {
  setError('Expiry date must be at least tomorrow (UTC 00:00)');
  return;
}
```

## 示例场景

### 场景1：当前时间 2025-10-29 21:57 (本地时间)

用户选择到期日期：**2025-10-30**

- 实际到期时间：**2025-10-30 00:00:00 UTC**
- Unix时间戳：1761782400
- 距离现在：约10小时

### 场景2：当前时间 2025-10-29 02:00 UTC

用户选择到期日期：**2025-10-30**

- 实际到期时间：**2025-10-30 00:00:00 UTC**
- Unix时间戳：1761782400
- 距离现在：约22小时

## 智能合约兼容性

智能合约接收的`expiryTimestamp`参数格式：
- 类型：`uint256`
- 单位：秒（Unix时间戳）
- 示例：`1761782400` = 2025-10-30 00:00:00 UTC

智能合约无需修改，因为只是改变了前端如何生成时间戳，合约仍然接收标准的Unix时间戳。

## 测试验证

### 测试用例1：选择明天的日期
- ✅ 输入：2025-10-30
- ✅ 输出：Thu, 30 Oct 2025 (UTC 00:00)
- ✅ 时间戳：1761782400

### 测试用例2：尝试选择今天
- ✅ 最小日期限制生效
- ✅ 无法选择今天或更早的日期

### 测试用例3：BetPanel显示
- ✅ 显示格式：Thu, 30 Oct 2025
- ✅ 标注：EXPIRES ON (UTC 00:00)
- ✅ 相对时间：10 hours from now

## 总结

这次更新简化了用户体验，统一了预测到期时间的管理：
- 所有预测都在UTC午夜结算
- 避免时区混淆
- 更清晰的UI提示
- 保持与智能合约的完全兼容

---

**更新时间**: 2025-10-29
**版本**: v1.1.0
