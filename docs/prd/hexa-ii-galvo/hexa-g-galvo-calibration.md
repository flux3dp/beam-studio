# PRD: HEXA G 振鏡場鏡校正（打圖樣 → 拍照 → 解算 → 套用 → 拼接驗證）

| | |
|---|---|
| **Status** | Implemented (unverified on hardware)，2026-10-28。PR A（BeamOS `paths` + `mb_exec`）、PR B/D（Beam Studio）、PR C（fluxghost）已寫完並通過單元測試；整條閉環尚未上機，目的是一口氣在實機驗證「用雷射頭相機取代平台掃描機」是否可行 |
| **Author** | EstherFu |
| **Created** | 2026-10-28 |
| **Target product** | Beam Studio（desktop + web），機型 `fhx2galvo`（HEXA G） |
| **Owner area** | 機器工作流程 / 振鏡設定（`components/dialogs/promark/`）、裝置通訊（`helpers/device/`、`helpers/api/control.ts`）、相機（`actions/camera/preview-helper/`、`helpers/api/camera.ts`、`helpers/api/open-cv.ts`） |
| **Related code** | 振鏡直接驅動：`packages/core/src/web/helpers/device/galvoExec.ts`；串聯／解聯：`packages/core/src/web/helpers/device/galvoLaserMode.ts`；對話框：`packages/core/src/web/app/components/dialogs/promark/GalvoSettings.tsx`、`GalvoManualBlock.tsx`；控制通道：`packages/core/src/web/helpers/api/control.ts`、`packages/core/src/web/helpers/device-master.ts`、`packages/core/src/web/interfaces/IControlSocket.d.ts`；模組偏移：`packages/core/src/web/helpers/device/moduleOffsets.ts`；龍門行程：`packages/core/src/web/helpers/device/gantryTravelRange.ts`、`galvoHeadConnection.ts`；區域拍照：`packages/core/src/web/app/actions/camera/preview-helper/RegionPreviewMixin.ts`、`Bb2Hx2PreviewManager.ts`、`packages/core/src/web/helpers/api/camera.ts`；拍照流程先例：`packages/core/src/web/app/components/dialogs/PrintAndCut/utils/align/`（`previewSession.ts`、`capture.ts`、`refineMarkPatches.ts`）；opencv 客戶端：`packages/core/src/web/helpers/api/open-cv.ts` |
| **External repos** | `BeamOS_NX_backend`：`fluxmonitor/controller/tasks/galvo_exec.py`（新增 `paths` op）、`control_task.py`（已有 `MB:` 直通，不改）；協定 `docs/agents/HX2_GALVO_PROTOCOL.md`。`fluxghost`：`fluxghost/api/camera.py` + `utils/camera/perspective.py`（高解析度重映射）、`fluxghost/api/opencv.py`（新增 `solve_galvo_coupon`）；改完要跑 `uv run python tools/ws_smoke.py`。`swiftray`：本 PRD 不改，§12 的 tile 順序變更才會動到 |
| **Companion doc** | 工廠流程原稿 `~/Desktop/correction.html`（「HX2 場鏡校正操作流程」，2026-10-27），不進 repo。圖樣規格（§7.2）與解算方法（§7.8）由它轉寫 |

---

## 1. Summary

工廠目前用一份 Python 腳本加平台掃描機做 HEXA G 的場鏡畸變校正：振鏡在深色紙上打 9×9 格點 coupon，噴嘴在周圍打 8 個 L 當尺規，掃描後解算出場的 X／Y 尺度、正交度與殘差，再調卡上的八項 manual 修正值。最終目標是振鏡 tile 之間可以完全貼合拼接：110 場鏡打一個 100 的方框、龍門 X 右移 100 再打一個、Y 下移 100 再打一個，邊要共線。

這份 PRD 把整條流程搬進 Beam Studio，一次做完五個階段，在實機驗證最終結果是否可行：

- **A 打圖樣**：振鏡打 coupon、噴嘴打 L 框，與工廠流程逐筆相同。
- **B 拍照**：用雷射頭相機分格拍 coupon 區域，拼成一張床座標 mm 的影像。
- **C 解算**：fluxghost 新端點照工廠文件的方法算出尺度、正交度、殘差。
- **D 套用**：畫面顯示結果，建議新的 scaleX / scaleY，一鍵套到畫面上的振鏡參數，再打一張驗證。
- **E 拼接驗證**：三個 100 mm 方框配龍門移動，檢查最終目標。

開發期間全部放在「振鏡設定（CO2 振鏡）」對話框的一個 dev 區塊裡，需 `fhx2galvo-dev` 旗標。正式版傾向改成像相機校正、模組校正那樣的獨立分步驟彈窗（決策 6，體驗後定）。

**最大的未知數在 B**：雷射頭相機實測只有 5 到 7 px/mm，平台掃描機是 23.6 px/mm（§2.3）。所以 B 不是單張全幅照，而是分格近拍、只留每格中央、以高於原生的 px/mm 重映射後拼接；能不能用，由 C 裡 L 框的自我檢查（擬合 RMS < 0.5 mm）直接判定。

## 2. Background & current state

### 2.1 工廠流程（correction.html）

一輪：準備（切光路、量平整度、對焦）→ 雕刻（coupon + L 框）→ 平台掃描 600 dpi → 解算 → 更新八項 manual 修正，回到第 1 步再打一張驗證。本 PRD 涵蓋雕刻、掃描、解算、更新四段，準備段不在範圍（§3）。

### 2.2 Beam Studio 與機器端已有的東西

- **直接驅動振鏡卡**：`galvoExec.ts` 透過 control_task 的 `galvo_exec` 送 JSON，機器端 `galvo_exec.py:build_records()` 展開成 BSL list。目前只有 `goto`、`frame`、`dot` 三種 op。每次都帶完整 optics（15 個鍵），所以可以用畫面上的參數試打而不存檔（`toGalvoOptics`，`galvoExec.ts:28`）。
- **串聯／解聯**：`galvoLaserMode.ts` 的 `connectGalvoHead` / `disconnectGalvoHead` / `ensureGalvoHeadDisconnected`。機器端 `control_task.py:609` 的 `galvo_mode` 會歸零、過床、串聯、`$HX`、釋放馬達，再設 `M136P259Q10`、`M136P174`、`M136P310Q1`、`M136P311Q1`；限位已到位時跳過機械動作只重送授權位元。**它不碰氣閥 `M136P312` 也不開泵 `M136P3`**。
- **主板直通**：`control_task.py:700` 接受 `MB:<gcode>` 直送主板，但主板的回覆走 `_send_to_handler`，在 TCP 介面（fluxghost 連機器用的就是 TCP）整個被丟掉（`control_task.py:798-820`），所以 Beam Studio 送了也收不到回覆。本 PRD 因此在 control_task 加了 `mb_exec <gcode>`（§7.5b）：送一行、用既有 `running` / `last_result` 機制等主板 ok，結果由 `get_result` 讀回。`MB:` 直通本身不動。
- **Raw 模式**：`control.ts` 有 `rawHome`、`rawMove({x,y,f})`（11 處呼叫）、`rawSetLaser({on,s})`、`M136P173/174` 的雷射模式指令（`control.ts:1626`）、`rawSetAirPump`、`rawLooseMotor`。`rawMove` 不帶 S。
- **模組偏移**：振鏡場心相對噴嘴就是 `toolhead_shift`，對話框開啟時用 `getModuleOffsets({ module })` 讀進來（`GalvoSettings.tsx:301`），每顆頭各一組；預設值在 `moduleOffsets.ts:40-42`，CO2 與 MOPA 目前都是 `[0, 0]` 佔位（TODO 待確認）。`field.offsetX/Y` 在 HEXA G 固定為 0（`galvoConfig.ts:16`）。
- **兩顆振鏡頭**：對話框依模組開啟（`showGalvoSettings(device, module)`，`menuDeviceActions.tsx:359,362`），整份 state 與每個指令都帶 `module`。差異只有四處：串聯模式 `connectGalvoHead(module)` 對應 `galvo_mode` / `mopa_mode`（`galvoLaserMode.ts:19-20`；`mopa_mode` 送 `M136P259Q11` 與 `M136P310Q0`，且機器未偵測到 MOPA 頭時回 `error: not a mopa head`，`control_task.py:646-657`）；`galvo_exec` 的 `head` 帶模組 id 12 / 13，脈衝由 `galvo_exec.py:pulse_for` 依頭別決定（MOPA 25 kHz、350 ns，功率直接給卡）；機器上的設定鍵 `galvo_co2` / `galvo_mopa`（`galvoConfig.ts:59-60`）；軸向預設 CO2 `invertX = invertY = true`、MOPA 全 `false`（`galvoConfig.ts:72-73`）。龍門行程 `getGantryTravelRange(model)` 是兩顆頭邊界的聯集（`module-boundary.ts:27-28`，CO2 右扣 50、MOPA 右扣 100，皆為佔位），不分模組。
- **龍門行程**：`gantryTravelRange.ts` 已把機器報的 `galvo_work_range` X 扣掉 30 mm；`getGalvoHeadConnectedFeedrate()` 給串聯時的龍門速度上限。
- **區域拍照**：`RegionPreviewMixin.regionPreviewAtPoint(x, y)` 把頭移到 `getPreviewPosition` 算出的位置、`getPhotoAfterMoveTo` 拍一張、`preprocessImage` 後畫到預覽底圖。Print and Cut 的 `previewSession.ts`（`ensureRegionPreview`）、`capture.ts`、`refineMarkPatches.ts` 是「在指定點拍照並取回影像」的現成寫法；`refineMarkPatches` 的註解說明了為什麼要把相機對準目標再拍：區域預覽的精度在影像中央最高。
- **fluxghost 影像處理**：相機端點 `require_frame` 回傳的是已做魚眼與透視校正的影像，輸出比例由 `utils/camera/constants.py` 的 `DPMM = 5` 決定（`perspective.py:107`），也就是 5 px/mm。opencv 端點只有 `upload` / `sharpen` / `detect_blobs` / `image_contour`；camera-calibration 端點有 `remap_image`（只去畸變、不做透視）。沒有任何格點或仿射解算。
- **校正圖樣的先例**：相機校正用 `deviceMaster.doHexaGCalibration()` 上傳固定 fcode 由噴嘴打點；模組校正對振鏡頭仍是 TODO（`ModuleCalibration.tsx:83`）。

