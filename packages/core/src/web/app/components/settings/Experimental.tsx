import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import isDev from '@core/helpers/is-dev';

import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

function Experimental({ options }: Props): React.ReactNode {
  const getPreference = useSettingStore((state) => state.getPreference);
  const setPreference = useSettingStore((state) => state.setPreference);

  if (!isDev()) return null;

  return (
    <>
      <div className="subtitle">Experimental Features</div>
      <SettingSelect
        defaultValue={getPreference('multipass-compensation')}
        id="multipass-compensation"
        label="Multipass Compensation"
        onChange={(e) => setPreference('multipass-compensation', e)}
        options={options}
      />
      <SettingSelect
        defaultValue={getPreference('one-way-printing')}
        id="one-way-printing"
        label="One-way Printing"
        onChange={(e) => setPreference('one-way-printing', e)}
        options={options}
      />
    </>
  );
}

export default Experimental;
