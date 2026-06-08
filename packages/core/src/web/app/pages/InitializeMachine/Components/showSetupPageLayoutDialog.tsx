import type { ReactNode } from 'react';
import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import SetupPageLayout, { type SetupPageButtonConfig } from './SetupPageLayout';

const DEFAULT_ID = 'setup-page-layout-dialog';

interface ShowSetupPageLayoutDialogArgs {
  buttons: SetupPageButtonConfig[];
  children: ReactNode;
  id?: string;
}

/**
 * Overlay a full-page `SetupPageLayout` on top of the current page for setup-style "asks" that
 * shouldn't be their own route. Each button closes the overlay before running its action.
 */
export const showSetupPageLayoutDialog = ({
  buttons,
  children,
  id = DEFAULT_ID,
}: ShowSetupPageLayoutDialogArgs): void => {
  if (isIdExist(id)) {
    popDialogById(id);
  }

  const wrappedButtons = buttons.map((button) => ({
    ...button,
    onClick: () => {
      popDialogById(id);
      button.onClick();
    },
  }));

  addDialogComponent(
    id,
    <SetupPageLayout buttons={wrappedButtons} isDialog>
      {children}
    </SetupPageLayout>,
  );
};

export default showSetupPageLayoutDialog;
