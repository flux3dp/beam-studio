import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import { useFlux101Store } from './flux101Store';

const DIALOG_ID = 'flux-101';

/**
 * Open the course window at `lessonId` (default: the "Continue" lesson). One instance app-wide.
 * The dialog is imported lazily: its player pulls in deviceMaster and most of the app, which the
 * entry points (left panel, Welcome tab, Help menu) must not drag into their module graph.
 */
export const showFlux101 = async (lessonId?: string): Promise<void> => {
  useFlux101Store.getState().open(lessonId);

  if (isIdExist(DIALOG_ID)) return;

  const { default: Flux101Dialog } = await import('./Flux101Dialog');

  addDialogComponent(DIALOG_ID, <Flux101Dialog onClose={() => popDialogById(DIALOG_ID)} />);
};
