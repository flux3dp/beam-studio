import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.8 beta
const CHANGES_TW = {
  added: [
    '新增 鑰匙圈生成器。',
    '新增 HEXA RF 各 DPI 預設參數。',
    '新增 beamo II 預噴次數設定。',
    '新增 Promark 設定機器時相機校正。',
    '新增 Ador 進階相機校正。',
    '新增 支援貼上剪貼簿中的 DXF 文字。',
    '新增 自動對位功能中可以去背或重新拍照。',
  ],
  changed: ['調整 無法啟動相機預覽時對話窗。', '在首頁時停用上方校正選單。'],
  fixed: [
    '修正 Promark 相機校正時，有時會選擇錯相機的問題。',
    '修正 beamo II 有時無法啟動預覽的問題。',
    '修正 beamo II 局部預覽時預覽誤差問題。',
    '修正 beamo II 開啟自動曝光時的預覽問題。',
    '修正 圖層顏色設定未使用正確名稱的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Keychain Generator.',
    'Added Promark camera calibration when setting up the machine.',
    'Added Ador camera calibration (advanced).',
    'Added support for importing DXF text pasted from the clipboard.',
    'Added background remove and retake for Auto Fit.',
  ],
  changed: ['Updated the camera preview setup error dialog.', 'Disabled the calibration menu on non-editor pages.'],
  fixed: [
    'Fixed Promark camera calibration sometimes selecting the wrong camera.',
    'Fixed an issue where layer color config did not use the correct name.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
