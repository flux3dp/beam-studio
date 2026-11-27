# PRD：魚眼相機校正的自動 solve-PnP

本文件為 `auto-solve-pnp.md` 的中文翻譯；英文版為準，程式識別字維持英文。

| | |
|---|---|
| **Status** | 已於 2.7.5 實作，搭配 fluxghost 2.5.9（自動步驟為 flux3dp/fluxghost#128，手動選項起始用的預測位置為 #130），涵蓋 `fbm2`（16 個標記點）、`fbb2` / `fhx2rf` 雷射頭相機與 `ado1`（8 個標記點）。實機（2026-11-19 / 20）：三台 `fbm2`、一台 `fbb2`、一台 `fhx2rf`、一台 `ado1`，各用自己的 `k` / `d`（§11、§12）。未包含：Promark（標記點大小與偵測器，決策 12）與 `fbb2` / `fhx2rf` 廣角相機（決策 1）。待辦：舊後端退回路徑與缺標記點後手動選項的實機測試（§12 T12）、`ado1` 的曝光輪經由 Beam Studio 的實機測試（§7.3.1）、決策 8 |
| **Author** | Beam Studio team |
| **Created** | 2026-11-16 |
| **Target product** | Beam Studio（桌面版 + 網頁版）、fluxghost 2.5.9 |
| **Owner area** | 相機校正對話框、fluxghost 相機校正 API |
| **Related code** | 對話框：`packages/core/src/web/app/components/dialogs/camera/beamo2Calibration/Beamo2Calibration.tsx`、`beamo2Calibration/autoSolvePnP.ts`、`camera/common/autoLocateMarks.ts`、`camera/common/showHighResidualAlert.ts`、`camera/LaserHeadFisheyeCalibration.tsx`、`camera/AdorCalibration/AdorCalibration.tsx`、`camera/common/SolvePnP.tsx`、`camera/common/useCamera.ts`、`camera/common/ProcessingDialog.tsx`、`camera/common/CheckPnP.tsx`；API client：`packages/core/src/web/helpers/api/camera-calibration.ts`；常數：`packages/core/src/web/app/constants/fisheyeCameraConstants.ts`（`bm2PnPPoints`、`getRegionalPoints`）；曝光：`packages/core/src/web/helpers/device/camera/cameraExposure.ts`；雕刻工作：`packages/core/src/web/helpers/device-master.ts`（`doBeamo2Calibration`、`fcode/bm2-calibration.fc`，原始檔 `resources/calibration-tasks/bm2-calibration.beam`） |
| **External repos** | fluxghost：`fluxghost/utils/camera/auto_pnp.py`、`tests/usage/test_auto_pnp.py`、`fluxghost/api/camera_calibration.py`、`fluxghost/utils/camera/corner_detection/find_corners.py`、`corner_detection/match_points.py`、`utils/camera/solve_pnp.py`、`docs/api/camera-calibration.md`、`tests/usage/test_camera_match_points.py`、`tools/ws_smoke.py` |

---

## 1. 摘要

魚眼相機校正的最後一步是 solve-PnP：機器在已知的雷射座標雕刻標記點，相機拍下它們，再把每個標記點的影像位置與它的雷射座標配對，算出相機姿態（`rvec`、`tvec`）。目前的配對是半自動的。fluxghost 提出標記點位置，使用者逐一確認或拖曳。在 beamo II（`fbm2`）上是四個對話框、每個四個標記點。

本 PRD 先在 beamo II 上把配對改為全自動：雕刻一次，以不同曝光拍兩張照片（只有缺標記點時才再拍五張），從「Start Engrave」到最後的檢查之間不需使用者操作。這一步不會自行退回到拖曳：結果只有兩種，校正解出來，或是失敗並說明原因。缺標記點之後，使用者可以重新雕刻，或選擇手動步驟，手動步驟會從已找到的標記點開始（決策 4）。

三個設計選擇決定了其餘部分：

1. **用雕刻本來就有的冗餘。** `fcode/bm2-calibration.fc` 雕刻 16 個標記點，排成 4×4 格點。手動流程一次只用四個。把 16 個全部對同一個平面模型做比對，會多出 8 個以上的點，這才讓剔除離群值成為可能。不需要新的雕刻圖樣。
2. **在床台座標把關，不在影像像素把關。** 相機安裝位置每台不同，所以像素的興趣區域沒辦法抓得緊，而且一定會包含機殼的一部分。把關的依據是每個暗點到床台上標記點位置的距離，以及對平面模型的殘差。兩者都與安裝角度無關。
3. **新增 fluxghost 指令，既有指令不動。** 其他機型的手動流程繼續使用 `solve_pnp_find_corners` 與 `solve_pnp_calculate`，完全不變。

---

## 2. 背景與現況

### 2.1 beamo II 的流程

`Beamo2Calibration.tsx` 的步驟：`[advanced]` PRE_CHESSBOARD → CHESSBOARD（ChArUco，內參 `k`、`d`）→ PUT_PAPER → SOLVE_PNP_INSTRUCTION → SOLVE_PNP_TL / TR / BL / BR → SOLVE_OTHER_PNP → CHECK_PNP。基本模式從 PUT_PAPER 開始，使用已儲存的參數。

- PUT_PAPER 執行 `deviceMaster.doBeamo2Calibration()`（`device-master.ts:970`），送出預先建好的工作檔 `fcode/bm2-calibration.fc`。它在 x = 30 / 130 / 230 / 330 mm、y = 30 / 90 / 150 / 210 mm 雕刻 16 個標記點（`bm2PnPPoints`，`fisheyeCameraConstants.ts:107`）。功率與速度寫死在工作檔裡。
- 每個 SOLVE_PNP_xx 步驟都以寫死的曝光、寫死的像素 `interestArea` 與四個寫死的 `defaultPoints` 繪出 `SolvePnP`（`Beamo2Calibration.tsx:57-83`、`:252-290`）：

  | 分區 | 曝光 | interestArea（x、y、寬、高） |
  |---|---|---|
  | topLeft | 350 | 0, 1000, 2900, 1300 |
  | topRight | 350 | 2700, 1000, 2800, 1300 |
  | bottomLeft | 100 | 1200, 2100, 1600, 1000 |
  | bottomRight | 100 | 2800, 2100, 1600, 1000 |

  會有兩種曝光，是因為照明在工作區下方：影像下半部亮、上半部暗。
- SOLVE_OTHER_PNP（`Beamo2Calibration.tsx:327-360`）用 `getRegionalPoints` 從同樣的 16 個影像點導出左 / 右 / 上 / 下 / 中央分區，並對每一區呼叫 `solvePnPCalculate`。不需使用者輸入。
- CHECK_PNP 疊上格線讓使用者確認，之後儲存 V4 參數。

### 2.2 fluxghost 目前的做法

`cmd_solve_pnp_find_corners`（`camera_calibration.py:276`）：

1. 用 `k`、`d` 對照片去畸變（`get_remap_img`）。不套用 `rvec` / `tvec`；影像沒有做透視校正。
2. 在興趣區域的裁切範圍上執行 `find_blob_centers`（`find_corners.py:39`，OpenCV `SimpleBlobDetector`，閾值 10–200、面積 15–1000 px、圓度 ≥ 0.64）。
3. 用儲存的 `rvec` / `tvec` 投影參考點，再以 `match_projected_points`（`match_points.py:23`）把暗點配到參考點：每一組（參考點、暗點）都是一個平移假設，以圖樣形狀（`REL_SIGMA` 60 px）加上與投影位置的距離（`ABS_SIGMA` 300 px）評分。
4. 比對失敗時，不作聲地回傳投影點（`camera_calibration.py:347`）讓使用者拖曳。

`cmd_solve_pnp_calculate`（`camera_calibration.py:379`）把確認過的點加回畸變，執行 `solve_pnp`，儲存姿態並記錄 `np.mean(projected - imgpoints, axis=0)`（`:400`）。這個值是各軸帶正負號的平均，方向相反的誤差會互相抵銷。它不能當品質指標，也沒有回傳。

### 2.3 為什麼還需要使用者

- 比對分數（`rel_score`、`score_detail`）從不離開 fluxghost，所以前端分不出好的比對與退回的結果。
- 四個共面的點不管對不對，幾乎都能完美擬合出一個姿態，所以單靠四個點偵測不出配錯。
- ChArUco 校正後的姿態先驗是手持校正板的姿態。`defaultPoints` 就是用來取代它的（`SolvePnP.tsx:153`），而它們是在某一台機器上量出來的影像位置。
- 興趣區域刻意抓得寬，仍然會包含機殼零件。小感光元件的暗部雜訊多。兩者都會產生不是標記點的暗點。

---

## 3. 目標與非目標

**目標**

- G1. 在 `fbm2` 以及 `fbb2` / `fhx2rf` 雷射頭相機上，從開始雕刻到最後的檢查畫面之間，使用者什麼都不用做。在 `ado1` 上，只需要在兩個高度之間墊高材料。
- G2. 自動流程中任何地方都不需手動拖曳點。失敗就是一則訊息加上重試。手動步驟留給沒有新指令的後端，以及使用者在缺標記點之後自己選擇時（決策 4）。
- G3. 錯誤的校正絕不會被默默接受：接受的前提是量到的殘差低於門檻。
- G4. 跨機台都能用，不需每台各自的像素常數。
- G5. 比對與把關的邏輯可以用存下來的照片離線測試。

**非目標**

- 更改內參校正（ChArUco）步驟。
- 更改雕刻圖樣，或在執行時產生工作檔（決策 3）。標記點大小是另一個問題（決策 11）。
- 第一版不含 Promark 與 `fbb2` / `fhx2rf` 廣角相機（決策 1 與 12）。
- 移除 `SolvePnP` 元件。其他對話框仍在使用。
- 自動搜尋曝光。每個機型固定兩輪就夠（決策 7）。

---

## 4. 情境

- S1. 基本校正，床台乾淨，白紙蓋住標記點位置：不需操作就解出來。
- S2. 進階校正：ChArUco 步驟之後與 S1 相同，不依賴手持校正板的姿態。
- S3. 標記點太淡、沒放紙，或雕刻後紙被移動：流程失敗並說明原因，提供重新雕刻。
- S4. 雜點（興趣區域內的機殼零件、灰塵、感光元件雜訊）：被剔除，求解仍然成功。
- S5. 拍攝期間開門：照目前的方式處理（`DoorChecker`），之後重新拍攝。
- S6. 後端沒有新指令：執行既有的手動步驟（決策 4）。
- S7. 所有標記點都找到，但與相機參數吻合得不好：由使用者選擇繼續或重新校正相機。

---

## 5. 驗收條件

所有項目的入口：校正選單 → Calibrate Camera，使用 `fbm2`，未特別說明時為基本模式。

**A1（S1）正常流程。** 在床台放白紙，按 Start Engrave，依提示關門。結果：進度對話框跑完拍攝與求解，接著開啟 CHECK_PNP，格線對齊雕刻出的標記點。全程不會出現 `SolvePnP` 畫面。儲存的 `fisheye_params.json` 在全部九個 `WideAngleRegion` 鍵都有 `rvec_polyfits` / `tvec_polyfits`。

