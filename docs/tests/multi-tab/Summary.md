# 多分頁功能 (multi-tab)

## 本分類測試範圍

涵蓋 Electron 多分頁功能：是否可在不同 Tab 的文件設定中指定不同機器，以及送出工作時各分頁是否能各自執行不同參數。

多分頁為 Electron-only 功能，建置 Electron E2E 成本高且僅涵蓋少數案例（Tier D），不建議導入；建議改以 Jest 對 `tabManager`／`tabController` 邏輯做單元測試（mock 掉 IPC），搭配人工驗證。目前尚無專屬的自動化測試。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
|---|---|---|---|
| `packages/core/src/web/app/actions/tabController.spec.ts` | Jest 單元測試 | 分頁控制器（core 側，mock communicator） | 既有 |
| `apps/app/src/node/tabManager.spec.ts` | Jest 單元測試 | Electron 主行程分頁管理：建立/上限/逐分頁狀態隔離/焦點/廣播路由/關閉清理（32 個測試；**apps/app 首個測試**，隨附最小 Jest 設定 `nx run app:test`） | Claude 自動產生 (2026-07) |

真實多視窗/原生選單行為維持發版前人工（依計畫 Tier D 決策不建置 Electron E2E）。

## 尚未自動化項目

- 是否可在不同 Tab 的文件設定中指定不同機器 — 不建議建置 Electron E2E（Tier D）；建議以 Jest 測 `tabManager`／`tabController` 邏輯（mock IPC）並搭配人工驗證。
- 送出工作是否可各自執行不同參數 — 同上，以邏輯單元測試搭配發版前人工驗證。
