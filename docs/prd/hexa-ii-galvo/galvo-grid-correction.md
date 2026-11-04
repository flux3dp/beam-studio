# PRD: HEXA G 振鏡網格校正表（9×9 grid correction）

| | |
|---|---|
| **Status** | Implemented (unverified on hardware)，2026-11-03。bsl（BeamOS `1746707`、`81e1352`）、player 與 control task（BeamOS `0610bd9`）、fluxghost 解算（`8c40e71`）、Beam Studio 設定與校正區塊都已完成，皆未 push、未部署。下一步是 §10 決策 1 的機器語意探測 |
| **Author** | EstherFu |
| **Created** | 2026-11-03 |
| **Target product** | Beam Studio（desktop + web），機型 `fhx2galvo`（HEXA G） |
| **Owner area** | 振鏡設定（`components/dialogs/promark/`）、裝置通訊（`helpers/device/`） |
| **Related code** | 振鏡設定與型別：`packages/core/src/web/helpers/device/galvoConfig.ts`（`GalvoGridCorrection`、`gridCorrection`）、`packages/core/src/web/app/components/dialogs/promark/GalvoSettings.tsx`；校正區塊：`packages/core/src/web/app/components/dialogs/promark/GalvoCalibrationBlock.tsx`；解算參數與表的合成：`packages/core/src/web/helpers/device/galvoCalibration/solve.ts`（`composeGridCorrection`、`GRID_SIGN`）；振鏡參數送卡（不改）：`packages/core/src/web/helpers/device/galvoExec.ts` |
| **Companion PRD** | `docs/prd/hexa-ii-galvo/hexa-g-galvo-calibration.md`：本 PRD 是它 §3 Non-goals 與 §12「原始場（identity grid）」列為後續的 9×9 網格表；圖樣、掃描、解算都沿用它 |
| **External repos** | `BeamOS_NX_backend`（`promark-updates`）：`src/bsl/bsl_controller.{h,cpp}`（`applyGalvoParams`、`setGalvoParam`）、`src/bsl/bsl_socket.cpp`（`;CONFIG`）、`src/bsl/liblcs/lcsApi.h`（`set_gridcor_params`、`set_gridcor_layer`、`clear_gridcor_layer`）、`src/player_v4/include/galvo_optics.h`（`gridLine`）、`fluxmonitor/controller/tasks/galvo_exec.py`（`grid_command`）、`control_task.py`、`fluxmonitor/storage.py`（`galvo_key_list`）、`tools/bsl-gridcor.py`；協定 `docs/agents/HX2_GALVO_PROTOCOL.md`。`fluxghost`（`dev/hx2-g`）：`fluxghost/utils/camera/galvo_coupon.py`、`fluxghost/api/opencv.py`，改完跑 `uv run python tools/ws_smoke.py`。`swiftray`：不改 |
| **Measurements** | test7 照片與總覽照：session scratchpad `check7/`（`final.py`、`ov/homo.py`）；原始照片 `~/Downloads/step chain/` |

---

## 1. Summary

卡上的八項 manual 修正值修不到 f-theta 的三次項。目前的參數讓 ±50 的邊對準，代價是場內側被壓縮：中心附近的比例短 1–2%。tile 拼接時，同一條接縫兩側的內容各自落在場的不同位置，這個比例差就變成錯位。

控制卡 SDK 本身有網格校正（`set_gridcor_layer`，3–65 點），bsl 還沒接。本 PRD 把它接起來：用既有 coupon 掃描量到的 81 個 node 產生 9×9 表，隨振鏡參數一起送到卡上。

## 2. Background & current state

### 2.1 量測證據

- 校正 PRD 決策 31、34：六張掃描一致量到 X³ / Y³ 約 0.46 / 0.48 mm（在 ±44 處），八項參數都修不到；±50 邊對準時，場中段 ±29 mm 處短約 0.3 mm。
- test7（2026-11-03，龍門每步 8 mm 的游標尺鏈，振鏡只用中心 ±4 mm）：每步讀值一律偏大，X 約 +0.09～+0.16、Y 約 +0.09～+0.12 mm，換算是中心 ±4 mm 的比例短 1.1–2%。
- 總覽照（兩支鋼尺做透視校正）加上手量：龍門 X 160 mm 誤差 < 0.5 mm，所以每步的 +0.1 不是龍門比例造成的，否則 20 步會累積成 +2 mm。振鏡 ±40 跨距 X 80.04 / Y 79.06，±20 跨距 39.74 / 39.10：外圈準、內圈短。
- 由三次項推算：邊對準時中心比例約短 1.4%，與上面三組量測吻合。