**A2（S2）進階。** 執行 Calibrate Camera (Advanced)，兩次拍攝都把 ChArUco 校正板拿在不尋常的角度。結果：與 A1 相同。

**A3（S3）沒有標記點。** 床台放空白紙，在 PUT_PAPER 按 Skip。結果：流程停下並跳出說明原因的警示（找到的標記點少於所需），回到 PUT_PAPER。不儲存任何東西。變化：雕刻後把紙拿走；雕刻後把紙移動幾公分（必須失敗或正確解出，絕不能存下通不過 A6 的姿態）。

**A4（S4）雜點。** 在下列情況重做 A1：(a) 在雕刻的紙旁邊放一張印有標記點大小圓點的紙，(b) 床台燈為正常亮度、室內燈關閉，(c) 室內燈開啟且門蓋視窗不遮。結果：三種情況 A1 都通過，除錯摘要（A7）列出被剔除的暗點。

**A5（S5）門。** 拍攝期間開門。結果：出現既有的開門提示；關門後從第一個曝光重新拍攝，A1 完成。

**A6 準確度。** A1 之後，對雕刻出的標記點做一次全範圍預覽。結果：在變形後的預覽中，標記點落在同一台機器上手動流程所達到的容差內（先量手動流程，兩者都記錄在 §11）。量測方式：以預覽送出的 `h`，對一張標記點的照片執行 fluxghost 的 `calculate_regional_perspective_points` + `apply_points`，並在變形後的影像中定位標記點；再以 Beam Studio 中的目視檢查確認。用來求解的標記點只能給出下限（每個分區姿態都是對它們擬合的），所以真正算數的數字來自之後雕刻在校正標記點之間位置的檢查標記點，以同樣方式量測。

**A7 可診斷性。** 不論成功或失敗，console 每次比對嘗試都有一行 `[auto solve pnp]`：曝光數、比對到的標記點數、由弱候選補上的標記點數、RMS 殘差、失敗原因。fluxghost 以 `[auto_pnp] match: ...` 記錄同樣內容。啟用 fluxghost 除錯影像時，標註過的照片照目前的方式寫出（`debug_imwrite`）。

**A8 重複性。** 在同一台機器上不移動紙，執行 A1 五次。結果：九個分區姿態各次之間的差異在步驟 0（§9）定下的容差內。

**A9（S6）舊後端。** 連到沒有 `auto_pnp_detect` 的 fluxghost（在 fluxghost #128 之前建置）並執行 A1。結果：雕刻後出現 SOLVE_PNP_INSTRUCTION 與四個手動的 SOLVE_PNP_xx 畫面，行為與 main 相同。用有這些指令的後端並遮住一個標記點（A3）：拖曳畫面不得自行出現。警示有「取消」與「手動校正」。取消會留在 PUT_PAPER。手動校正進入 SOLVE_PNP_INSTRUCTION 與手動畫面，畫面上的點已經落在找到的標記點上，被遮住那個標記點的點則在它幾 px 之內；`ado1` 在兩個高度都一樣，而且第一個高度手動之後，第二個高度仍會再跑自動步驟。找到的標記點少於 4 個、或 fluxghost 早於 2.5.9 時，手動畫面的起始方式與 main 相同。

**A10（S7）殘差過高。** 在 fluxghost 把 `R_MAX_MM` 調低（0.1）來強制觸發，再執行 A1。結果：出現警告說明驗證誤差偏大，有兩個按鈕。Continue Anyway 帶著找到的 16 個點繼續到 CHECK_PNP。Calibrate Camera (Advanced) 關閉對話框並從第一步（PRE_CHESSBOARD）開啟進階流程，中間會釋放機器。在進階模式，同一個警告建議重新拍攝校正圖樣，第二個按鈕回到 PRE_CHESSBOARD。關掉警告（Esc）則對話框停在 PUT_PAPER。

**A12 雷射頭相機（`fbb2`、`fhx2rf`）。** 基本模式的 Calibrate Camera，白紙，Start Engrave。結果：沒有拖曳畫面；CHECK_PNP 開啟，格線落在 8 個標記點上。只拍一張就夠時 console 那一行顯示 `exposures: [250]`，第二輪之後顯示 `[250, 100, 500]`，`restoredTo` 是相機原本的曝光。自動曝光原本開啟時（`wasAutoExposure: true`），結束後會再次開啟。在 CHECK_PNP 按 Back 回到 PUT_PAPER。遮住一個標記點：`NOT_ENOUGH_MARKS` 並顯示「7 of 8」，回到 PUT_PAPER。

**A13 Ador。** 基本模式的 Calibrate Camera。結果：第一次雕刻後對話框直接進入 Elevate 步驟；第二次雕刻後儲存參數。兩個高度都沒有拖曳畫面。第二個高度缺標記點：顯示訊息，然後再次進入 Elevate 步驟（第一個高度保留）。之後在較低與墊高的材料高度檢查預覽：Ador 沒有 CHECK_PNP，預覽是唯一的檢查。

**A14 重複使用的紙（8 個標記點）。** 在一張已經有其他機型圖樣標記點的紙上執行 A12 或 A13。結果：使用新的標記點，或是因標記點數量或殘差而失敗；絕不會存下由舊圖樣得出的姿態。

**A11 從 PUT_PAPER 重試。** 經由自動步驟到達 CHECK_PNP，按 Back，再按 Skip（或 Start Engrave）。結果：不會出現機器使用中的提示，自動步驟再次執行；在進階模式仍使用 ChArUco 的結果。`NOT_ENOUGH_MARKS` 失敗之後也一樣。

邊界情況與預期行為：

| 情況 | 預期 |
|---|---|
| 一個標記點被遮住或燒穿 | 以 `NOT_ENOUGH_MARKS` 失敗；訊息列出找到的標記點數（決策 5），並提供手動步驟（決策 4） |
| 第一輪之後仍缺標記點 | 拍第二輪，並對所有照片重新比對；仍不夠就因標記點數量而失敗 |
| 相機沒有回傳影格 | `deviceMaster.takeOnePicture` 會重新連接相機並重拍，最長 30 秒；仍然沒有影格時，自動步驟以 `NO_IMAGE` 結束並跳失敗警示，本身不再多加重試。（`useCamera` 的 2 次重試屬於手動步驟；2026-11-27 依 #1063 的 review 更正） |
| 使用者在拍攝期間關閉對話框 | 拍攝停止，機器釋放（`releaseMachine`），不儲存任何東西 |
| 無法設定曝光 | 以相機當下的曝光拍照並比對；不再嘗試其他曝光，曝光還原為先前的值。標記點不齊時以 `NOT_ENOUGH_MARKS` 結束。自動曝光關不掉時完全不動曝光：照原樣拍一張（2026-11-26 定案，#1063 的 review） |
| 相機自動曝光開啟 | 第一張照片前關閉，曝光值還原之後再開啟 |
| 讀不到自動曝光狀態（舊韌體、逾時） | 視為關閉；流程繼續 |
| 自動步驟內拋出任何錯誤 | `failed_to_calibrate_with_pictures`，回到 PUT_PAPER；這一步絕不會停在轉圈畫面 |

---

## 6. 不可改變的行為

| 動到的檔案 | 呼叫端：必須維持的行為 |
|---|---|
| `helpers/api/camera-calibration.ts`（新增方法） | `SolvePnP.tsx`：`solvePnPFindCorners` / `solvePnPCalculate` 的請求與回應不變 |
| `helpers/api/camera-calibration.ts`（指令排隊，#1063 的 review，2026-11-26） | `cameraCalibrationApi` 的所有呼叫端（含 Promark 在內各機型的校正對話框、`camera-calibration-helper.ts`）：請求與回覆不變，一次只送一個指令（`p-queue`，與 `open-cv.ts` 相同）：前一個指令還在等回覆時送出的指令會被擋到該回覆抵達，而不是把它接走。指令比以前晚一個 tick 送出。2 分鐘內沒有回覆（`doFisheyeCalibration` 與 `calibrateCamera` 為 10 分鐘）會以逾時 reject 並放行佇列；以前這種呼叫會永遠等下去。逾時時會先丟掉這條連線、換一條新的，再送出下一個指令，所以晚到的回覆不會被當成下一個指令的回覆（回覆沒有請求編號）；被丟掉的連線之後回報的內容一律忽略，在它上面上傳過的參數也會消失，所以流程要從 `updateData` 開始，各對話框本來就是如此（#1063 的 review，2026-11-27） |
| | `Beamo2Calibration.tsx`、`WideAngleCamera/index.tsx`（SOLVE_OTHER_PNP）：`solvePnPCalculate` 的結果形狀不變（新的 `rms` 欄位是附加的） |
| `Beamo2Calibration.tsx`（求解步驟被取代） | PRE_CHESSBOARD、CHESSBOARD、PUT_PAPER、SOLVE_OTHER_PNP、CHECK_PNP 與儲存的 V4 參數形狀不變 |
| | 卸載時與 Finish 時的 `releaseMachine`，以及 `DoorChecker` 的用法不變。`releaseMachine` 現在離開 raw 模式後還會把機器回報的狀態寫進 `currentDevice.info.st_id`（反正下一次 discovery 廣播會取代 `info`） |
| | 第一次到達 PUT_PAPER（機器不在 raw 模式）：`checkDeviceStatus` 拿到的 `info` 與之前相同 |
| `beamo2Calibration/index.tsx`（依模式設 `key`、`onSwitchToAdvanced`） | 從選單與從缺少參數的警示呼叫的 `showBeamo2Calibration(false / true)`：同一個對話框、同樣的 resolve 值（`completed`） |
| `fisheyeCameraConstants.ts`（只讀，或新增一張曝光組合表） | `bm2PnPPoints`、`getRegionalPoints`：值與順序不變，它們定義了儲存的分區姿態 |
| fluxghost `find_corners.py`（未動：`auto_pnp.py` 用同樣的參數加上暗色暗點過濾，建立自己的偵測器） | `camera_calibration.py` 的手動 find-corners 與 `opencv.py`（`detect_blobs`，Print and Cut 的標記點偵測）：未動 |
| fluxghost `camera_calibration.py`（新增指令，`solve_pnp_calculate` 回傳 `rms`） | `solve_pnp_find_corners`、`solve_pnp_calculate`：指令字串、參數、既有的回應鍵，以及不作聲退回投影點的行為不變 |
| | `tools/ws_smoke.py`：結尾仍是 `ALL PASS` |
| `LaserHeadFisheyeCalibration.tsx`（新增 AUTO_SOLVE_PNP 步驟） | PRE_CHESSBOARD、CHESSBOARD、PUT_PAPER、CHECK_PNP 與儲存的 V3 參數不變。SOLVE_PNP_INSTRUCTION 與 SOLVE_PNP 不變，只有後端缺少這些指令時才會到達 |
| `camera/index.tsx`（`key`、`onSwitchToAdvanced`） | 從選單與缺少參數的警示呼叫的 `showLaserHeadFisheyeCalibration(device, false / true)`：同一個對話框、同樣的 resolve 值 |
| `AdorCalibration/AdorCalibration.tsx`（兩個自動步驟；兩個 `SolvePnP` 步驟的 `onNext` 內容移到 `handleFirstPose` / `handleSecondPose`） | 手動的 SOLVE_PNP_1 與 SOLVE_PNP_2：同樣的檢查點、迴歸與儲存的 V2 參數。PREPARE_CALIBRATION、CALIBRATE（ChArUco 與原廠棋盤格）不變 |
| `AdorCalibration/index.tsx`（`key`、`onSwitchToAdvanced`、`replaceOpenDialog`） | 從選單、工廠模式呼叫的 `showAdorCalibration()`：對話框已開啟時仍回傳 `false` |
| `packages/core/src/web/app/lang/*.ts`（新增鍵） | 沒有既有的鍵被改名或移除。沿用為按鈕標籤、文字不變：`topbar.menu.calibrate_camera_advanced`、`calibration.title_capture_calibration_pattern` |
| `camera/common/SolvePnP.tsx`（連線被換掉後的 remap，#1063 的 review，2026-11-27） | 各對話框的手動步驟：請求不變。不找角點的 remap（`initialPoints`、調曝光）因為逾時換線而收到 `NO_DATA` 時，會重新上傳參數再 remap 一次，與找角點原本的做法相同；以前會忽略這個回覆，等到 2 分鐘逾時 |
| `helpers/websocket.ts`（握手中的 `close(false)`，#1063 的 review，2026-11-27） | 所有 websocket api client：連線中的行為不變，`close()` / `close(true)` 不變。`close(false)` 現在也會放棄還在進行的握手（連上後立刻關閉，不送出排隊的訊息），並停止 keep-alive ping。呼叫 `close(false)` 的有 `camera-calibration.ts`（逾時）、`camera.ts`、`camera-transform.ts`（用完時），都不預期已關閉的連線之後還會送出東西 |

