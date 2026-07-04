# Note of TableSetting.spec.ts

## 對應測試表項目
材質測試工具，對應列：
- 「材質測試工具／選擇不同參數於欄、列，確認是否可以匯出、匯出內容是否正確」
- Agent Status 欄：「可自動化（Tier A）：Cypress 驗證欄列參數與匯出內容；另以 Jest 測 generateSvgInfo.ts（純邏輯）」。TableSetting 是 generateSvgInfo 的輸入來源，負責決定「不同機型可選哪些參數、各參數值域為何」，是「選擇不同參數」得以正確的前置條件。

## 測試了什麼
一般（非 Promark）機型：
- ado1 回傳 strength／speed／repeat 三個共用參數，並正確指派軸別：strength 為欄（selected 0）、speed 為列（selected 1）、repeat 為固定值（selected 2）。
- speed 的最大值取自工作區的 maxSpeed，而非寫死。
- 不含 Promark 專屬參數（fillInterval／frequency／pulseWidth 皆為 undefined）。
- 換成機型 fbb2 時 speed 最大值仍追隨該機的 maxSpeed；並加了防呆斷言：若兩機型 maxSpeed 剛好相同則此案例會失效，故先斷言兩者不同。
- 非 Promark 機型不呼叫 getPromarkLimit。

Promark 機型（fpm1）：
- Desktop 雷射回傳 Promark 參數，speed 的最小／最大值綁工作區的 minSpeed／maxSpeed，frequency 綁 getPromarkLimit。
- Desktop（非 MOPA）不含 pulseWidth，且參數鍵集剛好為 fillInterval／frequency／repeat／speed／strength。
- MOPA 雷射才含 pulseWidth，值域取自 promarkLimit.pulseWidth。
- frequency 完全反映 getPromarkLimit 的回傳值（把 mock 改回 {min:1,max:4000} 即隨之改變）。
- 省略 settingInfos 時預設為 Desktop 雷射（不含 pulseWidth）。

## 設計理由
- 材質測試面板依機型與雷射種類決定可調參數，錯配會讓使用者看到不該有的欄位、或漏掉該有的值域。本 spec 對每個機型分支逐一鎖定「參數鍵集＋值域來源」。
- speed 最大值「取自工作區而非寫死」用了防呆斷言（兩機型 maxSpeed 必須不同），避免測試因兩機恰好同值而變成永遠成立，是很好的抗退化設計，已通過刻意變異驗證。
- frequency 用可變的 mock 驗證「值真的來自 getPromarkLimit」而非硬寫，可捕捉忽略掉 limit 的變異。
- 「非 Promark 不呼叫 getPromarkLimit」與「省略參數時預設 Desktop」兩個案例鎖住控制流分支。
- 對 layer-config-helper 只補 mock 了 getPromarkLimit（getData 沿用中央 `__mocks__`），mock 範圍收斂、不過度。

## 充分性分析
- 就「各機型參數集與值域組成」而言已充分：一般機型、Promark Desktop、Promark MOPA 三條分支的參數鍵集，以及每個參數的最小值／最大值／預設值／選定軸別皆逐項驗證，並涵蓋工作區與 promarkLimit 兩個外部來源的追隨性。
- 刻意未涵蓋：使用者在 UI 實際把參數拖到欄／列、以及最終展開成方格。前者是面板互動（Cypress `top-bar/material-test-generator.spec.ts`），後者是 `generateSvgInfo.spec.ts`。
- 刻意未涵蓋：getWorkarea／getPromarkLimit 的內部正確性，那是各自模組的責任，本 spec 以 mock 隔離。

## 本次改進
無，經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
- 測試表未指明各機型中「哪些欄列參數組合」最需回歸保護。目前對 fpm1（Promark）覆蓋最完整，一般機型只測 ado1／fbb2 兩台；是否有其他高使用率機型的值域需納入抗退化清單？
