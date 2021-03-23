/**
 * API discover
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-discover
 */
import Websocket from 'helpers/websocket';
import DeviceList from 'helpers/device-list';
import storage from 'helpers/storage-helper';
import Logger from 'helpers/logger';
import SmartUpnp from 'helpers/smart-upnp';
import CloudApi from './cloud';
import { IDeviceInfo } from 'interfaces/IDevice';

const dns = requireNode('dns');

const dnsPromise = dns.promises;
let lastSendMessage = 0;
let BUFFER = 100;
let timer;
const SEND_DEVICES_INTERVAL = 5000;
var ws = ws || Websocket({
        method: 'discover'
    }),
    discoverLogger = Logger('discover'),
    printers = [],
    dispatchers = [],
    idList = [],
    _devices = {},
    sendFoundPrinter = function() {
        discoverLogger.clear().append(_devices);

        dispatchers.forEach(function(dispatcher) {
            dispatcher.sender(printers);
        });
    },
    findIndex = function(base, target) {
        return base.uuid === target.uuid;
    },
    onMessage = function(device) {
        if (device.alive) {
            if (device.source === 'h2h') {
                device.h2h_uuid = device.uuid;
                device.uuid = device.addr.toString();
            }

            let pokeIPAddr = storage.get('poke-ip-addr');

            if (pokeIPAddr && pokeIPAddr !== '') {
                const pokeIPAddrArr = pokeIPAddr.split(/[,;] ?/);

                if (device.ipaddr && pokeIPAddrArr.indexOf(device.ipaddr) === -1 && device.ipaddr !== 'raspberrypi.local') {
                    if (pokeIPAddrArr.length > 19) {
                        pokeIPAddr = pokeIPAddrArr.slice(pokeIPAddrArr.length - 19, pokeIPAddrArr.length).join();
                    }

                    storage.set('poke-ip-addr', `${pokeIPAddr}, ${device.ipaddr}`);
                }
            } else {
                storage.set('poke-ip-addr', device.ipaddr);
            }

            _devices[device.uuid] = device;

            //SmartUpnp.addSolidIP(device.ip);
        }
        else {
            if(typeof _devices[device.uuid] === 'undefined') {
                delete _devices[device.uuid];
            }
        }

        clearTimeout(timer);
        if (Date.now() - lastSendMessage > BUFFER) {
            printers = DeviceList(_devices);
            sendFoundPrinter();
            lastSendMessage = Date.now();
        } else {
            timer = setTimeout(() => {
                printers = DeviceList(_devices);
                sendFoundPrinter();
                lastSendMessage = Date.now();
            }, BUFFER);
        }  
    },
    poke = function(targetIP: string) {
        if (targetIP == null) { return; };
        printers = [];
        _devices = {};
        ws.send(JSON.stringify({ 'cmd' : 'poke', 'ipaddr': targetIP }));
    },
    pokeTcp = function(targetIP: string) {
        if (targetIP == null) { return; };
        printers = [];
        ws.send(JSON.stringify({ 'cmd' : 'poketcp', 'ipaddr': targetIP }));
    },
    testTcp = function(targetIP: string) {
        if (targetIP == null) { return; };
        ws.send(JSON.stringify({ 'cmd' : 'testtcp', 'ipaddr': targetIP }));
    },
    pokeIPAddr = storage.get('poke-ip-addr'),
    pokeIPs = (pokeIPAddr ? pokeIPAddr.split(/[,;] ?/) : ['']);

if ('' === pokeIPs[0]) {
    storage.set('poke-ip-addr', '192.168.1.1');
    pokeIPs = ['192.168.1.1'];
}

const sendDevicesInterval = setInterval(() => {
    if (Date.now() - lastSendMessage > BUFFER) {
        sendFoundPrinter();
        lastSendMessage = Date.now();
    }
}, SEND_DEVICES_INTERVAL);

ws.onMessage(onMessage);

const initSmartUpnp = async () => {
    try {
        const lookupOptions = {
            all: true
        };
        const res = await dnsPromise.lookup('raspberrypi.local', lookupOptions);
        res.forEach((ipAddress) => {
            if (ipAddress.family === 4 && !pokeIPs.includes(ipAddress.address)) {
                console.log(`Add ${ipAddress.address} to Poke ips`);
                pokeIPs.push(ipAddress.address);
            }
        });
    } catch (e) {
        if (e.toString().includes('ENOTFOUND')) {
            console.log('raspberrypi.local not found by DNS server.');
        } else {
            console.log(`Error when dns looking up raspberrypi:\n${e}`);
        }
    }
    // TODO: Fix this init...  no id and getPrinters?
    SmartUpnp.init(Discover(
        'smart-upnp',
        () => {}
    ));
    for(var i in pokeIPs){
        SmartUpnp.startPoke(pokeIPs[i]);
    }
}
initSmartUpnp();

const startTcpPoke = () => {
    let i = 0;
    const tcpPokeInterval = setInterval(() => {
        pokeTcp(pokeIPs[i]);
        i = i + 1 < pokeIPs.length ? i + 1 : 0;
    }, 1000); 
}
startTcpPoke();

CloudApi.getDevices().then(resp => {
    if (resp.ok) {
        resp.json().then(content => {
            if (content.devices) {
                content.devices.map(device => {
                    console.log(device.alias, device.ip_addr);
                    if (device.ip_addr) {
                        // console.log("Start poking cloud device IP:", device.ip_addr);
                        SmartUpnp.startPoke(device.ip_addr.trim().replace(/\u0000/g, ''));
                    }
                });
            }
        });
    }
});
const Discover = function(id: string, getPrinters: (printers: IDeviceInfo[]) => void) {
    console.log('Register Discover', id, printers);
    var index = idList.indexOf(id);

    if (0 === idList.length || -1 === index) {
        idList.push(id);
        dispatchers.push({
            id: id,
            sender: getPrinters
        });
    }
    else {
        dispatchers[index] = {
            id: id,
            sender: getPrinters
        };
    }

    // force callback always executed after return
    setTimeout(function() {
        if (0 < printers.length) {
            getPrinters(printers);
        }
    }, 0);

    return {
        connection: ws,
        poke: poke,         //UDP poke
        pokeTcp: pokeTcp,   //Add to tcp poke list
        testTcp: testTcp,   // Test tcp poke
        countDevices: function(){
            let count = 0;
            for(var i in _devices) count++;
            return count;
        },
        removeListener: function(_id) {
            var _index = idList.indexOf(_id);
            idList.splice(_index, 1);
            dispatchers.splice(_index, 1);
        },
        sendAggressive: function() {
            ws.send('aggressive');
        },
        getLatestPrinter: function(printer) {
            return _devices[printer.uuid];
        }
    };
};

export default Discover
