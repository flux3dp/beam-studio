# Bug（測試程式碼過期）：upload-with-machine.spec.ts 的列印圖層斷言與現行行為不符

- **狀態**：未解（已建立修復任務 task_a7b37885，使用者已在另一 session 開工）
- **嚴重性**：中 — 本地 rig 執行該 spec 會誤報失敗，掩蓋真正的回歸
- **檔案**：`apps/web/cypress/e2e/canvas/upload-with-machine.spec.ts`

## 問題描述

該 spec 預期「以列印模組＋依圖層分層匯入 SVG」會產生**單一**名為「Printing」的圖層。但現行版本（2026-07-04 對 FLUXGhost 2.5.4 實測）的行為是：**保留來源 SVG 的圖層名稱**，產生多個全彩圖層（`g.layer[data-fullcolor="1"][data-module="5"]`，以 `svg.svg` fixture 而言是「圖層 1」與「預設圖層」兩層）。

## 重現條件

1. 本地啟動 FLUXGhost（隨編譯版 Beam Studio 啟動即可）。
2. 以 `CYPRESS_ghostPort=<port> npx cypress run --spec 'cypress/e2e/canvas/upload-with-machine.spec.ts' --config baseUrl=http://127.0.0.1:8080,video=false` 執行（該 spec 另需實機連線，完整重現需在機器 rig 上）。
3. 列印相關斷言失敗：找不到名為「Printing」的單一圖層。

## 參考

- `right-panel/svg-pdf-ai.spec.ts` 釘住的是「現行」行為，可作為修正斷言時的對照。
- 需先確認：多圖層全彩是「新的預期行為」還是「回歸」——若是回歸，這不是測試過期而是產品 bug，處理方向相反。