### 2.3 相機解析度（2026-10-28 實測反推）

`LaserHeadFisheyeCalibration.tsx` 的 `HEXA_G_IMAGE_POINTS` 是真機校正照片上的像素座標（補邊後 5600×4200 座標系，原生 3264×2448）。校正圖樣 x 跨 220 mm、y 跨 100 mm：

| 位置 | 實際距離 | 像素跨距 | 解析度 |
|---|---|---|---|
| 近排 y = 200 | 220 mm | 1543 px | 7.0 px/mm |
| 遠排 y = 300 | 220 mm | 1195 px | 5.4 px/mm |
| 縱向 | 100 mm | 約 500 px | 5.0 px/mm |
| 平台掃描機 | 600 dpi | | 23.6 px/mm |

0.3 至 0.5 mm 寬的刻痕只剩 1.5 到 3.5 px。工廠文件靠溝壁幾何中點、6.5–11 mm 連通區塊的做法，單張全幅照片做不到，所以 B 階段分格近拍。而 fluxghost 預設 5 px/mm 的重映射會再丟掉一半資訊，所以 B 需要更高 DPMM 的重映射（§7.6）。

### 2.4 為什麼 coupon 不走 swiftray 出 fcode

coupon 含 roll 後跨 ±53.39 mm，超過 `galvo_block` 預設 100×100，會被切成多個 block，接縫誤差會混進量測。`galvo_exec` 沒有分塊，整張 coupon 在同一個龍門站位打完。

## 3. Goals & non-goals

**Goals**

1. A：一鍵打出工廠流程的振鏡 coupon 與 8 個 L，筆畫方向、roll、順序與文件一致；coupon 套用畫面上的參數，不需先存檔。
2. B：一鍵用雷射頭相機拍完 coupon 與 L 框區域，拼成床座標影像，使用者看得到拼接結果。
3. C：fluxghost 解算出 scale_x、scale_y、skew、仿射殘差、原始誤差、validation 誤差、L 框比例尺與自我檢查、振鏡場心在 L 框中的位置。
4. D：結果顯示在對話框內；一鍵套用建議的 scaleX / scaleY 到畫面參數；輪次歷史留在對話框內供下一輪用割線法修正斜率。
5. E：一鍵打三個 100 mm 方框配龍門移動，給最終目標一個直接檢查。
6. 每顆按鈕自理串聯／解聯與相機模式，使用者不需要記順序。
7. 龍門往負方向移動的 backlash 補償，用旗標 gate 住。
8. CO2 振鏡與 MOPA 振鏡走同一條流程、同一套程式；差異只在對話框傳進來的 `module`：串聯模式、`head` id 與脈衝、設定鍵、預設模組偏移與軸向。

**Non-goals**

- 平整度量測、對焦（SP100、Z 軸）、振鏡 X/Y offset 的能量平衡。工廠流程的「準備」段，之後另開。
- 9×9 網格表（`set_gridcor`）：bsl 沒有實作，工廠文件也列為未完成。
- 正式版的分步驟彈窗、i18n（dev 區塊沿用未翻譯慣例）。
- swiftray 的 tile 順序變更。
- 解算的第二種做法「原始影像上找特徵、逐點經相機模型映射」，只在 §12 當 B 失敗時的備案。

## 4. Scenarios

**S1 完整一輪**：工程師放一張 ≥ 180×180 mm 深色紙，開振鏡設定，填場心落點，依序按「打 coupon」「打 L 框」「拍照」「解算」。畫面顯示 L 框自我檢查通過、node 81 個、scale_x / scale_y / skew 與殘差。按「套用建議」，畫面上的 scale 改了，換一張紙再按「打 coupon」開始第二輪。

**S2 試參數不存檔**：改畫面上的 scale / bulge / skew / trapezoid，不按儲存，直接按「打 coupon」，打出來的是改過的參數。按儲存才留在機器。

**S3 掃描機交叉驗證**：S1 打完的紙拿去平台掃描機跑工廠腳本，數字應與 Beam Studio 解算一致到工廠文件的量測雜訊等級（0.012 mm）加相機誤差；差異就是相機路徑的誤差。

**S4 拼接驗證**：修正值收斂後按「拼接驗證」，三個 100 方框打完，目視或拿尺看三條共用邊是否共線。

**S5 中途失敗**：coupon 途中卡回 `fail`、授權讀回不是封閉域、拍照被 ESC 取消、解算回 L 框自我檢查不過，畫面各自跳錯並說明這張紙作廢或哪一格沒拍到；氣泵關閉、相機模式結束；頭的串聯狀態維持當下。

## 5. Acceptance criteria

**AC1 入口**：`localStorage['fhx2galvo-dev'] = 'true'` 且文件機型為 HEXA G 時，振鏡設定的 CO2 振鏡與 MOPA 振鏡兩個對話框都出現「校正（dev）」區塊，內容與操作完全相同；旗標關閉時都不出現。區塊內每個動作都用對話框的 `module`，不寫死 `GALVO_CO2`。MOPA 對話框在機器未裝 MOPA 頭時，按任何振鏡按鈕都在串聯那步得到機器回的 `error: not a mopa head` 並跳錯，不會打到 CO2 頭。

**AC2 場心落點與站位**：X、Y 兩個輸入（床座標 mm，Y 向下），預設 100 / 100。唯讀顯示「龍門站位 = 落點 − 模組偏移」，模組偏移是**這個對話框那顆頭**的 `toolhead_shift`（CO2 與 MOPA 各自一組，所以同一個落點在兩個對話框算出的站位不同）。站位超出 `getGantryTravelRange` 時 A 與 E 的按鈕停用並顯示原因。

**AC3 打 coupon**：依 §7.3 執行；紙上有 §7.2 全部 102 個特徵；用工廠解算跑，node 81 個、L 頂點 ≥ 6、identity 可判方向。卡回 `fail`、授權讀回不符、站位移動失敗時跳錯誤並指出失敗的步驟。

**AC4 打 L 框**：依 §7.4 執行；8 個 L 頂點在場心落點 ±70 的方框上，角上兩臂朝中心、邊中點在自己所在軸上那一臂朝 +；趟數 n 時每趟前 `$H`，n 趟疊在同一位置。

**AC5 拍照**：依 §7.6 執行；進度顯示 i/n；ESC 可取消，取消在當前那格拍完後生效；完成後對話框內顯示拼接影像縮圖，影像為 20 px/mm、覆蓋場心落點 ±90 mm，並列出被行程擋住而偏離瞄準點或整格留白的格子（不中止）；相機傳回的影像尺寸不是格寬 × 20 px/mm 時整次失敗並說明是 fluxghost 太舊。拍完後每個階段的影像都留在執行 fluxghost 那台電腦的 `~/Downloads/fluxghost-frames/<時間>/`：原始 JPEG、校正後的 remap、各格裁下的 patch、拼接圖與 capture.json；對話框顯示該資料夾。

