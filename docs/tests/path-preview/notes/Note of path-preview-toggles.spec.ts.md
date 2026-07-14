# Note of path-preview-toggles.spec.ts

## 對應測試表項目
路徑預覽 Path Preview 分類：
- 「Travel Path / Invert 顯示是否正確」：「Beambox 系列」。
- 「縮放 Canvas 位置與結果是否正確」。

測試表自動化欄目前標示：
- Travel Path/Invert → `top-bar/path-preview-toggles.spec.ts (done, passing; needs FLUXGhost only — no machine)`
- 縮放 Canvas → `top-bar/path-preview-toggles.spec.ts (done, passing; needs FLUXGhost only)`

## 測試了什麼
- `toggles Travel Path and reflects the switch + traversal drawing state`：`#show_traversal` 預設為開（驅動 `workspace.showTraversal`，進而觸發 WebGL 繪製呼叫），關閉與開啟時切換 class 與 aria-checked 同步。
- `toggles Invert Color and reflects the switch state`：`#invert_color` 預設為關（驅動 `state.isInverting`，進而設定 fragment shader 的 uniform），開啟與關閉時切換，且不干擾 Travel Path。
- `zooms in/out inside preview and keeps the ratio position consistent`：預覽模式內 ZoomBlock 放大使比例升高、縮小使比例降低並回落到基準值正負 10% 內（ZoomBlock 對齊固定的 10% 級距）。

## 設計理由
- 只需 FLUXGhost、不需機器的發現：Path Preview 只需 FLUXGhost 做工具路徑計算，不需連線機器。這是本檔的關鍵——`enterPathPreview` 進場後等待 `#path-preview-panel` 與 `#path-preview-side-panel` 出現，且側欄不再含 `NaN`（計算完成的訊號），全程無機器依賴。CI 無 FLUXGhost，故 spec 以 `if (isRunningAtGithub) return` 自我略過，僅在本機 rig 執行。
- 用 forced-click 進場：top-bar 的「Path Preview」按鈕在未發現機器時只是視覺上呈現 disabled，但點擊處理函式仍會切換畫布模式；故用 `click({ force: true })` 繞過視覺上的 disabled 狀態，僅靠 FLUXGhost 即可進入預覽（對此設計的疑問見待確認問題）。
- 本機 rig 接線：`wireBackendAndLand` 遵循測試規範的 ghostPort 慣例——有 `ghostPort` 時，在 `onBeforeLoad` 寫入 `host=127.0.0.1`（FLUXGhost 會拒絕 Origin 為 localhost 的 websocket 升級）與 `port`；否則退回 `setUpBackend(backendIP)`。port 不硬編，作法參考 `svg-pdf-ai.spec.ts`。
- 切換斷言的選擇：只驗證開關狀態與其驅動的繪圖旗標語意（showTraversal、isInverting uniform），不驗像素，符合測試規範中「無視覺回歸工具、不寫外觀斷言」的原則。測試表的「顯示是否正確」以開關狀態加繪圖參數作為機器可驗證的代理。
- 縮放斷言的容錯：來回縮放後用 `closeTo(baseRatio, 10)` 而非精確相等，因 ZoomBlock 放大會進位到下一個 10% 邊界、縮小會退位到前一個邊界，故落在起始比例的一個級距內；每步用 `.then()` 串接，避免跨 `should()` 閉包抓到過時的值。

## 充分性分析
- Travel Path 與 Invert 的切換狀態及其繪圖旗標覆蓋充分；預覽內的縮放位置與結果以 ZoomBlock 比例驗證，對應測試表「縮放 Canvas 位置與結果」的意圖。
- 缺口：實際 WebGL 畫面像素（移動路徑線是否真的畫出、反轉背景顏色）未驗證，屬 shader 輸出，E2E 無法斷言，屬人工。

## 本次改進
無，經檢視後判斷現有測試已足夠（只需 FLUXGhost、本機 rig 執行，CI 正確自我略過）。

## 待確認問題（Open Questions）
- 未連機器時透過 forced-click 穿過視覺上的 disabled 狀態進入路徑預覽：這是刻意的 web 流程，還是應被尊重的 UI 限制（即無機器就不該進預覽）？若屬後者，此測試靠 forced-click 進場會遮蔽真正的限制迴歸，值得產品與前端確認按鈕 disabled 的語意。
