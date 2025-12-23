import type { IChangeLog } from '@core/interfaces/IChangeLog';

// 2.5.13
const CHANGES_TW = {
  added: [],
  changed: [],
  fixed: ['修正 一些小錯誤。'],
};

const CHANGES_EN = {
  added: [],
  changed: [],
  fixed: ['Fixed minor bugs.'],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
