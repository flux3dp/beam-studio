import React, { useCallback, useEffect, useState } from 'react';

import { Button, Modal } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { findCorners } from '@core/helpers/camera-calibration-helper';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import styles from './FindCorner.module.scss';

const PROGRESS_ID = 'camera-find-corner';

interface Props {
  onBack: () => void;
  onClose: (complete: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV2Cali) => void;
  withPitch?: boolean;
}

const FindCorner = ({ onBack, onClose, onNext, updateParam, withPitch }: Props): React.JSX.Element => {
  const [img, setImg] = useState<{ blob: Blob; success: boolean; url: string }>(null);
  const lang = useI18n();

  const initSetup = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: PROGRESS_ID,
      message: lang.calibration.taking_picture,
    });
    try {
      await deviceMaster.connectCamera();
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const handleTakePicture = async (retryTimes = 0) => {
    progressCaller.openNonstopProgress({
      id: PROGRESS_ID,
      message: lang.calibration.taking_picture,
    });

    const { imgBlob } = (await deviceMaster.takeOnePicture()) || {};

    if (!imgBlob) {
      if (retryTimes < 3) {
        handleTakePicture(retryTimes + 1);
      } else {
        alertCaller.popUpError({ message: 'Unable to get image' });
      }
    } else {
      try {
        const { blob, data, success } = await findCorners(imgBlob, withPitch);

        if (!success) {
          if (retryTimes < 3) {
            handleTakePicture(retryTimes + 1);
          } else {
            alertCaller.popUpError({ message: 'Failed to get correct corners' });
          }
        }

        setImg({ blob, success, url: URL.createObjectURL(blob) });

        if (success) {
          if (data.ret > 3) {
            alertCaller.popUp({
              message: `Large deviation: ${data.ret}, please check engraved points.`,
              type: alertConstants.WARNING,
            });
          }

          updateParam({
            d: data.d,
            heights: [0],
            k: data.k,
            rvec: data.rvec,
            rvecs: [data.rvec],
            source: 'user',
            tvec: data.tvec,
            tvecs: [data.tvec],
          });
        }
      } catch (err) {
        alertCaller.popUpError({ message: err.message || 'Fail to find corners' });
      }
    }

    progressCaller.popById(PROGRESS_ID);
  };

  useEffect(() => {
    initSetup().then(() => {
      handleTakePicture();
    });

    return () => deviceMaster.disconnectCamera();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      centered
      closable
      footer={[
        <Button className={styles['footer-button']} key="back" onClick={onBack}>
          {lang.buttons.back}
        </Button>,
        <Button className={styles['footer-button']} key="retry" onClick={() => handleTakePicture(0)}>
          Retry
        </Button>,
        <Button className={styles['footer-button']} disabled={!img?.success} key="next" onClick={onNext} type="primary">
          {lang.buttons.next}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={lang.calibration.camera_calibration}
    >
      {'tPlease check detected corners'}
      <div className={styles['img-container']}>
        <img src={img?.url} />
      </div>
    </Modal>
  );
};

export default FindCorner;
