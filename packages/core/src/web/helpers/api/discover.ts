/**
 * API discover
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-discover
 */
import { funnel } from 'remeda';

import { MiscEvents, TabEvents } from '@core/app/constants/ipcEvents';
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

export class DiscoverManager {
  private static instance: DiscoverManager;

  protected discoverLogger = Logger('discover');
  protected isWebClient = isWebClient;
  protected devices: IDeviceInfo[] = [];
  protected listeners: Record<string, (devices: IDeviceInfo[]) => void> = {};
  protected deviceMap: Record<string, IDeviceInfo> = {};
  protected swiftrayDevices: Record<string, IDeviceInfo> = {};
  protected initialized = false;
  private isMaster = false;
  private ws: any;
  private pokeIPs: string[] = [];
  private intervals: NodeJS.Timeout[] = [];

  static getInstance<T extends typeof DiscoverManager>(this: T): InstanceType<T> {
    if (!this.instance) {
      this.instance = new this();
    }

    return this.instance as InstanceType<T>;
  }

  constructor() {
    this.isMaster = isWebClient;
  }

  public init(): void {
    if (this.initialized) return;

    if (this.isMaster) {
      this.setupMaster();
      this.initialized = true;
    } else {
      this.setupSlave();
      this.initialized = true;
    }
  }

  // ---------- Master & Slave part ----------
  private setupMaster(): void {
    this.ws = Websocket({ method: 'discover' });
    this.ws.setOnMessage(this.onMessage);
    this.pokeIPs = this.initPokeIps();

    this.startIntervals();
    this.setupPokeTcpInterval();
    this.initSmartUpnp();
    communicator.on(TabEvents.PokeIP, this.masterOnPokeIP);
  }

  private clearMaster(): void {
    this.ws?.close();
    this.ws = null;

    SmartUpnp.clear();
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
    communicator.off(TabEvents.PokeIP, this.masterOnPokeIP);
  }

  private setupSlave(): void {
    communicator.on(TabEvents.UpdateDevices, this.slaveOnDevicesUpdated);
  }

  private clearSlave(): void {
    communicator.off(TabEvents.UpdateDevices, this.slaveOnDevicesUpdated);
  }

  private slaveOnDevicesUpdated = (
    _: any,
    data: { deviceMap: Record<string, IDeviceInfo>; swiftrayDevices: Record<string, IDeviceInfo> },
  ): void => {
    if (this.isMaster) return;

    this.deviceMap = data.deviceMap;
    this.swiftrayDevices = data.swiftrayDevices;
    this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
    this.sendFoundDevices();
  };

  private masterOnPokeIP = (_: any, targetIp: string, options: PokeOptions = {}): void => {
    if (!this.isMaster) return;

    this.poke(targetIp, options);
  };

  public setMaster(isMaster: boolean): void {
    if (this.isMaster === isMaster) return;

    this.isMaster ? this.clearMaster() : this.clearSlave();
    this.isMaster = isMaster;
    this.isMaster ? this.setupMaster() : this.setupSlave();
  }

  // ---------- Master discover part ----------
  private sendFoundDevices = funnel(
    () => {
      this.discoverLogger.clear();
      this.discoverLogger.append(this.deviceMap);

      Object.values(this.listeners).forEach((listener) => {
        listener(this.devices);
      });

      if (this.isMaster) {
        communicator.send(TabEvents.UpdateDevices, {
          deviceMap: this.deviceMap,
          swiftrayDevices: this.swiftrayDevices,
        });
      }
    },
    { minGapMs: 100, triggerAt: 'both' },
  ).call;

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
      communicator.send(MiscEvents.DeviceUpdated, device);
    }

    this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
    this.sendFoundDevices();
  };

  protected startIntervals(): void {
    const updateDeviceFromSwiftray = async () => {
      const res = await swiftrayClient.listDevices();

      if (!res.devices) return;

      if (!this.isWebClient && res.devices.length === 0) {
        Object.keys(this.swiftrayDevices).forEach((uuid) => {
          this.swiftrayDevices[uuid].alive = false;
          communicator.send(MiscEvents.DeviceUpdated, this.swiftrayDevices[uuid]);
        });
      }

      this.swiftrayDevices = res.devices.reduce<Record<string, IDeviceInfo>>((acc, device) => {
        device.lastAlive = Date.now();
        device.alive = true;
        acc[device.uuid] = device;

        if (!this.isWebClient) {
          communicator.send(MiscEvents.DeviceUpdated, device);
        }

        return acc;
      }, {});
      this.devices = DeviceList({ ...this.deviceMap, ...this.swiftrayDevices });
      this.sendFoundDevices();
    };

    this.intervals.push(
      // clear old devices
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
      }, CLEAR_DEVICES_INTERVAL),
      // send found devices
      setInterval(() => {
        this.sendFoundDevices();
      }, SEND_DEVICES_INTERVAL),
      // update swiftray devices
      setInterval(updateDeviceFromSwiftray, 5000),
    );
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

    this.intervals.push(
      setInterval(() => {
        this.poke(this.pokeIPs[i]);
        i = i + 1 < this.pokeIPs.length ? i + 1 : 0;
      }, 1000),
    );
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

  // ---------- Public API part ----------
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

  public poke = (targetIP: string, options: PokeOptions = {}): void => {
    if (!targetIP) return;

    if (this.isMaster) {
      const { isTesting = false, withTcp = true } = options;

      this.ws?.send(JSON.stringify({ cmd: 'poke', ipaddr: targetIP }));

      if (withTcp) {
        this.ws?.send(JSON.stringify({ cmd: 'testtcp', ipaddr: targetIP }));

        if (!isTesting) this.ws?.send(JSON.stringify({ cmd: 'poketcp', ipaddr: targetIP }));
      }
    } else {
      communicator.send(TabEvents.PokeIP, targetIP, options);
    }
  };

  public checkConnection = (): boolean => {
    if (this.isMaster) {
      return this.ws?.currentState === WebSocket.OPEN;
    }

    return this.devices.length > 0;
  };

  public countDevices(): number {
    return Object.keys(this.deviceMap).length;
  }

  public getLatestDeviceInfo(uuid = ''): IDeviceInfo | null {
    return this.deviceMap[uuid] ?? this.swiftrayDevices[uuid] ?? null;
  }
}

export const discoverManager = DiscoverManager.getInstance();

discoverManager.init();
