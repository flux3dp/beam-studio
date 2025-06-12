import React, { useCallback, useEffect, useMemo } from 'react';

import { Button } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import getLevelingData from '@core/app/actions/camera/preview-helper/getLevelingData';
import progressCaller from '@core/app/actions/progress-caller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { updateData } from '@core/helpers/camera-calibration-helper';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import { calibrateWithDevicePictures } from './utils';

interface Props {
  onClose: (complete: boolean) => void;
  onNext: () => void;
  updateParam: (param: FisheyeCameraParametersV2Cali) => void;
}

const CheckPictures = ({ onClose, onNext, updateParam }: Props): React.JSX.Element => {
  const progressId = useMemo(() => 'camera-check-pictures', []);
  const lang = useI18n();

  const calibrateDevicePictures = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.device.processing,
    });

    const levelingData = await getLevelingData('hexa_platform');
    const refHeight = levelingData.A;

    Object.keys(levelingData).forEach((key) => {
      levelingData[key] = refHeight - levelingData[key];
    });
    try {
      progressCaller.update(progressId, {
        message: lang.calibration.calibrating_with_device_pictures,
      });

      const res = await calibrateWithDevicePictures();

      if (res) {
        updateParam({ ...res, levelingData, refHeight: 0, source: 'device' });
        await updateData(res);
        onNext();
      } else {
        onClose?.(false);
      }
    } finally {
      progressCaller.popById(progressId);
    }
  }, [lang, onNext, onClose, progressId, updateParam]);

  const checkPictures = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.calibration.checking_pictures,
    });

    let hasPictures = false;

    try {
      const ls = await deviceMaster.ls('camera_calib');

      hasPictures = ls.files.length > 0;
    } catch {
      /* do nothing */
    }
    progressCaller.popById(progressId);

    if (hasPictures) {
      calibrateDevicePictures();
    } else {
      alertCaller.popUpError({ message: lang.calibration.no_picutre_found });
      onClose?.(false);
    }
  }, [lang, progressId, onClose, calibrateDevicePictures]);

  useEffect(() => {
    checkPictures();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return (
    <DraggableModal
      closable={!!onClose}
      footer={[
        <Button key="yes" onClick={calibrateDevicePictures} type="primary">
          {lang.alert.yes}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose?.(false)}
      open
      title={lang.calibration.check_device_pictures}
      width={400}
    >
      {lang.calibration.checking_pictures}
    </DraggableModal>
  );
};

export default CheckPictures;
