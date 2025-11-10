import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { LayerModuleType } from '@core/app/constants/layer-module/layer-modules';

import { OffsetSettings } from './OffsetSettings';

export const showOffsetSettings = (layerModule: LayerModuleType) => {
  if (isIdExist('module-calibration-offset-settings')) return;

  const onClose = () => popDialogById('module-calibration-offset-settings');

  addDialogComponent(
    'module-calibration-offset-settings',
    <OffsetSettings layerModule={layerModule} onClose={onClose} />,
  );
};