未動：`WideAngleCamera/`、`PromarkCalibration.tsx`、`device-master.ts`、`match_points.py`（`match_projected_points` 維持原本的簽章；新的比對器是新模組）。`fcode/bm2-calibration.fc` 只有在採用決策 11 時才會變；標記點位置不變。

---

## 7. 設計

### 7.1 流程

SOLVE_PNP_INSTRUCTION 與四個 SOLVE_PNP_xx 步驟合併成一個建立在 `ProcessingDialog` 上的 AUTO_SOLVE_PNP 步驟：

1. 門檢查與 `moveLaserHead`，與目前 SOLVE_PNP_INSTRUCTION 的做法相同。
2. `autoSolvePnP`（`beamo2Calibration/autoSolvePnP.ts`）分輪拍攝，`EXPOSURE_ROUNDS` = `[75, 200]`，然後 `[50, 125, 350, 500, 800]`。一輪中的每個曝光：設定曝光、拍一張照片、送到 `auto_pnp_detect`、保留回傳的 `blobs` 與 `weak` 清單。
3. 每一輪之後，把到目前為止收集到的所有清單與 16 個參考點送到 `auto_pnp_match`。只有第一輪以 `NOT_ENOUGH_MARKS` 結束時才拍第二輪。
4. 接受時，把 16 個影像點依象限分組寫入 `imgPoints1`，與手動步驟完全相同，對四個象限呼叫 `solvePnPCalculate`，然後繼續到不變的 SOLVE_OTHER_PNP 與 CHECK_PNP。姿態來自這一步時，CHECK_PNP 的 Back 回到 PUT_PAPER。
5. 拒絕時，顯示原因並回到 PUT_PAPER。所有標記點都找到但殘差超過門檻不算拒絕：四個象限照樣求解，並詢問使用者（§7.4）。

第一張照片之前，這一步會讀取相機的自動曝光狀態，開啟時就關掉；否則固定曝光不會生效。曝光值還原之後才把它重新開啟，順序如此。

PUT_PAPER 會從 CHECK_PNP 的 Back、比對失敗與殘差過高的警告再次到達，每次機器都還在 raw 模式。因此它的 Next 與 Skip 會先呼叫 `releaseMachine`，而 `releaseMachine` 會用 `getReport` 更新 `currentDevice.info.st_id`：該欄位來自 discovery 廣播，會落後，否則 `checkDeviceStatus` 會把我們自己剛結束的 raw 模式看成機器使用中，並提議把它踢掉，之後下一步就會失敗。

要走這一步還是手動步驟，是在各個對話框內依呼叫的結果決定。`UNSUPPORTED` 不是後端送出來的：不認得 `auto_pnp_detect` 的後端回的是 `{"status": "Error", "message": "BAD_PARAM_TYPE"}`，由前端的 client（只有 `autoPnPDetect`）把這個回覆轉成原因 `UNSUPPORTED`（§8）。流程接著從 SOLVE_PNP_INSTRUCTION 繼續（決策 4）。沒有強制走手動步驟的開關。曝光的還原與相機的中斷連線放在 `finally` 區塊。

七張照片之後仍缺標記點的一次執行，會在比對器裡花 8 到 9 秒，這是可接受的；成功的比對花不到可量測的時間。

**龍門不變條件。** 在 `fbm2` 上相機跟著龍門移動，所以姿態只對拍照當時的龍門位置有效。拍攝時馬達保持在 `moveLaserHead` 設定的位置，也就是預覽使用的同一個位置，從第一張到最後一張照片之間馬達不釋放。馬達釋放時的拍攝無效：在 y < 20 附近，氣管會推動龍門，整個預覽跟著偏移（在第一台上看到一致的 1 mm 偏移，§11）。在 `fbb2` / `fhx2rf` 廣角相機上，相機裝在門蓋上，所以同樣的規則適用於門蓋：拍攝與預覽時它必須關在同一個位置。

**高度慣例。** fluxghost 的 V4 預覽以 Beam Studio 送出的高度 `h`（`set_fisheye_height`，來自 `getFocalDistance` 的焦距距離）由 polyfit 算出每個分區姿態，同時把床台格線放在 z = -h（`calculate_regional_perspective_points`，`fluxghost/utils/camera/perspective.py:127`）。因此自動流程在拍攝時記下預覽將送出的 `h`，並以標記點位於 z = -h 求解每個姿態。這樣一來 polyfit 是常數（斜率列全為零）：相機不隨床台移動，不同的物件高度由 z = -h 以幾何方式處理。在 `fbb2` 那台上忽略這個慣例（標記點在 z = 0，而預覽送出 h = -2.5），整個預覽被縮放了約 1.6%（§11）。在 `fbm2` 上預覽送出 `height: 0`（`Beamo2PreviewManager.ts`），所以實作的流程以 0 求解；這個慣例從 `fbb2` 廣角相機開始才有影響。

### 7.2 暗點偵測（`auto_pnp_detect`）

- 偵測在原始影格上進行。不做影像重映射：只對暗點中心去畸變（`cv2.fisheye.undistortPoints`，套用影格的 padding），比對器只需要這些。
- `SimpleBlobDetector` 使用 `find_blob_centers` 的參數（閾值 10 到 200、每步 10，面積 15 到 1000 px，圓度 ≥ 0.64，凸度 ≥ 0.85），只限暗色的暗點。不做局部對比正規化：在第一台上它找到同樣的標記點，雜點卻多了好幾倍（§11）。偵測器本來就會掃過各個閾值，所以照片內的亮度漸層並不是標記點消失的原因；過曝與曝光不足才是，而那只有換另一個曝光才救得回來。
- 不裁切興趣區域。搜尋整張影格；過濾在 §7.3 進行。
- 回傳 `blobs`：中心點連同大小與一個對比數值（暗點周圍一圈的亮度減去暗點本身）。
- 另外回傳 `weak`：同樣的偵測，只把最小面積從 15 降到 4 px（`WEAK_MIN_AREA`），其他都不變。它包含一般偵測器漏掉的標記點，混在數百個雜訊暗點之中（某張照片上是 18 個強的對 526 個弱的），只在預測位置旁邊才會使用（§7.3 步驟 4）。放寬圓度與凸度並沒有找到更多淡的標記點；把閾值步距減半能在更多曝光下找到它們，但雜訊變成四倍。兩者都放棄。

包圍曝光涵蓋各張照片之間的漸層。不同曝光下相距 8 px 以內（`SAME_MARK_PX`）的暗點是同一個標記點。保留對比最好的那個曝光下的結果，而不是最先看到的：一個標記點在很寬的曝光範圍內都偵測得到（第一台上是 16×），但只有在那個範圍的中段邊緣才乾淨。

### 7.3 比對與把關（`auto_pnp_match`）

床台是一個平面，所以去畸變後的影像點與床台座標之間是一個單應性的關係。這個模型不需要姿態先驗，也不需要像素常數。`fluxghost/utils/camera/auto_pnp.py` 的 `match_marks`：

1. **種子，不需先驗。** 一個格是一個標記點、它右邊的下一個標記點、下方的下一個，以及把矩形補完的那個標記點。在完整格點上這些就是格點的格（4×4 格點有九個）；在 8 個標記點的配置，也就是兩個同心矩形上，它們就是那兩個矩形。在影像中，一個種子是一個暗點、它右邊的一個暗點、下方的一個暗點，以及最接近它們所張成平行四邊形第四個角的暗點；在格點上從該暗點最近的 16 個鄰居中取，其他情況從所有暗點中取（內矩形與任何雜點都落在外矩形的角之間）。每個種子對每個格都試一次：四個點給出一個單應性。用四個點而不是三點仿射種子，是因為門蓋相機的透視很強（去畸變後 `fbb2` 格點最上面一列的寬度是最下面一列的兩倍），仿射種子外推時會落到錯的暗點上，而且再也救不回來。邊長比與每個格都相差超過 2.5×（`SEED_ASPECT`）的種子，或預測的標記點附近暗點太少（KD-tree 檢查）的種子，會被跳過。
2. **先擴張，再收斂。** 透過假設把每個暗點映射到床台上，給每個標記點位置 15 mm 內（`ASSIGN_TOL_MM`，每個暗點只用一次）最近的暗點，用配好的點對重新擬合單應性，重複到配對穩定為止。接著以 3 mm（`TIGHT_TOL_MM`）重複一次，從寬鬆配對的 RANSAC 擬合開始。需要寬鬆階段，是因為單一個格外推得很差；需要嚴格階段，是因為途中被掃進來的雜點否則會被算成標記點（§11，遮住標記點的測試）。保留標記點最多的假設，其次是殘差最低的；每個標記點都在 R_MAX 內比對到時立即回傳。
3. **正向檢查**：在標記點的中心，床台 +x 必須大致沿著影像 +x、床台 +y 沿著影像 +y，每個假設與最後的模型都要檢查。單應性可以吸收任何長寬比，所以 4×4 格點或正方形圖樣旋轉 90° 的配對擬合得和正確的一樣好（在 `fbb2` 的照片上它擬合得還更好）。殘差分不出它們。唯一的物理假設是機型的影像沒有鏡像、也沒有旋轉 90°；這在 `fbm2`、`fbb2` 與 `fhx2rf` 雷射頭以及 `ado1` 上成立，在 Promark 上未檢查，它的相機有旋轉設定（決策 12）。
4. **淡的標記點。** 至少 8 分之 7 的標記點比對到時（`FILL_MIN_FRACTION`：16 個中的 14 個、8 個中的 7 個），每個缺少的標記點由已比對標記點的單應性預測位置，並取該位置 2 mm 內（`FILL_TOL_MM`）`weak` 暗點的中位數。弱候選從不參與比對本身。補上的中心點是在預測所指的位置取得的量測，不確定度比一般的多約 0.2 mm；在紙上，隨機位置有弱候選靠得這麼近的機率約 2 %。
5. **門檻**，兩者都必須通過：
   - 每個標記點都比對到（每個分區姿態需要它的四個標記點；決策 5），否則 `NOT_ENOUGH_MARKS`，
   - 對單應性的 RMS 殘差 ≤ R_MAX（`R_MAX_MM`，1.0 mm；決策 10），否則 `HIGH_RESIDUAL`。
