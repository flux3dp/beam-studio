import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.2 beta
const CHANGES_TW = {
  added: [
    '新增 支援 Beambox II 自動送料 （需搭配韌體 6.0.10 或以上）。',
    '新增 支援 Promark 旋轉軸。',
    '新增 旋轉軸的旋轉倍率參數。',
    '新增 雕刻（掃描）的「分段雕刻」選項偏好設定。',
  ],
  changed: ['更新 文件設定中的旋轉軸設定介面。', '變更 旋轉軸模式下皆不使用分段雕刻。'],
  fixed: [
    '修正 位移複製及陣列樣式。',
    '修正 部分圖檔曲線雕刻結果錯誤。',
    '修正 QR 條碼解散圖檔會有全黑背景。',
    '修正 盒子產生器的標籤沒有正確轉路徑。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added support for Beambox II Auto Feeder (requires firmware 6.0.10 or above).',
    'Added a rotation scale for the rotary.',
    'Added a preference option for “Segmented Engraving” in Rastering (scanning)',
  ],
  changed: [
    'Updated the rotary settings interface in document settings.',
    'Changed to disable Segmented Engraving in rotary mode.',
  ],
  fixed: [
    'Fixed Offset and Array styles.',
    'Fixed incorrect engraving results for certain vector curves.',
    'Fixed QR code decomposition producing a fully black background.',
    'Fixed box generator labels not correctly converted to paths.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
