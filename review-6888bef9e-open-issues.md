# Review 6888bef9e — 未處理問題（remaining）

> 本檔由完整 review（共 114 條）篩選而來，**只列出尚未修正、也未標記為安全的項目**。
> 編號沿用原始 review 以便對照；已修正 / 已標記安全的項目不再列出（見下方摘要）。

## 摘要

- ✅ **已修正**：#1, #2, #3, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #21, #22, #23, #24, #25, #26, #34, #47, #48, #49, #64, #65, #66, #67, #80, #99（及 readBeam 進度遮罩保護）
- 🛡️ **已標記安全 / 刻意設計**：#4, #5, #19, #20, #68, #81, #82, #83, #84；#27、#52（正常關閉路徑已由 modal 自行 resolve，僅剩「外部強制 popDialog」的殘留 edge）
- 🩹 **部分處理**：#50, #51, #98, #100/#101, #110（見各條說明）
- ⬜ 以下為**仍待處理**項目。

圖例：🔴 高　🟡 中　🟢 低/慣例　🩹 部分處理

---

## 批次 1：State 核心 + editable

> 已排除：**#4**（`clearEditableInfo` 目前呼叫端保證 elem 不是 temp group）、**#5**（`toggleEditableInfo` 目前呼叫端保證不是 temp group）→ 皆標記安全。
> 已修正：**#6**（不再於 getter 內 `removeAttribute`，改 fail-soft 回 `{}` 且不 log spam，並加 `typeof number` + 合法 ControlType 驗證）、**#7**（觸發時 `count = 0` 並清 timer）、**#8**（`allEditableInfo` 改 `Object.freeze`；已確認所有使用處僅讀取/spread，freeze 安全）、**#9**（selector 收斂為 pure `(state) => state[key]`，compute+寫回 store 搬進 `useEffect`；首次 render 以 cache-aware 的 `computeLazyDataWithLock` 回值不 setState → heavy compute 仍每 selection 單次）、**#12**（移除 dead `running` lock 與連帶失效的 `fallback`）、**#13**（`getLazyData` 移除 foreign-element 參數，一律用選取中元素，杜絕 cache/store 污染）。
>
> 本輪再修正：**#10**（`ControlType` 改為 `as const` object + 同名 type alias；已確認無反向對映依賴、27 個消費檔零改動、tsc 通過）、**#11**（`ControlTypes` 改由 `Object.values(ControlType)` 導出）、**#14**（`?.blur()`）、**#15**（`categoryOverride` 改用 `Record` 型別，移除 `as any`）、**#16**（`DimenstionControls` → `DimensionControls`，含 setter/spec）、**#17**（更正 query string 註解）、**#18**（`initTemplatePreviewFromQuery` 改為 export，由 `Beambox.tsx` mount effect 呼叫，移除 module side-effect）、**#21**（`objectPanelData` 型別移除 null，`defaultElementState` 改用 `getObjectPanelContext(null)` 空 context）。
>
> 已確認：**#19**（`_exploreMode`/`_templateMode` 不 reset **無 production 影響**——皆由 `setTemplateFile`/新檔/import 明確驅動，且每個 renderer/tab 是獨立 module 實例；唯一實務缺點是測試隔離與 devtools 觀察性，非急迫）、**#20**（`getter.ts` 已有 `// keep array for future use` 註解說明 `hasMultiValue` 現況）→ 皆標記安全/確認。

---

## 批次 2：ContentLibrary + FileThumbnail + templatePreview

