# 旋轉軸及送料 (rotary-feeder)

## 本分類測試範圍

涵蓋旋轉軸與自動送料的實機功能：旋轉軸（chuck 與 roller）在 HEXA、BB2、Ador 上的雕刻結果與 Y 方向長度量測、旋轉軸倍率（0.5 倍、2 倍）、鏡像（垂直翻轉，BB2 與 Ador）、開蓋模式、自動對焦、混合雷射，以及 BB2、Beamo、Ador 的自動送料倍率與結果。

本分類項目多屬機器行為，需以實機驗證雕刻與送料結果，尚無專屬的自動化測試；其中部分換算邏輯可抽出以單元測試涵蓋。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
|---|---|---|---|
| `packages/core/src/web/helpers/device/get-rotary-ratio.spec.ts`、`helpers/addOn/rotary.spec.ts` | Jest 單元測試 | 旋轉軸倍率換算邏輯 | 既有 |
| `packages/core/src/web/app/actions/canvas/rotary-axis.spec.ts` | Jest 單元測試 | 旋轉軸線：mm↔px 座標轉換、工作範圍邊界 clamp、拖曳與 undo 歷史、rotary_mode/job-origin 顯示條件（22 個測試） | Claude 自動產生 (2026-07) |

其餘項目（實機雕刻結果、Y 方向長度量測、送料）維持實機人工。

## 尚未自動化項目

- 旋轉軸（chuck ＋ roller）搭配雕刻，確認外框預覽與送出工作時皆正確移到起點，並量測 Y 方向長度是否與圖檔一致 — 屬實體輸出品質，維持實機人工（Tier C）。
- 旋轉軸倍率（0.5 倍、2 倍）是否正確作用 — 實機結果維持人工；倍率換算邏輯建議以 Jest 測 `rotary-axis.ts`／`get-rotary-ratio`（部分已有測試）。
- 鏡像（BB2、Ador）雕刻後物件是否垂直翻轉 — 實機結果維持人工；垂直翻轉的座標轉換邏輯可用 Jest 單元測試涵蓋。
- 開蓋模式、自動對焦（beamo）、混合雷射（beamo） — 屬機器行為，暫不測，維持現狀。
- BB2、Beamo、Ador 的自動送料外框預覽、倍率與雕刻結果 — 屬機器行為，暫不測，維持現狀。
