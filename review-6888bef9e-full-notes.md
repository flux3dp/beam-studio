# Review 6888bef9e — findings

## 批次 1：State 核心 + editable

### 🔴 高

1. **`ControlType` 數字 enum 被序列化進 .beam 檔** — `helpers/element/editable/base.ts:2`
   `setter.ts:26` 用 `JSON.stringify(ControlTypes.filter(...))` 把 enum **數值**寫進 `data-editable`，並隨 template 存檔。日後在 enum 中間插入/刪除任何成員，所有後續值會位移 → 既有 template 的可編輯屬性全部錯位，且無聲失敗。已經有 `_SIZE`/`_FLIP` 插在中間的跡象。
   → 應改成字串 key（`as const` object，符合 CLAUDE.md 慣例），或加版本號 + migration。

2. **`setEditableInfo` 對 temp group 每個子元素各開一筆 undo** — `setter.ts:20-33`
   迴圈內逐一 `beginUndoableChange`/`finishUndoableChange`/`handleHistoryActionOptions`。多選 N 個物件設定可編輯性 → 要按 N 次 undo 才復原。應包成單一 `BatchCommand`。

3. **`data-fullcolor` 分支是 unreachable dead code** — `stores/element/selectedElementStore.ts:52-59`
   MutationObserver 的 `attributeFilter` 只有 `['d','data-shading','data-vt-type','fill']`，但 callback 內判斷 `attr === 'data-fullcolor'`。該屬性永遠不會觸發 observer → 圖片切換全彩時 `objectPanelData` 不會更新。

### 🟡 中

4. **`clearEditableInfo` 未處理 temp group** — `setter.ts:38`
   `setEditableInfo` 有 `isTempGroup` 展開子元素，`clearEditableInfo` 沒有 → 多選時清除的是暫時性 group wrapper 的屬性，子元素的 `data-editable` 原封不動。行為不一致。

5. **`toggleEditableInfo` 在 project 模式多選時會被 override 打回** — `setter.ts:52` + `getter.ts:8`
   `getOverrideValue` 對 temp group 在 project 模式一律回 `allEditableInfo`。toggle 樂觀更新 store 顯示新值，但任何 `refreshState()` 都會把它還原成全 true，DOM 卻已寫入。UI 與資料不一致。

6. **`parseEditableInfo` 在 catch 內直接改 DOM 且無 undo** — `getter.ts:41`
   parse 失敗就 `elem.removeAttribute()`。這是 getter，會在 `getDerivedData()`（store 更新路徑）中被呼叫，等同 render 期間的副作用；且靜默摧毀資料、不可復原。應只 log 不改 DOM。
   另外 `keys.forEach` 沒驗證數值是否為合法 ControlType，舊檔/髒資料會直接變成 key。

7. **`tryExitingExploreMode` 觸發後未歸零 `count`** — `interactionModeStore.ts:70`
   達到 10 次呼叫 `setExploreMode(false)` 後 `count` 仍是 10，1 秒內若重新進入 explore mode，**點一下就會立刻退出**。應在觸發時 `count = 0`。

8. **`allEditableInfo` 是共用可變物件** — `base.ts:71`
   `getOverrideValue`/`parseEditableInfo` 直接回傳同一個 reference。任何呼叫端寫入就污染全域預設值。應 freeze 或回傳 copy。

9. **`useLazyData` 在 zustand selector 內做副作用** — `selectedElementStore.ts:120-132`
   selector 內呼叫 `computeLazyDataWithLock` 並 `queueMicrotask(setState)`。selector 可能一次 render 被呼叫多次且需為 pure function，這裡每次都可能排入 microtask 並觸發額外 render。目前靠 cache 收斂，但很脆弱。

### 🟢 低 / 慣例

10. **`enum` 用法違反 CLAUDE.md** — `base.ts:2` `ControlType`、`layoutStore.ts:10` `LayoutKey`。專案慣例要求 `as const` object。（`ControlType` 見 #1，影響更大）

11. **`ControlTypes` 是手動複製的 enum 清單** — `base.ts:29`
    新增 enum 成員忘了同步就會靜默漏掉（影響 `allEditableInfo` 與序列化）。應由 `Object.values(ControlType).filter(v => typeof v === 'number')` 導出。

12. **`computeLazyDataWithLock` 的 `running` lock 是 dead code** — `stores/element/utils.ts:198`
    `compute` 是同步的，`running.add` 到 `running.delete` 之間不可能有另一次進入（除非同步遞迴）。跨 render 完全不起作用。

13. **`lazyDataCache` 只用 key 當 cache key，不含 element** — `stores/element/utils.ts:36`
    `getLazyData(key, elem)` 支援傳入非選取中的元素，但會寫入同一份全域 cache 與 store state → 污染。目前**沒有呼叫端傳第二參數**（已 grep 確認），屬潛在風險而非現行 bug。

14. **`(document.activeElement as HTMLElement).blur()` 未防 null** — `selectedElementStore.ts:76`
    `document.activeElement` 規格上可為 null。應 `?.blur()`。

15. **`(categoryOverride as any)[nodeType]`** — `stores/element/utils.ts:63`，新程式碼用 `any`，可用 `Record` 型別解掉。

16. **`DimenstionControls` 拼字錯誤** — `base.ts:56`（Dimenstion → Dimension）

17. **`interactionModeStore.ts:80` 註解與實作不符**
    註解說 flag 走 hash query（`#/studio/beambox?templatePreview=true`），實際 `TemplatePreview.tsx:19` 產生的是 `${origin}?templatePreview=true${hash}`，真的 query string。程式正確，**註解錯誤**。

18. **`initTemplatePreviewFromQuery()` 是 import 時的 side effect** — `interactionModeStore.ts:105`
    任何 import 此 module 的測試/非瀏覽器環境都會執行並碰 `window`。

