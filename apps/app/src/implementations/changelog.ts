import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.9 beta
const CHANGES_TW = {
  added: ['新增 印章功能。'],
  changed: [
    '調整 Promark MOPA 頻率上限。',
    '調整 匯出檔案時需將文字轉路徑。',
    '調整 自動對焦流程為先移至指定位置再執行對焦。',
  ],
  fixed: [
    '修正 v2.5.8 工作剩餘時間顯示錯誤。',
    '修正 v2.5.8 文字轉點陣圖後產生重複點陣圖的問題。',
    '修正 點陣圖預估工作時間比實際時間偏長的問題。',
    '修正 「保留相機預覽結果」開啟時的問題部分機器無法預覽的問題。',
    '修正 部分偏好設定在新分頁無法同步的問題。',
    '修正 列印圖層物件邊框的相關問題。',
    '修正 Promark 工作過程中可能中途停止的問題。',
    '修正 Promark 旋轉軸角度誤差。',
  ],
};

const CHANGES_EN = {
  added: ['Added stamp-making feature.'],
  changed: [
    'Adjusted Promark MOPA frequency upper limit.',
    'Adjusted file export to convert text to paths.',
    'Adjusted Auto Focus process to move to the specified position before focusing.',
  ],
  fixed: [
    'Fixed issue where remaining work time was displayed incorrectly in v2.5.8.',
    'Fixed issue where converting text to image in v2.5.8 generated duplicate images.',
    'Fixed issue where estimated processing time for bitmaps was significantly longer than the actual time.',
    'Fixed issue where enabling “Keep Preview Result” caused preview to fail on some machines.',
    'Fixed issue where some preferences could not sync across new tabs.',
    'Fixed stroke issues on print layers.',
    'Fixed issue where Promark jobs could stop unexpectedly during processing.',
    'Fixed Promark rotary axis angle deviation.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
