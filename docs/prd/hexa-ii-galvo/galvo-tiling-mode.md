# PRD: HEXA G 振鏡圖層分塊方式（自動／固定格點／依物件）

| | |
|---|---|
| **Status** | 「依物件」已實作，未上機（2026-11-03）：swiftray `3ce9f62`、`0c4964f`，beam-studio 見 §10。swiftray 本機無法 link，只做過編譯檢查，fcode 比對（§13）尚未跑。「置中格點」只記錄（§7.6），未排程。**2026-11-20 新增「自動」（§7.7，設為預設）與路徑拼接警告（§7.8），兩端都尚未實作** |
| **Author** | EstherFu |
| **Created** | 2026-11-02 |
| **Target product** | Beam Studio（desktop + web），機型 `fhx2galvo`（HEXA G）；swiftray daemon |
| **Owner area** | 圖層參數（`components/beambox/RightPanel/ConfigPanel/`、`helpers/layer/layer-config-helper.ts`）、匯出（`actions/beambox/export-funcs-swiftray.ts`）；swiftray SVG 解析（`src/parser/`）與 fcode 匯出（`src/toolpath_exporter/toolpath-exporter-fcode.cpp`） |
| **Related code** | 圖層屬性：`packages/core/src/web/helpers/layer/layer-config-helper.ts`、`packages/core/public/js/lib/svgeditor/sanitize.js`、`packages/core/src/web/interfaces/ILayerConfig.d.ts`；UI：`packages/core/src/web/app/components/beambox/RightPanel/ConfigPanel/GalvoTilingBlock.tsx`（放在 `ConfigPanel.tsx` 的解析度下方）；轉檔入口：`packages/core/src/web/app/actions/beambox/export-funcs-swiftray.ts`（`fetchTaskCodeSwiftray`）、`export-funcs.ts`（`getConvertEngine`）；場鏡尺寸：`packages/core/src/web/helpers/device/galvoConfig.ts` |
| **External repos** | `swiftray`（branch `dev/hx2-galvo-blend`）：`src/parser/my_qsvg_handler_qt6.cpp`（`createGNode`、node→Shape 迴圈）、`src/parser/mysvg/mysvg-functions.h`（`processMySVGNode`、`processUse`）、`src/parser/mysvg/mysvg-types.h`、`src/shape/shape.h`、`src/layer.{h,cpp}`、`src/toolpath_exporter/toolpath-exporter-fcode.{h,cpp}`；相關未實作規格 `docs/galvo-content-blocks.md`（自動 content mode，本 PRD 取代其中「item＝polygon」的定義） |
| **Companion PRD** | `docs/prd/hexa-ii-galvo/hexa-g-galvo-calibration.md`（§7.11 backlash 旗標、tile 順序）、`docs/prd/hexa-ii-galvo/galvo-seam-kpass-walk.md`（拼接策略；線段在 KW 下硬切） |

---

## 1. Summary

批量生產時畫布上會一次排很多互相獨立的小物件，排列間距跟 tile（block displacement）沒有關係，tile 格線常常切過物件中間，物件被拆到兩個停靠點再靠接縫混合拼回來——又慢又有錯位風險。

這份 PRD 給振鏡圖層一個「分塊方式」參數：「固定格點」是原本的行為；「依物件」讓圖層裡每個第一層物件都整個在一個停靠點內打完，不切割、不做接縫混合。互相靠近、合起來仍放得進一個場鏡的物件併成同一個停靠點。前端在任何轉檔前檢查每個物件都放得進一個場鏡；後端萬一遇到放不進的，整個轉檔失敗。

**自動（2026-11-20 新增，預設）**：優先用「依物件」的方式處理；單一物件放不進場鏡工作範圍時，只有那個物件改用格點拼接。使用者不必先知道物件大小再選方式，也不會因為一個大物件讓整個轉檔失敗。需要拼接的物件裡若有路徑（向量線段），前端額外跳一次警告：路徑目前只有硬切，對位要求高，接縫比點陣圖更容易看出瑕疵。

另記錄一個低優先的第三種方式「置中格點」：tile 大小不變，但格線以物件中心為準擺放，讓同一個物件不論放在哪裡都被切在同樣的位置（§7.6，未排程）。

## 2. Background & current state

