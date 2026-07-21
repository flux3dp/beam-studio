# Beam Studio UI 入口與元件層級地圖

> 這是「WHERE」文件：新功能該住在哪一層、從哪個入口進入。搭配「WHAT」文件 `docs/feature-map.zh-TW.md`（功能清單）一起讀。
> 撰寫 PRD 時，先用本文件判斷入口與層級，避免重複發生「橋接 tabs 功能被競品分析漏掉」的錯誤（該功能其實住在 `components/TabPanel`，由右側面板物件動作列開啟）。
> 檔名／元件名／路徑保留英文。所有元件路徑相對於 repo 根目錄 `/Users/simon/Dev/beam-studio`，皆已驗證存在。資料來源：實際程式碼走查（2026-07-04）。

---

## 1. 層級模型（Hierarchy Levels）

Beam Studio 的編輯畫面是 dockview 面板系統（`app/widgets/dockable/`）。桌面版預設佈局：最左固定工具列（`groupTools`）、中間畫布（`groupCanvas`）、最右可停靠面板群（`groupControls`，內含 Layers/Objects 兩個可浮動分頁）。以下把「使用者要點幾層才到達某功能」抽象成六層。

| 層 | 名稱 | 典型元件 | 適合放什麼（頻率 × 複雜度 × 範圍） |
|---|---|---|---|
| **L1** | 頂部選單／工具列 | `TopBar/`、`Menu.tsx`/`useMenuData.ts`（web）、`node/menu/`（Electron） | 全域、低頻但不可埋沒的動作：檔案 I/O、匯出、文件設定入口、機器操作、帳號、說明。選單容量大、但點擊成本高（要展開），適合「一定要找得到但不用天天按」。 |
| **L2** | 左側工具列／抽屜 | `LeftPanel/DrawingToolButtonGroup.tsx`、Generator/AI/Element 抽屜 | 建立內容的高頻工具（選取、圖形、文字、鋼筆、匯入）＝常駐按鈕；一組相關的產生器或素材庫＝抽屜（drawer）。單一按鈕成本最低，適合最高頻的畫布模式切換。 |
| **L3** | 右側面板分頁 | `RightPanel/`：`LayerPanel`、`ObjectPanel`、`PathEditPanel`（dockview 分頁） | 依「當前選取」而變的內容：圖層管理（Layer 分頁）、選取物件的屬性與動作（Object 分頁）。與選取狀態強耦合的功能放這裡；面板會自動切換分頁（`auto-switch-tab`）。 |
| **L4** | 面板內區塊／Collapse | `ConfigPanel` 各 Block、`OptionsBlocks`、`ActionsPanel` 區段、`AdvancedBlock` Collapse | 屬於某個面板分頁、但需要分組或收合的參數／動作。常用參數平鋪；進階／機型限定參數收進 Collapse。空間有限——擠不下就往 L5 對話框溢出。 |
| **L5** | 對話框／全視窗面板 | `dialog-caller.tsx` 註冊的 modal、`Boxgen`、`ImageEditPanel`、`TabPanel`、`SettingsModal`、`DocumentSettings` | 需要專注、多步驟、大量選項、或獨立畫布的功能。開啟成本高（遮住畫布），但空間最大。複雜產生器、影像編輯、偏好設定都在這層。 |
| **L6** | 快捷鍵／右鍵選單 | `helpers/shortcuts.ts`、`Workarea.tsx` 右鍵選單、`LayerContextMenu.tsx` | 熟手加速路徑，永遠是既有功能的「捷徑」而非唯一入口。新功能不應只放這層。 |

### 選層心法
- **頻率越高、越單純 → 越靠 L1/L2 的常駐按鈕。**
- **與選取物件相關 → L3/L4**（物件面板／動作列／選項區塊）。
- **與整份文件／機器相關 → L1 選單 + L5 對話框**（如 Document Settings、Preferences）。
- **需要獨立畫布或很多欄位 → L5 對話框**。
- **只是既有功能的加速 → 順手補 L6**，但不能是唯一入口。

---

## 2. 入口總表（Entry Tables）

> 入口路徑欄為「使用者視角」；元件路徑為程式碼位置（相對 repo 根）。層級對應第 1 節。
> 開啟對話框的動作，入口在某層、但實體 UI 在 L5——備註會標明。

### 2.1 L1 — 頂部選單（web：`TopBar/Menu.tsx` + `useMenuData.ts`；Electron：`apps/app/src/node/menu-manager.ts` + `node/menu/fileMenu.ts`）

web 與 Electron 共用同一組 8 個頂層選單（File / Edit / View / Machines / Tools / Account / Window / Help）。以下標「[Electron]」者為桌面版限定。

