define([
    'jsx!widgets/Modal',
    'app/actions/beambox/beambox-preference',
    'app/constants/keycode-constants',
    'helpers/api/discover',
    'helpers/device-list',
    'helpers/device-master',
    'helpers/i18n',
    'helpers/websocket',
], function (
    Modal,
    BeamboxPreference,
    keyCodeConstants,
    Discover,
    DeviceList,
    DeviceMaster,
    i18n,
    Websocket
) {
    'use strict';
    const React = require('react');
    const classNames = require('classnames');

    const lang = i18n.lang.initialize;
    const TIMEOUT = 20;

    return function () {
        return class ConnectMachine extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    rpiIp: null,
                    machineIp: null,
                    ipAvailability: null,
                    firmwareVersion: null,
                    cameraAvailability: null,
                    device: null,
                    ipTestCountDown: TIMEOUT,
                    isTesting: false,
                    hadTested: false
                };

                this.discover = Discover('connect-machine-ip', (machines) => {
                    const deviceList = DeviceList(machines);
                    const {ipAvailability, machineIp} = this.state;
                    if (ipAvailability === null && machineIp !== null) {
                        for (let i=0; i < deviceList.length; i++) {
                            let device = deviceList[i];
                            if (device.ipaddr === machineIp) {
                                clearInterval(this.testCountDown);
                                this.setState({
                                    ipAvailability: true,
                                    firmwareVersion: device.version,
                                    device: device,
                                });
                            }
                        }
                    }
                });
            }

            componentDidMount() {
                this.checkRpiIp();
            }

            componentDidUpdate() {
                const {ipAvailability, cameraAvailability} = this.state;
                if (ipAvailability && (cameraAvailability === null)) {
                    this.testCamera();
                }
            }

            componentWillUnmount() {
                this.discover.removeListener('connect-machine-ip');
            }

            checkRpiIp = async () => {
                const dns = require('dns');
                const dnsPromise = dns.promises;
                try {
                    const lookupOptions = {
                        all: true
                    };
                    const res = await dnsPromise.lookup('raspberrypi.local', lookupOptions);
                    res.forEach((ipAddress) => {
                        if (ipAddress.family === 4) {
                            this.setState({rpiIp: ipAddress.address});
                        }
                    });
                } catch (e) {
                    if (e.toString().includes('ENOTFOUND')) {
                        console.log('DNS server not found raspberrypi.local');
                    } else {
                        console.log(`Error when dns looking up raspberrypi:\n${e}`);
                    }
                }
            }

            testCamera = async () => {
                const {device} = this.state;
                try {
                    await DeviceMaster.select(device);
                    await DeviceMaster.connectCamera(device);
                    const imgBlob = await DeviceMaster.takeOnePicture();
                    await DeviceMaster.disconnectCamera(device);
                    if (imgBlob.size >= 30) {
                        this.setState({
                            cameraAvailability: true,
                            isTesting: false,
                            hadTested: true
                        });
                    } else {
                        throw('Blob size too small, something wrong with camera');
                    }
                } catch (e) {
                    console.log(e);
                    this.setState({
                        cameraAvailability: false,
                        isTesting: false,
                        hadTested: true
                    });
                }
            }

            renderContent = () => {
                return (
                    <div className="connection-machine-ip">
                        <div className="image-container">
                            <div className="hint-circle ip"/>
                            <img className="touch-panel-icon" src="img/init-panel/network-panel-en.png" draggable="false"/>
                        </div>
                        <div className="text-container">
                            <div className="title">{lang.connect_machine_ip.enter_ip}</div>
                            <div className="contents tutorial">
                                <input
                                    ref='ipInput'
                                    className="ip-input"
                                    type='text'
                                    onKeyDown={(e) => this.handleKeyDown(e)}
                                    defaultValue={this.state.rpiIp}
                                />
                                {this.renderTestInfos()}
                            </div>
                            {this.renderNextButton()}
                        </div>
                    </div>
                );
            }

            renderTestInfos = () => {
                const {machineIp, ipAvailability, firmwareVersion, cameraAvailability, ipTestCountDown} = this.state;
                if (machineIp !== null) {
                    let ipStatus = `${ipTestCountDown}s`;
                    let cameraStatus = '';
                    if (ipAvailability !== null) {
                        ipStatus = ipAvailability ? 'OK' : 'Fail';
                    }
                    if (cameraAvailability !== null) {
                        cameraStatus = cameraAvailability ? 'OK' : 'Fail';
                    }
                    return (
                        <div className="test-infos">
                            <div className="test-info">{`${lang.connect_machine_ip.check_ip}... ${ipStatus}`}</div>
                            {ipAvailability ? <div className="test-info">{`${lang.connect_machine_ip.check_firmware}... ${firmwareVersion}`}</div> : null}
                            {ipAvailability ? <div className="test-info">{`${lang.connect_machine_ip.check_camera}... ${cameraStatus}`}</div> : null}
                        </div>
                    )
                } else {
                    return <div className="test-infos"/>;
                }
            }

            handleKeyDown = (e) => {
                if (e.keyCode === keyCodeConstants.KEY_RETURN) {
                    this.startTesting();
                }
            }

            startTesting = () => {
                const ip = this.refs.ipInput.value;
                this.setState({
                    machineIp: ip,
                    ipAvailability: null,
                    firmwareVersion: null,
                    cameraAvailability: null,
                    device: null,
                    isTesting: true,
                    hadTested: false,
                    ipTestCountDown: TIMEOUT
                });
                this.discover.poke(ip);
                clearInterval(this.testCountDown);
                this.testCountDown = setInterval(() => {
                    if (this.state.isTesting && this.state.ipAvailability === null) {
                        if (this.state.ipTestCountDown > 1) {
                            this.setState({ipTestCountDown: this.state.ipTestCountDown - 1});
                        } else {
                            this.setState({
                                ipAvailability: false,
                                isTesting: false,
                                hadTested: true
                            });
                            clearInterval(this.testCountDown);
                        }
                    }
                }, 1000)
            }

            onFinish = () => {
                const { machineIp } = this.state;
                let pokeIPs = localStorage.getItem('poke-ip-addr');
                pokeIPs = (pokeIPs ? pokeIPs.split(/[,;] ?/) : []);
                if (!pokeIPs.includes(machineIp)) {
                    if (pokeIPs.length > 19) {
                        pokeIPs = pokeIPs.slice(pokeIPs.length - 19, pokeIPs.length);
                    }
                    pokeIPs.push(machineIp);
                    localStorage.setItem('poke-ip-addr', pokeIPs.join(','));
                }
                location.hash = '#studio/beambox';
                location.reload();
            }

            renderBackButton = () => {
                return (
                    <div className="btn-page back" onClick={() => {history.back()}} >
                        <div className="left-arrow"/>
                        {lang.back}
                    </div>
                );
            }

            renderNextButton = () => {
                const {isTesting, hadTested, ipAvailability, cameraAvailability} = this.state;
                let onClick, label;
                let className = classNames('btn-page', 'next');
                if (!isTesting && !hadTested) {
                    label = lang.next;
                    onClick = this.startTesting;
                } else if (isTesting) {
                    label = lang.next;
                    onClick = () => {};
                    className = classNames('btn-page', 'next', 'disabled');
                } else if (hadTested) {
                    if (ipAvailability) {
                        label = lang.connect_machine_ip.finish_setting;
                        onClick = this.onFinish;
                    } else {
                        label = lang.retry;
                        onClick = this.startTesting;
                    }
                }
                return (
                    <div className={className} onClick={() => {onClick()}} >
                        <div className="right-arrow"/>
                        {label}
                    </div>
                );
            }

            render() {
                const wrapperClassName = {
                    'initialization': true
                };
                const innerContent = this.renderContent();
                const content = (
                    <div className="connect-machine">
                        <div className="top-bar"/>
                        {this.renderBackButton()}
                        {innerContent}
                    </div>
                );

                return (
                    <Modal className={wrapperClassName} content={content} />
                );
            }

        };
    };
});
