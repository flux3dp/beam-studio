import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import { getBrowser, isAndroid } from '@core/helpers/browser';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import switchProtocol from '@core/helpers/switch-protocol';
import browser from '@core/implementations/browser';

const wrappedSockets: Record<string, InsecureWebsocket> = {};

let fluxTunnelLoaded = false;

window.addEventListener('FluxTunnelLoaded', () => {
  fluxTunnelLoaded = true;

  if (isWeb() && window.location.protocol === 'http:') {
    alertCaller.popById('insecure_websocket');
    alertCaller.popUp({
      buttonType: alertConstants.CONFIRM_CANCEL,
      caption: i18n.lang.insecure_websocket.extension_detected,
      id: 'insecure_websocket',
      message: i18n.lang.insecure_websocket.extension_detected_description,
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

    if (isHttps && (browserName !== 'Chrome' || isAndroid)) {
      switchProtocol('http:');

      return false;
    }

    failedCount += 1;

    if (failedCount > 30 && isHttps && !chromeExtensionAlertPopped) {
      alertCaller.popById('insecure_websocket');

      const lang = i18n.lang.insecure_websocket;

      alertCaller.popUp({
        buttonLabels: [i18n.lang.alert.confirm],
        callbacks: [
          () => {
            browser.open(
              'https://chromewebstore.google.com/detail/beam-studio-connect/kopngdknlbamdmehbclgbkcekligncla',
            );
          },
        ],
        caption: i18n.lang.insecure_websocket.extension_not_deteced,
        id: 'insecure_websocket',
        message: `${lang.extension_not_deteced_description}<br/>${lang.unsecure_url_help_center_link}`,
        primaryButtonIndex: 0,
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

  onopen: ((event: Event) => void) | null;

  onerror: ((event: Event) => void) | null;

  onmessage: ((event: MessageEvent) => void) | null;

  onclose: ((event: CloseEvent) => void) | null;

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
        this.readyState = 3;
        delete wrappedSockets[id];
        this.onerror?.(new Event('error'));
        this.onclose?.(new CloseEvent('close', { reason: 'FluxTunnel is not loaded' }));
      }, 100);
    } else {
      console.log('Creating websocket in insecure websocket', id, 'url:', url, protocol);

      const event = new CustomEvent('CreateWebsocket', { detail: { id, protocol, url } });

      window.dispatchEvent(event);
    }
  }

  send(message: unknown): void {
    const event = new CustomEvent('SendMessage', { detail: { id: this.id, message } });

    window.dispatchEvent(event);
  }

  close(): void {
    if (this.readyState >= 2) return;

    this.readyState = 2;

    const event = new CustomEvent('CloseWebsocket', { detail: { id: this.id } });

    window.dispatchEvent(event);
  }
}

window.addEventListener('InsecureWebsocket', (e: any) => {
  const { detail } = e;
  const { id, message, type } = detail;

  if (!wrappedSockets[id]) {
    // console.warn('InsecureWebsocket Unknown websocket id', id);
    return;
  }

  switch (type) {
    case 'WEBSOCKET_CREATED':
      break;
    case 'WEBSOCKET_OPENED':
      wrappedSockets[id].readyState = 1;
      wrappedSockets[id].onopen?.(new Event('open'));
      break;
    case 'WEBSOCKET_MESSAGE':
      wrappedSockets[id].onmessage?.(new MessageEvent('message', { data: message }));
      break;
    case 'WEBSOCKET_CLOSED':
      wrappedSockets[id].readyState = 3;
      {
        const socket = wrappedSockets[id];

        delete wrappedSockets[id];
        socket.onclose?.(new CloseEvent('close'));
      }
      break;
    case 'WEBSOCKET_ERROR':
      wrappedSockets[id].onerror?.(new Event('error'));
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
});

export default InsecureWebsocket;
