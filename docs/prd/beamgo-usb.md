# BeamGo USB integration

| Field | Value |
|---|---|
| Status | Initial implementation complete; full daemon build and hardware acceptance pending |
| Author | Codex, based on the 2026-11-24/27 BeamGo USB handoff |
| Created | 2026-11-27 |
| Target product | Beam Studio desktop, BeamGo HY-2328 V2.0.78 over USB |
| Owner area | Device discovery, Swiftray control, galvo export and Monitor |
| Related code | `packages/core/src/web/helpers/api/swiftray-client.ts`; `packages/core/src/web/helpers/device-master.ts`; `../swiftray/src/server/swiftray-server.cpp` |
| External repos | `flux3dp/swiftray` |
| Companion PRD | `../swiftray/docs/prd/beamgo-usb.md` |
| Source | `~/Downloads/BeamGo-USB-handoff/PRD-BEAMGO-BEAM-STUDIO.md`, revised 2026-11-27 |

## Summary

Add BeamGo as a 90 × 90 mm USB galvo machine. Reuse the existing Swiftray SVG/G-code pipeline and Beam Studio task controls. Keep Promark calibration, rotary, camera, laser-source and hardware-button behavior model-specific.

## Background & current state

Before this change, `helpers/api/swiftray-client.ts` (paths below are relative to `packages/core/src/web/`) routed device actions over `/devices/{port}` and took framing width from `fpm1`. `helpers/device-master.ts` selects `SwiftrayControl` when discovery reports `source: swiftray`. `app/actions/beambox/constant.ts` contains the Promark-only model set. On the backend, `../swiftray/src/server/swiftray-server.cpp` creates a BSL machine and dispatches actions through it; USB binary framing needs a separate transport, not `MotionController::attachSerialPort`'s newline parser.

The handoff's offline AES/frame, recorded-response split tests and three LMF round trips passed on 2026-11-26. The revised CLI emission guards and 5/15/30% preview records passed on the simulator on 2026-11-27. These are reference-implementation checks, not acceptance of the new C++ implementation.

## Goals & non-goals

Goals: USB discovery/setup, vector/fill/image task conversion, framing power, Monitor controls, machine-stored calibration and safety settings, material defaults and API-only project upload. Non-goals: Bluetooth, Wi-Fi, firmware updates, camera, rotary, Z motion and inner engraving on BeamGo.

## Scenarios and acceptance criteria


每條需求標示對應的草稿編號。驗收條件寫成可以直接檢查的敘述。

### R1 新增機器（草稿第 1 點）

- 在「新增機器」的機型選擇畫面加入 **BeamGo** 選項。
- 圖示採用交接包的 FLUX Go 向量參考，與既有機型圖示的粗細、比例、風格一致。
- 選擇 BeamGo 後直接進入 USB 連線說明頁，不經過連線方式選擇（與 Promark 相同）。
- 連線測試通過後直接完成設定回到主畫面。**不進入任何校正頁面**，也不做相機測試。

驗收條件：

1. 機型選擇畫面出現 BeamGo 圖示與名稱。
2. 從選擇 BeamGo 到完成設定，不出現雷射源選擇、鏡頭校正、紅光校正、相機校正等 Promark 專用頁面。
3. 完成後工作區自動切到 BeamGo（90 × 90 mm），裝置已被選取。
4. 設定過程中 Swiftray 沒有對機器送出任何校正寫入命令。

### R2 機器功能表（草稿第 2 點）

BeamGo 的機器子功能表包含：

| 項目 | 內容 |
|---|---|
| 儀表板 | 沿用既有的 `DASHBOARD`（開啟 Monitor） |
| 機器設定 | 新項目。顯示機型、名稱、序號、**韌體版本**；提供**安全門偵測**開關 |
| 校正參數設定 | 新項目。讀取、修改、寫回機器內的校正參數 |

不顯示 Promark 專用的 `PROMARK_SETTINGS`、`Z_AXIS_ADJUSTMENT`、相機校正、韌體更新、下載紀錄。

**機器設定**

