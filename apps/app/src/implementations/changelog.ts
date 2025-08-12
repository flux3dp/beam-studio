import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.7 beta
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
  added: [
    'Added Beam Studio Home page.',
    'Added "Rounded Corners" feature in "Edit Image".',
    'Added AF (Auto Focus) button (Ador, Beambox II, and HEXA only, HEXA requires firmware v4.3.11 or later).',
    'Added offset feature for vector and raster objects.',
    'Added "Content Crop Thumbnail" option in Preferences.',
    'Added "Use Maximum Range" option in Preferences.',
  ],
  changed: [
    'Changed the credit calculation method for the AI Background Removal feature.',
    'RTL text will now automatically use Text-to-Path converter 2.0.',
    'Changed the interface and behavior of the "Non-working area"',
  ],
  fixed: [
    'Fixed an issue where a text-on-path object will disappear after being converted to a path.',
    'Fixed incorrect engraving order when loop compensation is set to 0.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
