# Note of cloud.spec.ts (export handler)

被測檔案：`packages/core/src/web/helpers/file/export/handlers/cloud.ts`（`saveToCloud` 儲存至雲端）

## 對應測試表項目 — sheet rows covered
「雲端儲存」section：

- 「確認登入後才能使用」— 對應 login guard（未登入跳登入視窗、不送任何請求）。
- 「免費用戶檔案上限為5個，儲存第6個檔案時，跳出錯誤pop-up」— 對應 `STORAGE_LIMIT_EXCEEDED` popup 路徑。
- 「第一次按『儲存到雲端』時，成功儲存到雲端空間」— 對應 save-as 的 POST 分支。
- 「選擇雲端裡的檔案時，再按『儲存到雲端』為另存新檔至雲端，可以同名稱」— 對應無 uuid → 詢問檔名 → POST 新檔分支。
- 「選擇雲端裡的檔案時，再按『儲存』為同一檔案存至雲端」— 對應有 uuid → PUT 覆寫同檔分支。

CSV 備註：`logic covered: Jest handlers/cloud.spec.ts`；首次儲存與 6th-file 的真實行為屬 E2E（Tier B）。

## 測試了什麼 — 逐案說明
- **login guard** — `getCurrentUser` 回 null → 開登入視窗、回 `false`、POST/PUT/存檔對話框都不呼叫。
- **有 uuid → 覆寫（PUT）** — 打 `/cloud/file/uuid-1`、不呼叫 POST、不彈另存檔名對話框；FormData 帶 `workarea='ado1'`、`file` 為 Blob、無 `type`；回應無 `new_file` 故不改 uuid；`setHasUnsavedChanges(false,false)`。
- **無 uuid → 另存新檔（POST）** — 彈檔名對話框、打 `/cloud/add/new-scene`、不呼叫 PUT；`setFileName('new-scene')`、FormData 帶 `type='file'`；回應 `new_file` → `setCloudUUID('uuid-new')`。
- **取消另存對話框** — `isCancelled:true` → 不送請求、不動 unsaved 狀態、回 false、關進度條。
- **STORAGE_LIMIT_EXCEEDED（第 6 檔超額）** — 彈 `storage_limit_exceeded`、不動 unsaved、回 false、關進度條。
- **403 CSRF** — 跳 relogin popup、按確認開登入視窗、回 false。
- **error 無 response** — 顯示 `connection_fail`。
- **其他請求錯誤** — 以 caption `SOME_INFO` + message `bad detail` 彈錯。
- **status 非 ok** — 顯示 `Server Error: 200 WEIRD`、不動 unsaved。
- **丟例外**（generateBeamBuffer reject）— 顯示 `save_to_cloud` 錯誤、關進度條。

## 設計理由 — 為何 unit-level 適合
- 本檔的核心是「save-as 與 overwrite 的分支切換」與「上傳成功後的檔案狀態記帳」。經 mutation-review 後兩條路徑被拆成清楚對照的 case：
  - **overwrite（有 uuid）** case 明確斷言「不彈另存檔名對話框、不呼叫 POST、不改 uuid」；
  - **save-as（無 uuid）** case 明確斷言「彈對話框、走 POST、設新 uuid」。
  兩者互斥的否定斷言（`expect(mockPost).not…` / `expect(mockPut).not…`）正是攔「save-as 與 overwrite 分支被對調」這類 mutation 的關鍵。
- endpoint 字串（`/cloud/file/${uuid}` vs `/cloud/add/${fileName}`）逐字 pin 住，攔路徑 typo。
- 配額 popup 路徑獨立成 case，攔「第 6 檔錯誤處理被改」。
- `setHasUnsavedChanges(false,false)` 只在成功時被呼叫、失敗全數斷言「未被呼叫」，攔「失敗仍誤標為已存」的髒 bug。

## 充分性分析
- 單元層對分支切換、endpoint、記帳、各錯誤 popup 路徑已足夠。branches 78.9% 的缺口落在組合訊息 fallback（`detail || message || status:statusText`）與 403 子條件的部分排列，屬非關鍵。
- 需 E2E（Tier B、staging 帳號）補：真的首次上傳落地、真的第 6 檔觸發伺服器配額、以及「同名另存」在伺服器端是否真允許同名。這些是伺服器語意，unit 無法驗。
- 平行撰寫的 live-account Cypress spec（`top-bar/my-cloud.spec.ts`）即為此列的 E2E 層（本 note 不動它）。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。（10 案全綠；save-as/overwrite 分支對照與配額路徑皆已 mutation-pin。）

## Open Questions
- 「可以同名稱」是產品規則，但 unit 端只驗前端不阻擋、照送 POST；同名是否真被伺服器接受需 E2E 確認。
- overwrite 分支目前不呼叫 `setFileName`（僅 save-as 會）；若使用者覆寫的同時想改名，是否為預期行為？留給人確認。
