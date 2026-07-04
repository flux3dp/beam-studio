# Note of curveEngravingStore.spec.ts

## 對應測試表項目
- 對應「3D 曲面雕刻功能」區塊，尤其：
  - 第 381 列：「確認對焦完的 3D 網狀格是否顯示正確，超過 45 度的地方是否有顯示紅點」→ `maxAngle` 是此判斷的資料來源。
  - 第 384 列：「完成對焦後，再次點擊『預覽 3D 曲面』，確認是否可以預覽完成的對焦圖形」→ `hasData` 標記是否已有對焦資料，是狀態流轉的核心旗標。
- 此 store 儲存曲面雕刻的兩個關鍵狀態（是否有資料、最大傾角），支撐上述人工測試的底層狀態流轉。

## 測試了什麼
- `should have the default state on init`：初始為 `{ hasData: false, maxAngle: 0 }`。
- `should update partial state via setCurveEngravingState`：`setCurveEngravingState({ hasData: true })` 只改 `hasData`；再 `{ maxAngle: 45 }` 只改 `maxAngle`，前次改動保留（部分合併，非整體替換）。
- `should notify selector subscribers when the selected slice changes`：以 selector 訂閱 `maxAngle`，只有 `maxAngle` 變動才觸發（帶新舊值 30/0）；改 `hasData` 不觸發；`unsubscribe()` 後不再觸發。

## 設計理由
- 曲面雕刻的 UI（紅點顯示、預覽按鈕啟用）都讀取此 store，store 層測試能確認狀態機正確而不需 3D 渲染。
- 部分合併測試抓的真實 bug：若 `setState` 誤用整體替換，設定 `maxAngle` 時會清掉 `hasData`，導致「已對焦但預覽按鈕又變灰」。
- selector 訂閱測試確保 `maxAngle`（紅點門檻判斷來源）變動時精準通知，且不被無關的 `hasData` 變動誤觸。

## 充分性分析
- 對 store 的預設值、部分更新、選擇性通知覆蓋充分。
- 真正的 >45° 紅點數學與 `maxAngle` 計算不在此 store，位於 `CurveEngraving/utils/createTriangularGeometry`（見該檔 note），由其專門測試。本 store 只負責存放算好的值。
- 對焦流程、device 量測、`curve-measurer` 的錯誤路徑等皆在元件/helper 層，不在此涵蓋。
- 結論：以 store 層級而言足夠。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## Open Questions
無。
