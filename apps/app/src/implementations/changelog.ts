import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.8 beta
const CHANGES_TW = {
  added: ['新增 向量圖的向量轉點陣圖功能。'],
  changed: [
    '變更 部分文件設定應套用於新分頁。',
    '變更 文字可直接跟路徑執行合併功能。',
    '變更 對齊相關功能需考慮非工作區域。',
    '變更 旋轉軸軸心初始顯示的座標。',
    '變更 使用當前位置時不設旋轉軸心。',
    '變更 連線至機器 IP 時的錯誤訊息。',
    '變更 點陣圖的銳化功能視窗。',
    '變更 複製貼上行為。',
  ],
  fixed: [
    '修正 旋轉物件經過廣域雕刻後，部分內容無法正常顯示的問題。',
    '修正 部分偏好設定在新開分頁沒有正確套用的問題。',
    '修正 v2.5.7 雙擊 beam 檔時沒有正確開啟檔案的問題。',
    '修正 上傳大型檔案至雲端時的錯誤。',
  ],
};

const CHANGES_EN = {
  added: ['Added Convert to Image function for vector objects.'],
  changed: [
    'Changed some document settings to now apply to new tabs.',
    'Changed text can now be directly united with paths.',
    'Changed alignment functions to take non-work areas into account.',
    'Changed the initial coordinates for rotation axis center display.',
    'Cancelled setting the rotation axis center when using the current position.',
    'Changed error messages shown when unable to connect to machine by IP.',
    'Changed the Sharpen tool window for images.',
    'Changed the behavior for copy and paste.',
  ],
  fixed: [
    'Fixed an issue where rotated objects were not fully displayed after using the Passthrough function.',
    'Fixed an issue where some preferences were not correctly applied in new tabs.',
    'Fixed an issue in v2.5.7 where double-clicking a .beam file did not open it correctly.',
    'Fixed an error when uploading large files to the My Cloud.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
