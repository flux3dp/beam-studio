define([
    'react',
    'reactDOM',
    'jsx!widgets/Modal',
    'app/stores/beambox-store',
    'app/actions/alert-actions',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'helpers/i18n'
], function(
    React,
    ReactDOM,
    Modal,
    BeamboxStore,
    AlertActions,
    ProgressActions,
    ProgressConstants,
    i18n
) {
    const LANG = i18n.lang.beambox.network_testing_panel;

    
    class NetworkTestingPanel extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                show: false,
                ip: ''
            };
            this.TEST_TIME = 30000;
        }

        componentDidMount() {
            BeamboxStore.onShowNetworkTestingPanel(this._initAndShow.bind(this));

        }

        componentWillUnmount() {
        }

        _initAndShow(payload) {
            let ip = '';
            if (payload.device) {
                ip = payload.device;
                this.defaultValue = ip;
            }
            let local_ips = [];
            const os = require('os');
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
            this.setState({
                ip: ip,
                show: true,
                localIp: local_ips
            });
        }

        _onStart() {
            if (!this.state.ip) {
                AlertActions.showPopupError('empty_ip', LANG.empty_ip);
                return;
            }
            const ping = require('net-ping');
            const options = {
                retries: 0,
            }
            this.session = ping.createSession(options);
            this.stopFlag = false;
            this.pingTimes = 0;
            this.success = 0;
            this.totalRRT = 0;
            
            this.startTime = new Date();
            const raiseFlag = window.setTimeout(() =>{
                this.stopFlag = true;
                }, this.TEST_TIME
            );
            
            ProgressActions.open(ProgressConstants.STEPPING, '', `${LANG.testing} - 0%`, false);
            //ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.testing);
            this._pingTarget();
        }

        _pingTarget() {
            const self = this;
            this.pingTimes += 1;
            try {
                this.session.pingHost(this.state.ip, function (error, target, sent, rcvd) {
                    const elapsedTime = new Date() - self.startTime;
                    const percentage =  parseInt(100 * elapsedTime / self.TEST_TIME);
                    ProgressActions.updating(`${LANG.testing} - ${percentage}%`, percentage);
                    if (error) {
                        console.log (target + ": " + error.toString ());
                        let invalidIp = error.toString().match('Invalid IP address');
                        if (invalidIp) {
                            self.stopFlag = true;
                            ProgressActions.close();
                            AlertActions.showPopupError('invalid_target_ip', `${LANG.invalid_ip}: ${self.state.ip}`);
                            return;
                        }
                    }
                    else {
                        self.success += 1;
                        self.totalRRT += (rcvd - sent);
                    }
                    if (!self.stopFlag) {
                        setTimeout(() => {self._pingTarget()}, 100);
                    } else {
                        console.log(`success rate: ${self.success}/${self.pingTimes}`);
                        const avg =  parseInt(100 * (self.totalRRT/self.success)) / 100;
                        console.log(`average rrt of success: ${avg} ms`);
                        self.session.close ();
                        ProgressActions.close();
                        const healthiness = parseInt(100 * self.success / self.pingTimes);
                        if (healthiness !== 0) {
                            AlertActions.showPopupInfo('network_test_result', `${LANG.network_healthiness} : ${healthiness} %\n${LANG.average_response}: ${avg} ms`,
                            LANG.test_completed);
                        } else {
                            let match = false;
                            const targetIpFirstThree = self.state.ip.match(/.*\./)[0];
                            self.state.localIp.forEach (ip => {
                                const localFirstThree = ip.match(/.*\./)[0];
                                if (targetIpFirstThree === localFirstThree) {
                                    match = true;
                                }
                            });
                            if (match) {
                                AlertActions.showPopupInfo('network_test_result', `${LANG.cannot_connect_1}`, LANG.test_completed);
                            } else {
                                AlertActions.showPopupInfo('network_test_result', `${LANG.cannot_connect_2}`, LANG.test_completed);
                            }
                        }
                    }
                });
            } 
            catch (e) {
                const elapsedTime = new Date() - this.startTime;
                const percentage =  parseInt(100 * elapsedTime / this.TEST_TIME);
                ProgressActions.updating(`${LANG.testing} - ${percentage}%`, percentage);
                if (!this.stopFlag) {
                    setTimeout(() => {this._pingTarget()}, 100);
                } else {
                    console.log(`success rate: ${this.success}/${this.pingTimes}`);
                    const avg =  parseInt(100 * (this.totalRRT/this.success)) / 100;
                    console.log(`average rrt of success: ${avg} ms`);
                    this.session.close ();
                    ProgressActions.close();
                    const healthiness = parseInt(100 * this.success / this.pingTimes);
                    if (healthiness !== 0) {
                        AlertActions.showPopupInfo('network_test_result', `${LANG.network_healthiness} : ${healthiness} %\n${LANG.average_response}: ${avg} ms`,
                        LANG.test_completed);
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
                            AlertActions.showPopupInfo('network_test_result', `${LANG.cannot_connect_1}`, LANG.test_completed);
                        } else {
                            AlertActions.showPopupInfo('network_test_result', `${LANG.cannot_connect_2}`, LANG.test_completed);
                        }
                    }
                }
            }
        };

        _onInputBlur() {
            let value = ReactDOM.findDOMNode(this.refs.textInput).value;
            this.state.ip = value.replace(' ', '');
            return;
        }

        _close() {
            this.setState({show: false});
        }

        render() {
            if (this.state.show) {
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
                                        >    
                                    </input>
                                </div>
                            </div>
                        </section>
                        <section className='footer'>
                            <button
                                className='btn btn-default pull-right'
                                onClick={() => {
                                    this._onStart();
                                }}
                            >{LANG.start}
                            </button>
                            <button
                                className='btn btn-default pull-right'
                                onClick={() => this._close()}
                            >{LANG.end}
                            </button>
                        </section>
                        </div>
                    </Modal>
                );
            } else {
                return (
                    <div className='network-testing-panel-place-holder'></div>
                )
            }
            
        }
    };

    return NetworkTestingPanel;
});
