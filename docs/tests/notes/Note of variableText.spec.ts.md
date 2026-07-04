# Note of variableText.spec.ts

## 對應測試表項目
- 測試表中無「變數文字（Variable Text）」的直接對應列。
- 此 store 是變數文字功能的資料來源：CSV 內容、檔名、序號起訖（start/end/current）、自動遞增（autoAdvance/advanceBy）。它支撐變數文字的人工測試（載入 CSV、逐筆帶入序號、批次輸出），並負責在任何變動時標記檔案有未儲存變更。

## 測試了什麼
- `should have the default state on init`：預設 `{ advanceBy: 1, autoAdvance: true, csvContent: [], csvFileName: '', current: 0, end: 999, start: 0 }`。
- `should merge partial state and mark unsaved changes`：`setVariableTextState({ current, start })` 部分合併（`end` 保留 999），並呼叫 `currentFileManager.setHasUnsavedChanges(true)` 一次。
- `should replace csvContent wholesale when a new CSV is loaded`：載入新 CSV 時 `csvContent` 整體替換，前一檔的列不得殘留（非串接/深合併）；`csvFileName`、`autoAdvance` 一併更新。
- `should mark unsaved changes on every call`：連續兩次 `setVariableTextState` 會呼叫 `setHasUnsavedChanges` 兩次（每次都標記）。

## 設計理由
- 變數文字狀態多且相互關聯，store 層測試能明確驗證「載入 CSV、調整序號」等狀態轉換，不需渲染文字物件與畫布。
- 「未儲存變更」副作用測試（透過 mock `currentFileManager`）抓真實 bug：若忘了或漏呼 `setHasUnsavedChanges`，使用者改了變數文字設定卻能無提示關檔而遺失。以 `toHaveBeenCalledTimes` 精準鎖定「每次都標記」。
- csvContent 整體替換測試抓的真實 bug：若把新 CSV 併進舊陣列（concat 或深合併），重新匯入時舊資料列會殘留，導致序號對應錯亂。此測試以「前檔兩列 → 新檔一列，結果須只剩一列」明確驗證替換語意。

## 充分性分析
- 對 store 的預設值、部分合併、整體替換、未儲存副作用覆蓋充分。
- CSV 實際解析（欄位切分、編碼、錯誤格式）與序號帶入畫布文字物件的邏輯在別處（解析器/元件），不在此 store，未於此涵蓋。
- 結論：以 store 層級而言足夠。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## Open Questions
無。
