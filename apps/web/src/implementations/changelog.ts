import type { IChangeLog } from '@core/interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '全新 Beam Studio 網頁版上線！專為雷射切割所設計的全平台線上服務，讓你隨處開工，樣樣輕鬆。',
    '擴大支援各式平板電腦與 Chromebook 裝置。',
    '服務不受限於 Windows、MacOS、Linux 與 Chrome OS 等作業系統版本，只要能上網都可以使用。',
    '建議使用最新版 Chrome 或是 Safari 瀏覽器開啟 Beam Studio 以取得最佳的服務相容性與使用體驗。',
  ],
  changed: [],
  fixed: [],
};

const CHANGES_EN = {
  added: [
    'The brand new Beam Studio online version launch! Design for the FLUX Laser that supported work across all platforms. Bring your ideas to life anytime, anywhere.',
    'Fully supports any tablet and Chromebook.',
    'The service is not limited to operating system versions such as Windows, macOS, Linux, and Chrome OS, as long as your device can access the Internet.',
    'We recommend using the latest Chrome or Safari browser to open the Beam Studio to get compatibility and the optimized user experience.',
  ],
  changed: [],
  fixed: [],
};

export default {
  CHANGES_EN,
  CHANGES_TW,
} as IChangeLog;
