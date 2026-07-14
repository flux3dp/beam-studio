# Camera (camera)

## 本分類測試範圍

涵蓋相機預覽的整體功能：相機預覽是否可用、連線時間、預覽後的照片透明度調整（0%／25%／50%／75%／100% 五段固定比例）、影像描圖、二次預覽覆蓋、ESC 中止預覽序列、清除預覽、相機校正精度與相機預覽自動對焦流程。

由於 Cypress 無法攔截 WebSocket，多數相機案例需先建置相機模擬層（Tier D 專案）才能 E2E，或直接以實機驗證。目前先以 Jest 涵蓋純狀態機的部分——尤其是機型切換造成支援模式改變時的預覽模式協調邏輯。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `cameraPreview.spec.ts`（cameraPreviewStore） | Jest 單元 | 相機預覽 store 的預設狀態、部分合併，以及 supportedPreviewModes 變更時 previewMode／pendingPreviewMode 的協調邏輯（含 else-if 與 shallow 短路兩個注入驗證不變量） | Claude 自動產生 (2026-07) |
| `packages/core/src/web/app/components/beambox/SvgEditor/OpacitySlider.spec.tsx` | Jest 單元測試 | 相機預覽透明度五段（0/25/50/75/100%）滑桿：步進值、store 寫入、#previewSvg opacity 同步（15 個測試） | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/machine/camera-preview-readonly.spec.ts` | Cypress E2E（實機唯讀） | 每台一個測試：進入預覽→（Ador 走 Auto Focus「Enter Manually→0→Apply」捷徑）→雷射頭 REGION 相機框選拍照→HARD 斷言 `#previewSvg #backgroundImage` 取得 `blob:` 影像（＝真的拍到相機影格）。不送工作、雷射不作動。本地批次 `--machine-readonly` | Claude 自動產生 (2026-07) |

## 尚未自動化項目

- ~~相機預覽功能是否可以使用~~ — ✅ 已由 `camera-preview-readonly.spec.ts` 覆蓋並**硬斷言真的拍到相機影格**：實機 Beambox II (Kayden)、ador showroom 皆確認回傳 `blob:` 影像（Ador 5–14s、BB2 10–20s，2026-07-07）。連線時限另見 machine-settings 的 `connection-timing.spec.ts`。
- **相機拍照的機型注意事項**（已在 spec 內處理）：Ador 拍照前有 Auto Focus 對話框（測試以高度 0 捷徑繞過，僅驗證成像不驗精準對焦）；BB2 廣角相機需魚眼校正、無參數時不回傳影格——故 spec 改用雷射頭 REGION 相機。beamo II 若未完成相機校正會逾時失敗（需先校正）。共用展示機偶發間歇性由 `retries.runMode: 3` 吸收。
- **相機校正精度／自動對焦精度** — 仍屬實體輸出品質與面板操作流程，維持人工（Tier C）；本 spec 只驗證「有拍到影格」，不驗證對焦或校正的準確度。
- 相機預覽後放大縮小視窗顯示、影像描圖（兩圖層：點陣圖＋路徑）、照片透明度五段比例、二次預覽覆蓋、清除預覽、.beam 匯入後預覽保留、ESC 中止序列與中止後返回畫布 — 暫維持人工；若建置相機模擬層（Tier D，約 1–2 週）可自動化。
- 相機預覽調整高度（Ador） — 維持實機人工。
- 相機校正精度（四角方形＋中央正方形量測） — 屬實體輸出品質，維持人工（Tier C）。
- 相機預覽自動對焦（模組頭對焦、有無物件高度的兩種 pop-up 引導流程） — 屬機器面板操作流程，維持實機人工（Tier C）。
- Mac／Win 觸控板手勢放大縮小平移 — 合成手勢無法重現 OS 手勢管線，維持人工（Tier D）。
