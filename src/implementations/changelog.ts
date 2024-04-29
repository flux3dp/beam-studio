import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.2-beta
const CHANGES_TW = {
  added: [
    '新增 Ador 相機曝光值調整。',
    '新增 Ador 外框預覽時弱出光',
    '新增 Ador 列印半色調選項。',
    '新增 韌體更新提示。',
  ],
  fixed: [
    '修正 材質參數選單的位置。',
    '修正 多邊形元素在變更邊長時位置會被移到左上方的問題。',
    '修正 計算工作時間造成視窗卡住。',
    '改善 Ador 列印顏色偏深的問題。',
    '修正 2.3.2 beta 版本中 Ador 路徑加速度限制套用到雕刻上。',
  ],
  changed: [
    '變更 Ador 相機校正流程。',
    '變更 Ador 切割路徑的移動速度。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Ador camera exposure value (requires firmware 5.1.19 or above)',
    'Added Ador low laser while frame preview.',
    'Added Ador halftone option for printing.',
    'Added firmware update reminded.',
  ],
  fixed: [
    'Fixed the position of the material parameter drop down menu.',
    'Fixed the issue where the polygon element would be moved to the top left corner when its changed.',
    'Fixed the issue where estimate times causes the window to freeze.',
    'Improved the issue with Ador prints being too dark.',
    'Fixed the issue where path acceleration limits for Ador were applied to engraving in version 2.3.2 beta.',
  ],
  changed: [
    'Changed the Camera Calibration process for Ador.',
    'Changed the travel speed of cutting path for Ador.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
