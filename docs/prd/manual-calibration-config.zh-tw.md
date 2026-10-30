# PRD：手動輸入校正參數

> 本文件為 [manual-calibration-config.md](manual-calibration-config.md) 的繁體中文翻譯；兩者不一致時以英文版為準。程式碼識別字與路徑保留英文。

| | |
|---|---|
| **Status** | 開發中 — D1–D7 定案，分支 `feat/manual-calibration-config`；2026-10-29 fbm2 實機驗證通過、需求方回饋已納入 |
| **Author** | Product + Beam Studio team |
| **Created** | 2026-10-28 |
| **Target product** | Beam Studio（桌面版 + 網頁版）、fluxghost（2.5.6 之後的下一版） |
| **Owner area** | 校正選單、相機預覽（魚眼重映射）、模組偏移、精準對位偏移 |
| **Related code** | 見英文版 |
| **External repos** | fluxghost（`fluxghost/api/fisheye_camera_mixin.py`、`fluxghost/utils/camera/perspective.py`、`docs/api/camera.md`、`tools/ws_smoke.py`） |

---

## 1. 摘要

目前 Beam Studio 的每一種校正都要跑完整流程：雕刻圖樣、拍照、求解。沒有任何地方能手動微調結果。
客服遇到只差 0.5 mm 的案子也得整個重做，而模組偏移、精準對位偏移這類數值更只能從各自流程內部才碰得到。

本功能在校正子選單最下方新增 **「手動輸入 / Manual Configuration」**，開啟一個 Modal，依參數分類分 Tab，
只放適合手動編輯的項目：**相機**、**模組**、**精準對位**。整個 Modal 不會出雷射、也不會移動雷射頭。

相機的魚眼原始參數（`k`、`d`、`rvec`、`tvec`）人類無法手動編輯，因此相機 Tab 改為提供 **以 mm 為單位的手動偏移**。
偏移值以新欄位存在既有相機參數檔內，由 **fluxghost** 在投影透視網格時套用，所以重映射後的影像仍以預覽點為中心，
Beam Studio 端完全不做 px 換算。fbm2 / fbb2 / fhx2rf 的全區預覽可選擇整個工作區共用一組偏移，或 **九個區域各一組**，
對應這些參數本來就有的九組 `WideAngleRegion` 外參。舊款針孔相機（beamo、Beambox、HEXA）直接編輯既有的 `X`/`Y`，
因為那兩個值本來就是純平移。

## 2. 背景與現況

### 2.1 校正選單

兩套選單都依機型組出校正子選單：`useMenuData.ts:100-201`（網頁）與 `menu-manager.ts:126-191`（Electron）。
項目以 id 對應到 `menuDeviceActions.tsx` 的 handler。目前最後一項是 `CALIBRATE_PRINT_AND_CUT`。

### 2.2 相機參數

| 相機 | 版本 | 存放位置 | 寫入者 |
|---|---|---|---|
| ado1 | V2 | 機器 `fisheye/fisheye_params.json` | `setFisheyeConfig` |
| fbb2、fhx2rf 雷射頭相機 | V3 | `fisheye/fisheye_params.json` | `setFisheyeConfig` |
| fbb2、fhx2rf 廣角相機 | V4 | `fisheye/wide-angle.json` | `uploadJson`（WideAngleCamera 對話框） |
| fbm2（單一相機、兩種模式） | V4 | `fisheye/fisheye_params.json` | `setFisheyeConfig` |
| fpm1（Promark） | V3 + `rotate180` | localStorage `promark-store`，以序號為鍵 | `promarkDataStore.set` |
| beamo、Beambox、HEXA | `X Y R SX SY` 文字 | 機器設定 `camera_offset`（可開底機型另有 `camera_offset_borderless`） | `doSetConfigTask` |

`setFisheyeConfig` 與 `doSetConfigTask` 之後都會呼叫 `clearPncOffset`（`camera-calibration-helper.ts:137,179`）：
精準對位偏移只對量測當時的相機校正有效。

### 2.3 魚眼影像如何重映射

Beam Studio 不碰像素。它送出參數（`set_fisheye_matrix`）與 **以 mm 為單位的透視網格** —— V3 用
`set_fisheye_grid {x:[start,end,step], y:[...]}`，V4 則放在參數內的 `grids` —— 由 fluxghost 的 `FisheyeCameraMixin`
把每個網格點經 `rvec`/`tvec`/`k`/`d` 投影到來源像素（`fisheye_camera_mixin.py:187-274`）。回傳影像剛好涵蓋網格範圍、
每 mm 5 px，預覽管理器再以預覽點為中心貼上（`RegionPreviewMixin.ts:148-156`、`drawFullWorkarea`）。

