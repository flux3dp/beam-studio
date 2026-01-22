import React from 'react';

import useI18n from '@core/helpers/useI18n';

import { SettingButton } from '../shared';

interface Props {
  onReset: () => Promise<void>;
}

function Reset({ onReset }: Props): React.JSX.Element {
  const lang = useI18n();

  return <SettingButton buttonText={lang.settings.reset_now} id="reset-settings" onClick={onReset} standalone />;
}

export default Reset;