| 功能 | 入口路徑 | 元件檔案路徑 | 層級 | 備註 |
|---|---|---|---|---|
| 清除場景 Clear Scene | 選單 > File > Clear Scene | `TopBar/useMenuData.ts` / `node/menu/fileMenu.ts` | L1 | 快捷鍵 Alt+N（web）/ Cmd+N（Electron） |
| 開啟 Open | File > Open | 同上 | L1 | Cmd/Ctrl+O |
| 最近使用檔案 Recent | File > Recent | `node/menu/fileMenu.ts` | L1 | **[Electron]** 動態清單 + Clear Recent |
| 開啟 My Cloud | File > Show My Cloud | `dialog-caller.showMyCloud` → `dialogs/myCloud/MyCloud.tsx` | L1→L5 | 需登入 |
| 儲存／另存 | File > Save / Save As | useMenuData / fileMenu | L1 | Cmd+S / Shift+Cmd+S |
| 儲存到雲端 | File > Save To Cloud | `dialog-caller.saveToCloud` → `myCloud/SaveFileModal.tsx` | L1→L5 | |
| 範例檔 Samples | File > Samples（各機型範例／材質測試／對焦探針） | useMenuData / fileMenu | L1 | 部分機型（HEXA RF、Promark）**[Electron]** |
| 匯出 Export To | File > Export To（BVG/SVG/PNG/JPG/FLUX Task/UV Print） | useMenuData / menu-manager | L1 | FLUX Task = Cmd+E；UV Print 條件顯示 |
| 偏好設定 Preferences | File > Preferences（macOS 在 App 選單） | `settings/modal/SettingsModal.tsx`（`showSettingsModal()`） | L1→L5 | Cmd+K；見 2.7 |
| 復原／重做 | Edit > Undo / Redo | useMenuData / menu-manager | L1 | Cmd+Z / Shift+Cmd+Z |
| 剪下/複製/貼上/原地貼上/再製 | Edit > Cut/Copy/Paste/Paste in Place/Duplicate | 同上 | L1 | 也在 L6 右鍵選單 |
| 群組／解散 | Edit > Group / Ungroup | 同上 | L1 | Cmd+G / Shift+Cmd+G |
| 位移 Offset | Edit > Path > Offset | `dialogs/OffsetModal`（`showOffsetModal`） | L1→L5 | 亦在 L4 物件動作列 |
| 解散路徑 Decompose | Edit > Path > Decompose Path | `svgCanvas.decomposePath` | L1 | 亦在 L4 |
| 影像編輯動作 | Edit > Photo Edit（銳化/裁剪/反轉/印章/向量化/曲線） | `dialogs/image/*`、`StampMakerPanel`、`ImageEditPanel` | L1→L5 | 亦在 L4 影像動作列 |
| 拆解 Use | Edit > SVG Edit > Disassemble Use | `svgedit/operations/disassembleUse` | L1 | 亦在 L4 |
| 圖層顏色設定 | Edit > Layer Setting > Layer Color Config | `dialog-caller.showLayerColorConfig` → `dialogs/LayerColorConfig` | L1→L5 | |
| 文件設定 Document Setting | Edit > Document Setting | `dialog-caller.showDocumentSettings` → `dialogs/DocumentSettings/index.tsx` | L1→L5 | 亦由 TopBar `DocumentButton` 開啟；見 2.6 |
| 旋轉軸設定 Rotary Setup | Edit > Rotary Setup | `dialogs/DocumentSettings/RotaryBlock.tsx`（rotary settings modal） | L1→L5 | 機型 gated（addOnInfo.rotary） |
| 視圖切換 | View >（縮放/配合視窗/格線/尺標/圖層顏色/自動對齊/反鋸齒） | useMenuData / menu-manager | L1 | checkbox 型，狀態同步 GlobalPreferenceStore |
| 新增機器 | Machines > Add New Machine | 機器設定精靈流程 | L1 | Alt+M |
| 網路檢測 | Machines > Network Testing | `dialog-caller.showNetworkTestingPanel` → `dialogs/NetworkTestingPanel` | L1→L5 | |
| 機器操作（每台裝置子選單） | Machines > [裝置] > Dashboard/Machine Info/校正/韌體更新/下載紀錄 | menu-manager `buildDeviceMenu`（Electron）/ useMenuData（web） | L1 | 校正項目依機型與模組動態顯示；工廠/dev 項目 **[Electron]** |
| 曲面雕刻模式 | Tools > Start Curve Engraving Mode | `LeftPanel/components/CurveEngravingTool.tsx`（進入後左側工具列切換） | L1→L2 | 機型 gated（BB2） |
| 登入／登出、管理帳號 | Account > Sign In/Out / Manage Account | `dialog-caller.showLoginDialog` → `dialogs/FluxIdLogin` | L1→L5 | |
| Design Market | Account > Design Market | 外部連結（dmkt.io） | L1 | 開外部瀏覽器 |
| 面板顯示切換／重設佈局 | Window > Reset Layout / Show Layer‧Object‧Path Panel | `widgets/dockable/utils.ts`（showPanel/loadLayout） | L1 | web 手機隱藏；macOS 加 minimize/close **[Electron]** |
| 關於／教學／更新紀錄 | Help > About / Start Tutorial / UI Intro / Change Logs | `dialog-caller.showAboutBeamStudio`/`showTutorial`/`showChangLog` | L1→L5 | |
| 說明中心／快捷鍵／聯絡我們／論壇 | Help >（各外部連結） | 外部連結 | L1 | **快捷鍵是外部網頁，非 app 內 cheat-sheet** |
| 更新 Beam Studio／切換版本頻道／Bug 回報／Dev Tool | Help >（更新相關） | menu-manager | L1 | **[Electron]** |

