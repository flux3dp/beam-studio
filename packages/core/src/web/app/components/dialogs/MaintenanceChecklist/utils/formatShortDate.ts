import type { Dayjs } from 'dayjs';

import { getActiveLang } from '@core/helpers/i18n';

/**
 * App i18n codes that are not valid BCP-47 language tags for Intl
 * (e.g. `kr` is Kanuri, `se` is Northern Sami), plus the region-qualified Chinese variants.
 */
const LOCALE_OVERRIDES: Record<string, string> = {
  kr: 'ko',
  se: 'sv',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
};

/**
 * Month + day rendered in the active language's own convention — order and month names come
 * from the locale, so it reads 'Jul 16' (en), '16 juil.' (fr), '7月16日' (ja), '16 ก.ค.' (th).
 * Using the localized month name (not a number) also avoids the ambiguous MM/DD vs DD/MM order.
 */
export const formatShortDate = (date: Dayjs): string => {
  const lang = getActiveLang();
  const locale = LOCALE_OVERRIDES[lang] ?? lang;

  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date.toDate());
  } catch {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date.toDate());
  }
};
