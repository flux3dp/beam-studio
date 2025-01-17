/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import i18n from 'helpers/i18n';
import SelectControl from 'app/components/settings/SelectControl';
import { StorageKey } from 'interfaces/IStorage';

interface Props {
  isWeb: boolean;
  supportedLangs: { [key: string]: string };
  notificationOptions: { value: any, label: string, selected: boolean }[];
  changeActiveLang: (e: React.ChangeEvent) => void;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

function General({
  isWeb,
  supportedLangs,
  notificationOptions,
  changeActiveLang,
  updateConfigChange,
}: Props): JSX.Element {
  const { lang } = i18n;
  return (
    <>
      <div className="subtitle">{lang.settings.groups.general}</div>
      <SelectControl
        label={lang.settings.language}
        id="select-lang"
        options={Object.keys(supportedLangs).map((l) => ({
          value: l,
          label: supportedLangs[l],
          selected: l === i18n.getActiveLang(),
        }))}
        onChange={changeActiveLang}
      />
      {
        isWeb ? null
          : (
            <SelectControl
              label={lang.settings.notifications}
              id="set-notifications"
              options={notificationOptions}
              onChange={(e) => updateConfigChange('notification', e.target.value)}
            />
          )
      }
    </>
  );
}

export default General;
