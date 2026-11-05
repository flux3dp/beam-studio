import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.7.3 beta
const CHANGES_TW = {
  added: [
    '新增 Promark UV 雷射源與內雕（3D）模式：可匯入 STL、擠出 2D 圖形與文字、照片轉 3D 點雲，支援 3D 多選與填充水平面。',
    '新增 校正 > 手動輸入：直接編輯相機預覽偏移（魚眼機種含廣角分區偏移與區域漸變）、模組偏移與精準對位偏移。',
    '新增 beamo II / Beambox II / HEXA RF 圖層進階設定「雷射頻率」（20–500 kHz，需韌體 6.5.3 以上）。',
    '新增 Promark 多組場鏡參數：每個工作範圍各自保存場鏡、振鏡與紅點參數，選機時自動套用並檢查參數範圍。',
    '新增 精準對位偏移距離支援負值（最小 −3 mm），切割線可內縮作出血。',
    '新增 錯誤回報自動上傳：錯誤視窗可選擇附上診斷資訊，並可於 設定 > 隱私權 選擇每次詢問、自動傳送或不傳送。',
  ],
  changed: [
    '變更 全新安裝時 beamo II 4C 墨水匣版本預設為 V2。',
    '變更 Windows 防火牆規則改由安裝程式加入，啟動時不再要求系統管理員權限。',
  ],
  fixed: [
    '修正 beamo II 相機校正時門蓋檢查堆積導致流程卡住的問題。',
    '修正 西班牙文翻譯錯誤，並改善各語言剩餘時間的顯示方式。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added Calibration > Manual Configuration to edit camera preview offsets (incl. per-region wide-angle offsets with blending on fisheye models), module offsets and the Print and Cut offset directly.',
    'Added a per-layer Laser Frequency advanced setting (20–500 kHz) for beamo II / Beambox II / HEXA RF (firmware 6.5.3 or later).',
    'Added Promark lens profiles: field, galvo and red-dot parameters are stored per work area, applied automatically on machine selection and range-checked.',
    'Added negative Print and Cut offsets (down to −3 mm) to inset the cut line for bleed.',
    'Added error report upload: error dialogs can attach diagnostics, with Ask / Always / Never in Settings > Privacy.',
  ],
  changed: [
    'Fresh installs default the beamo II 4C ink cartridge version to V2.',
    'The Windows firewall rule is now added by the installer, so launching no longer requires administrator rights.',
  ],
  fixed: [
    'Fixed beamo II camera calibration stalling when door checks piled up.',
    'Fixed Spanish translations and improved the remaining-time display in all languages.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
