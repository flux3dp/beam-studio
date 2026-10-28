import React, { useEffect, useMemo, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import progressCaller from '@core/app/actions/progress-caller';
import { LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import defaultModuleOffsets from '@core/app/constants/layer-module/moduleOffsets';
import { getWorkarea, type WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getAllOffsets, updateModuleOffsets } from '@core/helpers/device/moduleOffsets';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ManualConfiguration.module.scss';
import XyInputs from './XyInputs';

const PROGRESS_ID = 'manual-configuration-modules';

type Xy = { x: number; y: number };

// the laser heads themselves (and UV print, which is not a head) have no offset to tune
const NOT_OFFSET_MODULES = new Set<LayerModuleType>([
  LayerModule.LASER_UNIVERSAL,
  LayerModule.LASER_10W_DIODE,
  LayerModule.LASER_20W_DIODE,
  LayerModule.UV_PRINT,
]);

export interface ModulesTabProps {
  model: WorkAreaModel;
}

/**
 * Every offset-bearing module of the model on one tab, relative to its default like
 * ModuleCalibration/OffsetSettings. Stored on the device (fbm2, fuv1) or in the global preference.
 */
const ModulesTab = ({ model }: ModulesTabProps): React.JSX.Element => {
  const { global: tGlobal, manual_config: t } = useI18n();
  // eslint-disable-next-line hooks/exhaustive-deps
  const names = useMemo(() => getModulesTranslations(), [t]);
  const modules = useMemo(
    () => (getWorkarea(model).supportedModules ?? []).filter((module) => !NOT_OFFSET_MODULES.has(module)),
    [model],
  );
  const [stored, setStored] = useState<null | Partial<Record<LayerModuleType, Xy>>>(null); // null = loading
  const [values, setValues] = useState<Partial<Record<LayerModuleType, Xy>>>({});

  useEffect(() => {
    getAllOffsets(model, { useCache: false }).then((all) => {
      const relative: Partial<Record<LayerModuleType, Xy>> = {};

      modules.forEach((module) => {
        const [dx, dy] = defaultModuleOffsets[model]?.[module] ?? [0, 0];
        const [x, y] = all[module] ?? [dx, dy];

        relative[module] = { x: x - dx, y: y - dy };
      });
      setStored(relative);
      setValues(relative);
    });
  }, [model, modules]);

  const handleSave = async () => {
    progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tGlobal.saving });
    try {
      const changed = modules.filter(
        (module) => values[module]!.x !== stored![module]!.x || values[module]!.y !== stored![module]!.y,
      );

      for (const module of changed) {
        const { x, y } = values[module]!;
        const ok = await updateModuleOffsets([x, y], { isRelative: true, module, shouldWrite: true, workarea: model });

        if (!ok) throw new Error(`updateModuleOffsets refused ${module}`);
      }

      if (changed.length) boundaryDrawer.update();

      setStored(values);
    } catch (error) {
      console.error('manual configuration: module offset write failed', error);
      alertCaller.popUpError({ message: t.save_failed });
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
  };

  const loading = stored === null;

  return (
    <div className={styles.tab}>
      <div className={styles.desc}>{t.modules_desc}</div>
      <div className={classNames(styles.content, styles.grid)}>
        {modules.map((module) => (
          <div key={module}>
            <div className={styles.label}>{names[module]}</div>
            <XyInputs
              disabled={loading}
              onChange={(xy) => setValues((prev) => ({ ...prev, [module]: xy }))}
              value={values[module] ?? { x: 0, y: 0 }}
            />
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <Button disabled={loading} onClick={handleSave} type="primary">
          {tGlobal.save}
        </Button>
      </div>
    </div>
  );
};

export default ModulesTab;
