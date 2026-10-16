import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.7.2 beta
const CHANGES_TW = {
  added: [
    '新增 FLUX 101 新手課程（含學習進度、徽章與 AI 點數獎勵）。',
    '新增 物件中心吸附功能：拖曳或旋轉時可吸附至相機預覽中偵測到的物件。',
    '新增 自動對位 AI 輪廓偵測引擎（可於 設定 > 相機 切換）。',
    '新增 多選時可一次解散多個圖檔。',
    '新增 下載 LightBurn 記錄檔選項。',
  ],
  changed: [
    '變更 beamo II 預設參數，並將木材拆分為合板與實木，新增有膜壓克力。',
    '變更 beamo II 相機韌體 6.5.3 以上不再執行低解析度預熱拍攝，加快全區預覽。',
    '變更 Windows 與網頁版圖示，與新版 macOS 圖示一致。',
  ],
  fixed: [
    '修正 轉換或匯出點陣圖時未依圖層 DPI 取樣，導致解析度不足的問題。',
    '修正 裁切路徑後鏤空區域被填滿的問題。',
    '修正 新版韌體下儀表板相機畫面空白的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added FLUX 101, an in-app beginner course with progress tracking, badges, and AI credit rewards.',
    'Added Snap to Object Center: snap designs to objects detected in the camera preview while moving or rotating.',
    'Added an AI contour detection engine for Auto Fit (toggle in Settings > Camera).',
    'Added disassembling multiple selected imported SVGs at once.',
    'Added a LightBurn log download option.',
  ],
  changed: [
    'Updated beamo II presets, split Wood into Plywood and Solid Wood, and added Acrylic (With Film).',
    'Skipped the low-resolution warm-up capture on beamo II camera firmware 6.5.3 or later for faster full-area preview.',
    'Updated the Windows and web icons to match the new macOS icon.',
  ],
  fixed: [
    'Fixed converted and exported bitmaps not being rasterized at the layer DPI.',
    'Fixed holes being filled after clipping paths.',
    'Fixed blank dashboard camera view on newer firmware.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