### 2.2 現有的套用路徑

- Beam Studio `galvoExec.ts` 的 `toGalvoOptics` 把 15 個欄位攤平送到機器；機器要求整組一起送，缺欄位就回 `fail GALVO_OPTICS_INCOMPLETE`。
- bsl 用 `;CONFIG <key> <value>` 經 `setGalvoParam`（`bsl_controller.cpp`）存值，`applyGalvoParams()` 在每個區塊開頭（`setUpTaskCtrl`）以及斷線重連時送 `lcs_set_scanahead_params`、`lcs_set_manual_correction_params`。目前沒有任何地方呼叫 `set_gridcor_*`。
- SDK（`lcsApi.h`）提供的介面：
  - `set_gridcor_params(fGalvoSize, nResolution, bXyFlip, bXInvert, bYInvert)`
  - `set_gridcor_layer(nSize, 理論X[], 理論Y[], 實際X[], 實際Y[])`，nSize 為 3／5／9／17／33／65
  - `clear_gridcor_layer()`
  - `save_correction_file` / `load_correction_file`（type 2 = Grid）

  全部都是 CONTROL 指令，說明只有幾行，語意要實測確認（§10 決策 1）。

## 3. Goals & non-goals

**Goals**

1. bsl 能接收、儲存並套用一張 9×9 網格表，可以清除，斷線重連後會重新套用。
2. fluxghost 的 coupon 解算輸出建議的網格表，涵蓋整個場（110 場是 ±55）。
3. Beam Studio 的振鏡設定可以保存網格表並送到機器；「套用建議」可以更新它。
4. 套用後 coupon node 殘差 RMS ≤ 0.05 mm。

**Non-goals**

- 龍門位置誤差（每步 ±0.1 mm 不均勻、Y 行程可能短 0.7%）：網格表在雷射頭座標系，修不到。另開龍門位置誤差圖。
- X 移動後還沒停穩、停靠點第一個 list 偏弱：test8（2026-11-03）確認第一個 list 偏弱，已改成每個 block 第一個 list 開頭等 50 ms（swiftray `9189d0e`）；龍門沒停穩沒有重現。
- 由 swiftray 預先扭曲座標（備案，§11）。
- 17×17 以上的表。

## 4. Scenarios

- **S1 探測語意（工程師）**：用 `tools/bsl-gridcor.py --probe 1` 送一張「identity，只有 (+41.25, −27.5) 那一點移 +1 mm」的表；兩張紙各打一個 coupon（不帶表／帶表），掃描比較。
- **S2 第一次建表**：拿最終參數下的 coupon 掃描（或重打一張）跑解算，得到 9×9 建議表 → 套用 → 重打 coupon → 掃描 → 殘差 RMS 降到目標。
- **S3 迭代**：殘差還沒達標時，以帶表打的 coupon 再解算一次，把修正疊加到目前的表上。
- **S4 驗收**：test7 游標尺鏈與 100 mm 方框拼接。
- **S5 清除**：設定裡清掉網格表，機器回到只有八項參數的行為。

## 5. Acceptance criteria

| 場景 | 怎麼操作 | 完成的判準 | 邊界情況 |
|---|---|---|---|
| S1 | 照 §7.4 送探測表，打兩個 coupon，掃描 | 帶表那張只有 (+44, −22) 附近的 node 移動，移動方向與大小可由表推算；其他 node 變動 ≤ 0.03 mm | 全場都動了表示表被當成取代、不是疊加，記錄後改 §7.3 的起算方式 |
| S2 | 解算 → 套用建議 → 重打 coupon | node 殘差 RMS ≤ 0.05 mm、最大 ≤ 0.1 mm | 外插點（±55）的誤差較大，以 ±44 內的 81 點為判準 |
| S4 | 打 test7 | 每步偏差的平均值在 ±0.03 mm 內 | 步與步之間 ±0.1 的不均勻屬龍門，不算 |
| S4 | 100 mm 方框拼接（校正 PRD §7.10） | 接縫錯位 ≤ 0.1 mm | |
| S5 | 清除網格表後打 coupon | 與 S1 的不帶表 coupon 相同 | |
| 斷線 | 套表後拔網路線再接回，打 coupon | 結果與套表時相同（重連後重新套用） | |

