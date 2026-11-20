# PRD: HEXA G 振鏡拼接策略「K 趟＋漫步」與開發設定整理

| | |
|---|---|
| **Status** | 草稿，參數已和使用者逐項確認（2026-11-18），尚未實作；2026-11-19 加入「空白跳躍前等待」（7.7，已上機驗證）；2026-11-20 拍板：跳躍速度預設 7000、直縫最小成本路徑納入實作（開關，預設開）、停頓預設維持 0、PWM 不動、色階對應暫不實作 |
| **Author** | EstherFu |
| **Created** | 2026-11-18 |
| **Target product** | Beam Studio（desktop + web）開發設定，機型 `fhx2galvo`（HEXA G）；swiftray fcode 匯出；HEXA G 韌體（bsl） |
| **Owner area** | 開發設定面板（`components/dialogs/GalvoDevSettings/`、`constants/galvo-dev-settings.ts`）；swiftray 振鏡點陣歸屬與 fcode 匯出 |
| **Related code** | `packages/core/src/web/app/constants/galvo-dev-settings.ts`（欄位表與分組）、`packages/core/src/web/app/components/dialogs/GalvoDevSettings/index.tsx`（面板）、`packages/core/src/web/helpers/api/svg-laser-parser.ts:129-168`（`fhx2galvo` 匯出參數，dev 覆寫以 `Object.assign` 併入）、`packages/core/src/web/helpers/device/galvoCalibration/backlash.ts:21`（`getFixBacklash`） |
| **External repos** | `swiftray`（branch `dev/hx2-galvo-blend`）：`src/toolpath_exporter/toolpath-exporter-fcode.cpp`（`apply_galvo_strategy` 約 158 行、參數讀取 290-410 行、分塊與 blend 設定約 1180-1215 行、debug 圖約 1664 行、點陣圖前處理約 2575-2600 行）、`src/toolpath_exporter/factories/laser-raster-galvo.{h,cpp}`（點陣歸屬）、`src/toolpath_exporter/toolpath-utils.cpp`（`get_galvo_block_size`）、`src/toolpath_exporter/generators/fcode-generator.cpp`（`sleep`）。`BeamOS_NX_backend`（branch `promark-updates`）：`src/bsl/bsl_controller.cpp:620-660`（`applyCardBaseline`、jump delay）、`src/bsl/bsl_socket.cpp:378`（`;CONFIG jump_delay`）、`fluxmonitor/controller/tasks/control_task.py:438` |
| **Companion PRD** | `docs/prd/hexa-ii-galvo/galvo-tiling-mode.md`（分塊方式）、`docs/prd/hexa-ii-galvo/hexa-g-galvo-calibration.md`（backlash、tile 順序） |
| **Playground** | 本機 `~/dev/hx2-galvo-tests/fc/test61.py`（KW 的參考實作，Python 直接寫 fcode）；測試紀錄 `~/Downloads/galvo-seam-tests/galvo-seam-tests.md` test44～test68（接縫 44～61k、牽連 62～65c、色階 66～68） |

---

## 1. Summary

接縫測試（test44～test61，紙板）找到一組明顯優於現行「重疊帶密度淡出」的點陣接縫做法：

- **K 趟**：每個 tile 的點陣依行號分成 K 趟打，趟與趟方向交替。
- **漫步**：每條縫沿著慢漫步曲線切割。
- **每趟偏移**：每一趟的切點再加一個固定偏移。
- **最小成本路徑**：直縫在漫步的許可範圍內改走墨最少的路徑，繞過跨 tile 的小突出、盡量切在空白處（開關，預設開）。

這份 PRD 把這套做法做成 swiftray 的拼接策略 **KW**，並藉這個機會整理 Beam Studio 的 HEXA II 開發設定：

- 「Simulator 策略」改名「拼接策略」，接縫參數只在選到使用它的策略時才顯示。
- 點陣圖的整體處理獨立成一區：二值化門檻、色調重新對應、dither 方式（新增藍噪聲）。
- 新增龍門 XY backlash 距離、停靠後等待、tile／趟之間停頓、jump delay。
- 調整幾個預設值：開光延遲 −680、關光延遲 200、跳躍速度 7000、list 指令上限 10000。
- 新增空白跳躍前等待（7.7），消除圖案之間空白裡的拖尾。
- debug 圖加上每條縫各趟的切點路徑。

所有項目都只出現在開發設定（dev flag 後面），不是一般使用者設定。

## 2. Background & current state

**接縫做法**：swiftray 現在對漸層點陣圖一律在接縫兩側的重疊帶裡逐點淡出（`galvo_dot_blend_*`）；線段圖（二值化、深度）走另一組線段策略（`galvo_line_blend_*`）。`galvo_strategy` 用 laser-phy-simulator 的 id 一次設定好這些欄位（`apply_galvo_strategy`），欄位本身仍可覆寫策略。

**測試結果**：實機測試（紀錄在 playground 的 galvo-seam-tests.md）顯示，淡出帶在紙板上會留下明顯的深淺帶。KW 的接縫在正面幾乎看不出來，代價是整體色調變淺、工時增加。測試中的 KW 是 Python 直接寫 fcode，swiftray 沒有對應實作。

**點陣圖前處理**（`toolpath-exporter-fcode.cpp` 約 2575-2600 行）：
- 漸層圖：`remapTone` → 材質（texturize）→ Qt `DiffuseAlphaDither`（Floyd–Steinberg）。
- 非漸層圖：`imageBinarize`。
- 沒有藍噪聲，也沒有在漸層圖上清掉淺色噪點的手段。

**backlash**：
- 現在只處理 X：`galvo_fix_backlash` 開啟時，每列停靠點從整批最左停靠點再往左 5 mm 開始（swiftray 258489a）。
- Y 沒有處理：換批回到第一列時是 −Y 進場（記憶與 calibration PRD）。
- 測試檔採用先 +Y 再 +X 各退 5 mm 的做法，實機正常。

