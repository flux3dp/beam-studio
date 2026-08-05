import React from 'react';

import { AimOutlined } from '@ant-design/icons';
import { Button, Progress } from 'antd';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/react/shallow';

import useI18n from '@core/helpers/useI18n';
import type { ILang } from '@core/interfaces/ILang';

import styles from '../index.module.scss';
import { usePrintAndCutStore } from '../store';
import { detectAlignmentTransform } from '../utils/alignByCamera';
import type { AlignProgress } from '../utils/alignProgress';
import { clearAlignProgress } from '../utils/alignProgress';
import { captureWorkareaImage } from '../utils/captureWorkareaImage';

import ExposureControl from './ExposureControl';
import RemainingTime from './RemainingTime';

const buildMessage = (
  { current, phase, total }: AlignProgress,
  lang: ILang['print_and_cut']['align_progress'],
): string => {
  // the wrap-up redetect keeps the detecting label; only the time slot marks it
  // as nearly done, so the message does not flip back and forth
  const label = match(phase)
    .with('capture', () => lang.capturing)
    .with('completing', 'detect', () => lang.detecting)
    .with('locate', () => lang.locating)
    .with('preparing', () => lang.preparing)
    .with('refine', () => lang.refining)
    .exhaustive();

  return total ? `${label} ${current ?? 0}/${total}` : label;
};

const StepAlign = (): React.JSX.Element => {
  const { message: messageLang, print_and_cut: lang } = useI18n();
  const { alignProgress, isProcessing, markPositions, setAlignmentTransform, setCameraImageUrl, setIsProcessing } =
    usePrintAndCutStore(
      useShallow(
        ({
          alignProgress,
          isProcessing,
          markPositions,
          setAlignmentTransform,
          setCameraImageUrl,
          setIsProcessing,
        }) => ({
          alignProgress,
          isProcessing,
          markPositions,
          setAlignmentTransform,
          setCameraImageUrl,
          setIsProcessing,
        }),
      ),
    );
  const handlePreviewAndAlign = async () => {
    // in the store so the dialog footer can block navigation while running
    setIsProcessing(true);
    // a new capture invalidates a previous alignment; the capture also clears
    // the stale background (revoking its url), so drop our reference too
    setAlignmentTransform(null);
    setCameraImageUrl(null);
    try {
      // 1. capture: show the sweep progressively while the machine is still
      // capturing; the smart sweep stops early once it has found all the marks
      const capture = await captureWorkareaImage({
        expectedMarks: markPositions.map(({ cx, cy }) => ({ x: cx, y: cy })),
        onProgress: setCameraImageUrl,
      });

      if (!capture) return;

      setCameraImageUrl(capture.url);

      // 2. detect the marks, refine each with a centered retake, redetect
      const transform = await detectAlignmentTransform({
        detectedMarks: capture.detectedMarks,
        onPreviewUpdate: setCameraImageUrl,
      });

      // 3. apply
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
      <div className={styles.desc}>{lang.step_align_desc}</div>
      <Button block icon={<AimOutlined />} loading={isProcessing} onClick={handlePreviewAndAlign} type="primary">
        {lang.preview_and_align}
      </Button>
      <ExposureControl />
      {alignProgress && (
        <div className={styles.alignProgress}>
          <Progress percent={alignProgress.percentage} showInfo={false} size="small" status="active" />
          <div className={styles.desc}>{buildMessage(alignProgress, lang.align_progress)}</div>
          <RemainingTime phase={alignProgress.phase} remainingSeconds={alignProgress.remainingSeconds} />
          {alignProgress.stoppable && <div className={styles.desc}>{messageLang.preview.press_esc_to_stop}</div>}
        </div>
      )}
    </div>
  );
};

export default StepAlign;
