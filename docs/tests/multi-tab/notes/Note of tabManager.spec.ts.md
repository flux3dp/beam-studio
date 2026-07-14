# Note of tabManager.spec.ts

## 對應測試表項目

多分頁功能分類兩列的**邏輯半**：「是否可以在不同 Tab 文件設定指定不同機器」、「送出工作確認可各自執行不同參數」。真實多視窗操作依計畫的 Tier D 決策（不建置 Electron E2E）維持發版前人工。

## 測試了什麼

共 32 個測試（`apps/app/src/node/tabManager.ts`，以假 Electron——BaseWindow／WebContentsView／ipcMain——驅動）：

- **事件註冊**與 **GetTabId**（sender 對應）。
- **分頁建立**與 **TabConstants.maxTab 上限**。
- **逐分頁狀態隔離**（此列核心）：各分頁的簿記互不洩漏——不同分頁綁定不同狀態時，管理器內部資料不交叉污染。
- **焦點/切換簿記**、**moveTab 重新排序**。
- **廣播路由**：送往其他分頁時排除發送者（分頁同步機制的關鍵合約）。
- **關閉清理**：view 銷毀、監聽移除。
- **FrontendReady** 處理。

## 設計理由

- **apps/app 首個自動化測試**：隨附最小 Jest 基礎建設——`apps/app/jest.config.ts`（ts-jest、node 環境，無需 jsdom）、`project.json` 新增 `test` target（`pnpm nx run app:test`）、`tsconfig.spec.json` 對應調整。刻意與 core 的設定隔離，core 套件驗證不受影響。
- Electron 以輕量假件 mock——測的是 tabManager 的簿記與路由邏輯，不是 Electron 本身。

## 充分性分析

- 兩列表項所依賴的「分頁間狀態不互相干擾」的管理器邏輯已覆蓋；廣播排除發送者是分頁同步正確性的核心合約，也已釘住。
- 未覆蓋（刻意）：真實視窗渲染、原生選單、實際 IPC 傳輸、送工作的端到端——Tier D／實機人工。

## 本次改進

新增本 spec 與 apps/app 的最小 Jest 基礎建設。**基礎建設檔案請於 PR 審閱**：`apps/app/jest.config.ts`（新）、`apps/app/project.json`（+test target）、`apps/app/tsconfig.spec.json`（修改）。

## 待確認問題（Open Questions）

1. apps/app 的 test target 是否要納入 CI（`global.ci.yml` 的 nx affected 會自動帶到嗎）？建議確認 affected graph 是否涵蓋 app 專案。
2. 既有 `tabController.spec.ts`（core 側）與本 spec（app 側）合起來覆蓋分頁邏輯兩端；IPC 合約本身（事件名稱/payload 形狀）若要防漂移，可考慮共用常數的型別測試。
