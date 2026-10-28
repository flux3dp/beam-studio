# PRD：錯誤報告上傳（錯誤視窗內嵌同意）

> 本檔為 [error-report-upload.md](error-report-upload.md) 的繁體中文翻譯。**英文版為決策依據**；章節編號與英文版一一對應，英文版任一章節修改後請同步更新本檔。程式路徑、識別字、設定鍵名維持英文。

| | |
|---|---|
| **狀態** | 審閱中 — PR 1（#1021）已於 2026-10-19 合併；PR 2–5 合併為 #1028（2026-10-20 開啟）；flux-id #683 已於 2026-10-19 合併，DevTools 整合驗收於 2026-10-27 通過（範圍見 §13）；正式錯誤入口尚未手動驗證 |
| **作者** | 產品（zh-tw 原始 PRD v1.1）＋工程範疇界定 |
| **建立** | 2026-10-06 |
| **修訂** | 2026-10-27（記錄 DevTools 整合驗收）；2026-10-20（#1021 / #683 合併、#1028 開啟後更新狀態與 §10）；2026-10-14（實作第 3–5 步時接線並修正 §7.4；2026-10-08 完整錯誤觸發點掃描、D4 定案；D1–D5 於 2026-10-06，見 §11） |
| **追蹤** | ClickUp：待補（原始 zh-tw PRD v1.1 請附於該任務；刻意不放進此 repo） |
| **翻譯** | 本檔；英文版為準 |
| **配套 PRD** | [錯誤報告上傳 — flux-id 後端](backend.md)：端點、儲存別名、資料夾上限、去重、生命週期、效能影響矩陣（由 flux-id repo 負責） |
| **目標產品** | Beam Studio（桌面＋網頁；裝置 Log 部分以桌面為主，見 §7.3） |
| **負責領域** | 診斷 / 警示視窗 / 隱私設定 |
| **相關程式** | 報告內容：`packages/core/src/web/helpers/output-error.ts`；待汰換的舊上傳：`packages/core/src/web/helpers/aws-helper.ts`、`output-error.ts` `uploadBackendErrorLog`；警示 checkbox：`packages/core/src/web/app/components/dialogs/Alert.tsx:89-101,191-205`、`packages/core/src/web/interfaces/IAlert.d.ts`；錯誤視窗觸發點：`packages/core/src/web/app/contexts/MonitorContext.tsx:598-633`、`packages/core/src/web/helpers/websocket.ts:28-52`、`packages/core/src/web/helpers/device-master.ts:580` `popConnectionError`、`packages/core/src/web/app/actions/beambox/export-funcs.ts:257,315,503`、`export-funcs-swiftray.ts:89`、`packages/core/src/web/app/svgedit/operations/import/importSvg/utils/uploadAndDivideSvg.ts:31`；裝置 Log：`packages/core/src/web/helpers/device-master.ts:1067` `getLogsTexts`；偏好設定：`packages/core/src/web/app/constants/storageConstants.ts`、`packages/core/src/web/interfaces/IStorage.d.ts`、`packages/core/src/web/app/components/settings/categories/Privacy.tsx`；機器識別碼接縫：`packages/core/src/web/interfaces/IOperatingSystem.ts`、`apps/app/src/implementations/os.ts`、`apps/web/src/implementations/os.ts` |
| **外部 repo** | flux-id（實作 [backend.md](backend.md)）；fluxghost（後端 Log 內容，唯讀相依） |

---

## 1. 摘要

當白名單內的錯誤視窗出現時，Beam Studio 提供將診斷資料包（軟體錯誤報告＋裝置系統 Log）傳送給 FLUX 的選項，並依裝置序號歸檔。同意機制是**既有錯誤視窗內的 inline checkbox**，絕不另開第二個視窗。三態偏好設定（一律自動 / 每次詢問 / 永不）決定是顯示 checkbox、靜默上傳，或什麼都不做。現有兩份複製貼上的直傳 S3 程式碼由此單一路徑取代。

## 2. 背景與現況

- 目前有兩處上傳，都是從 client 直接 `PUT` 到公開 bucket `beamstudio-bug-report`：
  - `helpers/aws-helper.ts` `uploadToS3(fileName, body)`：匯出失敗（`#806`，`export-funcs.ts` ×3、`export-funcs-swiftray.ts`）與匯入失敗（`#809`，`uploadAndDivideSvg.ts`）時上傳場景 SVG。其 URL 是字面字串 `.../svg&bvg/reportName`（漏了 `${}`），因此每次上傳都覆寫同一個物件。
  - `helpers/output-error.ts` `uploadBackendErrorLog()`：fluxghost 連線失敗時上傳錯誤報告（`websocket.ts` `popBackendErrorAlert`，錯誤碼 `#802`）。
- `output-error.ts` `getOutput()` 已會組出軟體錯誤報告：OS/架構/user-agent、探索到的裝置清單、fluxghost log 檔、websocket log、swiftray log、完整 `storage` 傾印（rsa key 已隱藏）、一般錯誤 log、print-and-cut 報告。
- `MonitorContext.tsx:625` 在裝置錯誤時已提供「Bug Report」按鈕，會把 `getOutput()` 加上 `DeviceMaster.getLogsTexts(['playerd.log'|'fluxplayerd.log', 'fluxrobotd.log'])` 下載成本機檔案。這就是裝置系統 Log 的來源。
- `IAlert.checkbox`（`Alert.tsx:191-205`）會在訊息下方渲染一個 checkbox，且在 `alwaysTriggerCheckboxCallbacks`（預設 `true`）時，按**任一**按鈕都會執行其 callback。這正是原始 PRD §3.5 的行為（按取消仍上傳），不需新 UI。
- 偏好設定沿用 `enable-sentry` 模式：鍵名在 `storageConstants.ts:20` 與 `IStorage.d.ts:39`，開關在 `Privacy.tsx`，透過 `useSettingStore` 的 `getConfig/setConfig`（值型別為 `any`，字串列舉可直接用）與 `settings/shared` 的 `SettingSelect`。
- 後端 client：`axiosFluxId`（`helpers/api/flux-id/base.ts:50`，主機 `id.flux3dp.com`）。`id.flux3dp.com` 已經由 Cloudflare 代理（DNS 在 `art.ns.cloudflare.com`，A 記錄為 104.26.x.x），所以在新路徑上加 WAF 流量限制規則不需新帳號。
- flux-id（`../flux-id`）：Django 4.2.27、DRF 3.16，已使用 `django-storages` + `boto3`（`fluxid/common/storage.py`），gunicorn 同步 worker 數為 `2 × cpu + 1`（`nginx/gunicorn.conf.py`），nginx `client_max_body_size 32M`（`nginx/site.conf.template:23`），`fluxid/middleware.py` 的 `StatsdMiddleWare` 已是死碼（無 `STATSD_HOST`、無接收端；2026-10-12 確認）。主機：Linode 專用 4 vCPU / 8 GB / 160 GB，與 mysql、redis、celery、nginx 共用（`compose.deploy.yml`）。

## 3. 目標與非目標

**目標**
- G1 單一上傳路徑、單一函式，取代 `aws-helper.ts` 與 `uploadBackendErrorLog`。
- G2 同意機制內嵌於既有警示視窗；主按鈕的文字與位置不變。
- G3 三態偏好設定，預設**每次詢問**，永遠顯示於 設定 → 隱私。
- G4 自動上傳前先清除報告中的個人資料（§7.2）；同意列文案必須屬實。
- G5 每序號每日上限（每日 10 次成功上傳，依本地時間）與最多 3 次程序內嘗試，只在沒有回應或 5xx 時重試。

