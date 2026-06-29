# TW K Radar

台股即時判讀工作台。這是一個靜態 PWA 網頁版，可以放在 GitHub Pages，也可以透過 Capacitor 打包 Android APK。

## 目前功能

- TradingView 風格版面：左側畫線工具、中間大 K 線、右側觀察清單與 AI 判讀。
- 台股行情：優先讀取 Yahoo Finance K 線，並用 TWSE MIS 即時報價校正最新價。
- 全台股搜尋：啟動後會嘗試從 TWSE / TPEX OpenAPI 補上市與上櫃股票清單。
- K 線操作：滾輪縮放、拖曳平移、顯示全部、近 80 / 220 / 520 根。
- 畫線工具：趨勢線、射線、水平線、測量、文字標記、磁貼吸附。
- 技術指標：成交量、SMA、EMA、布林通道、RSI、MACD、SMC 區域、SRI 反轉、自訂腳本。
- AI 判讀：趨勢、盤整、支撐、壓力、波動、RSI 冷熱與風險提示。
- 回放功能：可指定日期作為起點，逐根播放歷史行情。
- 登入/註冊：目前使用瀏覽器本機帳號，會保存自選股、指標、設定與畫線。
- PWA：可加入手機主畫面。

## 管理員帳號

```text
帳號：admin
密碼：twkradar2026
```

目前的帳號資料存在使用者自己的瀏覽器。這適合第一版展示與個人使用，但不是正式多人登入系統。

## 行情資料來源

前一版的價格是前端模擬資料，所以可能出現和真實股價完全不一樣的數字。新版改成：

- K 線：Yahoo Finance chart API，例如 `2330.TW`、`5483.TWO`
- 最新價校正：TWSE MIS，例如 `tse_2330.tw`、`otc_5483.tw`
- 股票清單：TWSE OpenAPI、TPEX OpenAPI
- 網站備援：`www/data/quotes.js` 與 `www/data/quotes.json`，固定使用台幣 TWD 報價

如果公開資料源被 CORS、流量限制或暫時封鎖，畫面會改用同網域的台幣報價快取。沒有真實報價時，不會再顯示隨機示範價格。

## 開啟網站

本機直接開：

```text
file:///C:/Users/golde/OneDrive/%E6%96%87%E4%BB%B6/%E5%8F%B0%E8%82%A1K/www/index.html
```

公開網站：

```text
https://mlei83015.github.io/tiwn_stocks/
```

## Android APK

推送到 GitHub 後，Actions 的 `Build Android APK` 會產生 debug APK artifact：

```text
tw-k-radar-debug-apk
```

## 下一步建議

要做到正式多人帳號、跨裝置同步與真正 SQL 資料庫，建議接其中一種後端：

- Supabase：PostgreSQL、登入、資料表都完整，最適合快速上線。
- Cloudflare D1：SQLite 類型，適合輕量網站。
- 自架 Node.js API：自由度最高，但要自己處理伺服器與安全性。

真正「完全即時、完全準確」的商用行情通常需要授權資料商或券商 API。公開免費 API 適合原型與個人使用，但可能延遲、限流或偶爾失效。
