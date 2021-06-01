import dns from 'dns';
import ping from 'net-ping';
import SerialPort from 'serialport';

import { INetwork } from 'interfaces/INetwork';

export default {
  dnsLookUpAll(
    hostname: string,
    options?: {
      family?: number,
      hints?: number,
      verbatim?: boolean,
    },
  ): Promise<dns.LookupAddress[]> {
    return dns.promises.lookup(hostname, {
      ...options,
      all: true,
    });
  },
  createPingSession() {
    return ping.createSession();
  },
  listSerialPorts(): Promise<SerialPort.PortInfo[]> {
    return SerialPort.list();
  },
  createSerialPort(path: string, options?: {
    baudRate?: number;
    dataBits?: number;
    lock?: boolean;
  }, callback?: any): SerialPort {
    return new SerialPort(path, {
      ...options,
    } as SerialPort.OpenOptions, callback);
  },
} as INetwork;
