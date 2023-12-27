import { IChangeLog } from 'interfaces/IChangeLog';

// 2.2.14-alpha
const CHANGES_TW = {
  added: [
    '新增 多國語翻譯。',
    '新增 支援換頭鎖 Z 軸馬達。',
  ],
  fixed: [
    '修正 部分語言翻譯。',
    '修正 SVG 匯入相關問題。',
    '修正 刪除列印圖層後復原，預噴區圖案未復原。',
    '修正 匯入含有點陣圖的 SVG 時，點陣圖層參數未正確初始化。',
  ],
  changed: [
    '變更 Ador 新增機器圖片。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added multi-language support.',
    'Added support for locking the Z-axis motor when changing module.',
  ],
  fixed: [
    'Fixed some translations.',
    'Fixed importing SVG related issues.',
    'Fixed the issue that pre-spary area is not restored after undoing the deletion of printing layer.',
    'Fixed the issue that the parameters of bitmap layer are not correctly initialized when importing SVG with bitmap.',
  ],
  changed: [
    'Changed the images in Ador setup pages.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
