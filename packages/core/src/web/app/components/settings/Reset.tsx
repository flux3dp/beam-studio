import React from 'react';

import SettingButton from '@core/app/components/settings/components/SettingButton';
import useI18n from '@core/helpers/useI18n';

interface Props {
  onReset: () => Promise<void>;
}

const Reset = ({ onReset }: Props): React.JSX.Element => {
  const lang = useI18n();

  return <SettingButton buttonText={lang.settings.reset_now} id="reset-settings" onClick={onReset} standalone />;
};

export default Reset;
