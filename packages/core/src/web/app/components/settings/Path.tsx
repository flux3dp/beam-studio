import React from 'react';

import SettingSwitch from '@core/app/components/settings/components/SettingSwitch';
import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';

type Props = {
  unitInputProps: Partial<SettingUnitInputProps>;
};

const Path = ({ unitInputProps }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { getConfig, getPreference, setConfig, setPreference } = useSettingStore();

  return (
    <>
      <SettingSwitch
        checked={getPreference('vector_speed_constraint')}
        id="set-vector-speed-constraint"
        label={lang.settings.vector_speed_constraint}
        onChange={(e) => setPreference('vector_speed_constraint', e)}
        url={lang.settings.help_center_urls.vector_speed_constraint}
      />
      <SettingFormItem
        id="set-loop-compensation"
        label={lang.settings.loop_compensation}
        url={lang.settings.help_center_urls.loop_compensation}
      >
        <SettingUnitInput
          {...unitInputProps}
          id="loop-input"
          max={20}
          min={0}
          onChange={(v) => setConfig('loop_compensation', Number(v) * 10)}
          value={getConfig('loop_compensation') / 10}
        />
      </SettingFormItem>
    </>
  );
};

export default Path;
