define([
    'jquery',
    'jsx!widgets/Modal',
    'jsx!views/beambox/Left-Panels/Clear-Preview-Graffiti-Button',
    'jsx!views/beambox/Left-Panels/Image-Trace-Button',
    'jsx!views/Printer-Selector',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/actions/beambox/preview-mode-background-drawer',
    'app/actions/beambox/preview-mode-controller',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox',
    'app/actions/global-actions',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/stores/beambox-store',
    'jsx!app/actions/beambox/Image-Trace-Panel-Controller',
    'plugins/classnames/index',
    'helpers/shortcuts',
    'helpers/version-checker',
    'helpers/api/config',
    'helpers/i18n',
], function(
    $,
    Modal,
    ClearPreviewGraffitiButton,
    ImageTraceButton,
    PrinterSelector,
    Alert,
    AlertConstants,
    FnWrapper,
    PreviewModeBackgroundDrawer,
    PreviewModeController,
    BeamboxPreference,
    BeamboxActions,
    GlobalActions,
    ProgressActions,
    ProgressConstants,
    BeamboxStore,
    ImageTracePanelController,
    classNames,
    shortcuts,
    VersionChecker,
    Config,
    i18n
) {
    const React = require('react');
    const ReactDOM = require('react-dom');

    const LANG = i18n.lang.beambox.left_panel;

    return class PreviewButton extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                isPreviewMode: false,
                isImageTraceMode: false,
                isDrawing: false,
                isDrawn: false
            };
        }

        componentDidMount() {
            BeamboxStore.onStartDrawingPreviewBlob(() => this.startDrawing());
            BeamboxStore.onEndDrawingPreviewBlob(() => this.endDrawing());
            BeamboxStore.onClearCameraCanvas(() => this.hideImageTraceButton());
            BeamboxStore.onEndImageTrace(() => {
                this.endImageTrace();
                this.endPreviewMode();
            });
            BeamboxStore.onResetPreviewButton(() => this.resetPreviewButton());
        }

        componentWillUnmount() {
            BeamboxStore.removeStartDrawingPreviewBlobListener(() => this.startDrawing());
            BeamboxStore.removeEndDrawingPreviewBlobListener(() => this.endDrawing());
            BeamboxStore.removeClearCameraCanvasListener(() => this.hideImageTraceButton())
            BeamboxStore.removeEndImageTraceListener(() => this.endImageTrace());
            BeamboxStore.removeResetPreviewButton(() => this.resetPreviewButton());
        }

        endImageTrace() {
            this.setState({
                isPreviewMode: false,
                isImageTraceMode: false
            });
        }

        hideImageTraceButton() {
            this.setState({ isDrawn: false });
        }

        handleImageTraceClick() {
            try {
                if (this.state.isPreviewMode) {
                    PreviewModeController.end();
                }
            } catch (error) {
                console.log(error);
            } finally {
                FnWrapper.enterPreviewMode();
                FnWrapper.clearSelection();
                BeamboxActions.closeInsertObjectSubmenu();
                GlobalActions.monitorClosed();
                this.setState({
                    isPreviewMode: false,
                    isImageTraceMode: true
                });
            }
        }

        endDrawing() {
            this.setState({ isDrawing: false, isDrawn: true });
        }

        startDrawing() {
            this.setState({ isDrawing: true, isDrawn: false });
        }

        _handlePreviewClick() {
            if (!document.getElementById('image-trace-panel-outer')) {
                ImageTracePanelController.render();
            }

            const tryToStartPreviewMode = async () => {

                const isAlreadyRemindUserToCalibrateCamera = () => {
                    return !BeamboxPreference.read('should_remind_calibrate_camera');
                };

                const remindCalibrateCamera = () => {
                    Alert.popUp({
                        type: AlertConstants.SHOW_INFO,
                        message: LANG.suggest_calibrate_camera_first,
                    });
                    BeamboxPreference.write('should_remind_calibrate_camera', false);
                };

                const isFirmwareVersionValid = (device) => {
                    const vc = VersionChecker(device.version);
                    return vc.meetRequirement('USABLE_VERSION');
                };

                const alertUserToUpdateFirmware = () => {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: i18n.lang.beambox.popup.should_update_firmware_to_continue,
                    });
                };

                const isFirmwareBorderlessAvailable = (device) => {
                    const isAvailableVersion = function(version, targetVersion) {
                        version = version.split('.').map(i => parseInt(i));
                        targetVersion = targetVersion.split('.').map(i => parseInt(i));
                        for (let i = 0; i < Math.min(version.length, targetVersion.length); ++i) {
                            if(version[i] > targetVersion[i]) {
                                return true;
                            } else if (targetVersion[i] > version[i]) {
                                return false;
                            }
                        }
                        return true;
                    }(device.version, '2.5.1');
                    return isAvailableVersion;
                }

                // return device or false
                const getDeviceToUse = async () => {
                    const d = $.Deferred();
                    const root = document.getElementById('printer-selector-placeholder');
                    const button = $('.preview-btn');
                    const top = button.position().top - button.height() / 2;
                    const printerSelector = (
                        <Modal onClose={d.reject}>
                            <PrinterSelector
                                uniqleId='laser'
                                className='preview-printer-selector'
                                modelFilter={PrinterSelector.BEAMBOX_FILTER}
                                onClose={d.reject}
                                onGettingPrinter={device => d.resolve(device)}
                                WindowStyle={{
                                    top: `${top}px`,
                                    left: '80px'
                                }}
                                arrowDirection='left'
                            />
                        </Modal>
                    );
                    try {
                        ReactDOM.render(printerSelector, root);
                        const device = await d;
                        ReactDOM.unmountComponentAtNode(root);
                        return device;
                    } catch (error) {
                        console.log(error);
                        ReactDOM.unmountComponentAtNode(root);
                        return false;
                    }
                };

                const startPreviewMode = async (device) => {
                    const errorCallback = (errMessage) => {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: errMessage,
                        });
                        this.setState({ isPreviewMode: false });
                        $(workarea).css('cursor', 'auto');
                    };

                    $(workarea).css('cursor', 'wait');

                    try {
                        await PreviewModeController.start(device, errorCallback);
                        $('.tool-btn').removeClass('active');
                        this.setState({ isPreviewMode: true });
                        $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');

                    } catch (error) {
                        console.log(error);
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: error.message || 'Fail to start preview mode',
                        });
                        FnWrapper.useSelectTool();
                    }
                };


                // MAIN PROCESS HERE

                FnWrapper.useSelectTool();
                if (!isAlreadyRemindUserToCalibrateCamera()) {
                    remindCalibrateCamera();
                    return;
                }

                const device = await getDeviceToUse();
                if (!device) {
                    return;
                };

                if (BeamboxPreference.read('borderless')) {
                    if (!isFirmwareBorderlessAvailable(device)) {
                        const message = `${i18n.lang.camera_calibration.update_firmware_msg1} 2.5.1 ${i18n.lang.camera_calibration.update_firmware_msg2} ${i18n.lang.beambox.popup.or_turn_off_borderless_mode}`;
                        const caption = i18n.lang.beambox.left_panel.borderless_preview;
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message,
                            caption
                        });
                        return;
                    }
                }

                ProgressActions.open(ProgressConstants.NONSTOP, i18n.lang.message.tryingToConenctMachine);
                if (!(isFirmwareVersionValid(device))) {
                    alertUserToUpdateFirmware();
                    ProgressActions.close();
                    return;
                }

                ProgressActions.close();
                await startPreviewMode(device);
                this.props.passEndPreview(this.endPreviewMode.bind(this));
                shortcuts.on(['esc'], this.endPreviewMode.bind(this));
                const self = this;
                $('#workarea').contextMenu({
                    menu: []
                    },
                    ()=>{}
                );
                $('#workarea').contextmenu(function() {
                    //console.log(self.endPreviewMode);
                    self.endPreviewMode();
                    return false;
                });
                ClearPreviewGraffitiButton.activate(this.endPreviewMode.bind(this));
            };


            FnWrapper.clearSelection();
            BeamboxActions.closeInsertObjectSubmenu();
            GlobalActions.monitorClosed();

            if(!this.state.isPreviewMode) {
                tryToStartPreviewMode();
            } else {
                this.endPreviewMode();
            }
        }

        _renderImageTraceButton() {
            if(this.state.isImageTraceMode) {
                return ;
            } else {
                return null;
            }
        }

        resetPreviewButton() {
            FnWrapper.useSelectTool();
            this.setState({
                isPreviewMode: false,
                isImageTraceMode: false
            });
        }

        endPreviewMode() {
            try {
                if (PreviewModeController.isPreviewMode()) {
                    PreviewModeController.end();
                }
            } catch (error) {
                console.log(error);
            } finally {
                ClearPreviewGraffitiButton.deactivate();
                if (PreviewModeBackgroundDrawer.isClean()) {
                    ClearPreviewGraffitiButton.hide();
                }
                this.resetPreviewButton();
                this.props.passEndPreview(()=>{});
                shortcuts.off(['esc']);
                $('#workarea').off('contextmenu');
                svgEditor.setWorkAreaContextMenu();
            }
        }

        render() {
            const {
                isPreviewMode,
                isImageTraceMode,
                isDrawing,
                isDrawn
            } = this.state;
            const imageTraceActive = !(PreviewModeBackgroundDrawer.isClean() || isDrawing);
            const imageTraceShow = (isPreviewMode || !PreviewModeBackgroundDrawer.isClean());
            const borderless = BeamboxPreference.read('borderless') || false;
            const ImageTrace = (<ImageTraceButton
                onClick={imageTraceActive ? () => this.handleImageTraceClick() : () => {}}
                active={imageTraceActive}
                show={imageTraceShow}
                />)
            return (
                <div className='preview'>
                    <div
                        className={classNames('tool-btn', 'preview-btn', {'active': isPreviewMode})}
                        onClick={() => this._handlePreviewClick()}
                        title={LANG.label.preview}
                    >
                        <img src={'img/left-bar/icon-camera.svg'} draggable="false"/>
                    </div>
                    <span id='printer-selector-placeholder' />
                    <div
                        id='clear-preview-graffiti-button-placeholder'
                        className={`hide  ${borderless ? 'borderless' : ''}`}
                        onClick={this.endPreviewMode.bind(this)}
                    >
                        <img src={'img/left-bar/icon-camera.svg'}/>
                        <div className={`text`}>{`${LANG.preview} ${borderless ? LANG.borderless : ''}`}&nbsp;&nbsp;×</div>
                    </div>
                    {ImageTrace}
                </div>
            );
        }
    };
});
