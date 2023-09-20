import { IChangeLog } from 'interfaces/IChangeLog';

// 2.1.2-beta
const CHANGES_TW = {
  added: [
    '新增 MacOS 版本提示。',
  ],
  fixed: [
    '修正相機預覽時第一次點擊畫面沒有進行預覽。',
    '修正在畫面最左方進行相機預覽時，會有預覽誤差。',
    '修正雕刻檔案時間變長問題。',
    '修正合併文字路徑問題。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added the MacOS version prompt.',
  ],
  fixed: [
    'Fixed the preview error when previewing the first time.',
    'Fixed the preview error when previewing the left side of the screen.',
    'Fixed the engraving file time issue.',
    'Fixed the merge text path issue.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
