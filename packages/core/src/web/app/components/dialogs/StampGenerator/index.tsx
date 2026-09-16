import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import StampGenerator from './StampGenerator';
import { STAMP_TEMPLATES } from './templates';
import useStampStore from './useStampStore';

export const showStampGenerator = () => {
  const DIALOG_ID = 'stamp-generator';

  if (isIdExist(DIALOG_ID)) return;

  useStampStore.getState().selectTemplate(STAMP_TEMPLATES[0].id);
  addDialogComponent(
    DIALOG_ID,
    <StampGenerator
      onClose={() => {
        useStampStore.getState().reset();
        popDialogById(DIALOG_ID);
      }}
    />,
  );
};
