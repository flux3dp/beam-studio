import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import Constant from 'app/actions/beambox/constant';
import DiodeBoundaryDrawer from 'app/actions/beambox/diode-boundary-drawer';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import ElectronDialogs from 'app/actions/electron-dialogs';
import RightPanelConstants from 'app/constants/right-panel-constants';
import BeamboxStore from 'app/stores/beambox-store';
import Dialog from 'app/actions/dialog-caller';
import UnitInput from 'app/widgets/Unit-Input-v2';
import DropdownControl from 'app/widgets/Dropdown-Control';
import LaserManageModal from './Laser-Manage-Modal';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';
import { DataType, getLayerConfig, getLayersConfig, writeData, CUSTOM_PRESET_CONSTANT } from 'helpers/laser-config-helper';
import { getLayerElementByName } from 'helpers/layer-helper';
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import { clearEstimatedTime } from 'app/views/beambox/Time-Estimation-Button/Time-Estimation-Button-Controller'
import * as TutorialController from 'app/views/tutorials/Tutorial-Controller';
import TutorialConstants from 'app/constants/tutorial-constants';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import sprintf from 'helpers/sprintf'
let svgCanvas, svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor });

const React = requireNode('react');
const classNames = requireNode('classnames');
const PropTypes = requireNode('prop-types');

const LANG = i18n.lang.beambox.right_panel.laser_panel;
const PARAMETERS_CONSTANT = 'parameters';
const defaultLaserOptions = [...RightPanelConstants.laserPresetKeys];
const hiddenOptions = [
    { value: PARAMETERS_CONSTANT, key: LANG.dropdown.parameters, label: LANG.dropdown.parameters},
    { value: LANG.custom_preset, key: LANG.custom_preset, label: LANG.custom_preset },
    { value: LANG.various_preset, key: LANG.various_preset, label: LANG.various_preset },
];

class LaserPanel extends React.PureComponent {
    constructor(props) {
        super(props);
        this.unit = storage.get('default-units') || 'mm';
        this.initDefaultConfig();
        this.state = {
            speed: 3,
            power: 1,
            repeat: 1,
            height: -3,
            zStep: 0,
            isDiode: false,
            didDocumentSettingsChanged: false,
        };
    }

    componentDidMount() {
        BeamboxStore.removeAllUpdateLaserPanelListeners();
        BeamboxStore.onUpdateLaserPanel(this.updateData);
    }

    componentWillUnmount() {
        BeamboxStore.removeUpdateLaserPanelListener(this.updateData);
    }

    componentDidUpdate() {
        const { didDocumentSettingsChanged } = this.state;
        if (didDocumentSettingsChanged) {
            this.setState({ didDocumentSettingsChanged: false });
        }
    }

    static getDerivedStateFromProps(props, state) {
        const { selectedLayers } = props;
        if (selectedLayers.length > 1) {
            const drawing = svgCanvas.getCurrentDrawing();
            const currentLayerName = drawing.getCurrentLayerName();
            const config = getLayersConfig(selectedLayers);
            const currentLayerConfig = getLayerConfig(currentLayerName);
            return {
                ...config,
                ...currentLayerConfig,
                isDiode: Boolean(currentLayerConfig && currentLayerConfig.diode && currentLayerConfig.diode > 0),
            }
        } else if (selectedLayers.length === 1) {
            const config = getLayerConfig(selectedLayers[0]);
            return {
                ...config,
                isDiode: Boolean(config && config.diode && config.diode > 0),
                hasMultiSpeed: false,
                hasMultiPower: false,
                hasMultiRepeat: false,
                hasMultiHeight: false,
                hasMultiZStep: false,
                hasMultiDiode: false,
                hasMultiConfigName: false,
            }
        }
        return null;
    }

