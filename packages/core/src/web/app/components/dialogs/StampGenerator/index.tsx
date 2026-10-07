import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import StampGenerator from './StampGenerator';
import { STAMP_TEMPLATES } from './templates';
import useStampStore from './useStampStore';

export const showStampGenerator = () => {
  const DIALOG_ID = 'stamp-generator';

  if (isIdExist(DIALOG_ID)) return;

  // Always open on the first circle template (the first category in the bar).
  const defaultTemplate = STAMP_TEMPLATES.find((template) => template.category === 'circle') ?? STAMP_TEMPLATES[0];

  useStampStore.getState().selectTemplate(defaultTemplate.id);
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