- 韌體版本取自硬體資訊字串的第二欄，例如 `V2.0.78`。
- 安全門偵測開關讀寫機器內的安全檢查暫存器（參數 `17`）的 bit1。寫入後要讀回確認。只改 bit0（傾斜）與 bit1（安全門），其餘位元原樣保留。
- 機器不在閒置狀態時不允許變更。

**校正參數設定**

欄位與範圍沿用 FLUX Go 的「振鏡設定」頁：

| 欄位 | 範圍 | 精度 | 對應校正字 |
|---|---|---|---|
| 幅面大小 (mm) | 10–600 | 1 | 鏡頭參數 `03` |
| XY 交換、X 反向、Y 反向 | 開 / 關 | — | 鏡頭參數 `03` |
| 比例 X、Y | 0.1000–1.0000 | 0.0001 | 字 0、1 |
| 枕狀變形 X、Y | 0.5000–1.5000 | 0.0001 | 字 2、3 |
| 平行（正交）X、Y | 0.5000–1.5000 | 0.0001 | 字 4、5 |
| 梯狀變形 X、Y | 0.5000–1.5000 | 0.0001 | 字 6、7 |

- 紅光比例、紅光偏移、鏡頭偏移（字 8–13）這次不提供編輯，寫回時必須原樣保留。
- 進入頁面時從機器讀取目前的值。按下儲存才寫入，寫入後讀回比對，不一致要顯示錯誤並提供「還原為寫入前的值」。
- 儲存前在電腦端留一份寫入前的原始位元組，供還原使用。
- 切換「XY 交換」時，比例、枕狀、平行、梯狀四組的 X、Y 值要一起對調（原廠 App 與 FLUX Go 都這樣做）。

驗收條件：

1. 功能表只有上表三個項目。
2. 機器設定顯示的韌體版本與 `tools/hylaser_usb.py info` 讀到的一致。
3. 切換安全門偵測後重新開啟頁面，顯示的是機器實際的值。
4. 修改比例 X 後儲存、重新連線，再開啟頁面看到的是新值。
5. 寫入校正後，機器的校正暫存器長度不變，沒被編輯的位元組與寫入前完全相同（用 `info` 比對）。

### R3 USB 輪詢與裝置列表（草稿第 3 點）

- Swiftray 定期掃描序列埠，找到 `VID 0x303A` 的埠就嘗試探測。探測成功的裝置出現在 Beam Studio 的機器列表與「選擇裝置」視窗。
- 顯示名稱沿用 FLUX Go 的規則：把名稱裡的 `HY-LASER` 換成 `BeamGo`，不分大小寫，其餘保留。例如 `HY-LASER-4831B7850C90` 顯示為 `BeamGo-4831B7850C90`。名稱取自硬體資訊的第五欄；該欄是空的就顯示 `BeamGo`。
- 拔除 USB 後，裝置在列表更新週期內消失。

驗收條件：

1. 插上 BeamGo 後 10 秒內出現在列表，名稱以 `BeamGo` 開頭，不出現 `HY-LASER` 字樣。
2. 列表顯示 USB 圖示。
3. 拔除後 20 秒內從列表消失。
4. 同時接著 Promark 時兩台都出現在列表（本版同時顯示，但一次只操作一台）。

### R4 送出工作與 Monitor（草稿第 4 點）

操作流程與 Promark 相同：按下開始 → 算圖 → 開啟 Monitor → 可預覽外框 → 開始 → 可暫停、繼續、停止。

| Monitor 操作 | 行為 |
|---|---|
| 外框預覽 | 機器沿工作外框重複描繪，直到使用者停止。提供「外框」，有餘力再做「凸包」與「輪廓」 |
| 開始 | 上傳工作並啟動 |
| 暫停 | 機器停在目前位置，按鈕變成「繼續」 |
| 繼續 | 從暫停處接續 |
| 停止 | 中止工作，機器回到閒置 |
| 進度 | 顯示百分比，來源是機器回報的已處理筆數除以總筆數 |
| 完成 | 機器送出工作結束報告後顯示完成 |

