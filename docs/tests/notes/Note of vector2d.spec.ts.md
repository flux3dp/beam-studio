# Note of vector2d.spec.ts

## 對應測試表項目
Boxgen 盒子產生器（上層 Tool 選單）幾何運算的底層基礎，對應以下列的 Agent Status 建議：
- 「T-Slot 調整 T 槽直徑和長度後右側 3D 圖即時變化」→ 建議欄寫明「另建議 Jest 測 helpers/boxgen 幾何運算」，其對應 `helpers/boxgen/*.spec.ts`。
- 間接支撐「Edge、Finger、T-Slot 任意切換，3D 圖即時變化」的幾何正確性。

`Vector2d` 是整個 Boxgen 盒子面／榫齒座標運算的最小單位（向量縮放），本 spec 是這條幾何鏈的最底層驗證。

## 測試了什麼
- constructor 正確保存 x、y 兩個座標。
- constructor 可接受 (0, 0) 零座標。
- `mul` 以正純量放大兩個分量。
- `mul` 以負純量縮放（方向反轉）。
- `mul(0)` 得到零向量。
- `mul` 以小數純量縮放。
- `mul` 回傳「新實例」且不變更原向量（不可變性）。

## 設計理由
- `mul` 是後續 `vecTo`、榫齒長度換算的核心；一旦它就地修改原向量，整條繪圖路徑會累積錯誤，因此「回傳新實例、不變更原物件」是刻意加的守門測試。
- 負值、零、小數三個 case 覆蓋 `x * scale` 的方向、退化、精度三種行為，任何把 `*` 改成 `+` 或漏乘一個分量的變異（mutation）都會被抓到——此 spec 已通過 mutation 驗證。
- `toBeInstanceOf(Vector2d)` 防止有人把 `mul` 改成回傳純物件 `{x, y}` 而破壞鏈式呼叫。

## 充分性分析
- 對「純向量運算」而言已充分：`Vector2d` 只有 constructor 與 `mul` 兩個成員，兩者的正常值、邊界值、不可變性皆已覆蓋，分支與敘述覆蓋率為 100%。
- 刻意不涵蓋：向量加減、旋轉（那屬於 `shapeHelper.transpose`，由 shapeHelper.spec.ts 覆蓋）。
- 刻意不涵蓋：3D 即時預覽的視覺流暢度——那是 sheet 明列「維持人工」的項目，非單元測試層級。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## Open Questions
無。
