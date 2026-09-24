import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';

import { Button, Flex, Modal } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { boundaryDrawer } from '@core/app/actions/canvas/boundaryDrawer';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import { useStorageStore } from '@core/app/stores/storageStore';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { describeControlSocketError } from '@core/helpers/device/controlSocketError';
import type { GalvoConfig, GalvoModule, GalvoWorkarea } from '@core/helpers/device/galvoConfig';
import { galvoWorkareaOptions, getGalvoConfig, updateGalvoConfig } from '@core/helpers/device/galvoConfig';
import type { GalvoPreviewTuning } from '@core/helpers/device/galvoExec';
import { awaitGalvoResult, galvoDot, galvoFrame, galvoGoto, stopGalvo } from '@core/helpers/device/galvoExec';
import { connectGalvoHead, disconnectGalvoHead, releaseGalvoControl } from '@core/helpers/device/galvoLaserMode';
import { getModuleOffsets, updateModuleOffsetsInDevice } from '@core/helpers/device/moduleOffsets';
import deviceMaster from '@core/helpers/device-master';
import isDev from '@core/helpers/is-dev';
import { getModulesTranslations } from '@core/helpers/layer-module/layer-module-helper';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import blockStyles from './Block.module.scss';
import FieldBlock from './FieldBlock';
import GalvoAxisBlock from './GalvoAxisBlock';
import type { GalvoAction } from './GalvoManualBlock';
import GalvoManualBlock from './GalvoManualBlock';
import GalvoModuleBlock from './GalvoModuleBlock';
import GalvoNoteBlock from './GalvoNoteBlock';
import LensBlock from './LensBlock';
import type { MarkParameters } from './ParametersBlock';
import ParametersBlock from './ParametersBlock';
import styles from './PromarkSettings.module.scss';

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
  /** Which action is in flight: only that button spins, and none of the others start meanwhile. */
  const [pending, setPending] = useState<GalvoAction | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [parameters, setParameters] = useState<MarkParameters>({ power: 50, speed: 1000 });
  // Field coordinates for the manual operations, origin at the lens centre.
  const [spot, setSpot] = useState({ durationUs: 1000, x: 0, y: 0 });
  // Empty: the machine's own pacing, which is the only copy of those numbers. Preview only.
  const [tuning, setTuning] = useState<GalvoPreviewTuning>({});

  const reportError = (error: unknown, action: string) => {
    console.error(`Galvo settings: ${action} failed`, error);
    alertCaller.popUpError({ message: `${action} failed: ${describeControlSocketError(error)}` });
  };

  /**
   * Every galvo command carries the settings on screen rather than the ones on the machine, so what
   * is being looked at is what was just typed; the card takes them as an overlay on its own stored
   * values, and all fifteen go together (see toGalvoOptics).
   *
   * Each one also makes sure the head is coupled first. Asking for that when it already is costs
   * nothing -- the machine skips the move when the limit switches say the head has arrived -- which
   * is what lets any button be the first one pressed.
   */
  const run = async (action: GalvoAction, label: string, body: () => Promise<void>) => {
    // Entering the control task is refused while a job runs, and forcing it would leave the one
    // connection to the galvo card waiting on a lock the player holds until the card is restarted
    // under the running job. The same check the dialog opened with says so in words the operator
    // already knows, and offers to stop the job.
    if (!(await checkDeviceStatus(device))) return;

    setPending(action);
    try {
      await body();
    } catch (error) {
      reportError(error, label);
    } finally {
      setPending(null);
    }
  };

  const handleConnect = () => run('connect', t.connect, () => connectGalvoHead(module));

  const handleDisconnect = () => run('disconnect', 'Disconnect', disconnectGalvoHead);

  const handleMark = () =>
    run('mark', t.mark, async () => {
      await connectGalvoHead(module);
      await galvoFrame({ config, module, power: parameters.power, speed: parameters.speed });
      await awaitGalvoResult(t.mark);
    });

  /**
   * A toggle, not a one-shot: the red light keeps going round the outline until it is stopped, and
   * get_result answers `wait` for as long as it does, so there is nothing to wait for here.
   */
  const handlePreview = async () => {
    if (isPreviewing) {
      setPending('preview');
      try {
        await stopGalvo();
        setIsPreviewing(false);
      } catch (error) {
        reportError(error, tGlobal.preview);
      } finally {
        setPending(null);
      }

      return;
    }

    await run('preview', tGlobal.preview, async () => {
      await connectGalvoHead(module);
      await galvoFrame({ config, module, power: 0, preview: true, speed: parameters.speed, tuning });
      setIsPreviewing(true);
    });
  };

  const handleMove = () =>
    run('move', 'Move', async () => {
      await connectGalvoHead(module);
      await galvoGoto({ config, module, x: spot.x, y: spot.y });
      await awaitGalvoResult('Move');
    });

  const handleDot = () =>
    run('dot', 'Dot', async () => {
      await connectGalvoHead(module);
      await galvoDot({
        config,
        durationUs: spot.durationUs,
        module,
        points: [{ x: spot.x, y: spot.y }],
        power: parameters.power,
      });
      await awaitGalvoResult('Dot');
    });

  /**
   * The control task restores the red light on its own way out, following the machine's setting,
   * so leaving the mode is the whole of the tidying up.
   */
  const release = async () => {
    if (deviceMaster.currentControlMode === 'control_task') await releaseGalvoControl();
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

    await release();
    onClose();
  };

  const handleCancel = async () => {
    await release();
    onClose();
  };

  const footer = (
    <Flex align="center" justify="space-between">
      <Flex align="center" gap={8}>
        {/* Both couple the head themselves, so there is nothing to press first. */}
        <Button
          className={styles.button}
          disabled={pending !== null && pending !== 'preview'}
          loading={pending === 'preview'}
          onClick={handlePreview}
          type={isPreviewing ? 'primary' : 'default'}
        >
          {isPreviewing ? tGlobal.stop : tGlobal.preview}
        </Button>
        <Button
          className={styles.button}
          disabled={pending !== null || isPreviewing}
          loading={pending === 'mark'}
          onClick={handleMark}
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
        <GalvoModuleBlock
          focusHeight={config.focusHeight}
          isInch={isInch}
          offsets={offsets}
          onFocusHeightChange={(value) => update('focusHeight', value)}
          onOffsetsChange={setOffsets}
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
        {isDev() && <GalvoAxisBlock field={config.field} setField={setFieldValue} />}
        {isDev() && <GalvoNoteBlock />}
        <Flex align="center" className={blockStyles['full-row']} gap={8} justify="space-between">
          <div className={blockStyles.title}>{t.mark_parameters}</div>
          <ParametersBlock isInch={isInch} parameters={parameters} setParameters={setParameters} />
        </Flex>
        {isDev() && (
          <GalvoManualBlock
            isInch={isInch}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onDot={handleDot}
            onMove={handleMove}
            pending={isPreviewing ? 'preview' : pending}
            reach={config.workarea / 2}
            setSpot={setSpot}
            setTuning={setTuning}
            spot={spot}
            tuning={tuning}
          />
        )}
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