**非目標**
- v1 不做離線持久佇列（§11 D2，已定案）。
- 不更動手動的 說明 → Bug Report 下載（`menuActions.ts:64`）與 Monitor 的「Bug Report」下載按鈕；兩者維持為未清除、使用者可自行檢視的路徑。
- 180 天保留、每序號上限、可遠端調整的上限：屬 flux-id / R2 範疇，不在此 repo（§7.5）。
- 不新增錯誤視窗；只裝飾既有的。

## 4. 情境

- **S1 每次詢問（預設），使用者勾選後按 重試/確認/取消** → 視窗如常關閉；背景上傳；成功後顯示中性 toast「感謝您！診斷資料已傳送。」。尚未選擇偏好時，無設計檔報告的首次成功 → 跳出一次性提示「要自動傳送嗎？」，按鈕 [每次詢問] / [總是傳送]，總是傳送為右側主要按鈕（警示視窗慣例）。
- **S2 每次詢問，使用者未勾選** → 不上傳、無 toast、無提示。
- **S3 一律自動（無設計檔）** → 無 checkbox；視窗開啟時即開始上傳；視窗底部一行小灰字「診斷資料已自動傳送」。
- **S4 永不** → 視窗與現在完全相同。
- **S5 達每日上限** → checkbox 隱藏（每次詢問）或不上傳且無狀態列（一律自動）；在 generic logger 寫一筆「已略過（達每日上限）」。
- **S6 機器連線類錯誤** → 資料包只含錯誤報告；`CONNECTION_*`、`#810`、`#805`、`#850` 明確傳入 `includeDeviceLog: false`，即使同意上傳時已重新連線也不下載裝置 log。已知序號、韌體與裝置 throttle 保留；裝置 Log 部分是略過，不是失敗。兩種子情況：`#802` 後端警示完全沒有裝置（歸檔於 `no-device/{installation_id}/`）；`popConnectionError`（`device-master.ts:580`）在 `select` 失敗後觸發，此時雖無控制 socket，但從探索結果已知含序號與韌體版本的 `deviceInfo`（歸檔於 `{serial}/`）。
- **S7 匯出/匯入失敗**（`#806`/`#809`）→ 有 `scene` 的報告不受自動傳送同意涵蓋；每次詢問／總是傳送皆顯示預設未勾選的設計檔同意 checkbox。不傳送時不詢問、不上傳。仍遵守 throttle；勾選後才一起傳送診斷資料與場景 SVG／匯入檔案，維持 `device: null`。成功後不顯示自動傳送提示。
- **S8 上傳失敗 3 次** → 靜默；不另跳錯誤視窗（使用者已經有一個錯誤要處理）。記錄到 generic logger。
- **S9 同一錯誤重複發生**（使用者對同一連線失敗按五次重試，或同一 LAN 問題隔天再現）→ 只有第一次上傳；之後的只在本地計數，且指紋冷卻期間 checkbox 隱藏（§7.7）。該指紋的下一次上傳會帶 `occurrences_since_last`，頻率資訊不會遺失。

## 5. 驗收標準

| # | 操作方式 | 完成條件 | 邊界情況 |
|---|---|---|---|
| A1 | 設定 → 隱私。 | 存在「錯誤報告上傳」下拉選單，選項 一律自動 / 每次詢問 / 永不；預設 每次詢問；重啟後保留。 | 值以 `'always' \| 'ask' \| 'never'` 存於 storage 鍵 `error-report-upload`。 |
| A2 | 設為 每次詢問。在 Monitor 觸發非硬體類裝置錯誤（例如損壞的工作檔），或在連線途中將機器斷電以觸發 `popConnectionError`（或 §7.4 任一觸發點）。 | 既有視窗顯示，按鈕上方有未勾選的 checkbox；按鈕文字/順序不變。 | ALARM/FATAL 單按鈕視窗也有同樣 checkbox（原始 PRD §3.7）。 |
| A3 | 勾選，按 取消。 | 有上傳（network 面板可見一次對 proxy 的請求）；toast「感謝您！診斷資料已傳送。」 | 取消與重試在上傳行為上完全相同。 |
| A4 | 每次詢問 下首次成功上傳不含設計檔的報告。 | 一次性 一律自動/每次詢問 提示；選 一律自動 會改變 A1 的選單值。 | 提示不再出現：它會把 `'always'` 或 `'ask'` 寫入 `error-report-upload`，只有未設定（`null`）時才允許提示（§7.6）。按 Escape 關閉不寫入，下次上傳後可能再出現。 |
| A5 | 設為 一律自動。觸發不帶設計檔的錯誤。 | 無 checkbox；底部灰色狀態列；不需使用者操作即送出請求。 | 達每日上限時不顯示狀態列。 |
| A6 | 設為 永不。 | 視窗與 main 分支像素級相同。 | — |
| A7 | 檢視上傳的 bug_report。 | 無 `recent_files`、`auto-save-config`、`ador-backup-path`；任何位置（含 fluxghost log 段落）都無 `/Users/<name>` 或 `C:\Users\<name>`；探索清單中的裝置以型號取代使用者自訂名稱。 | 手動 說明 → Bug Report 下載不變（仍包含上述內容）。 |
| A8 | 一律自動 下，於同一本地日觸發 11 次白名單錯誤。 | 送出 10 次請求；第 11 次無狀態列，generic log 有「已略過（達每日上限）」；本地午夜後計數重置。 | 失敗的嘗試不計入。計數以序號為單位；無裝置的連線錯誤計在序號 `none` 下。 |
| A9 | 封鎖 proxy 主機，一律自動 下觸發錯誤。 | 嘗試 3 次後靜默；不跳新視窗。 | — |
| A10 | 匯出時 fluxghost 回傳錯誤（`#806`）。 | 視窗文字與現在相同，但以同意 checkbox 取代 是/否 上傳詢問；勾選設計檔同意後 SVG 才附於資料包（A13）。 | 不論是否已有機器連線，序號均為 `none`、韌體版本為空、不下載機器 log，並套用無裝置的上限。`aws-helper.ts` 已不存在；`uploadToS3` 無呼叫者。 |
| A11 | 一律自動 下，一小時內觸發同一裝置錯誤 5 次，隔天再觸發 1 次。 | 第一天只送 1 次請求（之後的視窗無狀態列）；第二天的視窗送 1 次請求，其 `occurrences_since_last` 為 4；第三天若無變化則不送（冷卻已延長為 7 天）。 | 不同 `error_code`、新的 app 版本或新的韌體版本會產生新指紋。每次詢問 下，冷卻期間 checkbox 隱藏，與每日上限相同。 |
| A12 | 連接閒置機器，同時呼叫 `DeviceMaster.downloadLog('fluxrobotd.log', undefined, 10000)` 與 `DeviceMaster.getReport()`，再交換順序重做。 | 兩者皆完成，第二個控制請求只在第一個完成後送出；下載進度仍回傳給對應 callback。 | 排隊中的下載不得覆蓋目前指令的進度 listener；log 終止錯誤後佇列仍可執行下一項；閒置逾時則關閉該 control 連線，下載與待執行項目都以 TIMEOUT 失敗，不向舊連線送下一條指令。不必上傳診斷 HTTP 請求即可驗證。 |
| A13 | 在每次詢問、總是傳送下各觸發 `#806` 與 `#809`；先不勾選關閉，再於未被 throttle 阻擋時勾選確認。另測不傳送、冷卻與每日上限。 | 前兩種設定皆顯示未勾選的專用 checkbox，說明將傳送此次處理的設計檔；不勾選不傳，勾選才一起傳診斷與檔案。不顯示自動傳送狀態列，成功後不跳自動傳送提示、不改偏好。 | 不傳送或 throttle 阻擋時不詢問、不上傳。依 `scene` 判斷而非只列錯誤碼；既有 checkbox 保留且不得繞過設計同意。 |
| A14 | 閒置機器上開始 log 下載並排入狀態查詢；模擬 10 秒無訊息，之後再送出舊下載的 transfer、binary、Blob 與 `ok`。重新連線後再查詢狀態。 | 下載與舊佇列的待執行請求收到 TIMEOUT；舊 socket 關閉，不送出排隊中的 `play report`，遲到封包不觸發重試或被當成狀態回覆。新連線的狀態查詢正常。 | 同時測試傳輸途中停頓、已收到 Blob 但缺最後 `ok`。對已失效 Control 新加 task 立即失敗；沒有殘留 timer 或 pending task。 |
| A15 | 連接機器 A，開始收集 player 與 robot log；第一份仍在下載時切換到已連接的 B，再讓 A 完成下載。 | 兩份 log 都從開始時取得的 A control 下載；B 不收到這次收集的任何 `fetch_log`，報告不混入 B 的內容。 | 取得原 control 失敗或下載失敗時保留原本的失敗註記，不改用 B；TIMEOUT 仍中止剩餘收集。每份檔案仍各自排隊，保留進度 callback。 |
| A16 | 分別觸發 `CONNECTION_*`、`#810`、`#805`、`#850`，在同意前恢復原機器連線，再勾選傳送。 | 報告保留已知序號與韌體，附 `bug_report` 但不附 `system_log`；不發出 `fetch_log`，使用原裝置的 throttle。 | 原裝置資訊未知時不借用目前另一台資訊；非連線錯誤省略此選項或傳 true 時仍可下載 log。更改此選項不得繞過冷卻。 |

