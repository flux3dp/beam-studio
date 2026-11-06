# 自動全範圍預覽：姿態檢查（fluxghost 配套 PRD）

本文件為 `auto-full-area-preview-pose-check.md` 的中文翻譯；英文版為準，程式識別字維持英文。

| | |
|---|---|
| **Status** | 草稿（2026-11-06）。研究資料已在 fhx2rf 收集（14 次開關門、103 張原始影格）；設計已定；尚未寫程式。 |
| **Author** | FLUX software team |
| **Created** | 2026-11-06 |
| **Target product** | Beam Studio 2.7.x + fluxghost 2.5.8，fbb2 與 fhx2rf |
| **Owner area** | fluxghost camera endpoint；Beam Studio camera client 與自動全範圍預覽任務 |
| **Parent PRD** | `docs/prd/auto-full-area-preview.md`（§2.7 評估過的訊號、§7.3 開蓋迴圈） |
| **External repos** | fluxghost：`fluxghost/api/camera.py`、`fluxghost/api/fisheye_camera_mixin.py`、新檔 `fluxghost/utils/camera/pose_check.py`、`docs/api/camera.md`、`tools/lid_angle.py`（研究工具） |
| **Related code** | `packages/core/src/web/helpers/api/camera.ts`、`packages/core/src/web/helpers/device-master.ts`（`takeOnePicture`）、`packages/core/src/web/helpers/device/camera/autoFullAreaPreview.ts`（`captureOpenLid`、`pickPhoto`）、`.github/workflows/app.cd.*.yml`（fluxghost tag） |

## 1. 摘要

fbb2 與 fhx2rf 的自動全範圍預覽在開蓋期間連拍，關門時畫一張（母 PRD §7.3）。那張照片必須是門蓋在校正止點時拍的：其他姿態，包括只稍微放下的門蓋，都會讓重投影後的床台前緣拉長數公分。本 PRD 是這個挑片的 fluxghost 半邊。fluxghost 本來就在重投影前解碼每張原始影格，在影格上量兩側機架邊框（側邊尺規）的角度，與儲存的校正資料推算出的「門蓋在止點時的角度」比對，每張影格回報門蓋 OK 與否；Beam Studio 畫最新一張 OK 的，沒有任何一張 OK 就什麼都不畫（母 PRD 決策 7）；檢查無法啟用時迴圈不啟動。不需重新校正：參考值來自每次廣角校正本來就存的外參。

## 2. 背景與現況

### 2.1 影格流程

- fluxghost `fluxghost/api/camera.py` 的 `on_image`（第 94 行）收到機器送來的每張 JPEG。魚眼機型在 `fisheye_param` 設定後會解碼、呼叫 `handle_fisheye_image`（`fisheye_camera_mixin.py:311`）去畸變並投影到工作區格線，再編碼成一則 binary 訊息送出。解碼後的原始影格只存在於 `on_image` 裡；重投影會把邊框裁掉，所以檢查必須放在 fluxghost。
- Beam Studio `helpers/api/camera.ts` 把收到的訊息分成 binary（影格）與非 binary（`{status}` JSON）兩條流（`wsSubject`，第 104 行）。`sendOneShot`（第 410 行）送 `require_frame` 並以下一則 binary 訊息 resolve；沒有待回覆指令時收到的 JSON 會被丟掉。`device-master.ts` 的 `takeOnePicture`（第 1670 行）包住它，回傳 `{ imgBlob, needCameraCableAlert }`。
- 開蓋迴圈 `captureOpenLid`（`autoFullAreaPreview.ts:249`）連相機、切到廣角相機、送 v4 參數與全範圍格線（`hx2FullAreaPerspectiveGrid` x 0–740、y 0–410；`bb2FullAreaPerspectiveGrid` x 0–600、y 0–375，`app/constants/fisheyeCameraConstants.ts`）與高度 0，然後連續呼叫 `takeOnePicture` 直到門回報關閉。`pickPhoto`（第 42 行）決定要畫哪一張。
- fhx2rf 實測節奏（2026-11-06）：全解析度（3264×2448）每 3 到 4 秒一張，因此一次開關門只有 2 到 5 張照片；只看時間挑片實際上等於挑倒數第二張（母 PRD §2.7）。

