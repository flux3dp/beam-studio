import { LaserType } from '@core/app/constants/promark-constants';
import type { PromarkCameraParameters } from '@core/interfaces/Promark';

import promarkDataStore from './promark-data-store';

/**
 * Whether the webcam frames of this Promark are rotated 180°. Desktop and MOPA cameras are mounted
 * upside down, UV ones are not, but the laser source the user picked is not reliable enough to decide
 * it for calibrated machines, so the choice is stored with the camera parameters.
 */
export const isCameraRotated = (params: PromarkCameraParameters): boolean => params.rotate180 ?? true;

/**
 * Initial value for calibration: the stored choice once calibrated, otherwise a guess from the laser source.
 */
export const getInitialCameraRotation = (serial: string): boolean => {
  const params = promarkDataStore.get(serial, 'cameraParameters');

  if (params) return isCameraRotated(params);

  return promarkDataStore.get(serial, 'info')?.laserType !== LaserType.UV;
};
