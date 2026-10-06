import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import alertConstants from '@core/app/constants/alert-constants';
import i18n from '@core/helpers/i18n';

import CelebrationDialog from './CelebrationDialog';
import Flux101Certificate from './Flux101Certificate';
import Flux101Dialog from './Flux101Dialog';
import { useFlux101Store } from './flux101Store';
import { dismissNudge, getBucket, isCourseComplete } from './progress';
import { startFlux101Sync, warnIfClaimed } from './sync';

const DIALOG_ID = 'flux-101';
const CELEBRATION_ID = 'flux-101-celebration';
const CERTIFICATE_ID = 'flux-101-certificate';

// this module is imported by every entry point (left panel, Welcome, Help menu), i.e. at app start
startFlux101Sync();

/** Open the course window at `lessonId` (default: the "Continue" lesson). One instance app-wide. */
export const showFlux101 = async (lessonId?: string): Promise<void> => {
  warnIfClaimed();
  useFlux101Store.getState().open(lessonId);

  if (isIdExist(DIALOG_ID)) return;

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

/**
 * R2a: one-time "watch the course?" prompt after the start-up tutorial. Resolves when answered;
 * skipped (and resolved at once) when already answered or the course is done.
 */
export const showFlux101Nudge = (): Promise<void> => {
  const bucket = getBucket();

  if (bucket.nudgeDismissed || isCourseComplete(bucket)) return Promise.resolve();

  const t = i18n.lang.flux_101;

  return new Promise((resolve) => {
    const answer = (watch: boolean) => {
      dismissNudge();

      if (watch) showFlux101();

      resolve();
    };

    alertCaller.popUp({
      buttonLabels: [t.nudge_later, t.nudge_watch],
      buttonType: alertConstants.CUSTOM,
      callbacks: [() => answer(false), () => answer(true)],
      caption: t.title,
      message: t.nudge_message,
      onClose: () => answer(false),
      primaryButtonIndex: 1,
    });
  });
};
