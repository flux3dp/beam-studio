import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.2 beta
const CHANGES_TW = {
  added: [
    '新增 支援夾爪旋轉軸套件 (需搭配韌體 4.3.5 / 5.3.5 或以上版本)。',
    '新增「旋轉軸設定」於上層選單的編輯列表中。',
    '新增 點陣圖的「梯形變形」功能。',
    '新增「工具」列表於上層選單。',
    '新增 材質測試生成器到工具列表。',
  ],
  fixed: [
    '修正「選擇機器」視窗開啟一段時間時會跳出 #801 錯誤。',
    '修正 Ador 模組頭錯誤時的終止工作',
  ],
  changed: [
    '匯入 SVG 時，記住上一次選擇的選項。',
    '將 QR 碼產生器和 Boxgen 移動到工具列表。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added support for Rotary Chuck (requires firmware version 4.3.5 / 5.3.5 or above).',
    'Added “Rotary Setup” to the edit menu in the top bar.',
    'Added “Rotary Warped” feature for bitmap image.',
    'Added tool menu to the top bar.',
    'Added material test generator to the tool menu.'
  ],
  fixed: [
    'Fixed #801 error that occurred when the select machine window was open for an extended period.',
  ],
  changed: [
    'Retain previously selected options when importing SVG files.',
    'Moved QR code generator and Boxgen to the tool menu.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
