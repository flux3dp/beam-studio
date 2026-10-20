# PRD：Promark 多組場鏡參數與畸變參數檢查

| | |
|---|---|
| **Status** | 實作中（branch `promark-lens-profiles`，未 commit）：L-1、L-2 依 2026-10-20 的決定實作完成，單元測試通過；尚未硬體測試。其他 21 種語言除 zh-cn 外先放英文。flux-id 的新 key 已在 branch `feat/promark-lens-profiles` 加入，部署前保存時上傳新 key 會失敗（§9.1） |
| **Author** | EstherFu（整理：Claude） |
| **Created** | 2026-10-19 |
| **Target product** | Beam Studio 桌面版（Promark `fpm1`），Desktop / MOPA / UV 都適用 |
| **Owner area** | Promark 機台設定、機器初始化、雲端設定、送出前的場鏡切換 |
| **Related code** | `helpers/device/promark/{promark-data-store,lens-profiles,apply-red-dot}.ts`、`helpers/api/flux-id/cloudConfig.ts`、`app/components/dialogs/promark/{PromarkSettings,LensProfileBlock,FieldBlock,LensBlock,RedDotBlock}.tsx`、`app/pages/InitializeMachine/Promark/{SelectPromarkLaserSource,PromarkSettings}.tsx`、`helpers/device-master.ts`（`select`、`setField`）、`helpers/device/framing.ts`、`helpers/api/swiftray-control.ts`（`setField`、`setLensCorrection`）、`app/actions/beambox/export-funcs.ts`（`promarkTaskCache`）、`app/actions/beambox/export/GoButton/handleExportAlerts.ts`、`app/constants/promark-constants.ts`、`interfaces/Promark.d.ts` |
| **Depends on** | [`promark-uv-inner-engraving.md`](promark-uv-inner-engraving.md)（UV 雷射源、UV 工作範圍、`isInnerEngravingActive()`），見 §9.1 |
| **External repos** | flux-id：雲端 `CONFIG_KEYS`、工廠設定檢視頁。檢視頁已合併（#685）；本 PRD 的變動在 branch `feat/promark-lens-profiles`（從 main `0fce783` 切出，未 commit） |

（以下路徑除非以 `packages/`、`Swiftray`、`flux-id` 開頭，否則都相對於 `packages/core/src/web/`。行號以 branch `promark-3d-inner-carving` 的 `6a0198f56` 為準。）

---

## 1. Summary

預期使用者普遍有多顆場鏡（UV 尤其明顯），目前每換一顆都要手動覆寫畸變參數。本 PRD 包含兩件事：

| # | 項目 | 涉及 |
|---|---|---|
| L-1 | **同一台機器保存多組場鏡參數**：每組 = 工作範圍 × 平面 / 內雕，其中一組標為預設；送出工作時依文件設定自動套用 | Beam Studio、flux-id |
| L-2 | **畸變參數輸入的範圍檢查**：明顯錯誤擋下不能保存，偏離常見值時警告 | Beam Studio |

L-2 不依賴 L-1。兩者都適用所有 Promark 雷射源。

**未來可能的變動**
- **HEXA II Galvo**：CO2 振鏡與 MOPA 振鏡的參數會以 config 格式存在機器記憶體。若之後需要在本機 / 雲端也保存紀錄，組別的 key 可能要多一個 CO2 / MOPA 欄位（§6.1 的 key 要能擴充）。
- **UV 場域 70 / 75**：由內雕 Phase 2 處理（`promark-uv-inner-engraving/phase2.md` P2-11），本 PRD 維持現狀（§10 #7）。

---

## 2. Background & current state

### 2.1 場鏡參數只有一組

- 本機：`promark-store`（`promarkDataStore`）每個序號一份 `PromarkStore`，場鏡相關的是 `field`（偏移、角度）、`galvoParameters`（X / Y 的 scale、bulge、skew、trapezoid）、`redDot`，各只有一組，**沒有記錄是哪個工作範圍校正的**（`interfaces/Promark.d.ts`）。
- 雲端：`cloudConfig.ts` 只有一個 key `promarkLens: { field, galvoParameters, redDot }`。讀取時只要雲端有資料就問一次要不要匯入，不比對本機是否相同（`readCloudConfig`）；上傳前也一定先問（`updateCloudConfig`）。讀取不需要登入（`readCloudConfig` 預設 `checkLogin = false`），上傳需要登入（`updateCloudConfig` 預設 `checkLogin = true`）。flux-id 只接受 `CONFIG_KEYS = ['promarkLens']`（`flux-id/fluxid/apps/machine/constants.py`）。
- 套用時機：**每次 `deviceMaster.select` 都會套用**。`select` 把 `field`、`galvoParameters` 送給 Swiftray（`device-master.ts:497-506`）；Swiftray 機器的 `selectDeviceWithSwiftray` 即使是同一台也會重建連線、重送參數，不會略過（`device-master.ts:424-506`）。紅點不在這裡套用。會呼叫 `select` 的流程：
  - 送出工作：`export-funcs.ts:753` 在產生工作之後、開啟工作監控之前 `select`，所以送出時套用的是當下文件的參數。
  - 相機預覽：`preview-mode-controller.ts:131`。
  - 紅光打框：`framing.ts:774` 先 `select`，`framing.ts:437-444` 再疊上紅點修正，結束時 `resetPromarkParams`（`framing.ts:507-516`）還原成文件那組。所以預覽或打框之後再送出，送出時的 `select` 會再套用一次。
  - 機器實體按鈕：`promark-button-handler.ts` 的再次執行走 `exportFn`，等同重新送出，也會 `select`。
  - 選單【機器】→ 儀表板：`menuDeviceActions.tsx:327-333` 先 `select`，再把上次送出的快取工作（`promarkTaskCache`，只在記憶體）交給工作監控，可以直接重跑。這時套用的是目前開啟文件的參數，不一定是快取工作當初的參數（§6.5）。
