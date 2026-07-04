# Note of path-preview-ghost.spec.ts

## 對應測試表項目
路徑預覽 Path Preview 分類中，需要 FLUXGhost 的三列：
- 「Start Here 功能是否正常 向量／圖片」：「預覽『從這裡開始』（開啟算圖加速時沒有 Start Here）」。
- 「計算時間是否與畫布右下角一樣」。
- 「切割雕刻順序」：「在同一圖層，使用純路徑，先畫幾個小的封閉路徑物件，再畫一個大的封閉路徑物件將小的物件圍起來；使用路徑預覽確認是否會先切內部的小物件再切外層的物件（分成 Swiftray 啟動與否）」。

測試表自動化欄目前標示 `top-bar/path-preview-ghost.spec.ts (done, passing; needs FLUXGhost — pnpm run cy:fluxghost)`。

## 測試了什麼
- `Start Here: control is present, timeline seeking updates position, and play toggles it`：畫一個矩形進入路徑預覽後，Start Here 按鈕存在且初始為啟用（playState 為 STOP）。剛進場時目前位置停在原點佔位值（0, 0）；把時間軸拖到中段後，側欄的目前位置變為非原點的真實座標；按播放後 Start Here 變 disabled（`isStartHereEnabled = playState !== PLAY`），按停止後恢復為啟用。
- `estimated time: path-preview side panel matches the canvas bottom-right estimate`：先在畫布右下角把顯示切為「Estimate time」並點擊觸發估算，解析出畫布估算秒數（大於 0）；再進入路徑預覽，解析側欄「Total Time Estimated」秒數，兩者以 2 秒容差比對相符。
- `cut order: inner enclosed rects are cut before the outer enclosing rect`：在同一圖層畫一個大外框與三個位於中央的小矩形，進入路徑預覽後沿時間軸取樣多個目前位置，由所有取樣點推導出邊界框，斷言至少有一個嚴格位於內部的取樣點，且所有內部取樣都發生在首次觸及外框邊界之前，藉此驗證「先切內部、後切外框」。

## 設計理由
- 需要 FLUXGhost，CI 自我略過：這三個案例都依賴 FLUXGhost 完成工具路徑計算，因此 spec 以 `if (isRunningAtGithub) return` 在 GitHub Actions 上自我略過，本機以 `pnpm run cy:fluxghost` 執行。`wireBackendAndLand` 與 `enterPathPreview` 的接線與進場方式，與 `path-preview-toggles.spec.ts` 相同（有 ghostPort 時在 `onBeforeLoad` 寫入 `host=127.0.0.1` 與 `port`，否則退回 `setUpBackend`；用 forced-click 繞過無機器時的視覺 disabled 狀態）。
- 時間估算兩處同源：側欄的「Total Time Estimated」與畫布右下角的估算都源自同一個 FLUXGhost `fileTimeCost`（側欄經 `timeDisplayRatio = fileTimeCost / (60 * simTimeMax)`，畫布經 `FormatDuration(fileTimeCost)`），兩者只在 h/m/s 進位上有差異，故以 2 秒容差（`closeTo(canvasSeconds, 2)`）比對。兩處共用同一個 `parseHmsSeconds` 解析器，因為兩者格式相同。
- 切割順序以取樣座標分類驗證：外框正好是整個圖形的邊界框，其周長落在 X/Y 極值上，而內部小矩形嚴格位於內部。測試沿時間軸（依 simTime 排序）取樣目前位置，由實際取樣點推導邊界框，再以 8mm 容差判定某點是否落在邊界框周長上，藉此把取樣點分類為「內部」或「外框」，驗證內部點在時間上早於外框點。忽略在邊界剛好回傳 (0, 0) 的原點佔位讀值。

## 充分性分析
- Start Here 的存在、時間軸拖動更新位置、播放與停止切換啟用狀態，三者覆蓋充分。
- 時間估算的兩處一致性以同源加容差驗證，對應測試表「計算時間是否與畫布右下角一樣」的意圖。
- 切割順序以「先內後外」的時間先後驗證，對應測試表意圖。
- 已知範圍限制：web 版的 `hasSwiftray` 恆為 false（`helpers/api/swiftray-client` 的 `checkSwiftray` 回傳 `!isWeb() && …`），因此 `getConvertEngine().useSwiftray` 永遠為 false。這帶來兩個 web E2E 無法覆蓋的分支，spec 註解已說明：
  - Swiftray 引擎變體的切割順序：web 版只會走 FLUXGhost/beamify 引擎（`fetchTaskCode`），Swiftray 開關無法從 web 端切換，故測試表「分成 Swiftray 啟動與否」中的 Swiftray 分支只存在於 Electron。
  - 「算圖加速隱藏 Start Here」分支：會隱藏 Start Here 的「Path Calculation Acceleration」偏好藏在 Swiftray-only 開關之後，在 web 端無法觸及，因此 Start Here 在 web 版永遠會被渲染。

## 本次改進
新增本 spec，覆蓋路徑預覽三個需要 FLUXGhost 的列（Start Here、時間估算一致、切割順序），並以 spec 註解誠實記錄 Swiftray 相關兩分支僅存在於 Electron、web E2E 無法覆蓋。

## 待確認問題（Open Questions）
- Swiftray 引擎的切割順序是否需要建立 Electron 端的驗證管道？目前 web E2E 只能覆蓋 FLUXGhost/beamify 引擎。
- 「算圖加速」隱藏 Start Here 的分支是否值得建立 Electron 專屬測試？此分支在 web 版永遠無法觸及。
