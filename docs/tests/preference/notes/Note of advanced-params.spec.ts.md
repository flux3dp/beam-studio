# Note of advanced-params.spec.ts

## 對應測試表項目
Preference 分類：
- 「列印參數進階設定」：「UV 速度極限設定 ON/OFF／SV 速度極限設定 ON/OFF／濃度（飽和度）極限設定 ON/OFF／範圍設定 基礎/進階」。
- 「混合雷射預設」：「測試重製設定後預設關閉」。
- 「混合雷射偏移值」：「預設往右 70mm，往上 7mm」。
- 「登入才能使用的功能整理」下的「點擊註冊 FLUX ID 帳號是否外連」。

測試表自動化欄目前標示：
- 列印參數進階設定 → `preference/advanced-params.spec.ts (done, passing; NOTE: separate UV/SV/saturation switches don't exist — single print-advanced-mode preference governs)`
- 混合雷射預設 → `… (default OFF verified)`
- 混合雷射偏移值 → `… (defaults 70/7 match sheet)`
- 點擊註冊 FLUX ID → `preference/advanced-params.spec.ts (done, passing)`

## 測試了什麼
- `persists the print-advanced-mode and UV print-file toggles`：Editor 分類的 `#print-advanced-mode` 與 `#set-enable-uv-print-file` 兩個開關預設為關，開啟後套用、重開仍為開，關閉後套用、重開仍為關。
- `persists the vector-path speed limit toggle`：Vector 分類的 `#set-vector-speed-constraint` 預設為開（20mm/s 限速），關閉後套用、重開仍為關，再開後仍為開。
- `defaults hybrid-laser (diode) module to OFF with 70mm/7mm offsets`：Add-on 分類的 `#default-diode` 預設為關，`#set_diode_offset-x` 約為 70、`-y` 約為 7。
- `opens the FLUX ID signup page from the login dialog register button`：先攔截 `window.open`，登入視窗按下「Create Your FLUX Account」時呼叫 `window.open('https://id.flux3dp.com/user/login#up')`。

## 設計理由
- 以單一 print-advanced-mode 偏好取代測試表的三個獨立開關：檔頭誠實說明程式碼庫並沒有分離的「UV 速度極限／SV 速度極限／濃度（飽和度）極限」偏好開關；所有列印參數限制由單一 `print-advanced-mode`（基礎/進階範圍）統管，進階模式即移除只在預設下才有的滑桿限制。因此測試對映到實際存在的 `print-advanced-mode`、`enable-uv-print-file`、`vector_speed_constraint`，而非測試表字面上的三個開關。
- 以持久化斷言作為代理：這些開關下游驅動的設定面板滑桿行為需要有列印模組圖層，屬人工發版檢查；依測試規範指引，此處以「套用後重開狀態仍持久」作為機器可驗證的代理。
- 混合雷射即 beamo 的二極體模組：偏移預設值直接對應 `constant.diode.defaultOffsetX=70` 與 `defaultOffsetY=7`（本次已於 `constant.ts:80-81` 覆核），與測試表「往右 70／往上 7」一致。用 `inputValueCloseTo(…, 0.1)` 容忍浮點誤差。
- FLUX ID 外連：web 上 `browser.open` 委派給 `window.open`，故在 `onBeforeLoad` 先攔截 `window.open` 再斷言它被以註冊 URL 呼叫；URL 的來源依據為 `lang/en.ts` 的 `topbar.menu.signup_url`。

## 充分性分析
- 測試表「範圍設定 基礎/進階」對應 `print-advanced-mode`，覆蓋充分；UV、SV、濃度三個開關因不存在而以實際的單一開關對映，屬誠實的重新對映而非漏測。
- 混合雷射預設為關、偏移 70/7、FLUX ID 外連皆逐一命中。
- 缺口：進階模式對滑桿上限的下游實際效果未在此驗證（需列印模組圖層，屬人工），已在檔頭明示分工。

## 本次改進
無，經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
- 混合雷射偏移 70/7：目前測試表與程式碼一致，但哪一邊是最終依據？若機構校正值變更，應以 `constant.ts` 為準並回填測試表。
- 測試表的「UV/SV/濃度極限」三開關：是舊 UI 遺留，還是未實作的規劃？建議測試表更新為單一的「列印進階模式」。
