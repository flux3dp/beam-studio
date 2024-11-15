import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.3 beta
const CHANGES_TW = {
  added: [
    '新增 點陣圖的梯形變形功能。',
    '新增 支援 Promark 機型。',
    '新增 條碼生成器。',
    '新增 路徑計算加速選項於偏好設定 (Beta)。',
    '新增 外框預覽（F1）與開始工作（F2) 快捷鍵。',
  ],
  fixed: [
    '修正 Ador 相機校正參數。',
    '修正 命名圖層時使用快捷鍵儲存會造成上層選單無反應的問題。',
    '修正 部分翻譯。',
    '修正 「逐步對焦」在沒有勾選「降低焦距」時沒有作用。',
  ],
  changed: [
    '複選物件時可以選到所有物件圖層。',
    '調整機器設定的 USB 連線頁面。',
    '調整 盒子產生器的切口補償預設值變更為 0.1mm。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added “Rotary Warped” feature for bitmap image.',
    'Added Barcode generator.',
    'Added Path Calculation Acceleration option in preference (Beta).',
    'Add shortcut keys for running frame (F1) and start work (F2).',
  ],
  fixed: [
    'Fixed Ador camera calibration parameter',
    'Fixed part of translation',
    'Fixed an issue where using a shortcut to save while naming a layer caused the top menu to become unresponsive.',
    'Fix the issue where “Stepwise Focusing” does not work when “Lower Focus”  is not selected.',
  ],
  changed: [
    'Select all object layers when multiple objects are chosen.',
    'Adjust USB connection page in machine setup.',
    'Changed the default Kerf compensation in Box generator to 0.1mm',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
