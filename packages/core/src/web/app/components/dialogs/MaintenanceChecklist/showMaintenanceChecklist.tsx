import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import { useMaintenanceStore } from './useMaintenanceStore';

import MaintenanceChecklist from './index';

const DIALOG_ID = 'maintenance-checklist';

export const showMaintenanceChecklist = (initialMachineKey?: string): void => {
  if (isIdExist(DIALOG_ID)) return;

  // Seed before mounting so the first render already has this open's state, rather than the
  // previous session's leftovers plus a correcting effect.
  useMaintenanceStore.getState().reset(initialMachineKey);
  addDialogComponent(DIALOG_ID, <MaintenanceChecklist onClose={() => popDialogById(DIALOG_ID)} />);
};
