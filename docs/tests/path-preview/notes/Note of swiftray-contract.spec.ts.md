# Note of swiftray-contract.spec.ts

## 對應測試表項目

- 路徑預覽分類「切割雕刻順序（分成 Swiftray 啟動與否）」的 **Swiftray 引擎變體**——web 介面無法切換 Swiftray 引擎（`hasSwiftray` 恆為 false），本 spec 改由服務層直接驗證。
- 廣義而言也是 Swiftray 後端服務的「契約測試」：釘住應用程式所依賴的協定欄位，Swiftray 版本升級若改變協定即會被抓到（角色類似 google-fonts-live 之於 Google Fonts API）。

## 測試了什麼

共 4 個測試（CI 上自動略過；本機以 `pnpm run cy:swiftray` 執行，會先檢查 6611 埠是否有 Swiftray 在監聽）：

1. **連線與系統資訊契約**：以應用程式相同的訊息格式呼叫 `/ws/sr/system` 的 `getInfo`，驗證回應包含 `swiftrayVersion`（`handleOpen` 實際讀取的欄位）、`os`、`cpuArchitecture`、`qtVersion` 且型別正確。
2. **裝置列表契約**：呼叫 `/devices` 的 `list`，驗證 `success` 與 `devices` 為陣列（本機沒接 Promark，內容為空屬預期，只驗結構）。
3. **SVG 轉檔契約（核心）**：以 `export-funcs-swiftray.ts` 相同的酬載結構走 `loadSVG` → `convert`（gcode 輸出），驗證轉檔成功且回傳的 gcode 非空、含 `G0/G1` 移動指令。
4. **切割順序（引擎層）**：送入「一個大矩形包住兩個小矩形、同一圖層」的場景，解析回傳 gcode 的 XY 切割路徑，將各段歸類為內部物件或外框，驗證**先切完內部、才切外框**。實測順序：內部 A → 內部 B → 外框。

## 設計理由

- web 版的引擎選擇被 `hasSwiftray` 寫死關閉（連 Promark 也不例外），UI 層無法觸發 Swiftray；但 `swiftrayClient` 在模組載入時就無條件連上 `ws://localhost:6611`，代表協定層是可達的。與其在 UI 繞路，不如直接以應用程式自己的訊息格式對協定做驗證——測到的正是應用程式所依賴的東西。
- 切割順序屬於引擎行為而非 UI 行為，在 gcode 層驗證反而比 UI 取樣更直接、更精確。

## 充分性分析

- Swiftray 引擎的轉檔正確性與切割順序已在引擎層覆蓋；搭配 `path-preview-ghost.spec.ts`（FLUXGhost/beamify 引擎、UI 取樣驗證），測試表「分成 Swiftray 啟動與否」兩個變體都有著落。
- 未覆蓋：Electron 端「UI 上切換 path-engine 偏好 → 實際改走 Swiftray」的整合路徑（web 無法觸及，屬 Electron 測試範疇）；Promark 實機的裝置控制指令（startTask 等，需實機）。

## 本次改進

新增本 spec 與 `cy:swiftray` 執行群組（`apps/web/scripts/cy-local-rig.sh` 增加 `SWIFTRAY_SPECS` 清單與 6611 埠存活檢查；`--all` 已包含）。

## 待確認問題（Open Questions）

1. **座標比例**：實測此場景的 SVG 使用者單位對應 gcode 的比例是 100 units/mm，而非 viewBox 暗示的 10 units/mm——是 `loadSVG` 酬載中 `defaultConfig` 的預期行為，還是縮放上的潛在問題？建議由熟悉 Swiftray 的人確認（spec 內以實測值校準並附註解）。
2. Swiftray 版本升級的相容策略：本 spec 釘住的是 1.4.6 的協定欄位；若協定有計畫性變更，應同步更新此契約測試——是否要把它納入 Swiftray 發版檢查流程？
