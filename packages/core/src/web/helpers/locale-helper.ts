import { parse, Schema } from 'bcp-47';

function detectLocale(
  bcp47Predicate: (schema: Schema) => boolean,
  timezoneOffsetPredicate: (timezoneOffset: number) => boolean
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
  (timezoneOffset) => timezoneOffset <= 600 && timezoneOffset >= 240
);
const isNorthAmerica = detectNorthAmerica();

const detectTwOrHk = detectLocale(
  (schema) => schema.region === 'TW' || schema.region === 'HK',
  // UTC+8 timezone
  (timezoneOffset) => timezoneOffset === -480
);
const isTwOrHk = detectTwOrHk();

const detectJp = detectLocale(
  (schema) => schema.region === 'JP' || schema.language === 'ja',
  // UTC+9 timezone
  (timezoneOffset) => timezoneOffset === -540
);
const isJp = detectJp();

export default {
  isNorthAmerica,
  detectNorthAmerica,
  isTwOrHk,
  detectTwOrHk,
  isJp,
  detectJp,
};
