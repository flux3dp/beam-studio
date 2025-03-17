import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import PassThrough from './PassThrough';
import { PassThroughProvider } from './PassThroughContext';

export const showPassThrough = (onClose?: () => void): Promise<void> => {
  const dialogId = 'pass-through';

  if (isIdExist(dialogId)) {
    popDialogById(dialogId);
  }

  return new Promise<void>((resolve) => {
    addDialogComponent(
      dialogId,
      <PassThroughProvider>
        <PassThrough
          onClose={() => {
            resolve();
            popDialogById(dialogId);
            onClose?.();
          }}
        />
      </PassThroughProvider>,
    );
  });
};
