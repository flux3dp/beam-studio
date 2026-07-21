# Note of dimension.spec.ts

被測檔案：`packages/core/src/web/app/components/dialogs/autoFit/AlignModal/dimension.ts`（`calculateDimensionCenter`：由左上角座標加上寬高與旋轉角，算出旋轉後的中心點）

## 對應測試表項目

對應「自動對位（2.3.9 新增）是否正常」這一列的底層幾何 helper。此函式是 `apply.ts` 位移計算的基石（見 apply note 的位移計算），間接支撐步驟 6–7 的定位正確性。

## 測試內容 — 逐案說明

- **rotation=0**：回傳幾何中心 `(x+w/2, y+h/2)`。
- **90°**：cos0/sin1 → centerX = -height/2、centerY = width/2（(-20, 50)）。
- **180°**：cos-1/sin0 → centerX = x - width/2、centerY = y - height/2。
- **任意角＋偏移原點**（30°，x=100，y=200）：手算常數 (120.9807621, 223.660254)。
- **旋轉方向（y 向下、順時針）**：-90° 時 cos0/sin-1 → x = x0 + height/2、y = y0 - width/2（(20, -50)）。

## 設計理由 — 為何適合單元測試

- 純函式、無副作用、無外部依賴，是幾何計算的教科書式單元測試目標。
- 經 mutation review 後確認本 spec 已具備以下重點：
  - **手算常數（非公式回算）**：任意角案例的 (120.98…, 223.66…) 是人手帶入計算，若實作把 sin/cos 對調或符號翻轉，測試會抓到；若改用同一條公式回算則會一起錯。
  - **y 向下、順時針方向** 明確有一個案例釘住（-90° 的符號），可攔截「座標系方向搞反」。
  - 四個象限式角度（0/90/180/-90）加上一個任意角，涵蓋 sin/cos 的正負組合，可攔截任一項符號 mutation。

## 充分性分析

- 對此純函式而言已充分（statements 100%、branches 100%）。無需 E2E，也無機器或人工相依。
- 唯一「更上層」的正確性（此中心點在真實畫布上是否對應正確的視覺中心）由 `apply.spec.ts` 與實機驗證涵蓋，不屬本檔責任。

## 本次改進

無。經檢視後判斷現有測試已足夠（5 案全數通過，覆蓋率滿分）。

## 待確認問題（Open Questions）

無。
