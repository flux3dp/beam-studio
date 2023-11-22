import { IChangeLog } from 'interfaces/IChangeLog';

// 2.2.12-alpha
const CHANGES_TW = {
  added: [
    '新增紅外線雷射和列印模組的校正提醒。',
  ],
  fixed: [
    '修正 CMYK 點陣圖顯示問題。',
    '修正 RGB 點陣圖列印色差問題。',
    '修正預噴區在刪除列印圖層後未正確刪除。',
    '修正列印測試前未執行預噴動作。',
    '修正匯入 PDF 及 AI 檔案時取消操作導致畫面當機的問題。',
    '修正匯出成 SVG 格式時，圖片大小錯誤。',
  ],
  changed: [
    '變更 Ador 校正工作時的風扇轉速為 10%。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added a reminder of calibration for the infrared laser and printing module.',
  ],
  fixed: [
    'Fixed CMYK bitmap display issue.',
    'Fixed RGB printing color issue.',
    'Fixed the issue where the prespray area was not correctly deleted after removing a printing layer.',
    'Fixed the issue of not performing pre-spray actions before printing test.',
    'Fixed the problem where cancelling the operation while importing PDF and AI files caused the screen to freeze.',
    'Fixed the issue of incorrect image sizes when exporting to SVG format.',
  ],
  changed: [
    'Changed the speed of ventilator to 10% while performing calibration task.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
