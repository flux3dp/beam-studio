# Note of camera-preview-readonly.spec.ts

## 測了什麼

「唯讀相機預覽」測試（Tier B，僅本地實機批次；GitHub 與未設定機器名稱時自動跳過），對應測試表第 200–201 列「相機預覽功能是否可用／相機連線」。**每台機器一個測試**（單次連線，避免共用機台重連不穩），流程：

1. 點左側 Preview 按鈕（`#left-Preview`）進入預覽模式。
2. **Ador 的 Auto Focus 對話框**：本測試只要驗證「有沒有拍到影格」不需精準對焦，故走手動高度 0 的捷徑——點「Enter Manually」（`PreviewHeight.tsx` 內部即把值設為 0）→ 下一步點「Apply」提交。
3. **觸發拍照**：優先用**雷射頭 REGION 相機**（點 `#laser-head-camera` 後在畫布框選）——實測 Ador 與 BB2 皆能只靠一張床面照回傳影格；僅當機器不提供 REGION 相機時才退回廣角 `#wide-angle-camera`（廣角需魚眼校正參數，無參數時不回傳影格）。
4. **HARD 硬斷言**：影像確實落進 `#previewSvg #backgroundImage` 且 `xlink:href` 為 `blob:` 開頭（＝真的拍到一張相機影格），逾時 40 秒。退出預覽回畫布。

## 關鍵發現（實測 2026-07-07）

逐台實機跑，釐清相機拍照的兩個機型陷阱並解決：

- **Ador（ador showroom）**：拍照被「Auto Focus」對話框擋住。走「Enter Manually → 0 → Apply」手動高度捷徑後，REGION 框選即成功回傳影格（約 5–14 秒）。
- **Beambox II（Kayden）**：**廣角相機 `#wide-angle-camera` 不回傳影格**（需魚眼校正），但**改用雷射頭 REGION 相機（框選）就成功回傳影格**（約 10–20 秒）。因此手勢改為 REGION 優先、廣角僅作退路。

**共用展示機台的間歇性**：BB2 的 REGION 拍照偶爾單次逾時（機台被他人使用／相機忙碌）；由 `cypress.config.ts` 的 `retries.runMode: 3`（共 4 次嘗試）吸收，實跑整批 8/8 綠。

**唯讀性界定**：以「是否送工作」而言為唯讀——會讀機床相機、雷射頭會移動以取景，但**不上傳 F-code、雷射不作動、不送任何工作**。

## 實測結果（2026-07-07，本地實機批次）

- **Beambox II (Kayden) 與 ador showroom 皆確認拍到真實相機影格**（`#previewSvg #backgroundImage` 取得 `blob:` 影像）：Ador 約 5–14 秒、BB2 約 10–20 秒。整批 `--machine-readonly` 8/8 通過。
- 前次觀察到的阻擋（Ador 自動對焦、beamo II 缺校正、BB2 廣角無影格）已釐清：對焦以高度 0 捷徑繞過、BB2 改走 REGION 相機；beamo II 若缺校正資料仍會逾時失敗（需先完成相機校正）。

## 設計重點

- 成功訊號取自 DOM（`#previewSvg #backgroundImage` 的 `xlink:href`），因為 `cameraPreviewStore` 未掛在 window 上，無法直接讀 store 狀態；DOM 影像元素是最穩固的可觀測點（`canvasBackground.ts` `setBackgroundImage`）。
- 拖曳（非單擊）才會走 `previewRegion`；單擊會走點預覽 `preview(x,y,{last})`。框選區域涵蓋所有機型都支援的 REGION 模式。
- 25 秒預算為軟性上限；若某機型首拍常態超時，應依機型調整。

## Open Questions

- 二次預覽覆蓋、清除預覽、ESC 中止序列、.beam 匯入後預覽保留、透明度五段——仍維持人工，或待相機模擬層（Tier D）自動化；本測試只覆蓋「基本可用＋連線時限」。
- Ador 廣角相機（`#wide-angle-camera`／Mode.FULL_AREA）與離焦調高——本測試走 REGION 模式，未涵蓋廣角流程。
- 北美 locale 下 Live Feed／部分相機功能有閘門（Glowforge 專利脈絡），與此唯讀拍照測試無關，但若擴充即時預覽測試需留意。
