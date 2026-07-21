# Note of weld-text&path.spec.ts

## 對應測試表項目

- 第 116 列「合併文字功能是否正常 — 把數個文字當成一字元，按解散非連續路徑可能使已合併的字單獨呈現」。

## 測試內容 — 逐案說明

- `welds text characters into a single path`：建立文字「123」→ 指定內建字型 Mr Bedfort（跨平台結果具決定性）→ 以負字距 1.5em 讓字元重疊 → 按 `#weld` → 文字（#svg_1）被單一 welded path（#svg_2）取代，標題變為 Path，`d` 非空，`#svgcontent > g.layer > path` 恰為 1 個，w/h bounding box 皆大於 0。
- `decomposes the welded path into multiple sub-paths`：weld 後記錄 welded path 的 w/h → 按 `#decompose_path`（解散非連續路徑）→ 原 welded path 消失，temp-group 內產生多於 1 個 path 元素，每個都是 `<path>` 且 `d` 非空，選取時標題為 Multiple Objects，整體 bounding box 與 weld 前 closeTo（±1）。

## 設計理由

- **為何用結構性斷言加 closeTo 而非 path checksum**：weld 與 decompose 產生的 path `d` 由字型光柵器決定，會因 OS 或字型版本不同而變（spec 開頭的 PLATFORM-SAFETY 註解已言明）。若比對 md5 或 path `d`，會在不同平台的 CI 容器中變得不穩定（flaky）。故改驗「可觀察的結構事實」：元素數量、tag 名稱、`d` 非空、圖層與標題文字，以及 `cy.inputValueCloseTo` 與 `closeTo(±1)` 的 bounding-box 尺寸——這些都不受光柵器差異影響。
- 刻意選用 Mr Bedfort（永遠隨附）並設定負字距，確保字元重疊、weld 一定會把多個字元併成單一連通輪廓，讓「結果為 1 個 path」這條斷言穩定。
- decompose 後元素會被自動選取，故被包在 `g[data-tempgroup="true"]` 內，selector 針對此 wrapper 撰寫。

## 充分性分析

- 對測試表「多字合併成一字元」與「解散非連續路徑後拆回多個子路徑」兩段意圖覆蓋充分，且以平台安全的方式驗證。
- 未涵蓋：weld 結果的實際幾何正確性（哪些區域被聯集）——這被刻意排除，因為需要 path checksum，屬平台相依，house standard 也不建議做視覺或幾何的精確比對。
- 結論：以結構正確性而言足夠；幾何精確性不屬自動化範圍。

## 本次改進

無。經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）

- 測試使用重疊字元（負字距）。若 weld 的是**不重疊**的字元，預期行為為何？是聯集後留有間隙（單一 path 但含多個不相連子輪廓），還是每個字一個 path？目前 spec 未涵蓋非重疊情境，此語意值得由產品或幾何負責人釐清並補測。
