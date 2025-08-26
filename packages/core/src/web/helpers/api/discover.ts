/**
 * API discover
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-discover
 */
import { funnel } from 'remeda';

import { TabEvents } from '@core/app/constants/tabConstants';
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

export const SEND_DEVICES_INTERVAL = 5000;

const CLEAR_DEVICES_INTERVAL = 15000;
const isWebClient = isWeb();

type PokeOptions = {
  /** Test tcp only try once, if didn't find device at target ip, won't do anything */
  isTesting?: boolean;
  /** Test ip exist with tcp, this can find device under some network environment */
  withTcp?: boolean;
};

export class BaseDiscoverManager {
  private static instance: BaseDiscoverManager;

  protected discoverLogger = Logger('discover');
  protected isWebClient = isWebClient;
  protected devices: IDeviceInfo[] = [];
  protected listeners: Record<string, (devices: IDeviceInfo[]) => void> = {};
  protected deviceMap: Record<string, IDeviceInfo> = {};
  protected swiftrayDevices: Record<string, IDeviceInfo> = {};
  protected initialized = false;

  public init(): void {
    if (this.initialized) return;

    this.startIntervals();
    this.initialized = true;
  }

  protected startIntervals(): void {
    setInterval(() => {
      const now = Date.now();

      Object.keys(this.deviceMap).forEach((uuid) => {
        if (this.deviceMap[uuid]?.lastAlive && now - this.deviceMap[uuid].lastAlive > CLEAR_DEVICES_INTERVAL) {
          delete this.deviceMap[uuid];
        }
      });
      Object.keys(this.swiftrayDevices).forEach((uuid) => {
        if (
          this.swiftrayDevices[uuid]?.lastAlive &&
          now - this.swiftrayDevices[uuid].lastAlive > CLEAR_DEVICES_INTERVAL
        ) {
          delete this.swiftrayDevices[uuid];
        }
      });
      this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
    }, CLEAR_DEVICES_INTERVAL);

    setInterval(() => {
      this.sendFoundDevices();
    }, SEND_DEVICES_INTERVAL);
  }

  static getInstance<T extends typeof BaseDiscoverManager>(this: T): InstanceType<T> {
    if (!this.instance) {
      this.instance = new this();
    }

    return this.instance as InstanceType<T>;
  }

  protected sendFoundDevices = funnel(
    () => {
      this.discoverLogger.clear();
      this.discoverLogger.append(this.deviceMap);

      Object.values(this.listeners).forEach((listener) => {
        listener(this.devices);
      });
      communicator.send(TabEvents.UpdateDevices, { deviceMap: this.deviceMap, swiftrayDevices: this.swiftrayDevices });
    },
    { minGapMs: 100, triggerAt: 'both' },
  ).call;

  public register(id: string, getDevices: (devices: IDeviceInfo[]) => void): () => void {
    console.log('register discover listener', id);
    this.listeners[id] = getDevices;

    setTimeout(() => {
      if (this.devices.length > 0) {
        getDevices(this.devices);
      }
    }, 0);

    // Return simple unregister function
    return () => this.unregister(id);
  }

  public unregister(id: string): void {
    delete this.listeners[id];
  }

  public poke = (_targetIp: string, _options?: PokeOptions): void => {};

  public countDevices(): number {
    return Object.keys(this.deviceMap).length;
  }

  public getLatestDeviceInfo(uuid = ''): IDeviceInfo | null {
    return this.deviceMap[uuid] ?? this.swiftrayDevices[uuid] ?? null;
  }

  public checkConnection = (): boolean => this.devices.length > 0;
}

export class MasterDiscoverManager extends BaseDiscoverManager {
  private ws: any;
  private pokeIPs: string[] = [];

  constructor() {
    super();
    this.ws = Websocket({ method: 'discover' });
    this.ws.setOnMessage(this.onMessage);
    this.pokeIPs = this.initPokeIps();
  }

  public init(): void {
    if (this.initialized) return;

    this.startIntervals();
    this.setupPokeTcpInterval();
    this.initSmartUpnp();
    this.initialized = true;
    communicator.on(TabEvents.PokeIP, (_: any, targetIp: string, options: PokeOptions = {}) =>
      this.poke(targetIp, options),
    );
  }

  private updatePokeIPAddr(device: IDeviceInfo): void {
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
  }

