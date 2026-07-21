# Note of config-panel-warnings.spec.ts

## 對應測試表項目

- 第 195 列「功率低於 10% 時是否有提示文字／注意 BB2 沒有這個限制」。
- 第 79 列「確認右側輸入欄是否正確 — 測試右側物件尺寸、座標輸入後按 Enter 是否有儲存到值」。

## 測試內容 — 逐案說明

- `shows the low-power hint when layer power is below 10% and hides it when raised`：預設機型（Beambox，minPower 10）功率設為 5 時出現低功率提示「Lower laser power (under 10%) might not emit the laser light.」，升到 50 後消失。
- `does not show the low-power hint on Beambox II (fbb2 has no minPower)`：BB2 沒有 minPower，功率設為 1 也不出現提示。
- `commits a new width on Enter and updates the SVG element attribute`：在物件面板 `#w_size` 輸入 100 後按 Enter，`#svg_1` 的 width 變為 1000px（100mm × 10dpmm），且取消選取再選回後數值仍在。
- `commits a new X position on Enter and updates the SVG element attribute`：`#x_position` 輸入 80 後按 Enter，`#svg_1` 的 x 變為 800px，且反覆選取後數值持續存在。

## 設計理由

- 低功率提示重用 `Block.module.scss` 的 warning-icon / warning-text class（與 speed-limit-warning spec 共用 selector），以「元素存在性＋文字內容」斷言，不做顏色斷言。
- 功率以 `#power-input` 直接設值，命中 10% 閾值的兩側；BB2 分支則釘住 `power.value < (minPower ?? -1)` 在無 minPower 時恆為 false 的邏輯。
- 尺寸與座標輸入驗證「按 Enter 送出 → SVG 屬性更新 → 取消選取再選回數值仍在」，證明真的存進值而非僅為 UI 暫態。
- **>70% 高功率警告刻意排除**：該警告只出現在送出工作時的機器對話框（job-send machine dialog），並非右側面板的即時提示；CI 沒有機器、屬送件流程，故不在本 spec 涵蓋範圍。

## 充分性分析

- 對第 195 列涵蓋充分：<10% 顯示與隱藏，加上 BB2 無此限制的分支都測到了。
- 對第 79 列涵蓋充分：width 與 X 兩個代表性輸入欄，包含 Enter 送出與持久化。
- 與測試表意圖的落差：第 79 列只點名「尺寸、座標」，本 spec 取 w_size 與 x_position 為代表，未涵蓋 height、y、rotation 等每一個欄位；行為契約一致，未逐欄覆蓋屬可接受的取樣。
- 判斷：足夠。>70% 警告的排除有明確歸屬（機器送件層，非本面板）。

## 本次改進

無。經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）

- 無。（>70% 高功率警告若需自動化，應歸於送件／機器對話框層的 gated spec，而非右側面板 spec。）
