# PRD：Promark UV 與內雕（3D Inner Engraving）

| | |
|---|---|
| **Status** | Phase 1 實作完成（branch `promark-3d-inner-carving` + Swiftray `codex/promark-3d-inner-carving-pr`），待送審。Phase 2 未開始（§3.4） |
| **Author** | EstherFu（整理：Claude） |
| **Created** | 2026-10-13 |
| **Target product** | Beam Studio 桌面版（Promark `fpm1` + UV 雷射源）。網頁版不支援 |
| **Owner area** | Promark 機台設定 / 圖層參數 / 相機校正；新子系統「內雕 3D 畫布」 |
| **Related code** | 模式與開關：`helpers/addOn/innerEngraving.ts`、`helpers/exclusiveModes.ts`、`app/actions/canvas/innerEngravingMode.ts`、`svgedit/operations/import/innerEngravingGate.ts`；3D 畫布：`app/components/beambox/InnerEngraving/`；3D 物件：`app/stores/stlStore.ts`、`app/svgedit/stl/`、`app/svgedit/operations/import/importStl/`、`importPhotoPlane.ts`；面板：`RightPanel/DimensionPanel/DimensionPanelStl.tsx`、`RightPanel/ActionsPanelStl.tsx`、`RightPanel/OptionsBlocks/ThreeDOptions.tsx`；文件設定：`dialogs/InnerEngravingSettings.tsx`、`DocumentSettings/InnerEngravingBlock.tsx`；匯出：`app/actions/beambox/export/getStlObjects.ts`、`getPointCloudObjects.ts`、`GoButton/checkInnerEngravingObjects.ts`、`export-funcs-swiftray.ts`、`helpers/api/svg-laser-parser.ts`、`helpers/api/swiftray-client.ts`；UV：`app/constants/promark-constants.ts`、`helpers/layer/layer-config-helper.ts`、`helpers/layer/uvPowerFrequency.ts`、`RightPanel/ConfigPanel/{PowerBlock,AdvancedSettingModal,DevBlock,QPulseWidthBlock}.tsx`、`app/constants/presets.ts`；內雕圖層參數：`RightPanel/ConfigPanel/{EngravingModeBlock,SolidBlock,DottingTimeBlock}.tsx`、`getInnerEngravingBlocks.ts`、`app/svgedit/stl/engravingParams.ts`；材質測試：`dialogs/MaterialTestGeneratorPanel/`；相機方向：`helpers/device/promark/camera-rotation.ts`、`helpers/webcam-helper.ts`、`dialogs/camera/PromarkCalibration.tsx`、`dialogs/camera/common/{Calibration,SolvePnP,useCamera}`、`app/actions/camera/preview-helper/PromarkPreviewManager.ts` |
| **External repos** | Swiftray（branch `codex/promark-3d-inner-carving-pr`，版號 1.5.0）：STL / 點雲切片、折射計算、內雕圖層參數、UV 填充熱分散、Promark 工時模型。fluxghost：不需修改（§6.10） |
| **Agent skill** | `.agents/skills/inner-engraving/SKILL.md`、`.agents/skills/camera-calibration/SKILL.md`；Swiftray `.agents/skills/stl-inner-engraving`、`stl-geometry-processing`、`promark-job-timing` |

（以下路徑除非以 `packages/`、`apps/`、`.github/` 或 `Swiftray` 開頭，否則都相對於 `packages/core/src/web/`。「main」指 Beam Studio `origin/main` 的 `caac8d949`，Swiftray 的起點是 `origin/develop` 的 `5962d42`。）

---

## 1. Summary

本次分三部分：

1. **Promark UV 雷射源**：新增 UV 5W 雷射源與 70 / 200mm 工作範圍，UV 專屬的圖層參數（功率由頻率實現）、預設參數、材質測試與相機校正。
2. **內雕模式**：在 Promark UV 70mm 下提供 3D 畫布，把 STL、2D 圖形與文字擠出的立體物件、照片平面放進透明材料（玻璃、水晶）內部，由 Swiftray 依折射率計算焦點位置後雕刻。雕刻方式（打點 / 打線 / 加厚輪廓）是圖層參數。
3. **Promark 相機方向**：相機影像的 180° 旋轉從寫死改成校正參數的一部分，UV 的正裝相機與舊機的倒裝相機都能正確使用。

內雕的核心設計是**雙重表示**：每個 3D 物件在 SVG 裡有一個投影 rect（或 image），放在某個圖層中；同時在 `stlStore` 裡有實際的 mesh、點雲與 transform。圖層、undo、存檔、匯出都沿用 2D 的機制，3D 只多出資料區塊和顯示層。

---

## 2. Background & current state（main）

### 2.1 Promark

- 雷射源只有 Desktop（20 / 30 / 50W）和 MOPA（20 / 60 / 100W），工作範圍 110 / 150 / 220mm（`app/constants/promark-constants.ts:3-12`）。`LaserType` 只有 `Desktop`、`MOPA`。
- 圖層參數：frequency 的範圍依雷射源與瓦數決定，pulse width 只有 MOPA 有（`helpers/layer/layer-config-helper.ts` `getPromarkLimit`，`:724-740`）。沒有 Q pulse width；focus 沒有反向選項（`RightPanel/ConfigPanel/FocusBlock.tsx`）。功率與頻率是兩個獨立的參數，頻率在圖層面板主區塊。
- 相機校正的雕刻檔依工作範圍分成 `assets/fcode/promark-calibration-{110,150,220}.bvg`，由 `helpers/device/promark/calibration.ts` 載入。校正參數存在 localStorage `promark-store[serial].cameraParameters`（V3 fisheye，型別 `FisheyeCameraParametersV3`）。
- Promark 相機流程假設鏡頭倒裝：`helpers/webcam-helper.ts:133` 的 `getPicture` 預設 `flip = true`，把影像轉 180°；校正 live 影像在 `dialogs/camera/common/Calibration.module.scss:18,53` 用 CSS 寫死轉 180°。
- 材質測試產生器的 Promark 參數只有 `fillInterval`、`frequency`，MOPA 多 `pulseWidth`（`dialogs/MaterialTestGeneratorPanel/TableSetting.ts:28-29`）。
- 新功能的發佈開關集中在 `helpers/checkFeature.ts`，常見做法是 `isDev()`（`localStorage.dev`）或 `enableAllMachines`。

### 2.2 3D 與文件模式

- Beam Studio 沒有 3D 編輯能力。three.js / `@react-three/fiber` 只用在 Boxgen 的唯讀預覽（`app/components/boxgen/`）和曲面雕刻的高度圖（`dialogs/CurveEngraving/`），共用 `app/widgets/three/Canvas.tsx`。
- 文件設定裡廣域雕刻、自動送料、旋轉軸互斥，邏輯直接寫在 `dialogs/DocumentSettings/index.tsx:183-200` 的三個 `useEffect`。曲面雕刻是另一套模式控制。`helpers/addOn/` 只有 `index.ts`（`getAutoFeeder`、`getPassThrough`）與 `rotary.ts`，沒有統一的互斥模式管理。
- `.beam` 只有 4 種區塊：SVG 內容、影像來源、縮圖、misc JSON（`helpers/beam-file-helper.ts:141-153`）。
- Swiftray 只處理 2D 的 SVG / 點陣圖 payload（`helpers/api/swiftray-client.ts`），上傳參數沒有折射或 Z 方向的欄位（`helpers/api/svg-laser-parser.ts`）。
- 2D 的 auto align（`app/svgedit/autoAlign/index.ts`）、多選與框選（`app/svgedit/selection/SelectionManager.ts`）、undo（`app/svgedit/history/undoManager.ts`）都只考慮 2D 元素。
- 安裝檔打包的 Swiftray 是 `1.4.11`（`.github/workflows/app.cd.{mac,x64}.yml` 的 `SWIFTRAY_DAEMON_VERSION`）。

### 2.3 Swiftray（develop `5962d42`，版號 1.4.10）

- 只解析 2D 的 SVG 圖層與元素，沒有 3D 物件、點雲或折射。
- Promark 的工時預估分散在 `MachineJob` 和 BSL 串流兩處，Z 軸移動沒有固定開銷。
- 填充路徑依掃描線順序雕刻，沒有分散熱量的選項。

---

## 3. Goals & non-goals

### 3.1 Goals（Phase 1，本 branch 完成）

1. Promark 使用者可以設定 UV 雷射源，以 2D 方式雕刻（UV 70 / 200），參數依實測換算。
2. Promark UV 70mm 使用者可以在 3D 畫布上擺放 STL、圖形、文字、照片，依圖層參數送出內雕工作。
3. Promark 相機校正能處理正裝與倒裝兩種相機，既有用戶不用重新校正。
4. 不影響任何非 UV、非內雕的既有功能（§5）。

### 3.2 Phase 1 範圍

**UV 雷射源**
- 雷射源選項加入 UV（只有 5W），工作範圍 70 / 200，預設 70。70mm 送給後端時當作 75mm 場域。
- 送給後端的場鏡畸變參數帶光源類型：Desktop 和 MOPA 都當作 MOPA 光源（Q pulse 0），UV 是 1。
- UV 圖層參數（§6.5）：
  - 脈寬不顯示，固定 13。Q pulse（UV 新增）固定 1，只在開發者模式的「Developer Settings」區塊（`DevBlock`）顯示，標題「Q 開關」。
  - 功率由頻率實現：改功率會換算並寫入頻率（40–200kHz 分段內插），功率範圍 15.6–100%，可輸入小數。
  - 頻率移到進階設定，範圍 30–200kHz、只能輸入整數，改頻率會連動功率；30–40kHz 時功率顯示 100%。
  - 預設頻率 40kHz、功率 100%。