**AC6 解算**：依 §7.8 執行；成功時顯示 §7.9 的全部輸出量；L 框自我檢查不過時顯示「尺規無效」與原因（頂點數、跨距、RMS），不顯示尺度數字。

**AC7 套用建議**：按下後畫面上的 x.scale、y.scale 變成 §7.9 的建議值，其他六項不動；輪次歷史表多一列；對話框關閉不儲存時機器上的 `galvo_co2` / `galvo_mopa`（依對話框模組）不變。

**AC8 拼接驗證**：依 §7.10 執行；三個方框左上角分別在場心落點 + (−50, −50)、(+50, −50)、(+50, +50)；第二個方框左邊與第一個右邊重合、第三個上邊與第二個下邊重合。

**AC9 串聯與相機模式自理**：五顆按鈕以任意順序按，都不需要先按 Connect / Disconnect 或開預覽；進行中互斥（共用 `pending`）。

**AC10 backlash 旗標**：`fixBacklash` 開啟時，任何讓龍門在某軸往負方向的定位動作先走到「目標 − 5 mm」再正向走到目標；關閉時直接走。旗標在區塊內有勾選框，存本機。

**AC11 既有行為**：Mark / Preview / Move / Dot / Connect / Disconnect 的 payload 不變；相機預覽（`require_frame` 不帶選項）的輸出影像不變。

**AC12 一輪時間**：A 到 D 不含換紙，串聯／解聯各一次，在 10 分鐘內。

## 6. Must not change

| 共用檔案 | 改動 | 呼叫者 — 必須維持的行為 |
|---|---|---|
| `helpers/api/control.ts` `rawMove` | 新增可選 `s` | `camera/common/moveLaserHead.ts`、`LaserHeadFisheyeCalibration.tsx` 的預覽外框、`SolvePnP.tsx`，共 11 處 — 不傳 `s` 時送出字串逐字相同 |
| `helpers/api/control.ts` | 新增 `controlTaskMainboard`（送 `mb_exec <gcode>`） | `setGalvoLaserMode` / `galvoExec` / `galvoStop` / `getControlTaskResult` / `stopControlTask` 不受影響；`useWaitAnyResponse` 配對邏輯不改 |
| `helpers/api/swiftray-control.ts` | 新增 `controlTaskMainboard` 丟出不支援 | Promark 經 swiftray 的流程不受影響 |
| `interfaces/IControlSocket.d.ts` | 新增方法宣告 | 兩個實作都補 |
| `helpers/device-master.ts` | 新增 `controlTaskMainboard` 轉呼叫 | 其他 galvo 轉呼叫（`:1175-1190`）不變 |
| `helpers/device/galvoExec.ts` | 新增 `galvoPaths`、`mainboardLine`、`awaitControlTaskResult`（`awaitGalvoResult` 改為包它）；`galvoFrame` 新增可選 `size` | `GalvoSettings.tsx` 的 `galvoFrame` / `galvoGoto` / `galvoDot` payload 逐鍵相同（不傳 `size` 時 rect 仍是整個 workarea）；`galvoLaserMode.ts` 的 `resetGalvoGoto` 不變 |
| `helpers/api/camera.ts` | `sendOneShot` / `oneShot` 新增第二參數 `dpmm` | `getLiveStreamSource` 的輪詢、`device-master.takeOnePicture` 不傳時送 `require_frame` / `require_frame l` 原字串 |
| `helpers/device-master.ts` | `TakePictureOptions` 加 `dpmm`，`takeOnePicture` 透傳給 `oneShot` | `Bb2Hx2PreviewManager.ts:347`、`Beamo2PreviewManager.ts:254,264`、`AdorPreviewManager.ts:88` 與所有 `takeOnePicture()` 呼叫 — 不傳時行為不變 |
| `actions/camera/preview-helper/BasePreviewManager.tsx` | `getPhotoAfterMoveTo(x, y, opts?)` 透傳 `opts` 給 `getPhotoFromMachine` | `RegionPreviewMixin.regionPreviewAtPoint`、`BeamPreviewManager.ts:236`、`retakeContourPreview.ts:119`、`DiodeCalibration`、`CameraCalibration` 三步 — 不傳時行為不變 |
| `actions/beambox/preview-mode-controller.ts` `getPhotoAfterMoveTo` | 多一個可選 `opts` 透傳 | 既有六處呼叫者不傳 — 行為不變 |
| `interfaces/PreviewManager.d.ts` | `getPhotoAfterMoveTo` 簽名加可選 `opts` | 實作它的 manager 都只多一個可選參數 |
| `helpers/api/open-cv.ts` | 新增 `solveGalvoCoupon` | `detectBlobs` / `imageContour` / `sharpen` 與 `need_upload` 重送流程不變；Print and Cut 不受影響 |
| `components/dialogs/promark/GalvoSettings.tsx` | 加入新區塊、`GalvoAction` 多五個值 | 既有六個 handler、`run()` 的狀態檢查、關閉時 `releaseGalvoControl` 不變 |
| fluxghost `api/camera.py` `require_frame` | 新選項 `d<dpmm>` | `require_frame` / `require_frame l` 的輸出與現在逐位元組相同（`preview_downsample`、低解析度路徑不改） |
| fluxghost `utils/camera/perspective.py` `apply_perspective_points_transform` | 新 kwarg `dpmm=DPMM` | 所有既有呼叫者不傳 → 輸出不變 |
| fluxghost `api/fisheye_camera_mixin.py` `handle_fisheye_image` | 新 kwarg `dpmm=DPMM`：v1 參數轉給 `apply_perspective_points_transform(dpmm=)`，v2/3/4（HEXA 用的 V4）轉給 `corner_detection/apply_points.py` 既有的 `perspective_pixel_per_mm=` | 不傳時兩條路徑輸出不變；v2 的 150 px padding 是像素單位，不隨 dpmm 縮放 |
| fluxghost `api/opencv.py` | 新增 `solve_galvo_coupon` | 既有四個指令不變；`cmd_mapping` 只加不改 |
| BeamOS `galvo_exec.py` `build_records` | 新增 `paths` 分支；`estimate_ms` 計入 ENABLE/DISABLE 的 moDelay（本檔送 0，估值不變） | `goto` / `frame` / `dot` 與 `_prologue` 不變（測試有 snapshot） |
| BeamOS `control_task.py` | 新增 `mb_exec` 指令與 `mb_exec_lines` 狀態；`on_mainboard_message` 在 mb_exec 進行中先交給它 | `galvo_mode` / `mopa_mode` / `default_mode` / `galvo_exec` / `get_result` / `stop` / `MB:` 直通不變；非 mb_exec 時主板訊息走原路 |
| `interfaces/IStorage.d.ts` | 新增 `'galvo-fix-backlash'?: boolean` | 其他鍵不變 |

不碰：`galvoLaserMode.ts`、`galvoConfig.ts`、`moduleOffsets.ts`、`gantryTravelRange.ts`、`galvo-dev-settings.ts`（backlash 旗標不放這裡，見 §7.11）、`RegionPreviewMixin.ts`、Print and Cut 的任何檔案（只引用 `previewSession.ts`）。

新增檔案（不在上表）：`helpers/device/galvoCoupon.ts`（+spec）、`helpers/device/galvoCalibration/{backlash,mark,capture,captureGrid,solve}.ts`（backlash / captureGrid / solve 有 spec）、`components/dialogs/promark/GalvoCalibrationBlock.tsx`；BeamOS `fluxmonitor/controller/tasks/mb_exec.py`（+tests）。

## 7. Design

### 7.1 UI：「校正（dev）」區塊

放在 `GalvoManualBlock` 之後，同樣的 `blockStyles.block` + `full-row`，標題「Calibration (dev)」。由上到下：

