import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.4 beta
const CHANGES_TW = {
  added: [
    '新增 支援 Beambox II機型。',
    '新增 Promark 機器設定時的參數設定畫面。',
    '新增 Promark Mopa 材質測試工具的頻率與脈寬選項。',
    '新增 Promark 相機校正動畫。',
  ],
  fixed: [
    '修正 Promark 相關問題。',
    '修正 可以在不同 Beam Studio App 中複製貼上物件。',
    '修正 勾選偏好設定中「路徑計算加速」選項時的相關問題。',
    '修正 SVG 物件在解散圖檔後會被填充。',
  ],
  changed: [
    '變更 部分上層選單的分類方式。',
    '變更 偏好設定中「相機預覽移動速度」的敘述與速度設定。',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed an issue where objects could not be copied and pasted between different Beam Studio apps.',
    'Fixed issues related to enabling the “Path Calculation Acceleration” option in preferences.',
    'Fixed SVG objects being filled after disassembling.',
  ],
  changed: [
    'Updated the categorization of some top-level menu items.',
    'Changed the description and speed setting of Camera’s “preview movement speed” in preference.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
