import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.6 beta
const CHANGES_TW = {
  added: ['新增 拼圖產生器。', '新增 可拖曳的佈局面板。', '新增 HEXA RF 高品質雕刻模式。'],
  changed: [
    '調整物件屬性功能分類。',
    '統一 UI 字體並微調介面排版。',
    '更新 Beamy AI 客服按鈕圖示。',
    '移除不支援遠端自動對焦機型的 AF 按鈕入口。',
  ],
  fixed: [
    '修正元素功能搜尋列無法輸入空格的問題。',
    '修正 Swiftray 算圖對白色與透明物件的容許值。',
    '修正 Promark 門檢提示偶爾未顯示的問題。',
    '修正 Promark 第一圖層功率為 0 時，初始化狀態未即時切換為「工作中」的問題。',
    '修正 HEXA RF 門蓋相機曝光調整功能問題。',
  ],
};

const CHANGES_EN = {
  added: ['Added Puzzle Generator.', 'Added a draggable layout panel in the UI.'],
  changed: [
    'Reorganized object property categories.',
    'Unified UI fonts and refined interface layout.',
    'Updated Beamy AI support button icon.',
    'Removed AF button entry on devices that do not support remote autofocus.',
  ],
  fixed: [
    'Fixed issue where spaces could not be entered in the Elements search bar.',
    'Improved tolerance for white and transparent objects in Swiftray rendering.',
    'Fixed issue where the Promark door warning did not always appear.',
    'Fixed issue where the job state did not switch to “Working” when the first layer power was set to 0 on Promark',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
