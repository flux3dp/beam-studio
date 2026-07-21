# Note of offset-result.spec.ts

## 對應測試表項目

- 第 104 列「位移複製結果是否正確 — 測試不同距離的向內、向外路徑，確認結果是否正確，若是複合路徑，向外路徑只會針對最外面外框（向量圖、點陣圖、文字）」。
- （第 103 列「位移複製功能是否正確」對應 offset-tools.spec.ts 的基本流程，本 spec 為其結果正確性的補強。）

## 測試內容 — 逐案說明

- `vector rect: outward grows and inward shrinks by 2×distance`：矩形向外 5、向外 10、向內 5，結果尺寸分別等於來源 ± 2×距離（closeTo 容差 ±0.3~0.4）。
- `closed path (ellipse): outward grows and inward shrinks by 2×distance`：橢圓向外 8、向內 5，以來源 rx/ry（顯示為直徑）比對結果 path 的 w/h ± 2×距離。
- `text: outward offset creates a result path that grows with distance`：文字「AB」（Mr Bedfort 字型）向外 2 與向外 6，只驗證「有產生 result path」且「大距離結果的 bbox 嚴格大於小距離」（不用 checksum，因字形 path 與平台相依）。
- `compound (concentric rects): outward offset follows only the outer outline`：外框加內框多選 → 向外 5 → 聯集結果尺寸約等於外框 + 10，證明只跟隨最外輪廓（符合測試表「向外只針對最外框」）。
- `bitmap image: offset is enabled and produces a rect-based offset`：匯入 flux.png → `#offset` 為啟用（非 disabled）→ 向外 5 → 產生 path，尺寸等於圖片 bbox + 2×距離。

## 設計理由

- **為何用結構性斷言加 closeTo 而非 path checksum**：offset 由 clipper 幾何運算產生，向量與橢圓的 path `d` 可能因浮點與平台微差而不同；文字 offset 更是先把字形轉為 path，與平台相依程度更高。故品質判準改為「尺寸關係」——向外／向內讓 bbox 精確地 ± 2×距離——並以 `cy.inputValueCloseTo` 帶容差，既穩定又抓得到方向或倍率錯誤。
- offset 全在前端（clipper）運算，無需 FLUXGhost 或機器，故此 spec 在 CI 也能執行。
- 橢圓面板露出的是 rx/ry（且顯示為直徑而非半徑），offset 後結果是 path 露出 w/h，故以來源 rx/ry 對比結果 w/h。橢圓因無填色、內部不可點選，故改用 rubber-band 重新框選。

## 充分性分析

- 對測試表「不同距離、向內向外、複合路徑只跟最外框、向量/點陣/文字」的意圖覆蓋充分。
- **發現的行為差異（如實記錄）**：測試表語氣暗示點陣圖可能不支援 offset，但實際上 **bitmap offset 是啟用的** — `#offset` 對 image 有 render，會把圖片的 bounding rect 轉成 path 再 offset。spec 最後一案即以此如實驗證（按鈕啟用、結果等於 bbox + 2×距離），並在 CSV 第 104 列的 suggestion 欄註明「bitmap offset IS enabled」。
- 未涵蓋：複合路徑的**向內** offset 語意（見待確認問題）；offset 後 path 的實際幾何細節（刻意不做 checksum）。
- 結論：結果正確性（尺寸、方向、倍率、最外框、點陣啟用）覆蓋充分。

## 本次改進

無。經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）

- 複合路徑目前只驗證「向外只包最外框」。若對複合路徑做**向內** offset，語意是否也應明訂（例如向內是否針對內框，或同樣只針對最外輪廓）？測試表未言明，此案未涵蓋，建議由幾何負責人補齊規格與測試。
