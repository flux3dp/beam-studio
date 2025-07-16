import React, { useCallback, useRef, useState } from 'react';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV2, FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import CalibrateChessBoard from './AdorCalibrationV2/CalibrateChessBoard';
import CheckPictures from './AdorCalibrationV2/CheckPictures';
import StepElevate from './AdorCalibrationV2/StepElevate';
import { getMaterialHeight, prepareToTakePicture, saveCheckPoint } from './AdorCalibrationV2/utils';
import CheckpointData from './common/CheckpointData';
import Instruction from './common/Instruction';
import SolvePnP from './common/SolvePnP';
import { adorPnPPoints } from './common/solvePnPConstants';

/* eslint-disable perfectionist/sort-enums */
const enum Step {
  CHECKPOINT_DATA = 0,
  CHECK_PICTURE = 1,
  CALIBRATE_CHESSBOARD = 2,
  PUT_PAPER = 3,
  SOLVE_PNP_INSTRUCTION_1 = 4,
  SOLVE_PNP_1 = 5,
  ELEVATED_CUT = 6,
  SOLVE_PNP_2 = 7,
  FINISH = 8,
}
/* eslint-enable perfectionist/sort-enums */

const PROGRESS_ID = 'fisheye-calibration-v2';
const DIALOG_ID = 'fisheye-calibration-v2';

interface Props {
  factoryMode?: boolean;
  onClose: (completed?: boolean) => void;
}