19. **`_exploreMode`/`_templateMode` 是 module 級可變變數**，在 store 之外 — 無法 reset、devtools 看不到、測試間會殘留。

20. **`getEditableInfo` 的 `hasMultiValue` 永遠是 false** — `getter.ts:63`
    `editableInfos` 恆為單元素陣列（作者註解已知，保留給未來）。目前是多餘的複雜度。

21. **`DerivedData.objectPanelData` 型別為 `null | ObjectPanelContext`，但 `getObjectPanelContext` 從不回傳 null**（已確認）。型別過寬，迫使所有消費端做無謂 null check；`getControllableType` 直接解構第二參數且無 default，型別上是不安全的（實際執行安全）。

## 批次 2：ContentLibrary + FileThumbnail + templatePreview

### 🔴 高

22. **`changeContent` 讀取一個從不存在的屬性** — `contentLibrary/manager.ts:381`
    `imageElem.getAttribute('data-origImage') ?? imageElem.getAttribute('xlink:href')`。
    全 repo grep 確認 **`data-origImage` 只有這一處讀取、沒有任何地方寫入**（`addImageContent:222` 寫的是 `origImage`）。`??` 左側恆為 null，永遠走 base64 fallback。屬性名打錯。

23. **`refreshPreview` 沒有 try/finally，例外會讓畫布卡在 origin symbol 模式** — `FileThumbnail/utils.ts:60-77`
    `switchImageSymbolForAll(false)` → `await generateThumbnail()` → `switchImageSymbolForAll(true)`。中間 throw 就再也切不回來，整張畫布維持未光柵化狀態（渲染/效能明顯劣化）。
    同函式亦無併發保護：兩次同時呼叫，先完成的會在後者仍在產圖時就切回 true。

24. **`ContentLibraryManager` 是 singleton，`await` 之後仍讀 `this.owner`** — `manager.ts:520-580`
    `addContentFromCanvas` 開頭已 `const owner = this.owner`，但函式體內多處仍用 `this.owner.id`（如 `setContentOwner(newOriginSymbol, this.owner.id, …)`）。中間有多個 await；期間若元件卸載（cleanup 會把 `this.owner = null`）或改選其他物件 → TypeError 或 owner 掛錯。應全程使用捕獲的 `owner`。

25. **`init()` 沒有 await `initContentLibrary`** — `manager.ts:492`
    init 是 async，未等待就回傳 cleanup。元件在 init 完成前卸載時：listener 已移除、`this.owner` 已設 null，但非同步流程仍會繼續寫 DOM、送出 history command、emit 已無人聽的 `CONTENT_UPDATED`。

26. **`importContents` 對使用者提供的 SVG 未做防護** — `manager.ts:139`
    `content.children[0].getAttribute('xlink:href')` — 空的 `<symbol>` 直接 TypeError。匯入的是外部檔案，屬可觸發的當機路徑。

27. **`askToEditThumbnails` / `showThumbnailList` 的 promise 可能永不 resolve** — `getThumbnailsForExport.tsx:20` + `ThumbnailList.tsx:70`
    `resolve` 只在 `onClose` 呼叫。若 dialog 被其他途徑關閉（外部 `popDialogById`、路由切換），`getThumbnailsForExport` 永久 pending → **整個匯出流程無聲卡死**，且沒有 timeout。

### 🟡 中

28. **`blobSrcToBase64` 失敗時靜默回傳原 blob URL** — `manager.ts:205`
    catch 直接 `return src`。blob URL 只在當前 session 有效，寫進檔案後重開必定失效 → 內容庫項目永久損壞，且使用者不會收到任何錯誤。

29. **`URL.createObjectURL` 未 revoke** — `manager.ts:352`（`addContentFromDialog` 的 image 分支）、`AddButton.tsx:40`（`img.onload` 尺寸超標的 early return 路徑；`onerror` 有 revoke，`onload` 失敗分支沒有）。

30. **錯誤處理放在 `finally`，會蓋掉真正的例外** — `manager.ts:174`（importContents）、`manager.ts:585`（addContentFromCanvas）
    `if (!success) popUpError(...)` 在 finally。任何中途 throw 都會先彈出「格式不支援」這個誤導訊息。且 `handleHistoryActionOptions(batchCmd)` 同樣在 finally，早期 `return` 時會提交**空的 BatchCommand**，產生無作用的 undo 步驟。

31. **`thumbnails` 與 `thumbnailsData` 的初始狀態不一致** — `FileThumbnail/utils.ts:39-57`
    `resetThumbnails()` 建立 `thumbnailsData['preview']` 但**沒有把 `'preview'` 推進 `thumbnails`**（只有 `refreshPreview()` 會推）。連帶造成：
    - `ThumbnailList.tsx:85` 標題 `thumbnails.length - 1` 在 preview 尚未加入時會顯示 `-1`
    - `addThumbnail` 用 `thumbnails.length === 2` 判斷是否解鎖 preview 的可見性切換，順序不同就永遠不觸發

32. **`addThumbnail` 用 `Date.now()` 當 key** — `FileThumbnail/utils.ts:79`
    同毫秒內連續加入會產生重複 key：`thumbnailsData` 被覆蓋（舊 objectURL 洩漏）、`thumbnails` 卻塞入兩筆相同 key → React key 重複、`removeThumbnail` 只移除第一筆。改用遞增計數器即可。

33. **`getPreviewUrl` 只用 `window.location.origin`** — `TemplatePreview.tsx:19`
    丟失 base path；在 Electron 若以 `file://` 載入，`origin` 是字串 `"null"`，iframe src 與 `postMessage(msg, origin)` 的 targetOrigin 都會壞掉，receiver 的 `origin !== window.location.origin` 檢查也隨之失效。**桌面版此功能需實測確認。**

34. **`readBeam` 沒有 try/catch** — `templatePreviewReceiver.ts:36`
    async message listener 內的 rejection 會變成 unhandled promise rejection，使用者只看到空白預覽。receiver 側也沒有「host 遲遲不送資料」的 timeout。