### 2.2 校正姿態

廣角校正（`components/dialogs/camera/WideAngleCamera/index.tsx`）是 v4：`k`、`d`、九個分區的 `rvec_polyfits` / `tvec_polyfits`，由 `set_fisheye_height`（`fisheye_camera_mixin.py:191`，v4 分支在 227–236 行逐區算出 `rvecs` / `tvecs`）在指定高度求值。校正是在門蓋完全打開到止點時拍的，手動預覽也要求使用者打開門蓋，所以止點是重投影唯一有效的姿態。`project_points`（`fluxghost/utils/camera/calibration.py:232`）把床台座標（mm，z = 0）經魚眼模型投影成原始影格像素。

### 2.3 影格呈現的事實（fhx2rf，2026-11-06）

在 14 次開關門（正常、快、慢關；手放材料；門蓋停在半開；門蓋停在三種小傾角；蓋著深色板子長時間開蓋）傾印原始影格，用 `tools/lid_angle.py`（1280 px 寬，Canny + 機率式 Hough，兩側外帶內最長的近垂直線段，量與垂直的夾角）量測。

| 門蓋姿態（靜止） | 左邊框 | 右邊框 | 收斂（右 − 左） | 床台前緣，占高度比例 |
|---|---|---|---|---|
| 完全打開，每一次 | +1 到 +2° | −2 到 −3° | −3 到 −5° | 0.74 |
| 極小傾角 | −1.0° | −0.9° | 0.0° | 0.78 |
| 小傾角 | −4.0° | +3.0° | +7° | 0.85 |
| 中傾角 | −10° | +7° | +17° | 0.92 |
| 關門中、模糊 | ±1° 或 ±20° | | | 找不到 |
| 幾乎關上 | 找不到 | 找不到 | | 找不到 |

- 全開姿態在每一次、有手入鏡、床上有無板子、昏暗場次都一樣：每側散佈小於 1°。
- 收斂角隨傾角單調變化。與鉸鏈平行的邊先位移（極小傾角時前緣 0.74 → 0.78，全解析度約 100 px），收斂角才跟上。
- 極小傾角已把床台往前拉長約 7% 深度，後緣為零：410 mm 床台重投影後前緣可差到約 3 cm。因此拒絕：校正沒看過這個姿態，手動預覽也不會拍出來。
- 門蓋移動中拍到的影格有動態模糊與 rolling-shutter 扭曲。它們的邊框有時仍量到與全開差 ±1° 以內（half-2 第 3 張、tilt-very-small 第 5 張），所以單靠角度擋不掉。整張影格的清晰度（Laplacian 變異數）與 Hough 線段數都不能當絕對門檻：昏暗場次的有效影格讀 300–500，明亮場次 2000–2900，模糊影格 500–1300。
- 床台前緣當第二訊號不好：大多數有手的影格都被手或板子遮住。

## 3. 目標與非目標

目標

- 開蓋迴圈的每張照片都帶一個在原始影格上、對照該機器自己校正資料量出的門蓋 OK 判定，不新增校正步驟。
- 挑片畫最新一張 OK 的，否則什麼都不畫：被拒絕的照片永遠不會當盡力而為畫出。
- 沒有要求檢查的相機連線完全不變：同樣的訊息、同樣的影格位元組、同樣的時間。

非目標

- fbm2：關門後在 raw 模式拍（母 PRD §2.2），沒有門蓋姿態可檢查。
- 修正傾斜照片而非拒絕它。
- 改變迴圈的影格節奏或解析度。
- 手動預覽的姿態檢查（靠使用者；母 PRD §3）。

## 4. 情境

