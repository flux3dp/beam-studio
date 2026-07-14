# Bug（潛在）：Web 字型的畫面顯示與轉路徑結果來自不同字型檔，寬度系統性相差約 2.5%

- **狀態**：已釐清，待字源更新（需產品/前端決定是否統一字源；見下方澄清與第六～八節）
- **嚴重性**：**低～中**（原評「高」已下修）— 畫面 vs 實際雕出的**真實可見差異只有 ~0.6%**，且僅因 S3 是舊字檔（詳見下方⚠️澄清）。原本以為的「約 2.5%」大部分是測試量錯框（選取框 vs 墨跡框）的假象。另註：先前並列的「複製後轉路徑偏差更大」經查**不成立**（見 docs/tests/bugs/複製貼上後轉路徑結果偏窄且右移.md，同字串直接轉 vs 貼上轉的 path `d` 逐字元相同）
- **相關檔案**：字型顯示載入（`fonts.googleapis.com` 的 `<link>`）；轉路徑的字型來源（fontkit 讀取 `beam-studio-web.s3...` 上的 `<postscriptName>.ttf`）

## 問題描述

畫面上的文字以 Google Fonts 服務的字型渲染，但「轉路徑」時 fontkit 讀取的是 FLUX 自家 S3 上的 TTF 檔。同一字型家族、不同建置版本，導致轉出的路徑與畫面顯示有**穩定重現的寬度差**：

- Noto Sans：顯示寬 761 units vs 轉換後 742 units（約 0.975 倍）
- Fira Sans：顯示寬 665 units vs 轉換後 649 units（約 0.975 倍）

比例在兩個字型上一致（約 2.5%），屬系統性差異而非個別字元錯誤。

> ### ⚠️ 重要澄清（2026-07-07 更新）：這個「2.5%」大部分不是使用者看得到的差異
>
> 標題的「約 2.5%」是測試把 `<text>.getBBox()` 拿去比 `<path>.getBBox()` 得到的，但這兩個量的**不是同一種框**。以 Noto Sans `Web123`（font-size 200）為例：
>
> | 量測對象 | 寬度 | 這是什麼 |
> |---|---|---|
> | 畫布 `<text>.getBBox()` | **760.99** | **選取框**＝advance 寬（含首末字左右邊距） |
> | 畫布上實際看到的字形墨跡（Google build） | ~**747.2** | 你眼睛看到的筆畫 |
> | 轉出 `<path>`／gcode 墨跡 — **現況（S3 build）** | **742.4** | 實際會被雕出來的 |
> | 轉出 `<path>`／gcode 墨跡 — **若字源統一（Google build）** | ~**747.2** | — |
>
> 所以「畫面所見 vs 實際雕出」：
> - **現況只差 ~0.6%**（747.2 → 742.4），來自 S3 舊 build（數字偏窄）＋ S3 輪廓被擺在 Google 度量的位置這個混合。這是**真的**「雕出 ≠ 預覽」的小差異。
> - **統一字源後**：雕出墨跡 747.2 ＝ 畫面墨跡 747.2，**看不出差別**。
> - 測試回報的 0.9755 是拿 742.4 去比 **760.99（選取框）**——其中 ~1.8% 是「墨跡框 vs advance 框」的**量測基準差異**，**單一字檔下也一定存在**，使用者不會看到、也不影響雕刻。
>
> 一句話：**畫面與 gcode 目前確實有差，但只有 ~0.6%（且僅因 S3 舊字檔）；修好字源後就一致。** 其餘的「2.5%」是測試量錯框，不是可見誤差。詳見下方第六、七節。

## 重現條件

1. 建立文字並套用 Noto Sans（或 Fira Sans 等 Google web 字型）。
2. 記下文字的 bbox 寬度。
3. 轉路徑，量測轉出 path 的 bbox 寬度。
4. 兩者相差約 2.5%（`text-to-path-web-font.spec.ts` 開發過程中多次量測穩定重現；spec 檔頭有記錄）。

## 測試層的處置

