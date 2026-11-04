# PRD：開關門蓋自動全範圍預覽

> 本文為 `auto-full-area-preview.md` 的繁體中文翻譯；英文版為正本，有出入時以英文版為準。

| | |
|---|---|
| **狀態** | 草稿（2026-10-19；開蓋有效性判斷於 2026-10-30 修訂）。設計已定案，尚未開始實作。硬體驗收待辦：目前沒有可測試的機器。 |
| **作者** | 產品與軟體團隊 |
| **建立日期** | 2026-10-19 |
| **目標產品** | Beam Studio 桌面版（Electron）與網頁版。機型：`fbm2`（beamo II）、`fbb2`（Beambox II）、`fhx2rf`（HEXA RF）。 |
| **負責領域** | 相機預覽、機器通訊 |
| **相關程式碼** | 監聽器（新增）：`packages/core/src/web/helpers/device/camera/autoFullAreaPreview.ts`；Manager：`app/actions/camera/preview-helper/Beamo2PreviewManager.ts`、`Bb2Hx2PreviewManager.ts`、`BasePreviewManager.tsx`、`DoorChecker.ts`、`handlePreviewSetupError.tsx`、`FisheyePreviewManagerV4.ts`；背景任務管理器（配套）：`helpers/device/background/`；門蓋／狀態：`helpers/device-master.ts`、`helpers/api/control.ts`；背景繪製：`app/actions/beambox/preview-mode-background-drawer.ts`；偏好設定：`interfaces/Preference.d.ts`、`app/actions/beambox/beambox-preference.ts`、`app/stores/globalPreferenceStore.ts`、`app/components/settings/categories/Camera.tsx`；先例：`helpers/device/promark/promark-button-handler.ts` |
| **配套 PRD** | `docs/prd/background-tasks.md`：本功能註冊的管理器（情境、選機器、前景讓路、`canTouchMachine`）。先上線。 |
| **外部 repo** | 皆不修改。韌體事實取自 `../BeamOS_NX_backend`，影格處理事實取自 `../fluxghost`（皆僅閱讀）。 |

---

## 1. 摘要

目前全範圍相機預覽是手動操作：使用者點相機按鈕，Beam Studio 連線、移動雷射頭（fbm2）或切換到門蓋相機（fbb2/fhx2rf）、拍照，再把照片畫成畫布背景。本 PRD 讓這件事**在使用者關上門蓋時自動發生**，使用者回到電腦前時畫布已經顯示材料。

三個設計決定主導了其餘一切：

1. **門蓋是觸發源，而且只能輪詢。** 韌體沒有門蓋狀態的推播；Beam Studio 在已選機器既有的 control socket 上輪詢 `play get_door_open`。fbm2 在門蓋關上**之後**拍（相機在雷射頭上，需要關門）；fbb2/fhx2rf 在門蓋打開**期間**拍（廣角相機在門蓋上，需要開門），關門時畫出最佳的一張。
2. **一次拍攝 = 重用既有 preview manager 的一次性執行**，在預覽模式之外跑。沒有浮動工具列、不改滑鼠模式、不碰 `PreviewModeController`。Manager 新增兩個選項：`silent`（永不跳 alert）、`messagePrefix`（讓原本的「擷取影像中…」序列顯示成「自動預覽：擷取影像中…」）。
3. **關一半的門蓋照片不應變成背景。** fbb2 與 fhx2rf 用同一套時間規則：關門時畫出關門事件前至少 1.5 秒就完成的最新一張，沒有就用最新一張。fhx2rf 蜂巢板上的 ArUco 標記曾評估作為有效性訊號，v1 不採用（§2.6、§10 決策 1）。

本功能預設開啟，可在「設定 → 相機」關閉。它是 `docs/prd/background-tasks.md` 所定義的背景任務：只在機器閒置、且此 Beam Studio 實例沒有其他動作在用機器時執行；如果使用者在拍攝中途開始匯出、框選或校正，管理器在 `checkDeviceStatus` 裡的前景讓路會顯示這個任務的提示：「機器正在自動拍攝工作區域，是否中止拍攝並繼續？」。

---

## 2. 背景與現況

### 2.1 門蓋狀態

- 一般模式：`control.ts:930` `getDoorOpen` 送 `play get_door_open`，回 `{ value: '0' | '1' }`。Raw 模式：`control.ts:1732` `rawGetDoorOpen` 送 `M136P179`，解析 `Interlock`。對外為 `deviceMaster.getDoorOpen()`（`device-master.ts:1458`）與 `rawGetDoorOpen()`（`:1315`）。
- 既有輪詢者：`DoorChecker.ts`（1 秒 `setInterval`，fbm2 預覽用它在拍攝中開門時中止，`showError` 時跳 `door_opened` alert）、`framing.ts:684-713`（逐步檢查）。閒置時沒有任何東西持續監聽。
- 狀態回報沒有門蓋欄位（`IDevice.d.ts:44` 只有 `st_id`、`st_label`）。