### 2.2 L1 — 頂部工具列右側按鈕（`TopBar/TopBar.tsx`）

| 功能 | 入口路徑 | 元件檔案路徑 | 層級 | 備註 |
|---|---|---|---|---|
| 選擇機器 | 頂列 > 機器按鈕 | `TopBar/SelectMachineButton.tsx` | L1 | |
| 文件設定 | 頂列 > 文件按鈕 | `TopBar/DocumentButton.tsx` → `dialogs/DocumentSettings` | L1→L5 | 與 Edit > Document Setting 同一對話框 |
| 自動對焦 | 頂列 > AutoFocus | `TopBar/AutoFocusButton/index.tsx` | L1 | 機型 gated |
| 外框預覽 Frame | 頂列 > Frame | `TopBar/FrameButton.tsx` | L1 | 外框／凸包／區域檢查 |
| 路徑預覽 | 頂列 > Path Preview | `TopBar/PathPreviewButton.tsx` → `PathPreview/` | L1→全視窗 | 進入路徑預覽模式（右側面板隱藏） |
| 送出工作 Go | 頂列 > Go（箭頭） | `TopBar/GoButton.tsx` | L1 | 送工作 → Monitor |
| 分頁列 Tabs | 頂列左側（多分頁） | `TopBar/tabs/Tabs.tsx` | L1 | **[Electron]** 多分頁；web 顯示 `CommonTools` + `WelcomePageButton` |

### 2.3 L2 — 左側工具列（`LeftPanel/components/DrawingToolButtonGroup.tsx`）

| 功能 | 入口路徑 | 元件檔案路徑 | 層級 | 備註 |
|---|---|---|---|---|
| 相機預覽 | 左列 > Preview | DrawingToolButtonGroup.tsx（`handlePreviewClick`） | L2 | 進入預覽後由 `SvgEditor/PreviewFloatingBar.tsx` 提供子工具（精準/廣角/即時/清除/高度） |
| 選取工具 | 左列 > Cursor（V） | DrawingToolButtonGroup.tsx（`FnWrapper.useSelectTool`） | L2 | |
| 匯入影像 | 左列 > Photo（I） | DrawingToolButtonGroup.tsx（`FnWrapper.importImage`） | L2 | JPG/PNG/SVG/DXF/PDF/AI/.beam/.bvg |
| 文字／文字框 | 左列 > Text（T，含 Text Box 子選項） | DrawingToolButtonGroup.tsx + `LeftPanelButtonGroup.tsx` | L2 | 群組按鈕（popover） |
| 元素庫 | 左列 > Elements（E，抽屜） | `dialogs/ElementPanel/ElementPanel.tsx`（drawer `element-panel`） | L2（抽屜） | 內建 + Noun Project |
| 矩形／橢圓／多邊形／直線／鋼筆 | 左列 > Rect(M)/Oval(C)/Polygon/Line(\\)/Pen(P) | DrawingToolButtonGroup.tsx（`setMouseMode`） | L2 | |
| AI 生成 | 左列 > AI Generate（抽屜） | `components/AiGenerate/index.tsx`（drawer `ai-generate`） | L2（抽屜） | 需點數 |
| 產生器抽屜 | 左列 > Generator（抽屜） | `components/Generators/index.tsx` + `generators.config.tsx` | L2（抽屜）→L5 | 內含 5 個產生器，見 2.5 |
| 橋接／Pass Through 模式 | 左列 > Pass Through | `components/pass-through/index.tsx`（`showPassThrough`） | L2→L5 | gated：`hasPassthroughExtension` |
| Beamy AI 對話 | 左列 > Beamy（抽屜） | drawer `ai-chat` | L2（抽屜） | |
| 曲面雕刻子工具 | （進入曲面雕刻模式後）左列 | `LeftPanel/components/CurveEngravingTool.tsx` | L2 | Back/Cursor/Curve Select/Curve Preview/Delete |

### 2.4 L3 / L4 — 右側面板（`RightPanel/`）

