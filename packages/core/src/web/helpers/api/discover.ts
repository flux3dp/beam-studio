/**
 * API discover
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-discover
 */
import DeviceList from '@core/helpers/device-list';
import isWeb from '@core/helpers/is-web';
import Logger from '@core/helpers/logger';
import sentryHelper from '@core/helpers/sentry-helper';
import SmartUpnp from '@core/helpers/smart-upnp';
import Websocket from '@core/helpers/websocket';
import communicator from '@core/implementations/communicator';
import network from '@core/implementations/network';
import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { swiftrayClient } from './swiftray-client';

const BUFFER = 100;

export const SEND_DEVICES_INTERVAL = 5000;

const CLEAR_DEVICES_INTERVAL = 15000;
const discoverLogger = Logger('discover');
const isWebClient = isWeb();

let lastSendMessage = 0;
let notifyTimeout: NodeJS.Timeout;
let devices: IDeviceInfo[] = [];
const dispatchers: Array<{ id: string; sender: (devices: IDeviceInfo[]) => void }> = [];
const idList: string[] = [];
const deviceMap: Record<string, IDeviceInfo> = {};
let swiftrayDevices: Record<string, IDeviceInfo> = {};

// Open up FLUX wrapped websocket
const ws = Websocket({
  method: 'discover',
});

const sendFoundDevices = () => {
  discoverLogger.clear();
  discoverLogger.append(deviceMap);

  dispatchers.forEach((dispatcher) => {
    dispatcher.sender(devices);
  });
};

const updatePokeIPAddr = (device: IDeviceInfo): void => {
  const maxLen = 20;
  const pokeIPAddr: string = storage.get('poke-ip-addr');

  if (pokeIPAddr?.trim()) {
    const pokeIPAddrArr = pokeIPAddr.split(/[,;] ?/);

    if (device.ipaddr && !pokeIPAddrArr.includes(device.ipaddr) && device.ipaddr !== 'raspberrypi.local') {
      pokeIPAddrArr.push(device.ipaddr);

      if (pokeIPAddrArr.length > maxLen) {
        pokeIPAddrArr.splice(0, pokeIPAddrArr.length - maxLen);
      }

      storage.set('poke-ip-addr', pokeIPAddrArr.join(', '));
    }
  } else {
    storage.set('poke-ip-addr', device.ipaddr);
  }
};

const onMessage = (device: IDeviceInfo) => {
  if (device.alive) {
    updatePokeIPAddr(device);

    device.lastAlive = Date.now();
    deviceMap[device.uuid] = device;
    sentryHelper.sendDeviceInfo(device);
  } else if (deviceMap[device.uuid]) {
    delete deviceMap[device.uuid];
  }

  if (!isWebClient) {
    communicator.send('DEVICE_UPDATED', device);
  }

  const now = Date.now();

  clearTimeout(notifyTimeout);

  if (now - lastSendMessage > BUFFER) {
    devices = DeviceList({ ...deviceMap, ...swiftrayDevices });
    sendFoundDevices();
    lastSendMessage = now;
  } else {
    notifyTimeout = setTimeout(() => {
      devices = DeviceList({ ...deviceMap, ...swiftrayDevices });
      sendFoundDevices();
      lastSendMessage = now;
    }, BUFFER);
  }
};

const startIntervals = () => {
  setInterval(() => {
    const now = Date.now();

    Object.keys(deviceMap).forEach((uuid) => {
      if (deviceMap[uuid]?.lastAlive && now - deviceMap[uuid].lastAlive > CLEAR_DEVICES_INTERVAL) {
        delete deviceMap[uuid];
      }
    });
    Object.keys(swiftrayDevices).forEach((uuid) => {
      if (swiftrayDevices[uuid]?.lastAlive && now - swiftrayDevices[uuid].lastAlive > CLEAR_DEVICES_INTERVAL) {
        delete swiftrayDevices[uuid];
      }
    });
    devices = DeviceList({ ...deviceMap, ...swiftrayDevices });
  }, CLEAR_DEVICES_INTERVAL);

  setInterval(() => {
    if (Date.now() - lastSendMessage > BUFFER) {
      sendFoundDevices();
      lastSendMessage = Date.now();
    }
  }, SEND_DEVICES_INTERVAL);

  const updateDeviceFromSwiftray = async () => {
    const res = await swiftrayClient.listDevices();

    if (!res.devices) return;

    if (!isWebClient && res.devices.length === 0) {
      Object.keys(swiftrayDevices).forEach((uuid) => {
        swiftrayDevices[uuid].alive = false;
        communicator.send('DEVICE_UPDATED', swiftrayDevices[uuid]);
      });
    }

    swiftrayDevices = res.devices.reduce<Record<string, IDeviceInfo>>((acc, device) => {
      device.lastAlive = Date.now();
      device.alive = true;
      acc[device.uuid] = device;

      if (!isWebClient) {
        communicator.send('DEVICE_UPDATED', device);
      }

      return acc;
    }, {});
    devices = DeviceList({ ...deviceMap, ...swiftrayDevices });
    sendFoundDevices();
  };

  setInterval(updateDeviceFromSwiftray, 5000);
};

