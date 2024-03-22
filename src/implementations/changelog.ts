import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.0-beta
const CHANGES_TW = {
  added: [
    '新增 文字轉路徑 2.0。',
    '新增 我的雲端功能。',
    '新增 Boxgen 功能。',
    '新增 網頁字型。',
    '新增 字型搜尋功能。',
    '新增 帳戶圖示和彈出視窗。',
    '新增 錯誤代碼的文章連結於錯誤代碼視窗。',
    '新增 活動推播通知。',
    '新增 在右鍵點擊物件後移動圖層的選項。',
  ],
  fixed: [
    '修正 使用鉛筆工具後點擊圖層面板沒有反應的問題。',
  ],
  changed: [
    '變更 自動儲存檔案的命名規則。',
    '變更 將帳戶資料改為獨立選單。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Text to Path Converter 2.0.',
    'Added My cloud function.',
    'Added Boxgen function.',
    'Added Web font.',
    'Added Font search function.',
    'Added Account icon and modal.',
    'Added Error code article link.',
    'Added Event push notification.',
    'Added Option to move layers after right-clicking on object.',
  ],
  fixed: [
    'Fixed "Layers" button doesn’t show the layer panel after Pen tool was used.',
  ],
  changed: [
    'Changed the naming of automatically saved files.',
    'Changed the Account content to be an independent menu.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
