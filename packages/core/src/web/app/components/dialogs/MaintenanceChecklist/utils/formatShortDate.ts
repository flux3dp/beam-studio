import type { Dayjs } from 'dayjs';

import { toBcp47 } from '@core/helpers/locale-codes';

/**
 * Month + day rendered in the active language's own convention — order and month names come
 * from the locale, so it reads 'Jul 16' (en), '16 juil.' (fr), '7月16日' (ja), '16 ก.ค.' (th).
 * Using the localized month name (not a number) also avoids the ambiguous MM/DD vs DD/MM order.
 */
export const formatShortDate = (date: Dayjs): string => {
  const locale = toBcp47();

  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date.toDate());
  } catch {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(date.toDate());
  }
};
