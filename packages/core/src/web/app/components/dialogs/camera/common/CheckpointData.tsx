import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from 'antd';
import { SpinLoading } from 'antd-mobile';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { loadJson } from '@core/helpers/device/jsonDataHelper';
import useI18n from '@core/helpers/useI18n';
import type {
  FisheyeCaliParameters,
  FisheyeCameraParametersV2,
  FisheyeCameraParametersV3,
  FisheyeCameraParametersV4,
} from '@core/interfaces/FisheyePreview';

import styles from './CheckpointData.module.scss';
import Title from './Title';

interface Props<T = FisheyeCaliParameters> {
  allowCheckPoint?: boolean;
  askUser?: boolean;
  getData?: () => Promise<T> | T;
  onClose: (complete: boolean) => void;
  onNext: (res: boolean) => void;
  titleLink?: string;
  updateParam: (param: T) => void;
}

const CheckpointData = <T extends FisheyeCaliParameters>({
  allowCheckPoint = true,
  askUser,
  getData,
  onClose,
  onNext,
  titleLink,
  updateParam,
}: Props<T>): React.JSX.Element => {
  const progressId = useMemo(() => 'camera-check-point', []);
  const [currentData, setCurrentData] = useState<null | {
    data: T;
    isCheckPointData?: boolean;
  }>(null);
  const lang = useI18n();
  const checkData = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.calibration.checking_checkpoint,
    });

    let res: FisheyeCaliParameters;

    try {
      if (getData) {
        res = await getData();
      } else {
        res = (await loadJson('fisheye', 'fisheye_params.json')) as T;
      }

      const isV4 = (d: any): d is FisheyeCameraParametersV4 => d.v === 4;

      if (isV4(res)) {
        setCurrentData({
          data: {
            d: res.d,
            is_fisheye: res.is_fisheye,
            k: res.k,
            rvec: res.rvec,
            tvec: res.tvec,
          } as T,
        });
        progressCaller.popById(progressId);

        return;
      }

      const isV3 = (d: any): d is FisheyeCameraParametersV3 => d.v === 3;

      if (isV3(res)) {
        setCurrentData({
          data: {
            d: res.d,
            is_fisheye: res.is_fisheye,
            k: res.k,
            rvec: res.rvec,
            tvec: res.tvec,
          } as T,
        });
        progressCaller.popById(progressId);

        return;
      }

      const isV2 = (d: any): d is FisheyeCameraParametersV2 => d.v === 2;

      if (isV2(res)) {
        setCurrentData({
          data: {
            d: res.d,
            is_fisheye: res.is_fisheye,
            k: res.k,
            refHeight: res.refHeight,
            rvec: res.rvec,
            source: res.source,
            tvec: res.tvec,
          } as T,
        });
        progressCaller.popById(progressId);

        return;
      }
    } catch {
      /* do nothing */
    }

    if (allowCheckPoint) {
      try {
        const data = (await loadJson('fisheye', 'checkpoint.json')) as T;

        if (data) {
          setCurrentData({
            data,
            isCheckPointData: true,
          });
          progressCaller.popById(progressId);

          return;
        }
      } catch {
        /* do nothing */
      }
    }

    progressCaller.popById(progressId);
    onNext(false);
  }, [lang, allowCheckPoint, getData, progressId, onNext]);

  const handleOk = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.calibration.downloading_checkpoint,
    });
    try {
      const { data } = currentData!;

      try {
        await cameraCalibrationApi.updateData(data);
        updateParam(data);
      } catch (e) {
        console.error(e);
        alertCaller.popUpError({ message: lang.calibration.failed_to_parse_checkpoint });
        onNext(false);
      }
      onNext(true);
    } finally {
      progressCaller.popById(progressId);
    }
  }, [currentData, lang, onNext, progressId, updateParam]);

  useEffect(() => {
    checkData();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentData && !askUser) {
      handleOk();
    }
  }, [currentData, askUser, handleOk]);

  if (!askUser) {
    return (
      <DraggableModal
        closable={!!onClose}
        footer={[]}
        maskClosable={false}
        onCancel={() => onClose?.(false)}
        open
        width={400}
      >
        <SpinLoading className={styles.spinner} color="primary" style={{ '--size': '48px' }} />
      </DraggableModal>
    );
  }

  return (
    <DraggableModal
      closable={!!onClose}
      footer={[
        <Button key="no" onClick={() => onNext(false)}>
          {lang.alert.no}
        </Button>,
        <Button key="yes" onClick={handleOk} type="primary">
          {lang.alert.yes}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose?.(false)}
      open
      title={<Title link={titleLink} title={lang.calibration.check_checkpoint_data} />}
      width={400}
    >
      {!currentData && lang.calibration.checking_checkpoint}
      {currentData?.data &&
        (currentData.isCheckPointData ? lang.calibration.found_checkpoint : lang.calibration.use_old_camera_parameter)}
    </DraggableModal>
  );
};

export default CheckpointData;
