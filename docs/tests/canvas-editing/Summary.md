# 畫布編輯 (canvas-editing)

## 本分類測試範圍
驗證畫布上物件的建立與編輯行為，包含 Select 點選（單選／多選、Shift 旋轉抓角度）、文字工具（字型、字級、字距、行距、直書、填充、文字轉路徑、搜尋字體）、矩形／多邊形／直線／鋼筆等繪圖工具、元素圖案的填充與線條切換、右鍵選單各項功能、QR Code 與條碼產生、對齊、群組／解散群組，以及計算路徑、複製貼上、復原重做（Undo／Redo）等操作。絕大多數項目均以 Cypress E2E 覆蓋，並以結構化屬性驗證（`#svgcontent`、`font-family`、path 內容）取代像素比對。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| select-tools.spec.ts | Cypress E2E | Select 單選／多選、Shift 旋轉抓 0/45/90/180 度 | 既有 |
| text-tools.spec.ts | Cypress E2E | 文字繪製、字型／字級／字距／行距、直書、填充、shift+enter 換行 | 既有 |
| text-to-path.spec.ts | Cypress E2E | 文字轉路徑 | 既有 |
| rectangle-tools.spec.ts | Cypress E2E | 矩形繪製、矩形圓角 | 既有 |
| drawing.spec.ts | Cypress E2E | 多邊形繪製、鋼筆繪製 | 既有 |
| polygon-tools.spec.ts | Cypress E2E | 多邊形增減邊、手動輸入邊數、Shift 鎖定旋轉 | 既有 |
| line-tools.spec.ts | Cypress E2E | 直線繪製、Shift 鎖定 0/45/90 度 | 既有 |
| pen-tools.spec.ts | Cypress E2E | 鋼筆曲線、tCorner／tSmooth／tSymmetry | 既有 |
| Element-tools.spec.ts | Cypress E2E | 元素圖案的填充與線條切換 | 既有 |
| right-panel/layer-panel-operations.spec.ts | Cypress E2E | 右鍵選單各功能（複製、貼上、刪除、前後層、移到某圖層等） | 既有 |
| align-tools.spec.ts | Cypress E2E | 垂直均分 | 既有 |
| group-tools.spec.ts | Cypress E2E | 群組／解散群組、圖層歸屬 | 既有 |
| Path-preview.spec.ts | Cypress E2E | 計算路徑（圖片、幾何、文字、線條） | 既有 |
| copy-paste.spec.ts | Cypress E2E | 複製貼上（圖片、幾何、文字、線條） | 既有 |
| undo-redo.spec.ts | Cypress E2E | 復原重做（圖片、幾何、線條） | 既有 |
| undo-redo-text.spec.ts | Cypress E2E | 文字的復原重做（字型、字體大小） | 既有 |
| qrcode.spec.ts | Cypress E2E | 測試表原列出的 QR Code 產生檔名 | 既有（實際為幽靈項目，repo 及 git 歷史皆無此檔，已由下方 left-panel/qrcode.spec.ts 補齊） |
| search-font.spec.ts | Cypress E2E | 測試表原列出的搜尋字體檔名 | 既有（實際為幽靈項目，repo 及 git 歷史皆無此檔，已由下方 right-panel/search-font.spec.ts 補齊） |
| left-panel/qrcode.spec.ts | Cypress E2E | QR Code 容錯率（L/H 端點）、反轉背景、Barcode 產出，均落到畫布並雙向可逆驗證 | Claude 自動產生 (2026-07) |
| right-panel/search-font.spec.ts | Cypress E2E | 搜尋字體：過濾、選取後套用、空結果、重開復原 | Claude 自動產生 (2026-07) |

> 補充：packages/core/src/web/app/stores/variableText.spec.ts（Jest 單元測試）為變數文字功能 store 的測試，測試表中無直接對應列，故未列於上表；相關說明見 notes/Note of variableText.spec.ts.md。

## 尚未自動化項目
- 本分類的測試表項目皆已有自動化覆蓋，無完全未自動化的項目。
- 部分間接相關的延伸情境（如條碼「縮放後送出工作」確認檔案）需 FLUXGhost／實機，屬「上層選單工具」分類的項目，見下方交互參照。

## 交互參照
- left-panel/qrcode.spec.ts 除了覆蓋本分類的「QR Code 生成」外，也一併覆蓋「上層選單工具」分類的條碼工具項目：「匯入 QR code 及條碼，確認產出內容正確」（已覆蓋）與「縮放後送出工作確認檔案」（僅覆蓋產生內容，縮放後送工作需 FLUXGhost，未自動化）。詳見 notes/Note of qrcode.spec.ts.md。
