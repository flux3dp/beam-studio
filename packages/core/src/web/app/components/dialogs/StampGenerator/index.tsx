import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import StampGenerator from './StampGenerator';
import { getVisibleTemplates } from './templates';
import useStampStore from './useStampStore';

export const showStampGenerator = () => {
  const DIALOG_ID = 'stamp-generator';

  if (isIdExist(DIALOG_ID)) return;

  // Always open on the first circle template (the first category in the bar).
  const templates = getVisibleTemplates();
  const defaultTemplate = templates.find((template) => template.category === 'circle') ?? templates[0];

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