### 🟡 中
- **#28** `blobSrcToBase64` 失敗時靜默回傳原 blob URL（`manager.ts`）。blob URL 只在當前 session 有效，寫進檔案後重開必失效 → 內容庫項目永久損壞且無錯誤提示。
- **#29** `URL.createObjectURL` 未 revoke（`manager.ts` addContentFromDialog 的 image 分支、`AddButton.tsx` 的 `img.onload` 尺寸超標 early return）。
- **#30** 錯誤處理放 `finally` 會蓋掉真正例外（`manager.ts` importContents / addContentFromCanvas）。任何中途 throw 都先彈「格式不支援」誤導訊息；早期 return 時還提交空 BatchCommand（無作用 undo 步驟）。
- **#31** `thumbnails` 與 `thumbnailsData` 初始狀態不一致（`FileThumbnail/utils.ts`）。`resetThumbnails()` 建了 `thumbnailsData['preview']` 但沒推進 `thumbnails` → 標題 `length - 1` 可能顯示 -1；`addThumbnail` 的 `length === 2` 解鎖判斷依順序失效。
- **#32** `addThumbnail` 用 `Date.now()` 當 key（`FileThumbnail/utils.ts`）。同毫秒連續加入產生重複 key → objectURL 洩漏、React key 重複、`removeThumbnail` 只移一筆。改遞增計數器。
- **#33** `getPreviewUrl` 只用 `window.location.origin`（`TemplatePreview.tsx`）。Electron `file://` 下 origin 是 `"null"`，iframe src / postMessage targetOrigin / receiver 的 origin 檢查都會壞。**桌面版需實測。**
- **#35** preview thumbnail 可被拖曳排序、沒有釘選（`ThumbnailList.tsx`）。使用者可把一般縮圖拖到 preview 前，破壞封面順序語意。

### 🟢 低 / 慣例
- **#36** `export const enum LibraryType`（`manager.ts`）。`const enum` 在 isolatedModules/babel/SWC 行為不一致，違反 `as const` 慣例。
- **#37** `thumbnailsData`/`thumbnails` 是 module 級可變全域 + 自製 emitter（檔案自註 `// Convert to a store?`），應改 Zustand。
- **#38** `getContentElements` 屬性選擇器未加引號（`manager.ts`）。id 目前安全，含特殊字元時 `querySelectorAll` 會 throw。
- **#39** `exportContents` 副檔名標籤與實際不符（`manager.ts`，Mac 顯示 `*.bvg` 實際 filter 是 svg）；序列化應用 `XMLSerializer` 而非 `outerHTML`。
- **#40** `addContentFromCanvas` 把 clone 暫時掛到畫布（`manager.ts`），若 `convertTextToPath` 中途 throw，`finally` 未清 `cloned`，會殘留 `visibility:hidden` 孤兒節點並存進檔案。（正常路徑無殘留。）
- **#41** 無障礙：`AddButton.tsx` 純 `div`+`onClick` 無 role/tabIndex/鍵盤；`ThumbnailList.tsx` 只註冊 Pointer/Touch sensor，排序無鍵盤替代。
- **#42** `restrictToParent` 從 `ObjectPanel/LibraryPanel/ContentSection` 匯入（`ThumbnailList.tsx`），FileThumbnail 反向依賴 ObjectPanel 內部檔案，應抽共用 util。
- **#43** `SortableThumbnail` 把 `{...listeners}` 展開在整個容器（`ThumbnailList.tsx`），按鈕在拖曳區內易誤觸。
- **#44** `getThumbnailsForExport` 對 preview 一律輸出 `data: null`（需與 `generateBeamBuffer` 對照，屬設計性、資訊性）。
- **#45** `modelId` 拼字錯誤（`getThumbnailsForExport.tsx`，應為 modalId）。
- **#46** `constants.ts` 註解說 query param 在 hash 裡，實際是 query string（與 #17 同源）。

---

## 批次 3：Template 檔案格式（.beam block 0x05）

### 🔴 高
- **#50 🩹** 對外部檔案的二進位解析缺少邊界檢查（`beam-file-helper.ts` readBlocks 0x05、readBeamFileInfo 0x05）。迴圈只用 `i < count && currentOffset < blockEnd` 守衛，每次 readVInt/readUInt8/toString 前未驗證剩餘長度。**已部分緩解**：`readBeam` 加了 try/finally，RangeError 不再卡住進度遮罩；但邊界檢查本身仍缺，應給可讀錯誤而非 RangeError。