## 6. 不得改變的事項

功能資料夾以外會被碰到的共用檔案，以及必須維持原行為的呼叫者：

- `app/lang/*.ts`、`interfaces/ILang.ts` — `consent.tsx`：新增設計／匯入檔案同意文案，23 種語言鍵值齊全；一般診斷 checkbox 文案保持不變。
- `helpers/api/control.ts` `addTask`／`createWs` — 所有 DeviceMaster 排隊呼叫：正常行為不變；log 逾時後舊 Control 的待執行／新加入請求明確失敗，舊 transport 的訊息不再派發。
- `helpers/api/control.ts` `downloadLog` — `DeviceMaster.downloadLog`：保留 log Blob 與進度回報；收到 Blob 與結尾 `ok` 後才完成，避免下一個指令誤收下載回覆。
- `helpers/device-master.ts` `downloadLog` — `menuDeviceActions.tsx` 手動下載 log：檔案與進度 callback 不變，改經控制佇列依序執行。
- `helpers/device-master.ts` `downloadLog` — `getLogsTexts`：每個檔案經控制佇列執行，整批固定同一 control；失敗保留註記，TIMEOUT 停止剩餘檔案，不改從其他機器取得。
- `helpers/device-master.ts` `getLogsTexts` — `MonitorContext.tsx` 手動 Bug Report：下載檔案與進度不變，切換機器後仍使用原 control。
- `helpers/device-master.ts` `getLogsTexts` — `helpers/error-report/index.ts`：背景抓 log 不得與佇列中的控制指令重疊，整批 log 不得混入新選擇機器的內容。

- `helpers/output-error.ts` — `menuActions.ts:64` `BUG_REPORT` — 下載仍產出完整、未清除的報告；`MonitorContext.tsx:548` `handleReport` — 同上；`websocket.ts` — 不再呼叫任何上傳函式；`uploadBackendErrorLog` 已刪除，由 `#802` 視窗的同意勾選框負責上傳。
- `app/components/dialogs/Alert.tsx` — 所有既有 `checkbox:` 呼叫者（`retryWithRemoveBackground.ts:25`、`retakeContourPreview.ts:77`、`importSvg/index.tsx:46`、`importDxf.ts:52,120`、`AutoFocusButton/index.tsx:140`、`BasePreviewManager.tsx:279`、`handleExportAlerts.ts:150`）— callback 語意不變。2026-10-12 有動到：`Alert.tsx` 現在會渲染 `IAlert` 自 2021 年起就宣告、但改用 antd 後不再渲染的 `children` 欄位；S3 的狀態列用它。wave 1/2 的觸發點都沒有傳 `children`。唯一有傳的既有呼叫者 `NetworkTestingPanel.tsx:104`（網路測試正常後的三條說明提示，至今被默默丟棄，其 sass 仍掛在已失效的 `.modal-alert` 選擇器下）另開小分支修正：改用 `links` 並刪除該段 sass，於本功能的合併 PR 之前先進。
- `helpers/device-master.ts:580` `popConnectionError` — `select` :410 與 `selectDeviceWithSwiftray` :530 — 警示 id `connection-error`、`Alert.popById` 原地替換、訊息文字與 `{ success: false, error }` 回傳值不變；`reconnect()` → `select()` 仍會跳出同一視窗（吸收重試風暴的是冷卻機制，不是視窗）。
- `app/contexts/MonitorContext.tsx:314,495,980`、`helpers/device-master.ts:266`、`actions/beambox/export-funcs.ts:778`、`export-funcs-swiftray.ts:106-192`、`helpers/handleAutoConnect.ts:216` — 第一波觸發點：警示 id、訊息文字、按鈕組與周邊控制流程（`onClose()`、`return { success: false }`、`setStatus('listening')`）不變；只包裝設定物件。
- `actions/camera/preview-helper/*`、`components/dialogs/camera/*`、`DiodeCalibration/Component.tsx` — 第二波觸發點，同一規則；`BasePreviewManager.tsx:273` 相機線材警告不動；`preview-mode-controller.ts:281` `onPreviewFail` 在警示後仍呼叫 `this.end()`。`BeamPreviewManager.setup` 的 catch 改走 `handlePreviewSetupError`；唯一可見差異是非 `Error` 的拋出值（fluxghost 的 `string[]`）會在 `#803` 文字後以 JSON 顯示，而不是空字串（2026-10-14 接受）。
- `app/contexts/MonitorContext.tsx:598-633` — 三個錯誤分支維持各自的按鈕組（`abort` / `retry+cancel` / `retry+bug report+cancel`）與透過 `Alert.checkIdExist` 的 `errorId` 去重。
- `actions/beambox/export-funcs.ts`、`export-funcs-swiftray.ts`、`importSvg/utils/uploadAndDivideSvg.ts` — 錯誤訊息文字（`#806 …`、`#809 …`）與 `resolve(null)` / `return null` 流程不變；是/否 上傳提問移除，場景改以 thunk 傳入，因此 `svgCanvas.getSvgString()`（會解散暫時選取群組）只在真的上傳時執行，不傳送 或冷卻期間都不會跑。
- `app/constants/storageConstants.ts`、`interfaces/IStorage.d.ts` — 只新增鍵名。
- `app/components/settings/categories/Privacy.tsx` — `enable-sentry` 開關不變。
- `interfaces/IOperatingSystem.ts`、`apps/app/src/implementations/os.ts`、`apps/web/src/implementations/os.ts` — 只新增 `machineId`，自含 try/catch 並回傳 `''`；所有既有 `os.*` 呼叫者（`output-error.ts:39`、網路 helper、字型 helper）不變。
- `app/lang/*.ts`（全部 23 個）與 `interfaces/ILang.ts` — 新增 `error_report` 命名空間；`beambox.popup.backend_connect_failed_ask_to_upload` 改名為 `backend_connect_failed` 並拿掉上傳提問；`export_file_error_ask_for_upload`、`import_file_error_ask_for_upload`、`upload_failed`、`upload_file_too_large` 隨最後呼叫者一併移除（`#819` 不再使用）。`successfully_uploaded` 與 `progress.uploading` 保留給 `Monitor.tsx`。
- `components/settings/shared/hooks/useSettingStore.ts` `getConfig` — 鍵未設定時，只在 `DEFAULT_CONFIG` 有預設值才把預設值寫回儲存；其他鍵的行為不變（都有預設值）。若不改，開啟 設定 → 隱私 會為 `error-report-upload` 寫入 `undefined`，在 electron-store 會拋錯、在 web 會存成字串 `"undefined"`（2026-10-14 審閱發現）。由 `useSettingStore.spec.ts` 涵蓋。

