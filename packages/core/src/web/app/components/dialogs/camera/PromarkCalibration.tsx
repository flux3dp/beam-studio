import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Segmented } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import checkDeviceStatus from '@core/helpers/check-device-status';
import checkCamera from '@core/helpers/device/check-camera';
import { loadCameraCalibrationTask } from '@core/helpers/device/promark/calibration';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV3, FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './Calibration.module.scss';
import Calibration from './common/Calibration';
import CheckpointData from './common/CheckpointData';
import downloadCalibrationFile from './common/downloadCalibrationFile';
import Instruction from './common/Instruction';
import SolvePnP from './common/SolvePnP';
import { promarkPnPPoints } from './common/solvePnPConstants';
import Title from './common/Title';

/* eslint-disable perfectionist/sort-enums */
enum Steps {
  CHECKPOINT_DATA = 0,
  PRE_CHESSBOARD = 1,
  CALIBRATION = 2,
  PUT_PAPER = 3,
  SOLVE_PNP_INSTRUCTION = 4,
  SOLVE_PNP = 5,
}
/* eslint-enable perfectionist/sort-enums */

interface Props {
  device: IDeviceInfo;
  onClose: (completed?: boolean) => void;
}

const PROGRESS_ID = 'promark-calibration';
const PromarkCalibration = ({ device: { model, serial }, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const workareaWidth = useMemo(() => getWorkarea(model).width, [model]);
  const calibratingParam = useRef<FisheyeCameraParametersV3Cali>({});
  const useOldData = useRef(false);
  const [withSafe, setWithSafe] = useState(false);
  const [step, setStep] = useState<Steps>(Steps.CHECKPOINT_DATA);
  const updateParam = useCallback((param: FisheyeCameraParametersV3Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  if (step === Steps.CHECKPOINT_DATA) {
    return (
      <CheckpointData
        allowCheckPoint={false}
        askUser
        getData={() => promarkDataStore.get(serial, 'cameraParameters')}
        onClose={onClose}
        onNext={(res: boolean) => {
          if (res) {
            useOldData.current = true;
            setStep(Steps.PUT_PAPER);
          } else {
            setStep(Steps.PRE_CHESSBOARD);
          }
        }}
        updateParam={updateParam}
      />
    );
  }

  if (step === Steps.PRE_CHESSBOARD) {
    const handleDownloadChessboard = () => {
      downloadCalibrationFile(
        withSafe ? 'assets/charuco-15-10.pdf' : 'assets/promark-chessboard.pdf',
        withSafe ? tCali.download_calibration_pattern : tCali.download_chessboard_file,
        withSafe ? 'Calibration Pattern' : 'Chessboard',
      );
    };

    return (
      <Instruction
        animationSrcs={
          withSafe
            ? [
                { src: 'video/promark-calibration/1-charuco.webm', type: 'video/webm' },
                { src: 'video/promark-calibration/1-charuco.mp4', type: 'video/mp4' },
              ]
            : [
                { src: 'video/promark-calibration/1-chessboard.webm', type: 'video/webm' },
                { src: 'video/promark-calibration/1-chessboard.mp4', type: 'video/mp4' },
              ]
        }
        buttons={[
          {
            label: tCali.next,
            onClick: () => setStep(Steps.CALIBRATION),
            type: 'primary',
          },
        ]}
        contentBeforeSteps={
          <div className={styles.tab}>
            <Segmented
              block
              onChange={(v) => setWithSafe(v === 1)}
              options={[
                { label: tCali.without_promark_safe_plus, value: 0 },
                { label: tCali.with_promark_safe_plus, value: 1 },
              ]}
            />
          </div>
        }
        onClose={onClose}
        steps={
          withSafe
            ? [tCali.put_charuco_promark_desc_1, tCali.put_charuco_promark_desc_2]
            : [tCali.put_chessboard_promark_desc_1, tCali.put_chessboard_promark_desc_2]
        }
        title={<Title link={tCali.promark_help_link} title={tCali.put_chessboard} />}
      >
        <div className={styles.link} onClick={handleDownloadChessboard}>
          {withSafe ? tCali.download_calibration_pattern : tCali.download_chessboard_file}
        </div>
      </Instruction>
    );
  }

  if (step === Steps.CALIBRATION) {
    return (
      <Calibration
        cameraOptions={{ source: 'usb' }}
        charuco={[15, 10]}
        chessboard={[18, 18]}
        description={[
          tCali.put_chessboard_promark_1,
          withSafe ? tCali.put_charuco_promark_2 : tCali.put_chessboard_promark_2,
        ]}
        onClose={onClose}
        onNext={() => setStep(Steps.PUT_PAPER)}
        title={<Title link={tCali.promark_help_link} title={tCali.camera_calibration} />}
        updateParam={updateParam}
      />
    );
  }

  if (step === Steps.PUT_PAPER) {
    const handleNext = async () => {
      const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);

      if (!deviceStatus) {
        return;
      }

      try {
        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.drawing_calibration_image,
        });
        await loadCameraCalibrationTask(model, workareaWidth);
        await deviceMaster.doPromarkCalibration();
        progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });
        setStep(Steps.SOLVE_PNP_INSTRUCTION);
      } catch (err) {
        console.error(err);

        if (err && err[1] === 'DOOR_OPENED') {
          await deviceMaster.stop();
          alertCaller.popUp({
            buttonType: alertConstants.RETRY_CANCEL,
            id: 'DOOR_OPENED',
            message: lang.monitor.HARDWARE_ERROR_DOOR_OPENED,
            onRetry: handleNext,
            type: alertConstants.SHOW_POPUP_ERROR,
          });
        }
      } finally {
        progressCaller.popById(PROGRESS_ID);
      }
    };

    return (
      <Instruction
        animationSrcs={
          withSafe
            ? [
                { src: 'video/promark-calibration/2-cut-with-safe.webm', type: 'video/webm' },
                { src: 'video/promark-calibration/2-cut-with-safe.mp4', type: 'video/mp4' },
              ]
            : [
                { src: 'video/promark-calibration/2-cut.webm', type: 'video/webm' },
                { src: 'video/promark-calibration/2-cut.mp4', type: 'video/mp4' },
              ]
        }
        buttons={[
          {
            label: tCali.back,
            onClick: () => setStep(useOldData.current ? Steps.CHECKPOINT_DATA : Steps.CALIBRATION),
          },
          { label: tCali.start_engrave, onClick: () => handleNext(), type: 'primary' },
        ]}
        onClose={() => onClose(false)}
        steps={[tCali.put_paper_promark_1, tCali.put_paper_promark_2]}
        title={<Title link={tCali.promark_help_link} title={tCali.put_paper} />}
      />
    );
  }

  if (step === Steps.SOLVE_PNP_INSTRUCTION) {
    return (
      <Instruction
        animationSrcs={[
          { src: 'video/promark-calibration/3-align.webm', type: 'video/webm' },
          { src: 'video/promark-calibration/3-align.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          { label: tCali.back, onClick: () => setStep(Steps.PUT_PAPER) },
          { label: tCali.next, onClick: () => setStep(Steps.SOLVE_PNP), type: 'primary' },
        ]}
        onClose={() => onClose(false)}
        steps={[tCali.solve_pnp_step1, tCali.solve_pnp_step2]}
        title={tCali.solve_pnp_title}
      />
    );
  }

  if (step === Steps.SOLVE_PNP) {
    return (
      <SolvePnP
        dh={0}
        imgSource="usb"
        onBack={() => setStep(Steps.SOLVE_PNP_INSTRUCTION)}
        onClose={onClose}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({ rvec, tvec });
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);

          const param: FisheyeCameraParametersV3 = {
            d: calibratingParam.current.d!,
            k: calibratingParam.current.k!,
            rvec,
            tvec,
            v: 3,
          };

          promarkDataStore.set(serial, 'cameraParameters', param);
          alertCaller.popUp({ message: tCali.camera_parameter_saved_successfully });
          onClose(true);
        }}
        params={calibratingParam.current}
        refPoints={promarkPnPPoints[workareaWidth]}
        titleLink={tCali.promark_help_link}
      />
    );
  }

  onClose();

  return <></>;
};

export const showPromarkCalibration = async (device: IDeviceInfo): Promise<boolean> => {
  const id = 'promark-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  const cameraStatus = await checkCamera(device);

  if (!cameraStatus) {
    alertCaller.popUp({
      caption: i18n.lang.alert.oops,
      message: i18n.lang.web_cam.no_device,
      messageIcon: 'warning',
    });

    return false;
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <PromarkCalibration
        device={device}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export default PromarkCalibration;
