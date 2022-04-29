import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正在圖層管理面板修改參數後，雷射面板選單參數不會立即套用。',
    '修正部分德文翻譯。',
    '修正部分檔案多次點擊後位移問題。',
  ],
  changed: [
    '將「使用圖層顏色」預設值改為開。',
    '更改新手教學對焦連結。',
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed laser panel presets were not applied after editing presets in preset management panel.',
    'Fixed some Deutsch translations',
    'Fixed position shifting error after repeating selecting some objects in some files.',
  ],
  changed: [
    'Changed "Use Layer Color" default value to on.',
    'Changed "How to focus" link in tutorial.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
