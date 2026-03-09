#!/usr/bin/env node

/**
 * CryptoFolio CLI - 加密资产管理命令行工具
 * 本地存储模式 - 数据保存在 ~/.openclaw/data/cryptofolio.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// 本地存储路径
const DATA_DIR = join(homedir(), '.openclaw', 'data');
const DATA_FILE = join(DATA_DIR, 'cryptofolio.json');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) {
  log(`❌ ${msg}`, 'red');
  process.exit(1);
}

function success(msg) {
  log(`✅ ${msg}`, 'green');
}

// 本地数据读写
function loadData() {
  try {
    if (existsSync(DATA_FILE)) {
      return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  // 默认数据
  return {
    accounts: [
      { id: 'a1', name: 'Binance', type: 'CEX', color: '#F0B90B' },
      { id: 'a2', name: 'OKX', type: 'CEX', color: '#2563EB' },
      { id: 'a3', name: 'MetaMask', type: 'WALLET', color: '#E97B2E' },
    ],
    positions: [],
    trades: [],
    finance: [],
    transfers: [],
  };
}

function saveData(state) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// 工具函数
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatUSD(n) {
  if (n === '' || n == null || isNaN(+n)) return '—';
  return '$' + (+n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result[key] = value;
    }
  }
  return result;
}

// 命令实现
function overview() {
  const state = loadData();
  const byType = {};
  const TYPE_LABEL = { CEX: 'CEX', DEX: 'DEX', US_STOCK: '美股', WALLET: '链上钱包' };

  state.positions.forEach((p) => {
    const acc = state.accounts.find((a) => a.id === p.accountId);
    if (!acc) return;
    const v = p.currentValue !== '' && p.currentValue != null
      ? +p.currentValue
      : (+p.amount || 0) * (+p.currentPrice || 0);
    byType[acc.type] = (byType[acc.type] || 0) + v;
  });

  const total = Object.values(byType).reduce((a, b) => a + b, 0);
  const totPnl = state.trades.reduce((s, t) => s + (+t.pnl || 0), 0);
  const activeFinance = state.finance.filter((f) => f.status === 'ACTIVE').length;

  console.log('\n📊 资产概览');
  console.log('═'.repeat(40));
  console.log(`💰 总资产: ${formatUSD(total)}`);
  console.log(`📈 累计盈亏: ${totPnl >= 0 ? '+' : ''}${formatUSD(totPnl)}`);
  console.log(`🌱 进行中理财: ${activeFinance} 个`);
  console.log(`🏦 账户数量: ${state.accounts.length}`);
  console.log(`💼 持仓数量: ${state.positions.length}`);
  console.log(`📝 交易记录: ${state.trades.length}`);
  console.log('');
  if (Object.keys(byType).length > 0) {
    console.log('资金分布:');
    Object.entries(byType).forEach(([type, value]) => {
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      console.log(`  ${TYPE_LABEL[type] || type}: ${formatUSD(value)} (${pct}%)`);
    });
    console.log('');
  }
}

function listPositions() {
  const state = loadData();
  console.log('\n💼 持仓列表');
  console.log('═'.repeat(60));
  if (state.positions.length === 0) {
    console.log('暂无持仓');
    return;
  }
  state.positions.forEach((p) => {
    const acc = state.accounts.find((a) => a.id === p.accountId);
    const value = p.currentValue || (+p.amount || 0) * (+p.currentPrice || 0);
    console.log(`${p.asset} | ${acc?.name || '未知账户'} | 数量: ${p.amount} | 均价: ${formatUSD(p.avgCost)} | 现价: ${formatUSD(p.currentPrice)} | 市值: ${formatUSD(value)}`);
  });
  console.log('');
}

function listTrades() {
  const state = loadData();
  console.log('\n📈 交易记录');
  console.log('═'.repeat(60));
  if (state.trades.length === 0) {
    console.log('暂无交易记录');
    return;
  }
  state.trades.slice(-20).reverse().forEach((t) => {
    const acc = state.accounts.find((a) => a.id === t.accountId);
    const side = t.side === 'BUY' ? '买入' : '卖出';
    const pnl = t.pnl ? ` | 盈亏: ${t.pnl >= 0 ? '+' : ''}${formatUSD(t.pnl)}` : '';
    console.log(`${t.date} | ${t.asset} | ${side} | ${acc?.name || '未知'} | 数量: ${t.amount} | 价格: ${formatUSD(t.price)}${pnl}`);
  });
  console.log('');
}

function listFinance() {
  const state = loadData();
  console.log('\n🌱 理财产品');
  console.log('═'.repeat(60));
  if (state.finance.length === 0) {
    console.log('暂无理财产品');
    return;
  }
  state.finance.forEach((f) => {
    const acc = state.accounts.find((a) => a.id === f.accountId);
    const status = f.status === 'ACTIVE' ? '进行中' : '已结束';
    console.log(`${f.asset} | ${acc?.name || '未知'} | ${f.type} | 本金: ${f.principal} | APY: ${f.apy}% | ${status}`);
  });
  console.log('');
}

function listAccounts() {
  const state = loadData();
  const TYPE_LABEL = { CEX: 'CEX', DEX: 'DEX', US_STOCK: '美股', WALLET: '链上钱包' };
  console.log('\n🏦 账户列表');
  console.log('═'.repeat(40));
  state.accounts.forEach((a) => {
    console.log(`${a.name} | ${TYPE_LABEL[a.type] || a.type}`);
  });
  console.log('');
}

function addAccount(opts) {
  if (!opts.name || !opts.type) {
    error('需要 --name 和 --type 参数');
  }
  const state = loadData();
  const newAccount = {
    id: uid(),
    name: opts.name,
    type: opts.type.toUpperCase(),
    color: opts.color || '#E17055',
  };
  state.accounts.push(newAccount);
  saveData(state);
  success(`已添加账户: ${opts.name} (${opts.type})`);
}

function addTrade(opts) {
  if (!opts.account || !opts.asset || !opts.side || !opts.amount || !opts.price) {
    error('需要 --account, --asset, --side, --amount, --price 参数');
  }
  const state = loadData();
  const acc = state.accounts.find((a) => a.name.toLowerCase() === opts.account.toLowerCase());
  if (!acc) {
    error(`找不到账户: ${opts.account}。可用账户: ${state.accounts.map(a => a.name).join(', ')}`);
  }
  const newTrade = {
    id: uid(),
    accountId: acc.id,
    date: opts.date || today(),
    asset: opts.asset.toUpperCase(),
    side: opts.side.toUpperCase(),
    amount: parseFloat(opts.amount),
    price: parseFloat(opts.price),
    fee: opts.fee ? parseFloat(opts.fee) : 0,
    pnl: opts.pnl ? parseFloat(opts.pnl) : null,
    note: opts.note || '',
  };
  state.trades.push(newTrade);
  saveData(state);
  const sideText = newTrade.side === 'BUY' ? '买入' : '卖出';
  success(`已记录: 在 ${acc.name} ${sideText} ${newTrade.amount} ${newTrade.asset}，价格 ${formatUSD(newTrade.price)}`);
}

function addPosition(opts) {
  if (!opts.account || !opts.asset || !opts.amount) {
    error('需要 --account, --asset, --amount 参数');
  }
  const state = loadData();
  const acc = state.accounts.find((a) => a.name.toLowerCase() === opts.account.toLowerCase());
  if (!acc) {
    error(`找不到账户: ${opts.account}。可用账户: ${state.accounts.map(a => a.name).join(', ')}`);
  }

  const asset = opts.asset.toUpperCase();
  const amount = parseFloat(opts.amount);
  const avgCost = opts.avgCost ? parseFloat(opts.avgCost) : 0;
  const currentPrice = opts.currentPrice ? parseFloat(opts.currentPrice) : 0;

  // 查找是否已有相同账户+资产的持仓
  const existing = state.positions.find(p => p.accountId === acc.id && p.asset === asset);

  if (existing) {
    // 合并持仓：计算新的加权平均成本
    const oldTotal = existing.amount * existing.avgCost;
    const newTotal = amount * avgCost;
    const totalAmount = existing.amount + amount;
    existing.amount = totalAmount;
    existing.avgCost = totalAmount > 0 ? (oldTotal + newTotal) / totalAmount : 0;
    if (currentPrice > 0) existing.currentPrice = currentPrice;
    if (opts.note) existing.note = opts.note;
    saveData(state);
    success(`已更新持仓: ${acc.name} ${existing.amount} ${asset} (均价 ${formatUSD(existing.avgCost)})`);
  } else {
    // 新建持仓
    const newPosition = {
      id: uid(),
      accountId: acc.id,
      asset,
      amount,
      avgCost,
      currentPrice,
      currentValue: opts.currentValue ? parseFloat(opts.currentValue) : null,
      note: opts.note || '',
    };
    state.positions.push(newPosition);
    saveData(state);
    success(`已添加持仓: ${acc.name} ${amount} ${asset}`);
  }
}

function addFinance(opts) {
  if (!opts.account || !opts.asset || !opts.type || !opts.principal) {
    error('需要 --account, --asset, --type, --principal 参数');
  }
  const state = loadData();
  const acc = state.accounts.find((a) => a.name.toLowerCase() === opts.account.toLowerCase());
  if (!acc) {
    error(`找不到账户: ${opts.account}。可用账户: ${state.accounts.map(a => a.name).join(', ')}`);
  }
  const newFinance = {
    id: uid(),
    accountId: acc.id,
    asset: opts.asset.toUpperCase(),
    type: opts.type.toUpperCase(),
    principal: parseFloat(opts.principal),
    apy: opts.apy ? parseFloat(opts.apy) : 0,
    startDate: opts.startDate || today(),
    endDate: opts.endDate || '',
    income: opts.income ? parseFloat(opts.income) : 0,
    status: 'ACTIVE',
    note: opts.note || '',
  };
  state.finance.push(newFinance);
  saveData(state);
  success(`已添加理财: ${acc.name} ${newFinance.asset} ${newFinance.type}，本金 ${newFinance.principal}，APY ${newFinance.apy}%`);
}

function addTransfer(opts) {
  if (!opts.account || !opts.type || !opts.asset || !opts.amount) {
    error('需要 --account, --type, --asset, --amount 参数');
  }
  const state = loadData();
  const acc = state.accounts.find((a) => a.name.toLowerCase() === opts.account.toLowerCase());
  if (!acc) {
    error(`找不到账户: ${opts.account}。可用账户: ${state.accounts.map(a => a.name).join(', ')}`);
  }
  if (!state.transfers) state.transfers = [];
  const newTransfer = {
    id: uid(),
    accountId: acc.id,
    date: opts.date || today(),
    type: opts.type.toUpperCase(),
    asset: opts.asset.toUpperCase(),
    amount: parseFloat(opts.amount),
    fee: opts.fee ? parseFloat(opts.fee) : 0,
    note: opts.note || '',
  };
  state.transfers.push(newTransfer);
  saveData(state);
  const typeText = { DEPOSIT: '充值', WITHDRAW: '提现', TRANSFER: '转账' }[newTransfer.type] || newTransfer.type;
  success(`已记录${typeText}: ${acc.name} ${newTransfer.amount} ${newTransfer.asset}`);
}

function exportReport(opts) {
  const format = opts.format || 'csv';
  const output = opts.output || join(homedir(), `cryptofolio-report-${today()}.${format}`);

  const state = loadData();
  const TYPE_LABEL = { CEX: 'CEX', DEX: 'DEX', US_STOCK: '美股', WALLET: '链上钱包' };

  if (format === 'csv' || format === 'xlsx') {
    let csv = '';

    // 账户汇总
    csv += '=== 账户汇总 ===\n';
    csv += '账户名称,类型,持仓数量,总市值\n';
    state.accounts.forEach((acc) => {
      const positions = state.positions.filter((p) => p.accountId === acc.id);
      const totalValue = positions.reduce((sum, p) => {
        const v = p.currentValue || (+p.amount || 0) * (+p.currentPrice || 0);
        return sum + v;
      }, 0);
      csv += `"${acc.name}","${TYPE_LABEL[acc.type] || acc.type}",${positions.length},${totalValue.toFixed(2)}\n`;
    });

    csv += '\n=== 持仓明细 ===\n';
    csv += '账户,资产,数量,均价,现价,市值,备注\n';
    state.positions.forEach((p) => {
      const acc = state.accounts.find((a) => a.id === p.accountId);
      const value = p.currentValue || (+p.amount || 0) * (+p.currentPrice || 0);
      csv += `"${acc?.name || ''}","${p.asset}",${p.amount},${p.avgCost || 0},${p.currentPrice || 0},${value.toFixed(2)},"${p.note || ''}"\n`;
    });

    csv += '\n=== 交易记录 ===\n';
    csv += '日期,账户,资产,方向,数量,价格,手续费,盈亏,备注\n';
    state.trades.forEach((t) => {
      const acc = state.accounts.find((a) => a.id === t.accountId);
      csv += `"${t.date}","${acc?.name || ''}","${t.asset}","${t.side}",${t.amount},${t.price},${t.fee || 0},${t.pnl || ''},"${t.note || ''}"\n`;
    });

    csv += '\n=== 理财产品 ===\n';
    csv += '账户,资产,类型,本金,APY,开始日期,结束日期,收益,状态,备注\n';
    state.finance.forEach((f) => {
      const acc = state.accounts.find((a) => a.id === f.accountId);
      csv += `"${acc?.name || ''}","${f.asset}","${f.type}",${f.principal},${f.apy || 0},"${f.startDate || ''}","${f.endDate || ''}",${f.income || 0},"${f.status}","${f.note || ''}"\n`;
    });

    if (state.transfers && state.transfers.length > 0) {
      csv += '\n=== 流水记录 ===\n';
      csv += '日期,账户,类型,资产,数量,手续费,备注\n';
      state.transfers.forEach((t) => {
        const acc = state.accounts.find((a) => a.id === t.accountId);
        csv += `"${t.date}","${acc?.name || ''}","${t.type}","${t.asset}",${t.amount},${t.fee || 0},"${t.note || ''}"\n`;
      });
    }

    const finalOutput = format === 'xlsx' ? output.replace('.xlsx', '.csv') : output;
    writeFileSync(finalOutput, '\ufeff' + csv, 'utf8'); // BOM for Excel
    success(`报告已导出到: ${finalOutput}`);
  } else {
    error(`不支持的格式: ${format}，请使用 csv 或 xlsx`);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const opts = parseArgs(args.slice(1));

  try {
    switch (command) {
      case 'overview':
        overview();
        break;
      case 'list-positions':
        listPositions();
        break;
      case 'list-trades':
        listTrades();
        break;
      case 'list-finance':
        listFinance();
        break;
      case 'list-accounts':
        listAccounts();
        break;
      case 'add-account':
        addAccount(opts);
        break;
      case 'add-trade':
        addTrade(opts);
        break;
      case 'add-position':
        addPosition(opts);
        break;
      case 'add-finance':
        addFinance(opts);
        break;
      case 'add-transfer':
        addTransfer(opts);
        break;
      case 'export':
        exportReport(opts);
        break;
      default:
        console.log(`
CryptoFolio CLI - 加密资产管理工具

命令:
  overview          查看资产概览
  list-positions    列出所有持仓
  list-trades       列出交易记录
  list-finance      列出理财产品
  list-accounts     列出所有账户
  add-account       添加账户
  add-trade         添加交易记录
  add-position      添加持仓
  add-finance       添加理财产品
  add-transfer      添加流水记录
  export            导出报告

数据存储位置: ${DATA_FILE}

示例:
  cryptofolio overview
  cryptofolio add-trade --account Binance --asset ETH --side BUY --amount 0.5 --price 2800
  cryptofolio export --format csv --output ~/report.csv
`);
    }
  } catch (err) {
    error(err.message);
  }
}

main();
