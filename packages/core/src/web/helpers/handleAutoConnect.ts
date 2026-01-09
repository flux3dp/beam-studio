import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { saveDeviceAndSettings } from '@core/app/pages/ConnectMachineIp/utils/deviceStorage';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import checkIPFormat from '@core/helpers/check-ip-format';
import i18n from '@core/helpers/i18n';
import InsecureWebsocket, { checkFluxTunnel } from '@core/helpers/InsecureWebsocket';
import isJson from '@core/helpers/is-json';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const KEY = 'qr-auto-connect';
const DEFAULT_WEB_PORT = '8000';
const SUCCESS_MESSAGE_DELAY_MS = 1500;
const PROBE_TIMEOUT_SECONDS = 10;
const PROBE_TIMEOUT_MS = PROBE_TIMEOUT_SECONDS * 1000;

const showMessage = (content: string, level: MessageLevel = MessageLevel.LOADING) =>
  MessageCaller.openMessage({ content, duration: 0, key: KEY, level });

const closeMessage = () => MessageCaller.closeMessage(KEY);

const clearQRCodeParams = (): void => {
  const url = new URL(window.location.href);

  url.searchParams.delete('ref');
  url.searchParams.delete('machineIp');
  // Use replaceState to update URL without reload
  window.history.replaceState({}, '', url.toString());
};

/**
 * Directly probe a machine's backend via WebSocket without modifying localStorage.
 * This creates a temporary WebSocket connection to verify the machine is a valid FLUX device.
 * Returns the device info if successful, null otherwise.
 */
const probeDeviceDirectly = (ip: string, port: string = DEFAULT_WEB_PORT): Promise<IDeviceInfo | null> => {
  return new Promise((resolve) => {
    const url = `ws://${ip}:${port}/ws/discover`;
    let ws: InsecureWebsocket | null | WebSocket = null;
    let resolved = false;

    const cleanup = (result: IDeviceInfo | null) => {
      if (resolved) return;

      resolved = true;

      try {
        ws?.close();
      } catch {
        // Ignore close errors
      }

      resolve(result);
    };

    // Timeout if no response
    const timeoutId = setTimeout(() => {
      console.log(`QR Auto-Connect: Probe timeout for ${ip}`);
      cleanup(null);
    }, PROBE_TIMEOUT_MS);

    try {
      // Use InsecureWebsocket for HTTPS contexts, regular WebSocket for HTTP
      const useInsecure = window.location.protocol === 'https:' && checkFluxTunnel();
      const WebSocketClass = useInsecure ? InsecureWebsocket : WebSocket;

      ws = new WebSocketClass(url);

      ws.onopen = () => {
        console.log(`QR Auto-Connect: WebSocket opened to ${ip}`);
        // Send poke command to trigger device info response
        ws?.send(JSON.stringify({ cmd: 'poke', ipaddr: ip }));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = isJson(event.data) ? JSON.parse(event.data) : event.data;

          // Check if this is a valid device info response
          if (data && data.uuid && data.ipaddr) {
            console.log(`QR Auto-Connect: Found device at ${ip}:`, data.name);
            clearTimeout(timeoutId);
            cleanup(data as IDeviceInfo);
          }
        } catch (e) {
          console.warn(`QR Auto-Connect: Error parsing message from ${ip}:`, e);
        }
      };

      ws.onerror = () => {
        console.log(`QR Auto-Connect: WebSocket error for ${ip}`);
        clearTimeout(timeoutId);
        cleanup(null);
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);

        if (!resolved) {
          cleanup(null);
        }
      };
    } catch (e) {
      console.warn(`QR Auto-Connect: Failed to create WebSocket for ${ip}:`, e);
      clearTimeout(timeoutId);
      cleanup(null);
    }
  });
};

/**
 * Probe multiple IPs in parallel and return the first successful device.
 * This is faster than sequential checking when any IP might work.
 * Displays a countdown message while probing.
 */
const findDeviceByProbing = async (targetIps: string[]): Promise<IDeviceInfo | null> => {
  let timeLeft = PROBE_TIMEOUT_SECONDS;
  let foundDevice: IDeviceInfo | null = null;

  // Show initial countdown message
  showMessage(sprintf(i18n.lang.message.connectingMachine, `${timeLeft}s`));

  // Start countdown interval
  const countdownInterval = setInterval(() => {
    timeLeft--;

    if (timeLeft > 0 && !foundDevice) {
      showMessage(sprintf(i18n.lang.message.connectingMachine, `${timeLeft}s`));
    }
  }, 1000);

  // Race all probes - first successful response wins
  const probePromises = targetIps.map(async (ip) => {
    const device = await probeDeviceDirectly(ip);

    if (device) {
      foundDevice = device;

      return device;
    }

    // Return a never-resolving promise for failed probes so Promise.race ignores them
    return new Promise<IDeviceInfo>(() => {});
  });

  // Add a timeout promise that resolves to null
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), PROBE_TIMEOUT_MS + 1000);
  });

  try {
    const result = await Promise.race([...probePromises, timeoutPromise]);

    clearInterval(countdownInterval);

    return result;
  } catch {
    clearInterval(countdownInterval);

    return null;
  }
};

/**
 * Configure localStorage to point WebSocket connections to the target machine.
 * This is necessary for subsequent operations that use the global discoverManager.
 */
const configureWebSocketTarget = (ip: string): void => {
  localStorage.setItem('host', ip);
  localStorage.setItem('port', DEFAULT_WEB_PORT);
};

export const handleAutoConnect = async (): Promise<boolean> => {
  const params = new URLSearchParams(window.location.search);
  const rawIps =
    params
      .get('machineIp')
      ?.split(',')
      .map((i) => i.trim())
      .filter(Boolean) || [];

  if (rawIps.length === 0) return false;

  console.log('QR Auto-Connect: Starting with IPs:', rawIps);

  try {
    const validIps = rawIps.filter(checkIPFormat);

    if (validIps.length === 0) {
      throw new Error(i18n.lang.initialize.connect_machine_ip.invalid_format);
    }

    // Step 1: Probe all IPs in parallel via direct WebSocket connection
    const device = await findDeviceByProbing(validIps);

    if (!device) {
      throw new Error(i18n.lang.message.device_not_found.message);
    }

    // Step 2: Save device settings
    await saveDeviceAndSettings(device);

    // Step 3: Now that we found a valid device, configure localStorage
    configureWebSocketTarget(device.ipaddr);

    // Update TopBar UI if user is already on editor page
    if (window.location.hash.includes('/studio/beambox')) {
      try {
        TopBarController.setSelectedDevice(device);
      } catch (e) {
        console.warn('QR Auto-Connect: Failed to update TopBar:', e);
      }
    }

    clearQRCodeParams();
    showMessage(`${device.name} (${device.ipaddr}) ${i18n.lang.message.connected}`, MessageLevel.SUCCESS);

    await new Promise((r) => setTimeout(r, SUCCESS_MESSAGE_DELAY_MS));
    closeMessage();

    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : i18n.lang.message.unknown_error;

    console.error('QR Auto-Connect Failed:', msg);

    closeMessage();
    clearQRCodeParams();

    // Show alert dialog with troubleshooting guide link
    alertCaller.popUp({
      caption: msg,
      message: i18n.lang.initialize.connect_machine_ip.connection_failed_hint,
      messageIcon: 'warning',
    });

    return false;
  }
};

export default handleAutoConnect;
