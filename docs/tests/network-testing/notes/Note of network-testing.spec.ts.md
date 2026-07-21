# Note of network-testing.spec.ts

## 測了什麼

「檢測網路設定」實機唯讀測試（Tier B，僅本地批次；GitHub 與未設定機器名稱時自動跳過），對應測試表 檢測網路設定 一列。每台已設定的機器一個測試，流程：

1. **取得真實 IP（不寫死）**：開「機器」選單 >〈機器〉> Machine Info，用 IPv4 正則從彈窗文字抓出 FLUXGhost 探索到的機器 IP（例：Beambox II (Kayden) → `192.168.1.203`），關閉彈窗。
2. **由選單開啟網路檢測**：「機器」選單 > **Test Network Settings**（`menuActions.ts` 的 `NETWORK_TESTING → Dialog.showNetworkTestingPanel()`，不帶 IP），彈出「Network Testing」視窗。
3. **輸入 IP 並檢測**：在「Target device IP address」輸入框填入步驟 1 的 IP，按 **Start**。
4. **斷言結果**：等 30 秒 ping 迴圈跑完（`network.networkTest`），斷言跳出 **「Test Completed」** 結果彈窗，且訊息含 **Connection Quality**（可達）或 **#840 Fail to connect**（不可達）——證明檢測確實對該 IP 跑出一個判定。

## 為什麼這樣測足夠

測試表這一列的核心是「網路檢測彈窗能否對機器 IP 跑出連線品質結果」。本測試走完整真實路徑：選單開窗 → 真實探索 IP → 執行檢測 → 結果彈窗，並斷言「Test Completed」＋品質／失敗訊息（不是只檢查彈窗開啟）。

**不寫死 IP** 是關鍵設計：IP 從 Machine Info 動態讀取，機器換 IP 或換機台都不必改測試；且用「已被 FLUXGhost 探索到的機器 IP」正好命中彈窗內部 `discoveredDevicesRef` 的「已知裝置」判定路徑（`NetworkTestingPanel.tsx`）。

**web 版檢測機制**：`apps/web/src/implementations/network.ts` 的 `networkTest` 是瀏覽器對 `http://<ip>` 的 XHR ping 迴圈（30 秒），計算 successRate／avgRRT／quality。web 路徑無 `err` 欄位，故一定會走到 `handleResult` 並彈出「Test Completed」（可達為品質數字、不可達為 #840）。純讀取、不送工作。

## 實測結果（2026-07-07）

- Beambox II (Kayden, 192.168.1.203)：Test Completed、**Connection Quality : 100、平均回應 30.89ms**（健康）。
- ador showroom：Test Completed（健康）。
- 兩台皆通過，整批 `--machine-readonly` 10/10 綠。

## Open Questions

- **錯誤路徑未覆蓋**：cannot_connect_1（同網段失敗）、cannot_connect_2（跨網段）、169.254 自動 IP 警告、invalid_ip 格式錯誤——這些不需實機，可用假 IP 補一支純 UI 測試。
- **選單項點擊需 `force: true`**：szh-menu 的直屬項（Machines > Test Network Settings）在 getMenuItem yield 後偶爾 not-visible，加 `force` 即穩定；與 device 子選單項（Machine Info）行為略不同。
- **30 秒固定測時**：`TEST_TIME` 寫死在元件內，單台測試約 35 秒；多機台批次時間線性增加。
