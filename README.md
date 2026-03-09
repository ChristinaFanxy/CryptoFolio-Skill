# CryptoFolio Skill for OpenClaw

通过自然语言对话管理你的加密资产。

## 功能

- 💼 **持仓管理** - 记录和追踪你的加密货币持仓
- 📈 **交易记录** - 买入/卖出交易历史
- 🌱 **理财产品** - 质押、借贷、LP 等理财
- 💸 **流水记录** - 充值、提现、转账
- 🏦 **多账户** - 支持 CEX、DEX、钱包等
- 📊 **导出报告** - 一键导出 CSV/Excel

## 安装

```bash
mkdir -p ~/.openclaw/workspace/skills
git clone https://github.com/ChristinaFanxy/CryptoFolio-Skill.git ~/.openclaw/workspace/skills/cryptofolio
```

安装后重启 OpenClaw 即可使用，无需任何配置。

## 数据存储

数据保存在本地 `~/.openclaw/data/cryptofolio.json`，完全离线，无需云端服务。

## 使用示例

在 OpenClaw 中直接对话：

```
用户: 我在 Binance 买了 0.5 ETH，价格 2800 美元
AI: 已记录：在 Binance 买入 0.5 ETH，价格 $2,800.00

用户: 显示我的资产
AI: 📊 资产概览
    💰 总资产: $1,400.00
    📈 累计盈亏: +$0.00
    ...

用户: 导出资产报告
AI: 资产报告已导出到 ~/cryptofolio-report.csv
```

## 支持的操作

| 说法 | 操作 |
|------|------|
| "买了 X 个 ETH" | 添加买入交易 |
| "卖出 X SOL" | 添加卖出交易 |
| "质押 X ETH" | 添加理财 |
| "充值 X USDT" | 添加流水 |
| "显示资产" | 查看概览 |
| "导出报告" | 导出 CSV |
| "打开可视化界面" | 启动 Web 界面 |

## 可视化界面

说 "打开可视化界面" 后，在浏览器访问 http://localhost:3456 即可看到完整的图形化资产管理界面。

## 默认账户

预设了三个常用账户：
- Binance (CEX)
- OKX (CEX)
- MetaMask (钱包)

可以通过对话添加更多账户。

## License

MIT
