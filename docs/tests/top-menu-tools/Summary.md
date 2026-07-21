# 上層選單工具 (top-menu-tools)

## 本分類測試範圍
本分類涵蓋上層工具選單提供的幾個獨立工具，以及與帳號登入相關的功能：

- **Boxgen 盒子產生器**：以寬高深、有蓋（Cover）、內外量測基準（Outer／Inner）、榫接方式（Edge／Finger／T-Slot）等參數產生可雷切的盒子面，並匯入畫布成為圖層與標籤（Label）。畫布上限會依機型工作區夾制輸入值。
- **條碼工具**：匯入 QR code 與條碼，驗證產出內容是否正確、縮放後送工作是否正確。
- **材質測試工具**：在欄／列指定不同參數（如強度、速度），展開成方格並匯出到畫布，用於試打材質參數。
- **登入相關功能**：FLUX ID 登入、登入資訊（icon 與 AI Credit）顯示、記住登入、以及一鍵去背等需登入才能使用的功能；另含註冊連結外連。
- **機器相關**：新增或設定機器（Wifi／有線／直連）、機器儀表板與機器資訊、檢測網路設定。

自動化策略：純幾何與純數列邏輯以 Jest 單元測試手算逐點鎖住；UI 互動、匯出落地與登入流程以 Cypress E2E 驗證；3D 預覽流暢度、機器儀表板、Google OAuth 等維持人工。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `apps/web/cypress/e2e/top-bar/boxgen.spec.ts` | Cypress E2E | Boxgen 寬高深夾制上下限、Outer／Inner、Cover、Edge／Finger／T-Slot 切換、匯入圖層與 Label | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/top-bar/material-test-generator.spec.ts` | Cypress E2E | 材質測試工具欄列即時重算、匯出方格圖層與文字結構、掃描軸端點與區間 | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/top-bar/flux-id-login.spec.ts` | Cypress E2E | FLUX ID 登入、登入資訊（email＋AI Credit）、記住登入、一鍵去背跳出確認視窗即取消（不消耗 credit） | Claude 自動產生 (2026-07) |
| `packages/core/src/web/app/components/boxgen/Shape.spec.ts` | Jest 單元 | 榫齒與 T 槽幾何逐點手算驗證（finger／t-slot、直徑與長度驅動、Cover 開關） | Claude 自動產生 (2026-07) |
| `packages/core/src/web/helpers/boxgen/vector2d.spec.ts` | Jest 單元 | `Vector2d` 向量縮放（`mul`）與不可變性 | Claude 自動產生 (2026-07) |
| `packages/core/src/web/helpers/boxgen/shapeHelper.spec.ts` | Jest 單元 | 方向常數、`transpose` 90 度旋轉、`Plotter` 相對／絕對繪圖游標 | Claude 自動產生 (2026-07) |
| `packages/core/src/web/helpers/boxgen/lineShader.spec.ts` | Jest 單元 | `ThicknessShader` 3D 線框著色器資源結構煙霧測試 | Claude 自動產生 (2026-07) |
| `packages/core/src/web/app/stores/boxgenStore.spec.ts` | Jest 單元 | Boxgen 參數 store 的替換／合併／重設／單位切換／不可變性 | Claude 自動產生 (2026-07) |
| `packages/core/src/web/app/components/dialogs/MaterialTestGeneratorPanel/generateSvgInfo.spec.ts` | Jest 單元 | 材質測試欄列展開為方格的純數列邏輯（內插、取整、命名、軸指派、除零保護） | Claude 自動產生 (2026-07) |
| `packages/core/src/web/app/components/dialogs/MaterialTestGeneratorPanel/TableSetting.spec.ts` | Jest 單元 | 各機型（一般／Promark Desktop／Promark MOPA）可選參數集與值域來源 | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/preference/advanced-params.spec.ts` | Cypress E2E | 「點擊註冊 FLUX ID 帳號」註冊連結外連目標 URL（本分類登入列引用） | 既有 |
| `apps/web/cypress/e2e/machine/connection.spec.ts` | Cypress E2E | 新增或設定機器（Wifi／有線網路／網路線直連），需本地機器／FLUXGhost（CI 以 envType 跳過） | 既有 |

交叉引用：`apps/web/cypress/e2e/left-panel/qrcode.spec.ts` 覆蓋本分類的「條碼工具」列（QR code 容錯等級、反白、條碼產出），但其 note 檔放在 canvas-editing 分類（QR Code 生成列），故本分類不重複列出 note，僅在此註明對應關係。

## 尚未自動化項目

| 項目（測試表列） | 未自動化原因 |
| --- | --- |
| 條碼工具：匯入後縮放 QR code／條碼並送出工作 | 縮放後的內容可在匯出前驗證，但送出工作的檔案正確性需 FLUXGhost 或實機，尚未自動化 |
| Finger 滑桿平移時 3D 圖「不卡頓」 | 流暢度屬視覺與效能感受（人工，Tier C）；滑桿變更觸發重算的部分已由 `boxgen.spec.ts` 覆蓋 |
| 機器儀表板：確認顯示內容是否正確 | 需實機連線（Tier B），納入本地測試批次；Monitor 元件已有 Jest 覆蓋 |
| 機器資訊 | 需實機連線（Tier B），納入本地測試批次 |
| 檢測網路設定 | 需本地網路環境與 FLUXGhost（Tier B） |
| 新手教學與介面介紹提示框位置 | mac／windows 視窗位置屬視覺檢查（人工，Tier C） |
| 登入功能：Google | Google OAuth 有 bot 偵測，自動化不可靠（人工，Tier C） |
| 一鍵去背完整消耗 credit 並完成去背 | `flux-id-login.spec.ts` 只驗證確認視窗跳出即取消，不消耗 credit；完整去背流程未自動化 |
