# UV 內雕（FLUX水晶內雕）

後端（swiftray：C++ + QT + opencv） TODO

使用 libigl，做一個切片功能。（後期可能視需要換成 CGAL，好像是處理異常的能力比較好？）

> ⚠️ 選型前先看 B-8：`igl::slice` **不是**幾何切片（是矩陣列/行切片）；CGAL 的 `Polygon_mesh_processing`（含 `Polygon_mesh_slicer`）是 GPL v3+，商用閉源要跟 GeometryFactory 買授權。

## 1、新增引用，更新 swiftray.pro、CMakeLists.txt（以 submodule 形式導入 repo）

- 💡 libigl 核心是 **header-only**（MPL-2.0），submodule + `INCLUDEPATH` / `target_include_directories` 就夠，**不需要 build**。務必避開它依賴 CGAL 的模組（會傳染 GPL）
- ⚠️ **兩套 build 都要加**：`swiftray.pro`（qmake）與 `CMakeLists.txt`（CMake），漏一個另一個平台就掛
- ⚠️ **`tests/` 目前是壞的，不能當測試入口**：查證後 `cmake/Qt6/unix/CMakeLists.txt` 與 `windows/CMakeLists.txt` 都只 `add_subdirectory(src)` 與 `third_party`，**沒有 `add_subdirectory(tests)`**；`tests/CMakeLists.txt` 還引用了未定義的 `${SOURCES}` / `${GTestFiles}`，qmake 那邊也沒有 test target。CLAUDE.md 寫的 `make UnitTest` 是過時的。
  → 早期測試不要卡在修 gtest target 上，改用「**可直接呼叫的函數 + daemon 的 websocket API**」當入口（見第 4 點）。之後要進 CI 再單獨處理 test target。

## 2、增加讀取與切片相關功能

> ⚠️ **這階段不要新增 `Shape::Type` enum**（配合 B-10）。查證後，新增一個 enum 值要連帶處理 7 處 switch 分支：`document-serializer.h:182,204`、`toolpath-exporter.cpp:266`、`toolpath-exporter-fcode.cpp:1223`、`canvas.cpp:541`、`cache-stack.cpp:45`、`convex-hull-exporter.cpp:120`、`main_application.cpp:182`。早期切片測試完全不需要付這個成本。

- `src/shape/` 的 stl shape：**這階段不做**。之後接前端時只需保留「id + transform + 雕刻參數」（B-10），mesh binary 走 `stlObjects` 另一條路徑進來
- `src/toolpath_exporter/stl-utils`：直接吃 **mesh buffer + 4×4 變換矩陣**，職責如下
  - **2-1 讀 STL** → 頂點/面矩陣（V, F）。binary 與 ASCII 都要支援（見 5-a、5-b）
  - **2-2 套用 4×4 變換矩陣**（B-4：前端已把 mm → 0.1mm 的 ×10 併進矩陣，後端直接套上去，**不要自己判斷單位**）
  - **2-3 水平切片**：切片平面法線 = Z，依指定層高逐層求交
  - **2-4 chaining**：把交線段串成**有序 polyline** —— ⚠️ 這是整個 spike 最容易卡住的地方，libigl（`igl::isolines`）只給線段集合，串接邏輯要自己寫。獨立成一個可單測的函數
  - **2-5 輪廓分類**：判定封閉/開放、繞向（orientation）、外輪廓與內孔的巢狀關係（B-7，填充模式一定需要）
  - **2-6 進階**：QPolygonF 依指定間隔重取樣成點（打點模式用，邊界規則見 5-p）

> API 從一開始就設計成接受 **多個 `(mesh, transform)`**（B-6），不要寫成單一 mesh 的全域函數。

## 3、輸出資料結構要求

- 每層必須帶 **Z 值**，不能只回 `QVector<QVector<QPolygonF>>`，否則層與 Z 對不上
- Z 值分成「**純幾何 Z**」與「**補償後 Z**」兩欄，折射率補償（B-3）之後補進來不用改 struct
- 每個輪廓帶 `is_closed` / `orientation` / `parent_index`（B-7）
- 層序 **由深到淺**（B-5）

## 4、測試函數

| Step | 內容 |
| --- | --- |
| 1 | 讀取本地檔案 —— 先 hardcode `/Users/software/Downloads/Mcqueen Car.STL` |
| 2 | 解析成 mesh（V/F），並套用一個**非平凡的 4×4 矩陣**（含旋轉 + 縮放 + 位移），不要只測 identity |
| 3 | 依指定層高切片 |
| 4 | `qInfo` 每層：層序、Z 值、輪廓數、每輪廓的點數 / 封閉與否 / 繞向 / 巢狀父層，以及**單層耗時與總耗時** |
| 5 | 每層輸出一張圖到指定資料夾 |
| 6 | assertion（可進 CI 的部分） |

**Step 5 的圖不要用純白底黑線** —— 那看不出 2-4 與 2-5 有沒有做對：

- 檔名帶層序與 Z 值（`layer_0042_z12.300.png`），否則排不出順序
- **外輪廓黑、內孔紅、開放 polyline 藍**
- 點順序用漸層色，或在起點畫標記 —— chaining 接錯時只有這樣看得出來

**Step 6 assertion**：層數 = `ceil((Zmax - Zmin) / 層高)`、封閉輪廓首尾點相同、水密模型不應出現開放 polyline；另外用程式生成的 cube 與中空圓柱做驗證。

> ⚠️ **cube 的斷言不能寫「每層 1 個 4 點矩形」** —— 立方體的每個側面是 2 個三角形，切下去每面得到 2 段，接起來是 **8 個點**的正方形（共線點不會自動合併）。正確的斷言是「**每層 1 個封閉輪廓 + 面積等於已知值 + 外輪廓 CCW + parent = -1**」，不要斷言點數。

**執行方式**（不新增 CLI 參數、不依賴壞掉的 gtest target）：
- 直接呼叫 `runStlSliceTest()`（`src/toolpath_exporter/stl-slice-test.h`），所有參數都有預設值
- 或走 daemon：`path: "/ws/sr/system"`、`action: "sliceStlTest"`，`params` 可省略，回傳 `report` 物件（層數、耗時、各類特殊情況的計數）

## 5、⚠️ 必須標註並處理的特殊情況

以下每一項都要在程式裡明確處理（不是「之後再說」），並在測試裡有對應 case。

### 檔案格式類

**(a) ⚠️ binary STL 但檔頭是 `solid ` —— 手上的測試檔就是這種**
已驗證 `Mcqueen Car.STL` 開頭是 `solid Mcqueen_20160506`，但它**是 binary**。用 `startswith("solid")` 判斷格式**一定會誤判成 ASCII**。
正確做法：讀 offset 80 的 uint32 faceCount，比對 `84 + faceCount * 50 == fileSize`，成立才是 binary。

**(b) ASCII STL** —— 也要支援（前端第 4 點會放行這種檔）。

**(c) 檔案截斷 / faceCount 與檔案大小對不上** —— 要明確報錯，不要讀出界或吃到垃圾資料。

**(d) 空檔 / 0 面 / 根本不是 STL** —— 擋下並回明確錯誤。

### 幾何退化類（切片器最常爆的地方）

**(e) ⚠️ 切片平面正好通過頂點**
浮點上必然發生 —— 層高 0.1mm 且模型座標是 0.1 的倍數時會**大量**發生。交點被重複計入，chaining 會接出重複點或分岔。
處理：切片高度加一個 epsilon 偏移，或在求交時對「頂點正好落在平面上」採用一致的 `<=` / `<` 規則（兩者擇一，全程一致）。