- 新增 `focusReverse` / `focusStepReverse` 圖層參數。
- UV 5W 的 2D 預設參數（依實測 CSV，`app/constants/presets.ts` 的 `fpm1_2_5`）。
- UV 70 / 200mm 相機校正：雕刻檔 `promark-calibration-70.bvg` / `-200.bvg`；校正雕刻用 200kHz（UV 最弱的輸出）。
- 材質測試產生器（2D）帶入 UV 圖層預設參數：
  - 不顯示頻率，功率軸的每一格換算成頻率一起寫入（功率 API 對 UV 不生效），功率最小 16%。
  - Q 只在開發者模式顯示（「Q 開關」）。
  - Engrave 模式在 uvDev 下可加測「打散掃描順序」與「每行停留」；Cut 模式沒有。
  - 打點時間只出現在 3D 材質測試，2D 不出現。
- 發佈前以 `checkFpm1UV()` 擋住：桌面版，並且開啟 `isDev()` 或 `enableAllMachines`。

**相機方向**
- 校正畫面新增「影像旋轉 180°」勾選，影響即時影像、校正取圖與之後的預覽，跟著校正參數存下來（§6.8）。
- 既有 Desktop / MOPA 用戶的校正參數照舊旋轉，不用重新校正。

**內雕**
- **模式**：文件設定新增「內雕」開關，只在 Promark + UV + 70mm 時出現。內雕、旋轉軸、廣域雕刻、自動送料、曲面雕刻收斂到統一的互斥模式管理（`helpers/exclusiveModes.ts`）。切換 2D/3D 會開新文件。`.beam` 帶 `data-inner-engraving`，重新打開時回到同一個模式。
- **材料**：方塊的尺寸、位置、折射率，以及安全邊距（dev）。
- **匯入**：
  - STL 檔，依實際尺寸置中，放不下才提示縮小。
  - 元素面板圖形（內建形狀、路徑、Noun Project 圖示）、文字，擠出成 1mm 厚。
  - SVG / DXF 檔：解析、解散後，路徑擠出、點陣圖轉照片平面；全部路徑合併成一個物件，保留相對位置；超出安全範圍時和 STL 一樣詢問是否縮小。
  - 點陣圖，轉成零厚度的照片平面，套用圖層顏色顯示。
- **物件編輯**：
  - 3D gizmo 平移、旋轉、縮放，有吸附。
  - 尺寸面板輸入位置、尺寸、旋轉、翻轉，鎖定比例可開關；照片的 Z 尺寸不能改。
  - 置中、填滿可雕區。
  - 部分 2D 動作：陣列、照片替換、去背等影像動作。
  - 編輯擠出來源（文字內容、圓角、多邊形邊數），編輯後重新擠出。
- **畫布**：格線、座標軸、尺規、縮放、預設視角與投影切換；3D 畫布上可以疊相機預覽並點選預覽區域。`.beam` 縮圖顯示標準視角下的 3D 畫布。
- **圖層參數**（§6.6）：
  - 隱藏 repeat 並強制 1；隱藏 DPI、擺動、填充間隔與填充設定。
  - 雕刻模式（打點 / 打線，預設打點）、點間距、層間距、動態層間距、加厚輪廓，都是圖層參數。
  - 打點：顯示打點時間、點間距、加厚輪廓開關，隱藏速度；加厚輪廓開啟時才顯示層間距（殼距）。
  - 打線：顯示速度、層間距（切片 Z 間距），隱藏打點時間和點間距；進階設定有「動態層間距」。
  - 照片一律打點，圖層裡有照片時不論模式都顯示打點參數。
  - 預設值依 K9 水晶實測：打點、點間距 0.03mm、層間距 0.04mm、打點時間 150µs、頻率 110kHz、速度 180mm/s。三組預設參數「K9 水晶 - 輪廓打點 / 輪廓打線 / 加厚輪廓打點」只出現在內雕文件。
- **匯出**：
  - 送出前以 AABB 檢查重疊、超出範圍、圖層 Z 順序與可雕區，有問題時警告，可以選擇繼續。
  - 每次送出都提醒手動對焦。
  - STL 與點雲用獨立 payload 傳給 Swiftray；上傳參數帶折射參數與內雕控制器設定（§7）。
- **`.beam`**：新增 STL 來源區塊（block 6）與點雲區塊（block 7）；misc 帶 `innerEngraving`。
- **路徑預覽**：內雕模式下只在 dev 開關（`isDev()`）顯示。
- **擠出精度**：曲線依誤差切段，上限是 2000 DPI 的半個像素（0.00625mm）。

**Swiftray（1.5.0）**
- 解析 `stlObjects`（base64 STL）與 `pointCloudObjects`（base64 BSPC），依投影元素的 `data-stl-matrix` 擺放。
- 內雕參數從物件所在圖層讀取（`data-stl-*`），打點以 blue-noise 取樣表面，打線依層間距切片，可選動態層間距；加厚輪廓往內多打兩層殼。
- Basic 軸向折射：`Zm = H − (H − z) / n`，只限 `material_min_z`–`material_max_z` 的模型 Z；machine Z 量化到 `machine_z_bucket`（預設 0.01mm，下限 0.001mm）。
- Promark：`;CONFIG` 行帶 UV 光源、跳躍 / 雷射延遲、first pulse killer；工時模型集中到 `promark_timing.h`，Z 軸移動加上實測固定開銷（約 50ms）。
- 填充：打散掃描順序（黃金比例步距排列）與每行停留（§6.7）。
- 長時間切片與排序可回報進度、可取消。

**只在 uvDev 開關下可見（`localStorage.uvDev`，`isUvDev()`）**
- 內雕球體與圓柱材料。沒有 uvDev 時只能選方塊，文件裡存著的球體 / 圓柱一律當作方塊（`getMaterialShape`）。
- 3D 材質測試產生器（左側 Generators 在內雕模式只在此時出現）。
- UV 填充熱分散參數：打散掃描順序、每行停留、依雕刻時間調整（§6.7）。
- 照片轉點雲（測試用，`ThreeDOptions`）。
- 調機參數覆寫：`svg-laser-parser.ts` 從 localStorage 讀雷射延遲、跳躍速度、`machine_z_bucket`、first pulse killer 等。

### 3.3 Non-goals（Phase 1 刻意不做）

- 3D 多選、框選、全選、對齊與分佈（Phase 1 只能單選）。
- 網頁版。
- 跨分頁複製貼上 3D 物件（mesh 放不進系統剪貼簿）。
- 打線＋填充（`kLineFill`）：移除，投影物件的填充不影響雕刻。
- 照片打線：照片平面可以在 3D 中傾斜，Z 是平台移動、不能邊打線邊動。

### 3.4 Phase 2（待規劃）

| # | 項目 | 備註 |
|---|---|---|
| P2-1 | **3D 多選** | 選取同步、整體 transform、尺寸面板，以及 2D 按鈕分流。待決：多選時的旋轉方式、填充開關、框選與對齊分佈。計畫在 `TODO-multi-select.md` |
| P2-2 | 照片轉點雲轉正式功能 | 目前只在 uvDev，需要合適的深度估計模型 |
| P2-3 | 點雲檔案直接匯入（PLY / GLB / BSPC） | 確認模型後討論支援範圍 |
| P2-4 | 3D 材質測試、UV 填充熱分散參數轉正式功能 | 目前只在 uvDev，等上機結果 |
| P2-5 | 球體 / 圓柱材料轉正式功能 | 目前只在 uvDev，待測試實際效果後再考慮開放 |
| P2-6 | **UV 70mm 場域大小** | 目前 UV 70mm 送給後端時當作 75mm 場域，而且是依「目前開啟的文件」判斷是否為 UV（`device-master.ts` `setField`），開著其他機型的文件連線時會送 70。要確認 UV 能否直接使用 70 的場域；若改成 70，需要修正既有的場鏡畸變校正參數（舊參數是以 75 校正的） |
| P2-7 | 輪廓打線新增「填充上下端面」 | 待實作 & 測試 |
| P2-8 | 確認 3 個超出規格的預設參數 | 待測試 & 更新 |

---

## 4. Scenarios & acceptance criteria

### S1. 設定 UV 雷射源
- **操作**：連上 Promark，進入機台設定或文件設定，把雷射源選成 UV 5W，工作範圍選 70 或 200。
- **完成的樣子**：
  - 新圖層的功率 100%、頻率 40kHz。圖層面板看不到脈寬；Q pulse 只在開發者模式的「Developer Settings」區塊；頻率只出現在進階設定。
  - 功率改成 50%，進階設定裡的頻率變成 98.3kHz；改成 15.6% 變成 200kHz。功率可以輸入小數。
  - 進階設定把頻率改成 120kHz，功率變成 40%。頻率不能輸入小數。
  - 改功率或頻率都是一步 undo，兩個值一起還原。
  - 預設參數下拉選單出現 UV 5W 的預設參數，套用後功率依頻率換算。