- 場心落點 X / Y（`UnitInput`，mm，預設 100 / 100）；唯讀一行 `Gantry station: (x, y)`，超出行程時紅字並停用 A、E 的按鈕。
- 第一列按鈕：**Mark coupon**（功率、速度沿用上方「標記參數」，說明註明建議 25% / 500 mm/s）、**Mark L frame**（旁邊 Power % 預設 3、Passes 預設 2）。
- 第二列：**Capture**、**Solve**、**Apply suggestion**。Solve 要有拍完的影像才啟用，Apply 要有解算結果才啟用。
- 第三列：**Stitch test**（用標記參數的功率、速度）。
- 「Fix backlash」勾選框，預設開。
- 結果區：拼接影像縮圖（可點開大圖）、解算輸出表（§7.9）、輪次歷史表（輪次、送出的 scaleX / scaleY、量到的 scale_x / scale_y / skew / 殘差 RMS）。
- `GalvoAction` 新增 `'coupon' | 'lframe' | 'capture' | 'solve' | 'stitch'`，全部走既有 `run(action, label, body)`；區塊是 `GalvoCalibrationBlock.tsx`，由 `GalvoSettings` 傳入 `run`、`pending`、`config`、`offsets`、`parameters` 與 `onApplyScales`。進行中的步驟文字顯示在按鈕列下方。
- 區塊從對話框 props 拿 `module`、`offsets`、`config`，不自己讀機器；串聯、`galvoPaths`、`galvoFrame`、建議值、輪次歷史全部以這個 `module` 為準。MOPA 對話框的區塊與 CO2 的是同一個元件，沒有分支 UI。建議標記參數的說明文字依模組顯示（CO2 25% / 500 mm/s；MOPA 待實測，決策 12）。

### 7.2 圖樣規格（由工廠文件轉寫）

座標為振鏡場座標 mm，場心為原點，+X 向右、+Y 向下，與 `galvoExec.ts` 慣例一致；軸向鏡像由卡上的 invert 旗標處理（決策 1：用 Beam Studio 的預設，CO2 invertX = invertY = true、MOPA 全 false，`galvoConfig.ts:72-73`），所以同一份路徑在 MOPA 頭打出來是 CO2 的兩軸鏡像。產生器不因頭別改變輸出；C 階段用畫面上的 invert 旗標當方向初值，identity 小環確認。pitch 11，fWorkSize 110。

| 特徵 | 數量 | 中心 | 形狀與筆畫 |
|---|---|---|---|
| node | 81 | x、y 各取 {−44, −33, …, +44} | 圓 r 1.25：36 邊形，從圓的 −Y 端起，第一段朝 +X。四臂：左 (−4.5, 0)→(−2.0, 0)、右 (+2.0, 0)→(+4.5, 0)、上 (0, −4.5)→(0, −2.0)、下 (0, +2.0)→(0, +4.5)，一律朝 +X 或 +Y 打 |
| discovery | 12 | (±49.5, ±49.5)、(±5.5, ±49.5)、(±49.5, ±5.5) | X 形四臂，從 r 1.5 到 3.5。(1,1) 對角線上的兩臂朝 (+,+) 打，(1,−1) 對角線上的朝 (+,−) 打 |
| validation | 8 | (±5.5, ±5.5)、(±27.5, ±27.5) | 只有圓 r 1.25 |
| identity | 1 | (−44, −51) | 圓 r 0.5 |

**roll**：每一筆前後各加 2 mm 關光段，沿該筆自己的方向。圓的起點與終點切線都是 +X。

**順序**：node 從 y = −44 那列開始一列一列蛇行，偶數列 −X→+X、奇數列反向 → discovery → validation → identity → 最後 jump 回 (0, 0)。

**極值**：49.5 + 3.5/√2 + 2/√2 = 53.39 mm，在 ±55 內；產生器的 spec 要斷言。

產生器 `helpers/device/galvoCoupon.ts` 匯出 `buildCouponPaths(): GalvoPoint[][]`（純函式，折線不含 roll，roll 由機器端 `lead_mm` 加）、`couponFeatures`（每個特徵的種類與中心，給 C 階段當期望座標）、`buildLFrameMarks(center)`（8 個 L 的 X 臂端 → 頂點 → Y 臂端），以及各尺寸常數。

### 7.3 A-1「打 coupon」序列

全程留在 control_task。

1. `connectGalvoHead(module)`：CO2 走 `galvo_mode`、MOPA 走 `mopa_mode`，兩者的機械串聯動作相同，只差雷射選擇與啟用位元。已串聯時機器只重送授權位元，這同時處理工廠文件的「sleep 會清掉授權」。MOPA 頭未安裝時這步就失敗，後面不執行。
2. 站位移動：`mainboardLine('G1F<cap>X<sx>Y<sy>')`（經 `controlTaskMainboard` 送 `mb_exec`，§7.5b），`cap` 取 `getGalvoHeadConnectedFeedrate()`；再送 `M137P0`，它在前一個移動完成後才回 ok（協定 §10）。`fixBacklash` 開啟時依 §7.11 先過衝；串聯後龍門位置未知，所以兩軸都過衝。站位超出 `getGantryTravelRange` 時在串聯前就拒絕。
3. 氣：`M136P312Q2`、`M136P3Q1000`（決策 3 未定，預設開，常數 `COUPON_AIR_ASSIST`；MOPA 頭是否共用同一個 galvo 氣閥見決策 12，先照 CO2 做）。
4. `galvoPaths({ config, module, power, speed, paths: buildCouponPaths() })` → `awaitGalvoResult`。payload 的 `head` 就是 `module`（12 / 13），機器端 `pulse_for` 依此選 CO2 或 MOPA 脈衝，Beam Studio 不另外處理功率換算。
5. 授權讀回：`mainboardLine('M136P311')` 拿到主板在 ok 之前回報的 `Open laser: …, Enclosed laser: …`，Enclosed 不是 on/1/enabled 之類就丟錯「這張紙作廢」。確切字串待實機看一次（§13）。
6. `M136P4`、`M136P312Q3`。4、5 任一失敗也要走到這步。
7. 頭維持串聯、龍門留在站位。

### 7.4 A-2「打 L 框」序列

1. `ensureGalvoHeadDisconnected(model, { onSlow })`，沿用「解聯中」進度提示。
2. `enterRawMode` → `rawHome` → `rawStartLineCheckMode` → 依序 `rawGcode` 送 `M136P173`、`M136P259Q15`、`M136P310Q0`、`M136P311Q1`（CO2 工作出光的四條，與 player 開 CO2 工作相同順序，韌體確認；見 §11 決策 17）→ `rawSetAirPump(true)` → `rawSetLaser({ on: true, s: 0 })`（`M3S0`；工廠腳本用 `M4`，差別只在加減速期間的功率是否隨速度變，L 臂 8 mm 在 F1200 下可忽略，先用既有 API）。
3. 以場心落點 C 為中心，8 個頂點 V = C + {(±70, ±70), (0, ±70), (±70, 0)}，臂長 8。每個 L：`rawMove({ f: 6000, s: 0, ...X 臂末端 })` → `rawMove({ f: 1200, s: S, ...V })` → `rawMove({ f: 1200, s: S, ...Y 臂末端 })`。S = power% × 1000（決策 2）。角上的 L 兩臂朝中心；邊中點的 L 在自己所在軸上那一臂一律朝 +，另一臂朝中心，例如 (0, +70) 是 X 臂 +8、Y 臂 −8。這個不對稱是刻意的，不要改。S0 的定位移動在 `fixBacklash` 開啟時依 §7.11 過衝。
4. 每趟前 `rawHome`，共 `passes` 趟。
5. `rawSetLaser({ on: false })` → `M136P311Q0`、`M136P174` → `rawSetAirPump(false)` → `rawEndLineCheckMode` → `rawLooseMotor` → `endSubTask`。任何失敗都在 finally 做這段，每步各自 catch。8 個 L 的三個點有任何一個超出行程就在解聯前拒絕。

### 7.5 機器端：`galvo_exec.py` 新增 `op: "paths"`

```
args: {
  head, optics, power, speed, jump_speed?,   # 既有
  op: "paths",
  paths: [[[x, y], ...], ...],               # 每條至少 2 點，場座標 mm
  lead_mm: 2.0                               # 可省略，預設 2
}
```

展開（每條折線 P0…Pn，d0 = 首段單位向量，dn = 末段單位向量）：

```
JUMP_ABS   P0 − lead·d0
DISABLE_LASER 0
MARK_ABS   P0
ENABLE_LASER 0
MARK_ABS   P1 … Pn
DISABLE_LASER 0
MARK_ABS   Pn + lead·dn
```

全部折線後 `JUMP_ABS 0 0`，再接既有尾端 `DISABLE_LASER`。前導沿用 `_prologue`。preview 分支與 `frame` 相同：逐點 jump、不 arm。機器端不知道 coupon，只收折線。

### 7.5b 機器端：`control_task.py` 新增 `mb_exec <gcode>`

`MB:` 直通在 TCP 上沒有回覆（§2.2），所以加一個有回覆的版本。契約：

