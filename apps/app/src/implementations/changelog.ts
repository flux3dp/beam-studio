import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.3 beta
const CHANGES_TW = {
  added: ['新增 支援 Ador 與 Beamo 自動送料功能（需搭配韌體 4.3.9 與 5.3.8 或以上）。', '新增 支援匯出 UV 印刷檔案。'],
  changed: [
    '改善 Promark 的自動重連機制。',
    '變更 Beambox II 自動送料的旋轉倍率。',
    '變更 原點雕刻時進行外框預覽，僅在開啟視窗時才會歸零。',
    '變更 物件含有剪裁路徑時不可解散圖檔。',
  ],
  fixed: [
    '修正 Promark 使用旋轉軸時會鎖住馬達的問題。',
    '修正 Promark 在點陣圖雕刻被中斷後無法正確填充的問題。',
    '修正 Promark 在使用特定屬性時產生錯誤的填充結果。',
    '修正 Promark 斷線後沒有從目錄的機器列表中移除。',
    '修正 開啟路徑計算加速後，部分功能無法正常使用的問題。',
    '修正 畫布縮放時 SVG 圖檔顯示可能會錯位的問題。',
    '修正 從 Illustrator 套件匯入同名圖層時，顯示的圖層參數沒有及時更新。',
    '修正 點陣圖使用當前雕刻時未忽略物件空白處。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added support for Ador and Beamo auto feeder (requires firmware version 4.3.9 and 5.3.8 or above).',
    'Added support for exporting UV printing files.',
  ],
  changed: [
    'Changed the rotation scale for Beambox II’s auto feeder.',
    'Changed frame preview to no longer homing every time when using “Start From Origin”.',
    'Changed the behavior to prevent disassembling SVG objects that have clipping paths.',
  ],
  fixed: [
    'Fixed issues with some features not working properly when Path Calculation Acceleration is enabled.',
    'Fixed an issue where SVG files might display incorrectly when zooming the canvas.',
    'Fixed layer parameters not updating when importing same-named layers from Illustrator.',
    'Fixed an issue where object blank areas were not ignored when using the current position for raster engraving.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