- 外框預覽進行中按「開始」時，要先停止預覽、確認機器回到閒置，再上傳並啟動工作。
- **藍光機型的外框預覽是用雷射本身以低功率描繪，不是紅光指示器。** 要在介面上提示使用者配戴護目鏡，並提供功率設定。
- 預覽功率是 1–100 的整數百分比，預設 15（與 FLUX Go 相同）。Beam Studio 在每次啟動預覽時用 `startFraming` 的 `framingPower` 欄位把目前的設定值傳給 Swiftray（第 6.1 節）。從 Monitor 啟動與從外框預覽視窗啟動都要帶這個值。
- 預覽進行中調整功率時，先停止預覽、等機器回到閒置，再用新值重新啟動。

驗收條件：

1. 20 mm 方框、功率 15 %、速度 100 mm/s 的工作能完成，Monitor 顯示完成。
2. 加工中按暫停，機器在 1 秒內停止移動；按繼續後接續完成，成品沒有重複或缺漏的線段。
3. 加工中與暫停中按停止，機器都在 1 秒內回到閒置，之後能立刻開始新工作。
4. 外框預覽啟動後機器持續描繪，按停止後回到閒置。把預覽功率設成 5 % 與 30 % 各啟動一次，Swiftray 送出的預覽功率 record `12` 分別是 50 與 300。
5. 超過 3,000 筆 record 的工作（例如大面積填充）能完整執行，進度條隨實際進度前進。
6. 加工中拔除 USB，Beam Studio 顯示斷線，不會卡在「加工中」。

### R5 停用相機預覽與旋轉軸（草稿第 5 點）

- BeamGo 工作區不顯示相機預覽按鈕、相機校正功能表、Monitor 的相機分頁。
- 文件設定不顯示旋轉軸選項，Monitor 不顯示旋轉軸的外框選項。

驗收條件：選取 BeamGo 時，介面上找不到任何相機預覽或旋轉軸的入口。

### R6 預設參數（草稿第 6 點）

- 材質預設與圖層預設沿用 FLUX Go 的 BeamGo 預設，資料在 `data/beamgo-defaults.json`，閱讀版與對應到 Beam Studio 預設格式的說明在 `data/BEAMGO-DEFAULTS.md`。
- 內容：10 W 有 13 個材質、20 W 有 12 個，每個材質有「線條」與「填色＋圖片」兩組參數（功率、速度、次數、填充間距、圖片打點時間與 DPI）。
- 新圖層的預設是第一個材質（椴木合板）的填色參數：10 W 為功率 80 %、速度 300 mm/s、間距 0.1 mm。
- 參數範圍：功率 1–100 %、速度 1–2000 mm/s（整數）、次數 1–100、填充間距 0.05–1 mm。
- 頻率固定 10 kHz，不開放調整。脈寬與擺動不適用。
- 第一階段依交接包 `docs/IMAGE-AND-FILL-RECORDS.md` 的建議，把填色與圖片轉為 `02` 跳轉／`01` 線段出光。圖片使用圖層速度；保留來源的打點時間資料，但不提供無作用的打點時間控制。
- Beam Studio 的解析度選項是離散值：來源 DPI 對應最近的 127／254／508／1016 DPI，原始數字保留在 `app/constants/beamgo-presets.json::sourceDpi`。例如 318 DPI 對應 254 DPI，500 DPI 對應 508 DPI；這是目前整合的差異，不能宣稱圖片解析度與 FLUX Go 完全相同。
- 20 W 竹板的來源填充間距 0.8 mm 原樣保留，材質實機驗收時應特別確認。
- 10 W 與 20 W 的預設不同。FLUX Go 以硬體資訊第三欄是否含 `R1 Pro` 判定 20 W；目前的實機都回報 `HY-2328`，會被當成 10 W。本版提供機器設定中的 10／20 W 手動選項，依序號儲存，預設 10 W。

驗收條件：新建 BeamGo 圖層的功率、速度、次數、填充間距與 `beamgo-defaults.json` 的 `newProjectDefaults.firstLayer10W` 一致；材質下拉選單的項目與數值與 `materialPresets` 一致。

### R7 Swiftray 實作與共用介面（草稿第 7 點）

