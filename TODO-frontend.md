# UV 內雕 —— 前端開發紀錄

記錄前端實作過程中的決定、進度與待辦。與後端相關的部分標明 **【Backend】**。
（架構決定與完整需求見 `TODO.md`，本檔只記實作面的東西。）

---

## 核心概念：STL 3D 物件 vs 投影 rect —— 兩者要分開

一個 STL 物件由**兩個獨立的東西**組成，程式裡任何地方都不該把它們混為一談：

| | STL 3D 物件 | 投影 rect |
| --- | --- | --- |
| 是什麼 | mesh + 3D transform + 雕刻參數 | `svgcontent` 裡的 `<rect data-stl="1">` |
| 地位 | **source of truth** | **derived（衍生物）** |
| 存在於 | SVG DOM 之外，由 three.js 畫布 render | SVG DOM 內 |
| 幾何意義 | 真正的 3D 形狀 | 3D bbox 在 XY 平面上的**投影** |
| 為什麼需要 | 使用者實際編輯的對象 | 讓 selection / 圖層歸屬 / undo / 剪貼簿 / .beam 序列化 / `getVisibleElementsAndBBoxes` 全部沿用既有 svgedit 機制 |

**資料流方向是單向的**：3D 物件變動 → 重算投影 → 更新 rect 的 `x/y/width/height`。

⚠️ 投影 rect **不是可獨立編輯的幾何**。任何 2D 端的編輯（例如 DimensionPanel 的 XY 輸入框）都必須回寫到 3D 物件，再由 3D 物件重新投影，不可以直接改 rect。

⚠️ 旋轉 3D 物件會改變投影外框的大小，所以**每次 3D transform 變動都要重算投影**，不只是位移時。

兩者用 element id 串起來：rect 的 `id` 就是 .beam 檔 block 6 的 mesh key，也是送給 swiftray 的 `stlObjects` key。

---

## 進度

### ✅ Step 1：基礎建設（A-1 + TODO 第 1 點）

- **`app/svgedit/stl/constants.ts`**（新增）—— `STL_ATTR`
  - `data-stl`：標記投影 rect，值固定 `'1'`
  - `data-stl-matrix`：3D transform，column-major 4×4 矩陣，16 個數字空白分隔。**已把 mm → 0.1mm 的 ×10 併進矩陣**，consumer 直接套用，不需要自己判斷單位（B-4）
- **`app/svgedit/stl/getters.ts`**（新增）
  - `isStlProjection(elem)` —— 判斷是否為投影 rect
  - `isPlainRect(elem)` —— 判斷是否為「真正的」矩形（排除投影 rect）
- **`app/stores/selectedElementStore.ts`** —— `getNodeType()` 加入 `data-stl` → nodeType `'stl'`，位置在 tagName fallback **之前**（投影 rect 的 tagName 是 `rect`）；`canGroup` 排除 `stl`（群組會在父層 `<g>` 加 transform，3D 矩陣跟不上）
- **i18n** —— `ILang.topbar.tag_names.stl` + 23 個語系檔全部補上（由各語系既有的 `dxf` 值推導，例如 de `DXF-Objekt` → `STL-Objekt`）
- **`app/constants/workarea-constants.ts`**
  - `WorkArea.innerEngraving?: { maxMaterialHeight, zPrecision }` —— 用物件而非 boolean，比照 `AddOnInfo.curveEngraving` 的慣例，同時承載能力判斷與物理規格
  - `fpm1uv` 設 `{ maxMaterialHeight: 300, zPrecision: 0.001 }`
  - `supportInnerEngraving(model)` —— 把「硬體支援」與「feature flag」合成一個檢查，呼叫端只要一個判斷
- **`helpers/checkFeature.ts`** —— `checkInnerEngraving()`（= `checkFpm1UV() && isDev()`）。**刻意跟 Promark UV 機種本身分開 gate**，這樣 Promark UV 可以先出貨而不暴露未完成的內雕功能
- 驗證 —— 改動檔案 lint 乾淨、type check 無新錯誤；既有 `selectedElementStore.spec.ts` 19 tests 仍全過（未改動）

---

### ✅ Step 2：垂直切片（模式切換 → 3D 畫布 → 匯入 STL → 拖拉）

**狀態**

- `interfaces/Preference.d.ts` / `beambox-preference.ts` / `documentStore.ts` —— 新增 `inner-engraving` document state
  - ⚠️ documentStore **沒有**用機種能力去正規化這個值（rotary 有做）。因為 `workarea-constants` 已經 import documentStore，反向 import 會造成循環依賴，且 `getInitDocumentStore()` 在 module init 時就執行，import 順序一變就會拿到未初始化的 binding
  - 改由 `helpers/innerEngraving.ts` 的 `isInnerEngravingActive()` / `useInnerEngravingActive()` 合併兩個條件。**呼叫端一律用這兩個，不要直接讀 `inner-engraving`**
