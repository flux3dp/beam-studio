import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.1 beta
const CHANGES_TW = {
  added: [
    '支援 HEXA RF 機型。',
    '新增 於 Mac（Apple Silicon）上安裝 Intel 版本時的警告提示。',
    '新增 泰隆尼雅語系支援。',
    '新增 進階校正參數設定。',
  ],
  changed: ['偏好設定頁面調整為視窗形式顯示。', '偏好設定套用完成後不再重整畫面。', '調整 西班牙文翻譯。'],
  fixed: [],
};

const CHANGES_EN = {
  added: [
    'Added a warning message when installing the Intel version on Apple silicon Macs.',
    'Added Catalan language support.',
  ],
  changed: [
    'Updated Preferences to open in a modal.',
    'Applied changes in Preferences without reloading the page.',
    'Updated Spanish translations.',
  ],
  fixed: [],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
