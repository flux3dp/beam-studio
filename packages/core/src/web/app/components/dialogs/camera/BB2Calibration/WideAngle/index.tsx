import { type ReactNode, useCallback, useRef, useState } from 'react';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { solvePnPCalculate } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import getFocalDistance from '@core/helpers/device/camera/getFocalDistance';
import { loadJson } from '@core/helpers/device/jsonDataHelper';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV4Cali, WideAngleRegion } from '@core/interfaces/FisheyePreview';

import CheckpointData from '../../common/CheckpointData';
import Instruction from '../../common/Instruction';
import ProcessingDialog from '../../common/ProcessingDialog';
import SolvePnP from '../../common/SolvePnP';
import { bb2WideAngleCameraPnpPoints, getBB2WideAnglePoints } from '../../common/solvePnPConstants';
import movePlatformRel from '../movePlatformRel';
import SolvePnPInstruction from '../SolvePnPInstruction';

const enum Step {
  CHECK_DATA,
  PUT_PAPER,
  SOLVE_PNP_INSTRUCTION,
  SOLVE_PNP_TL_1,
  SOLVE_PNP_TR_1,
  SOLVE_PNP_BL_1,
  SOLVE_PNP_BR_1,
  SOLVE_OTHER_PNP_1,
  SOLVE_PNP_INSTRUCTION_2,
  SOLVE_PNP_TL_2,
  SOLVE_PNP_TR_2,
  SOLVE_PNP_BL_2,
  SOLVE_PNP_BR_2,
  SOLVE_OTHER_PNP_2,
  SOLVE_PNP_2,
}

interface Props {
  onClose: (completed?: boolean) => void;
}