- V3（`set_fisheye_grid`）：整張網格共用一組 `rvec`/`tvec`。
- V4（`set_fisheye_height` → `calculate_regional_perspective_points`，`perspective.py:45-85`）：每個網格點依它在
  `total_width × total_height` 內的位置挑九區之一，用該區 polyfit 出的 `rvec`/`tvec` 投影。
- V2（`set_fisheye_height`）：fluxghost 自己從 `HW_PROFILE[model]` 產生網格，前端不送網格。
- Promark 走同一個 mixin，只是透過 `camera-transform` websocket（`PromarkPreviewManager.ts:63-79`）。

`set_fisheye_matrix` 逐一明確讀取欄位（`data['k']`、`data.get('total_width')`…），所以現行版本會忽略未知欄位。

fbm2 **兩種模式送同一份 V4 參數**：`Beamo2PreviewManager.switchPreviewMode` 只透過
`FisheyePreviewManagerV4.updateGrid` 換網格（局部網格平移到 `cameraCenter`，或全區網格）
（`Beamo2PreviewManager.ts:300-340`）。fluxghost 分不出兩種模式。

### 2.4 舊款針孔相機

`BeamPreviewManager` 只用 `X`/`Y` 決定雷射頭位置：`getPhotoAfterMove` 移到 `canvas/dpmm − (X, Y)`，再把照片以畫布點為中心貼上
（`BeamPreviewManager.ts:223-227, 306-311`）。`R`/`SX`/`SY` 只在 `preprocessImage` 內以照片自身中心旋轉、縮放。
因此 `X`/`Y` 是機器座標下的純平移，與另外三個值無關。兩個副作用：`X = Y = 0` 會讓管理器退回理想常數（`:177-185`），
`constrainPreviewXY` 會把可預覽範圍限制在 `≥ (X, Y)`。

### 2.5 模組偏移

`moduleOffsets.ts`：fbm2 與 fuv1 存在機器上（`toolhead_shift` 設定）；其他機型存在 `module-offsets` 全域偏好。
`OffsetSettings.tsx` 已能透過 `getModuleOffsets` / `updateModuleOffsets`（`isRelative: true`）編輯單一模組 **相對預設值** 的偏移，
但只有模組校正流程結尾才進得去。

### 2.6 精準對位偏移

`offsetStore.ts`：`PncOffset {x, y}` mm = 雷射相對於列印落點的位置，右/下為正。存在機器（`camera_calib/pnc.json`）或本機（依序號）。
`alignByCamera` 讀取後在擬合之後套用其負值（`correctByCalibration`）；校正對話框量測時用 `applyCalibration: false`。
UI 的「精準對位」即 Print and Cut。

## 3. 目標與非目標

**目標**

- 一個選單項、一個 Modal、依參數分類分 Tab，不出雷射、不移動。
- 相機：所有魚眼機型都有 mm 偏移；V4 全區預覽可分區；舊款相機直接編輯 `X`/`Y`。
- 模組：所選機器所有支援模組集中一個 Tab。
- 精準對位：檢視、編輯、清除偏移；可匯入相機偏移。
- 數值沿用既有路徑：匯入/匯出校正資料會帶著走，重新校正會重置。

**非目標**

- 編輯 `k`、`d`、`rvec`、`tvec`、polyfit、水平資料、`rotate180`（這些已有附圖的對話框；使用者要求不納入）。
- 從 Modal 內即時重新預覽。變更於下一次預覽階段生效（§10 D4）。
- 已淘汰的 V1 Ador 參數。
- 魚眼相機的旋轉或縮放修正。偏移僅限平移。

## 4. 情境