### 2.2 各機型的全範圍拍攝

| | fbm2 | fbb2 / fhx2rf |
|---|---|---|
| Manager | `Beamo2PreviewManager` | `Bb2Hx2PreviewManager` |
| 相機 | 雷射頭上的單一相機 | 門蓋上的廣角相機（`setCamera(1)`） |
| 門蓋 | 必須**關閉**（`DoorChecker.doorClosedWrapper`，`Beamo2PreviewManager.ts:82`） | 必須**打開**（`Bb2Hx2PreviewManager.ts:105-121`、`getWideAngleCameraData.ts:58`） |
| 設定 | `connectCamera` → `setupFisheyePreview({ cameraPosition: cameraCenter, shouldKeepInRawMode: true })`（`FisheyePreviewManagerV4.ts:40-82`）：進 raw 模式、歸零、`rawMove` 到 `workarea.cameraCenter` | `connectCamera` → `getWideAngleCameraData`（V4 參數，韌體 ≥ `BB2_WIDE_ANGLE_CAMERA` 6.0.12）→ `setCamera(1)` → `setupFisheyePreview()`（`:130-165`）：沒有 `cameraPosition`，但仍在 raw 模式下 `rawAndHome` 與 `getFocalDistance`，再 `endSubTask` |
| 拍攝 | `previewFullWorkarea`（`:198-281`）：關自動曝光，拍亮（`exposure + 500`）與暗兩張，亮的畫背景、暗的當遮罩 | `previewWithWideAngleCamera`（`:318-333`）：一次 `getPhotoFromMachine`、`drawFullWorkarea` |
| 結束 | `endCameraPreview`（`:119-147`）：`rawMove` 到 `cameraRestPosition`、`rawLooseMotor`、`endSubTask`、斷相機、還原曝光、`kick` | 沒有 raw task 要結束；斷相機 |
| 歸零 | 有，在 `setupFisheyePreview` 裡 | **有**，同樣在 `setupFisheyePreview`（`rawAndHome`）裡，所以自動迴圈不重用它（§7.3） |

相機 socket 送來的影格已經去過畸變並攤平：fluxghost `camera.py:107-120` 在 `set_fisheye_matrix` 送出後（`FisheyePreviewManagerV4.ts:88`）對 `fbb2`/`fbm2`/`fhx2rf` 的每張影格跑 `handle_fisheye_image`（`fisheye_camera_mixin.py:311`）。V4 會經 `apply_points` 以 5 px/mm（`fluxghost/utils/camera/constants.py:4`）重映射到透視格線上；搭配 `hx2FullAreaPerspectiveGrid`（x 0–740、y 0–410 mm，`fisheyeCameraConstants.ts:102`），Beam Studio 收到的照片是 3700×2050，剛好涵蓋整個工作區。

訊息：`BasePreviewManager.tsx:59-71` 的 `showMessage`/`closeMessage` 是以 `progressId` 為 key 的 Ant Design `message` toast，等級 `LOADING`，所以後一步會取代前一步。Alert 來自 `handlePreviewSetupError.tsx` 與 `DoorChecker.checkDoorClosed(showError)`。

### 2.3 機器忙碌／多 client

- 狀態：`deviceMaster.getReport()`（`device-master.ts:1512`）→ `st_id`，常數在 `device-constants.ts:7-30`；`IDLE = 0`、`TASK_RAW = -10`、`TASK_MAINTAIN = -1`。
- 同實例守門：`check-device-status.ts:17-33`，手動預覽進行中時跳 `device_is_used`（是：結束預覽並繼續；否：取消）。21 個呼叫者：匯出（`handleExportClick.ts`）、所有機器選單動作（`menuDeviceActions.tsx`）、框選、校正對話框、曲面量測、Print and Cut、路徑預覽。`getDevice()`（`get-device.ts:33-35`）另外會在 control socket 處於某個模式時呼叫 `endSubTask()`，所以沒有守門的話，拍攝中途匯出會悄悄把 fbm2 manager 腳下的 raw 模式踢掉。
- 韌體（`BeamOS_NX_backend`，三機型共用，`fluxmonitor/security/identify.py:36-41`）：
  - 相機服務（TCP 23812）接受任意數量 client（`interfaces/listener.py:30,47-56`、`interfaces/camera.py:27-32`）；每個 client 自己拉影格；相機索引與曝光是全機共享狀態（`interfaces/camera.py:62-92`）。
  - 控制服務（TCP 23811）接受任意數量連線；互斥是以 *task* 為單位（`services/robot.py:290-296` 丟 `RESOURCE_BUSY`）；`kick`（`controller/tasks/command_task.py:1638-1643` → `services/robot.py:304-317`）對持有者送 `error KICKED` 並關閉其 socket（`controller/tasks/base.py:147-151`）。
