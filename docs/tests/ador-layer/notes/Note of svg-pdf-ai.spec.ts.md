# Note of svg-pdf-ai.spec.ts

## 對應測試表項目
本 spec 一次覆蓋測試表的數列（皆需 FLUXGhost，CI 會自我略過）：
- 檔案操作分類「匯入 SVG 檔時，跳出選擇雷射頭或列印頭的 pop-up (Ador)」→ module-select popup。
- 右側物件面板分類「SVG 依圖層分層後，修改圖片顏色」（右下角調整為列印，匯入 SVG 並依圖層分層，右側選單 objects 底下的顏色）→ 第 1 個 it（列印頭 + 依圖層 + 改物件顏色）。
- Ador Layer 分類「雷射圖層 — 依顏色分層後，調整顏色正常」→ 第 2 個 it（雷射頭 + 依顏色 + 改圖層顏色）。
- Ador Layer 分類「匯入 SVG 選擇列印頭時，跳出圖層／不分層圖層的 pop-up」→ 第 3 個 it 的 layering popup。
- Ador Layer 分類「接續上一條，選擇列印頭時跳出彩色圖層」→ 第 3 個 it 的 full-color 圖層驗證。

注意：其中「SVG 依圖層分層後，修改圖片顏色」這一列在測試表中屬於「右側物件面板」分類，而非 Ador Layer；本 spec 一併覆蓋，交互參照已在兩邊 Summary 註明。

## 測試了什麼
- `import svg by layer with printing module then change object color`：在 Ador 匯入 SVG → module popup 選 Printing → layering popup 只有 Layer／Single Layer（沒有 Color）→ 依圖層匯入產生兩個 fullcolor 列印圖層並保留來源圖層名稱 → 選取匯入的 ellipse，從 objects 面板色票把顏色由 #3F51B5 改成 #1677FF，驗證色票與底層 symbol 的 path fill 一起變。
- `import svg by color with laser module then adjust a layer color`：module popup 選 Laser → layering popup 有 Color → 依顏色分層產生兩個以 hex 命名的圖層（#3F51B5／#333333）→ 從 LayerList 色票把頂層顏色改為 #1677FF，驗證色票與 `g.layer[data-color]` 一起變。
- `shows module popup then full-color layers when choosing the printing head`：驗證 module popup 同時列出 Laser 與 Printing → 選 Printing 仍跳出 layering popup → 產生 fullcolor（彩色）列印圖層（`data-fullcolor="1" data-module="5"`），且彩色圖層列不顯示 color picker 觸發按鈕。

## 設計理由
- **為何一定要 FLUXGhost**：SVG 解析（分色、分層、產生 symbol/use 結構）走的是 FLUXGhost websocket（`nonstop` 進度遮罩即是在等它），不是純前端；沒有 ghost 就無法產生匯入結果，因此此 spec 不能在 CI 執行，於 GitHub 上以 `isRunningAtGithub` 自我略過。
- **不需實機**：只需要 ghost 的 SVG 解析服務，完全用不到機器連線或裝置指令；popup、分層、改色都是 ghost 加上前端 canvas 的行為。
- **ghostPort 接線**：`wireBackendAndLand()` 讀取 `Cypress.env('ghostPort')`；有值時走 `cy.landingEditor({ onBeforeLoad })`，並在 onBeforeLoad 內把 localStorage 的 `host=127.0.0.1`、`port=<ghostPort>` 寫入。這裡必須用 onBeforeLoad — landingEditor 的 `cy.session` 快取會清掉一般的預先造訪寫入；傳入自訂的 visit options 會讓它跳過 session 快取，並在每次載入時都執行 hook。用 127.0.0.1 是因為 FLUXGhost 的 origin 白名單會拒絕 localhost:8080。沒有 ghostPort 時則退回 `cy.setUpBackend(backendIP)`。本地由 `cy-local-rig.sh`（`cy:fluxghost`）自動以 `lsof` 偵測 flux_api 的動態埠並注入。

## 充分性分析
- 對「module popup／layering popup／依圖層 vs 依顏色／改物件色／改圖層色／彩色圖層」的意圖覆蓋充分，且是端到端（經過 ghost 真實解析），品質高於 mock。
- **誠實說明的缺口 — 只匯入 svg.svg，未涵蓋 PDF／AI**：spec 檔名叫 svg-pdf-ai，但三個測試都只匯入 `svg.svg`。依文件所述，PDF／AI 匯入需要完整的 FLUXGhost 測試環境才能執行（另有轉檔路徑），本 spec 並未觸及。對應的測試表各列講的都是 SVG，PDF／AI 屬於 spec 檔名的企圖而非目前的覆蓋範圍，此處如實標明。此缺口的負責層級為：本地測試環境的 FLUXGhost E2E（待補）。
- 未涵蓋：Single Layer 分層樣式的實際結果、非 Ador 機型的 popup 差異、色票以外的改色路徑（右鍵選單改色見 printing-layer-color.spec.ts）。

## 本次改進
無 — 經檢視後判斷現有測試已足夠（結構與驗證正確、ghostPort 接線符合本專案標準、CI 自我略過正確）。PDF／AI 缺口屬於「需完整環境才能補」而非現有測試的瑕疵，不在本次修正範圍。

## 待確認問題（Open Questions）
- PDF／AI 匯入是否應在完整的 FLUXGhost 本地測試環境就緒後，各自獨立成 spec（或併入本檔）？目前 svg-pdf-ai 這個名稱與實際覆蓋範圍不符，值得由測試負責人決定是要「補測」或是「改名為 svg-import」。