6. **交叉檢查。** 每個象限的 `solve_pnp_calculate` 回傳 RMS 重投影誤差（逐點距離，取代 log 裡會互相抵銷的平均，並加到回應中）。

未實作，目前也不需要：以工作區邊界過濾（3 mm 的容差已經做到這件事），以及對解出姿態的物理合理性檢查。

在涵蓋整個床台的格點上，即使比對正確，單一單應性的殘差也不為零（這種不準確正是 V4 格式有分區姿態的原因）：三台 `fbm2` 上是 0.38 到 0.47 mm，而 8 個標記點的配置是 0.03 到 0.10 mm，它們的標記點位於影格中央。所以 R_MAX 是用來擋雜點、擋描述相機不佳的內參的門檻，不是準確度數字。在模擬中，標記點格點內的預覽誤差最多約等於門檻值（0.6 到 1.5×），整個床台平均約為它的 0.4×；標記點格點外的邊緣不受它約束。準確度是 A6，透過 fluxghost 自己的預覽變形量測（§12 T6），絕不用另外寫的投影：一個慣例上的差異（§7.1 高度）曾讓手寫的檢查回報出與預覽所顯示相反的結果。

成本：所有標記點都在時沒有可量測的時間（提早回傳）；兩個曝光之後缺標記點時 1 到 2 秒；七個之後 8 到 9 秒（約 95 個暗點）；一張 8 個標記點的照片有 40 個暗點且遮住一個標記點時最多 5 秒。

### 7.3.1 8 個標記點的機型

`common/autoLocateMarks.ts` 放各機型共用的部分：連接相機、視需要選擇相機（`cameraIndex`）、處理曝光與自動曝光、分輪拍攝、偵測、比對、還原、中斷連線。它回傳點就到此為止；每個對話框各自求解自己的姿態。`beamo2Calibration/autoSolvePnP.ts` 和其他的一樣是呼叫端。

| | `fbm2` | `fbb2` / `fhx2rf` 雷射頭 | `ado1` |
|---|---|---|---|
| 參考點 | 16，`bm2PnPPoints` | 8，`bb2PnPPoints` | 8，`adorPnPPoints` |
| 曝光輪 | `[75, 200]`、`[50, 125, 350, 500, 800]` | `[250]`、`[100, 500]` | `[250]`、`[125, 450]` |
| 殘差門檻（`rMax`） | 後端預設，1.0 mm | 0.2 mm | 0.2 mm |
| 相機 | 預設 | `cameraIndex: 0` | 預設 |
| 求解的姿態 | 四個象限，dh 0 | 一個，dh 0 | 每個高度一個（`dh1`、`dh2`），之後 `extrinsicRegression` |
| 拍照時的機器 | raw 模式，馬達保持 | `moveLaserHead()` 之後釋放 | `prepareToTakePicture()` 之後釋放 |
| 求解之後 | SOLVE_OTHER_PNP、CHECK_PNP | CHECK_PNP | 第一個高度：ELEVATED_CUT；第二個：儲存 |

- 比對器不吃姿態：它從不讀取儲存的 `rvec` / `tvec`，只讀 `k`、`d` 與標記點位置。它唯一的方向假設是影像相對於床台沒有旋轉 90 或 180 度（2026-11-20 同意作為這些機型的前提）。Promark 的相機可能倒裝（`rotate180`），需要先處理這一點。
- 8 個標記點讓單應性幾乎沒有可以不吻合的地方，所以殘差門檻較嚴，並對完成的比對做比例檢查（`MAX_ANISOTROPY`）。數值、量測與背後的案例：fluxghost `docs/api/camera-calibration.md` 的「auto_pnp constants」。
- `ado1` 跑兩次獨立的流程（雕刻、找、墊高、雕刻、找）。第二個高度失敗時回到 ELEVATED_CUT，而不是 PUT_PAPER：第一個姿態已經存成檢查點。
- `fhx2rf` 使用 `fbb2` 的值（2026-11-23 決定：同一個雷射頭相機模組；一台 `fhx2rf` 用這些值通過，沒有自己的掃描）。`ado1` 有自己由掃描得出的曝光輪（決策 12）：先拍標記點對比最好的曝光，再拍一個較低與一個較高的值。它的韌體要到某個版本以上才把相機曝光開放出來，所以只要讀不到曝光，`autoLocateMarks` 就退回以相機當下的曝光拍一張、不動曝光；這對每個機型都成立。尚未在 `ado1` 上經由 Beam Studio 跑過。
- 在 `ado1` 上，第二個姿態之後接著在自動步驟內做迴歸與儲存。任一個失敗就回到 ELEVATED_CUT；以前是停在拖曳畫面，而自動步驟已經沒有那個畫面。
- 雷射頭相機跟著雷射頭移動，拍照前馬達會釋放，和手動流程一樣：在 `moveLaserHead()` 與拍照之間用手移動雷射頭，會得到錯誤的姿態。

### 7.4 失敗處理

後端有這些指令時沒有拖曳畫面。結果對應如下：

| 結果 | 使用者看到的 |
|---|---|
| `NOT_ENOUGH_MARKS`（兩輪之後） | PUT_PAPER，接著 `common/showNotEnoughMarksAlert.ts`：`auto_solve_pnp_not_enough_marks` 並帶找到的標記點數、「取消」（留在原處，可重新雕刻）與 `auto_solve_pnp_calibrate_manually`（主要按鈕）。選擇手動會帶著 `autoLocateMarks` 的 `initialPoints` 進入 SOLVE_PNP_INSTRUCTION：找到的標記點用實際位置，缺的用後端的 `predicted` 位置（§8）。`fbm2` 依象限切開寫入 `imgPoints1`，它的四個手動畫面本來就從那裡開始；`ado1` 依高度各自保存，而且第二個高度仍會跑自動步驟（`isAutoSupported`，和只決定 Back 往哪裡的 `isAutoSolved` 分開）。沒有 `predicted` 時，手動畫面和以前一樣自己找角點 |
| `HIGH_RESIDUAL` 且有全部的點（成功的 `autoSolvePnP` 結果上的 `highResidual`） | 警告，後面的對話框停在 PUT_PAPER。基本模式：`auto_solve_pnp_high_residual`，按鈕為 Continue Anyway（`auto_solve_pnp_continue_anyway`，繼續到 SOLVE_OTHER_PNP）與 Calibrate Camera (Advanced)（`await releaseMachine()`，然後 `onSwitchToAdvanced`）。進階模式：`auto_solve_pnp_high_residual_advanced`，按鈕為 Continue Anyway 與 Capture Calibration Pattern（PRE_CHESSBOARD） |
| 拋出錯誤 | `failed_to_calibrate_with_pictures`，然後 PUT_PAPER |
| `UNSUPPORTED`（後端沒有這些指令） | 沒有訊息：SOLVE_PNP_INSTRUCTION 與手動步驟（決策 4） |
| `NO_IMAGE`、`SOLVE_PNP_FAILED`、其他任何結果 | `failed_to_calibrate_with_pictures` 並帶原因，然後 PUT_PAPER |

重試會重新執行同一個工作檔。

這一步是在警告開啟之前就移到 PUT_PAPER，而不是在按鈕的 callback 裡：警告可以用 Esc 關掉，而 `ProcessingDialog` 在父層每次重新渲染時都會再執行 `process`，所以使用者做決定的期間它不能保持掛載。

警告是 `common/showHighResidualAlert.ts`，三個對話框共用。在 `ado1` 上 Continue Anyway 會直接儲存，中間沒有檢查畫面；仍然提供這個選項，因為相機與其參數的吻合程度比門檻差一點點的機台，否則在基本模式下沒有辦法完成（量過的那一台 `fhx2rf` 落在門檻的一半）。

切換到進階模式是透過 `showBeamo2Calibration(true)`，使用同一個對話框 id。元素帶有 `key={isAdvanced ? 'advanced' : 'basic'}`；沒有它的話，React 會保留已掛載的實例，連同它的步驟與儲存的 `k` / `d`。`showLaserHeadFisheyeCalibration` 的做法相同。`showAdorCalibration` 在它的對話框 id 存在時拒絕開啟，而舊對話框被 pop 掉的那個 tick 裡 id 還在，所以它的切換會傳入 `replaceOpenDialog`。

### 7.5 i18n

`calibration.auto_solve_pnp_locating`（進度文字）、`auto_solve_pnp_not_enough_marks`（`%(total)d` 與 `%(found)d`，讓 8 個標記點的機型可以共用）、`auto_solve_pnp_high_residual`、`auto_solve_pnp_high_residual_advanced` 與 `auto_solve_pnp_continue_anyway` 與 `auto_solve_pnp_calibrate_manually`，共 23 種語言（`en` 與 `zh-tw` 以外為機器草擬，沒有母語者審閱）。訊息避開內部用語：用「verification error」，不用殘差或相機參數；用「calibration pattern」，不用 ChArUco。`solve_pnp_step1..3` 保留；其他對話框還在使用。

---

## 8. 資料契約

兩個指令都在既有的 `camera-calibration` websocket 上，需要先載入 `k` / `d`（`update_data`），否則是既有的 `NO_DATA` 失敗。

```
→ auto_pnp_detect <file_length>
← {"status": "continue"}            → binary upload
← {"status": "ok",
   "blobs": [[x, y, size, contrast], ...],       // undistorted px
   "weak":  [[x, y, size, contrast], ...]}       // same, minimum area 4 px

→ auto_pnp_match <args_json>
   args: { "ref_points": [[x, y], ...],          // mm, a full lattice or nested rectangles
           "blobs": [[[x, y, size, contrast], ...], ...],  // one list per exposure
           "weak":  [[[x, y, size, contrast], ...], ...],  // optional, one list per exposure
           "r_max": number }                               // optional, mm; default R_MAX_MM
← {"status": "ok",
   "points": [[x, y], ...],                      // per ref point, undistorted px
   "matched": number, "filled": number, "rms": number}
← {"status": "fail", "reason": "NOT_ENOUGH_MARKS" | "HIGH_RESIDUAL",
   "points": [[x, y] | null, ...],               // null for a missing mark; complete after HIGH_RESIDUAL
   "predicted": [[x, y], ...] | null,            // 2.5.9: every ref point, from a homography through the
                                                 // found marks; null unless marks are missing and >= 4 found
   "matched": number, "filled": number, "rms": number | null}

→ solve_pnp_calculate ...            // unchanged request
← {"status": "ok", "rvec": ..., "tvec": ..., "rms": number}   // rms is new
```