1. **S1 微調局部預覽** — beamo II 使用者發現切割落在預覽物件右側 0.6 mm。開啟手動輸入 → 相機，局部偏移 X = 0.6，儲存，重新預覽：對齊。
2. **S2 全區分區** — Beambox II 廣角預覽中央準、四角差 1 mm。全區區塊切到「分區」，編輯四個角，儲存。
3. **S3 舊款相機** — beamo 預覽偏高 1 mm。相機 Tab 顯示 `X`、`Y`；使用者改 `Y`。
4. **S4 不列印就調模組偏移** — fbm2 4C 印表模組比雷射偏左 0.3 mm。模組 Tab 改 PRINTER_4C X，儲存。邊界疊層更新。
5. **S5 精準對位** — 客服直接讀取客戶 pnc 數值，或清掉錯誤值。精準對位 Tab。
6. **S6 把精準對位匯入相機** — 游標尺量到 (0.4, −0.2)。使用者在相機 Tab 按「從精準對位匯入」：局部偏移變成 (0.4, −0.2)，pnc.json 清除，之後精準對位的對齊改由預覽本身修正。
7. **S7 舊後端** — 網頁版接到 fluxghost 2.5.6：偏移照常儲存，但要等後端更新才看得到效果（D1：不設閘門）。

## 5. 驗收條件

**選單**
- 每台機器子選單的校正清單最後一項為「手動輸入」（`menu.manual_configuration`），網頁與 Electron 皆然、所有機型皆有。行動裝置上可用（不出雷射、不移動），與其他校正項目不同。
- 點擊：`checkDeviceStatus` + `deviceMaster.select`，然後開 Modal。機器忙碌時以一般警示拒絕。預覽階段進行中也可開啟 Modal；儲存的值從下一次預覽階段起生效，因為 `previewModeController.start` 每次都建立新的 manager 並重新讀參數（D4）。

**Modal**
- `DraggableModal`，標題「手動輸入」，標題下以淺灰 helper text 顯示裝置名稱與機型（`getWorkarea(model).label`），antd `Tabs`。各機型顯示的 Tab：

| 機型 | 相機 | 模組 | 精準對位 |
|---|---|---|---|
| fbm2 | 一組「相機偏移」（局部預覽用；全區未分區時也用）+ 單選鈕「全區：與局部相同 / 分區」與 3×3 表 | 有 | 有 |
| fbb2、fhx2rf | 「局部預覽偏移」（雷射頭相機）+「全區預覽偏移」（廣角相機）與單選鈕「單一 / 分區」；全區區塊僅在 `wide-angle.json` 存在時顯示 | 無 | 有 |
| ado1 | 單一偏移 | 有 | 有 |
| fpm1 | 單一偏移 | 無 | 有 |
| beamo、Beambox、HEXA | 只有 `X`、`Y`（`R`、`SX`、`SY` 不顯示）；可開底機型多一列 `camera_offset_borderless` | 無 | 有 |
| fuv1 | 無 | 有 | 有 |

- 每個 Tab 各自有儲存。儲存只寫該 Tab 的存放處並顯示標準儲存進度；失敗顯示錯誤警示且 Modal 維持開啟。取消／關閉捨棄未儲存的修改。
- 輸入用 `UnitInput`，單位 mm（文件單位為英吋時顯示英吋，精度規則同 `OffsetSettings.tsx:35-41`），步進 0.1。
  相機偏移限制在 **±5 mm**：更大的殘差代表校正本身偏了，而且取樣範圍再往外推可能落到照片外；輸入上限 5，並提示重新校正。
  模組與精準對位欄位維持既有範圍。

**相機 Tab，魚眼**
- 開啟時從該列的存放處（§2.2）載入目前參數並顯示已存偏移，無則 0, 0。參數不存在 → 區塊顯示「請先校正相機」並停用
  （訊息同 `calibrate_camera_before_calibrate_modules`）。
- 儲存時將參數連同 `offset`（分區時再加 `region_offsets`）用當初校正用的同一個寫入者寫回
  （`setFisheyeConfig`、`uploadJson('fisheye','wide-angle.json')`、`promarkDataStore.set`）。其他欄位除 `setFisheyeConfig`
  既有的數字捨入外一律不動。儲存**不會**清除 pnc.json（`setFisheyeConfig(…, { clearPnc: false })`，與校正不同）：只有打開精準對位切換後的儲存會清除，因為偏移已把 pnc 吸收進去。單純手動修改後留下的 pnc 可能過時，由使用者自行判斷（需求方 2026-10-29 決定）。
- **正負號**：偏移 = 雷射相對於預覽中所見物件的落點，右/下為正（與 `PncOffset` 同一慣例）；說明文字寫成「預覽結果相對於物件的位置」，數值相同。
  儲存 X = +1 後，下一次預覽該物件在畫布上**左移** 1 mm（先前畫得太右）。fbm2 實機確認（§12）。
