import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增多邊形物件邊數設定的選項。',
    '關於 Bema Studio 面板新增開放原始碼資訊說明。',
  ],
  fixed: [
    '修正某些 DXF 物件路徑計算錯誤的問題。',
    '修正讀取部分 SVG 檔顯示錯誤。',
    '雷射參數列表新增參數圖示更正。',
  ],
  changed: [
    '文字縮放預設鎖定長寬比例。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added the Sides option for polygon objects.',
    'Added the information for the open-source software in the About Beam Studio.',
  ],
  fixed: [
    'Fixed some DXF file calculate path failed problems.',
    'Fixed some SVG files wrong display problems.',
    'Fixed the added icon in the Preset Manage panel.',
  ],
  changed: [
    'Freeze the scale ratio for the font objects by default.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
