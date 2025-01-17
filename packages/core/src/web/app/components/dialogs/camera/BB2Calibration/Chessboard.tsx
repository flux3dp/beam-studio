import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import dialog from 'implementations/dialog';
import progressCaller from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import { ContextMenu, ContextMenuTrigger, MenuItem } from 'helpers/react-contextmenu';
import { calibrateChessboard } from 'helpers/camera-calibration-helper';
import { FisheyeCameraParametersV3Cali } from 'interfaces/FisheyePreview';

import ExposureSlider from '../common/ExposureSlider';
import styles from './Chessboard.module.scss';
import useCamera from '../common/useCamera';

interface Props {
  chessboard: [number, number];
  updateParam: (param: FisheyeCameraParametersV3Cali) => void;
  onNext: () => void;
  onClose: (complete?: boolean) => void;
}

const Chessboard = ({ chessboard, updateParam, onNext, onClose }: Props): JSX.Element => {
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

  const { exposureSetting, setExposureSetting, handleTakePicture } = useCamera(handleImg);

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
        const { ret, k, d, rvec, tvec } = res.data;
        const resp = await new Promise<boolean>((resolve) => {
          let rank = tCali.res_excellent;
          if (ret > 2) rank = tCali.res_poor;
          else if (ret > 1) rank = tCali.res_average;
          alertCaller.popUp({
            message: sprintf(tCali.calibrate_chessboard_success_msg, rank, ret),
            buttons: [
              {
                label: tCali.next,
                onClick: () => resolve(true),
                className: 'primary',
              },
              {
                label: tCali.cancel,
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
      width="80vw"
      open
      centered
      maskClosable={false}
      title={tCali.camera_calibration}
      okText={tCali.next}
      cancelText={tCali.cancel}
      onOk={handleCalibrate}
      onCancel={() => onClose(false)}
      okButtonProps={{ disabled: !img }}
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
                id="chessboard-context-menu"
                holdToDisplay={-1}
                holdToDisplayMouse={-1}
                hideOnLeaveHoldPosition
              >
                <img src={img?.url} alt="Chessboard" />
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
          setExposureSetting={setExposureSetting}
          onChanged={handleTakePicture}
        />
      </div>
    </Modal>
  );
};

export default Chessboard;