  private onMessage = (device: IDeviceInfo): void => {
    if (device.alive) {
      this.updatePokeIPAddr(device);

      device.lastAlive = Date.now();
      this.deviceMap[device.uuid] = device;
      sentryHelper.sendDeviceInfo(device);
    } else if (this.deviceMap[device.uuid]) {
      delete this.deviceMap[device.uuid];
    }

    if (!this.isWebClient) {
      communicator.send('DEVICE_UPDATED', device);
    }

    this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
    this.sendFoundDevices();
  };

  protected startIntervals(): void {
    super.startIntervals();

    const updateDeviceFromSwiftray = async () => {
      const res = await swiftrayClient.listDevices();

      if (!res.devices) return;

      if (!this.isWebClient && res.devices.length === 0) {
        Object.keys(this.swiftrayDevices).forEach((uuid) => {
          this.swiftrayDevices[uuid].alive = false;
          communicator.send('DEVICE_UPDATED', this.swiftrayDevices[uuid]);
        });
      }

      this.swiftrayDevices = res.devices.reduce<Record<string, IDeviceInfo>>((acc, device) => {
        device.lastAlive = Date.now();
        device.alive = true;
        acc[device.uuid] = device;

        if (!this.isWebClient) {
          communicator.send('DEVICE_UPDATED', device);
        }

        return acc;
      }, {});
      this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
      this.sendFoundDevices();
    };

    setInterval(updateDeviceFromSwiftray, 5000);
  }

  private initPokeIps(): string[] {
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
  }

  private setupPokeTcpInterval(): void {
    let i = 0;

    setInterval(() => {
      this.poke(this.pokeIPs[i]);
      i = i + 1 < this.pokeIPs.length ? i + 1 : 0;
    }, 1000);
  }

  private async initSmartUpnp(): Promise<void> {
    try {
      const res = await network.dnsLookUpAll('raspberrypi.local');

      res.forEach((ipAddress) => {
        if (ipAddress.family === 4 && !this.pokeIPs.includes(ipAddress.address)) {
          console.log(`Add ${ipAddress.address} to Poke ips`);
          this.pokeIPs.push(ipAddress.address);
        }
      });
    } catch (e) {
      if (e instanceof Error && e.toString().includes('ENOTFOUND')) {
        console.log('raspberrypi.local not found by DNS server.');
      } else {
        console.log(`Error when dns looking up raspberrypi:\n${e}`);
      }
    }
    SmartUpnp.init(this);
    this.pokeIPs.forEach((ip) => SmartUpnp.startPoke(ip));
  }

  public poke = (targetIP: string, { isTesting = false, withTcp = true }: PokeOptions = {}): void => {
    if (!targetIP) return;

    this.ws?.send(JSON.stringify({ cmd: 'poke', ipaddr: targetIP }));

    if (withTcp) {
      this.ws?.send(JSON.stringify({ cmd: 'testtcp', ipaddr: targetIP }));

      if (!isTesting) this.ws?.send(JSON.stringify({ cmd: 'poketcp', ipaddr: targetIP }));
    }
  };

  public checkConnection = (): boolean => {
    return this.ws?.currentState === WebSocket.OPEN;
  };
}

export class SlaveDiscoverManager extends BaseDiscoverManager {
  constructor() {
    super();
  }

  public init(): void {
    if (this.initialized) return;

    this.initialized = true;
    communicator.on(
      TabEvents.UpdateDevices,
      (
        _: any,
        {
          deviceMap,
          swiftrayDevices,
        }: { deviceMap: Record<string, IDeviceInfo>; swiftrayDevices: Record<string, IDeviceInfo> },
      ) => {
        this.deviceMap = deviceMap;
        this.swiftrayDevices = swiftrayDevices;
        this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
        this.sendFoundDevices();
      },
    );
  }

  public poke = (targetIp: string, options: PokeOptions = {}): void => {
    communicator.send(TabEvents.PokeIP, targetIp, options);
  };
}

export let discoverManager = isWebClient ? MasterDiscoverManager.getInstance() : SlaveDiscoverManager.getInstance();

discoverManager.init();

export const setDiscoverMaster = () => {
  console.log('Set discover manager to Master');

  if (discoverManager instanceof MasterDiscoverManager) return;

  discoverManager = MasterDiscoverManager.getInstance();
  discoverManager.init();
};

export const checkConnection = (): boolean => discoverManager.checkConnection();
export const discoverRegister = (id: string, getDevices: (devices: IDeviceInfo[]) => void): (() => void) =>
  discoverManager.register(id, getDevices);
export const getLatestDeviceInfo = (uuid = ''): IDeviceInfo | null => discoverManager.getLatestDeviceInfo(uuid);