- **S1 正常關門。** 門蓋開到止點、放材料、正常速度關門。畫出的是在止點拍的最新一張；關門瞬間還在傳的那張（模糊或傾斜）永遠不會被畫。
- **S2 慢關。** 門蓋花數秒放下。下降途中拍的影格不通過；畫出的是最後一張在止點拍的，不論多久以前，只要還在保留的照片內（`KEEP_PHOTOS`）。
- **S3 門蓋沒到止點。** 使用者只開一半、放材料、關門。沒有影格通過；什麼都不畫、沒有 toast。console log 說明原因。
- **S4 手在邊框上。** 某張影格有手或板子蓋住一側尺規。那張失敗（找不到邊框），畫更早一張在止點拍的。
- **S5 校正沒有姿態。** 參數不是 v4 或無法啟用檢查：fluxghost 回錯誤，Beam Studio 記 log、結束迴圈不拍照，和沒有廣角校正時一樣。
- **S6 手動預覽、校正對話框、Promark。** 不變：從不啟用檢查，看不到任何新訊息。

## 5. 驗收條件

| # | 步驟 | 預期 | 邊界 |
|---|---|---|---|
| L1 | fhx2rf，自動預覽開啟。門蓋開到止點，等 6 秒，正常關門。 | console log 列出每張照片的 `pose ok` / `pose no` 與量測、預期角度；畫出的是最新的 `pose ok`；關門瞬間在傳的那張是 `pose no` 或不存在。 | 快關：同；最後一張可能是唯一的 `pose no`。 |
| L2 | 同上，花約 4 秒關門。 | 門蓋移動中拍的照片是 `pose no`；畫出的是最後一張在止點拍的。 | 關門前讓門蓋停在小傾角 5 秒：那些照片是 `pose no`。 |
| L3 | 門蓋只開一半，放材料，關門。 | 所有照片 `pose no`；log 寫 `no pose-ok photo`；背景不變、沒有 toast。 | — |
| L4 | 拍照時把手放在左尺規上。 | 那張是 `pose no`（找不到左邊框）；畫更早一張。 | 手只在蜂巢板上：`pose ok`。 |
| L5 | 同一台機器做手動預覽（全範圍）。 | websocket 紀錄裡沒有 `frame` JSON；影格大小與時間和沒有這個改動的版本相同。 | 相機校正對話框：同。 |
| L6 | fluxghost 在沒設 v4 參數時收到 `set_pose_check`。 | `{"status": "error", "error": ["No fisheye params"]}`；之後的 `require_frame` 仍正常回影格。 | Beam Studio 端：log `pose check unavailable`、迴圈結束、沒有照片。 |

## 6. 不可改變

fluxghost

- `fluxghost/api/camera.py` `on_image` — 所有既有呼叫路徑（手動預覽、校正、Promark、舊韌體的串流）：影格位元組、順序、影格前沒有任何 JSON，除非該連線用 `set_pose_check` 啟用了檢查。
- `fluxghost/api/fisheye_camera_mixin.py` `set_fisheye_height` — 只在檢查啟用時重算預期邊框；其餘情況透視點與時間不變。
- `cmd_mapping` 字串 — `set_pose_check` 是新增；沒有任何改名。

Beam Studio

- `helpers/api/camera.ts` `sendOneShot` / `oneShot` — 所有呼叫端（預覽管理器、校正對話框、`takeOnePicture`）拿到同樣的 `{ imgBlob, needCameraCableAlert }`；多出來的 `pose` 欄位為選填，檢查未啟用時不存在。
- `sendCommandWithNonBinaryResult` — `frame` 訊息只會在 `require_frame` 與其影格之間送出，而 `oneShot` 與其他指令共用同一個 command queue，所以不會有指令回覆被誤認。
- `helpers/device-master.ts` `takeOnePicture` — 回傳型別只多一個選填欄位。
- `autoFullAreaPreview.ts` `captureOpenLid` — 開蓋迴圈的相機設定與收尾維持原樣；啟用失敗走和沒有校正相同的出口。

## 7. 設計

### 7.1 由校正推算預期邊框（fluxghost）

新檔 `fluxghost/utils/camera/pose_check.py`：