- 請求 `mb_exec <一行 gcode>`，不含換行；送主板時補 `\n`。空行或多行回 `fail BAD_ARGS`。
- 立即回覆 `ok`（已送出）、`error busy running`（序列或 galvo 在跑）、`error: not a galvo model`。
- 完成由 `get_result` 輪詢：`wait` → 主板 ok 後 `ok <ok 之前的其他行以 | 接起來>`（沒有就是 `ok`）；主板 `error…` / `ALARM…` → `fail <那一行>`，不斷線、不送 `\x18`。
- 實作走既有 `_start_mode` / `on_mainboard_ok` / `last_result`，期間 `running` 為真；`stop` 可中止。純邏輯在 `mb_exec.py`（`parse_line` / `reply`），有單元測試；`control_task.py` 的接線只過 `py_compile`，要上機驗（§13）。

Beam Studio 端 `galvoExec.mainboardLine(gcode, action)` 把「送 mb_exec → 等 get_result ok → 取 ok 後面的文字」包成一個呼叫。

### 7.6 B「拍照」序列

目標：一張床座標 mm、20 px/mm 的拼接影像，覆蓋 C ± 90 mm（含 L 框與外緣），每個像素來自某張照片的中央區域。

1. `ensureGalvoHeadDisconnected`。相機在雷射頭上，頭串聯時可以拍但要降速，而且 L 框之後本來就是解聯狀態。
2. `ensureRegionPreview`（引用 Print and Cut 的 `previewSession.ts`，內含 `ensurePreviewMode`），用 `previewModeController.previewManager` 的 `getPreviewPosition` 與 `getPhotoAfterMoveTo`。
3. 拍照格：以 C 為中心，間距 `CAPTURE_PITCH_MM = 40`，覆蓋 C ± 90 → 每軸 5 點（C − 80 … C + 80），共 25 張，蛇行。每一格：
   - 瞄準點：HEXA II 頭相機斜看噴嘴左側（區域預覽格 `hx2GalvoPerspectiveGridWide` 是頭的 x −260..0、y 0..145），畫面靠近頭那一側解析度最高、校正最準，遠側最斜。所以不是把該格放在照片正中央，而是放在離格子靠頭那一邊 `CAPTURE_AIM_INSET_MM = 60` mm 處（y 取格子中線）：`captureGrid.ts` 的 `captureAim(grid)`；對話框有「Aim inset」欄位可以不重 build 就掃不同值。
   - 龍門位置：`planTile(point, grid, travel)` = 該格 − 瞄準點，只用 `getGantryTravelRange` 夾在行程內（**不用** `getPreviewPosition` 的夾法：預覽為了把整張照片留在床內，會把相機推到該格右邊 130 mm 以上，左半場每一格的 patch 都落到畫面最斜的遠側）。被夾住的量是 `shift`，該格在照片裡的位置就是瞄準點像素 `anchor` − shift。
   - `getPhotoAfterMoveTo(cx, cy, { dpmm: 20 })` 取回 20 px/mm 的透視校正影像（§7.7）；影像是整個格子的重映射，尺寸必須等於格寬 × 20（`expectedPhotoSize`），差超過 2 px 就整次失敗並指出是 fluxghost 太舊，因為 5 px/mm 的舊影像拼起來尺度差四倍、L 一定找不到。
   - 從 anchor − shift 處裁 `PATCH_MM = 50` 見方（`patchSource(shift, photo, { anchor })`；間距 40 所以相鄰格各重疊 5 mm），`drawImage` 到離屏 canvas 上該格的床座標位置。超出照片的部分留白；偏離瞄準點超過 5 mm 或整格不在照片內時以 `onWarning` 回報、對話框列出，不中止（§11 決策 18）。後貼的蓋前貼的。
   - 進度 i/25，ESC 設取消旗標，當前格完成後停。每格的龍門位置、shift、anchor、裁切矩形都記下來，拍完連同拼接圖送 fluxghost `save_galvo_capture` 留底（§7.7）。
4. 離屏 canvas 3600×3600 轉 PNG blob，存對話框 state；縮圖顯示在結果區。
5. `endPreviewMode`。

`CAPTURE_PITCH_MM` / `PATCH_MM` / `CAPTURE_HALF_SPAN_MM` 是 `galvoCalibration/captureGrid.ts` 的常數，拍照點數由它們算出（每側 ⌈(90 − 25)/40⌉ = 2，共 5×5）；實機若發現 50 mm 的中央區域仍不夠平，改小間距即可，拍照張數跟著變。

### 7.7 fluxghost：高解析度重映射 `require_frame d<dpmm>`

`api/camera.py` 的 `require_frame` 目前接受無參數或 `l`。新增 `d<dpmm>`（例如 `d20`，須為正整數，壞參數視同無參數）：這一張影像走 `handle_fisheye_image(dpmm=20)`，v1 參數轉給 `apply_perspective_points_transform(dpmm=)`（`unit_length = dpmm * 10`），v2/3/4 轉給 `apply_points(perspective_pixel_per_mm=)`，輸出尺寸同比例放大。不傳時維持 `DPMM = 5`。20 px/mm 高於原生 5 到 7 px/mm，沒有多出資訊，但不再把原生資訊砍掉一半，而且讓 C 的門檻值（連通區塊大小、環半徑）可以用固定的 mm 轉 px。

Beam Studio 端：`camera.ts` 的 `oneShot(useLowResolution, dpmm)` 送 `require_frame d20`（`dpmm` 優先於低解析度旗標）；`device-master.takeOnePicture({ dpmm })` → `BasePreviewManager.getPhotoFromMachine(opts)` → `getPhotoAfterMoveTo(x, y, opts)` 一路透傳。`preview_downsample` 的 OOM 重試路徑不動：20 px/mm 的全幅輸出約 3200×2000（160×100 mm 視野），與現在的 5 px/mm 相比大 16 倍，記憶體要在實機確認，必要時 B 階段改成只要求 fluxghost 回傳 patch 區域（加 `crop` 參數）。

留底：每一張 `d<dpmm>` 影像 fluxghost 都存在執行它那台電腦的 `~/Downloads/fluxghost-frames/<YYYYmmdd-HHMMSS>/`（`utils/camera/frame_dump.py`）：`NN-raw.jpg` 是機器送來的原始 bytes（含 EXIF 旗標、未校正）、`NN-remap-20ppm.jpg` 是送回 Beam Studio 的校正影像；一次相機連線一個資料夾，一般預覽不存。`FLUXGHOST_FRAME_DUMP=0` 關閉、`FLUXGHOST_FRAME_DUMP_DIR` 改位置。Beam Studio 拍完後把拼接圖與每格的紀錄送 opencv 端點的 `save_galvo_capture <len> <json>`，fluxghost 寫進同一個資料夾：`stitched.png`、`capture.json`（center、grid、aim inset、每格的 point／camera／shift／anchor／rect、警告），並依 rect 從存下的 remap 裁出 `NN-patch.png`——就是拼進去的那些像素。三個階段並排，可以直接檢查 L 與 node 在哪一階段還認得出來、原始圖能不能直接用。失敗（舊 fluxghost、關閉留底）只記 console，不影響拍照。

### 7.8 C「解算」：fluxghost `solve_galvo_coupon`

新增在 `api/opencv.py`，一次性指令，與 `detect_blobs` 同一種收圖方式。

```
→ solve_galvo_coupon <file_length> <json_params>
← {"status": "continue"}
→ <binary PNG>
← {"status": "ok", ...結果 JSON（§7.9）}  或  {"status": "fail", "info": "RULER_INVALID" | "GRID_INVALID", "reason": "..."}
```

`json_params`：

```
{
  "px_per_mm": 20,                       // 名義比例，實際由 L 框決定
  "pitch": 11, "grid": 9,
  "node_r": 1.25, "arm": [2.0, 4.5],
  "discovery": [[49.5,49.5], ...],        // 12 個
  "validation": [[5.5,5.5], ...],         // 8 個
  "identity": [-44, -51], "identity_r": 0.5,
  "l_frame": {"half": 70, "arm": 8},
  "expected_center_px": [1800, 1800],     // C 在影像中的位置
  "invert": [true, true],                 // 畫面上的 field.invertX / invertY，方向初值
  "thresholds": {"galvo_green": 150, "l_frame": [[200, "any"], [160, "red"], ...]},
  "annotate": true
}
```

演算法照工廠文件，含它標明「不要」的做法（每條都在真實掃描上算錯過）：

