# Note of cameraPreview.spec.ts

## 對應測試表項目

- 對應「Camera / 相機」多列。此 store 存放相機預覽的整體狀態（是否預覽中、live 模式、背景透明度，以及目前、待切換與支援的預覽模式），支撐下列人工測試：
  - 「相機預覽功能是否可以使用」。
  - 「相機預覽後的照片透明度調整功能正常，0%、25%、50%、75%、100% 五個固定比例」→ `bgOpacity` 即透明度的來源。
  - 「二次預覽是否覆蓋掉前一次的結果」、「新增檔案時相機預覽結果會留著」等狀態保留邏輯。
- 測試表中多列註明需相機模擬層才能做 E2E；本 Jest 測試先涵蓋純狀態機的部分（尤其是預覽模式的協調邏輯）。

## 測試了什麼

- `should have the default state on init`：預設 `bgOpacity: 1`、各旗標為初值、`previewMode: REGION`、`supportedPreviewModes: [REGION]`。
- `should merge partial state via setCameraPreviewState`：部分合併（改動 `bgOpacity` 與 `isDrawing`，`isClean` 保留原值）。
- supportedPreviewModes 訂閱協調的子群：
  - `clear pendingPreviewMode when it is no longer supported`：待切換模式若不在新的支援清單中則清除。
  - `keep pendingPreviewMode when it is still supported`：待切換模式仍受支援則保留。
  - `not reset previewMode while a supported pendingPreviewMode exists`：目前模式雖不受支援，但只要存在「受支援的待切換模式」，就不可把目前模式重設為 `supportedPreviewModes[0]`，必須讓位給待切換（用 else-if 而非兩個獨立 if）。
  - `reset previewMode to the first supported mode when unsupported and no pending`：無待切換且目前模式不受支援時，重設為第一個支援模式。
  - `keep previewMode when it is still supported and no pending`：目前模式仍受支援則不動。
  - `not run reset logic when supportedPreviewModes is shallow-equal`：以內容相等的陣列設定時，`shallow` 比較函式視為沒有變化，協調不觸發，即使目前模式不在清單中也保持不變。

## 設計理由

- 預覽模式協調是相機功能中最容易出錯的純狀態邏輯（機型切換造成支援模式改變時，如何重設或保留），非常適合以 store 層測試而非實機驗證。
- 兩個以注入驗證守住的不變量：
  - `not reset previewMode while a supported pendingPreviewMode exists` 針對原始碼的 `else if` 結構。若改成兩個獨立的 `if`，會在切換途中把 `previewMode` 打回 `supportedPreviewModes[0]`，覆蓋掉使用者正在進行的模式切換。此測試專門抓這種「切換途中被搶回」的 bug。
  - `not run reset logic when supportedPreviewModes is shallow-equal` 針對 `{ equalityFn: shallow }`。若移除 shallow 比較，內容相同的新陣列也會觸發協調而誤重設 `previewMode`。此測試以「先手動放一個不在清單中的 previewMode，再用內容相等的陣列設定，應保持不變」來驗證 shallow 短路。
- 「先加寬支援清單再縮小」的鋪陳，是刻意讓下一次變更成為真正的非 shallow-equal 轉換，才能觸發訂閱。

## 充分性分析

- 對「預覽模式協調」這條核心純邏輯，覆蓋充分且以注入驗證加固。
- 透明度真正的 UI 邏輯（0%/25%/50%/75%/100% 五段固定比例）位於 `OpacitySlider` 之類的元件，負責把使用者的選擇對應到 `bgOpacity` 數值；本 store 只存 `bgOpacity` 的原始值，五段步進與其對應未在此涵蓋，該手測列在此並未被自動化。
- 實際的相機連線、影像描圖、二次預覽覆蓋、ESC 中止序列、清除預覽等，皆需相機模擬層或實機，不在此 store 測試範圍。
- 結論：以 store 層級的模式協調而言足夠；透明度分段與實機、影像流程未涵蓋。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。

## 待確認問題(Open Questions)

- 一個潛在的小瑕疵：當「待切換模式因不再受支援而被清除」時（走原始碼中清除 pending 的分支），該次協調不會再處理「同樣可能不受支援的 previewMode」——因為是 `else if`，清除 pending 之後就結束，previewMode 就算不在新清單中也會被留著不動，要等下一次 `supportedPreviewModes` 變更才會被重設。這究竟是刻意的產品行為（避免在同一次事件中做兩段重設），還是應該在清除 pending 後於同一次協調再校正 previewMode？建議由產品或相機負責人確認。