    initDefaultConfig = () => {
        const unit = this.unit;
        if (!storage.get('defaultLaserConfigsInUse') || !storage.get('customizedLaserConfigs')) {
            const defaultConfigs = defaultLaserOptions.map( e => {
                const {speed, power, repeat} = this._getDefaultParameters(e);
                return {
                    name: LANG.dropdown[unit][e],
                    speed,
                    power,
                    repeat,
                    isDefault: true,
                    key: e
                }
            });
            let customizedLaserConfigs = storage.get('customizedLaserConfigs') || [];
            customizedLaserConfigs = customizedLaserConfigs.filter((config) => !config.isDefault);
            customizedLaserConfigs = defaultConfigs.concat(customizedLaserConfigs);
            const defaultLaserConfigsInUse = {};
            defaultLaserOptions.forEach(e => {
                defaultLaserConfigsInUse[e] = true;
            });
            storage.set('customizedLaserConfigs', customizedLaserConfigs);
            storage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
        } else {
            let customized: any[] = storage.get('customizedLaserConfigs') as any[] || [];
            const defaultLaserConfigsInUse = storage.get('defaultLaserConfigsInUse') || {};
            for (let i = 0; i < customized.length; i++) {
                if (customized[i].isDefault) {
                    if (defaultLaserOptions.includes(customized[i].key)) {
                        const {speed, power, repeat} = this._getDefaultParameters(customized[i].key);
                        customized[i].name = LANG.dropdown[unit][customized[i].key];
                        customized[i].speed = speed;
                        customized[i].power = power;
                        customized[i].repeat = repeat || 1;
                    } else {
                        delete defaultLaserConfigsInUse[customized[i].key];
                        customized.splice(i, 1);
                        i--;
                    }
                }
            }
            const newPreset = defaultLaserOptions.filter((option) => defaultLaserConfigsInUse[option] === undefined);
            newPreset.forEach((preset) => {
                if (defaultLaserOptions.includes(preset)) {
                    const {speed, power, repeat} = this._getDefaultParameters(preset);
                    customized.push({
                        name: LANG.dropdown[unit][preset],
                        speed,
                        power,
                        repeat,
                        isDefault: true,
                        key: preset
                    });
                    defaultLaserConfigsInUse[preset] = true;
                } else {
                    delete defaultLaserConfigsInUse[preset];
                }
            });
            storage.set('customizedLaserConfigs', customized);
            storage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
        };
    }

    exportLaserConfigs = async () => {
        const isLinux = process.platform === 'linux';
        const targetFilePath = await ElectronDialogs.saveFileDialog(LANG.export_config, isLinux ? '.json' : '', [
            {extensionName: 'JSON', extensions: ['json']}
        ], true);
        if (targetFilePath) {
            const fs = requireNode('fs');
            const laserConfig = {} as {customizedLaserConfigs: any, defaultLaserConfigsInUse: any};

            laserConfig.customizedLaserConfigs = storage.get('customizedLaserConfigs');
            laserConfig.defaultLaserConfigsInUse = storage.get('defaultLaserConfigsInUse');
            fs.writeFileSync(targetFilePath, JSON.stringify(laserConfig));
        }
    }

    importLaserConfig = async () => {
        const dialogOptions = {
            properties: ['openFile'],
            filters: [
                { name: 'JSON', extensions: ['json', 'JSON']},
            ]
        };

        const { canceled, filePaths } = await ElectronDialogs.showOpenDialog(dialogOptions);
        if (!canceled && filePaths) {
            const filePath = filePaths[0];
            const file = await fetch(filePath);
            const fileBlob = await file.blob();
            svgEditor.importLaserConfig(fileBlob);
        }
    };

    updateData = () => {
        this.initDefaultConfig();
        this.updatePresetLayerConfig();
        const layerData = FnWrapper.getCurrentLayerData();
        if ((this.state.speed !== layerData.speed) || (this.state.repeat !== layerData.repeat)) {
            clearEstimatedTime();
        }
        this.setState({
            speed:      layerData.speed,
            power:      layerData.power,
            repeat:     layerData.repeat,
            height:     layerData.height,
            zStep:      layerData.zStep,
            isDiode:    parseInt(layerData.isDiode) > 0,
            didDocumentSettingsChanged: true,
        });
    }

    updatePresetLayerConfig = () => {
        const customizedLaserConfigs: any[] = storage.get('customizedLaserConfigs') as any[] || [];
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        for (let i=0; i < layerCount; i++) {
            const layerName = drawing.getLayerName(i);
            const layer = drawing.getLayerByName(layerName);
            if (!layer) {
                continue;
            }
            const configName = layer.getAttribute('data-configName');
            const configIndex = customizedLaserConfigs.findIndex((config) => config.name === configName);
            if (configIndex >= 0) {
                const config = customizedLaserConfigs[configIndex];
                if (config.isDefault) {
                    if (defaultLaserOptions.includes(config.key)) {
                        const {speed, power, repeat} = this._getDefaultParameters(config.key);
                        layer.setAttribute('data-speed', speed);
                        layer.setAttribute('data-strength', power);
                        layer.setAttribute('data-repeat', repeat);
                    } else {
                        layer.removeAttribute('data-configName');
                    }
                }
            }
        }
    };

