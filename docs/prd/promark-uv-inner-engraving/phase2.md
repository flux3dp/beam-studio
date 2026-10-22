# PRD：Promark UV 與內雕 Phase 2

| | |
|---|---|
| **Status** | 進行中：P2-5 與每行停留、打散掃描順序開放已實作（2026-10-22）；P2-7 已在 Phase 1 完成；P2-2 3D 多選已實作（框選除外，手勢待定），待上機確認 |
| **Author** | EstherFu（整理：Claude） |
| **Created** | 2026-10-19 |
| **Target product** | Beam Studio 桌面版（Promark `fpm1` UV） |
| **Owner area** | 內雕 3D 畫布；Swiftray 內雕切片 |
| **Related code** | 多選：`svgedit/selection/SelectionManager.ts`、`app/stores/stlStore.ts`、`components/beambox/InnerEngraving/`、`RightPanel/DimensionPanel/DimensionPanelStl.tsx`、`RightPanel/ActionsPanelStl.tsx`；照片轉 3D：`app/svgedit/stl/{photoPointCloudGenerator,photoPointCloud,pointCloud}.ts`、`RightPanel/OptionsBlocks/ThreeDOptions.tsx`、`helpers/api/ai-image-process.ts`、`helpers/image-edit.ts`；圖層參數：`helpers/layer/layer-config-helper.ts`、`RightPanel/ConfigPanel/getInnerEngravingBlocks.ts`、`app/constants/presets.ts`；匯出：`helpers/api/svg-laser-parser.ts` |
| **Companion PRD** | [`phase1.md`](phase1.md)（Phase 1，已實作）；[`../promark-lens-profiles.md`](../promark-lens-profiles.md)（多組場鏡參數，原 P2-1，獨立開發） |
| **External repos** | Swiftray（Phase 1 branch `codex/promark-3d-inner-carving-pr`）：Z 分桶、端面填充、點間距過濾。flux-id：照片轉 3D API。Replicate：去背、Depth Anything V3 Mono |
| **Playground** | `/Users/software/dev/tools_cp/replicate-3d-compare`（照片轉 3D 參數測試頁，`index.html` + `NOTES.md`） |

（以下路徑除非以 `packages/`、`Swiftray`、`flux-id`、`replicate-3d-compare` 開頭，否則都相對於 `packages/core/src/web/`。行號以 Phase 1 branch `promark-3d-inner-carving` 的 `6a0198f56` 與 Swiftray `c7c8f90` 為準。）

---

## 1. Summary

Phase 2 有七個新項目，加上 Phase 1 延續下來的三項。原本的 P2-1 多組場鏡參數適用所有 Promark 雷射源，移到獨立的 [`promark-lens-profiles.md`](../promark-lens-profiles.md)，編號保留不重排：

| # | 項目 | 涉及 | 來源 |
|---|---|---|---|
| ~~P2-1~~ | ~~同一台機器保存多組場鏡參數~~ → 移到 [`promark-lens-profiles.md`](../promark-lens-profiles.md)（2026-10-19） | — | 新增（併入原 P2-6「UV 70mm 場域大小」） |
| P2-2 | **3D 多選** | Beam Studio | 原 P2-1 |
| P2-3 | **2D 照片轉 3D 點雲**（可選去背 + Depth Anything V3 Mono，扣點 0.06） | Beam Studio、flux-id、Swiftray | 原 P2-2 |
| P2-4 | 輪廓打線「**填充上下端面**」 | Beam Studio、Swiftray | 原 P2-7 |
| P2-5 | ~~三個頻率超出規格的預設參數重測~~ 已完成（2026-10-22）：維持 40kHz；PLA 加每行停留 | Beam Studio | 原 P2-8 |
| P2-6 | 打散掃描順序效果測試 | 測試 | 原 P2-4 的一部分 |
| P2-7 | ~~`machine_z_bucket` 調整~~ Phase 1 已完成：Swiftray 預設改為 0.01mm（`af385ca`） | Beam Studio、Swiftray | 新增 |
| P2-8 | 點雲檔案直接匯入（PLY / GLB / BSPC） | Beam Studio | 原 P2-3 |
| P2-9 | 3D 材質測試、每行停留轉正式功能（每行停留與打散掃描順序已開放給 UV 一般使用者，2026-10-22） | Beam Studio | 原 P2-4 其餘 |
| P2-10 | 球體 / 圓柱材料轉正式功能（**不在 Phase 2 release**） | Beam Studio | 原 P2-5 |
| P2-11 | UV 70mm 場域 70 / 75 的差異 | Beam Studio | 原 P2-6；2026-10-20 從多組場鏡 PRD 移回 |

P2-8～P2-10 除了已開放的每行停留，維持 Phase 1 的狀態（uvDev 擋著），等上機結果再排。P2-10 已確認不在 Phase 2 release（2026-10-19）：相關程式與文件保持原樣、不刪除，等之後有時間上機測試實際效果再決定。

---

## 2. Background & current state

### 2.1 Phase 1 留下的 dev 功能

