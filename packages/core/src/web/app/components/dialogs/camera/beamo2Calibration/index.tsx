import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import Beamo2Calibration from './Beamo2Calibration';

export const showBeamo2Calibration = (isAdvanced = false): Promise<boolean> => {
  const id = 'bm2-calibration';
  const onClose = () => popDialogById(id);

  if (isIdExist(id)) onClose();

  return new Promise<boolean>((resolve) => {
    addDialogComponent(
      id,
      <Beamo2Calibration
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
  showBeamo2Calibration,
};
