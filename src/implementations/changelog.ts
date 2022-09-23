import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '在說明功能表中加入 Design Market 網站連結',
    '在功率低於 10% 時加入提示文字。',
  ],
  fixed: [
    '修正某些複製的物件顏色顯示問題。',
    '修正德文版面輸出按鈕與路徑按鈕顯示問題。',
    '修正相機預覽時，有時無法正確顯示錯誤訊息。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
    'Added Design Market link in help menu.',
    'Added warning text in laser panel when power is lower than 10%.',
  ],
  fixed: [
    'Fixed color display issue of some copied elements.',
    'Fixed display issue of Go button and path preview button when language is Deutsch.',
    'Fixed error message were not displayed correctly in some situations when performing camera preview.',
  ],
  changed: [
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
