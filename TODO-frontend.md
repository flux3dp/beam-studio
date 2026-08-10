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

`InnerEngraving/utils/coordinates.ts` 是**唯一**做座標轉換的地方，由 `useRevY` 這個 flag 控制。相關的四個地方都走它：`svgToSceneY` / `sceneToSvgY`（基本轉換）、`sceneYTopEnd`（bbox 的哪一端是 SVG 的上緣，投影 rect 的 y 與 gizmo 錨點都用它）。

### ✅ 座標系已定案，測試 flag 已移除

實測後採用：**場景 X/Y 就是 SVG 座標（不做任何反向）、Z 向上、單位 0.1mm、原點 (0,0,0)**。`svgToSceneY` / `sceneToSvgY` / `sceneYTopEnd` / `useRevY` / `useSwapXY` / `sceneRotationZ` 全部移除，`coordinates.ts` 現在只剩 `MM_TO_SCENE`。

相機在 −Y 側看向 +Y、up 為 +Z，所以 +X 在畫面右側、場景右手系、不會鏡像。代價是 **3D 俯視圖相對 2D 畫布上下顛倒**（3D 的 y=0 在近端、2D 的 y=0 在遠端）—— 這是換取 gizmo 箭頭與面板 Y 數值一致的刻意取捨。

兩者的關係是 `y_canvas = workarea_height − y_scene`。**這個轉換由前端在投影那一步做掉**（Step 11 改的，先前是打算交給後端），詳見文末【Backend】章節。

**關鍵：`camera.up` 必須在 `onCreated` 裡設，不能走 `camera` prop。** r3f 會先套 prop 再定向相機，較晚設定的 `up` 來不及參與，相機的 rotation 仍然是照預設的 Y-up 建出來的 —— 畫面看起來幾乎正常，但 **TransformControls 的軸會歪掉**，這正是先前一直修不好的箭頭問題。在 `onCreated` 裡設 `up` 再重跑一次 `lookAt`，方向才會用正確的 up 重建，OrbitControls 之後每次 update 也讀同一個 `up`。

```tsx
onCreated={({ camera }) => {
  camera.up.set(0, 0, 1);
  camera.lookAt(...center);
}}
```

其餘連帶調整：gizmo 錨點角落改成三軸都取 `min`、TransformControls 改回 `space="world"`（工作區軸向才是「沿 X / Y / Z 移動」的意思）。

<details>
<summary>以下為 flag 移除前的探索紀錄，保留脈絡</summary>

`useRevY` 是**完整的場景層開關**，兩種設定各自是一個能直接對比的完整場景：轉換函式、投影 rect 的上緣、gizmo 錨點角落、打光、預設相機都跟著它走。改完要重新載入（相機參數只在 canvas mount 時讀一次）。

**相機一律待在場景 −Y 側**（`svgToSceneY(height / 2) - height * 1.5`），所以兩種設定 **X 都在畫面右側、都不會鏡像**。這也修正了我先前的誤判 —— 之前相機跟著 `svgToSceneY` 跑到 +Y 側才會鏡像，那是相機擺放的問題，不是 `useRevY` 的本質。

flag 真正決定的是**2D 畫布的哪一條邊落在 3D 視圖的後方**：

| | `true` | `false`（目前） |
| --- | --- | --- |
| 場景 Y | 與 SVG Y 反向 | 跟隨 SVG Y |
| 畫布上緣（SVG y=0） | 在**後方**，原點在左後 | 在**前方**，原點在左前 |
| 3D 俯視圖 vs 2D 畫布 | 同一個方向 ✓ | **上下翻轉** |
| gizmo Y 箭頭 | 與顯示的 Y 數值**相反** | 與顯示數值**一致** ✓ |
| 手性 / 鏡像 | 右手系，無鏡像 | 右手系，無鏡像 |

兩者都是幾何上正確的呈現，**沒有「所見非所得」的問題**。要選哪一個取決於一個硬體問題：**機器的 Y 軸是往後為正（CNC/CAD 慣例，對應 `true`）還是往前？** 見 TODO.md 的 B-4。

已加 `axesHelper`（紅=X 綠=Y 藍=Z）方便比對。

### `useSwapXY`：把原點轉到左後

⚠️ **「互換 XY」本身是鏡像**（行列式 −1），跟旋轉組合起來仍是鏡像，模型會左右反過來。所以實作成**純旋轉**：繞 Z 轉 −90°，行列式 +1，不鏡像。

- 繞**工作區中心**轉，所以 orbit target 不用跟著改
- **只是 render 層的 group transform** —— store 的矩陣、投影 rect、送 swiftray 的 payload 全部維持未旋轉的慣例，不受影響
- TransformControls 改用 `space="local"`，箭頭跟著物件自身的軸而不是被轉過的世界軸（未旋轉時兩者等價，所以對現況無影響）

`useRevY = false` + `useSwapXY = true` 的結果：原點在**左後**，但 SVG X 變成朝觀察者、SVG Y 變成朝畫面右方 —— 版面等於整個轉了 90°，跟 2D 畫布對不上。

### ⚠️ 結論：旋轉不可能解決箭頭問題

實測確認 `useSwapXY` **不會改變物件控制的軸**，這是必然的，有兩層原因：

1. **render-only 旋轉本來就不會改**：gizmo 跟模型一起被轉（`space="local"` 用的是 `worldQuaternion`，含父層旋轉），兩者的相對關係不變。這正是它安全的原因 —— 它只改「站在哪裡看」，不改資料
2. **就算把旋轉烤進座標映射也一樣沒用，而且更糟**：旋轉保持手性，而箭頭與數值的落差是**手性衝突**（(X 右, Y 前, Z 上) 是左手系）。若真的把 `scene x = −svg y, scene y = svg x` 寫進映射，X 箭頭會變成控制 SVG Y —— 落差從一軸變成兩軸

**只有反射（也就是 `useRevY`）能改變箭頭與顯示數值的關係。** 所以：

- `useSwapXY` 只是**視角偏好**（原點要在哪一角），與箭頭無關，建議維持 `false` 除非有人真的偏好轉過的版面
- 箭頭問題完全由 `useRevY` + 硬體 Y 方向決定，見上方表格

</details>

> 後記：上面整段推論的前提是「箭頭問題源於座標系手性衝突」，實測證明**真正的原因是 `camera.up` 設定的時機**。手性的分析本身沒錯，但它不是這個 bug 的成因。

### ⚠️ Y 軸箭頭方向：這是座標系衝突，不是 bug

**實體三軸 (X 右, Y 後, Z 上) 是右手系，這正是 CNC / CAD 的標準。我們的場景就是這個。** 問題出在 **SVG 的 Y 是往前（下）**，剛好是 CAD Y 的反向。

所以 gizmo 的三個箭頭構成右手三元組，而 app 顯示的 (X 右, Y 前, Z 上) 是**左手**三元組 —— 任何旋轉都無法把右手三元組疊到左手三元組上，**必然有一軸的箭頭方向與顯示數值相反**。目前讓 Y 承擔這個落差，其他兩軸都對。

能挪但不能消除：

| 做法 | 代價 |
| --- | --- |
| 現況：Y 箭頭與顯示值相反 | X / Z 都正確；箭頭本身符合 CAD 慣例 |
| proxy 繞 Z 轉 180° | Y 對了，但 X 箭頭變成反的 |
| proxy 繞 X 轉 180° | Y 對了，但 Z 箭頭朝下 |
| 場景鏡像（負縮放） | 三軸都對，但面的繞向反轉、法線與打光錯誤，且 TransformControls 對負行列式的 decompose 行為不可預期 |
| `useRevY = false` | 三軸都對，但 3D 視圖與實機前後顛倒 —— 所見非所得，最危險 |

**建議的真正解法：內雕模式的 Y 數值改用機器 / CAD 慣例顯示（往後為正）。** V1 內雕模式不支援 2D 物件，畫面上不會同時出現兩套 Y，所以沒有不一致問題，箭頭與數字就會一致。這是 UI 決定，待確認。

目前實作採 TODO B-4 的建議版本：

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