1. **分離兩種刻痕**：振鏡刻痕用綠色通道 > `galvo_green` 當遮罩；L 框依序試 `thresholds.l_frame` 的「亮度門檻＋非振鏡刻痕」組合，取第一組通過尺規自我檢查的。
2. **尺規（L 框）**：找 6.5–11 mm（× px_per_mm）的連通區塊，兩臂各擬合一條直線，交點當頂點，得到溝槽幾何中心（不要用強度重心：掃描機側光讓橫向溝槽一壁亮一壁暗，重心偏 0.87 px；相機也有自己的照明偏差）。頂點分進 3×3 格得名義座標 −70／0／+70，最小平方擬合 px = A·mm + b，每 mm 像素數是 A 兩欄的長度，X、Y 各一個。每次只剔除殘差最大的一個頂點，直到殘差 ≤ 0.5 mm，最少留 6 個。**自我檢查**：頂點最大跨距在 197.99 mm 的 2% 內、擬合 RMS < 0.5 mm；不過就回 `RULER_INVALID`，不算尺度。
3. **node 中心**：用徑向分布找環（不要用填洞判斷：筆畫不一定閉合，曾一次丟掉 81 個裡的 53 個）。用兩兩向量建格子、依方向分群（不要依長度：兩軸尺度不同時長度窗會把半格對角的 validation 圓包進來）。用 identity 小環定方向：找 (−44, −44) 是哪一角、哪個格子軸對應 Y，小環在角落外側 7/11 格。每個 node 在預測位置用橢圓擬合求中心（兩軸尺度不同時圓會變橢圓，不完整的環取重心會偏）。
4. **仿射擬合**：p = 像素 ÷ 各軸 px/mm。對指令座標 c 做最小平方 p_k = L c_k + t，L = R U（QR 分解，R 旋轉、U 上三角且對角為正）。scale_x = U11、scale_y = √(U12² + U22²)、skew = atan2(U12, U22)。R 與 t 是紙的姿勢，拿掉。
5. **validation**：8 個不進擬合的圓，分別用「只有仿射」與「仿射＋雙線性內插」預測，報內插誤差。
6. **場心位置**：另外保留 L 框完整的 px→mm 轉換，算振鏡原點在 L 框座標系中的位置，這就是「場心相對噴嘴」的量測值，與 `toolhead_shift` 比對。
7. `annotate` 為真時，JSON 之後再送一張標註圖（偵測到的頂點、node、殘差向量）。

實作（`fluxghost/utils/camera/galvo_coupon.py`）與上面的差異：L 框搜尋限制在以 `expected_center_px` 為中心、切比雪夫距離 59–82 mm 的環狀 ROI 內（相機能不能靠顏色分離未知，所以加幾何限制），用到的頂點 < 8 且尺規原點與宣告中心差 > 2 mm 時以尺規原點重搜一次；node 像素用完整的 `A⁻¹(px − b)` 轉成 L 框 mm，不是各軸除以 px/mm，所以拼接影像本身的旋轉與非等向比例不會混進 skew；建不出 9×9 格或 node < 6 回 `GRID_INVALID`。`invert` 的語意是：`[true, true]`（CO2 預設）時 +X 沿影像 +x、+Y 沿 +y，旗標不同則鏡像該軸，只在找不到 identity 小環時使用（決策 14）。

合成測試：用 §7.2 的幾何在 Python 端渲染一張 20 px/mm、已知仿射（例如 scale 1.02 / 0.98、skew 0.3°、旋轉 5°）的影像，解算要回到 0.1% 與 0.02° 內；這個測試不需要實機，也是 `ws_smoke` 的一個案例。

### 7.9 C 的輸出與 D「套用建議」

| 輸出量 | 定義 | 畫面顯示 |
|---|---|---|
| `ruler` | px/mm X、Y；用到的頂點數；擬合 RMS | 自我檢查通過／不過 |
| `nodes_found` | 81 個裡找到幾個 | 少於 70 顯示警告 |
| `scale_x`, `scale_y` | 實際 mm ÷ 指令 mm | 1.0000 代表尺度正確 |
| `skew_deg` | 兩軸夾角偏離 90° | 正交度 |
| `affine_rms`, `affine_max` | (p − Lc − t) 轉回振鏡座標 | 非線性畸變 |
| `raw_rms`, `raw_max` | (p − t) 轉回後減 c，保留尺度與 skew | 打點離指令位置多遠 |
| `validation_affine`, `validation_bilinear` | 8 個驗證圓的誤差 | 內插誤差 |
| `field_center_mm` | 振鏡原點在 L 框座標系的位置 | 與這顆頭的 toolhead_shift 的差 |
| `rotation_deg`、`mirrored`、`orientation` | 振鏡軸相對 L 框的角度（對應 `field.angle`）；det L < 0；方向判定來源（identity / invert）與是否符合 invert 先驗 | 實作多回的，表外 |

**建議值**：

- scaleX_new = scaleX_old − (scale_x − 1) / 0.007753（工廠文件在 CO2 頭、fWorkSize 110 下三點實測，線性）。MOPA 頭的場鏡沒有量過：第一輪借這個斜率，從第二輪起同 scaleY 用割線；輪次歷史依對話框模組各自一份。
- scaleY：卡上編碼未知（文件預測 94.98 卻收斂在 79.3）。第一輪借 scaleX 的斜率；從第二輪起用輪次歷史最近兩輪的割線斜率 Δscale_y / ΔscaleY。
- 其他六項不自動建議，顯示 skew 與殘差讓人判斷；旋轉放 `field.angle`，paralleX/Y 只修剪切（文件：資料決定不了兩者各自是多少，只有差是物理量）。

「Apply suggestion」把 x.scale、y.scale 寫到對話框 `config` state（不是機器）；輪次歷史在 Solve 時多一列，`sent` 記的是按「Mark coupon」當下畫面上的 scale（不是 Solve 當下的）。使用者按儲存才寫機器。建議值的純函式是 `galvoCalibration/solve.ts` 的 `suggestScales`，割線斜率只在 0.001–0.1 之間才採用，否則退回借用。

### 7.10 E「拼接驗證」序列

1. `connectGalvoHead(module)`。
2. 三個站位：站位₀ = 落點 − 模組偏移 + (0, 0)、站位₁ = + (100, 0)、站位₂ = + (100, 100)。每個：`mainboardLine` G1 移到站位（§7.11 過衝，第一站兩軸都過衝、之後只過衝往負走的軸）→ `M137P0` → `galvoFrame({ size: 100 })` → `awaitGalvoResult`。三個站位有任何一個超出行程就停用按鈕。
3. 氣與授權讀回同 §7.3。
4. 結果：第一個方框左上角在 C + (−50, −50)，第二個在 C + (50, −50)，第三個在 C + (50, 50)；共用邊重合即通過。本階段用目視或尺量，相機量測列為後續（決策 11）。

### 7.11 backlash 補償旗標 `fixBacklash`

龍門往返相同距離可能有微小位置差。規則：任何**定位**動作（雷射關），若目標在某軸比目前位置小，先走到該軸「目標 − 5 mm」（不低於行程下限），再往正方向走到目標。套用在 §7.3 步驟 2、§7.4 步驟 3 的 S0 移動、§7.10 的站位移動；出光中的 L 臂方向由圖樣決定，不補償；B 階段的相機移動由預覽管理器負責，不補償。

存放：本機 storage 鍵 `galvo-fix-backlash`，預設 `true`，區塊內勾選框。不放進 `galvo-dev-settings.ts`，因為那裡每個鍵都會送進 fcode 給 swiftray。後續 swiftray 的 tile 順序變更（蛇行改一律由左到右，每列第一個 tile 前先退到它左邊的 tile）可以讀同一個鍵；正式版若機構確認不需要，旗標與程式一起移除。

## 8. Data contracts

- **Beam Studio → 機器（control_task）**：`galvo_exec <json>`，新 op `paths`（§7.5）；`mb_exec <gcode>` 立即回 `ok` / `error busy running` / `fail BAD_ARGS`，完成走 `get_result`，回 `ok[ <lines>]` 或 `fail <line>`（§7.5b）；`get_result` 語意不變。
- **機器 → 卡**：list opcode 照 `HX2_GALVO_PROTOCOL.md` §4.2，不新增 opcode。
- **Beam Studio → fluxghost camera**：`require_frame d<dpmm>`（§7.7）。
- **Beam Studio → fluxghost opencv**：`solve_galvo_coupon <file_length> <json_params>`（§7.8），回 JSON，`annotate` 時再一張二進位 JPEG。兩個新字串都進 `cmd_mapping`，不改既有字串。
- **Beam Studio 內部**：`galvoPaths` payload 鍵 `head`（模組 id 12 / 13）、`op`、`optics`、`paths`、`lead_mm`、`power`、`speed`；`rawMove` 新增 `s?: number`（行尾 `S<整數>`）；`takeOnePicture({ dpmm? })` / `getPhotoAfterMoveTo(x, y, { dpmm? })`；`solveGalvoCoupon(blob, params)` 回 `{ result, annotated }`。
- **對話框 state**：`captured: { blob, originMm: [x, y], pxPerMm: 20 } | null`、`solved: SolveResult | null`、`rounds: Array<{ sent: {scaleX, scaleY}, measured: {scale_x, scale_y, skew_deg, affine_rms} }>`。不持久化。

