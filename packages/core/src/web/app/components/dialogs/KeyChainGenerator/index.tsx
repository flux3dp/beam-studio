import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import KeyChainGenerator from './KeyChainGenerator';

export const showKeyChainGenerator = () => {
  const DIALOG_ID = 'keychain-generator';

  if (isIdExist(DIALOG_ID)) return;

  addDialogComponent(DIALOG_ID, <KeyChainGenerator onClose={() => popDialogById(DIALOG_ID)} />);
};
