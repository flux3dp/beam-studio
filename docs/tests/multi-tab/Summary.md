# 多分頁功能 (multi-tab)

## 本分類測試範圍

涵蓋 Electron 多分頁功能：是否可在不同 Tab 的文件設定中指定不同機器，以及送出工作時各分頁是否能各自執行不同參數。

多分頁為 Electron-only 功能，建置 Electron E2E 成本高且僅涵蓋少數案例（Tier D），不建議導入；建議改以 Jest 對 `tabManager`／`tabController` 邏輯做單元測試（mock 掉 IPC），搭配人工驗證。目前尚無專屬的自動化測試。

## 測試檔案清單

目前無自動化測試 — 多分頁為 Electron-only，尚無專屬 spec 覆蓋；建議以 Jest 單元測試涵蓋分頁邏輯。

## 尚未自動化項目

- 是否可在不同 Tab 的文件設定中指定不同機器 — 不建議建置 Electron E2E（Tier D）；建議以 Jest 測 `tabManager`／`tabController` 邏輯（mock IPC）並搭配人工驗證。
- 送出工作是否可各自執行不同參數 — 同上，以邏輯單元測試搭配發版前人工驗證。
