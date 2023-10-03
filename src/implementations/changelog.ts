import { IChangeLog } from 'interfaces/IChangeLog';

// 2.1.3-beta
const CHANGES_TW = {
  added: [
    '新增「合併文字」功能 Icon。',
    '新增左側形狀面板',
    '新增視窗響應式設計。',
  ],
  fixed: [
    '修正開啟開蓋模式時高解析度下工作範圍錯誤。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added icon for "Weld Text".',
    'Added shape panel in left panel.',
    'Added responsive design for window size.',
  ],
  fixed: [
    'Fixed working area issue when "Open Bottom" turned on with dpi greater than 500.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
