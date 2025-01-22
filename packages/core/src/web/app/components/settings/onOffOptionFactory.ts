import { OptionValues } from '@core/app/constants/enums';
import i18n from '@core/helpers/i18n';
import type { ILang } from '@core/interfaces/ILang';

const onOffOptionFactory = <T = OptionValues>(
  isOnSelected: boolean,
  opts?: { lang?: ILang; offLabel?: string; offValue?: T; onLabel?: string; onValue?: T },
): Array<{ label: string; selected: boolean; value: T }> => {
  const { lang = i18n.lang, offLabel, offValue, onLabel, onValue } = opts ?? {};

  return [
    {
      label: onLabel || lang?.settings.on || 'On',
      selected: isOnSelected,
      value: (onValue ?? OptionValues.TRUE) as T,
    },
    {
      label: offLabel || lang?.settings.off || 'Off',
      selected: !isOnSelected,
      value: (offValue ?? OptionValues.FALSE) as T,
    },
  ];
};

export default onOffOptionFactory;