`filled` 計算取自 `weak` 的標記點數。初稿還有 `workarea`、`prior_points`、逐點的 `residuals`、`rejected` 計數與 `AMBIGUOUS` 原因；都用不到，也都不存在。Client（`helpers/api/camera-calibration.ts` 的 `autoPnPDetect`）把對未知指令的回覆轉成 `UNSUPPORTED`。fluxghost 對它送出 `{"status": "Error", "message": "BAD_PARAM_TYPE"}`，E 是大寫：websocket 包裝只把小寫的 `error` 導到 `onError`，所以這個回覆會經由 `onMessage` 抵達，並在那裡被辨識出來（`isUnknownCommand`）。在處理這一點之前，promise 永遠不會 settle，這一步就卡住（review 時發現，2026-11-23）。只有偵測用來分辨舊後端：fluxghost 在處理函式丟出 `ValueError` 時送的是同一個回覆（`fluxghost/api/misc.py`），比對可能發生這種情況，偵測的文字指令則不會。因此 `autoPnPMatch` 收到這個回覆時 reject，兩者收到小寫的 `error` 也都 reject：這一步以失敗警示結束，而不是進入手動步驟（決策 4；#1063 的 review，2026-11-26）。

兩個新指令除了 `k` / `d` 以外都是無狀態的，所以可以對存下來的照片離線執行。指令名稱一旦進了 fluxghost 的 `cmd_mapping` 就定案；之後不要改名。

---

## 9. 上線（PR 計畫）

0. **資料收集，在任何比對器程式之前。** 在每一台可用的 `fbm2` 上，標準雕刻之後做一次僅供開發用的拍攝。每一台、不移動紙：
   - 整個拍攝期間馬達保持在校正位置（龍門不變條件，§7.1）；馬達釋放時拍的照片不能用來判斷準確度；
   - 一次曝光掃描：從 50 到 500 取 8 到 10 個值，50 到 300 之間最密，每個值一張未裁切的原始照片（第一台在 500 以上沒有可用的東西）。掃描刻意比任何曝光組合都寬：曝光組合是從它挑出來的，而手動流程的曝光滑桿顯示固定的 350 / 100 並不適合每一台；
   - 基準真值：跑一次手動流程，存下 16 個確認過的點，以及操作者在每個分區最後停在的曝光；
   - 在每一種 A4 干擾下做同樣的掃描。

   存成 fluxghost 測試資料（`tests/usage/fixtures/auto_pnp/`），附上機台與拍攝條件：盡可能存暗點清單而不是照片（保留一張照片給偵測器測試）；原始照片留在 repo 之外。決策 2、5 與 7 由這組資料決定。依每個標記點位置、每個曝光回報偵測率；曝光組合是能在每一台上涵蓋每個標記點的最小曝光集合。可用的機台：數台 `fbm2`；`fbb2`、`fhx2rf` 與 `ado1` 各一台。
1. fluxghost #128（2026-11-23 合併）：`auto_pnp_detect`、`auto_pnp_match`、`solve_pnp_calculate` 的 `rms`、測試資料的測試、`docs/api/camera-calibration.md`、`ws_smoke.py` 的項目。版本不變：tag 2.5.8 移到該合併。fluxghost #130（2.5.9）在比對失敗的回覆加上 `predicted`；CD workflow 以 2.5.9 建置。
2. beam-studio（`feat/auto-solve-pnp`）：API client 方法、`common/autoLocateMarks.ts`、三個對話框的自動步驟、所有語言的字串、spec、`camera-calibration` skill。
3. 實機驗證（§12），門檻記錄在 §11。三台 `fbm2` 上的正常流程與缺標記點已完成；舊後端路徑尚未測試，其餘列在 §12。
4. 後續 PR：`fbb2` / `fhx2rf` 廣角相機（決策 1），接著是 Promark，它需要先處理偵測器（決策 12）。

---

## 10. 未定決策

1. ~~**`fbm2` 之後的機型順序。**~~ **2026-11-16 定案：** 接下來是 `fbb2` / `fhx2rf` 的廣角相機（同樣的 4×4 象限配置，`bb2WideAngleCameraPnpPoints` / `hx2WideAngleCameraPnpPoints`，兩個高度），然後是雷射頭魚眼與 Ador（8 個標記點、單一分區），Promark 最後。**2026-11-20 變更：** 雷射頭相機與 Ador 先做，並與 `fbm2` 一起出貨；廣角相機與 Promark 隨後。
2. ~~**粗略關聯的方法。**~~ **2026-11-17 定案：不需先驗**（§7.3）。在步驟 0 的兩台機器上，它不用預設點就把每個看得見的標記點配對正確。
3. ~~**失敗時加強重新雕刻。** 工作檔的功率與速度是固定的，所以重試沒辦法雕得更深。~~ **2026-11-16 定案：接受。** 到目前為止沒有任何一台無法在紙上留下標記。如果步驟 0 或現場出現淡的標記點，就把雕刻改成場景檔，像 Promark 那樣（`helpers/device/promark/calibration.ts` 的 `loadCameraCalibrationTask` 載入 `.bvg` 並依光源設定功率），這樣功率可以在執行時調整，代價是改動較大。
4. ~~**沒有新指令的後端**（網頁版搭配較舊的 helper）。~~ **2026-11-16 定案：** 後端不認得 `auto_pnp_detect` 時，原封不動執行既有的手動步驟。這是會自行到達拖曳畫面的唯一路徑；有這些指令的後端不論哪種失敗，都不會退回到它。**2026-11-26 修訂（#1063 的 review）：** `NOT_ENOUGH_MARKS` 之後，警示每一次都提供手動步驟作為主要選項，並從已找到的標記點開始。否則偵測處理不了的機台（房間亮到超出相機最低曝光、沒有量測過的相機模組）會完全無法校正，比這個功能之前更糟；而且重新雕刻很少改變結果，因為工作功率是固定的（決策 3）。選擇權仍在使用者手上，所以偵測的問題不會被無聲的退回蓋掉。
5. ~~**找不到的標記點。**~~ **2026-11-19 定案：每個標記點都是必要的。** 至少 8 分之 7 的標記點比對到時，一般偵測器漏掉的標記點可以從其預測位置旁邊的弱候選取得（§7.3 步驟 4）。優先於直接填入預測位置、優先於加強雕刻、也優先於失敗；依此順序排名。第三台 `fbm2` 有兩個標記點需要它，直到標記點放大為止（決策 11）。原文：每個分區姿態都正好由四個標記點求解（`bm2PnPPoints` 的象限，然後 `getRegionalPoints`），所以缺一個標記點最多會破壞四個分區。16 個標記點的冗餘是給剔除離群值用的，不是給缺標記點用的。步驟 0 之前的暫行規則：16 個都必須比對到，否則失敗。依步驟 0 資料集中每個標記點的偵測率決定：
   - 漏失很少：維持這條規則；
   - 漏失常見，且與曝光或位置有關：先修正拍攝（曝光組合的值）；
   - 漏失仍然存在：只用鄰近標記點擬合的單應性補上缺少的影像點，限制每次執行一個標記點，並在摘要那一行回報。補上的點是預測，不是量測，所以這是最後手段。
6. ~~**CHECK_PNP。**~~ **2026-11-16 定案：** 保留目視確認。
7. ~~**曝光組合的值。**~~ **2026-11-19 就 `fbm2` 定案：兩輪**，75 + 200，只有缺標記點時才 50 / 125 / 350 / 500 / 800（§7.1）。辦公室的三台都在第一輪通過。曝光刻度不同的相機模組（§11，第三台 `fbm2`）還不需要自己的值。步驟 0 資料：`fbm2` 第一台：75 + 200 涵蓋全部 16 個標記點，目前的 350 / 100 則不行。`fbm2` 第二台：單是 75 就涵蓋全部 16 個，200 找到 8 個，350 找到 7 個，所以這一對在不同機台之間有差異，主要靠低的那個值。`fbb2` 廣角第一台：75 到 125 之間任何單一曝光都涵蓋全部 16 個。最終值取自步驟 0 其餘的機台。
8. **共用 `k` / `d`，以及用標記點精修內參。** **2026-11-19 延後：第一版使用每台自己的 ChArUco `k` / `d`**，不做精修。辦公室沒有足夠的相機能證明共用值在每一台上都成立，而一台離群的相機用了共用值又不精修，會比現在還糟。目前已知的內容如下；共用值如果要做，是以相機模組為鍵，不是以機型為鍵（§11，第三台 `fbm2`）。提案：比對之後，在 16 個標記點上精修內參（`cv2.fisheye.calibrate`，單一視角），再以精修後的值求解分區姿態。在 `fbb2` 那台上，這勝過儲存的手動校正（§11），預覽看起來也比 ChArUco 的結果好。
   - **那個結果說明了什麼、沒說明什麼。** 那次執行是從這一台自己的 ChArUco `k` / `d` 出發，並固定主點（`CALIB_USE_INTRINSIC_GUESS | CALIB_FIX_PRINCIPAL_POINT | CALIB_FIX_SKEW`），所以只有 `fx`、`fy` 與四個畸變係數會動。它是「對工作平面調過的 ChArUco 內參」，不是不靠 ChArUco 的校正。調過的值吻合工作平面；離開平面（厚的材料）時，並不知道它們是否比 ChArUco 的好。
   - **目標：以每個機型一組 `k` / `d` 為起點，ChArUco 只作為進階路徑。** 這三組參數在同一種鏡頭的機台之間，轉移的情況不同：畸變來自鏡頭設計，應該可以轉移；焦距差一兩個百分點，正是精修已經在修正的；主點取決於鏡頭在感光元件上的位置，可能差到數十像素。主點是未解的部分。魚眼的畸變以它為中心對稱，所以從單一平面可以部分觀測到它（與針孔模型不同），剩下的大多被工作平面上的姿態吸收。跨高度時則不會被吸收，這在預覽 `h` 隨對焦改變的 `fbb2` 上比較重要（§7.1）。
   - **實驗**，每個都以主點固定與自由各跑一次，準確度照 A6 的方式量測：
     1. 在 `fbm2` 上跨機台（有數台）：A 機的 ChArUco `k` / `d` 加上 B 機的 16 個標記點，對照 B 機自己的 ChArUco 校正。
     2. 在單一機台上擾動起點（`fbb2` 只有一台）：把主點移 ±30 px、焦距移 ±2 %，精修，與未擾動的結果比較。只能說明收斂性，不代表機台之間真實的差異。
   - **如果成立**：預設流程是機型的 `k` / `d` + 標記點，以重投影 rms 為門檻，只有門檻沒過時才要求 ChArUco。門檻取自實驗 2（救不回來的起點與正常起點的 rms）。
   - 除了上述之外仍未解：精修讓標記點格點以外的區域不受約束（`fbb2` 的上方角落），見決策 9。
   - **`fbm2` 上的結果（2026-11-18，實驗 1，單一方向，§11）。** 兩項發現改變了對這個機型的提案：
     - 不做任何精修，借用就行得通。B 機的標記點搭配 A 機的 `k` / `d`、只解姿態：單一姿態上擬合 0.71 mm / 留一法 0.87 mm，而用 B 機自己的 ChArUco 值是 0.65 / 0.83。兩台的主點相差 37 與 64 px，姿態把它吸收掉了。經過 fluxghost 以九個分區姿態做的變形，標記點落在平均 0.13 mm、最大 0.42 mm 以內，Beam Studio 的預覽被判定至少和該機台的手動校正一樣好。
     - 精修在這裡不可靠。每一種放開焦距的做法都會把它移動 6 到 30 %（1339 → 1430 到 1760），而擬合只改善零點幾毫米；畸變也放開時，留一法的最大值增加到 5 到 9 mm。從約 22° 看一個平面的單一視角，無法把焦距與相機距離分開。`CALIB_FIX_K1` 開或關對此沒有差別。（ChArUco 步驟裡有這個 flag，是因為沒有它的話，以使用者拍的那幾張照片，校正誤差會跳到數十或數百。）
     - 在不拍照的測試中（§11），兩個方向在整個床台上都成立：把一台儲存的相機當作真值，合成它的 16 個標記點位置，用另一台的 `k` / `d` 由它們求解九個分區姿態，每 10 mm 取樣誤差。平均 0.38 與 0.18 mm，標記點格點內最多 0.80 與 0.35 mm，兩個方向在邊緣都是最多 1.11 mm。
     - 其他機型也用同一顆鏡頭，它們的內參同樣好用：在第二台 `fbm2` 的標記點上，`fbb2` 與 `fhx2rf` 雷射頭的值擬合到 0.64 與 0.72 mm，另一台 `fbm2` 的是 0.71 mm，該機台自己的是 0.54 mm（§11）。所有使用這顆鏡頭的相機共用一組 `k` / `d` 是目前的工作假設，而不是每個機型一組。
     對 `fbm2` 的提案：出貨一組共用的 `k` / `d`（歪斜 0，見 §11），只解姿態，不精修，ChArUco 保留為進階路徑。定案之前：第三台機器、不用於求解的檢查標記點（A6），以及共用值如何導出（候選值以拿它們求解其他機台的標記點來評分，如 §11）。`fbb2` 廣角：2026-11-17 的結果需要重新解讀。它勝過的那份儲存校正是離群值（`fy` 比 `fx` 高 6 %，畸變與其他四台相機不同，在 `fbm2` 標記點上是 3.25 mm，其他的是 0.5 到 0.7 mm），所以精修很可能是修好了一個差的 ChArUco 結果，而不是改善了一個好的。那一台接下來：先用共用的 `k` / `d` 只解姿態，再談精修。
