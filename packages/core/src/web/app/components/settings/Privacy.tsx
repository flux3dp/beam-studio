import * as React from 'react';

import SelectControl from '@core/app/components/settings/SelectControl';
import i18n from '@core/helpers/i18n';
import type { StorageKey } from '@core/interfaces/IStorage';

interface Props {
  enableSentryOptions: Array<{ label: string; selected: boolean; value: any }>;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function Privacy({ enableSentryOptions, updateConfigChange }: Props): React.JSX.Element {
  const lang = i18n.lang;

  return (
    <>
      <div className="subtitle">{lang.settings.groups.privacy}</div>
      <SelectControl
        id="set-sentry"
        label={lang.settings.share_with_flux}
        onChange={(e) => updateConfigChange('enable-sentry', e.target.value)}
        options={enableSentryOptions}
      />
    </>
  );
}

export default Privacy;
