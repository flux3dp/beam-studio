# Review 6888bef9e — 未處理問題（remaining）

> 本檔由完整 review（共 114 條）篩選而來，**只列出尚未修正、也未標記為安全的項目**。
> 編號沿用原始 review 以便對照；已修正 / 已標記安全的項目不再列出（見下方摘要）。

## 摘要

- ✅ **已修正**：#1, #2, #3, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #21, #22, #23, #24, #25, #26, #34, #40, #45, #46, #47, #48, #49, #50, #53, #56, #57, #61, #62, #63, #64, #65, #66, #67, #71, #72, #73, #74, #76, #80, #86, #87, #88, #89, #93, #94, #99（及 readBeam 進度遮罩保護、批次 4 的 editable 把關盤點、「不可移動時不畫對齊線」）
- 🛡️ **已標記安全 / 刻意設計**：#4, #5, #19, #20, #51, #54, #55, #58, #68, #70, #75, #77, #78, #81, #82, #83, #84, #90, #91, #92, #96；#27、#52（正常關閉路徑已由 modal 自行 resolve，僅剩「外部強制 popDialog」的殘留 edge）
- ⏸️ **暫緩 / 忽略**：#59, #60, #69, #79
- 🩹 **部分處理**：#98, #100/#101, #110（見各條說明）
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
- ~~**#36** `export const enum LibraryType`（`manager.ts`）。`const enum` 在 isolatedModules/babel/SWC 行為不一致，違反 `as const` 慣例。~~ → **已修正**（隨 #87 整個 enum 移除，改在使用點判斷 `owner.tagName`）
- **#37** `thumbnailsData`/`thumbnails` 是 module 級可變全域 + 自製 emitter（檔案自註 `// Convert to a store?`），應改 Zustand。
- **#38** `getContentElements` 屬性選擇器未加引號（`manager.ts`）。id 目前安全，含特殊字元時 `querySelectorAll` 會 throw。
- **#39** `exportContents` 副檔名標籤與實際不符（`manager.ts`，Mac 顯示 `*.bvg` 實際 filter 是 svg）；序列化應用 `XMLSerializer` 而非 `outerHTML`。
- ~~**#40** `addContentFromCanvas` 把 clone 暫時掛到畫布（`manager.ts`），若 `convertTextToPath` 中途 throw，`finally` 未清 `cloned`，會殘留 `visibility:hidden` 孤兒節點並存進檔案。（正常路徑無殘留。）~~ → **已修正**：以 `canvasClone` 追蹤那份暫掛的 clone，`finally` 先做清理。刪除條件是「它仍掛在 `pickedElem.parentElement` 底下」——成功路徑上 clone 早已被移進 `wrapper`（再進到 `parseSvg` 產生的 symbol），因此只會清掉真正的殘留，不會動到解析出來的 symbol。
- **#41** 無障礙：`AddButton.tsx` 純 `div`+`onClick` 無 role/tabIndex/鍵盤；`ThumbnailList.tsx` 只註冊 Pointer/Touch sensor，排序無鍵盤替代。
- ~~**#42** `restrictToParent` 從 `ObjectPanel/LibraryPanel/ContentSection` 匯入（`ThumbnailList.tsx`），FileThumbnail 反向依賴 ObjectPanel 內部檔案，應抽共用 util。~~ → **已修正**（隨 #93 抽到 `@core/helpers/dnd/restrictToParent`）
- **#43** `SortableThumbnail` 把 `{...listeners}` 展開在整個容器（`ThumbnailList.tsx`），按鈕在拖曳區內易誤觸。
- **#44** `getThumbnailsForExport` 對 preview 一律輸出 `data: null`（需與 `generateBeamBuffer` 對照，屬設計性、資訊性）。
- ~~**#45** `modelId` 拼字錯誤（`getThumbnailsForExport.tsx`，應為 modalId）。~~ → **已修正**（與 #63 一起處理）
- ~~**#46** `constants.ts` 註解說 query param 在 hash 裡，實際是 query string（與 #17 同源）。~~ → **已修正**：註解改寫為「參數在真正的 query string、位於 `#` 之前」，並寫出兩端的實際行為（`TemplatePreview` 組 `${origin}?${KEY}=true${hashMap.editor}`，iframe 端由 `initTemplatePreviewFromQuery` 讀 `window.location.search`）。

