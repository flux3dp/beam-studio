# Note of design-market.spec.ts

## 對應測試表項目

- 「點擊 Design Market 是否外連」→ 測試表建議「可自動化（Tier A）：Cypress 驗證 Design Market 外連目標 URL」→ 現值「top-bar/design-market.spec.ts（已完成、通過）」。

## 測試了什麼

- `opens the Design Market site from the Account menu`：在頂欄 Account 選單點「Design Market」，驗證 `window.open` 被以 `https://dmkt.io` 呼叫。

## 設計理由

- Design Market 是純外連連結：在 web 上，`browser.open()` 會委派給 `window.open()`，所以在 app 載入前先 stub 掉 `window.open`，點擊後斷言它被以正確的 URL 呼叫，而不真的開新分頁，避免離開 app 與跨站導致的不穩定。
- URL 來源已對照原始碼確認一致：`lang/en.ts` 的 `topbar.menu.link.design_market` 等於 `https://dmkt.io`（第 2469 行）；選單接線的路徑為 `TopBar/useMenuData.ts` 的 Account 選單，經 `TopBar/Menu.tsx` 的 `handleItemClick` 呼叫 `browser.open(node.url)`。spec 中的常數與原始碼相符。
- 以 `cy.getMenuItem(['Account'], 'Design Market')` 走選單，符合本專案「用穩定的選單走訪，不依賴 hash class」的慣例。

## 充分性分析

- 就測試表「點擊是否外連」而言已充分：驗證了點擊確實觸發外連、且目標 URL 正確，這正是該列要問的核心。
- 刻意未涵蓋：外連目的地站台本身能否正常載入、內容是否正確，這些屬外部網站或人工層，非本 app E2E 的責任。
- 屬 web-only 驗證：Electron 的 `browser.open` 走系統瀏覽器，且無 Electron E2E 環境，故不在此測。

## 本次改進

無 — 經檢視後判斷現有測試已足夠。（單一明確的外連斷言，stub 手法穩健，URL 已與原始碼交叉確認。）

## 待確認問題(Open Questions)

- `https://dmkt.io` 是否為長期正式的正規 URL？spec 以硬編碼常數比對 `lang/en.ts`，若未來站台網域更換，需同步更新原始碼與此 spec。目前兩者一致，無立即問題。
