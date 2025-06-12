import React, { useEffect, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { calibrateChessboard } from '@core/helpers/camera-calibration-helper';
import useI18n from '@core/helpers/useI18n';
import type { WebCamConnection } from '@core/helpers/webcam-helper';
import webcamHelper from '@core/helpers/webcam-helper';
import type { FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import handleCalibrationResult from '../common/handleCalibrationResult';
import Title from '../common/Title';

import styles from './Calibration.module.scss';

interface Props {
  charuco?: [number, number];
  chessboard: [number, number];
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV3Cali) => void;
  withSafe: boolean;
}

const Calibration = ({ charuco, chessboard, onClose, onNext, updateParam, withSafe }: Props): React.JSX.Element => {
  const lang = useI18n().calibration;
  const webCamConnection = useRef<null | WebCamConnection>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamConnected, setWebcamConnected] = useState(false);

  useEffect(() => {
    const video = videoRef.current!;

    webcamHelper.connectWebcam({ video }).then((conn) => {
      webCamConnection.current = conn;
      setWebcamConnected(!!conn);
    });

    return () => {
      webCamConnection.current?.end();
    };
  }, []);

  const handleCalibrate = async () => {
    progressCaller.openNonstopProgress({ id: 'calibrate-chessboard', message: lang.calibrating });
    videoRef.current?.pause();

    let success = false;

    try {
      const imgBlob = await webCamConnection.current?.getPicture()!;
      let calibrationRes: null | { d: number[][]; k: number[][]; ret: number; rvec: number[]; tvec: number[] } = null;

      try {
        const chessboardRes = await calibrateChessboard(imgBlob, 0, chessboard);

        if (chessboardRes.success === true) {
          const { d, k, ret, rvec, tvec } = chessboardRes.data;

          calibrationRes = { d, k, ret, rvec, tvec };
        }

        console.log(chessboardRes);
      } catch (error) {
        console.error('Failed to calibrate with chessboard', error);
      }

      if (!calibrationRes && charuco) {
        const charucoRes = await cameraCalibrationApi.detectChAruCo(imgBlob, charuco[0], charuco[1]);

        if (charucoRes.success) {
          const { imgp, objp } = charucoRes;
          const { videoHeight: h, videoWidth: w } = videoRef.current!;
          const calibrateRes = await cameraCalibrationApi.calibrateFisheye([objp], [imgp], [w, h]);

          if (calibrateRes.success) {
            const { d, k, ret, rvec, tvec } = calibrateRes;

            calibrationRes = { d, k, ret, rvec, tvec };
          }
        }
      }

      if (calibrationRes) {
        const { d, k, ret, rvec, tvec } = calibrationRes;
        const shouldProceed = await handleCalibrationResult(ret, 1, 5);

        if (!shouldProceed) return;

        updateParam({ d, k, ret, rvec, tvec });
        onNext();
        success = true;

        return;
      }

      alertCaller.popUpError({ message: lang.failed_to_calibrate_chessboard });
    } catch (error) {
      console.error(error);
    } finally {
      progressCaller.popById('calibrate-chessboard');

      if (!success) {
        videoRef.current?.play();
      }
    }
  };

  return (
    <DraggableModal
      cancelText={lang.cancel}
      maskClosable={false}
      okButtonProps={{ disabled: !webcamConnected }}
      okText={lang.next}
      onCancel={() => onClose(false)}
      onOk={handleCalibrate}
      open
      title={<Title link={lang.promark_help_link} title={lang.camera_calibration} />}
      width="80vw"
    >
      <div className={styles.container}>
        <div className={styles.desc}>
          <div>1. {lang.put_chessboard_promark_1}</div>
          <div>2. {withSafe ? lang.put_charuco_promark_2 : lang.put_chessboard_promark_2}</div>
        </div>
        <div className={styles.imgContainer}>
          <video ref={videoRef} />
          {!webcamConnected && (
            <Spin className={styles.spin} indicator={<LoadingOutlined className={styles.spinner} spin />} />
          )}
        </div>
      </div>
    </DraggableModal>
  );
};

export default Calibration;
