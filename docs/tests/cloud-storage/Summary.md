# 雲端儲存 (cloud-storage)

## 本分類測試範圍

涵蓋 FLUX 帳號的雲端空間功能：登入後才能使用、免費用戶 5 檔上限、儲存到雲端（首次儲存、覆寫、另存新檔）、開啟雲端檔案、刪除／複製／重新命名，以及雲端檔案清單的排序與縮圖。另含頂欄 Account 選單中「Design Market」外連連結的驗證。

雲端功能的核心邏輯（傳輸層與儲存流程）以 Jest 單元測試釘死；真正涉及伺服器語意與真帳號行為的部分則需 staging 測試帳號的 E2E（Tier B）補足。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `helpers/api/cloudFile.spec.ts` | Jest 單元 | 雲端檔案 CRUD 傳輸層：`checkResp` 各回應分支、5 檔配額提示、開檔／刪除／複製／重新命名的 endpoint 與記帳邏輯 | Claude 自動產生 (2026-07) |
| `helpers/file/export/handlers/cloud.spec.ts` | Jest 單元 | `saveToCloud`：登入檢查、有 uuid 覆寫（PUT）與無 uuid 另存新檔（POST）分支、第 6 檔超額提示、各錯誤路徑 | Claude 自動產生 (2026-07) |
| `top-bar/design-market.spec.ts` | Cypress E2E | 從 Account 選單點「Design Market」驗證以 `https://dmkt.io` 外連 | Claude 自動產生 (2026-07) |
| `top-bar/my-cloud.spec.ts` | Cypress E2E（live 帳號） | 以真實 staging 帳號驗證雲端 CRUD 端到端流程 | Claude 自動產生（進行中） |

## 尚未自動化項目

以下項目的邏輯已由上述 Jest 單元測試覆蓋，但「真帳號、真伺服器」的端到端行為仍需 staging 測試帳號的 E2E（Tier B）；`top-bar/my-cloud.spec.ts` 即為此層，目前於平行工作中撰寫：

- 免費用戶儲存第 6 個檔案時真正觸發伺服器配額並跳出錯誤 pop-up。
- 第一次按「儲存到雲端」真正落地至雲端空間。
- 「儲存到雲端」另存新檔（可同名）與「儲存」覆寫同一檔案的真實伺服器結果。
- 刪除、複製、重新命名後的帳號資料狀態（且測試後需清理帳號資料）。
- 依修改日期與檔名的排序（MyCloud 元件已有部分 Jest 覆蓋，尚缺 E2E）。
- 雲端檔案縮圖顯示。
- 舊格式檔案開啟的相容性。
