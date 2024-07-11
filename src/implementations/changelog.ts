import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.7-beta
const CHANGES_TW = {
  added: [
    '新增 廣域雕刻功能 (用於 Ador 擴充底座)',
  ],
  fixed: [
    '修正 滑鼠滯留觸發右鍵選單。',
    '修正 Windows 系統右鍵選單顯示問題。',
    '修正 尺規偏移。',
    '修正 取消路徑預覽後，再執行路徑預覽出現 #806 錯誤。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added passthrough feature (For Ador Extension base).',
  ],
  fixed: [
    'Fixed the right-click menu being activated incorrectly when the mouse is stationary.',
    'Fixed the display issue of the right-click menu in Windows.',
    'Fixed the ruler discrepancy issue.',
    'Fixed the #806 error that occurs when re-executing path preview after canceling path preview.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