- BeamGo 的裝置偵測、連線、送檔在 Swiftray 實作。
- 算圖沿用 Promark 的流程（`loadSVG` → `convert`），不為 BeamGo 另寫幾何處理。
- Beam Studio 對 Swiftray 的 WebSocket 介面，裝置列表、連線、上傳、開始、暫停、繼續、停止、外框預覽、狀態查詢全部共用。
- BeamGo 另外多出校正讀寫、安全門開關、專案檔上傳三組 API（第 6.2 節）。

驗收條件：Beam Studio 端送出與控制工作的程式路徑，Promark 與 BeamGo 走同一組函式；差異只出現在第 6.2 節列出的新增動作。

### R8 安全門事件（草稿第 8 點）

- 機器回報安全門開啟時，Beam Studio 跳出警告，文字沿用 Promark 既有的 `HARDWARE_ERROR_DOOR_OPENED`。
- 機器傾斜時跳出對應的新警告。
- 加工中發生時，本版停止工作，且不自動恢復，不可在錯誤未排除時繼續出光。

驗收條件：

1. 閒置時開門，按開始會被擋下並顯示警告。
2. 加工中開門，10 秒內顯示警告，機器不再出光。
3. 關門後警告可以關閉，能重新開始或繼續工作。
4. 安全門偵測關閉時（R2），開門不觸發警告。


## Must not change

Update this contract before each implementation step touches another shared module.

- `helpers/api/swiftray-client.ts` — `helpers/api/swiftray-control.ts` and export helpers: existing callback envelopes, parser chunk/progress responses and Promark start/lens/framing semantics remain compatible; BeamGo framing values must not alter Promark output.
- `helpers/device-master.ts` — setup, Monitor and export callers: network machines continue through FLUXGhost; Promark keeps its own serial/lens/source handling; BeamGo never sends host Promark calibration.
- `app/actions/beambox/constant.ts` / `app/constants/workarea-constants.ts` — model selection, document settings, export and Monitor: existing machine membership, dimensions and capabilities remain unchanged. Audit individual `promarkModels` users before changing their predicate.
- `app/constants/addOn.ts` — document settings and layer controls: all existing add-on capabilities remain unchanged; BeamGo has none of the rotary, camera, Z or inner-engraving capabilities.
- `app/pages/InitializeMachine/{SelectMachineModel,ConnectUsb}.tsx`, `ConnectMachineIp/{hooks/useConnectionTest,utils/finishWithDevice}.ts` — setup router: Promark still tests its camera and continues to laser-source setup; network models retain IP discovery and camera tests.
- `app/actions/beambox/export-funcs.ts` / `export-funcs-swiftray.ts` — Go button, task cache and path preview: existing FCode/G-code selection and Promark lens metadata remain unchanged; BeamGo uses galvo G-code without Promark lens writes.
- `app/contexts/MonitorContext.tsx` — Monitor task controls: network-machine file browsing, preview and origin relocation remain unchanged; Promark keeps applying its task lens before each start.
- `app/components/Monitor/{Monitor,MonitorTask}.tsx` and `dialogs/FramingModal/{index,FramingModal.promark}.tsx` — Monitor and F1 framing entry points: Promark still uses zero-power red light; BeamGo uses a separate power preference and waits for stop before another start.
- `helpers/device/framing.ts` — Monitor, framing modal and Promark background tasks: Promark rotary/lens handling stays model-specific; other machines retain FLUXGhost framing.
- `interfaces/IControlSocket.d.ts` — Swiftray control and DeviceMaster framing callers: the optional power field is backward compatible.
- `app/icons/initialize/InitializeIcons.tsx` — machine setup: existing SVG icons remain unchanged; BeamGo uses the supplied FLUX Go vector reference.
- `interfaces/IStorage.d.ts` — storage implementations and stores: new BeamGo keys are optional and independent of Ador/Promark preferences.
- `app/actions/beambox/menuDeviceActions.tsx`, `app/components/beambox/TopBar/useMenuData.ts`, `apps/app/src/node/menu-manager.ts` — browser/Electron machine menus: other machines retain all existing actions; BeamGo exposes only dashboard, settings and calibration.
- `interfaces/ILang.ts` / `app/lang/*.ts` — i18n consumers: existing translation keys and warning messages remain unchanged.
- `helpers/layer/layer-config-helper.ts`, `app/constants/presets.ts`, `helpers/presets/preset-helper.ts`, `interfaces/ILayerConfig.d.ts` — new layers, preset management and export: existing machine defaults, persisted values and custom presets retain their behavior.
- `app/components/beambox/RightPanel/ConfigPanel/{ConfigPanel,FillIntervalBlock,SpeedBlock,PowerBlock}.tsx` — layer panel: existing machines retain parameter ranges; BeamGo exposes fill/image controls without Promark frequency, pulse-width or wobble controls.
- `app/components/beambox/LeftPanel/components/DrawingToolButtonGroup.tsx`, `helpers/device/camera/previewMode.ts`, `app/actions/beambox/preview-mode-controller.ts` — toolbar, shortcuts and direct camera callers: existing camera flows remain unchanged; BeamGo returns before setup.
- `interfaces/IDevice.d.ts` — discovery and DeviceMaster: optional Swiftray port is distinct from UUID; existing network-machine identity stays unchanged. `swiftray-client.forDevice` binds each control to its own port while sharing the WebSocket and pending response map.
- `app/components/dialogs/PresetsManagementPanel/PresetsManagementPanel.tsx` — preset dialog: existing Promark/laser/printing editors remain unchanged; BeamGo gets its own supported fields.
- `app/constants/resolutions.ts` — `getLayerDpmm`, SVG export and image resampling: existing models retain their resolution mapping; BeamGo's detailed option uses 40 px/mm (1016 DPI).
- Backend shared-file caller contract is in the companion PRD. Other frontend shared-file changes must extend this list with their verified callers before implementation.