35. **preview thumbnail 可被拖曳排序，沒有釘選** — `ThumbnailList.tsx:96`
    `reorderThumbnails` 不限制位置，使用者可把一般縮圖拖到 preview 之前。若匯出時第一張代表封面，順序語意會被破壞。

### 🟢 低 / 慣例

36. **`export const enum LibraryType`** — `manager.ts:470`。`const enum` 在 `isolatedModules` / babel / SWC 轉譯下行為不一致，是已知地雷；且違反 CLAUDE.md 的 `as const` 慣例。

37. **`thumbnailsData`/`thumbnails` 是 module 級可變全域 + 自製 event emitter**，檔案第一行自己寫著 `// Convert to a store?`。這正是 CLAUDE.md 指定該用 Zustand 的情境；`ThumbnailList.tsx:94` 的 `items={[...thumbnails]}`（註解「Always use new array reference」）就是這個設計的補丁。

38. **`getContentElements` 的屬性選擇器未加引號** — `manager.ts:92`
    `symbol[data-library-owner=${ownerId}]`。id 目前來自 `getNextId()` 尚屬安全，但值含特殊字元時 `querySelectorAll` 會直接 throw。加引號即可。

39. **`exportContents` 的副檔名標籤與實際不符** — `manager.ts:196`
    Mac 上顯示 `LibraryContents (*.bvg)`，實際 filter 是 `svg`。另外用 `wrapper.outerHTML` 序列化 SVG，`XMLSerializer` 才是正解。

40. **`addContentFromCanvas` 把 clone 暫時掛到畫布上** — `manager.ts:552`
    `pickedElem.parentElement?.appendChild(cloned)`，若 `convertTextToPath` 中途 throw，`finally` 並未清掉 `cloned`，畫布上會殘留一個 `visibility:hidden` 的孤兒節點並被存進檔案。
    （已確認 `convertTextToPath` 正常路徑會就地替換原元素，正常情況無殘留。）

41. **無障礙**：`AddButton.tsx:56` 是純 `div` + `onClick`，無 `role`/`tabIndex`/鍵盤事件；`ThumbnailList.tsx:51` 只註冊 Pointer 或 Touch sensor，未加 `KeyboardSensor`，排序無法用鍵盤操作。

42. **`restrictToParent` 從 `ObjectPanel/LibraryPanel/ContentSection` 匯入** — `ThumbnailList.tsx:11`
    FileThumbnail 反向依賴 ObjectPanel 的內部檔案，分層混亂，應抽到共用 util。

43. **`SortableThumbnail` 把 `{...listeners}` 展開在整個容器上** — `ThumbnailList.tsx:41`，`withActions` 的按鈕都在拖曳區內，觸控時容易誤觸（靠 `distance: 5` 緩解）。

44. **`getThumbnailsForExport` 對 preview 一律輸出 `data: null`** — `getThumbnailsForExport.tsx:56`，需與 `generateBeamBuffer` 的處理對照（見批次 3）。

45. **`modelId` 拼字錯誤**（應為 `modalId`）— `getThumbnailsForExport.tsx:16`

46. **`constants.ts:4` 註解說 query param 在 hash 裡**，實際 `TemplatePreview.tsx:19` 產生的是真正的 query string（`?` 在 `#` 之前）。與 #17 同源，註解錯誤。

### ✅ 已查證非問題
- `getContentElements` 的 `data-image-symbol` / `data-origin-symbol` 選擇器方向正確（`symbolMaker.ts:334-335`：origin symbol 帶 `data-image-symbol` 指標，image symbol 帶 `data-origin-symbol`）。
- `BatchCommand.onAfter` 在 `doApply` 與 `doUnapply` 都會呼叫（`history.ts:53,65`），`changeContent` 的 `updateImageDisplay` undo 後會正確刷新。
- `ThumbnailList` 的 `maxThumbnails` 計數含 preview 的 off-by-one 實際正確。

## 批次 3：Template 檔案格式（.beam block 0x05）

### 🔴 高

47. **`templateMode: false` 會被當成 `true`** — `save.ts:73`、`cloud.ts:118`
    `currentFileManager.setTemplateFile(blob, opts?.templateMode !== undefined)`
    第二參數是 `isNewFile`，而 `setTemplateFile` 的邏輯是 `isTemplateMode = !!fileBlob && (isNewFile || !!this.templateFileBlob)` — **完全沒有讀取 `templateMode` 的值**。
    因此 `saveAsFile({ templateMode: false })` → `isNewFile = true` → `isTemplateMode = true` → 呼叫 `setTemplateMode(true)`，整個 App 切進 template mode；但同時 `generateBeamBuffer(opts)` 已把 `template: false` 寫進檔案 metadata。**檔案說不是 template、App 說是 template，狀態互相矛盾。**
    應為 `opts?.templateMode === true`，或直接把值傳進去。

48. **`readBeamFileInfo` 的 `thumbnail` 從 data URL 改成 object URL，且全部沒有 revoke** — `beam-file-helper.ts:600`
    舊版回傳 `data:image/png;base64,...`，新版回傳 `URL.createObjectURL(blob)`。差異很大：
    - object URL 不可持久化（存進 recent files 清單、上傳雲端、寫 localStorage 都會失效）
    - 每次呼叫都新增一個永不釋放的 blob URL。`TabRecentFiles.tsx:43` / `TabTemplateFiles.tsx:52` 會對清單中**每個檔案**呼叫一次 → 瀏覽範本清單時記憶體單調成長（blob 內容被 URL 鎖住無法 GC）。
    自訂縮圖 `src` 同樣是 object URL（`beam-file-helper.ts:619`），問題相同。

