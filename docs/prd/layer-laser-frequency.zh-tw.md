# PRD：圖層雷射頻率

> 本文件為 [layer-laser-frequency.md](layer-laser-frequency.md) 的繁體中文翻譯；兩者不一致時以英文版為準。程式碼識別字與路徑保留英文。

| | |
|---|---|
| **Status** | 草稿 — 尚未實作 |
| **Author** | Product + Beam Studio team |
| **Created** | 2026-10-27 |
| **Target product** | Beam Studio 2.7.3，機器韌體 6.5.3 |
| **Owner area** | 圖層參數面板（進階設定）、工作檔產生（fluxclient / Swiftray）、匯出前檢查 |
| **Related code** | 見英文版 |
| **External repos** | 見英文版 |
| **Playground** | `BeamStudio_LaserFrequency_Prototype.html`（ClickUp，不在 repo） |

---

## 1. Summary

目前只有 Promark 開放頻率設定；CO2 機型的雷射控制頻率由韌體固定。日本代理商回報 beamo II 線段雕刻出現波浪狀深淺不均，將控制頻率調到 72 kHz 後結果接近 beamo。

本功能在圖層「進階設定」新增 **雷射頻率**：依圖層以開關加 20–500 kHz 數值（滑桿＋輸入）設定。任一輸出圖層開啟時，工作檔寫入韌體指令 `M137P158Q<Hz>`（設定）／`M137P159`（回到機器預設），由韌體 6.5.3 執行。

## 2. 現狀與背景

### 2.1 各機型預設控制頻率

| 機型 | Model ID | 預設 |
|---|---|---|
| beamo II | `fbm2` | 20 kHz |
| Beambox II | `fbb2` | 20 kHz |
| HEXA RF | `fhx2rf` | 25 kHz |
| beamo | `fbm1` | 72 kHz |
| HEXA | `fhexa1` | 336 kHz |

### 2.2 韌體指令（韌體 ≥ 6.5.3）

| 指令 | 作用 |
|---|---|
| `M137P158Q<Hz>` | 設定雷射控制頻率，單位 Hz，1–1,000,000 |
| `M137P159` | 雷射控制頻率回到機器預設 |

### 2.3 Beam Studio 現況

- 進階設定在 `ConfigPanel/AdvancedBlock.tsx` 以 Collapse 呈現（非 Promark：Lower Focus、Auto Focus、Diode、Texture）。`paramsLabel.ts:201` `getAdvancedBlockKeys` 對應此區塊顯示的 key。
- `frequency` / `data-frequency`（kHz）已存在，為 **Promark** 專用（`layer-config-helper.ts:51`，預設 `27` 於 :131，限制於 :725–740）。不可沿用：一般圖層也可能帶 `data-frequency`，沿用會讓每個圖層都寫入指令。
- 開關＋數值樣式：`FocusBlock.tsx`（以正負號編碼）、`TextureBlock.tsx`（布林 key）。
- 韌體過舊提示：Depth mode `pwm_unavailable`，`handleExportAlerts.ts:80–96`（Confirm → `executeFirmwareUpdate`，兩個按鈕都中止送出）。
- 版本表：`version-checker.ts` `requirement`。
- 轉檔引擎（`export-funcs.ts:571`）：預設 fluxclient；`path-engine` 偏好為 `swiftray` 或裝置來源為 Swiftray 時用 Swiftray。兩者都必須寫入指令。

### 2.4 後端現況

- **fluxclient**：圖層屬性於 `svgeditor_factory.py:452` `_get_layer_params`（`attributes_map`）解析。逐圖層輸出在 `toolpath.py:345` 迴圈；雷射分支於 :725–732 以 `proc.sync_motion_type2(153, q=…)` 寫入 laser delay。工作結束：:1089 `xMIN 0004` 區塊。寫入函式：`sync_motion_type2(cmd, q)` → `M137P<cmd>Q<q>`、`sync_grbl_motion(cmd)` → `M137P<cmd>`（`src/toolpath/_toolpath.pyx:466,488`）。機型限制以 `hw_profile/support_info.py` 的 `HWFeature` 集合實作（最新為 `LASER_DELAY`）。
- **Swiftray**：圖層屬性於 `my_qsvg_handler_qt6.cpp` `createGNode`（約 :2900–2970）解析為 `BeamLayerConfig`（`mysvg-types.h`）→ `Layer::setParameters`（`layer.cpp:295`）。所有非 Promark 的 FLUX 機型都經 `ToolpathExporterFcode` 輸出；圖層迴圈 `convertStack()` :359–380、`convertLayer()` :471（laser delay 於 :622–629），工作結束 `xMIN 0004` 於 :430。寫入函式 `proc.sync_motion_type2(cmd, q = NAN)`，q 為 NaN 時省略 Q。機型限制以 `SupportInfo` / `SUPPORT_INFO`（`toolpath-exporter-constants.h:62`）實作。