- **tile 分割**：`ToolpathExporterFcode::planGalvoBlocks()`（swiftray `toolpath-exporter-fcode.cpp`）把整個圖層的內容外框切成格點對齊的 tile；`emitGalvoBlocks()` 每個 tile 重跑整個圖層的幾何，靠 `GalvoListWriter` 的 clip rect 決定哪些落在這個 tile。整張圖放得進一個場鏡時走單一停靠點，停靠點不必對齊格點（同函式的單一 block 分支）。
- **backlash 順序**（2026-11-02，swiftray `8b4034a`）：格點模式每列一律由左到右，列首先停到整批最左欄再左一欄。`galvo_fix_backlash` 控制，beam-studio 由 `galvoCalibration/backlash.ts` 的 `getFixBacklash()` 送出（`helpers/api/svg-laser-parser.ts`）。
- **同 tile 多圖合併**（swiftray `d983ba7`）：`LaserRasterGalvoFactory::mergedEntries()` 把同一 block 內同類（dots／runs）的圖合成一張再掃。
- **swiftray 載入 SVG 會攤平 group**：`processMySVGNode()`（`mysvg-functions.h`）只為葉節點（path／image／text／use）產生 `MySVG::Node`；`my_qsvg_handler_qt6.cpp` 的 node→Shape 迴圈把每個葉節點變成一個 Shape 直接 `addShape` 到圖層。group 結構不存在於匯出端。
  - 圖層 `<g class="layer">` 在 `createGNode()` 以節點位址為 key 記進 `layer_config_map_`；`getBVGLayerName()`（`mysvg-helper.h`）就是往上找父節點比對這張表來決定所屬圖層。
  - `<use>`：`processUse()` 複製 symbol 內的節點時，`node_names` 來自 symbol 子樹，`<use>` 本身的 id 不會留下；同一 symbol 用兩次，兩份 Shape 無從區分。
  - 有填色的 path 會被放到 `<圖層名>-filled` 這個第二圖層；匯出時 `convertStack()` 把兩者一起交給 `convertLayer()`（`current_layer_2_`）。
- **圖層重複**：`convertLayer()` 的 `for (int r = 0; r < layer_repeat_; r++)` 每一遍呼叫一次 `convertGalvoLaserLayer()`，也就是所有 tile 做完一遍才重來（§11 決策 4 要的就是這個行為）。
- **轉檔失敗回報**：swiftray `Worker::handleAction()`（`src/server/worker.cpp`）攔下 action 內丟出的例外，回 `{success: false, error: {message}}`，daemon 不會掛。
- **前端轉檔入口**：HEXA G 一律走 swiftray（`getConvertEngine`，`export-funcs.ts`），送出、匯出 fcode、預估時間、路徑預覽、Monitor 全部經過 `fetchTaskCodeSwiftray()`。
- **振鏡進階參數 UI**：`AdvancedSettingModal.tsx` 已有 `biDirectional`、`crossHatch` 兩個布林 Switch；ConfigPanel 以 `hasGalvoParams = isPromark || isGalvo` 決定是否顯示進階按鈕。

## 3. Goals & non-goals

**Goals**
- 振鏡圖層可選分塊方式「依物件」，以圖層第一層物件為單位整個在一個停靠點完成。
- 物件之間依位置併成停靠點，順序與文件順序無關。
- 停靠順序避免 X、Y 兩軸的 backlash。
- 前端在所有轉檔入口檢查物件大小；後端遇到超過時失敗而不是默默切割。
- 「自動」：同一圖層內，放得進場鏡的物件依物件停靠，放不進的物件走格點拼接；設為新圖層與舊檔的預設。
- 需要拼接的內容含路徑時，前端在轉檔前警告。

**Non-goals**
- 單一 bitmap 內部的連通區塊分析（四角裝飾畫在同一張圖裡仍是一個物件）。
- ~~同一圖層內混用（大物件走 tile、小物件獨立停靠）~~ → 2026-11-20 改為 Goal，即「自動」（§7.7）。
- 場鏡邊緣的校正殘差與品質考量（§11 決策 5）。
- 停靠點順序的旅行距離最佳化。
- Promark：不顯示、不讀這個參數。
- 「置中格點」的實作（§7.6 只記錄需求與待決定事項）。

## 4. Scenarios

1. **陣列排版**：一塊板上 6×8 個 30 mm 的吊牌，間距 35 mm，場鏡 110 mm。改用「依物件」後，每個停靠點吃下 3×3 左右的吊牌，沒有任何吊牌被切開。
2. **匯入圖檔複製多份**：同一個匯入 SVG（`<use>`）複製 20 份散在板上，每一份都被當成獨立物件。
3. **群組物件**：一個由多段 path 組成的 logo 群組成一個 group，整個 logo 在同一個停靠點完成，內部沒有定位錯位。
4. **物件太大**：圖層裡有一個 120 mm 的物件，送出、預估時間、路徑預覽都被前端擋下並說明是哪些物件。
5. **重複 2 次**：所有停靠點做完一遍後，從第一個停靠點重新做第二遍。
6. **自動，大小混排**：一個圖層裡有 30 個 30 mm 吊牌和一張 300 mm 的漸層照片。吊牌依物件併成停靠點、不被切開；照片用格點拼接（接縫依拼接策略）。使用者什麼都不用選。
7. **自動，大型向量圖**：圖層裡有一個 200 mm 的向量 logo。轉檔前跳出警告說明路徑拼接只有硬切，使用者可以繼續，或回去把它縮小／拆成放得進場鏡的物件。

## 5. Acceptance criteria

**A1 圖層參數**
- 操作：HEXA G 文件、選一個振鏡模組（`fhx2galvo` 的 galvo CO2／MOPA）圖層 → 圖層參數面板「解析度」下方的「分塊方式」選「依物件」。
- 結果：選項寫進圖層 `data-galvoTiling="object"`（選「固定格點」寫 `grid`）；存檔、關閉、重開檔案後仍保留；undo／redo 可還原；沒有這個屬性的舊檔顯示「固定格點」。
- 邊界：Promark 文件、HEXA G 的非振鏡圖層看不到這個選項；多選圖層值不同時顯示混合狀態，存檔時只寫有改動的圖層。

