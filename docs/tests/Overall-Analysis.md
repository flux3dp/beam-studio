# 總體分析：從本輪自動化測試建置看 Beam Studio 可以如何改進

> 撰寫背景：2026-07-04 起的自動化測試建置，共新增 21 支 Cypress E2E spec、17 個 Jest 測試套件（142 個單元測試），
> 覆蓋原「Beam Studio Test」表 331 項中約 60 項，並經過逐案審查（各分類 `notes/`）、變異測試驗證與人工可讀筆記整理。
> 過程中發現的未解問題整理於 `docs/tests/bugs/`，各分類測試現況見各資料夾 `Summary.md`。

## 一、測試表與程式碼已經脫節，需要一個「單一事實來源」流程

這次最大的發現不是程式 bug，而是**測試表本身的漂移**：

- **幽靈項目**：表上標了 6 支「已自動化」的 spec（qrcode、search-font、boxgen、speed-limit-warning、svg-pdf-ai、weld-text&path），但檔案從未存在於 git 歷史——約 20 個測項長期處於「以為有測、實際沒測」狀態。
- **功能不存在**：UV Ink 限速、雙面列印在 web 程式碼中完全不存在（grep 零命中）；表上的「UV／SV／濃度三個極限開關」實際上只有一個 `print-advanced-mode` 偏好設定。
- **行為已改**：`upload-with-machine.spec.ts` 預期的「單一 Printing 圖層」已不是現行行為（現為保留來源圖層名稱的多個全彩圖層）。

**建議**：
1. 把「表上的自動化狀態欄」視為由 repo 推導的產物，不要手填。可以定期以腳本比對 spec 檔案清單與表格（本輪加上的 Agent Status 欄已是雛形）。
2. 每個測項標注**平台**（web／Electron／兩者）。這次至少有 4 組測項（最近使用檔案、多分頁、Swiftray 切換、算圖加速隱藏 Start Here）其實是 Electron 專屬，web 端無從測起，但表上沒有標注，人工測試者也未必知道。
3. 功能下線或改版時，同步更新測試表應成為 PR checklist 的一項。

## 二、可測試性（testability）是產品品質問題，不只是測試問題

寫測試的過程本身就是一次「產品可觀察性」體檢，以下問題都直接拖慢了自動化，也可能困擾真實使用者：

1. **非確定性的邊界顯示**：Ador 各模組的加工範圍邊界（430×270/290/300/282）受「曾切換過哪些模組」影響（`use-union-boundary` 預設開啟），同一模組在不同操作順序下顯示不同邊界。這使得四個測項無法做數值斷言，更重要的是——使用者看到的範圍提示可能不準（見 bugs/Ador各模組邊界疊層顯示不確定.md）。
2. **受控輸入的時序脆弱**：Code Generator 快速輸入會掉字、Boxgen 與材質測試的 antd InputNumber 有 clear/clamp 競態。自動化都能繞過，但這些是「輸入很快的使用者」可能踩到的真問題。
3. **死路由沒有監控**：獨立登入路由 `/#/initialize/connect/flux-id-login` 在 web 版不渲染表單，連帶讓共用測試指令失效。壞掉多久沒人知道——正是因為沒有覆蓋它的自動化。
4. **缺乏穩定的測試選擇器**：多數 UI 只能靠 hashed CSS module class（`[class*="...module__xxx"]`）選取。建議新元件一律加 `data-testid`，舊元件在改動時順手補。
5. **511 行的 `curveEngravingModeController`** 這類把裝置 I/O、canvas 操作與狀態機揉在一起的模組，幾乎無法單元測試。反例是 `generateSvgInfo`、boxgen 的 `Shape`、autoFit 的 `dimension`——純函數抽得乾淨，測試又快又準，還當場抓到一個真 bug。**「把可計算的邏輯抽成純函數」應該是重構的持續方向**。

## 三、測試環境的三個結構性缺口

