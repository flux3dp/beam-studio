# Note of search-font.spec.ts

## 對應測試表項目
- 畫布編輯分類「搜尋字體功能正常」（測試表「Automation Test Status」欄原引用 search-font.spec.ts，本 spec 即補齊此檔）。

## 測試了什麼
- `filters the font list to fonts matching the search query`：開啟字體下拉選單，搜尋「Mr Bedfort」，符合的字體留下、不符的「Noto Sans」被過濾掉。
- `selecting a searched font updates the text element font-family`：搜尋後點選「Mr Bedfort」，下拉關閉、`#svg_1` 的 `font-family` 變成 `'Mr Bedfort'`，且 Font 選單顯示該字體。
- `shows an empty result state for a nonsense query`：搜尋一段亂碼查詢，沒有任何選項、顯示 Antd 的空狀態提示。
- `restores the full list when the dropdown is reopened`：以亂碼搜尋清空清單後按 Esc 關閉，重開下拉選單時恢復完整清單。

## 設計理由
- 只用 web 版一定內建的字體（`webFonts.ts` 中的 Mr Bedfort、Noto Sans）作為搜尋目標，讓結果在沒有 FLUXGhost、沒有 Google Fonts 網路 API 的情況下仍可確定性地驗證（CI 沒有後端）。
- 以選項內的 `img[alt="<字體名>"]` 作為存在性驗證，穩定且對應到下拉選單的項目。
- 搜尋輸入使用 `{ force: true }`：Antd combobox 的搜尋輸入框是一個 4px 的 `position: fixed` 元素，Cypress 會判定它被覆蓋，因此需要強制輸入（spec 內已註明）。

## 充分性分析
- 對「搜尋字體功能正常」這一列覆蓋充分：過濾、選取後生效、空結果、重開復原四個面向都測到，涵蓋正常與邊界情況。
- 與測試表意圖的落差：搜尋範圍僅限於內建字體。實際產品在有 FLUXGhost／系統字體／Google Fonts 時，搜尋範圍更大；本 spec 刻意不涵蓋那些來源，以維持 CI 的確定性。
- 判斷：可接受。「搜尋功能正常」的行為契約（過濾／選取／空結果／復原）已充分驗證；字體來源的廣度屬於環境相依，不宜在 CI 的 E2E 測試中釘死。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
- 搜尋範圍是否應納入來自 Google Fonts 的字體家族？若要，需要一個有網路／後端的受控變體 spec（在本地測試環境執行），因為 CI 無法穩定提供這個環境。
