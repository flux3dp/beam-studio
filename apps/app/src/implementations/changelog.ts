import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.7.0 beta
const CHANGES_TW = {
  added: ['新增 切割精準對位功能。', '新增 圖層進階設定雕刻紋理功能。', '新增 Beambox II 舊版本更新通知。'],
  changed: ['改善 HEXA RF雕刻效能。', '變更 beamo II 預噴及刷新墨頭行為（需配合韌體 6.0.14 以上）'],
  fixed: ['修正 HEXA RF 相機預覽模式精準預覽有時沒有正確套用。', '修正 新手教學時可能會有框起位置位移。'],
};

const CHANGES_EN = {
  added: [
    'Added Print and Cut feature.',
    'Added texture setting in layer panel advanced settings.',
    'Added Beambox II old version update notification.',
  ],
  changed: [
    'Improved HEXA RF engraving performance.',
    'Changed beamo II purge and refresh nozzle behavior (requires firmware 6.0.14 or above).',
  ],
  fixed: [
    'Fixed HEXA RF camera preview mode sometimes not applying the precise preview correctly.',
    'Fixed the position of the frame may shift during the tutorial.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
