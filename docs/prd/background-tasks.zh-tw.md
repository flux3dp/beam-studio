# PRD：背景機器任務

> 本文為 `background-tasks.md` 的繁體中文翻譯；英文版為正本，有出入時以英文版為準。

| | |
|---|---|
| **狀態** | 草稿（2026-10-30）。設計已提出，尚未開始實作。 |
| **作者** | 產品與軟體團隊 |
| **建立日期** | 2026-10-30 |
| **目標產品** | Beam Studio 桌面版（Electron）與網頁版。所有機型。 |
| **負責領域** | 機器通訊 |
| **相關程式碼** | 管理器（新增）：`packages/core/src/web/helpers/device/background/`；第一個成員：`helpers/device/promark/promark-button-handler.ts`；前景守門：`helpers/check-device-status.ts`；Modal 查詢：`app/contexts/DialogContext.tsx`、`app/contexts/AlertProgressContext.tsx`、`app/actions/dialog-caller.tsx`；情境來源：`app/components/beambox/TopBar/contexts/TopBarController.tsx`、`app/contexts/CanvasContext.tsx`、`app/stores/canvas/canvasStore.ts`、`app/stores/documentStore.ts`、`app/actions/tabController.ts`（僅讀取）；機器：`helpers/device-master.ts` |
| **配套 PRD** | `docs/prd/auto-full-area-preview.md`（第二個成員） |

---

## 1. 摘要

有些功能會在使用者沒有要求任何事的時候和所選機器溝通：目前是 Promark 實體開始按鈕的監聽，接下來是門蓋觸發的自動全範圍預覽。到目前為止，每一個都自帶一份「我該不該跑」的判斷（所選機器、畫布模式、工作區、分頁焦點），自己選機器，而且守護前景機器動作的程式碼看不到它們。

本 PRD 新增一個小型管理器 `backgroundTasks`，所有這類功能都向它註冊。管理器負責它們共通的部分：

1. 情境訂閱與啟動／停止的判斷，
2. 背景任務唯一可能觸發的 `deviceMaster.select()`，
3. 同一台機器同時只跑一個任務，由明確的優先級決定，
4. 透過 `checkDeviceStatus` 讓路給前景動作，提示文字由忙碌中的任務提供，
5. 動手碰機器前的共用檢查（`canTouchMachine`），
6. 列出誰在跑，方便除錯。

任務保留自己的邏輯：輪詢什麼、多久一次、拿到結果做什麼。

---

## 2. 背景與現況

### 2.1 機器輪詢盤點

`packages/core/src/web` 中所有和機器溝通的 `setInterval`（2026-10-30 grep）：

| 輪詢 | 何時跑 | 類型 |
|---|---|---|
| `promark-button-handler.ts:118` `checkButton`，每 200 ms | 閒置、選了 Promark | **背景** |
| 自動全範圍預覽的門蓋輪詢（配套 PRD） | 閒置、選了 fbm2/fbb2/fhx2rf | **背景**（規劃中） |
| `MonitorContext.tsx:362` report | 監控視窗開著 | 前景 |
| `DoorChecker.ts:47` | 手動預覽拍攝中 | 前景 |
| `framing.ts:471`、`device-master.ts:775`、`check-device-status.ts:62` | 使用者動作進行中 | 前景 |
| `discover.ts:225-271` | 一直跑 | 網路探索，不佔 control socket |

前景輪詢隨使用者動作開關，已經由 `checkDeviceStatus` 序列化。只有背景這一類需要協調。

### 2.2 Promark 開始按鈕監聽

`promark-button-handler.ts:35-208`，單例：

