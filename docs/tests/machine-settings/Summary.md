# 機器設定 (machine-settings)

## 本分類測試範圍

涵蓋從「機器」選單 >「新增或設定機器」進入的機器設定畫面（BB2、Ador 等機型畫面是否正確），以及切換不同機型時畫布工作範圍是否正確調整：beamo（300×210）、beambox（400×375）、hexa（740×410）、beamboxII（600×375）。

各機型的畫布切換（canvas-switch）以斷言 viewBox 的方式自動化；機器設定畫面本身的完整驗證則尚待補寫。

## 測試檔案清單

| 測試檔案 | 類型 | 涵蓋內容摘要 | 來源 |
| --- | --- | --- | --- |
| `top-bar/workarea-modules.spec.ts` | Cypress E2E | 切換 beamo／beambox／hexa／beamboxII 時，逐一斷言各機型的畫布 viewBox 尺寸（涵蓋本分類的畫布切換列）。註：此 spec 檔實際歸於 viewport 分類 | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/machine/machine-setup-screens.spec.ts` | Cypress E2E | 機器設定精靈畫面：機型選擇、BB2 連線選項與面板圖、Ador 專屬圖像差異、返回編輯器（CI 可跑，與需實機的 `connection.spec.ts` 互補） | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/machine/connection-timing.spec.ts` | Cypress E2E（實機唯讀） | 對實機連線並測量耗時 < 20 秒（測試表第 305 列連線時限）；逐一跑過已設定的 Beam 系列／Ador／beamo II。本地批次 `--machine-readonly` | Claude 自動產生 (2026-07) |
| `apps/web/cypress/e2e/machine/machine-info-readonly.spec.ts` | Cypress E2E（實機唯讀） | Machines >〈機器〉> Machine Info：斷言 Model Name／IP／Serial／Firmware／UUID 欄位＋真實 IPv4 回傳；純讀取不送工作。本地批次 `--machine-readonly` | Claude 自動產生 (2026-07) |

## 尚未自動化項目

- ~~從「機器」選單 >「新增或設定機器」進入 BB2、Ador 機器設定畫面是否正確~~ — **已補齊（2026-07-04）**：`machine/machine-setup-screens.spec.ts`，見上方清單。其他機型（beamo／HEXA／Promark）的設定畫面尚未納入（低風險，可用同模式擴充）。
- **實機唯讀連機批次（2026-07 補）**：連線耗時、Machine Info、待機 Dashboard、相機預覽四支已補齊，皆為「不送工作」的唯讀操作，走 `pnpm --filter web cy:machine-readonly`（見 `apps/web/scripts/cy-local-rig.sh --machine-readonly`）。機器名稱以 `CYPRESS_machineName`／`adorName`／`beamo2Name` 環境變數指定，未設定者跳過。
