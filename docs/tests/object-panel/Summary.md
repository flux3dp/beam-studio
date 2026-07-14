# 右側物件面板 (object-panel)

## 本分類測試範圍

本分類涵蓋編輯器右側物件面板的各項操作，包含尺寸與座標輸入、布林運算（Union／Subtract／Intersect／Difference）、位移複製、鏡像、陣列、解散路徑、路徑編輯、圖像編輯、深度模式、合併文字，以及智慧排版與自動對位等功能。絕大多數操作以 Cypress E2E 測試在畫布上驗證真實行為；自動對位因需相機取像，其第一階段取像必須連機器與 FLUXGhost，僅第二階段之後的幾何與協調邏輯以 Jest 單元測試覆蓋。樣式外觀（E2E 無法檢查）與部分需要機器的流程，維持人工驗證。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| optimize.spec.ts | Cypress E2E | 智慧排版（3.0） | 既有 |
| object-boolean-tools.spec.ts | Cypress E2E | Union／Subtract／Intersect／Difference 布林運算 | 既有 |
| select-tools.spec.ts | Cypress E2E | 位移、旋轉、縮放功能 | 既有 |
| lock-tools.spec.ts | Cypress E2E | 縮放時 Lock 鎖定長寬比行為 | 既有 |
| rectangle-tools.spec.ts | Cypress E2E | Rounded corner（僅矩形適用） | 既有 |
| infill.spec.ts | Cypress E2E | Infill 填充結果 | 既有 |
| offset-tools.spec.ts | Cypress E2E | 位移複製功能基本流程 | 既有 |
| mirror-tools.spec.ts | Cypress E2E | 鏡像功能 | 既有 |
| array-tools.spec.ts | Cypress E2E | 陣列功能（圖片、幾何圖形、路徑、文字、群組、多選） | 既有 |
| decompose-tools.spec.ts | Cypress E2E | 解散非連續路徑功能 | 既有 |
| pen-tools.spec.ts | Cypress E2E | 鋼筆繪製點兩下進入 Path Edit Mode、Path Edit 功能 | 既有 |
| modify/text-on-path.spec.ts | Cypress E2E | 路徑文字功能 | 既有 |
| printing-layer-color.spec.ts | Cypress E2E | 列印圖層物件填充及顏色調整 | 既有 |
| image.spec.ts | Cypress E2E | 漸層、替換影像、向量化、曲線、銳化、裁剪、生成斜角、色彩反轉 | 既有 |
| Disassemable.spec.ts | Cypress E2E | 匯入圖集解散圖檔（原先預設被群組） | 既有 |
| right-panel/config-panel-warnings.spec.ts | Cypress E2E | 右側輸入欄按 Enter 存值（尺寸／座標）；功率低於 10% 提示與 BB2 無此限制分支 | Claude 自動產生 (2026-07) |
| right-panel/depth-mode.spec.ts | Cypress E2E | 深度模式：漸層點陣圖才啟用「最小功率」，JPG 與 PNG 一致 | Claude 自動產生 (2026-07) |
| modify/offset-result.spec.ts | Cypress E2E | 位移複製結果正確性（向內／向外距離、複合路徑只跟最外框、向量/點陣/文字） | Claude 自動產生 (2026-07) |
| modify/weld-text&path.spec.ts | Cypress E2E | 合併文字為單一 path，及解散非連續路徑後拆回多子路徑 | Claude 自動產生 (2026-07) |
| right-panel/svg-pdf-ai.spec.ts | Cypress E2E | SVG 依圖層分層後修改圖片顏色（需 FLUXGhost，CI 自動略過） | Claude 自動產生 (2026-07) |
| autoFit.spec.ts | Jest 單元測試 | 自動對位進入點協調邏輯（守門、進度條、快取、錯誤處理） | Claude 自動產生 (2026-07) |
| apply.spec.ts | Jest 單元測試 | 自動對位套用：主件縮放／旋轉／位移，及依輪廓複製定位 | Claude 自動產生 (2026-07) |
| dimension.spec.ts | Jest 單元測試 | 自動對位底層幾何 helper（旋轉後中心點計算） | Claude 自動產生 (2026-07) |
| dockableStore.spec.ts | Jest 單元測試 | 右側可停靠面板顯示狀態 store（預設值、獨立複本、選擇性通知） | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/right-panel/text-to-path-web-font.spec.ts` | Cypress E2E | Web 字型（Noto Sans/Fira Sans）轉路徑 + 複製>原地貼上>轉路徑，bbox 容差驗證與顯示一致（發現顯示/轉換字型來源差異約 2.5%，見 bugs/） | Claude 自動產生 (2026-07) |
| `packages/core/src/web/helpers/convertToPath.spec.ts` | Jest 單元測試 | 文字轉路徑邏輯：單一/批次轉換、revert 復原、取消短路、字型替換警告閘門（10 個測試） | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/right-panel/image-edit-panel.spec.ts` | Cypress E2E | Edit Image 全視窗編輯器：橡皮擦/魔術棒/圓角、undo/redo、套用後影像變更、取消不變（6 個測試） | Claude 自動產生 (2026-07) |

### 特別說明

- **config-panel-warnings.spec.ts 的功率警告部分屬跨分類**：其「功率低於 10% 提示」對應第 195 列，該列歸於 Presets & Parameters（參數與預設值）分類。此處仍列出並註明跨分類，方便交叉查閱。
- **autoFit / apply / dimension 三個 Jest 單元測試對應「自動對位（2.3.9 新增）是否正常」列的邏輯層**：該列標註 Need FLUXGHOST，第一階段相機取像需連機器；這三支測試覆蓋的是取像之後的協調與幾何邏輯（進入點協調、套用位移、中心點計算）。
- **dockableStore.spec.ts 無對應表列（基礎邏輯）**：`dockableStore` 是右側面板停靠狀態的基礎邏輯，測試表中無單一對應列。

## 尚未自動化項目

| 測試表項目 | 狀態與原因（依 CSV） |
| --- | --- |
| 確認右側物件面板樣式是否正確 | 維持人工。樣式檢查 E2E 無法涵蓋（表內已註明）；不建議導入視覺回歸工具（成本高、涵蓋案例少）。 |
| ~~文字轉路徑（Web 字型轉路徑、複製＞原地貼上＞轉路徑）~~ | **已補齊（2026-07-04）**：`text-to-path-web-font.spec.ts`（E2E）+ `convertToPath.spec.ts`（Jest），見上方清單。 |
| ~~圖像編輯（確認圖像編輯各功能可正常使用） ~~ | **已補齊（2026-07-04）**：`image-edit-panel.spec.ts`，見上方清單。 |
| 自動對位（2.3.9 新增）是否正常 — 第一階段相機取像 | 需 FLUXGhost 與機器。維持本地執行（CI 無 FLUXGhost，勿在 GitHub Actions 執行），納入發版前本地測試批次。相機取像品質與工件形狀辨識準確度需機器與人工驗證；取像後的邏輯已由 autoFit／apply／dimension 單元測試覆蓋。 |
