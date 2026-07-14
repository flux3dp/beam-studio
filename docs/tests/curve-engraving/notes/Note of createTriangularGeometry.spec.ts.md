# Note of createTriangularGeometry.spec.ts

## 對應測試表項目

- 對應「3D 曲面雕刻功能」的「確認對焦完的 3D 網狀格是否顯示正確，超過 45 度的地方是否有顯示紅點」一列。
- 測試表對該列的建議是：「可自動化（A3）：>45° 紅點判斷屬純數學，Jest 測 curve-measurer 的網格計算」。本檔即以純函式測試涵蓋此數學（>45° 紅點與 `maxAngle` 計算）；網狀格的實際顯示本身則維持人工或 A3 元件測試。

## 測試了什麼

- `setGeometryAngleAlertColor`：
  - `returns the max plane angle and paints only >45° faces with the alert (red) color`：對由 0°、30°、60° 三面組成的幾何，回傳 `maxAngle` 約等於 60；0° 與 30° 面的所有頂點維持白色 `[1, 1, 1]`，只有 60° 面的三個頂點被上警示紅色 `[1, 2/3, 2/3]`。
  - `respects a custom angle threshold`：門檻設為 25 時，30° 面也會被標成警示色。
  - `reports 0 and keeps everything white for a flat mesh`：純平面回傳 0 且全白。
- `interpolateTriangles`：
  - `returns triangles unchanged when every 2D edge is within the limit`：所有 2D 邊長都在限值內時，原樣回傳。
  - `subdivides until every 2D edge is within the limit while preserving the z profile`：以限值 2.5 細分後，每個三角形的所有 2D 邊長都不超過 2.5，且所有頂點仍落在 z = x 平面上（中點細分不會使表面彎曲）。

## 設計理由

- 紅點判斷與 `maxAngle` 是純幾何數學，最適合以純函式單元測試釘死，不需 3D 渲染或實機對焦。
- 以精心構造的傾角（用 `Math.tan(π/6)`、`Math.tan(π/3)` 造出精確的 30° 與 60°）驗證角度計算正確，並用 `toBeCloseTo` 容忍浮點誤差。
- 兩個以注入驗證守住的不變量：
  - 「只有 >45° 的面才上色」逐一檢查每個頂點（0 至 5 為白、6 至 8 為紅），能抓「門檻比較寫錯方向」「off-by-one」「把整批都上色」等 bug；自訂門檻 25 的案例則確保 `angleThreshold` 參數真的有被使用，而非寫死成 45。
  - `interpolateTriangles` 的「保留 z 剖面」不變量（所有頂點的 `p[2]` 約等於 `p[0]`）能抓中點細分算錯導致表面彎曲的 bug——這種 bug 就算邊長條件仍會通過，唯有檢查 z 剖面才抓得到。搭配「每條 2D 邊長不超過限值」的終止條件，共同確保細分既正確又會收斂。
- 以 `jest.mock('delaunator')` 把僅支援 ESM、且本測試未用到的 `Delaunator`（只有 `createTriangularGeometry` 會用）stub 掉，避免 ts-jest 的轉譯問題。

## 充分性分析

- 對兩個純函式的角度數學、上色門檻、細分收斂與 z 剖面保留，覆蓋充分且以不變量加固。
- `createTriangularGeometry` 主函式（Delaunay 三角化、UV、索引、法線）未直接測試，因為 `Delaunator` 被 stub 掉；但其核心可測的部分（`interpolateTriangles`、`setGeometryAngleAlertColor`）已獨立涵蓋。
- 實際的 3D 網狀格顯示、對焦流程、`curve-measurer` 的裝置錯誤路徑等在元件或 helper 層，非本純函式的範圍，未於此涵蓋（測試表中該列的網狀格顯示也標示維持人工或 A3）。
- 結論：以 >45° 紅點數學與細分邏輯而言足夠。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。

## 待確認問題(Open Questions)

- 45° 門檻在原始碼中是 `setGeometryAngleAlertColor` 的預設參數（`angleThreshold = 45`）。這個 45 是否為應集中管理於 config 的產品常數（各機型或模組是否可能不同）？目前它散落在函式的預設值中，若未來需依機型調整，建議抽到設定檔。請產品確認 45 是否為固定的產品常數。
