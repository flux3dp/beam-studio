import React, { useCallback, useMemo } from 'react';

import type { DefaultOptionType } from 'antd/es/select';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import getIsDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';

interface Props {
  options: DefaultOptionType[];
}

const AdorModule = ({ options }: Props): React.JSX.Element => {
  const lang = useI18n();
  const isDev = useMemo(() => getIsDev(), []);
  const { getConfig, getPreference, setPreference } = useSettingStore();
  const selectedModel = getPreference('model');
  const defaultUnit = getConfig('default-units');
  const { workareaHeight, workareaWidth } = useMemo(() => {
    const { displayHeight, height, width } = getWorkarea(selectedModel, 'ado1');

    return { workareaHeight: displayHeight ?? height, workareaWidth: width };
  }, [selectedModel]);

  const currentModuleOffsets = getPreference('module-offsets');
  const getModuleOffset = useCallback(
    (module: LayerModuleType) => {
      const val = currentModuleOffsets?.[module] || moduleOffsets[module];

      return [val[0] - moduleOffsets[module][0], val[1] - moduleOffsets[module][1]];
    },
    [currentModuleOffsets],
  );
  const editModuleOffsets = useCallback(
    (module: LayerModuleType, axis: 'x' | 'y', value: number) => {
      const index = axis === 'x' ? 0 : 1;
      const curVal = [...getModuleOffset(module)];

      curVal[index] = value;
      curVal[0] += moduleOffsets[module][0];
      curVal[1] += moduleOffsets[module][1];

      setPreference('module-offsets', { ...currentModuleOffsets, [module]: curVal });
    },
    [currentModuleOffsets, getModuleOffset, setPreference],
  );

  const defaultLaserModuleOptions = useMemo(
    () => [
      { label: lang.layer_module.laser_10w_diode, value: LayerModule.LASER_10W_DIODE },
      { label: lang.layer_module.laser_20w_diode, value: LayerModule.LASER_20W_DIODE },
    ],
    [lang],
  );

  return (
    <>
      <div className="subtitle">{lang.settings.groups.ador_modules}</div>
      <SettingSelect
        defaultValue={getPreference('print-advanced-mode')}
        id="print-advanced-mode"
        label={lang.settings.printer_advanced_mode}
        onChange={(e) => setPreference('print-advanced-mode', e)}
        options={options}
      />
      <SettingSelect
        defaultValue={getPreference('default-laser-module')}
        id="default-laser-module"
        label={lang.settings.default_laser_module}
        onChange={(e) => setPreference('default-laser-module', e)}
        options={defaultLaserModuleOptions}
      />
      <SettingFormItem id="set-low-power" label={lang.settings.low_laser_for_preview}>
        <UnitInput
          className={{ half: true }}
          decimal={0}
          defaultValue={getPreference('low_power')}
          getValue={(val) => setPreference('low_power', val)}
          id="low-power"
          max={20}
          min={0}
          unit="%"
        />
      </SettingFormItem>
      <SettingFormItem id="10w-laser-offset" label={lang.settings.module_offset_10w}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_10W_DIODE)[0]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.LASER_10W_DIODE, 'x', val)}
          id="10w-laser-x-offset"
          max={workareaWidth}
          min={-workareaWidth}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          Y
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_10W_DIODE)[1]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.LASER_10W_DIODE, 'y', val)}
          id="10w-laser-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      <SettingFormItem id="20w-laser-offset" label={lang.settings.module_offset_20w}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_20W_DIODE)[0]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.LASER_20W_DIODE, 'x', val)}
          id="20w-laser-x-offset"
          max={workareaWidth}
          min={-workareaWidth}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          Y
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_20W_DIODE)[1]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.LASER_20W_DIODE, 'y', val)}
          id="20w-laser-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      <SettingFormItem id="printer-offset" label={lang.settings.module_offset_printer}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.PRINTER)[0]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.PRINTER, 'x', val)}
          id="printer-x-offset"
          max={workareaWidth}
          min={-workareaWidth}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          Y
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.PRINTER)[1]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.PRINTER, 'y', val)}
          id="printer-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      <SettingFormItem id="2w-ir-laser-offset" label={lang.settings.module_offset_2w_ir}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_1064)[0]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.LASER_1064, 'x', val)}
          id="2w-ir-laser-x-offset"
          max={workareaWidth}
          min={-workareaWidth}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          Y
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_1064)[1]}
          forceUsePropsUnit
          getValue={(val) => editModuleOffsets(LayerModule.LASER_1064, 'y', val)}
          id="2w-ir-laser-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </SettingFormItem>
      {isDev && (
        <SettingFormItem id="white-ink-offset" label={lang.layer_module.uv_white_ink}>
          <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
            X
          </span>
          <UnitInput
            className={{ half: true }}
            defaultValue={getModuleOffset(LayerModule.UV_WHITE_INK)[0]}
            forceUsePropsUnit
            getValue={(val) => editModuleOffsets(LayerModule.UV_WHITE_INK, 'x', val)}
            id="white-ink-x-offset"
            max={workareaWidth}
            min={-workareaWidth}
            unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          />
          <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
            Y
          </span>
          <UnitInput
            className={{ half: true }}
            defaultValue={getModuleOffset(LayerModule.UV_WHITE_INK)[1]}
            forceUsePropsUnit
            getValue={(val) => editModuleOffsets(LayerModule.UV_WHITE_INK, 'y', val)}
            id="white-ink-y-offset"
            max={workareaHeight}
            min={-workareaHeight}
            unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          />
        </SettingFormItem>
      )}
    </>
  );
};

export default AdorModule;
