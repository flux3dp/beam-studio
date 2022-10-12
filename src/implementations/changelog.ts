import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增左側面板 Design Market 連結',
  ],
  fixed: [
    '修正讀取場景時鎖定圖層沒有被正確讀取。',
  ],
  changed: [
    '調整 HEXA 雷射參數。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Design Market link in left panel.',
  ],
  fixed: [
    'Fixed locked layers are not loaded correctly.',
  ],
  changed: [
    'Update presets for HEXA.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
