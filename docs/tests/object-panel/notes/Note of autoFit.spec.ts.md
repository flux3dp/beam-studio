# Note of autoFit.spec.ts

被測檔案：`packages/core/src/web/app/svgedit/operations/autoFit/autoFit.ts`（自動對位進入點：取得相機影像 → 抓取輪廓 → 開啟面板）

## 對應測試表項目

對應「自動對位（2.3.9 新增）是否正常」這一列（步驟 1–7）。

CSV 備註明確指出此項「Need FLUXGHOST」、「第一階段取得照片需要機器，但第二階段不用」、「維持本地執行（CI 無 FLUXGhost，勿在 GitHub Actions 執行）」。本單元測試覆蓋的是**第二階段之後的協調邏輯**（守門、進度條、快取、錯誤處理），不包含相機取像與形狀辨識本身。

## 測試內容 — 逐案說明

- **未預覽時的守門**：沒有相機背景 url 時，彈出 `preview_first`、不開進度條、也不開面板。
- **成功抓輪廓並開面板**：開啟進度條 `auto-fit`、以 `{ isSplicingImg: false }` 呼叫 `getAllSimilarContours`、呼叫 `showAutoFitPanel(elem, url, data, false)`，最後在 finally 關閉進度條。
- **isSplicingImg 分支**：工作區尚未完整繪製時，傳入 `isSplicingImg: true` 並轉傳給面板。
- **快取命中**：同一 url 第二次呼叫時不重抓輪廓（`getAllSimilarContours` 仍只呼叫 1 次），但面板仍會再開一次。
- **url 改變時重抓**：快取為舊 url 時會重新抓取並更新 `dataCache.url`。
- **找不到輪廓**：data 為空時，彈出 `failed_to_find_contour`、不開面板、關閉進度條。
- **fetch 拋出例外**：彈出含 `Failed to auto fit` 的錯誤訊息、不開面板、仍關閉進度條。
- **進度條成對開關**：正常流程下，開啟與 `popById` 各恰好呼叫一次。

## 設計理由 — 為何適合單元測試

- 相機取像（第一階段）需要機器加 FLUXGhost，無法進 CI；但**取像之後的協調邏輯**是純前端，適合以單元測試隔離驗證。所有外部依賴（`getCameraCanvasUrl`、`getAllSimilarContours`、`fetch`、progress、panel）皆已 mock。
- 每個案例攔截的真實 bug：
  - 守門被拿掉 → 未預覽就把空 blob 送給後端；
  - `isSplicingImg` 旗標寫死或反向 → 拼接影像時抓錯輪廓；
  - 快取判斷失效 → 每次都重打後端（慢且浪費），或反過來抓到過期輪廓；
  - `finally` 被移除 → 進度條卡住無法關閉（成對斷言可直接攔到）。

## 充分性分析

- 對「協調層」而言已足夠（statements 97.5%）。
- **必須靠機器或人工驗證的部分**：相機取像品質，以及「右側形狀是否正確辨識出工件」的辨識準確度（步驟 5）。這屬於 vision 與後端演算法，單元測試這端的 `getAllSimilarContours` 是 mock，無法驗證辨識對錯。CSV 已註明維持本地執行，並納入發版前批次測試。
- 套用結果（步驟 6–7 的位置與複製）由 `apply.ts` 負責，另有 `apply.spec.ts` 覆蓋。

## 本次改進

無。經檢視後判斷現有測試已足夠（8 案全數通過）。

## 待確認問題（Open Questions）

- 來源檔頂端仍留有 `// TODO: add unit test` 註解，但測試其實已存在。建議移除該過時註解（非測試不足，屬清理）。
- 快取僅以 url 相等作為 key；若同一 url 的相機影像內容其實已更新（少見但可能發生），會取到過期輪廓。這是否為可接受的取捨，留給人工確認。