右側面板是 dockview 分頁：`panelLayerControls`（Layers）、`panelObjectProperties`（Objects）、`panelPathEdit`（Path，路徑編輯時）。分頁隨選取自動切換（`auto-switch-tab`）。

**L3 分頁層級**

| 功能 | 入口路徑 | 元件檔案路徑 | 層級 | 備註 |
|---|---|---|---|---|
| 圖層清單/新增/刪除/複製/排序/鎖定/顯示 | 右側 > 圖層 | `RightPanel/LayerPanel.tsx` + `LayerPanel/LayerList.tsx` + `AddLayerButton.tsx` | L3 | |
| 圖層參數（功率/速度/次數…） | 右側 > 圖層 > 參數區 | `RightPanel/ConfigPanel/ConfigPanel.tsx` | L3→L4 | 見下方 ConfigPanel 區塊 |
| 物件屬性（選項＋尺寸＋動作） | 右側 > 物件 | `RightPanel/ObjectPanel.tsx` | L3 | 由 OptionsPanel + DimensionPanel + ActionsPanel 組成 |
| 路徑編輯 | 右側 > 路徑（進入路徑編輯時） | `RightPanel/PathEditPanel.tsx` | L3 | |

**L4 — ConfigPanel（圖層參數）內區塊** — 檔案於 `RightPanel/ConfigPanel/`

| 功能 | 入口路徑 | 元件檔案路徑 | 層級 | 備註 |
|---|---|---|---|---|
| 模組切換 | 圖層 > 模組 | `ModuleBlock.tsx` | L4 | 多模組機型（Ador/beamo II） |
| 預設下拉 | 圖層 > 參數下拉 | ConfigPanel.tsx（Select） | L4 | 材質預設 + 自訂 |
| 功率 Power | 圖層 > 強度 | `PowerBlock.tsx` | L4 | 雷射模組；<10% 低功率提示 |
| 速度 Speed | 圖層 > 速度 | `SpeedBlock.tsx` | L4 | 向量速度上限紅色警告 |
| 墨量 Ink（列印/UV） | 圖層 > 墨量 | `InkBlock.tsx` | L4 | 列印/UV 模組 |
| DPI | 圖層 > DPI | `DpiBlock.tsx` | L4 | 雷射模組 |
| 半色調 Halftone | 圖層 > 半色調 | `HalftoneBlock.tsx` | L4 | 列印/UV；**抖動模式（dither）相關即在此** |
| 多趟 Multipass / 重複 Repeat | 圖層 > 次數 | `MultipassBlock.tsx` / `RepeatBlock.tsx` | L4 | |
| 高品質 HighQuality | 圖層 > 高品質 | `HighQualityBlock.tsx` | L4 | 僅 `fhx2rf` |
| 空氣輔助 Air Assist | 圖層 > 空氣輔助 | `AirAssistBlock.tsx` | L4 | gated：addOnInfo.airAssist |
| 填充設定 Fill / 點時間 Dotting | 圖層 > 填充/點時間 | `FillBlock.tsx` / `DottingTimeBlock.tsx` | L4 | Promark |
| 白墨 White Ink 系列 | 圖層 > 白墨 | `WhiteInkCheckbox.tsx` + `WhiteInk*.tsx` | L4 | dev + 列印全彩 |
| UV 列印/光源設定 | 圖層 > UV | `UVConfigs/UVPrintingConfigs.tsx` / `UVLightConfigs.tsx` | L4 | UV 模組 / `fuv1` |
| 最小內縮 Min Padding | 圖層 > 進階 | `MinPadding.tsx` | L4 | dev |

**L4 — AdvancedBlock（進階設定 Collapse）** — `RightPanel/ConfigPanel/AdvancedBlock.tsx`

一個收合式 Collapse，標題「進階設定」（`lang.advanced`）。內容依機型/模組動態組裝：

| 內容項 | 元件 | 條件 |
|---|---|---|
| 脈寬 Pulse Width | `PulseWidthBlock.tsx` | Promark MOPA |
| 頻率 Frequency | `FrequencyBlock.tsx` | Promark |
| 擺動 Wobble | `WobbleBlock.tsx` | Promark |
| 曲面雕刻 Z 高速 | `CurveEngravingZHighSpeed.tsx` | 曲面雕刻 + 支援機型 |
| 對焦 Focus / 自動對焦 AutoFocus | `FocusBlock.tsx` / `AutoFocus.tsx` | addOnInfo.lowerFocus / autoFocus |
| 混合雷射 Diode | `Diode.tsx` | addOnInfo.hybridLaser + enable-diode |
| S 曲線 SCurve | `SCurveBlock.tsx` | dev + (`fhx2rf`/`fbb2`) |
| AM 密度 / 更新間隔/門檻 / 噴頭 | `AmDensityBlock.tsx` / `RefreshIntervalBlock.tsx` / `RefreshThresholdBlock.tsx` / `NozzleBlock.tsx` | PRINTER_4C（部分 dev） |
| 色彩進階設定按鈕 | `ColorAdvancedSetting/ColorAdvancedSettingButton.tsx` | dev + PRINTER_4C |
| 單色 SingleColor | `SingleColorBlock.tsx` | 列印模組 |