**人工 review 回應（InnerEngravingCanvas 第一輪）**

- 「從上往下只看得到灰色，要從下往上才看得到網格」→ 其實是**兩個疊在一起的問題**：
  1. **顏色被 tone mapping 吃掉**。r3f 的 `<Canvas>` 預設開 ACES filmic tone mapping，`#ffffff` 的地板經過它會被壓成灰色 —— 「灰色」就是地板本身。已加 `flat`（NoToneMapping），現在寫什麼色就是什麼色，可以跟 2D 畫布對齊
  2. **地板與網格共平面**（都在 z=0）。線與三角形的光柵化深度值不完全一致，是否被 depth test 擋掉會隨視角而變（wireframe-over-surface 的典型症狀）。第一次用 `polygonOffset` 沒解決，改成**幾何分離**：地板下沉到 `FLOOR_Z = -2`（0.2mm），網格與尺規維持在 z=0（對焦原點）
  - 順帶：camera 從 `near: 1` / `far: max×100` 收成 `near: 10` / `far: max×20`，深度精度差了兩個量級，本來就容易 z-fighting
  - 地板材質改用 `meshBasicMaterial`（不受打光影響），符合「工作範圍內白底 #fff」的規格
- 「GRID_STEP 是否可以隨縮放調整」→ 可以，已做 `useAdaptiveStep`：依相機到工作區中心的距離，從 `GRID_STEPS`（1 / 5 / 10 / 50 / 100mm）挑一個，讓畫面上大約維持 20 格。只有跨越門檻時才 setState，不會每幀 re-render。網格與尺規共用同一個 step
- 「需要可以隨 3D 畫布一起縮放旋轉的 ruler」→ 已做 `FloorRuler`，刻度在工作區的上緣與左緣（對齊 2D 畫布尺規的位置），**活在 scene 裡**所以會跟著縮放旋轉
  - 標籤用 drei `<Html transform>`（真 DOM 定位在 3D 空間）而不是 drei `<Text>`：專案裝的 troika 0.52 **沒有內建預設字型**（`defaultFontURL: null`），`<Text>` 會需要另外打包字型檔；DOM 標籤直接沿用 app 既有字體
  - ⚠️ `LABEL_SCALE` 是憑經驗給的，需要實機看過再調整字級
- 「ruler 也要顯示 Z 軸」→ 已加，從原點角落往上，含一條垂直軸線。⚠️ **Z 的範圍暫時借用 `max(width, height)`**，等第 3 點的材料設定做好要換成材料高度
- 「gizmo 出現在物件的左下角，y 在大的一端」→ 兩個原因疊在一起：
  1. TransformControls 綁在 mesh 上，gizmo 就落在 **STL 檔自己的原點**，而那是建模者隨手留下的位置，不同檔案會跑到不同地方
  2. y 的方向確實如你所判斷 —— scene Y 與 SVG Y 反向，所以 mesh 的 y 最小端在畫面上是 SVG 的 y 最大端
  - 修法：mesh 外包一層 `<group>` 當 **anchor**，gizmo 綁 group。anchor 取 bbox 的 (min.x, **max.y**, min.z)（mesh 空間），對應到使用者看到的「SVG x 最小、y 最小、z 最低」那個角，跟 app 用左上角當物件位置的慣例一致
  - ⚠️ **store 與 `data-stl-matrix` 存的仍然是「mesh 空間 → 場景空間」**，anchor 只存在於 render 層。`toAnchorMatrix` / `toMeshMatrix` 負責兩邊換算 —— 這點不能破壞，否則送給後端的矩陣會對不上原始 STL binary
  - 附帶好處：之後加旋轉 / 縮放時，會以這個角為基準，而不是 STL 檔的任意原點

⚠️ 以上都通過 build / type check / lint，但**尚未實機目視確認**

**畫布功能（第二輪 review 後）**

檔案拆開了：`constants.ts`（顏色與尺寸）、`viewStore.ts`、`CanvasControls.tsx`、`SceneRuler.tsx`、`StlMesh.tsx`、`ViewController.tsx`、`InnerEngravingCanvas.tsx`。

- **地板外擴** —— `FLOOR_MARGIN = 10mm`（constants）
- **尺規** —— X 軸刻度與文字改到 −Y（往工作區外），不再壓在工作區上。文字大小改成 `step × LABEL_SCALE_RATIO`，因為 step 本身是從相機距離挑的，所以**縮放時字在畫面上維持差不多大**
- **Dummy 材料方塊** —— 工作區footprint × 150mm 高，半透明淺灰 + `<Edges>`，`raycast={() => null}` 所以不會擋住點選。⚠️ 尺寸 / 形狀 / 位置要換成 InnerEngravingSettings 的設定值（TODO.md 第 3 點）
- **圖層顏色** —— `utils/useLayerColor.ts`，用跟 `updateElementColor` 相同的邏輯（layer 的 `data-color`，受 `use_layer_color` 偏好控制），訂閱 `useLayerStore` 讓圖層變動時重繪
- **選取表示** —— 不再變色，改成顯示 `BoundingBox`，外框用 `#0000FF`（對齊 `svgedit/selector.ts` 的 2D 選取框顏色）
- **`BoundingBox`** —— 搬到 `app/widgets/three/BoundingBox.tsx`，補上型別（`helperRef` 改 `BoxHelper`、`color` 改成 prop）
- **相機控制** —— `ViewController` + `CanvasControls`：等角 / 上 / 前 / 後 / 左 / 右六個預設視角、正投影 vs 透視、重置鈕（`view.nonce` 讓重複點同一個視角也會回正）
- **物件控制** —— translate / rotate / scale 用按鈕切換，**gizmo 錨點從 bbox 角落改成 bbox 中心**，旋轉與縮放才會繞物件中心

⚠️ 正投影用 drei `<OrthographicCamera makeDefault>` 疊在預設相機上，unmount 時 drei 會還原 —— 這樣透視路徑（含 `onCreated` 的 up 修正）完全不動。ortho 的 `zoom` 目前寫死 1，需要實機調。

**開關**

`DocumentSettings/InnerEngravingBlock.tsx` + `index.tsx` —— 只有 switch，齒輪與 InnerEngravingSettings 是 TODO 第 3 點。與 rotary / pass-through / auto-feeder 四者互斥已接上。

**i18n** —— `document_panel.inner_engraving`，zh-tw / zh-cn 已譯，其餘 21 語系先放英文待翻譯。

---

### ✅ Step 3：送工作帶上 `stlObjects`（A-3 上半）

後端 `TODO-backend.md` G 節已按 **base64** 實作完成，前端照這個介面接上去。

- **`stlStore` 的 `StlObject` 新增 `buffer: ArrayBuffer`** —— 匯入時的原始檔案 bytes。
  刻意保留原始 buffer 而不是把 `geometry` 重新序列化成 STL：送後端（A-3）與 .beam block 6（A-2）都要的是**同一份**檔案，重新序列化等於同一個物件出現兩份 mesh
- **`app/actions/beambox/export/getStlObjects.ts`**（新增）—— 產出 `{ [投影 rect 的 id]: base64 }`
  - 以 **`#svgcontent [data-stl]` 為準**（不是直接倒 store），所以刪掉 / undo 掉的物件不會夾帶 mesh 進 payload
  - 找不到對應 mesh 時 `console.error` 並跳過該物件（兩半失去同步的徵狀，要看得見）
  - base64 用 `FileReader.readAsDataURL`，不用 `btoa(String.fromCharCode(...))` —— 後者大 mesh 會直接爆參數上限，改 chunk 又會卡住 main thread 幾十毫秒到幾百毫秒
- **`IWrappedSwiftrayTaskFile.stlObjects?`** + `generateUploadFile` 帶上（沒有 STL 物件時是 `undefined`，一般工作的 payload 完全不變）
  - 新增 `{ withStlObjects }` 參數，預設 `true`；**framing 明確傳 `false`**（見下方版本檢查那段）