### 🟡 中
- **#51 🩹** `saveAsFile` 在 web 上可能用 `blob === null` 設定 template 狀態（`save.ts`）。取消下載時 `getContent` 未被呼叫、`blob` 仍是 null，卻進入 `if (newFilePath || isWeb_)` 並回傳 `true`。**已部分改善**：#47 重寫 `setTemplateFile` 後不再誤入 template mode；但「取消卻回傳 true」仍在。
- **#53** `setTargetLayers` 直接改屬性，不進 undo、不標記未存檔（`templateTargetLayer.tsx`）。設定完可匯入圖層後無法 undo，檔案不標記為已修改。
- **#54** `determineTargetLayer` 丟未在地化裸 Error（`templateTargetLayer.tsx`）。需確認呼叫端有 catch。
- **#55** target layer 以「圖層名稱」為鍵（`templateTargetLayer.tsx`）。名稱可重複、可改名，改名後匯入目標對應失效。
- **#56** `getLayerChildElements` 每次呼叫全域掃描 temp group（`getLayerChildElements.ts`）。`collectTempChildrenByLayer()` 內含全域 `querySelectorAll`，per-layer 呼叫即 N 次全域查詢。應把 temp map 提到呼叫端算一次。（與 #101 相關。）
- **#57** `generateThumbnailsListBlockBuffer` 迴圈內反覆 `Buffer.concat`（`beam-file-helper.ts`），O(n²)。縮圖上限 10 影響小，仍應先收集陣列最後一次 concat。
- **#58** block 0x05 依賴「排在 0x01 之後」的隱含順序（`beam-file-helper.ts`）。清空由 0x01 的 `importBvgString → resetThumbnails()` 完成，順序一變會靜默清空縮圖，應寫進格式註解。
- **#59** `canvas.toBlob((b) => resolve(b!))` 沒有失敗路徑（`file/export/utils/beam.ts`）。可能回 null → `blob.arrayBuffer()` TypeError，或不回呼 → promise 永久 pending。
- **#60** `generateBeamThumbnail` 序列化整份 live `defs`（`file/export/utils/beam.ts`）。內容庫上線後 `svgDefs.outerHTML` 會把所有 symbol（含 base64 圖）塞進縮圖 SVG。另需確認 `SymbolMaker.switchImageSymbol` 對 clone 的 `<use>` 是否誤動實際文件。

### 🟢 低
- **#61** 新增 block 0x05 與 metadata `template`，簽章版本仍是 2（`beam-file-helper.ts`）。舊版讀到 0x05 會停止，靠區塊順序碰巧優雅降級，應在註解寫明。
- **#62** `readHeader` 完全不使用 metadata 的 `contents` 欄位，仍以固定順序讀 VINT；未來新增條件性區塊會錯位。
- **#63** `modelId` 拼字錯誤（`resetTemplate.ts` 已於修正 #49 時一併改為 modalId；`templateTargetLayer.tsx` 仍有）。

---

## 批次 4：Canvas 互動（mouse / selector / SvgEditor）

### 🔴 高
- **#68**（已標記安全 — 移除 checkShouldIgnore 為刻意設計，此處僅提醒與 #108 疊加的行動版誤觸風險）

### 🟡 中
- **#69** `preview_color` 模式的兩個處理被移除（`selector.ts`、`mouse/index.ts` dblClick）。dblClick 那處移除為**必要**（`setColorPreviewing` 已整個移除，由 ColorPickerMobile 自管進出）；但 **selector 隱藏 grips 的 early return 被刪 → 色彩預覽時選取框控制點會顯示**。屬視覺變更，**待決定**是否在 selector 補回「preview_color 時隱藏 grips」。
- **#70** `updateNonEditableGripVisibility` 單獨呼叫時不還原已隱藏控制點（`selector.ts`、`setter.ts`）。只在 `resize()` 流程有前置重置；經 `setEditableInfo` 直接呼叫的路徑，把控制項切回「可編輯」時控制點不會立即出現，要等下次完整 resize。
- **#71** line 控制點左右/上下對應只看 `x1 > x2`，未考慮旋轉角（`selector.ts`）。帶 rotation 時會隱藏錯誤那一側控制點。
- **#72** `case 'pick'` 在 `mouseDown` 內 await 長時間操作（`mouse/index.ts`）。期間 mouseup/mousemove 不被處理；且未檢查目標是否在鎖定/隱藏圖層（其他選取路徑都有 `checkSelectable`/`isElemLocked`）。
- **#73** 從中心縮放時覆寫 `sx`/`sy`，繞過等比與 fit-text 約束（`mouse/index.ts`）。Shift 等比與 fit text 固定行為在該分支失效。
- **#74** `getSymbolBBox` 首次呼叫回傳未四捨五入值、之後回四捨五入值（`svgedit/utils/getBBox.ts`）。同 symbol 首次/後續結果有微小差異。應 `bb = obj`。
- **#75** `data-bbox` 快取沒有失效機制（`getBBox.ts`）。symbol 內容被替換而 id 沿用時會用到過期 bbox → 內容縮放/定位錯誤。

