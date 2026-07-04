# Note of createTriangularGeometry.spec.ts

## 對應測試表項目
- 對應「3D 曲面雕刻功能」第 381 列：「確認對焦完的 3D 網狀格是否顯示正確，超過 45 度的地方是否有顯示紅點」。
- 表中該列建議：「可自動化（A3）：>45° 紅點判斷屬純數學，Jest 測 curve-measurer/網格計算」。本檔即以純函式測試涵蓋此數學（>45° 紅點 + `maxAngle` 計算）；網狀格實際顯示本身維持人工/A3 元件測試。

## 測試了什麼
- `setGeometryAngleAlertColor`：
  - `returns the max plane angle and paints only >45° faces with the alert (red) color`：對 0°/30°/60° 三面組成的幾何，回傳 `maxAngle ≈ 60`；0° 與 30° 面所有頂點維持白 `[1,1,1]`，只有 60° 面三頂點上警示紅色 `[1, 2/3, 2/3]`。
  - `respects a custom angle threshold`：門檻設 25 時，30° 面也被標成警示色。
  - `reports 0 and keeps everything white for a flat mesh`：純平面回傳 0 且全白。
- `interpolateTriangles`：
  - `returns triangles unchanged when every 2D edge is within the limit`：所有 2D 邊長在限值內時原樣回傳。
  - `subdivides until every 2D edge is within the limit while preserving the z profile`：以限值 2.5 細分後，每個三角形所有 2D 邊長 ≤ 2.5，且所有頂點仍落在 z = x 平面上（中點細分不彎曲表面）。

## 設計理由
- 紅點判斷與 `maxAngle` 是純幾何數學，最適合以純函式單元測試釘死，無需 3D 渲染或實機對焦。
- 以精心構造的傾角（用 `Math.tan(π/6)`、`Math.tan(π/3)` 造出精確 30°/60°）驗證角度計算正確，並以 `toBeCloseTo` 容忍浮點誤差。
- injection-verified 不變量：
  - 「只有 >45° 面才上色」逐頂點檢查（0–5 白、6–8 紅）能抓「門檻比較寫錯方向 / off-by-one / 把整批都上色」等 bug；自訂門檻 25 的案例確保 `angleThreshold` 參數真的被使用，而非寫死 45。
  - `interpolateTriangles` 的「保留 z 剖面」不變量（所有頂點 `p[2] ≈ p[0]`）抓中點細分算錯導致表面彎曲的 bug——這種 bug 邊長條件仍會通過，唯有檢查 z 剖面才抓得到。搭配「每條 2D 邊長 ≤ 限值」的終止條件，共同確保細分既正確又收斂。
- 以 `jest.mock('delaunator')` stub 掉 ESM-only 且本測試未用到的 `Delaunator`（僅 `createTriangularGeometry` 用），避免 ts-jest 轉譯問題。

## 充分性分析
- 對兩個純函式的角度數學、上色門檻、細分收斂與 z 剖面保留覆蓋充分且以不變量加固。
- `createTriangularGeometry` 主函式（Delaunay 三角化 + UV + 索引 + 法線）未直接測試，因 `Delaunator` 被 stub；但其核心可測部分（`interpolateTriangles`、`setGeometryAngleAlertColor`）已獨立涵蓋。
- 實際 3D 網狀格顯示、對焦流程、`curve-measurer` device 錯誤路徑等在元件/helper 層，非本純函式範圍，未於此涵蓋（表中該列 mesh display 亦標示維持人工/A3）。
- 結論：以 >45° 紅點數學與細分邏輯而言足夠。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## Open Questions
- 45° 門檻在 source 中是 `setGeometryAngleAlertColor` 的預設參數（`angleThreshold = 45`）。此 45 是否為應集中於 config 的產品常數（各機型/模組是否可能不同）？目前散落在函式預設值，若未來需依機型調整，建議抽到設定。請產品確認 45 是否為固定產品常數。
