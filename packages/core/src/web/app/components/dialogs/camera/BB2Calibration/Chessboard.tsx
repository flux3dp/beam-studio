import React, { useCallback, useEffect, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { calibrateChessboard } from '@core/helpers/camera-calibration-helper';
import { ContextMenu, ContextMenuTrigger, MenuItem } from '@core/helpers/react-contextmenu';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import ExposureSlider from '../common/ExposureSlider';
import useCamera from '../common/useCamera';

import styles from './Chessboard.module.scss';

interface Props {
  chessboard: [number, number];
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV3Cali) => void;
}

const Chessboard = ({ chessboard, onClose, onNext, updateParam }: Props): React.JSX.Element => {
  const t = useI18n();
  const tCali = useI18n().calibration;
  const [img, setImg] = useState<{ blob: Blob; url: string }>(null);
  const cameraLive = useRef(true);
  const liveTimeout = useRef(null);
  const handleImg = useCallback((imgBlob: Blob) => {
    const url = URL.createObjectURL(imgBlob);

    setImg({ blob: imgBlob, url });

    return true;
  }, []);

  const { exposureSetting, handleTakePicture, setExposureSetting } = useCamera(handleImg);

  useEffect(() => {
    if (cameraLive.current) {
      liveTimeout.current = setTimeout(() => {
        handleTakePicture({ silent: true });
        liveTimeout.current = null;
      }, 1000);
    }
  }, [img, handleTakePicture]);

  const handleCalibrate = async () => {
    progressCaller.openNonstopProgress({ id: 'calibrate-chessboard', message: tCali.calibrating });
    clearTimeout(liveTimeout.current);
    cameraLive.current = false;

    let success = false;

    try {
      const res = await calibrateChessboard(img.blob, 0, chessboard);

      if (res.success === true) {
        const { d, k, ret, rvec, tvec } = res.data;
        const resp = await new Promise<boolean>((resolve) => {
          let rank = tCali.res_excellent;

          if (ret > 2) {
            rank = tCali.res_poor;
          } else if (ret > 1) {
            rank = tCali.res_average;
          }

          alertCaller.popUp({
            buttons: [
              {
                className: 'primary',
                label: tCali.next,
                onClick: () => resolve(true),
              },
              {
                label: tCali.cancel,
                onClick: () => resolve(false),
              },
            ],
            message: sprintf(tCali.calibrate_chessboard_success_msg, rank, ret),
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

      alertCaller.popUpError({ message: `${tCali.failed_to_calibrate_chessboard} ${reason}` });
    } catch (error) {
      console.error(error);
    } finally {
      progressCaller.popById('calibrate-chessboard');

      if (!success) {
        cameraLive.current = true;
        handleTakePicture({ silent: true });
      }
    }
  };

  const handleDownload = useCallback(() => {
    dialog.writeFileDialog(() => img.blob, 'Save Chessboard Picture', 'chessboard.jpg');
  }, [img]);

  return (
    <Modal
      cancelText={tCali.cancel}
      centered
      maskClosable={false}
      okButtonProps={{ disabled: !img }}
      okText={tCali.next}
      onCancel={() => onClose(false)}
      onOk={handleCalibrate}
      open
      title={tCali.camera_calibration}
      width="80vw"
    >
      <div className={styles.container}>
        <div className={styles.desc}>
          <div>1. {tCali.put_chessboard_1}</div>
          <div>2. {tCali.put_chessboard_2}</div>
          <div>3. {tCali.put_chessboard_3}</div>
        </div>
        <div className={styles.imgContainer}>
          {img ? (
            <>
              <ContextMenuTrigger
                hideOnLeaveHoldPosition
                holdToDisplay={-1}
                holdToDisplayMouse={-1}
                id="chessboard-context-menu"
              >
                <img alt="Chessboard" src={img?.url} />
                <div className={styles.indicator} />
              </ContextMenuTrigger>
              <ContextMenu id="chessboard-context-menu">
                <MenuItem attributes={{ id: 'download' }} onClick={handleDownload}>
                  {t.monitor.download}
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

export default Chessboard;
