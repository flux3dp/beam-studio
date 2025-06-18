import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.6 beta
const CHANGES_TW = {
  added: ['新增 雕刻圖案的自動內縮功能於文件設定。', '新增 群組物件及文字物件執行位移複製。'],
  changed: ['變更 Promark 安全門版本的相機校正動畫。', '變更 部分視窗為可移動視窗。'],
  fixed: [
    '修正 Windows 版本在特定位置時縮放及關閉視窗鍵無法點擊。',
    '修正 Promark 在 windows 系統處理複雜路徑時的錯誤。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Auto Shrink function in Document Settings for engraving objects',
    'Added offset feature for grouped objects and text objects.',
  ],
  changed: [
    'Updated the camera calibration animation for Promark machines with Promark Safe+.',
    'Changed some windows to be movable.',
  ],
  fixed: [
    'Fixed an issue where the zoom and close buttons could not be clicked in certain positions on Windows.',
    'Fixed an error when handling complex paths with Promark on Windows systems.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