- **條件**（`:36-41`）：`context`（畫布模式為 Draw 或 PathPreview、所選機器是 Promark，`:64-74`）、`enabled`（文件設定 `promark-start-button`，`:76-82`）、`tab`（`isWeb() || tabController.isFocused`，`:55`、`:90-96`）、`workarea`（文件工作區是 Promark 機型，`:84-88`）。全部成立 → `startListening`，否則 `stopListening`（`:98-108`）。
- **機器**：`startListening` 在機器不是目前機器時自己選取（`:113-115`）。
- **情境來源**：`GoButton.tsx:38-40` 把 `mode` 與 `CanvasContext.selectedDevice` 鏡射到 `onContextChanged`。
- **每次 tick**（`:143-207`）：`status !== 'listening'`、材料測試產生器對話框或全視窗面板開著時跳過；否則呼叫 `deviceMaster.checkButton()`，按下時關掉框選／監控並呼叫匯出函式。
- **狀態**由外部驅動：`handleExportClick.ts:44,66`、`exportTask.ts:131`、`MonitorContext.tsx:1002,1017` 設定 `preparing`／`uploading`／`listening`。
- 它刻意在框選 modal 或監控視窗開著、以及工作執行中（`isRunning`，`:169`）時繼續跑，因為實體按鈕就是用來控制這些的。

### 2.3 任務會碰到的共享狀態

- **所選機器**：`TopBarController.tsx:31` 在 `top-bar` emitter 上發出 `SET_SELECTED_DEVICE`；`CanvasContext.tsx:63` 儲存它。啟動時的預設機器不會發出事件：`TopBar.tsx:62` 直接呼叫 context 的 setter，所以只聽事件會漏掉它。像 `GoButton.tsx:38-40` 那樣在元件裡讀 `CanvasContext.selectedDevice`，兩者都看得到。
- **目前機器是全域的**：`deviceMaster.select(device)` 切換的是所有呼叫者共用的那一條控制連線。假設「目前機器就是我的」的背景任務，一旦前景動作選了另一台機器就會出錯；Promark 的 `checkButton` 會去輪詢錯的機器。
- **前景守門**：`check-device-status.ts:18-35` 已經處理一種 app 內工作階段，即手動預覽：其他機器 → 靜默結束；同一台 → 是／否的 `device_is_used`。21 個呼叫者（匯出、所有機器選單動作、框選、校正對話框、曲面量測、Print and Cut、路徑預覽、`preview-mode-controller.ts:85`）。
- **Modal**：`DialogContext.tsx:21-46`（`dialogComponents`、`CHECK_ID_EXIST`）、`AlertProgressContext.tsx:112-116`（`alertProgressStack`）。沒有「有沒有任何東西開著」的查詢。
- **分頁焦點**：`tabController.ts:24` 寫死 `isFocused = isWeb()`，所以網頁版每個分頁永遠算有焦點；Electron 會發 `TabFocused`／`TabBlurred`（`:28-37`）。改變網頁版發出的事件有代價：`beambox-global-interaction.ts:17` 每次聚焦都會重新 attach 選單，`Tabs.tsx:35` 與 `TabRecentFiles.tsx:86` 會重新抓資料，`ai-extension.ts:60` 會重新註冊，`dockable/utils.ts:339` 在失焦時跳過儲存版面，`fileImportHelper.ts:107` 在失焦時有動作。

---

## 3. 目標與非目標

**目標**

- G1. 新的背景功能 = 一個任務物件加一次 `register` 呼叫；永遠不必碰 `checkDeviceStatus`、`GoButton` 或 `deviceMaster.select`。
- G2. 前景機器動作永遠優先：要嘛發現所有任務都閒置，要嘛在一個點名該任務的是／否提示後讓它停下。
- G3. 兩個背景任務絕不同時操作同一台機器；互相競爭時由優先級較高的跑，所有優先級都列在同一張表上。
- G4. `backgroundTasks.list()` 顯示有哪些任務註冊、哪些在跑、在哪台機器、哪些在忙。
- G5. Promark 開始按鈕移入管理器後，行為與今天完全相同。

**非目標**

- 前景輪詢（監控、框選、預覽門蓋檢查）維持原狀。
- 網路探索。
- 跨電腦協調（每個 Beam Studio 實例只管自己的任務；其餘由韌體的 task 互斥處理）。
- tick 時間的排程器。每個任務保留自己的計時器。

