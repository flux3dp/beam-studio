import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Col, Row } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { startFisheyeCalibrate } from '@core/helpers/camera-calibration-helper';
import deviceMaster from '@core/helpers/device-master';
import { getOS } from '@core/helpers/getOS';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import styles from './CalibrateChessBoard.module.scss';
import { getMaterialHeight, prepareToTakePicture } from './utils';

interface Props {
  onBack: () => void;
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV2Cali) => void;
}

const CalibrateChessBoard = ({ onBack, onClose, onNext, updateParam }: Props): React.JSX.Element => {
  const lang = useI18n();
  const progressId = useMemo(() => 'ador-calibration-v2', []);
  const [res, setRes] = useState<
    | (({ data: FisheyeCameraParametersV2Cali; success: true } | { data: null; success: false }) & {
        imgblob: Blob;
        imgUrl: string;
        origBlob: Blob;
      })
    | null
  >(null);

  useEffect(
    () => () => {
      if (res?.imgUrl) URL.revokeObjectURL(res.imgUrl);
    },
    [res],
  );

  const objectHeight = useRef<number>(0);

  const initSetup = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.calibration.getting_plane_height,
    });

    const height = await getMaterialHeight('A');

    progressCaller.update(progressId, { message: lang.calibration.preparing_to_take_picture });
    await prepareToTakePicture();
    console.log('height', height);
    objectHeight.current = height;
    progressCaller.update(progressId, { message: lang.calibration.taking_picture });
    try {
      await deviceMaster.connectCamera();
    } finally {
      progressCaller.popById(progressId);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const handleCalibrate = async (retryTimes = 0) => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.calibration.taking_picture,
    });

    const { imgBlob } = (await deviceMaster.takeOnePicture()) || {};

    if (!imgBlob) {
      if (retryTimes < 3) {
        handleCalibrate(retryTimes + 1);
      } else {
        alertCaller.popUpError({ message: 'Unable to get image' });
      }
    } else {
      try {
        await startFisheyeCalibrate();

        const calibrateRes = await cameraCalibrationApi.calibrateChessboard(imgBlob, objectHeight.current);

        console.log(calibrateRes);

        let displayBlob = imgBlob;

        if (calibrateRes.success === false) {
          if (retryTimes < 3) {
            handleCalibrate(retryTimes + 1);
          } else {
            alertCaller.popUpError({
              message: `Failed to get correct corners ${calibrateRes.data.reason}`,
            });
          }
        } else {
          displayBlob = calibrateRes.blob;

          if (calibrateRes.data.ret > 3) {
            alertCaller.popUp({
              message: `Large deviation: ${calibrateRes.data.ret}, please chessboard.`,
              type: alertConstants.WARNING,
            });
          }
        }

        setRes({
          data: calibrateRes?.success ? calibrateRes.data : null,
          imgblob: displayBlob,
          imgUrl: URL.createObjectURL(displayBlob),
          origBlob: imgBlob,
          success: calibrateRes.success,
        } as typeof res);
      } catch (err) {
        alertCaller.popUpError({ message: err.message || 'Fail to find corners' });
      }
    }

    progressCaller.popById(progressId);
  };

  useEffect(() => {
    initSetup().then(() => {
      handleCalibrate();
    });

    return () => deviceMaster.disconnectCamera();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const handleNext = useCallback(async () => {
    if (!res?.success) {
      return;
    }

    updateParam({
      d: res.data.d,
      k: res.data.k,
      // Assuming chessboard is flat
      levelingData: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 },
      refHeight: 0,
      rvec: res.data.rvec,
      source: 'device',
      tvec: res.data.tvec,
    });

    const ls = await deviceMaster.ls('camera_calib');

    if (ls.files.length > 0) {
      const override = await new Promise((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          message: 'Do you want to override the device images?',
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
          type: alertConstants.WARNING,
        });
      });

      if (!override) {
        onNext();

        return;
      }

      for (let i = 0; i < ls.files.length; i += 1) {
        await deviceMaster.deleteFile('camera_calib', ls.files[i]);
      }
    }

    await deviceMaster.uploadToDirectory(
      res.origBlob,
      'camera_calib',
      `pic_${objectHeight.current.toFixed(1)}_top_left.jpg`,
    );
    onNext();
  }, [updateParam, onNext, res]);

  const handleDownloadImage = useCallback(async () => {
    const tFile = lang.topmenu.file;

    dialog.writeFileDialog(() => res!.imgblob, 'Download Image', 'chessboard.jpg', [
      {
        extensions: ['jpg'],
        name: getOS() === 'MacOS' ? `${tFile.jpg_files} (*.jpg)` : tFile.jpg_files,
      },
      { extensions: ['*'], name: tFile.all_files },
    ]);
  }, [res?.imgblob, lang]);

  const renderFooter = () =>
    [
      <Button key="back" onClick={onBack}>
        {lang.buttons.back}
      </Button>,
      <Button key="retry" onClick={() => handleCalibrate(0)}>
        Retry
      </Button>,
      res?.imgblob ? (
        <Button key="download" onClick={handleDownloadImage}>
          Download Image
        </Button>
      ) : null,
      <Button disabled={!res?.success} key="next" onClick={handleNext} type="primary">
        {lang.buttons.next}
      </Button>,
    ].filter((btn) => btn);

  return (
    <DraggableModal
      closable
      footer={renderFooter}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={lang.calibration.camera_calibration}
    >
      Calibrate Chessboard
      <Row gutter={[16, 0]}>
        <Col span={18}>
          <div className={styles['img-container']}>
            <img src={res?.imgUrl} />
          </div>
        </Col>
        <Col span={6}>
          <div>Object Height: {objectHeight.current}</div>
          {res?.success && (
            <div>
              <div>
                <span>Ret: </span>
                <span>{res!.data.ret!.toFixed(2)}</span>
              </div>
            </div>
          )}
        </Col>
      </Row>
    </DraggableModal>
  );
};

export default CalibrateChessBoard;
