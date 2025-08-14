import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';

export const getMovementSpeed = (workarea: WorkAreaModel): number => {
  const { 'enable-diode': enableDiode } = useDocumentStore.getState();

  // fixed to 3600 for diode laser
  if (enableDiode && getAddOnInfo(workarea).hybridLaser) {
    return 3600;
  }

  const previewMovementSpeedLevel = useGlobalPreferenceStore.getState()['preview_movement_speed_level'];

  if (previewMovementSpeedLevel === PreviewSpeedLevel.FAST) {
    return 18000;
  }

  if (previewMovementSpeedLevel === PreviewSpeedLevel.MEDIUM) {
    return 14400;
  }

  return 10800;
};
