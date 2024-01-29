import { IChangeLog } from 'interfaces/IChangeLog';

// 2.2.15-alpha
const CHANGES_TW = {
  added: [
    '新增 非工作區域文字。',
  ],
  fixed: [
    '修正 「檢視」裡的勾選狀態。',
    '修正 多物件無法同時移動圖層。',
    '修正 勾勒輪廓時卡頓問題。',
    '修正 匯入 PDF 檔案問題。',
    '修正 匯入 SVG 檔案問題。',
    '修正 相機校正進度條顯示。',
    '修正 列印預噴區取消遮蔽後未正常復原。',
  ],
  changed: [
    '變更 物件群組邏輯。',
    '變更 Ador 最小加速度區間。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added non-workarea text.',
  ],
  fixed: [
    'Fixed check status in the View menu.',
    'Fixed the issue where multiple selected objects could not be moved to another layer.',
    'Fixed the lag issue when performing image outlining.',
    'Fixed the issue with PDF file importing.',
    'Fixed the issue with SVG file importing.',
    'Fixed the display of the camera calibration progress bar.',
    'Fixed the pre-spray area after undoing the hiding layer.',
  ],
  changed: [
    'Changed the behavior of grouping objects.',
    'Changed the minimum engraving padding for Ador.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
