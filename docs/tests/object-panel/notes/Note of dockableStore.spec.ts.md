# Note of dockableStore.spec.ts

## 對應測試表項目

- 測試表中沒有此 store 的直接對應列。
- `dockableStore` 是右側可停靠面板（Layer Controls／Object Properties／Path Edit）的顯示狀態來源，屬編輯器 UI 基礎設施，支撐「圖層面板、物件屬性、路徑編輯面板開關」等人工操作的底層狀態。沒有單一手測列對應，屬跨功能的共用狀態。

## 測試內容 — 逐案說明

- `should have the default state on init`：store 初始值等於 `defaultDockableState`（三個面板皆為 false、`drawerRef` 為 null）。
- `should initialize with a distinct clone...`：store 內部狀態是 `defaultDockableState` 的獨立複本，而非同一個物件參考。
- `should notify selector subscribers on change`：以 selector 訂閱 `panelPathEdit`，只有該欄位變動才觸發 listener，無關欄位（`panelObjectProperties`）變動不觸發；`unsubscribe()` 之後不再觸發。

## 設計理由

- 面板開關屬純狀態切換，在 store 層測試即可涵蓋核心邏輯，不需渲染整個編輯器。
- clone 不變量測試（以注入方式驗證）：若初始化時移除 `structuredClone`，store 狀態就會「等於」匯出的 `defaultDockableState` 物件本身，任何 `setState` 的直接改動都會污染這個匯出常數，導致後續所有消費者（包含以其為比較基準的 reset 流程）拿到被改壞的預設值。此測試專門抓這個 alias bug。
- selector 訂閱測試：驗證 `subscribeWithSelector` 中介層真的做到「只在選定切片改變時通知」，避免面板 A 變動誤觸面板 B 的訂閱者而造成多餘重繪。

## 充分性分析

- 對 store 本身的職責（預設值、獨立性、選擇性通知）覆蓋充分。
- 真正的 UI 行為（面板實際彈出／停靠、拖曳、`drawerRef` 掛載到 DOM）發生在消費此 store 的 React 元件內，不在本 store 範圍，未於此涵蓋，也不應於此涵蓋。
- 結論：以 store 層級而言足夠。

## 本次改進

無。經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）

無。
