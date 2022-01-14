import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增 HEXA 工作範圍以及雷射參數。',
  ],
  fixed: [
    '修正工作預覽在圖層速度較快時，預估時間會和計算工作時間不同的問題。',
    '修正無法讀取資料夾路徑中含有 # 字號的檔案。',
    '修正文字在旋轉並縮放之後移動會導致位置計算錯誤的問題。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added workarea and laser presets of HEXA.',
  ],
  fixed: [
    'Fixed time estimation deviation in path preview mode when engraving speed is fast.',
    'Fixed failed to load files whose path containing #.',
    'Fixed position error when moving rotated and scaled text elements.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