- **邊界情況**：
  - 功率不能低於 15.6%（200kHz）。
  - 頻率設成 30–40kHz 時功率顯示 100%；之後再改功率，頻率回到 40–200kHz 的換算值。
  - 從 UV 切回 Desktop 或 MOPA 時重新套用預設參數，頻率回到主面板，範圍回到原本的設定。

### S2. UV 材質測試（2D）
- **操作**：UV 雷射源的 2D 文件，開啟材質測試產生器。
- **完成的樣子**：
  - 參數清單沒有頻率，功率最小 16%；開發者模式下才有「Q 開關」；沒有打點時間。
  - 產生的每個色塊都寫入功率和換算後的頻率。
  - uvDev 下 Engrave 模式多出「打散掃描順序」「每行停留」，Cut 模式沒有。
- **邊界情況**：
  - Desktop / MOPA 的材質測試參數和 main 相同。

### S3. 進入與離開內雕模式
- **操作**：在 Promark + UV + 70mm 的條件下，打開文件設定裡的「內雕」開關，然後按儲存。
- **完成的樣子**：
  - 有未存檔內容時先詢問存檔。之後換成 3D 畫布，undo 紀錄清空，上方 banner 顯示內雕模式。
  - 選單 26 個 2D 專用項目變灰（`INNER_ENGRAVING_DISABLED_MENU_ITEMS`，`helpers/addOn/innerEngraving.ts:131`）：
    - 2D 編輯：位移複製、拆解路徑、拆解 use，以及 6 個影像工具（銳化、裁切、反轉、印章、向量化、曲線）。
    - 無法帶網格的匯出：BVG、SVG、PNG、JPG、UV 列印。
    - 和內雕衝突的場景與模式：6 種材質測試匯入、壓克力對焦探針、曲面雕刻。
    - 沒有作用的檢視設定：反鋸齒、auto align。
    - 兩個導覽教學（新手教學、介面介紹）。
  - 左側只剩預覽、游標、照片、文字、元素、Beamy（uvDev 下另有 Generators）。
- **邊界情況**：
  - 在詢問存檔時按取消，不會切換模式。
  - 工作範圍是 200mm 時沒有內雕開關。
  - 旋轉軸、廣域雕刻、自動送料、曲面雕刻其中一個開著時，打開內雕會關掉它們。

### S4. 匯入
- **操作**：在內雕模式下匯入 STL 檔、SVG / DXF 檔、元素面板圖形、文字、照片。
- **完成的樣子**：
  - STL 依實際尺寸置中；超出材料時提示縮小，不會自動放大。
  - SVG / DXF 解析後，所有路徑合併成一個擠出物件、點陣圖各自成為照片平面，相對位置不變。
  - 2D 圖形和文字擠出成 1mm 厚；50mm 的圓，邊緣與真圓的誤差不超過 0.00625mm。
  - 照片變成零厚度的平面，放在可雕區的中心高度，以圖層顏色顯示。3D 文字同樣置中於可雕區。
- **邊界情況**：
  - 檔案超過 20MB 或三角面超過 40 萬會警告，超過 50MB 或 100 萬會強烈警告。
  - 在 2D 模式匯入 STL 會詢問要不要切換模式，拒絕就中止匯入；3D 模式匯入 SVG、AI、DXF、PDF 也一樣。
  - SVG 擠出後超出安全範圍時詢問縮小。
  - 沒有 UV 權限時打開 3D 檔，以 2D 投影 rect 顯示。

### S5. 編輯
- **操作**：點選物件；用 gizmo 平移、旋轉、縮放；在尺寸面板輸入數值；使用「置中」「填滿可雕區」；編輯文字等擠出來源。
- **完成的樣子**：
  - 每個操作都是一步 undo；編輯擠出來源後重新擠出，併入同一步。
  - 選到物件時，圖層面板切到它所在的圖層。
- **邊界情況**：
  - shift 點選或框選時只保留最後一個物件；Ctrl+A 沒有作用。
  - 安全邊距大到沒有可雕區時，置中和填滿不能用。

### S6. 內雕圖層參數
- **操作**：在內雕模式下選一個圖層，切換雕刻模式、修改點間距 / 層間距、開關「加厚輪廓」，在進階設定開關「動態層間距」，或套用「K9 水晶」預設參數。
- **完成的樣子**：
  - 新圖層是打點模式：看得到打點時間、點間距、加厚輪廓，看不到速度、DPI、repeat、填充間隔；打點時間沒有「僅限漸層」的說明。
  - 切成打線：出現速度和層間距，打點時間和點間距消失；頻率和其他數值不變。改模式是一步 undo。
  - 打點時開啟加厚輪廓才出現層間距；送出後該圖層的 3D 物件除了表面，還往內多打兩層殼。
  - 打線時開啟動態層間距，最小值預設為層間距的一半。
  - 「輪廓打點」：頻率 110、打點時間 150、點間距 0.03。「輪廓打線」：頻率 90、速度 180、層間距 0.04。「加厚輪廓打點」：加厚輪廓、頻率 110、打點時間 150、點間距 0.04、層間距 0.04。功率依頻率換算。
  - 物件面板沒有模式、層高、點間距或填充。
- **邊界情況**：
  - 圖層裡有照片時，打線模式也顯示打點時間和點間距，照片仍然打點。
  - 多個圖層模式不同時，兩組參數都顯示。
  - 從「加厚輪廓打點」切到「輪廓打點」，加厚輪廓會關閉；套用「輪廓打線」會關閉動態層間距。
  - 2D 文件（包含 2D 的 UV）的圖層不會被寫入 `data-stl-*`，也看不到這些參數和內雕預設參數。
  - 舊檔物件上殘留的參數屬性，開檔後清除，改以所在圖層的參數雕刻。

### S7. 3D 材質測試（uvDev）
- **操作**：開啟 uvDev，在內雕模式從左側 Generators 開啟材質測試。
- **完成的樣子**：
  - 欄是打點時間、列是點間距，功率與速度為固定值；不顯示頻率、填充與 repeat。
  - 產生的每個方塊寫入功率、換算後的頻率、打點時間與點間距，圖層為打點模式。

### S8. 送出內雕工作
- **操作**：按下 Go。
- **完成的樣子**：
  - 先跳出手動對焦提醒，可以勾選不再提醒。
  - 有重疊、超出範圍、Z 順序錯誤時警告，可以選擇繼續。照片平面也會被檢查。
  - 送出的工作帶有折射參數與內雕控制器設定。
- **邊界情況**：
  - Swiftray 版本低於 1.5.0 時擋下送出並提示。
  - 每個圖層的 repeat 一律送 1。

### S9. 存檔與重開
- **操作**：存成 `.beam`，關掉後再打開。
- **完成的樣子**：
  - 自動回到內雕模式，物件、材料設定、擠出來源（可再編輯）、圖層參數都還原。
  - 首頁與 my cloud 的縮圖不顯示網格線背景。
- **邊界情況**：
  - 內雕模式下不能匯出 BVG、SVG、PNG、JPG。
  - 舊檔裡擠出的 mesh 不會因為新的曲線精度而重建，只有編輯來源時才重建。

### S10. Promark 相機方向
- **操作**：在機台設定（或初始化機器流程）執行 Promark 相機校正，在「相機校正」步驟（有即時影像的那一步）切換「影像旋轉 180°」，完成校正後做一次相機預覽。
- **完成的樣子**：
  - 從沒校正過的 UV 機：勾選框預設不勾，即時影像是正的。Desktop / MOPA 機預設勾選。
  - Desktop / MOPA 機重新校正（勾選框維持勾選）後，預覽影像是正的，方向和升級前相同。
  - 勾選或取消時，即時影像立刻跟著轉；之後的 SolvePnP、CheckPnP 照片和完成後的預覽都是同一個方向。
  - 完成校正後再開校正畫面，勾選框維持上次存的值，不看光源設定。
- **邊界情況**：
  - 升級前已經校正過的 Promark（參數裡沒有這個值）：不用重新校正，預覽照舊旋轉 180°，再開校正畫面時預設勾選。
  - 在第一步按「略過」沿用既有參數時，方向固定為既有參數的值，即使先進過校正步驟改了勾選也一樣。
  - 雷射源設成 UV、但校正是在升級前做的，仍然視為要旋轉，需要重新校正並取消勾選。

---

## 5. Must not change（回歸合約）

本 branch 動到的共用檔案，以及非 UV、非內雕情境下必須維持的行為。

