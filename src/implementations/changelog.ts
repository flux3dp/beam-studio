import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.2-beta
const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正 讀取 beam 檔時會清除相機預覽畫面的錯誤。',
    '修正 部分 beam 檔讀取問題。',
    '修正 一些點陣圖顯示錯誤。',
    '修正 在對複雜的路徑進行位移複製時，畫面卡住的問題。',
    '修正 清除場景的對話窗內容沒有被翻譯的問題。',
  ],
  changed: [
    '變更 初次使用時相機校正以及新手導覽對話窗內容。',
    '變更 右側面板在選取及取消選取物件時將不再自動切換。',
    '變更 將自動排列功能從上方選單移到物件操作面板。',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed the issue where the camera preview would be cleared when loading a beam file.',
    'Fixed some beam file loading issue.',
    'Fixed some bitmap image display issues.',
    'Fixed applying offset to complex path causes the window to freeze.',
    'Fixed the issue where the content of the clear scene dialog was not translated.',
  ],
  changed: [
    'Changed the contents of the camera calibration and tutorial dialogs for the first use.',
    'Changed the right panel behavior, the right panel will no longer automatically switch when selecting and deselecting objects.',
    'Changed the auto-arrange function from the menu bar to the object panel.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
