define([
    'app/actions/initialize-machine',
    'jsx!widgets/Button-Group',
    'jsx!widgets/Modal',
    'helpers/api/usb-config',
    'helpers/api/config',
    'app/actions/alert-actions',
    'app/stores/alert-store'
], function(
    initializeMachine,
    ButtonGroup,
    Modal,
    usbConfig,
    config,
    AlertActions,
    AlertStore
) {
    'use strict';
    const React = require('react');

    return function(args) {
        args = args || {};

        class Page extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    lang: args.state.lang,
                    openAlert: false,
                    alertContent: {}
                };
            }

            // Lifecycle
            componentDidMount() {
                this._handleSetPassword();
            }

            // UI events

            _onCancelConnection = (e) => {
                clearTimeout(this.t);
                var wifi = initializeMachine.settingWifi.get();

                delete wifi.plain_password;
                initializeMachine.settingWifi.set(wifi);

                location.hash = '#initialize/wifi/select';
            }

            _handleSetPassword = (e) => {
                var self = this,
                    wifi = initializeMachine.settingWifi.get(),
                    usb = usbConfig(),
                    lang = self.state.lang,
                    password = wifi.plain_password,
                    diffTime = 60000,    // check network within 60 secs
                    startTime = (new Date()).getTime(),
                    checkCountdown = (response) => {
                        if (diffTime <= (new Date()).getTime() - startTime) {
                            genericFailureHandler();
                            return false;
                        }

                        return true;
                    },
                    genericFailureHandler = () => {
                        AlertActions.showPopupError(
                            'wifi-authenticate-fail',
                            lang.initialize.errors.wifi_connection.connecting_fail,
                            lang.initialize.errors.wifi_connection.caption
                        );
                    },
                    genericPerviousSSIDError = () => {
                      AlertActions.showPopupCustom(
                        'wifi-authenticate-fail',
                        lang.initialize.errors.wifi_connection.connecting_fail,
                        lang.initialize.errors.close,
                        lang.initialize.errors.wifi_connection.caption,
                        '',
                        () => {}
                      );

                    },

                    checkNetworkStatus = () => {
                        var tryAgain = (response) => {
                            if (true === checkCountdown(response)) {
                                clearTimeout(this.t);
                                this.t = setTimeout(() => {
                                    let d = initializeMachine.settingWifi.get();
                                    usb.getMachineNetwork(deferred, d.ssid);
                                }, 1000);
                            }
                        },
                        deferred;

                        // NOTICE: Wait for 2 sec due to the device may not refresh its IP.
                        clearTimeout(this.t);
                        this.t = setTimeout(() => {
                            let d = initializeMachine.settingWifi.get();
                            deferred = usb.getMachineNetwork(deferred, d.ssid)
                            .fail(tryAgain)
                            .progress(tryAgain)
                            .done((response) => {
                                if (response.action === 'GOOD') {
                                    let pokeIPAddr = localStorage.getItem('poke-ip-addr');

                                    if (pokeIPAddr && pokeIPAddr !== '') {
                                        const pokeIPAddrArr = pokeIPAddr.split(/[,;] ?/);

                                        if (pokeIPAddrArr.indexOf(response.ipaddr[0]) === -1) {
                                            if (pokeIPAddrArr.length > 19) {
                                                pokeIPAddr = pokeIPAddrArr.slice(pokeIPAddrArr.length - 19, pokeIPAddrArr.length);
                                            }

                                            localStorage.setItem('poke-ip-addr', `${pokeIPAddr}, ${response.ipaddr[0]}`);
                                        }
                                    } else {
                                        localStorage.setItem('poke-ip-addr', response.ipaddr[0]);
                                    }

                                    location.hash = '#initialize/wifi/setup-complete';
                                    usb.close();
                                } else if (response.action === 'PREVIOUS_SSID') {
                                    genericPerviousSSIDError();
                                    location.hash = '#initialize/wifi/select';
                                };
                            });
                        }, 2000);
                    };

                usb.setWifiNetwork(wifi, password, {
                    onSuccess: function(response) {
                        checkNetworkStatus();
                    },
                    onError: function(response) {
                        genericFailureHandler();
                    }
                });

            }

            render() {
                var wrapperClassName = {
                        'initialization': true
                    },
                    lang = this.state.lang,
                    content = (
                        <div className="connecting-wifi text-center">
                            <h1>{lang.initialize.connecting}</h1>
                            <div className="spinner-roller"/>
                            <button
                                className="btn btn-action btn-large"
                                data-ga-event="cancel"
                                onClick={this._onCancelConnection}
                            >
                                {lang.initialize.cancel}
                            </button>
                        </div>
                    );

                return (
                    <Modal className={wrapperClassName} content={content}/>
                );
            }
        };

        return Page;
    };
});