## 6. Must not change

| 觸及的共用檔案 | 呼叫者 | 必須維持的行為 |
|---|---|---|
| `bsl_controller.cpp` `applyGalvoParams()` | `setUpTaskCtrl` | 沒有網格表時，送卡的指令與現在完全相同 |
| 同上 | 斷線重連（`isConnected`） | 重新套用 scanahead 與 manual 參數；有表時再加網格表 |
| `bsl_socket.cpp` `;CONFIG` | Beam Studio `galvoExec`、LightBurn bridge | 既有 key 的語意與回覆格式不變；`jump_delay`、`arm` 等不受影響 |
| `galvoExec.ts` `toGalvoOptics` | 振鏡設定預覽、校正流程的打 coupon／打 L | 沒有改：15 個欄位照舊整組送。網格表不從 Beam Studio 直接送，而是存進機器設定後由機器端送（§7.3） |
| `galvoConfig.ts` `GalvoConfig`、`getGalvoConfig` | 所有讀振鏡設定的地方 | 沒有網格表的舊設定照常讀取，`gridCorrection` 不存在（不是 null） |
| `GalvoSettings.tsx` `handleSave` | 振鏡設定的儲存 | 照舊整份寫回；畫面上沒動過網格表時，`gridCorrection` 原樣寫回 |
| `solve.ts` `buildSolveParams` | 校正區塊的「解算」 | 既有參數不變，只多 `grid_size`、`grid_field` |
| `galvo_coupon.py` `solve_galvo_coupon` | Beam Studio「解算」、Load photograph | 既有輸出欄位不變，只多 `grid` |
| `storage.py` `galvo_key_list` | `config set galvo_co2／galvo_mopa` | 既有五個 key 照舊；多收 `gridCorrection` |
| `galvo_optics.h` `configLines` | player 每個 job 開頭送振鏡參數 | 設定裡沒有 `gridCorrection` 時，送出的行與現在完全相同 |
| `control_task.py` galvo 操作 | Beam Studio 的打 coupon、預覽、打點 | 設定裡沒有 `gridCorrection` 時，送給 bsl 的步驟與現在完全相同 |

## 7. Design

### 7.1 表的定義

- 9×9 網格點，在場座標上等距：110 場是 −55, −41.25, …, +55（間距 13.75）。順序與 SDK 的陣列順序在 §10 決策 1 確認後寫死。
- 「理論」= 指令座標；「實際」= 帶著目前八項參數打出來，在龍門 mm（L 框尺規）量到的位置。
- 不在網格點上的位置由卡內插值處理。

### 7.2 fluxghost：由 81 node 產生表

1. 沿用 `solve_galvo_coupon` 的 node 結果：每個 node 的指令座標（±44、間距 11）與 L 框座標系下的量測座標，扣掉場心偏移與旋轉（這兩項由 offset 與 angle 處理，不放進表裡）。
2. 對兩個軸各擬合一個雙變數三次多項式（10 項），取值到 9×9 網格點。±44 之外是外插，殘差另外標註。
3. 輸出 `grid: { size, field, dx: [size²], dy: [size²], fit_rms_mm, fit_max_mm, extrapolated }`。`dx`、`dy` 是每個網格點的「落點 − 指令」位移，順序是從 (−f/2, −f/2) 開始、X 先變的列優先；`extrapolated` 是超出 coupon 範圍、靠外插得到的點數（110 場是 81 − 49 = 32）。`grid_size`（預設 9）、`grid_field`（預設 110，Beam Studio 傳 `config.workarea`）由參數決定。實作：`galvo_coupon.grid_table`，fluxghost `8c40e71`。
4. 由 Beam Studio 合成新表（`composeGridCorrection`）：
   - 打 coupon 時已經帶表：新表 = 當時機器上的表 + `GRID_SIGN`（+1）× 本次量到的位移。這次量到的是「帶著舊表還剩下的誤差」，所以一階近似下直接相加即可。
   - 打 coupon 時沒有表，或舊表的大小、場不同：那張 coupon 是用八項參數打的，而載入表後八項參數會失效（決策 1），所以它的量測不能用。新表改成「純比例表」（`scaleGridCorrection`，100 / scale），要先帶這張表再打一次 coupon。
   - invert／flip 旗標一律取 `config.field`。

### 7.3 bsl：保存與套用