---

## 4. 情境

- **S1 Promark 不變。** 選了 Promark、Draw 模式、開始按鈕設定開啟、分頁有焦點：按實體按鈕和今天一樣匯出；開啟「開始前先框選」時，第一次按會框選。
- **S2 任務忙碌時的前景動作。** 自動預覽正在機器 A 上拍攝；使用者對機器 A 點「開始」。出現由任務提供文字的提示（「機器正在自動拍攝工作區域，是否中止拍攝並繼續？」）。是 → 任務中止，接著匯出。否 → 匯出取消。
- **S3 對另一台機器的前景動作。** 任務在機器 A 上忙碌；使用者對機器 B 開始動作。任務不提示直接中止（和今天手動預覽的規則相同），動作繼續。
- **S4 任務閒置時的前景動作。** 沒有提示；`checkDeviceStatus` 行為和今天完全相同。
- **S5 前景切換了目前機器。** 開了機器 B 的監控視窗；關掉後若沒有其他東西佔用機器，管理器會為正在跑的任務重新選回機器 A。
- **S6 情境改變。** 所選機器、畫布模式、工作區或分頁焦點改變：每個任務在同一個事件內被啟動或停止。
- **S7 兩個任務要同一台機器（未來）。** 優先級較高的跑；另一個被停止（忙碌中則中止），直到較高者不再使用該機器為止。console 警告點名兩者。
- **S8 除錯。** 在 devtools 呼叫 `backgroundTasks.list()`，每個任務回一列。

---

## 5. 驗收標準

| # | 操作 | 預期 | 邊界情況 |
|---|---|---|---|
| B1 | 選 Promark、文件為 Promark 工作區、開始按鈕設定開啟、Draw 模式。按實體按鈕。 | 和今天一樣開始匯出。 | 「開始前先框選」開啟：第一次按框選，按到執行門檻才匯出。PathPreview 模式：仍在監聽。材料測試產生器開著：忽略。 |
| B2 | 同 B1，把畫布切到 Draw／PathPreview 以外的模式、或選非 Promark 機器、或切換文件工作區、或關閉設定。 | 按鈕無反應（監聽停止）。切回來就恢復，不用重啟。 | Electron：聚焦其他分頁 → 停止；切回 → 恢復。 |
| B3 | 網頁版：任務在跑時隱藏瀏覽器分頁。 | 任務停止；顯示分頁就恢復。 | 網頁版的 Promark：相對今天是接受的改變（以前網頁版從不暫停）。選單、最近檔案、版面儲存：不變（`tabController` 未修改）。 |
| B4 | 有忙碌中的任務（自動預覽拍攝中）時，對同一台機器觸發各個 `checkDeviceStatus` 入口：開始、框選、機器選單動作、校正對話框。 | 出現任務文字的是／否提示。是 → 任務中止、動作繼續。否 → 動作取消、任務繼續。 | 忙碌的是另一台機器 → 不提示，任務中止，動作繼續。 |
| B5 | 沒有任務忙碌；入口同 B4。 | 沒有新提示；既有的 `device_is_used`／kick／abort 提示不變。 | 手動預覽進行中 → 先出現既有的預覽提示，和今天一樣。 |
| B6 | 任務在 A 上跑；開 B 的監控視窗（選了 B），再關掉。 | 最後一個 modal 關閉後約 5 秒內，管理器重新選回 A，任務恢復。 | 監控視窗開著時任務跳過 tick（沒有指令送到 B）。 |
| B7 | Devtools：`backgroundTasks.list()`。 | 每個註冊任務一列 `{ id, priority, running, device, busy }`，優先級高的在前。 | — |

---

## 6. 不得改變

