import React from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

type Props = {
  options: DefaultOptionType[];
};

const Path = ({ options }: Props): React.JSX.Element => {
  const { lang } = i18n;
  const { getConfig, getPreference, setConfig, setPreference } = useSettingStore();

  const selectedModel = getPreference('model');
  const defaultUnit = getConfig('default-units');
  const workarea = getWorkarea(selectedModel);

  return (
    <>
      <div className="subtitle">{lang.settings.groups.path}</div>
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
        <UnitInput
          className={{ half: true }}
          defaultValue={getConfig('loop_compensation') / 10}
          forceUsePropsUnit
          getValue={(v) => setConfig('loop_compensation', Number(v) * 10)}
          id="loop-input"
          max={20}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      {i18n.getActiveLang() === 'zh-cn' ? (
        <div>
          <SettingFormItem id="set_blade_radius" label={lang.settings.blade_radius}>
            <UnitInput
              className={{ half: true }}
              defaultValue={getPreference('blade_radius')}
              forceUsePropsUnit
              getValue={(val) => setPreference('blade_radius', val)}
              id="radius-input"
              max={30}
              min={0}
              step={0.01}
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
            />
          </SettingFormItem>
          <SettingSelect
            defaultValue={getPreference('blade_precut')}
            id="set-blade-precut"
            label={lang.settings.blade_precut_switch}
            onChange={(e) => setPreference('blade_precut', e.target.value)}
            options={options}
          />
          <SettingFormItem id="set_precut_x" label={lang.settings.blade_precut_position}>
            <span className="font2" style={{ marginRight: '10px' }}>
              X
            </span>
            <UnitInput
              className={{ half: true }}
              defaultValue={getPreference('precut_x')}
              forceUsePropsUnit
              getValue={(val) => setPreference('precut_x', val)}
              id="precut-x-input"
              max={workarea.width}
              min={0}
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
            />
            <span className="font2" style={{ marginRight: '10px' }}>
              Y
            </span>
            <UnitInput
              className={{ half: true }}
              defaultValue={getPreference('precut_y')}
              forceUsePropsUnit
              getValue={(val) => setPreference('precut_y', val)}
              id="precut-y-input"
              max={workarea.displayHeight ?? workarea.height}
              min={0}
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
            />
          </SettingFormItem>
        </div>
      ) : null}
    </>
  );
};

export default Path;
