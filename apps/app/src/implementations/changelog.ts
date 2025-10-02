import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.10 beta
const CHANGES_TW = {
  added: [
    '新增 免費 Google Fonts（需連網使用）。',
    '新增 Promark 支援阿根廷地區。',
    '新增 Promark 旋轉軸功能外框預覽時「處理中」彈窗。',
  ],
  changed: [
    '調整 工具列上的 My cloud 匯入功能移至 選單 > 檔案。',
    '隱藏 工具列上的 Design Market 和 Instagram 入口。',
    '調整 工具列上的曲線雕刻按鈕移至 選單 > 工具。',
    '調整 文字物件產生時預設為填充。',
    '更換 相機預覽與校正功能的亮度調整圖示與文字提示。',
  ],
  fixed: ['修正 文件設定中關閉視窗按鈕無效的問題。', '調整 Promark 工作進度條過快的問題。'],
};

const CHANGES_EN = {
  added: [
    'Added Free Google Fonts (requires internet connection).',
    'Added Promark support for Argentina region.',
    'Added processing popup during frame preview of Promark rotary axis.',
  ],
  changed: [
    'Moved My cloud import entry from toolbar to Menu > File.',
    'Removed Design Market and Instagram entries from toolbar.',
    'Moved Curve Engraving button from toolbar to Menu > Tools.',
    'Changed Text objects default to infilled when created.',
    'Changed camera preview & calibration brightness adjustment icon and tooltip.',
  ],
  fixed: ['Fixed non-functional close button in document settings.', 'Adjusted overly fast Promark job progress bar.'],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