**A2 前端大小檢查**
- 操作：「依物件」圖層中放一個寬或高超過場鏡尺寸的物件（例如 110 mm 場鏡放 111 mm 的矩形），分別按送出、匯出 fcode、預估時間、路徑預覽。
- 結果：四個入口都在轉檔前跳出提示，列出超過的物件數與場鏡尺寸，可「選取這些物件」（`multiSelect`，全部選中）；不送出任何東西給 swiftray。
- 邊界：剛好 110.000 mm 的物件通過（容許 0.001 mm）；旋轉 45° 的 80 mm 正方形以軸向外框 113 mm 判斷，會被擋下；隱藏圖層、「固定格點」圖層不檢查；群組、`<use>`、文字、圖片都以第一層元素整體的外框判斷。

**A3 物件整個在一個停靠點完成**
- 操作：情境 1、2、3 各匯出一份 fcode，開路徑預覽，並以 `galvo_debug_image` 輸出停靠圖。
- 結果：每個第一層物件的所有幾何都在同一個停靠點的 list 內；沒有任何物件被切開；fcode 中沒有接縫混合（不存在 band dots、沒有 run 被 ownership 切段）。
- 邊界：兩個物件外框互相重疊（例如交錯排列的 L 形）時，兩者都完整打出、沒有重複打；同一物件的填色（`-filled` 圖層）與描邊在同一停靠點。

**A4 停靠點合併**
- 操作：情境 1。
- 結果：停靠點數遠少於物件數；每個停靠點內所有物件的聯集外框 ≤ 場鏡尺寸 + 0.001 mm，且在停靠點的振鏡可及範圍內。
- 邊界：物件靠近行程邊界、停靠點被夾在行程內時，物件仍完整落在可及範圍內，否則該物件自成一個停靠點；仍放不進則轉檔失敗（A6）。

**A5 停靠順序與 backlash**
- 操作：情境 1 的 fcode，列出所有 gantry 移動。
- 結果：停靠點依 Y 由小到大、Y 相同再依 X 由小到大；任何一次 Y 都不往負方向移動（同一批次內）；每次下一個停靠點的 X 比目前小時，先走到「整批最左停靠點 X − `kGalvoBacklashOvershootMm`（5 mm）」，且離行程左界至少 `kGalvoBacklashTravelClearanceMm`（1 mm），再往右走到停靠點。
- 邊界：整批第一個停靠點一律先走安全起點；`galvo_fix_backlash` 關閉時不加安全起點，但仍依 Y、X 排序。

**A6 後端防線**
- 操作：繞過前端（例如以舊版前端或手動送 SVG）送一個含 120 mm 物件的「依物件」圖層。
- 結果：swiftray 轉檔失敗，回 `success: false` 與訊息（含圖層名稱與物件大小）；不產出 fcode；daemon 繼續可用。

**A7 重複**
- 操作：情境 5。
- 結果：所有停靠點做完一遍後才開始第二遍，第二遍從第一個停靠點的安全起點開始。

**A8 自動是預設**
- 操作：HEXA G 新文件新增振鏡圖層；另開一個沒有 `data-galvoTiling` 的舊檔。
- 結果：兩者的「分塊方式」都顯示「自動」；選單有「自動」「固定格點」「依物件」三項；選「自動」寫入 `data-galvoTiling="auto"`。
- 邊界：舊檔明確存了 `grid` 或 `object` 的圖層維持原值；Promark、非振鏡圖層仍看不到這個選項。

**A9 自動：放得進的物件依物件處理**
- 操作：情境 1（全部物件都小於場鏡），分塊方式「自動」，匯出 fcode。
- 結果：fcode 與同一份文件選「依物件」時逐位元組相同。
- 邊界：圖層只有一個物件且放得進場鏡＝一個停靠點。

**A10 自動：放不進的物件走拼接**
- 操作：情境 6，匯出 fcode 並輸出 debug 圖。
- 結果：吊牌全部在依物件的停靠點內完成、沒有被切開；照片被切成格點 tile，接縫依目前的拼接策略；照片單獨放在一個「固定格點」圖層時，那幾個 tile 的 list 內容與這裡相同。前端不擋、swiftray 不回失敗。
- 邊界：全部物件都放不進＝與「固定格點」逐位元組相同；小物件落在大物件外框內時兩者各自完整打出、不重複；剛好等於場鏡（+0.001 mm 內）算放得進；物件放得進場鏡、但因為靠近行程邊界找不到可及的停靠點時，也歸到拼接那一批（不失敗）。

**A11 路徑拼接警告**
- 操作：情境 7，分別按送出、匯出 fcode、預估時間、路徑預覽。
- 結果：送出與匯出 fcode 前跳出警告，說明有幾個含路徑的物件需要拼接、路徑拼接只有硬切；可「繼續」「取消」「選取這些物件」，並可勾選不再顯示。選繼續後照常轉檔。預估時間與路徑預覽不跳警告。
- 邊界：需要拼接的物件只有漸層點陣圖＝不警告；物件是群組、裡面同時有圖片和路徑＝警告；隱藏圖層、repeat 為 0 的圖層不檢查；勾過不再顯示後不再跳；「依物件」圖層維持 A2 的擋下行為，不走這個警告。

