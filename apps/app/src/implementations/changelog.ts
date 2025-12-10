import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.11 beta
const CHANGES_TW = {
  added: [
    '支援 FLUX beamo II 機型。',
    '新增 Promark 凸包預覽功能。',
    '新增 模組校正跳過繪製雷射與列印校正圖形功能。',
    '新增 進階校正參數設定。',
  ],
  changed: ['調整 雕刻與列印預設參數排序 (需重置參數設定)。'],
  fixed: [
    '修正 跨分頁偏好設定同步功能。',
    '修正 快速點擊送出工作可能重複計算工作的問題。',
    '修正 計算路徑資訊翻譯。',
    '修正 beamo 二極體校正功能。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Promark convex hull preview.',
    'Added option to skip drawing laser and print calibration patterns during module calibration.',
    'Added advanced calibration parameter settings.',
  ],
  changed: ['Reordered default engraving and printing parameters (reset parameters required).'],
  fixed: [
    'Fixed preference syncing issues.',
    'Fixed issue where rapidly clicking “Start” could trigger duplicate job calculations',
    'Added missing translations for path calculation information.',
    'Fixed the beamo diode calibration function.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
