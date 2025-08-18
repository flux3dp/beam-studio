import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import XYItem from '@core/app/components/settings/components/XYItem';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';
import styles from './Settings.module.scss';

type Props = {
  options: DefaultOptionType[];
  unitInputProps: Partial<SettingUnitInputProps>;
};

const Path = ({ options, unitInputProps }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { getConfig, getPreference, setConfig, setPreference } = useSettingStore();

  const selectedModel = getPreference('model');
  const workarea = getWorkarea(selectedModel);

  return (
    <>
      <div className={styles.subtitle}>{lang.settings.groups.path}</div>
      <SettingSelect
        defaultValue={getPreference('vector_speed_constraint')}
        id="set-vector-speed-constraint"
        label={lang.settings.vector_speed_constraint}
        onChange={(e) => setPreference('vector_speed_constraint', e)}
        options={options}
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
      {i18n.getActiveLang() === 'zh-cn' ? (
        <div>
          <SettingFormItem id="set_blade_radius" label={lang.settings.blade_radius}>
            <SettingUnitInput
              {...unitInputProps}
              id="radius-input"
              max={30}
              min={0}
              onChange={(val) => setPreference('blade_radius', val)}
              step={(unitInputProps.step as number) * 0.1}
              value={getPreference('blade_radius')}
            />
          </SettingFormItem>
          <SettingSelect
            defaultValue={getPreference('blade_precut')}
            id="set-blade-precut"
            label={lang.settings.blade_precut_switch}
            onChange={(e) => setPreference('blade_precut', e.target.value)}
            options={options}
          />
          <XYItem
            id="set_precut_x"
            label={lang.settings.blade_precut_position}
            maxX={workarea.width}
            maxY={workarea.displayHeight ?? workarea.height}
            minX={0}
            minY={0}
            onChange={(axis, val) => setPreference(`precut_${axis}`, val)}
            unitInputProps={unitInputProps}
            values={[getPreference('precut_x'), getPreference('precut_y')]}
          />
        </div>
      ) : null}
    </>
  );
};

export default Path;
