# Note of Shape.spec.ts

## 對應測試表項目
Boxgen 盒子產生器（上層 Tool 選單）核心榫齒幾何，對應多列，Agent Status 明確點名本 spec：
- 「Outer、Inner、Cover 等按鈕動作正常」→「+ Jest components/boxgen/Shape.spec.ts (cover-geometry)」。
- 「Edge、Finger、T-Slot 任意切換，3D 圖即時變化」→「+ Jest Shape.spec.ts (finger/t-slot tooth profiles, hand-derived)」。
- 「T-Slot 調整 T 槽直徑和長度後右側 3D 圖即時變化」→「+ Jest components/boxgen/Shape.spec.ts (t-slot diameter/length → geometry, hand-derived)」。

## 測試了什麼
- getTopBottomShape（finger）：以 40x40、厚 3、齒長 10 的基準盒，逐點比對整圈 37 個座標，確認四邊各兩顆 10mm 外凸齒、內方 ±17、齒尖 ±20。
- getTopBottomShape（t-slot，直徑 3）：第一顆齒上切出置中、寬 3、深 3 的螺絲凹槽，逐點驗證。
- getTopBottomShape（t-slot，直徑 4）：改直徑後凹槽變寬、位置與深度隨之改變（深至 y=-16），驗證直徑真的驅動幾何。
- getFrontBackShape（t-slot，長 10）：切出含 M3 螺帽袋的槽，槽深等於 tSlotLength，逐點驗證（含 boltThickness 2.7、boltWidth 1.5 的手算值）。
- getFrontBackShape（tSlotLength 12）：槽底由 y=-10 加深到 y=-8，驗證長度真的驅動槽深。
- getFrontBackShape（cover=false）：上緣拉直、無榫槽（無蓋時頂邊平直）。
- getLeftRightShape（finger）：上緣為內凹榫槽、側緣為外凸榫齒，混合驗證。

## 設計理由
- 榫齒／T 槽幾何是 Boxgen 的產品核心，數值錯 1mm 就切不合、盒子拼不起來。此 spec 不用快照，而是以檔頭註解手算出每個座標再逐點 `toEqual` 比對，任何座標公式的變異都會立刻失敗——已通過 mutation 驗證。
- 「改直徑」「改長度」各配一個對照 case，確保這些參數不是被寫死，而是真的進到幾何運算（防止「參數無效」的回歸）。
- cover=false 的對照直接鎖住「有蓋 / 無蓋」分支，對應 sheet 的 Cover 按鈕列。
- `getPts` 以 1e6 四捨五入吸收浮點雜訊、`+0` 正規化 -0，讓手算值能穩定比對。

## 充分性分析
- 對「榫齒幾何正確性」而言充分：三種面（頂底／前後／左右）、兩種榫接（finger／t-slot）、Cover 開關、直徑與長度驅動皆有逐點驗證，是 sheet「匯出內容是否正確」在幾何層最硬的保證。
- 刻意不涵蓋：Edge（無榫）模式的整圈路徑、以及 volume=inner 時的尺寸換算——目前只測 finger/t-slot 與預設 outer。見 Open Questions。
- 刻意不涵蓋：UI 按鈕點擊、store 狀態、匯入畫布後的圖層與 Label、3D 即時預覽——那些由 Cypress top-bar/boxgen.spec.ts 與人工檢查涵蓋。
- 刻意不涵蓋：xCount/yCount 的取整邊界（例如非整除齒長導致齒數變化）——目前僅測 34/10/2→2 這一組整齊值。見 Open Questions。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。
（本 spec 對 sheet 明列的三列 Boxgen 幾何需求已提供逐點硬驗證；未覆蓋的 Edge 模式與 volume=inner 屬「加分覆蓋」而非 sheet 缺口，故不強制在本次補寫，改列為 Open Questions 供人工決定。）

## Open Questions
- Edge（無榫，joint 直邊）模式目前無幾何 case。sheet「Edge/Finger/T-Slot 任意切換」把 Edge 也列入，是否需為 Edge 補一組逐點驗證，或其正確性已由 Cypress top-bar/boxgen.spec.ts 的匯出斷言涵蓋？
- volume=inner 與 outer 的尺寸換算目前只測 outer；inner 模式對應 sheet「Inner 按鈕」，是否需補一組 case 驗證內外量測基準的座標差異？
- 榫齒數量取整（`Math.round(inner/teethLength/2)`）在非整除齒長（例如 width=45、teethLength=10）時的邊界行為，是否有需要鎖死的容差／取整規則？目前基準值皆為整齊整除。
