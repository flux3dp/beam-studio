import * as React from 'react';

import i18n from 'helpers/i18n';
import SelectControl from 'app/components/settings/SelectControl';
import { StorageKey } from 'interfaces/IStorage';

interface Props {
  isWeb: boolean;
  updateNotificationOptions: { value: any, label: string, selected: boolean, }[];
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function Update({ isWeb, updateNotificationOptions, updateConfigChange }: Props): JSX.Element {
  if (isWeb) return null;
  const { lang } = i18n;
  return (
    <>
      <div className="subtitle">{lang.settings.groups.update}</div>
      <SelectControl
        id="set-auto-update"
        label={lang.settings.check_updates}
        options={updateNotificationOptions}
        onChange={(e) => updateConfigChange('auto_check_update', e.target.value)}
      />
    </>
  );
}

export default Update;
