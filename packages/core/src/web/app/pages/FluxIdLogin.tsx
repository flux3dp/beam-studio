import React, { useEffect } from 'react';

import dialog from '@core/app/actions/dialog-caller';
import { getHomePage, hashMap } from '@core/helpers/hashHelper';
import storage from '@core/implementations/storage';

import TopBarPlaceHolder from './InitializeMachine/Components/TopBarPlaceHolder';

// Empty page to show login dialog
function FluxIdLogin(): React.JSX.Element {
  useEffect(() => {
    dialog.clearAllDialogComponents();

    const isReady = storage.get('printer-is-ready');

    dialog.showLoginDialog(() => {
      window.location.hash = isReady ? getHomePage() : hashMap.machineSetup;
    }, !isReady);
  }, []);

  return <TopBarPlaceHolder />;
}

export default FluxIdLogin;