- 照片轉點雲：`ThreeDOptions.tsx:23-53` 的「Generate Test Point Cloud」，只在 `isUvDev()` 對照片平面顯示。`generatePhotoPointCloud` 以灰階當深度（`z = (255 − gray) × 層間距`），格距是點間距；`applyPhotoPointCloud` 把物件改成 `kind: 'point-cloud'`，原圖保留，BSPC 存在 .beam block 7。
- Replicate 範例匯入已在 `274b6b0ac` 移除。
- `machine_z_bucket`：只有 `isUvDev()` + fpm1 UV 時從 localStorage 讀，前端下限 0.001（`svg-laser-parser.ts:47-51`、`362-394`）。Swiftray 預設 0.01、下限 0.001（`toolpath-exporter.h:42-43`，`af385ca`）。
- 每行停留（`data-fillDwellTime`）與打散掃描順序（`data-fillInterleave`）：Phase 1 只在 `isUvDev()` 顯示（進階設定、2D 材質測試）；2026-10-22 起 Promark UV 一般使用者可用（§6.5）。

### 2.2 照片轉 3D 測試頁（replicate-3d-compare）

- 深度模型：`vufinder/depth-anything-v3-mono`，輸出 float32 深度 + `alpha_mask` + `sky_mask`（`data.js:140-148`）。每次 < US$0.01，冷啟動排隊 20 秒～2 分鐘（`NOTES.md:169`）。
- 測試頁不呼叫 Replicate、也不輸出點資料；去背圖是另外用既有去背功能做的。所有後處理都在瀏覽器（`index.html`）：
  1. 深度取 1–99% 百分位正規化，反轉，乘上 `reliefDepthRatio` 0.22 × 寬度（以寬 100mm 計，最深 22mm）。
  2. 邊緣處理 `edgeCleanField`（可選）。
  3. Dither：縮到 dither 寬、轉灰階、銳化（unsharp mask）、反相、誤差擴散，黑點成為點。
  4. 投影：每個點用 Catmull-Rom 取深度，遮罩邊緣退回雙線性（`projectDither`）；開了邊緣處理改用 `edgeDither`，在陡坡補點。
- 參數分成三類（詳見 §6.2.2）：改變點資料的、只影響顯示的、寫死的常數。

---

## 3. Goals & non-goals

### 3.1 Goals

- 3D 物件可以多選並整體編輯。
- 使用者匯入照片後，一個按鈕就能轉成可內雕的點雲，參數可以事後調整、不重複扣點。
- 輪廓打線的物件可以把上下端面填滿。
- 縮短打點工作的 Z 移動時間，不影響打線。

### 3.2 Non-goals

- 網頁版。
- 場鏡參數相關功能：見 [`promark-lens-profiles.md`](../promark-lens-profiles.md)。
- 照片轉 3D 的多視角融合（測試頁的 `multiviewDither`）。
- 3D 對齊與分佈（§10 #9）。

---

## 4. Scenarios & acceptance criteria

### P2-2 3D 多選

- 操作：內雕模式下 Shift + 點物件加入或移除選取；Ctrl / Cmd + A 全選（未鎖定、可見圖層的物件）；貼上多個物件後它們一起被選取。
- 結果：
  - 每個物件有自己的外框，另有整體外框（聯集）與一個 gizmo，gizmo 在整體外框中心。
  - 平移、旋轉、等比縮放、翻轉以整體為單位，一次 undo 整組還原。旋轉依 2D 慣例以整體外框中心為軸（§6.1）。
  - 尺寸面板顯示整體外框的中心與尺寸；尺寸強制等比；旋轉只有「±」相對輸入（沒有共同的絕對角度，數值欄空白且停用）；翻轉以整體中心鏡射；沒有重置與鎖定比例按鈕。
  - 「置中到可雕區」、「填滿可雕區」以整體外框計算。
  - 物件面板只顯示 3D 尺寸與 3D 動作；來源物件的 2D 動作與選項不顯示；2D 的對齊、群組、布林按鈕不出現。標題顯示「多個物件」，不帶圖層名稱。
  - 圖層面板選取所有選中物件所在的圖層（去重）。
- 邊界：
  - Shift + 點已選取的物件：從選取移除；移到只剩一個時回到單選的面板與 gizmo；全部移除等於取消選取。
  - Shift + 點空白處：和不按 Shift 相同，取消選取（其他手勢不變，見 §10 #9）。
  - 非等比縮放不支援（有旋轉的物件會產生 shear）：gizmo 拉單軸時，以變化最大的軸當作三軸共同倍率。
  - 選取中有物件的圖層被鎖定或隱藏：gizmo 不顯示，外框保留。
  - 只有照片平面（厚度 0）時，Z 尺寸停用。
  - 刪除、複製貼上、方向鍵移動、移到其他圖層、undo / redo 在多選下都要正確同步 3D 畫布（手動測試）。
  - 群組選單與快捷鍵在多選時停用（`canGroup` 為 false）。
  - 對齊與分佈不做（§10 #9）。
  - 旋轉後每個物件的新位置與角度已用頂點驗算（§12）；UI 手感由 EstherFu 上機確認，確認後再對實際操作做一次驗算。

### P2-3 照片轉 3D