`right-panel/text-to-path-web-font.spec.ts` 以「釘住已知比例」方式處理：直接轉換的 path/text 寬度比必須落在 [0.97, 1.005]（0.975 已知比例 ±0.5%）。任何進一步漂移或疊加的新回歸都會立即失敗。**修復後**此斷言會失敗，屆時把區間改為 [0.99, 1.01]。

## 待產品確認

- 是否接受此差異（多數雕刻場景無感），或應讓顯示與轉換使用同一份字型檔（例如顯示也改用 S3 TTF，或轉換改抓 Google 同版本）？
- 對照組：本機字型（非 web 字型）的顯示與轉換是否同源？若同源，差異僅限 web 字型，影響面更小。

---

## 驗證記錄（2026-07-07）

### 一、轉路徑引擎確認：**2.0（fontkit，前端本地轉換）**

判定關鍵在 `packages/core/src/web/app/actions/beambox/font-funcs.ts:710`：

```ts
let preferGhost = !pathPerChar && globalPreference['font-convert'] === '1.0';
```

- 預設偏好 `font-convert` = `'2.0'`（`packages/core/src/web/app/actions/beambox/beambox-preference.ts:42`）。
- 從右側面板按「轉路徑」(`#to_path`) 時 `pathPerChar = false`。
- 文字為 LTR（`Web123` 等拉丁字），未觸發「rtl 改走 ghost」的例外分支（`font-funcs.ts:712-723`）。

→ `preferGhost = false`，故執行順序為（`font-funcs.ts:746-748`）：

```ts
res = convertTextToPathByFontkit(textElement, fontObj, pathPerChar)
   || (await convertTextToPathByGhost(textElement, isFilled, font));
```

fontkit 對 Noto Sans / Fira Sans 都有字形、會成功回傳，**不會**落到 ghost。因此本 bug 場景的 path 一律由 **fontkit 2.0** 產生。
（只有在 `font-convert` 被改成 `'1.0'`、或 fontkit 取不到字檔回 `null` 時，才會改由 FLUXGhost / fluxsvg 1.0 後端產生，屆時對照基準會不同。）

### 二、為何是「系統性 2.5%」：2.0 路徑上顯示字檔 ≠ 轉換字檔

- **顯示**：Google Fonts 的 `<link>`（webFonts）→ 瀏覽器以 Google build 排版。
- **轉換**：`getFontObj`（`font-funcs.ts:169`）→ fontkit 讀 `https://beam-studio-web.s3.ap-northeast-1.amazonaws.com/fonts/<postscriptName>.ttf`（`packages/core/src/web/helpers/fonts/fontHelper.ts:229,252`）。
- fontkit 分支產生 `d` 的方式是**混合**（`font-funcs.ts:325-362`）：每個字的**起始座標 x/y 取自 DOM** `tspan.getStartPositionOfChar(i)`（用的是**顯示字型＝Google build** 的排版度量），但**字形輪廓與 `unitsPerEm` 縮放取自 S3 TTF build**（`char.path.scale(sizeRatio,…).translate(x,y)`，`sizeRatio = fontSize / fontObj.unitsPerEm`）。兩個 build 的字寬 / unitsPerEm 只要不同，最後一字右緣就位移，整串呈系統性 ≈0.975。

**結論：這不是轉換數學的錯，而是 2.0 引擎「顯示字檔 ≠ 轉換字檔」的來源不一致。** 屬產品決策題（是否統一字源），非引擎 bug。若切到 1.0（ghost/fluxsvg 後端自有字檔）此差異的來源與數值都會改變。

### 三、詳細操作 → 對應程式碼

| 步驟 | 操作 | 進入的程式碼 |
|---|---|---|
| 1 | 工具列 Text → 畫布點擊 → 輸入 `Web123` | 建立 `<text id=svg_1>` |
| 2 | 字型下拉選 Noto Sans / Fira Sans | `renderTextOptions` 設 `font-family:'Noto Sans'`；顯示走 Google `<link>` |
| 3 | 右側面板「轉路徑」`#to_path` | `convertToPath.ts convertTextToPath` → `fontFuncs.convertTextToPath`（`font-funcs.ts:644`）→ `convertTextToPathByFontkit`（`font-funcs.ts:223`） |
| 4 | 結果 | `<text id=svg_1>` 被 `<path id=svg_2>` 取代 |

