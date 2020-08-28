/**
 * API discover
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-discover
 */
define([
    'helpers/websocket',
    'app/actions/initialize-machine',
    'helpers/api/config',
    'helpers/device-list',
    'helpers/logger',
    'helpers/smart-upnp',
    'helpers/api/cloud'
], function(
    Websocket,
    initializeMachine,
    Config,
    DeviceList,
    Logger,
    SmartUpnp,
    CloudApi) {
    'use strict';

    const dns = require('dns');
    const dnsPromise = dns.promises;
    var ws = ws || new Websocket({
            method: 'discover'
        }),
        discoverLogger = new Logger('discover'),
        printers = [],
        dispatchers = [],
        idList = [],
        _devices = {},
        existDefaultPrinter = initializeMachine.defaultPrinter.exist(),
        defaultPrinter = initializeMachine.defaultPrinter.get(),
        sendFoundPrinter = function() {
            discoverLogger.clear().append(_devices);

            dispatchers.forEach(function(dispatcher) {
                dispatcher.sender(_devices);
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

                let pokeIPAddr = localStorage.getItem('poke-ip-addr');

                if (pokeIPAddr && pokeIPAddr !== '') {
                    const pokeIPAddrArr = pokeIPAddr.split(/[,;] ?/);

                    if (pokeIPAddrArr.indexOf(device.ipaddr) === -1 && device.ipaddr !== 'raspberrypi.local') {
                        if (pokeIPAddrArr.length > 19) {
                            pokeIPAddr = pokeIPAddrArr.slice(pokeIPAddrArr.length - 19, pokeIPAddrArr.length);
                        }

                        localStorage.setItem('poke-ip-addr', `${pokeIPAddr}, ${device.ipaddr}`);
                    }
                } else {
                    localStorage.setItem('poke-ip-addr', device.ipaddr);
                }

                _devices[device.uuid] = device;

                //SmartUpnp.addSolidIP(device.ip);
            }
            else {
                if(typeof _devices[device.uuid] === 'undefined') {
                    delete _devices[device.uuid];
                }
            }

        //    if (existDefaultPrinter && device.uuid === defaultPrinter.uuid ) {
        //        initializeMachine.defaultPrinter.set(device);
        //    }

            clearTimeout(timer);
            timer = setTimeout(() => {
                printers = DeviceList(_devices);
                sendFoundPrinter();
            }, BUFFER);
        },
        poke = function(targetIP) {
            if (targetIP == null) { return; };
            printers = [];
            _devices = {};
            ws.send(JSON.stringify({ 'cmd' : 'poke', 'ipaddr': targetIP }));
        },
        pokeTcp = function(targetIP) {
            if (targetIP == null) { return; };
            printers = [];
            _devices = {};
            ws.send(JSON.stringify({ 'cmd' : 'poketcp', 'ipaddr': targetIP }));
        },
        testTcp = function(targetIP) {
            if (targetIP == null) { return; };
            ws.send(JSON.stringify({ 'cmd' : 'testtcp', 'ipaddr': targetIP }));
        },
        BUFFER = 100,
        pokeIPAddr = localStorage.getItem('poke-ip-addr'),
        pokeIPs = (pokeIPAddr ? pokeIPAddr.split(/[,;] ?/) : ['']),
        timer;

    if ('' === pokeIPs[0]) {
        Config().write('poke-ip-addr', '192.168.1.1');
        pokeIPs = ['192.168.1.1'];
    }

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

        SmartUpnp.init(self());
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

    var self = function(id, getPrinters) {
        getPrinters = getPrinters || function() {};

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
            poke: (targetIP) => {
                poke(targetIP);
                pokeTcp(targetIP);
            },
            testTcp: testTcp,
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

    return self;
});
