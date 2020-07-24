define([
    'app/actions/default-machine',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/constants/device-constants',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/constant',
    'app/actions/beambox/preview-mode-background-drawer',
    'app/actions/beambox/preview-mode-controller',
    'jsx!widgets/Modal',
    'jsx!views/beambox/Left-Panels/Left-Panel',
    'jsx!views/beambox/Top-Bar/contexts/Top-Bar-Context',
    'jsx!views/tutorials/Tutorial-Controller',
    'app/constants/tutorial-constants',
    'helpers/api/alert-config',
    'helpers/api/discover',
    'helpers/check-device-status',
    'helpers/device-list',
    'helpers/device-master',
    'helpers/sprintf',
    'helpers/symbol-maker',
    'helpers/version-checker',
    'helpers/i18n'
], function(
    DefaultMachine,
    FnWrapper,
    Alert,
    AlertConstants,
    DeviceConstants,
    ProgressActions,
    ProgressConstants,
    BeamboxPreference,
    BottomRightFuncs,
    Constant,
    PreviewModeBackgroundDrawer,
    PreviewModeController,
    Modal,
    LeftPanel,
    { TopBarContext },
    TutorialController,
    TutorialConstants,
    AlertConfig,
    Discover,
    checkDeviceStatus,
    DeviceList,
    DeviceMaster,
    sprintf,
    SymbolMaker,
    VersionChecker,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const lang = i18n.lang;
    const LANG = i18n.lang.topbar;
    const isNotMac = process.platform !== 'darwin';

    let ret = {};

    class TopBar extends React.Component {
        constructor() {
            super();
            this.state = {
                isPreviewing: false,
                shouldShowDeviceList: false,
                deviceList: [],
                deviceListDir: 'right',
                selectDeviceCallback: () => {},
            };
        }

        componentDidMount() {
            ret.contextCaller = this.context;
        }

        componentDidUpdate() {
            const { setShouldStartPreviewController, shouldStartPreviewController } = this.context;
            if (shouldStartPreviewController) {
                this.showCameraPreviewDeviceList();
                setShouldStartPreviewController(false);
            }
        }

        renderPreviewButton = () => {
            const { isPreviewing } = this.state;
            const borderless = BeamboxPreference.read('borderless') || false;
            const previewText = borderless ? `${LANG.preview} ${LANG.borderless}` : LANG.preview
            return (
                <div className={classNames('preview-button-container', {previewing: isPreviewing})}>
                    <div className="img-container" onClick={() => {isPreviewing ? () => {} : this.changeToPreviewMode()}}>
                        <img src="img/top-bar/icon-camera.svg" draggable={false}/>
                    </div>
                    {isPreviewing ? <div className="title">{previewText}</div> : null}
                    {isPreviewing ?
                        <div className='cross-wrapper' onClick={() => {this.endPreviewMode()}}>
                            <div className="bars bar1 shadow"></div>
                            <div className="bars bar2 shadow"></div>
                            <div className="bars bar1"></div>
                        </div>
                    : null}
                </div>
            );
        }

        changeToPreviewMode = () => {
            const { setTopBarPreviewMode } = this.context;
            if (BeamboxPreference.read('should_remind_calibrate_camera')) {
                Alert.popUp({
                    type: AlertConstants.SHOW_INFO,
                    message: lang.beambox.left_panel.suggest_calibrate_camera_first,
                });
                BeamboxPreference.write('should_remind_calibrate_camera', false);
                return;
            }
            svgCanvas.setMode('select');

            $('#workarea').contextMenu({menu: []},()=>{});
            $('#workarea').contextmenu(() => {
                this.endPreviewMode();
                return false;
            });
            setTopBarPreviewMode(true);
            $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');
            this.setState({ isPreviewing: true });
            if (TutorialController.getNextStepRequirement() === TutorialConstants.TO_PREVIEW_MODE) {
                TutorialController.handleNextStep();
            }
        }

        showCameraPreviewDeviceList = () => {    
            this.showDeviceList('camera', (device) => {this.startPreviewModeController(device)}, true);
        }

        startPreviewModeController = async (device) => {
            const { setTopBarPreviewMode } = this.context;
            FnWrapper.useSelectTool();
            svgCanvas.clearSelection();
            const vc = VersionChecker(device.version);

            ProgressActions.open(ProgressConstants.NONSTOP, lang.message.tryingToConenctMachine);
            if (!vc.meetRequirement('USABLE_VERSION')) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: lang.beambox.popup.should_update_firmware_to_continue,
                });
                ProgressActions.close();
                return;
            }

            if (BeamboxPreference.read('borderless') && !vc.meetRequirement('BORDERLESS_MODE')) {
                const message = `${lang.camera_calibration.update_firmware_msg1} 2.5.1 ${lang.camera_calibration.update_firmware_msg2} ${lang.beambox.popup.or_turn_off_borderless_mode}`;
                const caption = lang.beambox.left_panel.borderless_preview;
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message,
                    caption
                });
                ProgressActions.close();
                return;
            }
            ProgressActions.close();

            $(workarea).css('cursor', 'wait');
            try {
                await PreviewModeController.start(device, (errMessage) => {
                    if (errMessage === 'Timeout has occurred') {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: LANG.alerts.start_preview_timeout,
                        });
                    } else {
                        Alert.popUp({
                            type: AlertConstants.SHOW_POPUP_ERROR,
                            message: errMessage,
                        });
                    }
                    setTopBarPreviewMode(false);
                    this.setState({ isPreviewing: false });
                    $(workarea).css('cursor', 'auto');
                });
                $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');
            } catch (error) {
                console.log(error);
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: error.message || LANG.alerts.fail_to_start_preview,
                });
                FnWrapper.useSelectTool();
                return;
            }
        }

        endPreviewMode() {
            const { setTopBarPreviewMode } = this.context;
            try {
                if (PreviewModeController.isPreviewMode()) {
                    PreviewModeController.end();
                }
            } catch (error) {
                console.log(error);
            } finally {
                FnWrapper.useSelectTool();
                $('#workarea').off('contextmenu');
                svgEditor.setWorkAreaContextMenu();
                setTopBarPreviewMode(false);
                this.setState({
                    isPreviewing: false,
                });
            }
        }

        renderGoButton = () => {
            return (
                <div className={classNames('go-button-container')} onClick={() => this.handleExportClick()}>
                    { isNotMac ? <div className="go-text">{LANG.export}</div> : null}
                    <div className={(classNames('go-btn'))}/>
                </div>
            );
        }

        handleExportClick = async () => {
            this.endPreviewMode();

            this.handleExportAlerts();
            if (TutorialController.getNextStepRequirement() === TutorialConstants.SEND_FILE) {
                TutorialController.handleNextStep();
            }
            this.showDeviceList('export', (device) => {this.exportTask(device)}, true);
        }

        handleExportAlerts = () => {
            const layers = $('#svgcontent > g.layer').toArray();

            const isPowerTooHigh = layers.some((layer) => {
                const strength = Number(layer.getAttribute('data-strength'));
                const diode = Number(layer.getAttribute('data-diode'));
                return strength > 80 && diode !== 1;
            });
            SymbolMaker.switchImageSymbolForAll(false);
            let isTooFastForPath = false;
            const tooFastLayers = [];
            for (let i = 0; i < layers.length; ++i) {
                const layer = layers[i];
                if (layer.getAttribute('data-speed') > 20 && layer.getAttribute('display') !== 'none') {
                    const paths = Array.from($(layer).find('path, rect, ellipse, polygon, line'));
                    const uses = $(layer).find('use');
                    let hasWireframe = false
                    Array.from(uses).forEach((use) => {
                        const href = use.getAttribute('xlink:href');
                        paths.push(...Array.from($(`${href}`).find('path, rect, ellipse, polygon, line')));
                        if (use.getAttribute('data-wireframe') === 'true') {
                            isTooFastForPath = true;
                            hasWireframe = true;
                            tooFastLayers.push(svgCanvas.getCurrentDrawing().getLayerName(i));
                        }
                    });
                    if (hasWireframe) {
                        break;
                    }
                    for (let j = 0; j < paths.length; j++) {
                        const path = paths[j],
                                fill = $(path).attr('fill'),
                                fill_op = $(path).attr('fill-opacity');
                        if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fill_op === 0) {
                            isTooFastForPath = true;
                            tooFastLayers.push(svgCanvas.getCurrentDrawing().getLayerName(i));
                            break;
                        }
                    }
                }
            }
            SymbolMaker.switchImageSymbolForAll(true);

            if (isPowerTooHigh && !AlertConfig.read('skip_power_warning')) {
                Alert.popUp({
                    message: lang.beambox.popup.power_too_high_damage_laser_tube,
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    checkBox: {
                        text: lang.beambox.popup.dont_show_again,
                        callbacks: () => {
                            AlertConfig.write('skip_power_warning', true);
                        }
                    }
                });
            } else if (isTooFastForPath) {
                if (BeamboxPreference.read('vector_speed_contraint') === false) {
                    if (!AlertConfig.read('skip_path_speed_warning')) {
                        let message = lang.beambox.popup.too_fast_for_path;
                        if (localStorage.getItem('default-units') === 'inches') {
                            message = message.replace(/20mm\/s/g, '0.8in/s');
                            console.log(message);
                        }
                        Alert.popUp({
                            message,
                            type: AlertConstants.SHOW_POPUP_WARNING,
                            checkBox: {
                                text: lang.beambox.popup.dont_show_again,
                                callbacks: () => {
                                    AlertConfig.write('skip_path_speed_warning', true);
                                }
                            }
                        });
                    }
                } else {
                    if (!AlertConfig.read('skip_path_speed_constraint_warning')) {
                        let message = sprintf(lang.beambox.popup.too_fast_for_path_and_constrain, tooFastLayers.join(', '));
                        if (localStorage.getItem('default-units') === 'inches') {
                            message = message.replace(/20mm\/s/g, '0.8in/s');
                        }
                        Alert.popUp({
                            message,
                            type: AlertConstants.SHOW_POPUP_WARNING,
                            checkBox: {
                                text: lang.beambox.popup.dont_show_again,
                                callbacks: () => {
                                    AlertConfig.write('skip_path_speed_constraint_warning', true);
                                }
                            }
                        });
                    }
                }
            }
            return;
        }

        exportTask = (device) => {
            const currentWorkarea = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
            const allowedWorkareas = Constant.allowedWorkarea[device.model];
            if (currentWorkarea && allowedWorkareas) {
                if (!allowedWorkareas.includes(currentWorkarea)) {
                    ProgressActions.close();
                    Alert.popUp({
                        id: 'workarea unavailable',
                        message: lang.message.unavailableWorkarea,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                    })
                    return;
                }
            }
            if (device === 'export_fcode') {
                BottomRightFuncs.exportFcode();
                return;
            }
            const vc = VersionChecker(device.version);
            if (!vc.meetRequirement('USABLE_VERSION')) {
                console.error('Not a valid firmware version');
                Alert.popUp({
                    id: 'fatal-occurred',
                    message: lang.beambox.popup.should_update_firmware_to_continue,
                    type: AlertConstants.SHOW_POPUP_ERROR,
                });
                return;
            } else {
                BottomRightFuncs.uploadFcode(device);
            }
        }

        showDeviceList = (type, selectDeviceCallback, useDefaultMachine = false) => {
            this.discover = Discover(
                'top-bar',
                (machines) => {
                    machines = DeviceList(machines);
                    if (useDefaultMachine) {
                        const defaultMachine = DefaultMachine.get();
                        if (DefaultMachine.exist()) {
                            for (let i=0; i < machines.length; i++) {
                                if (defaultMachine.uuid === machines[i].uuid) {
                                    this.handleSelectDevice(machines[i], (device) => {selectDeviceCallback(device)});
                                }
                            }
                        }
                    }
                    this.setState({deviceList: machines});
                }
            );
            this.waitForMachine();
            this.setState({
                shouldShowDeviceList: true,
                deviceListType: type,
                selectDeviceCallback
            });
        }

        hideDeviceList = () => {
            this.discover.removeListener('top-bar');
            this.setState({
                shouldShowDeviceList: false,
                selectDeviceCallback: () => {}
            });
        }

        renderDeviceList() {
            const { shouldShowDeviceList, deviceList, selectDeviceCallback, deviceListType } = this.state;
            if (!shouldShowDeviceList) {
                return null;
            }
            let status = lang.machine_status;
            let headModule = lang.head_module;
            let progress;
            let options = deviceList.map((device) => {
                let statusText = status[device.st_id] || status.UNKNOWN;
                let headText = headModule[device.head_module] || headModule.UNKNOWN;

                if (device.st_prog === 0) {
                    progress = '';
                }
                else if (16 === device.st_id && 'number' === typeof device.st_prog) {
                    progress = (parseInt(device.st_prog * 1000) * 0.1).toFixed(1) + '%';
                }
                else {
                    progress = '';
                }

                let img = `img/icon_${device.source === 'h2h' ? 'usb' : 'wifi'}.svg`;

                return (
                    <li
                        key={device.uuid}
                        name={device.uuid}
                        onClick={() => {this.handleSelectDevice(device, (device) => {selectDeviceCallback(device)})}}
                        data-test-key={device.serial}
                    >
                        <label className="name">{device.name}</label>
                        <label className="status">{headText} {statusText}</label>
                        <label className="progress">{progress}</label>
                        <label className="connection-type">
                            <div className="type">
                                <img src={img} />
                            </div>
                        </label>
                    </li>
                );
            });

            let list = (0 < options.length) ? options : (<div key="spinner-roller" className="spinner-roller spinner-roller-reverse" />);
            const menuClass = classNames('menu', deviceListType);
            return (
                <Modal onClose={() => this.hideDeviceList()}>
                    <div className={menuClass}>
                        <div className={classNames('arrow', {'arrow-left': deviceListType === 'camera', 'arrow-right': deviceListType === 'export'})} />
                        <div className="device-list">
                            <ul>{list}</ul>
                        </div>
                    </div>
                </Modal>
            );
        }

        handleSelectDevice = async (device, callback) => {
            this.hideDeviceList();
            ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, lang.initialize.connecting);
            device = DeviceMaster.usbDefaultDeviceCheck(device);
            try {
                const status = await DeviceMaster.selectDevice(device);
                if (status === DeviceConstants.CONNECTED) {
                    ProgressActions.open(ProgressConstants.NONSTOP);
                    await checkDeviceStatus(device);
                    ProgressActions.close();
                    callback(device);
                }
                else if (status === DeviceConstants.TIMEOUT) {
                    ProgressActions.close();
                    Alert.popUp({
                        id: _id,
                        message: lang.message.connectionTimeout,
                        type: AlertConstants.SHOW_POPUP_ERROR,
                    });
                }
            } catch (e) {
                console.error(e.toString());
                ProgressActions.close();
                Alert.popUp({
                    id: 'fatal-occurred',
                    message: e.toString(),
                    type: AlertConstants.SHOW_POPUP_ERROR,
                });
            }
        }

        waitForMachine = () => {
            if (this.waitForMachineTimeout) {
                clearTimeout(this.waitForMachineTimeout);
            }
            this.waitForMachineTimeout = setTimeout(() => this.openNoMachineAlert(), 5000);
        }

        openNoMachineAlert = () => {
            this.waitForMachineTimeout = null;
            const { deviceList, shouldShowDeviceList } = this.state;
            if (0 === deviceList.length && shouldShowDeviceList) {
                Alert.popUp({
                    id: 'no-machine',
                    message: lang.device_selection.no_beambox,
                    buttonType: AlertConstants.RETRY_CANCEL,
                    onRetry: () => {this.waitForMachine()}
                });
            }
        }

        renderFileName() {
            if (process.platform === 'win32') {
                return null;
            } else {
                const { fileName, hasUnsavedChange } = this.context;
                const titleText = (fileName || LANG.untitled) + (hasUnsavedChange ? '*' : '');
                return (
                    <div className="file-title">
                        {titleText}
                    </div>
                );
            }
        }

        renderElementLayerAndName() {
            const { selectedElem } = this.context;
            let content = '';
            try {
                if (selectedElem) {
                    if (selectedElem.getAttribute('data-tempgroup') === 'true') {
                        content = LANG.tag_names.multi_select;
                    } else {
                        const layer = svgCanvas.getObjectLayer(selectedElem);
                        const layerName = layer ? layer.title : '';
                        if (selectedElem.tagName !== 'use') {
                            content = `${layerName} > ${LANG.tag_names[selectedElem.tagName]}`;
                        } else {
                            if (selectedElem.getAttribute('data-svg') === 'true') {
                                content = `${layerName} > ${LANG.tag_names.svg}`;
                            } else if (selectedElem.getAttribute('data-dxf') === 'true') {
                                content = `${layerName} > ${LANG.tag_names.dxf}`;
                            } else {
                                content = `${layerName} > ${LANG.tag_names.use}`;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
            if (!content) {
                return null
            }
            return (
                <div className="element-title">
                    {content}
                </div>
            );
        }

        render() {
            const { isPreviewing } = this.state;
            const { setShouldStartPreviewController } = this.context;
            return (
                <div className="top-bar-left-panel-container">
                    <LeftPanel
                        isPreviewing={isPreviewing}
                        setShouldStartPreviewController={setShouldStartPreviewController}
                        endPreviewMode={() => this.endPreviewMode()}
                        />
                    <div className={classNames('top-bar', {win: isNotMac})}>
                        {this.renderFileName()}
                        {this.renderPreviewButton()}
                        {this.renderGoButton()}
                        {this.renderDeviceList()}
                        {this.renderElementLayerAndName()}
                    </div>
                </div>
            );
        }
    }
    TopBar.contextType = TopBarContext;
    ret.TopBar = TopBar;
    return ret;

});
