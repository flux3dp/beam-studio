import { IChangeLog } from 'interfaces/IChangeLog';

// 2.1.4-alpha
const CHANGES_TW = {
  added: [
    '新增「選擇機器」視窗。',
  ],
  fixed: [
    '修正外框預覽連線錯誤時對話框不會關閉。',
  ],
  changed: [
    '調整右側面板畫面樣式。',
  ],
};

const CHANGES_EN = {
  added: [
    'Add "Select Machine" modal.',
  ],
  fixed: [
    'Fixed framing issue when connection failed.',
  ],
  changed: [
    'Update Right Panel UI.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
