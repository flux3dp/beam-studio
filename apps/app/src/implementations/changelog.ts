import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.4 beta
const CHANGES_TW = {
  added: [
    '新增 位移複製與陣列功能即時預覽編輯效果。',
    'Promark 支援 Mac Apple Silicon (M 系列) 晶片系統。',
    '全面導入 加速算圖引擎，大幅優化路徑規劃與工作生成速度。',
    '支援 各圖層獨立設定雕刻解析度。',
    '新增 左側工具列「產生器」分類。',
    '新增 HEXA RF 照片校正資料上傳與下載功能。',
    '新增 beamo II 照片校正資料上傳與下載功能。',
  ],
  changed: ['雕刻解析度設定由「文件設定」移至「圖層設定」。'],
  fixed: [],
};

const CHANGES_EN = {
  added: [
    'Added Preview for Offset and Array functions.',
    'Promark now supports Mac Apple Silicon (M-series) systems.',
    'Fully integrated the Path Calculation Acceleration engine, significantly improving path planning and job generation speed.',
    'Supports independent engraving resolution settings per layer.',
    'Added a new “Generator” category to the left toolbar.',
  ],
  changed: ['Moved engraving resolution settings from Document Settings to Layer Settings.'],
  fixed: [],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
