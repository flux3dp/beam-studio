# Embed Project (embed-project)

## 本分類測試範圍

涵蓋軟體內建範例專案的載入是否正確，包含 Ador 雷射範例、Ador 列印範例（單色與彩色）、Beamo 與 Beambox 範例，以及各項材質測試範例（雕刻測試、雕刻測試-經典、切割測試、切割測試-簡易、列印測試、線段測試、壓克力聚焦尺測試）。

本分類全數已由既有 Cypress spec 自動化覆蓋，維持現狀。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `example-ador.spec.ts` | Cypress E2E | Ador 雷射範例、Ador 列印範例（單色）、Ador 印刷範例（彩色） | 既有 |
| `example-beam.spec.ts` | Cypress E2E | Beamo 範例、Beambox 範例、材質雕刻測試（含經典）、材質切割測試（含簡易）、材質列印測試、材質線段測試、壓克力聚焦尺測試 | 既有 |

## 尚未自動化項目

無 — 本分類所有項目皆已由既有 spec 覆蓋。
