# Note of googleFontService.spec.ts 與 googleFontStore/index.spec.ts

## 對應測試表項目

Google Fonts 功能分類的**邏輯地基**。表列五項（搜尋／語言／類別／Save／Cancel）已由 `google-fonts-panel.spec.ts`（攔截層）與 `google-fonts-live.spec.ts`（真實 API 契約層）覆蓋；本組補齊面板底下的服務與 store（原本零測試），API 快取層另有既有的 `googleFontsApiCache.spec.ts`（未重複）。

## 測試了什麼

**googleFontService.spec.ts（13 個測試）**——服務編排：

- 掃描 `#svgcontent` 與 `#svg_defs` 的文字元素，對每個相異 Google 字型家族載入＋註冊；引號/空白剝除；以 postscript 名稱去重（同家族多次使用只載一次）；已載入時跳過載入但仍註冊；本機/網頁安全字型忽略。
- **離線行為**：以網頁安全字型替換 `font-family` 並改寫 postscript 屬性；本機字型不動；`font-history` 中的 Google 字型被清除而非嘗試載入。
- DOM 掃描出錯不拋出（吞錯不中斷）。

**googleFontStore/index.spec.ts（26 個測試）**——store 本體：

- `loadGoogleFont`：CSS URL 手動推導驗證（含 italic 變體格式）、重複載入 no-op、本機/圖示字型跳過、**離線時進佇列**、快取查無家族時記入 `failedLoads`（含真實重試/退避路徑）。
- `registerGoogleFont`：每變體一筆、以 postscript 鍵去重、缺資料 no-op、API 錯誤吞錯。
- 二進位載入：TTF 抓取與 buffer 快取、離線回 null 不發請求、快取命中不重抓。
- 網路閘門：on/offline 判斷、**重連時排空佇列補載**。
- 字型歷史：前插、去重移前、上限 5 筆；serif fallback 對應與預設 `ArialMT`。

## 設計理由

- 服務層 mock store 與偵測層，store 層 mock API 快取與網路（jest-fetch-mock）——各測自己的職責，不重測下層。
- jsdom 不會觸發 `<link>.onload`，以 patch `appendChild` 模擬；此界線誠實記錄。

## 充分性分析

- 表列功能的三層（UI 攔截、真實契約、邏輯地基）現在都有著落；離線/重連這類 E2E 難以穩定重現的行為在單元層完整釘住。
- 未覆蓋：真實字型光柵化與 `<link>` 真實載入（live spec 端到端涵蓋）、store 匯入時的計時器與 online/offline 監聽副作用。

## 本次改進

新增兩個 spec（A3 清單項目）。

## 待確認問題（Open Questions）

1. `failedLoads` 的重試路徑使用真實 `setTimeout` 退避（該測試約 4 秒）——若日後套件時間敏感，可改 fake timers，但需處理 store 模組層計時器的交互。
2. 字型歷史上限 5 筆是否為產品規格？測試已釘住現行值。
