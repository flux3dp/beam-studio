import Modal from '../widgets/Modal'
import BeamboxPreference from '../actions/beambox/beambox-preference'
import keyCodeConstants from '../constants/keycode-constants'
import Discover from '../../helpers/api/discover'
import DeviceList from '../../helpers/device-list'
import DeviceMaster from '../../helpers/device-master'
import * as i18n from '../../helpers/i18n'
import Websocket from '../../helpers/websocket'

    const React = requireNode('react');;
    const classNames = requireNode('classnames');
    const dns = requireNode('dns');

    const lang = i18n.lang.initialize;
    const TIMEOUT = 20;
    const ipRex = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;

    class ConnectMachine extends React.Component{
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

                const queryString = location.hash.split('?')[1] || '';
                const urlParams = new URLSearchParams(queryString);

                this.isWired = urlParams.get('wired') === '1';

                this.discover = Discover('connect-machine-ip', (deviceList) => {
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
                    await DeviceMaster.select(device); // TODO: Handle connection error
                    await DeviceMaster.connectCamera(device);
                    const imgBlob = await DeviceMaster.takeOnePicture();
                    await DeviceMaster.disconnectCamera();
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
                            <div className={classNames('hint-circle', 'ip', {wired: this.isWired})}/>
                            <img className="touch-panel-icon" src={this.isWired ? "img/init-panel/network-panel-wired.png" : "img/init-panel/network-panel-wireless.png"} draggable="false"/>
                        </div>
                        <div className="text-container">
                            <div className="title">{lang.connect_machine_ip.enter_ip}</div>
                            <div className="contents tutorial">
                                <input
                                    ref='ipInput'
                                    className="ip-input"
                                    placeholder="192.168.0.1"
                                    type='text'
                                    onKeyDown={(e) => this.handleKeyDown(e)}
                                    defaultValue={this.state.rpiIp}
                                />
                                {this.renderTestInfos()}
                            </div>
                        </div>
                    </div>
                );
            }

            renderTestInfos = () => {
                const {machineIp, isIPValid, ipAvailability, firmwareVersion, cameraAvailability, ipTestCountDown} = this.state;
                if (machineIp !== null) {
                    let ipStatus = `${ipTestCountDown}s`;
                    let cameraStatus = '';
                    if (ipAvailability !== null) {
                        ipStatus = ipAvailability ? 'OK' : 'Fail';
                    }
                    if (!isIPValid) {
                        ipStatus = 'Invalid IP';
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
                const isIPValid = ipRex.test(ip);
                if (!isIPValid) {
                    this.setState({
                        machineIp: ip,
                        isIPValid
                    });
                    return;
                }
                this.setState({
                    machineIp: ip,
                    isIPValid,
                    ipAvailability: null,
                    firmwareVersion: null,
                    cameraAvailability: null,
                    device: null,
                    isTesting: true,
                    hadTested: false,
                    ipTestCountDown: TIMEOUT,
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
                }, 1000);
            }

            onFinish = () => {
                const { device, machineIp } = this.state;
                const modelMap = {
                    fbm1: 'fbm1',
                    fbb1b: 'fbb1b',
                    fbb1p: 'fbb1p',
                };
                const model = modelMap[device.model] || 'fbb1b';
                BeamboxPreference.write('model', model);
                BeamboxPreference.write('workarea', model);
                let addresses = localStorage.getItem('poke-ip-addr');
                let pokeIPs = (addresses ? addresses.split(/[,;] ?/) : []);
                if (!pokeIPs.includes(machineIp)) {
                    if (pokeIPs.length > 19) {
                        pokeIPs = pokeIPs.slice(pokeIPs.length - 19, pokeIPs.length);
                    }
                    pokeIPs.push(machineIp);
                    localStorage.setItem('poke-ip-addr', pokeIPs.join(','));
                }
                if (!localStorage.getItem('printer-is-ready')) {
                    localStorage.setItem('new-user', 'true');
                }
                localStorage.setItem('printer-is-ready', 'true');
                location.hash = '#studio/beambox';
                location.reload();
            }

            renderNextButton = () => {
                const {isTesting, hadTested, ipAvailability, cameraAvailability, device} = this.state;
                let onClick, label;
                let className = classNames('btn-page', 'next', 'primary');
                if (!isTesting && !hadTested) {
                    label = lang.next;
                    onClick = this.startTesting;
                } else if (isTesting) {
                    label = lang.next;
                    onClick = () => {};
                    className = classNames('btn-page', 'next', 'primary', 'disabled');
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
                        {label}
                    </div>
                );
            }

            renderButtons = () => {
                return (
                    <div className="btn-page-container">
                        <div className="btn-page" onClick={() => {history.back()}} >
                            {lang.back}
                        </div>
                        {this.renderNextButton()}
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
                        {this.renderButtons()}
                        {innerContent}
                    </div>
                );

                return (
                    <Modal className={wrapperClassName} content={content} />
                );
            }

        };
    export default () => ConnectMachine