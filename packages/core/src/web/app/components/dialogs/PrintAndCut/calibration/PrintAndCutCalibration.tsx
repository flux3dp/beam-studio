import React, { useEffect, useMemo, useRef, useState } from 'react';

import { AimOutlined, CloseCircleFilled } from '@ant-design/icons';
import { Button, InputNumber, Progress } from 'antd';
import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import type { TaskProgress } from '@core/app/actions/beambox/export-funcs';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useStorageStore } from '@core/app/stores/storageStore';
import DraggableModal from '@core/app/widgets/DraggableModal';
import UnitInput from '@core/app/widgets/UnitInput';
import checkDeviceStatus from '@core/helpers/check-device-status';
import DeviceErrorHandler from '@core/helpers/device-error-handler';
import deviceMaster from '@core/helpers/device-master';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { usePrintAndCutStore } from '../store';
import { alignByCamera } from '../utils/align/alignByCamera';
import { clearAlignProgress } from '../utils/align/alignProgress';
import { stopSmartMarkSweep } from '../utils/align/smartMarkSweep';
import type { RigidTransform } from '../utils/rigidTransform';

import { exportCalibrationPdf } from './exportCalibrationPdf';
import { getCalibrationBBox, READING_MAX } from './layout';
import { measureReading } from './measureReading';
import type { PncOffset } from './offsetStore';
import { fetchPncOffset, readingToOffset, savePncOffset } from './offsetStore';
import styles from './PrintAndCutCalibration.module.scss';
import { getDefaultScratchParams, runScratchTask } from './scratchTask';

interface PrintAndCutCalibrationProps {
  device: IDeviceInfo;
  onClose: () => void;
}

const steps = ['print', 'scratch', 'reading'] as const;

/**
 * Vernier calibration of the print-and-cut offset: print a sheet of marks and
 * scales, align it by camera, scratch vernier combs against the scales, then
 * read the offset off the coinciding lines and store it for this machine.
 */
