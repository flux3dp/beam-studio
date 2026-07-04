# Note of shapeHelper.spec.ts

## 對應測試表項目
Boxgen 盒子產生器（上層 Tool 選單）幾何鏈中層，對應：
- 「T-Slot 調整 T 槽直徑和長度後右側 3D 圖即時變化」→ 建議欄「另建議 Jest 測 helpers/boxgen 幾何運算」，對應 `helpers/boxgen/*.spec.ts`。
- 「Edge、Finger、T-Slot 任意切換，3D 圖即時變化」→ 幾何切換的方向與繪圖游標正確性由此 spec 提供底層保證。

`shapeHelper` 提供四個方向常數、`transpose`（90 度旋轉）與 `Plotter`（相對／絕對繪圖游標），是 Shape.ts 繪製榫齒路徑時實際使用的畫筆。

## 測試了什麼
- Direction 四個方向常數採 y-down（y 向下為正）慣例：DOWN=(0,1)、UP=(0,-1)、LEFT=(-1,0)、RIGHT=(1,0)。
- Direction 常數為 `Vector2d` 實例。
- `transpose` 將 (x, y) 旋轉為 (y, -x)（順時針 90 度）。
- `transpose` 把 RIGHT 映射到 UP（驗證方向語意正確）。
- `transpose` 處理零向量。
- `transpose` 處理負座標。
- `transpose` 連續四次回到原點（旋轉閉合性）。
- `transpose` 回傳新實例（不變更輸入）。
- `Plotter` 游標初始在原點。
- `lineTo` 為「相對移動」，會推進游標，且 shape 路徑依序記錄每個游標位置。
- `lineTo` 累加相對移動，含負向 delta。
- `vecTo` 先用純量縮放方向向量再相對繪圖。
- `vecTo` 接受任意向量與小數純量。
- `lineToAbs` 將游標設為絕對座標。
- `lineToAbs` 之後的相對 `lineTo` 以絕對游標為基準累加。
- `Plotter` 對外暴露其建構時的 shape 物件。

## 設計理由
- 榫齒外凸／內凹路徑完全由「方向 + 相對移動」堆疊而成；若 `transpose` 旋轉方向錯誤（例如寫成 (-y, x)），整個榫齒會朝反方向長出，`maps RIGHT to UP` 這一 case 專門鎖死方向語意。
- 「連續四次 transpose 回到原點」驗證旋轉的數學閉合性，可捕捉符號錯置的變異。
- `Plotter` 的相對 vs 絕對兩套 API 是 Shape.ts 最易誤用之處；spec 用 `getPoints()` 逐點比對，任何把 `+=` 改成 `=`（相對變絕對）或漏推進游標的變異都會被抓——此 spec 已通過 mutation 驗證。
- y-down 慣例的明確斷言，防止有人「修正」成數學上習慣的 y-up 而讓整盒上下顛倒。

## 充分性分析
- 對「繪圖畫筆與旋轉」而言已充分：Direction、transpose、Plotter 的所有公開成員與相對／絕對兩種模式皆覆蓋，含零值與負值邊界。
- 刻意不涵蓋：榫齒實際幾何（xCount/yBegin/凸凹路徑）——那是 Shape.spec.ts 以手算座標覆蓋的上層責任，本 spec 只保證畫筆本身正確。
- 刻意不涵蓋：3D 渲染、預覽即時性——sheet 明列人工。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## Open Questions
無。