- `expected_rims(k, d, rvecs, tvecs, bed_w, bed_h, is_fisheye)`：把床台兩側邊 x = 0 與 x = bed_w 取成點 (x, y, 0)，y 從 0 到 bed_h 每 10 mm 一點，分別用 `left` 與 `right` 分區外參（`set_fisheye_height` 算出的 `rvecs['left']` / `rvecs['right']`）經 `project_points` 投影。對每組投影點做最小平方直線擬合，得到預期的與垂直夾角與中高處的預期影像 x，單位是原始影格像素。尺規位於工作區邊緣稍外側；全開姿態下兩側邊近乎平行，偏 20 mm 只讓預期角度變約 0.1°，低於容差。量到實際偏移後記錄之（開放決策 3）。
- `measure_rims(gray, expected, tolerance_deg)`：縮到 1280 px 寬（與重投影相同的 `preview_downsample` 策略）、高斯模糊 5、Canny 50/150、`HoughLinesP`（1 px、1°、門檻 80、最短長度為寬的 8%、間隙 10 px）。每側保留中點距預期 x 在寬度 5% 以內、角度與預期差 10° 以內的線段，取最長者回報角度。結果 `{ok, left, right, expected_left, expected_right}`，兩側都找到且各自與預期差在 `tolerance_deg` 內時 `ok` 為 true。

門檻（`CANNY`、Hough、帶寬）為具名並附註解的模組常數；數值與研究工具在 fhx2rf 資料上用的相同，工具與模組可以互相驗證。

### 7.2 指令與訊息（fluxghost）

- `set_pose_check <json>`：`{"enabled": true, "tolerance_deg": 1.5}` 或 `{"enabled": false}`。啟用需要 v4 `fisheye_param` 且 `rvecs` / `tvecs` 已算出（已呼叫過 `set_fisheye_height`）並有 `grids` 提供床台尺寸；否則 `{"status": "error", "error": ["No fisheye params"]}`。啟用時算預期邊框，啟用狀態下 `set_fisheye_height` 內重算。回覆 `{"status": "ok"}`。
- `on_image`：啟用且影格解碼成功時，在 `handle_fisheye_image` 之前對原始影格跑 `measure_rims`，然後在 binary 影格前立刻 `send_json(status='frame', pose={...})`。任何例外都只送影格不送訊息，每條連線記一次錯誤 log。
- `docs/api/camera.md` 加入指令與訊息；`tools/ws_smoke.py` 加一個在假連線上啟用檢查、看到 `frame` 訊息先於 binary 的案例。

### 7.3 客戶端（Beam Studio）

- `Camera`（`helpers/api/camera.ts`）：`setPoseCheck(enabled)` 透過 `sendCommandWithNonBinaryResult`。非 binary 流保留最新一則 `{status: 'frame'}`，binary 流在下一個 blob 到達時取走它，所以配對依到達順序（fluxghost 在影格前一刻送出訊息），與請求時間無關；結果帶 `pose`，影格前沒有訊息則不存在。
- `device-master.ts` `takeOnePicture` 把 `pose` 傳出去。
- `autoFullAreaPreview.ts`：`setFisheyeObjectHeight(0)` 之後 `await deviceMaster.setPoseCheck(true)`；回 false 記 log（`pose check unavailable`）、在拍任何照片前結束迴圈，和沒有校正一樣。`Photo` 加 `poseOk: boolean`。`pickPhoto(photos, lastOpenAt)`：門仍回報開啟時完成的照片中，最新一張 `poseOk` 的；沒有 → 什麼都不畫（母 PRD 決策 7）。每張照片連同判定與角度記 log，硬體測試可直接從 console 讀。

### 7.4 模糊門檻

不在本 PRD 第一版。單靠角度測試會放過少數關門中的模糊影格（§2.3）。候選方案，在 fluxghost PR 之前用既有傾印資料量測（開放決策 2）：

- 邊框帶與同連線前一張影格的差異：手在床台上移動時尺規不動，所以兩側邊框帶變化大代表門蓋在影格之間或期間動了。每條連線多保留一組灰階帶。
- 邊框帶清晰度相對前一張的變化。

在它落地前，通過角度測試的模糊影格可能被畫出。

## 8. 資料契約

