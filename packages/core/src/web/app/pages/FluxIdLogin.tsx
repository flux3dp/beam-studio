import React, { useEffect } from 'react';

import dialog from '@core/app/actions/dialog-caller';
import { getHomePage, hashMap } from '@core/helpers/hashHelper';
import storage from '@core/implementations/storage';

// Empty page to show login dialog
function FluxIdLogin(): React.JSX.Element {
  useEffect(() => {
    dialog.clearAllDialogComponents();

    const isReady = storage.get('printer-is-ready');

    dialog.showLoginDialog(() => {
      window.location.hash = isReady ? getHomePage() : hashMap.machineSetup;
    }, !isReady);
  }, []);

  return <div className="top-bar" />;
}

export default FluxIdLogin;
