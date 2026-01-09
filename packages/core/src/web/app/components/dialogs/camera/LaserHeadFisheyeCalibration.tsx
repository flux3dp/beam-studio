import React, { useCallback, useMemo, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { hexaRfModels } from '@core/app/actions/beambox/constant';
import progressCaller from '@core/app/actions/progress-caller';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV3, FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import styles from './Calibration.module.scss';
import Calibration from './common/Calibration';
import CheckPnP from './common/CheckPnP';
import CheckpointData from './common/CheckpointData';
import downloadCalibrationFile from './common/downloadCalibrationFile';
import Instruction from './common/Instruction';
import moveLaserHead from './common/moveLaserHead';
import SolvePnP from './common/SolvePnP';
import { bb2PerspectiveGrid, bb2PnPPoints, hx2rfPerspectiveGrid } from './common/solvePnPConstants';

/* eslint-disable perfectionist/sort-enums */
enum Steps {
  CHECKPOINT_DATA = 0, // For non-advanced usages
  PRE_CHESSBOARD = 1, // For advanced usages
  CHESSBOARD = 2, // For advanced usages
  PUT_PAPER = 3,
  SOLVE_PNP_INSTRUCTION = 4,
  SOLVE_PNP = 5,
  CHECK_PNP = 6,
}
/* eslint-enable perfectionist/sort-enums */

interface Props {
  isAdvanced: boolean;
  onClose: (completed?: boolean) => void;
}

const PROGRESS_ID = 'laser-head-fisheye-calibration';
/**
 * LaserHeadFisheye
 * calibration the fisheye camera on the laser head (bb2, hexa rf)
 */
const LaserHeadFisheyeCalibration = ({ isAdvanced, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const calibratingParam = useRef<FisheyeCameraParametersV3Cali>({});
  const [step, setStep] = useState<Steps>(isAdvanced ? Steps.PRE_CHESSBOARD : Steps.CHECKPOINT_DATA);
  const updateParam = useCallback((param: FisheyeCameraParametersV3Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);
  const isHexaRf = useMemo(() => hexaRfModels.has(deviceMaster.currentDevice?.info.model ?? ''), []);

  if (step === Steps.CHECKPOINT_DATA) {
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
              message: tCali.unable_to_load_camera_parameters,
            });
            onClose(false);
          }
        }}
        updateParam={updateParam}
      />
    );
  }

  if (step === Steps.PRE_CHESSBOARD) {
    return (
      <Instruction
        animationSrcs={[
          { src: 'video/laser-head-calibration/1-chessboard.webm', type: 'video/webm' },
          { src: 'video/laser-head-calibration/1-chessboard.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          {
            label: tCali.next,
            onClick: async () => {
              const res = await moveLaserHead();

              if (res) setStep(Steps.CHESSBOARD);
            },
            type: 'primary',
          },
        ]}
        onClose={onClose}
        steps={[tCali.put_chessboard_bb2_desc_1, tCali.put_chessboard_bb2_desc_2, tCali.put_chessboard_bb2_desc_3]}
        title={tCali.put_chessboard}
      >
        <div
          className={styles.link}
          onClick={() =>
            downloadCalibrationFile('assets/bb2-chessboard.pdf', tCali.download_chessboard_file, 'Chessboard')
          }
        >
          {tCali.download_chessboard_file}
        </div>
      </Instruction>
    );
  }

  if (step === Steps.CHESSBOARD) {
    return (
      <Calibration
        charuco={[15, 10]}
        chessboard={[24, 14]}
        description={[tCali.put_chessboard_1, tCali.put_chessboard_2, tCali.put_chessboard_3]}
        indicator={
          isHexaRf
            ? { height: '95%', left: '2.5%', top: '2.5%', width: '95%' }
            : { height: '65%', left: '10%', top: '30%', width: '80%' }
        }
        onClose={onClose}
        onNext={() => setStep(Steps.PUT_PAPER)}
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
        dh={0}
        hasNext
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
        dh={0}
        grid={isHexaRf ? hx2rfPerspectiveGrid : bb2PerspectiveGrid}
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
        points={bb2PnPPoints}
      />
    );
  }

  onClose();

  return <></>;
};

export default LaserHeadFisheyeCalibration;
