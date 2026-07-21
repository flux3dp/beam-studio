# 檔案操作 (file-operations)

## 本分類測試範圍
驗證各種檔案的匯入與匯出是否正確，包含 JPG／PNG／SVG／AI／PDF／DXF 等格式匯入後能否正確轉成 Fcode 或還原成正確的 `#svgcontent` 內容，以及儲存、另存新檔、匯出（BVG／SVG／PNG／JPG 等）等流程。也涵蓋新增（清空）檔案、從桌面拖曳匯入 .beam 場景檔，以及「最近使用檔案」等檔案管理功能。部分項目（如 Ador 匯入時的模組選擇 pop-up、保留相機預覽結果）需要 FLUXGhost 或實機才能完整驗證。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| upload.spec.ts | Cypress E2E | JPG／PNG 匯入轉 Fcode、DXF 匯入 | 既有 |
| canvas/upload-with-machine.spec.ts | Cypress E2E | SVG（路徑／填充／漸層／點陣）、AI、PDF 匯入後 `#svgcontent` 內容正確；需本地機器／FLUXGhost，CI 以 envType 略過 | 既有 |
| file.spec.ts | Cypress E2E | 儲存、另存新檔、匯出（BVG／SVG／PNG／JPG 及各種 SVG 內容） | 既有 |
| image.spec.ts | Cypress E2E | 匯入點陣圖並取消漸層後可將圖片向量化 | 既有 |
| top-bar/recent-files.spec.ts | Cypress E2E | 從桌面拖曳匯入 .beam 場景檔並還原內容；「最近使用」在 web 版為 Electron 專屬，以帶說明的 skip 記錄 | Claude 自動產生 (2026-07) |
| top-bar/new-file.spec.ts | Cypress E2E | 新增檔案：清空畫布加上「是否儲存」確認 pop-up（CI 可跑） | Claude 自動產生 (2026-07) |
| right-panel/svg-pdf-ai.spec.ts | Cypress E2E | Ador 匯入 SVG 時的模組選擇 pop-up；需 FLUXGhost，以 `pnpm run cy:fluxghost` 於本地執行 | Claude 自動產生 (2026-07) |

## 尚未自動化項目
- **匯入 SVG 檔時跳出選擇雷射頭或列印頭的 pop-up (Ador)**：需 FLUXGhost。模組選擇 pop-up 部分已由 right-panel/svg-pdf-ai.spec.ts 覆蓋，但須在本地 FLUXGhost 環境執行（CI 沒有 FLUXGhost）。
- **新增檔案功能（保留相機預覽結果）**：清空畫布與「是否儲存」pop-up 已由 top-bar/new-file.spec.ts 於 CI 覆蓋；但「相機預覽結果保留」需連接實機（本地測試環境）才能驗證。
- **Open recent Project 功能（檔案 > 最近使用）**：web 版無法自動化，因為「最近使用檔案」為 Electron 專屬（證據記錄於 top-bar/recent-files.spec.ts 檔頭）。屬平台限制，交由桌面版發版檢查清單處理。

## 交互參照
- right-panel/svg-pdf-ai.spec.ts 同時覆蓋 Ador Layer 分類（module popup、依圖層／依顏色分層、彩色圖層等）與右側物件面板的改色項目。詳見 ador-layer/Summary.md 與該 spec 的 note（docs/tests/ador-layer/notes/Note of svg-pdf-ai.spec.ts.md）。