| 共用檔案 / 函式 | 呼叫端 — 必須維持的行為 |
|---|---|
| `helpers/layer/layer-config-helper.ts` `writeDataLayer` | 所有 2D 圖層：repeat 照使用者設定寫入，只有內雕模式會被強制改成 1 |
| 同檔 `getDefaultConfig`、`getPromarkLimit` | Desktop / MOPA Promark：frequency、pulse width 的預設值與範圍和 main 相同 |
| 同檔 `getConfigKeys`、`getLayerConfig` / `getLayersConfig` / `cloneLayerConfig` | 非內雕的所有圖層：參數 key、預設值、讀取結果和 main 相同，不會出現 `stl*` |
| `RightPanel/ConfigPanel/PowerBlock.tsx`、`FrequencyBlock.tsx`、`AdvancedSettingModal.tsx`、`ConfigPanel.tsx` | Desktop / MOPA Promark 與其他機型：功率範圍 0–100、頻率留在主面板、改功率不會寫入頻率；DPI、repeat、填充設定照舊顯示；沒開 `isDev()` 時不出現焦距「反向」開關（和 main 相同） |
| `RightPanel/ConfigPanel/DottingTimeBlock.tsx` | 2D：只有漸層圖片時顯示，並帶「僅限漸層」說明 |
| `helpers/presets/preset-helper.ts` `getPresetModel` | 非內雕：各機型與 Desktop / MOPA 雷射源的預設參數清單不變 |
| `MaterialTestGeneratorPanel/*` | Desktop / MOPA 與其他機型：2D 材質測試的參數、色塊內容不變 |
| `app/svgedit/autoAlign/index.ts` `isEnabled` | 2D 的繪圖、移動、縮放：auto align 照偏好設定運作 |
| `app/svgedit/selection/SelectionManager.ts` | 2D 的 shift 多選、框選、tempGroup 群組不變 |
| `app/svgedit/history/undoManager.ts` | 2D 的 undo / redo 不變。新增的 `appendCommandToLast` 只有 3D 擠出會用到 |
| `app/actions/beambox/svg-editor.ts` 匯入分流 | 2D 匯入 SVG、AI、DXF、PDF、點陣圖不會被詢問切換模式 |
| `helpers/api/svg-laser-parser.ts` 上傳參數 | 非 UV、非內雕：不會多帶參數 |
| `helpers/api/swiftray-client.ts` | 2D 工作的 payload 不變，log 遮罩只多了 STL 和點雲 |
| `helpers/beam-file-helper.ts` | 2D `.beam` 讀寫的 bytes 和 main 相同；只有存在 3D 物件時才寫入新區塊 |
| `helpers/exclusiveModes.ts`、`helpers/addOn/*` 重構 | 旋轉軸、穿透、自動送料、曲面雕刻各自開關的行為，以及舊檔的相容性不變 |
| `DocumentSettings/index.tsx` | 非 Promark 機型的文件設定不變。Desktop / MOPA 的雷射源與工作範圍選項不變 |
| `DocumentSettings/index.module.scss` | 只有開關的列，開關只佔自身寬度（多 12px 間距），標題可用其餘寬度；下拉選單、輸入框、起點選擇等列仍維持控制項至少半行 |
| `helpers/device/framing.ts` | 2D 的 framing 選項不變（Hull / Contour 只在 3D 隱藏） |
| `public/js/lib/svgeditor/sanitize.js` | 既有屬性的白名單不變；只新增 UV / 內雕的屬性 |
| `RightPanel/OptionsPanel.tsx` | 2D 物件的填充、顏色、文字、圖形選項不變（只有 3D 物件拿掉填充） |
| `app/svgedit/layer/layerManager.ts` `checkGradient` | `hasGradient` 的判斷與更新時機不變（只多算 `hasStlPhoto`） |
| `helpers/layer/setLayerVisibility.ts`、`helpers/layer/layer-helper.ts` `cloneLayer` | 2D 切換圖層顯示：只切換顯示與預噴區域，不重建圖層列表（只有內雕模式會 `resync`）；2D 複製圖層的內容與 undo 不變 |
| `pages/InitializeMachine/Promark/SelectPromarkLaserSource.tsx`、`constants/promark-constants.ts` | 初始化機器：UV 選項只在 `checkFpm1UV()` 時出現；Desktop / MOPA 的選項、工作範圍清單與預設值和 main 相同 |
| `dialogs/camera/PromarkCalibration.tsx` | Desktop / MOPA 從頭校正時可勾選「影像旋轉 180°」，預設為旋轉；其他機型的相機校正不會出現這個選項 |
| `helpers/device-master.ts` `setGalvoParameters`、`swiftray-control.ts` `setLensCorrection` | 每次送出場鏡校正都帶 `laserSource`，Swiftray 依此更新記錄的雷射類型；Desktop / MOPA 送 `MOPA`，行為和 main 相同 |
| `common/ZoomBlock.tsx` | 2D 畫布的縮放比例計算結果不變 |
| `OptionsBlocks/ImageOptions/index.tsx`、`operations/import/readBitmapFile.ts` | 2D 圖片的換圖、匯入（選取、undo、對齊的時機）和 main 相同；深度雕刻設定只在內雕模式隱藏 |
| `actions/beambox/beambox-global-interaction.ts` | 2D 進入編輯器時的選單狀態和 main 相同；內雕關閉後，曲面雕刻與依選取而定的項目（拆解路徑等）回到各自的條件 |
| `dialogs/RotarySettings.tsx`、`actions/canvas/curveEngravingModeController.ts`、`operations/import/importBvg.ts`（改用 `setExclusiveMode` / `applyExclusiveModePatch`） | 開啟旋轉軸、曲面雕刻、穿透、自動送料時關掉其他模式的結果和 main 相同；舊檔開啟時各模式的套用結果不變；2D 檔案（含降級的內雕檔）不改材料設定 |
| `boundaryDrawer.ts`、`svgedit/workarea.ts`、`SvgEditor/Banner.tsx`、`ConfigPanel/SpeedBlock.tsx`、`helpers/addOn/rotary.ts`（`getAutoFeeder` / `getPassThrough` 改成物件參數） | 自動送料、穿透的判斷結果、邊界、Banner、速度上限不變 |
| `svgedit/svgcanvas.ts` `getSvgString`、`clear` | 2D 文件存出的 SVG 不帶 `data-inner-engraving` 與 `data-inner-engraving-material`；清空畫布的行為不變 |
| `operations/clipboard/*`、`operations/delete.ts`、`helpers/layer/deleteLayer.ts` | 2D 的複製、貼上、陣列、刪除、刪除圖層及其 undo 不變；只有 3D 投影會同步 `stlStore` |
| `export-funcs-swiftray.ts`、`export/generate-thumbnail.ts`、`file/export/utils/beam.ts` | 2D 工作不帶 `stlObjects` / `pointCloudObjects`（為 `undefined`），縮圖與 `.beam` 內容和 main 相同；framing 的上傳內容不變 |
| `RightPanel/ObjectPanel.tsx`、`ActionsPanel.tsx`、`OptionsBlocks/{PolygonOptions,RectOptions,TextOptions/*}` | 2D 物件的尺寸面板、工具列、動作按鈕與選項不變（新增的 props 只有 3D 物件會傳） |
| `SvgEditor/SvgEditor.tsx`、`SvgEditor/CanvasControl.tsx`、`Generators/*` | 2D 的尺規、DPI 資訊、Generators 清單、畫布控制項不變 |
| `stores/selectedElementStore.ts`、`stores/canvas/canvasStore.ts`（`spaceKey`）、`stores/canvas/utils/mouseMode.ts` | 2D 元素的 nodeType 與群組判斷不變；空白鍵平移與游標不變 |
| `operations/import/importBitmap.ts`、`ElementPanel/utils/importElement.tsx`、`actions/beambox/svgeditor-function-wrapper.ts` | 2D 匯入點陣圖、元素庫與 Noun Project 圖示的結果不變；匯入對話框只有 `checkFpm1UV()` 時多出 `.stl` |
| `actions/beambox/preview-mode-background-drawer.ts` | 2D 相機預覽背景的繪製與清除不變（只多寫 `backgroundUrl`） |
| `app/svgedit/text/paramsLabel.ts` | 2D 參數標籤的內容不變 |
| `TopBar/useMenuData.ts`、`AbstractMenu.ts` | 2D 的選單項目狀態不變 |
| `LeftPanel/components/LeftPanelButtonGroup.tsx` | 文字 / 文字框按鈕群組：點擊和 T 快捷鍵執行目前選中的選項，長按或右鍵切換選項的行為不變 |
| `LeftPanel/components/DrawingToolButtonGroup.tsx` | 2D 的左側工具與 Generators 按鈕不變 |
| `TopBar/PathPreviewButton.tsx` | 有模組的機型（Ador 等）可以看到路徑預覽；只有內雕模式隱藏 |
| `helpers/webcam-helper.ts` `getPicture`（參數改為必填 `{ rotate180 }`） | `PromarkPreviewManager` — 已校正的 Desktop / MOPA 預覽照舊轉 180°；`check-camera.ts` — 只看照片大小，結果不變 |
| `dialogs/camera/common/useCamera.ts`（`Options` 改成 `CameraSource` union）、`useLiveFeed.ts` | Wi-Fi 相機的所有校正流程（Ador、BB2 / HEXA 鏡頭、廣角、Beamo2）：取圖、曝光、live 更新不變 |
| `dialogs/camera/common/Calibration.tsx`、`Calibration.module.scss` | Wi-Fi 相機：顯示 `<img>`，不受旋轉影響 |
| `dialogs/camera/common/SolvePnP.tsx`（`imgSource` 改成 `cameraSource`） | Ador、BB2 / HEXA、廣角、Beamo2 的 SolvePnP：不傳 `cameraSource`，維持 Wi-Fi 取圖 |
| `interfaces/Promark.d.ts` `PromarkStore.cameraParameters` | 讀取既有參數的地方（`PromarkPreviewManager`、`camera/index.tsx`、`InitCameraCalibration`）：舊資料照常讀取 |
| `app/stores/cameraPreview.ts`（新增 `backgroundUrl`） | 2D 預覽背景的繪製不變 |
| `app/constants/resolutions.ts` | 所有機型的 DPI 選項和 main 相同 |
| `.github/workflows/app.cd.{mac,x64}.yml` | 升級打包的 Swiftray（1.5.0）後，所有機型的 2D 工作照常送出 |
| `actions/beambox/beambox-preference.ts`、`stores/documentStore.ts`、`interfaces/Preference.d.ts` | 既有偏好與文件設定的預設值、讀寫不變；只新增 `inner-engraving*`（模式開關、材料形狀 / 尺寸 / 位置 / 折射率 / 安全邊距），預設值來自 `constants/innerEngraving.ts` |
| `export/GoButton/handleExportAlerts.ts` | 2D 送出：自動送料、曲面雕刻、Promark 等既有檢查與提示的順序不變；只有內雕模式多出物件檢查、對焦提醒與 Swiftray 1.5.0 的版本檢查 |
| `actions/dialog-caller.tsx`、`Generators/generators.config.tsx` | 既有對話框與 2D 的 Generators 清單、順序不變；只新增內雕材質測試的對話框，`isInnerEngraving` 時 Generators 只回傳它 |
| `ConfigPanel/AdvancedBlock.tsx`、`FocusBlock.tsx`、`DevBlock.tsx`、`usePromarkLimit.ts` | 非 Promark 機型的焦距區塊不變（`isPromark` 只有 Promark 傳 true）；焦距「反向」開關只在 `isDev()` 且 Promark 顯示；`QPulseWidthBlock` 只掛在 Promark 上、非 UV 不渲染；`PulseWidthBlock` / `FrequencyBlock` / `AdvancedSettingModal` 拿到的 Desktop / MOPA 範圍和 main 相同 |
| `dialogs/PresetsManagementPanel/PromarkInputs.tsx` | Desktop / MOPA：欄位、範圍與寫入的 key 和 main 相同；只有 UV 把強度顯示成頻率對應值並連動寫入，內雕時改列 `stl*` 參數 |
| `OptionsBlocks/TextOptions/components/TextContentBlock.tsx` | 2D 文字編輯與 undo 不變；`onSourceChange` 只有 3D 文字（擠出來源）會傳 |
| `RightPanel/_mixins.scss` | `option-block` 的樣式輸出不變（label 樣式抽成 `option-label` mixin） |
| `dialogs/myCloud/GridFile.tsx`、`GridFile.module.scss`、`welcome/GridFileLocal.tsx`、`welcome/TabRecentFiles.tsx`、`interfaces/IMyCloud.ts` | 2D 檔案的縮圖卡片（導引線背景）與最近檔案列表不變；只有 `.beam` header 標記為內雕的檔案改用素色背景 |
| `constants/fisheyeCameraConstants.ts` | 既有 110 / 220 工作範圍的 PnP 點不變；只新增 70 與 200 |
| `constants/presets.ts`、`constants/presetNames.ts`、`constants/addOn.ts` | 既有機型的預設參數、材質 / 預設名稱對應、add-on 資訊不變；只新增 UV（`fpm1_2_5`）、內雕（`fpm1_inner_engraving`）的預設參數與名稱，以及 fpm1 的 `innerEngraving` 欄位（`raiseFocus` 只宣告、沒有使用） |
| `stores/layer/layerStore.ts` | 既有欄位不變；只新增 `hasStlPhoto` |
| `operations/import/importSvg/index.tsx`、`importSvg/utils/processOutputData.ts`、`svgedit/polygon/index.ts` | 只把 `performSvgPreChecks`、`preprocessSvgString`、`computePolygonPoints` 改為匯出給 3D 流程重用，2D 匯入與多邊形繪製不變 |
| `interfaces/Clipboard.ts`、`IHistory.d.ts`、`IWrappedFile.d.ts`、`IControlSocket.d.ts`、`ITaskConfig.ts`、`ILayerConfig.d.ts` | 既有介面成員不變；只新增內雕 / UV 用的成員（`addStlToClipboard` / `getStlFromClipboard`、`appendCommandToLast`、`stlObjects` / `pointCloudObjects`、`setLensCorrection` 的 `laserSource`、Promark 控制器參數、`InnerEngravingConfig`、`PromarkModel` 的 UV 與 `fpm1_inner_engraving`） |
| `helpers/api/alert-config.ts` | 既有 alert key 不變；只新增 `skip-inner-engraving-focus-reminder`、`skip-stl-import-warning` |
| `helpers/checkFeature.ts`、`helpers/is-dev.ts` | 既有 `checkFpm1` 等判斷不變；只新增 `checkFpm1UV`（桌面版且 `enableAllMachines` 或 `isDev()`）與 `isUvDev` |
| `helpers/device/promark/calibration.ts` | Desktop / MOPA 的相機校正任務參數和 main 相同；只有 UV 改用最弱輸出（200kHz） |
| `helpers/version-checker.ts` | 既有版本需求不變；只新增 `SWIFTRAY_SUPPORT_STL` / `SWIFTRAY_SUPPORT_POINT_CLOUD`（1.5.0） |
| `interfaces/ILang.ts`、`app/lang/*` | 既有翻譯 key 不變；只新增 `inner_engraving`、`inner_engraving_settings` 與 UV 相關的 key，23 個語言檔同步 |
| `dialogs/promark/PromarkSettings.tsx`、`LeftPanel/index.tsx` | 只加註解，行為不變 |
| Swiftray `createGNode`、`Layer::setParameters`、`ToolpathExporter` | 2D 圖層參數的解析與 2D 工作的輸出不變；`fillInterleave` 關閉、`fillDwellTime` 為負時，填充順序與時間和 1.4.10 相同 |
| Swiftray `promark_timing.h`、`MachineJob::calcTotalTime`、`BSLMotionController` | 非內雕 Promark 工作的工時預估只因 Z 軸固定開銷而變長，其他不變 |
| Swiftray `BSLMotionController::handleGcode`（`;CONFIG`）、`setCorrection`（`laserSource`） | `;CONFIG` 行只更新設定、不會被當成 G-code 執行；沒有 `;CONFIG` 的工作使用預設值。`setCorrection` 未帶 `laserSource` 時視為 `MOPA`，Desktop / MOPA 的脈衝設定和 1.4.10 相同 |
| Swiftray `worker.cpp` `loadSVG`、`swiftray-server.cpp` | 沒有 `stlObjects` / `pointCloudObjects` 的 2D 工作，載入與轉檔流程不變 |
| Swiftray `gcode-generator.h`（路徑預覽的模擬打點）、`BSLListManager`（`LongDelay`） | 2D 路徑預覽的輸出不變（模擬打點只在 STL 打點時開啟）；沒有填充停留時間時不會插入 `U` 指令 |

