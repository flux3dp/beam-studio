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

  console.debug('Beamo2Module', commonProps);

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

  return (
    <>
      <div className={styles.subtitle}>{lang.settings.groups.beamo2_modules}</div>
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
        label={lang.settings.module_offset_4c}
        onChange={(axis, val) => editModuleOffsets(LayerModule.PRINTER_4C, axis, val)}
        values={getModuleOffset(LayerModule.PRINTER_4C)}
      />
      <XYItem
        {...commonProps}
        id="uv-white-ink-offset"
        label={lang.settings.module_offset_uv_white_ink}
        onChange={(axis, val) => editModuleOffsets(LayerModule.UV_WHITE_INK, axis, val)}
        values={getModuleOffset(LayerModule.UV_WHITE_INK)}
      />
      <XYItem
        {...commonProps}
        id="uv-varnish-offset"
        label={lang.settings.module_offset_uv_varnish}
        onChange={(axis, val) => editModuleOffsets(LayerModule.UV_VARNISH, axis, val)}
        values={getModuleOffset(LayerModule.UV_VARNISH)}
      />
    </>
  );
};

export default Beamo2Module;