> **已知 UX 債見第 4 節：** AdvancedBlock 是長捲動 Collapse。

**L4 — OptionsBlocks（物件選項，依元件型別）** — `RightPanel/OptionsBlocks/`；路由於 `RightPanel/OptionsPanel.tsx`

| 功能 | 入口路徑 | 元件檔案路徑 | 適用元件 | 備註 |
|---|---|---|---|---|
| 字型／字style／字級 | 物件 > 文字選項 | `OptionsBlocks/TextOptions/index.tsx` + `components/FontSizeBlock.tsx` | text | |
| 字距／行距／直書 | 物件 > 文字選項 | `TextOptions/components/LetterSpacingBlock.tsx`／`LineSpacingBlock.tsx`／index.tsx | text | |
| 文字內容 | 物件 > 文字選項 | `TextOptions/components/TextContentBlock.tsx` | 單一 text | 桌面限定 |
| Fit Text 對齊 | 物件 > 文字選項 | `TextOptions/components/FitTextAlignBlock.tsx` | fit-text | |
| 路徑文字（起始位移/垂直對齊/路徑填充） | 物件 > 文字選項 | `TextOptions/components/StartOffsetBlock.tsx`／`VerticalAlignBlock.tsx` | 路徑文字 | |
| **Google Fonts 面板** | 物件 > 文字 > More Google Fonts | `TextOptions/components/GoogleFontsPanel.tsx` | text | L4→L5 對話框（DraggableModal） |
| 變數文字（流水號/時間/CSV + 位移） | 物件 > 變數文字 | `OptionsBlocks/VariableTextBlock.tsx` | use symbol | gated：機型支援 + 非 mobile；設定按鈕開 `showVariableTextSettings` 對話框 |
| 漸層/明暗 Shading | 物件 > 影像選項 | `OptionsBlocks/ImageOptions/GradientBlock.tsx` | image | |
| **深度模式 PWM** | 物件 > 影像選項（Shading 開啟後） | `OptionsBlocks/ImageOptions/PwmBlock.tsx` | image | **非 Promark**；gated：gradient=true |
| 深度雕刻 Depth（層數+Z step） | 物件 > 影像選項（Shading 開啟後） | `OptionsBlocks/ImageOptions/DepthBlock.tsx` | image | **Promark**；gated：gradient=true + 非 mobile |
| 閾值 Threshold | 物件 > 影像選項（非漸層時） | `OptionsBlocks/ImageOptions/ThresholdBlock.tsx` | image | |
| 圓角 Rounded Corner | 物件 > 矩形選項 | `OptionsBlocks/RectOptions.tsx` | rect | |
| 多邊形邊數 Sides | 物件 > 多邊形選項 | `OptionsBlocks/PolygonOptions.tsx` | polygon | |
| 填充 InFill | 物件 > 填充 | `OptionsBlocks/InFillBlock.tsx` | 可填充元件 | |
| 全彩顏色（填色/描邊/描邊寬度） | 物件 > 顏色 | `RightPanel/ColorPanel.tsx` / `OptionsBlocks/MultiColorOptions.tsx` | 全彩模式 | |

**L4 — DimensionPanel（尺寸/座標）** — `RightPanel/DimensionPanel/DimensionPanel.tsx`

| 功能 | 元件 | 備註 |
|---|---|---|
| X/Y/X1/Y1/X2/Y2/CX/CY | `PositionInput` | 依元件型別排列 |
| W/H/RX/RY | `SizeInput` | mm；Fit Text 部分禁用 |
| 鎖定比例 | `RatioLock` | Fit Text 時隱藏 |
| 旋轉 | `Rotation` | |
| 水平/垂直鏡像 | `FlipButtons` | |

**L4 — ActionsPanel（物件動作列）** — `RightPanel/ActionsPanel.tsx`

依選取元件型別（`match(tagName)`）動態渲染 ACTIONS / CONVERSIONS / OPTIMIZATIONS 三區段：

