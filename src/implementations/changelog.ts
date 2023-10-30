import { IChangeLog } from 'interfaces/IChangeLog';

// 2.1.5-alpha
const CHANGES_TW = {
  added: [
    '新增輸出工作至 v3.2.6 版本以前機器時的更新提示。',
  ],
  fixed: [
    '修正輸出旋轉過後的群組時發生的 #806 錯誤。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added update notification when exporting to machine version before v3.2.6.',
  ],
  fixed: [
    'Fixed Error #806 when exporting rotated group.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