**停靠後等待**：
- swiftray 已有 `galvo_block_start_delay`（ms，預設 50，`toolpath-exporter-fcode.cpp:391`），Beam Studio 面板沒有這個欄位。
- 50 ms 解決了「第一個 list 偏弱」（test8）。
- test61bm 停靠後沒有等待，直刻度不直，疑似龍門殘留晃動；修正版 test61bm2 等 300 ms，尚未上機。

**jump delay**：
- 不在 fcode 裡。bsl 在 `applyCardBaseline` 以 `lcs_set_delay_mode` 設定：預設在 10 mm 內從 200 µs 內插到 400 µs；`jump_delay_us_` 非 0 時改用單一固定值。
- 固定值目前只能透過 `;CONFIG jump_delay` 設定。`control_task.py:438` 記錄它在預覽時「沒有可見效果」，所以沒在用。
- 打點時每顆點停 80 µs、跳到下一顆卻要 200 µs，jump delay 約佔打點總時間的七成。

**debug 圖**：`galvo_debug_image` 會輸出分塊示意圖（停靠點、場可達範圍、負責格），以及每張點陣圖三個階段的圖（source／remapped／dithered），沒有接縫切點。

## 3. Goals & non-goals

**Goals**
1. swiftray 實作 KW，對漸層點陣圖產生與 test61 等價的 fcode（同參數下，點的集合與每點歸屬的 tile、趟別相同；漫步的亂數序列可以不同）。
2. 開發設定面板改組，欄位分區與顯示條件依第 7.2 節。
3. 點陣圖前處理依「門檻 → 色調重新對應 → dither」的順序執行，dither 可選 FS 或藍噪聲。
4. 新增 backlash X/Y 距離、停靠後等待、tile 停頓、趟停頓、jump delay 參數。
5. debug 圖畫出每條縫各趟的切點路徑，並附一個縫交叉的局部放大（類似 `test61b-walk.png`）。
6. KW 的直縫可改走最小成本路徑（7.4 節），與 `test61.py` 的 `mincost`＋`gap_mm 1` 等價；開關關閉時退回純漫步。

**Non-goals**
- KW 不處理線段圖：選 KW 時，線段圖一律硬切（同 line-baseline）。分塊方式「自動」下含路徑的物件需要拼接時，前端會警告（`galvo-tiling-mode.md` §7.8）。
- 不開放給一般使用者，也不做翻譯（開發設定面板本來就只有中文）。
- 不做場鏡修正（tilecorr）。
- run 斷開距離不做成參數（只影響指令筆數，不影響打出來的結果）。
- 不實作色階對應（LUT）：色階測試（test66～68）還沒做完，點陣圖處理維持線性的密度上下限（2026-11-20 決定）。
- 不改 PWM 頻率（2026-11-20 決定），見第 11 節。
- 橫縫不走最小成本路徑（第一版只做直縫，見 Open decisions 7）。

## 4. Scenarios

1. **開發者用 KW 打一張大圖**：選「拼接策略：K 趟＋漫步」，其餘用預設值，匯出後上機。
2. **測試人員掃參數**：改 K、各趟方向字串、漫步幅度或偏移總寬，連續匯出比較。
3. **清掉淺色噪點**：漸層圖帶有接近白色的雜點，把門檻設成例如 240，讓雜點不出點，但不必把圖改成非漸層。
4. **煙多的材料**：設 tile 停頓 20 s、趟停頓 8 s，讓抽風把煙排掉。
5. **檢查切點**：設 debug 圖路徑，匯出後看每條縫的切點路徑是否落在預期位置、有沒有被空間限制縮小。

## 5. Acceptance criteria

入口一律是：dev 模式 → 頂部選單 → HEXA II 開發設定。

