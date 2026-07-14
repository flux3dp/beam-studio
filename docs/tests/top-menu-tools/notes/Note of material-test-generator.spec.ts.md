# Note of material-test-generator.spec.ts

## 對應測試表項目
- 材質測試工具：「選擇不同參數於欄、列，確認是否可以匯出、匯出內容是否正確」
- Agent Status 欄：「可自動化（Tier A）：Cypress 驗證欄列參數與匯出內容；另以 Jest 測 generateSvgInfo.ts（純邏輯，目前無測試）」
- 對應 spec：`top-bar/material-test-generator.spec.ts` 加上 Jest `MaterialTestGeneratorPanel/generateSvgInfo.spec.ts`（已完成、通過）

本 Cypress spec 負責「欄列轉為實際 SVG 元素、圖層、匯出」的整合面；純數列邏輯由 Jest `generateSvgInfo.spec.ts` 覆蓋。

## 測試了什麼
- `updates the block/text preview when row and column counts change`：改欄數／列數後預覽即時重算。3 欄×2 列產生 6 個 `P<n>-S<n>` 方格圖層，Frame／Info 圖層存在，Info 內的文字標籤數等於「2 個軸標題＋欄數＋列數」；再改成 2×4 產生 8 格、文字數對應更新。
- `exports the generated grid, its labels and layers onto the canvas`：3×3 匯出後對話框關閉，畫布落下 9 個方格圖層（各帶 `data-strength`／`data-speed`，且各有 1 個 rect），Frame／Info 圖層保留，Info 文字數為 2＋3＋3＝8，右側 LayerList 也列出。
- `changing the speed/strength range changes the generated per-layer params`：把強度範圍設為 40..80、速度設為 50..150 後匯出，實際落到方格圖層上的 strength／speed 最小／最大值等於所設端點，且每格值都落在區間內。

## 設計理由
- 固定使用 beamo 工作區：讓表格速度上限已知且穩定，避免不同機型參數上限造成夾制期望值飄移。
- 以圖層 `<title>` 的命名規則 `P<strength>-S<speed>` 與群組上的 `data-strength`／`data-speed` 屬性做斷言，結構化、可讀，完全不碰像素，符合本專案規範。
- 方格數等於「欄數×列數」、文字數等於「2＋欄＋列」，是最容易被差一（off-by-one）破壞的計數，直接用它當作 UI 展開正確性的鎖。
- `setByTestId` 用 `{selectall}...{enter}`：enter 觸發 antd InputNumber 的提交與夾制並移走焦點，取代 blur，避免舊值殘留。

## 充分性分析
- 就測試表「選擇不同參數於欄列、可否匯出、匯出內容正確」而言已充分：欄列即時重算、匯出落地、掃描軸（strength／speed）端點與區間、圖層／文字／Frame 結構全數覆蓋。
- 第 62 行 bug 約束：`generateSvgInfo.ts` 第 62 行把 staticParams 陣列展開進物件，導致 repeat 等固定參數落在數字索引鍵（`r[0].repeat`）而非頂層 `r.repeat`（已知、修復進行中）。本 spec 因此刻意只斷言被掃描的軸參數（strength／speed），不對每格斷言固定參數（repeat／frequency 等）的靜態值，避免把 bug 行為寫死進期望。待修復落地後，可再補「每格帶齊具名固定參數」的斷言。
- 分工：純數列的內插／取整／命名由 Jest `generateSvgInfo.spec.ts` 手算逐格鎖住；本 spec 不重複純數學，只驗整合。
- 刻意未涵蓋：各機型 TableSetting 參數集組成，由 `TableSetting.spec.ts` 覆蓋。

## 本次改進
無，經檢視後判斷現有測試已足夠。（在第 62 行 bug 未修前，避開固定參數斷言、只鎖掃描軸與結構，是正確且穩健的選擇。）

## 待確認問題（Open Questions）
- 待第 62 行 bug 修復後，固定參數（repeat／frequency）應以具名頂層欄位出現在每格；屆時是否要在本 spec 補「每格固定參數具名且值正確」的斷言？需先確認修復後的預期形狀。
- 測試表未指明哪些欄列參數組合最關鍵。目前以 strength × speed 為主；Promark 等機型的 frequency × pulseWidth 是否為高風險組合而需另建值域案例？
