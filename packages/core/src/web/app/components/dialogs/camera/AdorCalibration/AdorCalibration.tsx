import React, { useCallback, useRef, useState } from 'react';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { adorPnPPoints } from '@core/app/constants/fisheyeCameraConstants';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV2, FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import styles from '../Calibration.module.scss';
import ChArUco from '../common/ChArUco';
import { applyCheckpointData } from '../common/checkpointData';
import { downloadCalibrationFile } from '../common/downloadCalibrationFile';
import Instruction from '../common/Instruction';
import SolvePnP from '../common/SolvePnP';

import CalibrateChessBoard from './CalibrateChessBoard';
import StepElevate from './StepElevate';
import { getMaterialHeight, prepareToTakePicture, saveCheckPoint } from './utils';

/* eslint-disable perfectionist/sort-enums */
const enum Step {
  PREPARE_CALIBRATION = 2,
  CALIBRATE = 3,
  PUT_PAPER = 4,
  SOLVE_PNP_INSTRUCTION_1 = 5,
  SOLVE_PNP_1 = 6,
  ELEVATED_CUT = 7,
  SOLVE_PNP_2 = 8,
  FINISH = 9,
}
/* eslint-enable perfectionist/sort-enums */

const PROGRESS_ID = 'fisheye-calibration-v2';

interface Props {
  currentData?: FisheyeCameraParametersV2Cali | null;
  factoryMode?: boolean;
  isAdvanced?: boolean;
  onClose: (completed?: boolean) => void;
}

const AdorCalibration = ({
  currentData,
  factoryMode = false,
  isAdvanced = false,
  onClose,
}: Props): React.JSX.Element => {
  const calibratingParam = useRef<FisheyeCameraParametersV2Cali>(!factoryMode ? (currentData ?? {}) : {});
  const lang = useI18n();
  const tCali = lang.calibration;
  const [step, setStep] = useState<Step>(
    isAdvanced ? Step.PREPARE_CALIBRATION : factoryMode ? Step.CALIBRATE : Step.PUT_PAPER,
  );
  const onBack = useCallback(() => setStep((prev) => prev - 1), []);
  const onNext = useCallback(() => setStep((prev) => prev + 1), []);
  const updateParam = useCallback((param: FisheyeCameraParametersV2Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  return match(step)
    .with(Step.PREPARE_CALIBRATION, () => {
      return (
        <Instruction
          animationSrcs={[
            { src: 'video/ador-calibration/calibrate.webm', type: 'video/webm' },
            { src: 'video/ador-calibration/calibrate.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            {
              label: tCali.next,
              onClick: onNext,
              type: 'primary',
            },
          ]}
          onClose={onClose}
          steps={[tCali.put_charuco_bm2_1, tCali.put_charuco_bm2_2]}
          title={tCali.put_charuco}
        >
          <div className={styles.link} onClick={() => downloadCalibrationFile('assets/charuco-15-10.pdf')}>
            {tCali.download_calibration_pattern}
          </div>
        </Instruction>
      );
    })
    .with(Step.CALIBRATE, () => {
      if (isAdvanced) {
        return (
          <ChArUco
            calibrationThresholds={{ average: 3, good: 2 }}
            isVertical
            onClose={onClose}
            onNext={() => {
              // ChArUco only sets the intrinsics; seed the flat-board leveling values that
              // PUT_PAPER and the final param expect, matching CalibrateChessBoard.
              updateParam({
                levelingData: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 },
                refHeight: 0,
                source: 'device',
              });
              onNext();
            }}
            onPrev={onBack}
            steps={[
              { key: 'left', name: tCali.charuco_position_left },
              { key: 'center', name: tCali.charuco_position_center },
              { key: 'right', name: tCali.charuco_position_right },
            ].map(({ key, name }) => ({
              imageUrl: `core-img/calibration/ador-charuco-${key}.jpg`,
              key,
              name,
            }))}
            updateParam={updateParam}
          />
        );
      }

      return (
        <CalibrateChessBoard
          onBack={() => onClose(false)}
          onClose={onClose}
          onNext={async () => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
            await saveCheckPoint(calibratingParam.current);
            progressCaller.popById(PROGRESS_ID);
            setStep(Step.PUT_PAPER);
          }}
          onSkip={
            currentData
              ? async () => {
                  if (await applyCheckpointData(currentData)) {
                    updateParam(currentData);
                    setStep(Step.PUT_PAPER);
                  }
                }
              : undefined
          }
          updateParam={updateParam}
        />
      );
    })
    .with(Step.PUT_PAPER, () => {
      const handleNext = async (doCutting = true) => {
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice!.info);

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
            { src: 'video/ador-calibration/paper.webm', type: 'video/webm' },
            { src: 'video/ador-calibration/paper.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            { label: tCali.cancel, onClick: () => onClose(false) },
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
          { src: 'video/ador-calibration/align.webm', type: 'video/webm' },
          { src: 'video/ador-calibration/align.mp4', type: 'video/mp4' },
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
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice!.info);

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

export default AdorCalibration;