- Control socket 關閉處理：`device-master.ts:186-194` 預設 listener 關閉連線；`:196-230` 關閉即重連（手動預覽期間使用，`preview-mode-controller.ts:163`）。

### 2.4 背景監聽器的先例

`promark-button-handler.ts` 是目前唯一的背景機器輪詢。本功能不複製它的條件寫法，而是和 Promark 一起成為背景任務管理器（`docs/prd/background-tasks.md`）的任務；管理器負責所選機器／畫布模式／工作區／分頁焦點的訂閱、選機器、`checkDeviceStatus` 裡的前景讓路，以及 `canTouchMachine`（沒有 modal、沒有手動預覽、沒有子任務、是目前機器、`st_id === IDLE`）。

### 2.5 Modal 狀態

所有透過 `addDialogComponent` 註冊的 id 都是真正的 modal（設定、陣列、偏移、鑰匙圈、旋轉軸、USB 選擇器……），沒有被動常駐的東西，所以「有任何對話框、alert 或 progress 開著」是安全的守門條件。查詢本身 `hasAnyModal()` 屬於背景任務管理器（`background-tasks.md` §7.4）。

### 2.6 標記（已評估，不採用）

fhx2rf 與 fbm2 的蜂巢板四角有四個 ArUco 標記；fbb2 的沒有，而且 fbb2 已出貨。2026-10-27 至 2026-10-30 評估過以它們作為 fhx2rf 開蓋照片的有效性訊號，v1 不採用。事實留給日後重啟的人（§11 F2）：

- 字典 `DICT_5X5_1000`，id 左上 996／右上 997／左下 998／右下 999，黑底白字（需開 `detectInvertedMarker`），在原始 3264×2448 影格中寬約 50 px。預設偵測器最多找到 4 個中的 2 個；背景減除（σ = 25 高斯、min-max 正規化）加上 `adaptiveThreshConstant = 3`、`errorCorrectionRate = 1.0`、`perspectiveRemovePixelPerCell = 8`，在最好的樣本上能找到全部 4 個（每張約 115 ms）。
- **四個都在攤平影格之外。** 在 3700×2050 的輸出（§2.2）中，上面兩個完全被裁掉，下面兩個只剩一小截。要用它們就得放大格線、繪製前再裁切，手動預覽路徑會因此進入影響範圍。
- **光線決定哪些標記讀得到。** 光源在右側時，即使是使用者自己選的曝光值，右側標記也會爆白；一張使用者曝光下的樣本只讀到 998。使用者調曝光是調到*自己*看得清材料，不保證標記的對比。
- **雷射頭在原點時擋住上面兩個。** 工作結束後雷射頭會回原點，除非是從當前位置開始。
- **平台會升降。** 平台降低（物件較高）時標記在影像中往內移，升高時往外移，所以預期位置需要平台高度，而開蓋迴圈拿不到。

---

## 3. 目標與非目標

**目標**

- G1. 使用者關上閒置、已選取的 fbm2/fbb2/fhx2rf 門蓋後，畫布背景不用點任何東西就更新為新的全範圍照片。
- G2. 照片在時間規則能判斷的範圍內不是門蓋移動中拍的（fbb2/fhx2rf：時間規則，盡力而為，R2；fbm2：關門後拍）。
- G3. 本功能永不干擾使用者操作：任何需要機器的動作，不是看到監聽器閒置，就是得到「是否中止拍攝」的是／否提示。
- G4. 偏好設定關閉、選到其他機型、或啟用工作原點時，行為零變化。

**非目標**

- 舊版 Beam 系列、Ador、Promark（沒有廣角／全範圍的門蓋流程）。
- 區域或精準區域的自動拍攝。
- 多台電腦輪流拍（§11 F1）。
- 任何韌體修改。手動預覽流程除了兩個 manager 選項外不做任何改動。

---

## 4. 情境

