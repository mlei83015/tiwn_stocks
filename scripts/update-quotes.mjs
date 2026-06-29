import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputJson = resolve(process.argv[2] || "www/data/quotes.json");
const outputJs = resolve(process.argv[3] || outputJson.replace(/\.json$/i, ".js"));

const TWSE_ALL = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
const TPEX_ALL = "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes";
const MIS = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp";

const hotSymbols = [
  "2330", "2454", "2317", "2308", "0050", "0056", "006208", "00878", "00919", "00929",
  "2603", "3231", "3711", "3008", "2382", "2357", "3661", "3034", "3443", "2379",
  "5483", "5347", "6488", "3293", "6223", "4966", "3105", "6187"
];

const twseRows = await fetchJson(TWSE_ALL);
const tpexRows = await fetchJson(TPEX_ALL);
const universe = new Map();

for (const row of twseRows) {
  const symbol = cleanSymbol(row.Code);
  if (!symbol) continue;
  universe.set(symbol, {
    symbol,
    name: row.Name || symbol,
    exchange: "TWSE",
    market: "上市",
    fallback: quoteFromTwse(row)
  });
}

for (const row of tpexRows) {
  const symbol = cleanSymbol(row.SecuritiesCompanyCode);
  if (!symbol) continue;
  universe.set(symbol, {
    symbol,
    name: row.CompanyName || symbol,
    exchange: "TPEX",
    market: "上櫃",
    fallback: quoteFromTpex(row)
  });
}

const targets = Array.from(universe.values())
  .filter((item) => /^\d{4,6}$/.test(item.symbol))
  .sort((a, b) => {
    const hotA = hotSymbols.includes(a.symbol) ? 0 : 1;
    const hotB = hotSymbols.includes(b.symbol) ? 0 : 1;
    return hotA - hotB || a.symbol.localeCompare(b.symbol);
  });

const quotes = {};
for (const chunk of chunks(targets, 70)) {
  const rows = await fetchMisBatch(chunk);
  for (const row of rows) {
    const symbol = cleanSymbol(row.c);
    const info = universe.get(symbol);
    const quote = quoteFromMis(row, info);
    if (quote?.price) quotes[symbol] = quote;
  }
  await delay(120);
}

for (const item of targets) {
  if (!quotes[item.symbol] && item.fallback?.price) quotes[item.symbol] = item.fallback;
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: "TWSE MIS + TWSE/TPEX OpenAPI",
  currency: "TWD",
  count: Object.keys(quotes).length,
  quotes
};

await mkdir(dirname(outputJson), { recursive: true });
await writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(outputJs, `window.TW_K_RADAR_QUOTES = ${JSON.stringify(payload)};\n`, "utf8");
console.log(`Wrote ${payload.count} TWD quotes to ${outputJson}`);

async function fetchMisBatch(items) {
  const exCh = items.map((item) => `${item.exchange === "TPEX" ? "otc" : "tse"}_${item.symbol}.tw`).join("|");
  const url = `${MIS}?ex_ch=${encodeURIComponent(exCh)}&json=1&delay=0&_=${Date.now()}`;
  try {
    const data = await fetchJson(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://mis.twse.com.tw/stock/fibest.jsp?stock=2330"
      }
    });
    return Array.isArray(data?.msgArray) ? data.msgArray : [];
  } catch (error) {
    console.warn(`MIS batch failed: ${error.message}`);
    return [];
  }
}

function quoteFromMis(row, info) {
  const price = number(row.z);
  const previousClose = number(row.y);
  const change = price && previousClose ? price - previousClose : number(row.ch);
  return {
    symbol: cleanSymbol(row.c),
    name: row.n || info?.name || row.c,
    exchange: info?.exchange || "TWSE",
    market: info?.market || (info?.exchange === "TPEX" ? "上櫃" : "上市"),
    currency: "TWD",
    price,
    previousClose,
    open: number(row.o),
    high: number(row.h),
    low: number(row.l),
    volume: number(row.v),
    change,
    percent: previousClose ? (change / previousClose) * 100 : 0,
    date: row.d || "",
    time: row.t || "",
    source: "TWSE MIS"
  };
}

function quoteFromTwse(row) {
  const price = number(row.ClosingPrice);
  const previousClose = price - number(row.Change);
  return {
    symbol: cleanSymbol(row.Code),
    name: row.Name || row.Code,
    exchange: "TWSE",
    market: "上市",
    currency: "TWD",
    price,
    previousClose,
    open: number(row.OpeningPrice),
    high: number(row.HighestPrice),
    low: number(row.LowestPrice),
    volume: number(row.TradeVolume),
    change: number(row.Change),
    percent: previousClose ? (number(row.Change) / previousClose) * 100 : 0,
    date: row.Date || "",
    time: "",
    source: "TWSE OpenAPI"
  };
}

function quoteFromTpex(row) {
  const price = number(row.Close);
  const change = number(row.Change);
  const previousClose = price - change;
  return {
    symbol: cleanSymbol(row.SecuritiesCompanyCode),
    name: row.CompanyName || row.SecuritiesCompanyCode,
    exchange: "TPEX",
    market: "上櫃",
    currency: "TWD",
    price,
    previousClose,
    open: number(row.Open),
    high: number(row.High),
    low: number(row.Low),
    volume: number(row.TradingShares),
    change,
    percent: previousClose ? (change / previousClose) * 100 : 0,
    date: row.Date || "",
    time: "",
    source: "TPEX OpenAPI"
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function cleanSymbol(value) {
  const text = String(value || "").trim();
  return /^\d{4,6}[A-Z]?$/.test(text) ? text : "";
}

function number(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/,/g, "").replace("+", "").trim();
  if (!text || text === "-" || text === "--") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