49. **`resetTemplate` 沒有 try/finally，失敗會永久卡住 UI** — `svgedit/resetTemplate.ts:11-15`
    `openNonstopProgress` 之後直接 `await readBeam(...)`，若 throw，`popById` 不會執行，非停止式進度遮罩會永遠蓋住畫面。
    另外 `readBeam(blob as File)` 把 `Blob` 硬轉成 `File`。

50. **對外部檔案的二進位解析缺少邊界檢查** — `beam-file-helper.ts:459-495`（readBlocks 0x05）與 `:604-634`（readBeamFileInfo 0x05）
    迴圈只用 `i < count && currentOffset < blockEnd` 當守衛，中間每次 `readVInt` / `buf.readUInt8(currentOffset)` / `buf.toString(...)` 都沒有先驗證剩餘長度。截斷或損毀的 .beam 會直接丟 RangeError 而非給出可讀錯誤。這是解析不可信輸入的路徑。

### 🟡 中

51. **`saveAsFile` 在 web 上可能用 `blob === null` 去設定 template 狀態** — `save.ts:64-75`
    `blob` 只在 `getContent` 被呼叫時才賦值。web 分支條件是 `if (newFilePath || isWeb_)`，即使使用者取消下載（`getContent` 未被呼叫）也會進入，此時 `setTemplateFile(null, true)` → `isTemplateMode = false` → **無聲關閉 template mode**，且函式仍回傳 `true` 表示存檔成功。

52. **`askToEditTargetLayers` 的 promise 沒有保證解析路徑** — `templateTargetLayer.tsx:58-78`
    `onYes` 內層等待 `TemplateTargetSettingModal` 呼叫 `resolve`；modal 的 `onClose` 只做 `popDialogById`，不保證會 resolve。一旦沒 resolve，外層 `askToEditTargetLayers()` 永久 pending → `generateBeamBuffer` 卡住 → **存檔流程無聲中止**。
    與 #27（`askToEditThumbnails`）是同一類問題，**建議統一處理**：dialog promise 一律在關閉路徑上保證 settle。

53. **`setTargetLayers` 直接改屬性，不進 undo、不標記未存檔** — `templateTargetLayer.tsx:35-38`
    `layerG.setAttribute('data-template-target', label)` 沒有 `beginUndoableChange` 或 `changeAttribute`。使用者設定完可匯入圖層後無法 undo，且檔案不會被標記為已修改。

54. **`determineTargetLayer` 丟出未在地化的裸 Error** — `templateTargetLayer.tsx:87`
    `throw new Error('No template target layers')`，需確認呼叫端有 catch，否則使用者會看到通用崩潰訊息。

55. **target layer 以「圖層名稱」為鍵** — `templateTargetLayer.tsx:27`
    `value: layer.getName()`。圖層名稱可重複、可被使用者改名，改名後 template 的匯入目標對應即失效。

56. **`getLayerChildElements` 每次呼叫都全域掃描 temp group** — `getLayerChildElements.ts:107`
    `collectTempChildrenByLayer()` 內含 `document.querySelectorAll('[data-tempgroup="true"]')` 並走訪其所有子節點，而此函式是 per-layer 呼叫。新的 ElementList 若對 N 個圖層各呼叫一次，就是 N 次全域查詢。應把 temp map 提到呼叫端算一次。

57. **`generateThumbnailsListBlockBuffer` 在迴圈內反覆 `Buffer.concat`** — `beam-file-helper.ts:247-265`
    每次迭代重新配置整個累積 buffer（O(n²)）。縮圖上限 10 張影響不大，但應改成先收集陣列最後一次 concat。

58. **block 0x05 依賴「排在 0x01 之後」的隱含順序** — `beam-file-helper.ts:459`
    `readBlocks` 對 0x05 直接呼叫 `addThumbnail`，而清空是由 0x01 分支的 `importBvgString` → `resetThumbnails()` 完成（已查證 `importBvg.ts:49`）。目前寫入順序正確所以沒問題，但這個耦合沒有寫在格式註解裡，區塊順序一變就會靜默清空縮圖。

59. **`canvas.toBlob((b) => resolve(b!))` 沒有失敗路徑** — `file/export/utils/beam.ts:65`
    `toBlob` 可能回傳 null（`b!` 之後 `blob.arrayBuffer()` 直接 TypeError），也可能不回呼導致 promise 永久 pending。

60. **`generateBeamThumbnail` 序列化整份 live `defs`** — `file/export/utils/beam.ts:60`
    `svgDefs.outerHTML` 會把內容庫的所有 symbol（可能含多張 base64 圖）都塞進縮圖用的 SVG 字串，只為產生一張 300px 的縮圖。內容庫功能上線後這個成本會明顯放大。
    另外對 clone 的 `<use>` 呼叫 `SymbolMaker.switchImageSymbol(useElement, false)` 需確認該函式是否透過 `document.getElementById` 操作**實際文件**而非 clone。

### 🟢 低
61. **檔案格式新增 block 0x05 與 metadata `template` 欄位，但簽章版本仍是 2** — `beam-file-helper.ts:277`
    舊版讀到 0x05 會 `console.error('Unknown Block Type')` 並停止（`currentOffset = -1`）。因為 0x05 排在最後，1~4 已讀完，實際可優雅降級 — 但這是靠區塊順序碰巧成立的，值得在格式註解裡寫明。

62. **`readHeader` 完全不使用 metadata 的 `contents` 欄位**，仍以固定順序讀 VINT。header 中 thumbnailsList 長度是條件性寫入的，未來若新增條件性區塊且順序不同就會錯位。

63. **`modelId` 拼字錯誤**再度出現於 `resetTemplate.ts:6`、`templateTargetLayer.tsx:42,82`。