- **`swiftrayClient.loadSVG`** —— `stlObjects` 是 params 的**頂層欄位**，不在 `file` 裡（已對照 `worker.cpp:79` 確認），所以在這裡把它從 wrapped file 拆出來
  - 回傳型別補上 `loadedStlObjects` / `failedStlObjects`，失敗時 `console.error`
  - `action()` 的 logger 會把 `stlObjects` 換成筆數，否則 log 會被幾十 MB 的 base64 塞爆

#### ⚠️ base64 是後端限制，不是選擇

`processBinaryMessage()`（`swiftray-server.cpp:124`）把整個 frame 用 `QString::fromUtf8()` 解碼，raw binary 一定會被破壞。base64 是純 ASCII，可以安全穿過 `action()` 既有的 binary 傳送路徑（payload > 4096 時送 `Buffer.from(dataString)`，那只是 JSON 文字的 UTF-8 bytes）。

代價是 4/3 膨脹：35MB 的模型 → 約 47MB 的 JSON 欄位。**真正的成本要實機量測**（JSON.stringify + Buffer 複製，記憶體大約是 base64 大小的數倍）。若量測後不可接受，再跟後端談「先送 JSON 宣告 id + 長度，再送 N 個 binary frame」的協定。

#### 版本檢查

`version-checker.ts` 新增 **`SWIFTRAY_SUPPORT_STL`**，⚠️ **暫定 `2.4.8`，後端確定版號後要改**（程式碼裡有 TODO 標記）。

檢查點在 **`handleExportAlerts.ts`**，跟 `PROMARK_ROTARY` 同一個位置、同一個寫法：

```ts
if (document.querySelector(`#svgcontent [${STL_ATTR.marker}]`) && !swiftrayClient.checkVersion('SWIFTRAY_SUPPORT_STL'))
  return false;
