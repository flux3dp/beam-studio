import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.8-beta
const CHANGES_TW = {
  added: [
    '新增 自動對位功能。',
    '新增 支援 Ador 旋轉軸 (需搭配韌體 v5.3.3)',
  ],
  fixed: [
    '修正 點陣圖旋轉特定角度後送出工作位置錯誤。',
    '修正 部分圖檔直角計算錯誤問題。',
  ],
  changed: [
    '自動記住第三方登入資訊',
    '將「自動排列」更名為「智慧排版」',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Auto Fit feature.',
    'Added support for Ador Rotary (need to use firmware v5.3.3)',
  ],
  fixed: [
    'Fixed issue with incorrect positions after rotating images by specific angles.',
    'Fixed calculation error for right angles in some image files.',
  ],
  changed: [
    'Auto-save third-party login information',
    'Renamed “Auto Arrange” to “Smart Nest”',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