- `app/stores/stlStore.ts` —— STL 3D 物件的 runtime store（geometry + matrix + 選取狀態）。`remove` / `clear` 都有 `geometry.dispose()`，three.js 不會自動釋放 GPU buffer

**座標系**

`InnerEngraving/utils/coordinates.ts` 是**唯一**做座標轉換的地方，之後要改決定只需改這一個檔案。目前實作採 TODO B-4 的建議版本：

- 場景維持**右手系 Z-up**（X 右、Y 向場景後方、Z 上），單位 0.1mm，原點 (0,0,0)
- 「Y 向下」用相機視角達成，不改座標系手性 —— 避免匯入的 STL 左右鏡像、法線反轉、旋轉方向相反
- 邊界只有一次轉換 `y_scene = -y_svg`；rect 屬性、面板顯示、送後端的值全部維持 SVG 慣例
- ⚠️ 這是**我依 B-4 討論做的假設**，若最終決定場景本身就要是左手系，改 `coordinates.ts` 並處理鏡像/法線/旋轉三個副作用

**投影**

`InnerEngraving/utils/projection.ts` —— `updateProjectionRect()` 是 3D → rect 的**唯一**寫入點，維持單向資料流。

- 用「transform 後的 AABB」算投影，旋轉時會比真實輪廓略大。刻意選保守方向：framing 和對齊寧可包住物件也不要切到
- `serializeMatrix` / `parseMatrix` 對應 `data-stl-matrix`

**匯入**

`app/svgedit/operations/import/importStl.ts` —— 解析 STL → 建立 3D 物件（store）與投影 rect（current layer），初始置中於工作區、底面貼齊 z=0。

- undo/redo：`InsertElementCommand` 加上 `onAfter`，依 rect 是否還在 DOM 來同步 store（mesh 不在 DOM 裡，undo 不會自動處理）
- 入口在 `svg-editor.ts` handleFile 的 `.stl` 分支

**畫布**

`InnerEngraving/InnerEngravingCanvas.tsx` —— r3f Canvas + OrbitControls + TransformControls（translate）。

- **SVG 畫布保持 mounted，只加 `visibility: hidden`**（`SvgEditor.module.scss` 的 `.hidden`）。svgcontent 還存著圖層與投影 rect，不能 unmount。這跟 PathPreview 隱藏 `#svg_editor` 的既有做法同一個思路
- 拖曳中只寫 rect DOM、**不寫 store** —— 寫 store 會經由 effect 把矩陣回灌，跟 gizmo 打架。放開滑鼠才 commit
- TransformControls 需要已解析的 Object3D，所以用 callback ref 而非 `useRef`

**開關**

`DocumentSettings/InnerEngravingBlock.tsx` + `index.tsx` —— 只有 switch，齒輪與 InnerEngravingSettings 是 TODO 第 3 點。與 rotary / pass-through / auto-feeder 四者互斥已接上。

**i18n** —— `document_panel.inner_engraving`，zh-tw / zh-cn 已譯，其餘 21 語系先放英文待翻譯。

---

## 待辦（依建議順序）

### Step 3 以後

第 2 / 3 點 dialogs → 第 6 點右面板 → A-2 存檔（block 6）→ 第 7 / 8 點選單與 Banner → **A-3 接後端（等後端）**

---

## 已知延後項目

### A-1 的 14 個 tagName 分派點 —— 逐步處理，不是漏掉

`TODO.md` A-1 表格列的 14 處，目前**只做了 `getNodeType` 這個主入口**。其餘刻意延後，理由：

- **右面板三處**（OptionsPanel / ActionsPanel / DimensionPanel）→ 需要 3D 版元件才有東西可切換，隨 TODO 第 6 點一起做
- **破壞性轉換四處**（booleanOperation / pathActions / convertToPath / convertClipPath）→ 進入點會在內雕模式停用（第 7 點），等 UI 停用做完再補防呆
- **transform 兩處**（recalculate / coords）→ 投影 rect 是衍生物，被誤改也會在下次投影時自我修復，優先度低
- **`canvasElements.ts`** → 那是靜態的 tagName 字串清單，沒辦法在常數層排除單一元素，要在**消費端**用 `isStlProjection` 擋，隨各消費端處理

每處補上時，用 `isStlProjection()` 或 `nodeType === 'stl'`，不要散寫 `getAttribute('data-stl')`。

---

## 測試待辦

**實作期間不動測試檔**，只在這裡累積測項，之後一次處理。
每次改動若讓既有測試失效，也記在這裡（不要就地改掉）。

### 待新增

