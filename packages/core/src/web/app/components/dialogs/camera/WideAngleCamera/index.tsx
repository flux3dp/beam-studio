import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { match } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { hexaRfModels } from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import checkDeviceStatus from '@core/helpers/check-device-status';
import getFocalDistance from '@core/helpers/device/camera/getFocalDistance';
import { loadJson, uploadJson } from '@core/helpers/device/jsonDataHelper';
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
import { moveZRel } from '../common/moveZRel';
import ProcessingDialog from '../common/ProcessingDialog';
import SolvePnP from '../common/SolvePnP';
import {
  bb2WideAngleCameraPnpPoints,
  bb2WideAnglePerspectiveGrid,
  getRegionalPoints,
  hx2WideAngleCameraPnpPoints,
  hx2WideAnglePerspectiveGrid,
} from '../common/solvePnPConstants';

const enum Step {
  CHECK_DATA,
  PREPARE_MATERIALS,
  CALIBRATE_CHARUCO,
  PUT_PAPER,
  SOLVE_PNP_INSTRUCTION_1,
  SOLVE_PNP_TL_1,
  SOLVE_PNP_TR_1,
  SOLVE_PNP_BL_1,
  SOLVE_PNP_BR_1,
  SOLVE_OTHER_PNP_1,
  CHECK_PNP_1,
  SOLVE_PNP_INSTRUCTION_2,
  SOLVE_PNP_TL_2,
  SOLVE_PNP_TR_2,
  SOLVE_PNP_BL_2,
  SOLVE_PNP_BR_2,
  SOLVE_OTHER_PNP_2,
  CHECK_PNP_2,
  SOLVE_EXTRINSIC_REGRESSION,
}

interface Props {
  onClose: (completed?: boolean) => void;
}

