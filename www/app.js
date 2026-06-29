(() => {
  "use strict";

  const APP_VERSION = "2026.06.29-desk";
  const STORAGE_KEY = "tw-k-radar-state-v3";
  const ACCOUNT_KEY = "tw-k-radar-accounts-v1";
  const SESSION_KEY = "tw-k-radar-session-v1";
  const ADMIN_HASH = "0e437bdb97df26180b80dac20366a044282aef1c79dce5c764cbecbc3b6f0564";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const fmt = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 });

  const seedStocks = [
    ["2330", "台積電", "TWSE", "半導體"],
    ["2317", "鴻海", "TWSE", "電子代工"],
    ["2454", "聯發科", "TWSE", "IC 設計"],
    ["2308", "台達電", "TWSE", "電源"],
    ["2881", "富邦金", "TWSE", "金融"],
    ["2412", "中華電", "TWSE", "電信"],
    ["2603", "長榮", "TWSE", "航運"],
    ["3231", "緯創", "TWSE", "AI 伺服器"],
    ["3711", "日月光投控", "TWSE", "封測"],
    ["3008", "大立光", "TWSE", "光學"],
    ["0050", "元大台灣50", "TWSE", "ETF"],
    ["0056", "元大高股息", "TWSE", "ETF"],
    ["006208", "富邦台50", "TWSE", "ETF"],
    ["00878", "國泰永續高股息", "TWSE", "ETF"],
    ["00919", "群益台灣精選高息", "TWSE", "ETF"],
    ["00929", "復華台灣科技優息", "TWSE", "ETF"],
    ["3661", "世芯-KY", "TWSE", "IC 設計"],
    ["3034", "聯詠", "TWSE", "IC 設計"],
    ["3443", "創意", "TWSE", "IC 設計"],
    ["2382", "廣達", "TWSE", "電腦週邊"],
    ["2357", "華碩", "TWSE", "電腦週邊"],
    ["2327", "國巨", "TWSE", "被動元件"],
    ["2379", "瑞昱", "TWSE", "網通"],
    ["2408", "南亞科", "TWSE", "記憶體"],
    ["2891", "中信金", "TWSE", "金融"],
    ["2882", "國泰金", "TWSE", "金融"],
    ["2886", "兆豐金", "TWSE", "金融"],
    ["2002", "中鋼", "TWSE", "鋼鐵"],
    ["1303", "南亞", "TWSE", "塑化"],
    ["1216", "統一", "TWSE", "食品"],
    ["1101", "台泥", "TWSE", "水泥"],
    ["5871", "中租-KY", "TWSE", "租賃"],
    ["6505", "台塑化", "TWSE", "塑化"],
    ["5483", "中美晶", "TPEX", "半導體"],
    ["5347", "世界", "TPEX", "晶圓代工"],
    ["6488", "環球晶", "TPEX", "半導體"],
    ["3293", "鈊象", "TPEX", "遊戲"],
    ["6223", "旺矽", "TPEX", "測試介面"],
    ["4966", "譜瑞-KY", "TPEX", "IC 設計"],
    ["3105", "穩懋", "TPEX", "砷化鎵"],
    ["6187", "萬潤", "TPEX", "設備"],
    ["4128", "中天", "TPEX", "生技"],
    ["4743", "合一", "TPEX", "生技"]
  ];

  const newsLinks = [
    {
      tag: "即時新聞",
      title: "台股新聞入口",
      body: "連到 Yahoo 股市、鉅亨網、證交所公告，主頁會保持大版面資訊入口。",
      url: "https://tw.stock.yahoo.com/"
    },
    {
      tag: "交易公告",
      title: "TWSE 公告與市場資訊",
      body: "除權息、注意股票、處置股票、上市公司重大訊息可以從這裡查。",
      url: "https://www.twse.com.tw/"
    },
    {
      tag: "櫃買中心",
      title: "上櫃股票與興櫃資訊",
      body: "中小型股、上櫃股、櫃買公告與行情資訊入口。",
      url: "https://www.tpex.org.tw/"
    }
  ];

  const indicatorDefs = [
    ["volume", "成交量", "量能柱"],
    ["sma", "SMA 20", "簡單均線"],
    ["ema", "EMA 20", "指數均線"],
    ["bb", "布林通道", "波動區間"],
    ["rsi", "RSI 14", "強弱指標"],
    ["macd", "MACD", "動能轉折"],
    ["smc", "SMC 區域", "供給需求"],
    ["sri", "SRI 反轉", "反轉概率"],
    ["custom", "自訂指標", "程式線"]
  ];

  const tools = [
    ["cursor", "十字游標 / 拖曳平移", "⌖"],
    ["trend", "趨勢線", "╱"],
    ["ray", "射線", "↗"],
    ["hline", "水平線", "─"],
    ["measure", "測量漲跌幅", "↕"],
    ["text", "文字標記", "T"],
    ["zoomin", "放大", "+"],
    ["zoomout", "縮小", "-"],
    ["fit", "顯示全部", "⤢"],
    ["magnet", "磁貼吸附", "⧉"],
    ["clear", "清除畫線", "⌫"]
  ];

  const defaultState = {
    page: "chart",
    symbol: "2330",
    timeframe: "15m",
    theme: "dark",
    colorMode: "tw",
    magnet: true,
    rightPanel: true,
    chartType: "candles",
    tool: "cursor",
    zoomBars: 220,
    offset: 0,
    user: null,
    searchText: "",
    watchlist: ["2330", "2454", "2317", "2308", "0050", "00919", "2603", "3231"],
    indicators: {
      volume: true,
      sma: true,
      ema: false,
      bb: true,
      rsi: true,
      macd: true,
      smc: true,
      sri: true,
      custom: false
    },
    customScript:
      "/* 可用資料：close, open, high, low, volume\n" +
      "   回傳與 close 一樣長度的數字陣列 */\n" +
      "return close.map((price, i) => {\n" +
      "  if (i < 9) return null;\n" +
      "  const slice = close.slice(i - 9, i + 1);\n" +
      "  return slice.reduce((sum, value) => sum + value, 0) / slice.length;\n" +
      "});",
    drawings: {},
    replay: {
      enabled: false,
      playing: false,
      startDate: "",
      index: null
    },
    settings: {
      autoRefresh: true,
      showGrid: true,
      compactMobile: true,
      riskHints: true
    }
  };

  let state = loadState();
  let universe = seedStocks.map(([symbol, name, exchange, sector]) => ({
    symbol,
    name,
    exchange,
    sector,
    market: exchange === "TPEX" ? "上櫃" : "上市"
  }));
  const dataStore = new Map();
  let chartRuntime = null;
  let refreshTimer = null;
  let replayTimer = null;
  let pendingDraft = null;

  boot();

  async function boot() {
    ensureAccounts();
    state.user = loadSession();
    document.body.dataset.theme = state.theme;
    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    window.addEventListener("resize", debounce(() => {
      if (state.page === "chart") setupChartCanvas();
    }, 120));
    updateClock();
    setInterval(updateClock, 1000);
    refreshUniverse();

    if (!state.user) {
      renderLogin();
      return;
    }

    renderApp();
    await loadMarketData(state.symbol, { force: true });
    renderApp();
    scheduleRefresh();
  }

  function renderLogin(mode = "login", message = "") {
    $(".bottom-nav")?.classList.add("is-hidden");
    $("#drawer").classList.remove("is-open");
    $("#view").innerHTML = `
      <section class="login-screen">
        <div class="login-panel">
          <div class="login-brand">
            <button class="brand-mark menu-button" type="button" aria-hidden="true">☰</button>
            <div>
              <h1>TW K Radar</h1>
              <p>台股即時判讀工作台</p>
            </div>
          </div>
          <div class="login-tabs">
            <button class="${mode === "login" ? "is-active" : ""}" data-login-mode="login" type="button">登入</button>
            <button class="${mode === "register" ? "is-active" : ""}" data-login-mode="register" type="button">註冊</button>
          </div>
          ${message ? `<div class="form-message">${escapeHtml(message)}</div>` : ""}
          ${mode === "login" ? loginForm() : registerForm()}
          <button class="ghost-btn wide-btn" data-action="guest" type="button">先用訪客模式看行情</button>
          <p class="login-note">管理員帳號：admin / twkradar2026。靜態網站版先存在本機瀏覽器，之後可接 Supabase 或自己的 SQL 後端。</p>
        </div>
      </section>
    `;
  }

  function loginForm() {
    return `
      <form class="login-form" data-form="login">
        <label>帳號
          <input class="text-input" name="username" autocomplete="username" required />
        </label>
        <label>密碼
          <input class="text-input" name="password" type="password" autocomplete="current-password" required />
        </label>
        <button class="primary-btn wide-btn" type="submit">登入工作台</button>
      </form>
    `;
  }

  function registerForm() {
    return `
      <form class="login-form" data-form="register">
        <label>帳號
          <input class="text-input" name="username" minlength="3" autocomplete="username" required />
        </label>
        <label>密碼
          <input class="text-input" name="password" type="password" minlength="6" autocomplete="new-password" required />
        </label>
        <label>再次輸入密碼
          <input class="text-input" name="password2" type="password" minlength="6" autocomplete="new-password" required />
        </label>
        <button class="primary-btn wide-btn" type="submit">建立帳號</button>
      </form>
    `;
  }

  function renderApp() {
    $(".bottom-nav")?.classList.remove("is-hidden");
    document.body.dataset.theme = state.theme;
    renderDrawer();
    updateTopbar();
    $$(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.page === state.page));

    if (state.page === "home") renderHome();
    if (state.page === "watchlist") renderWatchlist();
    if (state.page === "chart") renderChart();
    if (state.page === "indicators") renderIndicatorsPage();
    if (state.page === "settings") renderSettings();
    saveState();
  }

  function renderDrawer() {
    const user = state.user?.username || "訪客";
    $("#drawer").innerHTML = `
      <div class="drawer-head">
        <div class="brand-mark">☰</div>
        <div>
          <strong>TW K Radar</strong>
          <span>${escapeHtml(user)}</span>
        </div>
      </div>
      <button data-page="home" type="button">首頁新聞</button>
      <button data-page="watchlist" type="button">自選股票</button>
      <button data-page="chart" type="button">K線工作台</button>
      <button data-page="indicators" type="button">指標與腳本</button>
      <button data-page="settings" type="button">設定</button>
      <div class="drawer-meta">
        <span>版本 ${APP_VERSION}</span>
        <span>資料：Yahoo Chart、TWSE MIS、TWSE/TPEX OpenAPI</span>
      </div>
      <button class="ghost-btn" data-action="logout" type="button">登出</button>
    `;
  }

  function renderHome() {
    const data = dataStore.get(state.symbol);
    const ai = buildAI(data);
    $("#view").innerHTML = `
      <section class="home-hero">
        <div>
          <span class="eyebrow">台股雷達</span>
          <h1>${symbolLabel(state.symbol)} ${ai.title}</h1>
          <p>${ai.summary}</p>
        </div>
        <div class="hero-quote">
          <span>最新價</span>
          <strong>${formatPrice(data?.quote?.price)}</strong>
          <small class="${changeClass(data?.quote?.change)}">${formatSigned(data?.quote?.change)} / ${formatPercent(data?.quote?.percent)}</small>
        </div>
      </section>
      <section class="home-grid">
        <div class="panel wide">
          <div class="section-head">
            <div>
              <h2>台股新聞</h2>
              <p>先做成大版面新聞入口，之後可接新聞 API 或自己的後台。</p>
            </div>
          </div>
          <div class="news-grid">
            ${newsLinks.map((item) => `
              <a class="news-card" href="${item.url}" target="_blank" rel="noreferrer">
                <span>${item.tag}</span>
                <strong>${item.title}</strong>
                <p>${item.body}</p>
              </a>
            `).join("")}
          </div>
        </div>
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>自選快看</h2>
              <p>${state.watchlist.length} 檔追蹤</p>
            </div>
            <button class="ghost-btn" data-page="watchlist" type="button">管理</button>
          </div>
          <div class="quote-list">
            ${state.watchlist.slice(0, 8).map((symbol) => compactQuoteRow(symbol)).join("")}
          </div>
        </div>
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>AI 判讀</h2>
              <p>趨勢、壓力、支撐、風險</p>
            </div>
          </div>
          ${aiPanel(data)}
        </div>
      </section>
    `;
  }

  function renderWatchlist() {
    $("#view").innerHTML = `
      <section class="watch-layout">
        <div class="panel watch-panel">
          <div class="section-head">
            <div>
              <h2>全台股搜尋</h2>
              <p>上市、上櫃會從公開 OpenAPI 補進來；找不到時還是可輸入代號。</p>
            </div>
          </div>
          <div class="stock-search">
            <input id="watchSearch" class="text-input symbol-input" data-search-target="watchResults" placeholder="輸入代號或名稱，例如 2330、台積電、聯發科" value="${escapeHtml(state.searchText)}" />
            <div id="watchResults" class="search-results"></div>
          </div>
        </div>
        <div class="watch-grid">
          ${state.watchlist.map((symbol) => watchCard(symbol)).join("")}
        </div>
      </section>
    `;
    updateSearchResults($("#watchSearch"), $("#watchResults"));
  }

  function renderChart() {
    const data = dataStore.get(state.symbol);
    const ai = buildAI(data);
    $("#view").innerHTML = `
      <section class="trading-desk ${state.rightPanel ? "" : "no-right"}">
        <aside class="left-tools" aria-label="畫線工具">
          ${tools.map(([id, title, icon]) => `
            <button class="${toolActive(id)}" data-tool="${id}" title="${title}" type="button">${icon}</button>
          `).join("")}
        </aside>
        <main class="desk-main">
          <div class="trade-topbar">
            <div class="symbol-box">
              <input id="chartSymbolSearch" class="text-input symbol-input" data-search-target="chartSearchResults" value="${escapeHtml(state.symbol)}" aria-label="股票搜尋" />
              <div id="chartSearchResults" class="search-popover"></div>
            </div>
            <div class="timeframe-row">
              ${["5m", "15m", "60m", "D"].map((tf) => `
                <button class="${state.timeframe === tf ? "is-active" : ""}" data-timeframe="${tf}" type="button">${timeframeLabel(tf)}</button>
              `).join("")}
            </div>
            <button class="tool-toggle ${state.magnet ? "is-active" : ""}" data-tool="magnet" type="button">磁貼</button>
            <button class="tool-toggle" data-action="fit-chart" type="button">顯示全部</button>
            <button class="tool-toggle ${state.rightPanel ? "is-active" : ""}" data-action="toggle-right" type="button">右欄</button>
          </div>
          <div class="chart-headline">
            <div>
              <strong>${symbolLabel(state.symbol)} · ${timeframeLabel(state.timeframe)}</strong>
              <span>${data?.source || "資料讀取中"} ${data?.updatedAt ? "· " + timeAgo(data.updatedAt) : ""}</span>
            </div>
            ${ohlcLine(data)}
          </div>
          <div class="chart-stage">
            <canvas id="chartCanvas" aria-label="K線圖"></canvas>
            <div class="chart-floating">
              <span>${state.tool === "cursor" ? "滾輪縮放，拖曳平移" : selectedToolTitle()}</span>
              <span>${state.magnet ? "磁貼開" : "磁貼關"}</span>
            </div>
          </div>
          <div class="range-bar">
            <button data-range="80" type="button">近80根</button>
            <button data-range="220" type="button">近220根</button>
            <button data-range="520" type="button">近520根</button>
            <button data-action="fit-chart" type="button">全部</button>
            <div class="replay-controls">
              <label>回放起點 <input class="date-input" id="replayDate" type="date" value="${escapeHtml(state.replay.startDate || "")}" /></label>
              <button data-action="replay-start" type="button">${state.replay.enabled ? "重設回放" : "開始回放"}</button>
              <button data-action="replay-play" type="button">${state.replay.playing ? "暫停" : "播放"}</button>
              <button data-action="replay-step" type="button">下一根</button>
            </div>
          </div>
        </main>
        <aside class="right-panel">
          <div class="panel compact">
            <div class="section-head">
              <div>
                <h2>觀察清單</h2>
                <p>${state.watchlist.length} 檔</p>
              </div>
              <button class="ghost-btn" data-page="watchlist" type="button">+</button>
            </div>
            <div class="quote-list tight">
              ${state.watchlist.map((symbol) => compactQuoteRow(symbol)).join("")}
            </div>
          </div>
          <div class="panel compact ai-card">
            ${aiPanel(data)}
          </div>
          <div class="panel compact">
            <div class="section-head">
              <div>
                <h2>指標</h2>
                <p>技術指標與腳本</p>
              </div>
              <button class="ghost-btn" data-page="indicators" type="button">編輯</button>
            </div>
            <div class="indicator-list">
              ${indicatorDefs.map(([id, name, desc]) => indicatorToggle(id, name, desc)).join("")}
            </div>
          </div>
        </aside>
      </section>
    `;
    updateSearchResults($("#chartSymbolSearch"), $("#chartSearchResults"));
    setupChartCanvas();
    if (!data || isStale(data.updatedAt, 45_000)) loadMarketData(state.symbol).then(() => {
      if (state.page === "chart") renderApp();
    });
  }

  function renderIndicatorsPage() {
    $("#view").innerHTML = `
      <section class="indicator-page">
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>指標清單</h2>
              <p>常用技術指標、SMC/SRI、你的自訂腳本。</p>
            </div>
          </div>
          <div class="indicator-library">
            ${indicatorDefs.map(([id, name, desc]) => indicatorToggle(id, name, desc)).join("")}
          </div>
        </div>
        <div class="panel script-editor">
          <div class="section-head">
            <div>
              <h2>我的腳本</h2>
              <p>先做 JavaScript 指標原型，之後可以再改成 Pine Script 類語法。</p>
            </div>
          </div>
          <form data-form="script">
            <textarea class="code-editor" name="script" spellcheck="false">${escapeHtml(state.customScript)}</textarea>
            <div class="action-row">
              <button class="primary-btn" type="submit">儲存腳本</button>
              <button class="ghost-btn" data-action="reset-script" type="button">還原範例</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function renderSettings() {
    $("#view").innerHTML = `
      <section class="settings-grid">
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>顯示設定</h2>
              <p>顏色、主題、版面會自動記住。</p>
            </div>
          </div>
          ${settingSegment("theme", "主題", [["dark", "黑色"], ["light", "白色"]], state.theme)}
          ${settingSegment("colorMode", "漲跌顏色", [["tw", "紅漲綠跌"], ["intl", "綠漲紅跌"]], state.colorMode)}
          ${settingSwitch("magnet", "磁貼吸附", state.magnet)}
          ${settingSwitch("rightPanel", "右側觀察欄", state.rightPanel)}
          ${settingSwitch("showGrid", "K線格線", state.settings.showGrid)}
          ${settingSwitch("autoRefresh", "自動更新行情", state.settings.autoRefresh)}
        </div>
        <div class="panel">
          <div class="section-head">
            <div>
              <h2>帳號</h2>
              <p>${escapeHtml(state.user?.username || "訪客")} · ${escapeHtml(state.user?.role || "guest")}</p>
            </div>
          </div>
          <div class="settings-note">
            <strong>目前是前端本機帳號</strong>
            <p>GitHub Pages 是靜態網站，不能直接跑 SQL 登入。這版會把自選股、指標、顏色、畫線存在瀏覽器；多人同步需要下一步接 Supabase、Firebase、Cloudflare D1 或自架後端。</p>
          </div>
          <button class="ghost-btn wide-btn" data-action="logout" type="button">登出</button>
        </div>
      </section>
    `;
  }

  function setupChartCanvas() {
    const canvas = $("#chartCanvas");
    if (!canvas) return;
    const data = dataStore.get(state.symbol);
    const candles = replayCandles(data?.candles || []);
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(320, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    chartRuntime = buildChartRuntime(canvas, ctx, candles, data);
    drawChart();
    bindCanvas(canvas);
  }

  function buildChartRuntime(canvas, ctx, candles, data) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const volumeH = state.indicators.volume ? Math.max(70, h * 0.16) : 0;
    const rsiH = state.indicators.rsi ? Math.max(58, h * 0.12) : 0;
    const macdH = state.indicators.macd ? Math.max(58, h * 0.12) : 0;
    const priceArea = {
      left: 56,
      top: 18,
      right: w - 72,
      bottom: h - 34 - volumeH - rsiH - macdH
    };
    priceArea.bottom = Math.max(priceArea.top + 170, priceArea.bottom);
    const end = Math.max(0, candles.length - Math.round(state.offset));
    const zoomBars = clamp(Math.round(state.zoomBars), 24, Math.max(24, candles.length || 24));
    const start = Math.max(0, end - zoomBars);
    const visible = candles.slice(start, end || candles.length);
    const values = visible.flatMap((candle) => [candle.high, candle.low]).filter(Number.isFinite);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
      const fallback = data?.quote?.price || 100;
      min = fallback * 0.95;
      max = fallback * 1.05;
    }
    const pad = (max - min) * 0.12 || max * 0.02;
    min -= pad;
    max += pad;
    const width = priceArea.right - priceArea.left;
    const height = priceArea.bottom - priceArea.top;
    const step = visible.length ? width / visible.length : 8;
    const candleW = clamp(step * 0.62, 1.2, 14);
    const toX = (globalIndex) => priceArea.left + (globalIndex - start + 0.5) * step;
    const toY = (price) => priceArea.bottom - ((price - min) / (max - min)) * height;
    const fromX = (x) => clamp(Math.floor((x - priceArea.left) / step) + start, start, Math.max(start, end - 1));
    const fromY = (y) => max - ((y - priceArea.top) / height) * (max - min);

    return {
      canvas,
      ctx,
      candles,
      data,
      w,
      h,
      visible,
      start,
      end,
      min,
      max,
      priceArea,
      volumeH,
      rsiH,
      macdH,
      step,
      candleW,
      toX,
      toY,
      fromX,
      fromY,
      pointer: null,
      drag: null
    };
  }

  function drawChart() {
    const rt = chartRuntime;
    if (!rt) return;
    const { ctx, w, h, priceArea, visible, start, toX, toY } = rt;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css("--chart-bg");
    ctx.fillRect(0, 0, w, h);
    drawGrid(rt);

    if (!visible.length) {
      ctx.fillStyle = css("--muted");
      ctx.font = "14px system-ui";
      ctx.fillText("正在讀取真實行情，若資料源被限制會顯示離線示範。", 72, 78);
      return;
    }

    if (state.indicators.smc) drawSmcZones(rt);
    if (state.indicators.bb) drawBollinger(rt);
    if (state.indicators.sma) drawLine(rt, sma(rt.candles.map((c) => c.close), 20), css("--ma"));
    if (state.indicators.ema) drawLine(rt, ema(rt.candles.map((c) => c.close), 20), css("--ema"));
    if (state.indicators.custom) drawCustom(rt);

    visible.forEach((candle, localIndex) => {
      const globalIndex = start + localIndex;
      const x = toX(globalIndex);
      const openY = toY(candle.open);
      const closeY = toY(candle.close);
      const highY = toY(candle.high);
      const lowY = toY(candle.low);
      const up = candle.close >= candle.open;
      ctx.strokeStyle = candleColor(up);
      ctx.fillStyle = candleColor(up);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      if (rt.candleW < 2) {
        ctx.fillRect(x - 0.5, bodyTop, 1, bodyHeight);
      } else {
        ctx.fillRect(x - rt.candleW / 2, bodyTop, rt.candleW, bodyHeight);
      }
    });

    if (state.indicators.sri) drawSri(rt);
    if (state.indicators.volume) drawVolume(rt);
    if (state.indicators.rsi) drawRsi(rt);
    if (state.indicators.macd) drawMacd(rt);
    drawDrawings(rt);
    if (pendingDraft) drawDraft(rt);
    drawCrosshair(rt);
    drawAxes(rt);
  }

  function drawGrid(rt) {
    const { ctx, w, h, priceArea } = rt;
    if (!state.settings.showGrid) return;
    ctx.strokeStyle = css("--grid");
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i += 1) {
      const y = priceArea.top + ((priceArea.bottom - priceArea.top) / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 10; i += 1) {
      const x = priceArea.left + ((priceArea.right - priceArea.left) / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  function drawAxes(rt) {
    const { ctx, w, h, priceArea, min, max, visible, start, toX } = rt;
    ctx.fillStyle = css("--muted");
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    for (let i = 0; i <= 6; i += 1) {
      const price = max - ((max - min) / 6) * i;
      const y = priceArea.top + ((priceArea.bottom - priceArea.top) / 6) * i;
      ctx.fillText(formatPrice(price), priceArea.right + 10, y + 4);
    }
    ctx.textAlign = "center";
    const labelCount = Math.min(8, visible.length);
    for (let i = 0; i < labelCount; i += 1) {
      const localIndex = Math.floor((visible.length - 1) * (i / Math.max(1, labelCount - 1)));
      const candle = visible[localIndex];
      if (!candle) continue;
      ctx.fillText(formatAxisTime(candle.time), toX(start + localIndex), h - 10);
    }
    const last = visible.at(-1);
    if (last) {
      const y = rt.toY(last.close);
      ctx.strokeStyle = css("--accent-2");
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = css("--accent-2");
      ctx.fillRect(priceArea.right + 6, y - 11, 62, 22);
      ctx.fillStyle = "#061512";
      ctx.textAlign = "left";
      ctx.fillText(formatPrice(last.close), priceArea.right + 11, y + 4);
    }
  }

  function drawVolume(rt) {
    const { ctx, priceArea, h, visible, start, toX } = rt;
    const top = priceArea.bottom + 10;
    const bottom = top + rt.volumeH - 12;
    const maxVol = Math.max(...visible.map((c) => c.volume || 0), 1);
    ctx.fillStyle = css("--muted");
    ctx.font = "11px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("成交量", priceArea.left, top + 12);
    visible.forEach((candle, localIndex) => {
      const x = toX(start + localIndex);
      const height = ((candle.volume || 0) / maxVol) * (bottom - top - 16);
      ctx.fillStyle = candleColor(candle.close >= candle.open, 0.55);
      ctx.fillRect(x - rt.candleW / 2, bottom - height, Math.max(1, rt.candleW), height);
    });
  }

  function drawRsi(rt) {
    const { ctx, priceArea, visible, start, toX, h } = rt;
    const top = priceArea.bottom + 10 + rt.volumeH;
    const bottom = top + rt.rsiH - 12;
    const list = rsi(rt.candles.map((c) => c.close), 14);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    [30, 70].forEach((level) => {
      const y = bottom - (level / 100) * (bottom - top);
      ctx.beginPath();
      ctx.moveTo(priceArea.left, y);
      ctx.lineTo(priceArea.right, y);
      ctx.stroke();
    });
    ctx.fillStyle = css("--muted");
    ctx.font = "11px system-ui";
    ctx.fillText("RSI", priceArea.left, top + 11);
    ctx.beginPath();
    ctx.strokeStyle = css("--purple");
    visible.forEach((_, localIndex) => {
      const globalIndex = start + localIndex;
      const value = list[globalIndex];
      if (!Number.isFinite(value)) return;
      const x = toX(globalIndex);
      const y = bottom - (value / 100) * (bottom - top);
      if (localIndex === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillText("", priceArea.right - 10, h - 10);
  }

  function drawMacd(rt) {
    const { ctx, priceArea, visible, start, toX } = rt;
    const top = priceArea.bottom + 10 + rt.volumeH + rt.rsiH;
    const bottom = top + rt.macdH - 12;
    const macd = macdSeries(rt.candles.map((c) => c.close));
    const maxAbs = Math.max(...macd.hist.map((v) => Math.abs(v || 0)), 1);
    const mid = (top + bottom) / 2;
    ctx.fillStyle = css("--muted");
    ctx.font = "11px system-ui";
    ctx.fillText("MACD", priceArea.right - 36, top + 11);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(priceArea.left, mid);
    ctx.lineTo(priceArea.right, mid);
    ctx.stroke();
    visible.forEach((_, localIndex) => {
      const globalIndex = start + localIndex;
      const value = macd.hist[globalIndex] || 0;
      const barH = Math.abs(value / maxAbs) * ((bottom - top) / 2);
      ctx.fillStyle = value >= 0 ? "rgba(71, 194, 168, 0.6)" : "rgba(228, 84, 84, 0.6)";
      ctx.fillRect(toX(globalIndex) - rt.candleW / 2, value >= 0 ? mid - barH : mid, Math.max(1, rt.candleW), barH);
    });
  }

  function drawBollinger(rt) {
    const closes = rt.candles.map((c) => c.close);
    const mid = sma(closes, 20);
    const upper = [];
    const lower = [];
    for (let i = 0; i < closes.length; i += 1) {
      if (i < 19) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      const slice = closes.slice(i - 19, i + 1);
      const avg = mid[i];
      const stdev = Math.sqrt(slice.reduce((sum, value) => sum + (value - avg) ** 2, 0) / slice.length);
      upper.push(avg + stdev * 2);
      lower.push(avg - stdev * 2);
    }
    drawLine(rt, upper, css("--bb"), 1);
    drawLine(rt, lower, css("--bb"), 1);
  }

  function drawSmcZones(rt) {
    const { ctx, priceArea, visible } = rt;
    if (visible.length < 10) return;
    const highs = visible.map((c) => c.high);
    const lows = visible.map((c) => c.low);
    const supply = percentile(highs, 0.88);
    const demand = percentile(lows, 0.14);
    const range = rt.max - rt.min;
    drawZone(supply - range * 0.018, supply + range * 0.025, "rgba(228,84,84,0.14)", "SMC 供給");
    drawZone(demand - range * 0.018, demand + range * 0.025, "rgba(71,194,168,0.15)", "SMC 需求");

    function drawZone(low, high, color, label) {
      const y1 = rt.toY(high);
      const y2 = rt.toY(low);
      ctx.fillStyle = color;
      ctx.fillRect(priceArea.left, y1, priceArea.right - priceArea.left, y2 - y1);
      ctx.strokeStyle = color.replace("0.14", "0.45").replace("0.15", "0.45");
      ctx.strokeRect(priceArea.left, y1, priceArea.right - priceArea.left, y2 - y1);
      ctx.fillStyle = color.includes("228") ? css("--danger") : css("--accent-2");
      ctx.font = "12px system-ui";
      ctx.fillText(label, priceArea.left + 8, y1 + 18);
    }
  }

  function drawSri(rt) {
    const { ctx, visible, start, toX, toY } = rt;
    for (let localIndex = 2; localIndex < visible.length - 2; localIndex += 1) {
      const candle = visible[localIndex];
      const prev = visible[localIndex - 1];
      const next = visible[localIndex + 1];
      const globalIndex = start + localIndex;
      if (candle.high > prev.high && candle.high > next.high) {
        drawTriangle(toX(globalIndex), toY(candle.high) - 12, css("--danger"), true);
      }
      if (candle.low < prev.low && candle.low < next.low) {
        drawTriangle(toX(globalIndex), toY(candle.low) + 12, css("--accent-2"), false);
      }
    }

    function drawTriangle(x, y, color, down) {
      ctx.fillStyle = color;
      ctx.beginPath();
      if (down) {
        ctx.moveTo(x, y + 6);
        ctx.lineTo(x - 5, y - 4);
        ctx.lineTo(x + 5, y - 4);
      } else {
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 5, y + 4);
        ctx.lineTo(x + 5, y + 4);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawCustom(rt) {
    try {
      const candles = rt.candles;
      const values = runCustomScript(candles);
      drawLine(rt, values, css("--custom"), 1.5);
    } catch (error) {
      console.warn("custom indicator failed", error);
    }
  }

  function drawLine(rt, values, color, width = 2) {
    const { ctx, visible, start, toX, toY } = rt;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    let started = false;
    visible.forEach((_, localIndex) => {
      const globalIndex = start + localIndex;
      const value = values[globalIndex];
      if (!Number.isFinite(value)) return;
      const x = toX(globalIndex);
      const y = toY(value);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  function drawDrawings(rt) {
    const drawings = currentDrawings();
    drawings.forEach((item) => drawDrawing(rt, item, false));
  }

  function drawDraft(rt) {
    drawDrawing(rt, pendingDraft, true);
  }

  function drawDrawing(rt, item, draft) {
    const { ctx, priceArea } = rt;
    ctx.save();
    ctx.strokeStyle = draft ? "rgba(240,184,75,0.75)" : css("--drawing");
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = draft ? 1 : 1.5;
    ctx.setLineDash(draft ? [4, 4] : []);
    if (item.type === "hline") {
      const y = rt.toY(item.price);
      ctx.beginPath();
      ctx.moveTo(priceArea.left, y);
      ctx.lineTo(priceArea.right, y);
      ctx.stroke();
      ctx.fillText(formatPrice(item.price), priceArea.left + 8, y - 6);
    } else if (item.type === "text") {
      ctx.font = "13px system-ui";
      ctx.fillText(item.text || "筆記", rt.toX(item.index), rt.toY(item.price));
    } else {
      const x1 = rt.toX(item.a.index);
      const y1 = rt.toY(item.a.price);
      let x2 = rt.toX(item.b.index);
      let y2 = rt.toY(item.b.price);
      if (item.type === "ray") {
        const dx = x2 - x1 || 1;
        const dy = y2 - y1;
        x2 = priceArea.right;
        y2 = y1 + (dy / dx) * (x2 - x1);
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (item.type === "measure") {
        const pct = ((item.b.price - item.a.price) / item.a.price) * 100;
        ctx.fillText(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 8);
      }
    }
    ctx.restore();
  }

  function drawCrosshair(rt) {
    if (!rt.pointer) return;
    const { ctx, w, h, pointer, fromX, candles, toX, toY } = rt;
    const index = fromX(pointer.x);
    const candle = candles[index];
    if (!candle) return;
    const x = toX(index);
    const y = toY(nearestOhlc(candle, rt.fromY(pointer.y)));
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.restore();
  }

  function bindCanvas(canvas) {
    canvas.onmousemove = (event) => {
      if (!chartRuntime) return;
      const p = pointer(event, canvas);
      chartRuntime.pointer = p;
      if (chartRuntime.drag?.type === "pan") {
        const dx = p.x - chartRuntime.drag.x;
        const movedBars = -Math.round(dx / Math.max(2, chartRuntime.step));
        state.offset = clamp(chartRuntime.drag.offset + movedBars, 0, Math.max(0, chartRuntime.candles.length - 20));
        setupChartCanvas();
        return;
      }
      if (chartRuntime.drag?.type === "draw" && pendingDraft) {
        pendingDraft.b = snapPoint(p);
      }
      drawChart();
    };
    canvas.onmouseleave = () => {
      if (!chartRuntime) return;
      chartRuntime.pointer = null;
      drawChart();
    };
    canvas.onmousedown = (event) => {
      if (!chartRuntime) return;
      const p = pointer(event, canvas);
      if (state.tool === "cursor") {
        chartRuntime.drag = { type: "pan", x: p.x, offset: state.offset };
        return;
      }
      if (state.tool === "hline") {
        addDrawing({ type: "hline", price: snapPoint(p).price });
        drawChart();
        return;
      }
      if (state.tool === "text") {
        const text = window.prompt("輸入標記文字", "觀察") || "觀察";
        const point = snapPoint(p);
        addDrawing({ type: "text", index: point.index, price: point.price, text });
        drawChart();
        return;
      }
      if (["trend", "ray", "measure"].includes(state.tool)) {
        pendingDraft = { type: state.tool, a: snapPoint(p), b: snapPoint(p) };
        chartRuntime.drag = { type: "draw" };
      }
    };
    canvas.onmouseup = () => {
      if (!chartRuntime) return;
      if (chartRuntime.drag?.type === "draw" && pendingDraft) {
        const a = pendingDraft.a;
        const b = pendingDraft.b;
        if (Math.abs(a.index - b.index) > 0 || Math.abs(a.price - b.price) > 0) addDrawing(pendingDraft);
        pendingDraft = null;
      }
      chartRuntime.drag = null;
      saveState();
      drawChart();
    };
    canvas.onwheel = (event) => {
      if (!chartRuntime) return;
      event.preventDefault();
      if (event.shiftKey) {
        state.offset = clamp(state.offset + Math.sign(event.deltaY) * 12, 0, Math.max(0, chartRuntime.candles.length - 20));
      } else {
        const next = event.deltaY > 0 ? state.zoomBars * 1.22 : state.zoomBars * 0.82;
        state.zoomBars = clamp(next, 18, Math.max(40, chartRuntime.candles.length || 520));
      }
      saveState();
      setupChartCanvas();
    };
  }

  function pointer(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function snapPoint(point) {
    const rt = chartRuntime;
    const index = rt.fromX(point.x);
    const candle = rt.candles[index];
    let price = rt.fromY(point.y);
    if (state.magnet && candle) price = nearestOhlc(candle, price);
    return { index, price };
  }

  function nearestOhlc(candle, price) {
    return [candle.open, candle.high, candle.low, candle.close].reduce((best, value) =>
      Math.abs(value - price) < Math.abs(best - price) ? value : best
    );
  }

  async function loadMarketData(symbol, options = {}) {
    const cached = dataStore.get(symbol);
    if (!options.force && cached && !isStale(cached.updatedAt, 30_000)) return cached;
    const info = symbolInfo(symbol);
    const previous = cached || { symbol, info, candles: [], quote: null };
    dataStore.set(symbol, { ...previous, source: "讀取中", updatedAt: Date.now() });

    try {
      const [chart, mis] = await Promise.allSettled([
        fetchYahooChart(symbol, info),
        fetchMisQuote(symbol, info)
      ]);
      const chartValue = chart.status === "fulfilled" ? chart.value : null;
      const quoteValue = mis.status === "fulfilled" ? mis.value : null;
      if (!chartValue?.candles?.length && !quoteValue?.price) throw new Error("no live data");

      const candles = chartValue?.candles?.length ? chartValue.candles : fallbackCandles(symbol, quoteValue?.price || info.base || 100);
      const last = candles.at(-1);
      const quote = {
        price: Number(quoteValue?.price || chartValue?.price || last?.close),
        previousClose: Number(quoteValue?.previousClose || chartValue?.previousClose || candles.at(-2)?.close || last?.open),
        open: Number(quoteValue?.open || last?.open),
        high: Number(quoteValue?.high || last?.high),
        low: Number(quoteValue?.low || last?.low),
        volume: Number(quoteValue?.volume || last?.volume || chartValue?.volume || 0)
      };
      quote.change = quote.price - quote.previousClose;
      quote.percent = quote.previousClose ? (quote.change / quote.previousClose) * 100 : 0;
      if (quote.price && last) {
        last.close = quote.price;
        last.high = Math.max(last.high, quote.price);
        last.low = Math.min(last.low, quote.price);
      }
      const source = quoteValue?.price ? "TWSE MIS 即時校正 + Yahoo K線" : "Yahoo K線延遲資料";
      const item = { symbol, info, candles, quote, source, updatedAt: Date.now() };
      dataStore.set(symbol, item);
      return item;
    } catch (error) {
      console.warn("market data fallback", symbol, error);
      const base = cached?.quote?.price || symbolInfo(symbol).base || 100;
      const candles = fallbackCandles(symbol, base);
      const last = candles.at(-1);
      const prev = candles.at(-2) || last;
      const item = {
        symbol,
        info,
        candles,
        quote: {
          price: last.close,
          previousClose: prev.close,
          open: last.open,
          high: last.high,
          low: last.low,
          volume: last.volume,
          change: last.close - prev.close,
          percent: ((last.close - prev.close) / prev.close) * 100
        },
        source: "離線示範資料，不是真實行情",
        updatedAt: Date.now()
      };
      dataStore.set(symbol, item);
      return item;
    }
  }

  async function fetchYahooChart(symbol, info) {
    const { interval, range } = yahooRange(state.timeframe);
    const suffixes = info.exchange === "TPEX" ? ["TWO", "TW"] : ["TW", "TWO"];
    let lastError = null;
    for (const suffix of suffixes) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol + "." + suffix)}?range=${range}&interval=${interval}&includePrePost=false&_=${Date.now()}`;
        const json = await fetchJson(url);
        const result = json?.chart?.result?.[0];
        if (!result?.timestamp?.length) throw new Error("empty yahoo chart");
        const quote = result.indicators?.quote?.[0] || {};
        const timestamps = result.timestamp;
        const candles = timestamps.map((stamp, index) => ({
          time: new Date(stamp * 1000).toISOString(),
          open: num(quote.open?.[index]),
          high: num(quote.high?.[index]),
          low: num(quote.low?.[index]),
          close: num(quote.close?.[index]),
          volume: num(quote.volume?.[index])
        })).filter((item) => [item.open, item.high, item.low, item.close].every(Number.isFinite));
        if (!candles.length) throw new Error("no candles");
        return {
          candles,
          price: result.meta?.regularMarketPrice,
          previousClose: result.meta?.chartPreviousClose || result.meta?.previousClose,
          volume: result.meta?.regularMarketVolume
        };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("yahoo unavailable");
  }

  async function fetchMisQuote(symbol, info) {
    const exchange = info.exchange === "TPEX" ? "otc" : "tse";
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exchange}_${symbol}.tw&json=1&delay=0&_=${Date.now()}`;
    const json = await fetchJson(url);
    const row = json?.msgArray?.[0];
    if (!row || row.z === "-" || row.z === undefined) throw new Error("no quote");
    return {
      price: num(row.z),
      previousClose: num(row.y),
      open: num(row.o),
      high: num(row.h),
      low: num(row.l),
      volume: num(row.v),
      name: row.n
    };
  }

  async function refreshUniverse() {
    try {
      const [twse, tpex] = await Promise.allSettled([fetchTwseUniverse(), fetchTpexUniverse()]);
      const merged = new Map(universe.map((item) => [item.symbol, item]));
      [twse, tpex].forEach((result) => {
        if (result.status !== "fulfilled") return;
        result.value.forEach((item) => {
          if (!item.symbol || !/^\d{4,6}$/.test(item.symbol)) return;
          merged.set(item.symbol, { ...merged.get(item.symbol), ...item });
        });
      });
      universe = Array.from(merged.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
      updateTopbar();
    } catch (error) {
      console.warn("universe refresh failed", error);
    }
  }

  async function fetchTwseUniverse() {
    const rows = await fetchJsonUtf8("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL");
    return rows.map((row) => {
      const symbol = pick(row, ["Code", "證券代號", "code"]);
      const name = pick(row, ["Name", "證券名稱", "name"]);
      const close = num(pick(row, ["ClosingPrice", "收盤價", "Close"]));
      return {
        symbol,
        name,
        exchange: "TWSE",
        market: "上市",
        sector: "上市股票",
        base: close || undefined
      };
    }).filter((item) => item.symbol && item.name);
  }

  async function fetchTpexUniverse() {
    const rows = await fetchJsonUtf8("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes");
    return rows.map((row) => {
      const symbol = pickLoose(row, ["代號", "Code", "SecuritiesCompanyCode"]);
      const name = pickLoose(row, ["名稱", "Name", "CompanyName"]);
      const close = num(pickLoose(row, ["收盤", "Close", "LatestPrice"]));
      return {
        symbol,
        name,
        exchange: "TPEX",
        market: "上櫃",
        sector: "上櫃股票",
        base: close || undefined
      };
    }).filter((item) => item.symbol && item.name);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function fetchJsonUtf8(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    return JSON.parse(new TextDecoder("utf-8").decode(buffer));
  }

  function handleClick(event) {
    const loginMode = event.target.closest("[data-login-mode]");
    if (loginMode) {
      renderLogin(loginMode.dataset.loginMode);
      return;
    }

    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      state.page = pageButton.dataset.page;
      $("#drawer").classList.remove("is-open");
      renderApp();
      return;
    }

    const menu = event.target.closest("#menuButton");
    if (menu) {
      $("#drawer").classList.toggle("is-open");
      return;
    }

    const timeframe = event.target.closest("[data-timeframe]");
    if (timeframe) {
      state.timeframe = timeframe.dataset.timeframe;
      state.offset = 0;
      state.zoomBars = timeframe.dataset.timeframe === "D" ? 180 : 260;
      loadMarketData(state.symbol, { force: true }).then(renderApp);
      renderApp();
      return;
    }

    const toolButton = event.target.closest("[data-tool]");
    if (toolButton) {
      const tool = toolButton.dataset.tool;
      if (tool === "magnet") state.magnet = !state.magnet;
      else if (tool === "zoomin") state.zoomBars = clamp(state.zoomBars * 0.75, 18, 1000);
      else if (tool === "zoomout") state.zoomBars = clamp(state.zoomBars * 1.35, 18, 1000);
      else if (tool === "fit") fitChart();
      else if (tool === "clear") clearDrawings();
      else state.tool = tool;
      saveState();
      renderApp();
      return;
    }

    const indicator = event.target.closest("[data-indicator]");
    if (indicator) {
      const id = indicator.dataset.indicator;
      state.indicators[id] = !state.indicators[id];
      saveState();
      renderApp();
      return;
    }

    const remove = event.target.closest("[data-remove-watch]");
    if (remove) {
      state.watchlist = state.watchlist.filter((symbol) => symbol !== remove.dataset.removeWatch);
      saveState();
      renderApp();
      return;
    }

    const add = event.target.closest("[data-add-watch]");
    if (add) {
      addWatch(add.dataset.addWatch);
      renderApp();
      return;
    }

    const symbolButton = event.target.closest("[data-symbol]");
    if (symbolButton) {
      selectSymbol(symbolButton.dataset.symbol);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) handleAction(action.dataset.action);
  }

  async function handleSubmit(event) {
    const form = event.target.closest("form");
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.form;
    if (type === "login") {
      const data = Object.fromEntries(new FormData(form));
      const account = getAccounts()[data.username];
      const passHash = await hashPassword(data.password);
      if (!account || account.passHash !== passHash) {
        renderLogin("login", "帳號或密碼不對，請再試一次。");
        return;
      }
      state.user = { username: account.username, role: account.role };
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
      renderApp();
      loadMarketData(state.symbol, { force: true }).then(renderApp);
    }
    if (type === "register") {
      const data = Object.fromEntries(new FormData(form));
      if (data.password !== data.password2) {
        renderLogin("register", "兩次密碼不一樣。");
        return;
      }
      const accounts = getAccounts();
      if (accounts[data.username]) {
        renderLogin("register", "這個帳號已經存在。");
        return;
      }
      const passHash = await hashPassword(data.password);
      accounts[data.username] = {
        username: data.username,
        role: "member",
        passHash,
        createdAt: new Date().toISOString()
      };
      setAccounts(accounts);
      state.user = { username: data.username, role: "member" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
      renderApp();
    }
    if (type === "script") {
      state.customScript = new FormData(form).get("script");
      state.indicators.custom = true;
      saveState();
      renderApp();
    }
  }

  function handleInput(event) {
    const input = event.target.closest(".symbol-input");
    if (input) {
      state.searchText = input.value;
      const target = $("#" + input.dataset.searchTarget);
      updateSearchResults(input, target);
    }
  }

  function handleChange(event) {
    const setting = event.target.closest("[data-setting]");
    if (!setting) return;
    const key = setting.dataset.setting;
    const value = setting.type === "checkbox" ? setting.checked : setting.value;
    if (key in state.settings) state.settings[key] = value;
    else state[key] = value;
    saveState();
    renderApp();
  }

  function handleAction(action) {
    if (action === "guest") {
      state.user = { username: "guest", role: "guest" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
      renderApp();
      loadMarketData(state.symbol, { force: true }).then(renderApp);
    }
    if (action === "logout") {
      localStorage.removeItem(SESSION_KEY);
      state.user = null;
      saveState();
      renderLogin();
    }
    if (action === "fit-chart") {
      fitChart();
      renderApp();
    }
    if (action === "toggle-right") {
      state.rightPanel = !state.rightPanel;
      saveState();
      renderApp();
    }
    if (action === "reset-script") {
      state.customScript = defaultState.customScript;
      saveState();
      renderApp();
    }
    if (action === "replay-start") startReplay();
    if (action === "replay-play") toggleReplayPlay();
    if (action === "replay-step") stepReplay();
  }

  function updateSearchResults(input, target) {
    if (!input || !target) return;
    const term = input.value.trim().toLowerCase();
    if (!term) {
      target.innerHTML = "";
      return;
    }
    const matches = universe.filter((item) =>
      item.symbol.includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.sector?.toLowerCase().includes(term)
    ).slice(0, 24);
    const exactCode = /^\d{4,6}$/.test(term) && !matches.some((item) => item.symbol === term);
    target.innerHTML = `
      ${exactCode ? resultRow({ symbol: term, name: "自訂代號", market: "台股", exchange: "TWSE" }) : ""}
      ${matches.map(resultRow).join("") || `<div class="empty-state">找不到股票，可以直接輸入代號試試。</div>`}
    `;
  }

  function resultRow(item) {
    const watched = state.watchlist.includes(item.symbol);
    return `
      <div class="search-row">
        <button data-symbol="${item.symbol}" type="button">
          <strong>${item.symbol}</strong>
          <span>${escapeHtml(item.name)} · ${escapeHtml(item.market || item.exchange || "")}</span>
        </button>
        <button class="mini-btn" data-add-watch="${item.symbol}" type="button">${watched ? "已加" : "+"}</button>
      </div>
    `;
  }

  function selectSymbol(symbol) {
    state.symbol = symbol.trim();
    state.page = "chart";
    state.offset = 0;
    state.searchText = "";
    if (!state.watchlist.includes(state.symbol)) state.watchlist.unshift(state.symbol);
    saveState();
    renderApp();
    loadMarketData(state.symbol, { force: true }).then(renderApp);
  }

  function addWatch(symbol) {
    if (!state.watchlist.includes(symbol)) state.watchlist.unshift(symbol);
    saveState();
    loadMarketData(symbol);
  }

  function compactQuoteRow(symbol) {
    const data = dataStore.get(symbol);
    if (!data) loadMarketData(symbol);
    const quote = data?.quote;
    return `
      <button class="quote-row" data-symbol="${symbol}" type="button">
        <span>
          <strong>${symbol}</strong>
          <small>${escapeHtml(symbolInfo(symbol).name)}</small>
        </span>
        <span>${formatPrice(quote?.price)}</span>
        <span class="${changeClass(quote?.change)}">${formatSigned(quote?.change)}</span>
        <span class="${changeClass(quote?.change)}">${formatPercent(quote?.percent)}</span>
      </button>
    `;
  }

  function watchCard(symbol) {
    const data = dataStore.get(symbol);
    if (!data) loadMarketData(symbol);
    const info = symbolInfo(symbol);
    const quote = data?.quote;
    const ai = buildAI(data);
    return `
      <article class="watch-card" data-symbol="${symbol}">
        <button class="remove-btn" data-remove-watch="${symbol}" type="button">×</button>
        <button class="watch-card-main" data-symbol="${symbol}" type="button">
          <span>${symbol} · ${escapeHtml(info.name)}</span>
          <strong>${formatPrice(quote?.price)}</strong>
          <small class="${changeClass(quote?.change)}">${formatSigned(quote?.change)} ${formatPercent(quote?.percent)}</small>
          <em>${ai.title}</em>
        </button>
      </article>
    `;
  }

  function aiPanel(data) {
    const ai = buildAI(data);
    return `
      <div class="ai-panel">
        <div class="ai-score">
          <div class="score-ring" style="--score:${ai.score}%">${ai.score}%</div>
          <div>
            <h3>${ai.title}</h3>
            <p>${ai.summary}</p>
          </div>
        </div>
        <div class="ai-grid">
          <span>支撐 <strong>${formatPrice(ai.support)}</strong></span>
          <span>壓力 <strong>${formatPrice(ai.resistance)}</strong></span>
          <span>波動 <strong>${ai.volatility.toFixed(2)}%</strong></span>
        </div>
        <div class="ai-notes">
          ${ai.notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function buildAI(data) {
    const candles = data?.candles || [];
    if (candles.length < 30) {
      return {
        score: 50,
        title: "等待資料",
        summary: "正在抓即時報價與K線。資料不足時不做方向判斷。",
        support: data?.quote?.low || data?.quote?.price || 0,
        resistance: data?.quote?.high || data?.quote?.price || 0,
        volatility: 0,
        notes: ["資料不足", "先不要解讀成買賣建議"]
      };
    }
    const closes = candles.map((c) => c.close);
    const last = closes.at(-1);
    const ma20 = sma(closes, 20).at(-1);
    const ma60 = sma(closes, Math.min(60, closes.length)).at(-1);
    const rsiValue = rsi(closes, 14).at(-1) || 50;
    const recent = candles.slice(-40);
    const support = Math.min(...recent.map((c) => c.low));
    const resistance = Math.max(...recent.map((c) => c.high));
    const volatility = ((resistance - support) / last) * 100;
    const slope = ma20 && ma60 ? ((ma20 - ma60) / ma60) * 100 : 0;
    let score = 50 + slope * 7 + (rsiValue - 50) * 0.45;
    if (last > ma20) score += 8;
    if (last < ma20) score -= 8;
    score = clamp(Math.round(score), 8, 92);
    let title = "盤整震盪";
    if (score >= 64) title = "上升趨勢";
    if (score <= 38) title = "下降趨勢";
    if (volatility < 2.2) title = "窄幅盤整";
    const notes = [];
    notes.push(last > ma20 ? "價格在短均線上方" : "價格在短均線下方");
    notes.push(rsiValue > 70 ? "RSI 偏熱" : rsiValue < 30 ? "RSI 偏冷" : "RSI 中性");
    notes.push(`離壓力約 ${(((resistance - last) / last) * 100).toFixed(2)}%`);
    notes.push(`離支撐約 ${(((last - support) / last) * 100).toFixed(2)}%`);
    return {
      score,
      title,
      summary: `${symbolLabel(state.symbol)} 目前 ${title}，AI 分數 ${score}。這是機率判讀，不是保證會漲跌。`,
      support,
      resistance,
      volatility,
      notes
    };
  }

  function ohlcLine(data) {
    const quote = data?.quote;
    return `
      <div class="ohlc-line">
        <span>開 ${formatPrice(quote?.open)}</span>
        <span>高 ${formatPrice(quote?.high)}</span>
        <span>低 ${formatPrice(quote?.low)}</span>
        <span>收 ${formatPrice(quote?.price)}</span>
        <span class="${changeClass(quote?.change)}">${formatSigned(quote?.change)} ${formatPercent(quote?.percent)}</span>
      </div>
    `;
  }

  function indicatorToggle(id, name, desc) {
    return `
      <button class="indicator-row ${state.indicators[id] ? "is-on" : ""}" data-indicator="${id}" type="button">
        <span>
          <strong>${name}</strong>
          <small>${desc}</small>
        </span>
        <em></em>
      </button>
    `;
  }

  function settingSegment(key, label, options, current) {
    return `
      <div class="setting-row">
        <span>${label}</span>
        <div class="segmented">
          ${options.map(([value, text]) => `
            <label class="${current === value ? "is-active" : ""}">
              <input type="radio" name="${key}" data-setting="${key}" value="${value}" ${current === value ? "checked" : ""} />
              ${text}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  function settingSwitch(key, label, checked) {
    const settingKey = key in state.settings ? key : key;
    return `
      <label class="setting-row switch-row">
        <span>${label}</span>
        <input type="checkbox" data-setting="${settingKey}" ${checked ? "checked" : ""} />
      </label>
    `;
  }

  function updateTopbar() {
    $("#selectedTicker").textContent = symbolLabel(state.symbol);
    const data = dataStore.get(state.symbol);
    $("#dataMode").textContent = data?.source || `${universe.length} 檔資料`;
  }

  function updateClock() {
    const now = new Date();
    const text = now.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Taipei"
    });
    const clock = $("#sessionClock");
    if (clock) clock.textContent = `${text} TPE`;
  }

  function scheduleRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (!state.settings.autoRefresh || !state.user) return;
      loadMarketData(state.symbol, { force: true }).then(() => {
        if (state.page === "chart") renderApp();
        else updateTopbar();
      });
    }, 30_000);
  }

  function startReplay() {
    const input = $("#replayDate");
    const date = input?.value || state.replay.startDate;
    const candles = dataStore.get(state.symbol)?.candles || [];
    let index = candles.findIndex((candle) => candle.time.slice(0, 10) >= date);
    if (index < 0) index = Math.max(0, candles.length - Math.min(120, candles.length));
    state.replay = { enabled: true, playing: false, startDate: date, index: Math.max(5, index) };
    saveState();
    renderApp();
  }

  function toggleReplayPlay() {
    if (!state.replay.enabled) startReplay();
    state.replay.playing = !state.replay.playing;
    clearInterval(replayTimer);
    if (state.replay.playing) replayTimer = setInterval(stepReplay, 700);
    saveState();
    renderApp();
  }

  function stepReplay() {
    const candles = dataStore.get(state.symbol)?.candles || [];
    if (!state.replay.enabled) startReplay();
    state.replay.index = clamp((state.replay.index || 0) + 1, 1, candles.length);
    if (state.replay.index >= candles.length) {
      state.replay.playing = false;
      clearInterval(replayTimer);
    }
    saveState();
    if (state.page === "chart") setupChartCanvas();
  }

  function replayCandles(candles) {
    if (!state.replay.enabled || !state.replay.index) return candles;
    return candles.slice(0, clamp(state.replay.index, 1, candles.length));
  }

  function fitChart() {
    const count = dataStore.get(state.symbol)?.candles?.length || 520;
    state.zoomBars = count;
    state.offset = 0;
    saveState();
  }

  function currentDrawings() {
    const key = `${state.symbol}-${state.timeframe}`;
    state.drawings[key] ||= [];
    return state.drawings[key];
  }

  function addDrawing(item) {
    currentDrawings().push({ ...item, id: cryptoRandom(), createdAt: Date.now() });
    saveState();
  }

  function clearDrawings() {
    state.drawings[`${state.symbol}-${state.timeframe}`] = [];
    pendingDraft = null;
    saveState();
  }

  function runCustomScript(candles) {
    const close = candles.map((c) => c.close);
    const open = candles.map((c) => c.open);
    const high = candles.map((c) => c.high);
    const low = candles.map((c) => c.low);
    const volume = candles.map((c) => c.volume);
    const fn = new Function("close", "open", "high", "low", "volume", state.customScript);
    const result = fn(close, open, high, low, volume);
    return Array.isArray(result) ? result.map((value) => Number.isFinite(Number(value)) ? Number(value) : null) : [];
  }

  function sma(values, period) {
    return values.map((_, index) => {
      if (index + 1 < period) return null;
      const slice = values.slice(index - period + 1, index + 1);
      return slice.reduce((sum, value) => sum + value, 0) / period;
    });
  }

  function ema(values, period) {
    const k = 2 / (period + 1);
    const out = [];
    values.forEach((value, index) => {
      if (index === 0) out.push(value);
      else out.push(value * k + out[index - 1] * (1 - k));
    });
    return out;
  }

  function rsi(values, period) {
    const out = Array(values.length).fill(null);
    for (let i = period; i < values.length; i += 1) {
      let gains = 0;
      let losses = 0;
      for (let j = i - period + 1; j <= i; j += 1) {
        const diff = values[j] - values[j - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }
      const rs = gains / (losses || 1);
      out[i] = 100 - 100 / (1 + rs);
    }
    return out;
  }

  function macdSeries(values) {
    const fast = ema(values, 12);
    const slow = ema(values, 26);
    const macd = values.map((_, index) => fast[index] - slow[index]);
    const signal = ema(macd, 9);
    const hist = macd.map((value, index) => value - signal[index]);
    return { macd, signal, hist };
  }

  function fallbackCandles(symbol, base) {
    const now = Date.now();
    const candles = [];
    let price = Number(base) || 100;
    let seed = Number(symbol.replace(/\D/g, "")) || 2330;
    const interval = state.timeframe === "D" ? 86_400_000 : state.timeframe === "60m" ? 3_600_000 : state.timeframe === "5m" ? 300_000 : 900_000;
    const count = state.timeframe === "D" ? 260 : 620;
    for (let i = count - 1; i >= 0; i -= 1) {
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280 - 0.5;
      const open = price;
      price = Math.max(1, price * (1 + rnd * 0.012));
      const close = price;
      const high = Math.max(open, close) * (1 + Math.abs(rnd) * 0.012);
      const low = Math.min(open, close) * (1 - Math.abs(rnd) * 0.012);
      candles.push({
        time: new Date(now - i * interval).toISOString(),
        open: roundPrice(open),
        high: roundPrice(high),
        low: roundPrice(low),
        close: roundPrice(close),
        volume: Math.round(800 + Math.abs(rnd) * 100000)
      });
    }
    return candles;
  }

  function yahooRange(timeframe) {
    if (timeframe === "5m") return { interval: "5m", range: "1mo" };
    if (timeframe === "15m") return { interval: "15m", range: "1mo" };
    if (timeframe === "60m") return { interval: "60m", range: "3mo" };
    return { interval: "1d", range: "2y" };
  }

  function symbolInfo(symbol) {
    return universe.find((item) => item.symbol === symbol) || {
      symbol,
      name: "台股",
      exchange: "TWSE",
      market: "台股",
      sector: "自訂"
    };
  }

  function symbolLabel(symbol) {
    const info = symbolInfo(symbol);
    return `${symbol} ${info.name}`;
  }

  function timeframeLabel(tf) {
    return tf === "D" ? "日" : tf.replace("m", "分");
  }

  function selectedToolTitle() {
    return tools.find(([id]) => id === state.tool)?.[1] || "畫線";
  }

  function toolActive(id) {
    if (id === "magnet") return state.magnet ? "is-active" : "";
    return state.tool === id ? "is-active" : "";
  }

  function candleColor(up, alpha = 1) {
    const twUp = state.colorMode === "tw";
    const color = up ? (twUp ? css("--up") : css("--down")) : (twUp ? css("--down") : css("--up"));
    return alpha === 1 ? color : hexToRgba(color, alpha);
  }

  function changeClass(value) {
    if (!Number.isFinite(Number(value))) return "";
    const isUp = Number(value) >= 0;
    return isUp ? "up-text" : "down-text";
  }

  function formatPrice(value) {
    if (!Number.isFinite(Number(value))) return "讀取中";
    return fmt.format(roundPrice(Number(value)));
  }

  function formatSigned(value) {
    if (!Number.isFinite(Number(value))) return "--";
    const number = Number(value);
    return `${number >= 0 ? "+" : ""}${fmt.format(roundPrice(number))}`;
  }

  function formatPercent(value) {
    if (!Number.isFinite(Number(value))) return "--";
    return `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`;
  }

  function formatAxisTime(value) {
    const date = new Date(value);
    if (state.timeframe === "D") return `${date.getMonth() + 1}/${date.getDate()}`;
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function timeAgo(stamp) {
    const sec = Math.max(1, Math.floor((Date.now() - stamp) / 1000));
    if (sec < 60) return `${sec} 秒前`;
    const min = Math.floor(sec / 60);
    return `${min} 分前`;
  }

  function roundPrice(value) {
    if (!Number.isFinite(value)) return value;
    if (Math.abs(value) >= 1000) return Math.round(value);
    if (Math.abs(value) >= 100) return Math.round(value * 2) / 2;
    if (Math.abs(value) >= 10) return Math.round(value * 20) / 20;
    return Math.round(value * 100) / 100;
  }

  function num(value) {
    if (value === null || value === undefined || value === "-" || value === "") return NaN;
    return Number(String(value).replace(/,/g, ""));
  }

  function pick(row, keys) {
    for (const key of keys) if (row[key] !== undefined) return row[key];
    return undefined;
  }

  function pickLoose(row, terms) {
    const entries = Object.entries(row);
    for (const term of terms) {
      const match = entries.find(([key]) => key.includes(term));
      if (match) return match[1];
    }
    return undefined;
  }

  function percentile(values, p) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.floor((sorted.length - 1) * p)];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function isStale(stamp, ttl) {
    return !stamp || Date.now() - stamp > ttl;
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function hexToRgba(hex, alpha) {
    const normalized = hex.replace("#", "");
    const value = parseInt(normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));
  }

  function debounce(fn, wait) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function cryptoRandom() {
    return (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return merge(defaultState, stored);
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function merge(base, extra) {
    const output = structuredClone(base);
    Object.entries(extra || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value) && output[key] && typeof output[key] === "object" && !Array.isArray(output[key])) {
        output[key] = merge(output[key], value);
      } else {
        output[key] = value;
      }
    });
    return output;
  }

  function ensureAccounts() {
    const accounts = getAccounts();
    if (!accounts.admin) {
      accounts.admin = {
        username: "admin",
        role: "admin",
        passHash: ADMIN_HASH,
        createdAt: new Date().toISOString()
      };
      setAccounts(accounts);
    }
  }

  function getAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function setAccounts(accounts) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  async function hashPassword(password) {
    if (globalThis.crypto?.subtle) {
      const data = new TextEncoder().encode(password);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    let hash = 0;
    for (let i = 0; i < password.length; i += 1) hash = ((hash << 5) - hash + password.charCodeAt(i)) | 0;
    return String(hash);
  }
})();