| 功能 | 入口路徑 | 開啟目標 | 層級 | 備註 |
|---|---|---|---|---|
| 位移複製 Offset | 物件 > 動作 > 位移 | `dialogs/OffsetModal`（`showOffsetModal`） | L4→L5 | |
| 陣列 Array | 物件 > 動作 > 陣列 | `dialogs/ArrayModal`（`showArrayModal`） | L4→L5 | |
| **橋接 Tab** | 物件 > 動作 > 橋接 | **`components/TabPanel/index.tsx`（`Dialog.showTabPanel`）** | L4→L5 | **就是被漏掉的功能**：入口在動作列，實體為 L5 對話框（Paper.js）。填色/變數文字時禁用 |
| 合併文字 Weld Text | 物件 > 動作 > 合併文字 | `convertTextToPath({weldingTexts})` | L4 | text；變數文字禁用 |
| 建立路徑文字 | 物件（多選 text+path） > 建立路徑文字 | `textPathEdit.attachTextToPath` | L4 | |
| 智慧排版 Smart Nest | 物件 > 最佳化 > 智慧排版 | `dialogs/SvgNestButtons`（`showSvgNestButtons`） | L4→L5 | |
| 智慧排版 Auto Fit | 物件 > 最佳化 > Auto Fit | `svgedit/operations/autoFit` | L4 | 需相機辨識工件 |
| 轉路徑/轉圖片 | 物件 > 轉換 | `convertToPath`/`convertToImage` | L4 | |
| 編輯路徑/解散路徑/簡化 | 物件（path） > 動作 | `pathActions.toEditMode`/`decomposePath`/`simplifyPath` | L4 | |
| 拆解 Use | 物件（use） > 拆解 | `disassembleUse` | L4 | |
| 取代影像 | 物件（image） > 取代 | `svgEditor.replaceBitmap` | L4 | |
| 裁剪 Crop | 物件（image） > 裁剪 | `dialogs/image/CropPanel`（`showCropPanel`） | L4→L5 | |
| 銳化/曲線(明暗)/反轉/外框(potrace)/描圖 | 物件（image） > 動作 | `dialogs/image/*`、`imageEdit.*` | L4(→L5) | |
| **圖像編輯視窗** | 物件（image） > 圖像編輯 | `components/ImageEditPanel/`（`showImageEditPanel`） | L4→L5 | 橡皮擦/魔術棒/圓角（Konva） |
| **印章 Stamp** | 物件（image） > 印章 | `components/StampMakerPanel/`（`showStampMakerPanel`） | L4→L5 | |
| AI 去背 | 物件（image） > AI 去背 | `imageEdit.removeBackground` | L4 | 需點數 |
| 旋轉軸變形 Rotary Warped | 物件（image） > 梯形 | `dialogs/image`（`showRotaryWarped`） | L4→L5 | |

### 2.5 L5 — 對話框與獨立面板（`dialog-caller.tsx` 註冊；產生器抽屜內項目）

| 功能 | 入口路徑 | 元件檔案路徑 | 備註 |
|---|---|---|---|
| Boxgen 盒子產生器 | 左列 > Generator > Box | `components/boxgen/Boxgen.tsx` | 指接/T 槽/平接 |
| Code Generator（QR/條碼） | 左列 > Generator > Code | `dialogs/CodeGenerator/index.tsx`（`QRCodeGenerator.tsx`／`BarcodeGenerator.tsx`） | 內含 QR + Barcode 分頁 |
| 鑰匙圈 Keychain | 左列 > Generator > Keychain | `dialogs/KeyChainGenerator/KeyChainGenerator.tsx` | |
| 拼圖 Puzzle | 左列 > Generator > Puzzle | `dialogs/PuzzleGenerator/index.tsx` | |
| 材質測試產生器 | 左列 > Generator > Material Test | `dialogs/MaterialTestGeneratorPanel/index.tsx` | 手機隱藏 |
| 影像描圖 Trace | 選單/動作 | `dialogs/ImageTracePanel/ImageTracePanel.tsx` | |
| My Cloud | File > Show My Cloud | `dialogs/myCloud/MyCloud.tsx` | 需登入；免費 5 檔 |
| FLUX ID 登入 / 點數 / FLUX+ 警告 | Account / 觸發時 | `dialogs/FluxIdLogin`／`FluxCredit`／`FluxPlusWarning` | |
| 裝置選擇器 / 連線測試 / 網路檢測 | 送工作 / Machines | `dialogs/DeviceSelector`／`promark/ConnectionTest`／`NetworkTestingPanel` | |
| 卡匣設定 / 圖層顏色設定 / 預覽高度 | 觸發時 | `dialogs/CartridgeSettingPanel`／`LayerColorConfig`／`PreviewHeight` | |
| 公告 / 評分 / 社群 / 關於 / 更新紀錄 / 媒體教學 | Help / 自動彈出 | `dialogs/AnnouncementPanel`／`RatingPanel`／`SocialMediaModal`／`AboutBeamStudio`／`ChangeLog`／`MediaTutorial` | |

### 2.6 L5 — Document Settings 對話框（`dialogs/DocumentSettings/index.tsx`）

440px modal，區塊依機型/模組條件顯示：

