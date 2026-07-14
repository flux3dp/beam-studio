# 環境限制（阻擋 QA）：雲端檔案「寫入」操作在 localhost 開發環境一律被後端 CSRF 拒絕

- **狀態**：未解（需後端設定調整或改變測試執行方式）
- **嚴重性**：中 — 本地開發環境完全無法測試「儲存到雲端／重新命名／複製／刪除／檔案上限」等寫入路徑
- **相關**：`id.flux3dp.com` 後端 Django `CSRF_TRUSTED_ORIGINS` 設定；`apps/web/cypress/e2e/top-bar/my-cloud.spec.ts`

## 問題描述

從 `http://localhost:8080`（或 `127.0.0.1:8080`）發出的雲端「寫入」請求（POST／PUT／DELETE 到 `id.flux3dp.com`）一律被拒絕：

> `CSRF Failed: Origin checking failed - http://localhost:8080 does not match any trusted origins.`

「讀取」（登入、`GET /cloud/list`、額度顯示）不受影響。原因是生產後端的 CSRF 信任來源清單只包含 `*.flux3dp.com`，且 `csrftoken` cookie 綁在 `.flux3dp.com` 網域、對 localhost 不可見，客戶端無法繞過。

## 重現條件

1. 本地 dev server 登入 FLUX ID 測試帳號（登入本身成功）。
2. 畫一個物件 →「儲存到雲端」。
3. 請求回傳 403，錯誤訊息如上（`my-cloud.spec.ts` 開發過程中以截圖驗證兩次）。

## 目前的處置

- `my-cloud.spec.ts` 以 `cloudWritable` 旗標偵測執行來源：非 `*.flux3dp.com` 時，7 個寫入類測試自動略過並記錄原因；登入／列表／額度測試照常執行。
- 完整寫入覆蓋需以 `cypress.config.prod.ts`（`studio.flux3dp.com`）執行，或後端（staging）把 localhost 加入 `CSRF_TRUSTED_ORIGINS`。

## 建議

為 QA 自動化建立一個 staging 後端（或旗標），將 `http://localhost:8080` 與 `http://127.0.0.1:8080` 加入信任來源，讓雲端寫入路徑可以在本地 rig 全量執行（對應測試表雲端儲存 8 列）。
