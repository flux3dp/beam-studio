import { HELP_CENTER_URLS } from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';

const translateErrorMessage = (origMessage: null | string): { code: null | string; link?: string; message: string } => {
  const t = i18n.lang.curve_engraving;

  const errorCode = origMessage ? /error#([\d]+)/.exec(origMessage)?.[1] : null;

  if (errorCode) {
    let link = HELP_CENTER_URLS[errorCode];

    if (i18n.getActiveLang() === 'zh-tw') link = link?.replace('en-us', 'zh-tw');

    return { code: errorCode, link, message: `#${errorCode} ${t[errorCode as keyof typeof t]}` };
  } else if (origMessage?.includes('object over range')) {
    return { code: null, message: t.err_object_over_range };
  }

  return { code: null, message: origMessage ?? 'Unknown error' };
};

export default translateErrorMessage;