- 區塊標題：兩者並存時（bb2 / hx2 / fbm2）叫「局部預覽偏移」與「廣角預覽偏移」，只有一個時（ado1、Promark）叫「預覽偏移」；舊款區塊叫「相機偏移」。
- 廣角區塊（fbm2 與 hx2 一律有，廣角相機是標配；bb2 只在 `getWideAngleCameraData` 偵測到相機時才有：韌體 `BB2_WIDE_ANGLE_CAMERA`、相機數 ≥ 2——沒裝廣角相機的 bb2 不顯示此區塊，有相機但沒有 `wide-angle.json` 則顯示請先校正）編輯 `region_offsets`，用 Segmented「單一 / 分區」切換。單一會把同一組值寫進九區；
  讀到九區相同的表就顯示為單一。切到分區時以單一值預填九格（3×3 如同床面，topLeft … bottomRight）。區域區塊編輯 `offset`；兩者是獨立的值（D7），共用一顆儲存。
- 區域區塊的「套用精準對位偏移」切換：`fetchPncOffset(serial)` 有值時顯示，旁邊列出該值。打開：丟掉未儲存的修改、欄位鎖定並顯示 **機器上的值 + pnc**
  （游標尺是透過已帶著目前偏移的預覽讀到的，所以是殘差）；關閉：回到機器上的值。切換打開時的儲存會清除 pnc.json，切換隨之消失；關閉時的儲存不動 pnc。pnc 值放在 Modal 的 store，與精準對位 Tab 共用：那邊儲存或清除會立即反映到切換上，反之亦然。
- 不設後端閘門（D1）：欄位一律顯示；Tab 說明註明偏移需要出貨 §7.3 的 fluxghost 版本。

**相機 Tab，舊款**
- 以 `BeamPreviewManager` 的正規表示式（`parseCameraOffset`）載入 `camera_offset`（`getAddOnInfo(model).openBottom` 時再載 `camera_offset_borderless`）。
  顯示整組設定，**不設上下限**：`X`、`Y` 為絕對 mm 值（存的值不能當中心：已校正的 beamo 讀到 X 8.9 / Y 37.9，離出廠常數 20 / 30 有段距離，而且校正壞掉的值必須能被改回來），`R` 以度顯示（儲存為弧度），`SX`／`SY` 為原始比例（D6 重開）。標籤沿用 `calibration.rotation_angle`／`x_ratio`／`y_ratio`。兩列放在同一區塊、一顆儲存。
- 儲存透過 `sendPictureThenSetConfig` → `doSetConfigTask` 寫入五個值，維持 `S` 與 `SX/SY` 的韌體分支，pnc.json 保留（`clearPnc: false`）。
  不擋任何值，也不推斷「已校正」狀態：從未校正的機器回的是韌體預設 `X0 Y0 R0 SX1 SY1`（`fluxmonitor/storage.py:391`），該列照樣顯示；不論存了什麼，`BeamPreviewManager` 仍把 `0, 0` 當成「用理想常數」，而這種狀態的機器本來就需要校正。
- 每列一個 **翻轉切換**（「翻轉影像」），來自設定值的 `F:` 旗標（`parseCameraFlip`）。部分舊機器的相機是反向安裝的，而韌體在設定檔從未寫入時把 `F` 預設為 1（`fluxmonitor/storage.py:391`），照片因此整張顛倒。
  儲存有變動的翻轉時送出部分設定 `config set camera_offset F:0|1`：韌體會合併部分設定（`command_task.py:1105`、`storage.py:395`），X/Y/R/S 不受影響。同時清除 pnc.json（翻轉會移動照片中所有東西），並寫入 `deviceMaster.currentDevice.cameraNeedsFlip`，也就是 `connectCamera` 每次連線只讀一次的快取，讓下一次預覽不必重連就用新方向。
- **正負號**（與魚眼偏移相反，因為 `X`/`Y` 是相機位置而不是修正量）：雷射頭移到 `canvas − (X, Y)`，所以切割落在預覽物件右側 `e` 代表 `X` 多了 `e`：把 `X` 減少 `e`；落在下方則減少 `Y`。實機確認（§12 案例 7）。

