# 檢測網路設定 (network-testing)

## 本分類測試範圍

涵蓋「機器」選單 >「Test Network Settings」開啟的網路檢測彈窗：對指定機器 IP 執行連線品質檢測（連線品質 Connection Quality、平均回應時間 Average Response Time），並依結果給出健康度提示或連線失敗訊息。

網路檢測本身在 web 版是瀏覽器端對 `http://<ip>` 的 XHR ping 迴圈（固定 30 秒），因此需要一台網路上可達的實機 IP 才有意義；spec 不寫死 IP，而是**從 FLUXGhost 探索到的機器讀取真實 IP** 再檢測。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `apps/web/cypress/e2e/machine/network-testing.spec.ts` | Cypress E2E（實機唯讀） | 從機器的 Machine Info 讀出 FLUXGhost 探索到的真實 IP → 由「機器」選單開啟 Network Testing 彈窗 → 輸入該 IP → Start → 斷言跑出「Test Completed」結果（Connection Quality 或 #840 連線失敗）。純 ping、不送工作。本地批次 `--machine-readonly` | Claude 自動產生 (2026-07) |

## 尚未自動化項目

- ~~檢測網路設定：對機器 IP 執行網路檢測並顯示結果~~ — ✅ 已由 `network-testing.spec.ts` 覆蓋：實機 Beambox II (Kayden, 192.168.1.203)、ador showroom 皆跑出「Test Completed / Connection Quality : 100 / 平均回應 ~31ms」的健康結果（2026-07-07）。
- **不同網段／不可達 IP 的錯誤路徑**（cannot_connect_1 同網段 vs cannot_connect_2 跨網段、169.254 自動 IP 警告）— 目前只驗證可達實機的健康路徑；錯誤路徑可用假 IP 補測（不需實機），為後續擴充項。
- **本機多網卡 local IP 顯示** — 彈窗會列出本機 IPv4；屬環境相依顯示，暫未斷言。
