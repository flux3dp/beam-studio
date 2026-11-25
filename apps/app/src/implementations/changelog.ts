import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.7.4 beta
const CHANGES_TW = {
  added: [
    '新增 beamo II / Beambox II / HEXA RF 自動全範圍預覽：關上門蓋後自動拍攝全範圍照片作為畫布背景（可於 設定 > 相機 開啟，預設關閉）。',
    '新增 Promark Desktop / MOPA 圖層進階設定「打散掃描順序」與「每行停留」。',
  ],
  changed: ['變更 beamo II、Beambox II 與 HEXA RF 廣角相機校正標記改為單線雕刻。'],
  fixed: [
    '修正 相機校正任務遇到可恢復的暫停（如空氣輔助警告、濾網過期）時流程中斷的問題。',
    '修正 Promark 機器資訊未顯示實際序號的問題。',
    '修正 Windows 11 智慧型應用程式控制封鎖部分元件，導致 Beam Studio 無法正常啟動的問題。',
    '修正 算圖時進度視窗的提示文字逐字換行的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added auto full-area preview for beamo II / Beambox II / HEXA RF: a full-area photo is taken as the canvas background after the lid is closed (enable in Settings > Camera, off by default).',
    'Added the Interleave Scan Lines and Line Dwell advanced layer settings for Promark Desktop / MOPA.',
  ],
  changed: [
    'beamo II calibration marks and the Beambox II / HEXA RF wide-angle calibration marks are now engraved as single lines.',
  ],
  fixed: [
    'Fixed camera calibration tasks aborting on resumable pauses (such as air assist warnings or an expired filter).',
    'Fixed Promark Machine Info not showing the actual serial number.',
    'Fixed Windows 11 Smart App Control blocking some components so Beam Studio could not start properly.',
    'Fixed progress dialog tips wrapping one character per line while rendering.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