---

## 批次 3：Template 檔案格式（.beam block 0x05）

> 本輪修正：**#50**（新增 `BeamFileFormatError` + `assertRange`；`readVInt` 加 `end` 上界，越界丟可讀錯誤而非 RangeError；0x05 解析抽成共用的 `readThumbnailsListBlock`，readBlocks / readBeamFileInfo 兩處不再各自維護邊界檢查）、**#53**（`setTargetLayers` 改走 `changeAttribute` + BatchCommand + `handleHistoryActionOptions`，可 undo 且自動標記未存檔；無變更時不產生空 undo 步驟）、**#56**（`collectTempChildrenByLayer` → `collectTempChildrenOfLayer(layer)`，只收該 layer 的 temp children，不再為其他圖層建立/丟棄 bucket）、**#57**（先收集 parts 陣列最後一次 `Buffer.concat`）、**#61**（在簽章處寫明版本停在 2 的理由與三項相容前提）、**#63/#45**（`modelId` → `modalId`，涵蓋本 branch 新增的 `templateTargetLayer.tsx`、`getThumbnailsForExport.tsx`、`FileTargetSelector.tsx`；`export-funcs.ts`、`ZoomBlock.tsx` 屬既有程式碼不動）。
>
> 已標記安全：**#51**（web 的 `writeFileDialog` 是先 `await getContent()` 再 `saveAs()`，`blob` 在進入後續判斷前必定已設定；瀏覽器下載本身被取消無法被偵測，也不會回傳到此處 → `blob === null` 的情境不存在）、**#54**（`determineTargetLayer` 的裸 Error 呼叫端已 catch，不需在地化）、**#55**（以圖層名稱為鍵為現行設計）、**#58**（0x05 排在 0x01 之後的順序依賴為刻意設計；相容性理由已隨 #61 寫進註解）。
>
> 暫緩：**#59**（先忽略）。

### 🟡 中
- **#60** `generateBeamThumbnail` 序列化整份 live `defs`（`file/export/utils/beam.ts`）。已確認：內容庫的 `symbol[data-library-owner]` 會被 `removeUnusedDefs` 刻意保留（`data-library-default` 白名單），其中 image content 的 `xlink:href` 是 **base64 data URL**，因此即使縮圖裡沒有任何 `<use>` 參照，也會整包被 `svgDefs.outerHTML` 串進縮圖 SVG，再經 `encodeURIComponent` 變成 data URL。**這不是記憶體洩漏**——所有中間字串都是 local，函式結束即可回收。實際代價是每次呼叫重付一次的：(1) 主執行緒 CPU（`outerHTML` 序列化 + `encodeURIComponent` + 瀏覽器 parse 整份 data URL，同步阻塞 UI）、(2) 回收前同時存活 3–4 份同樣大字串的瞬間峰值、(3) 大字串反覆配置/釋放造成的 major GC pause。非點陣化成本——未被參照的 `<symbol>` 不會被 decode/render。
  量級要公允看待：同一份 base64 本來就會被 `svgCanvas.getSvgString()` 序列化一次寫進檔案（必要），縮圖這條等於再做一次，邊際成本約是「每次存檔多一倍的內容庫序列化」，常數倍浪費而非量級問題。放大因素是頻率：`generateBeamBuffer` 也被**自動存檔**週期性呼叫。
  建議（幾行的低風險修法）：序列化前 clone defs，移除未被 `clonedSvgContent` 內任何 `<use>` 參照的 `symbol[data-library-owner]`（不能無差別刪，owner 自己的預設 symbol 有被參照）。
  另：`SymbolMaker.switchImageSymbol(useElement, false)` 只 `setAttribute` 在傳入的 clone `<use>` 上（僅從 document 查 symbol），**不會**動到實際文件。