- **S1 fbm2 放材料。** 門蓋開啟 ≥ 2 秒後關上。1 秒後出現「自動預覽：連接中…」「…進入機器控制模式…」「…歸零中…」「…移動至預覽位置…」「…擷取影像中…」，雷射頭停回休息位，「自動預覽：預覽成功」顯示 3 秒，畫布背景是新照片。
- **S2 fbb2／fhx2rf 放材料。** 門蓋打開；開著期間監聽器一張接一張持續拍照（§7.3），但不顯示任何東西。關門後迴圈停止，約一秒內出現「自動預覽：預覽成功」，背景是關門前 ≥ 1.5 秒完成的最新一張。
- **S3 慢慢關蓋（fbb2／fhx2rf）。** 門蓋花超過 1.5 秒才關上：選到的照片可能是門蓋半關的畫面。接受（R2）；手動預覽可取代。
- **S4 快速探頭。** fbm2 門蓋開 1 秒就關：什麼都不發生。fhx2rf/fbb2：迴圈短暫跑過；若已拍完一張，關門時畫出最新一張（退路）；若一張都沒有，什麼都不畫。
- **S5 等待 1 秒期間重新開門（fbm2）。** 待拍取消；下一次 ≥ 2 秒的開門重新進入待拍。
- **S6 拍攝中途開門（fbm2）。** `DoorChecker` 讓拍攝失敗；部分結果丟棄；雷射頭停回；監聽器等待下一個週期。不跳 alert。
- **S7 拍攝中匯出。** S1 進行中使用者點「開始」。Alert：「機器正在自動拍攝工作區域，是否中止拍攝並繼續？」是：拍攝在下一個安全點停止，雷射頭停回，匯出繼續。否：匯出取消，拍攝繼續。
- **S8 機器在別處忙碌。** 另一台電腦正在跑工作或持有 raw 模式：這台電腦的門蓋週期什麼都不做（狀態非 IDLE／`RESOURCE_BUSY`）。什麼都不顯示。
- **S9 拍攝中被踢。** 另一台電腦踢掉這台：control socket 關閉，部分照片丟棄，不嘗試 `end()`，沒有 socket 時 tick 跳過，機器空出來後背景任務管理器約 5 秒內 silent 重新連線，輪詢恢復。全程不跳 progress 或連線 alert。
- **S10 沒有廣角校正（fbb2／fhx2rf）。** 開蓋迴圈不啟動；開關門無動作，不顯示任何東西。手動預覽與今天相同。
- **S11 偏好設定關閉／工作原點啟用／文件工作區 ≠ 機器／焦點在其他分頁／畫布不在 Draw 模式。** 不輪詢、不拍攝。
- **S12 自動照片之後手動預覽。** 手動工作階段和今天一樣啟動；`keep-preview-result` 關閉時自動照片會被 `start()` 清掉，和任何先前結果一樣。

---

## 5. 驗收標準

每條都寫明操作方式與證明結果。「toast」指畫布上方置中的 Ant Design 訊息。

| # | 操作 | 預期 | 邊界情況 |
|---|---|---|---|
| A1 | 選 fbm2、文件為 fbm2、偏好開啟、畫布閒置。開門、等 3 秒、關門。 | 約 1 秒後帶前綴的 toast 序列跑完；雷射頭移到相機中心再回來；背景更新；成功 toast 3 秒。 | 開 < 2 秒：無動作。關門後 1 秒內重開：直到下一次 ≥ 2 秒開門前無動作。 |
| A2 | fbb2 或 fhx2rf，開蓋 5 秒放材料，以正常速度關蓋（< 1 秒）。 | 開著時沒有 toast。關門後約 2 秒內：成功 toast，背景 = 完全開蓋的畫面（關門前 ≥ 1.5 秒完成）。 | 只開 1 秒就關：用最新一張（退路）。慢慢關蓋（約 3 秒）：可能得到半關畫面，接受（R2）。 |
| A3 | fbb2 或 fhx2rf 沒有廣角校正。開關門。 | 無動作，不跳 alert。 | — |
| A4 | A1 拍攝中點「開始」。 | 出現自動預覽文字的 alert，是／否。是 → 雷射頭停回，此次拍攝不改背景，匯出繼續。否 → 匯出取消，拍攝正常完成。 | 從框選、校正相機（選單）、監控視窗觸發亦同。 |
| A5 | A1 進行中開門。 | 拍攝靜默中止，雷射頭停回，不跳 alert，背景不變。 | — |
| A6 | 第二台電腦在同一台機器跑工作。在第一台開關門。 | 無動作；只有 console log。 | 第二台在 raw 模式（校正）：同。 |
| A7 | A1 進行中從另一台電腦踢掉這台。 | 不跳 alert；對方釋放機器後約 5 秒內，門蓋週期恢復運作。 | — |
| A8 | 設定 → 相機 → 「自動全範圍拍照」關閉。開關門。 | 無動作。重新開啟：下一週期不用重啟 app 就能運作。 | 全新安裝預設為開啟。 |
| A9 | 文件設定 → 啟用工作原點。開關門。 | 無動作（所有機型）。停用：下一週期可運作。 | — |
| A10 | 文件工作區設為與所選機器不同的機型。 | 無動作。 | — |
| A11 | Electron：開第二個分頁、聚焦、開關門。 | 第一個分頁無動作；第二個分頁（選同一台機器）拍攝。網頁版：切到其他瀏覽器分頁 → 無動作；切回 → 下一週期可運作。 | — |
| A12 | 開任何對話框（偏好設定、陣列、監控）後開關門。 | 直到對話框關閉前無動作。 | Alert 或 progress 彈窗開著：同。 |
| A13 | fhx2rf 拆掉蜂巢板（旋轉軸）。 | 同 A2：蜂巢板不影響挑選。 | — |
| A14 | 自動照片之後按手動預覽，`keep-preview-result` 關閉。 | 手動工作階段啟動；畫布如今天一樣清空。 | `keep-preview-result` 開啟：照片保留。 |

