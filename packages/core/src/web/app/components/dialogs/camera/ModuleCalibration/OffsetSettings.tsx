import { useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { useStorageStore } from '@core/app/stores/storageStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import { getModuleOffsets, updateModuleOffsets } from '@core/helpers/device/moduleOffsets';
import deviceMaster from '@core/helpers/device-master';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './OffsetSettings.module.scss';

interface Props {
  layerModule: LayerModuleType;
  onClose: () => void;
}

export const OffsetSettings = ({ layerModule, onClose }: Props) => {
  const { calibration: lang, global: tGlobal } = useI18n();
  // eslint-disable-next-line hooks/exhaustive-deps
  const moduleTranslations = useMemo(() => getModulesTranslations(false), [lang]);
  const moduleName = useMemo(() => moduleTranslations[layerModule], [layerModule, moduleTranslations]);
  const desc = useMemo(() => sprintf(lang.module_offset_settings_desc, moduleName), [moduleName, lang]);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const isInch = useStorageStore((state) => state.isInch);
  const { precision, step, unit } = useMemo(() => {
    if (isInch) {
      return { precision: 4, step: 0.0254, unit: 'in' };
    }

    return { precision: 2, step: 0.1, unit: 'mm' };
  }, [isInch]);

  useEffect(() => {
    getModuleOffsets({
      isRelative: true,
      module: layerModule,
      useCache: false,
      workarea: deviceMaster.currentDevice!.info.model,
    }).then((offset) => {
      console.log('Current offset for', layerModule, offset);
      setX(offset[0]);
      setY(offset[1]);
    });
  }, [layerModule]);

  const handleSave = async () => {
    try {
      progressCaller.openNonstopProgress({ id: 'saving', message: tGlobal.saving });

      const res = await updateModuleOffsets([x, y], {
        isRelative: true,
        module: layerModule,
        shouldWrite: true,
        workarea: deviceMaster.currentDevice!.info.model,
      });

      if (!res) {
        alertCaller.popUpError({ message: lang.module_offset_settings_save_failed });

        return;
      }

      onClose();
    } finally {
      progressCaller.popById('saving');
    }
  };

  return (
    <DraggableModal
      cancelText={tGlobal.cancel}
      okText={tGlobal.save}
      onCancel={onClose}
      onOk={handleSave}
      open
      title={`${moduleName} ${lang.module_offset_settings}`}
    >
      <div className={styles.desc}>{desc}</div>
      <div className={styles.container}>
        <div className={styles.controls}>
          <div className={styles.inputs}>
            <label>X</label>
            <UnitInput
              className={styles.input}
              precision={precision}
              step={step}
              unit={unit}
              unitClassName={styles.unit}
              value={x}
            />
            <label>Y</label>
            <UnitInput
              className={styles.input}
              precision={precision}
              step={step}
              unit={unit}
              unitClassName={styles.unit}
              value={y}
            />
          </div>
          <div className={styles.illustration}>
            <div>
              <div className={styles.circle} />
              CO2 {moduleTranslations[LayerModule.LASER_UNIVERSAL]}
            </div>
            <div>
              <div className={classNames(styles.circle, styles.blue)} />
              {moduleName}
            </div>
          </div>
        </div>
        <div className={styles.images}>
          <img alt="X Offset Illustration" src="core-img/calibration/module-offset-x.jpg" />
          <img alt="Y Offset Illustration" src="core-img/calibration/module-offset-y.jpg" />
        </div>
      </div>
    </DraggableModal>
  );
};

export default OffsetSettings;
