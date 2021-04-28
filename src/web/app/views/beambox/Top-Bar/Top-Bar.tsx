import $ from 'jquery';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import Progress from 'app/actions/progress-caller';
import BeamboxActions from 'app/actions/beambox';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import ExportFuncs from 'app/actions/beambox/export-funcs';
import Constant from 'app/actions/beambox/constant';
import OpenBottomBoundaryDrawer from 'app/actions/beambox/open-bottom-boundary-drawer';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import Dialog from 'app/actions/dialog-caller';
import Modal from 'app/widgets/Modal';
import LeftPanel from '../Left-Panels/Left-Panel';
import { ITopBarContext, TopBarContext, TopBarContextProvider } from './contexts/Top-Bar-Context';
import { TopBarHints } from './Top-Bar-Hints';
import * as TutorialController from 'app/views/tutorials/Tutorial-Controller';
import TutorialConstants from 'app/constants/tutorial-constants';
import { IDeviceInfo } from 'interfaces/IDevice';
import AlertConfig from 'helpers/api/alert-config';
import Discover from 'helpers/api/discover';
import checkDeviceStatus from 'helpers/check-device-status';
import DeviceMaster from 'helpers/device-master';
import storage from 'helpers/storage-helper';
import sprintf from 'helpers/sprintf';
import SymbolMaker from 'helpers/symbol-maker';
import VersionChecker from 'helpers/version-checker';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgEditor = globalSVG.Editor;
});

const React = requireNode('react');
const classNames = requireNode('classnames');
const lang = i18n.lang;
const LANG = i18n.lang.topbar;
const isNotMac = process.platform !== 'darwin';
let _contextCaller;

export class TopBar extends React.Component {
    private deviceList: IDeviceInfo[];
    private state: {
        isPreviewing?: boolean,
        hasDiscoverdMachine?: boolean,
        shouldShowDeviceList?: boolean,
        deviceListType?: string|null,
        deviceListDir?: string,
        selectDeviceCallback?: (device?: IDeviceInfo) => void,
    };
    private setState: (newState: any) => void;
    private context: ITopBarContext;
    private discover: any;
    private topBarClassName: string;

    constructor() {
        super();
        this.deviceList = [];
        this.state = {
            isPreviewing: false,
            hasDiscoverdMachine: false,
            shouldShowDeviceList: false,
            deviceListDir: 'right',
            selectDeviceCallback: () => {},
        };
        this.topBarClassName = classNames('top-bar', { win: isNotMac });
    }

    componentDidMount() {
        _contextCaller = this.context;
        this.discover = Discover(
            'top-bar',
            (deviceList) => {
                const { hasDiscoverdMachine, shouldShowDeviceList } = this.state;
                deviceList = deviceList.filter((device) => device.serial !== 'XXXXXXXXXX');
                deviceList.sort((deviceA, deviceB) => deviceA.name.localeCompare(deviceB.name));
                this.deviceList = deviceList;
                if ((deviceList.length > 0) !== hasDiscoverdMachine) {
                    this.setState({hasDiscoverdMachine: deviceList.length > 0});
                }
                if (shouldShowDeviceList) {
                    this.setState(this.state);
                }
            }
        );
    }

    componentWillUnmount() {
        this.discover.removeListener('top-bar');
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
        const supportOpenBottom = Constant.addonsSupportList.openBottom.includes(BeamboxPreference.read('workarea'));
        const previewText = (borderless && supportOpenBottom) ? `${LANG.preview} ${LANG.borderless}` : LANG.preview
        return (
            <div className={classNames('preview-button-container', {previewing: isPreviewing})}>
                <div className="img-container" onClick={() => {isPreviewing ? this.showCameraPreviewDeviceList() : this.changeToPreviewMode()}}>
                    <img src="img/top-bar/icon-camera.svg" draggable={false}/>
                </div>
                {isPreviewing ? <div className="title" onClick={() => this.showCameraPreviewDeviceList()}>{previewText}</div> : null}
            </div>
        );
    }

