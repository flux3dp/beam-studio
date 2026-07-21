# Note of OpacitySlider.spec.tsx

## 對應測試表項目

Camera 分類：「相機預覽後的照片透明度調整功能正常 — 0%、25%、50%、75%、100%五個固定比例」的**邏輯半**。相機實影像上的視覺效果仍需相機模擬層（Tier D 評估中）或實機。

## 測試了什麼

共 15 個測試：

- 滑桿設定恰為五個固定檔位（`min=0, max=1, step=0.25` → 0/25/50/75/100%，**與表列完全一致**）。
- 預設值 100%（store `bgOpacity` 預設 1）正確顯示。
- 五個檔位逐一參數化驗證：顯示百分比正確、變更時寫入 store 的精確值。
- `#previewSvg` 元素的 `style.opacity` 與選值同步；元素不存在時不拋錯、store 仍更新。
- 變更後顯示的百分比即時同步。

## 設計理由

- jsdom 無版面配置無法拖真實滑桿，故 mock antd Slider 擷取其 props 與 `onChange`——驗證的是元件與 store 的合約，不是 antd 內部。
- 使用真實 `cameraPreview` store（全域 zustand 自動重置），與既有 store 測試同一慣例。

## 充分性分析

- 五段值、store 寫入、預覽層同步等可計算行為完整覆蓋。
- 未覆蓋：顯示/隱藏閘門在 `CanvasControl.tsx`（`activeMode === 'opacity'`），屬上層元件；相機影像上的實際視覺變化屬相機模擬層/實機範疇。

## 本次改進

新增本 spec（此元件原本零測試；A3 清單項目）。

## 待確認問題（Open Questions）

無。