- Swiftray 不保存參數：`CorrectionParams`、`ScanaheadParams` 只在記憶體（`Swiftray src/periph/motion_controller/bsl_motion_controller.cpp:24-40`），斷線重連時重送，所以每次連線都得由 Beam Studio 推。
- 場域大小：`setField` 依「目前開啟的文件」判斷是否為 UV，UV 70mm 送 75（`getPromarkFieldWorksize`，`promark-constants.ts:36-37`）；開著其他機型的文件連線時會送 70。
- 機器初始化：`SelectPromarkLaserSource.tsx` 選雷射源與工作範圍，寫進文件的 `customized-dimension.fpm1` 與 `setPromarkInfo`；下一頁 `InitializeMachine/Promark/PromarkSettings.tsx` 用 `getWorkarea('fpm1').width` 套用並上傳雲端。
- 工廠設定檢視頁（flux-id，#685 已合併到 main）：`POST /machine/config/search` 依序號、上傳者、日期查詢，`frontend/src/factory/config/PromarkLensView.tsx` 以唯讀方式顯示 `promarkLens`。它顯示的 `field.width` 在 Beam Studio 的 `Field` 裡不存在，永遠是「未保存」。
- 雲端同步狀態的既有做法（FLUX 101，`app/components/dialogs/Flux101/`）：視窗標題列的一個 antd `Tag`。已登入時顯示綠色「Synced」（`CloudOutlined`）或灰色「Not synced」（`CloudSyncOutlined`），依本次 session 最後一次上傳的結果（`flux101Store.synced`，第一次上傳前是 `undefined`、不顯示，登出時重設）；未登入時顯示可點的「登入」Tag（`UserOutlined`，tooltip 說明登入後才會同步），點了開 FLUX ID 登入（`Flux101Dialog.tsx:73-93`、`sync.ts:41-48`）。

### 2.2 輸入沒有任何檢查

- `LensBlock.tsx`、`FieldBlock.tsx`、`RedDotBlock.tsx` 的 `UnitInput` 都沒有設 `min` / `max`，`swiftray-control.ts:534-547` `setLensCorrection` 原樣送出。scale 輸入負數或 1（以為是倍率）都能保存並送到機器。
- 預設值：`defaultGalvoParameters` scale 100、其餘 1；`defaultField` 全 0；`defaultRedLight` scale 1、offset 0（`promark-constants.ts:65-70`）。
- 雲端實例（8 筆，2026-10-19 取樣，其中 1 筆全為預設值、視為未校正）：

  | 欄位 | 範圍（不含未校正那筆） |
  |---|---|
  | 振鏡 scale X / Y (%) | 79.5 ～ 83.1 |
  | 振鏡 bulge | X 0.945 ～ 0.965、Y 1.03 ～ 1.06 |
  | 振鏡 skew | 1 ～ 1.01 |
  | 振鏡 trapezoid | 0.997 ～ 1.005 |
  | 場域 offset X / Y (mm) | -3 ～ 3 |
  | 場域 angle (°) | -0.172 ～ 0 |
  | 紅點 scale X / Y | 1 ～ 1.017 |
  | 紅點 offset X / Y (mm) | -2.3 ～ 2.5 |

  實例沒有記錄場鏡大小，看不出不同工作範圍的 scale 是否差很多（§10 #8）。
- 標明場鏡的 UV 實例（2026-10-20 提供，skew 皆為 1）：

  | 組別 | scale X / Y (%) | bulge X / Y | trapezoid X / Y | angle (°) |
  |---|---|---|---|---|
  | 70mm 內雕 | 79.24 / 77.95 | 0.996 / 1.082 | 1.001 / 0.996 | 0 |
  | 70mm 平面 | 86.428 / 84.987 | 0.995 / 1.082 | 1 / 0.997 | 0 |
  | 200mm 平面 | 82.086 / 80.769 | 0.963 / 1.052 | 1 / 0.997 | -0.172 |

  - 同一顆 70mm 場鏡，內雕和平面的 scale 差約 9%，所以兩種模式需要各自一組參數。
  - 200mm 這組和上面雲端實例中 angle -0.172 那筆相同，所以那筆是 200mm 場鏡。
  - bulge Y 1.082 是目前看到的最大值，離警告上限 1.1 只差 0.018。

---

## 3. Goals & non-goals

### 3.1 Goals

- 換場鏡不用手動覆寫畸變參數：每組工作範圍 × 平面 / 內雕各自保存，送工作時自動選對。
- 舊版存的單組參數不會遺失，升級後直接當作已保存的參數使用。
- 退版或多台電腦版本不一致時，舊版 Beam Studio 仍讀得到正確的一組（預設組）。
- 新版與舊版的資料格式，Beam Studio 和 flux-id 都看得懂。
- 打錯的畸變參數（負數、單位搞錯）在保存前就被攔下。

### 3.2 Non-goals