---

## 6. 不得改變

設計會碰到的共用檔案，列出每個呼叫者與必須維持的行為。

- `app/actions/camera/preview-helper/BasePreviewManager.tsx`（`showMessage`，新增 `silent`／`messagePrefix` 選項，預設關閉）
  - `PreviewModeController.start`（手動預覽，所有 manager）：訊息不變、alert 不變。
  - `Bb2Hx2PreviewManager`、`Beamo2PreviewManager`、`BeamPreviewManager`、`AdorPreviewManager`、`PromarkPreviewManager`：預設值不變。
- `app/actions/camera/preview-helper/Beamo2PreviewManager.ts`（`DoorChecker` 呼叫與 `handleSetupError` 尊重 `silent`；新增 `cancel()`，只在 `previewFullWorkarea` 檢查）
  - `PreviewModeController` 手動 fbm2 預覽：`door_opened` alert 與設定錯誤 alert 仍會跳。
  - `BeamPreviewManager` 重用 `handlePreviewSetupError`（錯誤回報 PR）：不動。
- `app/actions/camera/preview-helper/Bb2Hx2PreviewManager.ts`（`handleSetupError` 尊重 `silent`；自動迴圈不使用這個 manager）
  - 手動 fbb2/fhx2rf 預覽：照舊繪製；手動切到 FULL_AREA 時門蓋關閉的 alert 仍會跳。
- `app/actions/camera/preview-helper/DoorChecker.ts`（`doorClosedWrapper(callback, showError = true)`：寫死的 `true` 改為參數）
  - `Beamo2PreviewManager` 手動流程：`door_opened` alert 照常跳出。
  - `SolvePnP.tsx`、`Beamo2Calibration.tsx`、`ModuleCalibration/Align.tsx`（兩處）：預設 `true`，alert 照常跳出。
- `helpers/api/control.ts`（`getDoorOpen` 在排隊的任務執行時若已是 raw mode 就立即 throw，不再收到 `error:2` 後等 30 秒 timeout）
  - `DoorChecker.checkDoorClosed`、`framing.ts`（兩處）、`getWideAngleCameraData`、`Bb2Hx2PreviewManager`：normal mode 下送出的 `play get_door_open` 與回應不變。
- `helpers/device-master.ts`（`fetchFisheyeParams`、`fetchCameraCalibrateImage`、`fetchFisheye3DRotation`、`fetchAutoLevelingData` 改為和其他指令一樣經過 `control.addTask`；原本它們和排隊中的指令並行，先到的任一回應會透過 `removeCommandListeners` 同時拆掉兩邊的 listener，fetch 就永遠不會結束。fbm2 setup 的 `fetchFisheyeParams` 旁邊剛好有一次門蓋輪詢，就是這樣卡住的）
  - `Beamo2PreviewManager`、`Bb2Hx2PreviewManager`、`AdorPreviewManager`、`ModuleCalibration.tsx`（`fetchFisheyeParams`）；`getLevelingData.ts`、`getPerspectiveForAlign.ts`（`fetchAutoLevelingData`、`fetchFisheye3DRotation`）；`loadCamera3dRotation.ts`：指令與回應不變，只是改為在佇列中依序執行。
- `app/actions/beambox/preview-mode-background-drawer.ts`（沒有 `start()`…`end()` 預覽工作階段時，`drawFullWorkarea` 直接繪製；原本影像送進沒人訂閱的 subject，只有 fbm2 的暗部遮罩會更新）
  - 手動預覽中的 `Beamo2PreviewManager`、`Bb2Hx2PreviewManager`、`AdorPreviewManager`、`PromarkPreviewManager`：工作階段開著，照舊排隊繪製。
- `interfaces/Preference.d.ts`、`beambox-preference.ts`、`globalPreferenceStore.ts`、`settings/categories/Camera.tsx`（一個 key、一個開關）
  - 其他所有偏好 key：不變。
- `app/lang/*.ts`、`interfaces/ILang.ts`（`settings` 與 `message.auto_preview` 下新增 key）
  - 既有 key：不變。
- `checkDeviceStatus`、`DialogContext`／`AlertProgressContext`、`GoButton`、`promark-button-handler`：由配套 PRD 修改，列在 `background-tasks.md` §6。本功能只新增一個任務。

---

## 7. 設計

### 7.1 任務（`helpers/device/camera/autoFullAreaPreview.ts`）

