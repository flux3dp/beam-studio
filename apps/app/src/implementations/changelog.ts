import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.7 beta
const CHANGES_TW = {
  added: ['新增 HEXA RF 各 DPI 預設參數。', '新增 支援貼上剪貼簿中的 DXF 文字。', '新增 Ador 進階相機校正。'],
  changed: ['在首頁時停用校正選單。', '調整 Beambox II 以及 HEXA RF 的進階相機校正拍攝校正圖案步驟。'],
  fixed: [
    '修正 beamo II 局部預覽時預覽誤差問題。',
    '修正 beamo II 開啟自動曝光時的預覽問題。',
    '修正 圖層顏色設定未使用正確名稱的問題。',
    '修正 Promark 相機校正時，有時會選擇錯相機的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added support for importing DXF text pasted from the clipboard.',
    'Added Ador camera calibration (advanced).',
  ],
  changed: [
    'Disabled the calibration menu on non-editor pages.',
    'Updated the calibration pattern capture steps for Beambox II.',
  ],
  fixed: ['Fixed an issue where layer color config did not use the correct name.'],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
