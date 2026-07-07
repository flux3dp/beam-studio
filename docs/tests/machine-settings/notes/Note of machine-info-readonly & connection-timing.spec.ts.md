# Note of machine-info-readonly.spec.ts & connection-timing.spec.ts

## 測了什麼

兩支「唯讀連機」測試（Tier B，僅本地實機批次；GitHub 與未設定機器名稱時自動跳過）：

- **connection-timing.spec.ts**：對實機做選取＋連線，測量「按下確認連線」到「頂列按鈕顯示機器名稱」的實際耗時，斷言 < 20 秒（對應測試表第 305 列「連線是否在 20 秒內完成」）。逐一跑過所有已設定的機器（Beam 系列／Ador／beamo II）。
- **machine-info-readonly.spec.ts**：連線後開啟「機器」選單 >〈機器〉> Machine Info，斷言彈窗含 Model Name／IP／Serial Number／Firmware Version／UUID 五個欄位，並用正則確認 IP 欄回傳真實 IPv4（證明資料確實從機器讀回、非靜態標籤），最後按 OK 關閉。

兩者皆為**唯讀**：只呼叫 `DeviceMaster.select` + `getReport`／`getDeviceDetailInfo`，不上傳、不執行任何工作，雷射不作動。

## 為什麼這樣測足夠

「連線」與「機器資訊」是最基本的連機健康度檢查；測試表把它們列為需連上實機的半自動化項目。以耗時預算（20 秒）取代模糊的「有連上就好」，能抓到連線退化（韌體／網路變動造成握手變慢）。Machine Info 斷言真實 IPv4，等於順帶驗證了 `getDeviceDetailInfo` 的讀取路徑，一支測試涵蓋連線＋讀取兩層。

## 設計重點

- 機器名稱以環境變數驅動（`CYPRESS_machineName`／`adorName`／`beamo2Name`），未提供者跳過——同一批測試可指向任何人的機台，不需改 spec。共用邏輯集中在 `cypress/support/machineRig.ts`。
- 連線耗時的等待逾時設為 30 秒（大於 20 秒預算），讓超時的連線仍能完成、再以清楚的 elapsed 值判定失敗，而非停在模糊的逾時。

## Open Questions

- 20 秒預算為測試表既定值；若不同機型（如 beamo II 首次連線含韌體協商）常態性接近上限，應考慮依機型分別設定預算。
- Machine Info 目前只驗證 IP 格式；未來若硬體團隊提供各機型 serial／firmware 的格式規則，可加嚴斷言。
- `beamSeriesName` 環境變數原本 5 支既有 spec 有引用卻未在 config 定義（等於傳入 undefined）——本次一併於 `cypress.config.ts` 補上別名修正。