- 新指令 `;CONFIG gridcor <size> <field> <flip> <invert_x> <invert_y>`，後面接每個點的 `tx ty ax ay`（共 size² 組）。用純數字而不是 JSON：bsl 沒有 JSON 解析器，數字格式也和其他 `;CONFIG` 一致。`;CONFIG gridcor clear` 清除，不帶參數是讀回。frame 有長度前綴、上限 4 MB，9×9 表約 6 KB，不用分段。
- 保存在 `BslController::grid_correction_`（與 `correction_params_` 同一把鎖）。`applyGalvoParams()` 在 manual 參數之後依序呼叫 `set_gridcor_params(field, 65535, flip, invert_x, invert_y)`、`clear_gridcor_layer`、`set_gridcor_layer`。
- 沒有表時不呼叫任何 gridcor API。只有「送過表、之後被清掉」的情況，才補送一次 `clear_gridcor_layer`（用 `grid_on_card_` 記錄），所以從沒用過網格表的機器，送卡的指令和現在完全相同。
- 每個 job 結束不會清掉網格表（它是校正資料，不是一次性的預覽設定）。但表只存在 bsl_app 的記憶體，bsl_app 重啟就消失；正式版由 Beam Studio 或 player 負責重送（§10 決策 4）。
- 只有在振鏡參數設定過之後（`galvo_params_configured_`），`setUpTaskCtrl` 才會呼叫 `applyGalvoParams`。player 和 `galvo_exec` 每次都會先送振鏡參數，所以實務上一定會套用。
- 機器端工具 `tools/bsl-gridcor.py`，提供 `--show`／`--clear`／`--probe DX`／`--file` 四種用法。點的順序是從 (−f/2, −f/2) 開始、X 先變的列優先；這個順序對不對，由探測決定。
- 第一階段（探測用）只做 `;CONFIG gridcor`，不改 Beam Studio。實作在 BeamOS `1746707`（未 push、未部署）。
- 正式路徑（BeamOS `0610bd9`）：表存在機器的 `galvo_co2.json`／`galvo_mopa.json` 的 `gridCorrection` key（已加進 `galvo_key_list`）。player 每個 job 開頭（`GalvoOptics::gridLine`），以及 control task 的每個振鏡操作（`galvo_exec.grid_command`，也就是 Beam Studio 打 coupon、預覽時），都在送完振鏡參數之後送 `;CONFIG gridcor`。兩邊規則相同：
  - 沒有這個 key：不送，bsl 保留自己手上的表。所以用 `bsl-gridcor.py` 手動送的探測表，在測試它的 job 中不會被蓋掉。
  - `null`：送 `clear`。
  - 物件：送整張表；格式不對就記錄錯誤並略過，不送半張表。
- 因為每個 job 都會重送，bsl_app 重啟後表就消失的問題，在正式路徑上不存在。

### 7.4 探測表（決策 1 用）

表 = identity（實際 = 理論），只把網格點 (+41.25, −27.5)（索引 (7, 2)）的「實際」往 X 移 +1 mm。不用 (+55, +55)：它在 coupon 的 ±44 之外，雙線性內插傳到最近 node 的權重只有 0.04。選 (+41.25, −27.5) 有兩個理由：它周圍的 node (44, −22)、(44, −33) 權重約 0.48，(33, −22)、(33, −33) 約 0.24；而且 |x| ≠ |y| 且兩者都不是 0，陣列順序被轉置或某一軸被鏡像時，移動會出現在另一個可辨認的位置。

做法：兩張同樣的紙放在同一個位置，各打一次 coupon（只按「打 coupon」，不用打 L 框，因為比較的是兩張 coupon 之間 node 的相對位移）。coupon 1 不帶表，coupon 2 先送 `bsl-gridcor.py --probe 1`。打完兩張後執行 `--clear`，再一起掃描。
- 只有 (+44, −22) 附近的 node 往 ±X 移約 0.25–0.5 mm：表是疊在 manual 參數之上，移動方向決定正負號。
- 整個場都變了：表取代了 manual 參數，§7.2 的「實際」要改成「不帶任何修正時」的量測值。
- 完全沒變：沒有啟用，再試 `select_cor_table(1, 0)` 或 `load_correction_file`。

### 7.5 Beam Studio

- `GalvoConfig` 新增可選欄位 `gridCorrection?: GalvoGridCorrection | null`。內容是 size、field、dx、dy，以及選填的 flip／invertX／invertY、fitRmsMm、createdAt；後兩項只在畫面上顯示，機器不使用。
  - `undefined`：從沒設定過，機器不送，保留卡上原有的表。
  - `null`：已清除，機器會送 `clear`。
