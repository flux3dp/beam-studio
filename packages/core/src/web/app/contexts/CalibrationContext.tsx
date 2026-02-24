import React, { createContext, useState } from 'react';

import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import { DEFAULT_CAMERA_OFFSET, STEP_ASK_READJUST, STEP_PUT_PAPER } from '@core/app/constants/cameraConstants';
import { useStorageStore } from '@core/app/stores/storageStore';
import DeviceMaster from '@core/helpers/device-master';
import versionChecker from '@core/helpers/version-checker';
import type { CameraConfig } from '@core/interfaces/Camera';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

interface CalibrationContextType {
  borderless: boolean;
  calibratedMachines: string[];
  cameraPosition: { x: number; y: number };
  currentOffset: CameraConfig;
  currentStep: symbol;
  device: IDeviceInfo;
  gotoNextStep: (step: symbol) => void;
  imgBlobUrl: string;
  lastConfig: CameraConfig;
  onClose: (completed: boolean) => void;
  originFanSpeed: number;
  setCalibratedMachines: (val: string[]) => void;
  setCameraPosition: (val: { x: number; y: number }) => void;
  setCurrentOffset: (val: CameraConfig) => void;
  setCurrentStep: (val: symbol) => void;
  setImgBlobUrl: (v: string) => void;
  setLastConfig: (val: CameraConfig) => void;
  setOriginFanSpeed: (val: number) => void;
  unit: string;
}

export const CalibrationContext = createContext<CalibrationContextType>({
  borderless: false,
  calibratedMachines: [],
  cameraPosition: { x: 0, y: 0 },
  currentOffset: null as any,
  currentStep: STEP_PUT_PAPER,
  device: null as any,
  gotoNextStep: () => {},
  imgBlobUrl: '',
  lastConfig: null as any,
  onClose: () => {},
  originFanSpeed: 100,
  setCalibratedMachines: () => {},
  setCameraPosition: () => {},
  setCurrentOffset: () => {},
  setCurrentStep: () => {},
  setImgBlobUrl: () => {},
  setLastConfig: () => {},
  setOriginFanSpeed: () => {},
  unit: 'mm',
});

interface CalibrationProviderProps {
  borderless: boolean;
  children: React.ReactNode;
  device: IDeviceInfo;
  onClose: (completed: boolean) => void;
}

let calibratedMachines: string[] = [];

export function CalibrationProvider({
  borderless,
  children,
  device,
  onClose,
}: CalibrationProviderProps): React.JSX.Element {
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
  const unit = useStorageStore((state) => state['default-units'] || 'mm');

  const wrappedOnClose = async (completed: boolean) => {
    onClose(completed);
    await PreviewModeController.end({ shouldWaitForEnd: true });

    const tempCmdAvailable = versionChecker(device?.version).meetRequirement('TEMP_I2C_CMD');

    if (originFanSpeed && !tempCmdAvailable) {
      await DeviceMaster.setFan(originFanSpeed);
    }
  };

  return (
    <CalibrationContext
      value={{
        borderless,
        calibratedMachines,
        cameraPosition,
        currentOffset,
        currentStep,
        device,
        gotoNextStep: setCurrentStep,
        imgBlobUrl,
        lastConfig,
        onClose: wrappedOnClose,
        originFanSpeed,
        setCalibratedMachines,
        setCameraPosition,
        setCurrentOffset,
        setCurrentStep,
        setImgBlobUrl,
        setLastConfig,
        setOriginFanSpeed,
        unit,
      }}
    >
      {children}
    </CalibrationContext>
  );
}
