# Note of machine-setup-screens.spec.ts

## 對應測試表項目

機器設定分類：「新增或機器設定畫面 — 從『機器』選單 >『新增或設定機器』去測試 BB2 機器設定畫面、Ador 機器設定畫面是否正確」。

## 測試了什麼

共 4 個測試（純畫面渲染，CI 可跑，不需 FLUXGhost 或實機）：

1. **機型選擇畫面**：從機器選單進入，驗證路由到 `select-machine-model`、標題正確、Ador／Beambox 系列／HEXA 選項存在；點入 Beambox 系列後，子清單顯示 Beambox II 與 Beambox (Pro)。
2. **BB2 設定畫面**：選 Beambox II 後路由帶 `model=fbb2`，四種連線方式齊全（Wi-Fi、有線、網路線直連、USB——BB2 支援 USB 故應出現）；進入 Wi-Fi 步驟驗證標題與 BB2 面板說明圖（`beambox-2-panel`）；返回鍵可回上一步。
3. **Ador 設定畫面**：Ador 為頂層機型、直接進入連線選擇（`model=ado1`）；同樣驗證連線選項；Wi-Fi 步驟顯示 Ador 專屬說明圖（`ador-network`）**且明確驗證 BB2 的圖不存在**——釘住兩機型畫面確實不同。
4. **返回編輯器**：從精靈退出後畫布正常載入（`#svgcontent` 存在、`svgCanvas` 就緒），無殘留狀態。

## 設計理由

- 這一列要驗的是「畫面是否正確」，不是連線本身——連線流程已有需實機的 `machine/connection.spec.ts` 覆蓋。兩者以「畫面渲染／實機連線」分工，本 spec 停在任何需要真實網路或機器的步驟之前。
- 機型差異的斷言鎖定原始碼中真正分歧的地方（`ConnectWiFi.tsx` 依 `adorModels`/`nxModels` 切換面板圖片），以圖片 `src` 子字串驗證，不做像素比對。

## 充分性分析

- 表列指名的 BB2 與 Ador 兩個設定畫面皆已覆蓋，且互相驗證差異；機型選擇入口與離開路徑也有涵蓋。
- 未覆蓋：其他機型（beamo、HEXA、Promark）的畫面——結構相同，屬低風險；後續若要可用同模式擴充。實際連線成功與否維持 `connection.spec.ts`（實機批次）。

## 本次改進

新增本 spec（此前僅有需實機的連線測試，畫面本身無 CI 覆蓋）。

## 待確認問題（Open Questions）

1. 其他機型（beamo／HEXA／Promark）的設定畫面是否也要納入？成本低，但列上僅點名 BB2 與 Ador。
2. USB 連線選項的機型白名單（哪些機型該出現 USB）是否有明文規格可比對？目前以現行程式行為為準。
