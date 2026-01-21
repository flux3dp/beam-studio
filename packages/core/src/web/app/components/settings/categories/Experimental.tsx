import React from 'react';

import isDev from '@core/helpers/is-dev';

import { SettingSwitch, useSettingStore } from '../shared';

function Experimental(): React.ReactNode {
  const { getPreference, setPreference } = useSettingStore();

  if (!isDev()) return null;

  return (
    <>
      <SettingSwitch
        checked={getPreference('multipass-compensation')}
        id="multipass-compensation"
        label="Multipass Compensation"
        onChange={(e) => setPreference('multipass-compensation', e)}
      />
      <SettingSwitch
        checked={getPreference('one-way-printing')}
        id="one-way-printing"
        label="One-way Printing"
        onChange={(e) => setPreference('one-way-printing', e)}
      />
    </>
  );
}

export default Experimental;