### 四、已實測結果（bbox；來源：`text-to-path-web-font.spec.ts` 開發量測，跨執行穩定）

| 字型 | 顯示 text 寬 | 轉出 path 寬 | 比值 |
|---|---|---|---|
| Noto Sans | 761 | 742 | 0.975 |
| Fira Sans | 665 | 649 | 0.976 |

### 五、現場實測（本機 FLUXGhost rig，2026-07-07；跨執行確定性）

| 字型 | 顯示 text 寬 | 轉出 path 寬 | 比值 |
|---|---|---|---|
| Noto Sans（`Web123`） | 760.99 | 742.36 | **0.9755** |
| Fira Sans（`Web123`） | 665.39 | 649.37 | **0.9759** |

轉出 path `d` 為 fontkit 產生的真實輪廓（Noto 開頭 `M664.11,519.39L645.94,519.39L618.11,425.84Q…`）；
gcode 為 FLUXGhost/beamify 對填色 path 的 raster 掃描（G90 絕對 mm、`G1V0`/`G1S0` 雷射開關旗標）。
（擷取用的臨時 spec 與輸出檔已於調查後移除。）

### 六、根因：直接比對兩份字檔 + A/B 實驗

**(a) 直接用 fontkit 讀兩份 Noto Sans TTF 比對（同一 `Web123`）：**

| 來源 | postscriptName | unitsPerEm | 字形數 | 版本 |
|---|---|---|---|---|
| **S3**（轉換用） | NotoSans | 2048 | 3034 | **Version 1.04**（2012 Monotype Imaging build） |
| **Google gstatic v42**（顯示用） | NotoSans-Regular | 1000 | 3836 | **Version 2.015**（現行 Google build） |

兩者是**完全不同的建置版本**。逐字比對 advance（normalize 到 em）：字母 `W`/`e`/`b` 幾乎相同（比值≈1.000），但**數字 `1`/`2`/`3` 的 S3 advance 比 Google 窄約 3.7%**（0.55078 vs 0.572 em）。`Web123` 含 3 個數字 → 整串 advance 比值 S3/Google = **0.9835**。

**(b) A/B 實驗：把 Noto Sans 的「轉換字源」暫時改抓 Google gstatic v42 TTF，於 rig 實測：**

| 轉換字源 | 轉出 path 寬 | path/text 比值 |
|---|---|---|
| S3（v1.04，現況） | 742.36 | **0.9755** |
| Google（v2.015，與顯示同源） | 747.16 | **0.9818** |

→ 統一字源把差異從 2.45% 收斂到 **1.82%**，即**字檔版本不一致實際只佔約 0.6%**。

**(c) 剩下的 ~1.8% 不是字型 bug，是「量測基準」的差異：**
- 用 Google build 轉出的 path 寬 747.16 ≈ 該 build 的**字形墨跡(ink)寬** 747.20；
- 顯示 `<text>` 的 bbox 寬 760.99 ≈ 該 build 的 **advance 寬** 761.00。
- 即 `<text>.getBBox()` 量的是 **advance/字框**（含首末字左右邊距），而轉出 `<path>.getBBox()` 量的是**緊貼墨跡**。同一字檔下，**雕刻出來的墨跡與畫面字形的墨跡完全一致**，只有「外框盒」這個量測值不同（水平方向與 spec 已註明的垂直方向同理）。

### 七、結論（重新定性，比原判定更輕）

