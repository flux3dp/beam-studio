import Modal from '../../widgets/Modal';
import Alert from '../../actions/alert-caller';
import AlertConstants from '../../constants/alert-constants';
import Progress from '../../actions/progress-caller';
import KeycodeConstants from '../../constants/keycode-constants';
import Discover from '../../../helpers/api/discover';
import * as i18n from '../../../helpers/i18n';

const React = requireNode('react');
const ping = requireNode('net-ping');
const LANG = i18n.lang.beambox.network_testing_panel;
const { shell } = requireNode('electron').remote


class NetworkTestingPanel extends React.Component {
    constructor(props) {
        super(props);
        let ip = '';
        if (props.ip) {
            ip = props.ip;
            this.defaultValue = ip;
        }
        this.TEST_TIME = 30000;
        let local_ips = [];
        const os = requireNode('os');
        let ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function (ifname) {
            let alias = 0;
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
                }
                if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
                } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                }
                ++alias;
                local_ips.push(iface.address);
            });
        });
        this.discoveredDevices = [];
        this.discover = Discover('network-testing-panel', (devices) => {
            this.discoveredDevices = devices;
        });
        this.state = {
            ip: ip,
            localIp: local_ips
        };
    }

    componentWillUnmount() {
        this.discover.removeListener('network-testing-panel');
    }

    _onStart() {
        if (!this.state.ip) {
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: LANG.empty_ip
            });
            return;
        } else if (this.state.ip.trim().startsWith('169.254')) {
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: LANG.ip_startswith_169
            });
            return;
        }
        this.discover.poke(this.state.ip);
        this.discover.pokeTcp(this.state.ip);
        this.discover.testTcp(this.state.ip);
        this._createSession();
        this.stopFlag = false;
        this.pingCounts = 0;
        this.successedPing = 0;
        this.totalRRT = 0;
        this.startTime = new Date();
        const raiseFlag = window.setTimeout(() =>{
            this.stopFlag = true;
            }, this.TEST_TIME
        );
        Progress.openSteppingProgress({
            id: 'network-testing',
            message: `${LANG.testing} - 0%`,
        })
        this._pingTarget();
    }

    _createSession() {
        try {
            this.session = ping.createSession({
                retries: 0,
            });
            this.session.on('error', error => {
                console.log ("session error: " + error);
                this._createSession();
            });
        }
        catch (e) {
            let message = `${LANG.fail_to_start_network_test}\n${e}`;
            if (process.platform === 'linux') message += '\n' + LANG.linux_permission_hint;
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message,
            });
            throw e;
        }
    }

    _pingTarget() {
        this.pingCounts += 1;
        this.session.pingHost(this.state.ip, (error, target, sent, rcvd) => {
            const elapsedTime = (+new Date()) - this.startTime;
            const percentage =  parseInt('' + (100 * elapsedTime / this.TEST_TIME));
            Progress.update('network-testing', {
                percentage,
                message: `${LANG.testing} - ${percentage}%`,
            });
            if (error) {
                console.log (target + ": " + error.toString ());
                let invalidIp = error.toString().match('Invalid IP address');
                if (invalidIp) {
                    this.stopFlag = true;
                    Progress.popById('network-testing');
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: `${LANG.invalid_ip}: ${this.state.ip}`
                    });
                    return;
                }
            }
            else {
                this.successedPing += 1;
                this.totalRRT += (rcvd - sent);
            }
            if (!this.stopFlag) {
                this._pingTarget()
            } else {
                this._calculateResult();
            }
        });
    };

    _calculateConnectionQuality() {
        const failedPings = this.pingCounts - this.successedPing;
        const avgRRT = this.totalRRT/this.successedPing;
        if (avgRRT < 2) { // If rrt < 2 ms, net-ping is more prone to timeout. deduct 1 for each failed ping.
            return 100 - failedPings;
        } else {// deduct 3 for each failed ping, quality would be less than 70 when more than 10 fails occur.
            return 100 - 3 * failedPings;
        }
    }

    _calculateResult() {
        const avg =  Math.round(100 * (this.totalRRT/this.successedPing)) / 100;
        console.log(`success rate: ${this.successedPing}/${this.pingCounts}`);
        console.log(`average rrt of success: ${avg} ms`);
        this.session.close();
        Progress.popById('network-testing');
        const connectionQuality = this._calculateConnectionQuality();
        if (this.successedPing > 0) {
            let message = `${LANG.connection_quality} : ${connectionQuality}\n${LANG.average_response} : ${avg} ms`;
            let children = null;
            if (connectionQuality < 70 || avg > 100) {
                message = `${LANG.network_unhealthy}\n${message}`;
            } else if (!this.discoveredDevices || !this.discoveredDevices.find((device) => device.ipaddr === this.state.ip)) {
                message = `${LANG.device_not_on_list}\n${message}`;
            } else {
                children = (
                    <div className='hint-container network-testing'>
                        <div className='hint' onClick={() => {shell.openExternal(LANG.link_device_often_on_list)}}>{LANG.hint_device_often_on_list}</div>
                        <div className='hint' onClick={() => {shell.openExternal(LANG.link_connect_failed_when_sending_job)}}>{LANG.hint_connect_failed_when_sending_job}</div>
                        <div className='hint' onClick={() => {shell.openExternal(LANG.link_connect_camera_timeout)}}>{LANG.hint_connect_camera_timeout}</div>
                    </div>
                );
            }
            Alert.popUp({
                type: AlertConstants.SHOW_INFO,
                message,
                caption: LANG.test_completed,
                children,
            });
        } else {
            let match = false;
            const targetIpFirstThree = this.state.ip.match(/.*\./)[0];
            this.state.localIp.forEach (ip => {
                const localFirstThree = ip.match(/.*\./)[0];
                if (targetIpFirstThree === localFirstThree) {
                    match = true;
                }
            });
            if (match) {
                Alert.popUp({
                    id: 'network_test_result',
                    message: `${LANG.cannot_connect_1}`,
                    caption: LANG.test_completed
                });
            } else {
                Alert.popUp({
                    id: 'network_test_result',
                    message: `${LANG.cannot_connect_2}`,
                    caption: LANG.test_completed
                });
            }
        }
    }

    _onInputBlur() {
        let value = this.refs.textInput.value;
        this.state.ip = value.replace(' ', '');
        return;
    }

    _onInputKeydown(e) {
        e.stopPropagation();
        if (e.keyCode === KeycodeConstants.KEY_RETURN) {
            this._onInputBlur();
            this._onStart();
        }
    }

    _close() {
        this.props.onClose();
    }

    render() {
        return (
            <Modal onClose={() => {this._close()}}>
                <div className='network-testing-panel'>
                <section className='main-content'>
                    <div className='title'>{LANG.network_testing}</div>
                    <div className='info'>
                        <div className='left-part'>
                            {LANG.local_ip}
                        </div>
                        <div className='right-part'>
                            {this.state.localIp.join(', ')}
                        </div>
                    </div>
                    <div className='info'>
                        <div className='left-part'>
                            {LANG.insert_ip}
                        </div>
                        <div className='right-part'>
                            <input
                                ref='textInput'
                                defaultValue={this.defaultValue}
                                onBlur={this._onInputBlur.bind(this)}
                                onKeyDown={this._onInputKeydown.bind(this)}
                                >    
                            </input>
                        </div>
                    </div>
                </section>
                <section className='footer'>
                    <button
                        className='btn btn-default pull-right'
                        onClick={() => this._close()}
                    >
                        {LANG.end}
                    </button>
                    <button
                        className='btn btn-default pull-right primary'
                        onClick={() => {
                            this._onStart();
                        }}
                    >
                        {LANG.start}
                    </button>
                </section>
                </div>
            </Modal>
        );
    }
};

export default NetworkTestingPanel;