---

## 6. Design

### 6.1 雙重表示
- **SVG 端**：投影 `<rect data-stl="1">`（mesh / 點雲）或 `<image data-stl-photo>`（照片），帶 `data-stl*` 屬性（`app/svgedit/stl/constants.ts`），放在圖層裡。圖層、undo、刪除、複製、匯出沿用 2D。
- **Runtime 端**：`stlStore` 存 `buffer`（STL bytes）、`geometry`、`transform`、`kind`（mesh / photo / point-cloud）、`pointCloudBuffer`。
- **同步**：資料單向 store → rect。`components/beambox/InnerEngraving/utils/projection.ts` 把 3D bounding box 投影回 rect；任何新增或移除投影的操作都要在執行時與 command 的 `onAfter` 呼叫 `syncStlObjectsWithDom`（`app/svgedit/stl/sync.ts`）。
- **座標**：場景單位 0.1mm，X 向右、Y 向後、Z 向上，原點是對焦高度的左前角。SVG Y 的翻轉只在 `projection.ts` 做一次。

### 6.2 2D → 3D 擠出
- 來源 markup 存在 `data-stl-source`，可以再編輯。
- 流程：three.js `SVGLoader` 解析 → 曲線依誤差切段（上限 0.00625mm，每段最多 4096 段）→ `ExtrudeGeometry` → 輸出 STL（`app/svgedit/stl/extrusionSource.ts`）。
- 不用 2D 的「轉換為路徑」：2D 的曲線切段由後端依 DPI 處理，3D 必須在前端產出網格。
- SVG 檔匯入（`importStl/importSvgFile.ts`）：解析與解散後，所有路徑聯集成一個擠出物件，點陣圖各自成為照片平面，維持相對位置。

### 6.3 互斥模式
`helpers/exclusiveModes.ts` 統一管理內雕、旋轉軸、穿透、自動送料、曲面雕刻的互斥。讀到同時開了多種模式的舊檔時，內雕優先。曲面雕刻的可用性（`canStartCurveEngraving`）同時用在原生選單與網頁選單。

### 6.4 Dev gate
- 發佈開關：`checkFpm1UV()` = 桌面版，且 `isDev()`（`localStorage.dev`）或 `enableAllMachines`（`helpers/checkFeature.ts:8`）。
- `isUvDev()` 讀 `localStorage.uvDev`，只擋 UV 調參與開發中的 3D 工具（§3.2 清單）；和 `isDev()` 分開，避免開了 dev 的人都看到半成品。
- Q pulse 在 `DevBlock`，跟著 `isDev()`。
- 下降焦距 / 逐層焦距的「反向」開關（`focusReverse`、`focusStepReverse`）只在 `isDev()` 顯示，Desktop / MOPA / UV 都有（`ConfigPanel/FocusBlock.tsx`、`AdvancedSettingModal.tsx`）。

### 6.5 UV 功率與頻率
UV 雷射的功率 API 不生效，實際輸出由頻率決定（2026-10-09 實測；改變脈寬時輸出不變，所以脈寬固定 13）。功率% 是頻率的代稱，以 40kHz 的 4.5W 為 100%：

