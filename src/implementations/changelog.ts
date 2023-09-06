import { IChangeLog } from 'interfaces/IChangeLog';

// 2.1.1-beta
const CHANGES_TW = {
  added: [
    '新增圖片勾勒輪廓功能。',
    '新增合併文字功能。',
  ],
  fixed: [
    '修正對矩形進行布林操作時圓角會消失。',
    '修正調整文件設定模組後，圖層面板不會更新。',
    '修正直書文字選項沒有標題。',
  ],
  changed: [
    '更改讀取對話框形式。',
    '移除標題工具列的文字底線。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added image outline action.',
    'Added weld text action.',
  ],
  fixed: [
    'Fixed the rounded corner of the rectangle will disappear when boolean operation.',
    'Fixed the layer panel will not update after changing addons in the document settings.',
    'Fixed the vertical text option has no title.',
  ],
  changed: [
    'Changed the loading dialog.',
    'Changed some Japanese translations.',
    'Removed the underscores of the titlebar.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
