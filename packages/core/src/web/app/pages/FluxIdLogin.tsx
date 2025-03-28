import React, { useEffect } from 'react';

import dialog from '@core/app/actions/dialog-caller';
import storage from '@core/implementations/storage';

// Empty page to show login dialog
function FluxIdLogin(): React.JSX.Element {
  useEffect(() => {
    dialog.clearAllDialogComponents();

    const isReady = storage.get('printer-is-ready');

    dialog.showLoginDialog(() => {
      window.location.hash = isReady ? '#/studio/beambox' : '#/initialize/connect/select-machine-model';
    }, !isReady);
  }, []);

  return <div className="top-bar" />;
}

export default FluxIdLogin;