| 頻率 kHz | 40 | 50 | 60 | 80 | 100 | 120 | 150 | 180 | 200 |
|---|---|---|---|---|---|---|---|---|---|
| 實測輸出 W | 4.5 | 4 | 3.6 | 2.8 | 2.2 | 1.8 | 1.3 | 0.9 | 0.7 |
| 功率 % | 100 | 88.9 | 80 | 62.2 | 48.9 | 40 | 28.9 | 20 | 15.6 |

- 換算放在純函式模組 `helpers/layer/uvPowerFrequency.ts`（資料表 + 雙向換算），面板、預設參數、材質測試共用。相鄰兩點線性內插。30kHz 實測也是 4.5W，不放進表內，避免 100% 對到兩個頻率。
- **改功率**：可輸入小數，換算出的頻率保留小數寫入；後端接受小數並四捨五入。
- **改頻率**（進階設定）：只能輸入整數，30–200kHz。40–200 依表換回功率；30–40 時功率顯示 100%。
- 功率和頻率在同一個 BatchCommand 寫入，undo 一步。頻率是後端實際使用的值；讀到兩者不一致的圖層時，以頻率反推功率顯示。
- **功率下限** 15.6% 放在 `getPromarkLimit` 的 UV 分支，讓 `PowerBlock` 的輸入框和滑桿直接限制。機型的 `minPower` 只顯示低功率警告，也分不出雷射源，所以不沿用。
- Promark 不支援 PWM，漸層點陣圖的圖層 `minPower` 不受影響。

### 6.6 內雕圖層參數
打點或打線決定了哪組雷射參數適用，所以雕刻方式是圖層參數。

- **前端**：`innerEngravingConfigKeys`（`stlMode`、`stlPointSpacing`、`stlLayerSpacing`、`stlMinLayerSpacing`、`stlSolid`）只在內雕模式加入 `getConfigKeys`、`getDefaultConfig`，以及圖層的讀取與複製，所以 2D 圖層不會帶這些屬性。圖層屬性名稱見 §7。
- **顯示規則**集中在 `ConfigPanel/getInnerEngravingBlocks.ts`：
  - 打點：打點時間、點間距、加厚輪廓開關（`SolidBlock`）。
  - 打線：速度、動態層間距（進階設定）。
  - 層間距：打線，或打點且開啟加厚輪廓時顯示。
  - 圖層含照片（`layerStore.hasStlPhoto`）：一律顯示打點參數。
  - 多個圖層混合模式：兩組都顯示。
- **後端**：Swiftray 在 `createGNode` 讀圖層的 `data-stl-*` 存進 `Layer`；`ToolpathExporter::resolveStlPlacement` 把物件所在圖層的參數套到物件上。缺少 `data-stl-mode` 視為打點，間距 ≤ 0 時用預設值（`kDefaultStlPointSpacingMm` 0.03、`kDefaultStlLayerSpacingMm` 0.04），和前端一致。
- **雕刻種類**（`stlEngraveKind`）：照片和點雲一律打點；網格打點開了加厚輪廓是 `kDotFill`，否則 `kDot`；網格打線一律 `kLine`。
- **加厚輪廓**：在表面之外，沿頂點法向量往內縮兩層殼取樣（`max_shell_count` = 3），殼距是層間距。
- **照片**：取樣格距是點間距；漸層照片用擴散抖動，非漸層用門檻二值化。
- **預設參數**：內雕文件使用獨立的預設參數模型 `fpm1_inner_engraving`（`getPresetModel`），只有三組 K9 預設參數；2D 的 UV 預設參數（`fpm1_2_5`）不會出現。

### 6.7 UV 填充的熱分散（uvDev）
UV 光點長時間停在同一小範圍會累積熱，雕得比預期深。填充路徑有兩個獨立的方式分散熱量，都是圖層參數：

- **打散掃描順序**（`data-fillInterleave`，開關）：第 i 次雕刻第 `(i × s) mod n` 行，n 是掃描線數、s 是和 n 互質的步距，每行剛好雕一次。s 在 n/φ 附近 ±max(3, n/10) 內選：同時看「先後隔 1～3 次雕刻的兩行」的空間距離，和「空間上相隔 1～3 行」的雕刻時間間隔，兩者取最小，挑這個值最大的步距；同分時取最接近 n/φ 的（Swiftray `interleaveStride`）。
- **每行停留**（`data-fillDwellTime`，µs，負值為關閉）：每掃完一行暫停這麼久。開啟「依雕刻時間調整」（`data-fillDwellAdaptive`）時，扣掉這一行本身雕刻花的時間。
- 材質測試（2D Engrave）可以加測這兩項。

### 6.8 Promark 相機方向
Desktop / MOPA 的 Promark 相機是倒裝的，UV 相機是正裝的。使用者選的光源不一定可靠，所以方向不由光源決定，而是在校正時選定，跟著校正參數存下來。d、k、rvec、tvec 都是在這個方向的影像上算出來的，改方向就必須重新校正。

- **判斷**（`helpers/device/promark/camera-rotation.ts`）：
  - `isCameraRotated(params)` = `params.rotate180 ?? true`：沒有這個欄位的參數是升級前存的，視為倒裝。
  - `getInitialCameraRotation(serial)`：有校正參數就照參數；沒有時 UV 不轉，其他要轉。只決定勾選框的初始值。
  - 不做 migration、不回填 localStorage；不依光源補寫舊參數的 `rotate180`。
- **校正流程**（`PromarkCalibration.tsx`）：勾選框在 CALIBRATION 步驟（`Calibration` 的 `extra`），因為只有這一步看得到即時影像。值傳給 `Calibration`、`SolvePnP`、`CheckPnP`，CHECK_PNP 存檔時寫進參數。第一步按略過時重設成 `isCameraRotated(currentData)`，因為沿用的內參是舊方向算的。
- **取圖**：`WebCamConnection.getPicture({ rotate180 })` 參數必填。`useCamera` 的 `Options` 是 `CameraSource` union：USB 必須帶 `rotate180`，Wi-Fi 不能帶。live `<video>` 依值加上 `.rotate180` class。
- **預覽**：`PromarkPreviewManager.preview` 依 `isCameraRotated(fisheyeParams)` 取圖。

### 6.9 折射補償
- **模型**（Swiftray `refraction-compensator.cpp`）：`機器 Z = H − (H − z) / n`，每個機器 Z 對應材料內一個水平深度。
- 內雕場鏡以平面模式（同一個機器 Z）雕刻可得到平坦平面，所以只需要軸向公式，不需要焦距、場曲或離軸補償。
- 一般平場鏡（非內雕場鏡）以平面模式雕刻，在材料內會得到曲面；但決定不做補償。

### 6.10 後端相容
- fluxghost 的 `update_data`（`fluxghost/api/camera_calibration.py`）與 `set_fisheye_matrix`（`fisheye_camera_mixin.py`）只取認得的 key，多出的 `rotate180` 不影響，不用另外過濾。
- Swiftray 版本：`SWIFTRAY_SUPPORT_STL`、`SWIFTRAY_SUPPORT_POINT_CLOUD` 都是 1.5.0（`helpers/version-checker.ts:46,48`）。內雕圖層參數與舊版後端不相容（物件屬性已移除），前後端一起改、一起打包。

### 6.11 硬性限制

「依據」欄：**PM** 表示 PM 決策；**實測** 表示依硬體量測；**註解** 表示程式註解有說明理由；**–** 表示沒有記錄理由。

**文件 / 模式**
| 行為 | 值 | 位置 | 依據 |
|---|---|---|---|
| 內雕只開放給 Promark + UV + 70×70 | 70 | `helpers/addOn/innerEngraving.ts`（`checkInnerEngraving`） | PM |
| 打開內雕時雷射源固定設成 UV 5W | UV / 5W | `helpers/addOn/innerEngraving.ts`（`PROMARK_UV_INFO`） | PM |
| 只有桌面版可用，且要開 `isDev()` 或 `enableAllMachines` | – | `helpers/checkFeature.ts:8` | 2026-10-05 決定 |
| 切換 2D/3D 一律開新文件 | – | `app/actions/canvas/innerEngravingMode.ts` | PM |
| 不同模式的檔案匯入時詢問切換，拒絕就中止 | – | `svg-editor.ts`（`MODE_GATED_TYPES`）、`innerEngravingGate.ts` | 註解 |
| 26 個選單項目停用 | – | `helpers/addOn/innerEngraving.ts:131` | 註解 |
| auto align 強制關閉 | – | `app/svgedit/autoAlign/index.ts` `isEnabled` | 註解 |
| 路徑預覽隱藏（dev 可見） | – | `TopBar/PathPreviewButton.tsx` | **PM 08/06** |
| Generators 隱藏；3D 材質測試只有 uvDev | – | `SvgEditor.tsx`、`DrawingToolButtonGroup.tsx` | 註解 |
| 尺規與 DPI 資訊隱藏 | – | `SvgEditor.tsx` | – |
| Framing 只有材料外框和 Framing（沒有 Hull / Contour）；圓形用 48 段 | 48 | `helpers/device/framing.ts` | 註解 |
| 材料最大高度；Z 精度 | 300mm / 0.001mm | `app/constants/addOn.ts` | 註解（保守值） |
| 材料尺寸、位置、折射率範圍 | 1–1000mm、±1000mm、1–3 | `app/constants/innerEngraving.ts` | 註解 |
| 預設材料 | 方塊 50×50×50，位於 (35,35)，n=1.537（K9） | `app/constants/innerEngraving.ts`（`DEFAULT_MATERIAL`） | 實測 2026-10-13 |
| 安全邊距；只有 dev 能改 | 4mm（0–50） | `app/constants/innerEngraving.ts`、`InnerEngravingSettings.tsx` | 註解（參考 xTool，未驗證） |
| 只能存成 `.beam`；雲端檔案用 2D 縮圖樣式 | – | `helpers/addOn/innerEngraving.ts` | 註解 |