- `helpers/device/promark/promark-button-handler.ts`（變成一個任務；條件、選機器、GoButton 的情境來源移到管理器）
  - `handleExportClick.ts:44,66` `setStatus('preparing')`／`handleTaskFinish()`：效果相同。
  - `exportTask.ts:131` `setStatus('uploading')`：效果相同。
  - `MonitorContext.tsx:1002,1017` `setStatus('listening')`：效果相同。
  - B1/B2 的實體按鈕行為：完全相同，包括先框選的計數與 200 ms 間隔。
- `app/components/beambox/TopBar/GoButton.tsx`（effect 改呼叫 `backgroundTasks.setDevice(selectedDevice)`，取代 `promarkButtonHandler.onContextChanged(mode, selectedDevice)`；模式改由 store 取得）
  - 點開始、F2 快捷鍵、`setExportFn`：不變。
  - `GoButton.spec.tsx`：mock 管理器，預期呼叫 `setDevice(selectedDevice)`。
- `helpers/check-device-status.ts`（在手動預覽區塊後加一段，交給管理器）
  - 全部 21 個呼叫者：沒有任務忙碌時行為完全相同，包括 `device_is_used`、kick、abort、quit 與 `device_busy`。
  - `preview-mode-controller.ts:85`：手動預覽開始時，現在也會（在提示後）停下同一台機器上忙碌的任務；這是預期行為。
- `app/contexts/DialogContext.tsx`、`app/contexts/AlertProgressContext.tsx`、`app/actions/dialog-caller.tsx`（新增「是否有任何開著」的查詢）
  - `dialogCaller.isIdExist`、`alertCaller.checkIdExist`、`progressCaller.checkIdExist`：不變。
- `app/actions/tabController.ts`：**不修改**；管理器讀 `isFocused`，並像今天的 Promark 監聽一樣訂閱 `onFocused`／`onBlurred`。網頁版可見性在管理器內處理（§7.5），所以 `beambox-global-interaction`、`Tabs`、`TabRecentFiles`、`ai-extension`、dockable 版面儲存與 `fileImportHelper` 都不受影響。

---

## 7. 設計

### 7.1 檔案

```
helpers/device/background/
  index.ts            // `backgroundTasks` 單例
  types.ts            // BackgroundTask、BackgroundContext、BACKGROUND_TASK_PRIORITY
  canTouchMachine.ts  // 共用的動手前檢查
```

### 7.2 任務契約

```ts
interface BackgroundContext {
  device: IDeviceInfo | null; // 頂欄所選的機器
  mode: CanvasMode;
  tabFocused: boolean;
  workarea: WorkAreaModel;    // 文件工作區
}

interface BackgroundTask {
  id: BackgroundTaskId;                           // BACKGROUND_TASK_PRIORITY 的 key
  models: ReadonlySet<WorkAreaModel>;             // 可以在哪些機型上跑
  isEnabled: (ctx: BackgroundContext) => boolean; // 任務自己的規則：畫布模式、工作區規則、偏好設定
  start: (device: IDeviceInfo) => void;           // 開始輪詢；機器已經被選取
  stop: () => void;                               // 停止輪詢；忙碌中則中止，不等待
  isBusy: () => boolean;                          // 正在做前景動作不能重疊的事
  abort: () => Promise<void>;                     // 停止忙碌的工作，並讓機器回到乾淨狀態
  busyMessage?: () => string;                     // 提示文字；isBusy 可能為 true 時必填
}
```

永遠不會忙碌的任務（Promark）讓 `isBusy` 回傳 `false`，`abort` 什麼都不做。

**優先級**集中在一張表，不放在任務上，所以整個順序在同一處審閱，新增任務時也一定得決定它的排名：

```ts
// types.ts：兩個任務要同一台機器時，數字大的優先
export const BACKGROUND_TASK_PRIORITY = {
  'promark-button': 20,          // 使用者按了實體按鈕
  'auto-full-area-preview': 10,  // 便利功能，永遠可以讓路
} as const;
export type BackgroundTaskId = keyof typeof BACKGROUND_TASK_PRIORITY;
```