- 網頁版。
- 同一工作範圍 × 模式保存多組（例如兩顆同尺寸場鏡）：目前不做（§10 #2）。
- 依校正結果自動判斷參數好壞：只做靜態的範圍檢查。
- HEXA II Galvo 的 CO2 / MOPA 振鏡參數（§1 未來可能的變動）。

---

## 4. Scenarios & acceptance criteria

### L-1 多組場鏡參數

**S1 設定兩組場鏡**
- 操作：選單【機器】→ Promark 設定。上方的「場鏡」區塊顯示雷射源（唯讀）、工作範圍、平面 / 內雕。選 70mm 內雕，調整參數，保存；再選 200mm 平面，調整，保存。
- 結果：重新開啟時兩組都標示「已保存」，各自顯示自己的數值。
- 邊界：
  - Desktop / MOPA 也有同一個區塊；內雕只有 UV 70mm 能選，其他情況停用。
  - 切換到別組再切回來，未保存的修改保留，狀態顯示「已編輯」。
  - 按取消時，所有未保存的修改都丟棄，機器還原成目前文件那組。

**S2 設為預設**
- 操作：在 S1 選中 200mm 平面，按【設為預設】。
- 結果：200mm 平面標上「預設」，原本的預設組拿掉標記。本機頂層的舊版參數與雲端 `promarkLens` 改成 200mm 平面這組的值。
- 邊界：
  - 從沒指定過預設時，依 §6.2 的規則自動選一組，並在畫面上標示。
  - 改了預設組的參數並保存，舊版格式的參數也一起更新。
  - 用舊版 Beam Studio 開同一台電腦或同一台機器，讀到的是預設組的值。

**S3 對話框內的預覽與打框**
- 操作：在 S1 選中 200mm，按預覽、標記。
- 結果：打框與標記使用 200mm 的工作範圍與這組參數，和目前開著的文件無關。

**S4 送出工作時自動套用**
- 操作：開 70mm 內雕文件送出，再開 200mm 平面文件送出，中間不重新連線。
- 結果：兩次送出前各自套用對應的參數（可在 log 看到套用的組別與來源）。
- 選擇順序：完全符合 → 預設組 → 舊版參數（沒有工作範圍）→ 出廠值。
- 邊界：
  - 送出前先預覽或紅光打框，送出時仍套用文件那組（打框的紅點修正已還原）。
  - 落到出廠值（從沒設定過任何畸變參數）時，送出前警告「尚未設定畸變參數」：【略過】繼續送出，並可勾選「不再顯示」；【前往設定】取消這次送出，開啟這台機器的 Promark 設定並選中文件那組。
  - 送出 70mm 工作後開啟 200mm 文件，從【機器】→ 儀表板重跑上次的工作：見 §6.5、§10 #10。

**S5 只有舊版參數（升級）**
- 操作：用舊版存過參數的電腦升級後，打開 Promark 設定，切換不同的工作範圍與模式。
- 結果：不論切到哪一組，都自動帶入舊版參數，狀態顯示「已保存」（附註「沿用舊版參數」）。
- 邊界：
  - 在任一組按保存，那組就成為自己的資料；若還沒有預設組，它同時成為預設（§6.2）。
  - 有預設組之後，其他還沒保存過的組別改為帶入預設組的參數。

**S6 雲端同步**
- 操作：登入 FLUX ID，在 S1 保存。換一台電腦連同一台機器，打開 Promark 設定。
- 結果：比對後發現本機和雲端不同，詢問是否使用雲端參數，並列出哪些組別不同；選【是】後雲端參數填進畫面（不同的組別顯示「已編輯」），按保存後所有組別、預設標記都和原本那台一致；按取消則全部丟掉。同步標籤何時變綠見 §10 #16。
- 邊界：
  - 舊版 Beam Studio 讀同一台機器的雲端資料，拿到的是預設組（`promarkLens`）。
  - 雲端只有舊版 `promarkLens`、沒有新 key：當作舊版參數匯入，等同 S5。
  - 工廠設定檢視頁顯示每一組參數、預設標記、雷射源，以及舊版 `promarkLens`。
  - 本機和雲端完全相同：不詢問，每一組直接顯示「已同步」。
  - 詢問時選【否】：不同的組別顯示「未同步」，旁邊多一個【使用雲端參數】按鈕；按下後只套用這一組的雲端參數，這組變成「已同步」，其他組不變。
  - 未登入：照樣讀取、比對、詢問，同步狀態的判斷和已登入相同；只是保存時不會上傳，所以保存過的組別若和雲端不同會變成「未同步」。
  - 讀取雲端失敗、或雲端沒有這台機器的資料：每一組都顯示「未同步」，沒有【使用雲端參數】。
  - 只在本機改了某一組並保存、上傳前拒絕或失敗：只有那一組變成「未同步」，其他組不變。
  - 只有本機有、雲端沒有的組別：「未同步」，沒有【使用雲端參數】（沒有東西可以套用）。

**S7 機器初始化**
- 操作：初始化 Promark UV，選雷射源與工作範圍 70mm，下一頁的參數頁。
- 結果：參數頁也有「場鏡」區塊，可以切換組別、各自調整並保存多組；初始化時選的工作範圍那組預設為「預設」。
- 邊界：只調整了一組就完成初始化，結果和 S5 之後保存一組相同。

### L-2 範圍檢查