```

- **用投影 rect 存不存在當條件**，不看內雕模式旗標也不看機種 —— 「送出去的 svg 裡有沒有 `data-stl`」才是後端會不會需要 STL 支援的真正條件，跟 `getStlObjects()` 判斷的是同一件事
- 擋在**產生 payload 之前**，所以舊版 swiftray 不會白做一次幾十 MB 的 base64
- 舊版 swiftray 收到 `stlObjects` 只會**默默忽略**（多餘的 JSON 欄位），結果是「工作跑完但什麼都沒雕」，所以這個檢查不是選配
- 不支援時走既有的 `swiftrayClient.checkVersion()`，顯示 `wrong_swiftray_version_title / _message` 的升級提示，**不另外做新的錯誤訊息**
- 只有送工作路徑（GoButton）會經過 `handleExportAlerts`。framing（`fetchFramingTaskCode`）共用 `generateUploadFile`，但**framing 只需要投影 rect 的外框、不需要 mesh**，所以它傳 `{ withStlObjects: false }`，根本不會送出 `stlObjects` —— 也就不需要版本檢查，而且每次框選都省掉一次幾十 MB 的 base64

#### 尚未做（這一步刻意不做）

- **失敗的 mesh 沒有 UI 提示** —— `failedStlObjects` 目前只有 console.error，等 A-3 下半（折射率 / convert params）一起處理錯誤呈現

---

### ✅ Step 4：材料設定（TODO 第 3 點）

材料是**文件設定**，不是畫布物件 —— 不送後端（B-10：後端不做材料裁切）、不進 .beam（A-2），只用來告訴使用者工件在哪。所以走 documentStore + BeamboxPreference，跟 rotary 同一套。

- **`app/constants/innerEngraving.ts`**（新增）—— 形狀 enum、尺寸 / 位置 / 折射率的上下限與預設值，單位一律 mm
  - ⚠️ XY 上限**刻意不用工作範圍**（工件可以比 70×70 大，只是超出的部分雕不到），1000mm 只是輸入框的合理性上限，不是硬體限制
  - 高度上限**跟著機種**走 `workareaConstants[model].innerEngraving.maxMaterialHeight`
  - 折射率預設 1.52（K9 / 光學玻璃約 1.5168），範圍 1~3、小數 3 位
- **9 個 document state key**（`inner-engraving-shape` / `-width` / `-depth` / `-height` / `-diameter` / `-x` / `-y` / `-refractive-index`）—— `Preference.d.ts` + `beambox-preference.ts` 預設值 + `documentStore.ts`
- **`dialogs/InnerEngravingSettings.tsx`**（新增）—— 比照 `RotarySettings`，直接寫進 documentStore（不等 DocumentSettings 的 save），所以之後從畫布叫出來也能用
  - 圓柱 / 球體：直徑 + **聯動圓周**（跟 rotary 的 object_diameter / circumference 同一個寫法）
  - 切換形狀**不會清掉另一個形狀的尺寸**：儲存時只寫目前形狀真正用到的欄位
  - 球體的高度 = 液面高度，上限鎖在直徑（液體不可能高過球頂）
  - 折射率的 UnitInput **不能傳 `isInch`**，否則會被當長度換算
  - 底部常駐【手動對焦】警告 —— 機器讀不到 Z，對錯焦距是整件報廢

#### 材料位置用【中心】當錨點（已定案）

`inner-engraving-x/y` 存的是**材料中心**，不是 bbox 角落。理由：

1. **角落錨點會讓材料在改尺寸時漂離中心** —— 使用者調尺寸的頻率遠高於調位置，用角落每改一次尺寸就要重算 `(工作範圍 − 寬) / 2`。內雕本來就希望工件靠近視場中央，中心錨點是免費維持
2. **球體 / 圓柱根本沒有角落**，三種形狀有兩種的 bbox 角是虛構的點
3. 材料是治具不是畫布物件，不經過對齊 / framing / `getVisibleElementsAndBBoxes`，沿用左上角慣例買不到東西

UI：
- **Segmented 切換參考點**（中心 / 左下角）。⚠️ 「左下角」是**3D 視圖裡看起來的左下**，也就是 X/Y 都最小的那個角 —— 跟 2D 畫布稱為「左上角」的是同一個角（3D 俯視圖與 2D 上下顛倒，見前面座標系章節）
- 切換只是輸入時的換算，**store 永遠存中心**；`toAnchor` / `toCenter` 兩個函式負責換算，沒有第二個真相來源
- 小字同時顯示**範圍與中心**，所以不需要為了讀某個數字去切換參考點
- 【置中於工作範圍】按鈕，會讀 `customized-dimension`（工作範圍可自訂）
- 參考點的選擇**不持久化** —— 每次開啟都回到中心，強化「以中心為準」的預設心智模型
- **`DocumentSettings/InnerEngravingBlock.tsx`** —— 補齒輪，比照 RotaryBlock
- **畫布**：`utils/material.ts`（mm → 場景單位的**唯一**轉換點，`useMaterial` 訂閱、`getMaterial` 給只需讀一次的初始相機）+ `MaterialShape.tsx`（box / cylinder / sphere），`DUMMY_MATERIAL_HEIGHT` 已移除
  - 球體用 `sphereGeometry` 的 `thetaStart` 從**頂端截掉液面以上**的部分，而不是畫一顆完整的球 —— 液面以上不是工件，畫出來會誤導
  - 相機初始位置**只讀一次**材料高度，不訂閱：材料一改就重設相機會把使用者的視角拉走

**⚠️ 未做（PM 08/06 已決定）**：【初始對焦位置】設定不做，一律假設對焦在工作平台（z = 0），之後依實機回饋再加。目前只用上面那個警告文字提醒。

---

### ✅ Step 5：可加工範圍（安全距離 + 超出工作範圍的視覺）

#### 超出工作範圍的部分變灰

材料可以比工作範圍大（規格允許），但超出的部分**雷射到不了**。現在材料分兩種顏色畫：工作範圍內是原本的半透明藍，範圍外是 `rgba(218,218,218,0.4)` —— 跟 2D 畫布的非工作區域同一個灰，所以「灰色 = 雷射到不了」在兩個畫布是同一個意思。刻意不用危險紅：工件放不下而突出是正常的握持方式，不是錯誤。

作法是 **clipping planes，不是切幾何**：這幾個區域都是半空間的交集，正好是 clipping plane 能表達的，而且材料或工作範圍一改就自動跟上，不用重算 mesh。

- 需要 `gl={{ localClippingEnabled: true }}`（已加在 `<Canvas>`）
- 範圍外拆成**四個互不重疊的板塊**（前後兩塊在 X 上也有界），不是四個半空間 —— 重疊的話角落會被畫兩次，半透明材質下就是「角落比較深」
- 外框（`<Edges>`）只畫一次而且**不裁切**，所以工件的真實外形永遠看得到

#### 安全距離與可加工範圍

- **`inner-engraving-safety-margin`** —— document state，預設 4mm（xTool 的值），**dev 才看得到輸入框**（PM：DEV 允許自己設定）
- **`utils/engravable.ts`** —— 「可加工範圍」的**唯一定義**，三個東西同時界定它：材料 ∩ 工作範圍 ∩ 內縮安全距離
  - ⚠️ **圓柱 / 球體不是用 bbox 內縮**，而是取內接方形 / 內接立方體。圓柱 bbox 的四個角在工件外面，拿它當可放置範圍會把雕刻放到空氣裡。保守是刻意的，這是安全檢查
  - `isValid = false` 代表安全距離吃掉整個工件（工件太小或距離太大）。這是**合法設定不是錯誤**，呼叫端只是沒東西可以提供
- **【居中於可加工位置】與【自適應】** —— 先放 `CanvasControls.tsx`（之後搬 ObjectPanel），沒有選取物件或 `isValid = false` 時 disabled，disabled 時 tooltip 說明原因
  - ⚠️ **【自適應】允許放大，匯入時的 fit 只縮不放** —— 匯入的慣例是保留原始尺寸、只有放不下才縮；主動按【自適應】則是「我要這個工件能容納的最大尺寸」。兩者共用 `EngravableBox`，但縮放規則刻意不同
  - 縮放是**繞物件 bbox 中心的等比縮放**，所以 bbox 剛好等比例變化、旋轉不受影響
  - 扁平模型（某一軸 size = 0）不能參與 fit 的計算，否則 factor 會變成 Infinity / NaN
- **`utils/transform.ts`** —— `setObjectMatrix` / `moveObjectCenterTo`。⚠️ **任何在 gizmo 之外改 3D transform 的地方都要走這裡**：store 是真相來源，但沒有人代替投影 rect 訂閱它（`StlMesh` 只在拖曳中重投影），只寫 store 會讓 rect 過期，連帶 selection / 對齊 / framing / .beam 全部跟著錯
- **`importStl`** —— 初始位置改成**置中於可加工範圍**，並且**只縮不放**地縮到範圍內；沒有可加工範圍時退回原本的行為（置中於工作範圍、貼齊 z=0）且不做縮放
  - ⚠️ 目前是**直接自動縮**，TODO.md 第 4 點要的是【自適應縮放】彈窗詢問，程式碼已標 TODO

**i18n**：新增 `inner_engraving_settings`（14 個 key），23 個語系都補上，zh-tw / zh-cn 已譯，其餘先放英文。

⚠️ 以上通過 type check 與 lint，但**尚未實機目視確認**（形狀比例、球體截面、材料與 STL 的透明排序都要看過）。

---

### ✅ Step 6：物件面板（第 6 點的第一塊：按鈕分類 + 選取同步）

#### 按鈕怎麼分類（已定案）

三個方案裡選了**「全部放 actions，tool row 對 STL 完全不顯示」**，分界線是**作用對象**：

| | 是什麼 | STL |
| --- | --- | --- |
| `renderToolBtns` | **多個物件之間**的排列：對齊、分布、群組、布林 | ❌ 整塊不顯示 |
| `ActionsPanel` | **對單一物件**做某件事 | ✅【居中於可加工位置】【自適應】 |

理由：

- group / ungroup / boolean **3D 不支援**（`canGroup` 早就排除 `stl`）
- align / distribute 的 3D 版**現在沒有意義**：3D 畫布的選取是單選（`stlStore.selectedId`），沒有「多個物件」可以對齊或分布。等之後真的做多選再回來評估，屆時它們回到 tool row 才是對的位置
- 剩下的兩個按鈕都是**對單一物件的擺放**，正好是 actions 的定義
- 實務上也比較好看：tool row 是純圖示的密集網格（沒有適合的圖示就只能硬湊），actions 是「圖示 + 文字」，這兩個需要文字才講得清楚

**`ActionsPanelStl.tsx` 是獨立元件，不是 `ActionsPanel` 的一個分支** —— 2D 的每一個 action（描邊 / offset / weld / 轉路徑…）都是向量操作，跟 3D 沒有交集，硬塞進那支 734 行的 dispatch 只會互相污染。共用的只有 `ActionsPanel.module.scss` 與 mobile 的 `ObjectPanelItem`。

#### ⚠️ 順帶修掉的阻塞問題：選取沒有同步

原本 3D 畫布點選 mesh 只寫 `stlStore.selectedId`，**完全沒有動 svgedit 的選取**，所以右面板根本不會出現 —— 物件面板做了也用不到。這是 `importStl` 裡標了很久的 FIXME。

- **`utils/selection.ts` 的 `selectStlObject(id)`** —— 一次寫兩邊（store + `selectionManager`）。點 mesh、點空白處都走它
- **反向同步**在 `InnerEngravingCanvas` 用 effect 做：從圖層面板、undo 或任何動到 svgedit 選取的路徑，也要讓 mesh 亮起來
- 不會互相觸發成無限迴圈：兩邊寫入相同值都是 no-op

#### 一併擋掉的 2D 面板（A-1 表格的右面板三處）

- **`OptionsPanel`** —— 投影 rect 的 tagName 是 `rect`，不擋就會跳出 **RectOptions（圓角）** 和填充開關
- **`DimensionPanel`** —— 2D 版會去讀投影 rect 自己的 x/y/w/h，那是**衍生值**：改它等於改 rect，下一次重新投影就被蓋掉
- 兩處都留了 TODO 指向 3D 版（第 6 點剩下的部分）

---

### ✅ Step 7：transform history + DimensionPanelStl

#### ⚠️ 最關鍵的改動：transform 從「矩陣」改成「分解後的值」

`StlObject.matrix` 換成 `StlObject.transform = { position, rotation, scale, flip }`，矩陣變成**衍生值**（`utils/transform.ts` 的 `getMatrix()`）。

為什麼不繼續存矩陣、需要時再分解：

- **有鏡射時分解是歧義的** —— 負的行列式可以歸給任何一軸，three.js 的 `decompose()` 固定丟給 X。面板若每次 render 都分解，翻轉之後旋轉值會亂跳
- 面板要編輯的每一個欄位，現在都是**存起來的值**而不是推導出來的猜測

組合方式 `M = T(position) · R · S · T(−mesh 中心)`：

- **position 是物件中心**（不是角落），所以縮放與旋轉都繞中心，物件不會跑掉 —— 這也讓「改尺寸不影響位置」自動成立
- **mm → 0.1mm 的 ×10 與鏡射符號都在 S 裡**，送後端的矩陣不變
- `scale = 1` 代表 STL 檔的原始 mm 尺寸，所以【尺寸重置】就是 `scale = [1,1,1]`

畫布端跟著拆成兩層：**anchor group 帶 position / rotation / scale（三者都是正值，TransformControls 操作與讀回都不會有意外），內層 mesh 帶鏡射與「把 mesh 中心移到 group 原點」的位移**。鏡射時 `material.side = DoubleSide`，否則背面剔除會把模型挖空。

#### 3D transform 的 undo

- **`StlTransformCommand`**（`utils/transform.ts`）—— 比照 `SingleDocumentStoreCommand` 的寫法。mesh 不在 DOM 裡，svgedit 那些以元素為單位的 command 都載不動它
- `elements()` 回投影 rect，undo 之後編輯器仍拿得到可選取的東西
- 物件已被刪除（整個 import 先被 undo）時直接跳過 —— mesh 的生命週期屬於 import 那個 batch command
- **`setTransform()` 是唯一入口**：store、投影 rect、history 三件事一起做。gizmo 拖曳中不進 history（`addToHistory: false` 的語意），放開才記一筆

#### DimensionPanelStl

順序照要求：位置 XYZ → 重置 → 尺寸 XYZ → 等比鎖 → 重置 → 旋轉 XYZ → 重置 → 翻轉 XYZ。

- **軸向就是 3D 畫布的軸**（X 右、Y 遠離相機、Z 上），位置是**中心**
- **等比鎖放在 `viewStore`**，因為它是工具模式不是物件屬性 —— 它同時要約束畫布上的縮放 gizmo。gizmo 一次只拉一軸，鎖定時由「變化最大的那一軸」決定倍率再套用到三軸
- 等比鎖用**倍率**而不是複製數值，非等比的物件維持非等比
- 旋轉用歐拉 XYZ，標題直接寫出 `(XYZ)`，順序不用猜
- **翻轉是獨立的布林值**，不折進 scale，所以尺寸永遠是正數
- 【位置重置】= 可加工範圍中心（沒有可加工範圍時退回材料中心），不是場景原點 —— 場景原點對內雕沒有意義

**版面（最小 260px）**：一軸一列 = `12px 軸標 | 數值 | 56px 調整`，不是三個輸入框並排 —— 260px 下三欄每欄不到 70px 沒法用。調整欄固定寬，數值欄吃剩下的空間。

**軸標依 three.js 的軸色上色**（X 紅 / Y 綠 / Z 藍），面板的標籤與畫布上的箭頭是同一個東西。⚠️ 綠色從 three.js 的純 `0x00ff00` 調暗成 `#00a000` —— 純綠在白底上當小字幾乎看不清，色相沒變所以仍讀得出是同一軸。翻轉按鈕未啟用時也套同一組顏色。