1. **雲端寫入在本地完全不可測**：後端 CSRF 信任來源只允許 `*.flux3dp.com`，localhost 的儲存／改名／刪除全被 403。雲端儲存 8 個測項的 E2E 只能在 prod 網域跑（風險高）或等 staging 白名單（見 bugs/雲端寫入操作在localhost被CSRF阻擋.md）。**建議建立 QA 用 staging 後端，把 localhost 加入信任來源**，並提供固定的免費層測試帳號（本輪帳號由環境變數注入，隨時可替換）。
2. **FLUXGhost 的來源白名單**只認 `http://127.0.0.1:8080` 而拒絕 `http://localhost:8080`，且埠號隨編譯版動態變化。本輪已把偵測與接線封裝進 `apps/web/scripts/cy-local-rig.sh`（`pnpm run cy:fluxghost` / `cy:account` / `cy:machine` / `cy:local-rig`），但長期而言白名單加入 localhost、或提供固定埠的開發模式，對所有開發者都更友善。
3. **本地 rig 只有工具、還沒有節奏**：跑不進 CI 的測試（FLUXGhost／帳號／實機）現在一鍵可跑，但需要一個「每週或發版前必跑、結果回報到固定位置」的習慣，否則會重演幽靈項目的歷史。dev server 在長時間高負載後曾崩潰一次（webpack dev server 記憶體），排程時建議每輪重啟。

## 四、測試品質：初版測試普遍「太客氣」，審查機制值得制度化

對 17 個 Jest 套件做逐案變異測試審查（刻意注入 bug 驗證測試會不會抓到）的結果：

- 移除了 2 個「測 Zustand 本身而不是測商業邏輯」的套套邏輯測試；
- 修正了 3 處「用同一條公式算期望值」的自我驗證（改為手算常數）；
- 補上 3 個注入驗證過的關鍵不變量（boxgen 預設值污染、cameraPreview else-if 分支、材質測試軸向指派）；
- 過程中另外發現 2 個真實程式問題（generateSvgInfo 靜態參數、cameraPreview 調和缺口）。

**建議**：把「變異式自我審查」（挑 2–3 個合理的假 bug，確認測試會紅）納入新測試的完成定義；本輪的審查筆記（各 `notes/`）可作為範本。

## 五、值得延續的成果與下一步

**已建立的資產**：
- 測試表 CSV 的 Agent Status 欄（進度單一事實來源）＋ 22 個分類 `Summary.md`（人可讀索引）＋ 39 份逐 spec 審查筆記 ＋ 8 份 bug 報告。
- 本地 rig 一鍵執行器與 `.claude/skills/e2e-test.md` 中的接線規範（未來新增受限 spec 只需在清單加一行）。
- Google Fonts 的「攔截層＋真實 API 契約層」雙層模式——適合推廣到其他外部依賴（雲端 API 契約、FLUXGhost 版本升級煙霧測試）。

**優先次序建議（成本效益由高至低）**：
1. 修 `generateSvgInfo` 靜態參數 bug（修復已在進行）與 `upload-with-machine` 過期斷言——兩者都在掩蓋真實覆蓋。
2. staging 後端 CSRF 白名單——解鎖雲端 8 項的完整 E2E。
3. 決策 Ador 邊界顯示的預期行為——決定後即可補上 4 項數值斷言，並消除使用者面向的不一致。
4. 剩餘 A3 單元測試（convertToPath、auto-save-helper、rotary-axis、googleFontService、OpacitySlider、curve-measurer 錯誤路徑）。
5. 相機模擬層 spike（表上 10 項相機測試的前置投資，約 1–2 週）——在以上便宜項目收割完之後再評估。

**最後一個觀察**：這次能在一天內建起 60 項覆蓋，最大的功臣是專案裡已經存在的兩份技能文件（unit-test.md／e2e-test.md）與 25+ 個成熟的自訂指令。**文件化的測試慣例是可以複利的資產**——每次把新的踩坑（FLUXGhost 接線、testIsolation、受控輸入打字）寫回去，下一輪的邊際成本就更低。
