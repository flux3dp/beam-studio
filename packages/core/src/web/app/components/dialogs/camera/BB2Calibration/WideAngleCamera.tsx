import { type ReactNode, useCallback, useRef } from 'react';

import { match } from 'ts-pattern';
import { create } from 'zustand';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { extrinsicRegression } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import getFocalDistance from '@core/helpers/device/camera/getFocalDistance';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV2, FisheyeCameraParametersV2Cali } from '@core/interfaces/FisheyePreview';

import Instruction from '../common/Instruction';
import SolvePnP from '../common/SolvePnP';
import { bb2WideAngleCameraPnPPoints } from '../common/solvePnPConstants';

import movePlatformRel from './movePlatformRel';
import saveWideAngleCameraData from './saveWideAngleCameraData';
import SolvePnPInstruction from './SolvePnPInstruction';

/* eslint-disable perfectionist/sort-enums */
const enum Step {
  PUT_PAPER = 0,
  SOLVE_PNP_INSTRUCTION = 1,
  SOLVE_PNP = 2,
  SOLVE_PNP_INSTRUCTION_2 = 3,
  SOLVE_PNP_2 = 4,
}
/* eslint-enable perfectionist/sort-enums */

type State = {
  next: () => void;
  prev: () => void;
  setStep: (step: Step) => void;
  step: Step;
};

const useStepStore = create<State>((set) => ({
  next: () => set((state) => ({ step: state.step + 1 })),
  prev: () => set((state) => ({ step: state.step - 1 })),
  setStep: (step) => set({ step }),
  step: Step.PUT_PAPER,
}));

// assuming the k, d are the same for all cameras
// the rvec, tvec are used value from h = 60, use to find points when solving PnP
const DEFAULT_CAMERA_PARAMETER = {
  d: [[0], [0.31277957], [-0.23746459], [0.04616168]],
  k: [
    [1331.73242, -4.3240903, 2808.98956],
    [0, 1408.65288, 2084.46695],
    [0, 0, 1],
  ],
  refHeight: 0,
  rvec: [0.66006278, -0.14174316, 0.0604464],
  tvec: [-264.27980408, -70.06600659, 44.35713459],
};

interface Props {
  onClose: (completed?: boolean) => void;
}

const WideAngleCamera = ({ onClose }: Props): ReactNode => {
  const PROGRESS_ID = 'bb2-calibration';
  const { calibration: tCali, device: tDevice } = useI18n();
  const { next, prev, step } = useStepStore();
  const calibratingParam = useRef<FisheyeCameraParametersV2Cali>({ ...DEFAULT_CAMERA_PARAMETER });

  const updateParam = useCallback((param: FisheyeCameraParametersV2Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  return match<Step, ReactNode>(step)
    .with(Step.PUT_PAPER, () => {
      const handleNext = async (doEngraving = true) => {
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);

        if (!deviceStatus) return;

        try {
          progressCaller.openNonstopProgress({
            id: PROGRESS_ID,
            message: 'getting platform height',
          });

          const height = await getFocalDistance();

          updateParam({ dh1: height });
          progressCaller.update(PROGRESS_ID, { message: tCali.drawing_calibration_image });

          if (doEngraving) {
            await deviceMaster.doBB2Calibration('wide-angle');
          } else {
            await deviceMaster.enterRawMode();
            await deviceMaster.rawHome();
            await deviceMaster.endSubTask();
          }

          next();
        } catch (err) {
          console.error(err);
        } finally {
          progressCaller.popById(PROGRESS_ID);
        }
      };

      return (
        <Instruction
          animationSrcs={[
            { src: 'video/bb2-calibration/2-cut.webm', type: 'video/webm' },
            { src: 'video/bb2-calibration/2-cut.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            { label: tCali.cancel, onClick: () => onClose(false) },
            { label: tCali.skip, onClick: () => handleNext(false) },
            { label: tCali.start_engrave, onClick: () => handleNext(), type: 'primary' },
          ]}
          onClose={() => onClose(false)}
          steps={[
            tCali.put_paper_step1,
            tCali.put_paper_step2,
            tCali.perform_autofocus_bb2,
            tCali.put_paper_step3,
            tCali.put_paper_skip,
          ]}
          title={tCali.put_paper}
        />
      );
    })
    .with(Step.SOLVE_PNP_INSTRUCTION, Step.SOLVE_PNP_INSTRUCTION_2, () => (
      <SolvePnPInstruction onClose={onClose} onNext={next} onPrev={prev} />
    ))
    .with(Step.SOLVE_PNP, () => {
      const dh1 = calibratingParam.current.dh1!;

      return (
        <SolvePnP
          cameraIndex={1}
          dh={dh1!}
          hasNext
          onBack={prev}
          onClose={onClose}
          onNext={async (rvec, tvec) => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });
            updateParam({ heights: [dh1!], rvec, rvecs: [rvec], tvec, tvecs: [tvec] });
            console.log('calibratingParam.current', calibratingParam.current);
            progressCaller.update(PROGRESS_ID, { message: 'Moving platform' });
            await movePlatformRel(-40);
            updateParam({ dh2: dh1! - 40 });
            progressCaller.popById(PROGRESS_ID);
            next();
          }}
          params={calibratingParam.current}
          refPoints={bb2WideAngleCameraPnPPoints}
        />
      );
    })
    .with(Step.SOLVE_PNP_2, () => {
      const { dh1, dh2, rvecs, tvecs } = calibratingParam.current;
      const rvec1 = rvecs![0];
      const tvec1 = tvecs![0];

      return (
        <SolvePnP
          cameraIndex={1}
          dh={dh2!}
          onBack={prev}
          onClose={onClose}
          onNext={async (rvec, tvec) => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });
            try {
              const { data, success } = await extrinsicRegression([rvec1, rvec], [tvec1, tvec], [dh1!, dh2!]);

              if (!success) {
                alertCaller.popUpError({ message: 'Failed to do extrinsic regression.' });

                return;
              }

              updateParam(data!);

              const param: FisheyeCameraParametersV2 = {
                ...DEFAULT_CAMERA_PARAMETER,
                rvec: rvec1,
                rvec_polyfit: data!.rvec_polyfit!,
                tvec: tvec1,
                tvec_polyfit: data!.rvec_polyfit!,
                v: 2,
              };

              await saveWideAngleCameraData(param);
              alertCaller.popUp({ message: tCali.camera_parameter_saved_successfully });
              console.log('calibratingParam.current', calibratingParam.current);
              onClose(true);
            } finally {
              progressCaller.popById(PROGRESS_ID);
            }
          }}
          params={calibratingParam.current}
          refPoints={bb2WideAngleCameraPnPPoints}
        />
      );
    })
    .otherwise(() => null);
};

export default WideAngleCamera;
