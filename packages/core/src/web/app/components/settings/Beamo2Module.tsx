import React, { useCallback, useMemo } from 'react';

import type { SettingUnitInputProps } from '@core/app/components/settings/components/SettingUnitInput';
import XYItem from '@core/app/components/settings/components/XYItem';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useSettingStore } from '@core/app/pages/Settings/useSettingStore';
import { getModuleOffsets, updateModuleOffsets } from '@core/helpers/device/moduleOffsets';
import useI18n from '@core/helpers/useI18n';

import styles from './Settings.module.scss';

interface Props {
  unitInputProps: Partial<SettingUnitInputProps>;
}

const mockT = {
  settings: {
    groups: {
      beamo2_modules: 'beamo 2 Modules',
    },
    module_offset_4c: '4C Offset',
    module_offset_laser: 'Laser Offset',
    module_offset_uv_print: 'UV Print Offset',
    module_offset_white_ink: 'White Ink Offset',
  },
};
const targetWorkarea: WorkAreaModel = 'fbm2';

const Beamo2Module = ({ unitInputProps }: Props): React.JSX.Element => {
  const lang = useI18n();
  const { getPreference, setPreference } = useSettingStore();
  const commonProps = useMemo(() => {
    const { displayHeight, height, width } = getWorkarea(targetWorkarea);
    const workareaHeight = displayHeight ?? height;

    return {
      maxX: width,
      maxY: workareaHeight,
      minX: -width,
      minY: -workareaHeight,
      unitInputProps,
    };
  }, [unitInputProps]);
  const currentModuleOffsets = getPreference('module-offsets');
  const getModuleOffset = useCallback(
    (module: LayerModuleType) =>
      getModuleOffsets({
        module,
        offsets: currentModuleOffsets,
        useRealValue: false,
        workarea: targetWorkarea,
      }),
    [currentModuleOffsets],
  );
  const editModuleOffsets = useCallback(
    (module: LayerModuleType, axis: 'x' | 'y', value: number) => {
      const curVal = getModuleOffset(module);
      const newOffsets = updateModuleOffsets(axis === 'x' ? [value, curVal[1]] : [curVal[0], value], {
        isRealValue: false,
        module,
        offsets: currentModuleOffsets,
        shouldWrite: false,
        workarea: targetWorkarea,
      });

      setPreference('module-offsets', newOffsets);
    },
    [currentModuleOffsets, getModuleOffset, setPreference],
  );

  return (
    <>
      <div className={styles.subtitle}>{mockT.settings.groups.beamo2_modules}</div>
      <XYItem
        {...commonProps}
        id="laser-offset"
        label={mockT.settings.module_offset_laser}
        onChange={(axis, val) => editModuleOffsets(LayerModule.LASER_UNIVERSAL, axis, val)}
        values={getModuleOffset(LayerModule.LASER_UNIVERSAL)}
      />
      <XYItem
        {...commonProps}
        id="ir-laser-offset"
        label={lang.settings.module_offset_2w_ir}
        onChange={(axis, val) => editModuleOffsets(LayerModule.LASER_1064, axis, val)}
        values={getModuleOffset(LayerModule.LASER_1064)}
      />
      <XYItem
        {...commonProps}
        id="4c-offset"
        label={mockT.settings.module_offset_4c}
        onChange={(axis, val) => editModuleOffsets(LayerModule.PRINTER_4C, axis, val)}
        values={getModuleOffset(LayerModule.PRINTER_4C)}
      />
      <XYItem
        {...commonProps}
        id="white-ink-offset"
        label={mockT.settings.module_offset_white_ink}
        onChange={(axis, val) => editModuleOffsets(LayerModule.WHITE_INK, axis, val)}
        values={getModuleOffset(LayerModule.WHITE_INK)}
      />
      <XYItem
        {...commonProps}
        id="uv-print-offset"
        label={mockT.settings.module_offset_uv_print}
        onChange={(axis, val) => editModuleOffsets(LayerModule.UV_PRINT, axis, val)}
        values={getModuleOffset(LayerModule.UV_PRINT)}
      />
    </>
  );
};

export default Beamo2Module;