    changeToPreviewMode = () => {
        const { setTopBarPreviewMode } = this.context;
        svgCanvas.setMode('select');

        $('#workarea').contextMenu({menu: []},()=>{});
        $('#workarea').contextmenu(() => {
            this.endPreviewMode();
            return false;
        });
        setTopBarPreviewMode(true);
        const workarea = window['workarea'];
        $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');
        this.setState({ isPreviewing: true });
        if (TutorialController.getNextStepRequirement() === TutorialConstants.TO_PREVIEW_MODE) {
            TutorialController.handleNextStep();
        }
    }

    showCameraPreviewDeviceList = () => {
        if (!PreviewModeController.isPreviewMode()) {
            this.showDeviceList('camera', (device) => {this.startPreviewModeController(device)});
        }
    }

    startPreviewModeController = async (device: IDeviceInfo) => {
        const { setTopBarPreviewMode, startPreivewCallback, setStartPreviewCallback } = this.context;
        const workarea = window['workarea'];
        if (['fbm1', 'fbb1b', 'fbb1p', 'fbb2b'].includes(device.model) && device.model !== BeamboxPreference.read('workarea')) {
            const res = await new Promise((resolve) => {
                Alert.popUp({
                    message: sprintf(lang.beambox.popup.change_workarea_before_preview, device.name),
                    buttonType: AlertConstants.YES_NO,
                    onYes: () => {
                        BeamboxPreference.write('workarea', device.model);
                        BeamboxPreference.write('model', device.model);
                        svgCanvas.setResolution(Constant.dimension.getWidth(BeamboxPreference.read('model')), Constant.dimension.getHeight(BeamboxPreference.read('model')));
                        svgEditor.resetView();
                        PreviewModeBackgroundDrawer.updateCanvasSize();
                        BeamboxActions.updateLaserPanel();
                        OpenBottomBoundaryDrawer.update();
                        resolve(true);
                    },
                    onNo: () => resolve(false),
                });
            });
            if (!res) {
                return;
            }
        }

        FnWrapper.useSelectTool();
        svgCanvas.clearSelection();
        const vc = VersionChecker(device.version);
        Progress.openNonstopProgress({
            id: 'start-preview-controller',
            message: lang.message.tryingToConenctMachine,
        });
        if (!vc.meetRequirement('USABLE_VERSION')) {
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message: lang.beambox.popup.should_update_firmware_to_continue,
            });
            Progress.popById('start-preview-controller');
            return;
        }

        if (BeamboxPreference.read('borderless') && !vc.meetRequirement('BORDERLESS_MODE')) {
            const message = `#814 ${lang.camera_calibration.update_firmware_msg1} 2.5.1 ${lang.camera_calibration.update_firmware_msg2} ${lang.beambox.popup.or_turn_off_borderless_mode}`;
            const caption = lang.beambox.left_panel.borderless_preview;
            Alert.popUp({
                type: AlertConstants.SHOW_POPUP_ERROR,
                message,
                caption
            });
            Progress.popById('start-preview-controller');
            return;
        }
        Progress.popById('start-preview-controller');

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
                        message: `${LANG.alerts.fail_to_start_preview}<br/>${errMessage}`,
                    });
                }
                setTopBarPreviewMode(false);
                this.setState({ isPreviewing: false });
                $(workarea).css('cursor', 'auto');
            });
            $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');
            if (startPreivewCallback) {
                startPreivewCallback();
                setStartPreviewCallback(null);
            }
        } catch (error) {
            console.error(error);
            if (error.message && error.message.startsWith('Camera WS')) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: `${LANG.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
                });
            } else {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: `${LANG.alerts.fail_to_start_preview}<br/>${error.message || ''}`,
                });
            }
            FnWrapper.useSelectTool();
            return;
        }
    }

    endPreviewMode = () => {
        const { setTopBarPreviewMode } = this.context;
        try {
            if (PreviewModeController.isPreviewMode()) {
                PreviewModeController.end();
            }
        } catch (error) {
            console.log(error);
        } finally {
            if (TutorialController.getNextStepRequirement() === TutorialConstants.TO_EDIT_MODE) {
                TutorialController.handleNextStep();
            }
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
        const { hasDiscoverdMachine } = this.state;
        return (
            <div className={classNames('go-button-container', {'no-machine': !hasDiscoverdMachine})} onClick={() => this.handleExportClick()}>
                { isNotMac ? <div className="go-text">{LANG.export}</div> : null}
                <div className={(classNames('go-btn'))}/>
            </div>
        );
    }

    handleExportClick = async () => {
        const { deviceList } = this;
        this.endPreviewMode();

        if (TutorialController.getNextStepRequirement() === TutorialConstants.SEND_FILE) {
            TutorialController.handleNextStep();
        }

        if (deviceList.length > 0) { // Only when there is usable machine
            const confirmed = await this.handleExportAlerts();
            if (!confirmed) {
                return;
            }
        }

        this.showDeviceList('export', (device) => {this.exportTask(device)});
    }

    handleExportAlerts = async () => {
        const layers = $('#svgcontent > g.layer').toArray();

        const isPowerTooHigh = layers.some((layer) => {
            const strength = Number(layer.getAttribute('data-strength'));
            const diode = Number(layer.getAttribute('data-diode'));
            return strength > 70 && diode !== 1;
        });
        SymbolMaker.switchImageSymbolForAll(false);
        let isTooFastForPath = false;
        const tooFastLayers = [];
        for (let i = 0; i < layers.length; ++i) {
            const layer = layers[i];
            if (parseFloat(layer.getAttribute('data-speed')) > 20 && layer.getAttribute('display') !== 'none') {
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
                            fill_op = parseFloat($(path).attr('fill-opacity'));
                    if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fill_op === 0) {
                        isTooFastForPath = true;
                        tooFastLayers.push(svgCanvas.getCurrentDrawing().getLayerName(i));
                        break;
                    }
                }
            }
        }
        SymbolMaker.switchImageSymbolForAll(true);

        if (isPowerTooHigh) {
            const confirmed = await Dialog.showConfirmPromptDialog({
                caption: LANG.alerts.power_too_high,
                message: LANG.alerts.power_too_high_msg,
                confirmValue: LANG.alerts.power_too_high_confirm,
            });
            if (!confirmed) {
                return false;
            }
        }
        if (isTooFastForPath) {
            await new Promise((resolve) => {
                if (BeamboxPreference.read('vector_speed_contraint') === false) {
                    if (!AlertConfig.read('skip_path_speed_warning')) {
                        let message = lang.beambox.popup.too_fast_for_path;
                        if (storage.get('default-units') === 'inches') {
                            message = message.replace(/20mm\/s/g, '0.8in/s');
                            console.log(message);
                        }
                        Alert.popUp({
                            message,
                            type: AlertConstants.SHOW_POPUP_WARNING,
                            checkbox: {
                                text: lang.beambox.popup.dont_show_again,
                                callbacks: () => {
                                    AlertConfig.write('skip_path_speed_warning', true);
                                    resolve(null);
                                }
                            },
                            callbacks: () => {
                                resolve(null);
                            }
                        });
                    } else {
                        resolve(null);
                    }
                } else {
                    if (!AlertConfig.read('skip_path_speed_constraint_warning')) {
                        let message = sprintf(lang.beambox.popup.too_fast_for_path_and_constrain, tooFastLayers.join(', '));
                        if (storage.get('default-units') === 'inches') {
                            message = message.replace(/20mm\/s/g, '0.8in/s');
                        }
                        Alert.popUp({
                            message,
                            type: AlertConstants.SHOW_POPUP_WARNING,
                            checkbox: {
                                text: lang.beambox.popup.dont_show_again,
                                callbacks: () => {
                                    AlertConfig.write('skip_path_speed_constraint_warning', true);
                                    resolve(null);
                                }
                            },
                            callbacks: () => {
                                resolve(null);
                            }
                        });
                    } else {
                        resolve(null);
                    }
                }
            });
        }
        return true;
    }

    exportTask = (device) => {
        const currentWorkarea = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
        const allowedWorkareas = Constant.allowedWorkarea[device.model];
        if (currentWorkarea && allowedWorkareas) {
            if (!allowedWorkareas.includes(currentWorkarea)) {
                Alert.popUp({
                    id: 'workarea unavailable',
                    message: lang.message.unavailableWorkarea,
                    type: AlertConstants.SHOW_POPUP_ERROR,
                })
                return;
            }
        }
        if (device === 'export_fcode') {
            ExportFuncs.exportFcode();
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
            ExportFuncs.uploadFcode(device);
        }
    }

    showDeviceList = (type, selectDeviceCallback, useDefaultMachine = false) => {
        const { deviceList } = this;
        if (deviceList.length > 0) {
            if (storage.get('auto_connect') !== 0 && deviceList.length === 1) {
                this.handleSelectDevice(deviceList[0], (device) => {selectDeviceCallback(device)});
                return;
            }
            this.setState({
                shouldShowDeviceList: true,
                deviceListType: type,
                selectDeviceCallback,
            });
        } else {
            Alert.popUp({
                caption: lang.alert.oops,
                message: lang.device_selection.no_beambox,
            });
        }
    }

    resetStartPreviewCallback = () => {
        const { startPreivewCallback, setStartPreviewCallback, updateTopBar } = this.context;
        if (startPreivewCallback) {
            setStartPreviewCallback(null);
            updateTopBar();
        }
    }

    hideDeviceList = () => {
        this.setState({
            shouldShowDeviceList: false,
            selectDeviceCallback: () => {}
        });
    }

    renderDeviceList() {
        const { deviceList } = this;
        const { shouldShowDeviceList, selectDeviceCallback, deviceListType } = this.state;
        if (!shouldShowDeviceList) {
            return null;
        }
        let status = lang.machine_status;
        let progress;
        let options = deviceList.map((device) => {
            let statusText = status[device.st_id] || status.UNKNOWN;

            if (device.st_prog === 0) {
                progress = '';
            }
            else if (16 === device.st_id && 'number' === typeof device.st_prog) {
                progress = (device.st_prog * 100).toFixed(1) + '%';
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
                    <label className="status">{statusText}</label>
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
            <Modal onClose={() => {
                this.resetStartPreviewCallback();
                this.hideDeviceList();
            }}>
                <div className={menuClass}>
                    <div className={classNames('arrow', {'arrow-left': deviceListType === 'camera', 'arrow-right': deviceListType === 'export'})} />
                    <div className="device-list">
                        <ul>{list}</ul>
                    </div>
                </div>
            </Modal>
        );
    }

    handleSelectDevice = async (device, callback: Function) => {
        this.hideDeviceList();
        try {
            const status = await DeviceMaster.select(device);
            if (status && status.success) {
                const res = await checkDeviceStatus(device);
                if (res) {
                    callback(device);
                }
            }
        } catch (e) {
            console.error(e);
            Alert.popUp({
                id: 'fatal-occurred',
                message: '#813' + e.toString(),
                type: AlertConstants.SHOW_POPUP_ERROR,
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

    renderHint() {
        return (
            <TopBarHints />
        );
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
        const { setShouldStartPreviewController, currentUser } = this.context;
        return (
            <div className="top-bar-left-panel-container">
                <LeftPanel
                    isPreviewing={isPreviewing}
                    user={currentUser}
                    setShouldStartPreviewController={setShouldStartPreviewController}
                    endPreviewMode={this.endPreviewMode}
                />
                <div className={this.topBarClassName}>
                    {this.renderFileName()}
                    {this.renderPreviewButton()}
                    {this.renderGoButton()}
                    {this.renderDeviceList()}
                    {this.renderElementLayerAndName()}
                    {this.renderHint()}
                </div>
            </div>
        );
    }
}

TopBar.contextType = TopBarContext;

export class TopBarContextHelper {
    static get context(): TopBarContextProvider {
        return _contextCaller;
    }
}
