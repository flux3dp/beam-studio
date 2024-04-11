import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.1-beta
const CHANGES_TW = {
  added: [
    '新增 元素圖案。',
    '新增 相機預覽照片透明度調整。',
    '新增 下載與上傳機器原始照片功能 （Ador only）。',
  ],
  fixed: [
    '修復「檢視」中的設定未被正確存取。',
    '修復  圖層參數無法復原。',
  ],
  changed: [
    '取消 功率 70% 以上的警告訊息。',
    '變更 「速度」下限為 0.5mm/s。',
    '變更  「編輯」中的「貼齊端點」至「檢視」列表。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Element icons.',
    'Added Preview Opacity setting for camera preview photos.',
    'Added Functionality to download and upload raw photo data (Ador only).',
  ],
  fixed: [
    'Fixed the issue of settings not being saved correctly in “View”.',
    'Fixed the issue where layer parameters couldn’t be undone.',
  ],
  changed: [
    'Cancelled the warning message with power over 70%.',
    'Changed the lower limit of “speed” to 0.5mm/s.',
    'Moved the “Snap To Vertices” from “Edit” to “View”.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
