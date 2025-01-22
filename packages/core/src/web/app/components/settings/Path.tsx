import React from 'react';

import Controls from '@core/app/components/settings/Control';
import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import i18n from '@core/helpers/i18n';
import type { StorageKey } from '@core/interfaces/IStorage';

interface Props {
  defaultUnit: string;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  loopCompensation: number;
  selectedModel: WorkAreaModel;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

const Path = ({
  defaultUnit,
  getBeamboxPreferenceEditingValue,
  loopCompensation,
  selectedModel,
  updateBeamboxPreferenceChange,
  updateConfigChange,
}: Props): React.JSX.Element => {
  const { lang } = i18n;
  const workarea = getWorkarea(selectedModel);

  const vectorSpeedConstraintOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('vector_speed_contraint') !== false,
    { lang },
  );
  const precutSwitchOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('blade_precut'), {
    lang,
  });

  return (
    <>
      <div className="subtitle">{lang.settings.groups.path}</div>
      <SelectControl
        id="set-vector-speed-contraint"
        label={lang.settings.vector_speed_constraint}
        onChange={(e) => updateBeamboxPreferenceChange('vector_speed_contraint', e.target.value)}
        options={vectorSpeedConstraintOptions}
        url={lang.settings.help_center_urls.vector_speed_constraint}
      />
      <Controls
        id="set-loop-compensation"
        label={lang.settings.loop_compensation}
        url={lang.settings.help_center_urls.loop_compensation}
      >
        <UnitInput
          className={{ half: true }}
          defaultValue={Number(loopCompensation || '0') / 10}
          forceUsePropsUnit
          getValue={(val) => updateConfigChange('loop_compensation', Number(val) * 10)}
          id="loop-input"
          max={20}
          min={0}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
      {i18n.getActiveLang() === 'zh-cn' ? (
        <div>
          <Controls label={lang.settings.blade_radius}>
            <UnitInput
              className={{ half: true }}
              defaultValue={getBeamboxPreferenceEditingValue('blade_radius') || 0}
              forceUsePropsUnit
              getValue={(val) => updateBeamboxPreferenceChange('blade_radius', val)}
              id="radius-input"
              max={30}
              min={0}
              step={0.01}
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
            />
          </Controls>
          <SelectControl
            id="set-blade-precut"
            label={lang.settings.blade_precut_switch}
            onChange={(e) => updateBeamboxPreferenceChange('blade_precut', e.target.value)}
            options={precutSwitchOptions}
          />
          <Controls label={lang.settings.blade_precut_position}>
            <span className="font2" style={{ marginRight: '10px' }}>
              X
            </span>
            <UnitInput
              className={{ half: true }}
              defaultValue={getBeamboxPreferenceEditingValue('precut_x') || 0}
              forceUsePropsUnit
              getValue={(val) => updateBeamboxPreferenceChange('precut_x', val)}
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
              defaultValue={getBeamboxPreferenceEditingValue('precut_y') || 0}
              forceUsePropsUnit
              getValue={(val) => updateBeamboxPreferenceChange('precut_y', val)}
              id="precut-y-input"
              max={workarea.displayHeight ?? workarea.height}
              min={0}
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
            />
          </Controls>
        </div>
      ) : null}
    </>
  );
};

export default Path;
