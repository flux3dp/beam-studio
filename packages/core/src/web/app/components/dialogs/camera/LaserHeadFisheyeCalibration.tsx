import React, { useCallback, useMemo, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { bb2PerspectiveGrid, bb2PerspectiveGridWide, bb2PnPPoints } from '@core/app/constants/fisheyeCameraConstants';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useIsUnmounted from '@core/helpers/hooks/useIsUnmounted';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV3, FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import styles from './Calibration.module.scss';
import autoLocateMarks from './common/autoLocateMarks';
import ChArUco from './common/ChArUco';
import CheckPnP from './common/CheckPnP';
import downloadCalibrationFile from './common/downloadCalibrationFile';
import Instruction from './common/Instruction';
import moveLaserHead from './common/moveLaserHead';
import ProcessingDialog from './common/ProcessingDialog';
import showHighResidualAlert from './common/showHighResidualAlert';
import showNotEnoughMarksAlert from './common/showNotEnoughMarksAlert';
import SolvePnP from './common/SolvePnP';

/* eslint-disable perfectionist/sort-enums */
enum Steps {
  PRE_CHESSBOARD = 1, // For advanced usages
  CHESSBOARD = 2, // For advanced usages
  PUT_PAPER = 3,
  SOLVE_PNP_INSTRUCTION = 4,
  SOLVE_PNP = 5,
  CHECK_PNP = 6,
  // out of sequence on purpose: the manual steps 4 and 5 remain for a backend without the auto commands
  AUTO_SOLVE_PNP = 7,
}
/* eslint-enable perfectionist/sort-enums */

interface Props {
  currentData?: FisheyeCameraParametersV3Cali;
  isAdvanced: boolean;
  isOblique?: boolean;
  onClose: (completed?: boolean) => void;
  /** close this dialog and start over in advanced mode */
  onSwitchToAdvanced: () => void;
}

const PROGRESS_ID = 'laser-head-fisheye-calibration';
/**
 * Exposure rounds of the automatic step. One fbb2 found all 8 marks in a single photo at every exposure from
 * 100 to 800, with the best contrast at 200 to 300; above 800 marks wash out and stray blobs multiply, so the
 * second round stays below. Not measured on fhx2rf yet.
 */
const EXPOSURE_ROUNDS = [[250], [100, 500]] as const;
/**
 * Residual limit for the 8 marks, mm. A homography through 8 points absorbs most of one wrong mark: correct
 * matches measured 0.03 to 0.10, one mark off by 1 mm gives 0.15 to 0.31.
 */
const R_MAX_MM = 0.2;
// TODO: test on different devices
const DEFAULT_POINTS: Array<[number, number]> = [
  [2000, 1716],
  [3283, 1720],
  [2009, 2564],
  [3272, 2563],
  [2325, 1929],
  [2965, 1933],
  [2327, 2353],
  [2962, 2351],
];

const DEFAULT_POINTS_OBLIQUE: Array<[number, number]> = [
  [1625, 1078],
  [3490, 945],
  [2038, 2192],
  [3385, 2096],
  [2179, 1400],
  [3030, 1339],
  [2320, 1951],
  [3041, 1900],
];

/**
 * LaserHeadFisheye
 * calibration the fisheye camera on the laser head (bb2, hexa rf)
 */
const LaserHeadFisheyeCalibration = ({
  currentData,
  isAdvanced,
  isOblique,
  onClose,
  onSwitchToAdvanced,
}: Props): React.JSX.Element => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const calibratingParam = useRef<FisheyeCameraParametersV3Cali>(currentData ?? {});
  const [step, setStep] = useState<Steps>(isAdvanced ? Steps.PRE_CHESSBOARD : Steps.PUT_PAPER);
  const updateParam = useCallback((param: FisheyeCameraParametersV3Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);
  const model = useMemo(() => deviceMaster.currentDevice?.info.model ?? 'fbb2', []);
  const isHexaRf = useMemo(() => model === 'fhx2rf', [model]);
  // whether the pose came from the automatic step, to know where Back leads from CHECK_PNP
  const isAutoSolved = useRef(false);
  // where the manual step starts from when it is chosen after the automatic one came up short
  const manualInitialPoints = useRef<Array<[number, number]> | undefined>(undefined);
  const isUnmounted = useIsUnmounted();

  if (step === Steps.PRE_CHESSBOARD) {
    return (
      <Instruction
        animationSrcs={[
          { src: 'video/laser-head-calibration/1-charuco.webm', type: 'video/webm' },
          { src: 'video/laser-head-calibration/1-charuco.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          {
            label: tCali.next,
            onClick: () => setStep(Steps.CHESSBOARD),
            type: 'primary',
          },
        ]}
        onClose={onClose}
        steps={[tCali.put_charuco_1, tCali.put_charuco_2, tCali.put_charuco_3]}
        title={tCali.put_charuco}
      >
        <div className={styles.link} onClick={() => downloadCalibrationFile('assets/charuco-15-10-with-mark.pdf')}>
          {tCali.download_calibration_pattern}
        </div>
      </Instruction>
    );
  }

  if (step === Steps.CHESSBOARD) {
    return (
      <ChArUco
        calibrationThresholds={{ average: 3.5, good: 2.8 }}
        cameraIndex={0}
        isFisheye
        isVertical
        onClose={onClose}
        onNext={() => setStep(Steps.PUT_PAPER)}
        onPrev={() => setStep(Steps.PRE_CHESSBOARD)}
        steps={[
          {
            descriptions: [tCali.charuco_move_to_point_a, tCali.charuco_capture],
            imageUrl: 'core-img/calibration/charuco-a.jpg',
            key: 'left',
            name: 'A',
          },
          {
            descriptions: [tCali.charuco_move_to_point_b, tCali.charuco_capture],
            imageUrl: 'core-img/calibration/charuco-b.jpg',
            key: 'right',
            name: 'B',
          },
        ]}
        updateParam={updateParam}
      />
    );
  }

  if (step === Steps.PUT_PAPER) {
    const handleNext = async (doEngraving = true) => {
      const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice!.info);

      if (!deviceStatus) {
        return;
      }

      try {
        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.drawing_calibration_image,
        });

        if (doEngraving) {
          if (isHexaRf) await deviceMaster.doHexa2Calibration();
          else await deviceMaster.doBB2Calibration();
        }

        progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });

        const res = await moveLaserHead();

        if (!res) return;

        setStep(Steps.AUTO_SOLVE_PNP);
      } catch (err) {
        console.error(err);
      } finally {
        progressCaller.popById(PROGRESS_ID);
      }
    };

    return (
      <Instruction
        animationSrcs={[
          { src: 'video/laser-head-calibration/2-cut.webm', type: 'video/webm' },
          { src: 'video/laser-head-calibration/2-cut.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          isAdvanced
            ? { label: tCali.back, onClick: () => setStep(Steps.CHESSBOARD) }
            : {
                label: tCali.cancel,
                onClick: () => onClose(false),
              },
          { label: lang.global.skip, onClick: () => handleNext(false) },
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
  }

  if (step === Steps.AUTO_SOLVE_PNP) {
    return (
      <ProcessingDialog
        onClose={onClose}
        onNext={() => {}}
        process={async () => {
          try {
            progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tCali.auto_solve_pnp_locating });

            let located: Awaited<ReturnType<typeof autoLocateMarks>>;
            let pose: Awaited<ReturnType<typeof cameraCalibrationApi.solvePnPCalculate>> | undefined;

            try {
              located = await autoLocateMarks({
                cameraIndex: 0,
                exposureRounds: EXPOSURE_ROUNDS,
                isCancelled: () => isUnmounted.current,
                params: calibratingParam.current,
                refPoints: bb2PnPPoints,
                rMax: R_MAX_MM,
              });

              if (located.success) pose = await cameraCalibrationApi.solvePnPCalculate(0, located.points, bb2PnPPoints);
            } finally {
              progressCaller.popById(PROGRESS_ID);
            }

            if (isUnmounted.current) return;

            isAutoSolved.current = false;

            if (!located.success) {
              // backend without the commands: the manual steps still work
              if (located.reason === 'UNSUPPORTED') {
                setStep(Steps.SOLVE_PNP_INSTRUCTION);

                return;
              }

              setStep(Steps.PUT_PAPER);

              if (located.reason === 'NOT_ENOUGH_MARKS') {
                showNotEnoughMarksAlert({
                  found: located.matched ?? 0,
                  onManual: () => {
                    if (isUnmounted.current) return;

                    manualInitialPoints.current = located.initialPoints;
                    setStep(Steps.SOLVE_PNP_INSTRUCTION);
                  },
                  total: bb2PnPPoints.length,
                });
              } else {
                alertCaller.popUpError({ message: `${tCali.failed_to_calibrate_with_pictures} (${located.reason})` });
              }

              return;
            }

            if (!pose?.success) throw new Error('solvePnPCalculate failed');

            const { rvec, tvec } = pose.data;
            const applyResult = () => {
              if (isUnmounted.current) return;

              isAutoSolved.current = true;
              updateParam({ rvec, tvec });
              setStep(Steps.CHECK_PNP);
            };

            if (!located.highResidual) {
              applyResult();

              return;
            }

            // rest on the paper step before the alert opens (see showHighResidualAlert)
            setStep(Steps.PUT_PAPER);
            showHighResidualAlert({
              isAdvanced,
              onContinue: applyResult,
              onRecapture: () => setStep(Steps.PRE_CHESSBOARD),
              onSwitchToAdvanced,
            });
          } catch (error) {
            // never leave this step spinning: the paper step can start it again
            console.error('Auto solve pnp failed', error);
            alertCaller.popUpError({ message: tCali.failed_to_calibrate_with_pictures });
            setStep(Steps.PUT_PAPER);
          }
        }}
      />
    );
  }

  if (step === Steps.SOLVE_PNP_INSTRUCTION) {
    return (
      <Instruction
        animationSrcs={[
          { src: 'video/laser-head-calibration/3-align.webm', type: 'video/webm' },
          { src: 'video/laser-head-calibration/3-align.mp4', type: 'video/mp4' },
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
        cameraIndex={0}
        defaultPoints={isOblique ? DEFAULT_POINTS_OBLIQUE : DEFAULT_POINTS}
        dh={0}
        hasNext
        initialPoints={manualInitialPoints.current}
        initPoseWithDefaultPoints={isAdvanced}
        onBack={() => setStep(Steps.SOLVE_PNP_INSTRUCTION)}
        onClose={onClose}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({ rvec, tvec });
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          setStep(Steps.CHECK_PNP);
        }}
        params={calibratingParam.current}
        refPoints={bb2PnPPoints}
      />
    );
  }

  if (step === Steps.CHECK_PNP) {
    return (
      <CheckPnP
        cameraOptions={{ index: 0 }}
        dh={0}
        grid={isOblique ? bb2PerspectiveGridWide : bb2PerspectiveGrid}
        onBack={() => setStep(isAutoSolved.current ? Steps.PUT_PAPER : Steps.SOLVE_PNP)}
        onClose={onClose}
        onNext={async () => {
          const param: FisheyeCameraParametersV3 = {
            d: calibratingParam.current.d!,
            k: calibratingParam.current.k!,
            rvec: calibratingParam.current.rvec!,
            tvec: calibratingParam.current.tvec!,
            v: 3,
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
        params={{
          d: calibratingParam.current.d!,
          k: calibratingParam.current.k!,
          rvec: calibratingParam.current.rvec!,
          tvec: calibratingParam.current.tvec!,
        }}
        points={bb2PnPPoints}
      />
    );
  }

  onClose();

  return <></>;
};

export default LaserHeadFisheyeCalibration;