### 🟢 低
- ~~**#62** `readHeader` 完全不使用 metadata 的 `contents` 欄位，仍以固定順序讀 VINT；未來新增條件性區塊會錯位。~~ → **已處理（加註解）**：在 `readHeader` 上方寫明「固定順序、刻意不看 `contents`」為何現在安全（唯一的條件性區塊 0x05 排在最後；讀到的 size 只供除錯，回傳值只有 metadata，真正的 offset 由 `readBlocks` / `readBeamFileInfo` 重算），並註明「若未來把條件性區塊插到既有區塊之前，這裡與那兩個 reader 都必須改成依 `contents` 驅動」。

---

## 批次 4：Canvas 互動（mouse / selector / SvgEditor）

> 本輪修正：**#74**（`getSymbolBBox` 改為只建立一份四捨五入後的 `bb` 並同時回傳／寫入 `data-bbox`，首次與 cache-hit 結果完全一致）、**#76**（`!started` 分支改回 `findAndDrawAlignPoints(realX, realY)` — 這是本 branch 的 regression：clamp 只在拖曳中有意義，`started === false` 時 `startX/startY` 還是上一次 mousedown 的殘值）。
>
> 補強 1：**旋轉模式不可套用位置 clamp**（`mouseMove` 原 line 726）。該區塊只排除了 `'resize'`，但 `'rotate'` 的角度是 `atan2(cy - y, cx - x)` 算出來的——x 被 clamp 成 `startX` 會直接算出錯誤角度。改為以 module 級的 `rawPointerModes = new Set(['resize', 'rotate'])` 排除「把指標位置解讀成非位移」的模式。
>
> 補強 2：**旋轉的 editableInfo 檢查**（`mouseMove` `case 'rotate'`）。原本 template mode 下位置有 clamp、尺寸有 center-resize 處理，唯獨旋轉完全沒有把關，只靠 `Selector.updateNonEditableGripVisibility` 把 rotate grip 設成 `display:none`——正是 #70 指出的那類「只靠 grip 可見性」的脆弱假設。改為在套用角度前檢查 `ControlType.ROTATION`。選擇在 mouseMove 擋而非在 mouseDown 不進 rotate mode，是為了避免手勢 fall through 變成拖曳；mouseUp 的空 BatchCommand 會被自己的 `isEmpty()` 丟掉。（`setMouseMode('rotate')` / `setRotationAngle` 在 interaction 層都只有 rotate grip 一個入口，已確認。）

### 📋 editable 在滑鼠事件裡的把關盤點（已全數處理）

全 `svgedit/` 原本只有兩個檔案讀 `editableInfo`：`selector.ts`（grip 顯示）與 `interaction/mouse/index.ts`。逐一檢查每個 mouse mode 對 x/y 的用法後，以下全部修正：

- ✅ **rotate 讀到 clamp 後座標**（補強 1）、**rotate 無 editable 檢查**（補強 2）。
- ✅ **clamp 範圍改為「只在 `currentMode === 'select'` 生效」**（原本是「排除 resize」）。其餘模式都不該套用選取元素的鎖：`rotate`/`resize` 需要原始座標；`line`/`rect`/`ellipse`/`path`/`polygon` 是在建立**新圖形**，與選取元素的旗標無關；`drag-prespray-area`/`drag-rotary-axis` 拖的根本不是圖形元素。（`textedit` 用 `mouseX/mouseY`、rubber band 類用 `startMouseX/mouseX`，本來就不受影響。）
  註：clamp 對 `select` **不是**多餘的 — 它排在 `snapToAngle` / `getMatchedDiffFromBBox` **之前**，可避免 shift 吸附與自動對齊一開始就沿著鎖定軸提案；後面的 `dx/dy = 0` 只保證最終位移為零。故保留而非刪除。
- ✅ **dblClick 進文字編輯未檢查 `TEXT_CONTENT`**：ObjectPanel 的文字輸入會依 editable 停用，但畫布上雙擊仍可進去打字。純 `<text>` 與 textpath 兩條路徑都補上（textpath 的旗標在 `g[data-textpath-g]` 上，不在內部的 `<text>`/`<path>`）。
- ✅ **進 path 節點編輯無任何檢查**：以 `_SIZE` 為閘（節點拖曳即改變外形；`ControlType` 沒有專屬的 path 旗標）。**注意實際入口不只 dblClick** — 純 `<path>` 是在 `mouseUp` 裡「已選取狀態下再點一次且未移動」→ `pathActions.select()` 進入 pathedit，兩處都已補。
- ✅ **`case 'pick'` 沒有 `checkSelectable` / `isElemLocked`**（#72 後半）：補上與其他選取路徑相同的判斷。
- 🔎 已確認安全：多選時 `getOverrideValue` 對 temp group 在 template/explore 直接回 `{}`（全鎖），所以聚合不會漏鎖。

