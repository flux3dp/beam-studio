import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import TemplatePreviewModal from './TemplatePreviewModal';

const dialogId = 'template-mode-preview-dialog';

export const showTemplateModePreview = () => {
  if (isIdExist(dialogId)) {
    popDialogById(dialogId);
  }

  addDialogComponent(
    dialogId,
    <TemplatePreviewModal
      onClose={() => {
        popDialogById(dialogId);
      }}
    />,
  );
};
