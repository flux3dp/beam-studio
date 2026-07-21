# Note of variableText.spec.ts

## 對應測試表項目
- 測試表中沒有「變數文字（Variable Text）」的直接對應列。
- 這個 store 是變數文字功能的資料來源：CSV 內容、檔名、序號起訖（start/end/current）、自動遞增（autoAdvance/advanceBy）。它支撐變數文字的人工測試（載入 CSV、逐筆帶入序號、批次輸出），並負責在任何變動時標記檔案有未儲存的變更。

## 測試了什麼
- `should have the default state on init`：預設值為 `{ advanceBy: 1, autoAdvance: true, csvContent: [], csvFileName: '', current: 0, end: 999, start: 0 }`。
- `should merge partial state and mark unsaved changes`：`setVariableTextState({ current, start })` 只做部分合併（`end` 保留為 999），並呼叫 `currentFileManager.setHasUnsavedChanges(true)` 一次。
- `should replace csvContent wholesale when a new CSV is loaded`：載入新 CSV 時 `csvContent` 整體替換，前一個檔案的資料列不得殘留（不是串接或深層合併）；`csvFileName`、`autoAdvance` 一併更新。
- `should mark unsaved changes on every call`：連續兩次 `setVariableTextState` 會呼叫 `setHasUnsavedChanges` 兩次（每次都標記）。

## 設計理由
- 變數文字的狀態欄位多且互相關聯，在 store 層測試能明確驗證「載入 CSV、調整序號」等狀態轉換，不需要渲染文字物件與畫布。
- 「未儲存變更」的副作用測試（透過 mock `currentFileManager`）可抓到真實的錯誤：如果忘記或漏呼叫 `setHasUnsavedChanges`，使用者改了變數文字設定卻能在沒有提示的情況下關檔而遺失資料。這裡以 `toHaveBeenCalledTimes` 精準鎖定「每次都標記」的行為。
- csvContent 整體替換的測試抓的真實錯誤是：如果把新 CSV 併進舊陣列（concat 或深層合併），重新匯入時舊資料列會殘留，導致序號對應錯亂。此測試以「前一個檔案兩列 → 新檔一列，結果須只剩一列」明確驗證替換的語意。

## 充分性分析
- 對 store 的預設值、部分合併、整體替換、未儲存副作用覆蓋充分。
- CSV 的實際解析（欄位切分、編碼、格式錯誤）以及把序號帶入畫布文字物件的邏輯，都在別處（解析器／元件），不在此 store，因此未於此涵蓋。
- 結論：以 store 層級而言已足夠。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
無。