- 操作：內雕模式匯入照片 → 物件動作面板出現「轉 3D」→ 按下 → 確認視窗設定【是否去背】與【銳化】（強度、半徑），顯示扣點 → 確認。
- 結果：
  - 等待時顯示進度（§6.2.4），完成後照片平面變成點雲（勾選去背時只保留主體），畫布上看得到立體點。
  - 轉換後可以調整深度（Z 軸厚度）與銳化，點間距沿用圖層參數（§6.2.2 的「轉換後可調」）；調整後重新計算點雲，**不再扣點**，計算期間顯示「更新中」（§6.2.6）。
  - 收邊只在 uvDev 下顯示。
  - 存檔重開後仍能調整參數，不需重新呼叫後端。
  - 送出工作時點雲一起送出，Swiftray 略過過近的點（§6.2.5）。
- 邊界：
  - 未登入：先要求登入。點數不足：顯示點數不足並提供購買連結。
  - 後端失敗、逾時：提示錯誤，不扣點、照片維持原狀。
  - 原圖已有透明背景時，「是否去背」預設不勾（§6.2.3）；不去背且原圖沒有透明區域時，整張圖都會轉成點雲。
  - 重新計算期間繼續調整參數：只算最後一次的值，不會排隊跑多次。
  - undo 一次回到轉換前的照片平面。
  - 已轉換的物件不再顯示「轉 3D」。

### P2-4 填充上下端面

依需求規格（2026-10-19）：

- 操作：輪廓打線的圖層打開「填充上下端面」，出現「填充間隔」(mm)。
- 結果：
  - 關閉時與現有結果完全相同，填充間隔欄位隱藏。
  - 開啟時保留原本的輪廓路徑，另外產生頂面與底面的填充；填充範圍依模型實際幾何計算；填充內縮、不重複雕刻輪廓。
  - 填充間隔只影響端面填充；關閉後再開，恢復原本的值。
- 邊界：
  - 預設值與範圍沿用現有填充功能（§6.3）。
  - 中空或有孔的端面不填孔。
  - 階梯形物件中間的水平面算不算端面，見 §10 #14。

### P2-5 預設參數重測

- 三組原本超出規格的預設參數確認維持 40kHz，不改頻率。
- PLA（`pla_engraving`）需要每行停留 50000µs。
- 操作：UV 平面文件的圖層先選 PLA，再選其他預設參數，打開進階設定。
- 結果：先選 PLA 時「每行停留」開啟、50000µs；換成其他預設參數後關閉。再手動打開時，時間回到 50000µs（關閉以負值保留上次的時間）。

### P2-6 打散掃描順序測試

- 同一材料、同一圖案，分別以開 / 關「打散掃描順序」（`data-fillInterleave`）雕刻，比較局部過深與總工時，結果記錄在 §11。
- 2026-10-22 起此選項與每行停留已開放給 UV 一般使用者（進階設定 > 填充設定，只有 Promark UV 顯示）；Desktop / MOPA 不顯示。

### P2-7 `machine_z_bucket`

- Phase 1 已完成：Swiftray 預設改為 0.01mm（`af385ca`），前端覆寫仍只在 uvDev。
- 打線切片目前仍經過 bucket（`toolpath-exporter.cpp:1206`），層間距約 0.027mm 大於 0.01，不會合併相鄰切片；是否仍要讓打線完全不分桶見 §6.6。

### P2-11 UV 70mm 場域 70 / 75

- 操作：UV 70mm 分別以 worksize 70 與 75 校正並打標準圖形（例如 60mm 方格）。
- 結果：確認 UV 能否直接用 70；結果記錄後決定是否改 `getPromarkFieldWorksize`。
- 邊界：若改成 70，既有以 75 校正的參數（含多組場鏡的各組）要轉換或提示重新校正（§10 #20）。

---

## 5. Must not change（回歸合約）

| 共用檔案 / 函式 | 呼叫端 — 必須維持的行為 |
|---|---|
| `ActionsPanel` 圖片動作 | 2D 模式的去背、描圖等按鈕不變 |
| `SelectionManager`（`setSelectedElements`、`addToSelection`、`tempGroupSelectedElements`） | 2D 模式的多選、tempGroup 不變；內雕模式改為平的多選清單、不建 tempGroup |
| `selectedElementStore`（`setSelectedElement`、`getDerivedData`） | 新增 `selectedElements` 與 nodeType `stl_multi`，只有「全部是已載入的 3D 物件且超過一個」時才是 `stl_multi`；其他 nodeType 的判斷不變 |
| `canvasEvents.setSelectedElement`、`svg-editor.ts` `updateContextPanel` | 多傳整份選取清單；2D 的 `selectedElement`（第一個或 tempGroup）不變 |
| `svg-editor.ts` Ctrl / Cmd + A | 2D 不變；內雕模式原本略過，改為全選 |
| `ObjectPanel`、`ElementTitle` | 2D 與單一 3D 物件的面板不變；`stl_multi` 走多選 3D 面板 |
| `ActionsPanelStl`（`id` → `ids`）；`transform.ts` 的 `moveObjectCenterTo` / `fitObjectTo` 移到 `groupTransform.ts` 的 `moveObjectsCenterTo` / `fitObjectsTo` | 單一物件的置中、填滿結果與原本相同 |
| `stlStore.selectedId` → `selectedIds` | 單選時行為不變 |
| `StlMesh` | 單選時 gizmo 與外框不變；多選時只留外框 |
| Swiftray `outputLayerFillGcode` | 2D 填充路徑不變（端面填充若共用它，不能改到 2D 的行為） |
| Swiftray `outputLayerStlGcode` | 打線物件的 Z 順序與 Phase 1 相同；`machine_z_bucket` 預設改變只影響打點 |
| `presets.ts` | 頻率、速度等既有值不變；只有 `fpm1_2_5` 加上 `fillDwellTime`（PLA 50000，其他 -50000 = 關閉）。其他機型的預設參數不變 |
| `AdvancedSettingModal.tsx` | 每行停留與打散掃描順序只在 Promark UV 顯示（原本是 uvDev）；Desktop / MOPA 與其他機型的進階設定不變 |
| `MaterialTestGeneratorPanel/TableSetting.ts` | UV 2D 材質測試多了每行停留與打散掃描順序兩欄（原本是 uvDev）；內雕與其他雷射源的表格不變 |
| `getPromarkFieldWorksize`（`promark-constants.ts:36-37`） | P2-11 決定前維持現狀：UV 70mm 送 75，其他送工作範圍本身 |

