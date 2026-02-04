import * as React from 'react';
import { useContext } from 'react';

import dialog from '@core/app/actions/dialog-caller';
import {
  STEP_ASK_READJUST,
  STEP_BEFORE_ANALYZE_PICTURE,
  STEP_FINISH,
  STEP_PUT_PAPER,
  STEP_REFOCUS,
} from '@core/app/constants/cameraConstants';
import { CalibrationContext, CalibrationProvider } from '@core/app/contexts/CalibrationContext';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import StepAskReadjust from './StepAskReadjust';
import StepBeforeAnalyzePicture from './StepBeforeAnalyzePicture';
import StepFinish from './StepFinish';
import StepPutPaper from './StepPutPaper';
import StepRefocus from './StepRefocus';

const CameraCalibrationComponent = (): null | React.JSX.Element => {
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
export const showCameraCalibration = (device: IDeviceInfo, isBorderless: boolean): boolean | Promise<boolean> => {
  if (dialog.isIdExist('camera-cali')) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    console.log(device);
    dialog.addDialogComponent(
      'camera-cali',
      <CalibrationProvider
        borderless={isBorderless}
        device={device}
        onClose={(completed = false) => {
          dialog.popDialogById('camera-cali');
          resolve(completed);
        }}
      >
        <CameraCalibrationComponent />
      </CalibrationProvider>,
    );
  });
};
