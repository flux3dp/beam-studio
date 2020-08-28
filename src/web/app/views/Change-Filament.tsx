define([
    'jquery',
    'reactPropTypes',
    'helpers/i18n',
    'helpers/shortcuts',
    'jsx!widgets/Modal',
    'jsx!widgets/AlertDialog',
    'helpers/device-master',
    'app/constants/device-constants',
    'app/actions/alert-actions',
    'app/stores/alert-store',
    'helpers/device-error-handler',
], function (
    $,
    PropTypes,
    i18n,
    shortcuts,
    Modal,
    AlertDialog,
    DeviceMaster,
    DeviceConstants,
    AlertActions,
    AlertStore,
    DeviceErrorHandler
) {
    const React = require('react');
    const ReactDOM = require('react-dom');

    var lang = i18n.get(),
        maxTemperature = 220,
        steps = {
            HOME: 'HOME',
            GUIDE: 'GUIDE',
            HEATING: 'HEATING',
            EMERGING: 'EMERGING',
            UNLOADING: 'UNLOADING',
            COMPLETED: 'COMPLETED',
            KICKED: 'KICKED',
            DISCONNECTED: 'DISCONNECTED'
        };
    class ChangeFilament extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                type: this.props.src === 'TUTORIAL' ? DeviceConstants.LOAD_FILAMENT : '',
                currentStep: this.props.src === 'TUTORIAL' ? steps.GUIDE : steps.HOME,
                temperature: '-',
                flexible: false
            };
        }

        UNSAFE_componentWillUpdate(nextProps, nextState) {
            if (true === nextProps.open && false === this.props.open) {
                this.setState(this.getInitialState());
            }
        }

        componentDidMount() {
            if (true === this.props.open) {
                if (this.props.src === 'TUTORIAL') {
                    DeviceMaster.selectDevice(this.props.device).then((status) => {
                        if (status !== DeviceConstants.CONNECTED) {
                            // alert and close
                            AlertActions.showPopupError('change-filament', status);
                        }
                    });
                }
                else {
                    let selectedDevice = DeviceMaster.getSelectedDevice();
                    if (selectedDevice.uuid !== this.props.device.uuid) {
                        DeviceMaster.selectDevice(this.props.device).then(function (status) {
                            if (status !== DeviceConstants.CONNECTED) {
                                // alert and close
                                AlertActions.showPopupError('change-filament', status);
                            }
                        });
                    }
                }

                if (this.props.src !== 'TUTORIAL') {
                    AlertStore.onCancel(this._onCancel);
                }
            }
        }

        componentWillUnmount() {
            AlertStore.removeCancelListener(this._onCancel);
            this._onClose();
        }

        shouldComponentUpdate(nextProps, nextState) {
            if (this.state.currentStep === nextState.currentStep && this.state.temperature === nextState.temperature) {
                return false;
            }

            if (steps.HEATING === nextState.currentStep && steps.HEATING !== this.state.currentStep) {
                this._goMaintain(nextState.type);
            }

            return true;
        }

        _onCancel = (e) => {
            // if change filament during pause operation
            if (this.isChangingFilamentDuringPause === true) {
                clearInterval(this.changeFilamentDuringPauseTimer);
                DeviceMaster.endToolheadOperation().then(() => {
                    this.setState(this.getInitialState());
                });
            }
            else {
                DeviceMaster.stopChangingFilament().then(() => {
                    DeviceMaster.killSelf();
                });
                if (e === steps.KICKED) {
                    AlertActions.showPopupInfo(
                        'change filament kicked',
                        lang.change_filament.kicked,
                        lang.change_filament.home_caption
                    );
                }
            }
            this.setState(this.getInitialState());
        }

        _goMaintain = (type) => {
            var self = this,
                nextStep = (self.state.type === DeviceConstants.LOAD_FILAMENT ? steps.EMERGING : steps.UNLOADING);

            const progress = function (response) {
                console.log('changing filament progress', response, response.stage);
                let status = response.stage[1];
                switch (status) {
                    case 'WAITTING':
                    case 'WAITING':
                    case 'LOADING':
                        self._next(steps.EMERGING, DeviceConstants.LOAD_FILAMENT);
                        if (self.state.loading_status !== response.stage[1]) {
                            self.setState({ loading_status: response.stage[1] });
                            self.forceUpdate();
                        }
                        break;
                    case 'UNLOADING':
                        self._next(steps.UNLOADING);
                        break;
                    case 'DISCONNECTED':
                        DeviceMaster.kickChangeFilament().always(function () {
                            self._next(steps.DISCONNECTED);
                        });
                        break;
                    default:
                        if (response.error) {
                            if (response.error[0] === 'KICKED') {
                                self._onCancel();
                            }
                        }
                        else {
                            // update temperature
                            self.setState({
                                temperature: response.temperature || 220
                            });
                        }
                        break;
                }
            };

            const done = function (response) {
                DeviceMaster.quitTask('maintain').done(function () {
                    self._next(steps.COMPLETED);
                });
            };

            const errorMessageHandler = (response) => {
                if (typeof response.error === 'string') {
                    response.error = [response.error];
                }
                DeviceMaster.quitTask('maintain');

                AlertActions.showPopupError('change-filament-device-error', DeviceErrorHandler.translate(response.error));
            };

            const processReport = (report) => {
                console.log('processing report', report);
                // if changing filament during pause
                if (report.st_id === 48) {
                    this.isChangingFilamentDuringPause = true;

                    DeviceMaster.changeFilamentDuringPause(type)
                        .progress((p, t) => {
                            this.changeFilamentDuringPauseTimer = t;
                            p.device_status = p.device_status || {};    // sometimes backend is not passing device_status property

                            if (p.device_status.tt && p.device_status.rt) {
                                maxTemperature = p.device_status.tt[0];
                                if (p.device_status.rt) {
                                    this.setState({
                                        type: type,
                                        temperature: p.device_status.rt[0]
                                    });
                                }
                            }

                            // change to emerging when temperature is reached
                            if (type === 'LOAD' && this.state.currentStep !== steps.EMERGING) {
                                if (p.loading === true) {
                                    this.setState({
                                        currentStep: steps.EMERGING
                                    });
                                }
                            }
                        })
                        .then(() => {
                            this.setState({ currentStep: steps.COMPLETED });
                        });
                }
                // regular change filament
                else {
                    console.log('Changing Filament', this.state.flexible == true);
                    DeviceMaster.changeFilament(type, this.state.flexible)
                        .progress(progress)
                        .done(done)
                        .fail(function (response) {
                            // Regularize error message
                            if (response && response.info === 'TYPE_ERROR') {
                                response.error = ['HEAD_ERROR', 'TYPE_ERROR', 'EXTRUDER', 'N/A'];
                            }

                            switch (response.error[0]) {
                                case 'RESOURCE_BUSY':
                                    AlertActions.showDeviceBusyPopup('change-filament-device-busy');
                                    break;
                                case 'TIMEOUT':
                                    DeviceMaster.closeConnection();
                                    AlertActions.showPopupError('change-filament-toolhead-no-response', lang.change_filament.toolhead_no_response);
                                    self.props.onClose();
                                    break;
                                case 'HEAD_ERROR':
                                    if (response.error[3] === 'N/A') {
                                        AlertActions.showPopupError('change-filament-device-error', DeviceErrorHandler.translate(['HEAD_ERROR', 'HEAD_OFFLINE']));
                                    } else {
                                        AlertActions.showPopupError('change-filament-device-error', DeviceErrorHandler.translate(['HEAD_ERROR', 'TYPE_ERROR']));
                                    }
                                    DeviceMaster.quitTask('maintain').then(function () {
                                        self.setState({ currentStep: steps.GUIDE });
                                    });
                                    break;
                                case 'UNKNOWN_COMMAND':
                                    AlertActions.showDeviceBusyPopup('change-filament-zombie', lang.change_filament.maintain_zombie);
                                    break;
                                case 'KICKED':
                                    self._onCancel(steps.KICKED);
                                    break;
                                case 'CANCEL': break;
                                default:
                                    errorMessageHandler(response);
                            }
                        });
                }
            };

            console.log('selecting device');
            DeviceMaster.selectDevice(self.props.device).then(() => {
                console.log('getting report');
                return DeviceMaster.getReport();
            })
                .then(processReport);
        }

        _onClose = (e) => {
            this.props.onClose(e);
            ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(this.refs.modal).parentNode);
        }

        _next = (nextStep, type) => {
            let flexible = false;
            if (type == DeviceConstants.LOAD_FLEXIBLE_FILAMENT) {
                flexible = true;
                type = DeviceConstants.LOAD_FILAMENT;
            }
            if (nextStep !== this.state.currentStep) {
                let newState = {
                    type: type || this.state.type,
                    currentStep: nextStep
                };
                if (type) {newState.flexible = flexible;}
                this.setState(newState);
            }
        }

        _loadFilamentFromComplete = () => {
            this.setState(this.getInitialState(), () => {
                this._next(steps.GUIDE, DeviceConstants.LOAD_FILAMENT);
            });
        }

        _makeCaption = (caption) => {
            if ('undefined' === typeof caption) {
                caption = (
                    DeviceConstants.LOAD_FILAMENT === this.state.type ?
                        lang.change_filament.load_filament :
                        lang.change_filament.unload_filament
                );
            }

            return caption + ' - ' + (this.props.device.name || '');
        }

        // sections
        _sectionHome = () => {
            return {
                caption: lang.change_filament.home_caption,
                message: (
                    <div className="way-to-go">
                        <button
                            className="btn btn-default"
                            data-ga-event="load-filament"
                            onClick={this._next.bind(null, steps.GUIDE, DeviceConstants.LOAD_FILAMENT)}
                        >
                            {lang.change_filament.load_filament_caption}
                        </button>
                        <button
                            className="btn btn-default"
                            data-ga-event="load-filament"
                            onClick={this._next.bind(null, steps.GUIDE, DeviceConstants.LOAD_FLEXIBLE_FILAMENT)}
                        >
                            {lang.change_filament.load_flexible_filament_caption}
                        </button>
                        <button
                            className="btn btn-default"
                            data-ga-event="unload-filament"
                            onClick={this._next.bind(null, steps.HEATING, DeviceConstants.UNLOAD_FILAMENT)}
                        >
                            {lang.change_filament.unload_filament_caption}
                        </button>
                    </div>
                ),
                buttons: [{
                    label: lang.change_filament.cancel,
                    className: 'btn-default btn-alone-left',
                    dataAttrs: {
                        'ga-event': 'cancel'
                    },
                    onClick: this.props.onClose
                }]
            };
        }

        _sectionGuide = () => {
            var activeLang = i18n.getActiveLang(),
                imageSrc = (
                    'en' === activeLang ?
                        'img/insert-filament-en.png' :
                        'img/insert-filament-zh-tw.png'
                );

            return {
                message: (
                    <img className="guide-image" src={imageSrc} />
                ),
                buttons: [{
                    label: lang.change_filament.cancel,
                    dataAttrs: {
                        'ga-event': 'cancel'
                    },
                    onClick: this.props.onClose
                },
                {
                    label: lang.change_filament.next,
                    dataAttrs: {
                        'ga-event': 'heatup'
                    },
                    onClick: this._next.bind(null, steps.HEATING, '')
                }]
            };
        }

        _sectionHeating = () => {
            let { temperature, targetTemperature } = this.state;

            return {
                message: (
                    <div className="message-container">
                        <p className="temperature">
                            <span>{lang.change_filament.heating_nozzle}</span>
                            <span>{temperature} / {targetTemperature || maxTemperature}°C</span>
                        </p>
                        <div className="spinner-roller spinner-roller-reverse" />
                    </div>
                ),
                buttons: [
                    {
                        label: lang.change_filament.cancel,
                        onClick: this._onCancel
                    }
                ]
            };
        }

        _sectionEmerging = () => {
            var self = this,
                activeLang = i18n.getActiveLang(),
                imageSrc, message, buttons;

            imageSrc = (
                'en' === activeLang ?
                    'img/press-to-accelerate-en.png' :
                    'img/press-to-accelerate-zh-tw.png'
            );

            message = (
                <div className="message-container">
                    <img className="guide-image" src={imageSrc} />
                </div>
            );

            buttons = [
                {
                    label: 'ok',
                    className: 'btn-default btn-alone-right',
                    onClick: function (e) {
                        self.setState({
                            type: type || this.state.type,
                            currentStep: steps.COMPLETED
                        });
                    }
                },
                {
                    label: lang.change_filament.cancel,
                    className: 'btn-default btn-alone-left',
                    onClick: this._onCancel
                },
                {
                    label: [
                        <span className="auto-emerging">
                            {this.state.loading_status === 'WAITING' ?
                                lang.change_filament.auto_emerging :
                                lang.change_filament.loading_filament
                            }
                        </span>,
                        <div className="spinner-roller spinner-roller-reverse" />
                    ],
                    type: 'icon',
                    className: 'btn-icon',
                    onClick: function (e) {
                        e.preventDefault();
                    }
                }
            ];

            return { message, buttons };
        }

        _sectionUnloading = () => {
            return {
                message: (
                    <div className="message-container">
                        <p>{lang.change_filament.unloading}</p>
                        <div className="spinner-roller spinner-roller-reverse" />
                    </div>
                ),
                buttons: []
            };
        }

        _sectionCompleted = () => {
            let loaded, unloaded;

            loaded = (<div className="message-container">{lang.change_filament.loaded}</div>);

            unloaded = (
                <div className="message-container">{lang.change_filament.unloaded}
                    <p>
                        <a onClick={this._loadFilamentFromComplete}>
                            {lang.change_filament.load_filament}
                        </a>
                    </p>
                </div>
            );

            return {
                message: (
                    this.state.type === DeviceConstants.LOAD_FILAMENT ? loaded : unloaded
                ),
                buttons: [{
                    label: lang.change_filament.ok,
                    className: 'btn-default btn-alone-right',
                    dataAttrs: {
                        'ga-event': 'completed'
                    },
                    onClick: this.props.onClose
                }]
            };
        }
        _sectionDisconnected = () => {
            return {
                message: (
                    <div className="message-container">{lang.change_filament.disconnected}</div>
                ),
                buttons: [{
                    label: lang.change_filament.ok,
                    className: 'btn-default btn-alone-right',
                    dataAttrs: {
                        'ga-event': 'disconnected'
                    },
                    onClick: () => {
                        this.setState(this.getInitialState());
                    }
                }]
            };
        }

        _sectionFactory = () => {
            var self = this,
                renderFunc,
                renderName = this.state.currentStep.toLowerCase().split('');

            renderName[0] = renderName[0].toUpperCase();
            renderName = '_section' + renderName.join('').replace('_', '');

            if (this.state.currentStep === steps.COMPLETED) {
                renderName = '_sectionCompleted';
            }
            else if (this.state.temperature === 220) {
                renderName = '_sectionEmerging';
            }

            if (true === self.hasOwnProperty(renderName)) {
                renderFunc = self[renderName];
            }
            else {
                renderFunc = function () {
                    return {
                        buttons: [{
                            label: lang.change_filament.cancel,
                            className: 'btn-default btn-alone-left',
                            dataAttrs: {
                                'ga-event': 'cancel'
                            },
                            onClick: self.props.onClose
                        }]
                    };
                };
            }

            return renderFunc();
        }

        render() {
            if (false === this.props.open) {
                return (<div />);
            }

            var section = this._sectionFactory(),
                content = (
                    <AlertDialog
                        lang={lang}
                        caption={this._makeCaption(section.caption)}
                        message={section.message}
                        buttons={section.buttons}
                    />
                ),
                className = {
                    'modal-change-filament': true,
                    'shadow-modal': true
                };

            return (
                <div className="always-top" ref="modal">
                    <Modal className={className} content={content} disabledEscapeOnBackground={false} />
                        please wait
                </div>
            );
        }
    };

    ChangeFilament.propTypes = {
        open: PropTypes.bool,
        device: PropTypes.object,
        src: PropTypes.string,
        onClose: PropTypes.func
    };

    ChangeFilament.defaultProps = {
        open: false,
        device: {},
        onClose: function () { }
    };

    return ChangeFilament;
});