## 3. Goals & non-goals

**Goals**
- **G1** 支援機型的 CO2 雷射圖層可各自設定雷射頻率（20–500 kHz）。
- **G2** 沒有任何圖層開啟時，產生的工作檔與現行相同。
- **G3** 韌體不支援時，送出前提示使用者更新韌體。

**Non-goals**
- **N1** 韌體實作。
- **N2** Promark `frequency` 不變。
- **N3** 預設參數（preset）：雷射頻率不納入材質預設。

## 4. 情境

- **S1** beamo II 線段雕刻出現波浪狀深淺，使用者調高雕刻圖層的頻率。
- **S2** 檔案同時有雕刻與切割圖層，只有雕刻圖層調整頻率。
- **S3** 舊韌體機器收到開啟雷射頻率的工作。

## 5. Acceptance criteria

**S1 — 圖層開啟**
- 步驟：工作區 beamo II，選取雷射圖層，展開進階設定，開啟 **雷射頻率**。
- 結果：出現數值輸入與滑桿，初始值 `20` kHz，說明「機器預設：20 kHz」；圖層 `<g>` 帶 `data-laserFrequency="20"`。關閉時值清為 `data-laserFrequency="0"`；undo/redo 可還原每一步。
- 輸入 `5` → 限制為 `20`；輸入 `900` → `500`；小數四捨五入為整數。
- 儲存後重新開啟 `.beam`：設定保留（sanitize 白名單）。
- 多選數值不同的圖層時，沿用面板既有的多值顯示。

**S2 — 工作檔**
- Layer 1 開啟 72 kHz、Layer 2 關閉，送至韌體 6.5.3 機器（或檢查工作檔）：Layer 1 前 `M137P158Q72000`、Layer 2 前 `M137P159`、工作結束 `M137P159`。
- 沒有圖層開啟 → 任何位置都沒有 `M137P158` / `M137P159`（同樣輸入下與現行逐位元組相同）。

**S3 — 韌體檢查**
- 有圖層開啟雷射頻率且韌體低於需求版本：顯示 `laser_frequency_unavailable`；Confirm 進入韌體更新，Cancel 關閉；兩者皆不送出。
- 隱藏圖層不觸發檢查。

**顯示的邊界情況**
- 工作區不在 §2.1（如 Ador、Beambox、Promark）：不顯示；圖層既有的 `data-laserFrequency` 不寫入任何指令。
- 圖層模組為列印或 1064 nm：不顯示；該圖層不寫入指令。
- 曲面雕刻模式：與一般相同（雷射圖層仍顯示）。

## 6. Must not change

| 共用檔案 / 函式 | 呼叫端 — 必須維持的行為 |
|---|---|
| `layer-config-helper.ts` `baseConfig`、`ConfigKeyTypeMap`（新 key） | `initState`/`getLayerConfig` — 其他 key 不變；不加入 `presetRelatedConfigs`，preset 比對不變；`timeRelatedConfigs` 不變 |
| `AdvancedBlock.tsx` | `ConfigPanel.tsx:333,493` — 既有區塊與順序不變；Promark 仍回傳 null；列印分支不變 |
| `paramsLabel.ts` `getAdvancedBlockKeys` | 參數標籤 — 既有 key 不變，新 key 只出現在支援的雷射圖層 |
| `workarea-constants.ts` `WorkArea`（新 optional 欄位） | 所有 `getWorkarea` 呼叫端 — 不受影響 |
| `handleExportAlerts.ts` | `handleExportClick.ts:58` — 既有提示與順序不變；只有可見圖層開啟時才檢查 |
| `version-checker.ts` `requirement` | 所有 `meetRequirement` 呼叫端 — 只新增 key |
| `sanitize.js` `g` 白名單 | 開檔 — 只新增 `data-laserFrequency` |
| fluxclient `toolpath.py` 圖層迴圈 / `xMIN 0004` | 所有 fcode 輸出 — 除非圖層帶屬性且機型具 `LASER_FREQUENCY`，否則不新增指令 |
| Swiftray `toolpath-exporter-fcode.cpp` `convertLayer` / `convertStack` | 所有非 Promark fcode 輸出 — 同上 |

## 7. Design

### 7.1 資料模型（beam-studio）

- 新 config key `laserFrequency` → `data-laserFrequency`，**kHz 整數，`0` = 關閉**。預設 `baseConfig.laserFrequency = 0`。單一屬性，不另設開關旗標。
- 支援機型與預設值：在 §2.1 五個機型加上 optional `WorkArea.defaultLaserFrequency`（kHz）。有此欄位 = 支援（R1）；其值 = 開啟時的初始值與「機器預設」說明。
- `sanitize.js` `g` 白名單加入 `data-laserFrequency`。
- 不加入 `presetRelatedConfigs`、`timeRelatedConfigs`。

### 7.2 UI

