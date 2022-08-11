import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正部分圖檔無法輸出工作問題',
    '修正工作預覽中途開始功能的多餘 FCode 行數',
  ],
  changed: [
    '加高圖層面板寬度。',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed some files cannot export task.',
    'Fixed redundant lines in FCode of start here button in path preview.',
  ],
  changed: [
    'Change the height of layer list panel.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
