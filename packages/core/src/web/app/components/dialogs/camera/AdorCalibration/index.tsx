import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import AdorCalibration from './AdorCalibration';

export const showAdorCalibration = async ({
  factoryMode = false,
  isAdvanced = false,
}: { factoryMode?: boolean; isAdvanced?: boolean } = {}): Promise<boolean> => {
  const DIALOG_ID = 'fisheye-calibration-v2';

  if (isIdExist(DIALOG_ID)) {
    return false;
  }

  return new Promise((resolve) => {
    addDialogComponent(
      DIALOG_ID,
      <AdorCalibration
        factoryMode={factoryMode}
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          popDialogById(DIALOG_ID);
          resolve(completed);
        }}
      />,
    );
  });
};