| # | 操作 | 預期結果 | 邊界情況 |
|---|---|---|---|
| A1 | 開啟面板 | 分區依 7.2 節；「接縫」區頂端是「拼接策略」下拉，選項含 KW | — |
| A2 | 拼接策略切換到各個選項 | 只顯示 7.2 節對照表中該策略使用的欄位 | 切換後被隱藏的欄位**不送出**，即使之前填過值；切回來時值仍在（面板記住，匯出不送） |
| A3 | 選 KW，其他預設，匯出含漸層圖的文件 | fcode 每個停靠點有 4 趟，趟別＝行號 % 4，方向 ↑↓↑↓；直縫、橫縫切點依 7.4 節 | 只有一個 tile 時不分縫，但仍分 K 趟 |
| A4 | KW、110 場鏡、區塊 100（直縫需要 59.75 mm，場半寬只有 55） | 漫步幅度自動縮到放得下（7.4 節），swiftray log 一行警告，debug 圖標註實際使用的幅度 | 偏移總寬一半就超過餘量時，偏移也等比縮小；餘量 ≤ 0 時漫步與偏移都是 0 |
| A5 | K = 3，方向填 `UD` | 三趟方向依序 ↑↓↑（字串循環使用） | 方向字串含 U/D 以外的字元：swiftray 忽略該字元並警告；空字串＝預設交替 |
| A6 | 門檻設 1，匯出漸層圖 | 只有原圖值為 0（純黑）的像素出點，其餘全白 | 255＝不處理；門檻作用在色調重新對應**之前** |
| A7 | dither 選 FS／藍噪聲 | FS 與現行相同；藍噪聲用 128 × 128 void-and-cluster 遮罩，從機器原點平鋪 | 同一張圖、同一位置，兩次匯出結果相同 |
| A8 | tile 停頓 20、趟停頓 8 | 第一個停靠點之外，每個停靠點開打前停 20 s；KW 每個停靠點的趟與趟之間停 8 s；預估時間包含這些停頓 | 0＝不插入停頓指令；非 KW 策略忽略趟停頓 |
| A9 | backlash X 5、Y 5 | 每個有內容的停靠點都是先 −Y 5 mm、再 −X 5 mm 退後，然後 +Y、+X 進場 | X、Y 任一為 0 時不處理該軸；兩者皆 0 等同舊的 `galvo_fix_backlash = false` |
| A10 | 停靠後等待未改 | 每個停靠點第一個 list 的 ENABLE 之後有 150 ms LONG_DELAY | 0＝不等待 |
| A11 | jump delay 設 100 | 該工作期間每次跳躍固定延遲 100 µs，工作結束後恢復內插預設 | 0＝預設內插；超過 65535 被拒絕 |
| A12 | 設 debug 圖路徑後匯出 KW | 多一張 `<前綴>-layerN-seams.png`：全圖疊上每條縫各趟切點（各趟一色）、右側是中央縫交叉 24 mm 局部 | 只有一個 tile 時不輸出這張 |
| A14 | 空白跳躍前等待 300、門檻 0.5，匯出一張有空白間隔的漸層圖 | 每一次跨過 ≥ 0.5 mm 原圖空白的跳躍（列內或換列）之前有一筆 300 µs 的 LONG_DELAY；路徑上沒有那麼長空白的跳躍沒有；點的位置與數量和關閉時相同；預估時間增加＝次數 × 300 µs | 等待設 0＝沒有任何插入；門檻比圖上所有空白都大＝沒有任何插入；淡色區內部點距超過門檻但原圖不是空白＝不等 |
| A15 | KW、最小成本路徑開（預設），匯出一張直縫附近有空白的漸層圖 | 直縫切點落在名義線 ± 直縫漫步幅度內；「切點左右一格內有點」的列數不多於關閉時；路徑所在處有寬 ≥ 1 mm 的原圖空白時，該列各趟切點重合在空白裡；點的集合與關閉時相同，只有 tile 歸屬不同；seams debug 圖標題註明「最小成本路徑」 | 關閉＝與純漫步的輸出逐位元相同；整片是墨或整片空白的縫＝路徑等於漫步；某個 tile 剩不到 200 點且全部落在左右鄰居可打範圍內＝交給鄰居、該停靠點跳過；直縫漫步幅度為 0（或被空間限制縮成 0）＝路徑就是名義線 |
| A13 | 面板顯示預設值 | 開光 −680、關光 200、跳躍速度 7000、list 上限 10000、停靠後等待 150、dither 藍噪聲、門檻 255、最小成本路徑開、tile／趟停頓 0 | 顯示的預設必須和 swiftray 實際預設一致（兩邊同時改） |

## 6. Must not change

| 共用檔案／函式 | 呼叫者 — 必須維持的行為 |
|---|---|
| `svg-laser-parser.ts` `fhx2galvo` 分支 | `galvo_field`、`galvo_field_correction`、`galvo_boundary` 照舊送出；dev 覆寫仍只送使用者動過的欄位（新規則：只再排除被策略隱藏的欄位） |
| `galvo-dev-settings.ts` `galvoDevDefaults` | 面板與匯出讀預設的方式不變；未修改的欄位不送 |
| `backlash.ts` `getFixBacklash` | 場鏡校正流程（`hexa-g-galvo-calibration.md` §7.11）仍讀得到 backlash 是否開啟：改成「X 或 Y 距離 > 0」 |
| swiftray `apply_galvo_strategy` | 既有 8 個 id 的行為不變；KW 是新增 |
| swiftray 非漸層點陣圖 | `imageBinarize` → dilate → texturize 不變；新門檻只作用在漸層圖 |
| swiftray 預設值 | 開關光延遲、跳躍速度（`toolpath-exporter-fcode.cpp:380`、`generators/galvo-list.h:69`，4000 → 7000）、list 上限、停靠後等待的預設改變，會影響所有 HEXA G 工作（包括非接縫的單一停靠點工作）。這是刻意的，發 PR 時要列出 |
| swiftray 打點記錄的切分（`too_sparse`、list 指令上限） | 關閉空白跳躍等待時，輸出的記錄與現在逐位元相同；開啟時只多出 LONG_DELAY 與因此產生的記錄切點，點不變 |
| Beam Studio `parseFcode.ts`／Path Preview | list 內的 `LONG_DELAY` 已被計入時間；筆數變多不影響繪製 |
| bsl `applyCardBaseline` | 沒有設定 jump delay 的工作，維持 200–400 µs、10 mm 內插 |

## 7. Design

### 7.1 參數總表

策略代號：

| 代號 | 策略 id | 適用 |
|---|---|---|
| LB | line-baseline | 線段 |
| LR | line-report-optimized | 線段 |
| LC | line-overlap-checkerboard | 線段 |
| LS | line-overlap-segments | 線段 |
| LSc | line-overlap-scanlines | 線段 |
| LP | line-overlap-pwm | 線段 |
| DB | dot-overlap-blend | 點陣 |
| DL | dot-blend-line-core | 點陣 |
| **KW** | `dot-kpass-walk`（新增） | 點陣 |
| — | 未指定 | 漸層圖走 DB、線段走 LC（現行預設） |

「全部」表示與策略無關。