**模組 Tab**
- `getWorkarea(model).supportedModules` 中每個模組一列（排除 `LASER_UNIVERSAL`），各有相對機型預設值的 X、Y（語意同 `OffsetSettings`），以 `useCache: false` 載入。
- 儲存對每個有改動的列呼叫 `updateModuleOffsets`；邊界疊層更新（`updateModuleOffsetsInStore` 內已呼叫 `boundaryDrawer.update`；存在機器上的機型需明確呼叫）。

**精準對位 Tab**
- 顯示 `fetchPncOffset(serial)` 或空白。儲存 → `savePncOffset`；清除 → `clearPncOffset` 並清空欄位。單位 mm，維持現行三位小數捨入。

**邊界案例**
- 編輯中機器斷線：儲存失敗顯示標準錯誤警示；Modal 維持開啟。
- fbb2/fhx2rf 無廣角資料：不顯示全區區塊，不報錯。
- fbm2 儲存分區表後的局部預覽：不受影響，使用單一 `offset`（§7.2）。
- 匯入/匯出校正資料（`backUpCalibrationData`）原樣複製 json，因此會帶著 `offset`/`region_offsets`。匯入不含這些欄位的備份 = 偏移 0。
- 重新校正相機會重寫 json、不含這些欄位 = 偏移歸零。此為預期行為。

## 6. 不得改變

| 共用檔案／函式 | 呼叫者 — 預期行為 |
|---|---|
| `useMenuData.ts` `calibrationChildren`、`menu-manager.ts` 校正子選單 | 所有機器子選單 — 既有項目、順序與條件不變；僅末尾新增一項 |
| `menuDeviceActions.tsx` | 選單點擊分派 — 既有 handler 不變；新增一個 key |
| `FisheyePreview.d.ts` V2/V3/V4（+ `PromarkCameraParameters`） | 所有參數讀取者 — 新欄位皆為選填，無必填 |
| `FisheyePreviewManagerV4.setupFisheyePreview` / `updateGrid` | `Beamo2PreviewManager`、`Bb2Hx2PreviewManager` 廣角 — 同樣的指令、同樣的順序；僅 fbm2 REGION 模式的參數 payload 可省略 `region_offsets` |
| `Beamo2PreviewManager.switchPreviewMode` | PreviewFloatingBar → `previewModeController.switchPreviewMode` — 網格選擇、遮罩合併、雷射頭移動不變 |
| `camera-calibration-helper.ts` `setFisheyeConfig`、`doSetConfigTask` | 校正對話框 — 不變；僅作為寫入者重用 |
| `offsetStore.ts` | `alignByCamera`、精準對位校正對話框 — 讀/寫/清除語意不變 |
| `moduleOffsets.ts` | ConfigPanel 邊界、模組校正、匯出 — 不變；重用 |
| `jsonDataHelper.ts` `FileMap` | 不變（所需檔案皆已列出） |
| `BeamPreviewManager.ts` camera_offset 解析 | 舊款機型預覽 — 同樣的正規表示式，搬到 `helpers/device/camera/cameraOffset.ts`（`parseCameraOffset`）；0,0 回退留在 manager |
| `device-master.ts` `currentDevice.cameraNeedsFlip` | `connectCamera` — 仍是每次連線讀一次；舊款區塊只在儲存 `F` 變更後覆寫快取值 |
| `camera-calibration-helper.ts` `setFisheyeConfig`／`sendPictureThenSetConfig` | 校正對話框（LaserHeadFisheyeCalibration、Beamo2Calibration、AdorCalibration、StepBeforeAnalyzePicture）— 預設仍清除 pnc.json；只有手動輸入傳 `{ clearPnc: false }` |
| fluxghost `set_fisheye_matrix` | 所有客戶端 — 不含 `offset` 的參數行為與以前完全相同（偏移預設 0） |
| fluxghost `calculate_regional_perspective_points` | `set_fisheye_height` v4、`cmd_check_pnp`？ — 新的選填 kwargs 預設不平移；CheckPnP 維持不傳（校正流程不帶手動偏移） |
| fluxghost `ws_smoke.py` | 仍須以 `ALL PASS` 結束；新增一個帶 `offset`、一個帶 `region_offsets` 的案例 |

## 7. 設計

### 7.1 資料模型

```ts
// FisheyePreview.d.ts — 加到 V2、V3、V4（PromarkCameraParameters 繼承自 V3）
offset?: [number, number];                                   // mm，機器座標，右/下為正
// 僅 V4
region_offsets?: Record<WideAngleRegion, [number, number]>;  // 廣角預覽，一律九區齊全
```

