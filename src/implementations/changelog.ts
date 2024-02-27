import { IChangeLog } from 'interfaces/IChangeLog';

// 2.2.16-alpha
const CHANGES_TW = {
  added: [
    '新增 QR code generator',
    '新增 webp 檔案格式的匯入',
  ],
  fixed: [
    '修正 問卷回饋無法使用的問題。',
    '修正 部分無法 Undo 的操作行為。',
  ],
  changed: [
    '變更 CMYK 後展開為單色圖層後，不開放 「展開圖層」選項。',
    '變更 圖層被鎖定後，「鎖定」選項改為「解鎖」。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added QR code generator.',
    'Added support for importing webp file format.',
  ],
  fixed: [
    'Fixed the Feedback Questionnaire in the help menu.',
    'Fixe some undo operations.',
  ],
  changed: [
    'Changed the “Expand Layer” option to be disabled after expanding a full-color layer.',
    'Changed the option to “Unlock” after layer locking.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
