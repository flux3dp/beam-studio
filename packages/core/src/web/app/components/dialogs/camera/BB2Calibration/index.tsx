import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import LaserHead from './LaserHead';

export const showBB2Calibration = (isAdvanced = false): Promise<boolean> => {
  const id = 'bb2-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) {
    onClose();
  }

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <LaserHead
        isAdvanced={isAdvanced}
        onClose={(completed = false) => {
          onClose();
          resolve(completed);
        }}
      />,
    );
  });
};

export default {
  showBB2Calibration,
};
