/**
 * Central mock for locale-helper: the real module imports the ESM-only `bcp-47`
 * package, which Jest cannot parse. All region flags default to false; specs may
 * mutate them directly (reset in beforeEach).
 */
const localeHelper = {
  detectAr: () => false,
  detectAu: () => false,
  detectEu: () => false,
  detectIl: () => false,
  detectJp: () => false,
  detectKr: () => false,
  detectMy: () => false,
  detectNorthAmerica: () => false,
  detectPs: () => false,
  detectTw: () => false,
  detectTwOrHk: () => false,
  getRegion: () => ({ checkTimezone: false, region: 'other' }),
  isAr: false,
  isAu: false,
  isEu: false,
  isIl: false,
  isJp: false,
  isKr: false,
  isMy: false,
  isNorthAmerica: false,
  isPs: false,
  isTw: false,
  isTwOrHk: false,
};

export default localeHelper;