## 7. 設計

`UploadErrorReportOptions.includeDeviceLog?: boolean` 預設為 true；false 僅略過裝置 log 讀取與 `system_log` 附件，不改變裝置 metadata、fingerprint 或計數。機器連線類入口明確設定 false；相機預覽／校正錯誤維持既有 log 行為。`popConnectionError` 找不到原裝置資訊時使用 `device: null`，不得回退成另一台目前機器。


### 7.1 模組

裝置來源須明確區分：省略 `device` 使用目前機器，傳入 `IDeviceInfo` 使用指定機器，`device: null` 表示無裝置。`#802`、`#806`、`#809` 與 QR 自動連線錯誤即使已有其他機器連線也傳入 null：序號為 `none`、韌體版本為空、不下載裝置 log，並使用無裝置的指紋與計數套用上限。

新增 `packages/core/src/web/helpers/error-report/`（獨立資料夾，spec 同置）：

- `index.ts`
  - `uploadErrorReport({ errorCode, scene? }): Promise<UploadResult>`（`'sent' | 'duplicate' | 'failed' | BlockReason`）— 組資料包、套用上限（加上進行中集合，同一指紋的兩個視窗只產生一次上傳）、以每個檔案 10 秒閒置上限讀取機器 log、以 3 分鐘逾時 POST 最多 3 次、成功後增加計數。toast 與一次性提示在 `consent.tsx`（`uploadWithFeedback`，僅每次詢問路徑），不在此處。`scene` 是在上傳內、偏好與上限檢查之後才解析的 thunk（2026-10-14，審閱發現）；其大小上限併入 §9.1 的 bytes 配額。
  - `withErrorReportConsent(alert: IAlert, options: UploadErrorReportOptions): IAlert`（`consent.tsx`；2026-10-12 由 `errorCode: string` 改為選項物件，讓 `#806`/`#809` 能傳入場景檔）— 讀取偏好設定，回傳依情境 A/B/C 裝飾後的警示設定**副本**，無事可做時回傳原物件。觸發點寫成 `alertCaller.popUp(withErrorReportConsent({...}, { errorCode }))`。checkbox callback 使用函式形式：Alert 會在任一按鈕上先執行它、再執行該按鈕自己的 `onClick`；陣列形式則會取代按鈕的 `onClick`。
  - `preference.ts` — `getErrorReportPreference()` 把未設定的鍵對應為 `'ask'`；這個後備值只住在這裡。
- `scrub.ts` — `scrubReport(text: string): string`（家目錄路徑正規表示式）與 storage 排除清單，只用於上傳路徑。
- `installationId.ts` — `getInstallationId(): string`。Electron：`os.machineId()`，為新增於 `IOperatingSystem` 並**內嵌**在 `apps/app/src/implementations/os.ts` 的方法（2026-10-06 定案，不引入 `node-machine-id` 相依）：執行與 node-machine-id 相同的各 OS 指令（`ioreg -rd1 -c IOPlatformExpertDevice` / `REG.exe QUERY HKLM\SOFTWARE\Microsoft\Cryptography /v MachineGuid` / `/etc/machine-id`），做 sha256，並在自身 try/catch 內對任何失敗（指令不存在、逾時、解析錯誤）回傳 `''`。網頁版回傳 `''`。結果為空時 → 以 `uuid` v4（既有相依）產生一次並存於 `error-report-install-id`，因此識別碼永遠非空，呼叫端永遠不會看到例外。
- `throttle.ts` — 每日計數 `{ date, counts: Record<serial, number> }` 存於 storage 鍵 `error-report-counter`，以及每指紋冷卻表（§7.7）存於 `error-report-cooldown`；提供單一介面 `getBlockReason(serial, fingerprint): 'cooldown' | 'daily-limit' | null` / `getSkipped(fingerprint)` / `recordUpload(serial, fingerprint)` / `recordSkipped(fingerprint)`，上傳與同意裝飾器共用。

### 7.1.1 隔離原則

`helpers/error-report/` 內的任何東西都不得改變它所裝飾的錯誤視窗的結果。具體而言：`withErrorReportConsent` 每一步都包在 try/catch 內，任何失敗都原樣回傳輸入的 `IAlert`；`uploadErrorReport` 為 fire-and-forget（`void`），捕捉包含 `getLogsTexts` 與 `machineId` 在內的所有錯誤，只寫入 generic logger；checkbox 的 callback 只有一行 `void uploadErrorReport(...)`。上傳路徑壞掉時，重試 / 確認 / 取消 必須與 `main` 分支行為完全一致。以單元測試驗證：讓每個相依都拋出例外，斷言回傳的警示設定與輸入深度相等。

Log 收集共用既有控制佇列（2026-10-27）。`DeviceMaster.getLogsTexts` 在進入迴圈前只呼叫一次 `getControl`，所有檔案共用該連線結果（包含失敗）；切換機器不會改變收集來源，也不會在檔案間重新連線到另一台。`downloadLog` 與 `getLogsTexts` 共用 `downloadLogFromControl`，每份檔案仍是獨立的佇列 task。`Control.downloadLog` 必須同時收到 Blob 與結尾 `ok` 才完成；fluxghost 的 `fetch_log` 在二進位資料後仍會送出 `ok`（`../fluxghost/fluxghost/api/control.py`），不能在 Blob 到達時提早釋放佇列。`DeviceMaster.downloadLog` 將進度 listener 設定與傳輸包在同一個 task，因此不會消耗或清除其他佇列指令的 listener。按鈕 callback 仍立即執行，但其中排隊的機器指令可能等待正在下載的 log；共用佇列方案接受這項延遲。10 秒為下載 task 開始後的閒置逾時，不是整次下載或排隊等待的時間上限。逾時不代表後端已停止下載：逾時後標記該 Control 不可再使用、關閉 socket、拒絕待執行 task 並忽略遲到訊息。新加入舊 Control 的 task 也立即失敗；不自動重播機器指令。關閉事件沿用 DeviceMaster 的連線清理／重連流程，後續操作使用新的 Control。其他未使用 `addTask` 的舊方法不在這次序列化範圍內。

### 7.2 資料包內容與清除

