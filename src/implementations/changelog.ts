import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.1 beta
const CHANGES_TW = {
  added: [
    '新增 當前位置雕刻功能（需搭配韌體 4.3.5 / 5.3.5 或以上版本）。',
    '新增 外框預覽的工作區域檢查與凸包模式。',
    '新增 降低焦距及每次遞降功能於自動對焦機型（需搭配韌體 4.3.5 / 5.3.5 或以上版本）。',
  ],
  fixed: ['修正 Ador 在路徑計算後匯入圖檔的相關問題。', '修正 Ador 模組頭錯誤時的終止工作'],
  changed: ['更新 捷克文翻譯。', '更新 參數管理面板。'],
};

const CHANGES_EN = {
  added: [
    'Added Job Origin feature (requires firmware version 4.3.5 / 5.3.5 or above).',
    'Added Area check and Hull mode for frame preview.',
    'Added lower focus and z step feature for auto-focus models (requires firmware version 4.3.5 / 5.3.5 or above).',
  ],
  fixed: [
    'Fixed issues related to importing image files after path calculation in Ador.',
    'Fixed job termination when encountering an Ador tool head error.',
  ],
  changed: ['Updated Czech translation.', 'Updated Parameter management panel.'],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