const WideAngleCamera = ({ onClose }: Props): ReactNode => {
  const PROGRESS_ID = 'wide-angle-camera-calibration';
  const { calibration: tCali, device: tDevice } = useI18n();
  const [step, setStep] = useState(Step.CHECK_DATA);
  const [skipChArUco, setSkipChArUco] = useState(false);
  const next = useCallback(() => setStep((cur) => cur + 1), []);
  const prev = useCallback(() => setStep((cur) => cur - 1), []);
  const deviceModel = useMemo(() => deviceMaster.currentDevice!.info.model, []);
  const isHexaRf = useMemo(() => hexaRfModels.has(deviceModel), [deviceModel]);
  const solvePnPPoints = useMemo(() => {
    if (isHexaRf) return hx2WideAngleCameraPnpPoints;

    return bb2WideAngleCameraPnpPoints;
  }, [isHexaRf]);

  const calibratingParam = useRef<FisheyeCameraParametersV4Cali>({});
  const handleClose = (res?: boolean) => {
    progressCaller.popById(PROGRESS_ID);
    onClose(res);
  };

  const updateParam = useCallback((param: FisheyeCameraParametersV4Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  const title = useMemo(() => {
    const res = match<Step, null | { displayStep: number; text: string }>(step)
      .with(Step.PREPARE_MATERIALS, () => ({ displayStep: 1, text: tCali.title_prepare_materials }))
      .with(Step.CALIBRATE_CHARUCO, () => ({ displayStep: 2, text: tCali.title_capture_calibration_pattern }))
      .with(Step.PUT_PAPER, () => ({ displayStep: 3, text: tCali.title_engrave_marker_points }))
      .with(
        Step.SOLVE_PNP_INSTRUCTION_1,
        Step.SOLVE_PNP_TL_1,
        Step.SOLVE_PNP_TR_1,
        Step.SOLVE_PNP_BL_1,
        Step.SOLVE_PNP_BR_1,
        () => ({
          displayStep: 4,
          text: `${tCali.title_align_marker_points} (${tCali.at_focus_height})`,
        }),
      )
      .with(Step.CHECK_PNP_1, () => ({
        displayStep: 5,
        text: `${tCali.title_confirm_calibration_result} (${tCali.at_focus_height})`,
      }))
      .with(
        Step.SOLVE_PNP_INSTRUCTION_2,
        Step.SOLVE_PNP_TL_2,
        Step.SOLVE_PNP_TR_2,
        Step.SOLVE_PNP_BL_2,
        Step.SOLVE_PNP_BR_2,
        () => ({
          displayStep: 6,
          text: `${tCali.title_align_marker_points} (${tCali.at_lower_height})`,
        }),
      )
      .with(Step.CHECK_PNP_2, () => ({
        displayStep: 7,
        text: `${tCali.title_confirm_calibration_result} (${tCali.at_lower_height})`,
      }))
      .otherwise(() => null);

    if (!res) return undefined;

    let { displayStep, text } = res;
    const totalSteps = skipChArUco ? 5 : 7;

    if (skipChArUco) displayStep -= 2;

    return `${tCali.step} ${displayStep}/${totalSteps} - ${text}`;
  }, [step, tCali, skipChArUco]);

  return match<Step, ReactNode>(step)
    .with(Step.CHECK_DATA, () => {
      return (
        <CheckpointData
          allowCheckPoint={false}
          askUser
          getData={async () => loadJson('fisheye', 'wide-angle.json') as FisheyeCameraParametersV4Cali}
          onClose={handleClose}
          onNext={(res: boolean) => {
            if (res) {
              setSkipChArUco(true);
              setStep(Step.PUT_PAPER);
            } else {
              setSkipChArUco(false);
              setStep(Step.PREPARE_MATERIALS);
            }
          }}
          updateParam={updateParam}
        />
      );
    })
    .with(Step.PREPARE_MATERIALS, () => {
      return (
        <Instruction
          animationSrcs={[
            { src: 'video/wide-angle-calibration/1-prepare-materials.webm', type: 'video/webm' },
            { src: 'video/wide-angle-calibration/1-prepare-materials.mp4', type: 'video/mp4' },
          ]}
          buttons={[
            { label: tCali.cancel, onClick: () => handleClose(false) },
            { label: tCali.next, onClick: next, type: 'primary' },
          ]}
          onClose={() => handleClose(false)}
          steps={[
            tCali.materials_required,
            [tCali.material_a4_calibration_pattern, tCali.material_4_a4_paper],
            tCali.download_and_print_calibration_pattern,
          ]}
          title={title}
        >
          <div className={styles.link} onClick={() => downloadCalibrationFile('assets/charuco-15-10.pdf')}>
            {tCali.download_calibration_pattern}
          </div>
        </Instruction>
      );
    })
    .with(Step.CALIBRATE_CHARUCO, () => {
      return (
        <ChArUco
          cameraIndex={1}
          isFisheye={!isHexaRf}
          onClose={handleClose}
          onNext={next}
          onPrev={prev}
          steps={[
            { description: tCali.charuco_position_top_left, key: 'topLeft' },
            { description: tCali.charuco_position_top_right, key: 'topRight' },
            { description: tCali.charuco_position_bottom_left, key: 'bottomLeft' },
            { description: tCali.charuco_position_bottom_right, key: 'bottomRight' },
            { description: tCali.charuco_position_center, key: 'center' },
          ].map(({ description, key }) => ({
            description,
            imageUrl: `core-img/calibration/bb2-charuco-${key}.jpg`,
            key,
          }))}
          title={title}
          updateParam={updateParam}
        />
      );
    })
    .with(Step.PUT_PAPER, () => {
      const handleNext = async (doEngraving = true) => {
        const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice!.info);

        if (!deviceStatus) return;

        try {
          progressCaller.openNonstopProgress({
            id: PROGRESS_ID,
            message: tCali.getting_plane_height,
          });

          const height = await getFocalDistance();

          updateParam({ dh1: height });
          progressCaller.update(PROGRESS_ID, { message: tCali.drawing_calibration_image });

          if (doEngraving) {
            if (isHexaRf) await deviceMaster.doHexa2Calibration('wide-angle');
            else await deviceMaster.doBB2Calibration('wide-angle');
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

      const videoName = `video/wide-angle-calibration/2-cut${isHexaRf ? '-fhx2rf' : ''}`;

      return (
        <Instruction
          animationSrcs={[
            { src: `${videoName}.webm`, type: 'video/webm' },
            { src: `${videoName}.mp4`, type: 'video/mp4' },
          ]}
          buttons={[
            { label: tCali.cancel, onClick: () => handleClose(false) },
            { label: tCali.skip, onClick: () => handleNext(false) },
            { label: tCali.start_engrave, onClick: () => handleNext(), type: 'primary' },
          ]}
          onClose={() => handleClose(false)}
          steps={[
            tCali.put_paper_wide_angle_1,
            tCali.put_paper_wide_angle_2,
            tCali.perform_autofocus_bb2,
            tCali.put_paper_step3,
            tCali.put_paper_skip,
          ]}
          title={title}
        />
      );
    })
    .with(Step.SOLVE_PNP_INSTRUCTION_1, Step.SOLVE_PNP_INSTRUCTION_2, (step) => (
      <Instruction
        animationSrcs={[
          { src: 'video/wide-angle-calibration/3-align.webm', type: 'video/webm' },
          { src: 'video/wide-angle-calibration/3-align.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          { label: tCali.back, onClick: prev },
          {
            label: tCali.next,
            onClick: async () => {
              if (step === Step.SOLVE_PNP_INSTRUCTION_2) {
                progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tCali.moving_platform });
                await moveZRel(-40);

                const dh2 = await getFocalDistance();

                updateParam({ dh2 });
                progressCaller.popById(PROGRESS_ID);
              }

              next();
            },
            type: 'primary',
          },
        ]}
        onClose={() => onClose(false)}
        steps={[
          step === Step.SOLVE_PNP_INSTRUCTION_1 ? tCali.solve_pnp_open_the_lid : tCali.solve_pnp_move_platform,
          tCali.solve_pnp_step1,
          tCali.solve_pnp_step2,
        ].filter(Boolean)}
        title={title}
      />
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
        const { currentStep, interestArea, region } = match<
          typeof step,
          {
            currentStep: number;
            interestArea?: { height: number; width: number; x: number; y: number };
            region: keyof typeof solvePnPPoints;
          }
        >(step)
          .with(Step.SOLVE_PNP_TL_1, Step.SOLVE_PNP_TL_2, () => ({
            currentStep: 0,
            interestArea: isHexaRf
              ? { height: 1224, width: 1632, x: 0, y: 0 }
              : { height: 1300, width: 2300, x: 500, y: 900 },
            region: 'topLeft',
          }))
          .with(Step.SOLVE_PNP_TR_1, Step.SOLVE_PNP_TR_2, () => ({
            currentStep: 1,
            interestArea: isHexaRf
              ? { height: 1224, width: 1632, x: 1632, y: 0 }
              : { height: 1300, width: 2300, x: 2800, y: 900 },
            region: 'topRight',
          }))
          .with(Step.SOLVE_PNP_BL_1, Step.SOLVE_PNP_BL_2, () => ({
            currentStep: 2,
            interestArea: isHexaRf
              ? { height: 1224, width: 1632, x: 0, y: 1224 }
              : { height: 800, width: 1600, x: 1200, y: 2200 },
            region: 'bottomLeft',
          }))
          .otherwise(() => ({
            currentStep: 3,
            interestArea: isHexaRf
              ? { height: 1224, width: 1632, x: 1632, y: 1224 }
              : { height: 800, width: 1600, x: 2800, y: 2200 },
            region: 'bottomRight',
          }));

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
            currentStep={currentStep}
            dh={calibratingParam.current[keys.dh]!}
            hasNext
            initInterestArea={interestArea}
            label={['A', 'B', 'C', 'D'][currentStep]}
            onBack={async () => {
              if (step === Step.SOLVE_PNP_TL_2) {
                progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tCali.moving_platform });
                await moveZRel(40);
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
            refPoints={solvePnPPoints[region]}
            steps={['A', 'B', 'C', 'D']}
            title={title}
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
              const imgPoint = getRegionalPoints(region, imgPoints as Record<WideAngleRegion, Array<[number, number]>>);
              const refPoints = getRegionalPoints(region, solvePnPPoints);
              const res = await cameraCalibrationApi.solvePnPCalculate(dh!, imgPoint, refPoints);

              if (res.success) {
                const { rvec, tvec } = res.data;

                updateParam({
                  [keys.rvecs]: { ...calibratingParam.current[keys.rvecs], [region]: rvec },
                  [keys.tvecs]: { ...calibratingParam.current[keys.tvecs], [region]: tvec },
                });
              }
            }
            console.log('Finished solving PnP for all regions', calibratingParam.current);

            progressCaller.popById(PROGRESS_ID);
          }}
        />
      );
    })
    .with(Step.CHECK_PNP_1, Step.CHECK_PNP_2, (step) => {
      const keys: {
        dh: 'dh1' | 'dh2';
        rvecs: 'rvecs1' | 'rvecs2';
        tvecs: 'tvecs1' | 'tvecs2';
      } =
        step === Step.CHECK_PNP_1
          ? { dh: 'dh1', rvecs: 'rvecs1', tvecs: 'tvecs1' }
          : { dh: 'dh2', rvecs: 'rvecs2', tvecs: 'tvecs2' };
      const {
        d,
        is_fisheye: isFisheye,
        k,
        [keys.dh]: dh,
        [keys.rvecs]: rvecs,
        [keys.tvecs]: tvecs,
      } = calibratingParam.current;

      return (
        <CheckPnP
          cameraOptions={{ index: 1 }}
          dh={dh!}
          grid={isHexaRf ? hx2WideAnglePerspectiveGrid : bb2WideAnglePerspectiveGrid}
          hasNext
          onBack={() => setStep(step === Step.CHECK_PNP_1 ? Step.SOLVE_PNP_TL_1 : Step.SOLVE_PNP_TL_2)}
          onClose={onClose}
          onNext={next}
          params={{ d: d!, is_fisheye: isFisheye, k: k!, rvecs: rvecs!, tvecs: tvecs! }}
          points={Object.values(solvePnPPoints).flat()}
          title={title}
        />
      );
    })
    .with(Step.SOLVE_EXTRINSIC_REGRESSION, () => {
      return (
        <ProcessingDialog
          onClose={handleClose}
          onNext={() => onClose(true)}
          process={async () => {
            try {
              progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tDevice.processing });

              const { dh1, dh2, rvecs1, rvecs2, tvecs1, tvecs2 } = calibratingParam.current;
              const heights = [dh1!, dh2!];
              const regions = Object.keys(rvecs1!) as WideAngleRegion[];
              const rvecPolyfits: Partial<Record<WideAngleRegion, number[][]>> = {};
              const tvecPolyfits: Partial<Record<WideAngleRegion, number[][]>> = {};

              for (let i = 0; i < regions.length; i++) {
                const region = regions[i];
                const rvecs = [rvecs1![region]!, rvecs2![region]!];
                const tvecs = [tvecs1![region]!, tvecs2![region]!];
                const res = await cameraCalibrationApi.extrinsicRegression(rvecs, tvecs, heights);

                if (!res.success) throw new Error(`Failed to solve extrinsic regression for ${region}.`);

                const { rvec_polyfit, tvec_polyfit } = res.data!;

                rvecPolyfits[region] = rvec_polyfit;
                tvecPolyfits[region] = tvec_polyfit;
              }

              const res: FisheyeCameraParametersV4 = {
                d: calibratingParam.current.d!,
                is_fisheye: calibratingParam.current.is_fisheye,
                k: calibratingParam.current.k!,
                ret: calibratingParam.current.ret!,
                rvec: calibratingParam.current.rvec!,
                rvec_polyfits: rvecPolyfits as Record<WideAngleRegion, number[][]>,
                tvec: calibratingParam.current.tvec!,
                tvec_polyfits: tvecPolyfits as Record<WideAngleRegion, number[][]>,
                v: 4,
              };

              await uploadJson(res, 'fisheye', 'wide-angle.json');
              progressCaller.update(PROGRESS_ID, { message: tCali.moving_platform });
              await moveZRel(40);
              alertCaller.popUp({ message: tCali.camera_parameter_saved_successfully });
            } finally {
              progressCaller.popById(PROGRESS_ID);
            }
          }}
        />
      );
    })
    .otherwise(() => null);
};

export default WideAngleCamera;
