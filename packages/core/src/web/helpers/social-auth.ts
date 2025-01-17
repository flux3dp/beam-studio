import storage from 'implementations/storage';

function socialAuth(result: boolean): void {
  if (result) {
    if (window.opener?.location.hash === '#/initialize/connect/flux-id-login') {
      const isReady = storage.get('printer-is-ready');
      window.opener.location.hash = isReady ? '#studio/beambox' : '#initialize/connect/select-machine-model';
    }
    window.opener?.dispatchEvent(new CustomEvent('DISMISS_FLUX_LOGIN'));
    window.close();
  }
}

export default socialAuth;