**(f) ⚠️ 三角面與切片平面共面**
水平面（模型底面、車底盤）會整片落在切片平面上，交線退化成整個三角形。
處理：直接跳過共面三角形，靠周圍的非共面三角形產生輪廓。

**(g) 退化三角形（面積 0 / 重複頂點）** —— 已驗證手上這個檔沒有，但別的檔會有。跳過即可。

**(h) ⚠️ 非水密 / 破面網格**
chaining 會串出開放 polyline。**不要為了這個引入 CGAL**（B-8）。
處理：開放 polyline 照樣輸出並標記 `is_closed=false`，由上層決定要不要打；填充模式遇到開放輪廓要跳過或提示。

**(i) 多殼體 / 分離部件** —— 車體、輪子、擋風玻璃常是各自獨立的殼，同一層會出現多個互不巢狀的外輪廓。巢狀判定**不能假設只有一個外輪廓**。

### 座標與範圍類

**(j) 模型不在原點 / 有負座標** —— 手上這個檔的 bbox min 是 `(0.012, 0.005, 0.313)`，接近 0 但不是 0。切片範圍要用**實際 bbox 的 Zmin/Zmax**，不能假設從 0 開始。

**(k) ⚠️ 上方向不一致（Z-up / Y-up）**
已驗證 `Mcqueen Car.STL` 的 bbox 是 **74.24 × 47.53 × 150.24 mm** —— 一台車最長邊 150mm 落在 **Z 軸**，匯入後會是**車頭朝上豎立**，是 Blender 系 Y-up 匯出的典型徵狀。
後端不猜方向（上方向選項由前端第 4 點負責），但測試要涵蓋「模型被旋轉 90° 後切片」，確認 2-2 的矩陣路徑正確。

**(l) 超出工作範圍** —— 這個檔 X = 74.24mm > 工作範圍 70mm。後端不做材料裁切（B-10），但**不能因為超界就崩或靜默丟資料**。

**(m) 空層是合法結果** —— 層高大於某些薄殼特徵時，該層會完全沒有輪廓。要**正常輸出空層**，不能報錯、更不能跳號（跳號會讓 Z 對不上）。

**(n) 層高 > 模型高度 / 層高 <= 0** —— 前者至少輸出 1 層，後者直接擋下。

**(o) 首層與末層落在 bbox 邊界上** —— Zmin/Zmax 平面切下去會得到退化輪廓。明確定義切片起始 Z（建議 `Zmin + 層高/2`）。

### 行為契約類

**(p) 重取樣的邊界規則（打點模式）—— ✅ 已定案**

原本寫「整個路徑 10mm，每 1mm 取一個點得到 11 個點」，補完三個沒定義的情況：

取樣位置固定為 `k × d`（`k = 0 … floor(L / d)`，`L` = 路徑長、`d` = 點間距），並套用：

1. **封閉輪廓不重複起點**：`L` 剛好是 `d` 的整數倍時，最後一點會與起點重合 → 丟掉。（10mm / 1mm = 10 點，不是 11 點）
2. **✅ 尾端不足一個間隔時直接拋棄**，不補點、不均分縮短間隔。（10.5mm / 1mm → 取 0…10 共 11 點，剩下的 0.5mm 不取樣）
3. **極短輪廓**（`L < d`）：至少輸出 1 點（起點）。

> ⚠️ **已知副作用（採用「直接拋棄」的代價）**：封閉輪廓的接縫處，最後一點與起點的距離會是 `L mod d`（可能遠小於 `d`）。以 10.5mm / 1mm 為例，接縫處兩點只距離 0.5mm，打點模式下該處能量會偏高。
> 若實機驗證後接縫出現可見的過曝點，再改回「均分縮短間隔」或「丟棄過近的末點」—— 這是 render 無關的純參數行為，之後改動成本低。開放輪廓沒有這個問題。

這直接決定打點模式的成品外觀，實作時務必照上面三條寫，不要各自解讀。

### 效能與記憶體

**(q) ⚠️ 效能基準就用手上這個檔**
已驗證：**710,630 面 / 35.5MB**，Z 高 150.24mm → 以 0.1mm 層高 = **1503 層**。這已經很接近 B-9 的最壞情況（3000 層 × 50 萬面）。
暴力法（每層線性掃全部三角形）在這裡是 `710,630 × 1503 ≈ 10.7 億` 次判斷。**Step 4 的計時數字就是決定要不要立刻上 active edge list / BVH 的依據**，這是選型決策，晚一步就要重做。

**(r) 記憶體** —— 71 萬面的 V/F 矩陣約 100MB 級，加上 1503 層的輪廓資料。⚠️ 不要每層都複製整份 mesh。

## 6、驗收標準

- `Mcqueen Car.STL`（0.1mm 層高）能完整切完不崩、不無限迴圈，輸出 1503 層
- 輪廓圖肉眼可辨識為車體剖面，內外環與開放輪廓顏色正確
- cube / 中空圓柱的 assertion 全數通過
- 5-a、5-e、5-f、5-h 各有一個對應的測試 case
- 有明確的總耗時數字，可以判斷是否需要加速結構

## 【Review】依前端設計，後端需要調整 / 備註的地方

### B-1. 佔位 rect 絕對不能被當成要雕的矩形 ⚠️ 最重要

依 A-1，svgString 裡每個 STL 物件都有一個佔位 `<rect data-stl="<id>" …>`，它同時是 3D transform 與雕刻參數的載體。swiftray 的 toolpath-exporter **必須認得 `data-stl` 並跳過它**，否則每個 STL 物件都會多雕一個矩形外框。

對應關係：佔位 rect 的 `id` ←→ `loadSVG` payload 裡 `stlObjects` 清單的 key。

### B-2. 缺口：前端雕刻模式後端需微調 ⚠️
| 前端模式 | 後端對應 |
| --- | --- |
| 打線 + 填充 | QPolygonF 輪廓直接輸出 + toolpath-exporter outputLayerFillGcode |
| 打線 + 非填充 | QPolygonF 輪廓直接輸出 + toolpath-exporter outputLayerPathGcode|
| 打點 + 填充 | QPolygonF 輪廓直接輸出 + toolpath-exporter 設定指定 DPI + outputLayerBitmapGcode |
| 打點 + 非填充 | QPolygonF 轉成點 + toolpath-exporter outputLayerPathGcode + 設定 dotting time （轉成點的行為之後可以搬到 outputLayerPathGcode 裡） |

### B-3. 缺口：折射率的 Z 補償後端沒有對應項目 ⚠️

前端已決定「折射率只傳值、補償由 swiftray 做」（A-3，走 `getExportOpt` → convert options）。雷射穿過材料表面會折射，幾何深度與實際焦點深度不相等，後端要在產生 Z 座標時套用補償。目前後端 TODO 沒有這一項。

（補償公式待確認，這也是前端「仍待補充的資訊」第 1 項。）

### B-4. 座標系與單位契約 —— 最容易出錯的地方

**已定案**：X 向右、Y 向下、Z 向上（高），原點在 xyz = 0（材料位置不影響原點），單位沿用 2D 的 **0.1mm**（`constant.ts:37` `dpmm = 10`）。

#### ⚠️ Y 向下 + Z 向上 = 左手座標系，這件事有代價

