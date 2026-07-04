# Google Fonts 功能 (google-fonts)

## 本分類測試範圍

涵蓋 Google Fonts 面板的完整 UI 行為：搜尋欄過濾、Language 下拉選單過濾、Category 字體類別選擇，以及 Save（保存選擇）與 Cancel（不更動）兩個按鈕的語意。面板會打三個外部端點（FLUXID 字體資料、`fonts.googleapis.com/css2`、`fonts.gstatic.com`），因此採「stub 層」與「live 契約層」雙層設計：前者用固定 fixture 保證 UI 邏輯可預測、CI 永不不穩定；後者以真實網路守住上游 API 契約，在上游被改壞時故意失敗。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `right-panel/google-fonts-panel.spec.ts` | Cypress E2E（stub 版） | 以固定 fixture 攔截全部網路，驗證搜尋、語言、類別過濾、空狀態，以及 Save 套用與 Cancel 不變動；CI 可跑、不會不穩定 | Claude 自動產生 (2026-07) |
| `right-panel/google-fonts-live.spec.ts` | Cypress E2E（live 契約版） | 不 stub、直打真實網路，斷言 metadata API 回應的欄位形狀（Roboto 契約）、live 套用字體的端到端鏈路、live 清單的類別過濾；在 CI 以真實網路執行 | Claude 自動產生 (2026-07) |

## 尚未自動化項目

本分類 5 列測試表意圖（搜尋欄、Language 下拉、Category 類別、Save、Cancel）皆已由上述雙層測試涵蓋，無尚未自動化的功能列。唯一屬人工的部分為字體實際外觀的像素級渲染，此為 E2E 本質上無法驗證者，測試表亦未要求。
