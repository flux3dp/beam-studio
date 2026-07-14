# Note of boxgenStore.spec.ts

## 對應測試表項目
- 對應「上層選單工具 > Boxgen 盒子產生器」多列，尤其：
  - 「Outer、Inner、Cover 等按鈕動作正常」，建議斷言 store 狀態與匯出 SVG。
  - 「寬度、高度、深度可任意調整數字，右側 3D 圖即時變化，最小值為 1」。
  - Edge／Finger／T-Slot 切換與參數調整後幾何即時變化的數列。
- 測試表另註明原本標示的 `boxgen.spec.ts` 並不存在，主要 E2E 已由 `top-bar/boxgen.spec.ts` 補上；本 Jest store 測試補足「參數狀態管理」這一層。

## 測試了什麼
- `should initialize with the mm controller by default`：預設單位為 mm 時，初始 `boxData` 等於 `DEFAULT_CONTROLLER_MM`。
- `should replace boxData when setBoxData receives an object`：`setBoxData(obj)` 整體替換 `boxData`。
- `should support the updater-function form of setBoxData`：`setBoxData(prev => ...)` 函式形式可用，且未觸及的欄位會保留。
- `should merge partial fields with updateBoxData`：`updateBoxData(partial)` 只合併指定欄位，其餘保留。
- `should reset back to the mm controller`：改動後呼叫 `reset()` 還原為 `DEFAULT_CONTROLLER_MM`。
- `should never mutate the shared default controller constants`：多次 `updateBoxData`／`setBoxData` 後，`DEFAULT_CONTROLLER_MM` 常數本身不被污染。
- `should reset to the inch controller when units are inches`：單位切為 inches 後 `reset()` 還原為 `DEFAULT_CONTROLLER_INCH`。

## 設計理由
- Boxgen 的表單參數（寬高深、cover、接合方式）本質是一份 controller 資料物件，store 層測試能精準涵蓋「調整參數→狀態更新」，而不需渲染 3D 畫面。
- 不變量測試 `should never mutate the shared default controller constants`（經刻意變異驗證）：`getInitialBoxData()` 直接回傳 `DEFAULT_CONTROLLER_MM` 常數本身（未複製）。若把 `updateBoxData`／`setBoxData` 寫成就地合併（例如 `Object.assign(state.boxData, partial)`），會永久污染該常數，之後每個 Boxgen session 都拿到壞掉的預設值；更棘手的是 `reset()` 會「還原」成被污染的物件，令前面的 reset 測試也看不出問題。此測試專門獨立抓這個共用參照被就地變更的 bug。
- inch／mm 雙分支測試對應真實情境：使用者用英吋單位時，reset 必須回到英吋預設而非公制。

## 充分性分析
- 就「參數狀態的替換／合併／重設／單位切換／不可變性」而言覆蓋充分。
- 真正的幾何運算（Edge／Finger／T-Slot 齒形、T 槽直徑長度轉為實際 SVG 幾何）不在此 store，位於 `components/boxgen/Shape` 與 `helpers/boxgen/*`（測試表亦指向 `Shape.spec.ts`），本 store 測試不涵蓋幾何正確性。
- 「右側 3D 圖即時變化不卡頓」屬流暢度與渲染，維持人工，非本測試範圍。
- storageStore 以 `__mocks__` 自動 mock，`setStorage('default-units', ...)` 用來切換單位，這是單位來源的測試替身，真實 storage 讀寫邏輯不在此涵蓋。
- 結論：以 store 層級的參數管理而言已足夠；幾何正確性依賴另外的 Shape／helpers 測試。

## 本次改進
無，經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
無。