| 分區 | key | 標籤 | 使用策略 | 預設 | 變動 |
|---|---|---|---|---|---|
| 目前生效（唯讀） | — | 場鏡尺寸、模組偏移 | 全部 | 機器上的值 | 不變 |
| 移動範圍 | — | 無 Mopa／有 Mopa 的最小、最大 | 全部 | 本機／機器 | 不變 |
| 分塊 | `galvo_block` | 區塊大小 | 全部 | 依場鏡：110→100、90→80、70→60 | 說明拿掉 EVT 字樣 |
| 分塊 | `galvo_ts` | 龍門移動速度 | 全部 | 3000 mm/min | 不變 |
| 分塊 | `galvo_backlash_x` | X backlash 距離 | 全部 | 5 mm | **新增**，取代 `galvo_fix_backlash` |
| 分塊 | `galvo_backlash_y` | Y backlash 距離 | 全部 | 5 mm | **新增** |
| 分塊 | `galvo_block_start_delay` | 停靠後等待 | 全部 | **150 ms** | **新增欄位**（swiftray 已有參數），預設 50 → 150 |
| 分塊 | `galvo_tile_pause` | tile 之間停頓 | 全部 | 0 s | **新增**；測試時用 5 s |
| 分塊 | `galvo_max_list_commands` | 單一 list 指令上限 | 全部 | **10000** | 預設 0 → 10000 |
| 分塊 | `galvo_debug_image` | debug 圖輸出路徑 | 全部 | 空白 | 新增 seams 圖（7.6） |
| 點陣圖處理 | `galvo_threshold` | 二值化門檻 | 全部（漸層圖） | 255 | **新增** |
| 點陣圖處理 | `galvo_tone_min` | 點陣密度下限 | 全部（漸層圖） | 0 | 從「接縫混合」移過來 |
| 點陣圖處理 | `galvo_tone_max` | 點陣密度上限 | 全部（漸層圖） | 1 | 從「接縫混合」移過來 |
| 點陣圖處理 | `galvo_dither` | dither 方式 | 全部（漸層圖） | `blue-noise` | **新增**：`fs`／`blue-noise` |
| 接縫 | `galvo_strategy` | 拼接策略 | — | 未指定 | 改名，新增 KW |
| 接縫 | `galvo_dot_blend_overlap` | 點陣重疊帶寬度 | 未指定、LB、LR、LC、LS、LSc、LP、DB、DL | 10 mm | 只在使用時顯示 |
| 接縫 | `galvo_dot_blend_profile` | 點陣密度曲線 | 同上 | granular | 同上 |
| 接縫 | `galvo_dot_blend_grain` | 點陣換手格大小 | 同上 | 0 | 同上 |
| 接縫 | `galvo_line_blend_overlap` | 線段重疊帶寬度 | 未指定、LC、LS、LSc、LP、DB | 10 mm | 同上 |
| 接縫 | `galvo_line_blend_profile` | 線段密度曲線 | 未指定、LC、LS、LSc、LP、DB | super-granular | 同上 |
| 接縫 | `galvo_line_blend_segment` | 齒紋長度 | 未指定、LC、LS、DB | 2 mm | 同上 |
| 接縫 | `galvo_line_blend_emission` | 線段接縫策略 | — | checkerboard | **從面板移除**，由策略決定（swiftray 仍接受這個 key） |
| 接縫 | `galvo_dot_blend_line_core` | 重疊帶改用打點 | — | false | **從面板移除**，等同 DL |
| 接縫 | `galvo_process_dot_*`（7 項） | 重疊帶打點參數 | DL | 0 | 只在 DL 顯示 |
| 接縫 | `galvo_passes` | 趟數 K | KW | 4 | **新增** |
| 接縫 | `galvo_pass_directions` | 各趟方向 | KW | `UDUD` | **新增**；U＝由下往上 |
| 接縫 | `galvo_pass_pause` | 趟與趟之間停頓 | KW | 0 s | **新增**；測試時用 0.5 s |
| 接縫 | `galvo_vseam_walk` | 直縫漫步幅度 | KW | 6 mm | **新增**（±） |
| 接縫 | `galvo_vseam_spread` | 直縫各趟偏移總寬 | KW | 7.5 mm | **新增** |
| 接縫 | `galvo_hseam_walk` | 橫縫漫步幅度 | KW | 1 mm | **新增**（±） |
| 接縫 | `galvo_hseam_spread` | 橫縫各趟偏移總寬 | KW | 2 mm | **新增** |
| 接縫 | `galvo_seam_walk_length` | 漫步彎曲長度 | KW | 10 mm | **新增**，直縫、橫縫共用 |
| 接縫 | `galvo_seam_min_cost` | 直縫走最小成本路徑 | KW | **true** | **新增**（7.4）；關閉＝純漫步 |
| 點陣圖處理 | `galvo_blank_jump_wait` | 空白跳躍前等待 | 全部（漸層圖） | **300 µs** | **新增**（7.7）；0＝關閉 |
| 點陣圖處理 | `galvo_blank_jump_min` | 空白跳躍門檻 | 全部（漸層圖） | **0.5 mm** | **新增**（7.7） |
| List 前置指令 | `galvo_jump_speed` | 跳躍速度 | 全部 | **7000 mm/s** | 預設 4000 → 7000（Beam Studio `galvo-dev-settings.ts:460`、swiftray 同步改） |
| List 前置指令 | `galvo_jump_delay` | 跳躍延遲 | 全部 | 0（＝韌體內插 200–400 µs） | **新增**（7.5） |
| List 前置指令 | `galvo_laser_on_delay` | 雷射開啟延遲 | 全部 | **−680 µs** | 預設 −100 → −680 |
| List 前置指令 | `galvo_laser_off_delay` | 雷射關閉延遲 | 全部 | **200 µs** | 預設 100 → 200 |
| List 前置指令 | `galvo_scanner_mark_delay` | 振鏡雕刻延遲 | 全部 | 100 µs | 不變（test62：0 與 100 打點結果目視無差別） |
| List 前置指令 | `galvo_scanner_polygon_delay` | 振鏡轉角延遲 | 全部 | 50 µs | 不變（test62：0 與 50 打點結果目視無差別） |
| List 前置指令 | `galvo_standby`、`galvo_standby_period`、`galvo_standby_width` | 待機脈衝 | 全部（只有 CO2 有作用） | true／100／1 | 不變 |
| List 前置指令 | `galvo_mo_delay` | 開雷射等待 | 全部（只有 Mopa 有作用） | 8000 µs | 不變 |
| List 前置指令 | `galvo_mopa_pulse_length` | Mopa 脈衝寬度 | 全部（只有 Mopa 有作用） | 0 | 不變 |

