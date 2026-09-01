import { getActiveLang } from '@core/helpers/i18n';

/**
 * The app's i18n codes are historical and not all of them are valid BCP-47 tags for the
 * language they actually mean — `kr` is Kanuri (Korean is `ko`), `se` is Northern Sami
 * (Swedish is `sv`) — plus the Chinese variants need the canonical uppercase region subtag.
 *
 * Anything handing the active language to a standards-aware consumer (Intl, dayjs, HTTP
 * Accept-Language, a backend that validates language tags) must translate through here.
 * Fixing the app codes themselves is a separate migration: `active-lang` is persisted on
 * every install, so renaming them needs a storage migration and a backend that accepts both.
 */
export const LOCALE_OVERRIDES: Record<string, string> = {
  kr: 'ko',
  se: 'sv',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
};

/** Canonical BCP-47 tag for an app language code (defaults to the active language) */
export const toBcp47 = (lang: string = getActiveLang()): string => LOCALE_OVERRIDES[lang] ?? lang;

/**
 * Keys to try, in priority order, when reading a value that is *keyed by language* and may
 * have been authored with either the app code or the canonical tag (e.g. cloud payloads).
 * Tolerating both decouples such data from the historical codes, so correcting them later
 * needs no coordinated client/server release.
 */
export const getLocaleLookupKeys = (lang: string = getActiveLang()): string[] => {
  const canonical = toBcp47(lang);

  return canonical === lang ? [lang] : [lang, canonical];
};
