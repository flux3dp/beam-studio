import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Modal } from 'antd';
import { SpinLoading } from 'antd-mobile';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { updateData } from '@core/helpers/camera-calibration-helper';
import { loadJson } from '@core/helpers/device/jsonDataHelper';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

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
  const [checkpointData, setCheckpointData] = useState<{
    data: T;
    file: string;
  }>(null);
  const lang = useI18n();
  const checkData = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: progressId,
      message: lang.calibration.checking_checkpoint,
    });

    let res = null;

    try {
      if (getData) {
        res = await getData();
      } else {
        const data = await deviceMaster.downloadFile('fisheye', 'fisheye_params.json');
        const [, blob] = data;
        const dataString = await (blob as Blob).text();

        res = JSON.parse(dataString);
      }

      if (res.v === 3) {
        setCheckpointData({
          data: {
            d: res.d,
            k: res.k,
            rvec: res.rvec,
            tvec: res.tvec,
          } as T,
          file: 'fisheye_params.json',
        });
        progressCaller.popById(progressId);

        return;
      }

      if (res.v === 2) {
        setCheckpointData({
          data: {
            d: res.d,
            k: res.k,
            refHeight: res.refHeight,
            rvec: res.rvec,
            source: res.source,
            tvec: res.tvec,
          } as T,
          file: 'fisheye_params.json',
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
          setCheckpointData({
            data,
            file: 'checkpoint.json',
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
      const { data } = checkpointData;

      try {
        await updateData(data);
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
  }, [checkpointData, lang, onNext, progressId, updateParam]);

  useEffect(() => {
    checkData();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (checkpointData && !askUser) {
      handleOk();
    }
  }, [checkpointData, askUser, handleOk]);

  if (!askUser) {
    return (
      <Modal
        centered
        closable={!!onClose}
        footer={[]}
        maskClosable={false}
        onCancel={() => onClose?.(false)}
        open
        width={400}
      >
        <SpinLoading className={styles.spinner} color="primary" style={{ '--size': '48px' }} />
      </Modal>
    );
  }

  return (
    <Modal
      centered
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
      {!checkpointData && lang.calibration.checking_checkpoint}
      {checkpointData?.data &&
        (checkpointData.file === 'fisheye_params.json'
          ? lang.calibration.use_old_camera_parameter
          : lang.calibration.found_checkpoint)}
    </Modal>
  );
};

export default CheckpointData;
