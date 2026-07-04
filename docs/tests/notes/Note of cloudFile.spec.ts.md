# Note of cloudFile.spec.ts

被測檔案：`packages/core/src/web/helpers/api/cloudFile.ts`（雲端檔案 CRUD 傳輸層）

## 對應測試表項目 — sheet rows covered
「雲端儲存」section：

- 「免費用戶檔案上限為5個，儲存第6個檔案時，跳出錯誤pop-up」— 對應 `checkResp` 的 `STORAGE_LIMIT_EXCEEDED` 分支（5 檔上限判斷以 Jest 覆蓋）。
- 「刪除、複製、重新命名等功能正常」— 對應 `deleteFile` / `duplicateFile` / `renameFile` 的 endpoint 與 open-file 記帳邏輯。
- （間接）「選擇雲端裡的檔案時…」開檔流程 — 對應 `openFile` / `openFileInAnotherTab`。

CSV 備註明確標示：`logic covered: Jest cloudFile.spec.ts`；真正的第 6 檔行為與帳號資料清理屬 E2E（Tier B，需 staging 測試帳號）。

## 測試了什麼 — 逐案說明

**checkResp（回應解讀核心）**
- null response → 顯示 `connection_fail`。
- 有 error 但無 response → `connection_fail` 並帶 status。
- 403 CSRF → 跳 relogin popup，按確認開啟登入視窗。
- `STORAGE_LIMIT_EXCEEDED` → 顯示 `storage_limit_exceeded`（5 檔配額分支）。
- error.response 無 data → 用 `data || {}` 保護，不 crash，回報 `502: `。
- 一般錯誤 → 組合訊息 `500: SOME_INFO some message bad detail`。
- 成功且非錯誤狀態 → `res: true`，不彈錯。
- data 狀態錯誤且 `NOT_SUBSCRIBED` → 顯示 FluxPlus 警告、`shouldCloseModal: true`。
- data 狀態錯誤其他 info → 以 caption + message 彈錯。
- data 為 JSON Blob → 先 parse 再判斷（stub `.text()`）。

**openFile** — 成功時讀 beam、`setCloudFile`、回 `shouldCloseModal:true`；失敗不讀 beam；丟例外時彈錯並保證關進度條。
**openFileInAnotherTab** — 委派 `setFileInAnotherTab({ type: 'cloud' })`。
**duplicateFile** — PUT `operation/uuid` 帶 `method:'duplicate'` 與 CSRF header；例外彈錯。
**downloadFile** — 成功寫檔（MacOS 副檔名走 filter、Linux 直接補 `.beam`）；失敗提早 return；例外彈錯。
**renameFile** — 空名短路不送請求；成功且為當前開啟檔（getPath 相符）才 `setFileName`；path 不同不改；例外彈錯。
**deleteFile** — 成功刪除且刪的是當前檔才 `setCloudUUID(null)`；刪別的檔不清；例外彈錯。
**list** — 成功回 files 陣列；失敗回空陣列；例外回 `{ data: [], res: false }`。

## 設計理由 — 為何 unit-level 適合
- 這層是純「HTTP 動詞 + endpoint 字串 + header + 回應解讀」的膠水碼，最容易壞在 typo，unit 測試把每個 endpoint（`/api/beam-studio/cloud/file/uuid-1`、`operation/uuid`、`/cloud/list`）與 HTTP method 逐一 pin 住，可攔到「PUT 打成 POST」「路徑拼錯」「漏帶 CSRF header / withCredentials」。
- 配額 popup 路徑（`STORAGE_LIMIT_EXCEEDED`）以獨立 case pin 住訊息 key，攔「配額判斷分支被改掉 / 用錯 lang key」。
- open-file 記帳（rename 改名、delete 清 uuid）用 getPath 相符與不相符兩個 case 對照，攔「不論是不是當前檔都亂改當前檔狀態」這種 mutation。
- lang key 以 `import langEn from en` 對照而非硬字串，攔錯 key 又不因文案微調而脆裂。

## 充分性分析
- 單元層對「送對請求 + 解讀對回應 + 記對帳」已足夠，分支覆蓋 97.8%。
- 需要 E2E（Tier B、staging 帳號）補的：真正的伺服器端 CRUD、真的第 6 檔配額觸發、複製/改名後帳號資料狀態、以及測試後清理。這些是伺服器語意與真帳號行為，非本層可驗。
- 排序（修改日期/檔名）不在本檔，屬 MyCloud 元件層，已另有覆蓋。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。（30 案全綠，statements 100%，branches 97.8%；唯一未覆蓋分支為非關鍵的組合訊息 fallback。）

## Open Questions
- rename 目標若是「非當前開啟」的雲端檔，`setFileName` 正確地不會被呼叫；但產品上是否應在他處（MyCloud 清單）即時反映新檔名？此為跨層行為，unit 無法回答，留給人確認。
- 「舊檔案開啟相容性」是否應有 pinned fixture（一份舊格式 .beam）餵給 `openFile`→`readBeam`？目前 beam 內容被 mock 掉，未驗真實舊檔解析。