- Beam Studio 不直接把表送給控制卡，只寫進機器設定（按 Save 時跟其他欄位一起寫）；送卡由機器端負責（§7.3）。
- 校正區塊（dev）：
  - 解算結果表多一列「Grid table」：大小、最大位移、三次擬合 RMS／最大值、外插點數。
  - 「Apply grid table」：用 `composeGridCorrection` 合成新表，放到畫面上的設定，按 Save 才寫進機器。表裡已經包含比例誤差，所以同一次解算只能套用網格表或比例建議其中一種，不要兩個都套（按鈕的 title 有說明）。
  - 打 coupon 時，會記下當時機器上**已儲存**的表，因為 control task 送的是已儲存的表，不是畫面上的；載入照片解算時沒有這筆紀錄，就用已儲存的表代替。
  - 狀態列顯示畫面上的表：大小、最大位移、擬合 RMS、建立時間，或「無／按 Save 後清除」；另有「Clear grid table」按鈕。

## 8. Data contracts

- `;CONFIG gridcor <size> <field> <flip> <invert_x> <invert_y> <tx ty ax ay>…` → 回 `CONFIG gridcor …`（存下的表，全精度）。
  - 格式錯：`ERR: CONFIG gridcor expects …`
  - size 不在 3/5/9/17/33/65、field 不在 (0, 1000]、數值非有限：`ERR: CONFIG gridcor value out of range`
  - 振鏡忙碌：`ERR: CONFIG gridcor refused, the galvo is busy`
- `;CONFIG gridcor clear` → `CONFIG gridcor none`。
- `;CONFIG gridcor` → 目前的表，或 `CONFIG gridcor none`。
- fluxghost `solve_galvo_coupon` 回傳新增 `grid` 欄位（§7.2）；節點少於 10 個時為 null。
- 機器設定 `galvo_co2`／`galvo_mopa` 的 `gridCorrection`：`{"size": 9, "field": 110, "dx": [81 個], "dy": [81 個], "flip"?: bool, "invertX"?: bool, "invertY"?: bool, "fitRmsMm"?: number, "createdAt"?: string}`，或 `null`。player 與 `galvo_exec` 把它展開成 `;CONFIG gridcor`：理論點由 size、field 推出，實際點 = 理論點 + (dx, dy)。

## 9. Rollout (PR plan)

1. ~~BeamOS：`;CONFIG gridcor` 與套用邏輯~~（`1746707`、`81e1352`）。
2. 探測（S1），依結果定案 §10 決策 1，必要時改 `GRID_SIGN`、點的順序或 flip／invert 旗標。需要部署 bsl_app。
3. ~~fluxghost：`grid` 輸出與單元測試~~（`8c40e71`）。
4. ~~BeamOS：機器設定 `gridCorrection` 與 player／control task 送出~~（`0610bd9`）。需要部署 player 與 Python 套件。
5. ~~Beam Studio：設定欄位、清除、套用網格表~~。
6. 兩輪 coupon（S2、S3）＋驗收（S4）。

## 10. Open decisions