startIntervals();

ws.setOnMessage(onMessage);

const poke = (targetIP: string) => {
  if (!targetIP) {
    return;
  }

  ws?.send(JSON.stringify({ cmd: 'poke', ipaddr: targetIP }));
};
const pokeTcp = (targetIP: string) => {
  if (!targetIP) {
    return;
  }

  ws?.send(JSON.stringify({ cmd: 'poketcp', ipaddr: targetIP }));
};
const testTcp = (targetIP: string) => {
  if (!targetIP) {
    return;
  }

  ws?.send(JSON.stringify({ cmd: 'testtcp', ipaddr: targetIP }));
};

const initPokeIps = () => {
  const pokeIPAddr: string = storage.get('poke-ip-addr') ?? '192.168.1.1';
  let res = pokeIPAddr.split(/[,;] ?/);

  if (res[0] === '' && res.length === 1) {
    storage.set('poke-ip-addr', '192.168.1.1');
    res = ['192.168.1.1'];
  } else {
    res = res.filter((ip) => ip !== '');
    storage.set('poke-ip-addr', res.join(', '));
  }

  return res;
};
const pokeIPs = initPokeIps();
const setupPokeTcpInterval = () => {
  let i = 0;

  setInterval(() => {
    pokeTcp(pokeIPs[i]);
    i = i + 1 < pokeIPs.length ? i + 1 : 0;
  }, 1000);
};

setupPokeTcpInterval();

const Discover = (id: string, getDevices: (devices: IDeviceInfo[]) => void) => {
  // console.log('Register Discover', id, devices);
  const index = idList.indexOf(id);

  if (idList.length === 0 || index === -1) {
    idList.push(id);
    dispatchers.push({ id, sender: getDevices });
  } else {
    dispatchers[index] = { id, sender: getDevices };
  }

  // force callback always executed after return
  setTimeout(() => {
    if (devices.length > 0) {
      getDevices(devices);
    }
  }, 0);

  return {
    connection: ws,
    countDevices() {
      return Object.keys(deviceMap).length;
    },
    poke, // UDP poke
    pokeTcp, // Add to tcp poke list
    removeListener(listenerId: string) {
      const listenerIndex = idList.indexOf(listenerId);

      idList.splice(listenerIndex, 1);
      dispatchers.splice(listenerIndex, 1);
    },
    testTcp, // Test tcp poke
  };
};

const initSmartUpnp = async () => {
  try {
    const res = await network.dnsLookUpAll('raspberrypi.local');

    res.forEach((ipAddress) => {
      if (ipAddress.family === 4 && !pokeIPs.includes(ipAddress.address)) {
        console.log(`Add ${ipAddress.address} to Poke ips`);
        pokeIPs.push(ipAddress.address);
      }
    });
  } catch (e) {
    if (e instanceof Error && e.toString().includes('ENOTFOUND')) {
      console.log('raspberrypi.local not found by DNS server.');
    } else {
      console.log(`Error when dns looking up raspberrypi:\n${e}`);
    }
  }
  // TODO: Fix this init...  no id and getPrinters?
  SmartUpnp.init(Discover('smart-upnp', () => {}));
  for (let i = 0; i < pokeIPs.length; i += 1) {
    SmartUpnp.startPoke(pokeIPs[i]);
  }
};

initSmartUpnp();

export const checkConnection = (): boolean => ws?.currentState === WebSocket.OPEN;

export const getLatestDeviceInfo = (uuid = ''): IDeviceInfo | null => deviceMap[uuid] ?? swiftrayDevices[uuid] ?? null;

export default Discover;