### ✅ 已查證非問題
- `readBlocks` 的 0x05 不會跨檔案累積縮圖：0x01 分支的 `importBvgString` 內部會先 `resetThumbnails()`（`importBvg.ts:49`）。
- `reintegrateTempChildren` 由後往前插入，`data-next-sibling` 的查找對象 `result` 會累積先前插入的元素，順序還原正確。
- 縮圖 key 的長度以 UTF-8 byte 寫入、也以 byte 位移讀回，多位元組 key 不會錯位。

## 批次 4：Canvas 互動（mouse / selector / SvgEditor）

### 🔴 高

64. **Fit Text 單向縮放的定位邏輯被整段包進 template 模式判斷，editor 模式直接失效** — `svgedit/interaction/mouse/index.ts:625-643`
    原本無條件執行的 `newLeft` / `newTop` 計算，現在整段位於 `if (withinInteractionModes(templateModes)) { … }` 內。
    在 **editor / project 模式**下 `newLeft = left`、`newTop = top` 恆成立 → 拖曳 fit text 的 **W / N 控制點時錨定邊反了**（應固定東/南邊，現在固定西/北邊），負向縮放（翻轉）的處理也一併消失。
    這是**影響所有既有使用者的回歸**，與 template 功能無關。
    修法：把 template 專屬分支併進條件鏈，而非包住整段：
    `if (inTemplate && !editableX) { … } else if (sx > 0) { … } else { … }`

65. **「位置鎖定 → 從中心縮放」的設計被自己的另一段程式碼抵銷** — `mouse/index.ts:719-733` vs `:573-585`
    `mouseMove` 在**函式頂端**就把 `x = startX`（第 727 行），而該 `x` 一路傳進 `onResizeMouseMove(evt, selected, x, y)`（第 880 行），裡面 `let dx = x - startX`（第 540 行）→ **`dx` 恆為 0** → `sx = (width + 0)/width = 1`。
    因此第 575-578 行新增的「從中心縮放」永遠算不出非 1 的縮放比：**鎖定 POSITION_X 的結果不是「從中心縮放」，而是該軸完全無法縮放。**
    根因是頂端的 clamp 對 mouseMove 的**所有模式**生效（含 resize），而搬移用的 clamp 其實已經在 drag 分支裡另外做了一次（第 806-822 行）。頂端那段應該移除或限定只在 drag 模式套用。

66. **正式程式碼留有每次 mousemove 都會輸出的 `console.log`** — `mouse/index.ts:728`
    `console.log('position x is not editable, ignore x change', realX, startX);`
    在 template 模式且 X 鎖定時，滑鼠每移動一格就輸出一次。（Y 軸沒有對應的 log，可見是遺留的除錯碼。）

67. **`objectDragStart` 在拖曳過程中被重複發送、`objectDragEnd` 則無條件發送** — `mouse/index.ts:826`、`:1036`
    `objectDragStart` 位於 `mouseMove` 的 `if (dx !== 0 || dy !== 0)` 之內 → 一次拖曳會發出**數十到數百次**；
    `objectDragEnd` 放在 `mouseUp` 最前面，在 `rightClick` 提前 return 之前，且不論是否曾經拖曳 → **每次點擊、每次右鍵都會發出一次 end**。
    監聽端若用它來切換 UI 狀態（例如隱藏面板），行為會不可預期。

68. **`checkShouldIgnore()` 被刪除且無替代守衛** — `mouse/index.ts:92`（刪除）、`:115`、`:1039`
    原本 `ObjectPanelController.getActiveKey() && navigator.maxTouchPoints > 1` 用來在觸控裝置上、ObjectPanel 彈出層開啟時擋掉 canvas 的 mouseDown / mouseUp。此 commit 兩處呼叫都移除，`getActiveKey` 仍存在但已無人在滑鼠路徑上查詢。
    新的 `activeKey` 移到 `selectedElementStore`，但只在 layout 變更時清除，**沒有任何地方阻擋 canvas 事件**。
    → 需實測：平板/手機上點擊 ObjectPanel 彈出層時，canvas 是否會同時收到事件而取消選取或誤移動物件。

### 🟡 中

69. **`preview_color` 模式的兩個處理被移除，但該模式仍在使用中** — `selector.ts:348-353`（刪除）、`mouse/index.ts:1555-1556`（刪除）
    已確認 `preview_color` 仍活著：`ColorPickerMobile.tsx:77` 會設定它、`mouse/index.ts:1448` 仍有對應 case、`history/utils/index.ts:29,57` 仍在檢查。
    被刪掉的是：(a) selector 在該模式下隱藏所有控制點的 early return；(b) 雙擊退出色彩預覽（`setColorPreviewing(false)`）。
    → 需確認是否有意（新的 ColorPickerMobile 自行負責退出），否則色彩預覽時會多出選取框控制點且無法用雙擊離開。

70. **`updateNonEditableGripVisibility` 單獨呼叫時不會還原已隱藏的控制點** — `selector.ts:431`、`setter.ts:35`
    函式本身只做 `setAttribute('display','none')`，沒有還原分支（rotate grips 有 else，resize grips 沒有）。
    在 `resize()` 流程中無妨，因為第 370-372 行會先 `removeAttribute('display')` 重置；但 `setEditableInfo` 是直接呼叫 `requestSelector(elem)?.updateNonEditableGripVisibility()` — 這條路徑**沒有前置重置**，所以把某個尺寸/旋轉控制項從「不可編輯」切回「可編輯」時，控制點不會立刻重新出現，要等下一次完整 `resize()`。

71. **line 的控制點左右/上下對應只看 `x1 > x2`，未考慮旋轉角** — `selector.ts:439-447`
    元素帶 rotation 時，視覺上的 left/right grip 與 `x1`/`x2` 的關係會反轉，導致鎖住 `POSITION_X` 卻隱藏了錯誤那一側的控制點。

72. **`case 'pick'` 在 `mouseDown` 內 await 長時間操作** — `mouse/index.ts:216-225`
    `await contentLibraryManager.addContentFromCanvas(...)` 包含檔案轉換與光柵化。期間使用者的 mouseup / mousemove 不會被對應處理。另外沒有檢查目標是否在鎖定或隱藏圖層上（其他選取路徑都有 `checkSelectable` / `isElemLocked`）。

