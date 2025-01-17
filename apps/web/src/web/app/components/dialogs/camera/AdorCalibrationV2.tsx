import React, { useCallback, useRef, useState } from 'react';

import alertCaller from 'app/actions/alert-caller';
import checkDeviceStatus from 'helpers/check-device-status';
import deviceMaster from 'helpers/device-master';
import dialogCaller from 'app/actions/dialog-caller';
import getLevelingData from 'app/actions/camera/preview-helper/getLevelingData';
import progressCaller from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import {
  FisheyeCameraParametersV2,
  FisheyeCameraParametersV2Cali,
} from 'interfaces/FisheyePreview';
import {
  extrinsicRegression,
  setFisheyeConfig,
  updateData,
} from 'helpers/camera-calibration-helper';

import CalibrateChessBoard from './AdorCalibrationV2/CalibrateChessBoard';
import CheckpointData from './common/CheckpointData';
import CheckPictures from './AdorCalibrationV2/CheckPictures';
import FindCorner from './AdorCalibrationV2/FindCorner';
import Instruction from './common/Instruction';
import SolvePnP from './common/SolvePnP';
import StepElevate from './AdorCalibrationV2/StepElevate';
import { adorPnPPoints } from './common/solvePnPConstants';
import { getMaterialHeight, prepareToTakePicture, saveCheckPoint } from './AdorCalibrationV2/utils';

enum Step {
  CHECKPOINT_DATA = 0,
  CHECK_PICTURE = 1,
  CALIBRATE_CHESSBOARD = 2,
  ASK_CAMERA_TYPE = 3,
  PUT_PAPER = 4,
  FIND_CORNER = 5,
  SOLVE_PNP_INSTRUCTION_1 = 6,
  SOLVE_PNP_1 = 7,
  ELEVATED_CUT = 8,
  SOLVE_PNP_2 = 9,
  FINISH = 10,
}

const PROGRESS_ID = 'fisheye-calibration-v2';
const DIALOG_ID = 'fisheye-calibration-v2';

interface Props {
  factoryMode?: boolean;
  onClose: (completed?: boolean) => void;
}

