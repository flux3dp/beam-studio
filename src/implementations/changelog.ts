import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.9-beta
const CHANGES_TW = {
  added: [
    '新增 自動對位功能 (Beta)。',
    '新增 漸層圖片的深度模式（需搭配 4.3.4 / 5.3.4 以上版本的韌體）。',
    '新增 自動切換圖層與物件面板選項於偏好設定。',
    '新增 相機預覽拼接照片時的羽化效果。',
  ],
  fixed: [
  ],
  changed: [
    '在物件面板上的輸入欄位可使用逗號作為小數點。',
    '改善計算多圖層工作路徑時記憶體使用量。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Auto Fit feature (Beta).',
    'Added Depth Mode for gradient image (requires firmware version 4.3.4 / 5.3.4 or above).',
    'Added an option to automatically switch layers and object panels in the preferences.',
    'Added feathering effect when stitching photos in the camera preview.',
  ],
  fixed: [
  ],
  changed: [
    'The input fields in the object panel can use a comma as a decimal point.',
    'Improve memory usage when calculating task path with lots of layer.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
