# Note of Shape.spec.ts

## 對應測試表項目
測試 Boxgen 盒子產生器（上層工具選單）最核心的榫齒幾何，對應測試表多個列，Agent Status 欄也明確點名本 spec：
- 「Outer、Inner、Cover 等按鈕動作正常」對應 Jest `components/boxgen/Shape.spec.ts`（有蓋幾何）。
- 「Edge、Finger、T-Slot 任意切換，3D 圖即時變化」對應 `Shape.spec.ts` 的 finger／t-slot 齒形（手算驗證）。
- 「T-Slot 調整 T 槽直徑和長度後右側 3D 圖即時變化」對應 `Shape.spec.ts` 的 t-slot 直徑／長度驅動幾何（手算驗證）。

## 測試了什麼
- `getTopBottomShape`（finger 榫接）：以 40×40、板厚 3、齒長 10 的基準盒為例，逐點比對整圈 37 個座標，確認四邊各有兩顆 10mm 外凸齒、內方邊界落在 ±17、齒尖落在 ±20。
- `getTopBottomShape`（t-slot，直徑 3）：在第一顆齒上切出置中、寬 3、深 3 的螺絲凹槽，逐點驗證。
- `getTopBottomShape`（t-slot，直徑 4）：改直徑後凹槽變寬，位置與深度隨之改變（最深至 y=-16），確認直徑真的驅動幾何。
- `getFrontBackShape`（t-slot，長 10）：切出含 M3 螺帽袋的槽，槽深等於 tSlotLength，逐點驗證（含手算的 boltThickness 2.7、boltWidth 1.5）。
- `getFrontBackShape`（tSlotLength 12）：槽底由 y=-10 加深到 y=-8，確認長度真的驅動槽深。
- `getFrontBackShape`（cover=false）：上緣拉直、無榫槽（無蓋時頂邊平直）。
- `getLeftRightShape`（finger 榫接）：上緣為內凹榫槽、側緣為外凸榫齒，做混合驗證。

## 設計理由
- 榫齒與 T 槽幾何是 Boxgen 的產品核心，數值只要錯 1mm 就切不合、盒子拼不起來。本 spec 不使用快照，而是在檔頭註解手算出每個座標，再逐點以 `toEqual` 比對，任何座標公式的變異都會立刻失敗，已通過刻意變異（mutation）驗證。
- 「改直徑」與「改長度」各配一組對照案例，確認這些參數不是被寫死，而是真的進入幾何運算，避免「參數失效」的回歸。
- cover=false 的對照直接鎖住「有蓋／無蓋」分支，對應測試表的 Cover 按鈕列。
- `getPts` 以百萬分之一為單位四捨五入吸收浮點雜訊、並把 -0 正規化為 +0，讓手算值能穩定比對。

## 充分性分析
- 就「榫齒幾何正確性」而言已充分：頂底、前後、左右三種面，finger 與 t-slot 兩種榫接，Cover 開關，以及直徑與長度的驅動效果皆有逐點驗證，是測試表「匯出內容是否正確」在幾何層最硬的保證。
- 刻意未涵蓋：Edge（無榫）模式的整圈路徑，以及 volume=inner 時的尺寸換算，目前只測 finger／t-slot 與預設的 outer。詳見待確認問題。
- 刻意未涵蓋：UI 按鈕點擊、store 狀態、匯入畫布後的圖層與標籤（Label）、3D 即時預覽，這些由 Cypress `top-bar/boxgen.spec.ts` 與人工檢查涵蓋。
- 刻意未涵蓋：xCount／yCount 的取整邊界（例如齒長無法整除導致齒數變化），目前僅測 34／10／2→2 這一組整齊值。詳見待確認問題。

## 本次改進
無，經檢視後判斷現有測試已足夠。
（本 spec 對測試表明列的三列 Boxgen 幾何需求，已提供逐點的硬驗證；未涵蓋的 Edge 模式與 volume=inner 屬「加分覆蓋」，而非測試表缺口，故不在本次強制補寫，改列為待確認問題供人工決定。）

## 待確認問題（Open Questions）
- Edge（無榫、joint 為直邊）模式目前沒有幾何案例。測試表「Edge／Finger／T-Slot 任意切換」把 Edge 也列入，是否需為 Edge 補一組逐點驗證？或其正確性已由 Cypress `top-bar/boxgen.spec.ts` 的匯出斷言涵蓋？
- volume=inner 與 outer 的尺寸換算目前只測 outer；inner 模式對應測試表的「Inner 按鈕」，是否需補一組案例驗證內外量測基準的座標差異？
- 榫齒數量取整（`Math.round(inner/teethLength/2)`）在齒長無法整除時（例如 width=45、teethLength=10）的邊界行為，是否有需要鎖死的容差或取整規則？目前基準值皆為整齊整除的情形。
