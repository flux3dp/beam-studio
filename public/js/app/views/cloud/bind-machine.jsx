define([
    'jquery',
    'helpers/i18n',
    'helpers/device-master',
    'helpers/device-list',
    'helpers/pad-string',
    'plugins/classnames/index',
    'helpers/api/cloud',
    'app/actions/alert-actions',
    'helpers/firmware-version-checker'
], function(
    $,
    i18n,
    DeviceMaster,
    DeviceList,
    PadString,
    ClassNames,
    CloudApi,
    AlertActions,
    FirmwareVersionChecker
) {
    const React = require('react');
    return class BindMachine extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                selectedDevice: {},
                bindingInProgress: false,
                me: {}
            };
            this.lang = {};
        }

        UNSAFE_componentWillMount() {
            this.lang = i18n.get();
        }

        componentDidMount() {
            let getList = () => {
                let deviceList = DeviceList(DeviceMaster.getDeviceList());
                this.setState({ deviceList });
            };

            getList();

            setInterval(() => {
                getList();
            }, 2000);

            CloudApi.getMe().then(response => {
                if(response.ok) {
                    response.json().then(content => {
                        this.setState({ me: content });
                        if(content.needPasswordReset) {
                            location.hash = '#/studio/cloud/change-password';
                        }
                    });
                }
            });
        }

        _handleSignout = async () => {
            await CloudApi.signOut();
            location.hash = '#studio/cloud/sign-in';
        }

        _handleSelectDevice = async (device) => {
            const allowCloud = await FirmwareVersionChecker.check(device, 'CLOUD');
            if(allowCloud) {
                this.setState({
                    meetVersionRequirement: allowCloud,
                    selectedDevice: device
                });
            }
            else {
                let lang = this.props.lang.settings.flux_cloud;

                AlertActions.showPopupError(
                    'error-vcredist',
                    lang.not_supported_firmware
                );
            }
        }

        _handleCancel = () => {
            location.hash = '#/studio/print';
        }

        _handleCancelBinding = () => {
            this.setState({ bindingInProgress: false });
        }

        _handleBind = async () => {
            this.setState({ bindingInProgress: true });
            const status = await DeviceMaster.selectDevice(this.state.selectedDevice);
            if(status === 'TIMEOUT') {
                location.hash = '#/studio/cloud/bind-fail';
            }
            else {
                const waitForDevice = (deferred) => {
                    deferred = deferred || $.Deferred();

                    DeviceMaster.getDeviceInfo().then(response => {
                        let result = response.cloud[1].join('_');

                        if(response.cloud[0] === false && result === 'DISABLE') {
                            setTimeout(() => {
                                waitForDevice(deferred);
                            }, 2 * 1000);
                        }
                        else {
                            let error = response.cloud[1];
                            error.unshift('CLOUD');
                            this.props.onError(error);
                        }
                    });

                    return deferred.promise();
                };

                const response = await DeviceMaster.getDeviceInfo();
                let tried = 0;

                const bindDevice = async (uuid, token, accessId, signature) => {
                    const r = await CloudApi.bindDevice(uuid, token, accessId, signature);
                    if(r.ok) {
                        this.setState({ bindingInProgress: false });
                        location.hash = '#/studio/cloud/bind-success';
                    }
                    else {
                        if(tried > 2) {
                            location.hash = '#/studio/cloud/bind-fail';
                        } else {
                            tried++;
                            // try another time
                            setTimeout(() => {
                                bindDevice(uuid, token, accessId, signature);
                            }, 2 * 1000);
                        }
                    }
                };

                const processEnableCloudResult = (cloudResult) => {
                    if(typeof cloudResult === 'undefined') {
                        return;
                    }

                    if(cloudResult.status === 'ok') {
                        waitForDevice().then(() => {
                            getCloudValidationCodeAndBind();
                        }).fail((error) => {
                            this.props.onError(error);
                        });
                    }
                    else {
                        location.hash = '#/studio/cloud/bind-fail';
                    }
                };

                const getCloudValidationCodeAndBind = async (uuid) => {
                    const r = await DeviceMaster.getCloudValidationCode();
                    console.log('Got cloud validation code', r);
                    let { token, signature } = r.code,
                        accessId = r.code.access_id;

                    signature = encodeURIComponent(signature);
                    bindDevice(uuid, token, accessId, signature);
                };

                if(response.cloud[0] === true) {
                    getCloudValidationCodeAndBind(response.uuid);
                } else {
                    if(response.cloud[1].join('') === 'DISABLE') {
                        const resp = await DeviceMaster.enableCloud();
                        await processEnableCloudResult(resp);
                    } else {
                        let error = response.cloud[1];
                        error.unshift('CLOUD');
                        this.props.onError(error);
                    }
                }
            }
        }

        _handleUnbind = (uuid) => {
            let lang = this.props.lang.settings.flux_cloud;
            console.log('unbind', uuid);

            const removeDevice = () => {
                let me = this.state.me;
                delete me.devices[uuid];
                this.setState({ me });
            };

            if(confirm(lang.unbind_device)) {
                CloudApi.unbindDevice(uuid).then(r => {
                    if(r.ok) {
                        removeDevice(uuid);
                    }
                });
            }
        }

        _renderBindingWindow = () => {
            let lang = this.props.lang.settings.flux_cloud,
                bindingWindow;

            bindingWindow = (
                <div className="binding-window">
                    <h1>{lang.binding}</h1>
                    <div className="spinner-roller absolute-center" />
                    <div className="footer">
                        <a onClick={this._handleCancelBinding}>{lang.cancel}</a>
                    </div>
                </div>
            );

            return this.state.bindingInProgress ? bindingWindow : '';
        }

        _renderBlind = () => {
            let blind = (
                <div className="blind" />
            );

            return this.state.bindingInProgress ? blind : '';
        }

        render() {
            let lang = this.props.lang.settings.flux_cloud,
                deviceList,
                bindingWindow,
                blind;

            bindingWindow = this._renderBindingWindow();
            blind = this._renderBlind();

            if(!this.state.deviceList) {
                deviceList = <div>{this.lang.device.please_wait}</div>;
            }
            else {
                deviceList = this.state.deviceList.map((d) => {
                    let { me } = this.state,
                        uuid = d.source === 'h2h' ? d.h2h_uuid : d.uuid,
                        rowClass,
                        linkedClass;

                    const isLinked = () => {
                        return Object.keys(me.devices || {}).indexOf(uuid) !== -1;
                    };

                    rowClass = ClassNames(
                        'device',
                        {'selected': this.state.selectedDevice.name === d.name}
                    );

                    linkedClass = ClassNames({
                        'linked': isLinked()
                    });

                    return (
                        <div className={rowClass} onClick={() => this._handleSelectDevice(d)}>
                            <div className="name">{d.name}</div>
                            <div className="status">{this.lang.machine_status[d.st_id]}</div>
                            <div className={linkedClass} onClick={this._handleUnbind.bind(null, uuid)} />
                        </div>
                    );
                });
            }

            return(
                <div className="cloud">
                    <div className="container bind-machine">
                        <div className="title">
                            <h3>{lang.select_to_bind}</h3>
                        </div>
                        <div className="controls">
                            <div className="select">
                                {deviceList}
                                {/* <select size="8">
									{deviceList}
								</select> */}
                            </div>
                            <div className="user-info">
                                <div className="name">{this.state.me.nickname}</div>
                                <div className="email">{this.state.me.email}</div>
                                <div className="change-password-link">
                                    <a href="#/studio/cloud/change-password">{lang.change_password}</a> / <a href="#/studio/cloud/bind-machine" onClick={this._handleSignout}>{lang.sign_out}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <div className="divider">
                            <hr />
                        </div>
                        <div className="actions">
                            <button className="btn btn-cancel" onClick={this._handleCancel}>{lang.back}</button>
                            <button className="btn btn-default" disabled={!this.state.meetVersionRequirement} onClick={this._handleBind}>{lang.bind}</button>
                        </div>
                    </div>
                    {bindingWindow}
                    {blind}
                </div>
            );
        }

    };

});
