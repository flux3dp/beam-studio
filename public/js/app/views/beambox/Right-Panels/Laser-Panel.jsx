define([
    'jquery',
    'reactPropTypes',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/constants/right-panel-constants',
    'app/stores/beambox-store',
    'jsx!contexts/DialogCaller',
    'jsx!widgets/Unit-Input-v2',
    'jsx!widgets/Button-Group',
    'jsx!widgets/Dropdown-Control',
    'jsx!widgets/Modal',
    'jsx!views/beambox/Right-Panels/Laser-Manage-Modal',
    'helpers/local-storage',
    'helpers/i18n',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'jsx!views/tutorials/Tutorial-Controller',
    'jsx!constants/tutorial-constants',
    'app/actions/beambox/constant',
    'app/actions/beambox/diode-boundary-drawer'
], function(
    $,
    PropTypes,
    BeamboxPreference,
    FnWrapper,
    RightPanelConstants,
    BeamboxStore,
    DialogCaller,
    UnitInput,
    ButtonGroup,
    DropdwonControl,
    Modal,
    LaserManageModal,
    LocalStorage,
    i18n,
    Alert,
    AlertConstants,
    TutorialController,
    TutorialConstants,
    Constant,
    DiodeBoundaryDrawer
) {
    'use strict';
    const React = require('react');
    const classNames = require('classnames');

    const LANG = i18n.lang.beambox.right_panel.laser_panel;
    const defaultLaserOptions = [
        'parameters',
        ...RightPanelConstants.laserPresetKeys,
    ];

    const functionalLaserOptions = [
        'save',
        'export',
        'import',
        'more',
    ];

    class LaserPanel extends React.Component{
        constructor(props) {
            super(props);
            this.initDefaultConfig();
            this.state = {
                speed:          this.props.speed,
                strength:       this.props.strength,
                repeat:         this.props.repeat,
                height:         this.props.height,
                zStep:          this.props.zStep,
                isDiode:        this.props.isDiode > 0,
                original:       defaultLaserOptions[0],
                modal:          '',
                selectedItem:   LocalStorage.get('customizedLaserConfigs')[0] ? LocalStorage.get('customizedLaserConfigs')[0].name : '',
                isSelectingCustomized: true
            };
        }

        componentDidMount() {
            BeamboxStore.removeAllUpdateLaserPanelListeners();
            BeamboxStore.onUpdateLaserPanel(() => this.updateData());
        }

        componentWillUnmount() {
            BeamboxStore.removeUpdateLaserPanelListener(() => this.updateData());
        }

        UNSAFE_componentWillReceiveProps(nextProps) {
            if (nextProps.configName != '') {
                if (defaultLaserOptions.indexOf(nextProps.configName) > 0 || LocalStorage.get('customizedLaserConfigs').findIndex((e) => e.name === String(nextProps.configName)) > -1) {
                    document.getElementById('laser-config-dropdown').value = nextProps.configName;
                } else {
                    document.getElementById('laser-config-dropdown').value = defaultLaserOptions[0];
                }
            } else {
                document.getElementById('laser-config-dropdown').value = defaultLaserOptions[0];
            }

            this.setState({
                speed:      nextProps.speed,
                strength:   nextProps.strength,
                repeat:     nextProps.repeat,
                height:     nextProps.height,
                zStep:      nextProps.zStep,
                isDiode:    nextProps.isDiode > 0,
                original:   defaultLaserOptions[0],
                modal:      '',
                selectedItem: LocalStorage.get('customizedLaserConfigs')[0] ? LocalStorage.get('customizedLaserConfigs')[0].name : ''
            });
        }

        initDefaultConfig = () => {
            const unit = LocalStorage.get('default-units') || 'mm';
            if (!LocalStorage.get('defaultLaserConfigsInUse') || !LocalStorage.get('customizedLaserConfigs')) {
                const defaultConfigs = defaultLaserOptions.slice(1).map( e => {
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
                let customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs') || [];
                customizedLaserConfigs = customizedLaserConfigs.filter((config) => !config.isDefault);
                customizedLaserConfigs = defaultConfigs.concat(customizedLaserConfigs);
                const defaultLaserConfigsInUse = {};
                defaultLaserOptions.forEach(e => {
                    defaultLaserConfigsInUse[e] = true;
                });
                LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                LocalStorage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
            } else {
                let customized = LocalStorage.get('customizedLaserConfigs') || [];
                const defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse') || {};
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
                const newPreset = defaultLaserOptions.slice(1).filter((option) => defaultLaserConfigsInUse[option] === undefined);
                newPreset.forEach((preset) => {
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
                });
                LocalStorage.set('customizedLaserConfigs', customized);
                LocalStorage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
            };
        }

        exportLaserConfigs = async () => {
            const targetFilePath = await DialogCaller.saveFileDialog(LANG.export_config, '', [
                {extensionName: 'JSON', extensions: ['json']}
            ], true);
            if (targetFilePath) {
                const fs = require('fs');
                const laserConfig = {};

                laserConfig.customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
                laserConfig.defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse');
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
            const res = await DialogCaller.showOpenDialog(dialogOptions);
            if (res) {
                const filePath = res[0];
                const file = await fetch(filePath);
                const fileBlob = await file.blob();
                svgEditor.importLaserConfig(fileBlob);
            }
        };

        updateData = () => {
            this.initDefaultConfig();
            this.updatePresetLayerConfig();
            const layerData = FnWrapper.getCurrentLayerData();

            this.setState({
                speed:      layerData.speed,
                strength:   layerData.power,
                repeat:     layerData.repeat,
                height:     layerData.height,
                zStep:      layerData.zStep,
                isDiode:    layerData.isDiode > 0,
            });
        }

        updatePresetLayerConfig = () => {
            const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs') || [];
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

        _handleSpeedChange = (val, unit) => {
            this.setState({speed: val});
            this.props.funcs.writeSpeed(this.props.layerName, val);
        }

        _handleStrengthChange = (val) => {
            this.setState({strength: val});
            this.props.funcs.writeStrength(this.props.layerName, val);
        }

        _handleRepeatChange = (val) => {
            this.setState({repeat: val});
            this.props.funcs.writeRepeat(this.props.layerName, val);
        }

        _toggleEnableHeight = () => {
            let val = -this.state.height;
            this.setState({height: val});
            this.props.funcs.writeHeight(this.props.layerName, val);
        }

        _handleHeightChange = (val) => {
            this.setState({height: val});
            this.props.funcs.writeHeight(this.props.layerName, val);
        }

        _handleZStepChange = (val) => {
            this.setState({zStep: val});
            this.props.funcs.writeZStep(this.props.layerName, val);
        }

        _toggleDiode = () => {
            let val = !this.state.isDiode;
            this.setState({isDiode: val});
            this.props.funcs.writeDiode(this.props.layerName, val ? 1 : 0);
        }

        _handleSaveConfig = (name) => {
            const customizedConfigs = LocalStorage.get('customizedLaserConfigs');
            if (!customizedConfigs || customizedConfigs.length < 1) {
                LocalStorage.set('customizedLaserConfigs', [{
                    name,
                    speed: this.state.speed,
                    power: this.state.strength,
                    repeat: this.state.repeat,
                    zStep: this.state.zStep,
                }]);

                this.setState({
                    selectedItem: name,
                    original: name
                }, () => {
                    document.getElementById('laser-config-dropdown').value = name;
                });
                this.props.funcs.writeConfigName(this.props.layerName, name);
            } else {
                const index = customizedConfigs.findIndex((e) => e.name === name);
                if (index < 0) {
                    LocalStorage.set('customizedLaserConfigs' ,customizedConfigs.concat([{
                        name,
                        speed: this.state.speed,
                        power: this.state.strength,
                        repeat: this.state.repeat,
                        zStep: this.state.zStep,
                    }]));
                    this.setState({ 
                        selectedItem: name,
                        original: name
                    }, () => {
                        document.getElementById('laser-config-dropdown').value = name;
                    });
                    this.props.funcs.writeConfigName(this.props.layerName, name);
                } else {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: LANG.existing_name,
                    });
                }
            }
        }

        _handleCancelModal = () => {
            document.getElementById('laser-config-dropdown').value = this.state.original;
            this.setState({ modal: '' });
        }

        _handleParameterTypeChanged = (id, value) => {
            if (value === defaultLaserOptions[0]) {
                this.setState({ original: value });
                return;
            }
            if (defaultLaserOptions.indexOf(value) > -1) {
                const model = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
                switch(model) {
                    case 'fbm1':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMO[value].speed,
                            strength: RightPanelConstants.BEAMO[value].power,
                            repeat: RightPanelConstants.BEAMO[value].repeat || 1,
                            zStep: RightPanelConstants.BEAMO[value].zStep || 0,
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMO[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMO[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, RightPanelConstants.BEAMO[value].repeat || 1);
                        this.props.funcs.writeZStep(this.props.layerName, RightPanelConstants.BEAMO[value].zStep || 0);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    case 'fbb1b':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMBOX[value].speed,
                            strength: RightPanelConstants.BEAMBOX[value].power,
                            repeat: RightPanelConstants.BEAMBOX[value].repeat || 1,
                            zStep: RightPanelConstants.BEAMBOX[value].zStep || 0,
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, RightPanelConstants.BEAMBOX[value].repeat || 1);
                        this.props.funcs.writeZStep(this.props.layerName, RightPanelConstants.BEAMBOX[value].zStep || 0);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    case 'fbb1p':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMBOX_PRO[value].speed,
                            strength: RightPanelConstants.BEAMBOX_PRO[value].power,
                            repeat: RightPanelConstants.BEAMBOX_PRO[value].repeat || 1,
                            zStep: RightPanelConstants.BEAMBOX_PRO[value].zStep || 0,
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].repeat || 1);
                        this.props.funcs.writeZStep(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].zStep || 0);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    default:
                        console.error('wrong machine', model);
                }
            } else if (value === 'save') {
                DialogCaller.promptDialog({
                    caption: LANG.dropdown.mm.save,
                    onYes: (name) => {
                        if (!name) {
                            return;
                        }
                        this._handleSaveConfig(name);
                    },
                    onCancel: () => {
                        this._handleCancelModal();
                    }
                });
            } else if (value === 'more') {
                this.setState({ modal: 'more' });
            } else if (value === 'export') {
                this.exportLaserConfigs();
                this._handleCancelModal();
            } else if (value === 'import') {
                this.importLaserConfig();
                this._handleCancelModal();
            } else {
                const customizedConfigs = LocalStorage.get('customizedLaserConfigs').find((e) => e.name === value);
                const {
                    speed,
                    power,
                    repeat,
                    zStep,
                    isDefault,
                    key
                } = customizedConfigs;

                if (customizedConfigs) {
                    this.setState({
                        original: value,
                        speed,
                        strength: power,
                        repeat,
                        zStep,
                        selectedItem: value,
                    })

                    this.props.funcs.writeSpeed(this.props.layerName, speed);
                    this.props.funcs.writeStrength(this.props.layerName, power);
                    this.props.funcs.writeRepeat(this.props.layerName, repeat);
                    this.props.funcs.writeZStep(this.props.layerName, zStep);
                    this.props.funcs.writeConfigName(this.props.layerName, value);

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
            return (
                <div className='panel'>
                    <span className='title'>{LANG.strength}</span>
                    <UnitInput
                        min={minValue}
                        max={maxValue}
                        unit="%"
                        defaultValue={this.state.strength}
                        getValue={this._handleStrengthChange}
                        decimal={1}
                        />
                    <div className="slider-container">
                        <input className={classNames('rainbow-slider')} type="range"
                            min={minValue}
                            max={maxValue}
                            step={1}
                            value={this.state.strength}
                            onChange={(e) => {this._handleStrengthChange(e.target.value)}} />
                    </div>
                </div>
            );
        }
        _renderSpeed = (hasVector, unit) => {
            const maxValue = 300;
            const minValue = 3;
            const unitDisplay = {mm: 'mm/s', inches: 'in/s'}[unit];
            const decimalDisplay = {mm: 1, inches: 2}[unit];
            return (
                <div className='panel'>
                    <span className='title'>{LANG.speed}</span>
                    <UnitInput
                        min={minValue}
                        max={maxValue}
                        unit={unitDisplay}
                        defaultValue={this.state.speed}
                        getValue={(val) => {this._handleSpeedChange(val, unit)}}
                        decimal={decimalDisplay}
                    />
                    <div className="slider-container">
                        <input className={classNames('rainbow-slider', {'speed-for-vector': hasVector})} type="range"
                            min={minValue}
                            max={maxValue}
                            step={1}
                            value={this.state.speed}
                            onChange={(e) => {this._handleSpeedChange(e.target.value)}} />
                    </div>
                </div>
            );
        }

        _renderRepeat = () => {
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
            } else {
                return null;
            }
        }

        _renderHeight = () => {
            if (!BeamboxPreference.read('enable-autofocus')
                || !Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea'))
                || this.state.height < 0
            ) {
                return null;
            }
            return (
                <div className='panel without-drag'>
                    <span className='title'>{LANG.height}</span>
                    <UnitInput
                        min={0.01}
                        max={20}
                        unit={'mm'}
                        defaultValue={this.state.height}
                        getValue={this._handleHeightChange}
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
            return (
                <div className='panel without-drag'>
                    <span className='title'>{LANG.z_step}</span>
                    <UnitInput
                        min={0}
                        max={20}
                        unit={'mm'}
                        defaultValue={this.state.zStep}
                        getValue={this._handleZStepChange}
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
            switch(model) {
                case 'fbm1':
                    speed = RightPanelConstants.BEAMO[para_name].speed;
                    power = RightPanelConstants.BEAMO[para_name].power;
                    repeat = RightPanelConstants.BEAMO[para_name].repeat || 1;
                    break;
                case 'fbb1b':
                    speed = RightPanelConstants.BEAMBOX[para_name].speed;
                    power = RightPanelConstants.BEAMBOX[para_name].power;
                    repeat = RightPanelConstants.BEAMBOX[para_name].repeat || 1;
                    break;
                case 'fbb1p':
                    speed = RightPanelConstants.BEAMBOX_PRO[para_name].speed;
                    power = RightPanelConstants.BEAMBOX_PRO[para_name].power;
                    repeat = RightPanelConstants.BEAMBOX_PRO[para_name].repeat || 1;
                    break;
            }
            return {speed, power, repeat};
        }

        _renderMoreModal = () => {
            return (
                <LaserManageModal
                    selectedItem={this.state.selectedItem}
                    initDefaultConfig = {this.initDefaultConfig}
                    onClose = {() => this._handleCancelModal()}
                    onApply = {(speed, power, repeat, zStep, selectedItem) => {
                        this.props.funcs.writeSpeed(this.props.layerName, speed);
                        this.props.funcs.writeStrength(this.props.layerName, power);
                        this.props.funcs.writeRepeat(this.props.layerName, repeat);
                        this.props.funcs.writeZStep(this.props.layerName, zStep);
                        this.props.funcs.writeConfigName(this.props.layerName, selectedItem);
                        this.setState({
                            modal: '',
                            speed,
                            strength: power,
                            repeat,
                            zStep,
                            selectedItem,
                        });
                    }}
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
            return this.props.configName || defaultLaserOptions[0];
        }

        render() {
            const layer = svgCanvas.getCurrentDrawing().getLayerByName(this.props.layerName);
            const paths = $(layer).find('path, rect, ellipse, polygon, line', 'text');
            let hasVector = false;
            for (let j = 0; j < paths.length; j++) {
                const path = paths[j],
                    fill = $(path).attr('fill'),
                    fill_op = $(path).attr('fill-opacity');
                if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fill_op === 0) {
                    hasVector = true;
                    break;
                }
            }
            const unit = LocalStorage.get('default-units') || 'mm';
            const speedPanel = this._renderSpeed(hasVector, unit);
            const strengthPanel = this._renderStrength();
            const repeatPanel = this._renderRepeat();
            const enableHeightPanel = this._renderEnableHeight();
            const heightPanel = this._renderHeight();
            const zStepPanel = this._renderZStep();
            const diodePanel = this._renderDiode();
            const modalDialog = this._renderModal();

            if (this.state.isDiode && BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
                DiodeBoundaryDrawer.show();
            } else {
                DiodeBoundaryDrawer.hide();
            }

            const defaultOptions = defaultLaserOptions.map((item) => {
                return {
                    value : item,
                    key: item,
                    label: (LANG.dropdown[unit][item] ? LANG.dropdown[unit][item] : item)
                };
            });
            const functionalOptions = functionalLaserOptions.map((item) => {
                return {
                    value : item,
                    key: item,
                    label: LANG.dropdown[unit][item]
                };
            });
            const customizedConfigs = LocalStorage.get('customizedLaserConfigs');
            const customizedOptions = (customizedConfigs || customizedConfigs.length > 0) ? customizedConfigs.map((e) => {
                return {
                    value: e.name,
                    key: e.name,
                    label: e.name
                };
            }) : null ;

            const dropdownOptions = (
                customizedOptions ?
                    [defaultOptions[0]].concat(customizedOptions).concat(functionalOptions) :
                    defaultOptions.concat(functionalOptions)
            );

            return (
                <div>
                    <div className="layername">
                        {this.props.layerName}
                    </div>
                    <div className="layerparams">
                        <DropdwonControl
                            id='laser-config-dropdown'
                            default={this._getDefaultLaserOptions()}
                            onChange={this._handleParameterTypeChanged}
                            options={dropdownOptions}
                        />
                        {strengthPanel}
                        {speedPanel}
                        {repeatPanel}
                        {enableHeightPanel}
                        {heightPanel}
                        {zStepPanel}
                        {diodePanel}
                        {modalDialog}
                    </div>
                </div>
            );
        }

    };

    LaserPanel.propTypes = {
        layerName:  PropTypes.string.isRequired,
        speed:      PropTypes.number.isRequired,
        strength:   PropTypes.number.isRequired,
        repeat:     PropTypes.number.isRequired,
        height:     PropTypes.number.isRequired,
        zStep:    PropTypes.number.isRequired,
        isDiode:    PropTypes.number.isRequired,
        funcs:      PropTypes.object.isRequired
    };

    return LaserPanel;

});