## 6. Must not change

**beam-studio**
- `helpers/layer/layer-config-helper.ts`（新增 key）
  - 所有讀寫圖層參數的地方（`getData`／`writeDataLayer`／`initState`）— 既有 key 的預設值與讀寫不變；新 key 不進 `presetRelatedConfigs`，套用預設參數不會改到它。
  - 「自動」新增後：`galvoTiling` 的預設由 `GalvoTiling.Grid` 改為 `GalvoTiling.Auto`（`layer-config-helper.ts:166`）。**刻意的行為改變**：沒有這個屬性的舊檔顯示並採用「自動」。
- `public/js/lib/svgeditor/sanitize.js`（`g` 白名單加一項）
  - `sanitizeSvg` 開檔 — 其他屬性的保留／移除不變。
- `app/svgedit/text/paramsLabel.ts`（`hiddenKeys` 加 `galvoTiling`）
  - 參數標籤的可選欄位與既有標籤內容 — 不變；`galvoTiling` 不是雕刻參數，不提供顯示。
- `ConfigPanel/ConfigPanel.tsx`（解析度下方加 `GalvoTilingBlock`）
  - 非 HEXA G、非振鏡模組圖層、Promark — 面板內容與順序不變（分塊方式不顯示）。
  - 多圖層 modal（`UIType === 'modal'`）— 分塊方式只改 store，存檔時由 modal 統一寫入，與其他欄位相同。
  - HEXA G 振鏡圖層 — 既有 `biDirectional`、`crossHatch`、`fillAngle`、wobble、focus 的存檔與 undo 不變。
- `actions/beambox/export-funcs-swiftray.ts`（`fetchTaskCodeSwiftray` 開頭加檢查）
  - `export-funcs.ts` 的 `estimateTime`、`exportFcode`、gcode 系列、`MonitorContext` — 非 HEXA G、或沒有「依物件」圖層時流程與結果完全不變；檢查失敗時在任何畫布暫時修改（文字轉路徑等）之前返回，不留下殘留。
  - 「自動」新增後：非 HEXA G 流程不變；HEXA G 的「自動」圖層多一個可能的警告（§7.8），使用者取消時同樣在任何畫布暫時修改之前返回；「依物件」圖層的擋下行為（A2）不變。

**swiftray**
- `src/parser/mysvg/mysvg-functions.h`（`processMySVGNode`、`processUse` 多記 `item_key`）
  - GUI 開檔、daemon `parse` — 產生的 Shape、圖層歸屬、transform 不變。
- `src/parser/my_qsvg_handler_qt6.cpp`（`createGNode` 讀新屬性；node→Shape 帶 `item_key`）
  - 所有圖層參數解析 — 不變。
- `src/shape/shape.h` / `shape.cpp` / `group-shape.cpp`（新欄位，`clone()` 複製；`GroupShape::clone()` 手動帶上）
  - 所有 Shape 子類、文件序列化（`document-serializer.h`）— 不序列化新欄位，`.swiftray` 檔格式不變。
- `src/layer.{h,cpp}`（新參數）
  - `setParameters` 的其他欄位 — 不變。
  - 「自動」新增後：`galvo_tiling` 缺少或不認得時由 `Grid` 改為 `Auto`（`layer.cpp:384`）。**這是刻意的行為改變**：舊檔與舊版前端送來的振鏡圖層會從固定格點變成自動，發 PR 時要列出。
- `src/toolpath_exporter/toolpath-exporter-fcode.{h,cpp}`
  - 非振鏡圖層、Promark、「固定格點」的振鏡圖層 — 產出的 fcode 逐位元組相同（以同一份 SVG 前後比對）。
  - `planGalvoBlocks()`、`emitGalvoBlocks()` 的格點模式 — 不變。
  - 「自動」新增後：明確標成 `grid`／`object` 的圖層，fcode 與新增前逐位元組相同。
  - `preprocessLaserLayer()` 振鏡分支改呼叫 `createGalvoFactories()`，建立順序與參數和原本逐行相同；`convertGalvoDepthBitmaps()` 加了預設參數，預設值下行為不變。

## 7. Design

### 7.1 圖層參數（前端）

- ConfigKey `galvoTiling: 'grid' | 'object'`（`as const` 物件定義值），屬性 `data-galvoTiling`，預設 `'grid'`（§7.7 之後加上 `'auto'` 並改為預設）；加進 `ILayerConfig.d.ts`、`layer-config-helper.ts` 的屬性對照與預設、`sanitize.js` 的 `g` 白名單。
- UI：圖層參數面板的「解析度」下方新增「分塊方式」（Tiling，`GalvoTilingBlock`），`Select`，選項「固定格點」（Grid）／「依物件」（By Object），只在 `workarea === 'fhx2galvo'` 且目前圖層是振鏡模組時顯示；多圖層值不同時顯示「-」。原本放在進階設定 modal，2026-11-03 依使用者要求移出。
- 說明文字（依物件）：「每個物件完整在一個場鏡範圍內雕刻，不會被 tile 切開，適合批量生產多個獨立物件。每個物件都必須小於場鏡尺寸。」
- i18n：`beambox.right_panel.laser_panel.galvo_tiling`（`title`、`grid`、`object`、`object_hint`），en／zh-tw 先寫，其他語言發 PR 前補齊。

