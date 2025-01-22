import React, { useCallback, useMemo } from 'react';

import Controls from '@core/app/components/settings/Control';
import onOffOptionFactory from '@core/app/components/settings/onOffOptionFactory';
import SelectControl from '@core/app/components/settings/SelectControl';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import layerModuleHelper from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  defaultUnit: string;
  getBeamboxPreferenceEditingValue: <T = string>(key: string) => T;
  selectedModel: WorkAreaModel;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

const AdorModule = ({
  defaultUnit,
  getBeamboxPreferenceEditingValue,
  selectedModel,
  updateBeamboxPreferenceChange,
}: Props): React.JSX.Element => {
  const lang = useI18n();

  const defaultLaserModule =
    getBeamboxPreferenceEditingValue<LayerModule>('default-laser-module') || layerModuleHelper.getDefaultLaserModule();
  // eslint-disable-next-line hooks/exhaustive-deps
  const currentModuleOffsets =
    getBeamboxPreferenceEditingValue<{ [m: number]: [number, number] }>('module-offsets') || {};

  const getModuleOffset = useCallback(
    (module: LayerModule) => {
      const val = currentModuleOffsets[module] || moduleOffsets[module];

      return [val[0] - moduleOffsets[module][0], val[1] - moduleOffsets[module][1]];
    },
    [currentModuleOffsets],
  );

  const editValue = useCallback(
    (module: LayerModule, axis: 'x' | 'y', value: number) => {
      const index = axis === 'x' ? 0 : 1;
      const curVal = [...getModuleOffset(module)];

      curVal[index] = value;
      curVal[0] += moduleOffsets[module][0];
      curVal[1] += moduleOffsets[module][1];
      updateBeamboxPreferenceChange('module-offsets', {
        ...currentModuleOffsets,
        [module]: curVal,
      });
    },
    [currentModuleOffsets, getModuleOffset, updateBeamboxPreferenceChange],
  );

  const isPrintAdvancedModeEnabled = getBeamboxPreferenceEditingValue<boolean>('print-advanced-mode');
  const printAdvancedModeOptions = onOffOptionFactory(isPrintAdvancedModeEnabled, { lang });

  const { workareaHeight, workareaWidth } = useMemo(() => {
    const { displayHeight, height, width } = getWorkarea(selectedModel, 'ado1');

    return { workareaHeight: displayHeight ?? height, workareaWidth: width };
  }, [selectedModel]);
  const editDefaultLaserModule = useCallback(
    (module: LayerModule) => {
      updateBeamboxPreferenceChange('default-laser-module', module);
    },
    [updateBeamboxPreferenceChange],
  );
  const defaultLaserModuleOptions = useMemo(
    () => [
      {
        label: lang.layer_module.laser_10w_diode,
        selected: defaultLaserModule === LayerModule.LASER_10W_DIODE,
        value: LayerModule.LASER_10W_DIODE,
      },
      {
        label: lang.layer_module.laser_20w_diode,
        selected: defaultLaserModule !== LayerModule.LASER_10W_DIODE,
        value: LayerModule.LASER_20W_DIODE,
      },
    ],
    [defaultLaserModule, lang],
  );
  const currentLowPower = getBeamboxPreferenceEditingValue<number>('low_power');

  return (
    <>
      <div className="subtitle">{lang.settings.groups.ador_modules}</div>
      <SelectControl
        id="print-advanced-mode"
        label={lang.settings.printer_advanced_mode}
        onChange={(e) => updateBeamboxPreferenceChange('print-advanced-mode', e.target.value)}
        options={printAdvancedModeOptions}
      />
      <SelectControl
        id="default-laser-module"
        label={lang.settings.default_laser_module}
        onChange={(e) => editDefaultLaserModule(Number(e.target.value))}
        options={defaultLaserModuleOptions}
      />
      <Controls label={lang.settings.low_laser_for_preview}>
        <UnitInput
          className={{ half: true }}
          decimal={0}
          defaultValue={currentLowPower}
          getValue={(val) => updateBeamboxPreferenceChange('low_power', val)}
          id="low-power"
          max={20}
          min={0}
          unit="%"
        />
      </Controls>
      <Controls label={lang.settings.module_offset_10w}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_10W_DIODE)[0]}
          forceUsePropsUnit
          getValue={(val) => editValue(LayerModule.LASER_10W_DIODE, 'x', val)}
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
          getValue={(val) => editValue(LayerModule.LASER_10W_DIODE, 'y', val)}
          id="10w-laser-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_20w}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_20W_DIODE)[0]}
          forceUsePropsUnit
          getValue={(val) => editValue(LayerModule.LASER_20W_DIODE, 'x', val)}
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
          getValue={(val) => editValue(LayerModule.LASER_20W_DIODE, 'y', val)}
          id="20w-laser-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_printer}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.PRINTER)[0]}
          forceUsePropsUnit
          getValue={(val) => editValue(LayerModule.PRINTER, 'x', val)}
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
          getValue={(val) => editValue(LayerModule.PRINTER, 'y', val)}
          id="printer-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_2w_ir}>
        <span className="font2" style={{ lineHeight: '32px', marginRight: '10px' }}>
          X
        </span>
        <UnitInput
          className={{ half: true }}
          defaultValue={getModuleOffset(LayerModule.LASER_1064)[0]}
          forceUsePropsUnit
          getValue={(val) => editValue(LayerModule.LASER_1064, 'x', val)}
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
          getValue={(val) => editValue(LayerModule.LASER_1064, 'y', val)}
          id="2w-ir-laser-y-offset"
          max={workareaHeight}
          min={-workareaHeight}
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
        />
      </Controls>
    </>
  );
};

export default AdorModule;
