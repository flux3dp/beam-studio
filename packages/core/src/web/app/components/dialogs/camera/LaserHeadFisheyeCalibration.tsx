import React, { useCallback, useMemo, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { bb2PnPPoints, getRegionPreviewGrid, hx2GalvoPnPPoints } from '@core/app/constants/fisheyeCameraConstants';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { checkHexa2GalvoDev } from '@core/helpers/checkFeature';
import { ensureGalvoHeadDisconnected } from '@core/helpers/device/galvoLaserMode';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV3, FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import styles from './Calibration.module.scss';
import ChArUco from './common/ChArUco';
import CheckPnP from './common/CheckPnP';
import downloadCalibrationFile from './common/downloadCalibrationFile';
import Instruction from './common/Instruction';
import moveLaserHead from './common/moveLaserHead';
import SolvePnP from './common/SolvePnP';

/* eslint-disable perfectionist/sort-enums */
enum Steps {
  PRE_CHESSBOARD = 1, // For advanced usages
  CHESSBOARD = 2, // For advanced usages
  PUT_PAPER = 3,
  SOLVE_PNP_INSTRUCTION = 4,
  SOLVE_PNP = 5,
  CHECK_PNP = 6,
}
/* eslint-enable perfectionist/sort-enums */

interface Props {
  currentData?: FisheyeCameraParametersV3Cali;
  isAdvanced: boolean;
  isOblique?: boolean;
  onClose: (completed?: boolean) => void;
}

const PROGRESS_ID = 'laser-head-fisheye-calibration';
const FRAME_FEEDRATE = 7500; // mm/min, the same moveLaserHead uses

type Points = Array<[number, number]>;

/**
 * Three machines share this flow and agree on nothing else: each cuts its own pattern, at its own
 * place on its own bed, photographed by a camera mounted differently. Gathered here so the steps
 * below read as one flow rather than a chain of model checks.
 *
 * - `engrave` cuts the pattern. Named per machine in deviceMaster, because the file has to match
 *   the machine rather than a flag in this dialog.
 * - `pnpPoints` is where the dots are, in mm relative to where the head parks (`cameraCenter`).
 * - `imagePoints` seeds the pose solvePnPFindCorners matches the detected dots against. An oblique
 *   camera sees the same dots somewhere else in frame, hence two sets where a machine has both.
 * - `engraveArea` is the rectangle the sheet must cover, for machines whose bed is far larger than
 *   the sheet and where finding the spot by eye is hopeless.
 */
interface LaserHeadCalibrationProfile {
  alwaysOblique?: boolean;
  /**
   * The ChArUco step driven by the machine instead of by hand: the head parks at `headPosition`
   * with its red light on, the user slides the board until mark B sits under the light, and one
   * click takes both pictures -- the second after the head moves `shift` mm to the right and the
   * camera has had `settleMs` to catch up. For a machine whose head cannot be pushed around by hand
   * and whose nozzle hides the board from the camera when the light is on mark A.
   */
  charuco?: { headPosition: [number, number]; settleMs: number; shift: number };
  engrave: () => Promise<void>;
  engraveArea?: { maxX: number; maxY: number; minX: number; minY: number };
  imagePoints: { oblique: Points; plain: Points };
  pnpPoints: Points;
}

// TODO: test on different devices
const BB2_IMAGE_POINTS: Points = [
  [2000, 1716],
  [3283, 1720],
  [2009, 2564],
  [3272, 2563],
  [2325, 1929],
  [2965, 1933],
  [2327, 2353],
  [2962, 2351],
];

const BB2_IMAGE_POINTS_OBLIQUE: Points = [
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
 * Read off a HEXA G after a calibration whose error was accepted, rounded to whole pixels -- this
 * only seeds a pose, so sub-pixel is noise. Upright (x rises right, y downwards), like the mm order.
 */
const HEXA_G_IMAGE_POINTS: Points = [
  [1487, 1990],
  [3030, 2004],
  [1789, 2490],
  [2984, 2512],
  [1930, 2143],
  [2650, 2152],
  [2035, 2395],
  [2671, 2402],
];

const profiles: Record<string, LaserHeadCalibrationProfile> = {
  fbb2: {
    engrave: () => deviceMaster.doBB2Calibration(),
    imagePoints: { oblique: BB2_IMAGE_POINTS_OBLIQUE, plain: BB2_IMAGE_POINTS },
    pnpPoints: bb2PnPPoints,
  },
  fhx2galvo: {
    // Its camera is oblique whatever the device setting says, and it has no upright pixel set.
    alwaysOblique: true,
    /**
     * Mid-bed in x, near the front in y. With the light on mark B the board lies in the 200mm to
     * the left of the head, which is where this camera looks (hx2GalvoPerspectiveGridWide: x -260
     * to 0). The shift is the A-to-B distance on the printed sheet, so the second picture is the
     * same view the other machines get with the light on mark A -- the board deliberately runs
     * out of frame on the left. 460 + 190 stays inside the gantry's travel (x up to 820 with the
     * MOPA head parked). Position and settle time have not been tuned on a machine yet.
     */
    charuco: { headPosition: [460, 100], settleMs: 3000, shift: 190 },
    engrave: () => deviceMaster.doHexaGCalibration(),
    /**
     * The outer four dots of hx2GalvoPnPPoints in machine mm, not the fcode's own bounding box:
     * raster sweeps run ~9mm past each dot to accelerate, with the laser off, so the file's
     * metadata reads x 190.7-429.3 while nothing is engraved out there.
     *
     * RELEASE GATE: whether the dots belong in this part of the bed at all is still open. Somebody
     * placing a sheet without the preview below has no landmark to go by, so the pattern may want
     * to move to a corner, or gain a printed outline. Decide before the shipping fcode is cut.
     */
    engraveArea: { maxX: 420, maxY: 300, minX: 200, minY: 200 },
    imagePoints: { oblique: HEXA_G_IMAGE_POINTS, plain: HEXA_G_IMAGE_POINTS },
    pnpPoints: hx2GalvoPnPPoints,
  },
  fhx2rf: {
    alwaysOblique: true,
    engrave: () => deviceMaster.doHexaRfCalibration(),
    imagePoints: { oblique: BB2_IMAGE_POINTS_OBLIQUE, plain: BB2_IMAGE_POINTS },
    pnpPoints: bb2PnPPoints,
  },
};

/**
 * LaserHeadFisheye
 * calibration the fisheye camera on the laser head (Beambox II, HEXA RF, HEXA G)
 */
const LaserHeadFisheyeCalibration = ({ currentData, isAdvanced, isOblique, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const calibratingParam = useRef<FisheyeCameraParametersV3Cali>(currentData ?? {});
  const [step, setStep] = useState<Steps>(isAdvanced ? Steps.PRE_CHESSBOARD : Steps.PUT_PAPER);
  const updateParam = useCallback((param: FisheyeCameraParametersV3Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);
  const model = useMemo(() => deviceMaster.currentDevice?.info.model ?? 'fbb2', []);
  const profile = useMemo(() => profiles[model] ?? profiles.fbb2, [model]);
  const isCameraOblique = Boolean(isOblique) || Boolean(profile.alwaysOblique);
  const grid = useMemo(() => getRegionPreviewGrid(model, { isCameraOblique }), [model, isCameraOblique]);
  /**
   * Every step from here on either moves the head, fires the laser or aims the red light, and all
   * three go wrong with a galvo head connected -- the beam comes out of the galvo instead. Asked at
   * each of them rather than once: the machine skips the work when the head is already parked, so
   * the cost of asking again is a round trip, and the cost of not asking is marking through the
   * wrong optics.
   */
  const parkGalvoHead = useCallback(async (): Promise<boolean> => {
    try {
      await ensureGalvoHeadDisconnected(model, {
        onSlow: () =>
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.message.disconnectingGalvoHead }),
      });

      return true;
    } catch (error) {
      console.error('Failed to park the galvo head', error);
      alertCaller.popUpError({ message: `Failed to disconnect the galvo head: ${error}` });

      return false;
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
  }, [model, lang.message.disconnectingGalvoHead]);

  /**
   * Where the head is while the machine-driven ChArUco step holds it in raw mode, or null when it
   * is not held. Held from the move in PRE_CHESSBOARD to whichever way the step is left, so every
   * exit of that step releases it.
   */
  const heldHeadX = useRef<null | number>(null);

  /** Park the head for the ChArUco step: raw mode kept, motors held, red light on. */
  const holdHead = useCallback(async (): Promise<boolean> => {
    const { headPosition } = profile.charuco!;

    if (!(await parkGalvoHead())) return false;

    if (!(await moveLaserHead(headPosition, { shouldKeepPosition: true }))) return false;

    try {
      await deviceMaster.rawSetRedLight(true);
    } catch (error) {
      // The light only helps the user aim; the pictures do not need it.
      console.error('Failed to turn on the red light', error);
    }

    heldHeadX.current = headPosition[0];

    return true;
  }, [parkGalvoHead, profile]);

  const releaseHead = useCallback(async (): Promise<void> => {
    heldHeadX.current = null;

    if (deviceMaster.currentControlMode !== 'raw') return;

    try {
      await deviceMaster.rawSetRedLight(false).catch(() => {});
      await deviceMaster.rawLooseMotor();
      await deviceMaster.endSubTask();
    } catch (error) {
      console.error('Failed to release the laser head', error);
    }
  }, []);

  /** Put the held head where ChArUco capture `index` is taken from. */
  const prepareCharucoCapture = useCallback(
    async (index: number): Promise<boolean> => {
      const { headPosition, shift } = profile.charuco!;
      const targetX = headPosition[0] + (index === 0 ? 0 : shift);

      if (heldHeadX.current === null && !(await holdHead())) return false;

      if (heldHeadX.current === targetX) return true;

      try {
        progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: tCali.moving_laser_head });
        await deviceMaster.rawStartLineCheckMode();
        await deviceMaster.rawMove({ f: FRAME_FEEDRATE, x: targetX, y: headPosition[1] });

        const dist = Math.abs(targetX - heldHeadX.current!);

        heldHeadX.current = targetX;
        await new Promise((resolve) => setTimeout(resolve, (dist / (FRAME_FEEDRATE / 60)) * 2 * 1000));
        await deviceMaster.rawEndLineCheckMode();

        return true;
      } catch (error) {
        console.error(error);
        alertCaller.popUpError({ message: tCali.failed_to_move_laser_head });
        await releaseHead();

        return false;
      } finally {
        progressCaller.popById(PROGRESS_ID);
      }
    },
    [holdHead, profile, releaseHead, tCali],
  );

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
            onClick: async () => {
              if (profile.charuco) {
                if (await holdHead()) setStep(Steps.CHESSBOARD);
              } else if (await parkGalvoHead()) {
                setStep(Steps.CHESSBOARD);
              }
            },
            type: 'primary',
          },
        ]}
        onClose={onClose}
        steps={
          profile.charuco
            ? [tCali.put_charuco_1, tCali.put_charuco_2, tCali.put_charuco_galvo_3, tCali.put_charuco_galvo_4]
            : [tCali.put_charuco_1, tCali.put_charuco_2, tCali.put_charuco_3]
        }
        title={tCali.put_charuco}
      >
        <div className={styles.link} onClick={() => downloadCalibrationFile('assets/charuco-15-10-with-mark.pdf')}>
          {tCali.download_calibration_pattern}
        </div>
      </Instruction>
    );
  }

  if (step === Steps.CHESSBOARD && profile.charuco) {
    return (
      <ChArUco
        autoCapture={{ prepare: prepareCharucoCapture, settleMs: profile.charuco.settleMs }}
        calibrationThresholds={{ average: 3.5, good: 2.8 }}
        cameraIndex={0}
        isFisheye
        isVertical
        onClose={async (completed) => {
          await releaseHead();
          onClose(completed);
        }}
        onNext={async () => {
          await releaseHead();
          setStep(Steps.PUT_PAPER);
        }}
        onPrev={async () => {
          await releaseHead();
          setStep(Steps.PRE_CHESSBOARD);
        }}
        steps={[
          {
            descriptions: [tCali.charuco_align_point_b_to_red_light, tCali.charuco_capture_auto],
            imageUrl: 'core-img/calibration/charuco-b.jpg',
            key: 'left',
            name: 'B',
          },
          // The same spot seen from `shift` mm further right; its description is never shown.
          { key: 'right', name: 'B' },
        ]}
        title={tCali.title_capture_calibration_pattern}
        updateParam={updateParam}
      />
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

      if (!(await parkGalvoHead())) return;

      try {
        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.drawing_calibration_image,
        });

        if (doEngraving) await profile.engrave();

        progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });

        const res = await moveLaserHead();

        if (!res) return;

        setStep(Steps.SOLVE_PNP_INSTRUCTION);
      } catch (err) {
        console.error(err);
      } finally {
        progressCaller.popById(PROGRESS_ID);
      }
    };

    /**
     * Trace the rectangle the calibration fcode is about to cut, so the sheet can be put under it.
     * The bed is 920 x 520 and the marks live in an A4-sized patch of it, which is very easy to miss.
     */
    const previewEngraveArea = async () => {
      if (!(await checkDeviceStatus(deviceMaster.currentDevice!.info))) return;

      if (!(await parkGalvoHead())) return;

      const { maxX, maxY, minX, minY } = profile.engraveArea!;
      const corners: Array<[number, number]> = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ];
      let cancelled = false;
      let position: [number, number] = [0, 0];

      try {
        progressCaller.openNonstopProgress({
          canCancel: true,
          id: PROGRESS_ID,
          // TODO: needs a translated key before release.
          message: '正在走一次雕刻範圍',
          onCancel: () => {
            cancelled = true;
          },
        });
        await deviceMaster.enterRawMode();
        await deviceMaster.rawHome();
        await deviceMaster.rawStartLineCheckMode();

        for (const [x, y] of corners) {
          // Checked between moves rather than mid-move: a raw move cannot be recalled, so cancelling
          // means stopping at the next corner rather than stopping now.
          if (cancelled) break;

          await deviceMaster.rawMove({ f: FRAME_FEEDRATE, x, y });

          const dist = Math.hypot(x - position[0], y - position[1]);

          position = [x, y];
          await new Promise((resolve) => setTimeout(resolve, (dist / (FRAME_FEEDRATE / 60)) * 2 * 1000));
        }
      } catch (error) {
        console.error(error);
        alertCaller.popUpError({ message: tCali.failed_to_move_laser_head });
      } finally {
        try {
          if (deviceMaster.currentControlMode === 'raw') {
            await deviceMaster.rawEndLineCheckMode();
            await deviceMaster.rawLooseMotor();
            await deviceMaster.endSubTask();
          }
        } finally {
          progressCaller.popById(PROGRESS_ID);
        }
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
          // TODO: needs a translated key, and goes away with whichever calibration fcode ships.
          ...(profile.engraveArea && checkHexa2GalvoDev()
            ? [{ label: '預覽雕刻範圍', onClick: previewEngraveArea }]
            : []),
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
        defaultPoints={isCameraOblique ? profile.imagePoints.oblique : profile.imagePoints.plain}
        dh={0}
        hasNext
        initPoseWithDefaultPoints={isAdvanced}
        onBack={() => setStep(Steps.SOLVE_PNP_INSTRUCTION)}
        onClose={onClose}
        onNext={async (rvec, tvec, imgPoints) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({ rvec, tvec });
          console.log('calibratingParam.current', calibratingParam.current);

          // Where profiles' imagePoints come from. Kept while the patterns are still moving, so the
          // next set can be read off a machine rather than guessed.
          console.log(model, 'solvePnP image points', JSON.stringify(imgPoints));

          progressCaller.popById(PROGRESS_ID);
          setStep(Steps.CHECK_PNP);
        }}
        params={calibratingParam.current}
        refPoints={profile.pnpPoints}
      />
    );
  }

  if (step === Steps.CHECK_PNP) {
    return (
      <CheckPnP
        cameraOptions={{ index: 0 }}
        dh={0}
        grid={grid}
        onBack={() => setStep(Steps.SOLVE_PNP)}
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
        points={profile.pnpPoints}
      />
    );
  }

  onClose();

  return <></>;
};

export default LaserHeadFisheyeCalibration;