**S8 明顯錯誤**
- 操作：Promark 設定（或機器初始化的參數頁），振鏡 X 的縮放輸入 `-80` 或 `1`。
- 結果：欄位標紅並顯示允許範圍，不能保存（§10 #9）；輸入值保持原樣，不自動改成邊界值。
- 邊界：
  - 改回範圍內，紅框立即消失、可以保存。
  - 其他組別有錯誤時也不能保存，並標示是哪一組。

**S9 偏離常見值**
- 操作：振鏡 X 的 bulge 輸入 `1.15`。
- 結果：欄位標黃；按保存時跳一次確認「以下參數和常見值差異較大：…」，確認後照常保存。
- 邊界：
  - 全部為出廠值（尚未校正）不警告。
  - 硬限制與警告的範圍見 §6.7。

---

## 5. Must not change（回歸合約）

| 共用檔案 / 函式 | 呼叫端 — 必須維持的行為 |
|---|---|
| `deviceMaster.select`（`device-master.ts:497`） | 任何雷射源，只有舊版參數、沒有設定過多組時：套用的值和現在相同 |
| `deviceMaster.select`（送出 `export-funcs.ts:753`、預覽 `preview-mode-controller.ts:131`、打框 `framing.ts:774`、自動對焦 `AutoFocusButton`） | 非 Promark 機型：流程不變；Promark：每個呼叫端仍在原本的時間點套用一次，不多送指令 |
| `export-funcs.ts` `promarkTaskCache` | 沒有設定過多組參數時（不限雷射源），儀表板重跑快取工作的行為不變 |
| `deviceMaster.setField` | worksize 和現在相同（UV 70 / 75 維持現狀） |
| `framing.ts` 紅點套用 / 還原 | 紅光打框結束後機器回到打框前的參數 |
| `handleExportAlerts` | 有任何畸變參數（多組、預設或舊版）時不多跳警告；非 Promark 不受影響 |
| `PromarkSettings` 對話框 | Desktop / MOPA / UV 都改成多組；只有舊版參數時，顯示與保存的數值和現在相同 |
| `InitializeMachine/Promark/*` | 雷射源、工作範圍的選擇流程不變；參數頁改成多組 |
| `LensBlock` / `FieldBlock` / `RedDotBlock` | 範圍內的輸入行為不變（步進、精度、單位換算） |
| 本機 `promark-store` 頂層 `field` / `galvoParameters` / `redDot` | 舊版 Beam Studio 讀到的永遠是一組完整可用的參數（預設組或原本的舊版值） |
| `cloudConfig.ts` `promarkLens` | 舊版 Beam Studio 讀寫同一台機器時不出錯、拿到預設組 |
| `cloudConfig.ts` `readCloudConfig` | 只有 Promark 設定對話框與機器初始化參數頁呼叫；兩者都改成「先比對、有不同才詢問」（§6.5），不另外保留舊的「有資料就問」行為 |
| `cloudConfig.ts` `updateCloudConfig` | 上傳仍需要登入、上傳前仍先詢問 |
| flux-id `machine/config/update` / `read` | 既有 `promarkLens` 資料讀寫不變 |

| `handleExportAlerts`（`handleExportClick` 呼叫） | Promark 只多一個出廠值警告，位置在旋轉軸版本檢查之後；選【前往設定】或關閉視窗都取消送出 |
| `export-funcs.ts` `promarkTaskCache` 寫入 | 多記 `lensProfileKey`；其他欄位與寫入時機不變 |
| `menuDeviceActions.tsx` `DASHBOARD` | 快取工作的組別和目前文件相同時不多送指令；不同時在 `select` 之後多送一次 `setField` / `setGalvoParameters` |
| `MonitorContext.tsx` `PreviewTask` | 只多一個選填欄位，工作監控本身不讀它 |
| `alert-config.ts` | 多一個 key `skip-lens-not-calibrated-warning` |
| `cloudConfig.ts` `updateCloudConfigApi` | 內部拆出 `postCloudConfig` / `showUpdateResult`，訊息與行為不變；新增 `updateCloudConfigs`（一次詢問、上傳多個 key、只顯示一次結果） |
| `promark-constants.ts` | 只新增 `getLensParameterRanges` 等常數，既有常數不變 |
| `FieldBlock` / `RedDotBlock` / `LensBlock` 的其他呼叫端 | 只有 Promark 設定對話框與初始化參數頁，兩者都改傳 `issues`；不傳 `issues` 時不標示 |

---

## 6. Design

### 6.1 資料模型

- `LensProfileKey = { workarea: number; innerEngraving: boolean }`；`LensProfile = key + { field, galvoParameters, redDot }`；`PromarkStore.lensProfiles?: LensProfile[]`、`PromarkStore.defaultLensProfile?: LensProfileKey`（`helpers/device/promark/lens-profiles.ts`、`interfaces/Promark.d.ts`）。
  - 預設標記存成 key 而不是每組一個 boolean，確保同時只有一組是預設。
  - 紅點每組各一份（2026-10-20 決定）。
- `normalizeLensProfileKey`：只有 UV 70mm 能是內雕。
- 比對組別一律比對 key 的所有欄位；之後若 key 多一個 CO2 / MOPA 欄位（§1），舊資料缺少的欄位視為該機器的預設值，不需要搬資料。
- `resolveLensProfile(store, key)` 依序回傳，並附上來源：

  | 順序 | 來源 | 條件 |
  |---|---|---|
  | 1 | `exact` | 有和 key 完全相同的組別 |
  | 2 | `default` | 有預設組 |
  | 3 | `legacy` | 頂層有舊版參數 |
  | 4 | `fallback` | 都沒有，使用出廠值 |

