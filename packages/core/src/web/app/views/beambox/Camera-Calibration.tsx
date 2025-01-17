/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import * as React from 'react';

import dialog from 'app/actions/dialog-caller';
import { IDeviceInfo } from 'interfaces/IDevice';
import {
  STEP_ASK_READJUST,
  STEP_BEFORE_ANALYZE_PICTURE,
  STEP_FINISH,
  STEP_PUT_PAPER,
  STEP_REFOCUS,
} from 'app/constants/camera-calibration-constants';
import { useContext } from 'react';
import { CalibrationContext, CalibrationProvider } from 'app/contexts/CalibrationContext';
import StepFinish from './CameraCalibration/StepFinish';
import StepPutPaper from './CameraCalibration/StepCutPaper';
import StepAskReadjust from './CameraCalibration/StepAskReadjust';
import StepRefocus from './CameraCalibration/StepRefocus';
import StepBeforeAnalyzePicture from './CameraCalibration/StepBeforeAnalyzePicture';

const CameraCalibrationComponent = (): JSX.Element => {
  const { currentStep } = useContext(CalibrationContext);

  switch (currentStep) {
    case STEP_ASK_READJUST:
      return <StepAskReadjust />;
    case STEP_PUT_PAPER:
      return <StepPutPaper />;
    case STEP_REFOCUS:
      return <StepRefocus />;
    case STEP_BEFORE_ANALYZE_PICTURE:
      return <StepBeforeAnalyzePicture />;
    case STEP_FINISH:
      return <StepFinish />;
    default:
      return null;
  }
};

export default CameraCalibrationComponent;

// Not putting this in dialog-caller to avoid circular import because DeviceMaster imports dialog
export const showCameraCalibration = (
  device: IDeviceInfo, isBorderless: boolean,
): Promise<boolean> | boolean => {
  if (dialog.isIdExist('camera-cali')) return false;
  return new Promise<boolean>((resolve) => {
    console.log(device);
    dialog.addDialogComponent('camera-cali',
      <CalibrationProvider
        borderless={isBorderless}
        device={device}
        onClose={(completed = false) => {
          dialog.popDialogById('camera-cali');
          resolve(completed);
        }}
      >
        <CameraCalibrationComponent />
      </CalibrationProvider>);
  });
};
