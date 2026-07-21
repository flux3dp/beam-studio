# Note of printing-toggles.spec.ts

## 對應測試表項目
Presets & Parameters 分類中，與 Ador 列印相關的三列：
- 「UV Ink」：「一般都是快乾 SV／紫外固化墨水比較特別，因此會限速／全範圍速度 30mm/s 5.3min／全範圍速度 10mm/s 15min」。
- 「白底」：「選擇白底或雙面列印後，會在預覽列印處有對應的顯示／使用 Two-sided Print 會強制開啟 White Base」。
- 「雙面列印」。

測試表自動化欄目前標示：
- 白底 → `right-panel/printing-toggles.spec.ts (done, passing; White Ink UI, dev-mode gated)`
- UV Ink → `feature absent in web build … closest coverage in right-panel/printing-toggles.spec.ts`
- 雙面列印 → `feature not in codebase (no twoSided/two-sided logic exists); cannot automate`

## 測試了什麼
- `White Base (White Ink): toggle persists to layer config and reveals settings`：在 dev mode 下把 20W 雷射層轉為全彩列印層後，White Ink 勾選框預設為關（`data-wInk` 為負值）；開啟後勾選框被勾選、`data-wInk` 轉為正值、齒輪設定圖示出現、可開啟「White Ink Settings」對話框；再關閉後還原為負值、圖示消失。
- `printing-layer speed control is the discrete simple-mode slider (UV-ink cap N/A on Ador)`：列印層在基礎模式下的速度滑桿是以索引為單位（`getSpeedOptions(PRINTER)` 的離散預設 10/30/60/100/150），斷言滑桿把手的 `aria-valuemax` 遠小於原始上限 400（小於 20）。

## 設計理由
- 白底即 White Ink，且受 dev-mode 限制：web 版的「白底」實作為 White Ink 開關（`wInk` 圖層設定、`.white-ink-checkbox`），只在 `isDevMode && isPrinting && fullcolor.value` 時渲染（ConfigPanel.tsx）。因此測試以 `localStorage.dev=true` 進場，並轉為全彩列印層才能觸及此 UI。`data-wInk` 屬性名大小寫敏感（屬 SVG `<g>` 元素的屬性），特意使用 `data-wInk` 而非 `data-wink`，此坑檔內已註明。
- 兩列判定不予測試，並誠實引用檔頭證據：
  - UV Ink：檔頭載明「UV Ink 並非 Ador 上的墨水類型選項。UV 列印是一個獨立的 dev-gate 模組（`UV_PRINT`）或另一台機器（Miro UV / fuv1）。設定面板中沒有 UV 驅動的 30 mm/s 速度上限。」SpeedBlock 唯一的模組上限是 `PRINTER_4C → 45`，而 `PRINTER_4C` 並非 Ador 的列印模組。因此「UV 限速 30mm/s」在 Ador 上沒有可觀察的 UI 可斷言，故不予測試；改以最接近的、不需機器的斷言（列印層基礎模式離散滑桿的數值上限）替代。
  - 雙面列印：檔頭載明「Two-sided Print（雙面列印）在整個 web 程式碼庫中都不存在（沒有 twoSided/two_sided/雙面 的原始碼，也沒有強制開啟白底的邏輯）。」本次已用 `grep -rni 'twoSided|two-sided|two_sided|雙面'` 於 `packages/core/src/web` 覆核，零命中，證據成立。
- 速度滑桿斷言用 `aria-valuemax < 20` 而非硬比為 5：因為當前值被注入為額外選項時，索引上限可能加 1，用寬鬆上界避免測試脆弱，同時仍與原始上限 400 明顯區隔。

## 充分性分析
- 「白底」意圖（切換後有對應顯示、設定可達、狀態持久寫入圖層設定）覆蓋充分。
- 「使用 Two-sided Print 會強制開啟 White Base」此子句在程式碼庫中沒有實作，無法測試，屬測試表領先或過期於程式碼。
- UV 限速與雙面列印判定不予測試，屬功能不存在於 web 版，並非測試不足；但這是測試表與程式碼的落差，需人工裁決（見待確認問題）。

## 本次改進
無，經檢視後判斷現有測試已足夠（不予測試的項目屬功能缺席而非測試缺陷，已用 grep 覆核證據）。

## 待確認問題（Open Questions）
- 測試表的 UV Ink 限速與雙面列印列：這些是規劃中功能、測試表過期、還是刻意的 dev-gate？建議測試表標註或移除。
- White Ink 是否應維持 dev-only？若正式版要開放給使用者，測試需移除 `dev=true` 限制並改測正式進場路徑。