- 新版保存後，頂層舊版參數會和預設組一致（§6.4），所以 3 只在「從沒在新版保存過」或「舊版 Beam Studio 之後又改了舊版參數」時用到（§10 #11）。
- `getDocumentLensProfileKey(info)`：文件是 Promark 時取文件的工作範圍，否則取該雷射源的預設工作範圍；內雕看 `isInnerEngravingActive()`。
- `supportsLensProfiles` 改為所有 Promark 雷射源都回傳 true（2026-10-20 決定 Desktop / MOPA 也支援）。

### 6.2 預設組

- 每台機器同時最多一組預設，對話框裡每組可以按【設為預設】。
- 使用者沒手動指定時的預設規則（建議，§10 #12）：
  1. **機器初始化**：初始化時選的工作範圍那組（UV 70mm 為平面）。
  2. **升級後第一次保存**：第一個保存的組別。只有舊版參數的使用者，第一次保存的通常就是他現在裝著、舊版參數校正的那顆。
  3. **雲端匯入**：沿用雲端的預設標記。
  - 其他考慮過的規則：雷射源的預設工作範圍（`getDefaultPromarkWorkarea`，UV 70、MOPA 20W 為最小、其餘最大）、最後一次保存的組別。前者可能指到使用者沒有的場鏡；後者會讓預設一直跳動，所以不建議。
- 預設組要同步到舊版格式：設為預設、或保存預設組時，把它的 `field` / `galvoParameters` / `redDot` 寫到本機頂層與雲端 `promarkLens`。舊版參數**不刪除**，留給退版與多台電腦版本不一致的情況。

### 6.3 Promark 設定對話框

- 上方「場鏡」區塊（`LensProfileBlock.tsx`）：雷射源（唯讀，例如「UV - 5W」）、工作範圍下拉（`widgets/AntdSelect`，下拉寬度不跟著選單）、平面 / 內雕切換（只有 UV 顯示）、狀態標籤、預設標記與【設為預設】、同步狀態。原本 FieldBlock 的工作範圍欄位隱藏。Desktop / MOPA / UV 都顯示。不顯示「目前文件送出時套用」（2026-10-20 移除）。
- 組別名稱（雲端差異詢問、範圍警告、出廠值警告等）：UV 顯示「70 mm・平面」，Desktop / MOPA 沒有雕刻模式，只顯示「220 mm」（`describeLensProfileKey`）。
- 組別狀態：

  | 狀態 | 條件 | 附註 |
  |---|---|---|
  | 未設定 | 來源是 `fallback`，顯示出廠值 | — |
  | 已保存 | 來源是 `exact`；或沒有自己的資料、帶入 `default` / `legacy` | 帶入時附註「沿用預設組」或「沿用舊版參數」 |
  | 已編輯 | 對話框內改過、還沒保存 | — |

- 預設標記與同步狀態和上表**並列**顯示，不是第四種狀態（2026-10-20 決定）：
  - 預設：該組旁的「預設」Tag。
  - 同步：**每一組各自判斷**（2026-10-20 決定）。有讀到雲端的值，且雲端這一組的 `field` / `galvoParameters` / `redDot` 每個參數都和**畫面上目前的值**一致，顯示綠色「已同步」（樣式同 FLUX 101 的 Synced Tag，§2.1）；其他情況一律灰色「未同步」，包含讀取失敗、雲端沒有這組、任一參數不同。**不考慮登入狀態**：讀取不需要登入（§2.1），未登入也照樣比對。
    - 【使用雲端參數】：開啟時的詢問結束後（不論是否有詢問、選了什麼），只要雲端有這組、且和畫面不同，就在「未同步」旁邊顯示這個按鈕（`CloudDownloadOutlined`）。按下後把這一組的雲端參數填進畫面，其他組不變；之後改壞了也可以再按一次。
    - 圖示位置：「未同步」Tag 的圖示是 `CloudSyncOutlined`，放在文字左邊。按鈕的圖示放右邊（`☁ 未同步 [使用雲端參數 ☁]`），用文字把兩個雲朵圖示隔開（2026-10-20 決定，§10 #15）。
    - 每次修改都重新比對（2026-10-20 決定，§10 #16）。未編輯時畫面就是本機已保存的值；按【使用雲端參數】後會同時顯示「已編輯」與「已同步」，表示畫面和雲端一致、但還沒存到本機。
    - 「雲端這一組」：雲端有 `promarkLensProfiles` 時是其中 key 相同的那組（沒有就算不同）；雲端只有舊版 `promarkLens` 時，每一組都和它比對（舊版參數適用所有組別，同 S5）。
    - 雲端的值在開啟對話框時讀一次，不需要每次切換組別都重新讀取。
    - 數值直接比對、不做容差，物件欄位不看順序。
- 切換組別：目前組別的修改暫存在對話框內；保存時存畫面上這組，以及改過的其他組。
- 預覽 / 標記：使用選中組別的工作範圍與參數。
- 保存後：機器套用目前文件那組，不是剛編輯的那組。

### 6.4 機器初始化

- `InitializeMachine/Promark/PromarkSettings.tsx` 也放「場鏡」區塊，可以設定多組（與 §6.3 共用元件）。
- `SelectPromarkLaserSource` 選的工作範圍是第一個顯示的組別，也是預設組（§6.2）。