- `bug_report.txt` = `getOutput({ includeImages: false, scrub: true })`。`scrub`（`getOutput` 的新選項）移除 storage 鍵 `recent_files`、`auto-save-config`、`ador-backup-path`（使用者路徑）、`flux-101`（以 FLUX ID email 為鍵）與 `maintenance-records`（機器暱稱、任務紀錄的 `by`），把探索清單的 `name` 換成 `model`，再對合併後的字串跑 `scrubReport`。即使有排除清單仍需要正規表示式，因為家目錄會從 `storage` 以外的地方進入報告：websocket 段落記錄每一筆送出的指令（`websocket.ts:325`），而字型指令帶有使用者自行安裝字型的絕對路徑（`utils-ws.ts:152` 的 `select_font` / `check_exist` / `upload_to`，`fontHelper.ts:236,325`），macOS 在 `~/Library/Fonts`、Windows 在 `%LOCALAPPDATA%\Microsoft\Windows\Fonts`。fluxghost log 預設為 INFO 等級（`../fluxghost/fluxghost/launcher.py:10`），其含家目錄的 debug 行只在 `--debug` 時出現；正規表示式也一併涵蓋。
- `system_log.txt` = `getLogsTexts` 結果串接，只在 `deviceMaster.currentDevice?.control` 存在時附上。
- `scene.svg`（僅 S7）= `svgCanvas.getSvgString()` 或匯入檔案文字。
- 一般診斷文案維持不附設計檔；有 `scene` 時使用專用文案：「傳送診斷資料與此次處理的設計檔給 FLUX，協助排查此錯誤」（匯出與匯入共用 `consent_design_checkbox`）。設計檔文案不得承諾不含設計檔或個人資料，因檔案內容可能包含個人資料。序號與電腦識別碼可用於關聯報告，不應宣稱匿名。

### 7.3 網頁版的裝置 Log

只要有裝置控制 socket，`getLogsTexts` 就能運作，所以網頁版不排除。fluxghost log 檔（`window.FLUX.logFile`）僅 Electron 有，`getOutput` 已能處理其不存在。

### 7.4 白名單（所有錯誤視窗觸發點，2026-10-08 全面掃描）

以真實錯誤碼表示，而非原始 PRD 中的虛構代碼。掃描範圍涵蓋 `lang/en.ts` 內所有 `#NNN` 字串、程式碼內所有行內 `#NNN`，以及所有 `DeviceErrorHandler.translate` 呼叫者。第一波＝機器與連線（PR 3），第二波＝相機與校正（PR 3b）。排除的觸發點一併列出，方便稽核。

**第一波 — 機器與連線**

| 觸發點 | 傳給 `withErrorReportConsent` 的代碼 | 序號 |
|---|---|---|
| `MonitorContext.tsx:598` ALARM/FATAL 與 `:625` 其他裝置錯誤 | `error.join('_')`，但錯誤類別為 `HARDWARE_ERROR` 或 `USER_OPERATION` 時不接（2026-10-13 決定：韌體已明確回報硬體故障，診斷包沒有額外價值；因此 `#9xx`、`#401`、`#402`、`#905` 字串皆排除） | 有 |
| ~~`MonitorContext.tsx:608` HARDWARE_ERROR~~ | 2026-10-13 排除，見上 | 無 |
| `MonitorContext.tsx:495` 狀態輪詢逾時 | `#805` | 有 |
| `MonitorContext.tsx:980` 工作無法啟動 | `#830` ＋ `error.join('_')` | 有 |
| `MonitorContext.tsx:314` Promark USB 斷線 | `#850`（info 型視窗，同一裝飾器） | 有 |
| `device-master.ts:580` `popConnectionError`（呼叫者 `select` :410、`selectDeviceWithSwiftray` :530） | `CONNECTION_TIMEOUT`、`CONNECTION_DISCONNECTED`（`#891`/`#892`）、`CONNECTION_UNKNOWN_DEVICE`，default 分支則為 `CONNECTION_` + fluxghost 原始代碼。排除 `NOT_FOUND`：機器從探索清單消失，通常是關機。僅有「確認」按鈕的視窗（原始 PRD §3.7）。 | 有 |
| `device-master.ts:266` 密碼正確但連線失敗 | 僅 `#810`；`#811` 密碼錯誤排除 | 有 |
| `export-funcs.ts:778` 在 Monitor 開啟工作失敗 | `#807` | 有 |
| `export-funcs.ts:257,315,503`、`export-funcs-swiftray.ts:89` 工作產生失敗 | `#806`（＋ scene.svg） | 無 |
| `websocket.ts:28` 後端連線失敗 | `#802` | none |
| `handleAutoConnect.ts:216` QR 自動連線失敗 | `QR_AUTOCONNECT_FAILED` | none |
| `uploadAndDivideSvg.ts:31` 匯入失敗 | `#809`（＋ 匯入檔案） | none |

**第二波 — 相機與校正**（皆為軟體端代碼；不需韌體對照表，故 §11 D4 定案）

| 觸發點 | 代碼 | 備註 |
|---|---|---|
| `preview-helper/handlePreviewSetupError.tsx:39,55`（`BeamPreviewManager.ts` 改為呼叫它，不再自帶一份） | `#803` | 預覽啟動 / 相機 WS |
| `beambox/preview-mode-controller.ts:281` `onPreviewFail` | 訊息開頭的 `#8xx`（`#844` 相機關閉、`#845` 忙碌），否則 `PREVIEW_FAILED` | 預覽迴圈的所有失敗都在此顯示；2026-10-13 自 `BasePreviewManager.tsx:273` 修正，該處其實是相機線材不穩警告（自帶 `checkbox`、硬體狀態，排除） |
| `helpers/api/camera.ts:130,424,427` 與 `BasePreviewManager.tsx:273` 拋出 `#844`/`#845` | 由 `onPreviewFail` 顯示；本身無視窗 | — |
| `camera/AdorCalibration/utils.ts:122` | `#848` | 校正 / 下載照片失敗 |
| `DiodeCalibration/Component.tsx:251,344`、`CameraCalibration/StepRefocus.tsx:189`、`StepAskReadjust.tsx:56` | `#815` | 校正移動 / 拍攝時的裝置錯誤 |
| `CameraCalibration/StepBeforeAnalyzePicture.tsx:247` | `#816` | 分析失敗 |

**已定義 `checkbox` 的視窗規則**（目前接線的觸發點都沒有；`BasePreviewManager.tsx:273` 的相機線材警告已排除，§6 的八個呼叫者不是錯誤觸發點）：`withErrorReportConsent` 絕不取代既有 `checkbox`。每次詢問 或帶 scene 的一律自動 下原樣回傳且不上傳；無 scene 的一律自動 下靜默上傳並只加狀態列。一個視窗只有一個 checkbox。

**Message toast 無法承載同意**（`AbstractMenu.ts:66` 以 `MessageCaller` toast 顯示 `#805`）：排除；同一逾時在下次選擇裝置時會進到 `popConnectionError`。

**排除項目與理由**

- 韌體回報的硬體故障 `HARDWARE_ERROR_*`（2026-10-13 決定）：韌體已指出故障為何，客戶端診斷包沒有額外價值。
- 使用者狀態或操作，非缺陷：相機線材不穩警告（`BasePreviewManager.tsx:273`，自帶 `checkbox`）、`#801` 無裝置、`#804` 工作區不符、`export-funcs-swiftray.ts` `popupError` 的 Swiftray `busy` 資訊視窗、`#808` 無效圖片路徑、`#811` 密碼錯誤、`#814` / `#820` 韌體過舊、`#851` / `#852` 缺校正資料、Promark 對話框中的 `#901` 門未關、`USER_OPERATION_*`、`REMOVE_CARTRIDGE`、`ConnectionError.NOT_FOUND`。
- Print and Cut 校正刮痕任務失敗（`PrintAndCutCalibration.tsx:150`，2026-10-13 決定）：該處的錯誤是裝置自身的錯誤清單，多為硬體故障與使用者中止，已被上述規則排除；不值得為此單獨拆分。
- 同一次失敗已有警示、此為第二個警示：`device/get-device.ts:103` 的 `#813`（2026-10-13 決定）。`select` 每種失敗都會先彈出 `popConnectionError`、`#810`/`#811` 或 `#820`，或是使用者取消密碼對話框後才出現；若也接上 `#813`，同一次失敗會出現兩個同意勾選框並送出兩份不同代碼的報告。
- 診斷工具本身：`#817`、`#818`、`#840`–`#843` 網路測試面板；`#819` 上傳失敗。
- 與機器無關：`#822` / `#823` 應用程式更新、`#847` 雲端服務、`#846` 文字轉路徑解析、`#974` 連續雕刻。
- 無呼叫者的死字串：`#824`、`#825`、`#827`、`#843`、`#849`。

