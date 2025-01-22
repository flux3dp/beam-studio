import React, { useEffect, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { calibrateChessboard } from '@core/helpers/camera-calibration-helper';
import useI18n from '@core/helpers/useI18n';
import type { WebCamConnection } from '@core/helpers/webcam-helper';
import webcamHelper from '@core/helpers/webcam-helper';
import type { FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import Title from '../common/Title';

import styles from './Chessboard.module.scss';

interface Props {
  chessboard: [number, number];
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV3Cali) => void;
}

const Chessboard = ({ chessboard, onClose, onNext, updateParam }: Props): React.JSX.Element => {
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
        const { d, k, ret, rvec, tvec } = res.data;
        const resp = await new Promise<boolean>((resolve) => {
          let rank = lang.res_excellent;

          if (ret > 5) {
            rank = lang.res_poor;
          } else if (ret > 1) {
            rank = lang.res_average;
          }

          alertCaller.popUp({
            buttons: [
              {
                className: 'primary',
                label: lang.next,
                onClick: () => resolve(true),
              },
              {
                label: lang.cancel,
                onClick: () => resolve(false),
              },
            ],
            message: sprintf(lang.calibrate_chessboard_success_msg, rank, ret),
          });
        });

        if (!resp) {
          return;
        }

        updateParam({ d, k, ret, rvec, tvec });
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

      if (!success) {
        videoRef.current.play();
      }
    }
  };

  return (
    <Modal
      cancelText={lang.cancel}
      centered
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
          <div>2. {lang.put_chessboard_promark_2}</div>
        </div>
        <div className={styles.imgContainer}>
          <video ref={videoRef} />
          {!webcamConnected && (
            <Spin className={styles.spin} indicator={<LoadingOutlined className={styles.spinner} spin />} />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default Chessboard;
