# 機器設定 (machine-settings)

## 本分類測試範圍

涵蓋從「機器」選單 >「新增或設定機器」進入的機器設定畫面（BB2、Ador 等機型畫面是否正確），以及切換不同機型時畫布工作範圍是否正確調整：beamo（300×210）、beambox（400×375）、hexa（740×410）、beamboxII（600×375）。

各機型的畫布切換（canvas-switch）以斷言 viewBox 的方式自動化；機器設定畫面本身的完整驗證則尚待補寫。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `top-bar/workarea-modules.spec.ts` | Cypress E2E | 切換 beamo／beambox／hexa／beamboxII 時，逐一斷言各機型的畫布 viewBox 尺寸（涵蓋本分類的畫布切換列）。註：此 spec 檔實際歸於 viewport 分類 | Claude 自動產生 (2026-07) |

## 尚未自動化項目

- 從「機器」選單 >「新增或設定機器」進入 BB2、Ador 機器設定畫面是否正確 — 可自動化（Tier A），建議比照 `document-workarea.spec.ts` 的模式補寫 Cypress spec，目前尚未覆蓋。