**各欄位的說明文字（tooltip）要寫進的內容**：
- **停靠後等待**：可能解決區塊第一個 list 不出光或偏弱（test8：50 ms 已見效）；也給龍門停下後的殘留晃動時間消退（test61bm 直線不直，待 bm2 確認）。
- **趟數 K**：分 K 趟打，是為了把接縫兩側的深度差異攤平；代價是整體顏色變淺、工時增加。K = 1 等於不分趟。
- **各趟方向**：K 為奇數時，第一趟和最後一趟同方向，效果沒有測過。這個欄位刻意做成字串，讓測試人員自行指定。
- **漫步彎曲長度**：縫大約每隔這個長度轉一次彎。調短，縫會變成細碎的鋸齒；調長則接近直線，失去漫步的效果。
- **直縫走最小成本路徑**：直縫在漫步幅度的範圍內改走墨最少的路徑，會繞過跨到隔壁 tile 的小突出、盡量切在空白處；空白夠寬時各趟的切點收在同一條線上。能繞多遠由「直縫漫步幅度」決定。整片都是墨的地方和純漫步相同。
- **tile 之間停頓、趟與趟之間停頓**：主要目的是讓抽風把煙排掉。測試時用 5 s／0.5 s。停頓會讓雷射管和板材多冷卻一些，副作用是顏色略有變化，所以比較顏色時兩份工作的停頓要相同。
- **跳躍速度**：4000 時光束離開圖案的拖尾較明顯，測試一律用 7000。
- **空白跳躍前等待**：光束要跨過原圖的空白時，先在原地停這麼久再跳，讓雷射關閉後的餘光落在剛打的點上，不會拖進空白裡（圖案邊緣與線條之間的淡痕）。只看原圖是不是空白，淡色區裡稀疏的點不會等。0＝關閉。
- **空白跳躍門檻**：跳躍路徑上，原圖連續空白至少這麼長才等。調太低，筆畫邊緣的窄縫也會等，工時略增；調高則窄的空白不處理。

### 7.2 面板分區與顯示條件

分區順序：目前生效 → 移動範圍 → 分塊 → **點陣圖處理（新增）** → 接縫 → List 前置指令。

「點陣圖處理」區塊說明：只作用在漸層點陣圖，依序是 ① 二值化門檻：原圖值 ≥ 門檻的像素清成白色 → ② 色調重新對應：剩下的像素黑度依密度上下限重新對應 → ③ dither。門檻必須在色調重新對應之前：密度下限 > 0 時，接近白色的雜點會先被抬成可見的點，之後就清不掉了。

「接縫」區只顯示目前策略使用的欄位（依 7.1 節「使用策略」欄）。隱藏欄位的值保留在本機設定裡，但匯出時不送，所以不會在背後悄悄覆寫策略。

### 7.3 點陣圖前處理（swiftray）

在漸層圖分支（約 2585 行）改成：

1. `applyThreshold(image, galvo_threshold)`：每個像素取灰階 v（0 黑…255 白，透明已先合成白底）；v ≥ 門檻就設為白色。門檻 255 時只有純白受影響，等於不處理。
2. `remapTone`：維持現狀。
3. dither：
   - `fs`：現行的 Qt `DiffuseAlphaDither`。
   - `blue-noise`：128 × 128 void-and-cluster 遮罩（σ 1.5，與 playground `fc/dither.py` `bn_mask` 相同演算法），編譯時產生成常數表放進 source。位置對齊機器原點的像素格，讓相鄰 tile 用同一張遮罩。
4. texturize：維持現狀。

debug 圖的階段：1-source、**2-threshold（新增）**、3-remapped、4-dithered。

### 7.4 KW 歸屬與打點順序（swiftray）

**歸屬判定**（取代 KW 下的點陣重疊帶；位置在 `laser-raster-galvo` 的歸屬判定）：

1. 以 dither 後的點陣格（行 j、欄 i，pitch＝點陣圖像素）為單位。對每條直縫 s（相鄰兩欄 tile 之間）產生一條沿 y 的漫步 `wv_s(j)`，對每條橫縫產生一條沿 x 的漫步 `wh_s(i)`。
2. **漫步產生**：AR(1)，`x_k = a·x_{k−1} + σ√(1−a²)·n_k`。其中 a = 1 − pitch／彎曲長度，σ = 1，結果夾在 ±3σ 後縮放到 ±幅度。亂數種子由縫的索引決定，同一份文件重複匯出結果相同。
3. **每趟偏移**（等間距）：
   - 直縫：`ov_p = spread/2 − p·spread/(K−1)`，正值往右，所以第 0 趟最右；K = 1 時為 0。
   - 橫縫：`oh_p = spread/2 − p·spread/(K−1)`，正值往下，所以下方 tile 越後面的趟越往上延伸。
   - 2026-11-18 決定橫縫改成等間距，不再沿用測試時的 ±1.0／±0.5。
4. **歸屬**：行 j 屬於趟 p = j % K。點 (i, j) 的欄歸屬是「x ≥ 直縫位置 + `wv_s(j)` + `ov_p`」的直縫條數，列歸屬同理。
5. **空間限制**（2026-11-18 決定採自動縮小）：每個方向的餘量 m = 場半寬 − 區塊半寬。
   - 若漫步幅度 + spread/2 > m：先把漫步幅度縮成 max(0, m − spread/2)。
   - 若 spread/2 仍 > m：spread 也縮成 2m。
   - 縮小時 qWarning 一行，debug 圖標出實際值。

**直縫最小成本路徑**（`galvo_seam_min_cost`，預設開；2026-11-20 決定納入實作；參考實作 `test61.py` `min_cost_path`，test61f／g／i）：

