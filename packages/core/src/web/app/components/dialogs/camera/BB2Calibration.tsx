import React, { useCallback, useRef, useState } from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import progressCaller from '@core/app/actions/progress-caller';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import checkDeviceStatus from '@core/helpers/check-device-status';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import dialog from '@core/implementations/dialog';
import type { FisheyeCameraParametersV3, FisheyeCameraParametersV3Cali } from '@core/interfaces/FisheyePreview';

import Chessboard from './BB2Calibration/Chessboard';
import moveLaserHead from './BB2Calibration/moveLaserHead';
import styles from './Calibration.module.scss';
import CheckpointData from './common/CheckpointData';
import Instruction from './common/Instruction';
import SolvePnP from './common/SolvePnP';
import { bb2PnPPoints } from './common/solvePnPConstants';

enum Steps {
  CHECKPOINT_DATA = 0, // For non-advanced users
  CHESSBOARD = 2, // For advanced users
  PRE_CHESSBOARD = 1, // For advanced users
  PUT_PAPER = 3,
  SOLVE_PNP = 5,
  SOLVE_PNP_INSTRUCTION = 4,
}

interface Props {
  isAdvanced: boolean;
  onClose: (completed?: boolean) => void;
}

const PROGRESS_ID = 'bb2-calibration';
const BB2Calibration = ({ isAdvanced, onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const calibratingParam = useRef<FisheyeCameraParametersV3Cali>({});
  const [step, setStep] = useState<Steps>(isAdvanced ? Steps.PRE_CHESSBOARD : Steps.CHECKPOINT_DATA);
  const updateParam = useCallback((param: FisheyeCameraParametersV3Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

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
    const handleDownloadChessboard = () => {
      dialog.writeFileDialog(
        async () => {
          const resp = await fetch('assets/bb2-chessboard.pdf');
          const blob = await resp.blob();

          return blob;
        },
        tCali.download_chessboard_file,
        'Chessboard',
        [
          {
            extensions: ['pdf'],
            name: window.os === 'MacOS' ? 'PDF (*.pdf)' : 'PDF',
          },
        ],
      );
    };

    return (
      <Instruction
        animationSrcs={[
          { src: 'video/bb2-calibration/1-chessboard.webm', type: 'video/webm' },
          { src: 'video/bb2-calibration/1-chessboard.mp4', type: 'video/mp4' },
        ]}
        buttons={[
          {
            label: tCali.next,
            onClick: async () => {
              const res = await moveLaserHead();

              if (res) {
                setStep(Steps.CHESSBOARD);
              }
            },
            type: 'primary',
          },
        ]}
        onClose={onClose}
        steps={[tCali.put_chessboard_bb2_desc_1, tCali.put_chessboard_bb2_desc_2, tCali.put_chessboard_bb2_desc_3]}
        title={tCali.put_chessboard}
      >
        <div className={styles.link} onClick={handleDownloadChessboard}>
          {tCali.download_chessboard_file}
        </div>
      </Instruction>
    );
  }

  if (step === Steps.CHESSBOARD) {
    return (
      <Chessboard
        chessboard={[24, 14]}
        onClose={onClose}
        onNext={() => setStep(Steps.PUT_PAPER)}
        updateParam={updateParam}
      />
    );
  }

  if (step === Steps.PUT_PAPER) {
    const handleNext = async (doEngraving = true) => {
      const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);

      if (!deviceStatus) {
        return;
      }

      try {
        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.drawing_calibration_image,
        });

        if (doEngraving) {
          await deviceMaster.doBB2Calibration();
        }

        progressCaller.update(PROGRESS_ID, { message: tCali.preparing_to_take_picture });

        const res = await moveLaserHead();

        if (!res) {
          return;
        }

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
          { src: 'video/bb2-calibration/2-cut.webm', type: 'video/webm' },
          { src: 'video/bb2-calibration/2-cut.mp4', type: 'video/mp4' },
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
          { src: 'video/bb2-calibration/3-align.webm', type: 'video/webm' },
          { src: 'video/bb2-calibration/3-align.mp4', type: 'video/mp4' },
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
        onBack={() => setStep(Steps.SOLVE_PNP_INSTRUCTION)}
        onClose={onClose}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({ rvec, tvec });
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);

          const param: FisheyeCameraParametersV3 = {
            d: calibratingParam.current.d,
            k: calibratingParam.current.k,
            rvec,
            tvec,
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
        params={calibratingParam.current}
        refPoints={bb2PnPPoints}
      />
    );
  }

  onClose();

  return <></>;
};

export const showBB2Calibration = (isAdvanced = false): Promise<boolean> => {
  const id = 'bb2-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <BB2Calibration
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export default BB2Calibration;
