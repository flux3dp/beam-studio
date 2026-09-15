import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.7.1 beta
const CHANGES_TW = {
  added: [
    '新增 校正精準對位功能。',
    '新增 圖片生成式放大功能（需登入並使用 AI 點數）。',
    '新增 相機預覽範圍指示。',
    '新增 Ador, beamo II 路徑預覽功能。',
  ],
  changed: [
    '變更 首次開啟時預設語言使用系統語言。',
    '變更 多選時會實際選取相交的物件。',
    '關閉 由 Noun Project 匯入的圖示的路徑編輯功能。',
  ],
  fixed: [
    '修正 讀取較大 beam 專案時可能造成崩潰的問題。',
    '修正 翻轉群組時導致旋轉錯誤的問題。',
    '修正 滑鼠側鍵等上一步快捷鍵導致返回選擇語言頁的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Print and Cut offset calibration.',
    'Added Generative Upscale for images (requires login and AI credits).',
    'Added camera preview capture area indicator.',
    'Added Path Preview for Ador and beamo II.',
  ],
  changed: [
    'Changed the default language on first launch to follow the system language.',
    'Changed rubber-band selection to select only objects that actually intersect the selection box.',
    'Disabled path editing for icons imported from the Noun Project.',
  ],
  fixed: [
    'Fixed a possible crash when opening large beam projects.',
    'Fixed incorrect rotation when flipping groups.',
    'Fixed back shortcuts (e.g. mouse side button) returning to the language selection page.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
