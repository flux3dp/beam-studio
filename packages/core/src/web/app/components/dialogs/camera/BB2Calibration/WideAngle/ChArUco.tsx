import { useCallback, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Flex, Progress, Spin } from 'antd';
import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { ContextMenu, ContextMenuTrigger, MenuItem } from '@core/helpers/react-contextmenu';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCaliParameters, WideAngleRegion } from '@core/interfaces/FisheyePreview';

import ExposureSlider from '../../common/ExposureSlider';
import handleCalibrationResult from '../../common/handleCalibrationResult';
import useLiveFeed from '../../common/useLiveFeed';

import styles from './ChArUco.module.scss';

/* eslint-disable perfectionist/sort-objects */
const Steps = {
  TopLeft: 0,
  TopRight: 1,
  BottomLeft: 2,
  BottomRight: 3,
  Center: 4,
} as const;

/* eslint-enable perfectionist/sort-objects */
type Step = (typeof Steps)[keyof typeof Steps];

interface Props {
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  title?: string;
  updateParam: (param: FisheyeCaliParameters) => void;
}

// TODO: how to handle the case when some pictures are not detected or points are too less?
const ChArUco = ({ onClose, onNext, onPrev, title, updateParam }: Props) => {
  const [step, setStep] = useState<Step>(Steps.TopLeft);
  const tCali = useI18n().calibration;
  const { exposureSetting, handleTakePicture, img, pauseLive, restartLive, setExposureSetting } = useLiveFeed({
    index: 1,
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const data = useRef<Partial<Record<WideAngleRegion, { imgp: number[][]; objp: number[][] }>>>({});

  const handleDownload = useCallback(() => {
    dialog.writeFileDialog(() => img!.blob, 'Save Picture', 'wide-angle.jpg');
  }, [img]);

  const { key, positionText } = useMemo(
    () =>
      match<Step, { key: WideAngleRegion; positionText: string }>(step)
        .with(Steps.TopLeft, () => ({ key: 'topLeft', positionText: tCali.charuco_position_top_left }))
        .with(Steps.TopRight, () => ({ key: 'topRight', positionText: tCali.charuco_position_top_right }))
        .with(Steps.BottomLeft, () => ({ key: 'bottomLeft', positionText: tCali.charuco_position_bottom_left }))
        .with(Steps.BottomRight, () => ({ key: 'bottomRight', positionText: tCali.charuco_position_bottom_right }))
        .with(Steps.Center, () => ({ key: 'center', positionText: tCali.charuco_position_center }))
        .exhaustive(),
    [step, tCali],
  );

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

    data.current[key] = { imgp: res.imgp, objp: res.objp };

    if (step !== Steps.Center) {
      setStep((s) => (s + 1) as Step);
      restartLive();
    } else {
      const { naturalHeight: h, naturalWidth: w } = imgRef.current!;
      const objPoints: number[][][] = [];
      const imgPoints: number[][][] = [];
      const regions = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center'] as const;

      for (const region of regions) {
        const { imgp, objp } = data.current[region]!;

        imgPoints.push(imgp);
        objPoints.push(objp);
      }

      const calibrateRes = await cameraCalibrationApi.calibrateFisheye(objPoints, imgPoints, [w, h]);

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

      if (indices.length !== 5) {
        const failedRegion = [];

        for (let i = 1; i < 5; i++) {
          if (!indices.includes(i)) {
            failedRegion.push(regions[i]);
          }
        }
      }

      updateParam({ d, k, ret, rvec, tvec });
      onNext();
    }
  }, [tCali, step, key, img, pauseLive, restartLive, onNext, updateParam]);

  return (
    <DraggableModal
      cancelText={step > 0 ? tCali.back : tCali.cancel}
      footer={[
        <Button key="back" onClick={step > 0 ? () => setStep((s) => (s - 1) as Step) : () => onPrev()}>
          {tCali.back}
        </Button>,
        <Button disabled={!img} key="next" onClick={handleNext} type="primary">
          {tCali.next}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={title ?? tCali.title_capture_calibration_pattern}
      width="80vw"
    >
      <div className={styles.container}>
        <ol className={styles.desc}>
          <li>{tCali.charuco_open_the_machine_lid}</li>
          <li dangerouslySetInnerHTML={{ __html: sprintf(tCali.charuco_place_charuco, positionText) }} />
          {step === Steps.TopLeft && <li dangerouslySetInnerHTML={{ __html: tCali.charuco_auto_focus }} />}
          <li>{tCali.charuco_capture}</li>
        </ol>
        <Progress className={styles.progress} percent={(step + 1) * 20} status="normal" />
        <Flex align="center" className={styles.content} justify="space-between">
          <div className={styles.left}>
            <div className={styles.imgContainer}>
              {img ? (
                <>
                  <ContextMenuTrigger
                    hideOnLeaveHoldPosition
                    holdToDisplay={-1}
                    holdToDisplayMouse={-1}
                    id="live-feed-context-menu"
                  >
                    <img alt="wide-angle-camera" ref={imgRef} src={img?.url} />
                  </ContextMenuTrigger>
                  <ContextMenu id="live-feed-context-menu">
                    <MenuItem attributes={{ id: 'download' }} onClick={handleDownload}>
                      Download
                    </MenuItem>
                  </ContextMenu>
                </>
              ) : (
                <Spin indicator={<LoadingOutlined className={styles.spinner} spin />} />
              )}
            </div>
            <ExposureSlider
              className={styles.slider}
              exposureSetting={exposureSetting}
              onChanged={handleTakePicture}
              setExposureSetting={setExposureSetting}
            />
          </div>
          <div className={styles.right}>
            <img src={`core-img/calibration/bb2-charuco-${key}.jpg`} />
          </div>
        </Flex>
      </div>
    </DraggableModal>
  );
};

export default ChArUco;
