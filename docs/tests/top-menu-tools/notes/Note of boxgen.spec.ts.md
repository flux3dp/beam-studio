# Note of boxgen.spec.ts

## 對應測試表項目
- Boxgen 盒子產生器：「寬度、高度、深度等最大值由畫布限制，輸入 999 時自動跳為畫布最大值」
- Boxgen：「Outer、Inner、Cover 等按鈕動作正常」（另配 Jest `components/boxgen/Shape.spec.ts` 的有蓋幾何）
- Boxgen：「寬度、高度、深度可任意調整數字，右側 3D 圖即時變化，最小值為 1」
- Boxgen：「Edge、Finger、T-Slot 任意切換，3D 圖即時變化」
- Boxgen：「Finger 滑桿平移時，右側 3D 圖即時變化不卡頓」，其中重算可自動化、「不卡頓」的流暢度維持人工
- Boxgen：「T-Slot 調整 T 槽直徑和長度後右側 3D 圖即時變化」
- Boxgen：「匯入後是否有正常顯示圖層及 Label」

## 測試了什麼
- `accepts in-range values and clamps width/height/depth to min-max limits`：合法值（150／120／90）照收；超過上限（500／999／999）夾到畫布最大值（寬 300、高／深 210）；低於下限（0）夾到 1。
- `inner vs outer volume toggle changes the exported geometry`：切換 Outer 與 Inner，兩者匯入預覽的 path 幾何簽章不同（Inner 每邊多加兩倍板厚）。
- `cover toggle changes the number of exported panels`：關掉 Cover 後，預覽的 path 數量少於開啟時（頂板被移除）。
- `switching joint type reveals joint-specific inputs`：切換 Edge／Finger／T-Slot 時，對應的接合專屬輸入（Finger 滑桿、T-Slot 的 T Count／Diameter／Length）依 joint 顯示或隱藏。
- `imports box layers to the canvas, adding label layers when enabled`：匯入後畫布出現 `Box 1-N` 圖層與 `Box 1-N Label` 標籤圖層，形狀圖層帶有真實的 `<use>` 幾何，右側 LayerList 也列出。

## 設計理由
- 固定使用 beamo（fbm1）工作區：畫布 300×210mm，寬上限為 300（長邊）、高／深上限為 210（短邊）、下限皆為 1，讓「夾到最大／最小」有可預測的具體期望值，直接對應測試表「輸入 999 跳為畫布最大值」與「最小值為 1」。
- 用結構化斷言而非像素：3D 預覽不比像素，改以「匯入預覽 SVG 內所有 `<path>` 的 `d` 串接」當作幾何簽章、或用 path 數量，來驗證 Outer／Inner 與 Cover 的即時重算，符合本專案「不做視覺回歸、不驗像素」的規範。測試表的「3D 圖即時變化」以「參數改變則匯出幾何改變」代理驗證。
- `setLength` 逐次重試並在最後 blur：antd 的 InputNumber 在 blur 時才提交／夾制，且首次互動可能掉字；因此重試到顯示值穩定在期望的兩位小數格式，避免不穩定（flaky）。
- joint 切換測試刻意保留預設的 80mm 盒（不先縮小），因為縮小盒身會自動把 joint 切回 Edge，會污染斷言。

## 充分性分析
- 對測試表各列已充分：夾制上下限、Outer／Inner、Cover、三種 joint 顯示、匯入圖層與 Label 全數覆蓋。
- 分工明確：cover／finger／t-slot 的精確幾何數值由 Jest `Shape.spec.ts`（手算齒形與 T 槽）鎖住；本 Cypress spec 只驗「切換後匯出結果改變」的整合行為，避免在 E2E 重複純幾何數學。
- 刻意未涵蓋：Finger 滑桿的「不卡頓／流暢度」，屬效能感受、人工層級；本 spec 只驗滑桿或參數變更觸發重算的結果差異。
- 刻意未涵蓋：大盒分頁後的多頁匯出計數（cover 案例特意用 40mm 小盒讓所有面板落在單頁，避免分頁干擾計數）。

## 本次改進
無，經檢視後判斷現有測試已足夠。（上下限夾制、Outer／Inner／Cover、joint 顯示、匯入圖層與 Label 均以確定性工作區與結構化斷言覆蓋。）

## 待確認問題（Open Questions）
- 測試表說「輸入 999 跳為畫布最大值」：目前實作是在 blur 時才夾制，本 spec 依此驗證。blur 才夾制與邊打邊夾兩種行為，哪個才是預期 UX？若產品預期打字當下即時夾制，現行實作與測試都需調整，請人工確認預期 UX。
