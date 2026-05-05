import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import KeyChainGenerator from './KeyChainGenerator';
import useKeychainShapeStore from './useKeychainShapeStore';

export const showKeyChainGenerator = () => {
  const DIALOG_ID = 'keychain-generator';

  if (isIdExist(DIALOG_ID)) return;

  useKeychainShapeStore.getState().reset();
  addDialogComponent(DIALOG_ID, <KeyChainGenerator onClose={() => popDialogById(DIALOG_ID)} />);
};