const AdorCalibrationV2 = ({ factoryMode = false, onClose }: Props): JSX.Element => {
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
        updateParam={updateParam}
        onNext={(res) => {
          if (res) {
            setUsePreviousData(true);
            console.log('calibratingParam.current', calibratingParam.current);
            const { heights, source } = calibratingParam.current;
            if (heights?.length > 0 && source === 'user') setStep(Step.ELEVATED_CUT);
            else setStep(Step.PUT_PAPER);
          } else setStep(factoryMode ? Step.CALIBRATE_CHESSBOARD : Step.CHECK_PICTURE);
        }}
        onClose={onClose}
      />
    );
  }
  if (step === Step.CHECK_PICTURE) {
    return (
      <CheckPictures
        updateParam={updateParam}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          await saveCheckPoint(calibratingParam.current);
          setUsePreviousData(true);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.PUT_PAPER);
        }}
        onClose={onClose}
      />
    );
  }
  if (step === Step.CALIBRATE_CHESSBOARD) {
    return (
      <CalibrateChessBoard
        updateParam={updateParam}
        onNext={async () => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          await saveCheckPoint(calibratingParam.current);
          setUsePreviousData(true);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.PUT_PAPER);
        }}
        onBack={() => setStep(Step.CHECKPOINT_DATA)}
        onClose={onClose}
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
        onClose={() => onClose(false)}
        animationSrcs={[]}
        title="Please Select your camera type"
        buttons={[
          { label: '正拍', type: 'primary', onClick: () => onClick(false) },
          { label: '斜拍', type: 'primary', onClick: () => onClick(true) },
        ]}
      />
    );
  }
  if (step === Step.PUT_PAPER) {
    const handleNext = async (doCutting = true) => {
      const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);
      if (!deviceStatus) return;
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
          if (usePreviousData) await deviceMaster.doAdorCalibrationV2(2);
          else await deviceMaster.doAdorCalibrationV2(1, withPitch);
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
        onClose={() => onClose(false)}
        animationSrcs={[
          { src: 'video/ador-calibration-2/paper.webm', type: 'video/webm' },
          { src: 'video/ador-calibration-2/paper.mp4', type: 'video/mp4' },
        ]}
        title={tCali.put_paper}
        steps={[tCali.put_paper_step1, tCali.put_paper_step2, tCali.put_paper_step3]}
        buttons={[
          { label: tCali.back, onClick: () => setStep(Step.CHECKPOINT_DATA) },
          // { label: tCali.skip, onClick: () => handleNext(false) },
          { label: tCali.start_engrave, onClick: () => handleNext(true), type: 'primary' },
        ]}
      />
    );
  }
  if (step === Step.FIND_CORNER)
    return (
      <FindCorner
        withPitch={withPitch}
        updateParam={updateParam}
        onClose={onClose}
        onBack={() => setStep(Step.PUT_PAPER)}
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
      />
    );
  if (step === Step.SOLVE_PNP_INSTRUCTION_1) {
    return (
      <Instruction
        onClose={() => onClose(false)}
        animationSrcs={[
          { src: 'video/ador-calibration-2/align.webm', type: 'video/webm' },
          { src: 'video/ador-calibration-2/align.mp4', type: 'video/mp4' },
        ]}
        title={tCali.solve_pnp_title}
        steps={[tCali.solve_pnp_step1, tCali.solve_pnp_step2]}
        buttons={[
          { label: tCali.back, onClick: () => setStep(Step.PUT_PAPER) },
          { label: tCali.next, onClick: onNext, type: 'primary' },
        ]}
      />
    );
  }
  if (step === Step.SOLVE_PNP_1) {
    return (
      <SolvePnP
        hasNext
        params={calibratingParam.current}
        dh={calibratingParam.current.dh1}
        refPoints={adorPnPPoints}
        onClose={onClose}
        onBack={() => setStep(Step.SOLVE_PNP_INSTRUCTION_1)}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({
            rvec,
            tvec,
            rvecs: [rvec],
            tvecs: [tvec],
            heights: [calibratingParam.current.dh1],
          });
          await updateData(calibratingParam.current);
          await saveCheckPoint(calibratingParam.current);
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Step.ELEVATED_CUT);
        }}
      />
    );
  }
  if (step === Step.ELEVATED_CUT) {
    const handleNext = async () => {
      const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);
      if (!deviceStatus) return;
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
    return (
      <StepElevate onNext={handleNext} onBack={() => setStep(Step.SOLVE_PNP_1)} onClose={onClose} />
    );
  }

  return (
    <SolvePnP
      params={calibratingParam.current}
      dh={calibratingParam.current.dh2}
      refPoints={adorPnPPoints}
      onClose={onClose}
      onBack={onBack}
      onNext={async (rvec, tvec) => {
        const { rvecs, tvecs, heights } = calibratingParam.current;
        rvecs.push(rvec);
        tvecs.push(tvec);
        heights.push(calibratingParam.current.dh2);
        updateParam({ rvecs, tvecs, heights });
        const { success, data } = await extrinsicRegression(rvecs, tvecs, heights);
        if (!success) {
          alertCaller.popUpError({ message: 'Failed to do extrinsic regression.' });
          return;
        }
        updateParam(data);
        console.log('calibratingParam.current', calibratingParam.current);
        const param: FisheyeCameraParametersV2 = {
          source: calibratingParam.current.source,
          k: calibratingParam.current.k,
          d: calibratingParam.current.d,
          refHeight: calibratingParam.current.refHeight,
          rvec: calibratingParam.current.rvec,
          tvec: calibratingParam.current.tvec,
          rvec_polyfit: calibratingParam.current.rvec_polyfit,
          tvec_polyfit: calibratingParam.current.tvec_polyfit,
          levelingData: calibratingParam.current.levelingData,
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
    />
  );
};

export const showAdorCalibrationV2 = async (factoryMode = false): Promise<boolean> => {
  if (dialogCaller.isIdExist(DIALOG_ID)) return false;
  return new Promise((resolve) => {
    dialogCaller.addDialogComponent(
      DIALOG_ID,
      <AdorCalibrationV2
        factoryMode={factoryMode}
        onClose={(completed = false) => {
          dialogCaller.popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />
    );
  });
};

export default AdorCalibrationV2;