### 🟢 低
- **#76** `findAndDrawAlignPoints` 改用 clamp 後的 `x, y`（`mouse/index.ts`）。非拖曳狀態下 `startX/startY` 是殘值，template 模式對齊點畫在錯誤位置。
- **#77** `SvgEditor.tsx` 變數命名誤導：`const isTablet = useIsTabletOrMobile();` 實含 mobile。
- **#78** `TopBarHintsContextProvider` 在 SvgEditor 內另包一層（`SvgEditor.tsx`）。若 TopBar 另有同名 Provider，兩邊 context 各自獨立。需確認。
- **#79** `isRetailDev()` 的 template mode 切換按鈕直接寫在正式元件樹（`SvgEditor.tsx`）。有 flag 保護，仍應獨立為開發工具。

---

## 批次 5：ObjectPanel 重寫 / ConfigPanel / LibraryPanel / TemplateConfig

### 🟡 中
- **#85** `PopupItem` 在 render 期間做 `document.querySelector`（`common/ObjectPanelItem.tsx`）。render 應 pure；首次 render 對應 ButtonItem 可能未進 DOM → reference 為 null → 浮動彈窗定位失準。（與 #80 的 state 設計相關，該 state 為刻意保留。）
- **#86** `setEditable` 用不帶 `controllableTypes` 的 `getEditableInfo` 回寫 store（`TemplateConfig.tsx`）。鍵集合與正常 `getDerivedData` 路徑不一致，依賴鍵存在與否的邏輯可能誤判。
- **#87** `contentLibraryManager.type` 在 render 期間讀取（`ContentSection.tsx`）。`type` 由 effect 的 `init()` 設定，首次 render 讀到前一個元素的值。（#24/#25 已改善 singleton 的 await 安全，但 render 時序讀取仍在。）
- **#88** `handleDragEnd` 直接解構 `over.data.current`（`ContentSection.tsx`）。dnd-kit 某些狀態下可能 undefined，無防護即 TypeError。
- **#89** `setMouseMode('pick')` 沒有取消路徑（`ContentSection.tsx`）。無視覺提示、無 Esc、無逾時，改變主意時模式一直停在 'pick'。
- **#90** 移除 `panel-item` UIType 後，`WhiteInkCheckbox` 在平板/彈窗 UI 完全消失（`ConfigPanel.tsx`）。屬 dev 模式功能，無聲移除。

### 🟢 低
- **#91** `defaultActiveKey={Object.keys(panels)}`（`ObjectPanel.tsx`）用所有 panel key 當預設展開集合，取巧且收合狀態不保存。
- **#92** `renderTabletButtons` 用 `key={index}` 給 divider（`ObjectPanel.tsx`），清單條件組成，index 會變動。
- **#93** `ContentSection.tsx` 使用中文註解（`// 左邊界`…），與 codebase 英文慣例不一致。
- **#94** `TemplateConfig.tsx` 桌面版與平板版 JSX 完全重複，標註 `// TODO: desktop UI`。
- **#95** `ContentSection` / `ThumbnailList` 只註冊 Pointer/Touch sensor，未加 `KeyboardSensor`。
- **#96** `ObjectPanel.tsx` parameter panel 標題用 module 級 `i18n.lang` 而非 `useI18n()`，語言切換不重繪。

---

## 批次 6 & 7：LayerPanel / ElementList / RWD 與跨檔案掃描