- `ConfigPanel/LaserFrequencyBlock.tsx`：開關列附 tooltip（`laser_frequency_desc`）；開啟時顯示 `NumberBlock`（`configKey="laserFrequency"`、min 20、max 500、precision 0、`hasSlider`、單位 kHz）與說明 `laser_frequency_default`。開關以單一 `BatchCommand` 將機型預設值或 `0` 寫入所有選取圖層，同 `TextureBlock`。
- `AdvancedBlock`：於非列印分支、`TextureBlock` 之後加入，條件為 `workareaObject.defaultLaserFrequency` 存在且 `module.value !== LayerModule.LASER_1064`。
- `paramsLabel.ts` `getAdvancedBlockKeys` 使用相同條件。

### 7.3 匯出檢查

- `version-checker.ts`：`LASER_FREQUENCY: '6.5.3'`（beamo / HEXA 見待決 D1）。
- `handleExportAlerts.ts`：於 PWM 檢查之後，若任一可見圖層 `data-laserFrequency > 0` 且 `!vc.meetRequirement('LASER_FREQUENCY')`，以 `pwm_unavailable` 相同流程顯示 `laser_frequency_unavailable` 並回傳 `false`。

### 7.4 後端（fluxclient 與 Swiftray 規則相同）

- 解析 `data-laserFrequency`（kHz，預設 0）。
- 以新的機型功能旗標 `LASER_FREQUENCY`（fluxclient `HWFeature`、Swiftray `SupportInfo`）限定五個機型，並限定 CO2 雷射模組（非列印、非 1064 nm）。檔案中的屬性在切換機型或模組後仍會保留，因此由後端限制來確保 R1/R2。
- `any_enabled` = 任一輸出且符合限制的圖層值 > 0。為 false 時不寫入任何指令（G2）。
- 為 true 時：每個圖層開始（laser delay 旁）值 > 0 寫入 `sync_motion_type2(158, kHz × 1000)`，否則寫入 `M137P159`；於 `xMIN 0004` 結束區塊寫入 `M137P159`。
- v1 fcode 機型（`fbm1`、`fhexa1`）沒有 script block，指令直接寫在相同位置。

## 8. Data contracts

| 位置 | 約定 |
|---|---|
| 圖層 `<g>` | `data-laserFrequency="<整數 kHz>"`，`0` 或不存在 = 關閉 |
| 工作檔 | 開啟的圖層前 `M137P158Q<Hz>`（Hz = kHz × 1000）；關閉的圖層前 `M137P159`；工作結束 `M137P159`；沒有圖層開啟時不寫入 |
| i18n | `beambox.right_panel.laser_panel.laser_frequency`、`laser_frequency_desc`、`laser_frequency_default`（`%s` kHz）；`topbar.alerts.laser_frequency_unavailable`；沿用 `frequency` |

## 9. Rollout（PR 規劃）

1. beam-studio PR（資料模型、UI、匯出檢查、i18n、PRD）。
2. fluxclient PR，tag 2.10.5；更新 `.github/workflows/app.cd.{mac,linux,x64}.yml` 的 `ref:`。
3. Swiftray PR 至 `develop`。
4. UI 可先於後端上線；在此之前屬性會儲存但後端忽略 — 可接受，因為匯出檢查擋的是舊韌體，不是舊後端。

## 10. 待決事項

1. **D1** beamo（`fbm1`）與 HEXA（`fhexa1`）使用舊的 4.x 韌體線（`legacyBeamSeriesModelsArray`、`JOB_ORIGIN: '4.3.5'`）。單一 `>= 6.5.3` 檢查會永遠擋住這兩台。需要這兩台的最低版本，或從本次釋出移除。
2. **D2** 是否納入 Ador（`ado1`）或 Beambox（`fbb1b`/`fbb1p`）？產品 PRD 未提及，目前排除。

## 11. 風險與後續

- 網頁版使用者若本機 FLUX API 過舊，不會寫入指令（屬性被忽略）— 與列印 padding 覆寫相同的已接受風險。
- 舊韌體若默默忽略 `M137P158`，無法從工作檔偵測；匯出檢查是唯一防護。

## 12. Test plan

| 條目 | 檢查方式 |
|---|---|
| S1 UI、限制範圍、undo、多值 | `LaserFrequencyBlock.spec.tsx`；beamo II 工作區手動測試 |
| S1 儲存 | 手動儲存/重開；sanitize 白名單 |
| S1 顯示邊界 | `AdvancedBlock.spec.tsx`：不支援機型 / 1064 / 列印 |
| S2 工作檔 | fluxclient `tests/toolpath/test_laser_frequency.py`（開/關/無）；Swiftray 手動轉檔並檢查 fcode |
| S3 韌體檢查 | `handleExportAlerts.spec.ts`（舊韌體＋開啟 → 提示；隱藏圖層 → 不提示） |
| G2 回歸 | fluxclient 測試：無屬性 → 無 P158/P159 |