73. **從中心縮放時覆寫了 `sx`/`sy`，繞過等比與 fit-text 約束** — `mouse/index.ts:575-585`
    重算 `sx` 時直接忽略前面 `isFreeResize` / `fixedByFitText` 的計算結果，Shift 等比縮放與 fit text 的固定行為在該分支失效。

74. **`getSymbolBBox` 首次呼叫回傳未經四捨五入的值，之後回傳四捨五入的值** — `svgedit/utils/getBBox.ts:146-178`
    `!bbText` 分支計算出 `obj`（`toFixed(5)`）寫入 `data-bbox`，但 `return` 用的是原始 `bb`。同一個 symbol 第一次與第二次呼叫結果會有微小差異。應 `bb = obj`。

75. **`data-bbox` 快取沒有失效機制** — `getBBox.ts:147`
    快取永久寫在 symbol 上。內容庫的 `changeContent` → `getAttributesToFitOwnerBBox` → `getSymbolBBox` 會依賴它；symbol 內容一旦被取代而 id 沿用，就會用到過期的 bbox，導致內容縮放/定位錯誤。

### 🟢 低

76. **`findAndDrawAlignPoints` 改用 clamp 後的 `x, y`** — `mouse/index.ts:743`
    非拖曳狀態下 `startX/startY` 是上一次 mousedown 的殘值，template 模式下對齊點預覽會畫在錯誤位置。

77. **`SvgEditor.tsx:55` 變數命名誤導** — `const isTablet = useIsTabletOrMobile();`，實際包含 mobile。整份 JSX 用 `isTablet` 判斷，閱讀時容易誤解。

78. **`TopBarHintsContextProvider` 在 SvgEditor 內另外包了一層** — `SvgEditor.tsx:104`
    若 TopBar 另有一份同名 Provider，兩邊會是各自獨立的 context，從一邊設定的 hints 不會反映到另一邊。需確認。

79. **`isRetailDev()` 的 template mode 切換按鈕直接寫在正式元件樹裡** — `SvgEditor.tsx:139-147`。有 flag 保護，但屬於應該獨立出去的開發工具。

### ✅ 已查證非問題
- `selector.ts` 的 resize grips 在正常 `resize()` 流程中會先被 `removeAttribute('display')` 重置（第 370-372 行），不存在「切回 editor 模式後控制點永久消失」的問題（只有 #70 那條路徑例外）。
- `mouse/index.ts` 把 layer 可選取判斷換成 `checkSelectable` + `isElemLocked` 是合理的重構；新增的「元素自身鎖定」判斷屬預期行為變更。

## 批次 5：ObjectPanel 重寫 / ConfigPanel / LibraryPanel / TemplateConfig

### 🔴 高

80. **`ObjectPanelItem` 的 ref callback 每次 render 都會觸發兩次 setState** — `common/ObjectPanelItem.tsx:112-116`
    ```tsx
    ref={(node) => { setRef(node); if (propsRef) propsRef.current = node; }}
    ```
    inline arrow → 每次 render 都是新 identity → React 會先以 `null` 呼叫舊 callback、再以 node 呼叫新 callback → **每次 render 都是 `setRef(null)` + `setRef(node)`**，各觸發一次額外 render。
    這個元件是 tablet/mobile ObjectPanel 的每一顆按鈕，成本會乘以按鈕數量。應改用 `useCallback` 穩定 ref identity。

81. **`displayTabs` 讀 `getState()` 而非訂閱，可編輯性變更不會反映到 UI** — `ObjectPanel/tabs.tsx:104`
    `const { controllableTypes, editableInfo } = useSelectedElementStore.getState();`
    這是一般函式（非 hook），在 render 期間呼叫但**不建立訂閱**。選取切換時因父元件重繪而碰巧正確，但在 project 模式下用 TemplateConfig 切換某個屬性的可編輯性時，`editableInfo` 改變**不會**讓分頁重新計算 → explore/template 模式該出現/消失的分頁不會更新。

82. **`allowUpload` 用 `useMemo(..., [owner])` 快取 DOM 屬性讀取** — `LibraryPanel/ContentSection.tsx:75`
    `getCustomerUploadAllowed(owner)` 讀的是 `data-customer-upload` 屬性。`CustomDataToggle` 改這個屬性時 `owner` 參考不變 → **memo 永不重算 → 上傳按鈕的顯示狀態不會更新**，要重新選取物件才會生效。

83. **「允許編輯」關閉再開啟會清掉「允許刪除」設定** — `ObjectPanel/TemplateConfig.tsx:21-30`
    `setEditable(false)` → `setEditableInfo(elem, {}, { overwrite: true })` 把 `data-editable` 整個覆寫成空，DELETE 旗標一併消失；再開啟 → `allEditableInfo` 把 DELETE 一律設回 true。使用者原本「可編輯但不可刪除」的設定在來回切換後變成「可編輯且可刪除」，屬無聲的資料遺失。

84. **`FillBlock` 漏傳 `commonProps`** — `ConfigPanel/ConfigPanel.tsx:295`
    `{isPromark && <FillBlock />}`，而同一區塊內其他 15 個元件都是 `{...commonProps}`（帶 `noApply`）。在 objectPanel popup（`noApply = true`）中，Promark 的 Fill 設定會繞過「不立即套用」的機制直接寫入圖層資料。

### 🟡 中

85. **`PopupItem` 在 render 期間做 `document.querySelector`** — `common/ObjectPanelItem.tsx:66`
    `const reference = propsReference ?? document.querySelector(\`#object-panel-item-${id}\`)`。render 應為 pure；且首次 render 時對應的 ButtonItem 可能尚未進入 DOM → `reference` 為 null → 浮動彈窗定位失準。每次 render 都重新查詢也沒有快取。