### 7.2 前端大小檢查

新 helper `helpers/device/galvoTiling.ts`：

```ts
checkObjectTilingItems(): Promise<{ field: number; items: SVGGraphicsElement[] }>
```

- 對 `fhx2galvo` 的每個可見、repeat > 0、`galvoTiling === 'object'` 的圖層，取第一層子元素（排除 `title`、`defs`、`filter`）。
- 外框：含自身 transform 的軸向外框（與畫布選取框同一套計算），px → mm（`dpmm`）。
- 場鏡：該圖層模組的 `getGalvoConfig(module).workarea`。
- 寬或高 > 場鏡 + `GALVO_FIELD_TOLERANCE_MM`（0.001）即列入。
- 在 `fetchTaskCodeSwiftray()` 開頭（`removeUnusedDefs` 之前）呼叫；有物件不合格就跳 alert、提供選取，回 `{}`。所有轉檔入口因此都被覆蓋。

### 7.3 物件身分（swiftray 解析）

- `MySVG::Node` 加 `QString item_key`。
- `processMySVGNode()` 為 path／image／text 往上找父節點：第一個「父節點位址在 `layer_config_map_` 裡」的祖先就是第一層物件，`item_key` 取其節點位址字串。非 BVG 讀取（一般開檔）不設。
- `<use>`：`QSVG_USE` 節點本身同樣算出 `item_key`；`processUse()` 複製出來的節點改用 `use_node.item_key`。
- Shape 加 `QString itemKey_`（getter／setter），`clone()` 複製，不序列化；node→Shape 迴圈設定。
- `-filled` 圖層的 Shape 與描邊來自同一個 SVG 節點，key 相同。

### 7.4 規劃（swiftray 匯出）

`convertLayer()` 中，振鏡圖層且 `current_layer_->galvoTiling() == GalvoTiling::Object` 時走新流程：

1. **收集**：`current_layer_` 與 `current_layer_2_` 的 Shape 依 `itemKey()` 分組；每組外框取 Shape 的 `boundingRect()`（向量外框，與前端同源）經 `global_transform_` 換到圖層 mm。沒有 key 的 Shape 各自成一組。
2. **檢查**：任一組寬或高 > `galvo_field_mm + kGalvoFieldToleranceMm` → 丟 `std::runtime_error`（訊息含圖層名、物件尺寸、場鏡），由 `Worker::handleAction` 回報失敗。
3. **合併成停靠點**：組依（外框 top, left）排序；逐一建立 cluster，依序吸收剩下的組，只要聯集外框寬高 ≤ 場鏡 + 容差，且存在可及停靠點（下一步）。
4. **停靠點**：聯集中心夾進 `galvoHeadTravel()`；檢查聯集四邊都在停靠點 ± 半場鏡 + 容差內，否則不吸收。單一組也找不到可及停靠點 → 失敗（同 2）。停靠點不對齊格點。
5. **排序**：cluster 依停靠點 (y, x) 排序。

### 7.5 輸出

- **每個 cluster 一組 factory**：`preprocessLaserLayer()` 拆出「用一組 Shape 建 factory」的部分，「依物件」時每個 cluster 建一組（path／hatch／raster／depth bitmaps），只建一次，所有重複遍數共用。
- **每個 cluster 一個 block**：`region = clip = 聯集外框`（不設 clip，`blocks.size() == 1` 時 `emitGalvoBlocks` 本來就不設 clip、不混合），內容由該 cluster 的 factory 產生。外框重疊的物件因此不會互相切到。
- **停靠移動**：沿用格點模式已有的 `kGalvoBacklashOvershootMm = 5`、`kGalvoBacklashTravelClearanceMm = 1`（`toolpath-exporter-fcode.cpp`，swiftray `258489a`）。整批開始前算出所有停靠點的最小 X，安全起點 X = `max(travel.left() + kGalvoBacklashTravelClearanceMm, minParkX − kGalvoBacklashOvershootMm)`；不能走到行程左界，龍門碰到底會回彈、讓後面的停靠點偏移（2026-11-02 實測）。每次停靠時，若是整批第一個或停靠點 X 小於目前 X，先移到 (安全起點 X, 停靠點 Y) 再到停靠點；`galvo_fix_backlash` 關閉時省略。沿用格點模式的延遲停靠（沒有內容的停靠點不移動）。
- **深度雕刻**：cluster 內的深度圖沿用 `convertGalvoDepthBitmaps()` 的逐圖流程，但使用 cluster 的停靠點而不是重新規劃 tile。
- **重複**：維持 `convertLayer()` 現有的外層迴圈，每一遍跑完所有 cluster。
- **debug 圖**：`writeGalvoDebugImage()` 畫出 cluster 的停靠點與外框。

### 7.6 後續：置中格點（記錄需求，未排程）

**需求**：現在格點以機器原點為錨點，同一個物件的切分位置會隨它在畫布上的位置改變，而且很難預先知道會切在哪裡。測試「剛好填滿 2×2 tile」這類拼接效果時，得先依模組偏移和 tile 大小算出分界線再擺物件，板材的擺放也跟著麻煩。希望 tile 大小不變，但以物件中心為參考調整 tile 的位置，讓物件不論放在哪裡都被切在同樣的地方。