在俯視圖裡「X 向右、Y 向下、Z 朝向觀察者」在數學上必然是**左手系**（右手系要求 X × Y = Z，Y 翻轉後就變成鏡射）。three.js 預設是右手系，硬改成左手系會有三個實際後果：

1. **匯入的 STL 會左右鏡像** ← 最嚴重。CAD 匯出的 STL 幾乎都是右手系 Z-up，直接放進左手系場景，不對稱的模型（文字、logo）會雕成鏡像，而且很難用肉眼發現
2. **面的繞向與法線反轉** —— 背面剔除會剔錯面、打光會不正常。要靠 `material.side = DoubleSide` 或翻轉 index buffer + `computeVertexNormals()` 補救
3. **旋轉方向視覺上相反** —— 繞 Z 正轉會看起來是順時針，TransformControls 的旋轉手把操作起來會反直覺

#### 💡 建議：座標系維持右手系，Y 向下只在「視覺」與「數值介面」上成立

關鍵是 **Y 向下其實是一個觀看慣例，不一定要改座標系的手性**：

- **three.js 場景內部維持右手系 Z-up**（X 右、Y 向場景後方、Z 上）—— 這是 CAD / CNC 的標準慣例，STL 直接對得上，不會鏡像
- **俯視圖用相機的 up 向量調整**，讓畫面上看起來就是「X 向右、Y 向下」，跟 2D 畫布完全一致
- **邊界只有一次轉換**：`y_scene = -y_svg`。佔位 rect 的 attribute、DimensionPanel 顯示值、送給 swiftray 的數值**全部維持 SVG 慣例（Y 向下）**，跟 2D 完全一樣

這樣使用者看到的、面板顯示的、傳給後端的都是 Y 向下，但 three.js 內部不會踩到鏡像與法線問題。負擔只有 render 層的一次負號。

> 如果最後仍決定讓場景本身就是左手系，上面那三點務必都要處理，特別是第 1 點的鏡像 —— 建議加一個不對稱的測試模型（例如帶文字的 STL）進 QA 流程。

#### 單位：0.1mm 沿用沒問題

- 場景座標值範圍：工作區 70mm = 700 units、材料上限 300mm = 3000 units。這個量級對 float32 完全沒有精度疑慮，只要 camera 的 `near` / `far` 跟著設（例如 near 1、far 50000）
- ⚠️ **唯一要換算的地方：`STLLoader` 讀進來的頂點單位是 mm**（STL 格式慣例），進場景要 ×10
- ⚠️ **送給後端時單位不要混用**：mesh binary 是原始檔案（mm），佔位 rect 的 transform 是 0.1mm。建議 payload 直接傳**完整的 4×4 變換矩陣**（已經把 mm → 0.1mm 的 ×10 併進去），後端套上去就對，不用自己判斷單位

#### 其餘契約項目

- **Z 原點 = 使用者手動對焦的位置**（見 B-10，Z 是相對座標）。材料在 Z 上要怎麼擺、對焦時該對到材料的哪一面，由第 3 點的【初始對焦位置】設定決定
- **transform 套用順序**：縮放 → 旋轉 → 位移；歐拉角順序 XYZ（跟前端第 6 點的 DimensionPanel 一致）。傳 4×4 矩陣的話這項就不用煩惱
- 前端 UI 可以顯示 inch，但**傳輸值一律 0.1mm**

建議把這份契約寫成註解放在兩邊的介面定義上，不要靠口頭約定。

### B-5. 切片方向與順序

- 切片平面的法線 = Z（水平切層）
- **切片順序由深到淺（從材料底部往上打）** —— 已雕刻的裂點會散射後續雷射，若先打上層會影響下層的能量傳遞。這是內雕的關鍵工藝細節，需要跟硬體/工藝端確認後寫死在後端

### B-6. 多物件與圖層

- 一個檔案可以有**多個 STL**（已定案），`stl-utils` 要能同時處理多個 shape，各自的 transform 與參數獨立
- **圖層 = 參數分組**，一個圖層可以有多個 STL 物件。STL 屬於哪個圖層由佔位 rect 的 parent layer 決定，雷射參數（功率 / 速度 / 頻率）照既有的圖層機制走
- 多物件的層各自打完再換物件

### B-7. 輪廓的內外環（孔洞）資訊

目前 TODO 寫「切割成多個路徑（QPolygonF）」，但沒說要區分外輪廓與內孔。打線模式不影響（都是輪廓線），但 **B-2 的填充模式一定需要**知道哪裡是實心、哪裡是孔。建議 QPolygonF 輸出時一併帶上繞向（orientation）或巢狀關係。

### B-8. libigl / CGAL 的選型與**授權風險** ⚠️

- ⚠️ **CGAL 的 `Polygon_mesh_processing`（含 `Polygon_mesh_slicer`）是 GPL v3+**，商用閉源產品需要跟 GeometryFactory 買商業授權。功能上它確實是開箱即用的切片器，但採用前務必先確認授權。libigl 核心是 MPL-2.0，相對安全（但要避開它依賴 CGAL 的模組，那些會傳染 GPL）
- ⚠️ **`igl::slice` / `igl::slice_mask` 是矩陣的列/行切片工具，跟幾何切片完全無關**，別被名字誤導
- 💡 libigl 走幾何切片，可以評估用 **`igl::isolines`**：把頂點的 Z 座標當 scalar field，等值線就是水平切層輪廓。得到的是線段集合，仍需自己串成有序的 polyline（chaining）才能塞進 QPolygonF
- 破面 / 非水密網格：前端已在匯入時做預檢（第 4 點），但擋不掉所有情況。建議切片時對開放邊界容錯（未閉合的輪廓就當 open polyline 輸出），不要為了這個引入 CGAL

### B-9. 效能

材料高度上限 300mm、層高預設 0.1mm → 最壞情況 **3000 層**。若每層都線性掃過全部三角形，50 萬面 × 3000 層 = 15 億次判斷。需要按 Z 排序的 active edge list 或 BVH 之類的加速結構，這點要在設計時就考慮進去。

### B-10. 其他

- **Z 是相對座標**：機器讀不到當前 Z 位置，靠使用者手動對焦。所以輸出的 Z 必須是「相對於對焦原點」的相對移動，不是絕對機器座標。Z 精度 0.001mm
- **材料形狀不會傳給後端**（已定案），所以後端不需要、也無法做材料邊界裁切；超出材料的部分由前端負責提示
- **`src/shape/` 的職責可以縮小**：mesh binary 走 `stlObjects` 另一條路徑進來，`src/shape/` 只需要保留「id + transform + 雕刻參數」，不必硬把 stl 塞進畫布

===========

# 【Review】架構決定（已定案）

### A-1. STL 物件在 svgcontent 裡的表示法 ✅

**在 `svgcontent` 裡放一個佔位元素**（`rect` / `path` / `g` / 或直接放 3D 縮圖 `image` 皆可），部分 STL 控制項在設定時就直接寫進佔位元素的 attribute。3D 幾何資料另存（見 A-2），只要對 STL 的處理能同步即可。

