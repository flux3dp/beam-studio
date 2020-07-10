define([
    'jsx!widgets/Modal',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/constants/keycode-constants',
    'helpers/api/discover',
    'helpers/i18n'
], function(
    Modal,
    Alert,
    AlertConstants,
    ProgressActions,
    ProgressConstants,
    KeycodeConstants,
    Discover,
    i18n
) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const LANG = i18n.lang.beambox.network_testing_panel;

    
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
            //Just for tcppoke
            this.discover = Discover('network-testing-panel', () => {});
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
                })
                return;
            }
            this._createSession();
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

        _createSession() {
            const ping = require('net-ping');
            const options = {
                retries: 0,
            }
            try {
                this.session = ping.createSession(options);
                this.session.on('error', error => {
                    console.log ("session error: " + error);
                    this._createSession(options);
                });
            }
            catch (e) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: `${LANG.fail_to_start_network_test}\n${e}`
                });
                throw e;
            }
        }

        _pingTarget() {
            this.pingTimes += 1;
            this.session.pingHost(this.state.ip, (error, target, sent, rcvd) => {
                const elapsedTime = new Date() - this.startTime;
                const percentage =  parseInt(100 * elapsedTime / this.TEST_TIME);
                ProgressActions.updating(`${LANG.testing} - ${percentage}%`, percentage);
                if (error) {
                    console.log (target + ": " + error.toString ());
                    let invalidIp = error.toString().match('Invalid IP address');
                    if (invalidIp) {
                        this.stopFlag = true;
                        ProgressActions.close();
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: `${LANG.invalid_ip}: ${this.state.ip}`
                        });
                        return;
                    }
                }
                else {
                    this.success += 1;
                    this.totalRRT += (rcvd - sent);
                }
                if (!this.stopFlag) {
                    this._pingTarget()
                } else {
                    this._calculateResult();
                }
            });
        };

        _calculateResult() {
            console.log(`success rate: ${this.success}/${this.pingTimes}`);
            const avg =  parseInt(100 * (this.totalRRT/this.success)) / 100;
            console.log(`average rrt of success: ${avg} ms`);
            this.session.close ();
            ProgressActions.close();
            const healthiness = parseInt(100 * this.success / this.pingTimes);
            if (healthiness !== 0) {
                this.discover.poke(this.state.ip);
                this.discover.testTcp(this.state.ip);
                Alert.popUp({
                    type: AlertConstants.SHOW_INFO,
                    message: `${LANG.network_healthiness} : ${healthiness} %\n${LANG.average_response}: ${avg} ms`,
                    caption: LANG.test_completed
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
            let value = ReactDOM.findDOMNode(this.refs.textInput).value;
            this.state.ip = value.replace(' ', '');
            return;
        }

        _onInputKeydown(e) {
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

    return NetworkTestingPanel;
});
