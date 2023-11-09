import { IChangeLog } from 'interfaces/IChangeLog';

// 2.2.11-alpha
const CHANGES_TW = {
  added: [
    '新增偏好設定 Ador 模組「預設雷射模組」。',
    '新增切換模組、合併圖層時的提示訊息。',
    '新增在非 Ador 工作範圍讀取 Ador 檔案時的提示訊息。',
  ],
  fixed: [
    '修正 Ador「走外框」功能。',
    '修正 Ador 校正工作時的對焦文字敘述。',
  ],
  changed: [
    '調整列印圖層 Multipass 的範圍',
  ],
};

const CHANGES_EN = {
  added: [
    'Added preference setting for Ador module "Default Laser Module".',
    'Added message when switching modules or merging layers.',
    'Added message when loading Ador workarea file when workarea is not Ador.',
  ],
  fixed: [
    'Fixed Ador "Frame" function.',
    'Fixed Ador calibration focus text.',
  ],
  changed: [
    'Changed the range of layer "Multipass".',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
