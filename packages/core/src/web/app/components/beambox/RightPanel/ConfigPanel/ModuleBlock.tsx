import React, { memo, useMemo } from 'react';

import { pipe } from 'remeda';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import useLayerStore from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import Select from '@core/app/widgets/AntdSelect';
import { useSupportedModules } from '@core/helpers/hooks/useSupportedModules';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { useFalse } from '@core/helpers/is-dev';
import { changeLayersModule } from '@core/helpers/layer-module/change-module';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ModuleBlock.module.scss';

const ModuleBlock = (): React.ReactNode => {
  const isTablet = useFalse();
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    layer_module: tModule,
  } = useI18n();
  const { module } = useConfigPanelStore();
  const selectedLayers = useLayerStore((state) => state.selectedLayers);
  const { value } = module;
  const workarea = useWorkarea();
  const supportedModules = useSupportedModules(workarea);
  const layers = useMemo(
    () =>
      supportedModules.length <= 1
        ? null
        : selectedLayers.map((layerName) => layerManager.getLayerElementByName(layerName)!),
    [selectedLayers, supportedModules],
  );

  if (supportedModules.length <= 1) return null;

  const handleChange = async (newVal: LayerModuleType) =>
    changeLayersModule(layers!, value, newVal, { addToHistory: true });

  const options = pipe(
    supportedModules,
    (modules) => {
      const moduleTranslations = getModulesTranslations();

      return modules.map((value) => {
        const label = moduleTranslations[value] || tModule.unknown;

        return { label, value };
      });
    },
    (options) => options.filter(Boolean),
  );

  return (
    <div className={styles.panel}>
      <div className={styles.title}>{t.module}</div>
      <Select className={styles.select} onChange={handleChange} options={options} value={value} />
    </div>
  );
};

export default memo(ModuleBlock);