**做法方向**：`galvoTiling` 加第三個值（暫名 `centered`，「置中格點」／Centered Grid）。`planGalvoBlocks()` 的格點從 `k × step` 改成 `anchor + k × step`，其餘（clip、接縫歸屬、混合、swiftray `8b4034a` 的每列退一欄）照舊。

**待決定（§11 第 7–9 項）**
- **參考中心**：(a) 每個第一層物件各自一組置中格點（需要 §7.3 的 `item_key`，物件之間的格點互不對齊，外框重疊時要另外處理歸屬）；(b) 整個圖層內容的外框中心一組格點（實作只是在現有流程換錨點，最單純）。
- **對齊方式**：「tile 中心對物件中心」時，200 mm 的物件配 100 mm tile 會切成 3×3（中間一格、四周半格）；要「剛好 2×2」，對齊的應該是整組 tile 的中心——所需 tile 數為奇數時 tile 中心落在物件中心，偶數時接縫落在物件中心。
- **整步限制**：`planGalvoBlocks()` 的註解說明格點以機器原點為錨點，是因為 block 位移是整數個馬達整步，龍門只會停在這些位置上。錨點平移後，停靠點不一定落在整步上（單一 block 的情況目前已經是自由停靠點）。要不要把錨點量化到整步、量化後物件中心與 tile 中心最多差半步，需要機構確認。

### 7.7 自動（2026-11-20 新增，未實作）

**定義**：以圖層第一層物件為單位（§7.3 的 `item_key`）。物件放得進一個場鏡、而且找得到可及的停靠點，就依物件處理；否則該物件走格點拼接。

**前端**
- `constants/galvo-tiling.ts` 的 `GalvoTiling` 加 `Auto: 'auto'`；`layer-config-helper.ts:166` 的預設改成 `GalvoTiling.Auto`。
- `GalvoTilingBlock.tsx` 的選項順序：「自動」（Auto）／「固定格點」／「依物件」。
- 說明文字（自動）：「放得進場鏡範圍的物件各自完整雕刻，不會被切開；放不進的物件自動分塊拼接。」
- i18n：`beambox.right_panel.laser_panel.galvo_tiling` 加 `auto`、`auto_hint`。
- `checkObjectTilingItems()`（`helpers/device/galvoTiling.ts`）只檢查 `object` 圖層，「自動」圖層不擋。

**swiftray**
- `Layer::GalvoTiling` 加 `Auto`（`layer.h:27`）；`layer.cpp:384` 的解析改成 `"object"` → `Object`、`"grid"` → `Grid`、其餘（含缺少）→ `Auto`。
- `convertLayer()` 的「依物件」分支（`toolpath-exporter-fcode.cpp:744`）擴成 `Object` 與 `Auto` 共用，差別只在放不進的物件怎麼處理：
  1. **收集**：同 §7.4 步驟 1。
  2. **分流**：外框寬或高 > 場鏡 + 容差的組，歸到「拼接批」。`Object` 模式維持丟例外（§7.4 步驟 2）；`Auto` 不丟。
  3. **合併成停靠點**：其餘的組照 §7.4 步驟 3～5 併成 cluster。單一組找不到可及停靠點時，`Object` 失敗，`Auto` 把它也歸到拼接批。
  4. **輸出依物件批**：照 §7.5，每個 cluster 一組 factory、一個 block。
  5. **輸出拼接批**：拼接批的所有 Shape 建一組 factory，交給現有的格點流程（`planGalvoBlocks()`、`emitGalvoBlocks()`），格點仍以機器原點為錨點，內容外框只算拼接批。接縫歸屬與混合照目前的拼接策略，和這些物件單獨放在一個「固定格點」圖層時相同。
- **順序**：每一遍重複先打依物件批的所有 cluster，再打拼接批的所有 tile。兩批各自是一個 backlash 批次，各自從自己的安全起點進場（§7.5 的規則）。
- **重複**：維持 `convertLayer()` 的外層迴圈，每一遍兩批都跑完才重來。拼接批的 factory 和依物件批一樣只建一次，不重蹈 §12 記錄的「格點模式每遍重複再加一次圖」。
- **全部放得進**＝與 `Object` 相同；**全部放不進**＝與 `Grid` 相同（逐位元組，A9、A10）。
- **debug 圖**：依物件的 cluster 與拼接批的 tile 畫在同一張，用不同顏色區分。

### 7.8 路徑拼接警告（2026-11-20 新增，未實作）

**原因**：線段（路徑、填色的掃描線、非漸層圖）在 KW 拼接策略下一律硬切（`galvo-seam-kpass-walk.md` Non-goals），兩個停靠點之間只要有一點對位誤差，線條就會錯開或留下縫，比點陣圖明顯得多。

