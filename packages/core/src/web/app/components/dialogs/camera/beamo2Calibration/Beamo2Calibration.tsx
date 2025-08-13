import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import DoorChecker from '@core/app/actions/camera/preview-helper/DoorChecker';
import progressCaller from '@core/app/actions/progress-caller';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type {
  FisheyeCameraParametersV4,
  FisheyeCameraParametersV4Cali,
  WideAngleRegion,
} from '@core/interfaces/FisheyePreview';

import styles from '../Calibration.module.scss';
import ChArUco from '../common/ChArUco';
import CheckPnP from '../common/CheckPnP';
import CheckpointData from '../common/CheckpointData';
import downloadCalibrationFile from '../common/downloadCalibrationFile';
import Instruction from '../common/Instruction';
import moveLaserHead from '../common/moveLaserHead';
import ProcessingDialog from '../common/ProcessingDialog';
import SolvePnP from '../common/SolvePnP';
import { bm2PerspectiveGrid, bm2PnPPoints, getRegionalPoints } from '../common/solvePnPConstants';

/* eslint-disable perfectionist/sort-objects */
const Steps = {
  CHECK_DATA: 0,
  PRE_CHESSBOARD: 1,
  CHESSBOARD: 2,
  PUT_PAPER: 3,
  SOLVE_PNP_INSTRUCTION: 4,
  SOLVE_PNP_TL: 5,
  SOLVE_PNP_TR: 6,
  SOLVE_PNP_BL: 7,
  SOLVE_PNP_BR: 8,
  SOLVE_OTHER_PNP: 9,
  CHECK_PNP: 10,
} as const;
/* eslint-enable perfectionist/sort-objects */

export type StepsType = (typeof Steps)[keyof typeof Steps];

interface Props {
  isAdvanced: boolean;
  onClose: (completed?: boolean) => void;
}

