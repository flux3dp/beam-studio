# Note of generateSvgInfo.spec.ts

## 對應測試表項目
材質測試工具，對應列：
- 「材質測試工具 / 選擇不同參數於欄、列，確認是否可以匯出、匯出內容是否正確」
- Agent Status：「可自動化（Tier A）：Cypress 驗證欄列參數與匯出內容；另以 Jest 測 generateSvgInfo.ts（純邏輯，目前無測試）」
- 對應 spec：「top-bar/material-test-generator.spec.ts + Jest MaterialTestGeneratorPanel/generateSvgInfo.spec.ts (done, passing)」

本 spec 專責「欄／列參數展開成方格內容」的純邏輯，即 sheet「匯出內容是否正確」的資料來源。

## 測試了什麼
- 產生 colCount × rowCount 個項目（3×4 → 12 格）。
- 欄軸（strength）與列軸（speed）的數列遞進正確，含 ceil 取整（強度 15 / 58 / 100；速度 20 / 115 / 210 / 305 / 400）。
- static 參數（repeat）以其 default 值附加（記錄此值目前落在數字索引鍵下——見下方 bug 說明）。
- name 依 namingMap 編碼欄／列值（strength→P、speed→S，例 `P15-S20`）。
- 軸的指派依 `selected` 欄位而非參數名：把 speed 設 selected 0、strength 設 selected 1，名稱與數值即隨之對調（`S20-P15`…）。
- 邊界值恰為各軸的 min 與 max。
- 單格軸（count=1）塌縮為 min 值，不發生除以零（`i/(length-1)` 的退化保護）。
- fillInterval 四捨五入到小數 4 位，同時整數參數仍走 ceil（0.01 / 0.505 / 1），其餘 static 參數保留 default。

## 設計理由
- 這是材質測試最容易出錯的純數學：線性內插 + 取整 + 命名。手算出每個級距再逐一 `toEqual`，任何把 `length-1` 寫成 `length`、`ceil` 改 `floor`、或 min/max 相減方向錯的變異都會失敗——已通過 mutation 驗證。
- 「依 selected 而非參數名決定軸」的對調 case 很關鍵：它證明使用者在 UI 把任一參數拖到欄或列都能正確運作，直接對應 sheet「選擇不同參數於欄、列」。
- count=1 的除零保護 case，防止使用者只設一欄一列時整個匯出崩潰。
- fillInterval 的 4 位四捨五入 vs 其他參數 ceil 的分支對照，鎖住兩種取整規則不被混用。

## 充分性分析
- 對「欄列展開與命名純邏輯」而言充分：格數、雙軸遞進、命名、軸指派、邊界、除零、兩種取整全數覆蓋，敘述／分支覆蓋率 100%（實測 8 tests、Statements/Branches 100%）。
- 刻意不涵蓋：實際 SVG 元素的產生、圖層與匯出檔案內容——那是 Cypress top-bar/material-test-generator.spec.ts 的責任；本 spec 只驗證餵給繪圖的資料表。
- 刻意不涵蓋：TableSetting 各機型的參數集組成——由 TableSetting.spec.ts 覆蓋。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。
說明：generateSvgInfo.ts 第 62 行 `...staticParams.map(([key, value]) => ({ [key]: value.default }))` 將「陣列」展開進物件，導致 static 參數（如 repeat）落在數字索引鍵（`r[0].repeat`）而非型別 `SvgInfo` 宣告的頂層 `r.repeat`。這是已知、修復進行中的 source bug。本 spec 採取正確做法：以 `(r as any)[0].repeat` 斷言「現況實際輸出」而非期望值，如實記錄行為、不掩蓋 bug、也不搶先改 source（依規則不得改 source）。待修復落地後，斷言應改為 `r.repeat`。

## Open Questions
- line-62 bug 修復進行中：修好後 static 參數（repeat、frequency 等）應以頂層具名欄位（`r.repeat`）出現在每一格。屆時是否要求「每格都帶齊所有 static 參數的具名欄位」？本 spec 的第 63、134 兩個 case 需同步從 `r[0].repeat` 改為 `r.repeat`——請人工確認修復後的預期形狀後再更新。
- sheet 只說「選擇不同參數於欄、列」，未指明哪些參數組合最關鍵（例如 Promark 的 frequency×pulseWidth 是否為高風險組合）。目前 case 以 strength×speed 為主，是否需針對特定高風險機型組合補值域 case？
