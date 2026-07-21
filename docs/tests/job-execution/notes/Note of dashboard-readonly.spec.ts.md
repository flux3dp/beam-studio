# Note of dashboard-readonly.spec.ts

## 測了什麼

「唯讀 Dashboard」測試（Tier B，僅本地實機批次；GitHub 與未設定機器名稱時自動跳過）。連線後開啟「機器」選單 >〈機器〉> Dashboard，斷言：

- Monitor 彈窗開啟，標題含機器名稱（`${device.name} - ${statusText}`，statusText 來自 `getReport` 的即時狀態）。
- 待機機器進入 **Mode.FILE**：存在 File 與 Camera 兩個唯讀分頁。
- **不存在 Task 分頁**——Task 分頁只有在有工作影像（即送出工作後）才出現，藉此把關「我們全程維持唯讀、未送工作」。
- 以彈窗關閉鈕收掉，確認回到畫布。

對應測試表第 305 列「Dashboard：送出工作後進度條與剩餘時間顯示是否正確」的**唯讀前半**：本測試只驗證待機狀態下 Dashboard 可開啟並讀到狀態，**不涉及送工作後的進度條**（那需要真的執行工作，維持人工）。

## 為什麼這樣測足夠

Dashboard 在待機時開啟走 `Mode.FILE`（`menuDeviceActions.tsx` DASHBOARD：`isIdle && !isPromark ? Mode.FILE : Mode.WORKING`），全程只讀機器檔案清單與狀態、不觸發工作。以「Task 分頁不存在」作為未送工作的守門斷言，確保測試不會意外滑入 Mode.WORKING。這覆蓋了「Dashboard 能否連上並顯示狀態」這個最常見的連機檢查，且零風險。

## 設計重點

- 唯讀性靠兩點保證：(1) 只走選單 Dashboard 進入點，不碰 Start/Go；(2) 斷言 Task 分頁不存在＝未進入工作模式。
- 機器名稱環境變數驅動、共用 `cypress/support/machineRig.ts`。

## Open Questions

- 送工作後的進度條／剩餘時間（第 305 列後半、304／327 預估 vs 實際）本質需要真的執行工作，維持人工或另立會實際送工作的 Tier C 測試——本測試刻意不涵蓋。
- Camera 分頁在北美 locale 會被隱藏（`localeHelper.isNorthAmerica`）；目前假設本地批次非北美環境，若在北美跑需放寬 Camera 分頁斷言。