開啟時，步驟 2 的直縫漫步 `wv_s(j)` 換成在同一個許可範圍（名義線 ± `galvo_vseam_walk`，經步驟 5 縮小後的值）內求出的最小成本路徑；步驟 3 的每趟偏移照舊加在這條路徑上。橫縫不變。

1. **成本格**：處理後的原圖色調（7.3 節門檻之後、dither 之前；0＝空白、1＝全黑）縮成 0.25 mm 一格，取格內平均。
2. **每格成本** = 以該格為中心、寬度等於每趟偏移總寬（`galvo_vseam_spread`）的橫帶內平均色調 + 0.05 ×（與原慢漫步的距離／漫步幅度）。第二項讓整片是墨或整片空白的地方退回原本的漫步。
3. **窄空白**：某格左右合計有寬 ≥ 1 mm 的純空白（格內沒有任何墨）時，該格成本為 0（只剩漫步那一項）。
4. **動態規劃**：沿縫方向一列一列往下，每列最多橫移一格，橫移一格加 0.02；取總成本最小的路徑。
5. **平滑**：路徑以 2 mm 移動平均平滑，再夾回許可範圍，內插回每一行。平滑把路徑推出窄空白（平滑後 ±0.5 mm 內有墨、平滑前沒有）的行，改用平滑前的位置。
6. **偏移收攏**：路徑所在處有寬 ≥ 1 mm 的純空白，且完整偏移會落在墨上的行，該行各趟偏移乘上係數 0（各趟切點重合在空白裡）。只處理連續 ≥ 2 mm 的區段；離開後在 2 mm 縫長內線性張回 1。
7. **零碎 tile**：歸屬算完後，某個 tile 剩不到 200 點，而且這些點全部在左或右鄰 tile 的可打範圍內（離該鄰居停靠點的 x 距離 ≤ 場半寬 − 0.1 mm），就整批交給較近的那個鄰居，該停靠點不停靠。

上面的 0.25 mm、0.05、0.02、1 mm、2 mm、200 點都是常數，不做成參數。

測試數字（鯨魚圖，tile 90、許可範圍 ±6 mm）：「切點左右一格內有點」的列數，偏移 7.5 mm 時 4264 → 3115（少 27%，61f），偏移 2 mm 時 3664 → 1900（少 48%，61g），加上偏移收攏後 1793（61i）；61f 有一個 tile 只剩 1 點，併給鄰居後停靠點 13 → 12 個。許可範圍只有 ±6 mm，能繞的距離有限；偏移越窄越容易找到空白。

**打點順序**：每個停靠點內依趟 0…K−1 打。每趟只打 j % K == p 的行，行序依該趟方向（U＝由下往上）；同一趟內相鄰兩行左右來回。

**停頓**（fcode `sleep`）：
- 趟之間插入 `galvo_pass_pause`。
- 第一個有內容的停靠點之外，每個停靠點開打前插入 `galvo_tile_pause`。

**線段圖**：KW 下把 `galvo_line_blend_overlap` 設成 0（同 LB）。

### 7.5 backlash、停靠後等待、jump delay

- **backlash**：每個有內容的停靠點 (x, y)，依序移動到 (x − bx, y − by) → (x − bx, y) → (x, y)；某軸為 0 時省略該軸那一步。取代現在「列首往左一欄」的做法，同時涵蓋 Y。
- **停靠後等待**：swiftray 把 `galvo_block_start_delay` 的預設改成 150；Beam Studio 新增欄位。
- **jump delay**：
  - swiftray 在每個 list 前置指令加入新的 opcode `SET_JUMP_DELAY`（暫定 op 17，參數 1 個：µs，0＝恢復內插）。只有參數非 0 時才送。
  - bsl 在 `handleGalvoList` 收到後呼叫 `lcs_set_delay_mode(true, v, v, 10)`；收到 0 時恢復 200／400／10。
  - 工作結束時（`;SIGNAL RESET`）也要恢復內插，避免影響下一份工作。
  - 選擇 list opcode 而不用 `;CONFIG jump_delay`，原因有二：一是 fcode 裡沒有文字指令的位置；二是 `control_task.py:438` 記錄 `;CONFIG` 的設定在預覽時沒有效果，可能被每個 list 重新套用的 baseline 蓋掉。opcode 放在 list 裡，就和其他延遲同一個時間點生效。

### 7.6 debug 圖：接縫路徑

KW 且分塊數 > 1 時，另外輸出 `<前綴>-layerN-seams.png`：

- 左圖：dither 後的點陣（降採樣），疊上 tile 邊界（點線）和每條縫各趟的切點（四色依趟別）。
- 右圖：中央縫交叉 24 mm 的局部，直縫畫每行的切點、橫縫畫曲線。
- 標題註明：tile、K、直縫是漫步還是最小成本路徑、直縫／橫縫實際使用的幅度與偏移（被 7.4 節空間限制縮小時要標出）。
- 最小成本路徑開啟時，偏移收攏的區段各趟切點重合，圖上看得出來；被併走的 tile 在左圖標註。

參考 `~/Downloads/galvo-seam-tests/test61b-walk.png`。

### 7.7 空白跳躍前等待（swiftray）

**背景**（playground test62～65c，2026-11-19）：HEXA G 的 CO2 管是玻璃管，出光明顯落後於閘門。閘門關閉後能量還在出來；光束如果已經起跳，能量被抹在路徑上，在圖案之間的空白留下順著掃描方向的淡痕，長度約 3 mm（關光延遲 200 µs、跳躍 7000 mm/s）。痕跡只在光束**離開**的那一側，和開光延遲無關。關光延遲全面加到 400 µs 可以消掉，但每顆點多 200 µs（C40 鯨魚 +546 s）。只在長跳躍前多等效果相同，代價小得多。

**規則**：