### 7.5 後端：flux-id 端點，儲存藏在 Django storage 別名之後（先用 R2）

§11 D1 已定案。端點放在 flux-id，讓團隊能以設定切換儲存供應商，並重用既有的流量限制與部署流程。

- 端點：`POST {FLUXID_HOST}/api/beam-studio/error-report`，multipart，欄位 `serial`、`installation_id`、`error_code`、`app_version`、`os`、`firmware_version`、`occurrences_since_last`，檔案 `bug_report`、`system_log`、`scene`。回應 `{ status: 'ok' }`。不需驗證（`csrf_exempt_auth_classes`，同 `flux101.py`），不需 FLUX 帳號。
- view 內驗證：整體 body ≤ 20 MB（nginx 已限 32 MB），`serial` 符合 `^[A-Za-z0-9-]{1,32}$` 或 `none`，`error_code` ≤ 64 字元，只接受三個已知檔案欄位，忽略各檔案的 content type，統一存為 `text/plain` / `image/svg+xml`。
- 儲存：Django 4.2 的 `STORAGES['error_report']` 別名，指向 `storages.backends.s3boto3.S3Boto3Storage`，`endpoint_url = https://<account>.r2.cloudflarestorage.com`，bucket `flux-id`（正式環境以外為 `flux-id-test`），置於 `error-report/` location 前綴下，`default_acl = private`。view 只呼叫 `storages['error_report'].save(path, file)`。**切換供應商＝改那一筆設定**（S3、B2、GCS、MinIO 都相容 S3；Google Drive 需在同一別名後面放自訂 `Storage` 子類）。程式碼不新增抽象層；`django-storages` 本身就是。
- 物件鍵（`{code}` 為去掉 `#` 的 `error_code`，`#806` → `806`）：只要有已知裝置就是 `{serial}/{ISO ts}_{code}_bug_report.txt`、`_system_log.txt`、`_scene.svg`；無裝置來源的錯誤（`#802`、`#806`、`#809`、QR 自動連線）為 `no-device/{installation_id}/{ISO ts}_{code}_...`。不做序號驗證：曾考慮已驗證/未驗證分級，因 flux-id 序號表涵蓋的現役機器太少而放棄（backend.md §10 B3）。序號格式只做寬鬆驗證（`^[A-Za-z0-9-]{1,32}$`），不綁定目前的 10 字元長度。
- 伺服器端去重（client 冷卻表被清除時的後備）：儲存前先列出 `{serial}/` 或 `no-device/{installation_id}/` 前綴；若已有相同 `{code}` 且 `ts` 在最近 24 小時內的物件，回應 `{ status: 'duplicate' }` 且不儲存。每次上傳一次 R2 Class B list 呼叫。client 把 `duplicate` 視為成功（計入上限與冷卻），但不顯示「已傳送」toast。
- 防濫用與儲存上界，共五層（細節見 [backend.md §6](backend.md)）：Cloudflare WAF 每 IP 流量限制規則；DRF 每 IP 限流 `6/hour` 與 `20/day`，單一 IP 即使捏造序號每天最多 20 × 20 MB = 400 MB；**全域每日位元組預算**（2 GB/日，超過回 `429 { status: 'budget' }`），不論攻擊者用多少 IP 或偽造多少序號，bucket 最壞情況約 360 GB；每資料夾上限與 24 小時去重；client 端每日上限與指紋冷卻（§7.7）。`429` 對 client 而言就是失敗：不重試（只有沒有回應與 5xx 會重試）、靜默，冷卻不推進。
- 保留：R2 物件生命週期規則，180 天後刪除。不需 cron 程式。
- 每資料夾上限：保留（§11 D5）。每個 `{serial}/` 與 `no-device/{installation_id}/` 資料夾上限為 `ERROR_REPORT_FOLDER_CAP_BYTES`（預設 20 MB，flux-id 設定）。view 重用去重時已做的前綴列舉，所以上限不多花一次來回；演算法與成本見 [backend.md §4](backend.md)。
- 指標：flux-id 的 `ErrorReportDailyStat` 資料列，每個 UTC 日、每個錯誤碼一列（上傳數、重複數、拒絕數、預算拒絕數、位元組數、請求耗時總和），§9.2 直接彙總，並由 Celery beat 每日發一則 Slack 摘要；每日預算用盡與儲存失敗會警示到 flux-id 的 Slack 頻道（[backend.md §6–7](backend.md)，2026-10-15 完成）。flux-id 的 statsd 已是死碼（無 host、無接收端；2026-10-12 確認），log 不作為資料來源。§9.2 的延遲列仍讀 gunicorn access log、Cloudflare 分析與 Linode 圖表。
- 同步 vs. 非同步：v1 在請求內寫入 R2（一個同步 gunicorn worker 被 R2 PUT 佔用，從 Linode 傳 10 MB 約 1–3 秒）。若 §9 顯示需要，升級路徑為：先存本機磁碟再由 celery 任務推送，或由端點發給 client 一個 presigned R2 PUT URL，讓資料完全不經 Linode。celery 路徑不改 client 契約；presigned 路徑多一次來回，屬 v2 決策。

### 7.6 偏好設定與提示

凡 `UploadErrorReportOptions.scene` 存在，`consent.tsx` 先套用不傳送與 throttle，再將總是傳送視為每次詢問；不呼叫 scene thunk，直到使用者勾選後進入實際上傳。已有 checkbox 時原樣返回且不傳送。有 scene 的成功上傳只顯示感謝 toast，永不觸發自動傳送提示。以下自動傳送與首次提示規則只適用無 scene 的報告。

- `error-report-upload: 'always' | 'ask' | 'never' | null`。`null`（從未選擇）行為同 `'ask'`，且是唯一允許顯示一次性提示的狀態；`'ask'` 代表使用者在提示或設定中選過，不再提示。2026-10-12 修訂：取消獨立的 `error-report-upload-prompted` 旗標，因為未設定值已經帶有這個資訊，與 `enable-sentry` 的慣例相同。此鍵刻意**不**放進 `useSettingStore` 的 `DEFAULT_CONFIG`：router 啟動時會把那張表的鍵全部寫進 storage，會在任何上傳之前就把 `null` 變成 `'ask'`。
- 提示為 `Alert.popUp`，在 `null` 下首次成功上傳後顯示：標題「自動傳送？」，訊息「要每次發生錯誤時都自動傳送診斷資料嗎？您可隨時在「偏好設定 > 隱私權」中更改。」，按鈕 [每次詢問] / [總是傳送]（總是傳送為右側主要按鈕，依警示視窗慣例）分別寫入 `'ask'` / `'always'`。按 Escape 不寫入。「尚未選擇」的判斷在上傳完成後才做，所以上傳期間在設定中選好的值不會被覆寫；因此提示會在上傳結束時出現，在三次重試的路徑上可能是錯誤發生後數分鐘（2026-10-14 接受）。
- 成功後的 toast（每次詢問，包含設計檔強制詢問）：「感謝您！診斷資料已傳送。」依產品規則用中性措辭：不得暗示開單或回覆。

### 7.7 重複抑制（指紋冷卻）