規則（D7）：`offset` 是 **區域預覽** 的偏移（ado1 / Promark 沒有區域模式，就是整個預覽）。`region_offsets` 是 **廣角預覽** 的偏移，
一律寫滿九區：「單一」模式把同一組值存九次，讀到九區相同就顯示為單一，所以不需要模式旗標。fluxghost 逐點以 `region_offsets[region]`
優先於 `offset`，兩者不會混用。

### 7.2 各數值的使用位置

| 預覽 | 送出的參數 | fluxghost 套用的偏移 |
|---|---|---|
| fbb2/fhx2rf REGION、PRECISE_REGION | V3 `fisheye_params.json` | `set_fisheye_grid` 內的 `offset` |
| fbb2/fhx2rf FULL_AREA | V4 `wide-angle.json` | `set_fisheye_height` 內的 `region_offsets[region]`（它的 `offset` 不會被寫入） |
| fbm2 FULL_AREA | V4 `fisheye_params.json` | `region_offsets[region]`（與區域 `offset` 同一個檔案） |
| fbm2 REGION | V4 `fisheye_params.json`，**去掉 `region_offsets`** | `offset` |
| ado1 | V2 | `set_fisheye_height` 內的 `offset` |
| fpm1 | V3，經 camera-transform | `set_fisheye_grid` 內的 `offset` |

fbm2 去除：`FisheyePreviewManagerV4` 的 `setupFisheyePreview` 與 `updateGrid` 新增選項 `useRegionOffsets: boolean`，
送出 `{ ...params, region_offsets: useRegionOffsets ? params.region_offsets : undefined }`。`Beamo2PreviewManager`
傳 `mode === PreviewMode.FULL_AREA`。`Bb2Hx2PreviewManager` 一律傳 `true`（它的 V4 參數只屬於廣角相機）。

共用檔案：fbm2 的兩個區塊改的是 `fisheye_params.json` 的不同欄位，所以 `CameraTab` 給它們同一個 `createParamsSource`（`offsetParams.ts`）：
只讀一次，每次儲存都先併進快取副本再整份寫入，第二個區塊緊接著儲存時不會把舊欄位寫回去。

正負號推導：若校正把它以為是世界座標 W 的像素，實際對應到 W − e，雷射會落在預覽物件的 +e 處，所以存的偏移是 e，
網格點必須以 W + e 投影。fluxghost 在 `project_points` 之前把偏移加到物件點上。

### 7.3 fluxghost

`fisheye_camera_mixin.py`：
- `set_fisheye_matrix`：v2/v3/v4 存 `'offset': data.get('offset', [0, 0])`；v4 另存 `'region_offsets': data.get('region_offsets')`。
- `set_fisheye_grid`（v3）：`project_points` 前 `objp[..., 0] += ox; objp[..., 1] += oy`。
- `set_fisheye_height` v2：對 `objp` 做同樣平移。v4：把 `offset` 與 `region_offsets` 傳給 `calculate_regional_perspective_points`。

`perspective.py` `calculate_regional_perspective_points(..., offset=(0, 0), region_offsets=None)`：逐點迴圈內
`ox, oy = region_offsets.get(region, offset) if region_offsets else offset`，投影 `(x + ox, y + oy, -h)`。
區域以 **未加偏移的** `(x, y)` 判斷，所以表格中一格的意思是「床面這一區顯示的像素要移多少」，與使用者看到的一致；
平移後的點即使跨過區域邊界，仍用原區的外參投影。

偏移大小：`project_points` 是完整的正向模型，任何大小的偏移都精確投影；唯一殘餘是二階項（校正比例誤差 × 偏移，2 % × 5 mm 約 0.1 mm）。
因此採用上面的 ±5 mm 上限，而不需要更小的步進或不同公式。

為何平移物件點而不是 `perspective_points`：後者是拉正之前的來源影像像素。影像軸相對床面是旋轉、縮放加透視傾斜的，
離相機近與遠的地方 1 px 對應的 mm 也不同，所以固定像素位移既不對齊軸向、在床面上也不均勻。
在 `project_points` 之前平移 mm 物件點，讓投影逐點處理這些差異，拉正後剛好是床面上精確的平移。
快取查表（commit e61462d）以透視點為鍵，會自然失效。