### 🔴 高
- **#97** 刪除 `RightPanel/ObjectPanelItem.tsx` 與其 `__mocks__`，造成 **10 個既有 spec 無法執行**（`Cannot find module '../ObjectPanelItem'`，實測確認），CI `pnpm test` 會紅：
  `ConfigPanel/{Multipass,Speed}Block`、`DimensionPanel/{DimensionPanel,FlipButtons,PositionInput,RatioLock,Rotation,SizeInput}`、`OptionsBlocks/{Polygon,Rect}Options`。
  另有 2 個孤兒 snapshot（`RightPanel/__snapshots__/ObjectPanelItem.spec.tsx.snap`、`OptionsBlocks/__snapshots__/VariableTextBlock.spec.tsx.snap`）。
  **合併前應處理**：mock 路徑改指 `common/ObjectPanelItem`，刪 2 個孤兒 snapshot。
- **#98 🩹** 大量新增檔案缺測試。**已部分處理**：新增 `editable/base.spec.ts`（鎖住 ControlType 數值）+ 9 個高風險檔的 `【TODO：add tests】` 標註；其餘仍待補。
- **#100 🩹** `useLayerChildElements` 把 `version` 放進 MutationObserver effect deps → observer 全量重建。**已部分處理**：#101 的動態 quietPeriod 分桶避免每 tick 重建 funnel；但 version 仍在 effect deps，屬刻意的強制更新手段（用於捕捉新 temp group），完整改為「只重建變動部分」需搭配 #56 一起重構。
- **#101**（已處理 — 改為依物件數量動態調整 `minQuietPeriodMs`；「只重算變動部分」的完整增量重構暫緩，見 #56/#100）

### 🟡 中
- **#102** `ElementListItem` 對每個未選取元素在 render 呼叫 `getObjectPanelContext`（`ElementListItem.tsx`）。內含多次 querySelectorAll，N 個物件即每次重繪 N 次。應快取或由 store 提供。
- **#103** `ElementListItem` 的 `elemName`/`locked`/`editable` 是 local state，外部變更不同步（`ElementListItem.tsx`）。undo/redo、LayerContextMenu、TemplateConfig 改動屬性後清單列顯示舊值。
- **#104** Shift 範圍選取的錨點不穩定（`ElementList.tsx`）。`selected` 順序是選取順序而非 DOM 順序，範圍隨選取歷史改變。
- **#105** `RwdModal` 的非受控模式無法開啟（`widgets/RwdModal.tsx`）。`_setOpen` 只被設 false，無設 true 路徑；未傳 `open` 時永遠關閉。
- **#106** `RwdModal` 在 Desktop layout 直接 render null（`widgets/RwdModal.tsx`）。桌面誤用時靜默無畫面、無錯誤。
- **#107** `AutoHeightDrawer` 的 `onResizeStop` 讀 closure 中的 `height` state（`widgets/AutoHeightDrawer.tsx`），應直接用 `elementRef.offsetHeight`。
- **#108** `AutoHeightDrawer` 設 `mask={false}`（`widgets/AutoHeightDrawer.tsx`）。抽屜外點擊直接落到畫布，與 #68 疊加是行動版誤觸主因。
- **#109** Cypress 選擇器指向已刪除的 CSS module（`apps/web/cypress/e2e/mobile-web/text-tools.spec.ts`）。`ObjectPanelItem-module__option` 前綴已不存在，E2E 選擇器必然失效。

### 🟢 低
- **#110 🩹** `helpers/is-dev.ts` 開發期鷹架。**已部分處理**：移除 `fixme`（console.debug 包裝）；`useFalse`、`mockT`（直接回傳 i18n key）仍在。
- **#111** `enum` 又出現在新程式碼（`widgets/RwdModal.tsx` `DisplayMode`、`stores/layoutStore.ts` `LayoutKey`）。
- **#112** `AutoHeightDrawer` 用 `memo` 但接收 `children`（新參考每次不同，memo 失效）。
- **#113** 刪除 `mobile/CanvasTabBar.tsx`、`CanvasActionBar.tsx`，由 `TemplateBottomBar` + SvgEditor 浮動按鈕取代，未見對應既有測試更新。
- **#114** 新增多處 TODO/FIXME（`// TODO: migrate activeKey`、`// TODO: desktop UI`、`// TODO: handle disabled reason check and tooltip`、`// FIXME: sometimes onLayerTouchEnd is not triggered`）為功能未完成標記。