**【依目前值調整】**（PM 要求）：每一列右側的窄輸入框，**按 Enter 才執行並清空**。

- 位置 / 旋轉是**加減**，尺寸是**乘以百分比**（輸入 120 = ×1.2，對應 PM 說的 `scale x * 1.2`）
- 刻意不在 blur 時執行：手滑點到別處不該讓物件跑掉；而且連按 Enter 可以重複微調
- 用純 `InputNumber` 而不是 `UnitInput` —— 這個欄位大部分時間是空的，且單位換算屬於呼叫端（它才知道手上是長度、角度還是百分比）。**inch 文件下位置的調整值會被當成 inch 換算**，百分比與角度則不換算

**重置回到「匯入時的樣子」，不是 STL 檔的原始值**：`StlObject.initialTransform` 記錄匯入當下的整個 transform，尺寸與旋轉的重置都讀它。匯入時若模型放不進可加工範圍會被縮小，那個縮小後的尺寸才是使用者一直看著的東西；回到檔案尺寸等於把物件彈回工件外面。

存整個 transform 而不只是 scale，是因為匯入本來就決定了不只一件事（縮放 + 置中），而且之後若要做**座標軸轉換 / 重新定位基準**（例如切換上方向、整個場景換軸），需要有地方記著「匯入時是什麼樣子」。

**三顆重置鈕都是「回到匯入時的樣子」**，位置也一樣讀 `initialTransform.position`，不重算可加工範圍中心 —— 重置如果把物件送到它從來沒去過的地方，那就不叫重置了。⚠️ 已知副作用：材料設定改過之後，匯入位置可能已經不在可加工範圍內。要回到**目前**的可加工範圍中心，用 ActionsPanel 的【居中於可加工位置】，那顆才是「算出現在該去哪」的按鈕。兩顆按鈕的分工要保持清楚。

**輸入框寬度**：antd 給 InputNumber 固定的預設寬度（90px），會無視所在的 grid 欄位 —— 260px 下數值欄會撐破格子、調整欄會比預留的 56px 寬。兩個輸入框都要明確設成填滿欄位（`styles.field`）。

### 旋轉三軸的數值會互相影響 —— 這是尤拉角的本質，不是 bug

依序繞三軸轉之後，最後一次旋轉通常會讓另外兩軸的顯示值也變動。原因是**旋轉不可交換**：一個 3D 姿態沒有「三個獨立的軸角度」這種東西，用固定順序的尤拉角去表示它，姿態一變就會在三個數字之間重新分配。

目前的狀況分兩半：

- **面板輸入是獨立的** —— store 存的就是尤拉三元組，改 X 只會寫 X。【依目前值調整】也一樣精確
- **gizmo 拖曳會耦合** —— 拖完之後我們是把姿態讀回來重新分解成 XYZ

能不能獨立？**最多兩軸，而且取決於 gizmo 用哪個空間**。我們的順序是 three.js 的 `'XYZ'`，也就是 `R = Rx·Ry·Rz`：

| 繞什麼轉 | 結果 |
| --- | --- |
| **世界 X** | `Rx(θ)·R` → 只有 X 變 ✓ |
| **物件自身 Z** | `R·Rz(θ)` → 只有 Z 變 ✓ |
| Y（任何空間） | 一定耦合 |

目前 `space="world"`，所以**世界 X 那一圈是乾淨的**，Y / Z 會重新分配；若改成 `space="local"`，乾淨的會變成 Z。中間軸永遠不可能獨立（Blender / Fusion 也是這樣）。

實務上的建議：需要精確角度時用面板或【依目前值調整】（例如 Z 填 90），gizmo 留給概略調整。若之後覺得還是難用，可以加**角度吸附**（每 15°）而不是去動分解方式。

⚠️ **尺寸顯示的是物件自身軸向的尺寸（base × scale），不是旋轉後的 AABB**。這跟 3D 工具的慣例一致，但與投影 rect 的 `width/height`（AABB）會對不上，看面板時要知道這是兩件事。

#### 順帶

`importStl` 改用 `selectStlObject()`，Step 6 之前那個「選取沒同步」的 FIXME 正式清掉。

---

## 待辦（依建議順序）

### Step 11 以後

**A-3 剩下的部分（下一步）**：折射率 `getExportOpt`、`stl_z_reversed`、`SWIFTRAY_SUPPORT_STL` 正式版號。接著是開檔流程要不要用 `readBeamFileInfo().innerEngraving` 詢問使用者、第 4 點的匯入預檢 / 進度條 / thumbnail、以及剖面預覽（第 5 點 V1）→ 第 7 / 8 點選單與 Banner → A-3 剩下的部分（折射率 `getExportOpt`、`stl_z_reversed`、`SWIFTRAY_SUPPORT_STL` 正式版號）

第 6 點的四個子項與依賴：

| 子項 | 依賴 | 備註 |
| --- | --- | --- |
| ~~DimensionPanel 3D 版~~ | ✅ Step 7 完成 | `DimensionPanelStl`，所有改動走 `setTransform()` |
| ~~OptionsPanel STL 版~~ | ✅ Step 8 完成 | 寫成投影 rect 的 attribute，後端「物件優先、圖層 fallback」 |
| ~~ObjectPanel 擺放按鈕~~ | ✅ Step 6 完成 | 放在 `ActionsPanelStl`，不是 tool row |
| ~~ActionsPanel 現有功能~~ | 討論後**不做** | 2D 專用，STL 不需要 |

A-1 的右面板三處分派已補齊（Options 仍是「擋掉 2D 版」，等 STL 版；Dimension 與 Actions 已是 STL 版）。3D transform 的 undo 也在 Step 7 完成，`setTransform()` 是唯一入口。

### ✅ Step 8：OptionsPanel STL 版（第 6 點完成）

雕刻模式（打線 / 打點）、填充、層高、點間距（只在打點模式顯示）。

**參數存在投影 rect 的 attribute 上，不在 stlStore 裡** —— 因為讀它們的是**後端**：rect 就是送去 swiftray 的 svg 字串裡的東西（A-3）。放在別處就等於多一條序列化路徑，而且放在 DOM 上 undo 直接沿用 svgedit 既有的 attribute command（`changeSelectedAttribute`），不需要像 3D transform 那樣自己寫 history。

