# Note of wheel-pan-zoom.spec.ts

## 對應測試表項目
Viewport 分類：
- 「使用滑鼠滾輪是否可以平移縮放 Canvas」，操作步驟為「按著滑鼠滾輪可以平移／滑動滑鼠滾輪可以縮放畫布」。
- 「按著空白鍵後拖曳是否可以平移畫布」。

測試表自動化欄目前標示 `canvas/wheel-pan-zoom.spec.ts (done, passing)`。同分類的「Mac/Win 觸控板操作」該列已判定維持人工（Tier D），不在本檔範圍內。

## 測試了什麼
- `wheel zoom in and out changes the ZoomBlock ratio`：滾輪縮放使 ZoomBlock 顯示比例先放大、後縮小。
- `wheel zoom is view-only and does not move objects`：滾輪縮放後，矩形的 x、y、width、height 屬性完全不變，確認只有視圖被縮放。
- `space-drag pans the workarea without moving objects`：按住空白鍵拖曳，使 `#workarea` 的 scrollLeft、scrollTop 增加，而物件座標不變。
- `middle-button drag pans the workarea`：中鍵（button 為 1）拖曳即可平移工作區，不需按住空白鍵。

## 設計理由
- 合成事件的選擇：觸發 `wheel` 事件時帶上 `ctrlKey: true`。因為處理函式在 Mac 上需要 ctrlKey 才會視為縮放，Windows 與 Linux 則任何滾輪動作都當作縮放；加上 ctrlKey 可讓測試在各作業系統上一致地走縮放路徑。`deltaY` 給正負 300，另外傳入 `wheelDelta`（處理函式實際讀取 `wheelDelta ?? -detail`），刻意放大幅度，讓每一格縮放都明顯超過顯示比例四捨五入到 1% 的門檻，避免變化被進位吃掉。
- `getSettledRatio` 輔助函式：ZoomBlock 比例在自動配合視窗與滾輪防抖期間會跳動，此函式用 Cypress 原生 `should()` 重試，直到連續兩次讀到相同數值才視為穩定並回傳，避免抓到中途的瞬間值。這也符合測試規範中「不得使用裸 `cy.wait(ms)`」的要求。
- view-only 斷言：縮放與平移都額外驗證 SVG 幾何屬性不變，用以區分「視圖變換」與「物件變換」，正好對應測試表「保持相對位置」意圖，並提供機器可驗證的代理指標。
- 空白鍵平移：`keydown` 在 document 上設定 `keypan=true`，平移邏輯綁定於 `#svgcanvas` 的 mousedown、mousemove、mouseup；拖曳方向朝左上，使捲動量增加，斷言方向明確。

## 充分性分析
- 測試表兩列（滾輪縮放平移、空白鍵平移）皆有對應案例，且中鍵平移正是測試表「按著滑鼠滾輪可以平移」的精確對應（滾輪即中鍵）。
- view-only 斷言超出測試表最低要求，強化了正確性驗證。
- 缺口：實際像素渲染位置與觸控板手勢未驗證。前者缺乏視覺回歸工具，後者測試表已判定維持人工（Tier D），兩者皆非本檔缺陷。

## 本次改進
無，經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
無。
