import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.5 beta
const CHANGES_TW = {
  added: [
    '新增 Beamy 文字客服功能。',
    '新增 Promark 可變文字功能。',
    '新增 Promark 條碼工具中的可變文字功能。',
    '新增 Promark 輪廓預覽功能。',
    '新增 文字複選時可以更改字體。',
    '新增 板岩預設雕刻參數。',
    '新增 滑鼠停留於被停用的按鈕時會顯示提示訊息。',
    '新增 匯入向量圖時若檔案過大會顯示提示訊息。',
  ],
  changed: ['調整 Promark 儀表板樣式。', '調整 路徑計算時的進度條顯示。'],
  fixed: [
    '修正 Promark 儀表板相關問題。',
    '修正 v2.5.4 Promark 相機校正時無法正確辨識校正點。',
    '修正 路徑預覽模式下，縮放視窗可能導致圖層面板顯示的問題。',
    '修正 登入資訊未勾選「記得我」時，在多分頁下未被正確存取。',
    '修正 Beambox II 韌體檢查更新。',
    '修正 組合形狀 功能會殘留路徑。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Beamy online text-based customer support feature.',
    'Added Variable text feature for Promark.',
    'Added Variable text support in Promark’s barcode tool.',
    'Added contour preview feature for Promark.',
    'Added ability to change font when selecting multiple text objects.',
    'Added default engraving parameters for Slate material.',
    'Added tooltip when hovering over disabled buttons.',
    'Added warning message when importing large vector files.',
  ],
  changed: ['Updated style of the Promark dashboard.', 'Adjusted progress bar display during path calculation.'],
  fixed: [
    'Fixed issues related to the Promark dashboard.',
    'Fixed issue where Promark camera calibration in v2.5.4 could not correctly detect engraved marks.',
    'Fixed layer panel display issue when zooming in Path Preview mode.',
    'Fixed “Remember Me” login info not being properly accessed across multiple tabs.',
    'Fixed Beambox II firmware update check.',
    'Fixed residual paths left behind when using Union feature.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