數值間隔 10，新任務可以插在兩個既有任務之間，不必重新編號。不允許相同優先級（單元測試檢查）。

### 7.3 管理器

```ts
backgroundTasks.register(task): void
backgroundTasks.refresh(): void                    // 任務自己的設定改變了
backgroundTasks.yieldTo(device): Promise<boolean>  // 由 checkDeviceStatus 呼叫
backgroundTasks.isCurrent(task): boolean           // 目前機器是否為任務的機器
backgroundTasks.list(): Array<{ id; priority; running; device; busy }>  // 優先級高的在前
```

**情境**：`device` 由 `GoButton` 對 `CanvasContext.selectedDevice` 的 effect 餵入（`backgroundTasks.setDevice`），這樣也看得到不經 `SET_SELECTED_DEVICE` 的啟動預設機器（§2.3）。管理器自己訂閱 `useCanvasStore` 的 `mode`、`useDocumentStore` 的 `workarea` 與分頁焦點（§7.5）。

訂閱在第一次使用時（第一次 `register`、`setDevice` 或 `refresh`）才建立，而不是在 import 時：`check-device-status.ts` 會 import 管理器，若在循環 import 尚未載入完成時就讀 `tabController` 或 store，會拿到 `undefined`。

**判斷**，在每次情境改變與 `refresh()` 時：

```
依優先級（高到低）對每個 task：
  want = ctx.device && ctx.tabFocused && task.models.has(ctx.device.model) && task.isEnabled(ctx)
  若 want 且已有優先級較高的任務要 ctx.device → want = false；console.warn 一次
  若 want 且沒在跑   → 若不是目前機器就 select(ctx.device)；task.start(ctx.device)
  若 !want 且正在跑 → task.stop()
```

**「選取」的兩種意思。** 每個任務的*目標*機器是使用者在頂欄選的那台（`ctx.device`，來自 `SET_SELECTED_DEVICE`）。`deviceMaster.select()` 只決定共用的控制連線目前和哪台機器溝通；前景流程會為其他機器呼叫它（例如從選單打開 B 的監控視窗），但不會改變頂欄。任務跟著頂欄走，從不跟著 `deviceMaster` 的目前機器走。

**機器擁有權**：只有管理器能為任務呼叫 `deviceMaster.select`。任務每次 tick 前呼叫 `backgroundTasks.isCurrent(this)`，為 false 就跳過這次 tick。正在跑的任務其機器不是目前機器時，只要沒有 modal 開著、手動預覽關閉、且 `deviceMaster.currentControlMode === ''`（也就是沒有前景動作可能正在用另一台機器），管理器每 `RESELECT_MS = 5000` 重新選取一次。選取失敗依同一頻率重試。

**前景讓路**：`checkDeviceStatus` 在手動預覽區塊之後加上：

```ts
if (!(await backgroundTasks.yieldTo(device))) return false;
```

`yieldTo(device)`：對每個忙碌中的任務：在另一台機器上 → `await task.abort()`；在同一台機器上 → 以 `task.busyMessage()` 跳是／否提示，是 → `await task.abort()`，否 → 回傳 `false`。沒有任務忙碌 → 立即回 `true`。只是在輪詢的任務繼續輪詢；前景動作自己的對話框或子任務會透過 `canTouchMachine` 擋住它們。

### 7.4 `canTouchMachine(task)`

任務開始忙碌工作前執行的共用檢查（不是 tick 的守門；Promark 的按鈕輪詢不使用它）：

```ts
!hasAnyModal() &&
!previewModeController.isPreviewMode && !previewModeController.isStarting &&
deviceMaster.currentControlMode === '' &&
backgroundTasks.isCurrent(task) &&
(await deviceMaster.getReport()).st_id === DeviceConstants.status.IDLE
```