const AdorCalibrationV2 = ({ factoryMode = false, onClose }: Props): React.JSX.Element => {
  const calibratingParam = useRef<FisheyeCameraParametersV2Cali>({});
  const lang = useI18n();
  const tCali = lang.calibration;
  const [step, setStep] = useState<Step>(Step.CHECKPOINT_DATA);
  const onBack = useCallback(() => setStep((prev) => prev - 1), []);
  const onNext = useCallback(() => setStep((prev) => prev + 1), []);
  const updateParam = useCallback((param: FisheyeCameraParametersV2Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  return match(step)
    .with(Step.CHECKPOINT_DATA, () => (
      <CheckpointData
        askUser={factoryMode}
        onClose={onClose}
        onNext={(res) => {
          if (res) {
            console.log('calibratingParam.current', calibratingParam.current);
            setStep(Step.PUT_PAPER);
          } else {
            setStep(factoryMode ? Step.CALIBRATE_CHESSBOARD : Step.CHECK_PICTURE);
          }
        }}
        updateParam={updateParam}
      />
    ))
    .with(Step.CHECK_PICTURE, () => (
      <CheckPictures
        onClose={onClose}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          await saveCheckPoint(calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.PUT_PAPER);
        }}
        updateParam={updateParam}
      />
    ))
    .with(Step.CALIBRATE_CHESSBOARD, () => (
      <CalibrateChessBoard
        onBack={() => setStep(Step.CHECKPOINT_DATA)}
        onClose={onClose}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          await saveCheckPoint(calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.PUT_PAPER);
        }}
        updateParam={updateParam}
      />
    ))
    .with(Step.PUT_PAPER, () => {
      const handleNext = async (doCutting = true) => {
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);

        if (!deviceStatus) {
          return;
        }

        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.getting_plane_height,
        });
        try {
          const height = await getMaterialHeight();
          const dh = height - calibratingParam.current.refHeight!;

          console.log('height', height);
          calibratingParam.current.dh1 = dh;

          progressCaller.update(PROGRESS_ID, { message: tCali.drawing_calibration_image });

          if (doCutting) {
            await deviceMaster.doAdorCalibrationV2();
          }

          progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });
          await prepareToTakePicture();
          setStep(Step.SOLVE_PNP_INSTRUCTION_1);
        } catch (err) {
          console.error(err);
        } finally {
          progressCaller.popById(PROGRESS_ID);
        }
      };

      return (
        <Instruction
          animationSrcs={[
            { src: 'video/ador-calibration-2/paper.webm', type: 'video/webm' },
            { src: 'video/ador-calibration-2/paper.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            { label: tCali.back, onClick: () => setStep(Step.CHECKPOINT_DATA) },
            // { label: tCali.skip, onClick: () => handleNext(false) },
            { label: tCali.start_engrave, onClick: () => handleNext(true), type: 'primary' },
          ]}
          onClose={() => onClose(false)}
          steps={[tCali.put_paper_step1, tCali.put_paper_step2, tCali.put_paper_step3]}
          title={tCali.put_paper}
        />
      );
    })
    .with(Step.SOLVE_PNP_INSTRUCTION_1, () => (
      <Instruction
        animationSrcs={[
          { src: 'video/ador-calibration-2/align.webm', type: 'video/webm' },
          { src: 'video/ador-calibration-2/align.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          { label: tCali.back, onClick: () => setStep(Step.PUT_PAPER) },
          { label: tCali.next, onClick: onNext, type: 'primary' },
        ]}
        onClose={() => onClose(false)}
        steps={[tCali.solve_pnp_step1, tCali.solve_pnp_step2]}
        title={tCali.solve_pnp_title}
      />
    ))
    .with(Step.SOLVE_PNP_1, () => (
      <SolvePnP
        dh={calibratingParam.current.dh1!}
        hasNext
        onBack={() => setStep(Step.SOLVE_PNP_INSTRUCTION_1)}
        onClose={onClose}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({ heights: [calibratingParam.current.dh1!], rvec, rvecs: [rvec], tvec, tvecs: [tvec] });
          await cameraCalibrationApi.updateData(calibratingParam.current);
          await saveCheckPoint(calibratingParam.current);
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.ELEVATED_CUT);
        }}
        params={calibratingParam.current}
        refPoints={adorPnPPoints}
      />
    ))
    .with(Step.ELEVATED_CUT, () => {
      const handleNext = async () => {
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);

        if (!deviceStatus) {
          return;
        }

        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.getting_plane_height,
        });
        try {
          const height = await getMaterialHeight();

          console.log('height', height);

          const dh = height - calibratingParam.current.refHeight!;

          console.log('dh', dh);
          calibratingParam.current.dh2 = dh;
          progressCaller.update(PROGRESS_ID, { message: tCali.drawing_calibration_image });
          await deviceMaster.doAdorCalibrationV2();
          progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });
          await prepareToTakePicture();
          onNext();
        } catch (err) {
          console.error(err);
        } finally {
          progressCaller.popById(PROGRESS_ID);
        }
      };

      return <StepElevate onBack={() => setStep(Step.SOLVE_PNP_1)} onClose={onClose} onNext={handleNext} />;
    })
    .otherwise(() => (
      <SolvePnP
        dh={calibratingParam.current.dh2!}
        onBack={onBack}
        onClose={onClose}
        onNext={async (rvec, tvec) => {
          const { heights, rvecs, tvecs } = calibratingParam.current;

          rvecs!.push(rvec);
          tvecs!.push(tvec);
          heights!.push(calibratingParam.current.dh2!);
          updateParam({ heights, rvecs, tvecs });

          const { data, success } = await cameraCalibrationApi.extrinsicRegression(rvecs!, tvecs!, heights!);

          if (!success) {
            alertCaller.popUpError({ message: 'Failed to do extrinsic regression.' });

            return;
          }

          updateParam(data!);
          console.log('calibratingParam.current', calibratingParam.current);

          const param: FisheyeCameraParametersV2 = {
            d: calibratingParam.current.d!,
            k: calibratingParam.current.k!,
            levelingData: calibratingParam.current.levelingData!,
            refHeight: calibratingParam.current.refHeight!,
            rvec: calibratingParam.current.rvec!,
            rvec_polyfit: calibratingParam.current.rvec_polyfit!,
            source: calibratingParam.current.source,
            tvec: calibratingParam.current.tvec!,
            tvec_polyfit: calibratingParam.current.tvec_polyfit!,
            v: 2,
          };
          const res = await setFisheyeConfig(param);

          if (res.status === 'ok') {
            alertCaller.popUp({ message: tCali.camera_parameter_saved_successfully });
            onClose(true);
          } else {
            alertCaller.popUpError({
              message: `${tCali.failed_to_save_camera_parameter}:<br />${JSON.stringify(res)}`,
            });
          }
        }}
        params={calibratingParam.current}
        refPoints={adorPnPPoints}
      />
    ));
};

export const showAdorCalibrationV2 = async (factoryMode = false): Promise<boolean> => {
  if (dialogCaller.isIdExist(DIALOG_ID)) {
    return false;
  }

  return new Promise((resolve) => {
    dialogCaller.addDialogComponent(
      DIALOG_ID,
      <AdorCalibrationV2
        factoryMode={factoryMode}
        onClose={(completed = false) => {
          dialogCaller.popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />,
    );
  });
};

export default AdorCalibrationV2;
