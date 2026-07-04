# Bug（潛在）：條碼／QR Code 產生器的內容輸入框，快速連續輸入時會掉字

- **狀態**：未解（需確認真人輸入是否受影響）
- **嚴重性**：低 — 目前僅在自動化快速輸入下穩定重現；真人打字速度可能不受影響
- **檔案**：`packages/core/src/web/app/components/dialogs/CodeGenerator/`（QRCodeGenerator.tsx / BarcodeGenerator.tsx 的受控輸入）

## 問題描述

QR / 條碼內容輸入框是受控元件（controlled input），且 `onKeyDown` 有 `stopPropagation`。以 Cypress 一次性快速輸入長字串（`cy.type('https://flux3dp.com')`）時，state 更新與重繪跟不上連續鍵入，最終只留下第一個字元「h」。逐字輸入並在每個字元後等待 value 同步（`should('have.value', ...)`）則正常。

類似的受控輸入時序問題也出現在 Boxgen 與材質測試產生器的 antd InputNumber：`cy.clear()` 後直接 `type()` 會與 clamp/重繪競態，需改用 `{selectall}` 覆蓋輸入。

## 重現條件（自動化）

1. 開啟 Code Generator 對話框（左側 Generator → Code Generator）。
2. 以 Cypress `cy.get(<內容輸入框>).type('https://flux3dp.com')` 快速輸入。
3. 輸入框 value 只剩「h」。

## 待確認

- 真人以極快速度打字或以輸入法貼字時是否也會掉字？若會，屬實際使用者可見缺陷。
- 若確認為缺陷，方向是檢視該受控輸入的 state 更新批次（React 18+ 自動批次下 `onChange` 與 `onKeyDown` `stopPropagation` 的交互）。