實作時隨 diff 補齊。

---

## 6. Design

### 6.1 P2-2 3D 多選

- 不建立 tempGroup：內雕模式下多選只保留一份平的 `selectedElements`（`SelectionManager`）。搬進 tempGroup 會讓投影離開所在圖層，而每個 3D 物件的顏色、鎖定、顯示都讀自圖層。
- 選取同步：`stlStore.selectedIds`（`string[]`）與 svgedit 的選取由 `InnerEngraving/utils/selection.ts` 雙向同步：`selectStlObjects` / `selectStlObject` / `toggleStlObjectSelection`（Shift + 點）寫兩邊並選取物件所在圖層；`InnerEngravingCanvas` 依 `selectedElementStore.selectedElements` 回寫 `selectedIds`。
- `selectedElementStore` 新增 `selectedElements` 與 nodeType `stl_multi`（全部是已載入的 3D 物件且超過一個），`canGroup` 為 false；`ObjectPanel` 讓它走 `DimensionPanelStlMulti` 與 `ActionsPanelStl`。
- 整體 transform（`InnerEngraving/utils/groupTransform.ts`）：
  - `transformInGroup(transform, pivot, delta)`：delta 為平移 t、旋轉 Q、等比倍率 s、鏡射 M（對某個世界軸），對每個點 `p' = pivot + t + Q·s·M·(p − pivot)`。物件矩陣是 `T(position)·R·S·F·T(−centre)`，所以 `position' = pivot + t + Q·s·M·(position − pivot)`、`R' = Q·M·R·M`、`scale' = s·scale`、鏡射軸的 `flip` 取反（M·M = I、對角矩陣可交換）。
  - 旋轉（2026-10-22 決定依 2D 慣例）：pivot = 整體外框（所有物件 world AABB 的聯集）的中心。`R'` 用 `toEulerXYZ` 分解回 Euler XYZ：three.js 的 `Euler.setFromRotationMatrix` 在 |sin y| > 0.9999999 時把 Z 設為 0，Y 接近 ±90° 時每次會轉偏最多約 0.03°，所以改用沒有門檻的公式，只在 cos y 確實為 0 時退回。
  - 沒有旋轉時角度原樣保留；只有鏡射時用精確公式（鏡射軸的角度不變、另兩軸取負），避免面板數字經過矩陣來回轉換而跳動。
  - `applyGroupTransform(objects, delta, pivot?)`：所有變更經 `setTransform(..., { parentCmd })` 收進一個 `BatchCommand`。
  - `moveObjectsCenterTo`、`fitObjectsTo`：以整體外框計算；單一物件的結果與原本的 `moveObjectCenterTo` / `fitObjectTo` 相同。
- gizmo（`GroupTransformControls.tsx`）：掛在整體外框中心的代理 group 上，拖曳時把代理的位移、旋轉、倍率當作 delta（`getGroupDragTransforms`），每幀寫 store 與投影 rect（不進 history）；放開時 `commitGroupDrag` 以拖曳開始時的 transform 為舊值，記一個 undo 步驟。縮放時以變化最大的軸當三軸倍率（`getUniformFactor`）。整體外框用 `Box3Helper` 畫。
- 尺寸面板（`DimensionPanelStlMulti.tsx`）：位置、尺寸是整體外框的；尺寸改任一軸都換成等比倍率；旋轉只收相對角度，繞世界軸、以外框中心為軸；翻轉以外框中心鏡射。
- 框選：手勢待定（§10 #9），尚未實作。

### 6.2 P2-3 照片轉 3D

#### 6.2.1 流程

```
匯入照片（照片平面）
 → 物件動作面板「轉 3D」（ActionsPanelStl，照片平面且尚未轉換時顯示）
 → 確認視窗：是否去背、銳化強度 / 半徑；扣點（沿用 processImageWithAi 的點數檢查與 ai_credit_reminder）
 → flux-id API：（去背）+ Depth Anything V3 Mono（伺服器端呼叫 Replicate）；不去背時跳過去背 API
 → 回傳：去背圖（有去背時）+ 深度圖
 → 前端：正規化、dither、投影、邊緣處理 → BSPC，applyPhotoPointCloud
 → 存檔：去背圖、深度圖、點雲一起存
 → 送出：pointCloudObjects 一起送 Swiftray；Swiftray 略過過近的點
```

