import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.9 beta
const CHANGES_TW = {
  added: [
    '新增 鑰匙圈生成器。',
    '新增 機器保養檢查清單。',
    '新增 連線問題排除指南。',
    '新增 HEXA RF 各 DPI 預設參數。',
    '新增 beamo II 預噴次數設定。',
    '新增 beamo II 列印測試範例檔案。',
    '新增 Promark 設定機器時相機校正。',
    '新增 Ador 進階相機校正。',
    '新增 支援貼上剪貼簿中的 DXF 文字。',
    '新增 自動對位功能中可以去背或重新拍照。',
    '新增 Beambox II 與 HEXA RF 切換相機時的門蓋檢查提醒。',
  ],
  changed: [
    '調整 條碼 / QR Code 產生器介面。',
    '調整 無法啟動相機預覽時對話窗。',
    '提升 相機預覽啟動的穩定性。',
    '在首頁時停用上方校正選單。',
    '調整 Beambox II 以及 HEXA RF 的進階相機校正拍攝校正圖案步驟。',
    '調整 範例檔案選單順序。',
    '調整 錯誤訊息文字與說明中心連結。',
  ],
  fixed: [
    '修正 Promark 相機校正時，有時會選擇錯相機的問題。',
    '修正 Promark 機器按鈕觸發工作的問題。',
    '修正 Promark 自訂工作範圍時旋轉軸預設位置的問題。',
    '修正 beamo II 有時無法啟動預覽的問題。',
    '修正 beamo II 局部預覽時預覽誤差問題。',
    '修正 beamo II 開啟自動曝光時的預覽問題。',
    '修正 使用路徑計算加速時部分的物件輸出結果為空白的問題。',
    '修正 圖層顏色設定未使用正確名稱的問題。',
    '修正 圖層名稱包含特殊字元時顯示錯誤的問題。',
    '修正 工作錯誤訊息以及結束工作後仍跳出錯誤回報的問題。',
    '修正 左側工具列按鈕選取狀態的問題。',
    '修正 文字內容欄位剪下快捷鍵的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Keychain Generator.',
    'Added Maintenance Checklist.',
    'Added connection issue troubleshooting guide.',
    'Added beamo II printing test example file.',
    'Added Promark camera calibration when setting up the machine.',
    'Added Ador camera calibration (advanced).',
    'Added support for importing DXF text pasted from the clipboard.',
    'Added background remove and retake for Auto Fit.',
    'Added door check alert when switching cameras on Beambox II and HEXA RF.',
  ],
  changed: [
    'Updated the Barcode / QR Code Generator interface.',
    'Updated the camera preview setup error dialog.',
    'Improved camera preview setup stability.',
    'Disabled the calibration menu on non-editor pages.',
    'Updated the calibration pattern capture steps for Beambox II.',
    'Updated the order of example files in the menu.',
    'Updated error messages and Help Center links.',
  ],
  fixed: [
    'Fixed Promark camera calibration sometimes selecting the wrong camera.',
    'Fixed starting jobs with the Promark machine button.',
    'Fixed the default rotary axis position for custom work area dimensions on Promark.',
    'Fixed an issue where some objects could be exported as empty when path calculation acceleration was enabled.',
    'Fixed an issue where layer color config did not use the correct name.',
    'Fixed layer names with special characters being displayed incorrectly.',
    'Fixed work error messages and error reports appearing after a job was exited.',
    'Fixed the selected state of left panel tool buttons.',
    'Fixed the cut shortcut in the text content field.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
