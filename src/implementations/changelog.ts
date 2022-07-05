import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正依顏色讀取 svg 檔時顏色與原始有些為出入。',
  ],
  changed: [
    '變更一些日文翻譯。',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed minor color change when loading file divded layer by color.',
  ],
  changed: [
    'Changed some Japanese translations.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
