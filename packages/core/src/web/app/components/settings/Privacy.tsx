import * as React from 'react';

import i18n from 'helpers/i18n';
import SelectControl from 'app/components/settings/SelectControl';
import { StorageKey } from 'interfaces/IStorage';

interface Props {
  enableSentryOptions: { value: any, label: string, selected: boolean }[];
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function Privacy({ enableSentryOptions, updateConfigChange }: Props): JSX.Element {
  const lang = i18n.lang;
  return (
    <>
      <div className="subtitle">{lang.settings.groups.privacy}</div>
      <SelectControl
        label={lang.settings.share_with_flux}
        id="set-sentry"
        options={enableSentryOptions}
        onChange={(e) => updateConfigChange('enable-sentry', e.target.value)}
      />
    </>
  );
}

export default Privacy;
