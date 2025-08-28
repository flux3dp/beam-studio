import React, { memo, useContext, useMemo } from 'react';

import { pipe } from 'remeda';

import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useConfigPanelStore } from '@core/app/stores/configPanel';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import Select from '@core/app/widgets/AntdSelect';
import { useSupportedModules } from '@core/helpers/hooks/useSupportedModules';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getLayerElementByName } from '@core/helpers/layer/layer-helper';
import { changeLayersModule } from '@core/helpers/layer-module/change-module';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import ConfigPanelContext from './ConfigPanelContext';
import styles from './ModuleBlock.module.scss';

const ModuleBlock = (): React.ReactNode => {
  const isMobile = useIsMobile();
  const {
    beambox: {
      right_panel: { laser_panel: t },
    },
    layer_module: tModule,
  } = useI18n();
  const { module } = useConfigPanelStore();
  const { selectedLayers } = useContext(ConfigPanelContext);
  const { value } = module;
  const workarea = useWorkarea();
  const supportedModules = useSupportedModules(workarea);
  const layers = useMemo(
    () => (supportedModules.length <= 1 ? null : selectedLayers.map((layerName) => getLayerElementByName(layerName))),
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

  return isMobile ? (
    <ObjectPanelItem.Select
      id="module"
      label={t.module}
      onChange={handleChange as any}
      options={options}
      selected={options.find((option) => option.value === value) as { label: string; value: number }}
    />
  ) : (
    <div className={styles.panel}>
      <div className={styles.title}>{t.module}</div>
      <Select className={styles.select} onChange={handleChange} options={options} value={value} />
    </div>
  );
};

export default memo(ModuleBlock);
