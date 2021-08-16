import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '新增雕刻工作路徑預覽功能。\n- 預覽雕刻工作的路徑規劃。\n- 支援中途雕刻。\n- 估算出光與雷射頭行程時間。',
    '文字功能全面支援跟隨曲線路徑。\n- 自訂文字路徑偏移值。\n- 提供文字對齊路徑頂部、中線與底部功能。\n- 文字與路徑個別填充功能。',
    '新增幾何圖形轉換為路徑功能。',
    '針對路徑物件新增編輯路徑入口。',
  ],
  fixed: [
    '修正 Windows 開啟檔案沒有記住上一次匯入的資料夾位置。',
    '修正 最佳化按紐點擊後位移的問題。',
  ],
  changed: [
    '調整漸層臨界值滑塊顏色。',
  ],
};

const CHANGES_EN = {
  added: [
    'Added the "Work Preview" function for the Beam Studio.\n- Preview the path planning of the engraving work.\n- Support to start engraving midway.\n- Estimated the laser head‘s lighting and traveling time.',
    'Fully support the "Text on Path" function.\n- Customize the "Text Offset" value on the path.\n- Provides the top, middle, and bottom alignment of the text path.\n- Infill the text or shape individually.',
    'Added the Shape convert to Path function.',
    'Added the "Edit Path" entrance for the path object.',
  ],
  fixed: [
    'Fixed the recent path of the file import dialog for Windows.',
    'Fixed the Arrange button offset problem after clicked it for Windows.',
  ],
  changed: [
    'Change the Threshold brightness slider color.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
