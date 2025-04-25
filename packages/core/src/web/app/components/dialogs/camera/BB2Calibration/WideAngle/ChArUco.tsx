import { useCallback, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { ContextMenu, ContextMenuTrigger, MenuItem } from '@core/helpers/react-contextmenu';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCameraParametersV4Cali, WideAngleRegion } from '@core/interfaces/FisheyePreview';

import ExposureSlider from '../../common/ExposureSlider';
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
  updateParam: (param: FisheyeCameraParametersV4Cali) => void;
}

// TODO: how to handle the case when some pictures are not detected or points are too less?
const ChArUco = ({ onClose, onNext, updateParam }: Props) => {
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

  const key = useMemo(
    () =>
      match<Step, WideAngleRegion>(step)
        .with(Steps.TopLeft, () => 'topLeft')
        .with(Steps.TopRight, () => 'topRight')
        .with(Steps.BottomLeft, () => 'bottomLeft')
        .with(Steps.BottomRight, () => 'bottomRight')
        .with(Steps.Center, () => 'center')
        .exhaustive(),
    [step],
  );

  const handleNext = useCallback(async () => {
    pauseLive();

    const res = await cameraCalibrationApi.detectChAruCo(img!.blob, 15, 10);

    if (!res.success) {
      alertCaller.popUp({ message: `Failed to detect image ${res.reason}` });
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
  }, [step, key, img, pauseLive, restartLive, onNext, updateParam]);

  return (
    <Modal
      cancelText={step > 0 ? tCali.back : tCali.cancel}
      centered
      maskClosable={false}
      okButtonProps={{ disabled: !img }}
      okText={tCali.next}
      onCancel={step > 0 ? () => setStep((s) => (s - 1) as Step) : () => onClose(false)}
      onOk={handleNext}
      open
      title={tCali.camera_calibration}
      width="80vw"
    >
      <div className={styles.container}>
        <div className={styles.desc}>
          <div>{`${step + 1}. Put the calibration image at the ${key}`}</div>
        </div>
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
    </Modal>
  );
};

export default ChArUco;
