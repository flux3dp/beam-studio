import React from 'react';

import Controls from 'app/components/settings/Control';
import i18n from 'helpers/i18n';
import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import SelectControl from 'app/components/settings/SelectControl';
import UnitInput from 'app/widgets/Unit-Input-v2';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { StorageKey } from 'interfaces/IStorage';

interface Props {
  selectedModel: WorkAreaModel;
  defaultUnit: string;
  loopCompensation: number;
  getBeamboxPreferenceEditingValue: (key: string) => any;
  updateBeamboxPreferenceChange: (item_key: string, newVal: any) => void;
  updateConfigChange: (id: StorageKey, newVal: any) => void;
}

const Path = ({
  selectedModel,
  defaultUnit,
  loopCompensation,
  getBeamboxPreferenceEditingValue,
  updateBeamboxPreferenceChange,
  updateConfigChange,
}: Props): JSX.Element => {
  const { lang } = i18n;
  const workarea = getWorkarea(selectedModel);

  const vectorSpeedConstraintOptions = onOffOptionFactory(
    getBeamboxPreferenceEditingValue('vector_speed_contraint') !== false,
    { lang }
  );
  const precutSwitchOptions = onOffOptionFactory(getBeamboxPreferenceEditingValue('blade_precut'), { lang });

  return (
    <>
      <div className="subtitle">{lang.settings.groups.path}</div>
      <SelectControl
        id="set-vector-speed-contraint"
        label={lang.settings.vector_speed_constraint}
        url={lang.settings.help_center_urls.vector_speed_constraint}
        options={vectorSpeedConstraintOptions}
        onChange={(e) => updateBeamboxPreferenceChange('vector_speed_contraint', e.target.value)}
      />
      <Controls
        id="set-loop-compensation"
        label={lang.settings.loop_compensation}
        url={lang.settings.help_center_urls.loop_compensation}
      >
        <UnitInput
          id="loop-input"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={0}
          max={20}
          defaultValue={Number(loopCompensation || '0') / 10}
          getValue={(val) => updateConfigChange('loop_compensation', Number(val) * 10)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
      {i18n.getActiveLang() === 'zh-cn' ? (
        <div>
          <Controls label={lang.settings.blade_radius}>
            <UnitInput
              id="radius-input"
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
              min={0}
              max={30}
              step={0.01}
              defaultValue={getBeamboxPreferenceEditingValue('blade_radius') || 0}
              getValue={(val) => updateBeamboxPreferenceChange('blade_radius', val)}
              forceUsePropsUnit
              className={{ half: true }}
            />
          </Controls>
          <SelectControl
            id="set-blade-precut"
            label={lang.settings.blade_precut_switch}
            options={precutSwitchOptions}
            onChange={(e) => updateBeamboxPreferenceChange('blade_precut', e.target.value)}
          />
          <Controls label={lang.settings.blade_precut_position}>
            <span className="font2" style={{ marginRight: '10px' }}>
              X
            </span>
            <UnitInput
              id="precut-x-input"
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
              min={0}
              max={workarea.width}
              defaultValue={getBeamboxPreferenceEditingValue('precut_x') || 0}
              getValue={(val) => updateBeamboxPreferenceChange('precut_x', val)}
              forceUsePropsUnit
              className={{ half: true }}
            />
            <span className="font2" style={{ marginRight: '10px' }}>
              Y
            </span>
            <UnitInput
              id="precut-y-input"
              unit={defaultUnit === 'inches' ? 'in' : 'mm'}
              min={0}
              max={workarea.displayHeight ?? workarea.height}
              defaultValue={getBeamboxPreferenceEditingValue('precut_y') || 0}
              getValue={(val) => updateBeamboxPreferenceChange('precut_y', val)}
              forceUsePropsUnit
              className={{ half: true }}
            />
          </Controls>
        </div>
      ) : null}
    </>
  );
};

export default Path;