> 💡 **建議用 `rect`**，理由（已比對過 `g` / `image`）：
> - **`g` 沒有自帶幾何**，bbox 完全來自子元素，空的 `<g>` 的 `getBBox()` 是 0×0 → framing、選取框、DimensionPanel 的 W/H 全部拿到 0。要修就得放子元素變成 `<g data-stl><rect/></g>`，等於 rect 的問題原封不動再多包一層
> - **`g` 的 transform 處理複雜得多**：`recalculate.ts:302` 的 GROUP HANDLING 分支會算 bbox、拆掉旋轉、把 transform 遞迴推進每個子元素；`rect` 只是 `attrs = ['width','height','x','y']` 直接吸收（`:232`）。佔位元素的 transform 行為越單純越好
> - **`g` 的類型分支更多更難繞**：OptionsPanel 的 `g` 分支有 textpath 偵測 + 子元素 querySelector 判斷、ActionsPanel `:688` 解散群組、DimensionPanel `:88` 會對 g 做 `querySelectorAll('use')` 重繪 symbol、`canvasElements.containers` 含 `g` 會讓 ColorPanel 跑出來
> - `rect` 的四個幾何 attribute 跟「3D bbox 投影到 XY」一一對應，同步邏輯最直接
> - `image` 則要額外產縮圖，收益不大（內雕模式畫布已換成 three.js，佔位元素根本不會被看到）
>
> 之後若真的需要在佔位元素裡放多個東西（縮圖 + 外框 + label），再改成 `<g data-stl>` 包 rect 即可，不影響現在的決定。
> 💡 佔位元素的 `x/y/width/height` 要跟「3D bbox 投影到 XY」保持同步 —— 對齊、framing、`getVisibleElementsAndBBoxes` 都直接讀它。

好處：以下功能都掛在「元素在 svgcontent 裡」這個前提上，可以直接沿用 —— selection / 圖層歸屬 / `updateElementColor`、`undoManager` / 剪下貼上 / 刪除、ObjectPanel / DimensionPanel / ActionsPanel、`getVisibleElementsAndBBoxes`、beam 存檔、多分頁同步。

**⚠️ 代價：所有「判斷物件類型」的地方都要區分真正的 rect 與 STL 佔位 rect。**

主要入口是 `packages/core/src/web/app/stores/selectedElementStore.ts` 的 `getNodeType()` —— 比照既有的 `data-pass-through` → `pass_through_object` 寫法，加一條 `data-stl` → `stl`，同時補 `ILang['topbar']['tag_names']` 的 key（en / zh-tw）與 `categoryOverride`。

但**很多地方是直接看 `tagName`、不走 `nodeType`**，要逐一特判（建議統一提供 `isStlElement(elem)` helper，不要各處散寫 `getAttribute('data-stl')`）：

| 檔案 | 位置 | 影響 |
| --- | --- | --- |
| `RightPanel/OptionsPanel.tsx` | `:71` `.with('rect', …)` | 會跳出 RectOptions（圓角）→ 要改走 STL 版 |
> 改用 packages/core/src/web/app/stores/selectedElementStore.ts nodeType 或 nodeCategory
| `RightPanel/ActionsPanel.tsx` | `:686` `P.union('rect', …)` | 會給到 2D 專用 actions |
> 改用 packages/core/src/web/app/stores/selectedElementStore.ts nodeType 或 nodeCategory
| `RightPanel/DimensionPanel/DimensionPanel.tsx` | `:171` `.with('ellipse','rect','image')` | 走 2D 尺寸邏輯 |
> 改用 packages/core/src/web/app/stores/selectedElementStore.ts nodeType 或 nodeCategory 判斷，並顯示 3D 版本
| `constants/canvasElements.ts` | `basicPaths` / `fillableElems` / `colorfulElems` / `visibleElems` | 都含 `rect` → 影響 infill、顏色、可見性判斷 |
| `svgedit/transform/recalculate.ts` | `:233` | 2D transform 吸收，會蓋掉 3D transform |
| `svgedit/transform/coords.ts` | `:116` | 同上 |
| `svgedit/interaction/mouse/index.ts` | `:360` `:832` `:1278` | 拖拉 / resize 行為 |
> 理論上不應在內雕模式觸發 2D 的 mouse 事件。若不禁用整個事件 handler，則將 2D 拖拉 / resize 套用到 3D 模式
| `svgedit/operations/booleanOperation.ts` | `:55` | 布林運算要排除 |
> 不支援 STL 物件
| `svgedit/operations/pathActions.ts` | `:1658` | rect → path 轉換要排除 |
> 不支援 STL 物件
| `helpers/convertToPath.ts` | `:236` | 同上 |
> 不支援 STL 物件
| `helpers/layer/convertClipPath.ts` | `:16` `:385` | clipPath 判斷 |
> 不支援 STL 物件
| `svgedit/layer/layerManager.ts` | `VISIBLE_ELEMENTS` 含 `rect` | 圖層可見元素統計 |
| `helpers/layer/convertShapeToBitmap.ts` | 整支 | ✅ 查證後**不會觸發** —— 觸發條件是 `printingModules`（PRINTER / PRINTER_4C）或 `UVModules`（UV_WHITE_INK / UV_VARNISH），而 Promark UV 的 `supportedModules` 是 `[LASER_UNIVERSAL]`。加測試釘住即可 |
| `dialogs/CodeGenerator/svgOperation.ts` | `:101` | `querySelectorAll('rect')` |
> 不會觸發

送工作流程（`export-funcs.ts` / `export-funcs-swiftray.ts`）會依序跑 `convertAllTextToPath` → `convertShapeToBitmap` → `getSvgString`，這三關都會碰到佔位 rect。

### A-2. STL 二進位資料怎麼存 ✅

**採用新的 block 6 + 用 svg content 裡既有的 unique id 對應。**

先回答被否決的兩個選項：

- **base64 inline 進 svgString**：不建議。svgString 會被送去 swiftray（`loadSVG`）、被 auto-save、被多分頁同步，base64 膨脹 4/3 倍且每次都要重複傳輸
- **`use` 格式**：不適用。`use` 是 SVG 節點對 `<symbol>` 的引用，STL 不是 SVG 節點，塞不進去

實作要點（`packages/core/src/web/helpers/beam-file-helper.ts`）：

- 新增 block type **6**（block 5 已被另一個開發中的功能佔用）
- 結構直接抄 image source block(0x02) 的 `id + binary` 重複格式（`generateImageSourceBlockBuffer` `:166`），id 用佔位元素既有的 unique id
- ⚠️ **header 是「位置固定」的 VInt 長度序列**（`generateBeamBuffer` `:225`、`readHeader` `:396`）。block 5 不存在時**仍要寫入長度 0**，否則位置會錯位。`metaData.contents` 要從寫死的 `[1, 2, 3, 4]` 改成實際存在的 block 列表
- ⚠️ `readBlocks` 遇到未知 block type 會直接停止解析（`:378` else 分支設 `currentOffset = -1`）。所以**新 block 必須放在所有已知 block 之後**，舊版 Beam Studio 才不會連帶吃掉後面的 block
- 讀檔時 `URL.createObjectURL()` 還原成 blob URL 丟給 `STLLoader`（比照 image 的 `origImage` 機制，`beam-file-helper.ts:302`）
- ~~需要 bump 簽章版本（目前 `[66, 101, 97, 109, 2]`）~~

**不存進 beam 檔的東西：材料形狀、折射率。** 只需要能判斷「這是內雕模式的檔案」即可。

> 💡 建議把內雕模式的 flag 放進 header 的 metaData JSON，這樣 `readBeamFileInfo` 可以在不解析全部 block 的情況下讀到（跟 workarea 一樣用於開檔時的 'ask-change-workarea' 詢問流程）。
> ⚠️ 副作用：重開檔案時材料設定會回到 BeamboxPreference 的預設值。如果使用者上次調過材料尺寸，重開後對不上，要確認這個行為可接受（或至少在開檔後提醒去確認材料設定）。