## Design

Keep the handoff's shared WebSocket interface, machine-specific protocol interpretation and per-device connection identity. BeamGo consumes M100 successfully as a no-op inside its G-code interpreter; no record or USB command is generated. Promark's M100 IO behavior and the shared generator remain unchanged.

Retain `promarkModels` for Promark-specific features and introduce a separate galvo set for common transport/export/Monitor behavior. BeamGo's preview preference has its own key and defaults to 15%; do not reuse Ador's `low_power`. Use firmware error events plus polling and fail closed when current safety/state reads cannot be obtained before start/resume/framing.

## Data contracts


路徑與信封格式沿用既有的 `/devices/{port}`。

### 6.1 共用（Promark 與 BeamGo 相同）

| 動作 | 參數 → 回覆 | BeamGo 的差異 |
|---|---|---|
| `/devices` `list` | → `devices[]` | 多了 BeamGo 項目（第 5.3 節） |
| `connect` | → `success` | 開埠並完成初始讀取才回成功 |
| `upload` | `{data: gcode, checkDoor?}` | `checkDoor` 被忽略，BeamGo 的安全門偵測是機器內的設定 |
| `start` | `{taskTime}` | `taskTime` 只用來顯示預估時間 |
| `pause`、`resume`、`stop`、`quit` | — | — |
| `getStatus` | → `{st_id, prog, error, disconnection}` | `prog` 是真實進度 |
| `startFraming` | `{taskCode? \| points, width, framingPower?}` | 多一個 `framingPower`（見下方）；不支援 `rotaryInfo` |
| `stopFraming` | — | — |
| `checkButton` | → `{pressed, isRunning, isFraming}` | BeamGo 沒有已知的啟動按鈕，`pressed` 固定為 false |
| `/parser` `loadSVG`、`convert` | 既有 | `convert` 的 `isPromark` 改為兩種振鏡機型都成立的旗標，或依 `model` 判斷 |

**`startFraming` 的 `framingPower`**

既有的 `startFraming` 沒有功率參數：Promark 用紅光預覽，Swiftray 把功率固定成 0（`swiftray-server.cpp:484` 的 `setLaserPower(0.0)`）。BeamGo 用雷射本身預覽，所以要新增這個欄位。

