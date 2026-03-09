# CryptoFolio Skill for OpenClaw

通过自然语言对话管理你的加密资产，支持多设备云端同步。

## 功能

- 💼 **持仓管理** - 记录和追踪你的加密货币持仓
- 📈 **交易记录** - 买入/卖出自动联动持仓
- 🌱 **理财产品** - 质押、借贷、LP 等理财
- 💸 **流水记录** - 充值、提现、转账
- 🏦 **多账户** - 支持 CEX、DEX、钱包等
- ☁️ **云端同步** - 多设备共享数据
- 📊 **导出报告** - 一键导出 CSV/Excel

## 快速开始

### 第一步：安装 Skill

```bash
mkdir -p ~/.openclaw/workspace/skills
git clone https://github.com/ChristinaFanxy/CryptoFolio-Skill.git ~/.openclaw/workspace/skills/cryptofolio
```

### 第二步：部署云端存储（Cloudflare Worker）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **Create** → **Create Worker**
3. 给 Worker 起个名字（如 `cryptofolio-api`），点 **Deploy**
4. 点 **Edit code**，粘贴 `cloudflare-worker/worker.js` 的内容
5. **修改第 4 行的 TOKEN** 为你自己的密码：
   ```js
   const TOKEN = 'your-secret-token'; // 改成你的密码
   ```
6. 点 **Deploy** 保存
7. 回到 Worker 页面 → **Settings** → **Variables and Secrets** → **KV Namespace Bindings** → **Add binding**
   - Variable name: `KV`
   - KV namespace: 点击创建新的，命名为 `cryptofolio-data`
8. 保存后记下你的 Worker URL（类似 `https://cryptofolio-api.xxx.workers.dev`）

### 第三步：配置 OpenClaw

在 OpenClaw 中对话：

```
设置 cryptofolio 云端同步
```

或者直接运行命令：

```bash
node ~/.openclaw/workspace/skills/cryptofolio/scripts/cryptofolio.mjs setup \
  --url "https://你的worker.workers.dev" \
  --token "你设置的密码"
```

### 第四步：开始使用

在 OpenClaw 中直接对话：

```
我在 Binance 充值了 10000 USDT
我用 5000 USDT 买了 0.1 BTC
显示我的资产
```

## 网页端使用

配置云端后，可以在任意设备访问网页版：

https://christinafanxy.github.io/CryptoFolio-Skill/

1. 打开网页
2. 点击右上角「☁️ 云端同步」按钮
3. 填入相同的 Worker URL 和 Token
4. 数据自动同步

## 使用示例

| 说法 | 操作 |
|------|------|
| "充值 10000 USDT 到 Binance" | 充值并增加持仓 |
| "在 Binance 买了 0.1 BTC，价格 50000" | 买入 BTC，扣除 USDT |
| "卖出 0.05 BTC，价格 55000" | 卖出 BTC，增加 USDT |
| "质押 2 ETH，APY 4.5%" | 添加理财记录 |
| "显示资产" | 查看总览 |
| "打开可视化界面" | 启动本地 Web 界面 |
| "导出报告" | 导出 CSV |

## 数据存储

- **本地备份**：`~/.openclaw/data/cryptofolio.json`
- **云端存储**：Cloudflare KV（配置后自动同步）

## 默认账户

预设了三个常用账户：
- Binance (CEX)
- OKX (CEX)
- MetaMask (钱包)

可以通过对话添加更多账户。

## CLI 命令

```bash
# 查看资产
node scripts/cryptofolio.mjs overview

# 查看持仓
node scripts/cryptofolio.mjs list-positions

# 云端状态
node scripts/cryptofolio.mjs cloud-status

# 断开云端
node scripts/cryptofolio.mjs cloud-disconnect
```

## License

MIT
