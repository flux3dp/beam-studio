import { sprintf } from 'sprintf-js';

import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { MACHINE_CONNECTION_TIMEOUT } from '@core/app/pages/ConnectMachineIp/constants';
import { saveDeviceAndSettings } from '@core/app/pages/ConnectMachineIp/utils/deviceStorage';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import { discoverManager } from '@core/helpers/api/discover';
import checkIPFormat from '@core/helpers/check-ip-format';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const KEY = 'qr-auto-connect';
const DEFAULT_WEB_PORT = '8000';
const SUCCESS_MESSAGE_DELAY_MS = 1500;
const ERROR_MESSAGE_DURATION_MS = 3000;

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

const waitForDevice = (targetIps: string[]): Promise<IDeviceInfo | null> => {
  return new Promise((resolve) => {
    let timeLeft = MACHINE_CONNECTION_TIMEOUT;
    let interval: NodeJS.Timeout;
    const cleanup = (result: IDeviceInfo | null) => {
      clearInterval(interval);
      unregister();
      resolve(result);
    };

    // Poke all target IPs to trigger discovery
    targetIps.forEach((ip) => {
      try {
        discoverManager.poke(ip);
      } catch (e) {
        console.warn(`QR Auto-Connect: Failed to poke IP ${ip}:`, e);
      }
    });

    // Register listener for real-time device discovery
    const unregister = discoverManager.register(KEY, (devices) => {
      const match = devices.find((d) => targetIps.includes(d.ipaddr));

      if (match) cleanup(match);
    });

    showMessage(sprintf(i18n.lang.message.connectingMachine, `${timeLeft}s`));

    // Countdown timer for timeout
    interval = setInterval(() => {
      timeLeft--;
      showMessage(sprintf(i18n.lang.message.connectingMachine, `${timeLeft}s`));

      if (timeLeft <= 0) cleanup(null);
    }, 1000);
  });
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

    showMessage(i18n.lang.initialize.connecting);

    // Wait for device to be discovered
    const device = await waitForDevice(validIps);

    if (!device) {
      throw new Error(i18n.lang.message.device_not_found.message);
    }

    await saveDeviceAndSettings(device);

    // Only set localStorage after successful save to maintain consistency
    localStorage.setItem('host', device.ipaddr);
    localStorage.setItem('port', DEFAULT_WEB_PORT);

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

    showMessage(msg, MessageLevel.ERROR);
    clearQRCodeParams();
    setTimeout(closeMessage, ERROR_MESSAGE_DURATION_MS);

    return false;
  }
};

export default handleAutoConnect;
