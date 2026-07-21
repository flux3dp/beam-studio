# Note of cloud.spec.ts (export handler)

被測檔案：`packages/core/src/web/helpers/file/export/handlers/cloud.ts`（`saveToCloud` 儲存至雲端）

## 對應測試表項目

「雲端儲存」分類：

- 「確認登入後才能使用」— 對應登入檢查（未登入時跳出登入視窗、不送任何請求）。
- 「免費用戶檔案上限為 5 個，儲存第 6 個檔案時，跳出錯誤 pop-up」— 對應 `STORAGE_LIMIT_EXCEEDED` 提示路徑。
- 「第一次按『儲存到雲端』時，成功儲存到雲端空間」— 對應另存新檔的 POST 分支。
- 「選擇雲端裡的檔案時，再按『儲存到雲端』為另存新檔至雲端，可以同名稱」— 對應無 uuid 時「詢問檔名再 POST 新檔」的分支。
- 「選擇雲端裡的檔案時，再按『儲存』為同一檔案存至雲端」— 對應有 uuid 時「PUT 覆寫同檔」的分支。

測試表備註：本列由 Jest 的 handlers/cloud.spec.ts 覆蓋邏輯；首次儲存與第 6 檔的真實行為屬 E2E 範圍（Tier B）。

## 測試了什麼

- **登入檢查** — `getCurrentUser` 回 null 時開啟登入視窗、回 `false`，且 POST、PUT 與存檔對話框都不會被呼叫。
- **有 uuid，覆寫（PUT）** — 對 `/cloud/file/uuid-1` 發出請求、不呼叫 POST、不彈出另存檔名對話框；FormData 帶有 `workarea='ado1'`、`file` 為 Blob、無 `type`；回應中沒有 `new_file` 故不改 uuid；呼叫 `setHasUnsavedChanges(false, false)`。
- **無 uuid，另存新檔（POST）** — 彈出檔名對話框、對 `/cloud/add/new-scene` 發出請求、不呼叫 PUT；呼叫 `setFileName('new-scene')`，FormData 帶有 `type='file'`；回應中的 `new_file` 觸發 `setCloudUUID('uuid-new')`。
- **取消另存對話框** — `isCancelled: true` 時不送請求、不動未儲存狀態、回 false、關閉進度條。
- **STORAGE_LIMIT_EXCEEDED（第 6 檔超額）** — 彈出 `storage_limit_exceeded`、不動未儲存狀態、回 false、關閉進度條。
- **403 CSRF** — 跳出重新登入視窗，按確認後開啟登入視窗、回 false。
- **error 無 response** — 顯示 `connection_fail`。
- **其他請求錯誤** — 以 caption `SOME_INFO` 加 message `bad detail` 彈出錯誤。
- **status 非 ok** — 顯示 `Server Error: 200 WEIRD`、不動未儲存狀態。
- **丟出例外**（generateBeamBuffer reject）— 顯示 `save_to_cloud` 錯誤、關閉進度條。

## 設計理由

- 本檔的核心是「另存新檔與覆寫兩條分支的切換」以及「上傳成功後的檔案狀態記帳」。兩條路徑被拆成清楚對照的案例：
  - **覆寫（有 uuid）** 案例明確斷言「不彈另存檔名對話框、不呼叫 POST、不改 uuid」；
  - **另存新檔（無 uuid）** 案例明確斷言「彈出對話框、走 POST、設定新 uuid」。
  兩者互斥的否定斷言（`expect(mockPost).not…`、`expect(mockPut).not…`）正是攔下「另存與覆寫分支被對調」這類錯誤的關鍵。
- endpoint 字串（`/cloud/file/${uuid}` 對比 `/cloud/add/${fileName}`）逐字釘住，能攔下路徑 typo。
- 配額提示路徑獨立成案例，能攔下「第 6 檔錯誤處理被改動」。
- `setHasUnsavedChanges(false, false)` 只在成功時被呼叫，失敗時全數斷言「未被呼叫」，能攔下「失敗卻誤標為已儲存」的髒 bug。

## 充分性分析

- 單元層對分支切換、endpoint、記帳、各種錯誤提示路徑已足夠。branches 78.9% 的缺口落在組合訊息 fallback（`detail || message || status:statusText`）與 403 子條件的部分排列組合上，屬非關鍵。
- 需以 E2E（Tier B、staging 帳號）補足的部分：真正的首次上傳落地、真的觸發伺服器端第 6 檔配額，以及「同名另存」在伺服器端是否真的允許同名。這些屬伺服器語意，單元測試無法驗證。
- 平行撰寫中的 live-account Cypress spec（`top-bar/my-cloud.spec.ts`）即為此列的 E2E 層（本 note 不動它）。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。（10 個案例全綠；另存與覆寫的分支對照與配額路徑皆已釘死。）

## 待確認問題(Open Questions)

- 「可以同名稱」是產品規則，但單元測試端只驗證前端不阻擋、照樣送出 POST；同名是否真的被伺服器接受，需以 E2E 確認。
- 覆寫分支目前不呼叫 `setFileName`（只有另存新檔會呼叫）；若使用者在覆寫的同時想改名，這是否為預期行為？留給人確認。