**其餘設定（層高、點距、打點/打線、3D transform）跟著佔位元素走 svg attributes**，不需要額外儲存機制。

### A-3. 前端怎麼把工作送到 swiftray ✅

**採「所有畫布內容一起傳」，STL 內容與 svg content 拆成兩個欄位。**

| 資料 | 傳輸方式 |
| --- | --- |
| STL mesh binary | `generateUploadFile`（`export-funcs-swiftray.ts:60`）回傳的 `IWrappedSwiftrayTaskFile` 增加 `stlObjects` 清單，key 用佔位元素 id；`swiftrayClient.loadSVG`（`swiftray-client.ts:302`）的 payload 一併帶上 |
| 層高、點距、打點/打線、3D transform | 佔位元素的 attribute → 隨 svgString 一起送，不用另外處理 |
| 折射率 | `svg-laser-parser.ts` 的 `getExportOpt` 增加對應欄位。已確認 swiftray 路徑也會用到（`export-funcs-swiftray.ts:343` 取 `getExportOpt(taskConfig).config`），會自動流進 convert options |
| 材料形狀 / 尺寸 / 位置 | **不傳**，僅前端做位置參考 |

其他要注意：

- swiftray client 的 `action()` 已有 binary 傳輸支援（`swiftray-client.ts:265`，payload > 4096 且 `SWIFTRAY_SUPPORT_BINARY` 時走 binary），大 STL 要確認走得通、不會被 JSON 序列化卡死
- 需要新增版本檢查 key **`SWIFTRAY_SUPPORT_STL`**（`version-checker.ts:38` 附近，跟 `SWIFTRAY_CONNECTION_TEST` / `SWIFTRAY_CONVERT_PREVIEW` / `SWIFTRAY_SUPPORT_BINARY` 放一起），舊版 swiftray 要擋下並提示升級

===========

前端（beam-studio：React） TODO
1、packages/core/src/web/app/constants/workarea-constants.ts interface WorkArea 增加一個 innerEngraving 的 boolean 選項，只有 promark uv 支援

> ✅ 確認放 `workarea-constants.ts`（不放 AddOnInfo）—— 這比較接近「雷射光源必須是 UV」的機種固有能力，而且目前不支援更換雷射管，不算 add-on。
> 💡 同時要在 `workareaConstants[uvModel]` 補內雕相關的物理規格（第 3 點的輸入框上下限會直接用到）：
> - Z 軸總行程約 **470mm**，對焦距離佔用約 **100~200mm**（可將出光口旋轉到另一個方向，材料擺在負數位置，對焦距離就不影響工作深度）
> - Z 最小精度 **0.001mm**
> - **材料高度上限 v1 先給 300mm**（保守值，實機驗證後再放寬）
> - 材料 XY **可以超過工作範圍（70×70mm）**，不要用 workarea 尺寸去限制材料尺寸的輸入上限
> 💡 v1 用 `checkFpm1UV()` 當 feature flag（見文末 Review 第 8 點）。

2、packages/core/src/web/app/components/dialogs/DocumentSettings/ 增加一個 InnerEngraving 的區塊（可以參考 RotaryBlock.tsx）
  - 只有在選中的工作區域支援 innerEngraving 時才顯示
  - 點擊齒輪顯示 InnerEngravingSettings（見下第三點）

> 💡 需要補「模式互斥」處理：內雕 vs 旋轉軸 / passthrough / auto-feeder / 曲面雕刻。既有的 `tGlobal.mode_conflict` 警告 icon 與 passthrough 的連動寫法可以直接參考。

3、InnerEngravingSettings：（實際上是內雕材料設定）（參考  packages/core/src/web/app/components/dialogs/RotarySettings.tsx）
  - 形狀類型：長方體、球體、圓柱體
  - 材料大小：長寬高（對與球、圓柱，長寬換成直徑，並且有一個聯動的圓周輸入框）
  - 材料位置：XY （不確定要以中心為準還是以左上角為準，暫時按目前對於畫布物件的 XY 顯示偏好 = 左上角）
  - 折射率
  以上選項都幫我加上適當的單位、小數點、上下限的設定

> ✅ **已確認的幾何前提**：圓柱體固定豎立（圓形切面與底部平行，不需要軸向選項）；球體會搭配同折射率的液體填平表面，球體的 Z 實際上是液面高度（前端不需顯示這個細節，照一般高度輸入即可）。
> 💡 **折射率**：原理待確認，先給合理範圍 —— 建議範圍 `1.000 ~ 3.000`、小數 3 位、預設 **1.52**（K9 / 光學玻璃約 1.5168，一般水晶玻璃 1.45~1.6）。
> 💡 **層高 / 點距**：單位 mm / inch，跟隨全域單位設定。建議層高範圍 `0.001 ~ 5mm`、預設 0.1mm；點距範圍 `0.001 ~ 5mm`、預設 0.1mm（實際值待實機驗證）。
> 💡 **材料尺寸上下限**：高度 v1 上限 300mm；XY **不要用工作範圍（70×70mm）當上限**，材料可以比工作範圍大（只是超出的部分雕不到，可以在 3D 畫布上用顏色標示超出區域）。
> ⚠️ **無法讀取當前 Z 軸位置，靠使用者手動對焦** —— 這件事需要 UI 配套，建議兩者都做：
> 1. 新增【初始對焦位置】設定（相對於材料，例如「材料底部 / 材料頂部 / 自訂偏移」），存進 documentStore
> 2. InnerEngravingSettings 內與**送出工作前**都顯示提醒：「請先手動對焦到 ○○ 位置」。送出工作的提醒建議做成必須勾選確認，避免使用者跳過（參考既有的 `handleExportAlerts.ts`）

開啟 InnerEngraving 選項後
  - 詢問是否保存當前工作
  - 清空畫布（TBD，先這麼實作）
  - 將畫布（<Workarea> id="svgcanvas"）需換成 three.js 版本（另外寫一個 Component 處理，見下第五點）

> 💡「清空畫布」建議走 `currentFileManager` 的新檔流程或直接開新分頁，不要只 clear DOM，否則 undo stack 會殘留 2D 物件造成狀態不一致。

4、檔案操作
  - packages/core/src/web/app/actions/beambox/svg-editor.ts handleFile 增加匯入 stl 檔案的 handler（僅在開啟 InnerEngraving 後支援，或在當前工作區域支援 InnerEngraving 時詢問是否開啟內雕模式，否則顯示不支援的檔案類型）。匯入後增加一個【自適應縮放】的提示窗（參考 packages/core/src/web/app/svgedit/operations/import/importBvg.ts 'ask-change-workarea'），若選擇是，則需要執行【居中於材料】（見下6-1）並【縮放到填滿的尺寸】。若匯入的檔案原本是內雕模式，且當前工作區域支援 InnerEngraving 時直接開啟內雕模式。
  - **匯入前預檢**（參考 `packages/core/src/web/app/svgedit/operations/import/importSvg/index.tsx` 的 `performSvgPreChecks`）：檢查檔案大小與複雜度，把多個警告合併成一個 alert，讓使用者選擇是否繼續，並提示「可能需要較長時間」
  - 匯入進度條（若好做就加）
  - 處理保存檔案的 thumbnail（packages/core/src/web/helpers/file/export/utils/beam.ts generateBeamThumbnail）和 送出工作的 thumbnail（packages/core/src/web/app/actions/beambox/export/generate-thumbnail.ts fetchThumbnail）。我不確定要怎麼顯示，大概可以使用某個特定角度的畫面？確保整個工作區域都在縮圖裡
  - ~~匯出多圖層 stl 檔案~~ → **不做**（STL 格式沒有圖層 / 顏色概念，binary STL 只有 80 bytes header + 三角面，要多圖層只能改 3MF）

