import alertCaller from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import browser from 'implementations/browser';
import i18n from 'helpers/i18n';
import isWeb from 'helpers/is-web';
import switchProtocol from 'helpers/switch-protocol';
import { getBrowser } from 'helpers/browser';

const wrappedSockets = {};

let fluxTunnelLoaded = false;
window.addEventListener('FluxTunnelLoaded', () => {
  fluxTunnelLoaded = true;
  if (isWeb() && window.location.protocol === 'http:') {
    alertCaller.popById('insecure_websocket');
    alertCaller.popUp({
      id: 'insecure_websocket',
      caption: i18n.lang.insecure_websocket.extension_detected,
      message: i18n.lang.insecure_websocket.extension_detected_description,
      buttonType: alertConstants.CONFIRM_CANCEL,
      onConfirm: () => switchProtocol('https:'),
    });
  }
});
window.dispatchEvent(new CustomEvent('CheckFluxTunnel'));

let failedCount = 0;
let chromeExtensionAlertPopped = false;

export const checkFluxTunnel = (): boolean => {
  window.dispatchEvent(new CustomEvent('CheckFluxTunnel'));
  if (!fluxTunnelLoaded && isWeb()) {
    const browserName = getBrowser();
    const isHttps = window.location.protocol === 'https:';
    if (browserName !== 'Chrome' && isHttps) {
      switchProtocol('http:');
      return false;
    }
    failedCount += 1;
    if (failedCount > 30 && isHttps && !chromeExtensionAlertPopped) {
      alertCaller.popById('insecure_websocket');
      const lang = i18n.lang.insecure_websocket;
      alertCaller.popUp({
        id: 'insecure_websocket',
        caption: i18n.lang.insecure_websocket.extension_not_deteced,
        message: `${lang.extension_not_deteced_description}<br/>${lang.unsecure_url_help_center_link}`,
        primaryButtonIndex: 0,
        buttonLabels: [i18n.lang.alert.confirm],
        callbacks: [
          () => {
            browser.open(
              'https://chromewebstore.google.com/detail/beam-studio-connect/kopngdknlbamdmehbclgbkcekligncla'
            );
          },
        ],
      });
      chromeExtensionAlertPopped = true;
    }
  }
  return fluxTunnelLoaded;
};

class InsecureWebsocket {
  id: string;

  url: string;

  protocol: string;

  onopen: () => void;

  onerror: () => void;

  onmessage: (message: string) => void;

  onclose: (data: { code?: number; reason: string }) => void;

  readyState = 0;

  constructor(url: string, protocol?: string) {
    const id = Math.random().toString(36).substring(2, 15);
    this.id = id;
    wrappedSockets[id] = this;
    this.url = url;
    this.protocol = protocol;
    this.onopen = () => {
      console.log('WebSocket connection established (default message)', id);
    };
    this.onerror = () => {};
    this.onmessage = () => {};
    this.onclose = () => {};
    if (!checkFluxTunnel()) {
      console.warn('FluxTunnel is not loaded');
      setTimeout(() => {
        this.onerror();
        this.onclose({ reason: 'FluxTunnel is not loaded' });
      }, 100);
    } else {
      console.log('Creating websocket in insecure websocket', id, 'url:', url, protocol);
      const event = new CustomEvent('CreateWebsocket', { detail: { id, url, protocol } });
      window.dispatchEvent(event);
    }
  }

  send(message: unknown): void {
    const event = new CustomEvent('SendMessage', { detail: { id: this.id, message } });
    window.dispatchEvent(event);
  }

  close(): void {
    this.readyState = 2;
    const event = new CustomEvent('CloseWebsocket', { detail: { id: this.id } });
    window.dispatchEvent(event);
  }
}

window.addEventListener('InsecureWebsocket', (e: any) => {
  const { detail } = e;
  const { id, type, message } = detail;
  if (!wrappedSockets[id]) {
    // console.warn('InsecureWebsocket Unknown websocket id', id);
    return;
  }
  switch (type) {
    case 'WEBSOCKET_CREATED':
      break;
    case 'WEBSOCKET_OPENED':
      wrappedSockets[id].readyState = 1;
      wrappedSockets[id].onopen();
      break;
    case 'WEBSOCKET_MESSAGE':
      wrappedSockets[id].onmessage({ data: message });
      break;
    case 'WEBSOCKET_CLOSED':
      wrappedSockets[id].readyState = 3;
      wrappedSockets[id].onclose();
      break;
    case 'WEBSOCKET_ERROR':
      wrappedSockets[id].onerror(message);
      break;
    default:
      console.warn('InsecureWebsocket Unknown event type', type);
      break;
  }
});

window.addEventListener('beforeunload', () => {
  Object.keys(wrappedSockets).forEach((id) => {
    wrappedSockets[id]?.close();
  });
})

export default InsecureWebsocket;
