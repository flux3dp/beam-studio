import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.6.7 beta
const CHANGES_TW = {
  added: [
    '新增 文字方塊工具。',
    '新增 機器與文件設定中新增 Promark (Safe+) 機型。',
    '新增 HEXA RF 相機支援精細預覽模式。',
  ],
  changed: [
    '重新命名雕刻解析度選項。',
    '改善路徑工作執行順序。',
    '調整自動對位功能說明引導。',
    '更換相機預覽拍照按鈕圖示。',
    '調整 HEXA RF 雷射加速演算法。',
    '調整 beamo II 相機預覽時重新歸零機制。',
  ],
  fixed: [
    '修正 路徑預覽顯示異常問題。',
    '修正 自動儲存功能異常。',
    '修正 Promark 啟用擺動功能時，可能從中心點開始出光的問題。',
    '修正 拼圖生成器於視窗縮放時介面錯位問題。',
    '修正 列印圖層中的向量物件於縮放時，路徑邊框預覽粗細異常問題。',
  ],
};

const CHANGES_EN = {
  added: ['Added Text Box tool.', 'Added Promark (Safe+) model to Machine Setup and Document settings.'],
  changed: [
    'Renamed engraving resolution options.',
    'Optimized path execution order.',
    'Updated guidance for Auto Fit.',
    'Updated camera preview capture button icon.',
  ],
  fixed: [
    'Fixed an issue with incorrect Path Preview display.',
    'Fixed an issue with Auto-save functionality.',
    'Fixed an issue where Promark may start firing from the center when Wobble mode is enabled.',
    'Fixed UI misalignment in Puzzle Generator when resizing the window.',
    'Fixed an issue where path outline thickness of vector objects in print layers appears inconsistent when scaling',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