| 區塊 | 控制項 | 元件 | 條件 |
|---|---|---|---|
| 主設定 | 機型選擇、工作範圍（可自訂尺寸）、雷射源、雕刻 DPI、自動內縮 Auto Shrink | index.tsx | 雷射源限 Promark/`fhx2rf`；Auto Shrink 非 Promark |
| 工作原點 Job Origin | Start From、9 宮格原點 | `JobOriginBlock.tsx` | addOnInfo.jobOrigin |
| 附加模組 | 開始鍵/送出前外框/門蓋保護、自動對焦、混合雷射 | index.tsx | Promark / addOnInfo.autoFocus / hybridLaser |
| 多模組 | 4 色列印（+設定）、1064 IR 雷射 | `ModuleSettings4C.tsx` | 互斥；supportedModules |
| 旋轉軸 Rotary | 模式、Roller/Chuck、Borderless with Rotary | `RotaryBlock.tsx` | addOnInfo.rotary |
| 開蓋 Borderless / 橋接 Pass-Through | Borderless、Auto Feeder/Manual、高度設定 | `PassthroughSettings.tsx` | addOnInfo.openBottom |

> 互斥關係：Rotary ↔ Pass-Through/Auto-Feeder ↔ Borderless 三者互斥；4C ↔ 1064 互斥；曲面雕刻進行中會停用上述。

### 2.7 L5 — Preferences / Settings 對話框（`settings/modal/SettingsModal.tsx`，`showSettingsModal()`）

**注意：是 modal 對話框（桌面 860px 側欄導覽），不是全視窗頁面。** 分類於 `settings/categories/`：

| 分類 | 元件 | 主要控制項 | 條件 |
|---|---|---|---|
| General | `General.tsx` | 語言、自動檢查更新、橫幅、通知、關於 | 部分桌面限定 |
| Connection | `Connection/index.tsx` | Guess Poke、自動連線、IP 清單 | |
| AutoSave | `AutoSave.tsx` | 啟用、目錄、間隔、檔案數 | **桌面限定** |
| Camera | `Camera.tsx` | 預覽移動速度、自訂預覽高度、保留預覽 | |
| Editor > Workarea | `Editor/Workarea.tsx` | 單位、預設機型、參考線、自動切換分頁、連續繪圖、UV 檔、列印進階模式、真實邊界… | 部分 dev |
| Editor > Text | `Editor/Text.tsx` | 預設字型/樣式、字型替換、字型轉換版本 | |
| Editor > Performance | `Editor/Performance.tsx` | 影像降採樣、反鋸齒、簡化路徑、路徑引擎（Swiftray）、向量排序 | Swiftray gated |
| Engraving | `Engraving.tsx` | 雕刻解析度、快速漸層、雕刻方向、分段雕刻、Padding 加速 | 部分 dev |
| Path | `Path.tsx` | 向量速度上限、迴圈補償 | |
| Module | `Module/`（Ador/Beamo/Beamo2） | 各模組預設、雷射偏移、低功率、Union Boundary… | 機型 gated |
| Privacy | `Privacy.tsx` | Sentry 診斷資料 | |
| Experimental | `Experimental.tsx` | 多趟補償、單向列印 | **dev 限定** |
| Reset | `Reset.tsx` | 立即重置 | 手機限定 |

### 2.8 L6 — 右鍵選單與快捷鍵

| 功能 | 入口 | 元件檔案路徑 | 備註 |
|---|---|---|---|
| 畫布右鍵選單 | 畫布右鍵 | `SvgEditor/Workarea.tsx`（Antd Dropdown, trigger=contextMenu） | 剪下/複製/貼上/原地貼上/再製/刪除/群組/解散/移到最前後/移到圖層 |
| 圖層右鍵選單 | 圖層右鍵 | `RightPanel/LayerPanel/LayerContextMenu.tsx` | 重新命名/複製/鎖定/刪除/向下合併/全部合併/選取合併/切換全彩/拆分全彩 |
| 快捷鍵註冊 | 全域 | `helpers/shortcuts.ts` + `stores/canvas/utils/registerCanvasShortcuts.ts` + `actions/beambox/svg-editor.ts` + `actions/global.ts` | 工具切換（v/m/c/p/\\/i/e）、方向鍵移動、l/o 切換面板、空白鍵平移 |
| 快捷鍵對照 | Help > Keyboard Shortcuts | 外部網頁 | **app 內無 cheat-sheet 對話框** |

---

## 3. PRD 入口決策指引（Checklist）

替新功能選入口時，依序自問：

1. **有沒有同性質的既有兄弟功能？** → 放到同一層同一群組，沿用其模式。
   - *例：新的「路徑最佳化」動作 → 放 ActionsPanel 的 OPTIMIZATIONS 區段（L4），與 Smart Nest／Auto Fit 為伍，而非新開對話框。*
