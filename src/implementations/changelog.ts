import { IChangeLog } from 'interfaces/IChangeLog';

// 2.3.0-alpha
const CHANGES_TW = {
  added: [
    '新增 訂閱制功能。',
    '新增 雲端空間。',
    '新增 盒子產生器。',
    // web font
    '新增 字體搜尋功能。',
  ],
  fixed: [],
  changed: [],
};

const CHANGES_EN = {
  added: [
    'Added FLUX+ features.',
    'Added My Cloud.',
    'Added Box generator.',
    // web font
    'Added Font family filter.',
  ],
  fixed: [],
  changed: [],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