背景任務（`background-tasks.md` §7.2），啟動時註冊：

- `id = 'auto-full-area-preview'`（優先級 10，最低：它是便利功能，永遠可以讓路）、`models = {fbm2, fbb2, fhx2rf}`。
- `isEnabled(ctx)`：偏好 `auto-full-area-preview` 開啟；`ctx.workarea === ctx.device.model`；`ctx.mode === Draw`；`enable-job-origin` 關閉。自己的訂閱（`globalPreferenceStore`、`useDocumentStore` 的 `enable-job-origin`）呼叫 `backgroundTasks.refresh()`。所選機器、畫布模式、工作區與分頁焦點由管理器提供。
- `start(device)`／`stop()`：開始／結束門蓋輪詢；拍攝中 `stop()` 會中止。
- `isBusy()` = 拍攝中或迴圈中（§7.3）；`abort()` 見 §7.5；`busyMessage()` = `message.auto_preview.abort_to_continue`。

**輪詢**：`setInterval(DOOR_POLL_MS = 500)`，前一次呼叫未回來、`!backgroundTasks.isCurrent(this)`、或 `deviceMaster.currentControlMode !== ''` 時跳過該 tick：子任務回應門蓋查詢的方式不同，而 `null`（重新整理、斷線或被踢後沒有 socket）會讓 `getDoorOpen` 經 `getControl()` 重新連線，每次失敗的 tick 都跳「連線中」progress 與 #892。選機器與 silent 重新連線由管理器負責（`background-tasks.zh-tw.md` §7.3）。

**拍攝守門**（拍攝前）：`await canTouchMachine(this)`（`background-tasks.md` §7.4），且滑鼠模式 ∉ `{preview, pre_preview}`。任一不成立就跳過該週期並 `console.log`。

**狀態機**

```
idle ─(條件成立)─▶ polling
polling: 門蓋 關→開 於 t0
  fbm2: 等關門；若 關門時間 − t0 ≥ OPEN_MIN_MS (2000) → armed(t_close)
        armed: 若在 t_close + CLOSE_DELAY_MS (1000) 之前再開門 → polling
               否則 → 守門 → capturing(fbm2) → polling
  bb2/hx: → looping（開蓋拍照迴圈，§7.3）；關門 → 挑選 → 繪製 → polling
capturing/looping: §7.5 的 abort() 或 socket 關閉 → 丟棄 → polling
```

**fbm2 拍攝**：`new Beamo2PreviewManager(device)`，`manager.setup({ silent: true, messagePrefix })` → `manager.previewFullWorkarea()` → `manager.end()`。Manager 自己繪製背景（和手動流程一樣）。`end()` 永遠執行，失敗時也是。`setup()` 回傳 `false` 有兩種意思：發生錯誤（manager 已自行 end）或最後一次 `DoorChecker` 檢查時門是開的，這時它直接回傳、不 end，機器停在 raw 模式。任務用 `deviceMaster.currentControlMode === 'raw'` 區分，第二種情況才呼叫 `end()`；否則輪詢會永遠暫停。整個 fbm2 拍攝期間（`this.capture`）門蓋輪詢暫停：這段時間由 manager 的 `DoorChecker` 負責門蓋，而且 setup 進 raw 模式前會送 normal mode 指令，輪詢只會排在後面佔佇列。

拍攝中 **control socket 關閉**（被踢或斷線）：任務維持預設關閉 listener（`device-master.ts:186-194`），不用關閉即重連；關閉時丟棄部分照片、跳過 `end()`、回到輪詢；管理器的 silent 重新連線會恢復 socket，因為被踢不會改變目前機器。

### 7.2 Manager 選項

`BasePreviewManager` 新增 `protected silent = false` 與 `protected messagePrefix = ''`，透過 `setup({ silent, messagePrefix })` 設定。`showMessage` 在 `content` 為字串時前置 `messagePrefix`。`Beamo2PreviewManager.handleSetupError` 與其 `DoorChecker` 呼叫傳 `showError = !this.silent`；`Bb2Hx2PreviewManager.handleSetupError` 亦同。`silent` 時跳過 `handlePreviewSetupError` 的 alert（改為 log），`getPhotoFromMachine` 的相機排線警告也一併跳過（繼續拍攝）。`Beamo2PreviewManager.cancel()` 設一個旗標，`previewFullWorkarea` 在每輪拍攝前與繪製前檢查：設定後，進行中的相機步驟照常結束，但不繪製、不顯示成功訊息，並回傳 `false`。手動流程不會呼叫它。Manager 其他部分不變。

### 7.3 開蓋迴圈（fbb2 / fhx2rf）