2. **它與「當前選取的物件」相關嗎？**
   - 是，且是即時參數 → L4 OptionsBlocks / DimensionPanel（物件面板）。
   - 是，但是多步驟或需要獨立畫布 → L4 動作列按鈕 **開 L5 對話框**（如橋接 Tab、影像編輯）。
3. **它與整份文件或機器設定相關？** → L1 選單項 + L5 對話框（如 Document Settings、Preferences）。不要塞進物件面板。
4. **使用頻率如何？**
   - 極高頻的畫布模式 → L2 左側常駐按鈕。
   - 一組相關但非天天用的產生工具 → L2 抽屜（Generator drawer 模式）。
   - 低頻但必須找得到 → L1 選單。
5. **是否機型／模組／dev 限定？** → 用既有 gating（`addOnInfo`、`isPromark`、`isDev()`、`supportedModules`）條件渲染；優先塞進已有的條件式區塊（如 AdvancedBlock），避免在常駐位置佔位。
6. **需要多少畫面空間？** 欄位多／需預覽 → L5 對話框；1–3 個控制項 → L4 區塊；單一開關 → L4 選項或 L6 捷徑。

**已落地的決策範例（可直接引用）：**
- **橋接 Tabs**：與選取物件相關（步驟 2）＋需要獨立幾何運算畫布（Paper.js）→ 入口放 L4 ActionsPanel 動作按鈕，實體為 L5 `TabPanel` 對話框。撰寫 PRD／競品分析時，這類「入口在動作列、實體是對話框」的功能最容易被漏。
- **深度模式 PWM**：影像即時屬性（步驟 2）＋單一開關 → L4 `OptionsBlocks/ImageOptions/PwmBlock`，且 gated 在 Shading 開啟後才出現（步驟 5）。
- **材質測試產生器**：一組產生工具、非高頻（步驟 4）→ L2 Generator 抽屜項目，開 L5 `MaterialTestGeneratorPanel`；手機隱藏。

---

## 4. 已知的入口層 UX 債

1. **AdvancedBlock 長捲動 Collapse**（`RightPanel/ConfigPanel/AdvancedBlock.tsx`）
   - 「進階設定」是單一 Collapse，內容依機型/模組把 10+ 個 Block 平鋪堆疊（Focus/Diode/Wobble/Frequency/PulseWidth/SCurve/AmDensity/RefreshInterval/Nozzle/SingleColor…）。多模組機型展開後很長，需大幅捲動、缺乏分組。
   - 討論方向：改用 LightBurn 式 popup／分頁重構（見照片雕刻相關 PRD 討論、`docs/dithering-practical-notes.zh-TW.md`）。
2. **物件動作列的隱藏對話框入口**（`RightPanel/ActionsPanel.tsx`）
   - 多個看似「面板內動作」的按鈕其實開 L5 對話框（橋接 Tab、Offset、Array、Crop、影像編輯、印章、Smart Nest、Rotary Warped）。從 UI 表面難以判斷哪些是即時、哪些會彈窗——這正是橋接被競品分析漏掉的結構性原因。做功能盤點時務必展開每個元件型別的動作集。
3. **相機預覽子工具分散**
   - 左側只有單一 Preview 按鈕；精準/廣角/即時/清除/調整高度等子工具進入預覽模式後才出現在 `SvgEditor/PreviewFloatingBar.tsx`（畫布浮動列），與左側工具列脫節，新人不易發現。
4. **設定入口雙生但實體同一**
   - Document Settings 有兩個入口（Edit 選單 + TopBar `DocumentButton`）指向同一對話框；Preferences 是 modal 而非頁面。PRD 描述入口時需標明「同一實體、多入口」，避免誤估為兩個功能。
5. **快捷鍵無 app 內對照表**
   - Help > Keyboard Shortcuts 連到外部網頁，app 內沒有 cheat-sheet 對話框；快捷鍵僅散見於選單標示與 tooltip。

---

## 附註：桌面 vs Web vs 手機層級差異

- **桌面（Electron）**：dockview 佈局，右側 Layers/Objects 為可停靠可浮動分頁；原生選單、多分頁、最近檔案、Swiftray 引擎。
- **Web（PWA）**：頂部 React 選單（`Menu.tsx`）；平板/手機改用 `DrawerMenu`。無多分頁/原生選單/Swiftray。
- **手機**：右側面板改為 `FloatingPanel` + 底部 `mobile/CanvasTabBar.tsx` 分頁（圖層/物件/相機/繪圖/文件/設定），一次只顯示一個面板；動作以 `ObjectPanelItem` 精簡圖示呈現；另有 `mobile/CanvasActionBar.tsx` 提供刪除。L3/L4 在手機上塌縮為 modal-first 的浮動面板。
