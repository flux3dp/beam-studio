import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import GalvoDevSettings from './index';

const DIALOG_ID = 'galvo-dev-settings';

export const showGalvoDevSettings = (): void => {
  if (isIdExist(DIALOG_ID)) return;

  addDialogComponent(DIALOG_ID, <GalvoDevSettings onClose={() => popDialogById(DIALOG_ID)} />);
};

export default showGalvoDevSettings;
