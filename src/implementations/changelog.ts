import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.6 beta
const CHANGES_TW = {
  added: [
    '新增 多分頁功能。',
    '新增 3D 曲面雕刻功能（僅限 Beambox II，需搭配韌體 6.0.7 或以上）。',
    '新增 Promark 送出工作按鈕於文件設定。',
    '新增 Promark MOPA 彩色測試範例檔。',
  ],
  fixed: [
    '修正 Promark 紅光預覽在填充路徑時顯示錯誤。',
    '修正 陣列功能第一次執行無反應的問題。',
    '修正 當未選擇路徑時，上層編輯選單中的路徑功能應不可點擊。',
    '修正 部分線上字體無法轉路徑的問題。',
  ],
  changed: [
    '變更 相機預覽入口位置。',
    '變更 相機校正時的校正點拍照範圍，僅限於預覽視窗內顯示的範圍。',
    '變更 Beambox II 廣域雕刻工作加速度區間。',
    '改善 Promark 進度條計算。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added multi-tab functionality.',
  ],
  fixed: [
    'Fixed an issue where the array function did not respond on the first execution.',
    'Fixed an issue where path functions in the top bar edit menu were clickable when no path was selected.',
    'Fixed an issue where some web fonts could not be converted to paths.',
  ],
  changed: [
    'Changed the camera preview entry point placement.',
    'Changed the camera calibration capture range to be limited to the area displayed within the preview window.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
