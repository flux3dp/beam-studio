import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { finishWithDevice } from '@core/app/pages/ConnectMachineIp/utils/finishWithDevice';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import checkIPFormat from '@core/helpers/check-ip-format';
import i18n from '@core/helpers/i18n';
import InsecureWebsocket, { checkFluxTunnel } from '@core/helpers/InsecureWebsocket';
import isJson from '@core/helpers/is-json';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const MESSAGE_KEY = 'qr-auto-connect';
const DEFAULT_WEB_PORT = '8000';
const SUCCESS_MESSAGE_DELAY_MS = 1500;
const PROBE_TIMEOUT_SECONDS = 30;
const PROBE_TIMEOUT_MS = PROBE_TIMEOUT_SECONDS * 1000;

function showMessage(content: string, level: MessageLevel = MessageLevel.LOADING): void {
  MessageCaller.openMessage({ content, duration: 0, key: MESSAGE_KEY, level });
}

function closeMessage(): void {
  MessageCaller.closeMessage(MESSAGE_KEY);
}

/**
 * Removes machineIp and ref params from the URL using history.replaceState.
 */
function clearUrlParams(): void {
  const url = new URL(window.location.href);

  url.searchParams.delete('ref');
  url.searchParams.delete('machineIp');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Configure localStorage for WebSocket connections to target machine.
 */
function setupLocalStorageIp(ip: string): void {
  localStorage.setItem('host', ip);
  localStorage.setItem('port', DEFAULT_WEB_PORT);
}

/**
 * Parses comma-separated IPs and returns validated, deduplicated list.
 */
function parseAndValidateIPs(param: string): string[] {
  const rawIPs = param
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  return [...new Set(rawIPs)].filter(checkIPFormat);
}

/**
 * Probe a machine via WebSocket to verify it's a valid FLUX device.
 * Returns device info if successful, null otherwise.
 */
function probeDeviceDirectly(ip: string, port: string = DEFAULT_WEB_PORT): Promise<IDeviceInfo | null> {
  return new Promise((resolve) => {
    const url = `ws://${ip}:${port}/ws/discover`;
    let ws: InsecureWebsocket | null | WebSocket = null;
    let resolved = false;

    const cleanup = (result: IDeviceInfo | null) => {
      if (resolved) return;

      resolved = true;
      clearTimeout(timeoutId);

      try {
        ws?.close();
      } catch {
        // Ignore close errors
      }

      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      console.log(`QR Auto-Connect: Probe timeout for ${ip}`);
      cleanup(null);
    }, PROBE_TIMEOUT_MS);

    try {
      const useInsecure = window.location.protocol === 'https:' && checkFluxTunnel();
      const WebSocketClass = useInsecure ? InsecureWebsocket : WebSocket;

      ws = new WebSocketClass(url);

      ws.onopen = () => {
        console.log(`QR Auto-Connect: WebSocket opened to ${ip}`);
        ws?.send(JSON.stringify({ cmd: 'poke', ipaddr: ip }));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = isJson(event.data) ? JSON.parse(event.data) : event.data;

          if (data?.uuid && data?.ipaddr) {
            console.log(`QR Auto-Connect: Found device at ${ip}:`, data.name);
            cleanup(data as IDeviceInfo);
          }
        } catch (e) {
          console.warn(`QR Auto-Connect: Error parsing message from ${ip}:`, e);
        }
      };

      ws.onerror = () => {
        console.log(`QR Auto-Connect: WebSocket error for ${ip}`);
        cleanup(null);
      };

      ws.onclose = () => cleanup(null);
    } catch (e) {
      console.warn(`QR Auto-Connect: Failed to create WebSocket for ${ip}:`, e);
      cleanup(null);
    }
  });
}

/**
 * Probe multiple IPs in parallel and return the first successful device.
 * Displays a countdown message while probing.
 */
async function findDeviceByProbing(targetIps: string[]): Promise<IDeviceInfo | null> {
  let timeLeft = PROBE_TIMEOUT_SECONDS;
  let stopped = false;

  showMessage(sprintf(i18n.lang.message.connectingMachine, `${timeLeft}s`));

  const countdownInterval = setInterval(() => {
    timeLeft--;

    if (timeLeft > 0 && !stopped) {
      showMessage(sprintf(i18n.lang.message.connectingMachine, `${timeLeft}s`));
    }
  }, 1000);

  const stopCountdown = () => {
    stopped = true;
    clearInterval(countdownInterval);
  };

  // Race all probes - first successful response wins
  const probePromises = targetIps.map(async (ip) => {
    const device = await probeDeviceDirectly(ip);

    if (device) return { ...device, ipaddr: ip };

    // Return a never-resolving promise so Promise.race ignores failed probes
    return new Promise<IDeviceInfo>(() => {});
  });

  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), PROBE_TIMEOUT_MS + 1000);
  });

  try {
    return await Promise.race([...probePromises, timeoutPromise]);
  } catch {
    return null;
  } finally {
    stopCountdown();
  }
}

export async function handleAutoConnect(): Promise<boolean> {
  const machineIpParam = new URLSearchParams(window.location.search).get('machineIp');

  if (!machineIpParam) {
    clearUrlParams();

    return false;
  }

  const validIps = parseAndValidateIPs(machineIpParam);

  console.log('QR Auto-Connect: Starting with IPs:', validIps);

  try {
    if (validIps.length === 0) throw new Error(i18n.lang.initialize.connect_machine_ip.invalid_format);

    const device = await findDeviceByProbing(validIps);

    if (!device) throw new Error(i18n.lang.message.device_not_found.message);

    await finishWithDevice(device);
    setupLocalStorageIp(device.ipaddr);

    // Update TopBar UI if user is already on editor page
    if (window.location.hash.includes('/studio/beambox')) {
      try {
        TopBarController.setSelectedDevice(device);
      } catch (e) {
        console.warn('QR Auto-Connect: Failed to update TopBar:', e);
      }
    }

    showMessage(`${device.name} (${device.ipaddr}) ${i18n.lang.message.connected}`, MessageLevel.SUCCESS);
    await new Promise((r) => setTimeout(r, SUCCESS_MESSAGE_DELAY_MS));

    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : i18n.lang.message.unknown_error;

    console.error('QR Auto-Connect Failed:', msg);
    alertCaller.popUp({
      caption: msg,
      message: i18n.lang.initialize.connect_machine_ip.connection_failed_hint,
      messageIcon: 'warning',
    });

    return false;
  } finally {
    closeMessage();
    clearUrlParams();
  }
}

export default handleAutoConnect;
