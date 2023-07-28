import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增圖片 AI 去背功能（需登入後使用）。',
  ],
  fixed: [
    '修正 Windows 工具列機器列表需重新整理才會更新。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added AI background removal function for image (need to login to use).',
  ],
  fixed: [
    'Fixed Windows toolbar machine list need to refresh to update.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
