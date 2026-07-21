# Note of cloudFile.spec.ts

被測檔案：`packages/core/src/web/helpers/api/cloudFile.ts`（雲端檔案 CRUD 傳輸層）

## 對應測試表項目

「雲端儲存」分類：

- 「免費用戶檔案上限為 5 個，儲存第 6 個檔案時，跳出錯誤 pop-up」— 對應 `checkResp` 的 `STORAGE_LIMIT_EXCEEDED` 分支（5 檔上限判斷以 Jest 覆蓋）。
- 「刪除、複製、重新命名等功能正常」— 對應 `deleteFile`、`duplicateFile`、`renameFile` 的 endpoint 與開檔記帳邏輯。
- （間接）「選擇雲端裡的檔案時⋯」的開檔流程 — 對應 `openFile`、`openFileInAnotherTab`。

測試表備註明確標示本列由 Jest 的 cloudFile.spec.ts 覆蓋邏輯；真正的第 6 檔行為與帳號資料清理屬 E2E 範圍（Tier B，需 staging 測試帳號）。

## 測試了什麼

**checkResp（回應解讀核心）**
- 回應為 null：顯示 `connection_fail`。
- 有 error 但無 response：顯示 `connection_fail` 並帶上 status。
- 403 CSRF：跳出重新登入視窗，按確認後開啟登入視窗。
- `STORAGE_LIMIT_EXCEEDED`：顯示 `storage_limit_exceeded`（對應 5 檔配額分支）。
- error.response 無 data：以 `data || {}` 保護，不會崩潰，回報 `502: `。
- 一般錯誤：組合出訊息 `500: SOME_INFO some message bad detail`。
- 成功且非錯誤狀態：回 `res: true`，不彈出錯誤。
- data 狀態錯誤且為 `NOT_SUBSCRIBED`：顯示 FluxPlus 警告，並回 `shouldCloseModal: true`。
- data 狀態錯誤但為其他訊息：以 caption 加 message 彈出錯誤。
- data 為 JSON Blob：先解析再判斷（測試以 stub 掉 `.text()`）。

**openFile** — 成功時讀取 beam、呼叫 `setCloudFile`、回 `shouldCloseModal: true`；失敗時不讀 beam；丟出例外時彈出錯誤並確保關閉進度條。

**openFileInAnotherTab** — 委派給 `setFileInAnotherTab({ type: 'cloud' })`。

**duplicateFile** — 對 `operation/uuid` 發出 PUT，帶 `method: 'duplicate'` 與 CSRF header；例外時彈出錯誤。

**downloadFile** — 成功時寫檔（macOS 副檔名走 filter、Linux 直接補上 `.beam`）；失敗時提早 return；例外時彈出錯誤。

**renameFile** — 空名稱直接短路不送請求；成功且改的是當前開啟檔（getPath 相符）才呼叫 `setFileName`；path 不同則不改；例外時彈出錯誤。

**deleteFile** — 成功刪除且刪的是當前檔才呼叫 `setCloudUUID(null)`；刪別的檔則不清；例外時彈出錯誤。

**list** — 成功時回傳 files 陣列；失敗時回空陣列；例外時回 `{ data: [], res: false }`。

## 設計理由

- 這一層是純粹的「HTTP 動詞 + endpoint 字串 + header + 回應解讀」膠合程式碼，最容易壞在 typo。單元測試把每個 endpoint（`/api/beam-studio/cloud/file/uuid-1`、`operation/uuid`、`/cloud/list`）與 HTTP method 逐一釘住，能攔下「PUT 打成 POST」「路徑拼錯」「漏帶 CSRF header 或 withCredentials」這類錯誤。
- 配額提示路徑（`STORAGE_LIMIT_EXCEEDED`）以獨立案例釘住訊息 key，能攔下「配額判斷分支被改掉」或「用錯語言 key」。
- 開檔記帳（改名、刪檔清 uuid）以 getPath 相符與不相符兩個案例對照，能攔下「不論是不是當前檔都亂改當前檔狀態」這種錯誤變動。
- 語言 key 以 `import langEn from en` 對照，而非硬寫字串，既能攔下用錯 key，又不會因文案微調而脆裂。

## 充分性分析

- 單元層對「送對請求、解讀對回應、記對帳」已足夠，分支覆蓋率 97.8%。
- 需以 E2E（Tier B、staging 帳號）補足的部分：真正的伺服器端 CRUD、真的觸發第 6 檔配額、複製或改名後的帳號資料狀態，以及測試後的資料清理。這些屬於伺服器語意與真帳號行為，非本層可驗證。
- 排序（依修改日期或檔名）不在本檔，屬 MyCloud 元件層，已另有覆蓋。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。（30 個案例全綠，statements 100%、branches 97.8%；唯一未覆蓋的分支為非關鍵的組合訊息 fallback。）

## 待確認問題(Open Questions)

- 若改名的目標是「非當前開啟」的雲端檔，`setFileName` 正確地不會被呼叫；但產品上是否應在其他地方（MyCloud 清單）即時反映新檔名？此屬跨層行為，單元測試無法回答，留給人確認。
- 「舊檔案開啟相容性」是否應該準備一份固定的舊格式 .beam 測試檔，餵給 `openFile` 再走 `readBeam`？目前 beam 內容被 mock 掉，尚未驗證真實的舊檔解析。