新增共用 helper `isControlEditable(elem, control)`：只有 template modes 執行鎖，且直接讀元素而非 `useSelectedElementStore`（雙擊的目標可能還不是當前選取）。
>
> 已標記安全：**#70**、**#75**、**#77**、**#78**。
>
> 忽略：**#60**（先不修）、**#69**、**#79**。
>
> **#72 的前提有誤，已查證**：`mouseDown` 是直接掛在 `container.addEventListener('mousedown', ...)` 的 async function，DOM 不會等它的 promise（touch 路徑的 `onMouseDown` 也宣告成 `(e: Event) => void`）。函式一碰到 `await` 就把控制權交回 event loop，**mousemove / mouseup 期間照常派送**，所以「拿掉 await」在行為上等價，不修正任何東西（兩種寫法在 `addContentFromCanvas` reject 時也同樣會變成 unhandled rejection，除非另外掛 `.catch`）。維持現狀。
> 該條**剩下的另一半已修正**（此段先前停在舊狀態）：`case 'pick'` 現在與其他選取路徑用完全相同的三項把關，且必須同時成立 —— 目標圖層存在 && `checkSelectable(layer)`（未隱藏 / 未鎖定 / opacity ≠ 0）&& `!isElemLocked(elem)`，鎖定或隱藏圖層上的元素無法被挑進內容庫。

> 本輪修正：**不可移動時不顯示對齊線**。新增 module 級 `getMovableAxes(elem)`（template modes 才鎖；`line` 需兩端點都自由才算該軸可動），取代 `mouseMove` 裡兩處重複的 editableInfo 判斷（位置 clamp 與 `case 'select'` 的 `dx/dy = 0`）。在此之上：兩軸皆鎖時整段跳過 `getMatchedDiffFromBBox`（它畫對齊線是副作用，元素根本無法跟隨提案）；只鎖單軸時把 `movableAxes` 傳進 `getMatchedDiffFromBBox`，在 `matchPoints` 算完後把該軸的 `nearest`/`farthest` 清成 `null` → 該軸不吸附也不畫線。
>
> **#71**（已修正）：grip 掛在**未旋轉**的 bbox 上（`applyDimensions` 之後才把整個 selector group 轉 `angle`），所以端點歸屬要在同一個座標系判斷。改為先用 `svgedit.math.getMatrix(elem)` 把 `(x1,y1)`/`(x2,y2)` 轉到使用者座標，再把兩點差向量旋轉 `-angle`，以旋轉後的 `localDiffX/localDiffY` 正負決定左右／上下。原本直接比 `x1 > x2`，在 transform 帶旋轉或鏡射時會標錯邊。

> **#73**（已處理）：先查證原始描述——「等比與 fit-text 約束被繞過」對現況**不成立**：中心縮放的覆寫在前，`if (!isFreeResize) { sx/sy 對齊 }` 在後，fit text 的單方向縮放則根本不走這條 transform（走 `setFitTextBBox`，該分支自己有中心錨定處理）。三者實際上是**分層**的，只是順序隱晦、且驅動軸的判斷脆弱。
> 因此改為：(1) 在中心錨定區塊上方寫清楚三條規則的套用順序與各自的成立條件；(2) 把等比的驅動軸判斷從 `sx === 1` 改成 `dx === 0 || !width`——中心錨定會重寫 `sx`，被錨定的軸在拖曳中途完全可能剛好落在 scale 1，用 `sx === 1` 猜「哪一軸沒在動」並不可靠。新條件在既有情境下與舊寫法等價（含 `width === 0` 時交給 y 驅動），但不再依賴浮點巧合。共用（可能加倍的）scale 係數正是維持等比的正確做法，各軸仍各自使用自己的錨點。

