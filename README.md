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

### 方式一：通过 ClawHub 安装

```bash
clawhub install cryptofolio
```

### 方式二：手动安装

```bash
git clone https://github.com/christinaxu/cryptofolio-skill.git ~/.openclaw/skills/cryptofolio
```

## 配置

在 `~/.openclaw/openclaw.json` 中添加：

```json
{
  "skills": {
    "entries": {
      "cryptofolio": {
        "enabled": true,
        "env": {
          "CRYPTOFOLIO_API_URL": "https://your-worker.workers.dev",
          "CRYPTOFOLIO_TOKEN": "your-secret-token"
        }
      }
    }
  }
}
```

## 后端部署

你需要部署一个 Cloudflare Worker 作为数据存储后端。

### 1. 创建 Worker

在 Cloudflare Dashboard 创建一个新的 Worker，代码如下：

```javascript
// worker.js
const TOKEN = 'your-secret-token'; // 修改为你的密码

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const auth = request.headers.get('Authorization');

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/api/health') {
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    // Auth check
    if (auth !== `Bearer ${TOKEN}`) {
      return Response.json({ ok: false, error: 'Unauthorized' }, {
        status: 401,
        headers: corsHeaders
      });
    }

    // GET data
    if (url.pathname === '/api/data' && request.method === 'GET') {
      const data = await env.KV.get('cryptofolio_data', 'json') || {
        accounts: [],
        positions: [],
        trades: [],
        finance: [],
        transfers: []
      };
      return Response.json({ ok: true, data }, { headers: corsHeaders });
    }

    // POST data
    if (url.pathname === '/api/data' && request.method === 'POST') {
      const data = await request.json();
      await env.KV.put('cryptofolio_data', JSON.stringify(data));
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    return Response.json({ ok: false, error: 'Not found' }, {
      status: 404,
      headers: corsHeaders
    });
  }
};
```

### 2. 创建 KV 命名空间

```bash
wrangler kv:namespace create "KV"
```

### 3. 配置 wrangler.toml

```toml
name = "cryptofolio-api"
main = "worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

### 4. 部署

```bash
wrangler deploy
```

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

## License

MIT