開門時、通過拍攝守門後設定一次，**不進 raw 模式、不歸零**：`getWideAngleCameraData(device)` → `connectCamera` → `setCamera(1)` → `setFisheyeParam({ ...params, grids: <機型的全範圍 grid>, offset: undefined })`（與 `FisheyePreviewManagerV4.paramsToSend` 對全範圍的處理相同）→ `setFisheyeObjectHeight(0)`，假設材料已對焦。不重用 `Bb2Hx2PreviewManager.setup()`：它的廣角流程會歸零（§2.2），而且會重讀門蓋，若此時門已關上就改走雷射頭相機（raw 模式、移動雷射頭）。沒有廣角校正（`hasWideAngleCamera === false` 或沒有參數）→ 迴圈不啟動，不顯示任何東西。迴圈結束時斷開相機。

迴圈直到門蓋輪詢（§7.1，持續進行）看到關門，或 `abort()`：

```
url = takeOnePicture({ timeout: 5 }) → object URL // 攤平後的 JPEG（§2.2）；不跳相機排線警告
t   = Date.now()                               // 照片完成的時間
push {url, t}; 保留最後 N = 4 筆，釋放被丟掉的 URL
await sleep(LOOP_GUARD_MS = 200)               // 拍攝錯誤 → sleep 1000
```

關門時，兩機型相同：最新且 `t ≤ t_close − SETTLE_MS (1500)` 的一筆；沒有 → 最新一筆；一筆都沒有 → 什麼都不做。

接著 `previewModeBackgroundDrawer.drawFullWorkarea(url)`（`preview-mode-background-drawer.ts:116`；不在預覽工作階段時直接繪製，不呼叫 `start()`，因為它會清掉背景並畫出預覽邊界），顯示「自動預覽：預覽成功」（3 秒）。未選中的 URL 一律釋放；`abort()` 不繪製並釋放全部。

### 7.4 `hasAnyModal()`

由背景任務管理器提供（`background-tasks.md` §7.4），透過 `canTouchMachine` 使用。

### 7.5 忙碌守門

`checkDeviceStatus` 詢問管理器（`backgroundTasks.yieldTo(device)`，`background-tasks.md` §7.3）；本任務 `isBusy()` 期間，同一台機器會跳出 `message.auto_preview.abort_to_continue` 的是／否提示，另一台機器則靜默中止。

`abort()`：設中止旗標並呼叫 `manager.cancel()`（§7.2），等待進行中的 manager 呼叫（raw 指令不能交錯，所以 `end()` 絕不與它同時執行），執行 `manager.end()`（fbm2：停回、鬆馬達、離開 raw；bb2/hx：斷相機），丟棄部分照片，回傳。只在輪詢時 `isBusy()` 為 false，所以閒置時呼叫者永遠看不到提示；`canTouchMachine` 接著在呼叫者的對話框、progress、預覽模式或子任務活躍期間阻止新的拍攝。

### 7.6 分頁焦點

由管理器提供（`background-tasks.md` §7.5）：Electron 用分頁焦點，網頁版用瀏覽器分頁可見性。

### 7.7 偏好設定與設定頁

Key `auto-full-area-preview: boolean`，預設 `true`，加到 `Preference.d.ts`、`beambox-preference.ts` 預設值、`globalPreferenceStore.ts`，並在 `Camera.tsx` 的「保留預覽結果」下方加一個 `SettingSwitch`。標籤 `settings.auto_full_area_preview` = "Auto Full-Area Preview"／自動全範圍拍照。切換時透過 store 訂閱即時啟停監聽器。

### 7.8 i18n key

- `settings.auto_full_area_preview`
- `message.auto_preview.prefix` = "Auto preview: "／「自動預覽：」
- `message.auto_preview.abort_to_continue` = "The machine is capturing the work area for auto preview. Stop capturing and continue?"／「機器正在自動拍攝工作區域，是否中止拍攝並繼續？」

---

## 8. 資料契約

### 8.1 偏好設定

`'auto-full-area-preview': boolean`（預設 `true`）。

---

## 9. 效能

- 門蓋輪詢：既有 control socket 上每 500 ms 一次 `play get_door_open` 來回，由 `addTask` 序列化。只在機器閒置時；子任務模式下暫停。
- 開蓋迴圈：每輪一張相機影格（機器端約 0.3–1 秒，含 fluxghost 的去畸變與攤平）；迴圈自然被這個延遲節流。最多保留 4 個 object URL。
- fbm2 拍攝：成本與手動全範圍預覽相同（raw 模式、歸零、兩張影格）。

---

## 10. 待決事項

設計階段（2026-10-16）已定案，留存紀錄：

