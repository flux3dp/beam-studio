# Bug：材質測試產生器的靜態參數落入數字索引鍵，未出現在輸出物件上

- **狀態**：未解（修復已由另一個 session 進行中，task_3b88e584）
- **嚴重性**：中 — 產生的材質測試圖層可能遺失「執行次數 / 頻率」等靜態參數
- **檔案**：`packages/core/src/web/app/components/dialogs/MaterialTestGeneratorPanel/generateSvgInfo.ts` 第 62 行

## 問題描述

`generateSvgInfo()` 在組合每格參數時，把一個「陣列」直接展開進物件字面值：

```ts
...staticParams.map(([key, value]) => ({ [key]: value.default })),
```

陣列展開進物件會得到數字索引鍵（`{0: {repeat: 1}, 1: {...}}`），因此 `repeat`、`frequency`、`pulseWidth`、`fillInterval` 等靜態參數不會成為輸出物件的具名欄位——`svgInfo.repeat` 讀到的是 `undefined`。第 64 行的 `as unknown as SvgInfo[]` 型別斷言把這個型別錯誤隱藏起來了。

## 重現條件

1. 開啟材質測試產生器（左側面板 Generator → Material Test Generator）。
2. 於程式中檢查 `generateSvgInfo()` 的回傳值：靜態參數位於 `result[i][0]`、`result[i][1]` 等數字鍵下，而非 `result[i].repeat`。
3. 單元測試 `generateSvgInfo.spec.ts` 目前「如實釘住」這個錯誤行為（含註解說明），修好後需同步把 `(r as any)[0].repeat` 斷言改為 `r.repeat`。

## 影響範圍

- 任何讀取 `SvgInfo.repeat` / `frequency` 等欄位的下游程式，實際拿到 `undefined`。
- E2E 驗證中觀察到：匯出的圖層上 `data-repeat` 屬性不存在（`material-test-generator.spec.ts` 因此刻意避開靜態參數斷言）。

## 建議修法

```ts
...Object.fromEntries(staticParams.map(([key, value]) => [key, value.default])),
```
