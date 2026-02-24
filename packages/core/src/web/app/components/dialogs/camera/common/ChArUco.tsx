import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Flex, Spin } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import ContextMenu from '@core/app/widgets/ContextMenu';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

import styles from './ChArUco.module.scss';
import ExposureSlider from './ExposureSlider';
import handleCalibrationResult from './handleCalibrationResult';
import StepProgress from './StepProgress';
import useLiveFeed from './useLiveFeed';

interface Props {
  cameraIndex?: number;
  isFisheye?: boolean;
  isVertical?: boolean;
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  steps: Array<{ description: string; imageUrl?: string; key: string }>;
  title?: string;
  updateParam: (param: FisheyeCaliParameters) => void;
}

// TODO: how to handle the case when some pictures are not detected or points are too less?
const ChArUco = ({
  cameraIndex,
  isFisheye = true,
  isVertical,
  onClose,
  onNext,
  onPrev,
  steps,
  title,
  updateParam,
}: Props) => {
  const [step, setStep] = useState(0);
  const tCali = useI18n().calibration;
  const { autoExposure, exposureSetting, img, pauseLive, restartLive, setAutoExposure, setExposureSetting } =
    useLiveFeed({
      index: cameraIndex,
    });
  const imgRef = useRef<HTMLImageElement>(null);
  const data = useRef<Array<{ imgp: number[][]; objp: number[][] }>>([]);

  useEffect(() => {
    data.current = Array(steps.length).fill(null);
  }, [steps]);

  const handleDownload = useCallback(() => {
    dialog.writeFileDialog(() => img!.blob, 'Save Picture', 'charuco.jpg');
  }, [img]);

  const { description, imageUrl } = useMemo(() => steps[step], [step, steps]);

  const handleNext = useCallback(async () => {
    pauseLive();
    progressCaller.openNonstopProgress({ id: 'detect-charuco' });

    const res = await cameraCalibrationApi.detectChAruCo(img!.blob, 15, 10);

    progressCaller.popById('detect-charuco');
    console.log(`Detect ChArUco at ${step}:`, res);

    if (!res.success || res.ratio < 0.5) {
      alertCaller.popUp({ message: tCali.failed_to_detect_calibration_pattern });
      restartLive();

      return;
    }

    data.current[step] = { imgp: res.imgp, objp: res.objp };

    if (step !== steps.length - 1) {
      setStep((s) => s + 1);
      restartLive();
    } else {
      const { naturalHeight: h, naturalWidth: w } = imgRef.current!;
      const objPoints: number[][][] = [];
      const imgPoints: number[][][] = [];

      for (let i = 0; i < steps.length; i++) {
        if (!data.current[i]) continue;

        const { imgp, objp } = data.current[i]!;

        imgPoints.push(imgp);
        objPoints.push(objp);
      }

      const calibrateRes = await cameraCalibrationApi.calibrateCamera(objPoints, imgPoints, [w, h], isFisheye);

      if (!calibrateRes.success) {
        alertCaller.popUp({ message: `Failed to calibrate image ${calibrateRes.reason}` });
        restartLive();

        return;
      }

      console.log('Calibrate with ChArUco', calibrateRes);

      const { d, indices, k, ret, rvec, tvec } = calibrateRes;
      const shouldProceed = await handleCalibrationResult(ret, 1.5, 2);

      if (!shouldProceed) {
        restartLive();

        return;
      }

      if (indices.length !== steps.length) {
        const failedKeys = [];

        for (let i = 0; i < steps.length; i++) {
          if (!indices.includes(i)) {
            failedKeys.push(steps[i].key);
          }
        }
      }

      updateParam({ d, is_fisheye: isFisheye, k, ret, rvec, tvec });
      onNext();
    }
  }, [tCali, steps, step, img, pauseLive, restartLive, onNext, updateParam]);

  return (
    <DraggableModal
      cancelText={step > 0 ? tCali.back : tCali.cancel}
      footer={[
        <Button key="back" onClick={step > 0 ? () => setStep((s) => s - 1) : () => onPrev()}>
          {tCali.back}
        </Button>,
        <Button disabled={!img} key="next" onClick={handleNext} type="primary">
          {tCali.next}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={title ?? `${tCali.title_capture_calibration_pattern} (${description})`}
      width="80vw"
    >
      <div className={styles.container}>
        <ol className={styles.desc}>
          <li
            dangerouslySetInnerHTML={{
              __html: sprintf(
                isVertical ? tCali.charuco_place_charuco_vertical : tCali.charuco_place_charuco_horizontal,
                description,
              ),
            }}
          />
          {step === 0 && <li dangerouslySetInnerHTML={{ __html: tCali.charuco_auto_focus }} />}
          <li>{tCali.charuco_capture}</li>
        </ol>
        <Flex align="center" className={styles.content} justify="space-between">
          <div className={styles.left}>
            <StepProgress className={styles.progress} currentStep={step} steps={steps.map((s) => s.description)} />
            <div className={styles.imgContainer}>
              {img ? (
                <>
                  <ContextMenu items={[{ key: 'download', label: 'Download' }]} onClick={handleDownload}>
                    <img alt="wide-angle-camera" ref={imgRef} src={img?.url} />
                  </ContextMenu>
                </>
              ) : (
                <Spin indicator={<LoadingOutlined className={styles.spinner} spin />} />
              )}
            </div>
            <ExposureSlider
              autoExposure={autoExposure}
              className={styles.slider}
              exposureSetting={exposureSetting}
              setAutoExposure={setAutoExposure}
              setExposureSetting={setExposureSetting}
            />
          </div>
          <div className={styles.right}>{imageUrl && <img src={imageUrl} />}</div>
        </Flex>
      </div>
    </DraggableModal>
  );
};

export default ChArUco;
