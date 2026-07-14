# Note of flux-id-login.spec.ts

## 對應測試表項目
上層選單工具的登入相關列，Agent Status 欄明確點名本 spec：
- 「登入功能是否正常／FLUX ID」：以測試帳號登入驗證。
- 「登入資訊／登入後相關功能跳出 icon 與正確的 AI Credit」：登入後 FluxCredit 對話框顯示 email 與數值化的 AI Credit。
- 「用第三方登入後是否下次打開會自動記住登入訊息」：email 登入的記住登入已覆蓋（第三方 Google 登入本身維持人工）。
- 「登入才能使用的功能整理／一鍵去背」：只驗證功能是否有跳出。

## 測試了什麼
- `shows the account info (AI Credit) in the FLUX Credit dialog right after login`：登入成功後 FluxCredit 對話框顯示「Logged in」、`Email: <帳號>`，並斷言 AI Credit 欄位（`span[class*="FluxCredit-module__ai-credit"]`）為可解析的數值（比對是否為數字，而非某個特定數字）。
- `shows the logged-in identity in the Account menu`：Account 選單改為顯示「Log out (<email>)」而非「Log in or Sign Up」，且不再出現「Log in or Sign Up」項目。
- `remembers the login across a page reload`：重新載入頁面後，靠持久化的 session（same-site cookie 加 localStorage 的 `keep-flux-id-login`）仍維持登入，Account 選單仍顯示「Log out (<email>)」，不會被強制跳出登入對話框。
- `pops up the one-click background removal (一鍵去背) confirmation`：匯入點陣圖並選取後，點擊右側 ActionsPanel 的 Background Removal 按鈕（`#bg-removal`），驗證「將立即使用 0.02 Credit，是否繼續？」的確認視窗有跳出，接著按取消（Cancel），確認沒有殘留去背處理中的覆蓋層（`#photo-edit-processing` 不存在）。

## 設計理由
- 本 spec 驅動的是「生產環境」的 FLUX ID 服務（真實網路登入），因此在 CI（GitHub Action）上自我略過（`Cypress.env('envType') === 'github'` 時直接跳過），只在本地測試機批次執行。
- 帳號密碼由 `Cypress.env('username')`／`Cypress.env('password')`（即 `CYPRESS_username`／`CYPRESS_password`）注入，絕不寫死在 spec 內；執行方式為 `pnpm run cy:account`。
- 為了對生產服務友善，登入只在 `before()` 執行一次，四個斷言共享同一個登入 session，結尾在 `after()` 登出一次，避免把 session 遺留給共用瀏覽器設定檔的其他 spec。
- 因此本 suite 刻意關閉 testIsolation（`{ testIsolation: false }`）：預設的 testIsolation 會在每個 test 之間清掉 cookie 與 localStorage，會把 session 清掉而使「記住登入」的斷言失效。關閉後改在每個 test 開頭以 `landEditor()` 保留 session 並重新載入，清掉前一個 test 殘留的畫布或彈窗狀態。
- 一鍵去背刻意只驗證「確認視窗有跳出後即取消」：如此不會真的消耗 credit，也不會發出真實的去背網路請求，對應測試表「只測功能是否有跳出」。
- 登入採「使用者實際操作路徑」：從 Account 選單的「Log in or Sign Up」開啟登入對話框（`Dialog.showLoginDialog`），對話框內有 `#email-input`、`#password-input`、記住登入勾選框與「Log in」按鈕。登入成功後 app 會開啟 FluxCredit 對話框，這是 AI Credit 值實際渲染的介面。

## 充分性分析
- 就測試表登入相關列而言已充分：FLUX ID 登入、登入資訊（email＋數值化 AI Credit）、記住登入（重載後 session 存活）、一鍵去背跳出確認視窗，四項皆覆蓋。
- 身分與 credit 的呈現介面：web 版頂列沒有使用者頭像（UserAvatar 在 web 未使用），因此身分表面是 Account 選單，credit 表面是 FluxCredit 對話框，本 spec 據此斷言。
- 刻意未涵蓋：Google 第三方登入（有 bot 偵測，自動化不可靠，維持人工）、以及一鍵去背實際消耗 credit 並完成去背的完整流程（只驗跳出）。

## 本次改進
新建本 spec。撰寫過程中發現一個既有問題：獨立的登入路由 `/#/initialize/connect/flux-id-login` 在 web 版的 Cypress build 中不會穩定渲染出登入表單，因此既有的 `cy.loginAndLandingEditor` 指令因此失效。本 spec 改走使用者實際操作路徑（Account 選單開登入對話框）繞過此問題；該路由渲染問題已另立 bug 單追蹤，不在本 spec 內修正原始碼。

## 待確認問題（Open Questions）
- Google 第三方登入維持人工（因 bot 偵測導致自動化不可靠），此決策是否可接受？或需另尋 staging 環境的替代驗證方式？
- 一鍵去背的確認視窗行為，在測試帳號 credit 歸零時是否不同（例如改為提示儲值而非「將使用 0.02 Credit」）？目前只在有 credit 的帳號上驗證跳出，credit 為零的路徑尚未涵蓋。
- 獨立登入路由 `/#/initialize/connect/flux-id-login` 在 web 版不渲染登入表單的 bug 修復後，是否要把本 spec 與 `cy.loginAndLandingEditor` 指令改回走該路由？