9. **靠近角落的標記點。** 提議在 `fbb2` 上做的實驗：在 y ≈ 10 到 20 mm 雕刻一列標記點，找出相機上方真實的視野（模型把上方角落放在影格之外），並在下方角落雕較大的標記點（那裡每 mm 2.3 到 2.7 px，中央是 5.8，所以中央大小的標記點會低於偵測器的 15 px 面積）。角落的標記點也會讓包圍曝光回來（左下需要約 200，其餘 75 到 125）。
10. **R_MAX。** 2026-11-20 起為 1.0 mm（之前是 0.75）：標記點格點內的預覽誤差最多約等於門檻值，所以 1.0 的目標是預覽在約 1 mm 以內，而一直失敗的校正對使用者的代價，比稍微偏一點的預覽還高。辦公室的三台是 0.38 到 0.47 mm。有現場資料後再檢討。2026-11-20 起這個門檻不再擋住流程：超過時警告使用者，使用者可以繼續到 CHECK_PNP（§7.4），因為另一條路是重新雕刻而結果相同。對 8 個標記點的配置，這個值幾乎擋不到什麼：正確的比對是 0.03 到 0.10 mm，而一個標記點位移 1 / 2 / 3 mm 會得到 0.15 到 0.31 / 0.31 到 0.62 / 0.47 到 0.93 mm（在 `fbb2` 的照片上模擬），所以距離缺少的標記點 3 mm 以內的雜點會通過。它們在對話框接上之前需要自己的值，而且必須每個機型各一個：約 0.2 mm 適合雷射頭相機，但 Promark 正確的比對就已經是 0.265 mm（每 mm 2.4 px 下的 0.6 px）。尚未加入：目前沒有任何地方用 8 個標記點呼叫比對器。
11. **標記點大小。** `fbm2` 的標記點半徑 0.3 mm，看起來約 1.0 mm（燒灼擴散加上模糊）：最下面兩列是 5 到 6 px 寬，面積約 20 px，偵測器的最小值是 15。半徑 0.5 mm 時，第三台的每個標記點都由一般偵測器找到（不需弱候選補點）。提案：`bm2-calibration.beam` / `.fc` 改為 0.5 mm，16 個標記點全部，因為眩光的位置並非每台固定。2026-11-24 起已在 repo 內，雕刻參數由 20 %、70 mm/s 改為 30 %、100 mm/s：每 mm 的能量差不多，紙上看起來也一樣，預估工作時間由 102 秒降為 79 秒。加大標記點不能取代第二輪：第三台在最下面幾列有強烈反光時，0.5 mm 的標記點仍然需要全部七個曝光與一次弱候選補點（結果見下）；那裡缺的點取決於光線，不是標記點大小。`ado1` 的標記點一樣小（4.7 到 6.5 px），應該跟進。
12. **8 個標記點的配置**（`fbb2` / `fhx2rf` 雷射頭、`ado1`、Promark）。配置維持不變：兩個同心矩形帶有固定的 1 : 2 比例，一列舊標記點模仿不了，而 4×4 格點只會多出補點的空間。`fbb2`、`fhx2rf` 與 `ado1` 已接上（§7.3.1）；仍未解的部分：
    - 重複使用的紙上，另一個機型的 8 個標記點圖樣確實會模仿它：這些配置只差在比例（120 × 80 對 120 × 120），而單應性會吸收比例。在 `ado1` 上看到過（較低高度的預覽錯誤），以比例檢查解決。
    - ~~在 `ado1` 上，曝光能否由 Beam Studio 設定。~~ 2026-11-24 定案：可以，但要某個韌體版本以上；較舊的韌體以相機當下的曝光拍一張（§7.3.1）。`fhx2rf` 共用 `fbb2` 的曝光輪（2026-11-23 定案）。
    - Promark：標記點是深色紙上的亮點，2.3 到 3.2 px 寬，低於自動（只找暗色）與手動（任何顏色）偵測器的 15 px 最小面積（§11）。需要先有較大的標記點，約 2.5 mm 寬才能在每 mm 2.4 px 下達到 6 px；然後是 `auto_pnp_detect` 的亮點選項、拍攝期間關掉紅光指示，以及對照相機旋轉設定檢查正向假設。
    - 沒有完整格點時，缺一個標記點的比對成本隨暗點數的三次方成長：40 個暗點時是 5 秒，54 個時是 41 秒，因為種子自己的四個暗點就滿足了附近暗點的檢查。現在這個檢查還要求其他標記點的一半：1.5 秒與 2 秒。多個曝光合併時仍然沒有上限。
    - `ado1` 在兩個高度求解。2026-11-20 同意：兩次獨立的流程，雕刻、找、請使用者墊高材料、雕刻、找。
    - 曝光。手動的 8 個標記點對話框都不設定曝光；只有 `fbm2` 傳入 `initExposure`。每個機型都需要由掃描得出自己的曝光輪。`fbb2` 雷射頭，一台、一種照明（2026-11-20，從 50 到 3000 共 16 張單張照片，沒有 weak 清單）：100 到 800 的每個值都是 8 個中的 8 個（rms 0.042 到 0.050 mm，標記點位置彼此相差 0.64 px 以內，對比最好在 200 到 300）；50 以及 900 以上是 8 個中的 7 個。過曝是代價高的那一邊：2000 / 3000 時有 89 到 97 個暗點，在比對器裡花 22 到 38 秒，最後以失敗結束。對 `fbb2` 的提案：在約 250 拍一張，然後 `[100, 500]`，絕不超過 800。`fhx2rf` 與 Promark 沒有做掃描。`ado1`，一台、門蓋關上（2026-11-24，新雕刻，從 50 到 1500 共 17 張單張照片）：100 到 450 是 8 個中的 8 個，標記點對比最好在 250 到 300；75 是 8 個中的 7 個；500 以上是 8 個中的 5 到 6 個，小的標記點（5 到 6 px）被洗掉。這一台原本是 440，在那裡已經有一個標記點要靠 weak 清單。一張疊了兩組圖案的舊紙在 100 到 500 是 8 個中的 8 個。即使有約 2000 個 weak 候選（蜂巢板），比對到 800 為止都在 1 秒內。曝光輪：`[250]`，然後 `[125, 450]`。
    - 自動曝光。`fbm2`、`fbb2` 與 `fhx2rf` 有自動曝光開關（`supportCameraAutoExposureModels`），它開啟時固定曝光應該不會生效。自動步驟必須在第一張照片前把它關掉，並連同曝光值一起還原。`fbm2` 已在 `autoSolvePnP.ts` 完成，並在一台自動曝光開啟的機器上通過（2026-11-20）。`fbb2` 需要 `useCamera` 所做的韌體檢查（`BB2_AUTO_EXPOSURE`）。

---

## 11. 風險與後續

- **紙上的標記點太淡**是每一種做法共同的弱點。包圍曝光有幫助；如果步驟 0 出現漏失，決策 3 指出了出路（可調功率的場景檔雕刻）。
- **格點歧義**：外側那一列被遮住、雜點又剛好排成一線時，位移一個間距的 4×4 格點看起來仍然像格點。實機上看到過（見下）；嚴格階段與每個標記點都必要的規則擋住它。
- **距離缺少的標記點 3 mm 以內的雜點**仍然會被當成那個標記點。其他標記點都在時殘差幾乎不動，所以沒有東西抓得到它；CHECK_PNP 是最後一道防線。
- **8 個標記點圖樣的射影自相似性**：缺兩個標記點時，一個沿對角線擠壓圖樣的單應性可以把六個真的標記點擬合到錯的位置，而且沒有殘差。只要每個標記點都必要就無害；這就是弱候選補點需要 8 個中 7 個的原因。
- **床台邊緣**：門檻約束的是標記點格點內的區域；格點之外的預覽是外推的。
- **某些機台上單應性殘差太大**，單一個 R_MAX 分不開標記點與雜點。退回方案：改為逐象限設門檻，而不是全域。
- **高度慣例**：拍攝時記錄的 `h` 必須是預覽之後送出的那一個。如果焦距探針的零點改變（重新對焦、韌體），每個儲存的姿態都會位移那個差值。把 `h` 記錄在參數裡（實作後資料契約的決策）。
- **`fbb2`、`fhx2rf` 與 `ado1` 各只有一台。** 機台之間的安裝差異，也就是在床台座標把關的理由，只能在 `fbm2` 上量測。後面的機型門檻來自單一機台，所以它們的後續 PR 必須保留寬的餘裕，並明說這一點。
- **拍攝時間**：每多一個曝光就多一張照片。目標是總時間低於目前四個手動對話框所花的時間；在步驟 3 量測。
- 後續：失敗時把照片附到錯誤回報（既有的同意流程）。
- `Beamo2Calibration.tsx` 裡的 `DEFAULT_POINTS_*` 與像素 `interestArea` 表保留，因為手動步驟還要留給舊後端，以及缺標記點之後的選擇（決策 4）。

