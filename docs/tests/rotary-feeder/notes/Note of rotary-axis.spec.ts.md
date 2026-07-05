# Note of rotary-axis.spec.ts

## 對應測試表項目

旋轉軸及送料分類：「旋轉軸倍率（2.5.2 新增）— 確認旋轉軸倍率是否有正確作用（0.5倍、2倍）」的**邏輯半**。倍率換算數學本已有既有測試（`get-rotary-ratio.spec.ts`、`helpers/addOn/rotary.spec.ts`），本 spec 補的是旋轉軸線模組本體（原本零測試）；實機雕刻結果與 Y 方向長度量測維持人工。

## 測試了什麼

共 22 個測試：

- **初始化**：於 `#fixedSizeSvg` 建立軸線疊層（可見線 + 較粗的點擊目標線），重複 init 不會重複建立。
- **座標轉換**：位置設定/讀取的 px 往返、mm↔px（dpmm=10）雙向換算、小數往返、2 位小數四捨五入、`write` 旗標決定是否持久化到 `rotary-y`。
- **顯示條件**：`rotary_mode` 關閉隱藏；開啟顯示；job-origin 啟用（支援的機型上）時隱藏。
- **邊界 clamp**：`canvas-change` 與 `document-settings-saved` 事件觸發重算，超出工作範圍上下限時夾回；job-origin 啟用時退回 `[0, maxY]`。
- **拖曳生命週期**：滑鼠移動即時 clamp 且不持久化；放開時組出 `BatchCommand('Move Rotary Axis')`＋兩個 `ChangeElementCommand`（帶拖曳前的起始值）、寫入歷史一次、持久化最終位置；undo 後的 `onAfter` 重新持久化。
- 起始位置：無儲存值時預設 `maxY / 2`。

## 設計理由

- 模組以 module-scope 快取軸線元素，因此 init 在 `beforeAll` 執行一次、各測試重設位置/顯示——重建 DOM 會使快取元素成為孤兒（此侷限已在 spec 註解說明）。
- 事件驅動的邊界重算直接以真實 eventEmitter 發事件驗證，不 mock 事件層。

## 充分性分析

- 旋轉軸線的可計算行為（轉換、邊界、歷史、顯示）完整覆蓋；搭配既有倍率測試，此列邏輯半完備。
- 未覆蓋：`fpm1` 動態尺寸機型的邊界取值分支（ado1 靜態邊界已證明 clamp 邏輯）；「從儲存值讀取初始位置」的分支受 isolateModules 與central mock 交互限制，僅覆蓋 null 預設路徑（往返測試間接涵蓋讀取）。

## 本次改進

新增本 spec（A3 清單項目）。

## 待確認問題（Open Questions）

1. job-origin 啟用時旋轉軸隱藏並將邊界退回 `[0, maxY]`——這個交互是否有規格明文？測試釘住現行行為。
