import * as React from 'react';

import SelectControl from '@core/app/components/settings/SelectControl';
import i18n from '@core/helpers/i18n';
import type { StorageKey } from '@core/interfaces/IStorage';

interface Props {
  isWeb: boolean;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
  updateNotificationOptions: Array<{ label: string; selected: boolean; value: any }>;
}

function Update({ isWeb, updateConfigChange, updateNotificationOptions }: Props): React.JSX.Element {
  if (isWeb) {
    return null;
  }

  const { lang } = i18n;

  return (
    <>
      <div className="subtitle">{lang.settings.groups.update}</div>
      <SelectControl
        id="set-auto-update"
        label={lang.settings.check_updates}
        onChange={(e) => updateConfigChange('auto_check_update', e.target.value)}
        options={updateNotificationOptions}
      />
    </>
  );
}

export default Update;