## 9. Performance / packaging

- coupon 指令量：node 70 筆、discovery 28、validation 42、identity 42，合計約 6,390 筆加前導；在 bsl `MAX_BUFFER_LIST_SIZE = 10000` 內，但比 `frame` 大兩個數量級，`control_task._bsl_write` 的 EAGAIN 處理（`control_task.py:458-480`）要實機確認。
- 執行時間：coupon 約 10 秒；L 框兩趟約 1 分鐘；拍照 25 張每張含移動約 5 秒共約 2 分鐘；解算在 3600×3600 影像上預估 5 秒內；串聯／解聯各數十秒。整輪在 AC12 的 10 分鐘內。
- 記憶體：fluxghost 20 px/mm 全幅重映射約 3200×2000×3 = 19 MB 一張，連續 25 張要確認沒有累積；Beam Studio 離屏 canvas 3600×3600 約 52 MB，拍完轉 PNG 後釋放。
- 不新增打包內容；標註圖不存檔。

## 10. Rollout (PR plan)

1. **PR A（BeamOS_NX_backend，分支 `promark-updates`）**：✅ `9085072` `paths` op + `tests/controller/tasks/test_galvo_exec.py`（19 個）；✅ `aa55972` `mb_exec` + `mb_exec.py` + `test_mb_exec.py`（12 個）。`docs/api/galvo-control.md` 已補。未 push。
2. **PR B（beam-studio，A + E）**：✅ 與 PR D 合在同一個 commit（兩者共用 `GalvoCalibrationBlock`）。
3. **PR C（fluxghost，分支 `dev/hx2-g`）**：✅ `86bdf50` `require_frame d<dpmm>`（+ `tests/usage/test_camera_dpmm.py`）；✅ `f2411b9` `solve_galvo_coupon`（`utils/camera/galvo_coupon.py`、合成渲染器 `tests/usage/galvo_coupon_synth.py`、9 個測試、`ws_smoke` 兩個案例，`ALL PASS`）。合成影像的誤差：scale 1e-5、skew 3e-4°、affine_rms 0.003 mm，單張 0.1–0.2 s。未 push。
4. **PR D（beam-studio，B + C + D）**：✅ 同上。
5. 實機驗證順序：PR A+B 打一張紙 → 送掃描機跑工廠腳本（S3 的基準）→ PR C+D 拍照解算 → 比對 → 決定相機路徑是否成立（決策 8）→ 迭代到收斂 → 拼接驗證。
6. 體驗後決定決策 6，再決定正式版 UI 的 PRD 要擴寫本份還是另開。

## 11. Open decisions

1. ~~軸向：工廠文件的量測是 invert 全 false、x_offset 3.0；Beam Studio 的 CO2 預設是 invertX/Y = true、offset 0~~ — **2026-10-28 定案：用 Beam Studio 版本**。identity 小環讓解算仍能判斷方向。
2. ~~L 框 S 值上限：S = 功率% × 控制器 $30，Beam Studio 沒有讀 $30 的流程~~ — **2026-10-28 定案：先假設 1000，實測後再定；最終版大概率不開放用戶自訂**。
3. 氣泵：工廠文件說沒泵就沒氣，但現有振鏡 Mark 流程沒有開氣。預設在 §7.3 開 `M136P312Q2` + `M136P3Q1000`。待確認閥的預設狀態、打紙是否需要氣。
4. ~~站位預設值~~ — **2026-10-28 定案：場心落點預設 100 / 100**。
5. ~~是否只打 coupon~~ — **2026-10-28 定案：coupon 與 L 框都做，各自獨立按鈕，各自處理串聯／解聯**。
6. 正式版 UI：開發期放振鏡設定；正式版傾向沿用相機校正、模組校正的獨立分步驟彈窗。體驗 dev 版後決定。
7. backlash 過衝量 5 mm 與旗標是否進正式版：待機構確認。
8. 拍照路徑：先做「高 DPMM 重映射 + 中央 patch 拼接」（§7.6）；L 框自我檢查過不了時，改成「原始影像找特徵、逐點經相機模型映射到床座標」（§12）。由 S3 的比對結果決定。
9. scaleY 斜率：第一輪借 scaleX 的 0.007753，之後用割線。若兩輪後仍不收斂，改成一次只動 scaleY 做特性化。
10. 相機門檻值：工廠的綠色通道 > 150 與 L 框門檻序列是掃描機的；相機的白平衡與曝光不同，`thresholds` 先開成參數，實機拍一張後定預設值。曝光是否要固定（`v4l2` exposure）一併看。
11. 拼接驗證的量測：目視／尺量先行；若要相機量，拍兩條共用邊各一張 20 px/mm 近拍，量邊的偏移即可，用 §7.8 的直線擬合就能做。
12. MOPA 頭的三個未知數：氣閥 `M136P312Q2` 是否也供 MOPA 頭、打紙的建議功率與速度、scaleX 斜率是否與 CO2 的 0.007753 相近。流程不因此分支，實測後只改常數與說明文字。預設模組偏移 `moduleOffsets.ts:40-42` 兩顆頭都還是佔位，§7.8 第 6 步量到的 `field_center_mm` 可回填。
13. `M136P311` 無 Q 的回報字串：文件寫 `Open laser: …, Enclosed laser: …`，值的寫法未知；目前接受 on / 1 / en… / true / high 開頭，實機看一次後收緊。
14. `invert` 先驗的語意（§7.8）與 20 px/mm 全幅重映射的記憶體：第一張實機 coupon 確認；identity 小環找得到時先驗不會用到。
15. ~~相機 EXIF 方向旗標~~（2026-10-29 決定）：HEXA II Galvo 頭的相機倒裝，機器端只在 JPEG 加 EXIF Orientation=3 不轉像素（`fluxmonitor/hal/camera/orientation.py`）。fluxghost 原本只有預覽路徑套 `exif_transpose`，`camera-calibration` / `camera-transform` / `opencv` 都解到倒轉的像素，相機校正算出的 k/d/rvec/tvec 與預覽不相容。改為所有讀相機像素的端點都走 `utils/camera/general.py` 的 `open_frame`（fluxghost `e26a188`）。在此之前在這顆頭上做的相機校正參數要重做（主點鏡像）。
16. ~~`galvo_exec paths` 的 payload 大小~~（2026-10-29 決定）：coupon 的 JSON 有 66,440 bytes，而 control_task 是 binary mode，每個 recv（≤ 4096、走網路約 1400 bytes）就當一條指令，所以第一段回 `fail BAD_JSON`、其餘段變成垃圾指令並可能吃掉下一條 `mb_exec`，讓收尾卡到逾時。新增裝置端 `chunk_begin <total> <piece>` 分段協定（BeamOS `chunked.py`、`docs/api/galvo-control.md` §2），Beam Studio `control.ts` 的 `galvoExec` 超過 1024 字元時自動分段，每段等 ok。沒有改成多個 list：一張 coupon 仍是一次 TRYLOCK、一份 list。
17. ~~L 框不出光~~（2026-10-29 決定）：第一次實機 Mark L 有移動沒出光。原序列只送 `M136P173`；CO2 從噴嘴出光還需要 `M136P259Q15`、`M136P310Q0`、`M136P311Q1`（韌體確認）。`default_mode` 雖然會送這三條，但頭已停妥時整段跳過，而且離開 control_task 時裝置送 `\x18` 重置主板，所以 raw 模式一律自己送四條，收尾送 `M136P311Q0`、`M136P174`。新增 `deviceMaster.rawGcode(line)`（line-check 感知）。
18. ~~拍照格被相機行程夾住時中止~~（2026-10-29 決定）：實機上有一格被夾超過 5 mm 就整段中止，後面無法進行。改為照片中心到哪就從哪裁 patch，裁不到的留白、記警告不中止，先把整條流程跑完再決定雷射頭相機夠不夠。
19. ~~拍照位置離雕刻區太遠、patch 來自畫面最斜處~~（2026-10-29 決定）：實機第一次完整拍照，25 格 L 頂點全部 0 個。原做法把每格放在照片正中央，而預覽的 `getPreviewPosition` 又會為了讓整張照片留在床內把相機再往右推，左半場的格子都裁自畫面最遠、最斜的一側。改為：瞄準點放在靠頭那一側 60 mm 處（`captureAim`，對話框可調）、龍門只夾行程不夾床（`planTile`），並檢查回傳影像尺寸等於格寬 × 20 px/mm（舊 fluxghost 回 5 px/mm 影像時尺度差四倍，L 必然找不到）。瞄準點該放哪沒有量測依據，是實機觀察「靠頭那邊比較準」；用 Aim inset 掃過再定。
20. ~~每個階段的影像沒有留底~~（2026-10-29 決定）：fluxghost 把每張 `d<dpmm>` 影像的原始 JPEG 與校正後影像存到 `~/Downloads/fluxghost-frames/<時間>/`，Beam Studio 拍完把拼接圖與每格紀錄送 `save_galvo_capture`，fluxghost 再依紀錄裁出每格 patch（§7.7）。方便逐階段看 L 與 node 的辨識狀況，也看原始圖能不能直接拿來用（§12 風險「改走原始影像」）。
21. ~~第二輪 L 框又不出光~~（2026-10-29 決定，待驗）：第一輪（剛從 default_mode 退出）有出光，第二輪（頭已停妥、直接進 raw）動了但似乎沒出光。差別是第一輪結束時送了 `M136P174` 把 24 V 關掉，第二輪的 `M136P173` 緊接著 `M136P311Q1`，軌可能還沒起來。改為：四條指令在歸零**之前**送（和工作一樣，transient list 在最前面），歸零後用 `M136P311` 讀回 enclosed laser 狀態，是 off 就等 1 s 重送一次，還是 off 就報錯不切；讀不到欄位只記 console。五條指令的回覆都印在 console，第二輪再不出光把那幾行貼回來。

