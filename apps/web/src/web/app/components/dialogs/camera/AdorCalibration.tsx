import React, { useEffect, useMemo, useRef, useState } from 'react';

import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import dialogCaller from 'app/actions/dialog-caller';
import deviceMaster from 'helpers/device-master';
import isDev from 'helpers/is-dev';
import progressCaller from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import {
  FisheyeCameraParameters,
  FisheyeCameraParametersV1,
  FisheyeCameraParametersV2,
} from 'interfaces/FisheyePreview';

import Align from './AdorCalibration/Align';
import CalibrationType from './AdorCalibration/calibrationTypes';
import Instruction from './common/Instruction';

const PROGRESS_ID = 'fish-eye-calibration';
const DIALOG_ID = 'fish-eye-calibration';

enum Step {
  WAITING = 0,
  PUT_PAPER = 1,
  FOCUS_AND_CUT = 2,
  ALIGN = 3,
}

interface Props {
  type?: CalibrationType;
  onClose: (completed?: boolean) => void;
}

const calibrated = {
  [CalibrationType.CAMERA]: new Set<string>(),
  [CalibrationType.PRINTER_HEAD]: new Set<string>(),
  [CalibrationType.IR_LASER]: new Set<string>(),
};

// TODO: add unit test
const AdorCalibration = ({ type = CalibrationType.CAMERA, onClose }: Props): JSX.Element => {
  const isDevMode = isDev();
  const lang = useI18n().calibration;
  const param = useRef<FisheyeCameraParameters>({} as any);
  const [step, setStep] = useState<Step>(Step.WAITING);
  const currentDeviceId = useMemo(() => deviceMaster.currentDevice.info.uuid, []);
  const checkFirstStep = async () => {
    let fisheyeParameters: FisheyeCameraParameters = null;
    try {
      const currentParameter = await deviceMaster.fetchFisheyeParams();
      console.log(currentParameter);
      fisheyeParameters = currentParameter;
    } catch (err) {
      // do nothing
    }
    if (!fisheyeParameters) {
      alertCaller.popUp({ message: lang.calibrate_camera_before_calibrate_modules });
      onClose(false);
      return;
    }
    if (type === CalibrationType.CAMERA && isDevMode) {
      alertCaller.popUp({
        message: 'V1 calibration detected, please use v2 to calibrate camera.',
      });
      onClose(false);
      return;
    }
    param.current = { ...fisheyeParameters };
    if (calibrated[type].has(currentDeviceId)) {
      const res = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          message: lang.ask_for_readjust,
          buttonType: alertConstants.CUSTOM_CANCEL,
          buttonLabels: [lang.skip],
          callbacks: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (res) {
        setStep(Step.ALIGN);
        return;
      }
    }
    setStep(Step.PUT_PAPER);
  };

  useEffect(() => {
    if (step === Step.WAITING) checkFirstStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = useMemo(() => {
    if (type === CalibrationType.PRINTER_HEAD) return lang.module_calibration_printer;
    if (type === CalibrationType.IR_LASER) return lang.module_calibration_2w_ir;
    return lang.camera_calibration;
  }, [type, lang]);

  switch (step) {
    case Step.ALIGN:
      return (
        <Align
          title={title}
          type={type}
          fisheyeParam={param.current as FisheyeCameraParametersV1 | FisheyeCameraParametersV2}
          onBack={() => setStep(Step.FOCUS_AND_CUT)}
          onClose={onClose}
        />
      );
    case Step.PUT_PAPER:
      return (
        <Instruction
          onClose={() => onClose(false)}
          title={title}
          text={
            type === CalibrationType.IR_LASER
              ? lang.please_place_dark_colored_paper
              : lang.please_place_paper_center
          }
          buttons={[
            { label: lang.next, onClick: () => setStep(Step.FOCUS_AND_CUT), type: 'primary' },
          ]}
          animationSrcs={
            type === CalibrationType.IR_LASER
              ? [
                  { src: 'video/put-dark-paper.webm', type: 'video/webm' },
                  { src: 'video/put-dark-paper.mp4', type: 'video/mp4' },
                ]
              : [
                  { src: 'video/ador-put-paper.webm', type: 'video/webm' },
                  { src: 'video/ador-put-paper.mp4', type: 'video/mp4' },
                ]
          }
        />
      );
    case Step.FOCUS_AND_CUT: {
      let videoName = 'ador-focus-laser';
      if (type === CalibrationType.PRINTER_HEAD) videoName = 'ador-focus-printer';
      else if (type === CalibrationType.IR_LASER) videoName = 'ador-focus-ir';
      return (
        <Instruction
          onClose={() => onClose(false)}
          title={title}
          text={
            type === CalibrationType.PRINTER_HEAD
              ? lang.ador_autofocus_focusing_block
              : lang.ador_autofocus_material
          }
          buttons={[
            { label: lang.back, onClick: () => setStep(Step.PUT_PAPER) },
            {
              label:
                type === CalibrationType.PRINTER_HEAD ? lang.start_printing : lang.start_engrave,
              onClick: async () => {
                progressCaller.openNonstopProgress({
                  id: PROGRESS_ID,
                  message: lang.drawing_calibration_image,
                });
                try {
                  if (type === CalibrationType.CAMERA) await deviceMaster.doAdorCalibrationCut();
                  else if (type === CalibrationType.PRINTER_HEAD)
                    await deviceMaster.doAdorPrinterCalibration();
                  else await deviceMaster.doAdorIRCalibration();
                  calibrated[type].add(currentDeviceId);
                  setStep(Step.ALIGN);
                } finally {
                  progressCaller.popById(PROGRESS_ID);
                }
              },
              type: 'primary',
            },
          ]}
          animationSrcs={[
            { src: `video/${videoName}.webm`, type: 'video/webm' },
            { src: `video/${videoName}.mp4`, type: 'video/mp4' },
          ]}
        />
      );
    }
    default:
      return null;
  }
};

export const showAdorCalibration = async (
  type: CalibrationType = CalibrationType.CAMERA
): Promise<boolean> => {
  if (dialogCaller.isIdExist(DIALOG_ID)) return false;
  return new Promise((resolve) => {
    dialogCaller.addDialogComponent(
      DIALOG_ID,
      <AdorCalibration
        type={type}
        onClose={(completed = false) => {
          dialogCaller.popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />
    );
  });
};

export default AdorCalibration;