**畫布與物件**
| 行為 | 值 | 位置 | 依據 |
|---|---|---|---|
| 只能單選；shift、框選、圖層面板選取都縮減成最後一個 | – | `SelectionManager.ts` | 註解 |
| 全選（Ctrl+A）無作用 | – | `svg-editor.ts` | – |
| 3D 物件隱藏對齊、分佈、群組、布林 | – | `RightPanel/ObjectPanel.tsx`、`selectedElementStore.ts` | 註解 |
| 照片的 Z 尺寸不能改 | – | `DimensionPanelStl.tsx` | 註解 |
| 物件最小尺寸；gizmo 最小縮放 | 0.01mm / 1e-3 | `DimensionPanelStl.tsx`、`StlMesh.tsx` | – |
| 吸附：旋轉、移動、尺寸 | 15° / 1mm / 1mm | `InnerEngraving/utils/snapping.ts` | – |
| STL 依實際尺寸置中；只縮小、不放大 | – | `importStl/index.ts` | **PM 08/06** |
| STL 警告門檻 | 20MB（強烈 50MB）；40 萬面（強烈 100 萬） | `importStl/preCheck.tsx` | 註解 |
| 2D 圖形與文字的擠出厚度 | 1mm | `importStl/importPath.ts`、`importText.ts` | – |
| 擠出曲線精度 | 0.00625mm，每段最多 4096 段 | `app/svgedit/stl/extrusionSource.ts` | 註解 |
| 照片：零厚度平面，放在可雕區中心（含高度），XY 縮到放得下；沒有可雕區時放在材料高度一半 | – | `app/svgedit/stl/photoPlane.ts` | – |
| 跨分頁貼上 3D 物件會被丟掉 | – | `clipboard/actions/paste.ts` | 註解 |

**圖層參數**
| 行為 | 值 | 位置 | 依據 |
|---|---|---|---|
| repeat 強制為 1，欄位隱藏 | 1 | `layer-config-helper.ts`（`writeDataLayer`）、`ConfigPanel.tsx` | **PM 08/06** |
| DPI 隱藏；送出時沿用圖層原本的 DPI | – | `ConfigPanel.tsx` | 2026-10-05 決定 |
| 內雕圖層預設：模式、點間距、層間距、打點時間、頻率、速度 | 打點 / 0.03 / 0.04mm / 150µs / 110kHz / 180mm/s | `layer-config-helper.ts`；Swiftray `kDefaultStl*` | 實測 K9 |
| 點間距、層間距範圍 | 0.001–5mm | `app/constants/innerEngraving.ts` | 註解（暫定） |
| 加厚輪廓的層數（表面＋往內兩層） | 3 | Swiftray `stl-utils.h` `max_shell_count` | 2026-10-12 決定 |
| UV 預設功率、頻率 | 100% / 40kHz | `layer-config-helper.ts` `getDefaultConfig` | 2026-10-09 決定 |
| UV 脈寬固定隱藏；Q pulse 預設 1，只在 Developer Settings | 13 / 1 | `layer-config-helper.ts`、`ConfigPanel/DevBlock.tsx` | 實測 2026-10-12 |
| UV 功率範圍；頻率範圍 | 15.6–100%（可小數）；30–200kHz（整數） | `getPromarkLimit`、`PowerBlock.tsx`、`AdvancedSettingModal.tsx` | 2026-10-09 決定 |
| 新圖層：qPulseWidth、fillInterleave、fillDwellTime | 1 / 關閉 / −50000（關閉） | `layer-config-helper.ts` `baseConfig` | – |
| focus「反向」開關：只在 `isDev()` 顯示，所有 Promark 雷射源都有 | – | `ConfigPanel/FocusBlock.tsx`、`AdvancedSettingModal.tsx` | 2026-10-14 決定（§10 #1） |
| UV 範例檔參數是空的 | `{}` | `promark-constants.ts` | 註解（等硬體預設值） |

**匯出 / 後端**
| 行為 | 值 | 位置 | 依據 |
|---|---|---|---|
| 3D 一律帶折射參數；後端固定用 Basic 軸向模型 | – | `svg-laser-parser.ts`；Swiftray `refraction-compensator.cpp` | 註解 |
| `machine_z_bucket` 只能透過 uvDev 設定；預設 0.01、下限 0.001 | 0.01 / 0.001 | `svg-laser-parser.ts`；Swiftray `kDefaultMachineZBucketMm` / `kMinMachineZBucketMm` | 註解（預設較粗省時、更細會卡住） |
| 內雕控制器設定：UV 光源、跳躍延遲 min / max、雷射開關延遲 | 1 / 1000µs / 1000µs / 150µs / 150µs | `svg-laser-parser.ts`（`INNER_ENGRAVING_CONTROLLER_CONFIG`） | 實測 2026-10-13 |
| 上述延遲、跳躍速度、marking / corner delay、first pulse killer 可由 uvDev 覆寫 | – | `svg-laser-parser.ts` | 註解 |
| Swiftray 低於 1.5.0 擋下 STL 與點雲 | 1.5.0 | `version-checker.ts:46,48`、`handleExportAlerts.ts:220,227` | 2026-10-13 決定 |
| 送出前檢查（AABB）可以選擇繼續 | – | `handleExportAlerts.ts`、`checkInnerEngravingObjects.ts` | 註解 |
| 每次送出都提醒手動對焦 | – | `handleExportAlerts.ts` | 註解（最大的操作風險） |

**機台 / UV**
| 行為 | 值 | 位置 | 依據 |
|---|---|---|---|
| UV 只有 5W | `[5]` | `promark-constants.ts` | – |
| UV 70mm 送給後端當作 75mm 場域 | 75 | `promark-constants.ts`、`device-master.ts` | 註解 |
| Desktop 雷射源送給 Swiftray 時當作 MOPA | – | `promark-constants.ts`、`device-master.ts` | 註解 |
| UV 相機校正雕刻用最弱的頻率 | 200kHz | `helpers/device/promark/calibration.ts` | 2026-10-12 決定 |
| 校正參數沒有 `rotate180` 時影像旋轉 180° | `true` | `camera-rotation.ts` `isCameraRotated` | 2026-10-13 決定 |
| 沒有校正參數時勾選框初始值依光源 | UV 不轉 | `camera-rotation.ts` `getInitialCameraRotation` | 2026-10-13 決定 |
| Promark 每次 Z 軸移動的固定開銷 | 約 50ms | Swiftray `PromarkJobConfig::AXIS_MOVE_OVERHEAD_MS` | 實測（0.001mm 步距） |
| STL 低速打點的工時係數 | 2.0 | Swiftray `promark_timing.h` | 實測 |

---

## 7. Data contracts

- **`.beam`**：block 6（STL 來源）與 block 7（點雲 BSPC），以物件 id 為 key；header 依實際存在的區塊計算。misc JSON 帶 `innerEngraving: true`；`#svgcontent` 帶 `data-inner-engraving="true"` 與 `data-inner-engraving-material`（材料設定的 JSON：`baseHeight`、`depth`、`diameter`、`height`、`refractiveIndex`、`safetyMargin`、`shape`、`width`、`x`、`y`，mm；`helpers/addOn/innerEngravingMaterial.ts`）。讀檔時逐一驗證範圍，無效的 key 保留目前值；留在 2D 的檔案不動材料設定。
- **Swiftray `loadSVG`**：`stlObjects`、`pointCloudObjects`（id → base64），由 `getStlObjects`、`getPointCloudObjects` 產生；回應帶 `failedStlObjects` / `failedPointCloudObjects`。
- **BSPC v1**：`'BSPC'`、version 1、components 3、reserved 2 bytes、uint32 點數，接著每點三個 float32（local x, y, z，mm，little-endian）。
- **投影元素屬性**（`sanitize.js` 的 `rect` / `image` 清單）：`data-stl`、`data-stl-kind`、`data-stl-matrix`（column-major、畫布座標）、`data-stl-transform`、`data-stl-source`；照片 `data-stl-photo`、`data-stl-photo-width`、`data-stl-photo-height`；點雲 `data-stl-point-cloud`（值為 BSPC 版本）。
- **圖層屬性**（圖層 `<g>`，前後端名稱一致；缺少時兩邊用相同預設值）：

  | 屬性 | 值 | 預設 |
  |---|---|---|
  | `data-stl-mode` | `dot` / `line` | `dot` |
  | `data-stl-point-spacing` | mm | 0.03 |
  | `data-stl-layer-spacing` | mm，打線的 Z 間距、加厚輪廓打點的殼距 | 0.04 |
  | `data-stl-min-layer-spacing` | mm，> 0 開啟打線的動態層間距 | 0（關閉） |
  | `data-stl-solid` | `1` / 不存在 | 關閉 |
  | `data-qPulseWidth` | 0 / 1 | UV 1 |
  | `data-focusRev`、`data-focusStepRev`（程式內的 key 是 `focusReverse` / `focusStepReverse`） | 布林 | 關閉 |
  | `data-fillInterleave` | 布林 | 關閉 |
  | `data-fillDwellTime` | µs，負值關閉 | −50000 |
  | `data-fillDwellAdaptive` | 布林 | 關閉 |