86. **`setEditable` 用不帶 `controllableTypes` 的 `getEditableInfo` 回寫 store** — `TemplateConfig.tsx:27`
    `getEditableInfo(selectedElement)` 預設用全部 `ControlTypes`，而 store 平時是由 `getDerivedData` 以該元素實際的 `controllableTypes` 計算。切換後 store 內 `editableInfo` 的鍵集合與正常路徑不一致，任何依賴「鍵存在與否」的邏輯都可能誤判。

87. **`contentLibraryManager.type` 在 render 期間讀取** — `ContentSection.tsx:76`
    `const isImage = contentLibraryManager.type === LibraryType.IMAGE;`。`type` 由 effect 中的 `init()` 設定，首次 render 讀到的是**前一個元素**留下的值。搭配 #24/#25 的 singleton 問題，切換選取時可能短暫用錯 library 類型渲染。

88. **`handleDragEnd` 直接解構 `over.data.current`** — `ContentSection.tsx:113-114`
    `(over.data.current as { index: number }).index`，dnd-kit 在某些狀態下 `data.current` 可能為 undefined，無防護即 TypeError。

89. **`setMouseMode('pick')` 沒有取消路徑** — `ContentSection.tsx:150`
    進入 pick 模式後沒有視覺提示、沒有 Esc 取消、沒有逾時。使用者若改變主意，模式會一直停在 'pick' 直到點擊畫布任一處（並觸發一次內容加入）。

90. **`ConfigPanel` 移除 `panel-item` UIType 後，`WhiteInkCheckbox` 在平板/彈窗 UI 完全消失** — `ConfigPanel.tsx:288`
    只剩 `UIType === 'default'` 的條件（原本另有一行專供 `panel-item`）。屬 dev 模式功能，影響有限但是無聲移除。

### 🟢 低

91. **`ObjectPanel.tsx:169` `defaultActiveKey={Object.keys(panels)}`** — 用「所有可能的 panel key」當預設展開集合（含桌面版根本不會用到的 `arrange`/`boolean`/`mainActions`）。這是為了讓後來才出現的 panel 也是展開狀態的取巧寫法，可行但意圖不明顯，且使用者的收合狀態不會被保存。

92. **`renderTabletButtons` 用 `key={index}` 給 divider** — `ObjectPanel.tsx:196`。清單是條件組成的，index 會隨選取內容變動。

93. **`ContentSection.tsx:39-56` 使用中文註解**（`// 左邊界`…），與整個 codebase 的英文註解慣例不一致。

94. **`TemplateConfig.tsx:80-108` 桌面版與平板版 JSX 完全重複**，且標註 `// TODO: desktop UI`。

95. **`ContentSection` / `ThumbnailList` 都只註冊 Pointer 或 Touch sensor**，未加 `KeyboardSensor`，拖曳排序無鍵盤替代方案。

96. **`ObjectPanel.tsx:84` `parameter` panel 的標題用 module 級 `i18n.lang`** 而非 `useI18n()`，執行期切換語言時不會觸發重繪。

## 批次 6 & 7：LayerPanel / ElementList / RWD 與跨檔案掃描

### 🔴 高

97. **刪除 `RightPanel/ObjectPanelItem.tsx` 與其 `__mocks__`，造成既有測試無法執行（已實測確認）**
    commit 刪除了：
    - `RightPanel/ObjectPanelItem.tsx`
    - `RightPanel/ObjectPanelItem.module.scss`
    - `RightPanel/__mocks__/ObjectPanelItem.tsx`
    - `RightPanel/ObjectPanelItem.spec.tsx`

    但**至少 10 個既有 spec 仍寫著 `jest.mock('../ObjectPanelItem')`**，全部會以
    `Cannot find module '../ObjectPanelItem'` 直接掛掉（整個 suite 無法執行，不是個別測試失敗）：
    ```
    ConfigPanel/MultipassBlock.spec.tsx      ConfigPanel/SpeedBlock.spec.tsx
    DimensionPanel/DimensionPanel.spec.tsx   DimensionPanel/FlipButtons.spec.tsx
    DimensionPanel/PositionInput.spec.tsx    DimensionPanel/RatioLock.spec.tsx
    DimensionPanel/Rotation.spec.tsx         DimensionPanel/SizeInput.spec.tsx
    OptionsBlocks/PolygonOptions.spec.tsx    OptionsBlocks/RectOptions.spec.tsx
    ```
    實測輸出：
    ```
    ● Test suite failed to run
      Cannot find module '../ObjectPanelItem' from
      'src/web/app/components/beambox/RightPanel/DimensionPanel/SizeInput.spec.tsx'
    Test Suites: 1 failed, 1 total
    ```
    **此問題在目前的 HEAD（e15818d27）仍然存在。** 另有 2 個 obsolete snapshot 檔待清理
    （`RightPanel/__snapshots__/ObjectPanelItem.spec.tsx.snap`、`OptionsBlocks/__snapshots__/VariableTextBlock.spec.tsx.snap`）。

98. **94 個新增的 .ts/.tsx 檔案，新增的測試檔為 0**
    包含 `interactionModeStore`、`layoutStore`、`stores/element/*`、`editable/*`、
    `contentLibrary/manager.ts`（604 行）、`getLayerChildElements`、`.beam` 的 0x05 區塊讀寫等
    純邏輯、易測試且高風險的模組，全部沒有任何 spec。
    專案本身有 `unit-test` skill 與完整的 mock 慣例，這是明顯的缺口。