> 💡 **預檢門檻建議**（回答「什麼大小比較危險」）：binary STL 的面數可以**不解析就算出來** —— `面數 = (fileSize - 84) / 50`，非常適合做快速預檢。
> - `> 20MB`（約 40 萬面）：一般警告，提示可能較慢
> - `> 50MB`（約 100 萬面）：強烈警告，建議先簡化模型
> - ASCII STL 無法用大小推面數，但 ASCII 通常比 binary 大 5~6 倍，光用檔案大小門檻就夠了
> - ⚠️ 因為**一個檔案可以有多個 STL**，門檻要用「場景累計面數」判斷，不能只看單一檔案。匯入第 N 個時要把已存在的物件一起算進去
> 💡 **進度條**：binary STL 解析本身很快，瓶頸在 Blob → ArrayBuffer 與建立 BufferGeometry。建議 v1 先用 nonstop progress（不確定百分比），之後有需要再搬進 Worker 做真進度。
> 💡 **STL 匯入的控制選項**：單位（多數 STL 沒有單位資訊，建議固定 mm 並提供 inch 選項）、是否置中、初始縮放（自適應）、上方向（Z-up / Y-up，Blender 匯出常是 Y-up）。
> 💡 匯入還需處理：binary 與 ASCII 兩種格式、非水密 / 破面網格（swiftray 切片會爆）。
> 💡 **Thumbnail**：用固定等角視角（isometric）離屏 render three.js scene，正投影相機 fit 材料 bbox，`renderer.domElement.toBlob()` 產圖。注意送工作的縮圖有格式 / 尺寸限制（jpeg、機器面板顯示大小），要沿用既有壓縮流程。
> 💡 其他也會碰到 STL 的檔案入口，要一併處理或明確擋掉：拖曳檔案進視窗、最近開啟檔案、myCloud 雲端檔案、範例檔案 menu、Electron `open-file` 關聯開啟。

5、立體畫布
  - 需要可以在 three.js 畫布中對 stl 物件 和 畫布本身 做移動、旋轉、縮放的操作，並且需要可以顯示當前的值 & 重置。其中對於 stl 物件的控制需要搭配 packages/core/src/web/app/svgedit/history/undoManager.ts 使用
  - 需要可以顯示第三點中設定的材料形狀（半透明淺灰色）。暫定這個材料物件是不可以移動的
  - stl 物件的顏色照舊套用圖層顏色（updateElementColor）
  - 畫布上需要有大小控制、視角控制（正投影 vs 透視圖，等角測試圖、前視圖、俯視圖、左側視圖、右側視圖等選項，選一個最常使用的作為預設值並提供重置按鈕）
  - 【V1】剖面預覽：用 three.js clipping plane 提供一個 Z 高度 slider，即時顯示模型在該高度的剖面
    - `renderer.localClippingEnabled = true` + `material.clippingPlanes = [new THREE.Plane(new Vector3(0, 0, -1), z)]`
    - 純 render 層功能，不做任何幾何運算，即時無延遲，不需要新增套件
    - 目的是讓使用者確認模型內部形狀，**不是**雕刻路徑預覽（路徑預覽見 TBD）
    - 材料形狀本身不套用 clipping，只裁 STL 物件
    - 建議剖面切口補一個 cap（stencil 或單純上色的 backface）避免看起來破面

> 💡 **畫布配色建議**（沿用既有色系）：
> - 背景（工作範圍外）：`#f0f0f0`
> - 工作範圍地板：`#fff` + 淡灰網格線（每 10mm）
> - 材料：半透明淺灰（`#dadada`，opacity 0.25~0.35，`depthWrite: false` 避免透明排序問題）+ 邊線（drei `<Edges>`，boxgen 已在用）
> - STL 物件：圖層顏色，選取時加 outline / emissive
> - 建議加座標軸指示器（drei `GizmoHelper` + `GizmoViewcube`），視角切換會直覺很多
> 💡 工具面：drei 有 `TransformControls`、`OrthographicCamera` / `PerspectiveCamera` 切換、`STLLoader` 在 `three/examples/jsm/loaders/STLLoader`。three 版本 0.159，都可用。
> 💡 **undo 整合**：3D transform 不能用 `recalculateDimensions()`（那是 SVG transform 專用），需要新增自己的 history command（參考 `svgedit/history/` 既有寫法），TransformControls 拖曳中要 debounce，放開才記一筆。
> 💡 **既有畫布周邊要一起處理**：TopBar 縮放 / 自訂縮放、rulers、滑鼠中鍵平移、快捷鍵（Delete / 方向鍵 / Ctrl+A）、右鍵選單 —— 目前都綁在 SVG 畫布上，換成 three.js 後要重接或停用。
> ⚠️ 效能 / 記憶體：大 mesh 要注意 `geometry.dispose()`（切分頁、關閉內雕模式時），否則 renderer 記憶體會漏。

6、STL 物件控制選項。以下內容若是不易與原本的 component 共用邏輯或內容過多，則新增一個 component 處理，名稱為同名 + 後綴 3D 或 STL。
  - packages/core/src/web/app/components/beambox/RightPanel/ObjectPanel.tsx：renderToolBtns 增加~~【居中於材料】、【居中於加工區域】，其中居中於加工區域指的是加工區域的 xy + 材料的 z。~~【居中於可加工位置】
  - packages/core/src/web/app/components/beambox/RightPanel/DimensionPanel/DimensionPanel.tsx：增加 Z 軸位置與尺寸、旋轉拆成 XYZ、flip 增加 Z 軸
  - packages/core/src/web/app/components/beambox/RightPanel/OptionsPanel.tsx：增加 STL 版本。控制項為【雕刻模式-填充（即現有的packages/core/src/web/app/components/beambox/RightPanel/OptionsBlocks/InFillBlock.tsx）】、【雕刻模式-打點/打線】、【層高】、【點間距（僅在選擇打點模式時顯示）】
  - packages/core/src/web/app/components/beambox/RightPanel/ActionsPanel.tsx：~~先只提供 array 功能。~~全部不支援

> ✅ per-object 一定可以支援（per-object vs per-layer 的取捨移到 TBD 討論）。
> 💡 DimensionPanel 3D 版注意：旋轉的歐拉角順序要固定並在 UI 說明（XYZ）、等比縮放鎖、Z flip 對非對稱模型的意義、以及「尺寸」是 bbox 尺寸還是縮放比。
> 💡 **ActionsPanel 其餘 actions 評估**：
> - 適合保留：Array（已列）、複製 / 貼上、鏡射（XYZ）、重設旋轉 / 縮放、置於材料底面 / 置中
> - 建議停用：Trace（描邊）、Grading、簡化路徑、Offset、Weld、破解群組、轉外框、變數文字 —— 都是 2D 向量專用
> - TBC：多個 STL 的布林運算（union / subtract），有需求但成本高，建議 v1 不做

