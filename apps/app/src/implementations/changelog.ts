import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.0 beta
const CHANGES_TW = {
  added: [
    '新增 AI 創作功能。',
    '優化相機預覽使用流程，使用者在相機預覽過程中仍可編輯畫布中物件。',
    'Beambox II 相機支援自動曝光功能 (需搭配韌體 v6.0.15)。',
    '新增 進階校正參數設定。',
  ],
  changed: [
    '更換 Mac 版 Beam Studio icon。',
    '調整 位移複製功能面板排版。',
    '調整 陣列功能面板排版。',
    '優化 beamo II 相機校正流程。',
  ],
  fixed: [],
};

const CHANGES_EN = {
  added: [
    'Added the AI Creation feature.',
    'Improved the Camera Preview workflow—users can now continue editing objects on the canvas while in Camera Preview.',
    'Beambox II camera now supports Auto Exposure (requires firmware v6.0.15).',
  ],
  changed: [
    'Updated the Beam Studio icon on macOS.',
    'Adjusted the layout of the Offset panel.',
    'Adjusted the layout of the Array panel.',
  ],
  fixed: [],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
