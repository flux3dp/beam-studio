import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.7 beta
const CHANGES_TW = {
  added: [
    '新增 Beam Studio 首頁。',
    '新增「圓角」功能於「編輯圖片」。',
    '新增 AF 自動對焦按鈕（僅限 Ador、Beambox II、HEXA）。',
    '新增 支援向量及點陣圖物件執行位移複製。',
    '新增 「內容裁切縮圖」選項於偏好設定。',
  ],
  changed: ['變更 AI 去背功能的點數計算方式。', '變更 RTL 文字會自動適用文字轉路徑 2.0。'],
  fixed: ['修正 文字路徑轉為路徑後消失的問題。', '修正 封閉路徑補償為 0 時，路徑雕刻順序錯誤的問題。'],
};

const CHANGES_EN = {
  added: [
    'Added Beam Studio Home page.',
    'Added "Rounded Corners" feature in "Edit Image".',
    'Added AF (Auto Focus) button (Ador, Beambox II, and HEXA only, HEXA requires firmware v4.3.11 or later).',
    'Added offset feature for vector and raster objects.',
    'Added "Content Crop Thumbnail" option in Preferences.',
  ],
  changed: [
    'Changed the credit calculation method for the AI Background Removal feature.',
    'RTL text will now automatically use Text-to-Path converter 2.0.',
  ],
  fixed: [
    'Fixed an issue where a text-on-path object will disappear after being converted to a path.',
    'Fixed incorrect engraving order when loop compensation is set to 0.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
