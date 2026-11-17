# PRD：校正工作的錯誤處理（吹氣警告、標記字母）

| | |
|---|---|
| **Status** | 已於 #1055 實作（Beam Studio `fix/camera-calibration-resumable-errors`）；單線字型為 dev 功能，在 Beam Studio `dev/single-line-font`。吹氣自動繼續已在本地實機測試過，其餘尚未實機測試 |
| **Author** | Beam Studio 前端 |
| **Created** | 2026-11-13 |
| **Target product** | Beam Studio（桌面版 + 網頁版） |
| **Owner area** | 機器工作流程／校正工作 |
| **Related code** | `packages/core/src/web/helpers/device-master.ts`（`waitTillStatusPredicate`、`doCalibration`）；`packages/core/src/web/helpers/device/taskPausePrompt.ts`；`packages/core/src/web/helpers/fcode/addFcodeMetadata.ts`、`crc32.ts`；`packages/core/src/web/assets/fcode/*.fc`；`packages/core/src/web/helpers/fonts/singleLineFont.ts`、`packages/core/src/web/app/actions/beambox/font-funcs.ts` |
| **External repos** | 韌體 `BeamOS_NX_backend` `src/player_v4`（`766cdd2`，韌體團隊實作） |

---

## 1. 摘要

在 Beamo II（`fbm2`）相機校正時發現兩個問題：

1. **吹氣警告讓校正失敗。** `bm2-calibration.fc`、`bb2-calibration-wide-angle.fc`、
   `hx2-calibration-wide-angle.fc` 刻意把吹氣設為 0%（打在白紙上，吹氣會讓紙浮動）。新版韌體會以
   `HARDWARE_ERROR AIR_ASSIST_OUT_OF_RANGE` 暫停這類工作。Beam Studio 把暫停判成工作失敗，停止監聽
   player report，也不顯示任何錯誤；但使用者其實可以從面板繼續工作。
2. **雕刻的 label 文字沒有痕跡。** `bm2-calibration.fc` 的 label 參數太弱。改成 S20P5，並順便改用單線
   字型，因此實作了單線字型的文字轉路徑（只做轉路徑功能，對於開放路徑文字的顯示暫不處理）。

## 2. 背景與現況

### 2.1 吹氣檢查（韌體）

- `task_loader_v2.cpp:368`：POST 的 `air_assist` 在 `[0, 500)`（吹氣低於 50%）時設定
  `low_air_assist_power_warning_`。`initialize_state.cpp` 的 `handlePrepare` 會加入
  `HARDWARE_ERROR`、`AIR_ASSIST_OUT_OF_RANGE` 兩個錯誤，並進入 `kInitializePause`
  （`PAUSED_FROM_STARTING`，st_id 36）。POST 沒有 `air_assist` 時讀到 -1（`task.h:395`），不檢查。
- 同時設定 `air_assist_ignore_ = true`，所以繼續工作後不會再檢查一次。
- 韌體 `766cdd2`（"add flag to ignore air assist warning check"，已在 `release/v6.5.4`、
  `promark-updates`、`HX2/qrcode-handle`）新增 FILE metadata `IGNORE_AIR_ASSIST_WARNING`：
  `FileMetadata::getIgnoreAirAssistWarning()` 以 `data.value("IGNORE_AIR_ASSIST_WARNING", "0")` 讀取後
  `std::stoi`，非 0 時略過檢查。
- 錯誤清單是累加的 vector（`status.h:11`），同一次暫停可能帶著多個錯誤。

### 2.2 Beam Studio 原本怎麼等校正工作（修改前）

`waitTillStatusPredicate`（main `61439bba7`，`device-master.ts:763`）用 `setInterval` 每秒取一次
report，遇到 `ABORTED`、`COMPLETED`、`PAUSED_FROM_STARTING` 且帶錯誤時就 reject，所以吹氣暫停
（36 + 錯誤）會立刻被判為失敗。呼叫端只記 log，例如 `Beamo2Calibration.tsx:188`
（`console.error(err)`），使用者什麼都看不到。interval 裡取 report 失敗會變成未處理的 rejection，
輪詢則會一直持續。

### 2.3 哪些校正工作吹氣低於 50%

所有經過 `waitTillStatusPredicate` 的工作：