#### 6.2.2 參數分工

後端回傳**深度圖本身**（而非算好的點雲），前端計算點雲。理由：dither、銳化、收邊都在測試頁的瀏覽器裡跑得動（邊緣處理約 0.2 秒），使用者改參數不需要再呼叫後端、不重複扣點。

依 2026-10-19 的決定：送後端前在 Beam Studio 設定是否去背與銳化；轉換後可調的只有深度與銳化；收邊用 uvDev 擋住；測試頁其他參數一律用固定值。

| 類別 | 參數（測試頁名稱） | 建議 |
|---|---|---|
| **後端固定** | 模型 DA3 Mono、`alpha_blend_onto: white` | flux-id 端寫死 |
| **送出前設定** | 是否去背 | 確認視窗；決定後端要不要呼叫去背 API，轉換後不能改（要重新轉換、重新扣點） |
| **送出前設定，轉換後可調** | 銳化強度（預設 1.0）、半徑（預設 4.0） | 確認視窗設定初始值，轉換後在物件面板調整；純前端計算，不需重新呼叫後端 |
| **轉換後可調** | 深度（= Z 軸厚度，mm） | 物件面板，即 3D 物件的 Z 尺寸 |
| **沿用圖層** | 點間距（取代 Dither 寬） | 圖層既有的 `stlPointSpacing` |
| **uvDev** | 收邊 | 只在 `isUvDev()` 顯示；一般使用者固定為 0（不收邊），預設值見 §10 #10 |
| **前端固定** | 演算法 Floyd–Steinberg、Dither 投影、邊緣處理「只清輪廓」、反轉深度「依模型」（DA3 為反轉）、深度 1–99% 百分位正規化 | 寫死，不開放 |
| **不需要** | 上色、2D 色階、點大小、格子、同步視角（只影響測試頁顯示）；網格密度（只影響 relief mesh，不影響 DA3 dither）；PNG 精度（只影響 PNG 深度模型，DA3 是 JSON / float） | 不實作 |

- **點間距取代 Dither 寬**：目前設定「寬 3200」在測試頁的 100mm 寬上等於 0.031mm，正好是內雕打點的點間距 0.03mm（`k9_crystal_contour_dot`）。改用圖層的點間距（`stlPointSpacing`），dither 寬 = 物件寬 / 點間距，和其他內雕物件一致。點數會很多（測試 3 在寬 3200 約 97 萬點），要有上限與警告（§10 #11）。
- **深度 = Z 軸厚度**：測試頁寫死 `reliefDepthRatio` 0.22（寬 100mm 時最深 22mm）。正式版直接用物件的 Z 尺寸：轉換時以正規化深度 0～1 產生點雲，Z 厚度就是 3D 物件的 Z 尺寸，在尺寸面板編輯（`DimensionPanelStl`），不需重新計算點雲。上限是材料高度扣安全邊距；預設值沿用寬度 × 0.22，再受上限限制。
- **銳化只影響點的疏密，不影響深度**：測試頁的銳化是 unsharp mask（原圖 +（原圖 − 模糊）× 強度），作用在「縮到 dither 網格、反相之前」的灰階上（`index.html:1376-1414`）。灰階經 Floyd–Steinberg 轉成「哪些格子打點」，所以銳化只改變點在 XY 的分布：亮暗交界兩側的疏密對比變大、細節更明顯。每個點的 Z 是之後投影時另外從深度圖取的（`projectDither`），和銳化無關。半徑以 dither 點為單位（Gaussian σ），點間距 0.03mm 時半徑 4 約等於 0.12mm。強度 0 = 關閉。
- **銳化 1.0、半徑 4.0**：沿用目前設定當預設。
- **收邊**（uvDev）：測試頁只有一個參數 `edgeRound`（0–10mm，四分之一圓弧收邊的半徑），只有 4mm 測試過（`NOTES.md:345-386`）。uvDev 下建議預設 **4mm（以寬 100mm 為準，即物件寬的 4%）**，範圍 0–10mm；收邊只作用在透明遮罩的輪廓上，不去背且原圖沒有透明區域時只作用在圖片外框。正式值要上機比較 0 / 2 / 4 / 6mm 後決定（§10 #10）。收邊會增加點數（測試 6、7 只清輪廓 + 收邊 4mm 分別多 18%、13%）。
- 測試頁的邊緣處理常數（`EDGE_STEEP` 2.5、`EDGE_REACH` 6、`EDGE_FRINGE` 4、`EDGE_BAND` 10、`EDGE_ISLAND` 0.15%、`EDGE_ROUND_T` 4/√17，`index.html:1664-1673`）照搬寫死。這些是以像素計的，換成以點間距計要再確認。

#### 6.2.3 確認視窗

- 沿用 `processImageWithAi` 的流程：未登入要求登入、點數不足顯示購買、`ai_credit_reminder`（可勾選不再提醒）。
- 選項：
  - **是否去背**：預設依原圖判斷，原圖有透明像素（alpha < 255 的比例超過門檻）時預設不勾，否則預設勾選。去背結果是之後所有遮罩、收邊的依據，轉換後不能改。
  - **銳化強度、半徑**：預設 1.0 / 4.0，轉換後仍可在物件面板調整。
