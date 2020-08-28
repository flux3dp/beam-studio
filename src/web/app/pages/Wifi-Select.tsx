define([
    'jquery',
    'reactClassset',
    'app/actions/initialize-machine',
    'jsx!widgets/Modal',
    'jsx!widgets/List',
    'jsx!widgets/Button-Group',
    'jsx!widgets/Alert',
    'helpers/api/usb-config',
    'helpers/api/upnp-config',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/alert-actions',
    'app/stores/alert-store'
], function(
    $,
    ReactCx,
    initializeMachine,
    Modal,
    ListView,
    ButtonGroup,
    Alert,
    usbConfig,
    upnpConfig,
    ProgressActions,
    ProgressConstants,
    AlertActions,
    AlertStore,
    DeviceErrorHandler
) {
    'use strict';

    const React = require('react');
    const ReactDOM = require('react-dom');

    var actionMap = {
            BACK_TO_SET_PASSWARD      : 'BACK_TO_SET_PASSWARD',
            AP_MODE                   : 'AP_MODE',
            SET_WIFI_WITHOUT_PASSWORD : 'SET_WIFI_WITHOUT_PASSWORD'
        },
        usbSocket,
        globalWifiAPI;

    return function(args) {
        args = args || {};

        return class WifiSelect extends React.Component{
            constructor(props) {
                super(props);
                this.action = '';
                this.deferred = $.Deferred();
                this.state = {
                    lang: args.state.lang,
                    wifiOptions: [],
                    selectedWifi: false,
                    openAlert: false,
                    openPassword: false,
                    openApModeForm: false,
                    apName: initializeMachine.settingPrinter.get().name,
                    apPass: '',
                    alertContent: {},
                    settingPrinter: initializeMachine.settingPrinter.get(),
                    apModeNameIsVaild: true,
                    apModePassIsVaild: true,
                    isFormSubmitted: false
                };
            }

            componentWillUnmount = () => {
                if ('undefined' !== typeof globalWifiAPI) {
                    globalWifiAPI.connection.close();
                }
            }

            componentDidMount() {
                var self = this,
                    wifiOptions = [],
                    settingWifi = initializeMachine.settingWifi.get(),
                    settingPrinter = self.state.settingPrinter,
                    timer,
                    getWifi = function() {
                        wifiOptions = [];

                        usbSocket.getWifiNetwork().done(function(response) {
                            var item;

                            response.items = response.items.sort(function(a, b) {
                                var aSSid = a.ssid.toUpperCase(),
                                    bSsid = b.ssid.toUpperCase();

                                if (aSSid === bSsid) {
                                    return 0;
                                }
                                else if (aSSid > bSsid) {
                                    return 1;
                                }
                                else {
                                    return -1;
                                }
                            });

                            response.items.forEach(function(el) {
                                item = self._renderWifiItem(el);
                                wifiOptions.push({
                                    value: el.ssid,
                                    label: {item}
                                });

                                if (settingWifi.ssid === el.ssid) {
                                    self.setState({
                                        selectedWifi: true
                                    });
                                }

                                self.setState({
                                    wifiOptions: wifiOptions
                                });
                            });

                            self.deferred.notify('SCAN_WIFI');
                        }).
                        fail(function(response) {
                            self.deferred.reject(response);
                        });
                    };

                self.deferred.progress(function(nextAction) {

                    switch (nextAction) {
                    case 'SCAN_WIFI':
                        clearTimeout(this.t);
                        this.t = setTimeout(() => {
                            getWifi();
                        }, 5000);
                        break;
                    case 'STOP_SCAN':
                        clearTimeout(this.t);
                        ProgressActions.open(ProgressConstants.NONSTOP);
                        self._afterStopWifiScanning({
                            action: self.action
                        });
                        break;
                    }

                })
                .fail(function(response) {
                    AlertActions.showPopupError(
                        'wifi-scan-error',
                        DeviceErrorHandler.translate(response.error)
                    );
                });


                if ('WIFI' === settingPrinter.from) {
                    usbSocket = upnpConfig(settingPrinter.uuid);
                    // defined at top
                    globalWifiAPI = upnpConfig(settingPrinter.uuid);
                }
                else {
                    usbSocket = usbConfig();
                }

                getWifi();

                AlertStore.onCancel(self._onCancel);
            }

            // Private methods
            _onCancel = (id) => {
                if ('#initialize/connect/select' === location.hash) {
                    usbSocket.close();
                    usbSocket = usbConfig();
                    location.hash = 'initialize/connect/connect-machine';
                }
            }

            _afterStopWifiScanning = (args) => {
                var self = this;

                ProgressActions.close();

                switch (args.action) {
                case actionMap.BACK_TO_SET_PASSWARD:
                    self._goToSetPassword();
                    break;
                case actionMap.AP_MODE:
                    self._setApMode();
                    break;
                case actionMap.SET_WIFI_WITHOUT_PASSWORD:
                    self._setWifiWithoutPassword();
                    break;
                }
            }

            _goToSetPassword = () => {
                // var settingWifi = initializeMachine.settingWifi.get();

                if ('WIFI' === this.state.settingPrinter.from) {
                    this._settingWifiViaWifi();
                }
                else {
                    location.hash = '#initialize/connect/set-password';
                }
            }

            _setApMode = () => {
                var self = this,
                    settingPrinter = self.state.settingPrinter,
                    apName = self.state.apName,
                    apPass = self.state.apPass;

                settingPrinter.apName = apName;
                initializeMachine.settingPrinter.set(settingPrinter);

                if ('WIFI' === settingPrinter.from) {
                    self._setApModeViaWifi(apName, apPass);
                }
                else {
                    self._setApModeViaUsb(apName, apPass);
                }
            }

            _setApModeViaUsb = (name, pass) => {
                var self = this,
                    lang = self.state.lang;

                usbSocket.setAPMode(
                    name,
                    pass,
                    {
                        onSuccess: function(response) {
                            location.hash = 'initialize/connect/setup-complete/station-mode';
                        },
                        onError: function(response) {
                            AlertActions.showPopupError('ap-mode-fail', lang.initialize.errors.select_wifi.ap_mode_fail);
                        }
                    }
                );
            }

            _setApModeViaWifi = (name, pass) => {
                var self = this,
                    lang = self.state.lang,
                    settingPrinter = self.state.settingPrinter;

                globalWifiAPI.setAPMode(name, pass).
                done(function(response) {
                    location.hash = 'initialize/connect/setup-complete/station-mode';
                }).
                fail(function(response) {
                    AlertActions.showPopupError('ap-mode-fail', lang.initialize.errors.select_wifi.ap_mode_fail);
                });
            }

            _settingWifiViaWifi = () => {
                var settingPrinter = this.state.settingPrinter,
                    settingWifi = initializeMachine.settingWifi.get();

                settingPrinter.apName = settingWifi.ssid;
                initializeMachine.settingPrinter.set(settingPrinter);
                ProgressActions.open(ProgressConstants.NONSTOP);

                globalWifiAPI.setWifiNetwork(settingWifi, settingWifi.plain_password).
                always(function() {
                    ProgressActions.close();
                }).
                done(function(response) {
                    console.log('done', response);
                    location.hash = '#initialize/connect/notice-from-device';
                }).
                fail(function(response) {
                    console.log('fail', response);
                });
            }

            _setWifiWithoutPassword = () => {
                var settingPrinter = self.state.settingPrinter,
                    settingWifi = initializeMachine.settingWifi.get();

                if ('WIFI' === settingPrinter.from) {
                    settingPrinter.apName = settingWifi.ssid;
                    initializeMachine.settingPrinter.set(settingPrinter);
                    this._settingWifiViaWifi();
                }
                else {
                    location.hash = '#initialize/connect/setup-complete/with-wifi';
                }
            }

            _handleSetPassword = (e) => {
                e.preventDefault();

                var self = this,
                    wifi = initializeMachine.settingWifi.get();

                wifi.plain_password = ReactDOM.findDOMNode(self.refs.password).value;
                initializeMachine.settingWifi.set(wifi);
                self._stopScan(actionMap.BACK_TO_SET_PASSWARD);
            }

            // UI events
            _confirmWifi = (e) => {
                e.preventDefault();

                var settingWifi = initializeMachine.settingWifi.get();

                if (true === settingWifi.password) {
                    this._stopScan();
                    this.setState({
                        openPassword: true
                    });
                }
                else {
                    this._stopScan(actionMap.SET_WIFI_WITHOUT_PASSWORD);
                }
            }

            _stopScan = (action) => {
                this.action = action;
                this.deferred.notify('STOP_SCAN');
            }

            _startScan = () => {
                this.action = '';
                this.deferred.notify('SCAN_WIFI');
            }

            _selectWifi = (e) => {
                var $li = $(e.target).parents('label'),
                    meta = $li.data('meta');

                this.setState({
                    selectedWifi: true
                });

                initializeMachine.settingWifi.set(meta);
            }

            _checkApModeSetting = (e) => {
                var name = ReactDOM.findDOMNode(this.refs.ap_mode_name).value,
                    pass = ReactDOM.findDOMNode(this.refs.ap_mode_password).value,
                    apModeNameIsVaild = /^[a-zA-Z0-9 \-\.\_\!\,\[\]\(\)]+$/g.test(name),
                    apModePassIsVaild = /^[a-zA-Z0-9 \-\.\_\!\,\[\]\(\)]{8,}$/g.test(pass);

                this.setState({
                    apName: name,
                    apPass: pass,
                    apModeNameIsVaild: apModeNameIsVaild,
                    apModePassIsVaild: apModePassIsVaild
                });

                return apModeNameIsVaild && apModePassIsVaild;
            }

            _setAsStationMode = (e) => {
                e.preventDefault();
                if (this._checkApModeSetting()) {
                    this.setState({
                        isFormSubmitted: true
                    });
                    this._stopScan(actionMap.AP_MODE);
                }
            }

            _joinNetwork = (e) => {
                e.preventDefault();

                var ssid = ReactDOM.findDOMNode(this.refs.network_name).value,
                    wepkey = ReactDOM.findDOMNode(this.refs.network_password).value,
                    security = ReactDOM.findDOMNode(this.refs.network_security).value;

                let wifi = { ssid, security };
                initializeMachine.settingWifi.set(wifi);
                this._stopScan();
                usbSocket.joinWifiNetwork(wifi, wepkey, true).then((result) => {
                    if(result.status === 'ok') {
                        location.hash = '#initialize/connect/notice-from-device';
                    }
                }).fail((error) => {
                    console.log(error);
                });
            }

            _renderPasswordForm = (lang) => {
                var self = this,
                    settingWifi = initializeMachine.settingWifi.get(),
                    buttons = [{
                        label: lang.initialize.connect,
                        className: 'btn-action btn-large',
                        type: 'submit',
                        dataAttrs: {
                            'ga-event': 'set-password-to-connect-to-wifi'
                        },
                        onClick: self._handleSetPassword
                    },
                    {
                        label: lang.initialize.cancel,
                        className: 'btn-link btn-large',
                        dataAttrs: {
                            'ga-event': 'cancel-connect-to-wifi'
                        },
                        onClick: function(e) {
                            e.preventDefault();
                            self._startScan();
                            self.setState({
                                openPassword: false
                            });
                        }
                    }],
                    content = (
                        <form className="form form-wifi-password" onSubmit={self._handleSetPassword}>
                            <div className="notice">
                                <p>“{settingWifi.ssid}”</p>
                                <p>{lang.initialize.requires_wifi_password}</p>
                            </div>
                            <input
                                ref="password"
                                type="password"
                                className="password-input"
                                placeholder=""
                                defaultValue=""
                                autoFocus={true}
                            />
                            <ButtonGroup className="btn-v-group" buttons={buttons}/>
                        </form>
                    );

                return (
                    true === this.state.openPassword ?
                    <Modal content={content}/> :
                    ''
                );
            }

            _renderApModeForm = (lang) => {
                var self = this,
                    closeForm = function(e) {
                        self.setState({
                            openApModeForm: false,
                            openJoinNetworkForm: false
                        });
                    },
                    classSet = ReactCx.cx,
                    nameClass = classSet({
                        'error': false === self.state.apModeNameIsVaild
                    }),
                    passClass = classSet({
                        'error': false === self.state.apModePassIsVaild
                    }),
                    submitButtonClass = classSet({
                        'btn btn-action btn-large': true,
                        'btn-disabled': self.state.isFormSubmitted
                    }),
                    content = (
                        <form className="form form-ap-mode" onSubmit={self._setAsStationMode}>
                            <h2>{lang.initialize.set_machine_generic.create_network}</h2>
                            <label className="h-control">
                                <span className="header">
                                    {lang.initialize.set_machine_generic.ap_mode_name}
                                </span>
                                <input
                                    ref="ap_mode_name"
                                    type="text"
                                    className={nameClass}
                                    placeholder=""
                                    defaultValue={self.state.settingPrinter.name}
                                    autoFocus={true}
                                    required={true}
                                    pattern="^.+$"
                                    maxLength="32"
                                    title={lang.initialize.set_machine_generic.ap_mode_name_format}
                                    placeholder={lang.initialize.set_machine_generic.ap_mode_name_placeholder}
                                    onChange={self._checkApModeSetting}
                                />
                            </label>
                            <label className="h-control">
                                <span className="header">
                                    {lang.initialize.set_machine_generic.ap_mode_pass}
                                </span>
                                <input
                                    ref="ap_mode_password"
                                    type="password"
                                    className={passClass}
                                    placeholder=""
                                    defaultValue=""
                                    required={true}
                                    pattern="^.{8,}$"
                                    title={lang.initialize.set_machine_generic.ap_mode_pass_format}
                                    placeholder={lang.initialize.set_machine_generic.ap_mode_pass_placeholder}
                                    onChange={self._checkApModeSetting}
                                />
                            </label>
                            <div className="button-group btn-v-group">
                                <button className="btn btn-action btn-large" type="submit">{lang.initialize.confirm}</button>
                                <button className="btn btn-action btn-large btn-link" onClick={closeForm}>{lang.initialize.cancel}</button>
                            </div>
                        </form>
                    );

                return (
                    true === this.state.openApModeForm ?
                    <Modal content={content}/> :
                    ''
                );
            }

            _renderJoinNetworkForm = (lang) => {
                var self = this,
                    closeForm = function(e) {
                        self.setState({
                            openJoinNetworkForm: false
                        });
                    },
                    classSet = ReactCx.cx,
                    nameClass = classSet({
                        'error': false === self.state.apModeNameIsVaild
                    }),
                    passClass = classSet({
                        'error': false === self.state.apModePassIsVaild
                    }),
                    submitButtonClass = classSet({
                        'btn btn-action btn-large': true,
                        'btn-disabled': self.state.isFormSubmitted
                    }),
                    content = (
                        <form className="form form-ap-mode">
                            <h2>{lang.initialize.set_machine_generic.join_network}</h2>
                            <label className="h-control">
                                <span className="header">
                                    {lang.initialize.set_machine_generic.ap_mode_name}
                                </span>
                                <input
                                    ref="network_name"
                                    type="text"
                                    className={nameClass}
                                    autoFocus={true}
                                    required={true}
                                    pattern="^.+$"
                                    maxLength="32"
                                />
                            </label>
                            <label className="h-control">
                                <span className="header">
                                    {lang.initialize.set_machine_generic.ap_mode_pass}
                                </span>
                                <input
                                    ref="network_password"
                                    type="password"
                                    className={passClass}
                                    required={true}
                                    pattern="^.{8,}$"
                                />
                            </label>
                            <label className="h-control">
                                <span className="header">
                                    {lang.initialize.set_machine_generic.security}
                                </span>
                                <select ref="network_security" className="security">
                                    <option value="NONE">NONE</option>
                                    <option value="WEP">WEP</option>
                                    <option value="WPA2-PSK">WPA2-PSK</option>
                                </select>
                            </label>
                            <div className="button-group btn-v-group">
                                <button className="btn btn-action btn-large" type="submit" onClick={this._joinNetwork}>{lang.initialize.confirm}</button>
                                <button className="btn btn-action btn-large btn-link" onClick={closeForm}>{lang.initialize.cancel}</button>
                            </div>
                        </form>
                    );

                return (
                    this.state.openJoinNetworkForm ? <Modal content={content}/> : ''
                );
            }

            _renderWifiItem = (wifi) => {
                var settingWifi = initializeMachine.settingWifi.get(),
                    lockClassName = 'fa ' + (true === wifi.password ? 'fa-lock' : ''),
                    meta = JSON.stringify(wifi);

                return (
                    <label data-meta={meta}>
                        <input type="radio" name="wifi-spot" value={wifi.ssid} defaultChecked={settingWifi.ssid === wifi.ssid}/>
                        <div className="row-fluid">
                            <span className="wifi-ssid">{wifi.ssid}</span>
                            <span className={lockClassName}></span>
                            <span className="wifi-signal-strength fa fa-wifi"></span>
                        </div>
                    </label>
                );
            }

            _renderWifiOptions = (lang) => {
                return (
                    this.state.wifiOptions.length > 0 ?
                    <ListView
                        ref="wifiList"
                        className={"pure-list wifi-list clearfix " + (this.state.wifiOptions.length > 0 ? 'active' : '')  }
                        ondblclick={this._confirmWifi}
                        onClick={this._selectWifi}
                        items={this.state.wifiOptions}
                    /> :
                    <div className="wifi-list">
                        <div className="spinner-roller absolute-center"/>
                    </div>
                );
            }

            render() {
                var self = this,
                    lang = self.state.lang,
                    wrapperClassName = {
                        'initialization': true
                    },
                    items = self._renderWifiOptions(lang),
                    buttons = [{
                        label: lang.initialize.next,
                        className: 'btn-action btn-large btn-set-client-mode' + (true === self.state.selectedWifi ? '' : ' btn-disabled'),
                        dataAttrs: {
                            'ga-event': 'pickup-a-wifi'
                        },
                        onClick: self._confirmWifi
                    },
                    {
                        label: lang.initialize.set_machine_generic.set_station_mode,
                        className: 'btn-action btn-large btn-set-station-mode',
                        dataAttrs: {
                            'ga-event': 'set-as-station-mode'
                        },
                        onClick: function(e) {
                            self.setState({
                                openApModeForm: true,
                                isFormSubmitted: false
                            });
                        }
                    },
                    {
                        label: lang.initialize.set_machine_generic.join_network,
                        className: 'btn-action btn-large btn-set-station-mode',
                        dataAttrs: {
                            'ga-event': 'set-as-station-mode'
                        },
                        onClick: function(e) {
                            self._stopScan();
                            self.setState({
                                openJoinNetworkForm: true,
                                isFormSubmitted: false
                            });
                        }
                    },
                    {
                        label: lang.initialize.skip,
                        className: 'btn-link btn-large',
                        type: 'link',
                        dataAttrs: {
                            'ga-event': 'use-device-with-usb'
                        },
                        onClick: (e) => {
                            this._stopScan();
                        },
                        href: '#initialize/connect/setup-complete/with-usb'
                    }],
                    passwordForm = this._renderPasswordForm(lang),
                    apModeForm = this._renderApModeForm(lang),
                    joinNetworkForm = this._renderJoinNetworkForm(lang),
                    content = (
                        <div className="select-wifi text-center">
                            <img className="brand-image" src="img/menu/main_logo.svg"/>
                            <div>
                                <h1 className="headline">{lang.initialize.wifi_setup}</h1>
                                <p className="notice">{lang.initialize.select_preferred_wifi}</p>
                                {items}
                                <ButtonGroup className="btn-v-group" buttons={buttons}/>
                            </div>
                            {passwordForm}
                            {apModeForm}
                            {joinNetworkForm}
                        </div>
                    );

                return (
                    <Modal className={wrapperClassName} content={content}/>
                );
            }
        };
    };
});