**前端**（`helpers/device/galvoTiling.ts` 新增 `checkPathStitchingItems()`）
- 範圍：`fhx2galvo` 的每個可見、repeat > 0、`galvoTiling === 'auto'` 的振鏡圖層的第一層物件（`getLayerObjects()`）。
- 條件：物件外框寬或高 > 場鏡 + `GALVO_FIELD_TOLERANCE_MM`，而且物件含有路徑內容。路徑內容＝物件本身或其子孫（`<use>` 展開後）有任何不是 `<image>` 的可繪製元素。
- 時機：在 `fetchTaskCodeSwiftray()` 開頭、`checkObjectTilingItems()` 之後。只在送出與匯出 fcode 時跳；預估時間、路徑預覽不跳（這兩個入口會反覆觸發）。
- 內容：「有 %d 個含路徑的物件超過場鏡範圍（%s mm），會分塊拼接。路徑的拼接目前只有硬切，對位要求較高，接縫處較容易出現明顯瑕疵。」按鈕：繼續／取消／選取這些物件；勾選「不再顯示」寫入 `alert-config.ts` 的新 key `skip-galvo-path-stitch-warning`。
- i18n：`beambox.right_panel.laser_panel.galvo_tiling.path_stitch_warning`，en／zh-tw 先寫。

**swiftray**：不擋、不回失敗。匯出時 `qWarning` 一行（圖層名、拼接批裡含線段的物件數），方便從 log 對照。

**不涵蓋**：「固定格點」圖層（格線位置和模組偏移有關，前端無法只靠物件大小判斷會不會切到）；非漸層點陣圖雖然也是線段、也硬切，第一版不警告（§11 第 11 項）。

## 8. Data contracts

- **SVG（beam-studio → swiftray）**：圖層 `<g class="layer">` 新屬性 `data-galvoTiling="auto"|"grid"|"object"`。字串值，`getAttr()` 只回 double 不能用；`createGNode()` 直接讀 `attributes.value("data-galvoTiling")`。「自動」實作前：缺少或不認得的值一律當 `grid`。「自動」實作後：缺少或不認得的值當 `auto`（與前端預設一致）；新版前端配舊版 swiftray 時，`auto` 會被當成 `grid`，等於全部拼接，不會失敗。
- **轉檔失敗**：沿用 `{success: false, error: {message}}`；beam-studio `export-funcs-swiftray.ts` 既有的錯誤 popup 顯示訊息。
- 沒有新的 task config key；`galvo_field`、`galvo_fix_backlash` 照舊。

## 9. Performance

- 每個 cluster 一組 factory：bitmap 記憶體總量與整層一次載入相同（每張圖只屬於一個 cluster）。
- 停靠點數 ≤ 物件數；格點模式下的接縫混合成本（實心填滿跨每條接縫時，齒狀接縫佔 run 時間 17–39%，見 swiftray `laser-raster-galvo.h` 的 `segment_length` 說明）在「依物件」圖層完全不付。

## 10. Rollout (PR plan)

1. swiftray：解析 `item_key` + Shape 欄位 + 圖層參數（不改匯出，行為不變）— `3ce9f62`。
2. swiftray：「依物件」的規劃、輸出、停靠順序、失敗回報 — `0c4964f`。
3. beam-studio：圖層參數、UI、i18n（23 種語言已補齊）、sanitize、前端檢查 — branch `machine/hx2`。
4. swiftray：`Auto` 的解析、分流、拼接批輸出、debug 圖（§7.7）— 未實作。
5. beam-studio：`auto` 選項與預設、說明文字、路徑拼接警告、i18n（§7.7、§7.8）— 未實作。等 4 合併後才發，避免前端預設送出舊版 swiftray 不認得的行為。

實作與設計的差異（2026-11-03）：
- 前端檢查另外把多選暫時群組（`#svgcontent > g[data-tempgroup]`，元素帶 `data-original-layer`）裡的物件算回原圖層：多選時元素不在圖層下，要到 `getSvgString()` 才放回去。
- swiftray 收集物件外框時，零寬或零高的外框（單點、水平線）不能用 `QRectF::united()`，會被當成空矩形丟掉，改成手動取 min／max。
- 深度圖若在同一個停靠點有多個 pass，backlash 進場只做第一次。

## 11. Open decisions

1. ~~同一場鏡內的多個物件要不要合併成一個停靠點~~ → 合併（2026-11-02）。
2. ~~物件超過場鏡~~ → 前端在送出、預估時間、路徑預覽都檢查；後端遇到直接結束轉檔並回傳失敗（2026-11-02）。
3. ~~停靠點不規則時的 backlash~~ → 依 Y 再 X 排序；X 往左時先到「整批最左停靠點 − 5 mm」（常數，不小於行程左界）再往右（2026-11-02）。
4. ~~圖層重複~~ → 所有停靠點做完一遍再重來（2026-11-02）。
5. ~~場鏡邊距~~ → 不考慮邊緣殘差，只容許外框近似誤差 0.001 mm（2026-11-02）。
6. ~~參數名稱~~ → 以正面語意命名為「分塊方式」，`galvoTiling: 'grid' | 'object'`，以後可再加值；不用否定形式的「不拼接」布林（2026-11-02）。
7. 「置中格點」以單一物件中心還是整個圖層內容中心為準？（§7.6）
8. 「置中格點」對齊的是「某一個 tile 的中心」還是「整組 tile 的中心」？兩者在 tile 數為偶數時不同（§7.6）。
9. 「置中格點」的格線起點要不要量化到馬達整步？（§7.6）
10. ~~預設的分塊方式~~ → 新增「自動」並設為預設；沒有屬性的舊檔也採用自動（2026-11-20）。
11. 路徑拼接警告要不要涵蓋非漸層點陣圖（同樣是線段、同樣硬切）以及「固定格點」圖層？第一版只做「自動」圖層裡含路徑的物件。
12. 「自動」下，拼接批與依物件批的先後：目前定為先依物件、再拼接。若拼接批的煙塵會影響之後的小物件，或反過來，再調整。

