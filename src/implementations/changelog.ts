import { IChangeLog } from 'interfaces/IChangeLog';

// 2.2.13-alpha
const CHANGES_TW = {
  added: [
    '新增 Ador 根據機器加速度調整加速度區間。',
    '新增 送出 Ador 工作時韌體版本檢查，請使用 5.1.12 以上韌體版本以送出工作。',
    '新增 波蘭文。',
  ],
  fixed: [
    '修正 多次移動圖層後圖層不可點選的問題。',
    '修正 Ador 影像描圖功能。',
    '修正 Ador 工作範圍邊界的圖形不會被雕刻的問題。',
  ],
  changed: [
    '變更 Ador 紅外線模組工作範圍。',
    '變更 部分西班牙文翻譯。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Ador acceleration area adjustment according to the machine setting.',
    'Added firmware version check when sending task to Ador. Please use firmware version 5.1.12 or above to send task.',
    'Added Polish language.',
  ],
  fixed: [
    'Fixed the issue that the layer cannot be selected after moving the layer multiple times.',
    'Fixed the image tracing function for Ador.',
    'Fixed the issue that the path on the boundary of Ador work area will not be engraved.',
  ],
  changed: [
    'Changed the work area of Ador infrared module.',
    'Changed part of the Spanish translation.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