- `svgedit/stl/constants.ts` 補上四個 attribute，格式與後端 `TODO-backend.md` G 節一致
- `svgedit/stl/engravingParams.ts` —— 讀取時套用預設值（`<= 0`、無法解析、缺漏都退回預設），寫入時走 `changeSelectedAttribute`
- 元件只把值鏡射到 local state 讓輸入框跟手，`elem` 變更時重新讀取（選取換人、undo 都會從 DOM 變回來）
- 預設值 0.1mm / 範圍 0.001~5mm，⚠️ **前端的預設值必須與後端的「attribute 缺漏時的預設」保持一致**，兩邊都是 0.1

#### ⚠️ 填充沿用投影 rect 自己的 `fill`，**不用 `data-stl-fill`**（與後端已實作的介面不同）

填充直接用**投影 rect 自己的 `fill` 屬性**，由既有的 `InFillBlock` 操作 —— 跟每一個 2D 圖形完全同一套。好處：

- app 裡只有**一個**「填充」概念，不會出現「rect 有 fill、但 STL 另有一個 data-stl-fill」這種可以互相矛盾的狀態
- undo、圖層顏色、`checkVector()` 這些既有機制全部免費沿用
- 沒有「省略 = 跟隨圖層」那個 UI 顯示不出來的第三態

⚠️ **這是對後端 `TODO-backend.md` G 節的介面變更，需要同步**：後端已經實作 `data-stl-fill`（`'1'` / `'0'`，省略跟隨圖層）。請改成讀**佔位 rect 的 `fill`**（`fill != "none"` 即為填充），並拿掉 `data-stl-fill`。
> 提醒：B-2 提到 `processMySVGNode` 對「白色填充」與「無有效 stroke」有兩個 skip，`data-stl` 的判斷本來就要放在它們之前，所以填充值仍然讀得到。

#### 尚未處理

- **mobile 版**：其他 OptionsBlocks 都有 `ObjectPanelItem` 分支，這支還沒有（已標 TODO）
- 層高 / 點距的**實機合理範圍**仍是猜的（TODO.md 仍待補充的資訊 2）

---

### ✅ Step 9：.beam 存檔（A-2 block 6）

存檔前 mesh 只活在記憶體裡，重開檔案 3D 物件是空的 —— 這是先前最大的功能缺口。

#### block 6

- **結構直接沿用 image source（0x02）的 `id + binary` 重複格式**，兩者共用 `generateBinarySourceBlockBuffer`
- **一定放在所有 block 的最後**：舊版 Beam Studio 的 `readBlocks` 遇到未知 type 會直接停止解析（`currentOffset = -1`），排在前面會連帶吃掉後面的 block
- ⚠️ **header 是「位置固定」的 VInt 長度序列**，所以 block 5（另一個開發中的功能）即使不存在也要寫入長度 0 佔位，否則之後兩邊會錯位
- `metaData.contents` 從寫死的 `[1,2,3,4]` 改成**實際存在的 block 列表**
- 沒有 STL 物件時完全不寫 block 6（長度 0），一般檔案的內容不變

#### ⚠️ 只存矩陣是不夠的 —— 新增 `data-stl-transform`

矩陣無法反推回 position / rotation / scale / flip（有鏡射時分解是歧義的，Step 7 已詳述），所以重開檔案會弄丟「翻轉了哪一軸」並讓旋轉跑到別的地方。

投影 rect 因此多帶一個 **`data-stl-transform`（JSON，前端專用，後端不看）**，內含目前的 transform 與 `initialTransform`（重置鈕要用）。`data-stl-matrix` 維持原樣給後端。

- 寫入點仍然只有 `updateProjectionRect()`，但**拖曳中不寫**（只有 commit 才寫），mid-drag 的矩陣本來就不該被當成已定案的狀態
- 讀檔時 `data-stl-transform` 缺漏或壞掉 → 記 error 並**跳過那個物件**，而不是硬猜一個位置放上去

#### 模式與生命週期

- **`data-inner-engraving` 寫在 svgcontent 上**（跟 `data-rotary_mode` 同一個地方），`importBvg` 讀回來時**用機種能力擋一次** —— 在 Promark UV 存的檔案拿去別台機器開，不該把 app 切進那台機器做不到的模式
- metaData 也帶一份 `innerEngraving`，讓 `readBeamFileInfo` 不解析任何 block 就知道（跟 workarea 在 'ask-change-workarea' 流程裡的角色相同）。⚠️ **目前還沒有消費端**，開檔流程要不要據此詢問使用者是下一步的事
- `importBvgString` 會 `useStlStore.clear()`：svgcontent 已經整個被換掉，舊文件的投影 rect 全沒了，mesh 留著只會佔 GPU buffer
- 讀檔載入的物件會掛在 'Load Beam File' 這個 batch command 的 `onAfter` 上，**undo / redo 會連 mesh 一起加回或移除**（跟單一 `importStl` 同一個處理方式）

#### 已知限制

- ⚠️ **undo 一次「開檔」不會把上一份文件的 mesh 還原** —— rect 會被 `setSvgContent` 的 command 還原，但它們的 mesh 已經在 clear 時被 dispose。要做到完整還原需要在 clear 前做一份 snapshot，成本與價值不成比例，先記著
- **auto-save 現在會把 mesh 一起寫進去** —— 大模型（35MB+）的自動存檔成本要實測，這正是 TODO.md【Review】第 4 點提的風險

---

### ✅ Step 10：Topbar / menu / Banner（第 7、8 點）

#### 第 8 點：Banner

`beambox.banner.inner_engraving`，排在互斥判斷的**最前面** —— 文件設定已經讓內雕與 rotary / passthrough / auto-feeder / 曲面雕刻互斥，其他訊息不可能同時成立。

#### 【材料】外框（`FramingType.Material`）

- 長方體走矩形、球體與圓柱走**圓形**（48 段），單位 mm
- Promark + 內雕模式時，選項換成 **【材料】+【外框】**，拿掉 hull 與 contour —— 那兩個是 2D 圖案的點陣 / 向量輪廓，內雕文件裡根本沒有 2D 圖案
- 這是唯一**完全不看畫布物件**的 framing 類型：材料是文件設定，不是畫布上的東西
- 座標直接就是畫布座標，不需要任何轉換（見下面的⚠️）

#### 停用清單

| 位置 | 做法 |
| --- | --- |
| 左側繪圖工具 | `LeftPanel` 在內雕模式回傳 `null`（STL 從檔案選單與拖曳進來） |
| 圖形庫、生成器（boxgen / code / keychain / puzzle…） | `SvgEditor` 不渲染 —— 它們產出的都是 2D 圖形 |
| 路徑預覽 | 隱藏，**dev 仍可用**（PM 08/06） |
| 選單 | `INNER_ENGRAVING_DISABLED_MENU_ITEMS` 一份清單餵兩邊 |

⚠️ **選單要餵兩套機制**：web / mobile 的選單是每次 render 重建的，所以在 `useMenuData` 走一次樹把 id 命中的標成 `disabled`；Electron 的原生選單只建一次、之後靠 id 開關，所以由 `beambox-global-interaction` 訂閱 document store 推送 `menu.disable()`。⚠️ `menu.attach()` 會把所有東西重新啟用，所以模式的套用一定要排在它之後。

清單分三類，每一項都屬於其中之一：2D 專用編輯（offset / 分解 / 影像工具）、**放不下 mesh 的匯出**（SVG / PNG / JPG / PDF 是平面，.bvg 沒有存 binary 的 block，只有 .beam 的 block 6 有）、以及會塞 2D 內容或互斥的模式（材料測試匯入、曲面雕刻）。再加上兩個導覽（它們會帶使用者看不在畫面上的 2D 畫布）。

#### 尚未處理

- **範例檔案（`IMPORT_EXAMPLE_*`）** 沒進停用清單 —— id 隨機種而異，要另外處理
- **相機預覽 / 校正**：TODO 明確說保留走既有流程，所以沒動。結果要怎麼呈現在 3D 畫布上仍是 TBD
- `getVisibleElementsAndBBoxes` 對投影 rect **理論上沒問題**（它只排除 defs / symbol 那類元素，`rect` 不在排除清單），但**還沒實機驗證**【外框】框出來的位置是否正確

---

