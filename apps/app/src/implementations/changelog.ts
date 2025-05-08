import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.4 beta
const CHANGES_TW = {
  added: [
    '新增 支援 BB2 廣角相機（需搭配韌體 6.0.12 或以上）。',
    '新增 更多元素圖庫。',
    '新增 路徑橋接功能。',
    '新增 支援 Promark 安全保護門。',
    '新增 字體選單中顯示最近使用的字體。',
    '新增 Beambox II 相機校正時的示意畫面與確認步驟。',
    '新增 Promark 相機校正前未連接相機時的錯誤提示。',
  ],
  changed: ['變更 Promark 外框預覽後可直接開始工作。', '變更 元素面板樣式。'],
  fixed: [
    '修正 Promark 儀表板工作進度顯示異常。',
    '修正 Ador 雕刻時未正確套用加速度設定的問題。',
    '修正 修正條碼與其他物件複選後送出工作時的異常。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added support for Beambox II wide-angle camera (requires firmware 6.0.12 or later).',
    'Added more elements to the element library.',
    'Added Tabs feature for path',
    'Added display of recently used fonts in the font menu.',
    'Added illustration and confirmation screens during Beambox II camera calibration.',
  ],
  changed: ['Changed element panel layout.'],
  fixed: [
    'Fixed issue where Ador did not correctly apply acceleration settings during engraving.',
    'Fixed error when submitting a job with both barcodes and other objects selected.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