- 原「約 2.5%」可拆成：**~0.6% 真實字源不一致**（S3 是舊 Monotype v1.04，數字偏窄）＋ **~1.8% ink-bbox vs advance-bbox 的量測假象**（單一字檔下也會有，實際雕刻墨跡不受影響）。
- **修法（針對那 0.6%）**：`getFontObj` 對 `source:'google'` 且帶 `binaryLoader` 的字型會走 `loadGoogleFont`（抓與顯示同源的 Google 二進位，`font-funcs.util.ts:7`）；但**內建的 Noto/Fira web 字型沒有這兩者**，故落到 `loadWebFont` → S3 舊 build（`font-funcs.util.ts:79-92`、`font-funcs.ts:196-199`）。把這批內建字改走 Google 二進位、或把 S3 上的檔案換成與顯示相同的建置版本，即可消掉這 0.6%。
- **測試處置**：修好字源後 `text-to-path-web-font.spec.ts` 的 `KNOWN_FONT_SOURCE_RATIO_*`（釘 0.975）會失敗，這是預期的觸發器；屆時改帶 [0.98, 1.0]（保留 ~1.8% 的 ink/advance 固有差），不要期待到 1.0。
- 若切 `font-convert='1.0'`（ghost/fluxsvg 後端），對照基準與數值都會再變。

### 八、全部「Google 顯示 + S3 轉換」字型的字檔版本比對（58 個內建字，2026-07-07）

**範圍**：`webFonts.google.ts` 內所有帶 `queryString` 的家族——這些**顯示走 Google css2、轉換走 S3**（皆 `WebFont`、無 `binaryLoader`，故 `getFontObj` 一律落到 `loadWebFont`→S3）。取每家族 Regular(400) 代表。

**方法**：各抓 S3 TTF（`beam-studio-web.s3…/fonts/<檔名>`）與 Google gstatic Regular TTF（css2 帶舊 UA 取 TTF），用 fontkit 比對 `name.version`、`unitsPerEm`，與 Latin 樣本 `AaGgMmWwEeRr0123456789` 的 advance 總和比值（S3/Google，已 normalize 到 em）。

**判定欄**：
- **⚠️ 寬度差**：版本不同 **且** Latin advance 比偏離 1.0 超過 0.5%——轉出寬度會與顯示明顯不符（本 bug 的實際受害者）。
- **🔸 版本落後**：S3 是較舊建置版本，但 Latin advance 與 Google 一致（比值≈1.000）。拉丁寬度目前無感，但字形外形/hinting/其他字符（尤其 CJK 漢字、標點）**可能仍不同**，屬「該更新但非急」。
- **✅ 一致**：版本相同，無需處理。

**統計**：⚠️ 寬度差 **6**、🔸 版本落後 **27**、✅ 一致 **25**（共 58）。

> 注意：本表的 Latin advance 比只反映**拉丁字母/數字**。CJK 家族（Noto Sans/Serif TC…、思源、ZCOOL…）的漢字寬度差本表未量測；版本不同者其漢字仍可能有差異。另外，即使某字「✅ 一致」，顯示 vs 轉出的 bbox 仍有第七節所述 **~1.8% 的 ink/advance 量測固有差**（與字檔無關）。

