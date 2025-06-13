import React, { useCallback, useRef } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { calibrateChessboard } from '@core/helpers/camera-calibration-helper';
import { ContextMenu, ContextMenuTrigger, MenuItem } from '@core/helpers/react-contextmenu';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import styles from './Calibration.module.scss';
import ExposureSlider from './ExposureSlider';
import handleCalibrationResult from './handleCalibrationResult';
import useLiveFeed from './useLiveFeed';

type CalibrationData =
  | { charuco: [number, number]; chessboard?: [number, number] }
  | { charuco?: [number, number]; chessboard: [number, number] };

type Props = CalibrationData & {
  description?: string[];
  indicator?: { height: number | string; left: number | string; top: number | string; width: number | string };
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV3Cali) => void;
};

/**
 * Component that provide a live view to calibrate the camera with a chessboard or ChAruCo board.
 */
const Calibration = ({
  charuco,
  chessboard,
  description,
  indicator,
  onClose,
  onNext,
  updateParam,
}: Props): React.JSX.Element => {
  const t = useI18n();
  const tCali = t.calibration;
  const { exposureSetting, handleTakePicture, img, pauseLive, restartLive, setExposureSetting } = useLiveFeed();
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCalibrate = async () => {
    progressCaller.openNonstopProgress({ id: 'calibrate-chessboard', message: tCali.calibrating });
    pauseLive();

    let success = false;

    try {
      let calibrationRes: null | { d: number[][]; k: number[][]; ret: number; rvec: number[]; tvec: number[] } = null;

      if (chessboard) {
        try {
          const chessboardRes = await calibrateChessboard(img!.blob, 0, chessboard);

          if (chessboardRes.success === true) {
            const { d, k, ret, rvec, tvec } = chessboardRes.data;

            calibrationRes = { d, k, ret, rvec, tvec };
          }
        } catch (error) {
          console.error('Failed to calibrate with chessboard', error);
        }
      }

      if (!calibrationRes && charuco) {
        const charucoRes = await cameraCalibrationApi.detectChAruCo(img!.blob, charuco[0], charuco[1]);

        if (charucoRes.success) {
          const { imgp, objp } = charucoRes;
          const { naturalHeight: h, naturalWidth: w } = imgRef.current!;
          const calibrateRes = await cameraCalibrationApi.calibrateFisheye([objp], [imgp], [w, h]);

          if (calibrateRes.success) {
            const { d, k, ret, rvec, tvec } = calibrateRes;

            calibrationRes = { d, k, ret, rvec, tvec };
          }
        }
      }

      if (calibrationRes) {
        const { d, k, ret, rvec, tvec } = calibrationRes;
        const shouldProceed = await handleCalibrationResult(ret);

        if (!shouldProceed) return;

        updateParam({ d, k, ret, rvec, tvec });
        onNext();
        success = true;

        return;
      }

      alertCaller.popUpError({ message: tCali.failed_to_calibrate_chessboard });
    } catch (error) {
      console.error(error);
    } finally {
      progressCaller.popById('calibrate-chessboard');

      if (!success) restartLive();
    }
  };

  const handleDownload = useCallback(() => {
    dialog.writeFileDialog(() => img!.blob, 'Save Chessboard Picture', 'chessboard.jpg');
  }, [img]);

  return (
    <DraggableModal
      cancelText={tCali.cancel}
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
        {description && (
          <div className={styles.desc}>
            {description.map((desc, index) => (
              <div key={index}>{`${index + 1}. ${desc}`}</div>
            ))}
          </div>
        )}
        <div className={styles.imgContainer}>
          {img ? (
            <>
              <ContextMenuTrigger
                hideOnLeaveHoldPosition
                holdToDisplay={-1}
                holdToDisplayMouse={-1}
                id="chessboard-context-menu"
              >
                <img alt="Chessboard" ref={imgRef} src={img?.url} />
                {indicator && <div className={styles.indicator} style={indicator} />}
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
    </DraggableModal>
  );
};

export default Calibration;
