import $ from 'jquery';
import config from '../../helpers/api/config';
import AlertActions from '../actions/alert-actions';
import AlertStore from '../stores/alert-store';
import AlertConstants from '../constants/alert-constants';
import ProgressStore from '../stores/progress-store';
import ProgressConstants from '../constants/progress-constants';
import Progress from '../widgets/Progress';
import InputLightbox from '../widgets/Input-Lightbox';
import NotificationModal from '../widgets/Notification-Modal';
import UpdateDialog from '../views/Update-Dialog';
import CameraCalibration from '../views/beambox/Camera-Calibration';
import GlobalActions from '../actions/global-actions';
import GlobalStore from '../stores/global-store';
import Monitor from '../views/print/Monitor';
import Modal from '../widgets/Modal';
import storage from 'helpers/storage-helper';
import checkFirmware from 'helpers/check-firmware';
import firmwareUpdater from 'helpers/firmware-updater';
import DeviceMaster from 'helpers/device-master';
// @ts-expect-error
import Notifier = require('jqueryGrowl');
declare global {
    interface JQueryStatic {
        growl: any
    }
}

const React = requireNode('react');

export default function(args) {
    args = args || {};

    var lang = args.state.lang,
        FIRST_DEVICE_UPDATE = 'check-first-device-firmware';

    return class NotificationCollection extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                // monitor
                showMonitor           : false,
                fcode                 : {},
                previewUrl            : '',
                monitorOpener         : null,

                // general popup
                showNotificationModal : false,
                type                  : '',
                sourceId              : '',
                caption               : '',
                message               : '',
                customText            : '',

                // progress
                progress: {
                    open       : false,
                    caption    : '',
                    message    : '',
                    percentage : 0,
                    type       : '',
                    hasStop    : undefined,
                    onStop     : function() {},
                    onFinished : function() {}
                },
                // input lightbox
                inputLightbox: {
                    open         : false,
                    type         : '',
                    caption      : '',
                    inputHeader  : '',
                    defaultValue : '',
                    confirmText  : '',
                    onClose      : function() {},
                    onSubmit     : function() {}
                },
                // application update
                application: {
                    open          : false,
                    type          : 'firmware',
                    releaseNote   : '',
                    latestVersion : '',
                    updateFile    : undefined,
                    device        : {},
                    onDownload    : function() {},
                    onInstall     : function() {}
                },
                // change filament
                changeFilament: {
                    open    : false,
                    device  : {},
                    onClose : function() {}
                },
                headTemperature: {
                    show        : false,
                    device      : {}
                },

                cameraCalibration: {
                    open: false,
                    device: {}
                },

                firstDevice: {
                    info: {}, // device info
                    apiResponse: {}, // device info
                },
                // images
                displayImages: false,
                images: []
            };
        }

        componentDidMount() {
            var self = this,
                discoverMethods,
                firstDevice,
                defaultPrinter,
                type = 'firmware',
                _checkFirmwareOfDefaultPrinter = function() {
                    let printers = DeviceMaster.getAvailableDevices();
                    printers.some(function(printer) {
                    if (defaultPrinter.serial === printer.serial) {
                        defaultPrinter = printer;
                        //update default-print's data.
                        config().write('default-printer', JSON.stringify(printer));
                        return true ;
                    }
                    });

                    checkFirmware(defaultPrinter, type).done(function(response) {
                        if (response.needUpdate) {
                        firmwareUpdater(response, defaultPrinter, type);
                        }
                    });
                };

            AlertStore.onNotify(this._handleNotification);
            AlertStore.onCloseNotify(this._handleCloseNotification);
            AlertStore.onPopup(this._handlePopup);
            AlertStore.onClosePopup(this._handleClosePopup);
            AlertStore.onUpdate(this._showUpdate);

            ProgressStore.onOpened(this._handleProgress)
                .onUpdating(this._handleProgress)
                .onClosed(this._handleProgressFinish);

            GlobalStore.onShowMonitor(this._handleOpenMonitor);
            GlobalStore.onCloseAllView(this._handleCloseAllView);
            GlobalStore.onCloseMonitor(this._handlecloseMonitor);
            GlobalStore.onSliceComplete(this._handleSliceReport);

            // checking FLUX studio laster version in website that is going to
            // popup update dialog if newser FLUX Studio has been relwased.

            /***waiting for website API done***
            checkSoftwareUpdate()
                .done(function(response) {
                softwareUpdater(response);
                });
            /*********************************/

            // checking firmware of default printer that is going to popup
            // update dialog if newest firmware has been released.
            defaultPrinter = config().read('default-printer');
            // settimeout 15 secs for make sure discover has been done.
            if (defaultPrinter) {
                setTimeout(_checkFirmwareOfDefaultPrinter, 15000);
            }

            // DeviceMaster.registerUsbEvent('DASHBOARD', this._monitorUsb);
        }

        componentWillUnmount() {
            AlertStore.removeNotifyListener(this._handleNotification);
            AlertStore.removePopupListener(this._handlePopup);
            AlertStore.removeClosePopupListener(this._handleClosePopup);
            AlertStore.removeYesListener(this._onYes);

            // progress
            ProgressStore.removeOpenedListener(this._handleProgress).
                removeUpdatingListener(this._handleProgress).
                removeClosedListener(this._handleProgressFinish);

            GlobalStore.removeShowMoniotorListener(this._handleOpenMonitor);
            GlobalStore.removeCloseMonitorListener(this._handlecloseMonitor);
            GlobalStore.removeCloseAllViewListener(this._handleCloseAllView);
            GlobalStore.removeSliceCompleteListener(this._handleSliceReport);
        }


        _monitorUsb = (usbOn) => {
            if(this.state.showMonitor) {
                if(!usbOn) {
                    this._handlecloseMonitor();
                    AlertActions.showPopupError('USB_UNPLUGGED', lang.message.usb_unplugged);
                }
            }
        }

        _onYes = (id) => {
            var self = this;

            if (id === FIRST_DEVICE_UPDATE) {
                // Use "setTimeout" to avoid dispatch in the middle of a dispatch
                setTimeout(function() {
                    console.log('this is firmwate update on initial application');
                    firmwareUpdater(self.state.firstDevice.apiResponse, self.state.firstDevice.info, 'firmware');
                }, 0);
            }
        }

        _showUpdate = (payload) => {
            var currentVersion = (
                    'software' === payload.type ?
                    payload.updateInfo.currentVersion :
                    payload.device.version
                ),
                releaseNote = (
                    'zh-tw' === storage.get('active-lang') ?
                    payload.updateInfo.changelog_zh :
                    payload.updateInfo.changelog_en
                );

            this.setState({
                application: {
                    open: true,
                    device: payload.device,
                    type: payload.type,
                    currentVersion: currentVersion,
                    latestVersion: payload.updateInfo.latestVersion,
                    releaseNote: releaseNote,
                    onDownload: payload.onDownload,
                    onInstall: payload.onInstall
                }
            });
        }

        _handleUpdateClose = () => {
            this.setState({
                application: {
                    open: false,
                    device: this.state.application.device
                }
            });
        }

        _handleUpdateDownload = () => {
            this.state.application.onDownload();
        }

        _handleUpdateInstall = () => {
            this.state.application.onInstall();
        }

        _handleInputLightBoxOpen = (payload) => {
            this.setState({
                inputLightbox: {
                    open         : true,
                    type         : payload.type,
                    caption      : payload.caption,
                    inputHeader  : payload.inputHeader,
                    defaultValue : payload.defaultValue,
                    maxLength    : payload.maxLength,
                    confirmText  : payload.confirmText,
                    onClose      : payload.onClose || function() {},
                    onSubmit     : payload.onSubmit || function() {}
                }
            });
        }

        _handleInputLightBoxClosed = (e, reactid, from) => {
            this.setState({
                inputLightbox: {
                    open: false
                }
            });

            if ('' === from && 'function' === typeof this.state.inputLightbox) {
                this.state.inputLightbox.onClose();
            }
            else if(from === 'cancel') {
                this.state.inputLightbox.onClose();
            }
        }

        _handleInputLightBoxSubmit = (value) => {
            return this.state.inputLightbox.onSubmit(value);
        }

        _handleProgress = (payload) => {
            var self = this,
                hasStop;

            if ('boolean' === typeof self.state.progress.hasStop) {
                hasStop = self.state.progress.hasStop;
            }
            else {
                hasStop = ('boolean' === typeof payload.hasStop ? payload.hasStop : false);
            }
            this.setState({
                progress: {
                    open: true,
                    caption: payload.caption || self.state.progress.caption || '',
                    message: payload.message || '',
                    percentage: payload.percentage || 0,
                    type: payload.type || self.state.progress.type || ProgressConstants.WAITING,
                    hasStop: hasStop,
                    onStop: payload.onStop || function() {},
                    onFinished: payload.onFinished || function() {}
                }
            }, function() {
                if (typeof payload.onOpened === 'function') {
                    payload.onOpened();
                }
            });
        }

        _handleProgressFinish = () => {
            var self = this;

            self.state.progress.onFinished();

            self.setState({
                progress: {
                    open: false,
                    onFinished: self.state.progress.onFinished
                }
            });
        }

        _handleProgressStop = (payload) => {
            GlobalActions.cancelPreview();
            (this.state.progress.onStop || function() {})();
            this.setState({
                progress: {
                    open: false,
                    onFinished: this.state.progress.onStop
                }
            });
        }

        _handleNotification = (type, message, onClickCallback, fixed) => {
            var growl;
            fixed = fixed || false;

            var types = {
                INFO: function() {
                    growl = $.growl.notice({
                        title   : lang.alert.info,
                        message : message,
                        fixed   : fixed,
                        location: 'bl'
                    });
                },

                WARNING: function() {
                    growl = $.growl.warning({
                        title   : lang.alert.warning,
                        message : message,
                        fixed   : fixed,
                        location: 'bl'
                    });
                },

                ERROR: function() {
                    growl = $.growl.error({
                        title   : lang.alert.error,
                        message : message,
                        fixed   : true,
                        location: 'bl'
                    });
                }
            };

            types[type]();
            setTimeout(function() {
                $('.growl').on('click', function() {
                    onClickCallback(growl);
                });
            }, 500);
        }

        _handleCloseNotification = () => {
            $('#growls').remove();
        }

        _handlePopup = (type, id, caption, message, customText, args, callback={}) => {
            var customTextGroup = Array.isArray(customText) ? customText : [''];
            console.log('_handlepopup_callback', callback);

            this.setState({
                showNotificationModal : true,
                type                  : type,
                sourceId              : id,
                caption               : caption,
                message               : message,
                customText            : customText,
                customTextGroup       : customTextGroup,
                args                  : args,
                callback              : callback,
                checkedCallback       : type === AlertConstants.WARNING_WITH_CHECKBOX ? args : null,
                displayImages         : (args && args.images != null),
                images                : (args && args.images != null ? args.images : [] ),
                imgClass              : (args && args.imgClass) ? args.imgClass : ''
            });
        }

        _handleClosePopup = () => {
            this.setState({ showNotificationModal: false });
        }

        _handleNotificationModalClose = (e, reactid, from) => {
            var from = from || '';

            this.setState({ showNotificationModal: false });

            if ('' === from) {
                AlertActions.notifyCancel(this.state.sourceId);
            }
        }

        _handlePopupFeedBack = (type) => {
            console.log('sourceId', this.state.sourceId);
            switch (type) {
            case 'custom':
                AlertActions.notifyCustom(this.state.sourceId);
                break;
            case 'customGroup':
                AlertActions.notifyCustomGroup(this.state.sourceId);
                break;
            case 'retry':
                AlertActions.notifyRetry(this.state.sourceId);
                break;
            case 'abort':
                AlertActions.notifyAbort(this.state.sourceId);
                break;
            case 'yes':
                AlertActions.notifyYes(this.state.sourceId, this.state.args);
                break;
            }

        }

        _handleOpenMonitor = (payload) => {
            this.setState({
                fcode: payload.fcode,
                showMonitor: true,
                selectedDevice: payload.printer,
                previewUrl: payload.previewUrl,
                monitorOpener: payload.opener
            });
        }

        _handlecloseMonitor = () => {
            this.setState({
                showMonitor: false
            });
        }

        _handleCloseAllView = () => {
            $('.device > .menu').removeClass('show');
            $('.dialog-opener').prop('checked','');
        }

        _handleSliceReport = (data) => {
            this.setState({ slicingStatus: data.report });
        }

        _renderMonitorPanel = () => {
            var content = (
                <Monitor
                    lang           = {lang}
                    selectedDevice = {this.state.selectedDevice}
                    fCode          = {this.state.fcode}
                    previewUrl     = {this.state.previewUrl}
                    slicingStatus  = {this.state.slicingStatus}
                    opener         = {this.state.monitorOpener}
                    onClose        = {this._handlecloseMonitor} />
            );
            return (
                <Modal
                    {...this.props}
                    lang    = {lang}
                    content ={content} />
            );
        }

        _renderCameraCalibration = () => {
            return (
                <CameraCalibration
                    model="beambox"
                    device={this.state.cameraCalibration.device}
                    borderless={this.state.cameraCalibration.borderless}
                    onClose={()=>{
                        this.setState({
                            cameraCalibration: {
                                open: false,
                                device: {},
                                borderless: false
                            }
                        });
                    }}
                />
            );
        }

        render() {
            var monitorPanel = this.state.showMonitor ? this._renderMonitorPanel() : '',
                filament = this.state.changeFilament.open ? this._renderChangeFilament() : '',
                headTemperature = this.state.headTemperature.show ? this._renderHeadTemperature() : '',
                cameraCalibration = this.state.cameraCalibration.open ? this._renderCameraCalibration() : '',
                latestVersion = (
                    'toolhead' === this.state.application.type ?
                    this.state.application.device.toolhead_version :
                    this.state.application.latestVersion
                );

            return (
                <div className="notification-collection">
                    {monitorPanel}

                    <UpdateDialog
                        open={this.state.application.open}
                        type={this.state.application.type}
                        device={this.state.application.device}
                        currentVersion={this.state.application.currentVersion}
                        latestVersion={latestVersion}
                        releaseNote={this.state.application.releaseNote}
                        onDownload={this._handleUpdateDownload}
                        onClose={this._handleUpdateClose}
                        onInstall={this._handleUpdateInstall}
                    />

                    <InputLightbox
                        isOpen={this.state.inputLightbox.open}
                        caption={this.state.inputLightbox.caption}
                        type={this.state.inputLightbox.type || 'TEXT_INPUT'}
                        inputHeader={this.state.inputLightbox.inputHeader}
                        defaultValue={this.state.inputLightbox.defaultValue}
                        confirmText={this.state.inputLightbox.confirmText}
                        maxLength={this.state.inputLightbox.maxLength}
                        onClose={this._handleInputLightBoxClosed}
                        onSubmit={this._handleInputLightBoxSubmit}
                    />

                    {filament}
                    {headTemperature}
                    {cameraCalibration}

                    <NotificationModal
                        lang={lang}
                        type={this.state.type || 'INFO'}
                        open={this.state.showNotificationModal}
                        caption={this.state.caption}
                        message={this.state.message}
                        customText={this.state.customText}
                        customTextGroup={this.state.customTextGroup}
                        onRetry={this._handlePopupFeedBack.bind(null, 'retry')}
                        onAbort={this._handlePopupFeedBack.bind(null, 'abort')}
                        onYes={this._handlePopupFeedBack.bind(null, 'yes')}
                        onNo={this._handlePopupFeedBack.bind(null,'no')}
                        onCustom={this._handlePopupFeedBack.bind(null, 'custom')}
                        onCustomGroup={this.state.callback}
                        checkedCallback={this.state.checkedCallback}
                        onClose={this._handleNotificationModalClose}
                        images={this.state.images}
                        displayImages={this.state.displayImages}
                        imgClass={this.state.imgClass}
                    />

                    <Progress
                        lang={lang}
                        isOpen={this.state.progress.open}
                        caption={this.state.progress.caption}
                        message={this.state.progress.message}
                        type={this.state.progress.type || 'NONSTOP'}
                        percentage={this.state.progress.percentage}
                        hasStop={this.state.progress.hasStop}
                        onStop={this._handleProgressStop}
                        onFinished={this._handleProgressFinish}
                    />
                </div>
            );
        }
    };
};