- 不去背時扣點是否減少（去背目前是 0.02，`REMOVE_BACKGROUND_COST`）見 §10 #17。
- 背景畫在圖裡、但不是透明的原圖（例如 `NOTES.md:259` 的棋盤格背景）判斷不出來，會預設勾選去背，這是預期行為。

#### 6.2.4 等待期間

- 去背目前用不顯示百分比的 `openNonstopProgress`（`image-edit.ts:363-403`）。照片轉 3D 冷啟動可能排隊到 2 分鐘，建議改用 AI Upscale 的 `openSteppingProgress` + 預估時間（`image-edit.ts:306-361`，上限 95%），文字分兩段：「去背中」、「產生深度中」。逾時沿用 3 分鐘。

#### 6.2.5 資料與後端

- **flux-id**：新 API（例如 `/api/photo-to-3d`），收圖片，回傳去背 PNG 與深度（16-bit PNG，或 float32 + 尺寸）。扣點 0.06，失敗不扣點。
- **.beam**：深度圖與去背圖要存檔才能事後調參數。建議放進新的資料區塊（block 8），或併進 block 7 的點雲來源（§7）。
- **Swiftray 過近的點**：目前完全沒有最小間距檢查（`readPointCloud` 只檢查格式）。建議在 `flushBucket` 建好每桶的 2D 點之後、`nearestPointOrder` 之前過濾（`Swiftray src/toolpath_exporter/toolpath-exporter.cpp:1129-1133`），門檻以點間距的比例決定（例如 0.5 倍，§10 #11）。限制：只能在同一個 Z 桶內比較；跨桶的過近點要在投影後、折射前做 3D 過濾。

#### 6.2.6 轉換後重新計算

- 深度不需要重算：深度就是物件的 Z 尺寸，走既有的 `setTransform`（Z 方向縮放），點的 XY 分布不變，和其他 3D 物件改尺寸一樣即時。
- 需要重算的情況：改銳化、點間距（圖層）、收邊（uvDev），要重跑 dither 與投影。
- 預估耗時（待量測，§8）：點間距 0.03mm、寬 100mm 約 3300 × 3300 格、百萬點級。測試頁的經驗是邊緣處理約 0.2 秒；dither 與投影在主執行緒跑可能到數百毫秒以上，加上 BSPC 編碼與 three.js 重建 geometry。
- 為了不讓 Beam Studio 卡頓：
  - dither、投影、BSPC 編碼放進 Web Worker，主執行緒只換 geometry。
  - 數值輸入放開或輸入完成才重算（測試頁也是放開滑桿才重算，`index.html:3286`），計算中再改值時取消舊的計算，只算最後一次。
  - 計算中在物件上與物件面板顯示「更新中」（超過約 300ms 才出現，避免閃爍）；畫布維持顯示舊的點雲，算完才替換。
  - 重算結果與參數變更合成一個 undo 步驟（`undoManager.appendCommandToLast`）。
- 送出工作前若仍在計算，等計算完成再送出，或提示「點雲更新中」。

### 6.3 P2-4 填充上下端面

- **圖層參數**：開關 `data-stlFillCaps`（名稱待定），間隔沿用圖層既有的 `fillInterval`（預設 0.01mm、範圍沿用現有填充）或另開 `data-stlCapInterval`，見 §10 #15。新屬性要加進 `packages/core/public/js/lib/svgeditor/sanitize.js` 的 `g` 清單。
- **顯示位置**：規格寫「物件 > 輪廓打線模式」，但 Phase 1 起雕刻方式是圖層參數（`getInnerEngravingBlocks.ts`），建議放在圖層面板打線模式下，和層間距一起。
- **Swiftray**：
  - 切片：`Slicer::sliceAt`（`stl-utils.cpp:1306-1398`）會跳過平躺的三角形，所以現在沒有端面。
  - 找端面的兩種方式：
    - (a) 相鄰切片相減：第 k 層頂面 = 內部(k) − 內部(k+1)，底面 = 內部(k) − 內部(k−1)。缺點是斜面每層都會留下一圈細環，等於把斜面也填了。
    - (b) 用法向量接近 ±Z 的三角形投影到 XY。只會填真的水平面。
    - 建議 (b)，或 (a) 加上「環寬小於 N 倍填充間隔就略過」的門檻。
  - 填充：沿用 `outputLayerFillGcode`（`toolpath-exporter.cpp:1327-1616`），在 `flushBucket` 的打線分支旁加一個 caps 清單，填進 `layer_filled_polygons_` 後呼叫。要注意它的進度計數、`polygons_mutex_`、以及會用圖層的速度與功率。
  - 不重複雕刻輪廓：填充區域往內縮半個填充間隔。

### 6.4 P2-5 預設參數

- 程式裡目前沒有超出 30–200kHz 的 UV 預設參數；`3c2be3287` 把量測值低於 40kHz 的改成 40。2026-10-22 確認那三組維持 40kHz，頻率不改。
- PLA 每行停留：`applyPreset`（`helpers/layer/layer-config-helper.ts`）對預設參數沒寫的 key 會保留圖層原值（`fillDwellTime` 不在 `forcedKeys`），所以只在 PLA 寫 50000 時，先選 PLA 再選別組仍會留著 50000。因此每組 `fpm1_2_5` 都寫 `fillDwellTime`：PLA 50000，其他 -50000（負值 = 關閉，和 `getDefaultConfig` 的預設相同，再打開時回到 50000）。`presets.spec.ts` 檢查這個規則。

