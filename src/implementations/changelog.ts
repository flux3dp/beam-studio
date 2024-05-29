import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.5-beta
const CHANGES_TW = {
  added: [
    '新增 windows 系統在路徑預覽時可以以滑鼠或觸控板拖曳畫面。',
  ],
  fixed: [
    '修正部分 復原問題。',
    '修正 旋轉後的物件使用 (Alt / Option) + 拖曳複製，方向會錯誤。',
    '修正 有尖角的元素在位移複製後出現倒角。',
    '修正 右鍵選單的群組/解散群組選項沒有被正確觸發。',
    '修正 路徑計算中「從這裡開始」的速度。',
  ],
  changed: [
    '變更 Ador 校正流程中部分敘述。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added drag control with the mouse or trackpad in the path preview for Windows systems.',
  ],
  fixed: [
    'Fixed some undo issues.',
    'Fixed the issue where the direction of the rotated object is incorrect when using (Alt / Option) + drag to copy.',
    'Fixed the issue where the chamfer appeared after offsetting the element with sharp corners.',
    'Fixed the issue where the group/ungroup options in the right-click menu were not enabled correctly.',
    'Improved the performance of the "Start Here" button in the path preview.',
  ],
  changed: [
    'Changed some description in Camera Calibration process for Ador.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
