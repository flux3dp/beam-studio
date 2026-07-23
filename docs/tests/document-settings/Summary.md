# 文件設定 (document-settings)

## 本分類測試範圍

涵蓋文件設定相關功能：當前位置雕刻（工作與外框預覽皆從當前位置出發）、文件設定中的 DPI（以不同 DPI 雕刻點陣圖確認解析度，點陣圖需開啟漸層），以及自動內縮功能（以 HEXA 測試複合填充路徑）。

本分類項目多需以實機驗證雕刻結果或屬機器行為，尚無專屬的自動化測試。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
|---|---|---|---|
| `apps/web/cypress/e2e/top-bar/dpi-resolution.spec.ts` | Cypress E2E（路徑驗證） | DPI 解析度對產生 gcode 的作用：掃描線數隨 DPI 倍增、間距減半、bbox 不變 + golden gcode 快照（需 FLUXGhost，本機批次執行） | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/top-bar/auto-shrink.spec.ts` | Cypress E2E（路徑驗證） | 自動內縮：HEXA 複合填充路徑外框內縮 0.05mm、內孔外擴、<250 DPI 引擎閘門驗證 + OFF/ON golden gcode（需 FLUXGhost） | Claude 自動產生 (2026-07) |

共用基礎：`apps/web/cypress/support/taskPath.ts`（gcode 擷取／解析／度量／golden 快照模組）與 `.claude/skills/e2e-test/SKILL.md` 的「Path-based verification」準則。其餘項目（當前位置雕刻、實機雕刻品質）維持實機人工。

## 尚未自動化項目

- 當前位置雕刻 — 工作與外框預覽是否皆從當前位置出發，屬機器行為，維持實機人工。
- 文件設定 > DPI — 以不同 DPI 雕刻點陣圖確認解析度，雕刻結果需實機人工；DPI 對工作設定的影響可考慮補單元測試（`layer-panel-resolution.spec.ts` 已涵蓋部分 UI）。
- 自動內縮功能（HEXA 複合填充路徑） — 實機結果需人工；若自動內縮的計算邏輯可抽離，建議補 Jest 單元測試。