### 6.5 P2-6 打散掃描順序

- Swiftray 不限機型，只要圖層有 `data-fillInterleave` 就生效（`toolpath-exporter.cpp:66-103`、`1443-1452`）；只作用在 2D 填充，不作用在 STL。
- 前端：進階設定（`AdvancedSettingModal.tsx`）的打散掃描順序與每行停留改用 `useIsPromarkUV()` 判斷，不再看 uvDev；2D 材質測試（`TableSetting.ts`）同樣改為 UV 就有。

### 6.6 P2-7 `machine_z_bucket`

- 目前 bucket **同時套用到打點與打線**：打線的每層切片也是放進 `buckets[bucketKey(machineZ(z))]`（`toolpath-exporter.cpp:1204-1208`）。bucket 大於層距（約 0.04 / 折射率 ≈ 0.027mm）時，相鄰的切片會被合併到同一個 Z，失去深度解析度。
- 改法：打線的切片不分桶，每層直接用自己的機器 Z；打點仍用 bucket。
- 打點時 Z 移動次數 ≈ min(不同 Z 的數量, Z 範圍 / bucket)，每次約 50ms 加上移動時間（`Swiftray src/constants.h:65`、`src/promark_timing.h:55-70`）。0.001 → 0.01 理論上 Z 移動次數最多減少 10 倍；代價是同一桶的點最多有 0.01mm 的焦點誤差。
- 預設值：Phase 1 已改為 0.01mm（Swiftray `af385ca`）；前端的 localStorage 覆寫維持 uvDev。
- 打線不分桶尚未做：目前層間距（約 0.027mm 機器 Z）大於 0.01，相鄰切片不會被合併，只有層間距小於 bucket 時才有影響。

### 6.7 P2-11 UV 70mm 場域 70 / 75

- 目前 `setField` 依「目前開啟的文件」判斷是否為 UV，UV 70mm 送 75（`getPromarkFieldWorksize`，`promark-constants.ts:36-37`）；開著其他機型的文件連線時會送 70。
- 要確認 UV 能否直接用 70；若改成 70，既有以 75 校正的參數要轉換（例如 scale × 75 / 70）或重新校正。
- 多組場鏡（[`promark-lens-profiles.md`](../promark-lens-profiles.md)）之後，worksize 應依組別的雷射源與工作範圍決定，不再依目前開啟的文件；多組場鏡的 PR 維持現狀，由本項處理。

---

## 7. Data contracts

| 位置 | 欄位 | 說明 |
|---|---|---|
| 圖層 `data-stlFillCaps` | `'1'` / 無 | P2-4，名稱待定；`sanitize.js` |
| .beam 新區塊 | 照片轉 3D 的去背圖與深度圖 | P2-3，id → 檔案 |
| 照片物件屬性 | 深度、銳化、半徑、收邊 | P2-3，物件或圖層參數待定；`sanitize.js` 的 `image` 清單 |
| Swiftray `-machine-z-bucket` | mm | P2-7，預設 0.01（Phase 1 已改） |
| `fpm1_2_5` 預設參數 `fillDwellTime` | µs，負值 = 關閉 | P2-5，PLA 50000，其他 -50000 |

---

## 8. Performance

- P2-3：點數與點間距平方成反比。以點間距 0.03mm、100mm 寬的照片估計約 100 萬點，前端計算、3D 顯示、BSPC 大小與 Swiftray 工時都要量測。邊緣處理與收邊會再多 30–50%。
- P2-3 重新計算（§6.2.6）：量測改銳化 / 點間距（重跑 dither 與投影）的耗時，以及主執行緒被佔用的時間，確認放進 Worker 後操作畫布不卡。

---

## 9. Rollout — PR plan

Phase 2 branch：`promark-3d-inner-carving-phase2`（從 Phase 1 branch 切出；Phase 1 合併到 main 後改以 main 為基底，用 merge 同步）。

和多組場鏡參數（[`promark-lens-profiles.md`](../promark-lens-profiles.md)）互相獨立：兩邊都依賴 Phase 1，但沒有共用檔案，可以各自開 PR、不分先後合併。多組場鏡在 branch `promark-lens-profiles`（`98845f705`）。

| # | 內容 | Repo |
|---|---|---|
| PR-B | P2-2 3D 多選 | Beam Studio |
| PR-C | P2-3 照片轉 3D | Beam Studio、flux-id、Swiftray（過近點過濾） |
| PR-D | P2-4 填充上下端面 | Beam Studio、Swiftray |
| PR-E | P2-5 預設參數、每行停留與打散掃描順序開放 | Beam Studio |

---

## 10. Open decisions

**P2-1 多組場鏡參數**
- #1–#7 移到 [`promark-lens-profiles.md`](../promark-lens-profiles.md) §10（2026-10-19），本表其餘編號不變。