- `→ set_pose_check {"enabled": true, "tolerance_deg": 1.5}` / `{"enabled": false}` → `← {"status": "ok"}` 或 `← {"status": "error", "error": ["No fisheye params"]}`。
- `← {"status": "frame", "pose": {"ok": true, "left": 1.9, "right": -2.4, "expected_left": 1.6, "expected_right": -2.9}}`，接著 binary 影格。角度單位為與垂直的夾角（度），上端向右傾為正，四捨五入到 0.1；找不到邊框時 `left` / `right` 為 `null`。
- Beam Studio：`takeOnePicture` 結果加 `pose?: { ok: boolean; left: null | number; right: null | number; expected_left: number; expected_right: number }`。

## 9. 效能

- 研究工具：Python 每張 3264×2448 影格約 0.4 秒，含 JPEG 解碼與疊圖輸出；解碼 `on_image` 本來就付了，1280 px 的 Canny + Hough 約 100 ms。對 3 到 4 秒的節奏，迴圈週期增加不到 5%。
- 記憶體：每張影格一份 1280 寬灰階，用完即釋放；重投影的 downsample 重試不變。

## 10. 上線

1. fluxghost PR：`pose_check.py` + 以 2026-11-06 傾印裁出的四張 1280 px 固定樣本（全開、小傾角、關門模糊、幾乎關上）做單元測試；`set_pose_check`；`frame` 訊息；`docs/api/camera.md`；`ws_smoke.py` 案例；`tools/lid_angle.py` 以研究工具身分提交。Tag 2.5.8。
2. Beam Studio，在母功能分支合併前：`camera.ts`、`device-master.ts`、`autoFullAreaPreview.ts` + spec，CD workflow 升到 `flux3dp/fluxghost@2.5.8`，本 PRD Status 列改為已實作。本功能從第一版就帶著這個檢查出貨。

## 11. 開放決策

1. **容差。** 提案每側 1.5°。fhx2rf 資料：全開散佈小於 1°，極小傾角左側差 3°、右側差 2°，小傾角差 6°。fbb2 跑完（3）再定。
2. **模糊門檻**（§7.4）：邊框帶差異、邊框帶清晰度、或不加。fluxghost PR 前用 `tools/lid_angle.py` 在既有傾印資料上兩者都量。
3. **fbb2 資料。** 尚無 fbb2 影格。在 fbb2 收同一組開關門，確認止點時邊框在視野內，並記錄兩機型尺規距工作區邊緣的偏移。
4. **投影擬合。** 投影點的直線擬合與 Hough 線段在魚眼弧線上量到的弦之間的差。在所見帶長下預期小於 0.5°；在固定樣本上驗證，不符則放寬容差。

## 12. 風險與後續

- **R1 節奏。** 每 3 到 4 秒一張，快關可能只剩一張或零張 OK 照片；零張就是這次沒有照片。用低解析度迴圈影格可提高節奏但改變預覽解析度；不在範圍內。
- **R2 止點漂移。** 門蓋不再停在校正姿態的機器每張都失敗，默默不畫。逐張 log 看得出來；支援文件應說明要重新校正，母 PRD F3 可能補 toast。
- **R3 沒有分區外參的校正。** v4 之前的參數無法啟用檢查（S5）。廣角校正全是 v4，這只是防禦路徑。
- **F1** 模糊門檻（決策 2）在兩機型都站得住後，統計真實機器上多常有一次開關門沒有 pose-OK 照片，據此決定母 PRD F3（toast）。

## 13. 測試計畫

- fluxghost：`pose_check` 單元測試用四張固定樣本（預期邊框來自一組儲存的 v4 參數；`ok` true / false / false）；`ws_smoke.py` camera 案例啟用檢查（訊息先於影格）與未啟用（沒有訊息）。`uv run python tools/ws_smoke.py` 必須以 `ALL PASS` 結束。
- Beam Studio：`camera.spec.ts` — `sendOneShot` 在 `frame` 訊息先於 blob 時附上 `pose`，否則不存在；`autoFullAreaPreview.spec.ts` — `pickPhoto` 回最新 pose-OK 照片、沒有就不畫、啟用失敗記 log 且迴圈結束不拍照。
- 硬體：fhx2rf 跑 L1–L6，再在 fbb2 跑 L1–L4；把 14 次傾印資料重新餵給 fluxghost 模組，確認判定與研究表一致。
