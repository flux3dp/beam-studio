import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.11 beta
const CHANGES_TW = {
  added: [],
  changed: [],
  fixed: ['修正 beamo II 噴墨刷新行為。'],
};

const CHANGES_EN = {
  added: [],
  changed: ['Removed offline machine serial check.'],
  fixed: [],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