問題：一次連線失敗，每按一次重試就產生一份報告；同一個 LAN 問題每天都產生同樣的報告。單靠每日上限仍允許一天 10 份幾乎相同的上傳。

- `fingerprint = serial | error_code | app_version | firmware_version`（直接串接，只存在 client 本地；2026-10-12 自 sha1 修訂：本地 map 的鍵不需要雜湊，且不送往伺服器，伺服器已收到這四個欄位）；無裝置連線時 `firmware_version` 為 `''`。安裝識別碼刻意**不**放進去：它在同一台電腦上是常數，不會改變本地去重結果，而伺服器需要明文的它來分組與去重（§7.5）。
- storage 鍵 `error-report-cooldown: Record<fingerprint, { level: number; nextAllowed: number; skipped: number }>`（`level` 為下表視窗的索引；2026-10-12 自 `lastSent` 修訂）。
- 首次發生即上傳。`now < nextAllowed` 期間 `getBlockReason` 回傳 `'cooldown'`：不上傳、checkbox 隱藏（每次詢問）或無狀態列（一律自動），`skipped += 1`。
- 每次成功上傳後視窗沿表格放寬：1 小時 → 24 小時 → 7 天 → 30 天（上限）。報告帶上 `occurrences_since_last = skipped`，之後 `skipped` 歸零，伺服器仍能得知錯誤發生頻率。
- 序號、錯誤碼、app 版本或韌體版本任一改變即產生新指紋與新視窗；使用者更新韌體試圖修復但仍失敗時，恰好得到一份新報告。
- 寫入時修剪 `nextAllowed` 已過 30 天以上的項目，保持表格精簡。
- 手動 說明 → Bug Report 與 Monitor 下載按鈕不受冷卻限制；冷卻只管自動/同意路徑。

## 8. 資料契約

- Storage：`error-report-upload`（可為 null，§7.6）、`error-report-install-id`（僅網頁版 / 後備）、`error-report-counter: { date: 'YYYY-MM-DD', counts: Record<serial, number> }`、`error-report-cooldown`（§7.7）。
- `IOperatingSystem.machineId(): string` — Electron 回傳 OS 機器 GUID 的 sha256（內嵌實作，§7.1），網頁版回傳 `''`。
- 不新增相依；`machineId` 約 25 行，寫在既有 os 實作內，以 `crypto.createHash` 雜湊各 OS 指令的輸出；指令在模組載入時用非同步 `child_process.exec`（2 秒逾時）啟動，renderer 不會被卡住；`execSync` 只留作報告搶在結果回來之前觸發時的後備。
- 上傳請求：§7.5 multipart，3 分鐘逾時。回應 `{ status: 'ok' }` → 已送出；`{ status: 'duplicate' }` → 視同已送出；沒有回應或 5xx → 重試（最多 3 次）；任何 4xx 或無法辨識的 2xx 內容 → 立即失敗。
- i18n：`en.ts`/`zh-tw.ts` 新增命名空間 `error_report`（實作版本）：`consent_checkbox`、`consent_design_checkbox`、`sent`、`sent_automatically`、`prompt_caption`、`prompt_message`、`setting_label`、`always`、`ask`、`never`（後三者同時用於隱私設定的下拉選單與提示按鈕）。

## 9. 效能

### 9.1 Client

- fluxghost log 很大時，報告現在可能超過 10 MB（舊的 `uploadToS3` 會拒絕超過 10 MB 的 body）。`bug_report.txt` 維持 10 MB 上限，做法是從後端段落的開頭截斷，而不是拒絕上傳：`getOutput({ maxLength })` 先量測其餘所有段落，再把剩下的預算給 fluxghost log，因此上限是針對整個檔案。接著 `uploadErrorReport` 以 bytes（`Blob.size`）把整包塞進後端限制（`400 too_large` 不會重試，所以必須由 client 端配合）：`bug_report` 超過 10 MB 時保留最新的 10 MB，`scene` 超過 10 MB 或剩餘空間時整個丟掉，`system_log` 截到 20 MB 請求扣掉前兩者（再扣 64 KB 給 multipart 欄位）後的剩餘量，沒有剩餘就丟掉。scene 優先於機器 log，因為只有匯出／匯入錯誤會帶 scene，而那時設計檔才是主要證據。整體 body 因此維持在 view 的 20 MB 檢查、nginx 的 32 MB 與 Cloudflare 免費方案 100 MB 限制之下。
- Monitor 路徑的裝置 Log 下載已有分段進度；自動路徑靜默執行，裝置忙碌時（`getMode()` 非 idle）略過。

### 9.2 flux-id 影響矩陣

主機為 Linode 專用 4 vCPU / 8 GB / 160 GB，同時跑 mysql、redis、celery、nginx 與 9 個同步 gunicorn worker。每次上傳在 R2 PUT 期間佔用一個 worker，所以關鍵數字是 worker 佔用率而非 CPU。nginx 會先緩衝整個 request body 再轉送，所以 client 端慢速連線不會佔住 worker。

負載模型：有 §7.7 後，實際速率約為每（序號, 錯誤）每日一次上傳。以悲觀的每日 300 次、每次 5 MB，以及 10 個並發 10 MB 上傳的爆量情境規劃。

| 指標 | 來源 | 基準（實施前） | 悲觀 300/日 | 爆量 10 × 10 MB | 門檻 | 超過時的動作 |
|---|---|---|---|---|---|---|
| 既有端點 p95 延遲（`/user/activity/beam-studio`、登入） | gunicorn access log 請求耗時（PR 6 啟用）/ Cloudflare 分析 | 量測 | 量測 | 量測 | 比基準多 50 ms | R2 PUT 移到 celery |
| gunicorn 忙碌 worker 數（共 9） | `ps` 取樣 `gunicorn: worker` 處於 `R` 狀態的程序數 | 量測 | 預期 < 1 | 預期 ≤ 10 排隊 | 持續 ≤ 4 | presigned R2 PUT（資料繞過 Linode） |
| 上傳耗時，平均（`duration_ms / uploads`）與 p95 | 平均讀 `ErrorReportDailyStat` 彙總；p95 讀 gunicorn access log | 不適用 | 量測 | 量測 | p95 ≤ 5 秒 | 檢查 Linode → R2 路由，考慮 celery |
| CPU %（所有容器） | Linode 圖表 | 量測 | 量測 | 量測 | +10 個百分點 | celery |
| RAM、nginx `client_body_temp` 與 Django 暫存上傳用量 | Linode 圖表、`df /tmp` | 量測 | 量測 | 量測 | 請求結束後不增長 | 修正清理 |
| Linode 對外流量 | Linode 帳號流量池 | 量測 | ≈ 45 GB/月 | 不適用 | ≤ 方案流量池 10 % | presigned PUT |
| R2 儲存量 / Cloudflare 規則的 429 數 | R2 儀表板、Cloudflare 安全事件 | 0 | 180 天穩態約 270 GB | 不適用 | 429 僅來自濫用 | 調整規則 |

程序：§10 第 6 步上線前先記錄一週基準欄；用腳本對 staging 並行 POST 10 MB 樣本重現爆量情境；上線一週後重讀同樣欄位。量測數字記回此表。

## 10. 上線計畫（PR 順序）

