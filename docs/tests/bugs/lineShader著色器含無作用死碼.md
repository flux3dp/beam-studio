# Bug（死碼）：Boxgen 3D 預覽線框著色器的 edge 分支兩側相同，thickness 調整無視覺效果

- **狀態**：未解（低優先，程式碼清理項目）
- **嚴重性**：低 — 不影響功能正確性，但著色器留有誤導性的死碼
- **檔案**：`packages/core/src/web/helpers/boxgen/lineShader.ts`

## 問題描述

fragment shader 內的 `edge` 變數在三元判斷的兩個分支都回傳 `vec3(0, 0, 0)`，也就是無論是否落在邊緣，輸出顏色相同——`thickness` uniform（預設 0.1）實際上不會造成可觀察的線框粗細差異。這段邏輯要嘛是未完成的線框效果，要嘛是可以整段移除的殘留。

## 重現條件

1. 閱讀 `lineShader.ts` 的 fragment shader 字串：兩個分支值相同。
2. 或在 Boxgen 3D 預覽中調整 `thickness` uniform 值，觀察畫面無變化。

## 影響範圍

- 單元測試（`lineShader.spec.ts`）只能對 shader 字串與 uniform 預設值做結構性斷言，無行為可測——測試 note 中已註明此侷限。
- 後續若有人想「調整線框粗細」，會發現參數無效而浪費排查時間。

## 建議

確認原始意圖：補完 edge 高亮效果，或移除 `edge`/`thickness` 相關死碼並同步更新測試。