### ✅ Step 11：Y 軸轉換收回前端 + 左側工具列

#### Y 軸轉換改在投影那一步做

場景 Y 朝場景後方（CAD 慣例），畫布 / SVG / G-code 的 Y 朝下，兩者相反，所以轉換一定要發生在某處。**改成在 `utils/projection.ts` 做掉**：

- 投影 rect 的 `y` = `workarea_height − bbox.max.y`（⚠️ 是場景 bbox 的**最大**端對應畫布的上緣，不是最小端）
- **`data-stl-matrix` 送出前先左乘一個 Y 翻轉**，所以後端拿到的矩陣套上去就是 G-code 位置
- framing 的【材料】外框同樣在送出前轉好
- `coordinates.ts` 重新有了 `sceneToSvgY` / `sceneToSvgYMm`，而且是**唯一**做這件事的地方

為什麼收回前端：它只需要發生一次、而且發生在唯一的邊界上；放在後端則要在切片、contour、hull、工時估算每條路徑各記得做一次，漏一條就上下顛倒，而且前端讀 rect 的功能（framing、對齊、縮圖）還是得自己再翻。

⚠️ **這與先前寫給後端的說明相反，已在【Backend】章節標明要更新**，特別是 contour 那條路徑也不需要再處理顛倒。

**分界線很清楚**：場景座標只活在 3D 畫布與 store 裡（DimensionPanel 的 Y、材料設定的 Y 都是場景值），跨過投影就全是畫布座標。

#### 左側工具列

`DrawingToolButtonGroup` 原本就有 `supportedIn3D` 的骨架，只是 flag 寫死。接上 `useInnerEngravingActive()` 之後：

- Step 10 那個「整個 LeftPanel 回傳 null」**已還原** —— 由每顆按鈕自己宣告支不支援 3D 才是對的粒度（游標、匯入、Beamy 留著，其餘 2D 繪圖工具隱藏）
- 補完原本標 TODO 的兩件事：進入內雕模式時**關閉所有抽屜**（開啟按鈕即將消失，不關的話抽屜會開著卻回不去）、**結束相機預覽**（預覽畫在被蓋住的 2D 畫布上，讓機器空跑沒有意義）

---

---

## 目前 2D 有對應功能，3D 需要補

換成 three.js 之後，這些綁在 SVG 畫布上的既有行為都沒有 3D 版本。列在這裡是為了不要在 PR 前才發現「2D 做得到、3D 做不到」。

| 功能 | 2D 現況 | 3D 需要 |
| --- | --- | --- |
| **角度吸附** | 旋轉時可吸附到固定角度 | 旋轉 gizmo 要能吸附（建議每 15°，或按住修飾鍵時才吸附）。⚠️ 這是**目前唯一實際可行的旋轉易用性改善** —— 尤拉角的三軸耦合無解（見 Step 7 的說明），吸附至少讓使用者拿得到整數角度 |
| **位置吸附** | `auto_align`（物件之間、與工作區邊界的吸附對齊） | 拖曳 gizmo 時吸附到格線 / 材料中心 / 可加工範圍中心 / 其他物件。建議至少先做「格線 + 可加工範圍中心」，內雕最常用的就是置中 |
| **尺寸吸附** | 無 | 一併評估：縮放時吸附到整數 mm |
| 縮放 / 自訂縮放、尺規、中鍵平移、快捷鍵（Delete / 方向鍵 / Ctrl+A）、右鍵選單 | 都綁在 SVG 畫布 | 見 `TODO.md` 第 5 點的清單，要逐項重接或停用 |

> 💡 吸附的實作位置：gizmo 拖曳的落點在 `StlMesh.handleObjectChange`，那裡已經在每次變動時修正 `anchor`（等比鎖就是這樣做的），吸附是同一個切入點。**吸附值要在寫回 store 之前套用**，否則面板會顯示未吸附的數字。

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
| `app/actions/beambox/export/getStlObjects.spec.ts`（新檔） | store 空 → `undefined`（一般工作 payload 不受影響）；只回傳「投影 rect 還在 `#svgcontent` 裡」的物件；store 有但 DOM 沒有 → 不輸出；DOM 有但 store 沒有 → 跳過並 `console.error`；base64 內容可還原回原始 bytes | Step 3 |
| `helpers/api/swiftray-client.spec.ts` | `loadSVG` 把 `stlObjects` 放在 params **頂層**、`file` 裡不留下它；沒有 STL 時 params 不出現 `stlObjects` 這個 key；logger 收到的是筆數而不是 base64 | Step 3 |
| `export/GoButton/handleExportAlerts.spec.ts` | svgcontent 有 `[data-stl]` + 版本不足 → 回 `false`（`checkVersion` 有被呼叫）；版本足夠 → 照常往下；**沒有** `[data-stl]` 時完全不檢查 `SWIFTRAY_SUPPORT_STL`（一般工作不能被暫定的版號擋掉） | Step 3 |
| `dialogs/InnerEngravingSettings.spec.tsx`（新檔） | 切到圓形只顯示直徑 / 圓周、直徑與圓周互相連動；**切換形狀來回不會清掉另一個形狀的尺寸**（儲存只寫目前形狀的欄位）；球體高度被鎖在直徑；折射率不受 inch 影響；儲存內容正確。**位置錨點**：切到左下角時輸入框顯示 `中心 − 尺寸/2`、輸入後 store 存回中心；**改尺寸不會改變中心**（角落錨點的回歸測試）；圓形用直徑當 footprint | Step 4 |
| `InnerEngraving/utils/material.spec.ts`（新檔） | mm → 場景單位換算；store 的中心 → bbox 最小角；`center` 對三種形狀都正確；球體 `height > diameter` 會被夾住 | Step 4 |
| `InnerEngraving/utils/engravable.spec.ts`（新檔） | 長方體：材料 ∩ 工作範圍 ∩ 內縮；材料超出工作範圍時被工作範圍截斷；**圓柱 / 球體用內接方形 / 內接立方體**（不是 bbox）；安全距離 ≥ 半尺寸 → `isValid = false`；球體同時受液面高度限制 | Step 5 |
| `InnerEngraving/utils/transform.spec.ts`（新檔） | `setTransform` 會**同時**更新 store、投影 rect 與 history（rect 不在 DOM 時不可拋錯）；`getMatrix` 的組合順序（position 是中心、×10 與鏡射在 S 裡）；`moveObjectCenterTo` 不改變旋轉 / 縮放；`fitObjectTo` **會放大**（與 import 的只縮不放相反）、貼齊最緊的那一軸、扁平模型（某軸 size = 0）不會產生 NaN | Step 5 / 7 |
| `InnerEngraving/utils/transform.spec.ts`（history 部分） | `StlTransformCommand` undo / redo 會還原 store **與** 投影 rect；物件已被移除時 undo 不可拋錯；gizmo 拖曳只產生**一筆** history | Step 7 |
| `DimensionPanel/DimensionPanelStl.spec.tsx`（新檔） | 位置以中心計；**改尺寸不會改變位置**；等比鎖開啟時三軸同倍率、關閉時只改一軸；非等比物件鎖定後仍非等比；翻轉是獨立布林、不會讓尺寸變負；旋轉 deg ↔ rad；**三顆重置各自只改自己那一段，且都回到 `initialTransform` 而不是單位值**（尺寸不是回到 1、位置不是回到重算的中心） | Step 7 |
| `svgedit/stl/engravingParams.spec.ts`（新檔） | 缺漏 / `0` / 負數 / 非數字都退回預設；`mode` 只認 `'dot'`，其餘一律 line；寫入會經過 `changeSelectedAttribute`（進得了 undo） | Step 8 |
| `OptionsBlocks/StlOptions.spec.tsx`（新檔） | 點間距只在打點模式出現；切換 `elem` 會重新從 DOM 讀值；填充走 `InFillBlock`、改的是 rect 的 `fill`（**不可以**再出現 `data-stl-fill`） | Step 8 |
| `beam-file-helper.spec.ts` | block 6 的 round trip（寫入 → 讀回 mesh 與 transform 完全一致）；**沒有 STL 時不寫 block 6**、一般檔案的 byte 內容不變；block 5 的 0 佔位有寫；`metaData.contents` 反映實際 block；block 6 排在最後 | Step 9 |
| `svgedit/stl/transformAttr.spec.ts`（新檔） | round trip；缺漏 / 非 JSON / 少一個欄位 / NaN → `null`（不可以回半套資料）；舊檔沒有 `initialTransform` 時退回目前的 transform | Step 9 |
| `svgedit/stl/sources.spec.ts`（新檔） | 只回傳投影 rect 還在 `#svgcontent` 裡的物件；DOM 有但 store 沒有 → 跳過並 `console.error` | Step 9 |
| `svgedit/operations/import/importBvg.spec.ts` | `data-inner-engraving` 會還原模式，但**機種不支援時強制 false**；載入時會清空 stlStore | Step 9 |
| `InnerEngraving/utils/projection.spec.ts` | **Y 翻轉**：rect 的 `y` 來自場景 bbox 的 max 端；`data-stl-matrix` 是翻轉後的矩陣（套用到 mesh 頂點後 y 與 rect 對得起來）；工作區高度改變時跟著變 | Step 11 |
| `helpers/device/framing.spec.ts` | `getMaterialOutline`：長方體回 5 點（首尾相同）、圓形回 49 點；中心與尺寸換算正確；`getFramingOptions` 在內雕模式回【材料】+【外框】而不是 hull / contour | Step 10 |
| `beambox-global-interaction.spec.ts`（新檔） | 內雕開啟時 `menu.disable` 收到整份清單；關閉時 `menu.enable`；`attach()` 之後才套用（順序不能反） | Step 10 |
| `SvgEditor.spec.tsx` / `LeftPanel/index.spec.tsx` | 內雕模式下不渲染繪圖工具、圖形庫、生成器 | Step 10 |
| `DimensionPanel/StlAdjustInput.spec.tsx`（新檔） | Enter 才 commit（blur 不會）、commit 後欄位清空、空值 / NaN 不 commit；位置調整在 inch 文件下會換算、百分比與角度不換算；尺寸 `%` 輸入 120 → ×1.2，且 ≤ 0 時不動作 | Step 7 |
| `svgedit/operations/import/importStl.spec.ts` | 新增：匯入時置中於可加工範圍、超出時只縮不放；`isValid = false` 時退回「置中於工作範圍 + 貼齊 z=0」且**不縮放** | Step 5 |
| `app/constants/innerEngraving.ts` | 只有常數，不需要 spec；但 `beambox-preference` 的預設值有沒有跟著新增，要靠下面那個 spec 釘住 | Step 4 |

