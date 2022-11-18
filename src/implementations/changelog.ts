import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增法文',
    '新增荷蘭文',
  ],
  fixed: [
    '修正匯入的 SVG 檔案複製後無法顯示問題。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added Français',
    'Added Nederlands',
  ],
  fixed: [
    'Fixed image displaying issue after copying and pasting imported SVG objects.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