## 12. Risks & follow-ups

- **前後端外框差異**：前端用瀏覽器 `getBBox`，後端用 Qt `QPainterPath::boundingRect`；bitmap 在 swiftray 轉換後尺寸會取整到像素。後端檢查刻意用 Shape 的向量外框而不是 factory 輸出，避免 0.001 mm 容差被像素取整吃掉；實際打出的 bitmap 可能多出不到一個像素，落在場鏡外時由 `GalvoListWriter` 的 out-of-field 計數記錄。
- **匯出前的暫時轉換**：`convertAllTextToPath`、`convertShapeToBitmap`、`convertClipPath`、image symbol 切換、多選暫時群組（`data-tempgroup`）若改變第一層結構，前後端的「物件」定義會不同 — 列入測試。
- **`item_key` 用節點位址**：只在單次解析內有效，不可存檔。
- ~~**格點模式的 backlash 規則**（`8b4034a`，每列退一欄）與本 PRD 的規則不同~~ → 已統一：格點模式也改成整批最左停靠點 − 5 mm、離行程左界至少 1 mm（swiftray `258489a`，2026-11-02）。原本退一欄時，第一欄的批次會退到行程左界，實測龍門會回彈。
- 後續：bitmap 內連通區塊、混合模式（見 swiftray `docs/galvo-content-blocks.md` Phase 2）。
- **「自動」讓舊檔的行為改變**：原本整層固定格點的舊檔，重新匯出時小物件會改成依物件停靠，停靠點位置與順序都不同。結果應該更好（不被切開），但和之前打出來的成品不會逐點相同；要完全重現舊結果，把圖層改回「固定格點」。
- **「自動」下同一圖層兩種停靠方式**：一個剛好超過場鏡一點點的物件會整個改走拼接，外觀上和旁邊略小的同款物件不同（一個有接縫、一個沒有）。門檻就是場鏡尺寸，沒有緩衝。
- **警告的判斷比實際寬**：超過場鏡的群組只要含有一段路徑就警告，即使那段路徑本身沒有跨接縫。
- **格點模式既有問題（實作時發現，未修）**：`convertGalvoLaserLayer()` 每一遍重複都呼叫 `prepareGalvoBitmaps()`，把圖片再加進同一個 `laser_raster_factory_`（`add_bitmap()` 只會累加），深度圖也會再 append 進 `galvo_depth_bitmaps_`。重複 ≥ 2 的格點圖層，第 r 遍的 factory 裡有 r 份同樣的圖。點陣圖會經 `mergedEntries()` 合成一張，重疊的份數是否因此只打一次未確認；深度圖沒有合併，第二遍起確定會重打。需要上機或 fcode 比對確認後另外修。「依物件」的 factory 只建一次，沒有這個問題。

## 13. Test plan

- **beam-studio 單元測試**：`galvoTiling.spec.ts` — 合格／超過／剛好等於／旋轉、群組、`<use>`、隱藏圖層、「固定格點」圖層（A2）；`GalvoTilingBlock.spec.tsx` — 選擇後寫入每個選取圖層並可 undo、modal 模式只改 store、多值顯示（A1）；`export-funcs-swiftray` — 檢查失敗時不呼叫上傳、不留下暫時修改（A2、Must not change）。
- **swiftray**：以固定 SVG 匯出 fcode 比對
  - 情境 1／2／3 的停靠點數、每個物件只出現在一個 block（A3、A4）；
  - gantry 移動序列的 Y 單調、X 往左必經安全起點（A5）；
  - 120 mm 物件回傳失敗訊息（A6）；
  - repeat = 2 的停靠點序列為兩份完整序列（A7）；
  - 「自動」：情境 1 與 `object` 逐位元組相同（A9）；全部超過場鏡時與 `grid` 逐位元組相同、情境 6 的吊牌各只出現在一個 block、照片的 tile 內容與單獨放在 `grid` 圖層時相同（A10）；repeat = 2 時兩批各跑兩遍、圖沒有重複加入；
  - 未開旗標的振鏡圖層、非振鏡圖層、Promark 的 fcode 與改動前逐位元組相同（Must not change）。
- **beam-studio 單元測試（自動）**：預設值與舊檔顯示（A8）；`checkObjectTilingItems` 不擋 `auto` 圖層；`checkPathStitchingItems` — 只有圖片／群組含路徑／`<use>`／隱藏圖層／剛好等於場鏡；警告只在送出與匯出時出現、取消時不留下暫時修改、勾選不再顯示後不跳（A11）。
- **上機**：情境 1 實際雕刻，確認物件完整、無錯位；情境 6 確認兩批的停靠與接縫。
