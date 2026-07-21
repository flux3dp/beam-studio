# Note of depth-mode.spec.ts

## 對應測試表項目

- 第 90 列「深度模式選項（2.4.0 新增）是否正常 — 使用點陣圖，要選擇『漸層』時才可以選，確認是否多了『最小功率』選擇 (JPG v PNG)，挑一機型即可」。

## 測試內容 — 逐案說明

- `shows Min Power for a JPG with gradient + Depth Mode on and commits the value`：匯入 map.jpg（預設 data-shading=true）→ 確認漸層開啟時出現 Depth Mode 選項 → 開啟 Depth Mode（image 變為 data-pwm=1）→ config 面板出現「Depth Mode Power Settings」入口 → 開啟後設定 Min Power=10、存檔、重開後驗證數值已存入圖層。
- `does not offer Depth Mode / Min Power when gradient is off (JPG)`：匯入 map.jpg → 關閉漸層（data-shading 變為 false）→ 出現 Threshold brightness、Depth Mode 選項消失 → config 面板也沒有 Depth Mode Power Settings 入口（Min Power 不存在）。
- `offers Min Power identically for a PNG with gradient + Depth Mode on`：以 flux.png 重跑第一案（Min Power=8），證明測試表「(JPG v PNG)」所指的兩種點陣圖格式行為一致。

## 設計理由

- **已驗證的確切啟用條件**（source 已確認 `ImageOptions/index.tsx` 第 126–143 行）：只有在 `isGradient`（`data-shading === 'true'`）**且非 Promark** 機型時，才會 render `PwmBlock`（即 Depth Mode）；漸層關閉時改 render `ThresholdBlock`，此時 Depth Mode 選項根本不存在。故測試以「漸層開啟 → 有 Depth Mode／漸層關閉 → 有 Threshold、無 Depth Mode」的正負兩面鎖住此條件。
- 開啟 Depth Mode 只做一件事：在 `<image>` 上設 `data-pwm="1"`（PwmBlock.tsx）；這會讓 `checkPwmImages()` 為真，才在 config 面板的 PowerBlock 顯示「Depth Mode Power Settings」圖示，點開的 AdvancedPowerPanel 中唯一 enabled 的 InputNumber 就是 Min Power（Max 被 disable 並綁定圖層功率）。測試以「唯一非 disabled 的 input」selector 精準鎖定 Min Power。
- desktop 版的 Depth Mode／Gradient 開關沒有 id（id 只在 mobile 的 ObjectPanelItem 上），故改用 label 文字定位該選項列。
- Min Power 使用 10 與 8（低於預設圖層功率 15，因為 Max 被夾到圖層功率），避免被夾住而導致斷言失敗。

## 充分性分析

- 完全對應測試表意圖：漸層才啟用、確認多了 Min Power、JPG 與 PNG 一致，並加上「送出後重開仍在」的持久化驗證，強度高於手測列所要求。
- 未涵蓋（合理）：Min Power 上限被夾到圖層功率的邊界行為、AdvancedPowerPanel 其他欄位、Promark 的 DepthBlock 路徑（見待確認問題）。
- 結論：對非 Promark 點陣圖的深度模式意圖覆蓋充分。

## 本次改進

無。經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）

- Promark 機型走的是 `DepthBlock` 而非 `PwmBlock`（source 第 127–130 行），且僅限 desktop。測試表說「挑一機型即可」，本 spec 選了非 Promark。測試表是否也想涵蓋 Promark 的 DepthBlock 深度行為？若是，需另寫一支選用 Promark workarea 的 spec；建議由測試負責人確認範圍。