| # | Family | S3 檔 | S3 版本 | Google 版本 | upm S3/G | Latin adv 比(S3/G) | 判定 |
|---|---|---|---|---|---|---|---|
| 1 | Noto Sans | `NotoSans-Regular.ttf` | 1.04 | 2.015 | 2048/1000 | 0.9849 | ⚠️ 寬度差 |
| 2 | Sawarabi mincho | `SawarabiMincho-Regular.ttf` | 1.00 | 1.082 | 1000/1000 | 1.0130 | ⚠️ 寬度差 |
| 3 | Noto Serif JP | `NotoSerifJP-Regular.otf` | 1.001 | 2.003-H1 | 1000/1000 | 0.9915 | ⚠️ 寬度差 |
| 4 | Noto Serif KR | `NotoSerifKR-Regular.otf` | 1.001 | 2.003-H1 | 1000/1000 | 0.9915 | ⚠️ 寬度差 |
| 5 | Noto Serif SC | `NotoSerifSC-Regular.otf` | 1.001 | 2.003-H1 | 1000/1000 | 0.9915 | ⚠️ 寬度差 |
| 6 | Noto Serif TC | `NotoSerifTC-Regular.otf` | 1.001 | 2.003-H1 | 1000/1000 | 0.9915 | ⚠️ 寬度差 |
| 7 | Oswald | `Oswald-Regular.ttf` | 4.100 | 4.103 | 1000/1000 | 1.0027 | 🔸 版本落後 |
| 8 | Open Sans | `OpenSans-Regular.ttf` | 1.10 | 3.003 | 2048/2048 | 1.0015 | 🔸 版本落後 |
| 9 | roboto | `Roboto-Regular.ttf` | 2.137 | 3.015 | 2048/2048 | 0.9995 | 🔸 版本落後 |
| 10 | Noto Sans HK | `NotoSansHK-Regular.otf` | 2.002 | 2.004-H2 | 1000/1000 | 0.9999 | 🔸 版本落後 |
| 11 | Noto Sans JP | `NotoSansJP-Regular.otf` | 2.002 | 2.004-H2 | 1000/1000 | 0.9999 | 🔸 版本落後 |
| 12 | Noto Sans KR | `NotoSansKR-Regular.otf` | 2.002 | 2.004-H2 | 1000/1000 | 0.9999 | 🔸 版本落後 |
| 13 | Noto Sans SC | `NotoSansSC-Regular.otf` | 2.002 | 2.004-H2 | 1000/1000 | 0.9999 | 🔸 版本落後 |
| 14 | Noto Sans TC | `NotoSansTC-Regular.otf` | 2.002 | 2.004-H2 | 1000/1000 | 0.9999 | 🔸 版本落後 |
| 15 | Montserrat | `Montserrat-Regular.ttf` | 7.200 | 9.000 | 1000/1000 | 1.0001 | 🔸 版本落後 |
| 16 | Noto Serif | `NotoSerif-Regular.ttf` | 1.02 | 2.015 | 2048/1000 | 1.0000 | 🔸 版本落後 |
| 17 | arimo | `Arimo-Regular.ttf` | 1.33 | 1.341 | 2048/2048 | 1.0000 | 🔸 版本落後 |
| 18 | Dela Gothic One | `DelaGothicOne-Regular.ttf` | 1.003 | 1.005 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 19 | DotGothic16 | `DotGothic16-Regular.ttf` | 1.000 | 1.100 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 20 | josefin sans | `JosefinSans-Regular.ttf` | 2.000 | 2.001 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 21 | Kosugi | `Kosugi-Regular.ttf` | 1.01 | 4.002 | 1024/1024 | 1.0000 | 🔸 版本落後 |
| 22 | libre franklin | `LibreFranklin-Regular.ttf` | 2.000 | 3.000 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 23 | Liu Jian Mao Cao | `LiuJianMaoCao-Regular.ttf` | 1.001 | 1.003 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 24 | m plus 1p | `MPLUS1p-Regular.ttf` | 1.061 | 1.062 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 25 | Ma Shan Zheng | `MaShanZheng-Regular.ttf` | 2.001 | 2.002 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 26 | reggae One | `ReggaeOne-Regular.ttf` | 1.000 | 1.100 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 27 | rocknRoll One | `RocknRollOne-Regular.ttf` | 1.000 | 1.100 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 28 | Rubik | `Rubik-Regular.ttf` | 2.102 | 2.300 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 29 | Shippori Mincho | `ShipporiMincho-Regular.ttf` | 3.000 | 3.110 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 30 | Shippori Mincho B1 | `ShipporiMinchoB1-Regular.ttf` | 3.000 | 3.110 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 31 | STICK | `Stick-Regular.ttf` | 1.000 | 1.100 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 32 | Tinos | `Tinos-Regular.ttf` | 1.23 | 1.340 | 2048/2048 | 1.0000 | 🔸 版本落後 |
| 33 | ZCOOL kuaile | `ZCOOLKuaiLe-Regular.ttf` | 2.000 | 2.001 | 1000/1000 | 1.0000 | 🔸 版本落後 |
| 34 | arsenal | `Arsenal-Regular.ttf` | 2.000 | 2.000 | 1000/1000 | 1.0000 | ✅ 一致 |
| 35 | Comic Neue | `ComicNeue-Regular.ttf` | 2.003 | 2.003 | 1000/1000 | 1.0000 | ✅ 一致 |
| 36 | courier prime | `CourierPrime-Regular.ttf` | 3.018 | 3.018 | 2048/2048 | 1.0000 | ✅ 一致 |
| 37 | fira sans | `FiraSans-Regular.ttf` | 4.203 | 4.203 | 1000/1000 | 1.0000 | ✅ 一致 |
| 38 | hachi maru pop | `HachiMaruPop-Regular.ttf` | 1.300 | 1.300 | 1000/1000 | 1.0000 | ✅ 一致 |
| 39 | Kiwi Maru | `KiwiMaru-Regular.ttf` | 1.100 | 1.100 | 1000/1000 | 1.0000 | ✅ 一致 |
| 40 | Lato | `Lato-Regular.ttf` | 1.104 | 1.104 | 2000/2000 | 1.0000 | ✅ 一致 |
| 41 | lobster | `Lobster-Regular.ttf` | 2.100 | 2.100 | 1000/1000 | 1.0000 | ✅ 一致 |
| 42 | long cang | `LongCang-Regular.ttf` | 2.001 | 2.001 | 1000/1000 | 1.0000 | ✅ 一致 |
| 43 | M PLUS Rounded 1c | `MPLUSRounded1c-Regular.ttf` | 1.059.20150529 | 1.059.20150529 | 1000/1000 | 1.0000 | ✅ 一致 |
| 44 | New Tegomin | `NewTegomin-Regular.ttf` | 1.000 | 1.000 | 1000/1000 | 1.0000 | ✅ 一致 |
| 45 | Otomanopee One | `OtomanopeeOne-Regular.ttf` | 3.003 | 3.003 | 1000/1000 | 1.0000 | ✅ 一致 |
| 46 | pacifico | `Pacifico-Regular.ttf` | 3.001 | 3.001 | 1000/1000 | 1.0000 | ✅ 一致 |
| 47 | palette Mosaic | `PaletteMosaic-Regular.ttf` | 1.001 | 1.001 | 1000/1000 | 1.0000 | ✅ 一致 |
| 48 | poppins | `Poppins-Regular.ttf` | 4.004 | 4.004 | 1000/1000 | 1.0000 | ✅ 一致 |
| 49 | potta One | `PottaOne-Regular.ttf` | 1.000 | 1.000 | 1000/1000 | 1.0000 | ✅ 一致 |
| 50 | sawarabi Gothic | `SawarabiGothic-Regular.ttf` | 20141215 | 20141215 | 1000/1000 | 1.0000 | ✅ 一致 |
| 51 | Source Serif Pro | `SourceSerifPro-Regular.ttf` | 3.001 | 3.001 | 1000/1000 | 1.0000 | ✅ 一致 |
| 52 | train One | `TrainOne-Regular.ttf` | 1.100 | 1.100 | 1000/1000 | 1.0000 | ✅ 一致 |
| 53 | yomogi | `Yomogi-Regular.ttf` | 3.100 | 3.100 | 1000/1000 | 1.0000 | ✅ 一致 |
| 54 | Yusei Magic | `YuseiMagic-Regular.ttf` | 1.200 | 1.200 | 1000/1000 | 1.0000 | ✅ 一致 |
| 55 | ZCOOL QingKe HuangYou | `ZCOOLQingKeHuangYou-Regular.ttf` | 1.000 | 1.000 | 1000/1000 | 1.0000 | ✅ 一致 |
| 56 | ZCOOL xiaowei | `ZCOOLXiaoWei-Regular.ttf` | 1.000 | 1.000 | 1000/1000 | 1.0000 | ✅ 一致 |
| 57 | Zhi Mang Xing | `ZhiMangXing-Regular.ttf` | 2.001 | 2.001 | 1000/1000 | 1.0000 | ✅ 一致 |
| 58 | zilla Slab | `ZillaSlab-Regular.ttf` | 1.1 | 1.1 | 1000/1000 | 1.0000 | ✅ 一致 |

**優先處理**：⚠️ 那 6 個（Noto Sans 最常用，比值 0.9849；Sawarabi Mincho 1.0130；Noto Serif CJK 四款 0.9915）。修法同第七節——把這批內建字改走 Google 二進位（`loadGoogleFont`），或把 S3 檔換成與 Google 顯示相同的建置版本。
