import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.5 beta
const CHANGES_TW = {
  added: [
    '新增 Beambox II 相機校正資料的下載與上傳功能。',
    '新增 Beambox II 對焦尺檔案。',
    '新增 Promark Z 軸調整功能於機器設定。',
    '新增 Promark 點陣圖打點時間參數。',
    '新增 Promark 的路徑「填充間隔」參數於材質測試工具。',
    '新增 Promark 填充路徑的雙向填充及交叉填充選項。',
    '新增 ESC 鍵可終止相機預覽序列或退出預覽模式。',
    '新增 「追蹤我們」於說明選單中。',
  ],
  fixed: [
    '修正 Promark 參數紅光桶型。',
    '修正 Promark 預估工作時間。',
    '修正 Promark 在點陣圖漸層及非漸層的打標行為。',
    '修正 參數管理預設值無法正確儲存的問題。',
  ],
  changed: [
    '更新 Beambox II 範例檔。',
    '更新 Beambox II 機器設定畫面。',
    '更新 Promark MOPA 60W 預設參數。',
    '改善 Promark 紅光預覽時容易與後端斷線的問題。',
    '更新「管理我的帳號」按鈕的目標網址。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added “Follow Us” in help menu.',
    'Added an ESC shortcut key to stop the camera preview sequence or exit the preview mode.',
  ],
  fixed: [
    'Fixed the issue where default values in parameter management could not be saved correctly.',
  ],
  changed: [
    'Changed the target URL of the “Manage My Account” button.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
