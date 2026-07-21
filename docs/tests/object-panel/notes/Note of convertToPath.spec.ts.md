# Note of convertToPath.spec.ts

## 對應測試表項目

右側物件面板分類：「文字轉路徑」列的**邏輯層**（表上建議欄明示：另建議 Jest 單元測試 convertToPath.ts，原本零測試）。E2E 層見 `text-to-path-web-font.spec.ts` 與既有的 `text-to-path.spec.ts`。

## 測試了什麼

共 10 個測試，覆蓋三個公開函式：

- **convertSvgToPath**（2）：轉換後回傳 path 與 bbox、歷史命令委派正確；`isToSelect` 會選取結果、`parentCmd` 正確傳遞。
- **convertTextToPath**（3）：編輯中會先退出文字編輯模式；非編輯中不多做模式切換；字型層回傳空結果（不支援／取消）時不寫入歷史、不選取，狀態如實回傳。
- **convertAllTextToPath**（5，對應表列的批次場景）：所有可見圖層的文字共用一個 BatchCommand；`revert()` 真的復原並重繪文字；中途 `CANCEL_OPERATION` 會短路整批並回傳失敗、revert 成為安全的 no-op；字型不支援時的縮圖警告——「不再顯示」勾選會持久化，旗標已設時警告被抑制。

## 設計理由

- 字型解析層以確定性的假字形 mock，幾何以 prototype 層的 `getBBox` stub 供應（jsdom 沒有 SVG 幾何 API）；期望值手動推導。
- 斷言以「產生了什麼元素／命令／屬性」為主，不驗呼叫順序細節。

## 充分性分析

- 可乾淨單元化的兩個高價值出口（單一文字轉換、批次轉換含 revert 與警告閘門）已完整覆蓋。
- **誠實邊界**：`convertTempGroupToPath`、`convertTextOnPathToPath`、`convertUseToPath` 與真實畫布深度耦合（群組、`<use>` 拆解、即時選取狀態），單元 mock 只會變成在驗 mock 本身——這些行為正確性由 E2E 層（真實畫布）把關。`generateImageRect` 與 dispatch 路由較薄，暫未覆蓋。

## 本次改進

新增本 spec（模組原本零測試，屬 A3 清單既定項目）。

## 待確認問題（Open Questions）

1. 字型替換警告的「不再顯示」持久化 key（`skip_check_thumbnail_warning`）是否應納入「重置所有設定」的清除範圍？現行為與重置的互動未驗證。
2. `convertTextOnPathToPath`（路徑文字）是否需要專屬 E2E？既有 `modify/text-on-path.spec.ts` 覆蓋建立流程，轉路徑部分未確認。
