# 路徑預覽 (path-preview)

## 本分類測試範圍
涵蓋路徑預覽模式的播放與顯示行為，包含：正常播放路徑與圖片、匯入尚未分解的 SVG 路徑預覽、播放暫停加速、Travel Path 與 Invert 顯示切換、預覽模式內縮放畫布、Start Here（從這裡開始）、計算時間與畫布右下角一致、進入預覽後隱藏 Undo/Redo/Delete、End Preview，以及切割雕刻順序（先內後外）。多數需要 FLUXGhost 做工具路徑計算，CI 自我略過，本機以 `pnpm run cy:fluxghost` 執行。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `top-bar/path-preview-toggles.spec.ts` | Cypress E2E（需 FLUXGhost） | Travel Path 與 Invert 切換及其繪圖旗標、預覽內縮放畫布比例一致 | Claude 自動產生 (2026-07) |
| `top-bar/path-preview-ghost.spec.ts` | Cypress E2E（需 FLUXGhost） | Start Here 存在與播放停止切換啟用、時間估算與畫布右下角以 2 秒容差一致、切割順序先內後外 | Claude 自動產生 (2026-07) |
| `Path-preview.spec.ts` | Cypress E2E | 正常播放路徑與圖片、未分解 SVG 路徑預覽、播放暫停加速、進入預覽後隱藏 Undo/Redo/Delete、End Preview | 既有 |

## 尚未自動化項目

| 項目 | 原因 |
| --- | --- |
| Start Here 的「算圖加速」隱藏分支 | web 版 `hasSwiftray` 恆為 false，隱藏 Start Here 的算圖加速偏好僅存在於 Electron，web E2E 無法覆蓋。已於 `path-preview-ghost.spec.ts` 註解說明。（Swiftray 引擎的切割順序變體已另以 `machine/swiftray-contract.spec.ts` 在協定層覆蓋，見下方清單） |
| `apps/web/cypress/e2e/machine/swiftray-contract.spec.ts` | Cypress E2E（協定契約） | Swiftray 服務契約：系統資訊、裝置列表、SVG→gcode 轉檔、切割順序先內後外（引擎層）；`pnpm run cy:swiftray` | Claude 自動產生 (2026-07) |
| WebGL 畫面像素（移動路徑線、反轉背景顏色） | 屬 shader 輸出，E2E 無法斷言，維持人工。 |
