import { useMemo } from 'react';

import i18n from 'helpers/i18n';
import { ILang } from 'interfaces/ILang';

const useI18n = (): ILang => {
  const activeLang = i18n.getActiveLang();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lang = useMemo(() => i18n.lang, [activeLang]);
  return lang;
};

export default useI18n;