1. ~~SDK 語意~~（2026-11-04 決定，兩次探測）：網格表與 manual 參數、scanahead（angle、offset、invert、swap）的套用順序；陣列順序；「實際」的定義；是否需要 `select_cor_table` 才會生效。結論：不需要 `select_cor_table`；載入表後八項 manual 參數與 scanahead invert 失效，invert 改由 gridcor 旗標決定；區域偏移仍有作用；「實際」= 落點（`GRID_SIGN` +1）；陣列是 X 先變的列優先。angle 很可能仍有作用：第二次探測量到 rotation 0.067°，如果失效預期約 0.16°；剩下的旋轉在網格模式下由 angle 處理。
   - 2026-11-04 第一次探測（`~/Downloads/fluxghost-frames/1104-grid-test/` test1 不帶表、test2 帶 `--probe 1`）：不需要 `select_cor_table`，表會直接生效。但**載入表之後，八項 manual 參數和 scanahead 的 invert 都失效了**：coupon 變成 X ×1.161、Y ×1.246（manual scale 100/87.14 = 1.148、100/79 = 1.266），超出可達範圍，右側和 identity 環被切掉；雕刻也改成從右下角開始。所以網格表必須是**完整的校正**，invert 要放在 `set_gridcor_params` 的旗標裡。
   - 第二次探測：`bsl-gridcor.py --scale 1.1476 1.2658 --invert-x 1 --invert-y 1`，打 coupon 加 L 框。大小正確代表「實際」= 落點；比例再放大代表正負號相反；X、Y 比例對調代表順序被轉置；解算出的 rotation 和場心位置，可以判斷 angle 和區域偏移在網格模式下還有沒有作用。
   - 第二次探測結果（test3）：scale 1.0066 / 0.9899、skew −0.05°、rotation 0.067°、場心 (−0.07, −0.01) mm、identity 環方向和 invert 一致；原始誤差 RMS / max 0.51 / 1.68 mm（純比例，沒有桶形等修正）；三次擬合 RMS / max 0.050 / 0.087 mm。第一張完整的表 = 比例表 + 本次位移，存在 `~/Downloads/fluxghost-frames/1104-grid-test/grid-round1.json`。
   - 程式已改：`composeGridCorrection` 的 invert／flip 旗標取 `config.field`；打 coupon 時如果機器上沒有表，就改用 `scaleGridCorrection`（100 / scale）產生第一張表，不使用這次量到的位移，畫面會提示要先帶這張表再打一次 coupon。
2. 外插：±44 → ±55 用三次擬合外插，或改 coupon 版面把 node 打到 ±55。第一輪先外插，殘差在邊緣不達標再改版面。
3. ~~網格表與八項參數的關係~~（2026-11-04，由決策 1 決定）：載入表時卡不使用八項參數，所以表是完整的校正。八項參數保留在設定裡，清除網格表後回到原本的 manual 模式。
4. ~~保存位置~~（2026-11-03 決定）：存在機器的振鏡設定 `galvo_co2.json`／`galvo_mopa.json`，和其他振鏡參數一樣由 player 和 control task 在每次操作時送出。不用 `save_correction_file`：那是卡上的檔案，換卡或重裝時不會跟著機器設定走。
5. ~~`GRID_SIGN`（`solve.ts`）~~（2026-11-04）：+1，第二次探測確認。

## 11. Risks & follow-ups

- **SDK 行為和說明不符**：探測一次確認不了時，最多再試一次。還是不行就改走 swiftray 預先扭曲座標的備案：長線要先切成短段才能跟著彎，fcode 會變大、雕刻時間增加。
- **表不隨龍門位置改變**：雷射頭偏擺、床面高度、光路偏移造成的位置相依誤差修不到。驗收時順便在床面四角和中心各打一個 coupon，判斷要不要另做龍門位置誤差圖。
- **重現性**：test8 會重打 test7 的 X 鏈，確認龍門步距誤差是否可重現，作為龍門位置誤差圖的前提。

## 12. Test plan

- BeamOS：`;CONFIG gridcor` 解析（合法、size 錯、長度錯、NaN）、`?` 回讀、`clear`；lcs-stub trace 確認 `applyGalvoParams` 在有表時送 `set_gridcor_params` + `clear_gridcor_layer` + `set_gridcor_layer`、清表後的下一個區塊送一次 `clear_gridcor_layer`、從未有表時 trace 與現在完全相同。
- BeamOS player：`gridLine` 對沒有 key、null、正常表、形狀錯誤四種輸入的輸出，並和 Python `grid_command` 的格式一致（目前在本機用主機編譯的小程式驗證過，沒有正式測試檔）。
- BeamOS Python（`tests/controller/tasks/test_galvo_exec.py`）：沒有 key 不送、null 送 clear、點的順序與理論／實際、形狀錯誤不送。已通過。
- fluxghost（`tests/usage/test_galvo_coupon.py`）：identity → 全 0；已知 x³／y³＋xy 位移 → 網格點誤差 < 1e-4 mm；X 先變的順序；完整解算輸出 `grid`、外插 32 點。`ws_smoke.py` ALL PASS。已通過。
- Beam Studio（jest，`--runInBand`，只跑受影響路徑）：`solve.spec.ts` 的 `composeGridCorrection`（從無到有、疊加並保留旗標、不同大小取代）、`gridMaxShift`、`buildSolveParams` 的 `grid_size`／`grid_field`；`galvoConfig.spec.ts` 讀設定時 `gridCorrection` 不存在／null／有表三種情況都原樣保留。已通過。
- 上機：§5 全部場景。
