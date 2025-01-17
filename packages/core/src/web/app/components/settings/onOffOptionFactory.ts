import i18n from 'helpers/i18n';
import { ILang } from 'interfaces/ILang';
import { OptionValues } from 'app/constants/enums';

const onOffOptionFactory = <T = OptionValues>(
  isOnSelected: boolean,
  opts?: { onValue?: T; offValue?: T; onLabel?: string; offLabel?: string; lang?: ILang }
): { value: T; label: string; selected: boolean }[] => {
  const { onValue, offValue, onLabel, offLabel, lang = i18n.lang } = opts ?? {};

  return [
    {
      value: (onValue ?? OptionValues.TRUE) as T,
      label: onLabel || lang?.settings.on || 'On',
      selected: isOnSelected,
    },
    {
      value: (offValue ?? OptionValues.FALSE) as T,
      label: offLabel || lang?.settings.off || 'Off',
      selected: !isOnSelected,
    },
  ];
};

export default onOffOptionFactory;
