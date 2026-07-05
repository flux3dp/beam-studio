# Note of dpi-resolution.spec.ts（含 taskPath 路徑驗證模組）

## 對應測試表項目

文件設定分類：「文件設定 > DPI — 以不同 DPI 雕刻點陣圖確認解析度功能是否正常（點陣圖需要開啟漸層）」。實機雕刻品質仍屬人工抽查；本 spec 覆蓋的是 DPI 設定對**產生的工具路徑**的作用——這正是解析度功能的可計算本體。

## 測試了什麼

（需 FLUXGhost，CI 自動略過，本機以 `pnpm run cy:fluxghost` 執行）

- 匯入漸層點陣圖（`flux.png`，預設漸層開啟並有斷言）、縮至 20mm、經文件設定切換 DPI。
- **第一層（語意度量）**：medium（250 DPI）實測 570 條掃描線、間距 0.100mm；high（500 DPI）約 1140 條、間距 0.050mm——驗證線數隨 DPI 倍增（±15%）、間距減半、bbox 不變。
- **第二層（golden gcode 快照）**：固定場景在 medium 的完整 gcode 與版本標記的基準檔逐位元比對（`cypress/fixtures/golden-gcode/dpi-resolution-flux-20mm-medium.gc`）；已驗證同場景跨執行輸出逐位元一致。

## 設計理由

- 依 QA 方向確立的「路徑驗證」方法：功能影響的是輸出而非 UI 時，直接斷言 FLUXGhost 產生的 gcode。共用模組 `cypress/support/taskPath.ts` 提供 gcode 擷取（Path Preview 觸發 + FileReader hook，零原始碼修改）、解析（`G1V0`/`G1S0` 雷射開關方言）、與度量（bbox／掃描線統計／覆蓋網格／切割順序）。
- **兩層互補**：度量層說明「什麼性質成立」（引擎小改版仍穩定）；golden 層把 gcode 當作機器合約——任何一行差異都會浮現，預期中的變更以 `CYPRESS_updateGolden=1` 重生基準並於 PR 審閱，非預期即高優先回歸（不同 gcode 可能讓機器停擺）。
- 正規化極少：FLUXGhost gcode 無時間戳；僅剝除工具橫幅與我們自加的版本標記行。

## 充分性分析

- DPI 對輸出密度的合約（線數、間距、範圍）完整覆蓋；gcode 全文並受 golden 保護。
- 未覆蓋：實際雕刻的視覺解析度（材質、功率交互）——實機人工；ultra（1000 DPI）檔位未納入（轉檔耗時較長，medium/high 已證明倍增關係，需要時可加）。

## 本次改進

新增本 spec、共用模組 `taskPath.ts`、e2e-test.md 的「Path-based verification」兩層準則章節。後續 auto-shrink 等 spec 直接複用。

## 待確認問題（Open Questions）

1. golden 檔的引擎版本標記目前依賴 `CYPRESS_ghostVersion` 環境變數（FLUXGhost gcode 本身無版本字串）——FLUXGhost 升級流程中由誰負責帶入並重生基準？建議納入引擎發版 checklist。
2. 是否需要把 ultra（1000 DPI）檔位納入？（轉檔時間 vs 覆蓋收益的取捨）