1. ~~開蓋照片的有效性訊號~~ → 2026-10-16：蜂巢板四角 ArUco 標記（fhx2rf）、時間規則（fbb2，市場機器無標記）。影像差異的穩定配對法被否決：第一張無從判斷。**2026-10-30 修訂：fbb2 與 fhx2rf 都用時間規則**；v1 不採用標記，因為它們落在攤平影格之外、只在光線有利時讀得到、雷射頭在原點時會被擋住、且會隨平台升降移動（§2.6）。
2. ~~標記絕對位置~~ → 只做相對矩形檢查（2026-10-16）。2026-10-30 起不適用：v1 沒有標記檢查。日後重啟需改成「任一標記落在其預期位置」，而這取決於平台高度（§11 F2）。
3. ~~忙碌提示放哪~~ → `checkDeviceStatus`，不是 `getDevice()`（選單動作繞過 `getDevice`）。2026-10-30 起改由背景任務管理器的 `yieldTo` 處理，不再寫死一段。
4. ~~「任何對話框」vs 精選 id 清單~~ → 任何對話框、alert 或 progress。2026-10-30 起由背景任務管理器的 `canTouchMachine` 實作。
5. ~~訊息樣式~~ → 原序列加「自動預覽：」前綴，含連線步驟；bb2/hx 在成功 toast 前靜默。
6. ~~工作原點~~ → 啟用時所有機型都關閉監聽器。
7. ~~fhx2rf 無有效照片~~ → 什麼都不做（2026-10-16）。2026-10-30 起不適用：fhx2rf 改用 fbb2 規則，包括最新一張的退路。
8. ~~機器忙碌時的延後重試~~ → v1 不做（§11 F1）。
9. ~~自己的監聽器還是共用基礎設施~~ → 共用：本功能是背景任務管理器的第二個任務，Promark 是第一個（2026-10-30，`background-tasks.md`）。
10. ~~fbb2/fhx2rf 攤平用的材料高度~~ → 0，假設材料已對焦（2026-11-02）。讀取高度需要 raw 模式，手動廣角設定還會歸零；需求是不歸零，所以迴圈完全不進 raw 模式（§7.3）。

待定事實（非決策）：fbb2 與 fhx2rf 正常關蓋要花多久，用來確認 `SETTLE_MS = 1500`。

---

## 11. 風險與後續

- **R1 `SETTLE_MS` 未在硬體上驗證。** 沒有可用機器；1.5 秒是對正常關蓋時間的猜測。緩解：單一常數；§12 硬體列保持待辦。
- **R2 時間規則是經驗法則（fbb2 與 fhx2rf）。** 非常慢地關蓋仍可能得到傾斜的「靜置」照片。接受（產品決定）；手動預覽仍在。
- **R3 相機服務的共享曝光。** 兩台電腦在同一台 fbb2/fhx2rf 上跑迴圈會交錯影格；廣角流程兩邊都不改曝光，預期不會損壞。fbm2 的曝光切換在互斥的 raw task 內。
- **R4 raw 模式下的門蓋輪詢。** `play get_door_open` 在 raw 模式無效；任何子任務開著時任務暫停輪詢。若未來某流程長時間停在 raw 模式，自動預覽會靜默等待。
- **R5 fbb2/fhx2rf 高度為 0。** 未對焦的厚材料攤平後比例會略有偏差。接受（決策 10）；手動預覽會讀取實際高度。
- **F1 多台電腦輪流。** 因機器忙碌而跳過週期時，記住一次待拍，在時限內 `st_id` 回到 IDLE 就補拍，讓多台電腦輪流拿到預覽。一個旗標加一個期限；延後。
- **F2 重新評估標記判斷。** 從 §2.6 的事實出發。可行的形式：「找到的任一標記落在它自己的預期位置就算有效」，一個都找不到時退回時間規則。前提：標記在攤平影格內（放大格線、繪製前裁切）、有平台高度可算預期位置、有機器能在真實光線下量偵測率。

---

## 12. 測試計畫

免硬體（Jest，依 `unit-test` skill 慣例；管理器、`checkDeviceStatus` 與分頁焦點的測試在 `background-tasks.md` §12）：

- `autoFullAreaPreview.spec.ts`：條件守門（逐一切換每個條件）、fbm2 去抖（開 < 2 秒、關門 1 秒內重開、用假計時器跑正常路徑）、守門失敗跳過、拍攝中 abort 會呼叫 `end()` 並丟棄、socket 關閉跳過 `end()` 並回到輪詢、`isEnabled` 對應、開蓋挑選規則（靜置照片、最新一張退路、空清單不動作）。
- `BasePreviewManager.spec.tsx`：`messagePrefix` 會前置；`silent` 抑制 `Beamo2PreviewManager`／`Bb2Hx2PreviewManager` 設定錯誤的 alert。

硬體（待機器；對應 §5）：

- fbm2：A1、A4（匯出、框選、選單校正）、A5、A7、A8、A9、A11、A12、A14。
- fhx2rf：A2（含慢關情境）、A3、A4、A6、A10、A13。
- fbb2：A2、A3、A4。
- 網頁版：A11 的瀏覽器分頁變體。