| 項目 | 規格 |
|---|---|
| 型別與單位 | 整數，百分比，1–100 |
| 省略時 | Swiftray 使用預設值 15 |
| 對應的 record | 預覽參數 `12`，數值是百分比 × 10（15 % → 150） |
| 適用形式 | `points` 與 `taskCode` 都適用。BeamGo 的預覽整段只有一個功率，`taskCode` 內的 `S` 值不採用 |
| 不合法的值 | 不是 1–100 的整數時回 `{success:false, error:"INVALID_PARAMS"}`，不啟動預覽。不要修正成範圍內的值後出光 |
| 預覽中變更 | 不支援。先 `stopFraming`，等狀態回到閒置，再用新值 `startFraming` |
| Promark | 忽略這個欄位，行為不變 |

- 上限 100 是 FLUX Go 的範圍。產品若決定較低的上限（見 Open decisions），Beam Studio 的輸入元件與 Swiftray 的檢查要用同一個數字。
- `helpers/api/swiftray-client.ts::startFraming` 現在依裝置路由取幅面；BeamGo 傳 90，Promark 維持原值。

### 6.2 BeamGo 新增

| 動作 | 參數 | 回覆 |
|---|---|---|
| `getDeviceInfo` | — | `{success, model, name, serial, version, fieldMm, featureWord, uuid, port, hashed_serial}` |
| `getCalibration` | — | `{fieldMm, swapXY, reverseX, reverseY, scaleX, scaleY, bucketX, bucketY, paralleX, paralleY, trapeX, trapeY, rawHex, length}` |
| `setCalibration` | 上列欄位，可只給要改的 | `{success, readback:{…}, backupHex, backupLens:{…}}` |
| `restoreCalibration` | `{rawHex, lens:{fieldMm, swapXY, reverseX, reverseY}}` | `{success}` |
| `getSafetySettings` | — | `{doorCheck: bool, tiltCheck: bool, mask}` |
| `setSafetySettings` | `{doorCheck?, tiltCheck?}` | `{success, doorCheck, tiltCheck, mask}` |
| `uploadProjectFile` | `{dataBase64, name?}` | 進度以既有的 `progress` 訊息回報，最後 `{success}` |

- 校正欄位名稱比照 Promark 既有的 `setCorrection`（`bucket` = 枕狀、`paralle` = 平行、`trape` = 梯狀），方便 Beam Studio 共用表單元件。
- `setCalibration` 在 Swiftray 內完成整個交易：讀取 → 修改 → 寫入 → 讀回比對。**寫回的長度必須等於讀到的長度**（V2.0.78 是 28 bytes，舊韌體是 24 bytes），沒被編輯的位元組原樣保留。原因在協議文件 7.1。
- `setCalibration`、`restoreCalibration`、`setSafetySettings` 只在機器閒置且沒有錯誤旗標時執行。
- **Promark 的 `setCorrection` 與 `setScanaheadParams` 不可套用到 BeamGo。** `helpers/device-master.ts` 的連線校正僅保留給 Promark；BeamGo 不呼叫這兩個寫入 API。Swiftray 對 BeamGo 收到這兩個動作時回 `{success:false, error:"UNSUPPORTED"}`。

### 6.3 事件

Swiftray 目前沒有主動推送，按鈕與錯誤都靠輪詢。這次維持輪詢即可滿足需求：安全門與傾斜放在 `getStatus` 的 `error`，由 Monitor 每 1.5 秒的輪詢取得。

R8 的閒置防護由啟動前的新鮮狀態讀取與拒絕回覆處理；加工中由控制器持續輪詢／接收事件後停止，Monitor 顯示錯誤。本版不新增 Monitor 關閉時的全域推送警告。


## Performance and packaging

USB is 921600 8N1, DTR/RTS false. One pending command per device; upload in blocks of at most 1000 five-byte records. Start after 3000 records, bound unprocessed uploaded records to 10000, and let stop/pause requests take priority between complete frames. Preserve UI responsiveness and actual progress while uploading. Bundle the new Swiftray binary with desktop releases; web/Linux availability follows the existing Swiftray support boundary.