1. `helpers/error-report/`（scrub、throttle、installationId、`uploadErrorReport`）＋ `getOutput({ scrub, maxLength })` ＋ 單元測試。無呼叫者、無字串、無 UI。**PR #1021，2026-10-19 已合併**（2026-10-14 審閱修正）。
2. 偏好設定鍵、隱私頁下拉選單、i18n（en、zh-tw）、`preference.ts`、`helpers/error-report/consent.tsx` 的 `withErrorReportConsent`（2026-10-12 自 PR 1 移到此處，因為它需要同意文案），以及 `Alert.tsx` 的 `children` 渲染（§6）。2026-10-12 完成；放在 `feat/error-report-consent`。
3. 取代 `uploadBackendErrorLog` 並刪除 `aws-helper.ts`；把 §7.4 第一波觸發點接上 `withErrorReportConsent`。2026-10-13 完成：九個觸發點；新增 `UploadErrorReportOptions.device` 供在 `currentDevice` 更新前就觸發的位置使用，裝置 Log 只在目前 socket 屬於該機器時讀取。
3b. 接上 §7.4 第二波相機觸發點（同一機制）。2026-10-14 於同一分支完成；因為只是六個同形狀的呼叫點，放棄獨立 PR 的做法。`BeamPreviewManager` 改為重用 `handlePreviewSetupError`。
4. 一次性 一律自動 提示 ＋ toast。2026-10-14 完成。
5. 其餘 21 種語言（2026-10-14 完成，機器草譯、待母語校對；移除四個孤立的上傳字串與 `#819`）；feature-review；第 2–5 步的雙語 PR：**#1028**，2026-10-20 開啟。
6. flux-id：配套 PRD、`STORAGES['error_report']` 別名 ＋ R2 bucket ＋ 生命週期規則、含流量限制的 DRF view、每日統計列與 Slack 摘要及警示、啟用 gunicorn access log、Cloudflare WAF 規則。程式於 2026-10-15 完成，flux-id PR #683 於 2026-10-19 合併；bucket、webhook、生命週期與 WAF 規則已於 2026-10-15 設定；§9.2 的基準週尚待讀數。可與 1–2 平行進行；在此之前第 3 步指向 staging。

## 11. 待決事項

1. ~~D1 後端與儲存。~~ 2026-10-06 定案：端點放 flux-id（重用流量限制、部署；供應商可透過 `STORAGES` 別名切換），儲存用 Cloudflare R2（已有帳號、無流出費用、原生生命週期）。S3 否決；Google Drive 於 v1 否決（需共用雲端硬碟＋服務帳號＋cron 清理），但日後可作為同一別名後的自訂 storage 類別。flux-id 影響依 §9.2 量測。
2. ~~D2 離線佇列。~~ 2026-10-06 定案：v1 不做（payload 可達 10 MB，`storage` 為 JSON）；只做 3 次程序內重試。
3. ~~D3 清除 vs.「匿名」文案。~~ 2026-10-06 定案：依 §7.2 清除，文案改為「不含設計檔案與個人資料」。2026-10-19 修正：「不含設計檔案」與 S7 衝突，文案改為點名匯出／匯入錯誤時包含設計（§7.2）。 2026-10-27 定案：依是否帶 `scene` 分開同意；設計檔每次詢問（不傳送與 throttle 優先），不受自動傳送涵蓋，見 S7。
4. ~~D4 相機/校正白名單。~~ 2026-10-08 定案：由程式碼全面掃描列出（§7.4 第二波）；不需韌體對照表，因為 Monitor 錯誤以 `error.join('_')` 原樣透傳。
5. ~~D5 每序號 20 MB 上限。~~ 2026-10-06 定案：**保留**，為每資料夾總量（非每檔案），可由 flux-id 設定調整，同時適用於 `{serial}/` 與 `no-device/{installation_id}/`。成本低，因為物件鍵依時間由舊到新排序，且列舉與去重檢查共用；每份報告大小受 client 10 MB 截斷限制。見 [backend.md §4](backend.md)。

## 12. 風險與後續

- 清除正規表示式漏掉某種路徑格式（例如 Linux 的 `/home/<name>`）。補上即可；正規表示式清單放在 `scrub.ts`，每個 OS 一個測試樣本。
- 工作進行中下載裝置 Log 可能卡住 Monitor。以 §9.1 的 idle 檢查緩解。
- 內嵌的 `machineId` 讀取穩定的硬體/OS 識別碼，同一台電腦的報告在重新安裝後仍可關聯。2026-10-06 針對無序號的無裝置情境接受此點；維持雜湊輸出，同意文案已說明報告包含機器識別碼。
- 請求內同步 R2 PUT 會佔用 gunicorn worker；上傳爆量可能延遲登入。§9.2 的門檻會在造成傷害前觸發 celery 或 presigned URL 升級。
- Sentry（`enable-sentry`）已擷取 JS 堆疊；本功能不取代它。在隱私頁文案註明兩者的重疊。
- ~~後續：接線時逐一分類 `export-funcs-swiftray.ts` 的 `#812` 分支。~~ 2026-10-13 已分類：該檔案沒有 `#812`；所有錯誤都經由 `popupError`，`cancel` 時靜默、`busy` 時為資訊視窗（排除，機器使用中）、其餘為 `#806`（已接線）。`#812` 只存在於未使用的語言字串（`message.device_not_found.message`），其標題在 `get-device.ts` 以資訊 toast 顯示。

## 13. 測試計畫

驗收紀錄（2026-10-27）：測試者透過暫時的 DevTools `popErrorReportTest` 入口，確認同意視窗、偏好、throttle、上傳內容與後端儲存路徑皆正常。三種報告情境均通過：附場景且無機器資訊、有機器序號但無機器 log、有機器序號且有機器 log。場景報告存入 `error-report/no-device/{installation_id}/`，後兩者均存入 `error-report/{serial}/`。此結果驗證同意與上傳的整合流程，不涵蓋實際匯出／匯入錯誤入口及取得當次真實設計檔的流程。暫時測試入口已於驗收後移除，不屬於正式 API。

- `helpers/error-report/index.spec.ts`：連線已恢復且閒置時，false 仍不讀 log、保留 metadata 與原裝置計數／冷卻；省略或 true 維持下載。

- 單元測試：`scrub.spec.ts`（macOS、Windows、Linux 家目錄路徑、ws 段落的 `> select_font /Users/x/Library/Fonts/a.ttf` 行、fluxghost `--debug` 設定行的樣本；排除鍵已移除；手動路徑不受影響）、`throttle.spec.ts`（每日上限、本地午夜重置、失敗不計入、以序號為單位；冷卻加倍 1 小時 → 24 小時 → 7 天 → 30 天、略過次數帶出並歸零、版本變更產生新指紋、修剪）、`consent.spec.tsx`（三種偏好 × checkbox 是否出現、既有 checkbox 保留、冷卻或每日上限期間 checkbox 隱藏、callback 啟動上傳、**所有相依拋出例外 → 原樣回傳輸入的警示設定**、有 scene 在 Ask／Always 都需同意且成功後無自動傳送提示）、`installationId.spec.ts`（machineId 成功 → 雜湊值、machineId 為 `''` 或拋出 → 儲存的 UUID、多次呼叫結果穩定）。
- 佇列回歸：`helpers/device-master.spec.ts` 使用真實 `Control` 佇列與指令 handler，搭配假傳輸；涵蓋兩種請求順序、Blob 後等待結尾 `ok`、進度 listener 歸屬、log 終止錯誤後繼續執行；傳輸中或等待結尾 `ok` 逾時後拒絕排隊指令、關閉連線；舊連線遲到的 transfer／binary／Blob／ok 不得污染新連線；收集途中切換機器仍固定原 control，取得連線失敗不得改抓另一台。
- 手動：在桌面版對可引發非硬體類 Monitor 錯誤的裝置執行上述 A1–A16，另以匯出途中關閉 fluxghost 觸發 `#806`。
- 回歸：§6 所列既有 `checkbox:` 警示呼叫者行為不變；說明 → Bug Report 下載仍包含 `recent_files`。