- **上傳參數**（`svg-laser-parser.ts` → Swiftray `convert`）：內雕時帶 `refractive_index`、`material_height`、`material_min_z`、`material_max_z`，以及 `is_uv_light=1`、`jump_delay_min` / `jump_delay_max`=1000µs、`laser_on_delay` / `laser_off_delay`=150µs（Swiftray 寫成大寫的 `;CONFIG` 行）。uvDev 下可再帶 `jump_speed`、`marking_delay`、`corner_delay`、`machine_z_bucket`、`first_pulse_killer_enabled`（`ITaskConfig.ts`）。
- **Promark 相機參數**（localStorage `promark-store[serial].cameraParameters`，型別 `PromarkCameraParameters`）：V3 fisheye 參數加上 `rotate180?: boolean`。新校正一定寫入；沒有時視為 `true`。
- **舊檔相容**：投影 rect 上的物件層級參數（`data-stl-mode`、`data-stl-layer-height`、`data-stl-min-layer-height`、`data-stl-point-spacing`）不在白名單，開檔時被移除，後端也不再讀取。

---

## 8. Performance / packaging

- **擠出精度**：曲線依誤差切段，頂點數比 three.js 預設的固定 12 / 24 段多，文字與 Noun Project 圖示最明顯；舊檔的 mesh 不重建。
- **STL 大小**：20MB / 40 萬面警告，50MB / 100 萬面強烈警告，分別看單檔與整個場景。
- **工時**：內雕的時間下限由 Z 軸移動次數決定（一個 `machine_z_bucket` 一次移動，每次約 50ms）。實測 695 秒的工作，Swiftray 預估從 249 秒修正為 691 秒，每個 list 誤差在 3% 以內。
- **打包**：安裝檔帶 Swiftray 1.5.0（`app.cd.mac.yml`、`app.cd.x64.yml`）。1.5.0 要先上傳到 swiftray-daemon S3，CI 才抓得到。Swiftray 版號在 `CMakeLists.txt`、`swiftray.pro`、`src/config.h`。

---

## 9. Rollout — PR plan

| # | Branch | 內容 | Base |
|---|---|---|---|
| PR | `promark-3d-inner-carving` | Promark UV 雷射源：雷射源選項、工作範圍、UV 圖層參數、功率與頻率連動、UV 預設參數、相機校正（含相機方向）、材質測試 UV 參數、`swiftray-control` / `device-master` 的雷射源。內雕模式全部內容，加上 add-on / 互斥模式重構。 | `main` |
| Swiftray | `codex/promark-3d-inner-carving-pr` | 1.5.0：STL / 點雲、內雕圖層參數、填充熱分散、Promark 工時 | `develop` |

---

## 10. Open decisions

1. ~~**focus「反向」開關**：目前所有 Promark 雷射源都顯示，要決定是否只給 UV。~~ **2026-10-14 決定**：屬於 dev 功能，只在 `isDev()` 顯示；Desktop / MOPA / UV 都支援，不另加雷射源判斷。
2. ~~**uvDev 功能的去留**：照片轉點雲、3D 材質測試、填充熱分散、球體 / 圓柱材料目前都用 uvDev 擋著，要決定送審時留在本 PR，還是移到 `uv-dev`。~~ **2026-10-14 決定**：隨本 PR 一起送出，維持由 uvDev 擋著。

**已決定**：
- UV 功率以頻率實現，脈寬 13、Q 1（2026-10-12）；頻率 30–200、預設 40，在進階設定（2026-10-05 / 10-12）。
- 內雕模式隱藏 DPI，送出沿用圖層 DPI（2026-10-05）。
- ultra DPI 只給自己列出的機型（2026-10-05）。
- 發佈開關用 `isDev()`；alpha 開關 `isUvDev()` 只擋調參與開發中工具（2026-10-05 / 10-13）。
- UV Z 軸步進和一般 Promark 相同（2026-10-05）。
- Q pulse 留在圖層，放 Developer Settings（2026-10-13）。
- 內雕參數全部放在圖層，前後端一起改（2026-10-12）；新增 K9 加厚輪廓打點預設（2026-10-13）。
- 相機方向存進校正參數 `rotate180`；解析度不寫死（2026-10-13）。
- 折射只做軸向補償，不設定焦距（2026-10-13）。
- Swiftray 1.5.0（2026-10-13）。
- Replicate 2D 轉 3D 測試結果改用其他方式保存，程式中完全移除（2026-10-13）。

---

## 11. Risks & follow-ups

- **2D 材質測試的固定參數只對 UV 套用**（`generateSvgInfo.ts` 的 FIXME）：表格中非欄、非列的參數，`Detail.default` 不一定是有效的圖層值（Promark 頻率預設為範圍下限，MOPA 是 1kHz；MOPA 脈寬是 350），所以 Desktop / MOPA 不套用，每個色塊維持圖層預設值，UV（2D 與 3D）才套用。要讓所有表格都套用固定參數，得先修正各表格的預設值。
- **翻譯**：所有介面字串都已放進語言檔、`mockT` 已移除。語言檔裡的字串（含內雕預設參數名稱、加厚輪廓、層間距）已補齊 23 個語言，用詞待母語者確認。
- **加厚輪廓只有 3 層殼**：以預設層間距 0.04mm，總厚度 0.08mm，效果要上機確認；沿頂點法向量內縮在凹角或細部可能交錯。
- **AABB 誤判**：重疊與超出檢查用包圍盒，旋轉過的細長物件、L 形或中空物件可能誤判重疊；球體 / 圓柱材料的角落沒有材料但仍在包圍盒內。所以警告允許繼續。
- **安全邊距、材料高度**是暫定值，要等硬體驗證。
- **既有偏好設定不會跟著改**：折射率存在偏好設定，已經存過的電腦保留舊值（1.52），要在內雕設定手動改。
- **升級前校正過的 UV 機**：參數裡沒有 `rotate180`，會被當成倒裝，需要重新校正並取消勾選（目前只有辦公室的測試機）。
- **Swiftray 1.5.0 必須和前端一起發佈**：內雕參數的位置改變，舊後端讀不到圖層參數。
- **2.4.x 開發版會通過版本檢查**：測試機上之前裝過的 Swiftray 2.4.7-dev / 2.4.9 版號大於 1.5.0，`checkVersion` 會放行，但它們讀物件層級參數、不讀圖層參數。測試機要換成 1.5.0。

---

## 12. Test plan

- **單元測試**（`npx jest -c packages/core/jest.config.ts --runInBand`，以及 `apps/app`）：
  - 3D：`app/svgedit/stl/**`、`svgedit/operations/import/importStl/**`、`innerEngravingGate.spec`、`components/beambox/InnerEngraving/**`、`DimensionPanelStl.spec`、`ThreeDOptions.spec`、`beam-file-helper.spec`、`checkInnerEngravingObjects.spec`、`SelectionManager.spec`、`helpers/addOn/*.spec`、`exclusiveModes.spec`
  - UV：`uvPowerFrequency.spec`（表上每一點、內插中點、端點與超出範圍、單調性、30–40kHz 換回 100%）、`PowerBlock` / `AdvancedSettingModal.spec`（UV 連動、一步 undo；Desktop / MOPA 不連動；反向開關只在 dev 顯示）、`layer-config-helper.spec`、`preset-helper.spec`
  - 內雕圖層參數：`getInnerEngravingBlocks.spec`、`EngravingModeBlock.spec`、`layerManager.spec`（`hasStlPhoto`）、`engravingParams.spec`、`OptionsPanel.spec`
  - 材質測試：`TableSetting.spec`（UV 無頻率、功率最小 16、Q 只在 dev、dottingTime 只在 3D）、`generateSvgInfo.spec`
  - 相機：`camera-rotation.spec`、`useCamera.spec`（USB 取圖帶入 `rotate180`）
  - 整體：`cameraPreview.spec`、`Menu.spec`、`SvgEditor.spec`
- **Swiftray**：`tests/test_stl_utils.h`。
- **手動測試**：
  - S1–S10 逐項驗證。
  - 用 Desktop / MOPA Promark 跑一次 §5 的回歸合約：相機預覽（用升級前的校正參數，不重新校正）、材質測試、DPI 選項、路徑預覽、旋轉軸與穿透模式切換。
  - 任一 Wi-Fi 相機機型（Ador 或 BB2）跑一次校正，確認 SolvePnP 與 CheckPnP 不受影響。
- **硬體測試**：
  - UV 70 / 200 校正與預覽方向。
  - 抽幾個功率%，量實際輸出，和 §6.5 的表比對。
  - 內雕方塊與球體各送一次，比對實際焦點深度。
  - 同一個機器 Z 在場中心與邊緣各雕一層點，確認是平坦的平面（§6.9 的前提）。
  - 同一個物件分別用打點、打點＋加厚輪廓、打線送出；照片在打線圖層仍然打點。
  - 開一份參數還在物件上的舊檔，確認改以圖層參數雕刻。
  - 打散掃描順序與每行停留，比較開關前後的熱累積。
