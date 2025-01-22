import React, { useCallback, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import getLevelingData from '@core/app/actions/camera/preview-helper/getLevelingData';
import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { extrinsicRegression, setFisheyeConfig, updateData } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV2, FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import CalibrateChessBoard from './AdorCalibrationV2/CalibrateChessBoard';
import CheckPictures from './AdorCalibrationV2/CheckPictures';
import FindCorner from './AdorCalibrationV2/FindCorner';
import StepElevate from './AdorCalibrationV2/StepElevate';
import { getMaterialHeight, prepareToTakePicture, saveCheckPoint } from './AdorCalibrationV2/utils';
import CheckpointData from './common/CheckpointData';
import Instruction from './common/Instruction';
import SolvePnP from './common/SolvePnP';
import { adorPnPPoints } from './common/solvePnPConstants';

enum Step {
  ASK_CAMERA_TYPE = 3,
  CALIBRATE_CHESSBOARD = 2,
  CHECK_PICTURE = 1,
  CHECKPOINT_DATA = 0,
  ELEVATED_CUT = 8,
  FIND_CORNER = 5,
  FINISH = 10,
  PUT_PAPER = 4,
  SOLVE_PNP_1 = 7,
  SOLVE_PNP_2 = 9,
  SOLVE_PNP_INSTRUCTION_1 = 6,
}

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
  const [withPitch, setWithPitch] = useState(false);
  const [step, setStep] = useState<Step>(Step.CHECKPOINT_DATA);
  const [usePreviousData, setUsePreviousData] = useState(false);
  const onBack = useCallback(() => setStep((prev) => prev - 1), []);
  const onNext = useCallback(() => setStep((prev) => prev + 1), []);
  const updateParam = useCallback((param: FisheyeCameraParametersV2Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  if (step === Step.CHECKPOINT_DATA) {
    return (
      <CheckpointData
        askUser={factoryMode}
        onClose={onClose}
        onNext={(res) => {
          if (res) {
            setUsePreviousData(true);
            console.log('calibratingParam.current', calibratingParam.current);

            const { heights, source } = calibratingParam.current;

            if (heights?.length > 0 && source === 'user') {
              setStep(Step.ELEVATED_CUT);
            } else {
              setStep(Step.PUT_PAPER);
            }
          } else {
            setStep(factoryMode ? Step.CALIBRATE_CHESSBOARD : Step.CHECK_PICTURE);
          }
        }}
        updateParam={updateParam}
      />
    );
  }

  if (step === Step.CHECK_PICTURE) {
    return (
      <CheckPictures
        onClose={onClose}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          await saveCheckPoint(calibratingParam.current);
          setUsePreviousData(true);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.PUT_PAPER);
        }}
        updateParam={updateParam}
      />
    );
  }

  if (step === Step.CALIBRATE_CHESSBOARD) {
    return (
      <CalibrateChessBoard
        onBack={() => setStep(Step.CHECKPOINT_DATA)}
        onClose={onClose}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          await saveCheckPoint(calibratingParam.current);
          setUsePreviousData(true);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.PUT_PAPER);
        }}
        updateParam={updateParam}
      />
    );
  }

  if (step === Step.ASK_CAMERA_TYPE) {
    const onClick = (val: boolean) => {
      setWithPitch(val);
      onNext();
    };

    return (
      <Instruction
        animationSrcs={[]}
        buttons={[
          { label: '正拍', onClick: () => onClick(false), type: 'primary' },
          { label: '斜拍', onClick: () => onClick(true), type: 'primary' },
        ]}
        onClose={() => onClose(false)}
        title="Please Select your camera type"
      />
    );
  }

  if (step === Step.PUT_PAPER) {
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

        console.log('height', height);

        if (usePreviousData) {
          const dh = height - calibratingParam.current.refHeight;

          calibratingParam.current.dh1 = dh;
        } else {
          calibratingParam.current.refHeight = height;
        }

        progressCaller.update(PROGRESS_ID, { message: tCali.drawing_calibration_image });

        if (doCutting) {
          if (usePreviousData) {
            await deviceMaster.doAdorCalibrationV2(2);
          } else {
            await deviceMaster.doAdorCalibrationV2(1, withPitch);
          }
        }

        progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });
        await prepareToTakePicture();
        setStep(usePreviousData ? Step.SOLVE_PNP_INSTRUCTION_1 : Step.FIND_CORNER);
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
  }

  if (step === Step.FIND_CORNER) {
    return (
      <FindCorner
        onBack={() => setStep(Step.PUT_PAPER)}
        onClose={onClose}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });

          const levelingData = await getLevelingData('hexa_platform');
          const refHeight = levelingData.E;

          Object.keys(levelingData).forEach((key) => {
            levelingData[key] = refHeight - levelingData[key];
          });
          updateParam({ levelingData });
          await saveCheckPoint(calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.ELEVATED_CUT);
        }}
        updateParam={updateParam}
        withPitch={withPitch}
      />
    );
  }

  if (step === Step.SOLVE_PNP_INSTRUCTION_1) {
    return (
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
    );
  }

  if (step === Step.SOLVE_PNP_1) {
    return (
      <SolvePnP
        dh={calibratingParam.current.dh1}
        hasNext
        onBack={() => setStep(Step.SOLVE_PNP_INSTRUCTION_1)}
        onClose={onClose}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({
            heights: [calibratingParam.current.dh1],
            rvec,
            rvecs: [rvec],
            tvec,
            tvecs: [tvec],
          });
          await updateData(calibratingParam.current);
          await saveCheckPoint(calibratingParam.current);
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.ELEVATED_CUT);
        }}
        params={calibratingParam.current}
        refPoints={adorPnPPoints}
      />
    );
  }

  if (step === Step.ELEVATED_CUT) {
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

        const dh = height - calibratingParam.current.refHeight;

        console.log('dh', dh);
        calibratingParam.current.dh2 = dh;
        progressCaller.update(PROGRESS_ID, { message: tCali.drawing_calibration_image });
        await deviceMaster.doAdorCalibrationV2(2);
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
  }

  return (
    <SolvePnP
      dh={calibratingParam.current.dh2}
      onBack={onBack}
      onClose={onClose}
      onNext={async (rvec, tvec) => {
        const { heights, rvecs, tvecs } = calibratingParam.current;

        rvecs.push(rvec);
        tvecs.push(tvec);
        heights.push(calibratingParam.current.dh2);
        updateParam({ heights, rvecs, tvecs });

        const { data, success } = await extrinsicRegression(rvecs, tvecs, heights);

        if (!success) {
          alertCaller.popUpError({ message: 'Failed to do extrinsic regression.' });

          return;
        }

        updateParam(data);
        console.log('calibratingParam.current', calibratingParam.current);

        const param: FisheyeCameraParametersV2 = {
          d: calibratingParam.current.d,
          k: calibratingParam.current.k,
          levelingData: calibratingParam.current.levelingData,
          refHeight: calibratingParam.current.refHeight,
          rvec: calibratingParam.current.rvec,
          rvec_polyfit: calibratingParam.current.rvec_polyfit,
          source: calibratingParam.current.source,
          tvec: calibratingParam.current.tvec,
          tvec_polyfit: calibratingParam.current.tvec_polyfit,
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
  );
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
