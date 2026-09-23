import type { Dispatch, SetStateAction } from 'react';
import React, { useRef, useState } from 'react';

import { Button, Flex, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import alertConstants from '@core/app/constants/alert-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { describeControlSocketError } from '@core/helpers/device/controlSocketError';
import type { GalvoConfig, GalvoModule, GalvoWorkarea } from '@core/helpers/device/galvoConfig';
import { galvoWorkareaOptions, getGalvoConfig, updateGalvoConfig } from '@core/helpers/device/galvoConfig';
import { redLightFrameParameters, runGalvoFrame } from '@core/helpers/device/galvoFrameTask';
import { getModuleOffsets, updateModuleOffsetsInDevice } from '@core/helpers/device/moduleOffsets';
import deviceMaster from '@core/helpers/device-master';
import isDev from '@core/helpers/is-dev';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import blockStyles from './Block.module.scss';
import FieldBlock from './FieldBlock';
import GalvoAxisBlock from './GalvoAxisBlock';
import GalvoModuleBlock from './GalvoModuleBlock';
import GalvoNoteBlock from './GalvoNoteBlock';
import LensBlock from './LensBlock';
import type { MarkParameters } from './ParametersBlock';
import ParametersBlock from './ParametersBlock';
import styles from './PromarkSettings.module.scss';
import RedDotBlock from './RedDotBlock';

interface Props {
  device: IDeviceInfo;
  initData: GalvoConfig;
  /** the head's position relative to the nozzle, read from toolhead_shift */
  initOffsets: { x: number; y: number };
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
export const GalvoSettings = ({ device, initData, initOffsets, module, onClose }: Props): React.JSX.Element => {
  const { global: tGlobal, promark_settings: t, topbar: tTopbar } = useI18n();
  const isInch = useStorageStore((state) => state.isInch);
  const [config, setConfig] = useState<GalvoConfig>(initData);
  // Kept apart from config: the head's offset lives in toolhead_shift, shared with module
  // calibration and the canvas boundary, not in this head's galvo config.
  const [offsets, setOffsets] = useState(initOffsets);
  // The galvo only reaches its own field, so nothing may fire or trace until the head is connected
  // to the nozzle and the operator has parked the gantry where they want the field.
  const [isConnected, setIsConnected] = useState(false);
  const [redLight, setRedLight] = useState(false);
  const [isFraming, setIsFraming] = useState(false);
  const [parameters, setParameters] = useState<MarkParameters>({ power: 50, speed: 1000 });
  const initialRedLight = useRef<boolean | null>(null);

  const reportError = (error: unknown, action: string) => {
    console.error(`Galvo settings: ${action} failed`, error);
    alertCaller.popUpError({ message: `${action} failed: ${describeControlSocketError(error)}` });
  };

  const setRedLightOn = async (on: boolean) => {
    try {
      if (deviceMaster.currentControlMode !== 'raw') await deviceMaster.enterRawMode();

      await deviceMaster.rawSetRedLight(on);
      setRedLight(on);
    } catch (error) {
      reportError(error, 'Red light');
    }
  };

  // TODO: dev only. The connect command is not wired up here yet, so the operator is asked to
  // confirm the head is already connected. The prompt is left untranslated on purpose: it goes
  // away with the placeholder.
  const handleConnect = () => {
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: t.connect,
      id: 'galvo-connect',
      message: '請確保已處於串聯狀態，並將龍門移動到要測試的位置。',
      onConfirm: async () => {
        setIsConnected(true);

        if (initialRedLight.current === null) initialRedLight.current = false;

        await setRedLightOn(true);
      },
    });
  };

  const runFrame = async (action: string, { power, speed }: MarkParameters) => {
    setIsFraming(true);
    try {
      await runGalvoFrame({ model: device.model, module, power, speed, width: config.workarea });
    } catch (error) {
      reportError(error, action);
    } finally {
      setIsFraming(false);
    }
  };

  const restoreRedLight = async () => {
    if (initialRedLight.current === null || redLight === initialRedLight.current) return;

    await setRedLightOn(initialRedLight.current);
  };
  const update = <K extends keyof GalvoConfig>(key: K, value: GalvoConfig[K]) =>
    setConfig((cur) => ({ ...cur, [key]: value }));
  const setFieldValue: Dispatch<SetStateAction<GalvoConfig['field']>> = (value) =>
    setConfig((cur) => ({ ...cur, field: typeof value === 'function' ? value(cur.field) : value }));

  const handleSave = async () => {
    try {
      await updateGalvoConfig(module, config);
      await updateModuleOffsetsInDevice([offsets.x, offsets.y], { module, workarea: device.model });
    } catch (error) {
      reportError(error, 'Save');

      return;
    }

    // Both the module offset and the field lens size feed the canvas boundary, and neither write
    // redraws it on its own.
    boundaryDrawer.update();

    await restoreRedLight();
    onClose();
  };

  const handleCancel = async () => {
    await restoreRedLight();
    onClose();
  };

  const footer = (
    <Flex align="center" justify="space-between">
      <Flex align="center" gap={8}>
        <Button className={styles.button} disabled={isConnected} onClick={handleConnect}>
          {t.connect}
        </Button>
        <Button
          className={styles.button}
          disabled={!isConnected || isFraming}
          onClick={() => runFrame('Red light trace', redLightFrameParameters)}
        >
          {tGlobal.preview}
        </Button>
        <Button
          className={styles.button}
          disabled={!isConnected || isFraming}
          onClick={() => runFrame('Mark', parameters)}
        >
          {t.mark}
        </Button>
      </Flex>
      <Flex align="center" gap={8}>
        <Button className={styles.button} onClick={handleCancel}>
          {tGlobal.cancel}
        </Button>
        <Button className={styles.button} onClick={handleSave} type="primary">
          {tGlobal.save}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Modal
      centered
      className={styles.scrollable}
      footer={footer}
      keyboard={false}
      maskClosable={false}
      onCancel={handleCancel}
      open
      title={sprintf(tTopbar.menu.galvo_settings, getModulesTranslations()[module])}
      width={620}
    >
      <div className={styles.container}>
        <FieldBlock
          field={config.field}
          isInch={isInch}
          onWidthChange={(value) => update('workarea', value as GalvoWorkarea)}
          setField={setFieldValue}
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
        <GalvoModuleBlock
          focusHeight={config.focusHeight}
          isInch={isInch}
          offsets={offsets}
          onFocusHeightChange={(value) => update('focusHeight', value)}
          onOffsetsChange={setOffsets}
        />
        {isDev() && <GalvoAxisBlock field={config.field} setField={setFieldValue} />}
        {isDev() && <GalvoNoteBlock />}
        <Flex align="center" className={blockStyles['full-row']} gap={8} justify="space-between">
          <div className={blockStyles.title}>{t.mark_parameters}</div>
          <ParametersBlock isInch={isInch} parameters={parameters} setParameters={setParameters} />
        </Flex>
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

  // read past the caches: the machine is the only source of truth for both of these
  const initData = await getGalvoConfig(module, { useCache: false });
  const [offsetX, offsetY] = await getModuleOffsets({ module, useCache: false, workarea: device.model });

  addDialogComponent(
    id,
    <GalvoSettings
      device={device}
      initData={initData}
      initOffsets={{ x: offsetX, y: offsetY }}
      module={module}
      onClose={() => popDialogById(id)}
    />,
  );
};

export default GalvoSettings;
