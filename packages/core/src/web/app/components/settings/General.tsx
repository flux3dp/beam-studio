import * as React from 'react';

import SelectControl from '@core/app/components/settings/SelectControl';
import i18n from '@core/helpers/i18n';
import type { StorageKey } from '@core/interfaces/IStorage';

interface Props {
  changeActiveLang: (val: string) => void;
  isWeb: boolean;
  notificationOptions: Array<{ label: string; selected: boolean; value: any }>;
  supportedLangs: { [key: string]: string };
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function General({
  changeActiveLang,
  isWeb,
  notificationOptions,
  supportedLangs,
  updateConfigChange,
}: Props): React.JSX.Element {
  const { lang } = i18n;

  return (
    <>
      <div className="subtitle">{lang.settings.groups.general}</div>
      <SelectControl
        id="select-lang"
        label={lang.settings.language}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => changeActiveLang(e.currentTarget.value)}
        options={Object.keys(supportedLangs).map((l) => ({
          label: supportedLangs[l],
          selected: l === i18n.getActiveLang(),
          value: l,
        }))}
      />
      {isWeb ? null : (
        <SelectControl
          id="set-notifications"
          label={lang.settings.notifications}
          onChange={(e) => updateConfigChange('notification', e.target.value)}
          options={notificationOptions}
        />
      )}
    </>
  );
}

export default General;
