# Ador Layer (ador-layer)

## 本分類測試範圍
驗證 Ador 機型特有的圖層行為，包含列印圖層（單色圖層、彩色圖層展開成 CMYK 單色圖層）、雷射圖層依顏色分層與調色、刪除圖層（至少保留一層）、預噴區顯示邏輯、彩色圖層與單色圖層互相切換及命名規則、彩色圖層展開成色板後可增修物件，以及圖層／物件在列印頭與雷射頭之間切換時跳出的提醒 pop-up。也涵蓋匯入 SVG 時依圖層／顏色／不分層的 pop-up，以及跨機型（Ador vs B 系列）匯入 Beam／BS 檔時的圖層與工作區域切換。部分項目需 FLUXGhost 才能執行。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| printing-layer-color.spec.ts | Cypress E2E | 列印圖層（單色／彩色展開 CMYK）、預噴區、彩色↔單色切換與命名、展開色板後增修物件 | 既有 |
| right-panel/layer-panel-operations.spec.ts | Cypress E2E | 刪除圖層、至少保留一層 | 既有 |
| Ador-layer.spec.ts | Cypress E2E | 列印↔雷射圖層／物件切換時的提醒 pop-up | 既有 |
| upload.spec.ts | Cypress E2E | 跨圖層／跨機型匯入 Beam／BS 檔時的圖層與工作區域切換 | 既有 |
| Svg-Pdf-ai.spec.ts | Cypress E2E | 測試表原列出的雷射圖層調色與列印頭分層檔名 | 既有（實際檔案為下方 right-panel/svg-pdf-ai.spec.ts） |
| right-panel/svg-pdf-ai.spec.ts | Cypress E2E | 依圖層／依顏色分層、改物件色與改圖層色、列印頭彩色圖層、layering pop-up；需 FLUXGhost，CI 自我略過，以 `pnpm run cy:fluxghost` 於本地執行 | Claude 自動產生 (2026-07) |

## 尚未自動化項目
- **匯入 SVG 選擇雷射頭，選擇依據圖層／顏色／不分層的 pop-up，確認匯入後圖案正確**：測試表未填自動化檔名，目前無對應覆蓋。相近的列印頭 layering pop-up 已由 right-panel/svg-pdf-ai.spec.ts 覆蓋，但雷射頭「依圖層／顏色／不分層」的完整分支尚未自動化（需 FLUXGhost 本地環境）。

## 交互參照
- right-panel/svg-pdf-ai.spec.ts 為跨分類 spec，同時覆蓋：檔案操作分類「匯入 SVG 時的模組選擇 pop-up (Ador)」，以及右側物件面板分類「SVG 依圖層分層後修改圖片顏色」。該 spec 的 note 位於本分類（docs/tests/ador-layer/notes/Note of svg-pdf-ai.spec.ts.md）。註：note 內描述改物件色的那一列，於測試表中實際屬於「右側物件面板」分類，而非 Ador Layer。
- Ador-layer.spec.ts 亦被 Layer 分類的「不同模組頭圖層合併」項目引用。
