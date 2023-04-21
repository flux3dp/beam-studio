import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增路徑節點編輯功能。',
    '新增自動對焦模組偏移量設定。',
    '新增以檔案開啟 Beam Studio 功能。',
  ],
  fixed: [
    '修正跨專案複製 SVG 的問題。',
  ],
  changed: [
    '更改部分 UI。',
    '將圖層最小速度改為 1 mm/s。',
    '使用開蓋模組時，將裁切右方灰色區塊的工作。',
    '開啟圖層右鍵選單時，會同時選取目標圖層。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added path node editing functionalities.',
    'Added autofocus module offset setting in preference.',
    'Added open file with Beam Studio.',
  ],
  fixed: [
    'Fixed the problem of pasting SVG across projects.',
  ],
  changed: [
    'Changed some UI.',
    'Changed the minimum speed to 1 mm/s.',
    'When using the Borderless mode, the gray area on the right will be clipped.',
    'When right-clicking on a layer, the target layer will be selected at the same time.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
