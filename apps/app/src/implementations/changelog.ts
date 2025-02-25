import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.0 beta
const CHANGES_TW = {
  added: [
    '新增 「自動對齊」功能於上層「檢視」選單',
    '新增 Promark 「擺動」參數。',
    '新增 Instagram 圖示至左側功能列。',
    '新增 Beambox II 3D 曲面雕刻的錯誤提示。',
  ],
  changed: [
    '變更 Design Market 圖示的位置。',
    '變更 Promark 點陣圖「打點時間」參數的位置。',
    '變更 Beambox II 範例圖檔的功率設定。',
  ],
  fixed: [
    '修正 工作暫停後，儀表板中「開始」按鈕無反應的問題。',
    '修正 Promark 在特定字型下填充結果錯誤的問題。',
    '修正 Promark 雙向填充設定未正確讀取的問題。',
    '修正 Beambox II 3D 曲面雕刻時，當前位置不需歸零。',
    '修正 外框預覽時需省略空白群組。',
    '修正 多選物件時旋轉功能錯誤的問題。',
  ],
};

const CHANGES_EN = {
  added: ['Added "Auto Align" function to the top "View" menu', 'Added Instagram icon to the left sidebar.'],
  changed: ['Changed the position of the Design Market icon.'],
  fixed: [
    'Fixed an issue where the "Start" button in the dashboard was unresponsive after pausing a job',
    'Fixed an issue where blank groups were not ignored during Framing preview.',
    'Fixed an issue with rotation functionality when selecting multiple objects.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
