# Note of CurveEngraving 元件與 curve-measurer 測試組（5 個 spec）

## 對應測試表項目

3D 曲面雕刻功能分類四列（皆為表上建議的 A3 元件測試）：

1. 「測試取得參考點失敗時，是否有跳出錯誤」
2. 「確認對焦失敗的紅點，點擊後是否有顯示錯誤原因」
3. 「確認點擊對焦點時，是否可重新測量」
4. 「完成對焦後，再次點擊『預覽 3D 曲面』，確認是否可以預覽完成的對焦圖形」

## 測試了什麼

共 5 個 spec、25 個測試：

- **translateError.spec.ts（7）**：錯誤碼翻譯純函數 100% 覆蓋——錯誤碼解析、zh-tw 說明連結改寫、超界物件與 fallback 路徑（列 2 的錯誤原因來源）。
- **base.spec.ts（6）／red-light.spec.ts（4）**：量測器的失敗路徑——取得參考點失敗（無錯誤碼 → `failed_to_take_reference`；有錯誤碼 → 翻譯後的訊息）與區域量測失敗都會跳出錯誤（列 1）。
- **CurveEngraving.spec.tsx（5）**：點擊失敗的紅點顯示**真實** translateError 對應的錯誤原因（成功點不顯示，負向對照）（列 2）；選取點後 Re-measure 以排序後的正確索引呼叫 `remeasurePoints`、空選取停用（列 3）；量測資料在動畫完成後流轉至 3D Plane 預覽（列 4）。
- **MeasureArea.spec.tsx（3）**：量測失敗（null 結果）不觸發 `onFinished` 且控制項恢復可用（列 1 的元件邊界）；Start Autofocus 成功後把量測資料交給 `onFinished`（列 4 的入口）。

## 設計理由

- three.js 層以輕量 mock 取代（Plane mock 暴露收到的資料並把顯示點渲染成可點擊按鈕）——點選邏輯走真實元件程式碼，只有 3D 渲染被替身。
- `translateError` 刻意**不 mock**：列 2 驗證的「顯示錯誤原因」用的是真實對應表。
- 裝置層（deviceMaster、紅光量測模式）全 mock——實機對焦動作屬機器層。

## 充分性分析

- 四列的 UI/邏輯半完整覆蓋；`>45° 紅點` 數學另有 `createTriangularGeometry.spec.ts`（先前完成）。
- 誠實邊界：`curveEngravingModeController`（511 行、裝置+畫布重度耦合）僅測其暴露給元件的 `remeasurePoints` 呼叫面，內部編排維持未測（重構抽離後再補）；three.js 光線投射與紅/灰球的像素渲染不做像素斷言。
- 實機部分（負重測試、Z 軸防撞、實際對焦）維持人工，與表列的機器行為列一致。

## 本次改進

新增 5 個 spec（A3 清單項目；curve-measurer 與 CurveEngraving 元件原本零測試）。

## 待確認問題（Open Questions）

1. 測試中發現 Nx daemon 偶發卡住會拖慢/誤報套件（`pnpm nx reset` 可解）——是否納入開發文件的疑難排解？
2. `curveEngravingModeController` 的內部編排（preprocessData、邊界 SVG、歷史）值得在重構抽離純函數後補測——建議列入技術債清單。