1. 對同一個停靠點、同一個 list 內相鄰的兩顆點（列內的下一顆，或換列後的第一顆），取起點到終點的直線。
2. 沿這條線取**處理後的原圖**（7.3 節步驟 1 門檻之後、色調重新對應之前；白＝255）。如果線上有連續空白長度 ≥ `galvo_blank_jump_min`，就在跳躍之前插入 `LONG_DELAY(galvo_blank_jump_wait)`（既有的 list opcode 6，韌體不用改）。
3. 等待插在前一顆點之後、跳躍之前；等待時間計入該 list 的預估時間（`SET_END_OF_LIST` 的參數）與工作總時間。
4. `galvo_blank_jump_wait` = 0 時整個功能關閉。停靠點之間、list 之間（list 結尾已 `DISABLE_LASER`）、以及 KW 趟停頓之後的第一顆點，不算跳躍。

**為什麼看原圖而不是看點距**：淡色區（10～20%）的點距本來就常超過 0.5 mm。依點距等待會讓這些點前後都吃到完整能量，而且只有一部分的點被等到，結果是顏色變深、出現斑駁（test65）。依原圖判斷，淡色區內部完全不動（test65c：408 次該等的全等、17,090 次不該等的全沒等，圖案邊緣明顯變乾淨）。

**實作注意**：

- 判斷要放在「把一列切成多筆打點記錄」的任何長度上限**之前**。playground 第一版把 4 mm 斷筆的判斷放在前面，結果最長的跳躍反而沒等到（test65 作廢的原因）。
- 等待次數太密會讓質地變粗（test64：每 26 mm² 等 4000 次時直條出現編織紋），所以門檻不建議低於 0.3 mm。
- 工時：C40 鯨魚（273 萬點）94,831 次、+28 s（+2.9%）；C60（410 萬點）98,217 次、+30 s（+2.2%）。

## 8. Data contracts

Beam Studio → swiftray（`svg-laser-parser.ts`，只送開發者動過、且目前策略會顯示的欄位）。新增 key 與型別：

```text
galvo_strategy           string   新增值 "dot-kpass-walk"
galvo_passes             int      ≥1
galvo_pass_directions    string   [UD]*
galvo_pass_pause         number   s, ≥0
galvo_tile_pause         number   s, ≥0
galvo_vseam_walk         number   mm, ≥0
galvo_vseam_spread       number   mm, ≥0
galvo_hseam_walk         number   mm, ≥0
galvo_hseam_spread       number   mm, ≥0
galvo_seam_walk_length   number   mm, >0
galvo_seam_min_cost      bool     預設 true
galvo_threshold          int      1..255
galvo_dither             string   "fs" | "blue-noise"
galvo_blank_jump_wait    int      µs, 0..65535（0＝關閉）
galvo_blank_jump_min     number   mm, >0
galvo_backlash_x         number   mm, ≥0
galvo_backlash_y         number   mm, ≥0
galvo_block_start_delay  number   ms, ≥0（swiftray 既有 key，Beam Studio 新增送出）
galvo_jump_delay         int      µs, 0..65535
```

`galvo_fix_backlash` 保留一個版本作為相容：沒有收到 `galvo_backlash_*` 時，swiftray 依舊值解讀（true＝X 5、Y 0）。

swiftray → 韌體：fcode 新增 list opcode `SET_JUMP_DELAY`（暫定 17，1 個 f64 參數），需同步更新 `HX2_GALVO_PROTOCOL.md`、bsl 的 `galvoOpName` 與參數個數表、Beam Studio `parseFcode.ts` 的 opcode 表。

## 9. Rollout（PR 計畫）

1. swiftray：預設值調整（開關光延遲、跳躍速度、list 上限、停靠後等待）＋ backlash X/Y ＋ tile 停頓。
2. swiftray：點陣圖前處理（門檻、藍噪聲）＋ debug 階段圖＋空白跳躍前等待（7.7；不依賴 KW，可以先做）。
3. swiftray：KW 歸屬、打點順序、趟停頓、空間限制、seams debug 圖；直縫最小成本路徑（可以是同一支 PR 的第二個 commit，開關關閉時要能單獨驗證純漫步）。
4. 韌體 bsl：`SET_JUMP_DELAY` opcode；swiftray 輸出；Beam Studio `parseFcode` 認得該 opcode。
5. Beam Studio：面板改組、顯示條件、新欄位、預設值同步、匯出時排除隱藏欄位。

1～3 可以分開上機驗證；Beam Studio 那支 PR 要等 1～3 都合併後才發，避免面板顯示 swiftray 還不認得的欄位。

## 10. Open decisions

1. 「未指定」策略的行為：維持現狀（漸層圖走 DB、線段走 LC），還是改成 KW？目前假設維持現狀。
2. KW 下的線段圖：目前定為硬切（~~考慮過的做法：沿用線段設定、或在漫步位置切斷~~，2026-11-18 決定先硬切）。之後是否讓 KW 搭配某個線段策略，待線段測試。
3. ~~空間限制：(a) 預設區塊改成「場鏡 − 20」，或 (b) 自動縮小漫步~~ —— 2026-11-18 決定採 (b)。
4. ~~橫縫各趟偏移是否改為等間距~~ —— 2026-11-18 決定改為等間距。
5. 漫步被空間限制縮小時，是否要在 Beam Studio 畫面提示（目前只寫 log 和 debug 圖）。
6. `SET_JUMP_DELAY` 的 opcode 編號，需和韌體端確認沒有衝突。
7. 橫縫是否也走最小成本路徑。第一版只做直縫：橫縫的許可範圍只有 ±1 mm，能繞的距離很小，playground 也沒有實作。
8. ~~跳躍速度預設~~ —— 2026-11-20 決定 4000 → 7000。
9. ~~PWM 頻率是否跟著測試檔改~~ —— 2026-11-20 決定不動。
10. ~~最小成本路徑是否實作~~ —— 2026-11-20 決定實作，做成開關，預設開。
11. ~~tile／趟停頓的預設~~ —— 2026-11-20 決定維持 0／0；測試用的 5／0.5 s 寫在說明文字裡。
12. 色階對應（LUT）與建議功率：等色階測試（test66～68）做完再決定，這份 PRD 先不實作（2026-11-20）。