## Rollout (PR plan)

1. Protocol/record compiler and fixture tests in Swiftray; establish shared frontend types/defaults.
2. Serial transport, scanner and per-device action routing with simulator coverage.
3. Beam Studio model/setup/Monitor/framing/settings/presets and localization.
4. Build, regression checks and hardware acceptance; release only after the hardware cases below pass.

## Open decisions

1. ~~M100 handling~~ — 2026-11-27: user approved accepting it as a successful no-op in the BeamGo controller.
2. ~~Framing API~~ — 2026-11-27 handoff: `framingPower` integer 1–100, default 15, invalid values rejected; Promark ignores it.
3. Implementation assumption: model `fbg1`, one operated device at a time, both devices visible in discovery; hardware IDs/types do not select laser behavior.
4. Door/tilt during work: provisionally stop, never automatically resume; confirm firmware behavior in hardware acceptance. Unknown safety state blocks emission.
5. Field mismatch: block jobs/framing until calibration reports 90 mm; no automatic lens/calibration writes.
6. Wattage: explicit 10/20 W choice stored per device, default 10 W; mirror compensation default off.
7. Preview upper limit 100% follows the revised handoff provisionally; product may lower it consistently in frontend/backend.
8. Filling/image geometry, dimensions/direction, disconnect behavior and safety-switch effects remain hardware acceptance items.
9. Initial image encoding follows the handoff's line-scan recommendation; dot/bitset modes are deferred. Source DPI is retained and mapped to the closest existing Beam Studio resolution option.

## Risks & follow-ups

Pause is host-maintained because firmware reports state 1 for both running and paused. Completion must use the 49 45 result, not infer success merely from idle. Calibration transactions must preserve the full device-read byte array (28 bytes on tested firmware), unknown trailing bytes and unedited fields. Never retry upload/start commands after an ambiguous timeout. Never infer that unsupported optional reads and lost mandatory responses are interchangeable.

## Test plan

- Protocol fixtures: exact TX frames, AES/CRC known answers, all split positions of 22 RX samples, noise/corruption recovery, padding, job terminators and power units.
- Interpreter: accepted M100 emits nothing; M101/A/Z/wobble fail; absolute/relative/modal G-code, out-of-bounds/invalid input, vector and raster paths.
- Simulator: discovery identity, one pending command, streaming/stop priority, pause/resume, error polling, disconnect and timeout, optional-read capability handling; calibration/safety write-readback and restoration.
- Frontend: framing power from both entry points, BeamGo 90 mm width, invalid parameter propagation, no Promark calibration writes, hidden camera/rotary/inner engraving, defaults and device menu.
- Run Jest in band and repository lint after implementation. Compile backend and run targeted tests. Hardware-only acceptance is R1–R8 above; do not label those passed based on simulator tests.


## Implementation verification (2026-11-27)

- Branch: `codex/beamgo-usb`, from `origin/main` at `28457552edb4e96d69ab4489c4597ecaf0bc6fb9`.
- Targeted Jest: 12 suites, 138 tests, 14 snapshots passed (in band), including both framing UI entry points, port/width isolation, rejection propagation, stale-device status, defaults, existing Monitor/preset/layer/device-master behavior.
- `pnpm run lint`: all three projects passed, 0 errors (29 warnings); the final DeviceMaster change was also linted separately.
- Web development bundle and Electron node bundle compiled. The node bundle has four dependency warnings.
- Strict core TypeScript is not a clean baseline: default branch produced 1130 errors, this change produced 1127; normalized error comparison found no newly introduced errors. This is not a claim that repository type checking passes.
- FLUXGhost hardware-free WebSocket smoke test: 17 passed, `ALL PASS`; no FLUXGhost source changes were made for this feature.
- Swiftray BeamGo library/controller/manager and shared generator compiled with isolated Qt 6.7.2. Protocol/compiler fixtures and controller simulation passed. Full daemon and physical-device acceptance remain pending.
- Test-computer instructions: paired Swiftray `tests/beamgo/README.md`. Images initially use line scanning; source DPI mapping is described under R6. No real laser was operated during this implementation.