| 檔案 | 測項 | 來源 |
| --- | --- | --- |
| `app/stores/selectedElementStore.spec.ts` | 投影 rect（`<rect data-stl="1">`）→ `nodeType` / `nodeCategory` 應為 `'stl'`，且 `canGroup` / `canUngroup` / `canUngroupOrDisassemble` 皆為 `false`。重點是**不能**被判成 `rect` / `shape` | Step 1 |
| `app/svgedit/stl/getters.spec.ts`（新檔） | `isStlProjection()`：有 `data-stl` → true、一般 rect → false、null / undefined → false。`isPlainRect()`：一般 rect → true、投影 rect → false、非 rect → false | Step 1 |
| `app/constants/workarea-constants.spec.ts` | `supportInnerEngraving()`：`fpm1uv` + flag 開 → true、`fpm1uv` + flag 關 → false、其他機種 → false（需 mock `checkFpm1UV`） | Step 1 |
| `helpers/innerEngraving.spec.ts`（新檔） | `isInnerEngravingActive()` / `useInnerEngravingActive()`：只有「preference 開 **且** 機種支援」才 true。重點情境是「在 Promark UV 存的檔案在別台機器開啟」不該進內雕模式 | Step 2 |
| `InnerEngraving/utils/projection.spec.ts`（新檔） | `serializeMatrix` / `parseMatrix` round trip；`parseMatrix` 對 null / 長度不符 / NaN 回 identity；`getProjection` 的 Y 翻轉（scene y 最大值 → rect 的 y）；旋轉後 AABB 比真實輪廓大（保守方向） | Step 2 |
| `InnerEngraving/utils/coordinates.spec.ts`（新檔） | `svgToSceneY` / `sceneToSvgY` 互為反函數；`MM_TO_SCENE` = `constant.dpmm` | Step 2 |
| `svgedit/operations/import/importStl.spec.ts`（新檔） | 匯入後同時產生 store 物件與投影 rect（id 相同）、rect 帶 `data-stl` 與 `data-stl-matrix`、初始置中且底面在 z=0；**undo 後 store 物件也要被移除**（mesh 不在 DOM 裡，這是最容易壞的地方） | Step 2 |
| `DocumentSettings/index.spec.tsx` | 內雕開關的顯示條件（只有支援的機種才出現）、與 rotary / pass-through / auto-feeder 的四向互斥、`handleSave` 寫入 `inner-engraving` | Step 2 |

### 待修改 / 待確認

| 項目 | 內容 |
| --- | --- |
| `src/__mocks__/@core/app/stores/documentStore.ts` | **既有缺口**：這個 mock 少了 `prespray_times`，現在又多缺 `inner-engraving`，type check 會報錯（jest 本身沒有 type check 所以測試還是會過）。補測試時一起處理 |
| `src/__mocks__/@core/helpers/is-dev.ts` | **既有缺口，與本次改動無關**：mock 只 export 了 `isDev`，缺 `isUvDev` / `uvModel` 等，導致任何（間接）import `promark-constants` 的 spec 直接掛掉 —— `DocumentSettings/index.spec.tsx` 目前就是這樣失敗的。要補 DocumentSettings 的測試前得先修這個 mock |

Step 1 的 `tag_names` 新增 key 已確認沒有 snapshot 引用到。

### 待刪除

（目前無）

---

## 【Backend】需要同步給後端的事項

投影 rect 的屬性已經實作出來了，這是 B-1 / B-4 的具體格式：

```xml
<rect id="svg_42" data-stl="1" data-stl-matrix="10 0 0 0 0 10 0 0 0 0 10 0 350 -350 12.5 1"
      x="100" y="-450" width="500" height="500" fill="none" stroke="#000" data-stl-name="model.stl" />
```

- **`data-stl="1"`** —— 標記這是投影 rect，**toolpath-exporter 必須認得並跳過**，否則每個 STL 物件會多雕一個矩形外框（B-1）
- **`data-stl-matrix`** —— column-major 4×4，16 個數字空白分隔。這是 mesh 空間（mm）到場景空間（0.1mm）的完整變換，**×10 的單位換算已經併在矩陣裡**，後端直接套用，不要再自己判斷單位（B-4）
- **`id`** —— 同時是 `stlObjects` payload 的 key 與 .beam block 6 的 mesh key（A-2 / A-3）
- **`x` / `y` / `width` / `height`** —— 3D bbox 的 XY 投影，SVG 慣例（Y 向下），單位 0.1mm。**這是衍生值，後端不需要用它做任何幾何判斷**，只有前端的對齊 / framing 會讀
- `data-stl-name` —— 只是 UI 顯示用的原始檔名，後端可忽略

座標系採 B-4 建議版本：場景右手系 Z-up，對外（rect 屬性、送後端的值）一律 SVG 慣例 Y 向下、單位 0.1mm、原點 (0,0,0)。

---

## 怎麼試

1. DevTools console：`localStorage.setItem('uvDev', 'true')`（或 `enableAllMachines`），重開
2. 文件設定 → 工作區域選 **Promark UV** → 打開「FLUX 水晶內雕」→ 儲存
3. 匯入一個 `.stl` 檔 → 3D 畫布出現模型，點選後可用 gizmo 拖曳
4. 切回 2D（關掉內雕）可以看到對應的投影 rect 出現在圖層裡