### 待修改 / 待確認

> ⚠️ **UV 功能開發期間先不處理 jest**，以下只做紀錄，之後一次補。
> 目前 `pnpm nx run core:test` 有 **9 個 suite 失敗**（2072 passed / 8 failed）。

| 項目 | 內容 |
| --- | --- |
| ✅ `src/__mocks__/@core/helpers/is-dev.ts` | **已修**：補上 `uvModel` / `isUvDev` / `showDevMsg` / `supportSwiftray` / `allowWebSwiftray` / `mockT` / `todo`。缺 `todo` 會讓任何（間接）import `svgedit/stl/constants.ts` 的 spec 整支掛掉 |
| ✅ `src/__mocks__/@core/helpers/checkFeature.ts` | **已修**：補上 `checkFpm1UV` |
| ✅ `src/__mocks__/@core/app/stores/documentStore.ts` | **已修**：補上 `prespray_times` 與 9 個 `inner-engraving*` key |
| ✅ `DocumentSettings/index.spec.tsx` + snapshot | **已改**：`handleSave` 的期望值補 `'inner-engraving': false`；snapshot 因為機種列表多了 Promark UV 而更新（mock 補完 `checkFpm1UV` 後才會出現）。8 tests 全過 |
| ❌ `beambox-preference.spec.ts` | DEFAULT_PREFERENCE 的期望值要補 `inner-engraving` 與 9 個材料 key。**這支在 Step 2 就已經失敗**（`inner-engraving` 那時就加進去了），Step 4 又多了 8 個 |
| ❌ 六支「補完 mock 後才跑得起來」的 spec | `ConfigPanel/{AdvancedBlock,DottingTimeBlock,SpeedBlock}`、`MaterialTestGeneratorPanel/{generateSvgInfo,TableSetting}`、`helpers/layer/layer-config-helper` —— 先前是**在 import 就掛掉**（缺 `isUvDev`），現在跑得起來但斷言失敗，因為 mock 的 `isUvDev` 回 `true` 打開了 UV 分支（例如 `getConfigKeys` 多出 `qPulseWidth`、DottingTimeBlock 不再是空的）。**要決定 mock 的 `isUvDev` 該回 true 還是 false**：回 false 這六支會回到原本的期望值，但就測不到 UV 路徑 |
| ❌ `SvgEditor.spec.tsx` | 掛在 `InnerEngravingCanvas` → three.js / drei 的 ESM 解析（jest transformIgnorePatterns）。要嘛加 transform 設定，要嘛在 spec 裡 mock 掉整個 3D 畫布 |

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
- **`x` / `y` / `width` / `height`** —— 3D bbox 的 XY 投影，單位 0.1mm。**這是衍生值，後端不需要用它做任何幾何判斷**
- `data-stl-name` —— 只是 UI 顯示用的原始檔名，後端可忽略
- **`data-stl-layer-height` / `data-stl-point-spacing`**（mm）、**`data-stl-mode`**（`dot` / `line`）—— 缺漏或 `<= 0` 時用預設 0.1mm / line，前後端的預設值要一致
- ⚠️ **填充改用佔位 rect 自己的 `fill`，請拿掉 `data-stl-fill`** —— `fill != "none"` 就是填充。前端用的是與 2D 圖形完全相同的那一套（`InFillBlock`），這樣 app 裡只有一個「填充」概念，也不會有兩個來源互相矛盾

座標系：右手系 Z-up、單位 0.1mm、原點 (0,0,0)。

### ⚠️ Y 軸轉換改由前端負責（**與先前的說法相反，請務必更新**）

先前這一段寫的是「前端送 3D 場景座標，後端自己翻 Y」。**已改成前端翻好再送**：

```
y_canvas = workarea_height − y_scene
```

`data-stl-matrix` 與投影 rect 的 `x / y / width / height` **都已經是 2D 畫布座標（也就是 G-code 位置的座標系）**。

**後端要做的事：把任何 Y 翻轉拿掉，矩陣直接套用。** 包含：

- **算圖（切片）**：矩陣套上去得到的就是最終位置，不要再減 `workarea_height`
- **⚠️ contour（紅光預覽）**：這條路徑用的是投影 rect，它也已經是 2D 座標了，**同樣不用處理顛倒**

為什麼改：3D 場景的 Y 朝場景後方（CAD / CNC 慣例，PM 已定案），2D 畫布與 SVG 的 Y 朝下，兩者方向相反，所以轉換一定要發生在某個地方。放在前端的理由是**它只需要發生一次、而且發生在唯一的邊界上**（`utils/projection.ts` 的投影點）；放在後端則要在切片、contour、hull、工時估算每一條路徑上各自記得做一次，漏掉任何一條就會上下顛倒，而且前端讀 rect 的功能（framing、對齊、縮圖）還是得自己再翻一次。

前端這邊的一致性：**場景座標只活在 3D 畫布與 store 裡**（DimensionPanel 顯示的 Y、材料設定的 Y 都是場景值），一旦跨過投影那條線就全部是畫布座標。framing 的【材料】外框也在送出前轉好。

---

## 怎麼試

1. DevTools console：`localStorage.setItem('uvDev', 'true')`（或 `enableAllMachines`），重開
2. 文件設定 → 工作區域選 **Promark UV** → 打開「FLUX 水晶內雕」→ 儲存
3. 匯入一個 `.stl` 檔 → 3D 畫布出現模型，點選後可用 gizmo 拖曳
4. 切回 2D（關掉內雕）可以看到對應的投影 rect 出現在圖層裡