### 6.5 本機與雲端格式

- **本機**：新增 `lensProfiles`、`defaultLensProfile`；頂層舊版參數保留，並跟著預設組更新（§6.2）。
- **雲端 key**（flux-id `CONFIG_KEYS` 都要加入）：

  | Key | 值 | 寫入時機 |
  |---|---|---|
  | `promarkLens`（既有） | 預設組的 `{ field, galvoParameters, redDot }` | 設為預設、保存預設組時 |
  | `promarkLensProfiles`（新） | `{ profiles: LensProfile[]; defaultKey?: LensProfileKey }` | 每次保存 |
  | `promarkLaserSource`（新，名稱暫定） | `PromarkInfo`（`laserType`、`watt`） | 每次保存，直接覆寫 |

  - `promarkLensProfiles` 外面包一層物件而不是直接存陣列，之後加欄位（例如 §1 的 CO2 / MOPA）不用再換 key。
- **新版讀取**：先讀 `promarkLensProfiles`；沒有時讀 `promarkLens` 當作舊版參數（等同 S5）。讀取不需要登入。
- **讀到後先比對再詢問**（2026-10-20 新增的行為變動，原本只要雲端有資料就問）：
  - 逐組比對雲端與本機已保存的值，另外比對預設標記。雲端只有 `promarkLens` 時，和本機頂層的舊版參數比對（新版保存後它就是預設組），不同時列為「舊版參數」；選【是】只替換對話框內的舊版參數，畫面上沿用舊版參數的組別跟著改變，保存時照常只存畫面上這組與改過的組別。
  - 完全相同：不詢問。
  - 有不同：詢問「雲端參數和本機不同，是否使用雲端參數？」，並列出不同的組別（例如「70 mm・內雕、200 mm・平面、預設組」）。只有本機有、雲端沒有的組別不算不同，也不列出。
  - 【是】：雲端有的組別、預設標記覆蓋本機；只有本機有的組別保留。
  - 【否】：本機不變，不同的組別顯示【使用雲端參數】（§6.3）。
  - 套用雲端參數（【是】或按鈕）只填進畫面，不立刻保存：那幾組變成「已編輯」，按保存才寫進本機，按取消就丟掉（2026-10-20 決定，§10 #14）。
- 機器初始化的參數頁使用同一套比對與詢問。
- **兩種格式都看得懂**：Beam Studio 新版讀寫兩者、舊版只讀寫 `promarkLens`；flux-id 工廠設定檢視頁同時顯示兩者（§6.8）。
- 上傳前詢問的流程不變（`updateCloudConfig`），三個 key 一起詢問一次；上傳仍需要登入。

### 6.6 送出工作時套用

- 送出、預覽、打框都會先 `select`（§2.1），所以只要 `select` 依文件選組別，送出時就會自動套用，不需要另外加一次。demo 已把 `select` 與紅光打框改成用同一個 resolver（`getDocumentLensProfile`）。
- **出廠值警告**：`handleExportAlerts` 在 Promark 送出前檢查，`getDocumentLensProfile` 的來源是 `fallback` 時跳警告「尚未設定畸變參數」，按鈕【前往設定】/【略過】，加一個「不再顯示」勾選，沿用 `alertConfig` 的寫法（`handleExportAlerts.ts:131-160` 自動送料的說明視窗）。
  - 【前往設定】（2026-10-20 決定要做）：取消這次送出，開啟這台機器的 Promark 設定，並選中文件那組。保存後不會自動接著送出，使用者再按一次送出。
  - 【略過】：照出廠值送出；勾了「不再顯示」之後不再警告。
- **儀表板重跑快取工作**（§10 #10）：
  - 建議：`promarkTaskCache` 多記一個送出時的 `LensProfileKey`，從工作監控開始快取工作前，若和目前套用的組別不同，改套快取那組。
  - 理由：快取工作的路徑是依當初文件的工作範圍產生的（內雕還包含折射補償），換成另一顆場鏡的參數一定雕錯，而不是「用目前設定」比較合理。快取只在記憶體，工作檔本身不用記錄場鏡狀態。
  - 另一種做法是不記錄、總是用目前文件的組別，但組別不同時至少要提示，否則會靜靜地雕錯。
- 套用的組別與來源寫進 log，方便客服追查。
- 場域大小（UV 70 / 75）：維持現狀，由內雕 Phase 2 處理。

### 6.7 範圍檢查（L-2）

- **硬限制**：超出就是錯誤，欄位 `status="error"`，不能保存。不用 `UnitInput` 預設的 `clipValue` 把值夾到邊界——打錯時自動改值反而看不出錯在哪；改成 `clipValue={false}` 加上檢查函式。
- **警告**：可保存，欄位 `status="warning"`，按保存時列出所有警告欄位確認一次。列出的範圍是保存後所有有自己資料的組別（這次保存的組別，加上之前保存過的），依組別順序排列，不只畫面上這組。
- 只檢查單一欄位，不做跨欄位檢查（2026-10-20 決定）。
- 範圍（依 §2.2 的實例；警告範圍待更多實例確認，§10 #8）：

  | 區塊 | 欄位 | 出廠值 | 硬限制 | 警告 |
  |---|---|---|---|---|
  | 振鏡 | scale (%) | 100 | 50 ～ 150 | 70 ～ 110 以外 |
  | 振鏡 | bulge | 1 | 0.8 ～ 1.2 | 0.9 ～ 1.1 以外 |
  | 振鏡 | skew | 1 | 0.9 ～ 1.1 | 0.97 ～ 1.03 以外 |
  | 振鏡 | trapezoid | 1 | 0.9 ～ 1.1 | 0.98 ～ 1.02 以外 |
  | 場域 | offset X / Y (mm) | 0 | ±工作範圍 × 10% | 絕對值 > 5 |
  | 場域 | angle (°) | 0 | ±10 | 絕對值 > 2 |
  | 紅點 | scale X / Y | 1 | 0.8 ～ 1.2 | 0.95 ～ 1.05 以外 |
  | 紅點 | offset X / Y (mm) | 0 | ±10 | 絕對值 > 5 |

