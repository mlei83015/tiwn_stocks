# TW K Radar

台股 K 線、指標、畫線、AI 趨勢判斷、回放與自選股的第一版 Web App。

## 現在已有

- 首頁：台股市場摘要、AI 趨勢卡、台股新聞流。
- 自選：加入/移除股票，快速切到 K 線。
- 圖表：K 線、成交量、SMA、EMA、布林、RSI、MACD、SMC 區域、SRI 反轉提示。
- 畫線：可畫趨勢線，也可拖曳移動已畫好的線。
- 回放：可從指定日期開始重播行情。
- 指標：可開關內建指標，也可寫 JavaScript 自訂指標。
- 設定：黑白模式、紅漲綠跌/綠漲紅跌、K 線顏色、AI 敏感度、即時模擬。
- PWA：可直接用手機瀏覽器安裝到桌面。
- Android：GitHub Actions 會產出 Debug APK artifact。

## 開啟網頁版

直接開啟：

```text
www/index.html
```

或推到 GitHub 後，在 GitHub Pages 使用 `.github/workflows/deploy-pages.yml` 發佈。

## 產生 APK

推到 GitHub 後，進入 Actions，執行 `Build Android APK`，完成後下載 `tw-k-radar-debug-apk`。

本版先使用範例台股資料與即時模擬。要變成真正即時，需要再串接台股資料源、券商 API 或自己的後端資料服務。