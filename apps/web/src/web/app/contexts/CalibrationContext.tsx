import React, { createContext, useState } from 'react';

import DeviceMaster from 'helpers/device-master';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import storage from 'implementations/storage';
import versionChecker from 'helpers/version-checker';
import { CameraConfig } from 'interfaces/Camera';
import {
  DEFAULT_CAMERA_OFFSET,
  STEP_ASK_READJUST,
  STEP_PUT_PAPER,
} from 'app/constants/camera-calibration-constants';
import { IDeviceInfo } from 'interfaces/IDevice';

interface CalibrationContextType {
  borderless: boolean;
  cameraPosition: { x: number; y: number };
  setCameraPosition: (val: { x: number; y: number }) => void;
  calibratedMachines: string[];
  setCalibratedMachines: (val: string[]) => void;
  currentOffset: CameraConfig;
  setCurrentOffset: (val: CameraConfig) => void;
  currentStep: symbol;
  setCurrentStep: (val: symbol) => void;
  lastConfig: CameraConfig;
  setLastConfig: (val: CameraConfig) => void;
  gotoNextStep: (step: symbol) => void;
  onClose: (completed: boolean) => void;
  originFanSpeed: number;
  setOriginFanSpeed: (val: number) => void;
  imgBlobUrl: string;
  setImgBlobUrl: (v: string) => void;
  device: IDeviceInfo;
  unit: string;
}

export const CalibrationContext = createContext<CalibrationContextType>({
  borderless: false,
  cameraPosition: { x: 0, y: 0 },
  setCameraPosition: () => {},
  calibratedMachines: [],
  setCalibratedMachines: () => {},
  currentOffset: null,
  setCurrentOffset: () => {},
  currentStep: STEP_PUT_PAPER,
  setCurrentStep: () => {},
  lastConfig: null,
  setLastConfig: () => {},
  gotoNextStep: () => {},
  onClose: () => {},
  imgBlobUrl: '',
  setImgBlobUrl: () => {},
  originFanSpeed: 100,
  setOriginFanSpeed: () => {},
  device: null,
  unit: 'mm',
});

interface CalibrationProviderProps {
  children: React.ReactNode;
  borderless: boolean;
  device: IDeviceInfo;
  onClose: (completed: boolean) => void;
}

let calibratedMachines = [];

export function CalibrationProvider({
  children,
  borderless,
  device,
  onClose,
}: CalibrationProviderProps): JSX.Element {
  const didCalibrate = calibratedMachines.includes(device.uuid);
  const initStep: symbol = didCalibrate ? STEP_ASK_READJUST : STEP_PUT_PAPER;
  const [currentStep, setCurrentStep] = useState(initStep);
  const [currentOffset, setCurrentOffset] = useState(DEFAULT_CAMERA_OFFSET);
  const [lastConfig, setLastConfig] = useState(DEFAULT_CAMERA_OFFSET);
  const setCalibratedMachines = (newList: string[]) => {
    calibratedMachines = newList;
  };
  const [imgBlobUrl, setImgBlobUrl] = useState('');
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });
  const [originFanSpeed, setOriginFanSpeed] = useState(1000);
  const unit = (storage.get('default-units') as string) || 'mm';

  const wrappedOnClose = async (completed: boolean) => {
    onClose(completed);
    await PreviewModeController.end({ shouldWaitForEnd: true });
    const tempCmdAvailable = versionChecker(device?.version).meetRequirement('TEMP_I2C_CMD');
    if (originFanSpeed && !tempCmdAvailable) {
      await DeviceMaster.setFan(originFanSpeed);
    }
  };

  return (
    <CalibrationContext.Provider
      value={{
        borderless,
        device,
        currentStep,
        setCurrentStep,
        cameraPosition,
        setCameraPosition,
        currentOffset,
        setCurrentOffset,
        lastConfig,
        setLastConfig,
        calibratedMachines,
        setCalibratedMachines,
        imgBlobUrl,
        setImgBlobUrl,
        originFanSpeed,
        setOriginFanSpeed,
        gotoNextStep: setCurrentStep,
        unit,
        onClose: wrappedOnClose,
      }}
    >
      {children}
    </CalibrationContext.Provider>
  );
}