| 工作 | 入口 | POST `air_assist` | 受影響 |
|---|---|---|---|
| `bm2-calibration.fc` | `doBeamo2Calibration`（`Beamo2Calibration.tsx:185`） | 0, 0 | **是** |
| `bb2-calibration-wide-angle.fc` | `doBB2Calibration('wide-angle')` | 0 ×5 | **是** |
| `hx2-calibration-wide-angle.fc` | `doHexa2Calibration('wide-angle')` | 0 ×5 | **是** |
| `hx2-calibration.fc`、`bm2-ir.fc` | `doHexa2Calibration()`、`doBeamo2IRCalibration` | 1000 | 否 |
| `bb2-calibration.fc`、`bm2-4c.fc`、`ador-*.fc` | `doBB2Calibration()`、`doBeamo24CCalibration`、Ador | 未寫入 | 否 |
| `beam-series-*.fc`（v1） | `runBeamboxCameraTest`、`doDiodeCalibrationCut` | 沒有 POST chunk | 否 |
| Print & Cut 刮紙校正（`scratchTask.ts`） | 即時產生 | 後端預設 100% | 否 |
| Beamo 24C 模組校正（`bm2-4c-scene.txt`） | 即時產生 | 100% | 否 |
| Promark 校正／Z 軸調整 | Swiftray，振鏡機 | 無 | 否 |

### 2.4 有字母標記的校正檔

從各檔案的 PREV 預覽圖確認，只有以下三個檔案有 A–D 四個字母標記，剛好就是吹氣 0% 的三個：

- `bm2-calibration.fc`
- `bb2-calibration-wide-angle.fc`
- `hx2-calibration-wide-angle.fc`

其他檔案只有定位點或十字線（`ador-printer.fc` 是一個小方塊圖片，不是字母）。

## 3. 目標與非目標

**目標**

- 刻意關閉吹氣的校正工作，在新韌體、舊韌體上都能跑完；舊版 Beam Studio 也不會完全卡住。
- 校正工作因可繼續的錯誤暫停時，Beam Studio 持續監聽，並提供「停止工作」、「繼續工作」；真的失敗的
  工作要告知使用者。
- `fbm2` 校正的 label 字母看得到。

**非目標**

- 從 Monitor 開始的一般工作（`MonitorContext.tsx`）：暫停處理維持原樣。
- 單線字型在畫布上的顯示（只處理文字轉路徑）。
- 即時產生的校正工作的吹氣設定（都不低於 50%，見 §2.3）。

## 4. 情境

| # | Beam Studio | 韌體 | 行為 |
|---|---|---|---|
| S1 | 新 | 新 | `doCalibration` 送出前在 FILE json 加上 `IGNORE_AIR_ASSIST_WARNING "1"`，韌體略過檢查，工作不暫停 |
| S2 | 新 | 舊（有檢查、不認得這個 key） | 韌體暫停並報 `AIR_ASSIST_OUT_OF_RANGE`；若這是唯一的錯誤，Beam Studio 自動下 resume 並繼續監聽，等於用軟體在舊韌體上做到 `IGNORE_AIR_ASSIST_WARNING`。期間面板會維持吹氣警告 |
| S3 | 舊 | 新或舊 | fcode 不含檔名或任何可辨識為校正檔的資訊，韌體照常暫停並警告。使用者可從面板繼續；Beam Studio 已停止監聽，可用校正對話框的「跳過雕刻」（`handleNext(false)`）避免完全卡住 |
| S4 | 新 | 任一 | 其他可繼續的暫停（濾網到期、探針露出、門蓋開啟…），或吹氣警告同時帶有其他錯誤：顯示翻譯後的錯誤與「停止」、「繼續」按鈕，持續監聽；工作從面板繼續或停止時，提示自動關閉 |
| S5 | 新 | 任一 | 工作真的失敗（alarm、fatal、帶錯誤的 abort、上傳失敗、連續 10 次讀不到 report）：顯示錯誤 |

## 5. 驗收標準

- **S1**：`fbm2` + 新韌體，相機校正 → 放紙 → 下一步。工作不暫停直接雕刻，對話框進入下一步。上傳
  `bm2-4c.fc`（沒有吹氣設定）的行為與之前相同。
- **S2**：同流程，韌體為不認得這個 key 的版本。機器因吹氣警告暫停，不需任何點擊，數秒內自動繼續；
  校正完成，對話框進入下一步。
  - 邊界：暫停時門蓋也開著（錯誤清單不只吹氣），**不自動繼續**，改顯示停止／繼續提示。
  - 邊界：resume 沒生效、機器仍回報同一個暫停時，3 秒後再送一次 resume。