**P2-2 3D 多選**
8. ~~多選時的旋轉~~ 2026-10-22：依 2D 慣例以整體中心旋轉，EstherFu 上機確認手感；UI 確認後必須逐一驗算新角度與位置（§6.1、§12）。~~填充開關~~ 不適用：Phase 1 起 3D 物件的加厚輪廓是圖層參數，物件面板沒有填充開關。
9. ~~框選、3D 對齊與分佈~~ 2026-10-22：框選要做，對齊與分佈不做。2026-10-22：Shift + 點物件改為加入 / 移除選取，其他手勢不變。框選的觸發手勢待定：左鍵拖曳空白處是旋轉視角，Shift / Ctrl / Cmd + 左鍵拖曳是 OrbitControls 內建的平移。

**P2-3 照片轉 3D**
10. 收邊預設值：~~正式功能的預設值~~ 2026-10-19 決定收邊用 uvDev 擋住，一般使用者固定 0；uvDev 下建議 4mm（物件寬的 4%），需上機比較 0 / 2 / 4 / 6mm 後決定是否開放。
11. 點數上限與過近點門檻：點間距 0.03mm 時一張照片約百萬點，上限多少？Swiftray 略過的門檻是點間距的幾倍？
12. ~~可調參數放物件還是圖層？~~ 2026-10-19：點間距沿用圖層，深度（Z 軸厚度）與銳化放物件。
13. ~~確認視窗要不要提供選項？~~ 2026-10-19：提供「是否去背」與「銳化強度、半徑」，其他參數固定。是否加上去背結果預覽仍待定。

**P2-4 填充上下端面**
14. 「端面」的定義：只有水平面（法向量），還是所有向上 / 向下露出的面？階梯形物件中間的水平面算不算？
15. 填充間隔共用圖層的 `fillInterval`，還是另開一個參數？開關放圖層還是物件？

**P2-5**
16. ~~要重測的是哪三組預設參數？~~ 2026-10-22：三組維持 40kHz；另外 PLA 加每行停留 50000µs，其他 UV 平面預設參數寫入關閉值（§6.4）。

**P2-3 照片轉 3D（續）**
17. 不去背時扣點是否減少（例如 0.06 → 0.04）？flux-id 端怎麼區分計價？
18. 「是否去背」的預設：依原圖透明像素自動判斷，還是一律預設勾選？透明像素比例的門檻多少？
19. 重新計算的「更新中」提示：放在物件上、物件面板、還是兩者？重算超過幾秒要改成可取消的進度視窗？

**P2-11**
20. UV 70mm 改用 70 之後，既有以 75 校正的參數用換算，還是要求重新校正？

---

## 11. Risks & follow-ups

- **照片轉 3D 的點數**：百萬點級的點雲對前端顯示與 Swiftray 工時都是壓力，需要先量測。
- **收邊只測過 4mm**，而且是在寬 100mm 的條件下，其他尺寸要以比例換算。
- **端面填充的能量累積**：端面填充的密度遠高於輪廓，可能在內雕材料中造成裂痕，要上機測試間隔下限。
- **Z 分桶 0.01mm**：同一桶的點有最多 0.01mm 的焦點誤差，細節是否可接受要上機比較。
- **測試結果紀錄**：P2-6、P2-7 的上機結果記錄在本節。

---

## 12. Test plan

- **單元測試**：
  - P2-2：`SelectionManager.spec`（內雕多選不建 tempGroup）、`selectedElementStore.spec`（`stl_multi`）、`InnerEngraving/utils/selection.spec`（同步、Shift + 點、圖層）、`ObjectPanel.spec`（多選面板）、`DimensionPanelStlMulti.spec`。
  - P2-2 旋轉驗算（`groupTransform.spec`）：對含 flip、非等比 scale、多軸旋轉、接近萬向鎖的物件，比較變換後網格八個角的世界座標與直接套用 delta 矩陣的結果（相對容差 1e-6）；涵蓋面板的旋轉、縮放、翻轉、組合，gizmo 拖曳的位移、旋轉、縮放，六次 60° 轉回原位，以及 undo 一步還原。
  - P2-5：`presets.spec.ts`（只有 PLA 開每行停留）、`layer-config-helper.spec.ts`（PLA 之後套其他預設參數會關閉）、`AdvancedSettingModal.spec.tsx`（只有 UV 顯示）、`TableSetting.spec.ts`（UV 材質測試有兩欄）。
  - P2-3：dither、投影、收邊的純函式；銳化不改變點的 Z；去背預設值的判斷；重新計算時只套用最後一次的結果；`applyPhotoPointCloud` 的 undo；.beam 新區塊讀寫。
  - P2-4：圖層參數的讀寫與顯示規則（`getInnerEngravingBlocks.spec`）。
- **Swiftray**：端面偵測與填充、過近點過濾、打線不受 `machine_z_bucket` 影響（`tests/test_stl_utils.h`）。
- **手動測試**：§4 的每個情境；Desktop / MOPA 跑一次 §5 的回歸合約。
- **硬體測試**：
  - 照片轉 3D 實際雕刻，比較收邊 0 / 2 / 4 / 6mm。
  - 填充上下端面的方塊、圓柱，以及不同填充間隔。
  - PLA 每行停留 50000µs 的成品。
  - UV 70mm 以 worksize 70 / 75 各校正一次，比較標準圖形尺寸。
  - 打散掃描順序開 / 關的熱累積。