7、Topbar / menu 工具調整
  - packages/core/src/web/app/components/beambox/TopBar/FrameButton.tsx（實際上是 packages/core/src/web/helpers/device/framing.ts 相關內容）
    - 確認 packages/core/src/web/app/svgedit/svgcanvas.ts getVisibleElementsAndBBoxes 可以處理 STL 物件 → ✅ **有佔位元素就無痛解決**，只要佔位元素的尺寸有跟 3D bbox 投影同步即可
    - 新增 FramingType【材料】，預覽材料形狀外框。**球體 / 圓柱體走圓形外框**，長方體走矩形外框
  - packages/core/src/web/app/components/beambox/TopBar/PathPreviewButton.tsx：不顯示
  - menu action（packages/core/src/web/app/components/beambox/TopBar/useMenuData.ts，apps/app/src/node/menu-manager.ts）：disable【START_TUTORIAL】【START_UI_INTRO】。檢查 editMenu 和 viewMenu 中，有沒有 STL 物件需要額外處理禁用的部分。檢查 fileMenu【EXPORT_BVG/SVG/PNG/JPG/UV_PRINT（UV_PRINT = PDF）】，若不支援，則 disable

> 💡 Promark framing 是 galvo 打線（`startPromarkFraming`），Z 不動 —— 需確認在材料表面 / 內部的框線是否看得到、以及 lowPower 設定是否適用。
> 💡 **相機預覽 / 校正保留**，走既有流程（不在停用清單裡）。預覽與校正結果在 3D 畫布上怎麼呈現見 TBD。
> 💡 其他該一併停用的入口：曲面雕刻按鈕、左側 Element Panel（圖形庫）、文字 / 形狀繪圖工具、Material Test Generator、Code Generator、Keychain Generator、圖片相關 dialog。

8、packages/core/src/web/app/components/beambox/SvgEditor/Banner.tsx：增加 【FLUX水晶內雕模式】

> 💡 記得 i18n key 要進 en.ts / zh-tw.ts。

===========

# 【Review】TODO 沒提到、建議補上的項目

1. **圖層參數（ConfigPanel）**：內雕要開哪些參數（功率 / 速度 / 頻率 / 脈寬 / 重複次數）、哪些要隱藏（DPI、Halftone、Ink、AutoFocus、Diode、AirAssist…）。要不要提供「水晶內雕」的參數預設集（LaserManageModal 參數庫）？
2. **送工作流程**：`export-funcs-swiftray.ts` 的 upload payload 擴充（見 A-3）、工時預估、Monitor 進度顯示與工作縮圖、中斷 / 續傳行為、**送出前的手動對焦提醒**（見第 3 點）。
3. **版本檢查**：新增 `SWIFTRAY_STL`（`version-checker.ts`）擋舊版 swiftray；韌體版本用 `VersionChecker` 檢查。
4. **auto-save / 當機復原 / 多分頁同步**：大型 STL 對這三個機制的影響 —— auto-save 頻率與大小、myCloud 上傳限制、`AwsHelper` 錯誤回報上傳。
5. **i18n**：23 個語系，開發期先 en.ts + zh-tw.ts，PR 前補齊。
6. **單元測試**：新的 store / utils / component 要有 `.spec`（專案有 `unit-test` skill 定義慣例）。
7. **E2E**：早期開發不加，**PR 前再確認有哪些要補**（有 `e2e-test` skill）。
8. **feature flag**：v1 gate 在 `checkFpm1UV()` 後。
9. **web 版行為**：無 swiftray → 隱藏內雕模式（見 A-4）。

# 【Review】風險

- **端到端驗證卡在 swiftray**：切片、折射率補償、F-code 產生全在後端。A-3 的 payload 欄位（`stlObjects`、`getExportOpt` 的折射率）建議先跟後端敲定並各自 mock，兩邊才能並行。
- **手動對焦是操作面的最大風險**：機器讀不到 Z 位置，使用者對錯焦距 = 整件報廢。提醒 UI 要做得夠強（見第 3 點）。
- **舊版相容**：舊版 Beam Studio 讀到 block 6 會停止解析後續 block（`readBlocks` 的 unknown type 分支），所以新 block 一定要排在最後。最多只能做到友善報錯。
- **大型 STL 的記憶體 / 存檔速度**：>50MB 的模型在 Electron renderer + beam 檔讀寫會很痛，靠第 4 點的預檢門檻擋。
- **SVG 畫布周邊功能大量失效**：ruler、zoom、快捷鍵、右鍵選單、框選都綁在 SVG 上，換 three.js 是這個功能裡最容易被低估的工作量。

# 【Review】仍待補充的資訊

1. **折射率的作用原理** —— 它怎麼影響不同高度的實際雕刻位置？（先用 1.000~3.000 / 預設 1.52 開發，實機驗證後再修正）
2. **層高 / 點距的實機合理範圍與預設值**（目前先用 0.001~5mm / 預設 0.1mm）

已確認：材料尺寸上限（高度 300mm、XY 不受工作範圍限制）／相機預覽與校正走既有流程／一個檔案可有多個 STL、V1 不支援 2D 物件／圖層 = 參數分組，一個圖層可含多個 STL／UI 沿用現有慣例。

===========

TBD：

- ~~開啟內雕模式後，還允許一般物件存在嗎？~~ → ✅ **V1 不支援 2D 物件，只允許 STL**（一個檔案可以有多個 STL）。「轉成平面單層外框」留待 v2 評估。
  > 💡 連帶：匯入 STL 前若畫布上有 2D 物件，走第 3 點的「詢問是否保存 → 清空畫布」流程；開啟內雕模式後，2D 的繪圖 / 匯入入口全部停用。

- 側欄繪圖工具要留哪些？
  > 💡 建議全部停用（含 Element Panel、文字、形狀），只留匯入 STL。

- 關閉內雕模式後，直接移除 stl 物件？
  > 💡 建議：提示「將移除所有 3D 物件」→ 確認後移除，並記進 undo（一個 batch command），可以復原。

- STL 物件要支援哪些 actions？
  > 💡 見第 6 點註解（Array / 複製 / 鏡射 / 重設 / 置中對齊）。

- 不開放 smart nest 的話，需要強制結束？
  > 💡 需要更多說明，我不確定這裡指的是曲面雕刻的 smart nest 還是別的。

- 【新增】層高 / 點距 / 打點打線是 per-object 還是 per-layer？
  > 現況：既有的雕刻參數（功率 / 速度 / 頻率 / 次數）全部是 **per layer**（ConfigPanel）；第 6 點把層高 / 點距放在 **per object** 的 OptionsPanel。
  > ⚠️ 已確認「**圖層 = 參數分組，一個圖層可以有多個 STL 物件**」—— 照這個定義，層高 / 點距放圖層才一致，放物件會讓「參數分組」這個定義破功。我傾向放圖層。
  > per-object 技術上一定可以支援（已確認），但會出現「同圖層兩個 STL 用不同層高」的情境，需要考量：
  > - 使用者心智模型：其他所有雕刻參數都在圖層，只有這三個在物件上，會不會混淆？
  > - F-code 產出順序：同圖層不同層高的兩個物件，要交錯掃描還是各自跑完？影響加工時間
  > - 參數預設集（LaserManageModal）是 per-layer 的，per-object 參數就進不了預設集
  > 折衷方案：放圖層，但允許單一物件覆寫（類似圖層參數的 override 概念）。

