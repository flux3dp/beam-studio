import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正 Windows 版本顯示問題。',
    '修正 MacOS 右鍵選單有時沒出現的問題。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed some Windows version display bug.',
    'Fixed some MacOS context menu behavior.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
