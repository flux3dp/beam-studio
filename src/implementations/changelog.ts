import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.7 beta
const CHANGES_TW = {
  added: [
    '新增 點陣圖的編輯圖片功能。', '新增 Promark 重連線後可繼續工作的功能。',
  ],
  fixed: [
    '修正 使用文字轉路徑 2.0 時，希伯來語（RTL 文字）方向錯誤的問題。',
    '修正 v2.4.6 相機校正值無法儲存的問題。',
  ],
  changed: [
    '改善 Promark 紅光預覽卡頓的問題。',
    '變更 Promark M20, M100 脈寬範圍。',
    '改善 Promark 長時間雕刻的穩定性。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added “Edit image” functionality for bitmap image.',
  ],
  fixed: [
    'Fixed an issue where Hebrew（RTL text）had the wrong direction when using Text-to-Path Converter 2.0.',
    'Fixed an issue in v2.4.6 where camera calibration values could not be saved.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
