# 檢視區 (viewport)

## 本分類測試範圍
涵蓋畫布檢視區的操作與工作範圍相關行為，包含：各機型與 Ador 各模組切換後的工作範圍（畫布 viewBox）更新、放大縮小、配合視窗尺寸、尺寸百分比、顯示格線與圖層顏色、滑鼠滾輪縮放平移、空白鍵拖曳平移，以及物件移動時的自動對齊與吸附。觸控板手勢因無法在自動化中重現作業系統手勢管線，維持人工測試。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `canvas/wheel-pan-zoom.spec.ts` | Cypress E2E | 滑鼠滾輪縮放（僅視圖、不動物件）、空白鍵拖曳平移、中鍵拖曳平移 | Claude 自動產生 (2026-07) |
| `top-bar/workarea-modules.spec.ts` | Cypress E2E | 各機型畫布 viewBox、Ador 各模組切換維持 4300x3200、列印圖層轉換警告 pop-up | Claude 自動產生 (2026-07) |
| `zoom.spec.ts` | Cypress E2E | 放大縮小，以及縮放後物件相對位置維持 | 既有 |
| `view.spec.ts` | Cypress E2E | 配合視窗尺寸、自動配合視窗尺寸、尺寸百分比、顯示格線、顯示圖層顏色 | 既有 |
| `auto-align.spec.ts` | Cypress E2E | 物件移動時顯示對齊線、靠近時自動吸附、顯示與鄰近物件距離（1mm 以內不顯示） | 既有 |

## 尚未自動化項目

| 項目 | 原因 |
| --- | --- |
| Mac/Win 觸控板操作放大縮小平移 | 合成的觸控板手勢無法重現作業系統手勢管線，自動化會產生假信心，維持人工（Tier D）。 |

## 跨分類註記
`top-bar/workarea-modules.spec.ts` 同時覆蓋機器設定分類的畫布切換列（beamo/beambox/hexa/beamboxII 各機型畫布尺寸）與 Preference 分類的機型識別列（Ador 切換雷射機型時跳出 work area 提醒 pop-up）。機器設定分類的 Summary 由另一位 agent 撰寫，此處僅註明本 spec 的跨分類覆蓋。
