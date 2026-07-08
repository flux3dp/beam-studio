import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import MaintenanceChecklist from './index';

const DIALOG_ID = 'maintenance-checklist';

export const showMaintenanceChecklist = (initialMachineKey?: string): void => {
  if (isIdExist(DIALOG_ID)) return;

  addDialogComponent(
    DIALOG_ID,
    <MaintenanceChecklist initialMachineKey={initialMachineKey} onClose={() => popDialogById(DIALOG_ID)} />,
  );
};
