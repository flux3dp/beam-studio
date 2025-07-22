import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import ColorAdvancedSetting from '.';

export const showColorAdvancedSetting = (selectedLayers: string[]) => {
  if (isIdExist('color-advanced-setting-modal')) return;

  const onClose = () => popDialogById('color-advanced-setting-modal');

  addDialogComponent(
    'color-advanced-setting-modal',
    <ColorAdvancedSetting onClose={onClose} selectedLayers={selectedLayers} />,
  );
};
