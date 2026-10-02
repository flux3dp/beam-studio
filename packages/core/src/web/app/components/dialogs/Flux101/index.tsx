import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import Flux101Dialog from './Flux101Dialog';
import { useFlux101Store } from './flux101Store';

const DIALOG_ID = 'flux-101';

/** Open the course window at `lessonId` (default: the "Continue" lesson). One instance app-wide. */
export const showFlux101 = (lessonId?: string): void => {
  useFlux101Store.getState().open(lessonId);

  if (!isIdExist(DIALOG_ID)) {
    addDialogComponent(DIALOG_ID, <Flux101Dialog onClose={() => popDialogById(DIALOG_ID)} />);
  }
};
