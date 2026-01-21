import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.1 beta
const CHANGES_TW = {
  added: ['開啟 beamo 旋轉軸支援擴展工作範圍功能。'],
  changed: ['延長 FLUX ador 和 beamo II 的旋轉軸擴展工作範圍。'],
  fixed: [
    '修正 HEXA RF 相機訊號源切換問題。',
    '調整 HEXA RF 雷射頭進階校正的棋盤版擺放位置。',
    'HEXA RF 80W 機型雷射延遲參數更新。',
    '更新 HEXA RF 範例圖檔。',
  ],
};

const CHANGES_EN = {
  added: ['Enabled “Extend Workarea” for Rotary on beamo.'],
  changed: ['Extended the rotary working area expansion for FLUX Ador and beamo II.'],
  fixed: [],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
