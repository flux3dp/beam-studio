import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.8 beta
const CHANGES_TW = {
  added: [
    '新增 偏好設定「保留相機預覽結果」選項',
  ],
  fixed: [
    '修正 Promark 紅光外框預覽在 220mm 及 150mm 場鏡時位置錯誤。',
    '修正 Promark 雕刻填充路徑時會有異常不出光。',
    '修正 開啟路徑計算加速時的路徑預覽結果。',
    '修正 點擊快捷鍵後切換畫面，可能造成快捷鍵失效的問題。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added preference “Keep Preview Result” option.',
  ],
  fixed: [
    'Fixed path preview result with path calculation acceleration enabled.',
    'Fixed an issue where switching screens after pressing a shortcut key could cause the shortcut key to become unresponsive.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
