# Note of lineShader.spec.ts

## 對應測試表項目
Boxgen 盒子產生器（上層工具選單）的 3D 預覽渲染資產，間接對應：
- 「Edge、Finger、T-Slot 任意切換，3D 圖即時變化」與「Finger 滑桿平移時，右側 3D 圖即時變化」。這些列的「3D 圖」由 Three.js 場景繪製，`ThicknessShader` 是繪製盒子邊線（線框）的著色器。

注意：這些列在測試表中對「3D 圖即時變化／流暢度」明確歸類為人工檢查；本 spec 不驗證畫面外觀，只驗證著色器資源的結構完整性。

## 測試了什麼
- `vertexShader`、`fragmentShader` 皆為非空字串。
- vertex shader 宣告 `center` attribute、`vCenter` varying，並寫入 `gl_Position`。
- fragment shader 使用 `thickness` uniform 並寫入 `gl_FragColor`。
- 材質使用 `THREE.DoubleSide`（雙面渲染）。
- `thickness` uniform 有預設值且約為 0.1。

## 設計理由
- 著色器原始碼是字串常數，TypeScript 無法檢查 GLSL 內容；本 spec 用字串包含斷言充當「這段 GLSL 沒被誤刪關鍵宣告」的煙霧測試（smoke test）。
- `center`／`vCenter`／`gl_Position` 三者缺一，線框就不會顯示；缺少 `DoubleSide` 則從某些角度看盒子會透空。這些是重構時最容易被誤動的點。
- `thickness` 預設 0.1 的斷言鎖住線寬預設，避免有人改成 0（線消失）而沒察覺，本 spec 已通過刻意變異驗證。

## 充分性分析
- 就「著色器資源結構」而言已充分：此模組本質是靜態設定物件，沒有邏輯分支，能測的就是「關鍵欄位存在且值正確」，已全數覆蓋。
- 刻意未涵蓋：GLSL 能否在 GPU 正確編譯、實際線框像素外觀，那需要真實 WebGL 環境或人眼，屬測試表明列的「3D 圖即時變化」人工檢查層。
- 刻意未涵蓋：Boxgen 匯入畫布後的 SVG 結果，那與 3D 著色器無關，由 `top-bar/boxgen.spec.ts` 覆蓋。

## 本次改進
無，經檢視後判斷現有測試已足夠。

## 待確認問題（Open Questions）
無。
