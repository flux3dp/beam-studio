# Bug（潛在）：cameraPreview store 清除失效的 pending 模式時，同樣失效的 previewMode 未被重設

- **狀態**：未解（潛在行為缺陷，需產品判斷是否為預期）
- **嚴重性**：低 — 目前 UI 流程可能不會踩到，但狀態機留有不一致窗口
- **檔案**：`packages/core/src/web/app/stores/cameraPreview.ts`（`supportedPreviewModes` 的 subscribe 邏輯）

## 問題描述

`supportedPreviewModes` 變動時的調和（reconciliation）邏輯是一組 `if / else if`：

1. 若 `pendingPreviewMode` 不再受支援 → 清除 pending；
2. **否則**若 `previewMode` 不再受支援 → 把 `previewMode` 重設為第一個支援的模式。

因為是 `else if`，當「pending 與 previewMode 同時失效」時，只有 pending 被清除；同樣失效的 `previewMode` 會留在 store 內，且清除 pending 的 `setState` 不會再次觸發此 selector（`supportedPreviewModes` 沒變），所以不會有第二次修正。

## 重現條件（單元層級）

1. 使 store 進入：`previewMode = A`、`pendingPreviewMode = B`。
2. 更新 `supportedPreviewModes = [C]`（A、B 皆不支援）。
3. 結果：`pendingPreviewMode` 被清成 `null`，但 `previewMode` 仍是不支援的 `A`。

單元測試 `cameraPreview.spec.ts` 刻意**未**釘住此行為（避免把疑似缺陷固化成規格），僅涵蓋各單獨分支。

## 待產品確認

- 兩者同時失效時，是否應在同一次事件中一併把 `previewMode` 重設為 `supported[0]`？
- 若是，修法為把 `else if` 拆成獨立判斷（新增的單元測試「no previewMode reset while a supported pending exists」已確保拆開時不會誤傷正常情境）。