- 相機預覽 / 校正結果怎麼顯示？
  > ✅ 機器有相機，**預覽與校正流程沿用既有的**（不需要為內雕另做一套）。
  > 待決定的是結果在 3D 畫布上怎麼呈現 —— 建議貼成材料頂面的 plane texture（而不是像 2D 模式那樣當背景圖），這樣跟材料的相對位置才正確。校正結果（`camera-calibration` 相關 dialog）目前是 2D 疊圖，在 3D 畫布下要重新設計呈現方式。

- 內雕模式關閉路徑預覽？
  > 💡 是，關閉（第 7 點已列）。V1 只有第 5 點的剖面預覽（clipping plane），不做路徑預覽。

- 【新增】前端要不要自己做「切層路徑預覽」？（V1 不做，這裡記錄評估結果）
  > V1 的剖面預覽（第 5 點）只是 render 層的裁切，看不到實際輪廓線與打點位置。若之後要做真正的切層路徑預覽，有兩條路：
  >
  > **路線 A：前端自己切片**
  > - 演算法本身不難：mesh × 平面求交線，掃三角形取交線段再串成封閉 polyline，單層大約 150 行
  > - 效能是重點。暴力做 500 層 × 50 萬面 = 2.5 億次判斷，一定要加速結構
  > - 建議套件 **`three-mesh-bvh`**（目前不在 dependency，需新增；v0.7.x 對應專案的 three 0.159）。用 BVH 的 `shapecast` 只掃到與平面相交的三角形，官方 example 就有 cross-section / clipped-edges。搭配 Web Worker，50 萬面 / 500 層約 1~3 秒等級
  > - 其他評估過但不建議：`manifold-3d`（WASM，功能過剩且重）、`@jscad/*`（同樣重）、npm 上的 `slice-mesh` / `threejs-slicer` 等（未維護）
  > - 預估：2~3 天
  > - **⚠️ 最大問題是「兩套切片邏輯」**。層高、輪廓方向、填充 / 打點取樣間距、折射率 Z 補償，只要任一項跟 swiftray 的 libigl 實作有差異，就會出現「預覽跟實際打件不一樣」，這種 bug 極難追
  >
  > **路線 B：跟 swiftray 要切好的路徑回來畫（建議）**
  > - 在 A-3 的協定上新增一個「回傳切片結果」的指令，前端只負責畫
  > - 一份邏輯兩邊共用，不會有預覽與實際不一致的問題
  > - 跟 Promark 現有做法一致 —— `framing.ts` 的 `generateTaskCode()` 就是叫後端算，前端只畫
  > - 代價是需要往返後端，不像路線 A 可以即時拖 slider
  >
  > 結論：真的要做路徑預覽時走路線 B，除非後端遲遲無法提供、且互動即時性被證明是必要需求。

- 內雕模式禁用旋轉軸？若要禁用，需直接連動兩個設定，參考 passthrough
  > 💡 建議禁用，並沿用 passthrough 的連動 + `mode_conflict` 警告寫法。同時也要跟 auto-feeder / 曲面雕刻互斥。

- 內雕模式外框預覽要支援哪些方式？
  > 💡 建議 v1 只做兩種：【材料外框】（長方體矩形、球 / 圓柱走圓形）與【物件外框】（所有 STL 的 XY 投影外接矩形）。Hull / Contour 對 3D 意義不大且成本高。

- 內雕模式 thumbnail 怎麼顯示？
  > 💡 見第 4 點註解：固定等角視角 + 正投影相機 fit 材料 bbox，離屏 render。





08/06 with PM：
# 3D 畫布相關
1、Beam studio 2D 畫布是原點在左上：X 右、Y 下，畫布單位 0.1mm（雖然這個用戶應該看不出來），顯示單位 1mm / 1inch；
CAD 畫布好像習慣原點在左前下：X 右、Y 後（遠離人）、Z 上，單位 1mm；
Three.js 原點在左前下：X 右、Y 上、Z 前（靠近人），單位 1mm (旋轉後可以改成 CAD 的習慣，但默認控制器會是 Three.js 的習慣)；
xTool 原點在左後下：X 右、Y 前（靠近人）、Z 上，單位 1mm；
  > ~~盡量使用 Beam studio，可以和 CAD 不一致~~
  > with simon: 使用 CAD 座標軸

2、物件控制顯示在左下角 or 中心？
  > 中心

2、Beam studio 的匯入慣例是原大小 + 放置在畫布原點。3D 匯入時的【自適應縮放】要以彈窗+不再顯示的形式出現（需要判斷不再顯示時選擇了哪一種），還是以偏好設定的形式設定？
  > 預設就放置在中間（水晶內雕適合在中心處理，為了讓用戶習慣，預設在中心）
  > 【自適應縮放】的提示在物件超出材料時再顯示，小於時不用

2、原本 Beam studio 支援的 2D 物件（路徑、文字、圖片 等），在 3D 畫布上也要支援嗎？
  > 【Phase 1】2D 與 3D 互不兼容，切換時等於開新畫布，提示保存並清空。【Future】視情況擴展成 3D，可以設定成 2D 物件 + 固定高度 來轉換成 3D 物件。
  > 側欄工具也要隱藏

3、畫布顏色、選中效果
  > 畫布顏色 先遵循 Beam studio 慣例
  > 選中效果 藍框（顏色也照慣例）

4、3D 畫布中，相機預覽的結果要放在哪邊？（最底層 or 材料頂部）
  > 【Phase 1】禁用相機預覽。【Future】TBD

5、雕刻的安全距離（自適應縮放需要預留的 padding），xTool 留了 4mm
  > 4mm，DEV 允許自己設定（先放在文件設定裡）

6、居中於材料 = 忽略工作範圍限制的材料中心，居中於可加工位置 = 考慮工作範圍限制 + 安全距離的材料中心
  > 先只給【居中於可加工位置】

# 雕刻相關

1、Promark 目前沒有自動對焦功能，需要用戶在開始前手動對焦。算圖時假設用戶對焦在 z=0？也可以提供選項（例如工x料頂部=視材料設定改變，指定高度=給一個輸入框自己填）
  > 預設總是對焦到工作平台，之後依實際使用時的反饋再調整

2、重複雕刻可能會影響成果，要直接禁用 repeat 參數嗎？
  > 禁用

3、統一圖層內有多個 STL 物件時，以什麼順序處理？（畫布順序，物件最低位置，同一 Z 軸合併處理（這個的計算估計會複雜一點點））
  > 同一 Z 軸合併處理

4、層高與點間距要算做圖層參數還是物件參數？xTool 的所有參數都是放在物件裡的（包含我們的圖層參數）
  > 依實際使用時的反饋再調整

5、點間距 在處理無法整除的線段時，要怎麼取點？
  > 數量四捨五入，微調間距平均取樣


# 其他

1、STL 物件要支援哪些 actions？若是不支援 smart nest，在進入 3D 模式時，結束 or 隱藏？
  > 【Phase 1】全部不要；結束 smart nest。【Future】視情況擴展成 3D。

2、內雕模式、旋轉軸/廣域雕刻/曲面雕刻 等，只能開一個
  > Yes

3、內雕模式工作縮圖/檔案所圖怎麼顯示？ Claude 建議使用特定視角（等角視角 + 正投影）
  > Yes

4、路徑預覽功能
  > 【Phase 1】隱藏，DEV 開放。【Future】需要做成 3D 版本的預覽。

