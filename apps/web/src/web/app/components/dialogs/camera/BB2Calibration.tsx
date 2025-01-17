import React, { useCallback, useRef, useState } from 'react';

import alertCaller from 'app/actions/alert-caller';
import checkDeviceStatus from 'helpers/check-device-status';
import deviceMaster from 'helpers/device-master';
import dialog from 'implementations/dialog';
import progressCaller from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import {
  FisheyeCameraParametersV3,
  FisheyeCameraParametersV3Cali,
} from 'interfaces/FisheyePreview';
import { setFisheyeConfig } from 'helpers/camera-calibration-helper';

import CheckpointData from './common/CheckpointData';
import Chessboard from './BB2Calibration/Chessboard';
import Instruction from './common/Instruction';
import moveLaserHead from './BB2Calibration/moveLaserHead';
import SolvePnP from './common/SolvePnP';
import { bb2PnPPoints } from './common/solvePnPConstants';

import styles from './Calibration.module.scss';

const enum Steps {
  CHECKPOINT_DATA = 0, // For non-advanced users
  PRE_CHESSBOARD = 1, // For advanced users
  CHESSBOARD = 2, // For advanced users
  PUT_PAPER = 3,
  SOLVE_PNP_INSTRUCTION = 4,
  SOLVE_PNP = 5,
}

interface Props {
  isAdvanced: boolean;
  onClose: (completed?: boolean) => void;
}

const PROGRESS_ID = 'bb2-calibration';
const BB2Calibration = ({ isAdvanced, onClose }: Props): JSX.Element => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const calibratingParam = useRef<FisheyeCameraParametersV3Cali>({});
  const [step, setStep] = useState<Steps>(
    isAdvanced ? Steps.PRE_CHESSBOARD : Steps.CHECKPOINT_DATA
  );
  const updateParam = useCallback((param: FisheyeCameraParametersV3Cali) => {
    calibratingParam.current = { ...calibratingParam.current, ...param };
  }, []);

  if (step === Steps.CHECKPOINT_DATA) {
    return (
      <CheckpointData
        askUser={false}
        allowCheckPoint={false}
        updateParam={updateParam}
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
            name: window.os === 'MacOS' ? 'PDF (*.pdf)' : 'PDF',
            extensions: ['pdf'],
          },
        ]
      );
    };
    return (
      <Instruction
        title={tCali.put_chessboard}
        steps={[
          tCali.put_chessboard_bb2_desc_1,
          tCali.put_chessboard_bb2_desc_2,
          tCali.put_chessboard_bb2_desc_3,
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
        animationSrcs={[
          { src: 'video/bb2-calibration/1-chessboard.webm', type: 'video/webm' },
          { src: 'video/bb2-calibration/1-chessboard.mp4', type: 'video/mp4' },
        ]}
        onClose={onClose}
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
        updateParam={updateParam}
        onNext={() => setStep(Steps.PUT_PAPER)}
        onClose={onClose}
      />
    );
  }
  if (step === Steps.PUT_PAPER) {
    const handleNext = async (doEngraving = true) => {
      const deviceStatus = await checkDeviceStatus(deviceMaster.currentDevice.info);
      if (!deviceStatus) return;
      try {
        progressCaller.openNonstopProgress({
          id: PROGRESS_ID,
          message: tCali.drawing_calibration_image,
        });
        if (doEngraving) await deviceMaster.doBB2Calibration();
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
          { src: 'video/bb2-calibration/2-cut.webm', type: 'video/webm' },
          { src: 'video/bb2-calibration/2-cut.mp4', type: 'video/mp4' },
        ]}
        title={tCali.put_paper}
        steps={[
          tCali.put_paper_step1,
          tCali.put_paper_step2,
          tCali.perform_autofocus_bb2,
          tCali.put_paper_step3,
          tCali.put_paper_skip,
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
      />
    );
  }
  if (step === Steps.SOLVE_PNP_INSTRUCTION) {
    return (
      <Instruction
        onClose={() => onClose(false)}
        animationSrcs={[
          { src: 'video/bb2-calibration/3-align.webm', type: 'video/webm' },
          { src: 'video/bb2-calibration/3-align.mp4', type: 'video/mp4' },
        ]}
        title={tCali.solve_pnp_title}
        steps={[tCali.solve_pnp_step1, tCali.solve_pnp_step2]}
        buttons={[
          { label: tCali.back, onClick: () => setStep(Steps.PUT_PAPER) },
          { label: tCali.next, onClick: () => setStep(Steps.SOLVE_PNP), type: 'primary' },
        ]}
      />
    );
  }
  if (step === Steps.SOLVE_PNP) {
    return (
      <SolvePnP
        params={calibratingParam.current}
        dh={0}
        refPoints={bb2PnPPoints}
        onClose={onClose}
        onBack={() => setStep(Steps.SOLVE_PNP_INSTRUCTION)}
        onNext={async (rvec, tvec) => {
          progressCaller.openNonstopProgress({ id: PROGRESS_ID, message: lang.device.processing });
          updateParam({ rvec, tvec });
          console.log('calibratingParam.current', calibratingParam.current);
          progressCaller.popById(PROGRESS_ID);
          const param: FisheyeCameraParametersV3 = {
            k: calibratingParam.current.k,
            d: calibratingParam.current.d,
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
      />
    );
  }

  onClose();
  return <></>;
};

export const showBB2Calibration = (isAdvanced = false): Promise<boolean> => {
  const id = 'bb2-calibration';
  const onClose = () => popDialogById(id);
  if (isIdExist(id)) onClose();
  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <BB2Calibration
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />
    );
  });
};

export default BB2Calibration;
