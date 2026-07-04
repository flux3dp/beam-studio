# Note of qrcode.spec.ts

## 對應測試表項目
- 畫布編輯分類 — QR Code 生成：「容錯率 7%、15%、20%、30% 與反轉背景顏色功能正常」（狀態欄目前標示 `left-panel/qrcode.spec.ts (done, passing)`）
- 上層選單工具分類 — 條碼工具：「嘗試匯入 QR code 及條碼，確認產出條碼內容是否正確」→ `left-panel/qrcode.spec.ts (done, passing; QR tolerance levels, invert, barcode)`
- 上層選單工具分類 — 條碼工具：「匯入畫布後嘗試縮放 QR code 及條碼，送出工作後確認是否檔案正確」→ 本 spec 僅涵蓋前半（產生內容）；「縮放後送工作」需 FLUXGhost，未自動化。

注意：後兩列在測試表中屬於「上層選單工具」分類，並非「畫布編輯」。本 spec 一併覆蓋這些條碼工具項目，兩邊的 Summary 皆有交互參照說明。

## 測試了什麼
- `generates a QR code onto the canvas`：開啟 Code Generator，未輸入內容時 Confirm 為停用狀態；輸入網址後預覽出現黑色 QR path，按下 Confirm 後畫布會多出一個引用點陣圖 symbol 的 `<use>` 元素。
- `changes output when switching error-tolerance level`：同一組資料把容錯率由 L(7%) 切換到 H(30%)，QR path 的內容改變且變長；切回 L 後完全還原。
- `changes output when inverting background color`：勾選「Invert background color」後 QR path 的幾何改變；取消勾選後還原。
- `generates a barcode onto the canvas`：切換到 Barcode 模式，輸入數字後 `#barcode` 產生多個 `<rect>` 條，按下 Confirm 後畫布多出一個 `<use>` 元素。

## 設計理由
- 選用 `https://flux3dp.com` 作為測試資料是刻意的：這個字串在 qrcodegen 中，容錯率 L 時會落在 version 1（25×25），H 時會落在較大的 version（29×29）。L→H 保證「內容會改變且會變長」，讓驗證不依賴像素比對，只靠 path 長度與字串差異就能穩定成立。
- 只驗證預覽 `path[fill="black"]` 的 `d` 屬性，以及匯入後 `<use>` 的結構（href 符合 `#svg_\d+_image$`），完全避開像素比對，符合本專案原則「沒有視覺回歸工具、不寫外觀斷言」。
- `typeValue` 逐字輸入：value 欄位是受控 input 且 onKeyDown 有 stopPropagation，用 `cy.type()` 快速輸入會掉字；逐字送出讓 React 逐鍵提交，消除不穩定性（符合處理不穩定測試的原則：靠正確等待而非重試）。
- 使用「切回後還原」的雙向驗證，證明設定是可逆、確實作用到輸出，而非單向的巧合。

## 充分性分析
- 對測試表「容錯率 + 反轉背景」與「QR／條碼產出內容正確」而言已足夠：四段容錯率的代表端點（L/H）、反轉、QR 與 Barcode 兩種產出，以及「確實落到畫布」都有覆蓋。
- 本 spec 刻意未涵蓋：容錯率 15%、20% 兩個中間檔位未各別驗證，僅測 L/H 端點。中間檔位屬同一機制的線性延伸，端點的變化即足以鎖住行為。
- 刻意未涵蓋：測試表「縮放 QR code 及條碼，送出工作後確認檔案正確」的後半段（縮放加送工作），因為送工作需 FLUXGhost／實機，屬於人工／需 FLUXGhost 的層級，未自動化。
- 未做「解碼層」的正確性驗證（實際掃描 QR 還原出原字串）；目前僅做幾何變化的驗證，詳見待確認問題。

## 本次改進
無 — 經檢視後判斷現有測試已足夠。（產生內容、雙向可逆、匯入結構均已覆蓋，且符合結構化驗證的原則。）

## 待確認問題（Open Questions）
- 是否應要求「解碼層」的正確性（真的把預覽的 QR 掃描還原成原始字串，確認編碼無誤），還是目前「幾何變化 + 產出落到畫布」已足夠？目前採後者。若要求前者，需在 spec 引入 QR 解碼函式庫，並確認 CI 相依可行。
