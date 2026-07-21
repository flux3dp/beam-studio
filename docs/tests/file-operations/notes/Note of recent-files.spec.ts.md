# Note of recent-files.spec.ts

## 對應測試表項目
檔案操作分類：
- 「Open recent Project 功能正常」：「檔案 > 最近使用」
- 「從桌面匯入 beam 檔功能正常」：「用拖曳直接將場景檔案匯入」

測試表「Automation」欄目前的內容：
- Open recent → `not automatable in web build: recent files is Electron-only`（證據記錄於 top-bar/recent-files.spec.ts 檔頭）
- 從桌面匯入 beam → `top-bar/recent-files.spec.ts (done, passing)`

## 測試了什麼
- `imports a .beam scene via drag-drop`：以 `cy.uploadFile('laser.beam')` 透過 DataTransfer 模擬拖曳場景檔匯入，還原出單一雷射圖層（`data-layer='預設圖層'`）與單一矩形（`#svg_1`，寬高皆為 500、fill 為 #333333）。
- `opens a project from File > Open Recent (desktop-only)`：使用 `it.skip`，是一個自我說明用的佔位測試，因為 web 版沒有這項功能。

## 設計理由
- **從桌面匯入 .beam**：`cy.uploadFile` 走的是匯入 `<input>` 的 DataTransfer 路徑，正好與桌面版把場景檔拖曳到畫布走的是同一段程式碼。測試會驗證圖層與元素的幾何屬性，符合本專案「以 #svgcontent 的內容來驗證正確性」的原則。
- **Open Recent 為何只能在 Electron 上執行**（檔頭列出的四點證據逐一成立）：
  1. 「檔案 > 最近使用」的原生選單只存在於 Electron（`apps/app/src/node/menu/fileMenu.ts`）；web 版沒有這個選單，web 版的 `recentMenuUpdater.ts` 是一個空實作。
  2. 歡迎頁／首頁的「最近使用檔案」分頁被 `!isWeb()` 擋掉（`Welcome.tsx`），web 版完全不會渲染。
  3. 即使渲染，`TabRecentFiles` 也會用 `fileSystem.exists(filePath)` 逐筆過濾，而 web 版的 `fileSystem.ts` 空實作永遠回傳 false。
  4. web 版的「儲存／另存新檔」是透過瀏覽器下載完成，`writeFileDialog` 會回傳 null（`dialog.ts`），因此 `updateRecentFiles()` 永遠不會被呼叫，`localStorage['recent_files']` 也永遠不會有內容。
- 結論：整條 Open Recent 流程只能在桌面版執行，而目前**沒有 Electron 的 Cypress 測試環境**（本專案原則明載「Electron 專屬的功能不要在 web 測試套件裡假裝實作」）。因此保留一個帶自我說明的 skipped 測試，交由桌面版發版檢查清單處理。

## 充分性分析
- 「從桌面匯入 beam」的意圖已完整覆蓋（匯入加上內容還原的驗證）。
- 「Open Recent」在 web 版無法測試，這屬於平台限制而非測試不足；證據鏈完整且可查證，保留帶說明的 skip 是正確的處理方式。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
- web 版是否應新增「最近使用檔案」功能（測試表預期有此功能）？還是測試表該把這一列標記為桌面版專屬？目前程式碼有四處刻意排除 web 版，傾向後者，但這屬於產品決策，交由人類判斷。