`hasAnyModal()`：`DialogContext.tsx` 回答新事件 `CHECK_ANY_DIALOG`，回 `dialogComponents.length > 0`；`AlertProgressContext.tsx` 回答 `CHECK_ANY_ALERT_PROGRESS`，回 `alertProgressStack.length > 0`；`dialogCaller.hasAnyModal()` 取兩者的 OR。與 `CHECK_ID_EXIST` 同一套 emitter 寫法（`DialogContext.tsx:31-33,46`）。

### 7.5 分頁焦點

`ctx.tabFocused` 在 Electron 是 `tabController.isFocused`（透過 `onFocused`／`onBlurred` 更新），在網頁版是 `document.visibilityState === 'visible'`（透過管理器自己的 `visibilitychange` listener 更新）。`tabController` 本身不改：讓它在網頁版發焦點事件，也會讓每次切換分頁都重新 attach 選單、重新抓最近檔案（§2.3）。Promark 監聽的 `isWeb() ||` 特例移除；網頁版在隱藏分頁時改為暫停。

### 7.6 Promark 遷移

| 今天（`promark-button-handler.ts`） | 之後 |
|---|---|
| `requirements.context`：模式 Draw/PathPreview + Promark 機器 | `models = promarkModels`；`isEnabled`：`mode ∈ {Draw, PathPreview}` |
| `requirements.workarea` | `isEnabled`：`promarkModels.has(ctx.workarea)` |
| `requirements.enabled` | `isEnabled`：`useDocumentStore.getState()['promark-start-button']`；它的訂閱呼叫 `backgroundTasks.refresh()` |
| `shouldFrameFirst` 與 `frame-before-start` 訂閱 | 按下時直接讀 `useDocumentStore.getState()['frame-before-start']` |
| `requirements.tab` | 管理器（`ctx.tabFocused`） |
| `startListening` 的 select | 管理器 |
| 經由 `GoButton.tsx:38-40` 的 `onContextChanged(mode, device)` | GoButton 的 effect 呼叫 `backgroundTasks.setDevice(device)`；模式由 store 取得 |
| `checkButton` tick | 不變，另加 `if (!backgroundTasks.isCurrent(this)) return;` |
| `setStatus`、`handleTaskFinish`、`setExportFn` | 公開 API 不變 |
| — | `isBusy = () => false`、`abort = async () => {}`、優先級 20 |

檔案留在 `helpers/device/promark/`；只改它的接線。

---

## 8. 資料契約

沒有持久化資料。§7.2 的任務契約是唯一的介面。

---

## 9. 推出（PR 計畫）

一個 PR，在自動預覽的 PR 之前合併，分成可審閱的小塊：

1. `background/` 管理器、型別、`list()`；Promark 遷移；GoButton effect 改餵管理器。行為不變。
2. `hasAnyModal()`、`canTouchMachine`。
3. `checkDeviceStatus` → `yieldTo`。此時還沒有任何成員會忙碌，所以在自動預覽上線前行為不變。
4. `background-tasks` skill（契約、規則、如何新增任務）。

---

## 10. 待決事項

1. ~~獨立 PRD 還是自動預覽 PRD 的一節~~ → 獨立 PRD（2026-10-30）。
2. ~~現在就遷移 Promark~~ → 是，`isBusy = false`；第二個成員能證明契約通用（2026-10-30）。
3. ~~兩個任務要同一台機器~~ → 明確的優先級，集中在一張表 `BACKGROUND_TASK_PRIORITY`（§7.2）；輸的那個被停止，忙碌中則中止（2026-10-30）。不採用註冊順序：它取決於 import 順序。
4. ~~前景動作把 `deviceMaster` 的目前機器切到另一台之後的重新選取~~ → 安靜之後，管理器每 5 秒以 `deviceMaster.select` 選回頂欄的機器，任務恢復（2026-10-30，§7.3）。頂欄的選擇才是目標；前景流程操作其他機器只是暫時的。不採用「永不重新選取」：任務會一直暫停，直到某個無關的動作剛好選回頂欄的機器。這不是指同一台機器的控制權被拿走：被踢時目前機器不變，下一個指令由 `getControl()` 重新連線；同一台機器上的前景子任務則由 tick 的 `currentControlMode` 檢查與 `canTouchMachine` 等它結束。
5. ~~獨立 PR 還是自動預覽 PR 的前幾塊~~ → 獨立的前置 PR，在自動預覽之前合併（2026-10-30，§9）。