## 12. Risks & follow-ups

**本 PRD 的風險**

- **相機精度不夠**（最大）：原生 5 到 7 px/mm，加上魚眼與透視校正的殘差。拼接影像的誤差有兩種來源：每格內的局部殘差（patch 只取 50 mm 中央以壓低）與格與格之間的相對位置誤差（由龍門定位精度決定，與最終目標「振鏡對齊龍門 mm」反而是同一個參考）。L 框自我檢查是判準。備案：在原始影像上找特徵，用 fluxghost 既有的 `calculate_regional_perspective_points` 逐點映射，不做影像重採樣；代價是解算要重寫成點集版本。
- **修正值無法一次到位**：八項只有 scaleX 有公式；工廠紀錄三輪才收斂。流程設計成迭代，但每輪要換紙、重打、重拍，約 10 分鐘。
- **scale 的中性值**：工廠文件實測 scaleX 歸零值約 86.5，Beam Studio 預設 100 會放大約 10%；第一輪的 coupon 會比較大，仍在卡的指令範圍內，但靠近 110 場鏡的可用邊緣。
- list 一次送 6,400 筆的 socket 行為、串聯狀態下 `MB:` G1 在 `RELEASE_MOTOR` 之後的行為、20 px/mm 連拍 25 張的記憶體，三項都要實機看。
- **coupon 邊緣較淡**（2026-10-29 實機觀察）：第一張 coupon 靠近場域邊緣的 node 比中央淡，與先前打框時看到的一致。先記錄；是否要對邊緣補功率（例如依半徑加權的 power）或接受，等解算的 nodes_found 與 affine_rms 看過再決定。
- **相機校正參數的方向**：本流程的 B「拍照」用預覽路徑（`open_frame` 後上正），所以裝置上的 `fisheye_params.json` 必須是 `open_frame` 之後校的；舊參數會讓拼接影像整張偏掉，L 框自我檢查會先擋下（§11 決策 15）。
- 授權在長時間閒置後掉落：每顆振鏡按鈕都先 `connectGalvoHead`，已串聯時成本只有幾個 M-code。

**後續階段（本 PRD 不含）**

| 項目 | 現況 | 缺口 |
|---|---|---|
| 振鏡 X/Y offset（能量平衡） | `field.offsetX/Y` 已隨 optics 送卡 | 沒有感測器，只能給操作按鈕由人判斷；改 offset 會移動場心，必須排在場鏡校正前 |
| 雷射頭相機校正 | `LaserHeadFisheyeCalibration` 已有 `fhx2galvo` profile | ChArUco 步驟不移動龍門；HEXA G 頭馬達鎖死，要改成解聯後移到工作範圍中心、由使用者搬棋盤格，並改指引文字 |
| 對焦 | 韌體有 `M136P304` 讀 SP100、`M137P184Q` 手動 Z；`rawMoveZRel` 已有 | 本 PRD 的 `controlTaskMainboard` 讓打線、移 Z、讀 SP100 可在同一 session 內做；對焦基準值每種場鏡各存一份 |
| 原始場（identity grid） | bsl 無 `set_gridcor` | 第一輪用目前 manual 值起算；9×9 網格表不進 v1 |
| 機台常數 | 站位、SP100 偏移無存放處 | 場心相對噴嘴 = `toolhead_shift`，§7.8 第 6 步會量出來，可回填模組偏移 |
| swiftray tile 順序 | 蛇行 | 改一律由左到右並退回一格，讀 `galvo-fix-backlash` |

## 13. Test plan

**單元測試（jest，`--runInBand`，只跑受影響路徑）**

- `galvoCoupon.spec.ts`：折線數 81×5 + 12×4 + 8 + 1 = 462；順序（第一條是 (−44, −44) 的圓、蛇行方向、最後一條是 identity）；圓第一段朝 +X、起點在 −Y 端；臂方向規則；含 roll 後 |x|、|y| ≤ 53.4；`couponFeatures` 數量 102。
- `galvoExec.spec.ts`：`galvoPaths` payload；既有 `galvoFrame` / `galvoGoto` / `galvoDot` snapshot 不變。
- `control.spec.ts`：`rawMove` 不傳 `s` 字串不變、傳 `s` 時行尾 `S<s>`；`controlTaskMainboard` 非 control_task 模式丟 `CONTROL_SOCKET_MODE_ERROR`。
- `camera.spec.ts`：`getPhotoFromMachine()` 送 `require_frame`，`{ dpmm: 20 }` 送 `require_frame d20`。
- 拍照拼接的純函式 spec：25 個拍照點的座標與順序；patch 貼圖的床座標 → canvas px 換算；超出行程 5 mm 的判定。
- `open-cv.spec.ts`：`solveGalvoCoupon` 的指令字串與 `fail` 轉成錯誤。
- 建議值的純函式 spec：scaleX 公式；scaleY 第一輪借斜率、第二輪割線；歷史不足兩輪時退回借斜率。
- `GalvoSettings` spec：旗標決定區塊顯示，CO2 與 MOPA 兩個 `module` 都顯示；站位超出行程時按鈕停用；Solve / Apply 的啟用條件；以 `GALVO_MOPA` 開啟時 `connectGalvoHead`、`galvoPaths`、`galvoFrame` 收到的 `module` 都是 MOPA，站位用 MOPA 的偏移算。
- BeamOS：`galvo_exec` 的 `paths` 展開、lead 方向、preview 分支不含 `ENABLE_LASER`。
- fluxghost：合成 coupon 影像的解算回到已知仿射（§7.8）；`RULER_INVALID` 路徑；`require_frame d20` 輸出尺寸；`ws_smoke` 全綠。

**實機**

- `mb_exec`：`mb_exec M136P311` 的 `get_result` 要帶到狀態行；`mb_exec G1…` + `mb_exec M137P0` 要等到移動完成；主板 error 時回 `fail <line>` 且連線不斷。串聯後（`RELEASE_MOTOR` 之後）`G1` 是否會動要先看。

- AC3、AC4：打一張送掃描機跑工廠腳本，node 81 / L 頂點 ≥ 6 / 方向可判。這張也是 S3 的基準。
- AC5：拍完看縮圖，25 格都有內容、L 框 8 個都在。
- AC6：解算與掃描機結果比對 scale_x / scale_y / skew；差異記進 §11 決策 8。
- AC7：套用後重打一輪，scale_x 往 1 靠近；三輪內 affine_rms 到 0.3 mm 等級（工廠八項 manual 的極限是 0.29）。
- AC1、AC3（MOPA）：換到 MOPA 振鏡對話框跑同一輪，coupon 是 CO2 那張的兩軸鏡像，解算方向可判；未裝 MOPA 頭時第一步就收到 `error: not a mopa head`。
- AC8：拼接驗證目視共線；若有尺，量三條共用邊的偏移。
- AC9：五顆按鈕打亂順序各做一次。
- AC10：旗標開關各打一次 L 框，比較頂點位置差。
- S5：中途送 `M136P311Q0` 確認錯誤訊息與關氣；拍照中按 ESC 確認在當格後停止並結束預覽模式。