- 範圍表放在 `promark-constants.ts`，檢查函式（例如 `validateLensParameters(parameters, workarea) → { errors, warnings }`）放 `helpers/device/promark/`，對話框與機器初始化共用。
- 英制顯示時，offset 的範圍以 mm 檢查，訊息依單位顯示。

### 6.8 flux-id 工廠設定檢視頁

- `feat/factory-machine-config-viewer` 已依現況合併（#685，只顯示 `promarkLens`）。
- 另開的 PR（branch `feat/promark-lens-profiles`，已實作）：`CONFIG_KEYS` 加上新 key；`PromarkLensView.tsx` 依組別顯示每組的工作範圍、平面 / 內雕、預設標記與參數，另外顯示雷射源與舊版 `promarkLens`；移除不存在的 `field.width`。`config/search` 已回傳整份 `config_data`，不用改。
  - 顯示順序：雷射源 → 各組參數（組名用有底色的標題列標示）；有 `promarkLensProfiles` 時不顯示舊版 `promarkLens`（它只是預設組的副本）。
  - 實作：`fluxid/apps/machine/constants.py` 加入 `promarkLensProfiles`、`promarkLaserSource`；`MachineConfigReadUpdateTestCase` 測新 key 的讀寫、未知 key、未登入讀取。前端新增 `PromarkLensProfilesView.tsx`（每組一塊，依工作範圍、平面在前排序，預設組加 Tag）、`PromarkLaserSourceView.tsx`；`ConfigDetail.tsx` 依上述順序顯示，有新 key 時略過 `promarkLens`。

---

## 7. Data contracts

| 位置 | 欄位 | 說明 |
|---|---|---|
| 本機 `promark-store[serial].lensProfiles` | `LensProfile[]` | 新欄位 |
| 本機 `promark-store[serial].defaultLensProfile` | `LensProfileKey` | 新欄位 |
| 本機 `promark-store[serial]` 頂層 `field` / `galvoParameters` / `redDot` | 舊版格式 | 保留；新版保存預設組時同步更新 |
| 雲端 `config_data.promarkLensProfiles` | `{ profiles, defaultKey? }` | 新 key |
| 雲端 `config_data.promarkLaserSource` | `PromarkInfo` | 新 key，名稱暫定，每次保存覆寫 |
| 雲端 `config_data.promarkLens` | `{ field, galvoParameters, redDot }` | 格式不變；內容是預設組 |
| `export-funcs.ts` `promarkTaskCache[serial]` | `+ lensProfileKey` | 只在記憶體（§6.6） |
| `alertConfig` `skip-lens-not-calibrated-warning` | 出廠值警告的「不再顯示」 | 新 key |

範圍檢查不改資料格式；已存在、超出硬限制的舊資料照樣讀出，只在開啟對話框時標紅。

---

## 8. Performance

- 套用參數沿用 `select` 既有的兩個 Swiftray 指令（`setField`、`setLensCorrection`），不增加送出時間；只有儀表板重跑快取工作、且組別不同時多送一次。

---

## 9. Rollout — PR plan

### 9.1 相依關係

- **依賴內雕 Phase 1**：UV 雷射源與工作範圍選項、`UV_INNER_ENGRAVING_WORKAREA`、`isInnerEngravingActive()`（`helpers/addOn/innerEngraving.ts`）、`PROMARK_UV_INFO` 都在 Phase 1 branch `promark-3d-inner-carving`，還沒進 main。所以本 PR 要等 Phase 1 合併到 main 之後才開。
- **和內雕 Phase 2（branch `promark-3d-inner-carving-phase2` 的 `docs/prd/promark-uv-inner-engraving/phase2.md`）互相獨立**：Phase 2 改的是 3D 畫布、選取、照片轉點雲、圖層參數、Swiftray 切片；本 PRD 改的是 Promark 設定對話框、機器初始化、`device-master` / `framing` 的參數套用與雲端設定，沒有共用檔案。兩邊誰先合併都可以。唯一的交集是 UV 70 / 75 場域：由 Phase 2 處理，本 PRD 不動。
- Branch `promark-lens-profiles`：從 Phase 1 branch `promark-3d-inner-carving` 切出，Phase 1 合併到 main 後改以 main 為基底（merge 同步）再開 PR。程式不另外做「不分內雕」的版本。
- flux-id：檢視頁已合併（#685）；本 PRD 的 flux-id 變動在 branch `feat/promark-lens-profiles`，另開 PR，且要在 Beam Studio 開始寫新 key 之前部署（否則 `CONFIG_KEYS` 會拒絕）。

### 9.2 PR

