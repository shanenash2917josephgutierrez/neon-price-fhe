# Git 使用指南

**项目**: PriceGuess FHE DApp
**仓库**: https://github.com/shanenash2917josephgutierrez/neon-price-fhe

---

## ✅ 已完成的配置

### 1. Git 作者信息配置

作者信息已从 `.env` 文件中读取并配置：

```bash
Git Author: shanenash2917josephgutierrez
Git Email: tilapia.fold-0t@icloud.com
```

### 2. 历史提交修正

所有 `gpt-engineer-app[bot]` 的提交已被修改为您的作者信息：

**修改前**:
```
gpt-engineer-app[bot] <159125892+gpt-engineer-app[bot]@users.noreply.github.com>
```

**修改后**:
```
shanenash2917josephgutierrez <tilapia.fold-0t@icloud.com>
```

### 3. .env 文件保护

`.env` 文件已在 `.gitignore` 中排除，不会被提交到 GitHub：

```
✅ .env 在 .gitignore 中
✅ .env 未被提交到 Git 历史
✅ GitHub 上不包含 .env 文件
```

### 4. 自动提交脚本

已创建 `scripts/git-commit.sh` 自动提交脚本，可通过 npm 命令使用。

---

## 🚀 如何使用自动提交

### 方式 1：使用 npm 命令（推荐）

```bash
# 自动提交所有更改并推送（使用默认提交信息）
npm run commit

# 使用自定义提交信息
npm run commit:msg "feat: 添加新功能"
```

### 方式 2：直接运行脚本

```bash
# 默认提交信息
bash scripts/git-commit.sh

# 自定义提交信息
bash scripts/git-commit.sh "feat: 添加新功能"
```

### 脚本自动执行的操作

1. ✅ 从 `.env` 加载作者信息
2. ✅ 配置 Git 用户名和邮箱
3. ✅ 检查是否有更改
4. ✅ 添加所有更改 (`git add -A`)
5. ✅ 创建提交（包含 Claude Code 标记）
6. ✅ 推送到 GitHub (`git push origin main`)

---

## 📝 提交信息格式

### 默认格式

如果不提供提交信息，将使用默认格式：

```
chore: Auto-commit changes

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 自定义格式

如果提供提交信息，格式为：

```
您的提交信息

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 提交类型建议

使用语义化提交（Semantic Commit）格式：

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响功能）
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建/工具链相关

**示例**:
```bash
npm run commit:msg "feat: 添加价格预测历史功能"
npm run commit:msg "fix: 修复钱包连接错误"
npm run commit:msg "docs: 更新 README 文档"
```

---

## 🔒 设置 GitHub 仓库为公开

由于系统未安装 GitHub CLI，需要在网页端手动设置：

### 步骤：

1. **访问仓库设置**
   ```
   https://github.com/shanenash2917josephgutierrez/neon-price-fhe/settings
   ```

2. **滚动到 "Danger Zone" 区域**

3. **点击 "Change repository visibility"**

4. **选择 "Make public"**

5. **输入仓库名称确认**: `neon-price-fhe`

6. **点击 "I understand, make this repository public"**

### 验证

访问以下链接确认仓库已公开：
```
https://github.com/shanenash2917josephgutierrez/neon-price-fhe
```

---

## 📊 当前仓库状态

### 仓库信息

| 项目 | 值 |
|-----|-----|
| 仓库名称 | neon-price-fhe |
| 仓库所有者 | shanenash2917josephgutierrez |
| 默认分支 | main |
| 可见性 | 🔴 Private（待设置为 Public） |
| 最新提交 | feat: Complete frontend optimization, E2E testing, and custom branding |

### 提交历史

所有提交现在都使用正确的作者信息：

```
✅ 0dcb472 - feat: Complete frontend optimization, E2E testing, and custom branding
✅ f1339b8 - feat: Complete PriceGuess DApp with FHE encryption and Sepolia deployment
✅ 0df0e37 - feat: Build PriceGuess frontend
✅ 57f60c0 - [skip lovable] Use tech stack vite_react_shadcn_ts_20250728_minor
```

---

## 🔍 常见问题

### Q1: 如何查看当前的 Git 配置？

```bash
git config user.name
git config user.email
```

### Q2: 如何手动提交和推送？

```bash
# 1. 查看更改
git status

# 2. 添加更改
git add -A

# 3. 提交
git commit -m "您的提交信息"

# 4. 推送
git push origin main
```

### Q3: 如何撤销最后一次提交？

```bash
# 保留更改，撤销提交
git reset --soft HEAD~1

# 丢弃更改，完全撤销
git reset --hard HEAD~1
```

### Q4: .env 文件被误提交了怎么办？

```bash
# 1. 从 Git 历史中移除
git filter-branch -f --index-filter \
  "git rm --cached --ignore-unmatch .env" HEAD

# 2. 强制推送
git push --force origin main

# 3. 确认 .env 在 .gitignore 中
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: Add .env to gitignore"
git push origin main
```

### Q5: 如何查看提交历史？

```bash
# 简洁格式
git log --oneline

# 详细格式（包含作者信息）
git log --format="%h %an <%ae> %s"

# 图形化显示
git log --oneline --graph --all
```

### Q6: 如何同步远程更改？

```bash
# 拉取最新更改
git pull origin main

# 或者（如果有冲突）
git fetch origin
git merge origin/main
```

---

## 🛠️ 高级操作

### 修改最后一次提交

```bash
# 修改提交信息
git commit --amend -m "新的提交信息"

# 添加遗漏的文件到最后一次提交
git add forgotten-file.txt
git commit --amend --no-edit

# 推送修改后的提交
git push --force origin main
```

### 创建并切换到新分支

```bash
# 创建新分支
git checkout -b feature/new-feature

# 推送新分支到 GitHub
git push -u origin feature/new-feature
```

### 合并分支

```bash
# 切换到 main 分支
git checkout main

# 合并 feature 分支
git merge feature/new-feature

# 推送合并结果
git push origin main
```

---

## 🔐 安全最佳实践

### 永远不要提交的文件

- ✅ `.env` - 环境变量（包含密钥）
- ✅ `.env.local` - 本地环境变量
- ✅ `node_modules/` - 依赖包
- ✅ `dist/` - 构建输出
- ✅ `*.log` - 日志文件
- ✅ `.DS_Store` - macOS 系统文件

### 检查 .gitignore

确保以下内容在 `.gitignore` 中：

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
dist/
build/

# Logs
*.log
npm-debug.log*

# System files
.DS_Store
```

### 敏感信息检查

在提交前检查是否包含：
- API 密钥
- 私钥
- 密码
- 访问令牌
- 数据库连接字符串

---

## 📚 相关文档

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 文档](https://docs.github.com/)
- [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)
- [.gitignore 模板](https://github.com/github/gitignore)

---

## 📞 支持

如遇到 Git 问题，可以：

1. 查看本文档的"常见问题"部分
2. 查阅 [Git 官方文档](https://git-scm.com/doc)
3. 访问 [Stack Overflow](https://stackoverflow.com/questions/tagged/git)

---

**文档创建日期**: 2025-10-29
**最后更新**: 2025-10-29
**版本**: 1.0.0
