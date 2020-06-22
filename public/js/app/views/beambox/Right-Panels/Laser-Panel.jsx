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
    DiodeBoundaryDrawer
) {
    'use strict';
    const React = require('react');
    const classNames = require('classnames');

    const LANG = i18n.lang.beambox.right_panel.laser_panel;
    const defaultLaserOptions = [
        'parameters',
        'wood_3mm_cutting',
        'wood_5mm_cutting',
        'wood_bw_engraving',
        'wood_shading_engraving',
        'acrylic_3mm_cutting',
        'acrylic_5mm_cutting',
        'acrylic_bw_engraving',
        'acrylic_shading_engraving',
        'leather_3mm_cutting',
        'leather_5mm_cutting',
        'leather_bw_engraving',
        'leather_shading_engraving',
        'fabric_3mm_cutting',
        'fabric_5mm_cutting',
        'fabric_bw_engraving',
        'fabric_shading_engraving',
        'rubber_bw_engraving',
        'glass_bw_engraving',
        'metal_bw_engraving'
    ];

    const functionalLaserOptions = [
        'save',
        'more'
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
            BeamboxStore.onUpdateLaserPanel(() => this.updateData());
        }

        componentWillUnmount() {
            BeamboxStore.removeUpdateLaserPanelListener(() => this.updateData());
        }

        UNSAFE_componentWillReceiveProps(nextProps) {
            if (nextProps.configName != '') {
                if (defaultLaserOptions.indexOf(nextProps.configName) > 0 || LocalStorage.get('customizedLaserConfigs').findIndex((e) => e.name === nextProps.configName) > -1) {
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
            const unit = localStorage.getItem('default-units') || 'mm';
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
                const model = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
                for (let i = 0; i < customized.length; i++) {
                    if (customized[i].isDefault) {
                        customized[i].name = LANG.dropdown[unit][customized[i].key];
                        switch(model) {
                            case 'fbm1':
                                customized[i].speed = RightPanelConstants.BEAMO[customized[i].key].speed;
                                customized[i].power = RightPanelConstants.BEAMO[customized[i].key].power;
                                customized[i].repeat = RightPanelConstants.BEAMO[customized[i].key].repeat || 1;
                                break;
                            case 'fbb1b':
                                customized[i].speed = RightPanelConstants.BEAMBOX[customized[i].key].speed;
                                customized[i].power = RightPanelConstants.BEAMBOX[customized[i].key].power;
                                customized[i].repeat = RightPanelConstants.BEAMBOX[customized[i].key].repeat || 1;
                                break;
                            case 'fbb1p':
                                customized[i].speed = RightPanelConstants.BEAMBOX_PRO[customized[i].key].speed;
                                customized[i].power = RightPanelConstants.BEAMBOX_PRO[customized[i].key].power;
                                customized[i].repeat = RightPanelConstants.BEAMBOX_PRO[customized[i].key].repeat || 1;
                                break;
                        }
                    }
                }
                LocalStorage.set('customizedLaserConfigs', customized);
            };
        }

        updateData = () => {
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

        _handleSpeedChange = (val, unit) => {
            if (unit === 'inches') {
                val *= 25.4;
            }
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
                            repeat: RightPanelConstants.BEAMO[value].repeat || 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMO[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMO[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, RightPanelConstants.BEAMO[value].repeat || 1);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    case 'fbb1b':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMBOX[value].speed,
                            strength: RightPanelConstants.BEAMBOX[value].power,
                            repeat: RightPanelConstants.BEAMBOX[value].repeat || 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, RightPanelConstants.BEAMBOX[value].repeat || 1);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    case 'fbb1p':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMBOX_PRO[value].speed,
                            strength: RightPanelConstants.BEAMBOX_PRO[value].power,
                            repeat: RightPanelConstants.BEAMBOX_PRO[value].repeat || 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].repeat || 1);
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
            } else {
                const customizedConfigs = LocalStorage.get('customizedLaserConfigs').find((e) => e.name === value);
                const {
                    speed,
                    power,
                    repeat
                } = customizedConfigs;

                if (customizedConfigs) {
                    this.setState({
                        original: value,
                        speed,
                        strength: power,
                        repeat
                    })

                    this.props.funcs.writeSpeed(this.props.layerName, speed);
                    this.props.funcs.writeStrength(this.props.layerName, power);
                    this.props.funcs.writeRepeat(this.props.layerName, repeat);
                    this.props.funcs.writeConfigName(this.props.layerName, value);

                } else {
                    console.error('No such value', value);
                }
            }
        }

        _renderStrength = () => {
            const maxValue = 100;
            const minValue = 1;
            const onSlideBarClick = (e) => {
                const l = $('.rainbow-sidebar').offset().left;
                const w = $('.rainbow-sidebar').width();
                const newValue = Math.round(((e.clientX - l) / w * (maxValue - minValue) + minValue) * 10) / 10;
                this._handleStrengthChange(newValue);
            };
            const _handleDrag = (e) => {
                const l = $('.rainbow-sidebar').offset().left;
                const w = $('.rainbow-sidebar').width();
                const x = e.clientX;
                if (x < l || x > w + l) {
                    return;
                }
                let newValue = Math.round(((x - l) / w * (maxValue - minValue) + minValue) * 10) / 10;
                this._handleStrengthChange(newValue);
            };
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
            const maxValueDisplay = {mm: 300, inches: 12}[unit];
            const minValueDisplay = {mm: 3, inches: 0.118}[unit];
            const unitDisplay = {mm: 'mm/s', inches: 'in/s'}[unit];
            const valueDisplay = this.state.speed / {mm: 1, inches: 25.4}[unit];
            const decimalDisplay = {mm: 1, inches: 2}[unit];
            return (
                <div className='panel'>
                    <span className='title'>{LANG.speed}</span>
                    <UnitInput
                        min={minValueDisplay}
                        max={maxValueDisplay}
                        unit={unitDisplay}
                        defaultValue={valueDisplay}
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
            if (!BeamboxPreference.read('enable-autofocus')) {
                return null;
            }
            return (
                <div className='panel checkbox' onClick={() => {this._toggleEnableHeight()}}>
                    <span className='title'>{LANG.focus_adjustment}</span>
                    <input type="checkbox" checked={this.state.height > 0} onChange={()=>{}}/>
                </div>
            );
        }

        _renderHeight = () => {
            if (!BeamboxPreference.read('enable-autofocus') || this.state.height < 0) {
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
                        decimal={2}
                    />
                </div>
            );
        }

        _renderZStep = () => {
            if (!BeamboxPreference.read('enable-autofocus') || this.state.repeat <= 1 || this.state.height < 0) {
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
                        decimal={2}
                    />
                </div>
            );
        }

        _renderDiode = () => {
            if (!BeamboxPreference.read('enable-diode')) {
                return null;
            }
            return (
                <div className='panel checkbox' onClick={() => {this._toggleDiode()}}>
                    <span className='title'>{LANG.diode}</span>
                    <input type="checkbox" checked={this.state.isDiode} onChange={()=>{}}/>
                </div>
            );
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
                    _handleCancelModal = {this._handleCancelModal}
                    onClose = {() => this.setState({modal: ''})}
                    onApply = {(speed, power, repeat, selectedItem) => {
                        this.props.funcs.writeSpeed(this.props.layerName, speed);
                        this.props.funcs.writeStrength(this.props.layerName, power);
                        this.props.funcs.writeRepeat(this.props.layerName, repeat);
                        this.setState({
                            modal: '',
                            speed: speed,
                            strength: power,
                            repeat: repeat,
                            selectedItem: selectedItem
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
            const unit = localStorage.getItem('default-units') || 'mm';
            const speedPanel = this._renderSpeed(hasVector, unit);
            const strengthPanel = this._renderStrength();
            const repeatPanel = this._renderRepeat();
            const enableHeightPanel = this._renderEnableHeight();
            const heightPanel = this._renderHeight();
            const zStepPanel = this._renderZStep();
            const diodePanel = this._renderDiode();
            const modalDialog = this._renderModal();

            if (this.state.isDiode) {
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
                            default={defaultLaserOptions[0]}
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
