# Note of autoFit.spec.ts

被測檔案：`packages/core/src/web/app/svgedit/operations/autoFit/autoFit.ts`（自動對位進入點：取相機影像 → 抓輪廓 → 開面板）

## 對應測試表項目 — sheet rows covered
「自動對位（2.3.9新增）是否正常」row（步驟 1–7）。

CSV 備註明確：此項「Need FLUXGHOST」、「第一階段取得照片需要機器，但第二階段不用」、「維持本地執行（CI 無 FLUXGhost，勿在 GitHub Actions 執行）」。本 unit spec 覆蓋的是**第二階段之後的協調邏輯**（守門、進度條、cache、錯誤處理），不含相機取像與形狀辨識本身。

## 測試了什麼 — 逐案說明
- **未預覽守門** — 無相機背景 url → 彈 `preview_first`、不開進度條、不開面板。
- **成功抓輪廓並開面板** — 開進度條 `auto-fit`、以 `{ isSplicingImg: false }` 呼叫 `getAllSimilarContours`、`showAutoFitPanel(elem, url, data, false)`、finally 關進度條。
- **isSplicingImg 分支** — 工作區未完整繪製時傳 `isSplicingImg: true` 並轉傳給面板。
- **cache 命中** — 同一 url 第二次呼叫不重抓輪廓（`getAllSimilarContours` 仍只 1 次），但面板仍再開一次。
- **url 改變重抓** — cache 為舊 url 時會重新抓並更新 `dataCache.url`。
- **找不到輪廓** — data 為空 → 彈 `failed_to_find_contour`、不開面板、關進度條。
- **fetch 丟例外** — 彈含 `Failed to auto fit` 的錯、不開面板、仍關進度條。
- **進度條成對** — happy path 下 open 與 popById 各恰好一次。

## 設計理由 — 為何 unit-level 適合
- 相機取像（第一階段）需機器＋FLUXGhost，無法進 CI；但**取像之後的協調邏輯**是純前端，適合 unit 隔離測。所有外部依賴（`getCameraCanvasUrl`、`getAllSimilarContours`、`fetch`、progress、panel）皆 mock。
- 每個 case 攔的真實 bug：
  - 守門被拿掉 → 無預覽就送空 blob 給後端；
  - `isSplicingImg` 旗標寫死或反向 → 拼接影像時抓錯輪廓；
  - cache 判斷失效 → 每次都重打後端（慢且浪費）或反之抓到過期輪廓；
  - `finally` 被移除 → 進度條卡住無法關閉（成對斷言直接攔到）。

## 充分性分析
- 對「協調層」已足夠（statements 97.5%）。
- **必須靠機器/人**：相機取像品質、以及「右側形狀是否正確辨識出工件」的辨識準確度（步驟 5）—— 這是 vision/後端演算法，unit 端 `getAllSimilarContours` 是 mock，無法驗辨識對錯。CSV 已註明維持本地＋發版前批次測試。
- 套用結果（步驟 6–7 的位置/複製）由 `apply.ts` 負責，另有 `apply.spec.ts` 覆蓋。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。（8 案全綠。）

## Open Questions
- 來源檔頂端仍留有 `// TODO: add unit test` 註解，但測試其實已存在——建議移除該過時註解（非測試不足，屬清理）。
- cache 只以 url 相等為 key；若同一 url 的相機影像內容其實已更新（少見但可能），會取到過期輪廓——是否為可接受取捨，留給人確認。
