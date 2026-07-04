# Note of cameraPreview.spec.ts

## 對應測試表項目
- 對應「Camera / 相機預覽」多列（第 234–244、82–85 列等）。此 store 存放相機預覽的整體狀態（是否預覽中、live 模式、背景透明度、目前/待切換/支援的預覽模式），支撐下列人工測試：
  - 第 235 列「相機預覽功能是否可以使用」。
  - 第 238 列「相機預覽後的照片透明度調整功能正常，0%、25%、50%、75%、100% 五個固定比例」→ `bgOpacity` 是透明度來源。
  - 第 240 列「二次預覽是否覆蓋掉前一次的結果」、第 15 列「新增檔案時相機預覽結果會留著」等狀態保留邏輯。
- 表中多列註明需相機模擬層才能 E2E；本 Jest 測試先涵蓋純狀態機部分（尤其預覽模式的協調邏輯）。

## 測試了什麼
- `should have the default state on init`：預設 `bgOpacity: 1`、各旗標為初值、`previewMode: REGION`、`supportedPreviewModes: [REGION]`。
- `should merge partial state via setCameraPreviewState`：部分合併（改 `bgOpacity`、`isDrawing`，`isClean` 保留）。
- supportedPreviewModes 訂閱協調（reconciliation）子群：
  - `clear pendingPreviewMode when it is no longer supported`：待切換模式若不在新支援清單中則清除。
  - `keep pendingPreviewMode when it is still supported`：待切換模式仍受支援則保留。
  - `not reset previewMode while a supported pendingPreviewMode exists`：目前模式雖不受支援，但有「受支援的待切換模式」時，不可把目前模式重設為 `supportedPreviewModes[0]`，須讓位給待切換（else-if 而非兩個獨立 if）。
  - `reset previewMode to the first supported mode when unsupported and no pending`：無待切換且目前模式不受支援時，重設為第一個支援模式。
  - `keep previewMode when it is still supported and no pending`：目前模式仍受支援則不動。
  - `not run reset logic when supportedPreviewModes is shallow-equal`：以相等陣列設定時，`shallow` equalityFn 視為無變化，協調不觸發，即使目前模式不在清單中也保持不變。

## 設計理由
- 預覽模式協調是相機功能中最容易出錯的純狀態邏輯（機型切換造成支援模式改變時如何重設/保留），非常適合 store 層測試而非實機。
- injection-verified 不變量：
  - `not reset previewMode while a supported pendingPreviewMode exists` 針對 source 的 `else if` 結構。若改成兩個獨立 `if`，會在切換中途把 `previewMode` 打回 `supportedPreviewModes[0]`，覆蓋掉使用者正在進行的模式切換。此測試專門抓這個「切換途中被搶回」的 bug。
  - `not run reset logic when supportedPreviewModes is shallow-equal` 針對 `{ equalityFn: shallow }`。若移除 shallow 比較，設定內容相同的新陣列也會觸發協調而誤重設 `previewMode`。此測試以「先手動放一個不在清單中的 previewMode，再用相等陣列設定，應保持不變」驗證 shallow 短路。
- `先加寬支援清單再縮小` 的鋪陳（第 30–35 列）是刻意讓下一次變更成為真正的非 shallow-equal 轉換，才能觸發訂閱。

## 充分性分析
- 對「預覽模式協調」這條核心純邏輯覆蓋充分且以注入驗證加固。
- 透明度真正的 UI 邏輯（第 238 列 0%/25%/50%/75%/100% 五段固定比例）位於 `OpacitySlider` 之類的元件，把使用者選擇對應到 `bgOpacity` 數值；本 store 只存 `bgOpacity` 原始值，五段步進與對應未在此涵蓋，該手測列在此並未被自動化。
- 實際相機連線、影像描圖、二次預覽覆蓋、ESC 中止序列、清除預覽等需相機模擬層或實機，皆不在此 store 測試範圍。
- 結論：以 store 層級的模式協調而言足夠；透明度分段與實機/影像流程未涵蓋。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。

## Open Questions
- 潛在小瑕疵：當「待切換模式因不再受支援而被清除」時（source 第 37–38 列走的分支），該次協調不會再處理「同樣可能不受支援的 previewMode」——因為是 `else if`，清除 pending 後即結束，previewMode 就算不在新清單中也被留著不動，要等下一次 `supportedPreviewModes` 變更才會被重設。這是刻意的產品行為（避免同一次事件做兩段重設），還是應在清除 pending 後於同一次協調再校正 previewMode？建議由產品/相機負責人確認。