const Beamo2Calibration = ({ isAdvanced, onClose }: Props): ReactNode => {
  const PROGRESS_ID = 'fbm2-calibration';
  const { calibration: tCalibration, device: tDevice } = useI18n();
  const calibratingParam = useRef<FisheyeCameraParametersV4Cali>({});
  const updateParam = useCallback((param: FisheyeCameraParametersV4Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);
  const [step, setStep] = useState<StepsType>(isAdvanced ? Steps.PRE_CHESSBOARD : Steps.CHECK_DATA);
  const next = useCallback(() => setStep((step) => (step + 1) as StepsType), []);
  const prev = useCallback(() => setStep((step) => (step - 1) as StepsType), []);
  const doorChecker = useRef<DoorChecker | null>(null);

  useEffect(() => {
    doorChecker.current = new DoorChecker();

    return () => {
      doorChecker.current?.destroy();
    };
  }, []);

  return match(step)
    .with(Steps.CHECK_DATA, () => {
      return (
        <CheckpointData
          allowCheckPoint={false}
          askUser={false}
          onClose={onClose}
          onNext={(res: boolean) => {
            if (res) {
              setStep(Steps.PUT_PAPER);
            } else {
              alertCaller.popUpError({
                message: tCalibration.unable_to_load_camera_parameters,
              });
              onClose(false);
            }
          }}
          updateParam={updateParam}
        />
      );
    })
    .with(Steps.PRE_CHESSBOARD, () => {
      return (
        <Instruction
          animationSrcs={[
            { src: 'video/bm2-calibration/1-chessboard.webm', type: 'video/webm' },
            { src: 'video/bm2-calibration/1-chessboard.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            {
              label: tCalibration.next,
              onClick: async () => {
                const res = await moveLaserHead([180, 25]);

                if (res) setStep(Steps.CHESSBOARD);
              },
              type: 'primary',
            },
          ]}
          onClose={onClose}
          steps={[tCalibration.put_chessboard_bm2_1, tCalibration.put_chessboard_bm2_2]}
          title={tCalibration.put_chessboard}
        >
          <div className={styles.link} onClick={() => downloadCalibrationFile('assets/charuco-15-10.pdf')}>
            {tCalibration.download_calibration_pattern}
          </div>
        </Instruction>
      );
    })
    .with(Steps.CHESSBOARD, () => {
      return (
        <ChArUco
          onClose={onClose}
          onNext={async () => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tCalibration.moving_laser_head });
            progressCaller.popById(PROGRESS_ID);
            console.log(calibratingParam.current);
            setStep(Steps.PUT_PAPER);
          }}
          onPrev={() => setStep(Steps.PRE_CHESSBOARD)}
          steps={[
            { description: tCalibration.charuco_position_left, key: 'left' },
            { description: tCalibration.charuco_position_right, key: 'right' },
          ].map(({ description, key }) => ({
            description,
            imageUrl: `core-img/calibration/bm2-charuco-${key}.jpg`,
            key,
          }))}
          updateParam={updateParam}
        />
      );
    })
    .with(Steps.PUT_PAPER, () => {
      const handleNext = async (doEngraving = true) => {
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);

        if (!deviceStatus) return;

        try {
          progressCaller.openNonstopProgress({
            id: PROGRESS_ID,
            message: tCalibration.drawing_calibration_image,
          });

          if (doEngraving) await deviceMaster.doBeamo2Calibration();

          setStep(Steps.SOLVE_PNP_INSTRUCTION);
        } catch (err) {
          console.error(err);
        } finally {
          progressCaller.popById(PROGRESS_ID);
        }
      };

      return (
        <Instruction
          animationSrcs={[
            { src: 'video/bm2-calibration/2-put-paper.webm', type: 'video/webm' },
            { src: 'video/bm2-calibration/2-put-paper.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            isAdvanced
              ? { label: tCalibration.back, onClick: () => setStep(Steps.CHESSBOARD) }
              : {
                  label: tCalibration.cancel,
                  onClick: () => onClose(false),
                },
            { label: tCalibration.skip, onClick: () => handleNext(false) },
            { label: tCalibration.start_engrave, onClick: () => handleNext(), type: 'primary' },
          ]}
          onClose={onClose}
          steps={[
            tCalibration.put_paper_bm2_1,
            tCalibration.put_paper_step2,
            tCalibration.perform_autofocus_bm2,
            tCalibration.put_paper_step3,
            tCalibration.put_paper_skip,
          ]}
          title={tCalibration.put_paper}
        />
      );
    })
    .with(Steps.SOLVE_PNP_INSTRUCTION, () => {
      return (
        <Instruction
          animationSrcs={[
            { src: 'video/bm2-calibration/3-align.webm', type: 'video/webm' },
            { src: 'video/bm2-calibration/3-align.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            { label: tCalibration.back, onClick: () => setStep(Steps.PUT_PAPER) },
            {
              label: tCalibration.next,
              onClick: async () => {
                const res = await doorChecker.current?.doorClosedWrapper(moveLaserHead);

                if (!res) return;

                setStep(Steps.SOLVE_PNP_TL);
              },
              type: 'primary',
            },
          ]}
          onClose={() => onClose(false)}
          steps={[
            tCalibration.click_next_to_take_picture,
            tCalibration.solve_pnp_keep_door_closed,
            tCalibration.solve_pnp_relocate_camera,
            tCalibration.solve_pnp_step1,
            tCalibration.solve_pnp_step2,
          ]}
          title={tCalibration.solve_pnp_title}
        />
      );
    })
    .with(Steps.SOLVE_PNP_BL, Steps.SOLVE_PNP_BR, Steps.SOLVE_PNP_TL, Steps.SOLVE_PNP_TR, (step) => {
      const { interestArea, region, solvePnPStep } = match<
        typeof step,
        {
          interestArea?: { height: number; width: number; x: number; y: number };
          region: keyof typeof bm2PnPPoints;
          solvePnPStep: number;
        }
      >(step)
        .with(Steps.SOLVE_PNP_TL, () => ({
          interestArea: { height: 2800, width: 2800, x: 0, y: 0 },
          region: 'topLeft',
          solvePnPStep: 1,
        }))
        .with(Steps.SOLVE_PNP_TR, () => ({
          interestArea: { height: 2800, width: 2800, x: 2800, y: 0 },
          region: 'topRight',
          solvePnPStep: 2,
        }))
        .with(Steps.SOLVE_PNP_BL, () => ({
          interestArea: { height: 1400, width: 2800, x: 0, y: 2100 },
          region: 'bottomLeft',
          solvePnPStep: 3,
        }))
        .otherwise(() => ({
          interestArea: { height: 1400, width: 2800, x: 2800, y: 2100 },
          region: 'bottomRight',
          solvePnPStep: 4,
        }));

      return (
        <SolvePnP
          dh={0}
          doorChecker={doorChecker.current}
          hasNext
          initInterestArea={interestArea}
          onBack={prev}
          onClose={onClose}
          onNext={async (rvec, tvec, point) => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });
            updateParam({
              imgPoints1: { ...calibratingParam.current.imgPoints1, [region]: point },
              rvec,
              rvecs1: { ...calibratingParam.current.rvecs1, [region]: rvec },
              tvec,
              tvecs1: { ...calibratingParam.current.tvecs1, [region]: tvec },
            });
            progressCaller.popById(PROGRESS_ID);
            next();
          }}
          params={calibratingParam.current}
          percent={solvePnPStep * 25}
          refPoints={bm2PnPPoints[region]}
          title={`${tCalibration.title_align_marker_points} (${solvePnPStep}/4)`}
        />
      );
    })
    .with(Steps.SOLVE_OTHER_PNP, () => {
      return (
        <ProcessingDialog
          onClose={onClose}
          onNext={next}
          process={async () => {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });

            const { imgPoints1: imgPoints } = calibratingParam.current;
            const regions = ['left', 'bottom', 'right', 'top', 'center'] as const;

            for (let i = 0; i < regions.length; i++) {
              const region = regions[i];
              const imgPoint = getRegionalPoints(region, imgPoints as Record<WideAngleRegion, Array<[number, number]>>);
              const refPoints = getRegionalPoints(region, bm2PnPPoints);
              const res = await cameraCalibrationApi.solvePnPCalculate(0, imgPoint, refPoints);

              if (res.success) {
                const { rvec, tvec } = res.data;

                updateParam({
                  rvecs1: { ...calibratingParam.current.rvecs1, [region]: rvec },
                  tvecs1: { ...calibratingParam.current.tvecs1, [region]: tvec },
                });
              }
            }
            console.log('Finished solving PnP for all regions', calibratingParam.current);

            progressCaller.popById(PROGRESS_ID);
          }}
        />
      );
    })
    .with(Steps.CHECK_PNP, () => {
      return (
        <CheckPnP
          dh={0}
          grid={bm2PerspectiveGrid}
          onBack={() => setStep(Steps.SOLVE_PNP_TL)}
          onClose={onClose}
          onNext={async () => {
            const rvecPolyfits: Record<WideAngleRegion, number[][]> = {} as any;
            const tvecPolyfits: Record<WideAngleRegion, number[][]> = {} as any;

            for (const region of Object.keys(calibratingParam.current.rvecs1!) as WideAngleRegion[]) {
              const rvec = calibratingParam.current.rvecs1?.[region]!.flat()!;
              const tvec = calibratingParam.current.tvecs1?.[region]!.flat()!;

              rvecPolyfits[region] = [
                [0, 0, 0],
                [rvec[0], rvec[1], rvec[2]],
              ];
              tvecPolyfits[region] = [
                [0, 0, 0],
                [tvec[0], tvec[1], tvec[2]],
              ];
            }

            const param: FisheyeCameraParametersV4 = {
              d: calibratingParam.current.d!,
              k: calibratingParam.current.k!,
              ret: calibratingParam.current.ret!,
              rvec: calibratingParam.current.rvec!,
              rvec_polyfits: rvecPolyfits,
              tvec: calibratingParam.current.tvec!,
              tvec_polyfits: tvecPolyfits,
              v: 4,
            };
            const res = await setFisheyeConfig(param);

            if (res.status === 'ok') {
              alertCaller.popUp({ message: tCalibration.camera_parameter_saved_successfully });
              onClose(true);
            } else {
              alertCaller.popUpError({
                message: `${tCalibration.failed_to_save_camera_parameter}:<br />${JSON.stringify(res)}`,
              });
            }
          }}
          params={{
            d: calibratingParam.current.d!,
            k: calibratingParam.current.k!,
            rvecs: calibratingParam.current.rvecs1!,
            tvecs: calibratingParam.current.tvecs1!,
          }}
          points={[
            ...bm2PnPPoints.topLeft,
            ...bm2PnPPoints.topRight,
            ...bm2PnPPoints.bottomLeft,
            ...bm2PnPPoints.bottomRight,
          ]}
        />
      );
    })
    .otherwise(() => {
      return null;
    });
};

export default Beamo2Calibration;