**第一台的發現（一台 `fbm2`，2026-11-17，探索性質）。** 曝光 50 到 2000 的原始照片，每一側一次 ChArUco 拍攝，乾淨白紙，門蓋關閉。標記點的身分是用眼睛指定的，所以這檢查的是關聯正確時的把關，而不是關聯本身（決策 2）。尚未成為測試資料。

| 發現 | 數值 |
|---|---|
| 每個曝光找到的標記點（共 16 個），原始偵測器 | 50: 9 · 75: 13 · 100: 13 · 150: 14 · 200: 13 · 320: 10 · 500: 9 · 800: 5 · 1200: 3 · 2000: 1 |
| 能涵蓋的最小曝光組合 | 75 + 200（聯集 16 個中的 16 個） |
| 每個曝光的雜點 | 曝光 150 以下 2 到 4 個，以上 8 到 15 個 |
| 局部正規化 | 同樣的標記點，每張照片 13 到 59 個雜點。放棄（§7.2） |
| 16 個標記點的單應性殘差 | RMS 0.46 mm，最大 0.92 mm（3.5 / 6.0 px） |
| 離任何格點位置最近的雜點 | 35.9 mm；12 個雜點中有 11 個落在工作區之外 |
| 單一標記點的質心在各曝光間的漂移 | ≤ 0.4 px |
| 分區姿態重投影（每個 4 個標記點） | ≤ 2.0 px；16 個全放在一個姿態上：RMS 4.3 px |
| 以所得參數做的預覽 | 約 1 mm 的一致偏移，對齊一個標記點後消除。原因：照片是在馬達釋放時拍的（龍門不變條件，§7.1），不是校正的問題 |

結論：這一台上擋雜點的門檻大約有 40× 的餘裕，所以 R_MAX 可以落在低毫米範圍的任何位置；目前固定的 350 / 100 不是最好的一對（350 會丟掉最下面一列）；其他機台的掃描可以停在 500，並把 50–300 取樣得更密。

**第二台的發現（一台 `fbb2` 廣角相機，`/dev/video2`，2026-11-17，探索性質）。** 曝光 50 到 800 的原始照片，門蓋關閉，乾淨的紙；以該機台儲存的 `wide-angle.json`（ChArUco + 兩個高度的手動校正）為參考。

| 發現 | 數值 |
|---|---|
| 每個曝光找到的標記點（共 16 個） | 50: 12 · 75 到 125: 16 · 150: 14 · 200: 12 · 250 到 400: 10 · 500: 8 · 800: 5 |
| 可用範圍內的雜點 | 1 到 5 個，離格點位置最近的 64.7 mm |
| 不需先驗的比對器（§7.3） | 400 以下的每個曝光，所有看得見的標記點都正確 |
| 儲存校正在 h = -2.5（Beam Studio 送出）的預覽誤差 | 上半部平均 1.08 mm，下半部 0.53 mm，上方兩側最大 2.79 mm |
| 用標記點精修焦距 + 畸變之後的預覽誤差（決策 8），姿態在 z = -h | 上半部平均 0.17 mm，下半部 0.39 mm，最大 0.51 mm |
| 同樣的精修值，但標記點在 z = 0 而不是 z = -h | 平均 2.60 / 4.61 mm（1.6% 的比例誤差，§7.1） |
| 分區相機位置 | 儲存的：九個分區高度 120 到 150 mm；精修的：110 到 114 mm |
| 在 Beam Studio 中目視檢查 | 精修後的預覽被判定比儲存的 ChArUco 校正好 |

以上所有預覽誤差都是用 fluxghost 自己的變形在拍攝的照片上量的，只量 16 個標記點位置。參數檔裡標記點的身分來自手動指定；比對器在這張照片上完全重現了它。工作區的上方角落在標記點格點之外，不受約束（決策 9）。

**第三台的發現（第二台 `fbm2`，2026-11-18，探索性質）。** 曝光 50 到 500 的原始照片，馬達鎖定，門蓋關閉；以該機台同一天自己的手動校正為參考；`k` / `d` 借自第一台 `fbm2`。

| 發現 | 數值 |
|---|---|
| 每個曝光找到的標記點（共 16 個） | 50: 14 · 75: 16 · 100: 14 · 150: 11 · 200: 8 · 350: 7 · 500: 7 |
| 以自己的與借來的 `k` / `d` 去畸變時的比對器 | 在每個看得到全部 16 個的曝光下，配對相同 |
| 主點，自己的與借來的 | (2799, 2076) 對 (2837, 2140) |
| 單一姿態，不精修，擬合 / 留一法平均 / 最大 | 自己的 0.65 / 0.83 / 1.92 mm · 借來的 0.71 / 0.87 / 1.54 mm |
| 從借來的值精修焦距 + 畸變 | 擬合 0.50 mm，留一法平均 1.36 mm、最大 9.02 mm，焦距 1339 → 1593 |
| 16 個標記點上的預覽誤差，fluxghost 變形，手動校正 | 平均 0.42 mm，最大 1.39 mm（左下；誤差集中在最下面兩列） |
| 16 個標記點上的預覽誤差，借來的 `k` / `d` + 自動標記點 | 平均 0.13 mm，最大 0.42 mm |
| 在 Beam Studio 中目視檢查 | 借來的版本至少一樣好；左下象限比手動拖曳的好 |

兩組參數都是由同樣的 16 個標記點求解，所以最後三列比較的是手動擺放加自己的內參，對上自動質心加借來的內參，而且只在求解點上比較。尚未解釋：在焦距與畸變固定下只精修主點，得到 5 到 8 mm 的擬合，看起來像是 flag 之間的交互作用，而不是資料的問題。

**不拍照的跨機台測試（兩台 `fbm2`，2026-11-18）。** 真值 = 一台儲存的 `k`、`d` 與全域姿態；由它合成標記點；用另一台的 `k` / `d` 與 fluxghost 的分區選擇求解分區姿態；在 10 mm 格線上（925 個點）量整個床台的誤差。

| 真值機台 | 整個床台 平均 / 最大 | 標記點格點內 平均 / 最大 | 邊緣 平均 / 最大 |
|---|---|---|---|
| 第一台 `fbm2` | 0.38 / 1.11 mm | 0.32 / 0.80 mm | 0.48 / 1.11 mm |
| 第二台 `fbm2` | 0.18 / 1.11 mm | 0.14 / 0.35 mm | 0.25 / 1.11 mm |

這量的是兩組儲存參數之間的差異，各自有自己的誤差，不是絕對準確度。它假設每台機器只有一個實體相機姿態。

**在第二台 `fbm2` 的標記點上評分的候選 `k` / `d`（2026-11-18）。** 只解姿態，16 個標記點共用一個姿態，不精修。

| `k` / `d` 來源 | 擬合 | 留一法 平均 / 最大 |
|---|---|---|
| 該機台自己，ChArUco 加 `CALIB_FIX_SKEW` | 0.54 mm | 0.67 / 1.34 mm |
| 該機台自己，加 flag 之前的 ChArUco（歪斜 -7.13） | 0.65 mm | 0.83 / 1.92 mm |
| `fbb2` 雷射頭 | 0.64 mm | 0.78 / 1.95 mm |
| 第一台 `fbm2` | 0.71 mm | 0.87 / 1.54 mm |
| `fhx2rf` 雷射頭 | 0.72 mm | 0.88 / 1.66 mm |
| `fbb2` 廣角（儲存的校正） | 3.25 mm | 4.35 / 10.71 mm |

一台機器的標記點，每個候選一個樣本。這些標記點沒有參與任何一次 ChArUco 執行，所以前兩列是對這個 flag 的獨立檢查。在同一台機器、同樣的雕刻標記點上從頭到尾跑一次，手動擺放的校正從平均 0.42 mm / 最大 1.39 mm（上午，歪斜 -7.13）變成 0.21 / 0.47 mm（新的 `k` / `d`，重新擺點）；自動標記點搭配第一台 `fbm2` 的 `k` / `d`，在同一張照片上是 0.13 / 0.42 mm。

**辦公室機台儲存的內參（2026-11-18）。** 讀自每台機器的 `/var/static_data/fisheye/`。這些魚眼相機原本就設計為共用一種鏡頭。

| 機台與相機 | `fx` / `fy` | `cx` / `cy` | 歪斜 `k[0][1]` |
|---|---|---|---|
| 第一台 `fbm2` | 1339 / 1362 | 2837 / 2140 | +0.06 |
| 第二台 `fbm2` | 1357 / 1382 | 2799 / 2076 | -7.13 |
| `fbb2` 雷射頭（另一台） | 1339 / 1338 | 2820 / 2124 | -0.38 |
| `fbb2` 廣角 | 1349 / 1434 | 2831 / 2099 | -3.67 |
| `fhx2rf` 雷射頭 | 1308 / 1321 | 2840 / 2147 | +4.41 |
| `fhx2rf` 廣角（針孔模型，作為對照） | 1178 / 1175 | 1620 / 1190 | 0 |

- 五台魚眼相機跨三個機型，焦距相差 4 % 以內，主點相差 41 / 71 px 以內。全部共用一組 `k` / `d`，而不是每個機型一組，值得測試（決策 8）。
- **歪斜。** ChArUco 步驟會擬合一個歪斜項，下游沒有任何東西使用它。它的範圍從 -7.1 到 +4.4，沒有規律，而且在 `fx` 與 `fy` 也不一致的地方特別大，看起來是校正沒有收斂，而不是鏡頭的特性。針孔路徑從不擬合它。歪斜不為零時，fluxghost 的 `solve_pnp` 不是 `project_points` 的反函數（在第二台 `fbm2` 上用該機台自己的參數，整個床台平均約 0.3 mm、最大 0.9 mm）。已在 fluxghost 2.5.8 修正（#127：在正規化座標中求解，ChArUco 步驟加上 `CALIB_FIX_SKEW`），在第二台 `fbm2` 上以新的 ChArUco 執行驗證過（上表）。共用的 `k` 以歪斜 0 出貨，而「`fx` 接近 `fy`、歪斜接近 0」在挑選要從哪些校正導出它時，是可用的過濾條件。

**實作在實機上的結果（三台 `fbm2`，2026-11-19）。** 出貨的流程，每台自己的 `k` / `d`，乾淨的紙，門蓋關閉。

