# Layer (layer)

## 本分類測試範圍
驗證圖層（Layer）的建立與管理行為，包含新增圖層（位置與色票）、新增物件是否落在當前選取的圖層、圖層是否記住自己的參數、顯示／隱藏圖層、合併選取圖層、搬移物件到別的圖層（顏色與參數是否跟隨）、複製圖層、鎖定圖層、拖曳排序、向下合併與全部合併的顏色規則，以及不同模組頭圖層合併時的提醒 pop-up。也涵蓋「限制上限速度」偏好開啟時，純路徑元素的速度限制警告（20 mm/s，Beambox II 為 50 mm/s）。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| right-panel/layer-panel-basic.spec.ts | Cypress E2E | 新增圖層（位置／色票）、顯示隱藏、合併選取圖層、複製圖層（色票一致、copy 命名） | 既有 |
| right-panel/layer-panel-operations.spec.ts | Cypress E2E | 鎖定圖層（鎖頭符號、鎖後不可編輯）、拖曳排序、向下合併與全部合併的顏色規則 | 既有 |
| move-element.spec.ts | Cypress E2E | 新增物件落在當前圖層、圖層記住參數、搬移物件（顏色／參數跟隨、多選搬移） | 既有 |
| Ador-layer.spec.ts | Cypress E2E | 不同模組頭的圖層合併時，依結果跳出不同的提醒 pop-up | 既有 |
| right-panel/speed-limit-warning.spec.ts | Cypress E2E | 純路徑圖層的速度限制警告：Beambox 20 mm/s、Beambox II 50 mm/s；閾值兩側、向量 vs 點陣圖分支 | Claude 自動產生 (2026-07) |

## 尚未自動化項目
- 本分類的測試表項目皆已有自動化覆蓋，無完全未自動化的項目。
- 次要缺口（非阻斷性）：speed-limit-warning 目前只覆蓋「限制上限速度」偏好開啟（預設）的分支，尚未覆蓋「偏好關閉後純路徑不再被限速」的路徑。詳見 notes/Note of speed-limit-warning.spec.ts.md 的待確認問題。

## 交互參照
- Ador-layer.spec.ts 亦覆蓋 Ador Layer 分類的模組切換提醒 pop-up 相關項目。
- right-panel/layer-panel-operations.spec.ts 亦被檔案操作分類的右鍵選單項目與 Ador Layer 分類的刪除圖層項目引用。