---

## 11. 風險與後續

- **R1 Promark 迴歸。** 這個監聽控制 Promark 的工作開始；接線錯誤會讓實體按鈕失效。緩解：第 1 塊行為不變並由 B1/B2 覆蓋；合併前用 Promark 機器測試。
- **R2 重新選取和使用者打架。** 若「安靜」檢查漏掉某個不經 modal 或子任務就切換機器的前景流程，管理器可能在它底下切回去。緩解：5 秒間隔，且所有前景機器動作都先經過 `checkDeviceStatus`；發現例外就列入 §6。
- **R3 網頁版分頁焦點改變。** 網頁版的背景任務（含 Promark）從此在隱藏分頁時暫停。接受；管理器以外沒有任何改變。
- **F1 tick 輔助函式。** 若出現第三個任務帶著同樣的 `setInterval` + 等待中跳過 + `isCurrent` 樣板，就加 `backgroundTasks.every(task, ms, fn)`。
- **F2 唯讀型任務可並行。** 目前所有任務都視為獨佔型：一台機器一個，由優先級決定。這對會佔用資源的任務是對的，但未來的唯讀型輪詢（保養提醒讀取使用時數、溫度或水冷監控、韌體通知）會無謂地擠掉自動預覽，或被它擠掉。出現第一個這類任務時：在任務契約加 `exclusive?: boolean`（預設 `true`）；只有獨佔型參與 `refresh()` 裡 `claimedBy` 的優先級搶佔，唯讀型與之並行；`yieldTo` 不用改（唯讀型任務的 `isBusy` 永遠是 `false`）；加一個 spec，讓一個獨佔型與一個唯讀型任務在同一台機器上同時跑。並行任務送出的 control socket 指令本來就由 `addTask` 依序排隊。**判斷準則**：會進 raw 模式、移動雷射頭、改相機設定，或在機器上發起動作的任務是獨佔型（Promark 算在內：它的按鈕會發起匯出）；其他都是唯讀型。現在不做：沒有唯讀型任務可以驗證，而且全部視為獨佔型是安全的預設（最壞只是一個任務等待，不會兩個撞在一起）。

---

## 12. 測試計畫

免硬體（Jest，依 `unit-test` skill）：

- `background/index.spec.ts`：每個情境欄位的啟動／停止；`models` 過濾；`isEnabled` 為 false 時停止；優先級互斥（高者勝、輸者停止或中止、警告）；`BACKGROUND_TASK_PRIORITY` 不得有相同值；`refresh()` 重新判斷；`yieldTo` 在沒有任務忙碌、同一台機器忙碌（是／否）、另一台機器忙碌時的行為；只在安靜時重新選取、最多每 5 秒一次；`list()` 的各列。
- `canTouchMachine.spec.ts`：每個條件為 false → false。
- `promark-button-handler.spec.ts`（新增）：§7.6 的 isEnabled 對應；不是目前機器時跳過 tick；既有的按下／先框選計數不變。
- `check-device-status.spec.ts`：`yieldTo` 為 false → 在狀態 switch 之前回傳 false；為 true → 既有流程。
- `GoButton.spec.tsx`：mock 管理器，預期呼叫 `setDevice(selectedDevice)`。
- `background/index.spec.ts` 的網頁版焦點：`visibilitychange` 變成 hidden 時停止任務，回到 visible 時重新啟動；Electron 路徑使用 `tabController` 事件。

硬體（待機器；對應 §5）：Promark 的 B1、B2、B6。B4/B5 搭配 fbm2 上的自動預覽配套功能。
