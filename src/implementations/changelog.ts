import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.6-beta
const CHANGES_TW = {
  added: [
    '新增 圖層面板與物件面板的快捷鍵 。',
    '新增 「快捷鍵」文章連結於「說明」中。',
    '新增 圖層面板的擴展功能。',
    '新增「新增檔案」選項於「檔案」中。',
    '在畫布上新增當前 DPI 設定。',
  ],
  fixed: [
    '修正「不分層」匯入圖檔時物件填充狀態的相關問題。',
    '修正 文件標題包含文件路徑的問題。',
    '修正 選取狀態下的 svg 物件在路徑預覽時會消失的問題。',
  ],
  changed: [
    '移除「清除場景」選項。',
    '變更 部分快捷鍵按鈕。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added hot keys for the Layer panel and Object panel.',
    'Added “Keyboard Shortcuts” article link in “Help” menu.',
    'Added “New” as create new files in “File” menu.',
    'Added current DPI settings on the canvas.',
  ],
  fixed: [
    'Fixed issues related to object fill status when importing svg by single layer.',
    'Fixed the issue where the file title included the file path.',
    'Fixed the issue where selected SVG objects would disappear during path preview.',
  ],
  changed: [
    'Removed the “Clear Scene” option.',
    'Changed some hot key buttons.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
