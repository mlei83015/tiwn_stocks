(() => {
  "use strict";

  const STORAGE_KEY = "tw-k-radar-state-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const stocks = [
    { symbol: "2330", name: "台積電", sector: "半導體", base: 1035, bias: 0.00062, volatility: 0.018, volume: 62000 },
    { symbol: "2317", name: "鴻海", sector: "電子代工", base: 214, bias: 0.00032, volatility: 0.021, volume: 52000 },
    { symbol: "2454", name: "聯發科", sector: "IC 設計", base: 1385, bias: 0.00024, volatility: 0.024, volume: 18000 },
    { symbol: "2308", name: "台達電", sector: "電源", base: 505, bias: 0.00046, volatility: 0.017, volume: 22000 },
    { symbol: "2881", name: "富邦金", sector: "金融", base: 92, bias: 0.00018, volatility: 0.012, volume: 42000 },
    { symbol: "2412", name: "中華電", sector: "電信", base: 128, bias: 0.00008, volatility: 0.007, volume: 15000 },
    { symbol: "2603", name: "長榮", sector: "航運", base: 196, bias: -0.00008, volatility: 0.027, volume: 64000 },
    { symbol: "3231", name: "緯創", sector: "AI 伺服器", base: 132, bias: 0.00044, volatility: 0.026, volume: 76000 },
    { symbol: "3711", name: "日月光投控", sector: "封測", base: 168, bias: 0.00027, volatility: 0.019, volume: 25000 },
    { symbol: "3008", name: "大立光", sector: "光學", base: 2850, bias: -0.00005, volatility: 0.022, volume: 3800 }
  ];

  const newsItems = [
    { time: "13:12", tag: "半導體", title: "AI 晶片供應鏈買盤延續，權值股撐住盤面", body: "資金仍集中在先進製程、封測與散熱族群，短線觀察量能是否同步放大。" },
    { time: "12:40", tag: "台股", title: "加權指數高檔震盪，盤中類股輪動加快", body: "電子、金融與傳產輪動明顯，追價前留意前高壓力與均線支撐。" },
    { time: "11:25", tag: "航運", title: "貨櫃航運股震盪轉強，短線價差交易熱度升溫", body: "運價題材與籌碼變化交互影響，波動放大時需控管部位。" },
    { time: "10:18", tag: "金融", title: "金融股量縮整理，殖利率題材仍受長線資金關注", body: "法人偏向等待除權息與利率訊號，短線維持區間看待。" },
    { time: "09:32", tag: "AI", title: "伺服器概念股開盤轉強，市場追蹤訂單能見度", body: "多檔個股站回短均線，若回測不破支撐，趨勢延續機率提高。" }
  ];

  const indicatorDefs = [
    { id: "volume", name: "成交量", desc: "量能柱" },
    { id: "sma", name: "SMA 20", desc: "簡單均線" },
    { id: "ema", name: "EMA 20", desc: "指數均線" },
    { id: "bb", name: "布林通道", desc: "波動區間" },
    { id: "rsi", name: "RSI 14", desc: "強弱指標" },
    { id: "macd", name: "MACD", desc: "動能轉折" },
    { id: "smc", name: "SMC 區域", desc: "供給需求" },
    { id: "sri", name: "SRI 反轉", desc: "反轉機率" },
    { id: "custom", name: "自訂指標", desc: "程式線" }
  ];

  const defaultCustomCode = `const fast = helpers.ema(candles, 8);
const slow = helpers.ema(candles, 21);
return candles.map((c, i) => ({
  time: c.time,
  value: fast[i] && slow[i] ? (fast[i] + slow[i]) / 2 : null
}));`;

  const defaultState = {
    page: "home",
    selectedSymbol: "2330",
    timeframe: "D",
    visibleCount: 88,
    offset: 0,
    tool: "cursor",
    watchlist: ["2330", "2317", "2454", "2308"],
    indicators: {
      volume: true,
      sma: true,
      ema: false,
      bb: true,
      rsi: true,
      macd: false,
      smc: true,
      sri: true,
      custom: false
    },
    replay: {
      active: false,
      index: null,
      date: "2026-06-20",
      speed: 650
    },
    settings: {
      theme: "dark",
      colorMode: "tw",
      upColor: "#e45454",
      downColor: "#48b878",
      accent: "#f0b84b",
      realtime: true,
      aiSensitivity: 56
    },
    drawings: {},
    customCode: defaultCustomCode
  };

  let state = loadState();
  let candleCache = new Map();
  let chartObserver = null;
  let chartCanvas = null;
  let chartMeta = null;
  let draftLine = null;
  let dragState = null;
  let replayTimer = null;
  let lastToast = "即時模擬連線中";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    $$(".bottom-nav .nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        state.page = button.dataset.page;
        if (state.page !== "chart") stopReplay(false);
        saveState();
        render();
      });
    });

    window.addEventListener("resize", () => drawChart());
    setInterval(updateClock, 1000);
    setInterval(simulateRealtimeTick, 2600);

    applyTheme();
    render();
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return mergeDeep(defaultState, saved);
    } catch (error) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function mergeDeep(base, saved) {
    const output = Array.isArray(base) ? [...base] : { ...base };
    for (const [key, value] of Object.entries(saved || {})) {
      if (Array.isArray(value)) {
        output[key] = [...value];
      } else if (value && typeof value === "object" && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
        output[key] = mergeDeep(base[key], value);
      } else {
        output[key] = value;
      }
    }
    if (!output.customCode) output.customCode = defaultCustomCode;
    return output;
  }

  function saveState() {
    const snapshot = JSON.parse(JSON.stringify(state));
    snapshot.replay.active = false;
    snapshot.replay.index = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  function applyTheme() {
    document.body.dataset.theme = state.settings.theme;
    document.documentElement.style.setProperty("--accent", state.settings.accent);
    const colors = candleColors();
    document.documentElement.style.setProperty("--up", colors.up);
    document.documentElement.style.setProperty("--down", colors.down);
    const metaTheme = document.querySelector("meta[name='theme-color']");
    if (metaTheme) metaTheme.content = state.settings.theme === "light" ? "#f5f3ee" : "#101217";
  }

  function render() {
    cleanupChart();
    applyTheme();
    updateClock();
    updateHeader();
    $$(".bottom-nav .nav-item").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.page === state.page);
    });

    const view = $("#view");
    if (state.page === "home") renderHome(view);
    if (state.page === "watchlist") renderWatchlist(view);
    if (state.page === "chart") renderChartPage(view);
    if (state.page === "indicators") renderIndicatorsPage(view);
    if (state.page === "settings") renderSettingsPage(view);
  }

  function cleanupChart() {
    if (chartObserver) chartObserver.disconnect();
    chartObserver = null;
    chartCanvas = null;
    chartMeta = null;
    draftLine = null;
  }

  function updateClock() {
    const clock = $("#sessionClock");
    if (!clock) return;
    const now = new Date();
    clock.textContent = `${now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })} TPE`;
  }

  function updateHeader() {
    const ticker = $("#selectedTicker");
    const stock = stockBySymbol(state.selectedSymbol);
    if (ticker && stock) ticker.textContent = `${stock.symbol} ${stock.name}`;
  }

  function renderHome(view) {
    const topSymbols = ["2330", "2317", "2454", "3231"];
    const market = buildMarketSummary();
    view.innerHTML = `
      <div class="page-grid">
        <section class="stack">
          <article class="hero-panel">
            <div class="hero-content">
              <p class="kicker">TAIWAN MARKET WORKSPACE</p>
              <h1>台股 K 線雷達</h1>
              <p class="hero-copy">把台股自選、K 線、技術指標、SMC 區域、AI 趨勢判讀和行情回放集中在同一個畫面。</p>
              <div class="hero-stats">
                ${metricTile("加權指數", market.index, market.indexDelta, market.indexDelta >= 0)}
                ${metricTile("AI 偏多股", `${market.bullishCount} 檔`, "自選池", true)}
                ${metricTile("盤整警示", `${market.rangeCount} 檔`, "等待突破", false)}
              </div>
            </div>
          </article>

          <section class="panel">
            <div class="section-head">
              <div>
                <h2>台股新聞</h2>
                <div class="microcopy">示範新聞流，之後可串接真實新聞 API</div>
              </div>
              <span class="status-pill good">即時模擬</span>
            </div>
            <div class="news-strip">
              ${newsItems.slice(0, 3).map(newsCard).join("")}
            </div>
          </section>
        </section>

        <aside class="stack">
          <section class="panel">
            <div class="section-head">
              <div>
                <h2>AI 趨勢掃描</h2>
                <div class="microcopy">規則型趨勢判讀，非投資建議</div>
              </div>
            </div>
            <div class="stock-grid">
              ${topSymbols.map(stockCard).join("")}
            </div>
          </section>
          <section class="panel">
            <div class="section-head">
              <div>
                <h2>熱門題材</h2>
                <div class="microcopy">半導體、AI 伺服器、金融、航運</div>
              </div>
            </div>
            <div class="tag-row">
              <span class="tag">先進製程</span>
              <span class="tag">封測</span>
              <span class="tag">AI 伺服器</span>
              <span class="tag">高股息</span>
              <span class="tag">航運價差</span>
              <span class="tag">電源散熱</span>
            </div>
          </section>
        </aside>
      </div>
    `;
    bindOpenSymbol(view);
  }

  function renderWatchlist(view) {
    const options = stocks.map((stock) => `<option value="${stock.symbol}">${stock.symbol} ${stock.name}</option>`).join("");
    const cards = state.watchlist.map(watchCard).join("") || `<div class="empty-state">目前沒有自選股</div>`;
    view.innerHTML = `
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>自選股</h2>
            <div class="microcopy">放你有買、想追蹤或正在研究的台股</div>
          </div>
          <span class="status-pill">${state.watchlist.length} 檔</span>
        </div>
        <div class="watch-controls">
          <select id="addSymbol" class="select" aria-label="加入股票">
            ${options}
          </select>
          <button id="addWatch" class="primary-btn" type="button">加入</button>
        </div>
        <div class="watch-grid">${cards}</div>
      </section>
    `;

    $("#addWatch")?.addEventListener("click", () => {
      const symbol = $("#addSymbol").value;
      if (!state.watchlist.includes(symbol)) state.watchlist.push(symbol);
      saveState();
      render();
    });

    $$('[data-remove-symbol]', view).forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        state.watchlist = state.watchlist.filter((symbol) => symbol !== button.dataset.removeSymbol);
        saveState();
        render();
      });
    });
    bindOpenSymbol(view);
  }

  function renderChartPage(view) {
    const selected = stockBySymbol(state.selectedSymbol);
    const ai = analyzeTrend(getCandles(state.selectedSymbol, state.timeframe));
    const scoreStyle = `--score:${ai.confidence * 3.6}deg`;
    view.innerHTML = `
      <section class="chart-page">
        <div class="toolbar">
          <div class="toolbar-left">
            <select id="stockSelect" class="select" aria-label="股票">
              ${stocks.map((stock) => `<option value="${stock.symbol}" ${stock.symbol === state.selectedSymbol ? "selected" : ""}>${stock.symbol} ${stock.name}</option>`).join("")}
            </select>
            <div class="segmented" aria-label="時間週期">
              ${["5", "15", "60", "D"].map((tf) => `<button type="button" data-timeframe="${tf}" class="${state.timeframe === tf ? "is-active" : ""}">${tf === "D" ? "日" : tf + "分"}</button>`).join("")}
            </div>
          </div>
          <div class="toolbar-right">
            <button id="lineTool" class="${state.tool === "line" ? "primary-btn" : "ghost-btn"}" type="button" title="畫趨勢線">線</button>
            <button id="clearLines" class="ghost-btn" type="button" title="清除畫線">清線</button>
            <button id="openIndicatorLab" class="ghost-btn" type="button">指標</button>
          </div>
        </div>

        <div class="chart-workspace">
          <div class="chart-frame">
            <canvas id="chartCanvas"></canvas>
            <div id="chartToast" class="chart-toast">${escapeHtml(lastToast)}</div>
          </div>

          <aside class="side-panel">
            <section class="ai-card">
              <div class="ai-score">
                <div class="score-ring" style="${scoreStyle}"><span>${ai.confidence}%</span></div>
                <div>
                  <h3>${ai.label}</h3>
                  <div class="microcopy">${selected.symbol} ${selected.name} · ${ai.summary}</div>
                </div>
              </div>
              <div class="metric-row" style="margin-top:12px">
                <span class="metric-pill ${ai.tone}">支撐 ${formatPrice(ai.support)}</span>
                <span class="metric-pill ${ai.tone}">壓力 ${formatPrice(ai.resistance)}</span>
                <span class="metric-pill">波動 ${ai.volatility}%</span>
              </div>
            </section>

            <section class="panel">
              <div class="section-head">
                <div>
                  <h2>指標</h2>
                  <div class="microcopy">技術指標與 SMC/SRI</div>
                </div>
              </div>
              <div class="indicator-list">
                ${indicatorDefs.map(indicatorToggle).join("")}
              </div>
            </section>

            <section class="panel replay-box">
              <div class="section-head">
                <div>
                  <h2>行情回放</h2>
                  <div class="microcopy" id="replayStatus">${replayStatusText()}</div>
                </div>
              </div>
              <input id="replayDate" class="text-input" type="date" value="${state.replay.date}" />
              <input id="replaySpeed" class="range-input" type="range" min="180" max="1500" step="30" value="${state.replay.speed}" />
              <div class="replay-row">
                <button id="replayToggle" class="primary-btn" type="button">${state.replay.active ? "暫停" : "播放"}</button>
                <button id="stepReplay" class="ghost-btn" type="button">下一根</button>
                <button id="resetReplay" class="ghost-btn" type="button">重置</button>
              </div>
            </section>
          </aside>
        </div>
      </section>
    `;

    bindChartControls(view);
    mountChart();
  }

  function renderIndicatorsPage(view) {
    view.innerHTML = `
      <div class="editor-layout">
        <section class="editor-card">
          <div class="section-head">
            <div>
              <h2>自訂指標</h2>
              <div class="microcopy">回傳 time/value 陣列後會畫在 K 線上</div>
            </div>
            <span id="codeStatus" class="status-pill">待執行</span>
          </div>
          <textarea id="customCode" class="code-editor" spellcheck="false">${escapeHtml(state.customCode)}</textarea>
          <div class="action-row" style="margin-top:12px">
            <button id="runCustom" class="primary-btn" type="button">執行</button>
            <button id="saveCustom" class="ghost-btn" type="button">儲存</button>
            <button id="resetCustom" class="ghost-btn" type="button">範例</button>
          </div>
        </section>

        <aside class="stack">
          <section class="panel">
            <div class="section-head">
              <div>
                <h2>內建指標</h2>
                <div class="microcopy">切換後會同步到 K 線頁</div>
              </div>
            </div>
            <div class="indicator-catalog">
              ${indicatorDefs.map(indicatorToggle).join("")}
            </div>
          </section>
          <section class="panel">
            <h2>可用資料</h2>
            <div class="tag-row">
              <span class="tag">open</span>
              <span class="tag">high</span>
              <span class="tag">low</span>
              <span class="tag">close</span>
              <span class="tag">volume</span>
              <span class="tag">time</span>
              <span class="tag">helpers.sma</span>
              <span class="tag">helpers.ema</span>
              <span class="tag">helpers.rsi</span>
            </div>
          </section>
        </aside>
      </div>
    `;
    bindIndicatorControls(view);
  }

  function renderSettingsPage(view) {
    view.innerHTML = `
      <section class="setting-grid">
        <article class="setting-card">
          <div>
            <h2>外觀</h2>
            <div class="setting-caption">黑白模式與主色</div>
          </div>
          <div class="segmented" aria-label="主題">
            <button type="button" data-theme-option="dark" class="${state.settings.theme === "dark" ? "is-active" : ""}">黑</button>
            <button type="button" data-theme-option="light" class="${state.settings.theme === "light" ? "is-active" : ""}">白</button>
          </div>
          <div class="color-grid">
            ${colorField("accentColor", "主色", state.settings.accent)}
          </div>
        </article>

        <article class="setting-card">
          <div>
            <h2>K 線顏色</h2>
            <div class="setting-caption">台股預設紅漲綠跌</div>
          </div>
          <div class="segmented" aria-label="漲跌配色">
            <button type="button" data-color-mode="tw" class="${state.settings.colorMode === "tw" ? "is-active" : ""}">紅漲</button>
            <button type="button" data-color-mode="greenUp" class="${state.settings.colorMode === "greenUp" ? "is-active" : ""}">綠漲</button>
            <button type="button" data-color-mode="custom" class="${state.settings.colorMode === "custom" ? "is-active" : ""}">自訂</button>
          </div>
          <div class="color-grid">
            ${colorField("upColor", "上漲", state.settings.upColor)}
            ${colorField("downColor", "下跌", state.settings.downColor)}
          </div>
        </article>

        <article class="setting-card">
          <div>
            <h2>AI 判讀</h2>
            <div class="setting-caption">敏感度越高，越容易標示趨勢變化</div>
          </div>
          <input id="aiSensitivity" class="range-input" type="range" min="20" max="90" value="${state.settings.aiSensitivity}" />
          <div class="metric-row">
            <span class="metric-pill">敏感度 ${state.settings.aiSensitivity}</span>
            <span class="metric-pill">規則模型</span>
          </div>
        </article>

        <article class="setting-card">
          <div>
            <h2>資料</h2>
            <div class="setting-caption">目前為範例資料加即時模擬</div>
          </div>
          <label class="indicator-row">
            <span>
              <strong>即時模擬</strong>
              <div class="card-subtitle">自動更新最後一根 K 棒</div>
            </span>
            <span class="switch"><input id="realtimeToggle" type="checkbox" ${state.settings.realtime ? "checked" : ""}><span></span></span>
          </label>
          <button id="resetApp" class="danger-btn" type="button">重置 App</button>
        </article>
      </section>
    `;
    bindSettings(view);
  }

  function metricTile(label, value, delta, positive) {
    return `<div class="stat-tile"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-delta ${positive ? "positive" : "negative"}">${delta}</div></div>`;
  }

  function newsCard(item) {
    return `<article class="news-card"><div class="news-meta">${item.time} · ${item.tag}</div><h3>${item.title}</h3><p class="microcopy">${item.body}</p></article>`;
  }

  function stockCard(symbol) {
    const stock = stockBySymbol(symbol);
    const data = getCandles(symbol, "D");
    const last = data[data.length - 1];
    const prev = data[data.length - 2] || last;
    const change = ((last.close - prev.close) / prev.close) * 100;
    const ai = analyzeTrend(data);
    return `
      <article class="stock-card" data-open-symbol="${symbol}">
        <div class="card-head">
          <div class="symbol-block"><div class="symbol">${stock.symbol}</div><div class="name">${stock.name}</div></div>
          <span class="status-pill ${ai.tone}">${ai.short}</span>
        </div>
        <div class="price-row"><span class="last-price">${formatPrice(last.close)}</span><span class="${change >= 0 ? "change-up" : "change-down"}">${formatPercent(change)}</span></div>
        ${sparkline(data)}
      </article>
    `;
  }

  function watchCard(symbol) {
    const stock = stockBySymbol(symbol);
    const data = getCandles(symbol, "D");
    const last = data[data.length - 1];
    const prev = data[data.length - 2] || last;
    const change = ((last.close - prev.close) / prev.close) * 100;
    const ai = analyzeTrend(data);
    return `
      <article class="watch-card" data-open-symbol="${symbol}">
        <div class="card-head">
          <div class="symbol-block"><div class="symbol">${stock.symbol}</div><div class="name">${stock.name} · ${stock.sector}</div></div>
          <button class="icon-btn danger-btn" data-remove-symbol="${symbol}" type="button" title="移除">×</button>
        </div>
        <div class="price-row"><span class="last-price">${formatPrice(last.close)}</span><span class="${change >= 0 ? "change-up" : "change-down"}">${formatPercent(change)}</span></div>
        <div class="metric-row">
          <span class="metric-pill ${ai.tone}">${ai.short}</span>
          <span class="metric-pill">支撐 ${formatPrice(ai.support)}</span>
          <span class="metric-pill">壓力 ${formatPrice(ai.resistance)}</span>
        </div>
        ${sparkline(data)}
      </article>
    `;
  }

  function indicatorToggle(def) {
    return `
      <label class="indicator-row">
        <span><strong>${def.name}</strong><div class="card-subtitle">${def.desc}</div></span>
        <span class="switch"><input data-indicator="${def.id}" type="checkbox" ${state.indicators[def.id] ? "checked" : ""}><span></span></span>
      </label>
    `;
  }

  function colorField(id, label, value) {
    return `<label class="color-field"><span class="input-label">${label}</span><input id="${id}" class="color-input" type="color" value="${value}"></label>`;
  }

  function bindOpenSymbol(root) {
    $$('[data-open-symbol]', root).forEach((item) => {
      item.addEventListener("click", () => {
        state.selectedSymbol = item.dataset.openSymbol;
        state.page = "chart";
        state.offset = 0;
        stopReplay(false);
        saveState();
        render();
      });
    });
  }

  function bindChartControls(root) {
    $("#stockSelect", root).addEventListener("change", (event) => {
      state.selectedSymbol = event.target.value;
      state.offset = 0;
      stopReplay(false);
      saveState();
      render();
    });

    $$('[data-timeframe]', root).forEach((button) => {
      button.addEventListener("click", () => {
        state.timeframe = button.dataset.timeframe;
        state.offset = 0;
        stopReplay(false);
        saveState();
        render();
      });
    });

    $("#lineTool", root).addEventListener("click", () => {
      state.tool = state.tool === "line" ? "cursor" : "line";
      lastToast = state.tool === "line" ? "畫線模式" : "游標模式";
      render();
    });

    $("#clearLines", root).addEventListener("click", () => {
      state.drawings[lineKey()] = [];
      saveState();
      drawChart();
    });

    $("#openIndicatorLab", root).addEventListener("click", () => {
      state.page = "indicators";
      saveState();
      render();
    });

    $$('[data-indicator]', root).forEach((input) => {
      input.addEventListener("change", () => {
        state.indicators[input.dataset.indicator] = input.checked;
        saveState();
        drawChart();
      });
    });

    $("#replayDate", root).addEventListener("change", (event) => {
      state.replay.date = event.target.value;
      saveState();
    });

    $("#replaySpeed", root).addEventListener("input", (event) => {
      state.replay.speed = Number(event.target.value);
      if (state.replay.active) startReplay(true);
    });

    $("#replayToggle", root).addEventListener("click", () => {
      if (state.replay.active) {
        stopReplay(true);
      } else {
        startReplay(false);
      }
    });

    $("#stepReplay", root).addEventListener("click", () => stepReplay());
    $("#resetReplay", root).addEventListener("click", () => {
      stopReplay(false);
      state.replay.index = null;
      state.offset = 0;
      lastToast = "回放已重置";
      render();
    });
  }

  function bindIndicatorControls(root) {
    $$('[data-indicator]', root).forEach((input) => {
      input.addEventListener("change", () => {
        state.indicators[input.dataset.indicator] = input.checked;
        saveState();
      });
    });

    $("#saveCustom", root).addEventListener("click", () => {
      state.customCode = $("#customCode", root).value;
      saveState();
      $("#codeStatus", root).textContent = "已儲存";
    });

    $("#resetCustom", root).addEventListener("click", () => {
      $("#customCode", root).value = defaultCustomCode;
      state.customCode = defaultCustomCode;
      saveState();
      $("#codeStatus", root).textContent = "已套用範例";
    });

    $("#runCustom", root).addEventListener("click", () => {
      const status = $("#codeStatus", root);
      state.customCode = $("#customCode", root).value;
      try {
        const values = computeCustomIndicator(getCandles(state.selectedSymbol, state.timeframe));
        state.indicators.custom = true;
        saveState();
        status.textContent = `已產生 ${values.length} 點`;
        setTimeout(() => {
          state.page = "chart";
          render();
        }, 320);
      } catch (error) {
        status.textContent = "程式錯誤";
        status.classList.add("risk");
      }
    });
  }

  function bindSettings(root) {
    $$('[data-theme-option]', root).forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.theme = button.dataset.themeOption;
        saveState();
        render();
      });
    });

    $$('[data-color-mode]', root).forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.colorMode = button.dataset.colorMode;
        saveState();
        render();
      });
    });

    const bindColor = (id, key) => {
      $(id, root).addEventListener("input", (event) => {
        state.settings[key] = event.target.value;
        applyTheme();
        saveState();
      });
    };
    bindColor("#accentColor", "accent");
    bindColor("#upColor", "upColor");
    bindColor("#downColor", "downColor");

    $("#aiSensitivity", root).addEventListener("input", (event) => {
      state.settings.aiSensitivity = Number(event.target.value);
      saveState();
      renderSettingsPage(root);
    });

    $("#realtimeToggle", root).addEventListener("change", (event) => {
      state.settings.realtime = event.target.checked;
      saveState();
    });

    $("#resetApp", root).addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state = JSON.parse(JSON.stringify(defaultState));
      candleCache = new Map();
      render();
    });
  }

  function mountChart() {
    const canvas = $("#chartCanvas");
    if (!canvas) return;
    chartCanvas = canvas;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(320, Math.floor(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawChart();
    };
    chartObserver = new ResizeObserver(resize);
    chartObserver.observe(canvas);
    resize();

    canvas.addEventListener("wheel", onChartWheel, { passive: false });
    canvas.addEventListener("mousedown", onChartMouseDown);
    canvas.addEventListener("mousemove", onChartMouseMove);
    canvas.addEventListener("mouseleave", () => updateToast(lastToast));
  }

  function drawChart() {
    if (!chartCanvas) return;
    const canvas = chartCanvas;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const allData = getActiveCandles();
    if (!allData.length) return;
    state.visibleCount = clamp(state.visibleCount, 28, Math.min(180, allData.length));
    const maxOffset = Math.max(0, allData.length - state.visibleCount);
    state.offset = clamp(state.offset, 0, maxOffset);
    const end = allData.length - state.offset;
    const start = Math.max(0, end - state.visibleCount);
    const visible = allData.slice(start, end);

    const margin = { left: 12, right: 74, top: 18, bottom: 30 };
    const hasOsc = state.indicators.rsi || state.indicators.macd;
    const volumeHeight = state.indicators.volume ? Math.min(72, Math.max(46, height * 0.13)) : 0;
    const oscHeight = hasOsc ? Math.min(112, Math.max(82, height * 0.18)) : 0;
    const gap = hasOsc ? 10 : 0;
    const priceTop = margin.top;
    const priceBottom = Math.max(240, height - margin.bottom - volumeHeight - oscHeight - gap);
    const volumeTop = priceBottom + 8;
    const oscTop = state.indicators.volume ? volumeTop + volumeHeight + 10 : priceBottom + 10;
    const plotLeft = margin.left;
    const plotRight = width - margin.right;
    const plotWidth = Math.max(100, plotRight - plotLeft);
    const priceHeight = priceBottom - priceTop;

    const range = priceRange(visible, allData, start, end);
    const step = plotWidth / Math.max(visible.length, 1);
    const xForIndex = (index) => plotLeft + (index - start + 0.5) * step;
    const yForPrice = (price) => priceTop + ((range.max - price) / (range.max - range.min || 1)) * priceHeight;
    const priceForY = (y) => range.max - ((y - priceTop) / priceHeight) * (range.max - range.min || 1);
    const indexForX = (x) => clamp(Math.round(start + (x - plotLeft) / step - 0.5), 0, allData.length - 1);

    chartMeta = {
      allData,
      visible,
      start,
      end,
      width,
      height,
      plotLeft,
      plotRight,
      priceTop,
      priceBottom,
      volumeTop,
      volumeHeight,
      oscTop,
      oscHeight,
      step,
      range,
      xForIndex,
      yForPrice,
      priceForY,
      indexForX
    };

    drawGrid(ctx, chartMeta);
    if (state.indicators.smc) drawSmcZones(ctx, chartMeta);
    drawCandles(ctx, chartMeta);
    if (state.indicators.volume) drawVolume(ctx, chartMeta);
    drawOverlayIndicators(ctx, chartMeta);
    drawDrawings(ctx, chartMeta);
    if (hasOsc) drawOscillators(ctx, chartMeta);
    drawAxisLabels(ctx, chartMeta);
    updateReplayStatus();
  }

  function drawGrid(ctx, meta) {
    ctx.save();
    ctx.strokeStyle = getCss("--line-soft");
    ctx.lineWidth = 1;
    ctx.font = "12px system-ui";
    ctx.fillStyle = getCss("--muted");
    for (let i = 0; i <= 5; i += 1) {
      const y = meta.priceTop + (meta.priceBottom - meta.priceTop) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(meta.plotLeft, y);
      ctx.lineTo(meta.plotRight, y);
      ctx.stroke();
    }
    const verticals = Math.min(8, meta.visible.length);
    for (let i = 0; i <= verticals; i += 1) {
      const x = meta.plotLeft + (meta.plotRight - meta.plotLeft) * (i / verticals);
      ctx.beginPath();
      ctx.moveTo(x, meta.priceTop);
      ctx.lineTo(x, meta.priceBottom);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCandles(ctx, meta) {
    const colors = candleColors();
    ctx.save();
    meta.visible.forEach((candle, localIndex) => {
      const index = meta.start + localIndex;
      const x = meta.xForIndex(index);
      const openY = meta.yForPrice(candle.open);
      const closeY = meta.yForPrice(candle.close);
      const highY = meta.yForPrice(candle.high);
      const lowY = meta.yForPrice(candle.low);
      const up = candle.close >= candle.open;
      const color = up ? colors.up : colors.down;
      const bodyWidth = clamp(meta.step * 0.62, 3, 18);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(openY - closeY));
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    });
    ctx.restore();
  }

  function drawVolume(ctx, meta) {
    if (!meta.volumeHeight) return;
    const colors = candleColors();
    const maxVolume = Math.max(...meta.visible.map((c) => c.volume), 1);
    ctx.save();
    meta.visible.forEach((candle, localIndex) => {
      const index = meta.start + localIndex;
      const x = meta.xForIndex(index);
      const h = (candle.volume / maxVolume) * meta.volumeHeight;
      ctx.fillStyle = candle.close >= candle.open ? hexToRgba(colors.up, 0.45) : hexToRgba(colors.down, 0.45);
      ctx.fillRect(x - clamp(meta.step * 0.56, 2, 16) / 2, meta.volumeTop + meta.volumeHeight - h, clamp(meta.step * 0.56, 2, 16), h);
    });
    ctx.fillStyle = getCss("--muted");
    ctx.font = "12px system-ui";
    ctx.fillText("VOL", meta.plotLeft, meta.volumeTop + 12);
    ctx.restore();
  }

  function drawOverlayIndicators(ctx, meta) {
    const data = meta.allData;
    if (state.indicators.sma) drawLineSeries(ctx, meta, sma(data, 20), "#f0b84b", 1.7);
    if (state.indicators.ema) drawLineSeries(ctx, meta, ema(data, 20), "#47c2a8", 1.6);
    if (state.indicators.bb) {
      const bands = bollinger(data, 20, 2);
      drawLineSeries(ctx, meta, bands.upper, "rgba(116, 162, 255, 0.75)", 1.1);
      drawLineSeries(ctx, meta, bands.lower, "rgba(116, 162, 255, 0.75)", 1.1);
    }
    if (state.indicators.custom) {
      try {
        const customValues = normalizeCustomValues(computeCustomIndicator(data), data);
        drawLineSeries(ctx, meta, customValues, state.settings.accent, 2.1);
      } catch (error) {
        updateToast("自訂指標錯誤");
      }
    }
    if (state.indicators.sri) drawSriSignals(ctx, meta);
  }

  function drawLineSeries(ctx, meta, values, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    for (let index = meta.start; index < meta.end; index += 1) {
      const value = values[index];
      if (!Number.isFinite(value)) {
        started = false;
        continue;
      }
      const x = meta.xForIndex(index);
      const y = meta.yForPrice(value);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawOscillators(ctx, meta) {
    if (!meta.oscHeight) return;
    ctx.save();
    ctx.strokeStyle = getCss("--line-soft");
    ctx.fillStyle = getCss("--muted");
    ctx.font = "12px system-ui";
    ctx.strokeRect(meta.plotLeft, meta.oscTop, meta.plotRight - meta.plotLeft, meta.oscHeight);

    if (state.indicators.rsi) {
      const values = rsi(meta.allData, 14);
      const y = (value) => meta.oscTop + (100 - value) / 100 * meta.oscHeight;
      [30, 70].forEach((level) => {
        ctx.strokeStyle = level === 70 ? "rgba(228, 84, 84, 0.36)" : "rgba(71, 194, 168, 0.36)";
        ctx.beginPath();
        ctx.moveTo(meta.plotLeft, y(level));
        ctx.lineTo(meta.plotRight, y(level));
        ctx.stroke();
      });
      ctx.fillText("RSI", meta.plotLeft + 6, meta.oscTop + 14);
      ctx.strokeStyle = "#9c7cf4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let index = meta.start; index < meta.end; index += 1) {
        const value = values[index];
        if (!Number.isFinite(value)) {
          started = false;
          continue;
        }
        const x = meta.xForIndex(index);
        const yy = y(value);
        if (!started) {
          ctx.moveTo(x, yy);
          started = true;
        } else {
          ctx.lineTo(x, yy);
        }
      }
      ctx.stroke();
    }

    if (state.indicators.macd) {
      const macdValues = macd(meta.allData);
      const visibleHist = macdValues.hist.slice(meta.start, meta.end).filter(Number.isFinite);
      const maxAbs = Math.max(...visibleHist.map(Math.abs), 1);
      const baseY = meta.oscTop + meta.oscHeight * 0.72;
      macdValues.hist.slice(meta.start, meta.end).forEach((value, localIndex) => {
        if (!Number.isFinite(value)) return;
        const index = meta.start + localIndex;
        const x = meta.xForIndex(index);
        const barHeight = (Math.abs(value) / maxAbs) * (meta.oscHeight * 0.24);
        ctx.fillStyle = value >= 0 ? "rgba(228, 84, 84, 0.58)" : "rgba(72, 184, 120, 0.58)";
        ctx.fillRect(x - clamp(meta.step * 0.46, 2, 12) / 2, value >= 0 ? baseY - barHeight : baseY, clamp(meta.step * 0.46, 2, 12), barHeight);
      });
      ctx.fillStyle = getCss("--muted");
      ctx.fillText("MACD", meta.plotRight - 44, meta.oscTop + 14);
    }
    ctx.restore();
  }

  function drawSmcZones(ctx, meta) {
    const zones = detectZones(meta.visible);
    ctx.save();
    zones.forEach((zone) => {
      const top = meta.yForPrice(zone.top);
      const bottom = meta.yForPrice(zone.bottom);
      ctx.fillStyle = zone.type === "demand" ? "rgba(71, 194, 168, 0.10)" : "rgba(228, 84, 84, 0.10)";
      ctx.strokeStyle = zone.type === "demand" ? "rgba(71, 194, 168, 0.34)" : "rgba(228, 84, 84, 0.34)";
      ctx.fillRect(meta.plotLeft, Math.min(top, bottom), meta.plotRight - meta.plotLeft, Math.abs(bottom - top));
      ctx.strokeRect(meta.plotLeft, Math.min(top, bottom), meta.plotRight - meta.plotLeft, Math.abs(bottom - top));
      ctx.fillStyle = zone.type === "demand" ? "#47c2a8" : "#e45454";
      ctx.font = "12px system-ui";
      ctx.fillText(zone.type === "demand" ? "SMC demand" : "SMC supply", meta.plotLeft + 8, Math.min(top, bottom) + 15);
    });
    ctx.restore();
  }

  function drawSriSignals(ctx, meta) {
    const values = rsi(meta.allData, 14);
    ctx.save();
    for (let index = Math.max(meta.start, 2); index < meta.end; index += 1) {
      const candle = meta.allData[index];
      const prev = meta.allData[index - 1];
      const value = values[index];
      const bullish = value < 34 && candle.close > candle.open && candle.low < prev.low;
      const bearish = value > 66 && candle.close < candle.open && candle.high > prev.high;
      if (!bullish && !bearish) continue;
      const x = meta.xForIndex(index);
      const y = bullish ? meta.yForPrice(candle.low) + 12 : meta.yForPrice(candle.high) - 12;
      ctx.fillStyle = bullish ? "#47c2a8" : "#e45454";
      ctx.beginPath();
      if (bullish) {
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 8);
        ctx.lineTo(x + 5, y + 8);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y - 8);
        ctx.lineTo(x + 5, y - 8);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDrawings(ctx, meta) {
    const lines = getLines();
    ctx.save();
    lines.forEach((line, idx) => {
      const x1 = meta.xForIndex(line.i1);
      const y1 = meta.yForPrice(line.p1);
      const x2 = meta.xForIndex(line.i2);
      const y2 = meta.yForPrice(line.p2);
      if ((x1 < meta.plotLeft && x2 < meta.plotLeft) || (x1 > meta.plotRight && x2 > meta.plotRight)) return;
      ctx.strokeStyle = idx === dragState?.lineIndex ? state.settings.accent : line.color || state.settings.accent;
      ctx.lineWidth = idx === dragState?.lineIndex ? 2.4 : 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(x1, y1, 3, 0, Math.PI * 2);
      ctx.arc(x2, y2, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (draftLine) {
      const x = meta.xForIndex(draftLine.index);
      const y = meta.yForPrice(draftLine.price);
      ctx.fillStyle = state.settings.accent;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAxisLabels(ctx, meta) {
    ctx.save();
    ctx.fillStyle = getCss("--muted");
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    for (let i = 0; i <= 5; i += 1) {
      const price = meta.range.max - (meta.range.max - meta.range.min) * (i / 5);
      const y = meta.priceTop + (meta.priceBottom - meta.priceTop) * (i / 5);
      ctx.fillText(formatPrice(price), meta.plotRight + 8, y + 4);
    }
    const labelEvery = Math.max(1, Math.floor(meta.visible.length / 5));
    ctx.textAlign = "center";
    for (let local = 0; local < meta.visible.length; local += labelEvery) {
      const candle = meta.visible[local];
      const x = meta.xForIndex(meta.start + local);
      ctx.fillText(formatDate(candle.time, state.timeframe), x, meta.height - 10);
    }
    const last = meta.allData[meta.allData.length - 1];
    const y = meta.yForPrice(last.close);
    ctx.fillStyle = state.settings.accent;
    ctx.fillRect(meta.plotRight + 4, y - 10, 62, 20);
    ctx.fillStyle = "#15120a";
    ctx.textAlign = "center";
    ctx.fillText(formatPrice(last.close), meta.plotRight + 35, y + 4);
    ctx.restore();
  }

  function onChartWheel(event) {
    if (!chartMeta) return;
    event.preventDefault();
    const direction = Math.sign(event.deltaY);
    state.visibleCount = clamp(state.visibleCount + direction * 8, 28, Math.min(180, chartMeta.allData.length));
    saveState();
    drawChart();
  }

  function onChartMouseDown(event) {
    if (!chartMeta) return;
    const point = chartPoint(event);
    if (!point) return;

    if (state.tool === "line") {
      if (!draftLine) {
        draftLine = point;
        lastToast = "已選第 1 點";
      } else {
        const line = {
          i1: draftLine.index,
          p1: draftLine.price,
          i2: point.index,
          p2: point.price,
          color: state.settings.accent
        };
        state.drawings[lineKey()] = [...getLines(), line];
        draftLine = null;
        lastToast = "趨勢線已加入";
        saveState();
      }
      updateToast(lastToast);
      drawChart();
      return;
    }

    const hit = findLineAt(point.x, point.y);
    if (hit) {
      const line = getLines()[hit.index];
      dragState = {
        type: "line",
        lineIndex: hit.index,
        startIndex: point.index,
        startPrice: point.price,
        original: { ...line }
      };
    } else {
      dragState = {
        type: "pan",
        startX: point.x,
        originalOffset: state.offset
      };
    }

    window.addEventListener("mousemove", onWindowDrag);
    window.addEventListener("mouseup", onWindowMouseUp, { once: true });
  }

  function onWindowDrag(event) {
    if (!dragState || !chartMeta) return;
    const point = chartPoint(event);
    if (!point) return;

    if (dragState.type === "pan") {
      const dx = point.x - dragState.startX;
      state.offset = clamp(Math.round(dragState.originalOffset + dx / chartMeta.step), 0, Math.max(0, chartMeta.allData.length - state.visibleCount));
    }

    if (dragState.type === "line") {
      const lines = getLines();
      const line = lines[dragState.lineIndex];
      const dIndex = point.index - dragState.startIndex;
      const dPrice = point.price - dragState.startPrice;
      line.i1 = clamp(dragState.original.i1 + dIndex, 0, chartMeta.allData.length - 1);
      line.i2 = clamp(dragState.original.i2 + dIndex, 0, chartMeta.allData.length - 1);
      line.p1 = dragState.original.p1 + dPrice;
      line.p2 = dragState.original.p2 + dPrice;
      state.drawings[lineKey()] = lines;
    }
    drawChart();
  }

  function onWindowMouseUp() {
    window.removeEventListener("mousemove", onWindowDrag);
    if (dragState) saveState();
    dragState = null;
    drawChart();
  }

  function onChartMouseMove(event) {
    if (!chartMeta || dragState) return;
    const point = chartPoint(event);
    if (!point) return;
    const candle = chartMeta.allData[point.index];
    if (!candle) return;
    updateToast(`${formatDate(candle.time, state.timeframe)} O ${formatPrice(candle.open)} H ${formatPrice(candle.high)} L ${formatPrice(candle.low)} C ${formatPrice(candle.close)}`);
  }

  function chartPoint(event) {
    const rect = chartCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const index = chartMeta.indexForX(x);
    const price = chartMeta.priceForY(y);
    return { x, y, index, price };
  }

  function findLineAt(x, y) {
    if (!chartMeta) return null;
    const lines = getLines();
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      const x1 = chartMeta.xForIndex(line.i1);
      const y1 = chartMeta.yForPrice(line.p1);
      const x2 = chartMeta.xForIndex(line.i2);
      const y2 = chartMeta.yForPrice(line.p2);
      if (distanceToSegment(x, y, x1, y1, x2, y2) < 9) return { index };
    }
    return null;
  }

  function startReplay(keepIndex) {
    const input = $("#replayDate");
    if (input) state.replay.date = input.value;
    const data = getCandles(state.selectedSymbol, state.timeframe);
    if (!keepIndex || state.replay.index == null) {
      const target = new Date(`${state.replay.date}T00:00:00`).getTime();
      const found = data.findIndex((candle) => candle.time >= target);
      state.replay.index = found >= 0 ? found : Math.max(0, data.length - 55);
    }
    state.replay.active = true;
    clearInterval(replayTimer);
    replayTimer = setInterval(() => stepReplay(true), Number(state.replay.speed) || 650);
    lastToast = "行情回放中";
    saveState();
    drawChart();
    updateReplayStatus();
    const toggle = $("#replayToggle");
    if (toggle) toggle.textContent = "暫停";
  }

  function stepReplay(fromTimer = false) {
    const data = getCandles(state.selectedSymbol, state.timeframe);
    if (!state.replay.active && !fromTimer) state.replay.active = true;
    if (state.replay.index == null) startReplay(false);
    state.replay.index = clamp((state.replay.index ?? 0) + 1, 0, data.length - 1);
    state.offset = 0;
    if (state.replay.index >= data.length - 1) stopReplay(false);
    drawChart();
    updateReplayStatus();
  }

  function stopReplay(keepIndex) {
    clearInterval(replayTimer);
    replayTimer = null;
    state.replay.active = false;
    if (!keepIndex) state.replay.index = null;
    saveState();
    const toggle = $("#replayToggle");
    if (toggle) toggle.textContent = "播放";
    drawChart();
    updateReplayStatus();
  }

  function replayStatusText() {
    if (!state.replay.active && state.replay.index == null) return "尚未開始";
    const data = getCandles(state.selectedSymbol, state.timeframe);
    const candle = data[state.replay.index ?? data.length - 1];
    return candle ? `目前 ${formatDate(candle.time, state.timeframe)}` : "尚未開始";
  }

  function updateReplayStatus() {
    const status = $("#replayStatus");
    if (status) status.textContent = replayStatusText();
  }

  function updateToast(text) {
    const toast = $("#chartToast");
    if (toast) toast.textContent = text;
  }

  function getActiveCandles() {
    const data = getCandles(state.selectedSymbol, state.timeframe);
    if (state.replay.active || state.replay.index != null) {
      return data.slice(0, clamp((state.replay.index ?? data.length - 1) + 1, 1, data.length));
    }
    return data;
  }

  function simulateRealtimeTick() {
    if (!state.settings.realtime || state.replay.active) return;
    const key = `${state.selectedSymbol}:${state.timeframe}`;
    const data = candleCache.get(key);
    if (!data || !data.length) return;
    const last = data[data.length - 1];
    const stock = stockBySymbol(state.selectedSymbol);
    const impulse = (Math.random() - 0.48 + stock.bias * 10) * stock.volatility * 0.18;
    const nextClose = Math.max(1, last.close * (1 + impulse));
    last.close = roundPrice(nextClose);
    last.high = Math.max(last.high, last.close, last.open);
    last.low = Math.min(last.low, last.close, last.open);
    last.volume = Math.round(last.volume * (1 + Math.random() * 0.04));
    if (state.page === "chart") drawChart();
    updateHeader();
  }

  function getCandles(symbol = state.selectedSymbol, timeframe = state.timeframe) {
    const key = `${symbol}:${timeframe}`;
    if (candleCache.has(key)) return candleCache.get(key);
    const stock = stockBySymbol(symbol);
    const times = makeTradingTimes(timeframe);
    const rng = seededRandom(symbolSeed(symbol) + timeframe.length * 997);
    let price = stock.base * (0.84 + rng() * 0.18);
    const candles = times.map((time, index) => {
      const wave = Math.sin(index / 13) * 0.003 + Math.cos(index / 29) * 0.002;
      const shock = (rng() - 0.5) * stock.volatility;
      const open = price;
      const close = Math.max(1, open * (1 + stock.bias + wave + shock));
      const spread = Math.max(open, close) * (0.004 + rng() * stock.volatility * 0.72);
      const high = Math.max(open, close) + spread * (0.45 + rng());
      const low = Math.max(0.1, Math.min(open, close) - spread * (0.45 + rng()));
      const volume = Math.round(stock.volume * (0.55 + rng() * 1.2) * (1 + Math.abs(shock) * 16));
      price = close;
      return {
        time,
        open: roundPrice(open),
        high: roundPrice(high),
        low: roundPrice(low),
        close: roundPrice(close),
        volume
      };
    });
    candleCache.set(key, candles);
    return candles;
  }

  function makeTradingTimes(timeframe) {
    const count = timeframe === "D" ? 190 : timeframe === "60" ? 210 : 260;
    const endDay = new Date(2026, 5, 29, 13, 30, 0, 0);
    if (timeframe === "D") {
      const times = [];
      const day = new Date(endDay);
      while (times.length < count) {
        if (isWeekday(day)) times.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 13, 30).getTime());
        day.setDate(day.getDate() - 1);
      }
      return times.reverse();
    }

    const minutes = Number(timeframe);
    const times = [];
    const day = new Date(endDay);
    while (times.length < count) {
      if (isWeekday(day)) {
        for (let minute = 9 * 60; minute <= 13 * 60 + 30; minute += minutes) {
          times.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minute / 60), minute % 60).getTime());
        }
      }
      day.setDate(day.getDate() - 1);
    }
    return times.sort((a, b) => a - b).slice(-count);
  }

  function isWeekday(date) {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function symbolSeed(symbol) {
    return symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0) * 97, 1729);
  }

  function stockBySymbol(symbol) {
    return stocks.find((stock) => stock.symbol === symbol) || stocks[0];
  }

  function buildMarketSummary() {
    const analyses = stocks.map((stock) => analyzeTrend(getCandles(stock.symbol, "D")));
    const bullishCount = analyses.filter((item) => item.direction === "up").length;
    const rangeCount = analyses.filter((item) => item.direction === "range").length;
    const weighted = stocks.slice(0, 5).reduce((sum, stock) => {
      const data = getCandles(stock.symbol, "D");
      const last = data[data.length - 1];
      const prev = data[data.length - 2] || last;
      return sum + ((last.close - prev.close) / prev.close) * 100;
    }, 0) / 5;
    return {
      index: formatPrice(22980 + weighted * 38),
      indexDelta: `${weighted >= 0 ? "+" : ""}${weighted.toFixed(2)}%`,
      bullishCount,
      rangeCount
    };
  }

  function analyzeTrend(data) {
    const closes = data.map((item) => item.close);
    const fast = ema(data, 12);
    const slow = ema(data, 26);
    const last = data[data.length - 1];
    const lookback = Math.min(24, data.length - 2);
    const fastNow = fast[fast.length - 1] || last.close;
    const fastPast = fast[fast.length - lookback] || fastNow;
    const slowNow = slow[slow.length - 1] || last.close;
    const slope = ((fastNow - fastPast) / fastPast) * 100;
    const atrPercent = atr(data, 14) / last.close * 100;
    const recent = data.slice(-42);
    const support = Math.min(...recent.map((item) => item.low));
    const resistance = Math.max(...recent.map((item) => item.high));
    const sensitivity = state.settings.aiSensitivity / 55;
    const spread = ((fastNow - slowNow) / slowNow) * 100;
    const momentum = slope * 0.72 + spread * 0.54;
    const rangeThreshold = Math.max(0.18, 0.62 / sensitivity);
    let direction = "range";
    if (momentum > rangeThreshold) direction = "up";
    if (momentum < -rangeThreshold) direction = "down";

    const confidence = clamp(Math.round(48 + Math.abs(momentum) * 16 + Math.min(atrPercent, 5) * 4), 44, 92);
    const labels = {
      up: ["上升趨勢", "偏多延續", "均線斜率轉強，回測支撐後延續機率較高。", "good"],
      down: ["下降趨勢", "偏空整理", "短均低於慢均，反彈遇壓需要留意。", "risk"],
      range: ["盤整震盪", "等待突破", "價格在區間內壓縮，突破量能是關鍵。", "warn"]
    }[direction];

    return {
      direction,
      label: labels[0],
      short: labels[1],
      summary: labels[2],
      tone: labels[3],
      confidence,
      support,
      resistance,
      volatility: atrPercent.toFixed(2)
    };
  }

  function sma(data, period) {
    const values = new Array(data.length).fill(null);
    let sum = 0;
    data.forEach((candle, index) => {
      sum += candle.close;
      if (index >= period) sum -= data[index - period].close;
      if (index >= period - 1) values[index] = sum / period;
    });
    return values;
  }

  function ema(data, period) {
    const values = new Array(data.length).fill(null);
    const multiplier = 2 / (period + 1);
    let previous = null;
    data.forEach((candle, index) => {
      if (previous == null) previous = candle.close;
      previous = candle.close * multiplier + previous * (1 - multiplier);
      if (index >= period - 1) values[index] = previous;
    });
    return values;
  }

  function rsi(data, period) {
    const values = new Array(data.length).fill(null);
    let gain = 0;
    let loss = 0;
    for (let index = 1; index < data.length; index += 1) {
      const change = data[index].close - data[index - 1].close;
      const up = Math.max(change, 0);
      const down = Math.max(-change, 0);
      if (index <= period) {
        gain += up;
        loss += down;
        if (index === period) {
          gain /= period;
          loss /= period;
          values[index] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
        }
      } else {
        gain = (gain * (period - 1) + up) / period;
        loss = (loss * (period - 1) + down) / period;
        values[index] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
      }
    }
    return values;
  }

  function bollinger(data, period, multiplier) {
    const mid = sma(data, period);
    const upper = new Array(data.length).fill(null);
    const lower = new Array(data.length).fill(null);
    for (let index = period - 1; index < data.length; index += 1) {
      const slice = data.slice(index - period + 1, index + 1);
      const mean = mid[index];
      const variance = slice.reduce((sum, candle) => sum + (candle.close - mean) ** 2, 0) / period;
      const sd = Math.sqrt(variance);
      upper[index] = mean + sd * multiplier;
      lower[index] = mean - sd * multiplier;
    }
    return { upper, lower, mid };
  }

  function macd(data) {
    const fast = ema(data, 12);
    const slow = ema(data, 26);
    const line = data.map((_, index) => (Number.isFinite(fast[index]) && Number.isFinite(slow[index]) ? fast[index] - slow[index] : null));
    const signal = ema(line.map((value, index) => ({ close: value ?? data[index].close })), 9);
    const hist = line.map((value, index) => (Number.isFinite(value) && Number.isFinite(signal[index]) ? value - signal[index] : null));
    return { line, signal, hist };
  }

  function atr(data, period) {
    const trs = [];
    for (let index = 1; index < data.length; index += 1) {
      const current = data[index];
      const prev = data[index - 1];
      trs.push(Math.max(current.high - current.low, Math.abs(current.high - prev.close), Math.abs(current.low - prev.close)));
    }
    const slice = trs.slice(-period);
    return slice.reduce((sum, value) => sum + value, 0) / Math.max(slice.length, 1);
  }

  function priceRange(visible, data, start, end) {
    const values = [];
    visible.forEach((candle) => values.push(candle.high, candle.low));
    [state.indicators.sma ? sma(data, 20) : [], state.indicators.ema ? ema(data, 20) : []].forEach((series) => {
      series.slice(start, end).forEach((value) => {
        if (Number.isFinite(value)) values.push(value);
      });
    });
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.08, max * 0.006);
    return { min: min - pad, max: max + pad };
  }

  function computeCustomIndicator(data) {
    const helpers = {
      sma,
      ema,
      rsi,
      atr: (candles, period = 14) => atr(candles, period),
      changePercent: (current, previous) => ((current - previous) / previous) * 100
    };
    const runner = new Function("candles", "helpers", `"use strict";\n${state.customCode}`);
    const cleanCandles = data.map((candle) => ({ ...candle }));
    const result = runner(cleanCandles, helpers);
    if (!Array.isArray(result)) throw new Error("Custom indicator must return an array");
    return result;
  }

  function normalizeCustomValues(result, data) {
    const byTime = new Map();
    result.forEach((item, index) => {
      if (typeof item === "number") byTime.set(data[index]?.time, item);
      if (item && typeof item === "object") byTime.set(item.time ?? data[index]?.time, Number(item.value));
    });
    return data.map((candle) => {
      const value = byTime.get(candle.time);
      return Number.isFinite(value) ? value : null;
    });
  }

  function detectZones(visible) {
    const recent = visible.slice(-48);
    if (recent.length < 12) return [];
    const lowCandle = recent.reduce((min, candle) => (candle.low < min.low ? candle : min), recent[0]);
    const highCandle = recent.reduce((max, candle) => (candle.high > max.high ? candle : max), recent[0]);
    const demandTop = Math.min(lowCandle.open, lowCandle.close) * 1.006;
    const demandBottom = lowCandle.low * 0.997;
    const supplyTop = highCandle.high * 1.003;
    const supplyBottom = Math.max(highCandle.open, highCandle.close) * 0.994;
    return [
      { type: "demand", top: demandTop, bottom: demandBottom },
      { type: "supply", top: supplyTop, bottom: supplyBottom }
    ];
  }

  function sparkline(data) {
    const closes = data.slice(-34).map((item) => item.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const points = closes.map((value, index) => {
      const x = (index / Math.max(closes.length - 1, 1)) * 100;
      const y = 46 - ((value - min) / (max - min || 1)) * 40;
      return [x, y];
    });
    const path = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    const area = `${path} L100 52 L0 52 Z`;
    return `<svg class="sparkline" viewBox="0 0 100 54" preserveAspectRatio="none"><path class="fill" d="${area}"></path><path d="${path}"></path></svg>`;
  }

  function candleColors() {
    if (state.settings.colorMode === "greenUp") return { up: "#48b878", down: "#e45454" };
    return { up: state.settings.upColor, down: state.settings.downColor };
  }

  function getLines() {
    return state.drawings[lineKey()] || [];
  }

  function lineKey() {
    return `${state.selectedSymbol}:${state.timeframe}`;
  }

  function formatPrice(value) {
    if (!Number.isFinite(value)) return "--";
    if (value >= 1000) return value.toFixed(0);
    if (value >= 100) return value.toFixed(1);
    return value.toFixed(2);
  }

  function formatPercent(value) {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  }

  function formatDate(time, timeframe) {
    const date = new Date(time);
    if (timeframe === "D") return `${date.getMonth() + 1}/${date.getDate()}`;
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function roundPrice(value) {
    if (value >= 1000) return Math.round(value);
    if (value >= 100) return Math.round(value * 2) / 2;
    if (value >= 50) return Math.round(value * 10) / 10;
    return Math.round(value * 100) / 100;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function getCss(name) {
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
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }
})();