- **S3**：用目前的正式版跑同流程。機器暫停；從面板繼續可以畫完；「跳過雕刻」可讓對話框往下走。
- **S4**：bm2 校正途中打開門蓋（或在有探針的機器上讓探針露出）。跳出翻譯後的錯誤，按鈕為「停止」、
  「繼續」（繼續為主要按鈕）。按繼續，工作繼續；按停止，工作中止且不再另外報錯。改從面板繼續時，
  提示自動關閉。按 Esc 關閉提示，工作維持暫停；出現新的錯誤會再詢問。
- **S5**：校正途中觸發 alarm（例如偵測到火焰）或中斷連線。跳出翻譯後的錯誤；斷線約 10 秒後顯示
  「無法讀取機器的工作狀態，請檢查機器與連線狀態。」Print & Cut 刮紙校正與 Promark 校正不會多跳一個
  視窗（`silent`，由呼叫端自己回報）。
- **Label**：`fbm2` 校正的 A–D 四個字母以 S20P5 打在白紙上清楚可見。

## 6. 不可改變的行為

| 共用檔案／函式 | 呼叫端 — 必須維持的行為 |
|---|---|
| `device-master.ts` `waitTillStatusPredicate` | `doCalibration`、`runBeamboxCameraTest`、`doDiodeCalibrationCut` — 完成時 resolve 並 quit，失敗時 reject；`ZAxisAdjustment.tsx:42` — 仍依自己的 predicate resolve |
| `device-master.ts` `doCalibration` | Beamo2、BB2／HX2（魚眼與廣角）、Ador、模組校正（IR、4C）、Promark（`silent`）、Print & Cut 刮紙（`silent`）— 除 FILE json 外，送出的位元組不變；v1 fcode 與 Promark 的空 blob 原樣送出 |
| `sliceFcode.ts`（crc32 移到 `helpers/fcode/crc32.ts`） | Path Preview「從這裡開始」— 輸出完全相同 |
| `DeviceErrorHandler.translate`（`ILang.monitor`） | `MonitorContext.tsx` — 視窗與按鈕不變；只有 `AIR_ASSIST_OUT_OF_RANGE`、`FILTER_EXPIRED` 從原始字串改為顯示翻譯文字 |
| `scratchTask.ts` | Print & Cut 校正 — 失敗仍由 `PrintAndCutCalibration` 回報，不會多一個視窗 |
| `font-funcs.ts` 文字轉路徑 | 所有封閉輪廓的字型 — 路徑與之前相同（單線判斷只對 stroke 字型生效） |

## 7. 設計

### 7.1 輪詢（`waitTillStatusPredicate`，`device-master.ts:777`）

`while` 迴圈，每秒取一次 report：

- 取 report 失敗 → 記 log、下一輪重試；連續 10 次失敗 → reject
  `Error(message.unable_to_get_task_status)`；
- `predicate(st_id)` 成立 → 關閉提示、等 1 秒、`quit`、resolve；
- 暫停（`PAUSED`、`PAUSED_FROM_STARTING`、`PAUSED_FROM_RUNNING`）且帶錯誤 → `pausePrompt.show(error)`，
  繼續輪詢；
- `ABORTED` → 若是從提示按停止則 reject `[]`，否則 reject 錯誤清單；
- `ABORTED`／`ALARM`／`COMPLETED`／`FATAL`（不符合 predicate）且帶錯誤 → reject 錯誤清單；
- 狀態變過之後回到 `IDLE` → resolve；其他狀態回報進度。

提示一律在 `finally` 關閉。

### 7.2 暫停提示（`taskPausePrompt.ts`）

- `createTaskPausePrompt({ onResume, onStop })`：每個不同的錯誤只跳一次提示，按鈕為「停止」、「繼續」；
  `USER_OPERATION` 用說明樣式，其他用錯誤樣式。按下按鈕後 3 秒內（`ACTION_GRACE_MS`）不再詢問，因為
  機器可能還會回報一兩輪舊的暫停。