（批次 4 已無待處理項目。）

---

## 批次 5：ObjectPanel 重寫 / ConfigPanel / LibraryPanel / TemplateConfig

> 本輪修正：**#86**（已修正 — `setEditable` 改用帶 `controllableTypes` 的 `getEditableInfo`，鍵集合與 `getDerivedData` 一致）、**#87**（移除 `LibraryType` enum 與 `ContentLibraryManager.type` 成員，改在使用點直接由 owner 判斷：`manager.addContentFromCanvas` 用 `owner.tagName === 'image'` 的區域快照，`ContentSection` 用 `useMemo(() => owner.tagName === 'image', [owner])` → 不再有「render 時讀到前一個元素的 type」的時序問題）、**#88**（`over/active.data.current` 加 `?.` 並以 `?? 0` 收尾；缺值時方向前後無差別，已加註解）、**#89**（`ContentSection` unmount 時的 useEffect cleanup：若當下仍是 `'pick'` 就切回 `'select'`）、**#93**（中文註解改英文，且 `restrictToParent` 搬到共用的 `@core/helpers/dnd/restrictToParent`，`ContentSection` 與 `FileThumbnail/ThumbnailList` 皆改 import — 同時解掉 **#42** 的反向依賴）、**#94**（已修正 — `TemplateConfig.tsx` 桌面／平板 JSX 重複與 `// TODO: desktop UI` 已不存在）。
>
> 已標記安全：**#90**（`WhiteInkCheckbox` 屬 dev 模式功能，平板/彈窗 UI 移除為可接受）、**#91**、**#92**、**#96**（外部會在語言改變時整段重新 render，module 級 `i18n.lang` 目前安全）。

### 🟡 中
- **#85** `PopupItem` 在 render 期間做 `document.querySelector`（`common/ObjectPanelItem.tsx`）。render 應 pure；首次 render 對應 ButtonItem 可能未進 DOM → reference 為 null → 浮動彈窗定位失準。（與 #80 的 state 設計相關，該 state 為刻意保留。）

### 🟢 低
- **#95** `ContentSection` / `ThumbnailList` 只註冊 Pointer/Touch sensor，未加 `KeyboardSensor`。（與 #41 同類的無障礙缺口，仍待處理。）

---

## 批次 6 & 7：LayerPanel / ElementList / RWD 與跨檔案掃描

### 🔴 高
- **#97** 刪除 `RightPanel/ObjectPanelItem.tsx` 與其 `__mocks__`，造成 **10 個既有 spec 無法執行**（`Cannot find module '../ObjectPanelItem'`，實測確認），CI `pnpm test` 會紅：
  `ConfigPanel/{Multipass,Speed}Block`、`DimensionPanel/{DimensionPanel,FlipButtons,PositionInput,RatioLock,Rotation,SizeInput}`、`OptionsBlocks/{Polygon,Rect}Options`。
  另有 2 個孤兒 snapshot（`RightPanel/__snapshots__/ObjectPanelItem.spec.tsx.snap`、`OptionsBlocks/__snapshots__/VariableTextBlock.spec.tsx.snap`）。
  **合併前應處理**：mock 路徑改指 `common/ObjectPanelItem`，刪 2 個孤兒 snapshot。
- **#98 🩹** 大量新增檔案缺測試。**已部分處理**：新增 `editable/base.spec.ts`（鎖住 ControlType 數值）+ 9 個高風險檔的 `【TODO：add tests】` 標註；其餘仍待補。
- **#100 🩹** `useLayerChildElements` 把 `version` 放進 MutationObserver effect deps → observer 全量重建。**已部分處理**：#101 的動態 quietPeriod 分桶避免每 tick 重建 funnel；但 version 仍在 effect deps，屬刻意的強制更新手段（用於捕捉新 temp group）。#56 已把 temp group 掃描收斂成 per-layer，單次 recompute 成本下降；「只重建變動部分」的完整增量重構仍待處理。
- **#101**（已處理 — 改為依物件數量動態調整 `minQuietPeriodMs`；「只重算變動部分」的完整增量重構暫緩，見 #100）

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
