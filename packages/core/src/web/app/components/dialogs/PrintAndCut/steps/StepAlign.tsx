import React from 'react';

import { AimOutlined, CloseCircleFilled } from '@ant-design/icons';
import { Button, Progress } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import { dpmm } from '@core/app/actions/beambox/constant';
import useI18n from '@core/helpers/useI18n';
import type { ILang } from '@core/interfaces/ILang';

import styles from '../index.module.scss';
import { usePrintAndCutStore } from '../store';
import { alignByCamera } from '../utils/align/alignByCamera';
import type { AlignProgress } from '../utils/align/alignProgress';
import { clearAlignProgress } from '../utils/align/alignProgress';
import { stopSmartMarkSweep } from '../utils/align/smartMarkSweep';
import { exceedsTolerance, getMatchTolerance } from '../utils/rigidTransform';

import ExposureControl from './ExposureControl';
import RemainingTime from './RemainingTime';

const buildMessage = (
  { current, phase, total }: AlignProgress,
  t: ILang['print_and_cut']['align_progress'],
): string => {
  // the wrap-up redetect keeps the detecting label; only the time slot marks it
  // as nearly done, so the message does not flip back and forth
  const label = match(phase)
    .with('capture', () => t.capturing)
    .with('completing', 'detect', () => t.detecting)
    .with('locate', () => t.locating)
    .with('preparing', () => t.preparing)
    .with('refine', () => t.refining)
    .exhaustive();

  return total ? `${label} ${current ?? 0}/${total}` : label;
};

const StepAlign = (): React.JSX.Element => {
  const { alert: tAlert, print_and_cut: t } = useI18n();
  const alignmentFit = usePrintAndCutStore((state) => state.alignmentFit);
  const alignProgress = usePrintAndCutStore((state) => state.alignProgress);
  const isProcessing = usePrintAndCutStore((state) => state.isProcessing);
  const markPositions = usePrintAndCutStore((state) => state.markPositions);
  const setAlignmentFit = usePrintAndCutStore((state) => state.setAlignmentFit);
  const setAlignmentTransform = usePrintAndCutStore((state) => state.setAlignmentTransform);
  const setCameraImageUrl = usePrintAndCutStore((state) => state.setCameraImageUrl);
  const setDetectedMarkCenters = usePrintAndCutStore((state) => state.setDetectedMarkCenters);
  const setIsProcessing = usePrintAndCutStore((state) => state.setIsProcessing);
  const handlePreviewAndAlign = async () => {
    // in the store so the dialog footer can block navigation while running
    setIsProcessing(true);
    // a new capture invalidates a previous alignment; the capture also clears
    // the stale background (revoking its url), so drop our reference too
    setAlignmentTransform(null);
    setAlignmentFit(null);
    setCameraImageUrl(null);
    setDetectedMarkCenters(null);
    try {
      const transform = await alignByCamera();

      if (transform) {
        const { angle, tx, ty } = transform;

        setAlignmentTransform({ angle, tx, ty });
      }
    } finally {
      // ExposureControl reloads the exposure settings when this flips back
      setIsProcessing(false);
      clearAlignProgress();
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.desc}>{t.step_align_desc}</div>
      <Button block icon={<AimOutlined />} loading={isProcessing} onClick={handlePreviewAndAlign} type="primary">
        {t.preview_and_align}
      </Button>
      <ExposureControl />
      {alignmentFit && !alignProgress && (
        <div className={styles.fitInfo}>
          <span>{t.alignment.rotation}</span>
          <span>{((alignmentFit.angle * 180) / Math.PI).toFixed(2)}°</span>
          <span>{t.alignment.scale}</span>
          <span>{(alignmentFit.scale * 100).toFixed(1)}%</span>
          <span>{t.alignment.fit_error}</span>
          <span
            className={classNames({
              [styles.error]: exceedsTolerance(
                alignmentFit,
                getMatchTolerance(markPositions.map(({ cx, cy }) => ({ x: cx, y: cy }))),
              ),
            })}
          >
            {(alignmentFit.residualX / dpmm).toFixed(2)} mm / {(alignmentFit.residualY / dpmm).toFixed(2)} mm
          </span>
        </div>
      )}
      {alignProgress && (
        <div className={styles.alignProgress}>
          <Progress percent={alignProgress.percentage} showInfo={false} size="small" status="active" />
          <div className={styles.desc}>{buildMessage(alignProgress, t.align_progress)}</div>
          <RemainingTime phase={alignProgress.phase} remainingSeconds={alignProgress.remainingSeconds} />
          {alignProgress.stoppable && (
            <Button block danger icon={<CloseCircleFilled />} onClick={stopSmartMarkSweep}>
              {tAlert.stop}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default StepAlign;
