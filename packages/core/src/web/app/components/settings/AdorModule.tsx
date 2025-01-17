import React, { useCallback, useMemo } from 'react';

import Controls from 'app/components/settings/Control';
import LayerModule from 'app/constants/layer-module/layer-modules';
import layerModuleHelper from 'helpers/layer-module/layer-module-helper';
import moduleOffsets from 'app/constants/layer-module/module-offsets';
import onOffOptionFactory from 'app/components/settings/onOffOptionFactory';
import SelectControl from 'app/components/settings/SelectControl';
import UnitInput from 'app/widgets/Unit-Input-v2';
import useI18n from 'helpers/useI18n';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';

interface Props {
  defaultUnit: string;
  selectedModel: WorkAreaModel;
  getBeamboxPreferenceEditingValue: <T = string>(key: string) => T;
  updateBeamboxPreferenceChange: (key: string, newVal: any) => void;
}

const AdorModule = ({
  defaultUnit,
  selectedModel,
  getBeamboxPreferenceEditingValue,
  updateBeamboxPreferenceChange,
}: Props): JSX.Element => {
  const lang = useI18n();

  const defaultLaserModule =
    getBeamboxPreferenceEditingValue<LayerModule>('default-laser-module') ||
    layerModuleHelper.getDefaultLaserModule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentModuleOffsets =
    getBeamboxPreferenceEditingValue<{ [m: number]: [number, number] }>('module-offsets') || {};

  const getModuleOffset = useCallback(
    (module: LayerModule) => {
      const val = currentModuleOffsets[module] || moduleOffsets[module];
      return [val[0] - moduleOffsets[module][0], val[1] - moduleOffsets[module][1]];
    },
    [currentModuleOffsets]
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
    [currentModuleOffsets, getModuleOffset, updateBeamboxPreferenceChange]
  );

  const isPrintAdvancedModeEnabled =
    getBeamboxPreferenceEditingValue<boolean>('print-advanced-mode');
  const printAdvancedModeOptions = onOffOptionFactory(isPrintAdvancedModeEnabled, { lang });

  const { workareaWidth, workareaHeight } = useMemo(() => {
    const { width, height, displayHeight } = getWorkarea(selectedModel, 'ado1');
    return { workareaWidth: width, workareaHeight: displayHeight ?? height };
  }, [selectedModel]);
  const editDefaultLaserModule = useCallback(
    (module: LayerModule) => {
      updateBeamboxPreferenceChange('default-laser-module', module);
    },
    [updateBeamboxPreferenceChange]
  );
  const defaultLaserModuleOptions = useMemo(
    () => [
      {
        value: LayerModule.LASER_10W_DIODE,
        label: lang.layer_module.laser_10w_diode,
        selected: defaultLaserModule === LayerModule.LASER_10W_DIODE,
      },
      {
        value: LayerModule.LASER_20W_DIODE,
        label: lang.layer_module.laser_20w_diode,
        selected: defaultLaserModule !== LayerModule.LASER_10W_DIODE,
      },
    ],
    [defaultLaserModule, lang]
  );
  const currentLowPower = getBeamboxPreferenceEditingValue<number>('low_power');

  return (
    <>
      <div className="subtitle">{lang.settings.groups.ador_modules}</div>
      <SelectControl
        label={lang.settings.printer_advanced_mode}
        id="print-advanced-mode"
        options={printAdvancedModeOptions}
        onChange={(e) => updateBeamboxPreferenceChange('print-advanced-mode', e.target.value)}
      />
      <SelectControl
        label={lang.settings.default_laser_module}
        id="default-laser-module"
        options={defaultLaserModuleOptions}
        onChange={(e) => editDefaultLaserModule(Number(e.target.value))}
      />
      <Controls label={lang.settings.low_laser_for_preview}>
        <UnitInput
          id="low-power"
          unit="%"
          min={0}
          max={20}
          decimal={0}
          defaultValue={currentLowPower}
          getValue={(val) => updateBeamboxPreferenceChange('low_power', val)}
          className={{ half: true }}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_10w}>
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          X
        </span>
        <UnitInput
          id="10w-laser-x-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaWidth}
          max={workareaWidth}
          defaultValue={getModuleOffset(LayerModule.LASER_10W_DIODE)[0]}
          getValue={(val) => editValue(LayerModule.LASER_10W_DIODE, 'x', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          Y
        </span>
        <UnitInput
          id="10w-laser-y-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaHeight}
          max={workareaHeight}
          defaultValue={getModuleOffset(LayerModule.LASER_10W_DIODE)[1]}
          getValue={(val) => editValue(LayerModule.LASER_10W_DIODE, 'y', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_20w}>
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          X
        </span>
        <UnitInput
          id="20w-laser-x-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaWidth}
          max={workareaWidth}
          defaultValue={getModuleOffset(LayerModule.LASER_20W_DIODE)[0]}
          getValue={(val) => editValue(LayerModule.LASER_20W_DIODE, 'x', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          Y
        </span>
        <UnitInput
          id="20w-laser-y-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaHeight}
          max={workareaHeight}
          defaultValue={getModuleOffset(LayerModule.LASER_20W_DIODE)[1]}
          getValue={(val) => editValue(LayerModule.LASER_20W_DIODE, 'y', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_printer}>
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          X
        </span>
        <UnitInput
          id="printer-x-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaWidth}
          max={workareaWidth}
          defaultValue={getModuleOffset(LayerModule.PRINTER)[0]}
          getValue={(val) => editValue(LayerModule.PRINTER, 'x', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          Y
        </span>
        <UnitInput
          id="printer-y-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaHeight}
          max={workareaHeight}
          defaultValue={getModuleOffset(LayerModule.PRINTER)[1]}
          getValue={(val) => editValue(LayerModule.PRINTER, 'y', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
      <Controls label={lang.settings.module_offset_2w_ir}>
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          X
        </span>
        <UnitInput
          id="2w-ir-laser-x-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaWidth}
          max={workareaWidth}
          defaultValue={getModuleOffset(LayerModule.LASER_1064)[0]}
          getValue={(val) => editValue(LayerModule.LASER_1064, 'x', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
        <span className="font2" style={{ marginRight: '10px', lineHeight: '32px' }}>
          Y
        </span>
        <UnitInput
          id="2w-ir-laser-y-offset"
          unit={defaultUnit === 'inches' ? 'in' : 'mm'}
          min={-workareaHeight}
          max={workareaHeight}
          defaultValue={getModuleOffset(LayerModule.LASER_1064)[1]}
          getValue={(val) => editValue(LayerModule.LASER_1064, 'y', val)}
          forceUsePropsUnit
          className={{ half: true }}
        />
      </Controls>
    </>
  );
};

export default AdorModule;