- **吹氣自動繼續（S2）**：`show` 收到的錯誤若 `isAirAssistWarningOnly`（`taskPausePrompt.ts:33`，錯誤清單
  恰好是 `HARDWARE_ERROR, AIR_ASSIST_OUT_OF_RANGE`），直接 resume、不跳提示（`taskPausePrompt.ts:102`）。
  程式註解標明這相當於在舊韌體上用軟體做 `IGNORE_AIR_ASSIST_WARNING`。吹氣加上其他錯誤（例如門蓋開啟）
  仍然詢問；之後若只剩吹氣警告（門蓋已從機器端關上），先關掉原本的提示再 resume，避免留下失效的按鈕。
  目前只有校正工作會用到這個提示。
- **多個錯誤（`translateTaskError`）**：錯誤清單是累加的，`DeviceErrorHandler.translate` 只比對最長的已知
  前綴，`HARDWARE_ERROR, AIR_ASSIST_OUT_OF_RANGE, DOOR_OPENED` 只會顯示吹氣警告。整串不是已知 key 且帶兩個
  以上細項時，逐一翻譯 `[main, detail]`、去重後以空行串接，提示與 `alertTaskError` 都用它。
- `alertTaskError` 回報最終錯誤（`Error.message` 或翻譯後的錯誤清單）；空清單（單純中止）不顯示。
  `doCalibration(silent)` 讓自行回報的呼叫端略過。

### 7.3 校正 metadata（`addFcodeMetadata.ts`，於 `doCalibration` 呼叫，`device-master.ts:969`）

- v2 以上的 fcode（`FCx0002\n`…），FILE chunk 緊接在 magic 之後。先讀前 16 bytes，再只讀 json，合併
  `{ IGNORE_AIR_ASSIST_WARNING: '1' }`，重組 `magic | FILE | len | json | crc32`，其餘部分以 `Blob.slice`
  接上（不複製）。每個 chunk 各有 crc32，PREV／CONT／POST 不受影響。
- 實測每次約 0.02 ms，從 0.3 MB 到 500 MB 都一樣。
- 其他情況（v1、空 blob、檔頭不完整、json 解析失敗）原樣回傳。
- 以檔案格式判斷，不看機型：v1 機型沒有 FILE json；不認得這個 key 的韌體會直接忽略。
- 值必須是**字串** `"1"`：韌體以 `data.value(key, "0")` 讀取，存成數字時 nlohmann json 會丟 type_error。
- repo 裡的靜態校正檔不再手動加這個 key，統一由 `doCalibration` 在送出時補上。

### 7.4 校正檔

- `bm2-calibration.fc`：label 圖層改為 S20P5，A–D 改成單線字（封閉的部分做了 tabbing）。
- `bb2-calibration-wide-angle.fc`、`hx2-calibration-wide-angle.fc`：A–D 改成與 bm2 相同的單線字與 tab，
  label 圖層參數未改（P2，S20／S30）。以 fluxclient 2.10.4 重新匯出（縮圖裁切到內容範圍）。與 main 比對：
  打點圖層每條掃描線的出光範圍完全相同（每條線前後的空白各多 0.4 mm），label 路徑長 209.1 → 106.7 mm，
  四個字母位置不變；FILE 無 `IGNORE_AIR_ASSIST_WARNING`、`FORBIDDEN_HEADTYPE`（與 main 相同）。
- 三個檔案的單線字原檔放在 `resources/calibration-tasks/`，檔名與 `.fc` 相同。

### 7.5 單線字型文字轉路徑（dev 功能，`singleLineFont.ts`，分支 `dev/single-line-font`）

TrueType 輪廓一定是封閉的，fontkit 的 `toSVG` 也一律補上 `Z`，所以 stroke 字型的每一筆都會多一段連回
起點的線。

- 是否為單線字型由使用者決定，存在文字元素的 `data-single-line="true"`（已加入 `sanitize.js` 的 text
  白名單）。不從字形自動判斷：誤判會讓一般字型每個輪廓少掉閉合邊，畫布上看不出來。
  （2026-11-16 改；原本以「面積 / 周長」的細輪廓比例判斷。）
- `isSingleLineFont(elem)` 只看這個屬性；dev 開關關閉時仍以屬性為準。
- 開關：物件面板文字設定的「單線字型」，只在 `isSingleLineFontDev()`（`helpers/is-dev.ts`，目前等於
  `isDev()`）時顯示。開啟時同一個 undo 步驟內取消填滿；開啟後隱藏文字填滿選項、停用「銲接文字」。
