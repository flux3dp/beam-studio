# Note of google-fonts-live.spec.ts

## 對應測試表項目

與同組的 stub 檔共用「Google Fonts 功能」的 5 列（搜尋欄、Language 下拉、Category 類別、Save、Cancel）。
自動化欄現值：`right-panel/google-fonts-panel.spec.ts（stub 版，CI 可跑）` 加上 `google-fonts-live.spec.ts（live API 契約版，在 CI 以真實網路執行）`。

## 測試了什麼

本檔為「live 契約層」，完全不 stub、直接打真實網路，目的是偵測上游漂移：
- `metadata API returns the field shape the app consumes (Roboto contract)`：以 `cy.request` 直接打 `https://id.flux3dp.com/api/google-fonts`，斷言回應外層（`kind` 等於 `webfonts#webfontList`、`items` 陣列超過 100 筆）以及 Roboto 中每個 app 實際會讀到的欄位（family、category 落在五類之中、subsets 含 latin、variants 含 regular、files.regular 為 gstatic URL）。
- `applies a live Google font (Roboto) to a text element end to end`：開啟面板 → 搜尋 Roboto → 選取 → Save，驗證 metadata、css2 與 gstatic 二進位整條鏈路都成功並套用到 `#svg_1`。
- `category filter still returns serif fonts from the live list`：對 live 清單切到 Serif，搜尋 Roboto Slab 確認 serif 字體仍可取得。

## 設計理由

- 契約斷言的欄位精準對應 app 的四處消費點（`googleFontsApiCache.ts` 的 findFont 與型別、`googleFontStore` 讀取 variants 與 family、`useGoogleFontData.ts` 讀取 subsets、`GoogleFontsPanel.tsx` 依 category/subsets/family 過濾）。任一欄位形狀改變就會亮紅燈，讓我們在使用者遇到問題之前先知道。
- 選 Roboto 作為漂移基準點：它是最老、最穩定的 Google 字體，不太可能消失。
- **一項需誠實揭露的關鍵發現**：Roboto 同時也存在於內建的靜態 web-font 清單（`webFonts.google.ts`）中，其 family 為小寫的 `roboto`；`handleGoogleFontSelect` 會把 family 以大小寫不敏感的方式解析到該內建項，所以套用後 `font-family` 屬性為小寫。因此斷言改用 `new RegExp('Roboto', 'i')` 大小寫不敏感比對，而非硬比字串——這是實測跑出來的真實行為，不是猜測。
- Font 下拉選中項的呈現：因為 Roboto 是內建 web font，選中項會渲染成預覽用的 `<img>`（名稱放在 alt 與 src 中）而非純文字，故斷言同時接受 text、alt、src 三者任一含有 Roboto。
- 檔頭已寫好不穩定時的排查步驟：先手動 GET metadata 端點，判斷是「真的契約被破壞」還是「第三方暫時斷線」；並刻意寫成單一自足的 describe，未來若要在 CI 上關閉，只需一行包上 `if (envType === 'github')`。

## 充分性分析

- 對測試表「搜尋、語言（subsets）、類別、Save」的意圖，本檔提供了真實網路的端到端覆蓋，且額外守住 API 契約，強於測試表的最低要求。
- 與 stub 層分工明確：可預測的 UI 邏輯歸 stub 層、上游漂移歸本層，兩者不重複、不浪費。
- 缺口：Cancel 分支只在 stub 層測（live 層不需重跑 UI 語意），屬預期分工。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。

## 待確認問題(Open Questions)

- 本檔目前在 PR 的 CI 以真實網路執行，可以接受；但若日後 css2 或 gstatic 偶發斷線造成不穩定，是否改為只在 nightly 執行？檔頭已預留一行 gate 的做法，交由人依實際的不穩定頻率決定。