| # | 內容 | Repo |
|---|---|---|
| PR-1 | L-1 多組場鏡參數（本機 + 預設組 + 對話框 + 初始化 + 出廠值警告 + 快取工作的組別）+ L-2 範圍檢查 | Beam Studio |
| PR-2 | `CONFIG_KEYS` 加上新 key、工廠設定檢視頁顯示多組（branch `feat/promark-lens-profiles`，已實作） | flux-id |

L-2 若要提早上線，可以從 PR-1 拆出單獨的 PR，不需要等 Phase 1。

---

## 10. Open decisions

1. ~~是否擴展到 Desktop / MOPA？~~ 2026-10-20：是，所有 Promark 雷射源都支援多組。
2. ~~是否允許同一工作範圍 × 模式保存多組？~~ 2026-10-20：目前不做。
3. ~~紅點參數是每組各一份，還是整台機器共用？~~ 2026-10-20：每組各一份。
4. ~~初始化 UV 70mm 時，參數存成平面、內雕，還是兩組都存？~~ 2026-10-20：初始化也能設定多組，問題不存在；預設組規則見 #12。
5. ~~「已同步」：第四種狀態還是並列標記？怎麼顯示？~~ 2026-10-20：和其他狀態並列、獨立顯示；每一組各自判斷，有讀到雲端值且這組所有參數一致 = 綠色「已同步」，否則灰色「未同步」（§6.3）。
6. ~~雲端：新 key 還是改 `promarkLens` 的格式？是否同步寫回？舊版參數要不要刪？~~ 2026-10-20：新 key `promarkLensProfiles`；寫回 `promarkLens` 的是使用者選的預設組；舊版參數不刪，留給退版與多台電腦版本不一致。
7. ~~UV 70mm 場域改用 70 還是維持 75？~~ 2026-10-20：本 PRD 維持現狀，由內雕 Phase 2 處理。
8. 範圍檢查的警告範圍：目前只有 8 筆沒標示場鏡大小的實例和 3 筆 UV 實例。需要 Desktop / MOPA 各工作範圍的實例，確認是否要依工作範圍分開設定；bulge 警告上限是否放寬到 1.12。
9. 硬限制時是停用保存按鈕，還是按下後提示？目前實作為停用（機器初始化頁停用【下一步】），並在場鏡區塊列出有錯誤的其他組別；欄位 hover 顯示允許範圍。
10. 儀表板重跑快取工作：記錄送出時的組別並改套（建議，§6.6），還是總是用目前文件的組別、只在不同時提示？目前依建議實作（`menuDeviceActions.tsx` `DASHBOARD`），待確認。
11. 舊版 Beam Studio 在新版之後又改了舊版參數（退版、或另一台電腦用舊版）：新版的順序是預設組優先，這個修改會被忽略。要不要在開啟對話框時偵測「舊版參數和預設組不一致」並詢問是否匯入預設組？
12. 使用者沒手動指定時的預設組規則：§6.2 的建議（初始化選的工作範圍 → 升級後第一個保存的組別 → 沿用雲端）是否可行？目前依建議實作；還沒有預設組時，「預設」標記顯示在畫面上的組別（保存時它就成為預設）。
13. ~~出廠值警告的【前往設定】要直接開 Promark 設定，還是只提供【略過】？~~ 2026-10-20：要提供【前往設定】，取消送出並開啟 Promark 設定（§6.6）。
14. ~~套用雲端參數時直接寫進本機，還是只填進畫面？~~ 2026-10-20：只填進畫面，按保存才寫進本機，按取消丟掉（和現在 `readCloudConfig` 匯入後只更新畫面的行為相同）。
15. ~~【使用雲端參數】的圖示放右邊還是左邊？~~ 2026-10-20：放右邊，避免和「未同步」的雲朵圖示相鄰。
16. ~~同步標籤比對畫面上的值，還是本機已保存的值加「剛從雲端套用」旗標？~~ 2026-10-20：比對畫面上目前的值，每次修改都重新比對。
17. 雷射源改了之後，舊雷射源的組別怎麼處理？情境：使用者忘了設定雷射源，在 Desktop 下保存了 220 mm 並設為預設；改成 UV 後重開設定，70 / 200 都顯示「沿用預設組」，但可選的組別裡沒有 220，送出時也會靜靜套用 220 的值（舊版欄位是預設組的副本，跳過預設組也一樣）。這組值是以 220 mm 場域校正的，不適用於 70 / 200。只會發生在 UV 和 Desktop / MOPA 之間（Desktop / MOPA 的工作範圍相同）。建議：
    - 選擇順序跳過「工作範圍不在目前雷射源選項內」的預設組，以及此時只是它副本的舊版欄位，落到 `fallback`：畫面顯示「未設定」，送出前跳出廠值警告。
    - 資料不自動刪除（改錯雷射源再改回來時可以恢復），雲端照常上傳。
    - 場鏡區塊提示「以下參數是在其他雷射源下保存的，目前不會套用：220 mm（預設）」，提供【帶入目前組別】（填進畫面，按保存才寫入，同【使用雲端參數】）；是否另外提供【刪除】待定。
    - 原本的預設組失效後，依 §6.2 規則由第一個保存的組別成為預設，舊版欄位跟著更新。
    - 不採用：改雷射源時自動搬移 / 清除（影響文件設定與初始化流程，改錯時資料會遺失）；組別 key 加雷射源欄位（Desktop / MOPA 互換時會對不上）。
