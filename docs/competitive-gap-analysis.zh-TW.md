# Beam Studio 競品功能差距分析（v3 整合版）

> 2026-07-04。整合本輪全部研究：LightBurn 官方文件（1.6/1.7）、xTool XCS（V2.5–2.7 最終版）、xTool Studio（V1.0–V1.7.30）、抖動實務調查（LightBurn 論壇等）、lead-in/out 實作研究、EasySet 對照、以及本產品程式碼查核（橋接/kerf/halftone/光斑常數）。
> 相關文件：`docs/feature-map.zh-TW.md`（功能盤點）、`docs/ui-entry-map.zh-TW.md`（入口層級）、`beam-studio-pm/docs/research/`（lead-in-out、easyset 對照）、`beam-studio-pm/docs/prd/`（各 PRD 與 PRIORITY.md）。

## 一、市場態勢

- **LightBurn**（付費第三方）：專業標準。1.7 原生支援 xTool 機器——第三方蠶食 OEM 軟體的結構性威脅對我們同樣成立。
- **xTool**：XCS 已終版（2025-06），**Studio 以月更速度**同時補生產深度（tabs/overcut/起點控制/lead-in）與生態（模板庫/版本歷史/AI Assistant）。世代交替空窗存在，但比原估計窄——**一年內多數「我們領先」項目會失效**。

## 二、查核後的實況矩陣（本輪重要修正）

| 能力 | Beam Studio | LightBurn | xTool（XCS/Studio） | 修正說明 |
|---|---|---|---|---|
| 橋接 tabs | ✅ 有（含手動模式） | ✅ | ✅（Studio V1.3+） | ❗原分析誤列為缺項——`tab_panel`／`components/TabPanel` |
| Kerf 補償 | ⚠️ 僅 Boxgen（`beam_radius`） | ✅ per-layer | ✅ | 缺一般圖層級 |
| Lead-in/out | ❌ | ✅（per-layer＋獨立起點工具） | ✅（XCS 金屬 lead-in；Studio 另有 overcut） | ❗原假設 xTool 缺席——錯誤；三方僅我們缺席 |
| 切割起點控制 | ❌（引擎固定先內後外） | ✅ | ✅（Studio V1.7） | 我們已有 `vector_order_optimization` 偏好作種子 |
| 照片抖動 | ⚠️ 僅漸層/閾值 | 8 種 | 7 種 | 實務調查：做 3–4 種＋UX 槓桿即可，見 §四-1 |
| 逐圖層參數＋預設 | ✅ | ✅ | XCS ❌／**Studio ✅**（16 層） | 領先縮小 |
| 變數文字 CSV | ✅ | ✅ | XCS ❌／**Studio ✅**（V1.5 Data Merge） | 領先縮小 |
| Web／行動編輯器 | ✅ 獨有（PWA＋mobile web） | ❌ | ❌（Studio 無 iPad/瀏覽器版） | **結構性優勢，對手短期補不上** |
| 材質庫產品化 | PRD 進行中 | Material Library | EasySet（QR 自動套參是旗艦鉤子） | 見 material-browser P1/P2 |
| 開放格式 | .beam＋SVG 匯出 | .lbrn 開放度中 | **.xs 單向鎖定** | 可打的互通話術 |

**仍然領先且要守住**：Web/行動全功能編輯、23 語言、內建產生器全家桶、3D 曲面探測式雕刻、圖層操作成熟度（合併/鎖定/模組切換）。
**對手的收費牆**（我們的話術空間）：Studio AI 上點數牆（去背也扣點）、免費雲端僅 50MB、.xs 鎖定。

## 三、PRD 覆蓋狀態（截至本輪）

| 優先 | 主題 | PRD | 狀態 |
|---|---|---|---|
| P0 | 照片抖動（3–4 種＋UX 槓桿） | `dither-modes.md` | ✅ 完成（D1：演算法標準品直接開發） |
| P0 | Kerf 補償（圖層級） | `kerf-compensation.md` | ✅ 完成 |
| P1 | Lead-in/out＋切割起點 | `lead-in-out.md` | 🔄 撰寫中（研究已完成） |
| P1 | 切割順序與規劃控制 | `cut-planner.md` | 🔄 撰寫中 |
| P1 | 材質庫 Phase 2（同步/照片/QR 預留） | `material-browser-phase-2.md` | 🔄 撰寫中（P1 已交付凍結） |
| P2 | 圖層設定彈窗（進階設定重構） | `layer-settings-popup.md` | 🔄 撰寫中 |
| P2 | Sub-layers 同幾何多重加工 | `sub-layers.md` | 🔄 撰寫中 |
| P2 | 相機即時疊圖＋手機拍照定位 | `camera-live-overlay.md` | 🔄 撰寫中 |

排序理由詳見 `beam-studio-pm/docs/prd/PRIORITY.md`。

## 四、第一級論點摘要

1. **照片雕刻**：感知差距最大的場景。範圍修正後：Atkinson 預設／Jarvis 大圖／Stucki-or-Floyd 擇一／Threshold＋Pass-Through；Grayscale 加二極體護欄；差異化在 **DPI 自動匹配光斑（程式碼尚無光斑常數，O6 待硬體）、材質配方、前處理自動化**——「新手不用懂演算法就雕得好」。
2. **加工深度（kerf／lead／起點）**：專業用戶流向 LightBurn 的主因，且 Studio 正逐月補齊——急迫。我們的組合拳：**export-time 非破壞幾何管線**（kerf→lead 共用、WYSIWYG 保留、golden gcode 可測）＋ **TabPanel 式畫布互動**（起點＋lead 一次放置、winding 自動翻內孔——對兩家皆為差異化）。
3. **切換成本**：LightBurn 式圖層設定彈窗（雙擊圖層、平鋪可見）直接服務 switcher/influencer 的肌肉記憶，同時償還 AdvancedBlock 長捲動 UX 債。

## 五、不建議跟進

通用控制器支援（LightBurn 本業）；MetalFab/服飾等多品類（跟隨 FLUX 硬體路線）；Map Designer 等長尾小工具；「xTool-tested」式徽章（material-browser P1-D17 已否決）。

## 六、一句話結論

> 以「export-time 幾何管線＋畫布互動」一次補齊加工深度三件套（kerf/lead/起點），照片雕刻用 UX 槓桿而非演算法數量取勝；材質庫 Phase 2 鎖定同步與 QR 預留；同時把行銷火力集中在對手結構性缺席的 **Web/行動編輯**與 **開放格式**。