    _handleSpeedChange = (val) => {
        this.setState({ speed: val, configName: CUSTOM_PRESET_CONSTANT });
        clearEstimatedTime();
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.speed, val);
            writeData(layerName, DataType.configName, CUSTOM_PRESET_CONSTANT);
        });
    }

    _handleStrengthChange = (val) => {
        this.setState({ power: val, configName: CUSTOM_PRESET_CONSTANT });
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.strength, val);
            writeData(layerName, DataType.configName, CUSTOM_PRESET_CONSTANT);
        });
    }

    _handleRepeatChange = (val) => {
        this.setState({ repeat: val, configName: CUSTOM_PRESET_CONSTANT });
        clearEstimatedTime();
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.repeat, val);
            writeData(layerName, DataType.configName, CUSTOM_PRESET_CONSTANT);
        });
    }

    _toggleEnableHeight = () => {
        let val = -this.state.height;
        this.setState({ height: val });
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.height, val);
        });
    }

    _handleHeightChange = (val) => {
        this.setState({ height: val });
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.height, val);
        });
    }

    _handleZStepChange = (val) => {
        this.setState({ zStep: val, configName: CUSTOM_PRESET_CONSTANT });
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.zstep, val);
            writeData(layerName, DataType.configName, CUSTOM_PRESET_CONSTANT);
        });
    }

    _toggleDiode = () => {
        let val = !this.state.isDiode;
        this.setState({ isDiode: val });
        this.props.selectedLayers.forEach((layerName: string) => {
            writeData(layerName, DataType.diode, val ? 1 : 0);
        });
    }

    _handleSaveConfig = (name: string) => {
        const customizedConfigs = storage.get('customizedLaserConfigs') as any[];
        if (!customizedConfigs || customizedConfigs.length < 1) {
            storage.set('customizedLaserConfigs', [{
                name,
                speed: this.state.speed,
                power: this.state.power,
                repeat: this.state.repeat,
                zStep: this.state.zStep,
            }]);

            this.props.selectedLayers.forEach((layerName: string) => {
                writeData(layerName, DataType.configName, name);
            });

            this.setState({
                configName: name,
                selectedItem: name,
                original: name
            });
        } else {
            const index = customizedConfigs.findIndex((e) => e.name === name);
            if (index < 0) {
                storage.set('customizedLaserConfigs', customizedConfigs.concat([{
                    name,
                    speed: this.state.speed,
                    power: this.state.power,
                    repeat: this.state.repeat,
                    zStep: this.state.zStep,
                }]));

                this.props.selectedLayers.forEach((layerName: string) => {
                    writeData(layerName, DataType.configName, name);
                });

                this.setState({
                    configName: name,
                    selectedItem: name,
                    original: name
                });
            } else {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: LANG.existing_name,
                });
            }
        }
    }

    _handleCancelModal = () => {
        this.setState({ modal: '' });
    }

    handleParameterTypeChanged = (id, value) => {
        if (value === PARAMETERS_CONSTANT) {
            this.setState({ original: value });
            return;
        }
        if (value === 'save') {
            Dialog.promptDialog({
                caption: LANG.dropdown.save,
                onYes: (name) => {
                    name = name.trim();
                    if (!name) {
                        return;
                    }
                    this._handleSaveConfig(name);
                },
                onCancel: () => {
                    this._handleCancelModal();
                }
            });
        } else {
            const customizedConfigs = (storage.get('customizedLaserConfigs') as any[]).find((e) => e.name === value);
            if (customizedConfigs) {
                const {
                    speed,
                    power,
                    repeat,
                    zStep,
                    isDefault,
                    key
                } = customizedConfigs;
                clearEstimatedTime();
                this.setState({
                    original: value,
                    speed,
                    strength: power,
                    repeat: repeat || 1,
                    zStep: zStep || 0,
                    selectedItem: value,
                });

                this.props.selectedLayers.forEach((layerName: string) => {
                    writeData(layerName, DataType.speed, speed);
                    writeData(layerName, DataType.strength, power);
                    writeData(layerName, DataType.repeat, repeat || 1);
                    writeData(layerName, DataType.zstep, zStep || 0);
                    writeData(layerName, DataType.configName, value);
                });

                if (TutorialConstants.SET_PRESET_WOOD_ENGRAVING === TutorialController.getNextStepRequirement()) {
                    if (isDefault && ['wood_engraving'].includes(key)) {
                        TutorialController.handleNextStep();
                    } else {
                        Alert.popUp({
                            message: i18n.lang.tutorial.newUser.please_select_wood_engraving,
                        });
                    }
                }
                if (TutorialConstants.SET_PRESET_WOOD_CUTTING === TutorialController.getNextStepRequirement()) {
                    if (isDefault && ['wood_3mm_cutting', 'wood_5mm_cutting'].includes(key)) {
                        TutorialController.handleNextStep();
                    } else {
                        Alert.popUp({
                            message: i18n.lang.tutorial.newUser.please_select_wood_cutting,
                        });
                    }
                }
            } else {
                console.error('No such value', value);
            }
        }
    }

    _renderStrength = () => {
        const maxValue = 100;
        const minValue = 1;
        const hasMultipleValue = this.state.hasMultiPower;
        return (
            <div className='panel'>
                <span className='title'>{LANG.strength}</span>
                <UnitInput
                    min={minValue}
                    max={maxValue}
                    unit="%"
                    defaultValue={this.state.power}
                    getValue={this._handleStrengthChange}
                    decimal={1}
                    displayMultiValue={hasMultipleValue}
                    />
                <div className="slider-container">
                    <input className={classNames('rainbow-slider')} type="range"
                        min={minValue}
                        max={maxValue}
                        step={1}
                        value={this.state.power}
                        onChange={(e) => {this._handleStrengthChange(e.target.value)}} />
                </div>
            </div>
        );
    }
    _renderSpeed = () => {
        const hasVector = this.doLayersContainVector();
        const maxValue = 300;
        const minValue = 3;
        const unitDisplay = {mm: 'mm/s', inches: 'in/s'}[this.unit];
        const decimalDisplay = {mm: 1, inches: 2}[this.unit];
        const hasMultipleValue = this.state.hasMultiSpeed;
        return (
            <div className='panel'>
                <span className='title'>{LANG.speed}</span>
                <UnitInput
                    min={minValue}
                    max={maxValue}
                    unit={unitDisplay}
                    defaultValue={this.state.speed}
                    getValue={(val) => {this._handleSpeedChange(val)}}
                    decimal={decimalDisplay}
                    displayMultiValue={hasMultipleValue}
                />
                <div className="slider-container">
                    <input className={classNames('rainbow-slider', { 'speed-for-vector': hasVector })} type="range"
                        min={minValue}
                        max={maxValue}
                        step={1}
                        value={this.state.speed}
                        onChange={(e) => {this._handleSpeedChange(e.target.value)}} />
                </div>
                {
                    hasVector && this.state.speed > 20 && (BeamboxPreference.read('vector_speed_contraint') !== false) ?
                    <div className='speed-warning'>
                        <div className='warning-icon'>{'!'}</div>
                        <div className='warning-text'>
                            {LANG.speed_contrain_warning}
                        </div>
                    </div> :
                    null
                }
            </div>
        );
    }

    _renderRepeat = () => {
        const hasMultipleValue = this.state.hasMultiRepeat;
        return (
            <div className='panel without-drag'>
                <span className='title'>{LANG.repeat}</span>
                <UnitInput
                    min={0}
                    max={100}
                    unit={LANG.times}
                    defaultValue={this.state.repeat}
                    getValue={this._handleRepeatChange}
                    decimal={0}
                    displayMultiValue={hasMultipleValue}
                />
            </div>
        );
    }

    _renderEnableHeight = () => {
        if (BeamboxPreference.read('enable-autofocus') && Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea'))) {
            return (
                <div className='panel checkbox' onClick={() => {this._toggleEnableHeight()}}>
                    <span className='title'>{LANG.focus_adjustment}</span>
                    <input type="checkbox" checked={this.state.height > 0} onChange={()=>{}}/>
                </div>
            );
        }
        return null;
    }

    _renderHeight = () => {
        if (!BeamboxPreference.read('enable-autofocus')
            || !Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea'))
            || this.state.height < 0
        ) {
            return null;
        }
        const hasMultipleValue = this.state.hasMultiHeight;
        return (
            <div className='panel without-drag'>
                <span className='title'>{LANG.height}</span>
                <UnitInput
                    min={0.01}
                    max={20}
                    unit={'mm'}
                    defaultValue={this.state.height}
                    getValue={this._handleHeightChange}
                    displayMultiValue={hasMultipleValue}
                />
            </div>
        );
    }

    _renderZStep = () => {
        if (!BeamboxPreference.read('enable-autofocus') || this.state.repeat <= 1 || this.state.height < 0
            || !Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea'))
        ) {
            return null;
        }
        const hasMultipleValue = this.state.hasMultiZStep;
        return (
            <div className='panel without-drag'>
                <span className='title'>{LANG.z_step}</span>
                <UnitInput
                    min={0}
                    max={20}
                    unit={'mm'}
                    defaultValue={this.state.zStep}
                    getValue={this._handleZStepChange}
                    displayMultiValue={hasMultipleValue}
                />
            </div>
        );
    }

    _renderDiode = () => {
        if (BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            return (
                <div className='panel checkbox' onClick={() => {this._toggleDiode()}}>
                    <span className='title'>{LANG.diode}</span>
                    <input type="checkbox" checked={this.state.isDiode} onChange={()=>{}}/>
                </div>
            );
        } else {
            return null
        }
    }

    _getDefaultParameters = (para_name) => {
        const model = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
        let speed, power, repeat;
        const modelMap = {
            fbm1: 'BEAMO',
            fbb1b: 'BEAMBOX',
            fbb1p: 'BEAMBOX_PRO',
            fbb2b: 'BEAMBOX2',
        }
        const modelName = modelMap[model] || 'BEAMO';
        if (!RightPanelConstants[modelName][para_name]) {
            console.error(`Unable to get default preset key: ${para_name}`);
            return {speed: 20, power: 15, repeat: 1}
        }
        speed = RightPanelConstants[modelName][para_name].speed;
        power = RightPanelConstants[modelName][para_name].power;
        repeat = RightPanelConstants[modelName][para_name].repeat || 1;
        return {speed, power, repeat};
    }

    _renderMoreModal = () => {
        return (
            <LaserManageModal
                selectedItem={this.state.selectedItem}
                initDefaultConfig = {this.initDefaultConfig}
                onClose = {() => this._handleCancelModal()}
            />
        );
    }

    _renderModal = () => {
        switch(this.state.modal) {
            case 'more':
                return this._renderMoreModal();
            default:
                return null;
        }
    }

    _getDefaultLaserOptions = () => {
        const { configName, hasMultiSpeed, hasMultiPower, hasMultiRepeat, hasMultiZStep, hasMultiDiode, hasMultiConfigName } = this.state;
        const customizedConfigs = storage.get('customizedLaserConfigs') as any[] || [];
        if (hasMultiSpeed || hasMultiPower || hasMultiRepeat || hasMultiZStep || hasMultiDiode || hasMultiConfigName) {
            // multi select
            return LANG.various_preset;
        } else if (configName === CUSTOM_PRESET_CONSTANT || customizedConfigs.findIndex((config) => config.name === configName) < 0) {
            return LANG.custom_preset;
        } else if (configName) {
            return configName;
        }
        return PARAMETERS_CONSTANT;
    }

    doLayersContainVector() {
        const { selectedLayers } = this.props;
        const layers = selectedLayers.map((layerName: string) => getLayerElementByName(layerName)) as Element[];

        const doElementContainVector = (elem: Element) => {
            const vectors = elem.querySelectorAll('path, rect, ellipse, polygon, line, text');
            let ret = false;
            for (let i = 0; i < vectors.length; i++) {
                const vector = vectors[i];
                const fill = vector.getAttribute('fill');
                const fillOpacity = vector.getAttribute('fill-opacity');
                if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fillOpacity === '0') {
                    ret = true;
                    break;
                }
            }
            return ret;
        };

        let ret = false;
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (!layer) continue;
            if (doElementContainVector(layer)) {
                ret = true;
                break;
            }
            const uses = layer.querySelectorAll('use');
            for (let j = 0; j < uses.length; j++) {
                const use = uses[j];
                const href = use.getAttribute('xlink:href');
                let symbol = document.querySelector(href);
                if (symbol) {
                    const originalSymbolID = symbol.getAttribute('data-origin-symbol')
                    if (originalSymbolID) {
                        const originalSymbol = document.getElementById(originalSymbolID);
                        if (originalSymbol) symbol = originalSymbol;
                    }
                    if (symbol.getAttribute('data-wireframe') === 'true' || doElementContainVector(symbol)) {
                        ret = true;
                        break;
                    }
                }
            }
            if (ret) break;
        }
        return ret;
    }

    renderLayerParameterButtons = () => {
        return (
            <div className='layer-param-buttons'>
                <div className='left'>
                    <div className='icon-button' title={LANG.dropdown.import} onClick={() => this.importLaserConfig()}>
                        <img src={'img/right-panel/icon-import.svg'}/>
                    </div>
                    <div className='icon-button' title={LANG.dropdown.export} onClick={() => this.exportLaserConfigs()}>
                        <img src={'img/right-panel/icon-export.svg'}/>
                    </div>
                </div>
                <div className='right'>
                    <div className='icon-button' title={LANG.dropdown.more} onClick={() => this.setState({ modal: 'more' })}>
                        <img src={'img/right-panel/icon-setting.svg'}/>
                    </div>
                </div>
            </div>
        );
    }

    renderAddPresetButton() {
        const { selectedLayers } = this.props;
        const isDiabled = selectedLayers.length !== 1;
        return (
            <div className={classNames('add-preset-btn', { disabled: isDiabled })} onClick={() => {
                if (isDiabled) return;

                Dialog.promptDialog({
                    caption: LANG.dropdown.save,
                    onYes: (name) => {
                        name = name.trim();
                        if (!name) {
                            return;
                        }
                        this._handleSaveConfig(name);
                    },
                    onCancel: () => {
                        this._handleCancelModal();
                    }
                });
            }}>
                <img src={'img/icon-plus.svg'}/>
            </div>
        );
    }

    renderAddOnBlock = () => {
        const enableHeightPanel = this._renderEnableHeight();
        const heightPanel = this._renderHeight();
        const zStepPanel = this._renderZStep();
        const diodePanel = this._renderDiode();

        if (!enableHeightPanel && !diodePanel) {
            return null;
        }

        return (
            <div className='addon-block'>
                <div className='label'>{LANG.add_on}</div>
                <div className='addon-setting'>
                    {enableHeightPanel}
                    {heightPanel}
                    {zStepPanel}
                    {diodePanel}
                </div>
            </div>
        );
    }

    render() {
        const { selectedLayers } = this.props;
        let displayName = '';
        if (selectedLayers.length === 1) {
            displayName = selectedLayers[0];
        } else {
            displayName = LANG.multi_layer;
        }

        const speedPanel = this._renderSpeed();
        const strengthPanel = this._renderStrength();
        const repeatPanel = this._renderRepeat();
        const modalDialog = this._renderModal();

        if (this.state.isDiode && BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            DiodeBoundaryDrawer.show();
        } else {
            DiodeBoundaryDrawer.hide();
        }

        const customizedConfigs = storage.get('customizedLaserConfigs') as any[];
        const customizedOptions = (customizedConfigs || customizedConfigs.length > 0) ? customizedConfigs.map((e) => {
            return {
                value: e.name,
                key: e.name,
                label: e.name
            };
        }) : null ;

        let dropdownOptions: { value: string, key: string, label: string }[];
        if (customizedOptions) {
            dropdownOptions = customizedOptions;
        } else {
            dropdownOptions = defaultLaserOptions.map((item) => {
                return {
                    value : item,
                    key: item,
                    label: (LANG.dropdown[this.unit][item] ? LANG.dropdown[this.unit][item] : item)
                };
            });
        }

        return (
            <div id='laser-panel'>
                <div className="layername">
                    {sprintf(LANG.preset_setting, displayName)}
                </div>
                <div className="layerparams">
                    {this.renderLayerParameterButtons()}
                    <div className='preset-dropdown-containter'>
                        <DropdownControl
                            id='laser-config-dropdown'
                            value={this._getDefaultLaserOptions()}
                            onChange={this.handleParameterTypeChanged}
                            options={dropdownOptions}
                            hiddenOptions={hiddenOptions}
                        />
                        {this.renderAddPresetButton()}
                    </div>
                    {strengthPanel}
                    {speedPanel}
                    {repeatPanel}
                    {modalDialog}
                </div>
                {this.renderAddOnBlock()}
            </div>
        );
    }

};

LaserPanel.propTypes = {
    selectedLayers: PropTypes.array,
};

export default LaserPanel;
