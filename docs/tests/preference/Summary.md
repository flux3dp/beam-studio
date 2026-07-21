# 偏好設定 (preference)

> 註：測試表（CSV）中本分類的群組標題誤植為「Perefence」，正確拼字為 Preference。

## 本分類測試範圍
涵蓋偏好設定各項的持久化與行為，包含：語言、機器 IP 記錄與自動搜尋、預設單位字體字型、預設文件設定與機型識別、參考線與參考線座標、連續繪製、限制上限速度（向量路徑 20mm/s）、自動替換字體、列印參數進階設定、混合雷射預設與偏移值、重置所有設定，以及註冊 FLUX ID 外連。部分項目（移除通知、移除軟體更新檢查、點陣圖預覽品質、反鋸齒、路徑計算優化）依測試表判定暫不測試。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `preference/advanced-params.spec.ts` | Cypress E2E | 列印進階模式與 UV 列印檔開關持久化、向量路徑限速開關、混合雷射預設關與偏移 70/7、FLUX ID 註冊外連 | Claude 自動產生 (2026-07) |
| `right-panel/speed-limit-warning.spec.ts` | Cypress E2E | 向量路徑限速 20mm/s，含 BB2 上限 50mm/s 分支 | Claude 自動產生 (2026-07) |
| `top-bar/workarea-modules.spec.ts` | Cypress E2E | 機型識別：Ador 切換雷射機型時跳出 work area 提醒 pop-up | Claude 自動產生 (2026-07) |
| `packages/core/src/web/helpers/auto-save-helper.spec.ts` | Jest 單元測試 | 自動儲存邏輯：預設組態、計時觸發、啟停與間隔變更、檔案數修剪、目錄異常處理（16 個測試） | Claude 自動產生 (2026-07) |
| `language.spec.ts` | Cypress E2E | 語言切換 | 既有 |
| `machines-ip.spec.ts` | Cypress E2E | 新機器 IP 記錄、自動搜尋機器 IP | 既有 |
| `preference-display.spec.ts` | Cypress E2E | 預設單位、預設字體、預設字型、自動替換字體 | 既有 |
| `preference-behavior.spec.ts` | Cypress E2E | 參考線、參考線座標、連續繪製 | 既有 |
| `top-bar/document-workarea.spec.ts` | Cypress E2E | 預設文件設定，將機器由 Ador 調整為其他多機型排列組合 | 既有 |
| `preference/reset.spec.ts` | Cypress E2E | 重置所有設定 | 既有 |

## 尚未自動化項目

| 項目 | 原因 |
| --- | --- |
| 自動儲存 | 建議以 Jest 單元測試 `auto-save-helper.ts`（fake timers 加 mock 儲存層），目前無測試。 |
| 移除通知 | 測試表判定暫不測試（不用）。 |
| 移除軟體更新自動檢查 | 測試表判定暫不測試（不用）。 |
| 點陣圖預覽品質 | 測試表判定暫不測試。 |
| 反鋸齒 | 測試表判定暫不測試。 |
| 路徑計算優化（TEXT） | 測試表判定暫不測試。 |

## 跨分類註記
`top-bar/workarea-modules.spec.ts` 同時覆蓋機器設定分類的畫布切換列與本分類的機型識別列。機器設定分類的 Summary 由另一位 agent 撰寫，此處僅註明本 spec 的跨分類覆蓋。