| 機台 | 相機模組 | 曝光數 | 比對到（補上） | RMS |
|---|---|---|---|---|
| 第一台 `fbm2` | `GP_Flip_Mirror` | 2 | 16 (0) | 0.449 mm |
| 第二台 `fbm2` | `GP_Flip_Mirror` | 2 | 16 (0) | 0.468 mm |
| 第三台 `fbm2`，0.3 mm 標記點 | `USB 2.0 Camera` | 2 | 16 (2) | 0.382 mm |
| 第三台 `fbm2`，0.5 mm 標記點 | `USB 2.0 Camera` | 2 | 16 (0) | 未記錄 |
| 第三台 `fbm2`，0.5 mm 標記點，最下面幾列有強烈反光（2026-11-24） | `USB 2.0 Camera` | 7 | 16 (1) | 0.344 mm |

**改變曝光後的第一張照片（2026-11-24 發現）。** 上表各列的相機並沒有以設定的曝光拍照。在 `fbm2` 上，只要相機在改變曝光前閒置過（前一張照片的偵測，1.5 到 2 秒），`setExposure` 之後的第一張照片仍然是前一個曝光：7 次改變中 7 次都如此，舊的亮度最晚在改變後 1.0 秒才回來；第二張才是新的曝光。連續拍照、中間沒有停頓時不會出現，所以固定等待並不是已知的解法。因此第一輪拍到的是相機原本的曝光與 75，而不是 `[75, 200]`，800 則從未拍到。`autoLocateMarks` 現在每次改變曝光後丟掉一張照片（每張 0.4 到 0.7 秒）。同一台、同一張紙，修正前後：第一輪後是 16 個中的 13 個與 14 個，全部七張後的弱候選補點是 2 個與 1 個。那一台在那種光線下偏亮：最下面幾列靠 50 與 75（有一個標記點只在相機下限 50 以弱候選出現），200 掉了一半，350 以上沒有貢獻。曝光輪維持不變：它們來自 v4l2 掃描，那是真正設定到的曝光，而且有三台。`fbb2` / `fhx2rf` / `ado1` 的相機沒有量過；多丟一張對它們無害。T16 的雷射頭結果是以相機原本的曝光拍的（`fbb2` 是 252），不是 250。

- **遮住的標記點（第二台，一塊板子蓋住兩個標記點）。** 第一版實作：16 個中的 15 個，RMS 3.5 mm，板子上距離被遮標記點 7 mm 的一個暗點被當成那個標記點；合併七個曝光時，16 個中的 11 個、4.2 mm，是位移一列的格點。兩者反正都會被拒絕，但顯示給使用者的數量是錯的。以嚴格階段與每個種子 16 個鄰居修正：16 個中的 14 個，RMS 0.37 mm，`NOT_ENOUGH_MARKS`，兩輪都是。
- **第三台。** 另一種相機模組（曝光範圍 1 到 5000 而不是 50 到 10000，焦距 1394 對 1331 到 1357）。燈板造成的鏡頭眩光，讓左下兩個標記點在 5 到 1200 的每個曝光下都只有平常約十分之一的對比，所以沒有任何曝光救得回來；遮住燈板有部分幫助。它們是 3.6 與 5.2 px 寬。由弱候選補點找到，並在 CHECK_PNP 上對齊。這一台的照片搭配另外兩台的 `k` / `d` 擬合到 0.57 到 0.64 mm，用自己的是 0.37 到 0.38 mm：這是第一個真正的跨模組數字，也是共用值要以模組為鍵的原因。

**8 個標記點的配置，離線（2026-11-19）。** 每台一張來自手動流程的照片，該機台自己的 `k` / `d`，由已提交的程式比對。紙是重複使用的 `fbm2` 校正紙，所以每張照片都帶有外觀相同的舊標記點。

| 機台 | 暗點 | 比對到 | RMS | 標記點大小 | 備註 |
|---|---|---|---|---|---|
| `fbb2` 雷射頭 | 16 | 8 個中的 8 個 | 0.031 mm | 7.5 到 12.3 px | 8 個舊標記點排成一列穿過圖樣；半張紙在陰影中 |
| `fhx2rf` 雷射頭 | 12 | 8 個中的 8 個 | 0.10 mm | 8.5 到 12.5 px | 斜視角；儲存的 `k` 仍有歪斜 4.41 |
| `ado1`，第一個高度 | 40 | 8 個中的 8 個 | 0.042 mm | 4.7 到 6.5 px | 整個機架都在視野內 |
| `ado1`，第二個高度 | 39 | 8 個中的 8 個 | 0.050 mm | 4.7 到 6.5 px | 一個標記點落在雕刻字母的筆畫上，仍然找到 |
| Promark，220 mm 鏡頭，用過的紙 | 54 | 8 個中的 0 個 | n/a | 2.3 到 2.5 px，亮 | 暗色偵測器找不到任何標記點 |
| Promark，同一台，素面黑紙 | 48 | 8 個中的 0 個 | n/a | 2.5 到 3.2 px，亮 | 暗色偵測器找不到任何標記點 |

- 遮住任何一個標記點時，每個案例都回傳 7 個標記點與 `NOT_ENOUGH_MARKS`；從來沒有舊標記點被當成缺少的那個。途中發現並修正了兩個問題：距離缺少的標記點 14 mm 的一個舊標記點把寬鬆擬合拖走，直到一個真的標記點失去位置（現在嚴格階段以 RANSAC 起始），以及上面提到的自相似六標記點擬合。
- 手動流程中用手確認的點與自動的相差 0.5 px 以內，但它們是吸附到同一個偵測器上的，所以確認的是暗點的選擇，不是位置的準確度。
- 正向假設在四種機型上都成立，包括這台 Promark。
- Promark，亮點偵測器（不在程式裡）：在一般的最小面積 15 px 下，兩張紙上都找不到標記點。在 4 px 下，用過的紙上找到 8 個中的 7 個（85 個暗點）；素面紙上一張照片找到 8 個中的 8 個（90 個暗點，比對到 8 個中的 8 個，RMS 0.265 mm，與手動擺放的點相差 1.7 px 以內），30 秒後同一次雕刻的第二張照片找到 8 個中的 7 個。影像是每 mm 2.4 px，所以殘差約 0.6 px：這是標記點的大小造成的，不是配錯。乾淨一點的紙能去掉雜點，但去不掉原因；標記點太小了。

尚待量測：A6 手動與自動在檢查標記點上的準確度、A8 的散佈、拍攝時間、R_MAX 會擋下多少現場機台。

---

## 12. 測試計畫

| 項目 | 涵蓋 | 方式 |
|---|---|---|
| T1 | A1、A7 | 實機，`fbm2`，基本模式。三台通過（§11） |
| T2 | A2 | 實機，進階模式，傾斜的 ChArUco 拍攝 |
| T3 | A3 | 實機：空白紙上按 Skip；拿走紙；移動紙。遮住標記點的變化在一台上通過（§11） |
| T4 | A4 | 實機：印刷圓點、關燈、開燈 |
| T5 | A5 | 實機：拍攝期間開門 |
| T6 | A6 | 實機：標記點的照片，以送出的 `h` 用 fluxghost 的預覽程式變形，同一台上手動與自動比較；加上 Beam Studio 中的目視檢查 |
| T7 | A8 | 實機：跑五次，比較姿態 |
| T8 | §7.2、§7.3 | fluxghost `tests/usage/test_auto_pnp.py`（22 個測試）：`fbm2` 各曝光、遮住的標記點、淡的標記點、8 個標記點的照片、websocket 指令。通過 |
| T9 | §6 | `ws_smoke.py` 結尾為 `ALL PASS`；`test_camera_match_points.py` 不變且通過；`fbb2` 或 `fhx2rf` 上的手動校正仍然可用 |
| T10 | §6 | Print and Cut 的標記點偵測（`detect_blobs`）在一次對位執行中不變 |
| T11 | 邊界情況表 | `common/autoLocateMarks.spec.ts`：曝光輪、失敗原因、有點與沒有點的殘差過高、曝光與自動曝光依序還原、拋出錯誤。通過。對話框的分支由 `Beamo2Calibration.spec.tsx`、`LaserHeadFisheyeCalibration.spec.tsx` 與 `AdorCalibration/AdorCalibration.spec.tsx` 涵蓋（9 + 9 + 8 個測試）：`UNSUPPORTED` 時退回手動步驟、缺標記點、基本與進階模式下殘差過高警告的兩邊、拋出錯誤、從下一步按 Back，以及 `fbm2` 在 PUT_PAPER 再次執行前的釋放與狀態更新。未涵蓋：拍攝期間關閉對話框、啟動函式（`key`、`replaceOpenDialog`） |
| T13 | A10 | 實機，`fbm2`，調低 `R_MAX_MM`：基本模式的警告。切換到進階模式在一台上通過（2026-11-20，在重新掛載的修正之後）；Continue Anyway 與進階模式的變化沒有記錄結果 |
| T14 | A11 | 實機，`fbm2`：從 CHECK_PNP 按 Back 再按 Skip，基本與進階。卡住的轉圈畫面與遺失的 ChArUco 結果已修正；最後一項變更（`releaseMachine` 內的狀態更新）尚未確認 |
| T16 | A12 | 實機，雷射頭相機。`fbb2`：在 250 的一張照片 8 個中的 8 個，rms 0.046 mm。`fhx2rf`：自動曝光開啟、在 250 下 8 個中的 8 個，rms 0.105 mm；下方內側兩個標記點在 CHECK_PNP 中偏了約 0.2 mm（3 px），與逐標記點的殘差相符，已接受。遮住標記點與 Back 未記錄 |
| T17 | A13、A14 | 實機，`ado1`，在一張帶有舊 `fbb2` 圖樣的紙上：第一次執行為較低高度存下了錯誤的姿態（舊圖樣，rms 0.05 mm）；加上比例檢查之後，兩個高度都比對到新的標記點（同樣的照片離線為 0.071 與 0.055 mm），預覽正確 |
| T18 | §7.3.1 | `common/autoLocateMarks.spec.ts`（12 個測試）與 `beamo2Calibration/autoSolvePnP.spec.ts`（4 個測試）。通過。fluxghost `test_auto_pnp.py` 現在有 22 個測試，包含 T17 的 `ado1` 照片 |
| T15 | 邊界情況表 | 實機，`fbm2`，自動曝光開啟：找到 16 個標記點，之後自動曝光再次開啟。一台通過（2026-11-20） |
| T12 | A9 | Beam Studio 對上 #128 之前建置的 fluxghost：出現手動步驟；對上新的並遮住一個標記點：警示、取消，以及點落在標記點上的手動校正。未在實機上執行。Spec：`common/showNotEnoughMarksAlert.spec.ts`、`autoLocateMarks.spec.ts` 與 `autoSolvePnP.spec.ts` 的起始點，以及三個對話框 spec 裡的手動選擇（`ado1` 兩個高度）；fluxghost `test_auto_pnp.py`（缺兩個標記點的 `fbm2` 照片上，預測位置在 10 px 內）。`helpers/api/camera-calibration.spec.ts`（6 個測試）涵蓋舊後端實際送出的回覆 |