`docs/api/camera.md`：在 `set_fisheye_matrix` 下記錄這兩個欄位。`ws_smoke.py`：兩個案例。

### 7.4 Beam Studio UI

```
components/dialogs/camera/ManualConfiguration/
├── index.tsx                # showManualConfiguration(device)：檢查、選取、addDialogComponent
├── ManualConfiguration.tsx  # DraggableModal + Tabs，Tab 顯示表（§5）
├── CameraTab.tsx            # 魚眼區塊、舊款區塊、匯入按鈕
├── RegionOffsetGrid.tsx     # 3×3 UnitInput 成對
├── ModulesTab.tsx           # 以 getModuleOffsets / updateModuleOffsets 列出
└── PrintAndCutTab.tsx       # 以 offsetStore 讀取／儲存／清除
```

各存放處的載入重用既有 helper：`getCheckpointData({ allowCheckPoint: false })` 讀 `fisheye_params.json`、
`loadJson('fisheye', 'wide-angle.json')`、`promarkDataStore.get(serial, 'cameraParameters')`、
`deviceMaster.getDeviceSetting('camera_offset')`。不新增 store；Modal 的表單狀態放在 React。

### 7.5 i18n

`en.ts` / `zh-tw.ts` 新增命名空間 `manual_config`：`title`、`tab_camera`、`tab_modules`、`tab_print_and_cut`、
`region_offset`、`full_area_offset`、`single_offset`、`per_region`、`import_pnc`、`import_pnc_desc`、
區域名稱盡量重用 `calibration` 既有 key。選單 key `menu.manual_configuration` = "Manual Configuration" /「手動輸入」。
其餘 21 種語言於 PR 前補齊。

## 8. 資料契約

- `fisheye_params.json` / `wide-angle.json` / `promark-store.cameraParameters`：`offset?: [x, y]` mm；V4 `region_offsets?: {topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight: [x, y]}` mm。缺省 = 0。讀取者須容許缺省（fluxghost `.get`）。
- `set_fisheye_matrix` JSON 多出同樣兩個選填欄位；其餘不變。
- `camera_offset` 機器設定：格式不變；`X`/`Y` 以完整字串寫入，`F` 以部分設定 `F:0|1` 寫入，由韌體合併。
- `camera_calib/pnc.json`：格式不變；只在相機儲存套用了精準對位切換、舊款翻轉、以及精準對位 Tab 的清除時清除。

## 9. 推出計畫（PR 規劃）

1. **fluxghost** — mixin 與 `perspective.py` 的 offset + region_offsets、文件、smoke 案例。打 tag。
2. **beam-studio PR A** — 型別、選單項（兩套選單）、含模組與精準對位 Tab 的 Modal、舊款相機區塊、魚眼相機區塊、fbm2 去除。en + zh-tw。
3. **同一 PR 合併前的補充** — 21 種語言、§12 記錄實機正負號確認、翻 Status 列。

出貨順序：fluxghost tag → beam-studio CD 升版 → PR A。

## 10. 待決事項

1. ~~D1 後端閘門~~ — **一律顯示**，2026-10-28 決定：桌面版自帶 fluxghost，版本落差少見；舊後端忽略該欄位。
2. ~~D2 偏移在 Beam Studio（平移網格）或 fluxghost 套用~~ — **fluxghost**，2026-10-28 決定：涵蓋 V2 Ador，且所有版本只有一份實作。
   2026-10-29 重新檢視，維持。平移網格只有 V3 做得到（V2 的網格在 fluxghost 內部產生，V4 從參數檔讀）。Beam Studio 端真正的替代方案是把 **warp 後**的輸出影像平移 −offset
   （輸出已是床面 mm，數學上完全等價；分區 = 九次帶 clip 的 drawImage，接縫相同），可以拿掉對 fluxghost 版本的依賴，但每個預覽 manager 的貼圖／裁切路徑都要動。
   只有在舊後端使用者成為問題時才值得做；儲存欄位不必改。
