import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '針對尚未未校正二極體雷射模組的機型在偏好設定中加入校正預設值。',
  ],
  fixed: [
    '優化多物件套用操作 Undo/ Redo 效能。',
    '修正裁減大尺寸圖片會錯誤的問題。',
    '修正有時無法刪除曲線錨點問題。',
    '修正執行工作後，填充物件變成空心的問題。',
    '修正某些 SVG 檔解散群組後位置會錯位的問題。',
    '修正使用二極體雷射相機預覽之Y軸校正誤差。',
    '修正管理參數面板中，恢復預設的提示字元畫面異常顯示。',
    '修正 Windows 版本更新日誌顯示錯誤問題。',
    '修正使用裁減功能之上一步功能錯誤。',
  ],
  changed: [
    '更改「不銹鋼 - 刻印（二極體雷射）」速度參數為 10。',
  ],
};

const CHANGES_EN = {
  added: [
    'Add the default value for the non-setting "Diode Laser Offset machine.',
  ],
  fixed: [
    'Optimize the Undo/Redo speed with multiple objects operation.',
    'Fixed the "Crop" problem with the big size image.',
    'Fixed the problem that the anchor point of the curve cannot be deleted sometimes.',
    'Fixed the vector become non-infill after sending the engraving job.',
    'Fixed some SVG files will change the position after Disassembly.',
    'Fixed the camera preview wrong offset by using the diode laser.',
    'Fixed the abnormal display of the reset pop-out dialog in the Preset Manage panel.',
    'Fixed the wrong display of the change logs panel in the Windows version.',
    'FIxed the Back function error in the Crop panel.',
  ],
  changed: [
    'Changed the speed setting of the "Metal - Engraving (Diode Laser)" preset to 10.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
