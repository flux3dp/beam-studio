import type { Schema } from 'bcp-47';
import { parse } from 'bcp-47';

function detectLocale(
  bcp47Predicate: (schema: Schema) => boolean,
  timezoneOffsetPredicate: (timezoneOffset: number) => boolean,
): () => boolean {
  return () => {
    try {
      const userLocales = navigator.languages || [
        // @ts-expect-error: Support for older browsers with userLanguage
        navigator.language || (navigator.userLanguage as string),
      ];
      const hasMatchingRegion = userLocales.some((locale) => bcp47Predicate(parse(locale)));

      return hasMatchingRegion && timezoneOffsetPredicate(new Date().getTimezoneOffset());
    } catch (e) {
      console.error('Failed to get locale', e);

      return true;
    }
  };
}

const detectNorthAmerica = detectLocale(
  (schema) => schema.region === 'US' || schema.region === 'CA',
  // UTC-10 (Hawaii) to UTC-4 (Eastern Time Zone)
  (timezoneOffset) => timezoneOffset <= 600 && timezoneOffset >= 240,
);
const isNorthAmerica = detectNorthAmerica();

const detectTw = detectLocale(
  (schema) => schema.region === 'TW',
  // UTC+8 timezone
  (timezoneOffset) => timezoneOffset === -480,
);
const isTw = detectTw();

const detectTwOrHk = detectLocale(
  (schema) => schema.region === 'TW' || schema.region === 'HK',
  // UTC+8 timezone
  (timezoneOffset) => timezoneOffset === -480,
);
const isTwOrHk = detectTwOrHk();

const detectJp = detectLocale(
  (schema) => schema.region === 'JP' || schema.language === 'ja',
  // UTC+9 timezone
  (timezoneOffset) => timezoneOffset === -540,
);
const isJp = detectJp();

// Korea
const detectKr = detectLocale(
  (schema) => schema.region === 'KR' || schema.language === 'ko',
  // UTC+9 timezone
  (timezoneOffset) => timezoneOffset === -540,
);
const isKr = detectKr();

// Palestine
const detectPs = detectLocale(
  (schema) => schema.region === 'PS' || schema.language === 'ar',
  // UTC+2 timezone
  (timezoneOffset) => timezoneOffset === -120,
);
const isPs = detectPs();

// Malaysia
const detectMy = detectLocale(
  (schema) => schema.region === 'MY' || schema.language === 'ms',
  // UTC+8 timezone
  (timezoneOffset) => timezoneOffset === -480,
);
const isMy = detectMy();

const getRegion = () => {
  if (isNorthAmerica) {
    return { checkTimezone: true, region: 'na' };
  } else if (isTwOrHk) {
    return { checkTimezone: true, region: 'TWHK' };
  } else if (isJp) {
    return { checkTimezone: true, region: 'JP' };
  } else if (isKr) {
    return { checkTimezone: true, region: 'KR' };
  } else if (isPs) {
    return { checkTimezone: true, region: 'PS' };
  } else if (isMy) {
    return { checkTimezone: true, region: 'MY' };
  }

  // @ts-expect-error: Support for older browsers with userLanguage
  const firstLang = (navigator.languages || [navigator.language || (navigator.userLanguage as string)])[0];

  if (firstLang) {
    const schema = parse(firstLang);

    if (schema.region) {
      return { checkTimezone: false, region: schema.region.toUpperCase() };
    }
  }

  return { checkTimezone: false, region: 'other' };
};

export default {
  detectJp,
  detectKr,
  detectMy,
  detectNorthAmerica,
  detectPs,
  detectTw,
  detectTwOrHk,
  getRegion,
  isJp,
  isKr,
  isMy,
  isNorthAmerica,
  isPs,
  isTw,
  isTwOrHk,
};
