import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { eventEmitter } from '@core/app/contexts/DialogContext';
import { useDocumentStore } from '@core/app/stores/documentStore';
import deviceMaster from '@core/helpers/device-master';

import ConnectionIssueGuide from './ConnectionIssueGuide';

const DIALOG_ID = 'connection-issue-guide';

const handleShowConnectionIssueGuide = (model?: WorkAreaModel): void => {
  if (isIdExist(DIALOG_ID)) {
    popDialogById(DIALOG_ID);
  }

  const resolvedModel = model ?? deviceMaster.currentDevice?.info.model ?? useDocumentStore.getState().workarea;

  addDialogComponent(
    DIALOG_ID,
    <ConnectionIssueGuide model={resolvedModel} onClose={() => popDialogById(DIALOG_ID)} />,
  );
};

/**
 * Register the connection-issue guide handler on the dialog event bus.
 *
 * This module owns the (heavy) ConnectionIssueGuide dependency tree;
 * use event-based caller to avoid circular dependency.
 */
export const registerConnectionIssueGuide = (): void => {
  eventEmitter.off('SHOW_CONNECTION_ISSUE_GUIDE', handleShowConnectionIssueGuide);
  eventEmitter.on('SHOW_CONNECTION_ISSUE_GUIDE', handleShowConnectionIssueGuide);
};

export default registerConnectionIssueGuide;