const WideAngleCamera = ({ onClose }: Props): ReactNode => {
  const PROGRESS_ID = 'bb2-calibration';
  const { calibration: tCali, device: tDevice } = useI18n();
  const [step, setStep] = useState(Step.PUT_PAPER);
  const next = useCallback(() => setStep((cur) => cur + 1), []);
  const prev = useCallback(() => setStep((cur) => cur - 1), []);

  const calibratingParam = useRef<FisheyeCameraParametersV4Cali>({});
  const handleClose = (res?: boolean) => {
    progressCaller.popById(PROGRESS_ID);
    onClose(res);
    setStep(Step.CHECK_DATA);
  };

  console.log(calibratingParam.current);

  const updateParam = useCallback((param: FisheyeCameraParametersV4Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  return match<Step, ReactNode>(step)
    .with(Step.CHECK_DATA, () => {
      return (
        <CheckpointData
          allowCheckPoint={false}
          askUser={false}
          getData={async () => loadJson('fisheye', 'wide-angle.json') as FisheyeCameraParametersV4Cali}
          onClose={handleClose}
          onNext={(res: boolean) => {
            if (res) {
              setStep(Step.PUT_PAPER);
            } else {
              alertCaller.popUpError({
                message: tCali.unable_to_load_camera_parameters,
              });
              handleClose(false);
            }
          }}
          updateParam={updateParam}
        />
      );
    })
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
            { label: tCali.cancel, onClick: () => handleClose(false) },
            { label: tCali.skip, onClick: () => handleNext(false) },
            { label: tCali.start_engrave, onClick: () => handleNext(), type: 'primary' },
          ]}
          onClose={() => handleClose(false)}
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
      <SolvePnPInstruction onClose={handleClose} onNext={next} onPrev={prev} />
    ))
    .with(
      Step.SOLVE_PNP_TL_1,
      Step.SOLVE_PNP_TR_1,
      Step.SOLVE_PNP_BL_1,
      Step.SOLVE_PNP_BR_1,
      Step.SOLVE_PNP_TL_2,
      Step.SOLVE_PNP_TR_2,
      Step.SOLVE_PNP_BL_2,
      Step.SOLVE_PNP_BR_2,
      (step) => {
        const region = match<typeof step, keyof typeof bb2WideAngleCameraPnpPoints>(step)
          .with(Step.SOLVE_PNP_TL_1, Step.SOLVE_PNP_TL_2, () => 'topLeft')
          .with(Step.SOLVE_PNP_TR_1, Step.SOLVE_PNP_TR_2, () => 'topRight')
          .with(Step.SOLVE_PNP_BL_1, Step.SOLVE_PNP_BL_2, () => 'bottomLeft')
          .otherwise(() => 'bottomRight');

        const keys = match<
          typeof step,
          {
            dh: 'dh1' | 'dh2';
            imgPoints: 'imgPoints1' | 'imgPoints2';
            rvecs: 'rvecs1' | 'rvecs2';
            tvecs: 'tvecs1' | 'tvecs2';
          }
        >(step)
          .with(Step.SOLVE_PNP_TL_1, Step.SOLVE_PNP_TR_1, Step.SOLVE_PNP_BL_1, Step.SOLVE_PNP_BR_1, () => ({
            dh: 'dh1',
            imgPoints: 'imgPoints1',
            rvecs: 'rvecs1',
            tvecs: 'tvecs1',
          }))
          .otherwise(() => ({ dh: 'dh2', imgPoints: 'imgPoints2', rvecs: 'rvecs2', tvecs: 'tvecs2' }));

        return (
          <SolvePnP
            cameraIndex={1}
            dh={calibratingParam.current[keys.dh]!}
            hasNext
            onBack={async () => {
              if (step === Step.SOLVE_PNP_TL_2) {
                progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: 'Moving platform' });
                await movePlatformRel(40);
                progressCaller.popById(PROGRESS_ID);
              }

              prev();
            }}
            onClose={handleClose}
            onNext={async (rvec, tvec, point) => {
              progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });
              updateParam({
                [keys.imgPoints]: { ...calibratingParam.current[keys.imgPoints], [region]: point },
                [keys.rvecs]: { ...calibratingParam.current[keys.rvecs], [region]: rvec },
                [keys.tvecs]: { ...calibratingParam.current[keys.tvecs], [region]: tvec },
                rvec,
                tvec,
              });
              console.log('calibratingParam.current', calibratingParam.current);
              progressCaller.popById(PROGRESS_ID);
              next();
            }}
            params={calibratingParam.current}
            refPoints={bb2WideAngleCameraPnpPoints[region]}
          />
        );
      },
    )
    .with(Step.SOLVE_OTHER_PNP_1, Step.SOLVE_OTHER_PNP_2, (step) => {
      const keys: {
        dh: 'dh1' | 'dh2';
        imgPoints: 'imgPoints1' | 'imgPoints2';
        rvecs: 'rvecs1' | 'rvecs2';
        tvecs: 'tvecs1' | 'tvecs2';
      } =
        step === Step.SOLVE_OTHER_PNP_1
          ? { dh: 'dh1', imgPoints: 'imgPoints1', rvecs: 'rvecs1', tvecs: 'tvecs1' }
          : { dh: 'dh2', imgPoints: 'imgPoints2', rvecs: 'rvecs2', tvecs: 'tvecs2' };

      return (
        <ProcessingDialog
          onClose={handleClose}
          onNext={next}
          process={async () => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });

            const { [keys.dh]: dh, [keys.imgPoints]: imgPoints } = calibratingParam.current;
            const regions = ['left', 'bottom', 'right', 'top', 'center'] as const;

            for (let i = 0; i < regions.length; i++) {
              const region = regions[i];
              const imgPoint = getBB2WideAnglePoints(
                region,
                imgPoints as Record<WideAngleRegion, Array<[number, number]>>,
              );
              const refPoints = getBB2WideAnglePoints(region, bb2WideAngleCameraPnpPoints);
              const res = await solvePnPCalculate(dh!, imgPoint, refPoints);

              if (res.success) {
                const { rvec, tvec } = res.data;

                updateParam({
                  [keys.rvecs]: { ...calibratingParam.current[keys.rvecs], [region]: rvec },
                  [keys.tvecs]: { ...calibratingParam.current[keys.tvecs], [region]: tvec },
                });
              }
            }
            console.log('Finished solving PnP for all regions', calibratingParam.current);

            if (step === Step.SOLVE_OTHER_PNP_1) {
              progressCaller.update(PROGRESS_ID, { message: 'Moving platform' });
              await movePlatformRel(-40);
              updateParam({ dh2: dh! - 40 });
            }

            progressCaller.popById(PROGRESS_ID);
          }}
        />
      );
    })
    .otherwise(() => null);
};

export default WideAngleCamera;