## 11. Risks & follow-ups

- **jump delay 效果未證實**：`;CONFIG jump_delay` 曾被記錄為沒有效果。需先在韌體端確認 `lcs_set_delay_mode` 放在 list 內呼叫是否真的作用到點與點之間的跳躍，再進行 PR 4。
- **預設值變更影響所有工作**：開關光延遲 −680／200 只在紙板上測過。
- **藍噪聲遮罩常數表**：128 × 128 個 uint16 約 32 KB，放進 source 可以接受。
- **空白跳躍等待只在密迪板、80 µs、K4 驗證過**（皮卡丘 test65c、整張 C60 鯨魚 test61k，2026-11-19 目視效果良好）：等待 300 µs 與門檻 0.5 mm 是這個條件下的值；打點時間或材質不同時，餘光長度可能不同，所以兩者都做成可調。
- **極淡的區域不等**：原圖有顏色但很淡（幾 %）的地方點距可達數 mm，跳躍的拖尾會留在板上，視為該色調的一部分，由色階校正吸收；若實測出現條紋再處理。
- **待處理：起點斜坡、終點懸崖（2026-11-19 記錄，尚無對策、未測試）**。一段打點的起點，雷射管還在累積能量、前幾顆點偏弱，圖案邊緣呈斜坡；終點則是懸崖。列是來回掃的，所以一條連續的邊緣上相鄰的列一行斜坡、一行懸崖，差異明顯。終點側的拖尾已由 7.7 處理，起點側沒有。空白跳躍前等待會讓等待後的第一顆點更冷，可能加重這個現象，要一併觀察。可能的方向：同一邊緣固定同方向進入、起點前幾顆點加長打點時間或加預熱點、調待機脈衝。
- **K 趟工時**：每趟都要重新跳過整個 tile，總工時增加，K = 4 時的實際比例要量。
- **停靠後等待 150 ms 的工時**：每個停靠點多 100 ms，影響可忽略。
- **PWM 頻率和測試檔不同（2026-11-20 決定不動）**：playground 的測試檔全部用 72 kHz（週期 13.89 µs，滿佔空比），Beam Studio 送出的是 31.25 µs。接縫、牽連、色階的結論都是在 72 kHz 下得到的，用 Beam Studio 匯出時色調可能不同，上機驗證（Test plan 最後一列）時要留意。
- **關光延遲沒送到時的韌體預設值未查**：若 list 前置指令的延遲沒有被韌體套用，實際的關光延遲是多少還不知道。
- **色階不是線性**（test67，100% 功率、80 µs）：密度 0～2% 不出色，2～6% 很陡，6～19% 幾乎持平，之後到 100% 大致線性。密度上下限是線性對應，補不了這條曲線；校正方式等 test68 之後另外決定。
- **最小成本路徑的限制與後續**（第一版見 7.4）：
  - 空間：路徑偏離量 + 偏移的一半 ≤ 場的餘裕。90 mm tile 配 110 mm 場只有 10 mm，能繞的範圍很小；50 mm tile 有 30 mm。會成為選 tile 尺寸的考量。
  - 併給鄰居的內容用到場的邊緣（−x 側曾偏深、易焦油），可打範圍要留餘量。
  - 接縫在正面的觀感還沒有和純漫步並排比較過：61g 上機時的問題是牽連（已由 7.7 處理），不是接縫本身。開關保留就是為了能比。
  - 不做：沿深淺交界切（把 tile 色調階差藏進圖的邊緣）。對位誤差會直接變成輪廓錯位或白邊，而且那裡容不下每趟偏移。
  - 不做：碰到兩個鄰居（角落）或貫穿整個 tile 的區塊併給鄰居；上下方向的併 tile。

## 12. Test plan

| 對應 | 測試 |
|---|---|
| A3、A5、A4 | swiftray 單元測試：給定小點陣、tile、K、方向、幅度，檢查每點的 tile／趟歸屬、行序與方向；空間限制的縮放值 |
| A3 | 以 test61b 的圖和參數，用 swiftray 匯出 fcode，與 `test61.py` 的輸出比較：點的總數相同、每 tile 點數相近（漫步不同，±5% 內）、停靠點與停頓次數相同 |
| A6、A7 | swiftray 單元測試：門檻清白、藍噪聲遮罩的平鋪對齊、同輸入兩次匯出相同 |
| A8、A9、A10 | 解碼匯出的 fcode（playground 的 `fcdec.py`）：停頓指令次數與位置、每個停靠點的進場方向、第一個 list 的 LONG_DELAY |
| A11 | 韌體：上機打一排 0.5 mm 間距的點，jump delay 0／100／400 各一份，比較工時與點的落位 |
| A14 | 解碼匯出的 fcode，還原打點順序，對每次跳躍重算原圖空白長度，核對「該等的全等、不該等的全沒等」（playground `v65b.py` 的做法）；上機：皮卡丘開／關各一張，比圖案邊緣與白色空隙 |
| A15 | swiftray 單元測試：小點陣上直縫附近放一條空白帶與一小塊突出，檢查路徑走進空白、偏移收攏、零碎 tile 併給鄰居、整片墨時等於漫步；開關關閉時輸出與純漫步逐位元相同。以 test61i 的圖和參數匯出，和 `test61.py … mincost`＋`gap_mm 1` 比較「切點左右一格內有點」的列數（同量級）與停靠點數 |
| A1、A2、A13 | Beam Studio 單元測試：欄位顯示條件、匯出時排除隱藏欄位、預設值與欄位表一致 |
| A12 | 手動：設 debug 路徑匯出，目視 seams 圖 |
| 上機 | KW 預設值打鯨魚圖（同 test61b），和 test61b 照片比對 |