- `pathToOpenSvg(path, closeGap)`：起點與終點距離大於 `closeGap`（字級的 1%）時拿掉 `Z`。
- `font-funcs.ts`：text-on-path 與 tspan 都改用它轉換；單線字型略過 `weldPath`，並設定
  `preferGhost = false`（fluxsvg 會閉合所有輪廓）。

## 8. 資料規格

| 位置 | Key | 值 | 讀取端 |
|---|---|---|---|
| FILE json | `IGNORE_AIR_ASSIST_WARNING` | `"1"`（字串） | 韌體 `766cdd2`：略過吹氣檢查 |
| Report | `st_id` 36 + `HARDWARE_ERROR, AIR_ASSIST_OUT_OF_RANGE` | — | §7.1、§7.2 |
| i18n | `monitor.HARDWARE_ERROR_AIR_ASSIST_OUT_OF_RANGE`、`monitor.HARDWARE_ERROR_FILTER_EXPIRED` | 「#938／#940 標題\n內文」 | `DeviceErrorHandler.translate`（10 種語言同步 ador-panel `beam-os-2.0` `7cb90aaf`，其餘 13 種依新版英文翻譯） |
| i18n | `message.unable_to_get_task_status` | — | §7.1 |

## 9. 上線計畫

1. Beam Studio PR `fix/camera-calibration-resumable-errors`：輪詢與提示、吹氣自動繼續、metadata、校正檔、
   i18n。
2. Beam Studio PR `dev/single-line-font`（dev 功能，非修正）。
3. 韌體 `766cdd2` 隨 `release/v6.5.4` 發布。

## 10. 待決事項

1. ~~S2 自動繼續要不要正式上線~~ — 2026-11-13 決定上線：本地已實機測試；只在錯誤清單恰好為吹氣警告時
   自動繼續，並以註解標明它是舊韌體上的軟體版 `IGNORE_AIR_ASSIST_WARNING`。
2. ~~三個靜態檔是否保留手動加的 `IGNORE_AIR_ASSIST_WARNING`~~ — 2026-11-13 決定移除，統一由
   `doCalibration` 補上。
3. ~~值用字串還是數字~~ — 2026-11-13 確認韌體 `766cdd2` 讀字串，維持 `"1"`。
4. ~~三個有字母標記的校正檔改用單線字~~ — 2026-11-16 完成：單線版本的原檔存進 `resources/calibration-tasks/`
   （不打包）；bb2／hx2 的 `.fc` 已重新匯出並比對（§7.4），bm2 的 `.fc` 已是單線版本（label 路徑長 106.6 mm）。

## 11. 風險與後續

- S2 不經詢問就繼續工作。吹氣警告是為了防火；之所以可以接受，是因為這三個檔案的低吹氣是校正檔本身
  的設定，而且只在沒有其他錯誤時才自動繼續。
- 舊校正檔（Ador、`bb2-calibration.fc`、`bm2-4c.fc`）若用新版後端重新匯出，會寫入 `air_assist`；若為 0
  就會加入受影響名單（由 §7.3 在執行時處理）。
- Monitor 的一般工作遇到兩個新 key 時會顯示翻譯文字（§6），行為不變。

## 12. 測試計畫

| 情境 | 自動測試 | 手動測試 |
|---|---|---|
| S1 | `addFcodeMetadata.spec.ts`（v2／v3 合併、crc、其餘位元組不變、實際的 `bm2-4c.fc`、v1／空／截斷／壞 json 原樣回傳）；`device-master.spec.ts` › `doCalibration` 上傳的是補過 metadata 的 blob | fbm2 + 新韌體 |
| S2 | `taskPausePrompt.spec.ts` › `isAirAssistWarningOnly`、只有吹氣警告時不詢問直接 resume、grace 後重試、吹氣加門蓋時詢問、門蓋關上後只剩吹氣時關掉提示 | fbm2 + 不認得 key 的韌體（已本地測試） |
| S3 | — | 目前正式版 |
| S4 | `taskPausePrompt.spec.ts`（每個錯誤只問一次、關閉、按鈕、grace、`translateTaskError` 多個錯誤分開翻譯）；`device-master.spec.ts` › 可繼續的暫停持續輪詢、提示按鈕 | 開門蓋／探針 |
| S5 | `device-master.spec.ts` › 帶錯誤時 reject、連續 10 次讀取失敗、重試會歸零；`taskPausePrompt.spec.ts` › `alertTaskError` | alarm、斷線 |
| Label／字型 | `singleLineFont.spec.ts` | 在白紙上印 bm2 校正 |
