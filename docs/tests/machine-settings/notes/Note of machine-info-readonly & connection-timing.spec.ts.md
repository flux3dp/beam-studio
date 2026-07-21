# Note of machine-info-readonly.spec.ts & connection-timing.spec.ts

## 測了什麼

兩支「唯讀連機」測試（Tier B，僅本地實機批次；GitHub 與未設定機器名稱時自動跳過）：

- **connection-timing.spec.ts**：對實機做選取＋連線，測量**完整連線視窗**——從「點選機器列」（此刻才觸發 `DeviceMaster.select` + `getReport`；工作範圍確認彈窗要等 select 成功**之後**才會出現，故計時起點不能晚於此）到「頂列按鈕顯示機器名稱」，斷言 < 20 秒（對應測試表第 305 列）。計時掛在共用指令 `connectMachine` 的 `onSelect` hook 上，不另外複製連線流程。逐一跑過所有已設定的機器。
- **machine-info-readonly.spec.ts**：連線後開啟「機器」選單 >〈機器〉> Machine Info，斷言彈窗含 Model Name／IP／Serial Number／Firmware Version／UUID 五個欄位，並用正則確認 IP 欄回傳真實 IPv4（證明資料確實從機器讀回、非靜態標籤），最後按 OK 關閉。

兩者皆為**唯讀**：只呼叫 `DeviceMaster.select` + `getReport`／`getDeviceDetailInfo`，不上傳、不執行任何工作，雷射不作動。

## 為什麼這樣測足夠

「連線」與「機器資訊」是最基本的連機健康度檢查；測試表把它們列為需連上實機的半自動化項目。以耗時預算（20 秒）取代模糊的「有連上就好」，能抓到連線退化（韌體／網路變動造成握手變慢）。Machine Info 斷言真實 IPv4，等於順帶驗證了 `getDeviceDetailInfo` 的讀取路徑，一支測試涵蓋連線＋讀取兩層。

## 設計重點

- 機器名稱以環境變數驅動（`CYPRESS_machineName`／`adorName`／`beamo2Name`），**config 不設任何預設值**：未提供者由唯讀批次跳過、會送工作的 `--machine` 批次則直接快速失敗——不會默默去操作網路上剛好叫某個預設名字的機器（2026-07-07 review 修正：原本的預設值會使 skip 機制失效、並解除送工作 spec 的隱性安全閘）。共用邏輯集中在 `cypress/support/machineRig.ts`。
- `beamSeriesName`（舊 spec 讀的鍵）在 `cypress.config.ts` 的 `setupNodeEvents` **runtime 別名**到 `machineName`——覆寫一個鍵即同步兩者，單一批次不會分裂到兩台實體機器。
- `connectMachine` 共用指令改為**條件式**點擊工作範圍確認（該彈窗只在機型 ≠ 文件工作範圍且為新選取裝置時出現，`get-device.ts`）——機型相符的機器不再卡 150 秒。

## Open Questions

- 20 秒預算為測試表既定值；若不同機型（如 beamo II 首次連線含韌體協商）常態性接近上限，應考慮依機型分別設定預算。
- Machine Info 目前只驗證 IP 格式；未來若硬體團隊提供各機型 serial／firmware 的格式規則，可加嚴斷言。
