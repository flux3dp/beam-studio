import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.1 beta
const CHANGES_TW = {
  added: [
    '新增 Promark 的連線穩定度測試。',
    '新增 Beambox II 在曲面雕刻工作前的負重測試 (需搭配韌體 6.0.10 或以上版本)。',
    '新增 選擇特定模式時，畫布顯示當前模式。',
  ],
  changed: [
    '改善 Promark 雕刻後邊緣焦痕。',
    '變更 偏好設定選單樣式。',
    '變更 預設參數中厚度的英吋顯示方式。',
    '變更 部分參數的多國語翻譯。',
    '變更 Beambox II 廣域雕刻預設工作區域。',
    '變更 廣域雕刻中輔助標記的上限設定。',
    '變更 相機預覽曝光值範圍。',
  ],
  fixed: [
    '修正 Promark 的暫停功能異常。',
    '修正 Promark 在起始點沒有正常接合的問題。',
    '修正 Promark 在儀表板進行紅光預覽後，直接開始工作時會誤用紅光畸變參數。',
    '修正 部分字型在畫布上顯示不正確。',
    '修正 部分字型在文字轉路徑 2.0 結果不正確。',
    '修正 開啟路徑計算加速時的相關問題。',
    '修正 連續選取物件時，在物件面板輸入相同數值，變更未正確套用的問題。',
    '修正 部分電腦可能無法正確讀取 DXF 檔案的問題。',
    '修正 Adobe Illustrator 擴充功能無法正常使用的問題。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added load test before curved engraving for Beambox II (requires firmware version 6.0.10 or above).',
    'Added canvas display of the current mode when selecting a specific mode.',
  ],
  changed: [
    'Changed the style of the Preferences menu.',
    'Changed the inch display format for thickness in default parameters.',
    'Changed multilingual translations for some parameters.',
    'Changed the default work area height for Passthrough engraving in Beambox II.',
    'Changed the upper limit setting for guide mark in Passthrough engraving.',
    'Changed the exposure value range for Ador camera preview.',
  ],
  fixed: [
    'Fixed incorrect display of certain fonts on the canvas.',
    'Fixed incorrect results for some fonts in Text to Path converter 2.0.',
    'Fixed issues related to enabling path calculation acceleration.',
    'Fixed an issue where changing values in the object panel while continuously selecting objects did not apply correctly.',
    'Fixed an issue where DXF files might not be read correctly on some computers.',
    'Fixed an issue where the Adobe Illustrator extension could not function properly.',
  ],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
