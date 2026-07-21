# Note of google-fonts-panel.spec.ts

## 對應測試表項目

「Google Fonts 功能」分類下的 5 列（皆對應同一組 stub 與 live 雙層設計）：
- 搜尋欄：「確認搜尋欄是否搜尋正確，不會出現非預期結果」
- Language 下拉式選單功能：「確認選擇結果是否搜尋正確」
- Category 字體類別選擇：「確認選擇後字體是否有變化，避免出現字體未變更到」
- Save 按鈕：「確認按下 Save 按鈕後選擇結果有保存下來」
- Cancel 按鈕：「確認按下 Cancel 按鈕後選擇結果未被更動到」

自動化欄現值：`right-panel/google-fonts-panel.spec.ts（stub 版，CI 可跑）` 加上 `google-fonts-live.spec.ts（live API 契約版，在 CI 以真實網路執行）`。

## 測試了什麼

本檔為「stub 層」，以固定的 fixture `google-fonts.json` 攔截全部網路請求，讓 UI 行為完全可預測：
- `filters the font list to fonts matching the search query`：搜尋「Beta」只留下 Beta Serif，其餘字卡消失。
- `shows an empty state for a nonsense search query`：輸入亂數字串時顯示「No fonts found」空狀態。
- `filters the list by the Language dropdown`：選 Japanese 後只留下含 japanese subset 的 Gamma Sans。
- `filters the list by Category`：切到 Serif chip 只留下 Beta Serif，切回後還原整份清單。
- `applies the selected font and closes the panel on Save`：選字前 Save 為 disabled；選了 Beta Serif 後按 Save，`#svg_1` 的 font-family 帶入 Beta Serif、Font 下拉同步更新。
- `discards the selection and persists nothing on Cancel`：選字後按 Cancel，font-family 維持原值不變。

## 設計理由

- Google Fonts 面板會打三個外部端點：FLUXID 的字體資料（`/api/google-fonts`）、`fonts.googleapis.com/css2`（CSS）、`fonts.gstatic.com`（TTF 二進位）。若讓 CI 直連，測試會受第三方可用度與字體清單變動影響而變得不穩定。
- **雙層設計**：本 stub 層負責驗「UI 邏輯」——搜尋、語言、類別過濾以及 Save/Cancel 的保存語意，用固定 fixture 保證每次結果一致；上游漂移（端點或回應格式變更）則交由同組的 `google-fonts-live.spec.ts` 契約層守。兩層互補：stub 層永不會不穩定、可在 CI 平行容器中執行；live 層則專門「在上游被改壞時故意失敗」。
- `navigator.onLine` 在 Cypress 中恆為 true，面板會直接渲染連線狀態的 UI，不需額外接線。
- CSS stub 回傳空但格式正確的 stylesheet，讓 `<link> onload` 觸發、字體「載入成功」；二進位 stub 回傳空 body，只有選字時才會被請求。

## 充分性分析

- 五列測試表意圖（搜尋、語言、類別、Save、Cancel）逐一對應到獨立的測試案例，覆蓋充分。
- 空狀態測試是測試表「不會出現非預期結果」的加分覆蓋。
- 缺口：真實網路契約（欄位形狀、Roboto 是否存在）不在本層，由 live 層負責，屬預期的分工，非缺陷。
- 樣式與字體實際外觀的渲染（像素）E2E 無法驗證，屬人工，測試表也未要求。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。

## 待確認問題(Open Questions)

- google-fonts-live 目前會在 PR 的 CI 以真實網路執行；若日後偶發不穩定，是否改到 nightly 執行？（詳見 live 檔的 note；本 stub 層不受影響。）