3. ~~D3 精準對位 → 局部預覽用核取方塊或匯入~~ — **匯入按鈕**，2026-10-28 決定：沒有執行期旗標，`alignByCamera` / 精準對位校正也沒有重複套用的路徑。
4. ~~D4 預覽中開啟 Modal~~ — **允許開啟，下次預覽生效**，2026-10-28 決定：不需寫程式，每次 `start` 都重新讀參數。
5. ~~D5 匯入語意~~ — **加到**目前偏移，2026-10-28 決定：儲存偏移會清掉 pnc.json，所以存在的 pnc 只可能是在已套用目前偏移的預覽下量到的，是其上的殘差。偏移為零時加與取代相同。§12 案例 6 確認。（2026-10-29：單純手動儲存不再清 pnc；「加到」規則仍成立，因為切換本身的儲存會清。）
6. ~~D6 舊款 `R`/`SX`/`SY`~~ — **不顯示**，2026-10-28 決定：只開放 `X`、`Y`。旋轉與縮放與其手動調整不如重新校正；有具體需求再開放。
   **2026-10-29 依需求方回饋重開**：五個值全部可編輯（`R` 以度、`SX`／`SY` 原始比例），區塊改名「相機偏移」，魚眼區塊對應改名「…預覽偏移」。
7. ~~D7 fbm2 的區域與廣角偏移~~ — **獨立**，2026-10-29 決定：拍的不是同一張照片（雷射頭移到目標點上方 vs 固定在相機中心；bb2 / hx2 更是不同相機），
   所以 `offset` = 區域、`region_offsets` = 廣角，「單一」以九組相同值儲存。先前的「與區域相同」選項取消。

## 11. 風險與後續

- 精準對位偏移在紙張座標（依擬合角度旋轉）套用，相機偏移在機器座標。匯入只複製數字；紙張對齊軸向時兩者相同。
- fbm2 局部與全區共用一個檔案；只調全區分區的使用者不會看到局部預覽改變。Tab 標籤要講明。
- 手動偏移在重新校正時刻意遺失；Tab 說明要提到。
- 後續：客服需要時再開放 ado1 的 `levelingData`／高度。
- 後續：Promark `rotate180` 維持在校正對話框。

## 12. 測試計畫

單元測試（jest，`--runInBand`）：
- `ManualConfiguration` 各機型 Tab 顯示（§5 表）。
- CameraTab 各存放處的儲存 payload：未改欄位保留、加上 `offset`、`region_offsets` 隨單選鈕增減、只在切換打開時清除 pnc。
- 舊款區塊：`camera_offset` 正規表示式解析、`doSetConfigTask` 收到未變的 `R/SX/SY`。
- `FisheyePreviewManagerV4` 在 `useRegionOffsets` 為 false 時去掉 `region_offsets`。

fluxghost：`ws_smoke.py` 案例；一個單元測試驗證 `offset = (1, 0)` 讓每個投影點平移 1 mm 步進的投影量。

實機（結果記錄於此）：
1. fbm2 局部：存 X = +1、Y = +1，預覽同一物件：畫布上**左移、上移** 1 mm（正值表示切割落在預覽物件的
   右下方，即預覽畫得太右、太下，必須往回搬）。__
2. fbm2 全區單一：同上檢查。正負號已於 2026-10-29 確認（+X/+Y → 左／上）。再分區且僅一角 +1：只有該角移動。2026-10-29 通過；D7 獨立性（改廣角值不影響局部預覽，反之亦然）與精準對位 toggle 亦通過。__
3. fbb2 廣角分區。fhx2rf 全區 2026-10-29 通過（同一條 `Bb2Hx2PreviewManager` → V4 路徑與 `wide-angle.json`；bb2 只差在相機是選配的偵測）。2026-10-29 手邊沒有 bb2，留待下一台經手時補測。__
4. ado1 單一偏移。2026-10-29 通過（V2 路徑）。__
5. fpm1 單一偏移。2026-10-29 手邊沒有 Promark；同一個 mixin 經 camera-transform，保留待測。__
6. fbm2 精準對位匯入：游標尺 → 匯入 → 重跑精準對位對齊，切割落在列印上（決定 D5）。__
7. beamo：切割落在預覽物件下方 1 mm → `Y` 減 1 → 對齊。2026-10-29 確認：+X／+Y 讓預覽右移／下移，與魚眼偏移相反，如 §5 推導（X／Y 是相機位置，不是修正量）。__
8. 舊 fluxghost（2.5.6）：可儲存、預覽無變化、無錯誤。2026-10-29 以程式碼確認，不做實機：2.5.6 的 `set_fisheye_matrix` 只用已知欄位重建參數 dict，`offset`／`region_offsets` 會被靜默丟棄（V2／V3／V4 與 Promark 走同一個 mixin）；檔案上傳本來就不經過 fluxghost。
