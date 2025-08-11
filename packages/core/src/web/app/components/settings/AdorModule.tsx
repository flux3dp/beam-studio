import React, { useCallback, useMemo } from 'react';

import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import SettingUnitInput from '@core/app/components/settings/components/SettingUnitInput';
import XYItem from '@core/app/components/settings/components/XYItem';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import { getModuleOffsets, updateModuleOffsets } from '@core/helpers/device/moduleOffsets';
import useI18n from '@core/helpers/useI18n';

import SettingFormItem from './components/SettingFormItem';
import SettingSelect from './components/SettingSelect';
import styles from './Settings.module.scss';

interface Props {
  unitInputProps: Partial<SettingUnitInputProps>;
}

const targetWorkarea: WorkAreaModel = 'ado1';

const AdorModule = ({ unitInputProps }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();
  const commonProps = useMemo(() => {
    const { displayHeight, height, width } = getWorkarea(targetWorkarea);
    const workareaHeight = displayHeight ?? height;

    return { maxX: width, maxY: workareaHeight, minX: -width, minY: -workareaHeight, unitInputProps };
  }, [unitInputProps]);

  const currentModuleOffsets = getPreference('module-offsets');
  const getModuleOffset = useCallback(
    (module: LayerModuleType) =>
      getModuleOffsets({
        isRelative: true,
        module,
        offsets: currentModuleOffsets,
        workarea: targetWorkarea,
      }) as [number, number],
    [currentModuleOffsets],
  );
  const editModuleOffsets = useCallback(
    (module: LayerModuleType, axis: 'x' | 'y', value: number) => {
      const curVal = getModuleOffset(module);
      const newOffsets = updateModuleOffsets(axis === 'x' ? [value, curVal[1]] : [curVal[0], value], {
        isRelative: true,
        module,
        offsets: currentModuleOffsets,
        shouldWrite: false,
        workarea: targetWorkarea,
      });

      setPreference('module-offsets', newOffsets);
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
      <div className={styles.subtitle}>{lang.settings.groups.ador_modules}</div>
      <SettingSelect
        defaultValue={getPreference('default-laser-module')}
        id="default-laser-module"
        label={lang.settings.default_laser_module}
        onChange={(e) => setPreference('default-laser-module', e)}
        options={defaultLaserModuleOptions}
      />
      <SettingFormItem id="set-low-power" label={lang.settings.low_laser_for_preview}>
        <SettingUnitInput
          id="low-power"
          max={20}
          min={0}
          onChange={(val) => {
            if (val !== null) setPreference('low_power', val);
          }}
          precision={0}
          unit="%"
          value={getPreference('low_power')}
        />
      </SettingFormItem>
      <XYItem
        {...commonProps}
        id="10w-laser-offset"
        label={lang.settings.module_offset_10w}
        onChange={(axis, val) => editModuleOffsets(LayerModule.LASER_10W_DIODE, axis, val)}
        tooltip={lang.settings.engraving_offset_tooltip}
        values={getModuleOffset(LayerModule.LASER_10W_DIODE)}
      />
      <XYItem
        {...commonProps}
        id="20w-laser-offset"
        label={lang.settings.module_offset_20w}
        onChange={(axis, val) => editModuleOffsets(LayerModule.LASER_20W_DIODE, axis, val)}
        tooltip={lang.settings.engraving_offset_tooltip}
        values={getModuleOffset(LayerModule.LASER_20W_DIODE)}
      />
      <XYItem
        {...commonProps}
        id="printer-offset"
        label={lang.settings.module_offset_printer}
        onChange={(axis, val) => editModuleOffsets(LayerModule.PRINTER, axis, val)}
        tooltip={lang.settings.printing_offset_tooltip}
        values={getModuleOffset(LayerModule.PRINTER)}
      />
      <XYItem
        {...commonProps}
        id="2w-ir-laser-offset"
        label={lang.settings.module_offset_2w_ir}
        onChange={(axis, val) => editModuleOffsets(LayerModule.LASER_1064, axis, val)}
        tooltip={lang.settings.engraving_offset_tooltip}
        values={getModuleOffset(LayerModule.LASER_1064)}
      />
    </>
  );
};

export default AdorModule;
