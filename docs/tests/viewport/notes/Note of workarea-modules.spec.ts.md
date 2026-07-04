# Note of workarea-modules.spec.ts

## 對應測試表項目
- Viewport 分類的工作範圍相關列：各機型切換後畫布工作範圍更新。
  - 「工作範圍…Ador 列印工作範圍 430x270」
  - 「Ador 20w 雷射工作範圍 430x290」
  - 「Ador 10w 雷射工作範圍 430x300」
  - 「Ador 2w 雷射工作範圍 430x282」
- Preference 分類的「機型識別 — 從 Ador 調整為雷射機器，跳出 work area 的提醒 pop-up」。
- 機器設定分類的各機型畫布切換列（beamo 300x210、beambox 400x375、hexa 740x410、beamboxII 600x375）。

本檔同時橫跨機器設定與 Preference 兩個分類，屬跨分類覆蓋的 spec。

## 測試了什麼
- `working area of {beamo/Beambox/HEXA/Beambox II/Ador}`：切換各機型後，`#svgcontent` 的 `viewBox` 等於該機型畫布尺寸（beamo 3000x2100、Beambox 4000x3750、HEXA 7400x4100、BB2 6000x3750、Ador 4300x3200）。
- `Ador canvas workarea stays 4300x3200 for {10W/20W/Printing/2W} module`：切到 Ador 後逐一切換各雷射模組，確認模組選單顯示正確，且畫布 viewBox 維持 4300x3200。
- `warns before converting layers when changing workarea with content`：在 Ador 加列印模組並畫一個矩形後切到 beamo，跳出「Do you want to convert the Printing Layers into Laser Layers?」警告，確認後畫布切換為 beamo（3000x2100）。

## 設計理由
- 斷言 `viewBox` 加模組標籤，而非各模組的實體邊界路徑。Ador 畫布尺寸由 `workarea-constants.ts` 的 `displayHeight` 決定（320mm 對應 3200px），對所有雷射模組固定不變；各模組的實體切割高度（270、290、300、282mm）是另一條 `#boundary-path` 疊加層，在預設開啟 `use-union-boundary` 偏好時，邊界取多模組聯集，屬非確定性數值，不適合直接斷言。
- 模組切換透過選單點選（切列印模組需轉圖層時自動按確認），避免依賴疊加層幾何。
- 機型識別改用「列印圖層轉換警告」pop-up 作為可斷言的 work-area 提醒，同時斷言警告訊息文字與切換後的 viewBox。

## 充分性分析
- 對機型畫布尺寸與轉換警告的覆蓋充分，兩者皆有確定性斷言。
- 對 Ador 四組實體邊界數字只做部分釘住：本 spec 並未直接驗證 430x270、290、300、282 這四個實體邊界數字，只驗證選到對應模組且共用畫布維持 4300x3200。實體邊界數字屬於 `#boundary-path` 疊加層，在 union-boundary 預設下屬非確定性，該層本身未被斷言。
- 判斷：可接受。E2E 層負責「切換模組不會破壞畫布與選單狀態」；實體邊界數字的正確性應由邊界計算的 Jest 單元測試負責，或列入實機與人工檢查。目前這四個數字缺乏任何自動化直接覆蓋，屬已知缺口。

## 本次改進
無，經檢視後判斷現有測試已足夠。（實體邊界數字的缺口屬於另一測試層，非本 spec 的責任，且在 union-boundary 預設下無法穩定斷言，因此不強行加入非確定性斷言。）

## 待確認問題（Open Questions）
- 是否應讓各模組的邊界疊加層變為確定性（屬產品面調整），以便直接斷言 270、290、300、282？
- `use-union-boundary` 預設開啟是否為刻意設計？若是，邊界數字驗證只有在關閉該偏好後才有意義。
- 若要覆蓋四個實體高度，較合適的層是邊界計算的 Jest 單元測試而非 E2E，是否要新增？
