import React, { useEffect, useRef, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import progressCaller from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import webcamHelper, { WebCamConnection } from 'helpers/webcam-helper';
import { calibrateChessboard } from 'helpers/camera-calibration-helper';
import { FisheyeCameraParametersV3Cali } from 'interfaces/FisheyePreview';

import styles from './Chessboard.module.scss';
import Title from '../common/Title';

interface Props {
  chessboard: [number, number];
  updateParam: (param: FisheyeCameraParametersV3Cali) => void;
  onNext: () => void;
  onClose: (complete?: boolean) => void;
}

const Chessboard = ({ chessboard, updateParam, onNext, onClose }: Props): JSX.Element => {
  const lang = useI18n().calibration;
  const webCamConnection = useRef<WebCamConnection>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamConnected, setWebcamConnected] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
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
    videoRef.current.pause();
    let success = false;
    try {
      const imgBlob = await webCamConnection.current?.getPicture();
      const res = await calibrateChessboard(imgBlob, 0, chessboard);
      if (res.success === true) {
        const { ret, k, d, rvec, tvec } = res.data;
        const resp = await new Promise<boolean>((resolve) => {
          let rank = lang.res_excellent;
          if (ret > 5) rank = lang.res_poor;
          else if (ret > 1) rank = lang.res_average;
          alertCaller.popUp({
            message: sprintf(lang.calibrate_chessboard_success_msg, rank, ret),
            buttons: [
              {
                label: lang.next,
                onClick: () => resolve(true),
                className: 'primary',
              },
              {
                label: lang.cancel,
                onClick: () => resolve(false),
              },
            ],
          });
        });
        if (!resp) return;
        updateParam({ ret, k, d, rvec, tvec });
        onNext();
        success = true;
        return;
      }
      const { reason } = res.data;
      alertCaller.popUpError({ message: `${lang.failed_to_calibrate_chessboard} ${reason}` });
    } catch (error) {
      console.error(error);
    } finally {
      progressCaller.popById('calibrate-chessboard');
      if (!success) videoRef.current.play();
    }
  };

  return (
    <Modal
      width="80vw"
      open
      centered
      maskClosable={false}
      title={<Title title={lang.camera_calibration} link={lang.promark_help_link} />}
      okText={lang.next}
      cancelText={lang.cancel}
      onOk={handleCalibrate}
      onCancel={() => onClose(false)}
      okButtonProps={{ disabled: !webcamConnected }}
    >
      <div className={styles.container}>
        <div className={styles.desc}>
          <div>1. {lang.put_chessboard_promark_1}</div>
          <div>2. {lang.put_chessboard_promark_2}</div>
        </div>
        <div className={styles.imgContainer}>
          <video ref={videoRef} />
          {!webcamConnected && (
            <Spin
              className={styles.spin}
              indicator={<LoadingOutlined className={styles.spinner} spin />}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Chessboard;
