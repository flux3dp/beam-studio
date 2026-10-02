import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import CelebrationDialog from './CelebrationDialog';
import Flux101Certificate from './Flux101Certificate';
import { useFlux101Store } from './flux101Store';

const DIALOG_ID = 'flux-101';
const CELEBRATION_ID = 'flux-101-celebration';
const CERTIFICATE_ID = 'flux-101-certificate';

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

/** Lesson / chapter completion dialog (PRD §5.4); replaces one already open. */
export const showCelebrationDialog = (lessonId: string): void => {
  if (isIdExist(CELEBRATION_ID)) popDialogById(CELEBRATION_ID);

  addDialogComponent(
    CELEBRATION_ID,
    <CelebrationDialog lessonId={lessonId} onClose={() => popDialogById(CELEBRATION_ID)} />,
  );
};

/** Course certificate (R11); `celebrate` adds the confetti rain of the 23/23 moment. */
export const showCertificate = (celebrate = false): void => {
  if (isIdExist(CERTIFICATE_ID)) return;

  addDialogComponent(
    CERTIFICATE_ID,
    <Flux101Certificate celebrate={celebrate} onClose={() => popDialogById(CERTIFICATE_ID)} />,
  );
};
