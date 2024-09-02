import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.0 beta
const CHANGES_TW = {
  added: [
    '新增 漸層圖片的深度模式（需搭配韌體 4.3.4 / 5.3.4 或以上版本）。',
    '新增 深度模式下的最小功率參數 （需搭配韌體 4.3.4 / 5.3.4 或以上版本）。',
    '新增 文件設定 功能於上方工具列。',
    '新增 Ador 白墨選項 （需搭配 Ador 韌體 5.3.4 或以上版本）。',
    '新增 Ador 彩色圖層的單色圖層選項。',
    '新增 Ador 自訂列印參數選項。',
  ],
  fixed: [
  ],
  changed: [
    '變更 參數管理面板功能與樣式。',
    '變更 文件設定面板樣式。',
    '改善 填充物件的工作路徑計算速度。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added gradient image depth mode (requires firmware version 4.3.4 / 5.3.4 or above).',
    'Added minimum power parameters in depth mode (requires firmware version 4.3.4 / 5.3.4 or above).',
    'Added document settings feature to the top toolbar.',
    'Added Ador white ink option (requires Ador firmware version 5.3.4 or above).',
    'Added single-layer option for Ador full color layers.',
    'Added Ador custom print parameter options.',
  ],
  fixed: [
  ],
  changed: [
    'Changed the functionality and style of the parameter management panel.',
    'Changed the style of the document settings panel.',
    'Improved the calculation speed of the tool path for infilled objects.',
    'Renamed “Execute” to “Pass Count”',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
