import os from '@core/implementations/os';
import storage from '@core/implementations/storage';

import type { BaseDiscoverManager } from './api/discover';

const AUTO_POKE_INTERVAL = 3000;
const AUTO_DISCOVER = 1000;

type AutoPoke = {
  clock: NodeJS.Timeout;
  ip: string;
};

let discoverManager: BaseDiscoverManager;
let autoPokes: AutoPoke[] = [];
let guessIPs: string[] = [];
let solidIPs: string[] = [];

const self = {
  addSolidIP: function (ip: string) {
    if (solidIPs.includes(ip)) {
      return;
    }

    solidIPs.push(ip);
    for (var i in autoPokes) {
      if (autoPokes[i].ip == ip) {
        return;
      }
    }
    self.startPoke(ip);
  },

  getLocalAddresses: function () {
    var ifaces = os.networkInterfaces();
    const addresses: string[] = [];

    Object.keys(ifaces).forEach(function (ifname) {
      // eslint-disable-next-line ts/no-unused-vars
      var alias = 0;

      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (ifname.indexOf('vnic') == 0) {
          return;
        }

        addresses.push(iface.address);
      });
    });

    return addresses;
  },

  /**
   * Generates smart guess ip lists
   */
  guessFromIP: (targetIP: string) => {
    const ipv4Pattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})$/g;
    // if(ipv4Pattern.test(targetIP) === false) return false;
    const match = ipv4Pattern.exec(targetIP);

    if (!match) return;

    const localIndex = Number.parseInt(match[2]);

    for (let i = localIndex + 1; i < Math.min(localIndex + 20, 255); i++) {
      const gip = match[1] + '.' + i;

      if (guessIPs.includes(gip)) {
        continue;
      }

      guessIPs.push(gip);
    }
    for (let i = localIndex - 1; i > Math.max(0, localIndex - 20); i--) {
      const gip = match[1] + '.' + i;

      if (guessIPs.includes(gip)) {
        continue;
      }

      guessIPs.push(gip);
    }
    for (let i = 1; i < 255; i++) {
      const gip = match[1] + '.' + i;

      if (guessIPs.includes(gip)) {
        continue;
      }

      guessIPs.push(gip);
    }
  },

  init: (discover: BaseDiscoverManager) => {
    discoverManager = discover;

    if (storage.get('guessing_poke')) {
      setInterval(function () {
        if (discoverManager.countDevices() === 0) {
          self.pokeNext();
        }
      }, AUTO_DISCOVER);
    }

    //Start from self ip address
    var myIPAddresses = self.getLocalAddresses();

    myIPAddresses.forEach((x) => self.guessFromIP(x));
  },

  /**
   * Return if smart upnp has been initiated
   */
  isInitiated: (): boolean => {
    return Boolean(discoverManager);
  },

  pokeNext: function () {
    if (guessIPs.length == 0) {
      return;
    }

    const ip = guessIPs.shift();

    if (ip) {
      discoverManager.poke(ip, { isTesting: true });
    }
  },

  /**
   * Start auto poke for IP
   * @param {String} targetIP
   * @returns {Object} An auto-upnp-poke object
   */
  startPoke: (targetIP: string) => {
    var pokeIP = targetIP;

    if (!self.isInitiated()) {
      throw new Error("smart upnp hasn't been initiated");
    }

    if ('string' !== typeof pokeIP || pokeIP == '') {
      return;
    }

    const autoPoke = {
      clock: setInterval(function () {
        discoverManager.poke(pokeIP, { withTcp: false });
      }, AUTO_POKE_INTERVAL),
      ip: pokeIP,
    };

    autoPokes.push(autoPoke);

    return autoPoke;
  },

  stopPoke: (obj: AutoPoke) => {
    clearInterval(obj.clock);
  },
};

export default self;