99. **15 處遺留的 `console.log` / `console.debug`（11 個檔案）**
    ```
    ElementListItem.tsx              × 3  ← 其中 2 處在 render 路徑、1 處在 DragOverlay（拖曳中每幀）
    svgedit/operations/infill.ts     × 2
    LayerPanel.tsx                   × 2  ← onLayerDragEnd / onLayerTouchEnd
    svgedit/interaction/mouse/index.ts × 1 ← 每次 mousemove（見 #66）
    beam-file-helper.ts              × 1
    helpers/image-edit.ts            × 1
    helpers/is-dev.ts                × 1  ← `export const fixme = (str) => console.debug(str)`
    pages/Beambox.tsx                × 1
    dialogs/myCloud/Thumbnails.tsx   × 1
    RightPanel/common/Slider.tsx     × 1
    RightPanel/ActionsPanel.tsx      × 1
    ```

100. **`useLayerChildElements` 把 `version` 放進 MutationObserver effect 的相依陣列** — `helpers/hooks/useLayerChildElements.ts:79`
     observer 的 callback → `throttledRefresh` → `setVersion` → effect 重新執行 → **disconnect 並重建整個 observer**（重新 observe 所有圖層 + 重新 `querySelectorAll` temp group）。
     也就是說畫布上任何一次屬性變動都會導致 observer 全量重建。`version` 應只留在 `childElements` 的 `useMemo` 相依中，不該進 effect。

101. **observer 用 `{ attributes: true, subtree: true }` 監聽整個圖層，且 callback 對任何 attribute 變動都刷新** — `useLayerChildElements.ts:65-70`
     `record.type === 'attributes'` 沒有任何屬性過濾。畫布上拖曳物件時 `transform` 每幀變動 → 每 500ms 觸發一次全量重算，而重算的 `getLayerChildElements` 本身又是全域 `querySelectorAll`（見 #56）。圖層/物件一多會明顯掉幀。

### 🟡 中

102. **`ElementListItem` 對每個未選取的元素在 render 中呼叫 `getObjectPanelContext`** — `ElementListItem.tsx:38`
     該函式內含多次 `querySelectorAll` 與 `isElemFillable` 逐子元素計算。圖層清單有 N 個物件就是每次重繪 N 次。應快取或改由 store 提供。

103. **`ElementListItem` 的 `elemName` / `locked` / `editable` 是 local state，外部變更不會同步** — `ElementListItem.tsx:80-86`
     `data-name`、`data-lock`、`data-editable` 若由 undo/redo、LayerContextMenu 或 TemplateConfig 改動，清單列顯示的仍是舊值（`editable` 的 effect 只依賴 `[element, isSelected, isProjectMode]`，不依賴屬性本身）。

104. **Shift 範圍選取的錨點不穩定** — `ElementList.tsx:37`
     `const anchor = selected.find((el) => elements.includes(el)) ?? element;`
     `selected` 的順序是選取順序而非 DOM 順序，已選多個物件時 Shift+click 的範圍會隨選取歷史改變，不可預期。

105. **`RwdModal` 的非受控模式無法開啟** — `widgets/RwdModal.tsx:39-45`
     `const [_open, _setOpen] = useState(false)`，而 `_setOpen` 只在 `onClose` 內被呼叫為 `false`，沒有任何設為 `true` 的路徑。未傳 `open` prop 時此元件永遠關閉。

106. **`RwdModal` 在 Desktop layout 直接 render null** — `widgets/RwdModal.tsx:20`
     `defaultDisplayModes[LayoutKey.Desktop] = DisplayMode.Null`。任何在桌面版誤用 `RwdModal` 的地方都會靜默無畫面、無錯誤。

107. **`AutoHeightDrawer` 的 `onResizeStop` 讀 closure 中的 `height` state** — `widgets/AutoHeightDrawer.tsx:56-61`
     判斷是否要關閉抽屜用的是上一次 render 的 `height`，而非 `onResizeStop` 當下的實際高度。應直接用 `elementRef.offsetHeight`。

108. **`AutoHeightDrawer` 設定 `mask={false}`** — `widgets/AutoHeightDrawer.tsx:66`
     抽屜沒有遮罩，抽屜外的點擊會直接落到畫布上。這正好與 #68（移除 `checkShouldIgnore` 的觸控守衛）疊加，是行動版誤觸風險的主要來源。

109. **Cypress 選擇器指向已刪除的 CSS module** — `apps/web/cypress/e2e/mobile-web/text-tools.spec.ts:15`
     `[class*="src-web-app-components-beambox-RightPanel-ObjectPanelItem-module__option"]`
     對應的 `RightPanel/ObjectPanelItem.module.scss` 已被刪除，新元件在 `RightPanel/common/`，產生的 class name 前綴不同 → 此 E2E 選擇器必然失效。

### 🟢 低

110. **`helpers/is-dev.ts` 混入了開發期鷹架** — `is-dev.ts:7-10`
     ```ts
     export const isRetailDev = ...   // 註解：should remove before release
     export const useFalse = () => false;          // TODO: check this
     export const mockT = (key: string): string => key;  // TODO: change to real implementation
     export const fixme = (str: string) => console.debug(str);
     ```
     `mockT` 直接回傳 i18n key，任何使用它的地方會把 key 原樣顯示給使用者。

111. **`enum` 又出現在新程式碼**：`widgets/RwdModal.tsx:13` `DisplayMode`、`stores/layoutStore.ts:10` `LayoutKey`。

112. **`AutoHeightDrawer` 用 `memo` 包裝但接收 `children`** — `AutoHeightDrawer.tsx:34`，children 每次都是新參考，memo 不會生效。

113. **刪除 `mobile/CanvasTabBar.tsx`(213) 與 `CanvasActionBar.tsx`(59)** 由 `TemplateBottomBar`(193) + SvgEditor 的浮動按鈕取代，未見對應的既有測試被更新。

114. **新增 8 處 TODO/FIXME**，其中 `// TODO: migrate activeKey`、`// TODO: desktop UI`、`// TODO: handle disabled reason check and tooltip`、`// FIXME: sometimes onLayerTouchEnd is not triggered` 是功能未完成的標記。
