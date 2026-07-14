# Note of speed-limit-warning.spec.ts

## 對應測試表項目
- Layer 分類「（開啟偏好設定的限制上限速度）Layer 內的物件若有純路徑元素，速度 slider 要變成偏紅（限速 20）的樣式 / 有純路徑元素速度就會固定為 20 的樣式，注意 Beambox II 速度上限是 50」
- Preference 分類「限制上限速度 — 向量路徑速度限制為 20 mm/s」

## 測試了什麼
- `shows warning when layer speed exceeds the vector speed limit`：預設機型（Beambox）畫矩形後把速度設為 150，出現警告 icon 與文字「…constrained to 20 mm/s…」。
- `hides warning when speed is lowered below the vector speed limit`：先設為 150 觸發警告，再設為 10（低於 20），警告消失。
- `shows no warning for an image-only layer even at high speed`：上傳點陣圖（非向量路徑），速度設為 150 也不出現警告。
- `uses the Beambox II (fbb2) 50 mm/s threshold`：切換到 Beambox II 後，40 mm/s（高於預設 20 但低於 Beambox II 的 50）不警告；100 mm/s（高於 50）出現警告，且文字為 50 mm/s。

## 設計理由
- 用輸入框打字（`#speed-input` 清空 → 輸入 → blur）而非拖曳 slider：拖曳 slider 需要計算像素座標、對速度區間又是非線性，且跨平台不穩定；直接設值可精準命中閾值邊界（10／40／100／150），符合本專案不做樣式／像素驗證的原則。
- 「偏紅的樣式」不以顏色驗證（沒有視覺回歸工具），改以警告 icon／文字的有無加上文字內容作為確定性的替代指標。
- Beambox II 分支同時驗證「40 不警告、100 警告」兩側，釘住提高後的 50 mm/s 這個閾值。

## 充分性分析
- 對 Preference 列（20 mm/s）與 Beambox II 列（50 mm/s）覆蓋充分：閾值兩側、向量與點陣圖分支、顯示／隱藏皆有驗證。
- 與測試表意圖的落差：測試表註明「開啟偏好設定的限制上限速度」，暗示此警告受某個偏好開關控制。目前 spec 只覆蓋偏好「開啟（預設）」的分支，未覆蓋「關閉限速偏好 → 即使是純路徑也不限速／不警告」的路徑。
- 判斷：主流程充分；偏好關閉的分支是次要缺口，屬於同一 spec 可補的範圍，但非阻斷性。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。（偏好關閉的分支列為待確認問題交由人類決定是否納入，未逕自擴充，以免超出該列的核心意圖。）

## 待確認問題（Open Questions）
- 測試表註明「開啟偏好設定的限制上限速度」— spec 是否也應涵蓋偏好關閉（於 Preferences 移除限制）後，純路徑不再被限速的分支？這個偏好即警告文字所指的「You can remove this limit at Preferences Settings」。
