import React, { useState } from 'react';

import { Button, Flex, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { useStorageStore } from '@core/app/stores/storageStore';
import checkDeviceStatus from '@core/helpers/check-device-status';
import type { GalvoConfig, GalvoModule } from '@core/helpers/device/galvoConfig';
import { galvoWorkareaOptions, getGalvoConfig, updateGalvoConfig } from '@core/helpers/device/galvoConfig';
import deviceMaster from '@core/helpers/device-master';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import FieldBlock from './FieldBlock';
import LensBlock from './LensBlock';
import styles from './PromarkSettings.module.scss';
import RedDotBlock from './RedDotBlock';

interface Props {
  initData: GalvoConfig;
  module: GalvoModule;
  onClose: () => void;
}

/**
 * Settings of one galvo module head.
 *
 * Unlike Promark's dialog this one has no preview or mark: those drive the galvo controller live,
 * which the fluxghost control socket cannot do yet. Everything here is stored on the machine and
 * applied when a task runs.
 */
export const GalvoSettings = ({ initData, module, onClose }: Props): React.JSX.Element => {
  const { global: tGlobal, promark_settings: t } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const [config, setConfig] = useState<GalvoConfig>(initData);
  const update = <K extends keyof GalvoConfig>(key: K, value: GalvoConfig[K]) =>
    setConfig((cur) => ({ ...cur, [key]: value }));

  const handleSave = async () => {
    await updateGalvoConfig(module, config);
    onClose();
  };

  const footer = (
    <Flex align="center" gap={8} justify="flex-end">
      <Button className={styles.button} onClick={onClose}>
        {tGlobal.cancel}
      </Button>
      <Button className={styles.button} onClick={handleSave} type="primary">
        {tGlobal.save}
      </Button>
    </Flex>
  );

  return (
    <Modal
      centered
      footer={footer}
      keyboard={false}
      maskClosable={false}
      onCancel={onClose}
      open
      title={sprintf('%s (%s)', t.title, getModulesTranslations()[module])}
      width={620}
    >
      <div className={styles.container}>
        <FieldBlock
          field={config.field}
          focusHeight={config.focusHeight}
          hideOffsets
          isInch={isInch}
          onFocusHeightChange={(value) => update('focusHeight', value)}
          onWidthChange={(value) => update('workarea', value)}
          setField={(value) =>
            setConfig((cur) => ({ ...cur, field: typeof value === 'function' ? value(cur.field) : value }))
          }
          width={config.workarea}
          widthOptions={galvoWorkareaOptions}
        />
        <RedDotBlock
          isInch={isInch}
          redDot={config.redDot}
          setRedDot={(value) =>
            setConfig((cur) => ({ ...cur, redDot: typeof value === 'function' ? value(cur.redDot) : value }))
          }
        />
        <LensBlock
          data={config.galvoParameters}
          setData={(value) =>
            setConfig((cur) => ({
              ...cur,
              galvoParameters: typeof value === 'function' ? value(cur.galvoParameters) : value,
            }))
          }
        />
      </div>
    </Modal>
  );
};

export const showGalvoSettings = async (device: IDeviceInfo, module: GalvoModule): Promise<void> => {
  const res = await deviceMaster.select(device);

  if (!res.success) return;

  if (!(await checkDeviceStatus(device))) return;

  const id = `galvo-settings-${module}`;

  if (isIdExist(id)) return;

  // read past the cache: the machine is the only source of truth for these
  const initData = await getGalvoConfig(module, { useCache: false });

  addDialogComponent(id, <GalvoSettings initData={initData} module={module} onClose={() => popDialogById(id)} />);
};

export default GalvoSettings;