const PrintAndCutCalibration = ({ device, onClose }: PrintAndCutCalibrationProps): React.JSX.Element => {
  const {
    alert: tAlert,
    buttons: tButtons,
    print_and_cut: { calibration: t, preview_and_align: tAlign },
  } = useI18n();
  const [step, setStep] = useState<(typeof steps)[number]>('print');
  const [{ power, speed }, setParams] = useState(() => getDefaultScratchParams(device.model));
  const [transform, setTransform] = useState<null | RigidTransform>(null);
  const [scratchProgress, setScratchProgress] = useState<null | TaskProgress>(null);
  const scratchStopped = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [reading, setReading] = useState({ x: 0, y: 0 });
  const isProcessing = usePrintAndCutStore((state) => state.isProcessing);
  const alignProgress = usePrintAndCutStore((state) => state.alignProgress);
  const bbox = useMemo(getCalibrationBBox, []);
  const [currentOffset, setCurrentOffset] = useState<PncOffset>();
  const isInch = useStorageStore((state) => state.isInch);
  // the recommended line speed, or the machine's top speed where there is none
  const maxSpeed = useMemo(() => {
    const { maxSpeed: deviceMax, vectorSpeedLimit } = getWorkarea(device.model as WorkAreaModel);

    return vectorSpeedLimit ?? deviceMax;
  }, [device.model]);

  useEffect(() => {
    fetchPncOffset(device.serial).then(setCurrentOffset);
  }, [device.serial]);

  // the align pipeline reads the expected marks from the print-and-cut store
  useEffect(() => {
    usePrintAndCutStore.getState().init({ elements: [], printingContentsBBox: bbox, printingContentsElements: [] });

    return () => usePrintAndCutStore.getState().reset();
  }, [bbox]);

  const handleAlign = async () => {
    const { setIsProcessing } = usePrintAndCutStore.getState();

    setIsProcessing(true);
    setTransform(null);
    try {
      // the stored offset must not be applied: the scratch measures it
      setTransform(await alignByCamera({ applyCalibration: false }));
    } finally {
      setIsProcessing(false);
      clearAlignProgress();
    }
  };

  /** Prefill the readings from a camera capture of the scratched sheet; a failed axis keeps its value */
  const handleRead = async () => {
    if (!transform) return;

    setIsReading(true);
    try {
      const { x, y } = await measureReading(bbox, transform);

      setReading((r) => ({ x: x?.reading ?? r.x, y: y?.reading ?? r.y }));

      if (!x || !y) {
        MessageCaller.openMessage({ content: t.auto_read_failed, duration: 5, level: MessageLevel.WARNING });
      }
    } catch (error) {
      console.error('print-and-cut calibration read failed', error);
      MessageCaller.openMessage({ content: t.auto_read_failed, duration: 5, level: MessageLevel.WARNING });
    } finally {
      setIsReading(false);
    }
  };

  const handleScratch = async () => {
    if (!transform) return;

    scratchStopped.current = false;
    setScratchProgress({ message: '', percentage: 0 });
    try {
      // the discovery st_id is stale by now: a task aborted since the dialog opened leaves the
      // machine in ABORTED, which the check quits before the upload
      const { st_id: stId } = await deviceMaster.getReport();

      if (!(await checkDeviceStatus({ ...device, st_id: stId }))) return;

      const ran = await runScratchTask(
        bbox,
        transform,
        { power, speed },
        setScratchProgress,
        () => scratchStopped.current,
      );

      if (ran && !scratchStopped.current) {
        setStep('reading');
        await handleRead();
      }
    } catch (error) {
      // an aborted machine task rejects the wait with the device's error list, which is
      // empty for a plain abort (Stop here or on the machine): not a failure
      const message =
        error instanceof Error ? error.message : DeviceErrorHandler.translate(error as string | string[]);

      if (scratchStopped.current || !message) return;

      console.error('print-and-cut calibration scratch failed', error);
      alertCaller.popUpError({ message });
    } finally {
      setScratchProgress(null);
    }
  };

  const handleStopScratch = async () => {
    scratchStopped.current = true;
    try {
      await deviceMaster.stop();
      await deviceMaster.quit();
    } catch (error) {
      // nothing running yet (stop during the computation): the runner skips the upload
      console.warn('print-and-cut calibration stop', error);
    }
  };

  /** Closing mid-run stops what can be stopped: the mark sweep (a single full-area shot just finishes) and the machine task */
  const handleClose = () => {
    if (isProcessing) stopSmartMarkSweep();

    if (scratchProgress) handleStopScratch();

    onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePncOffset(device.serial, readingToOffset(reading.x, reading.y));
      onClose();
    } catch (error) {
      console.error('print-and-cut calibration save failed', error);
      alertCaller.popUpError({ message: String(error) });
    } finally {
      setIsSaving(false);
    }
  };

  const stepIndex = steps.indexOf(step);
  const isScratching = scratchProgress !== null;
  const busy = isProcessing || isScratching || isSaving || isReading;

  return (
    <DraggableModal
      footer={
        <>
          {stepIndex > 0 && (
            <Button disabled={busy} onClick={() => setStep(steps[stepIndex - 1])}>
              {tButtons.back}
            </Button>
          )}
          {match(step)
            .with('print', () => (
              <Button onClick={() => setStep('scratch')} type="primary">
                {tButtons.next}
              </Button>
            ))
            .with('scratch', () => (
              <>
                {isDev() && (
                  <Button disabled={busy} onClick={() => setStep('reading')}>
                    Skip (dev)
                  </Button>
                )}
                <Button disabled={!transform || busy} loading={isScratching} onClick={handleScratch} type="primary">
                  {t.scratch}
                </Button>
              </>
            ))
            .with('reading', () => (
              <Button disabled={busy} loading={isSaving} onClick={handleSave} type="primary">
                {tAlert.save}
              </Button>
            ))
            .exhaustive()}
        </>
      }
      maskClosable={false}
      onCancel={handleClose}
      open
      title={`${t.title} (${stepIndex + 1}/${steps.length})`}
    >
      <div className={styles.content}>
        {match(step)
          .with('print', () => (
            <>
              <div className={styles.desc}>{t.print_desc}</div>
              <Button onClick={exportCalibrationPdf}>{t.export_pdf}</Button>
            </>
          ))
          .with('scratch', () => (
            <>
              <div className={styles.desc}>{t.align_desc}</div>
              <div className={styles.row}>
                <span>{t.power}</span>
                <UnitInput
                  controls={false}
                  max={100}
                  min={0.1}
                  onChange={(v) => setParams((p) => ({ ...p, power: v ?? p.power }))}
                  precision={1}
                  unit="%"
                  unitClassName={styles.unit}
                  value={power}
                />
                <span>{t.speed}</span>
                <UnitInput
                  controls={false}
                  isInch={isInch}
                  max={maxSpeed}
                  min={1}
                  onChange={(v) => v && setParams((p) => ({ ...p, speed: v }))}
                  precision={isInch ? 2 : 1}
                  unit={isInch ? 'in/s' : 'mm/s'}
                  unitClassName={styles.unit}
                  value={speed}
                />
              </div>
              <Button block disabled={busy} icon={<AimOutlined />} loading={isProcessing} onClick={handleAlign}>
                {tAlign}
              </Button>
              {transform && !scratchProgress && <div className={styles.desc}>{t.aligned}</div>}
              {alignProgress && (
                <Progress percent={alignProgress.percentage} showInfo={false} size="small" status="active" />
              )}
              {scratchProgress && (
                <>
                  <Progress percent={scratchProgress.percentage} showInfo={false} size="small" status="active" />
                  <div className={styles.desc}>{scratchProgress.message}</div>
                  <Button block danger icon={<CloseCircleFilled />} onClick={handleStopScratch}>
                    {tAlert.stop}
                  </Button>
                </>
              )}
            </>
          ))
          .with('reading', () => (
            <>
              <div className={styles.desc}>{t.reading_desc}</div>
              <Button
                block
                disabled={!transform || busy}
                icon={<AimOutlined />}
                loading={isReading}
                onClick={handleRead}
              >
                {t.auto_read}
              </Button>
              <div className={styles.hint}>{t.auto_read_hint}</div>
              <div className={styles.row}>
                <span>{t.reading_x}</span>
                <InputNumber
                  max={READING_MAX}
                  min={-READING_MAX}
                  onChange={(v) => setReading((r) => ({ ...r, x: v ?? 0 }))}
                  precision={0}
                  value={reading.x}
                />
                <span>{t.reading_y}</span>
                <InputNumber
                  max={READING_MAX}
                  min={-READING_MAX}
                  onChange={(v) => setReading((r) => ({ ...r, y: v ?? 0 }))}
                  precision={0}
                  value={reading.y}
                />
              </div>
              {currentOffset && (
                <div className={styles.desc}>
                  {sprintf(t.current_offset, currentOffset.x.toFixed(1), currentOffset.y.toFixed(1))}
                </div>
              )}
            </>
          ))
          .exhaustive()}
      </div>
    </DraggableModal>
  );
};

export default PrintAndCutCalibration;
