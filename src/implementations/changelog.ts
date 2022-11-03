import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正新手教學時提示框錯位。',
    '修正相機預覽發生錯誤時顯示方式。',
    '修正文字旋轉後編輯錯位問題。',
    '修正匯入的 SVG 檔案複製後無法顯示問題。',
  ],
  changed: [
    '調整 HEXA 雕刻參數',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed tutorial hint box positioning issues.',
    'Fixed error message of camera calibration.',
    'Fixed text positioning issue after rotating and editing.',
    'Fixed image displaying issue after copying and pasting imported SVG objects.',
  ],
  changed: [
    'Updated HEXA engraving presets.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
