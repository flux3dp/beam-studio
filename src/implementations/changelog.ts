import { IChangeLog } from 'interfaces/IChangeLog';

// 2.4.9 beta
const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正 啟用路徑計算加速時 3D 曲面雕刻動作異常。',
    '修正 啟用路徑計算加速時 1000 DPI 下未正常出光。',
    '修正 部分情境中快捷鍵無法反應的問題。',
    '修正 v2.4.8 版本中無法執行位移複製的問題。',
    '修正 Promark 雕刻時路徑起點未接合的問題。',
    '修正 Promark 紅光預覽後立即工作導致的非預期出光。',
    '修正 Promark 偶發工作速度異常，造成部分線條不出光。',
  ],
  changed: [
    '更新 Auto Fit 流程與介面。',
    '更新 Beambox II 材質測試檔案。',
    '更新 Promark 外框預覽及工作視窗設計。',
    '調整 Promark 相機校正時的繪製校正點功率。',
    '調整 Promark 在中止或結束工作後，紅光位置將回到中心 (0, 0)。',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed abnormal behavior during 3D curve engraving when enabling path calculation acceleration.',
    'Fixed Laser did not fire properly at 1000 DPI when enabling path calculation acceleration.',
    'Fixed shortcut keys not working properly in certain scenarios.',
    'Fixed the “Offset” function not executing in version 2.4.8.',
  ],
  changed: [
    'Updated the Auto Fit process and interface.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
