define([
    'jquery',
    'react',
    'reactClassset',
    'reactDOM',
    'reactPropTypes',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/constants/right-panel-constants',
    'app/stores/beambox-store',
    'jsx!widgets/Unit-Input-v2',
    'jsx!widgets/Button-Group',
    'jsx!widgets/Dropdown-Control',
    'jsx!widgets/List',
    'jsx!widgets/Modal',
    'helpers/local-storage',
    'helpers/i18n',
    'plugins/classnames/index',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/preview-mode-controller',
    'jsx!views/Printer-Selector',
    'app/actions/alert-actions',
    'app/actions/beambox/beambox-version-master'
], function(
    $,
    React,
    ReactCx,
    ReactDOM,
    PropTypes,
    BeamboxPreference,
    FnWrapper,
    RightPanelConstants,
    BeamboxStore,
    UnitInput,
    ButtonGroup,
    DropdwonControl,
    List,
    Modal,
    LocalStorage,
    i18n,
    ClassNames,
    BottomRightFuncs,
    PreviewModeController,
    PrinterSelector,
    AlertActions,
    BeamboxVersionMaster
) {
    'use strict';

    const LANG = i18n.lang.beambox.right_panel.laser_panel;
    const LANG2 = i18n.lang;
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
    ]

    return React.createClass({
        propTypes: {
            layerName:  PropTypes.string.isRequired,
            speed:      PropTypes.number.isRequired,
            strength:   PropTypes.number.isRequired,
            repeat:     PropTypes.number.isRequired,
            height:     PropTypes.number.isRequired,
            isDiode:    PropTypes.number.isRequired,
            funcs:      PropTypes.object.isRequired
        },

        getInitialState: function() {
            //this._handleStartClick = this._handleStartClick.bind(this);
            //this._renderPrinterSelectorWindow = this._renderPrinterSelectorWindow.bind(this);

            if (!LocalStorage.get('defaultLaserConfigsInUse')) {
                const defaultConfigs = defaultLaserOptions.slice(1).map( e => {
                    const {speed, power, repeat} = this._getDefaultParameters(e);
                    return {
                        name: LANG.dropdown[e],
                        speed,
                        power,
                        repeat,
                        isDefault: true,
                        key: e
                    }
                });
                let customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs') || [];
                customizedLaserConfigs = defaultConfigs.concat(customizedLaserConfigs);
                const defaultLaserConfigsInUse = {};
                defaultLaserOptions.forEach(e => {
                    defaultLaserConfigsInUse[e] = true;
                });
                LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                LocalStorage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
            } else {
                let customized = LocalStorage.get('customizedLaserConfigs');
                const model = BeamboxPreference.read('model');
                for (let i = 0; i < customized.length; i++) {
                    if (customized[i].isDefault) {
                        customized[i].name = LANG.dropdown[customized[i].key];
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
            }

            return {
                speed:          this.props.speed,
                strength:       this.props.strength,
                repeat:         this.props.repeat,
                height:         this.props.height,
                isDiode:        this.props.isDiode > 0,
                original:       defaultLaserOptions[0],
                modal:          '',
                isPrinterSelectorOpen: false,
                selectedItem:   LocalStorage.get('customizedLaserConfigs')[0] ? LocalStorage.get('customizedLaserConfigs')[0].name : '',
                isSelectingCustomized: true
            };
        },

        componentDidMount() {
            BeamboxStore.onUpdateLaserPanel(() => this.updateData());
        },

        componentWillUnmount() {
            BeamboxStore.removeUpdateLaserPanelListener(() => this.updateData());
        },

        componentWillReceiveProps: function(nextProps) {
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
                isDiode:    nextProps.isDiode > 0,
                original:   defaultLaserOptions[0],
                modal:      '',
                selectedItem: LocalStorage.get('customizedLaserConfigs')[0] ? LocalStorage.get('customizedLaserConfigs')[0].name : ''
            });
        },

        updateData: function() {
            const layerData = FnWrapper.getCurrentLayerData();

            this.setState({
                speed:      layerData.speed,
                strength:   layerData.power,
                repeat:     layerData.repeat
            });
        },

        _handleSpeedChange: function(val) {
            this.setState({speed: val});
            this.props.funcs.writeSpeed(this.props.layerName, val);
        },

        _handleStrengthChange: function(val) {
            this.setState({strength: val});
            this.props.funcs.writeStrength(this.props.layerName, val);
        },

        _handleRepeatChange: function(val) {
            this.setState({repeat: val});
            this.props.funcs.writeRepeat(this.props.layerName, val);
        },

        _handleHeightChange: function(val) {
            this.setState({height: val});
            this.props.funcs.writeHeight(this.props.layerName, val);
        },

        _toggleDiode: function() {
            let val = !this.state.isDiode;
            this.setState({isDiode: val});
            this.props.funcs.writeDiode(this.props.layerName, val ? 1 : 0);
        },

        _handleSaveConfig: function() {
            const name = document.getElementsByClassName('configName')[0].value;
            const customizedConfigs = LocalStorage.get('customizedLaserConfigs');

            if (!customizedConfigs || customizedConfigs.length < 1) {
                LocalStorage.set('customizedLaserConfigs', [{
                    name,
                    speed: this.state.speed,
                    power: this.state.strength,
                    repeat: this.state.repeat
                }]);

                this.setState({ selectedItem: name });
                this.props.funcs.writeConfigName(this.props.layerName, name);
            } else {
                const index = customizedConfigs.findIndex((e) => e.name === name);
                if (index < 0) {
                    LocalStorage.set('customizedLaserConfigs' ,customizedConfigs.concat([{
                        name,
                        speed: this.state.speed,
                        power: this.state.strength,
                        repeat: this.state.repeat
                    }]));
                    this.props.funcs.writeConfigName(this.props.layerName, name);
                } else {
                    AlertActions.showPopupError('', LANG.existing_name)
                }
            }

            this.setState({ modal: '' });
            
        },

        _handleDeleteConfig: function() {
            const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
            const index = customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
            if (index > -1) {
                if (customizedLaserConfigs[index].isDefault) {
                    const defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse');
                    defaultLaserConfigsInUse[customizedLaserConfigs[index].key] = false;
                    LocalStorage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
                }
                customizedLaserConfigs.splice(index, 1);
                LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                this.setState({ selectedItem: customizedLaserConfigs[0] ? customizedLaserConfigs[0].name : '' });
            }
        },

        _handleCancelModal: function() {
            document.getElementById('laser-config-dropdown').value = this.state.original;
            this.setState({ modal: '' });
        },

        _handleSave: function() {
            if (this.state.selectedItem != '') {
                const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
                let newSpeed = ReactDOM.findDOMNode(this.refs.configSpeed).value;
                let newPower = ReactDOM.findDOMNode(this.refs.configPower).value;
                const index = customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
                if (!customizedLaserConfigs[index].isDefault) {
                    customizedLaserConfigs[index].speed = newSpeed;
                    customizedLaserConfigs[index].power = newPower;
                    LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                }
            }
        },

        _handleApply: function() {
            if (this.state.isSelectingCustomized && this.state.selectedItem != '') {
                this._handleSave();
                document.getElementById('laser-config-dropdown').value = this.state.selectedItem;
                const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
                const selectedConfig = customizedLaserConfigs.find((e) => e.name === this.state.selectedItem);
                const speed = selectedConfig.speed;
                const power = selectedConfig.power;
                const repeat = selectedConfig.repeat || 1;
                this.props.funcs.writeSpeed(this.props.layerName, speed);
                this.props.funcs.writeStrength(this.props.layerName, power);
                this.props.funcs.writeRepeat(this.props.layerName, repeat);

                this.setState({ 
                    modal: '',
                    speed: speed,
                    strength: power,
                    repeat: repeat
                });
            } else {
                this.setState({ modal: '' })
            }
        },

        _handleParameterTypeChanged: function(id, value) {
            if (value === defaultLaserOptions[0]) {
                this.setState({ original: value });
                return;
            }
            if (defaultLaserOptions.indexOf(value) > -1) {
                const model = BeamboxPreference.read('model');
                switch(model) {
                    case 'fbm1':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMO[value].speed,
                            strength: RightPanelConstants.BEAMO[value].power,
                            repeat: RightPanelConstants.BEAMO[value].repeat || 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, repeat);
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
                        this.props.funcs.writeRepeat(this.props.layerName, repeat);
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
                        this.props.funcs.writeRepeat(this.props.layerName, repeat);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    default:
                        console.error('wrong machine', model);
                }
            } else if (value === 'save') {
                this.setState({ modal: 'save' });
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
        },

        _renderStrength: function() {
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
                     <div className="rainbow-sidebar" onClick={onSlideBarClick.bind(this)}>
                        <div className="rainbow-drag" draggable="true" onDrag={_handleDrag.bind(this)} style={{left: `${this.state.strength}%`}}/>
                    </div>
                </div>
                 
            );
        },
        _renderSpeed: function() {
            const maxValue = 300;
            const minValue = 3;
            const onSlideBarClick = (e) => {
                const l = $('.rainbow-sidebar').offset().left;
                const w = $('.rainbow-sidebar').width();
                const newValue = Math.round((e.clientX - l) / w * (maxValue - minValue) + minValue);
                this._handleSpeedChange(newValue);
            };
            const _handleDrag = (e) => {
                const l = $('.rainbow-sidebar').offset().left;
                const w = $('.rainbow-sidebar').width();
                const x = e.clientX;
                if (x < l || x > w + l) {
                    return;
                }
                let newValue = Math.round((x - l) / w * (maxValue - minValue) + minValue);
                this._handleSpeedChange(newValue);
            };
            return (
                <div className='panel'>
                    <span className='title'>{LANG.speed}</span>
                    <UnitInput
                        min={minValue}
                        max={maxValue}
                        unit="mm/s"
                        defaultValue={this.state.speed}
                        getValue={this._handleSpeedChange}
                        decimal={1}
                    />
                    <div className="rainbow-sidebar" onClick={onSlideBarClick.bind(this)}>
                        <div className="rainbow-drag" draggable="true" onDrag={_handleDrag.bind(this)} style={{left: `${this.state.speed/3}%`}} /> 
                    </div>
                </div>
            );
        },

        _renderRepeat: function() {
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
        },

        _renderHeight: function() {
            if (!BeamboxPreference.read('enable-autofocus-module')) {
                return null;
            }
            return (
                <div className='panel without-drag'>
                    <span className='title'>{LANG.height}</span>
                    <UnitInput
                        min={0}
                        max={20}
                        unit={'mm'}
                        defaultValue={this.state.height}
                        getValue={this._handleHeightChange}
                        decimal={1}
                    />
                </div>
            );
        },

        _renderDiode: function() {
            if (!BeamboxPreference.read('enable-diode-module')) {
                return null;
            }
            return (
                <div className='panel checkbox' onClick={() => {this._toggleDiode()}}>
                    <span className='title'>{LANG.diode}</span>
                    <input type="checkbox" checked={this.state.isDiode} onChange={()=>{}}/>
                </div>
            );
        },

        _renderSaveModal: function() {
            return (
                <Modal>
                    <div className="save-config-panel">
                        <div className="title">{LANG.dropdown.save}</div>
                        <div className="name">
                            <span>{LANG.name}</span>
                            <input className="configName" type="text" />
                        </div>
                        <div className="footer">
                            <button
                                className='btn btn-default'
                                onClick={() => this._handleCancelModal()}
                            >
                                {LANG.cancel}
                            </button>
                            <button
                                className='btn btn-default pull-right'
                                onClick={() => this._handleSaveConfig()}
                            >
                                {LANG.save}
                            </button>
                        </div>
                    </div>
                </Modal>
            );
        },

        _getDefaultParameters: function(para_name) {
            const model = BeamboxPreference.read('model');
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
        },

        _renderMoreModal: function() {
            const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
            const defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse');
            const selectedConfig = customizedLaserConfigs.find((e) => e.name === this.state.selectedItem);
            let customizedEntries,
                defaultEntries,
                entryClass;

            const handleCustomizedEntryClick = (name) => {
                const selectedConfig = customizedLaserConfigs.find((e) => e.name === name);
                this.setState({ 
                    isSelectingCustomized: true,
                    selectedItem: name,
                    displaySpeed: selectedConfig.speed,
                    displayPower: selectedConfig.power
                });
            }

            const handleDefaultEntryClick = (name) => {
                const {speed, power, repeat} = this._getDefaultParameters(name);
                this.setState({ 
                    isSelectingCustomized: false,
                    selectedItem: name,
                    displaySpeed: speed,
                    displayPower: power
                });
            }

            const addSelectDefaultsToCustom = () => {
                if (!this.state.isSelectingCustomized && this.state.selectedItem != '') {
                    if (defaultLaserConfigsInUse[this.state.selectedItem]) {
                        this.setState({
                            selectedItem: LANG.dropdown[this.state.selectedItem],
                            isSelectingCustomized: true});
                        return;
                    }
                    const {speed, power, repeat} = this._getDefaultParameters(this.state.selectedItem);
                    defaultLaserConfigsInUse[this.state.selectedItem] = true;
                    customizedLaserConfigs.push({
                        name: LANG.dropdown[this.state.selectedItem],
                        speed: speed,
                        power: power,
                        repeat: repeat,
                        isDefault: true,
                        key: this.state.selectedItem
                    });
                    LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                    LocalStorage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
                    this.setState({
                        selectedItem: LANG.dropdown[this.state.selectedItem],
                        isSelectingCustomized: true,
                    }, () => {$('#custom-config-list').scrollTop(customizedLaserConfigs.length * 20)});
                }
            };

            const removeDefaultfromCustom = () => {
                if (this.state.selectedItem != '') {
                    let index;
                    if (this.state.isSelectingCustomized) {
                        index = customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
                    } else {
                        index = customizedLaserConfigs.findIndex((e) => e.name === LANG.dropdown[this.state.selectedItem]);
                    }
                    if (index > -1 && customizedLaserConfigs[index].isDefault) {
                        const key = customizedLaserConfigs[index].key;
                        const index2 = defaultLaserOptions.findIndex((e) => e === key);
                        defaultLaserConfigsInUse[key] = false;
                        LocalStorage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
                        customizedLaserConfigs.splice(index, 1);
                        LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                        this.setState({isSelectingCustomized: false, selectedItem: key},
                            () => {$('#default-config-list').scrollTop((index2 - 1) * 20)});
                    }
                }
            };

            const onEntryDragStart = (e) => {
                this.draggingEntry = $(e.target).closest('.config-entry')[0];
                const name = $(this.draggingEntry).children('span').first().text();
                const index = customizedLaserConfigs.findIndex((e) => e.name === name);
                this.draggingIndex = index;
                const selectedConfig = customizedLaserConfigs.find((e) => e.name === name);
                this.setState({ 
                    isSelectingCustomized: true,
                    selectedItem: name,
                    displaySpeed: selectedConfig.speed,
                    displayPower: selectedConfig.power
                });
            };

            const onEntryDragOver = (e) => {
                if (this.draggingEntry) {
                    if ($(e.target).closest('.config-entry')[0] != this.draggingEntry) {
                        const name = $(e.target).closest('.config-entry').children('span').first().text();
                        const index = customizedLaserConfigs.findIndex((e) => e.name === name);
                        const temp = customizedLaserConfigs[index];
                        customizedLaserConfigs[index] = customizedLaserConfigs[this.draggingIndex];
                        customizedLaserConfigs[this.draggingIndex] = temp;
                        this.draggingIndex = index;
                        LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);
                        this.setState(this.state);
                    }
                }
            };

            const onEntryDragEnd = (e) => {
                this.draggingEntry = false;
            }

            const onControlClick = () => {
                if (!selectedConfig) {
                    AlertActions.showPopupError('', 'Not selecting');
                }
            };

            customizedEntries = customizedLaserConfigs.map((entry) => {
                entryClass = ClassNames('config-entry', {'selected': (this.state.isSelectingCustomized && this.state.selectedItem === entry.name)});
                return (
                    <div
                        className={entryClass}
                        key={entry.name}
                        onClick={()=>{ handleCustomizedEntryClick(entry.name)}}
                        draggable={true}
                        onDragStart={onEntryDragStart.bind(this)}
                        onDragOver={onEntryDragOver.bind(this)}
                        onDragEnd={onEntryDragEnd.bind(this)}
                    >
                        <span>{entry.name}</span>
                        <span className='sub-text'>{entry.isDefault ? LANG.default : ''}</span>
                    </div>
                );
            });

            defaultEntries = defaultLaserOptions.slice(1).map((entry) => {
                const inUse = defaultLaserConfigsInUse[entry];
                entryClass = ClassNames('config-entry', {'selected': (!this.state.isSelectingCustomized && this.state.selectedItem === entry)});
                return (
                    <div className={entryClass} key={entry} onClick={()=>{ handleDefaultEntryClick(entry)}}>
                        <span>{LANG.dropdown[entry]}</span>
                        <span className='sub-text'>{inUse ? LANG.inuse : ''}</span>
                    </div>
                );
            });

            const disableControl = Boolean(!this.state.isSelectingCustomized) || Boolean(!selectedConfig) || Boolean(selectedConfig.isDefault);

            this.state.displaySpeed = this.state.displaySpeed || (selectedConfig ? selectedConfig.speed : 0);
            this.state.displayPower = this.state.displayPower || (selectedConfig ? selectedConfig.power : 0);
            return (
                <Modal>
                    <div className="more-config-panel">
                        <div className="title">{LANG.more}</div>
                        <div className="config-list-columns">
                            <div className='config-list-column'>
                                <div className='title'>{LANG.default}</div>
                                <div id='default-config-list' className="config-list">
                                    {defaultEntries}
                                </div>
                            </div>
                            <div className='operation-buttons'>
                                <div className='operation-button' onClick={addSelectDefaultsToCustom.bind(this)}>{'>>'}</div>
                                <div className='operation-button' onClick={removeDefaultfromCustom.bind(this)}>{'<<'}</div>
                            </div>
                            <div className='config-list-column'>
                                <div className='title'>{LANG.customized}</div>
                                <div id='custom-config-list' className="config-list" >
                                    {customizedEntries}
                                </div>
                            </div>
                        </div>
                        <div className={`controls ${disableControl ? 'disable' : ''}`} >
                            <div className="control" onClick={onControlClick.bind(this)}>
                                <span className="label">{LANG.power.text}</span>
                                <input
                                    type="range"
                                    ref="configPower"
                                    disabled={disableControl}
                                    min={LANG.power.min}
                                    max={LANG.power.max}
                                    step={LANG.power.step}
                                    value={this.state.displayPower}
                                    onChange={(e) => {this.setState({displayPower: e.target.value})}}
                                />
                                <UnitInput
                                    min={LANG.power.min}
                                    max={LANG.power.max}
                                    disabled={disableControl}
                                    unit={'%'}
                                    getValue={(val) => {this.setState({displayPower: val})}}
                                    defaultValue={this.state.displayPower}
                                    decimal={1}
                                    step={LANG.power.step}
                                />
                            </div>
                            <div className="control" onClick={onControlClick.bind(this)}>
                                <span className="label">{LANG.laser_speed.text}</span>
                                <input
                                    type="range"
                                    ref="configSpeed"
                                    disabled={disableControl}
                                    min={LANG.laser_speed.min}
                                    max={LANG.laser_speed.max}
                                    step={LANG.laser_speed.step}
                                    value={this.state.displaySpeed}
                                    onChange={(e) => {this.setState({displaySpeed: e.target.value})}}
                                />
                                <UnitInput
                                    min={LANG.laser_speed.min}
                                    max={LANG.laser_speed.max}
                                    disabled={disableControl}
                                    unit={'mm/s'}
                                    getValue={(val) => {this.setState({displaySpeed: val})}}
                                    defaultValue={this.state.displaySpeed}
                                    decimal={1}
                                    step={0.1}
                                />
                            </div>
                        </div>
                        <div className="footer">
                            <div className="left">
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => this._handleDeleteConfig()}
                                >
                                    {LANG.delete}
                                </button>
                            </div>
                            <div className="right">
                                <button
                                    className='btn btn-default'
                                    onClick={() => this._handleCancelModal()}
                                >
                                    {LANG.cancel}
                                </button>
                                <button
                                    className='btn btn-default'
                                    onClick={() => this._handleSave()}
                                >
                                    {LANG.save}
                                </button>
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => this._handleApply()}
                                >
                                    {LANG.apply}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            );
        },

        _renderModal: function() {
            switch(this.state.modal) {
                case 'save':
                    return this._renderSaveModal();
                case 'more':
                    return this._renderMoreModal();
                default:
                    return null;
            }
        },

        _handleStartClick: async function() {
            if (PreviewModeController.isPreviewMode()) {
                await PreviewModeController.end();
            }

            const layers = $('#svgcontent > g.layer').toArray();
            const dpi = BeamboxPreference.read('engrave_dpi');

            const isPowerTooHigh = layers.map(layer => layer.getAttribute('data-strength'))
                    .some(strength => Number(strength) > 80);
            const imageElems = document.querySelectorAll('image');

            let isSpeedTooHigh = false;

            for (let i = 1; i < imageElems.length; i++) {
                if (imageElems[i].getAttribute('data-shading') && (
                        (dpi === 'medium' && imageElems[i].parentNode.getAttribute('data-speed') > 135) ||
                        (dpi === 'high' && imageElems[i].parentNode.getAttribute('data-speed') > 90)
                )) {
                    isSpeedTooHigh = true;
                    break;
                }
            }

            if (isPowerTooHigh && isSpeedTooHigh) {
                AlertActions.showPopupWarning('', LANG2.beambox.popup.both_power_and_speed_too_high);
            } else if (isPowerTooHigh) {
                AlertActions.showPopupWarning('', LANG2.beambox.popup.power_too_high_damage_laser_tube);
            } else if (isSpeedTooHigh) {
                AlertActions.showPopupWarning('', LANG2.beambox.popup.speed_too_high_lower_the_quality);
            }

            this.setState({
                isPrinterSelectorOpen: true
            });
        },

        _renderPrinterSelectorWindow: function() {
            const onGettingPrinter = async (selected_item) => {
                //export fcode
                if (selected_item === 'export_fcode') {
                    BottomRightFuncs.exportFcode();
                    this.setState({
                        isPrinterSelectorOpen: false
                    });

                    return;
                }

                //check firmware
                if (await BeamboxVersionMaster.isUnusableVersion(selected_item)) {
                    console.error('Not a valid firmware version');
                    AlertActions.showPopupError('', lang.beambox.popup.should_update_firmware_to_continue);
                    this.setState({
                        isPrinterSelectorOpen: false
                    });

                    return;
                }

                // start task
                this.setState({
                    isPrinterSelectorOpen: false,
                });
                BottomRightFuncs.uploadFcode(selected_item);
            };

            const onClose = () => {
                this.setState({
                    isPrinterSelectorOpen: false
                });
            };

            const content = (
                <PrinterSelector
                    uniqleId="laser"
                    className="laser-device-selection-popup"
                    modelFilter={PrinterSelector.BEAMBOX_FILTER}
                    showExport={true}
                    onClose={onClose}
                    onGettingPrinter={onGettingPrinter}
                />
            );

            return (
                <Modal content={content} onClose={onClose} />
            );
        },

        _renderActionButtons: function() {
            let className = ReactCx.cx({
                'btn-default': true, 
                'btn-go': true
            });
            let label = LANG2.monitor.start;
            
            return (
                <button className={className} type="button" data-ga-event="laser-goto-monitor" data-test-key={label} onClick={this._handleStartClick}>
                    {label}
                </button>
            );
        },

        render: function() {
            const speedPanel = this._renderSpeed();
            const strengthPanel = this._renderStrength();
            const repeatPanel = this._renderRepeat();
            const heightPanel = this._renderHeight();
            const diodePanel = this._renderDiode();
            const modalDialog = this._renderModal();

            const defaultOptions = defaultLaserOptions.map((item) => {
                return {
                    value : item,
                    key: item,
                    label: (LANG.dropdown[item] ? LANG.dropdown[item] : item)
                };
            });
            const functionalOptions = functionalLaserOptions.map((item) => {
                return {
                    value : item,
                    key: item,
                    label: LANG.dropdown[item]
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

            // const actionButtons = this._renderActionButtons();
            const printerSelector = this._renderPrinterSelectorWindow();

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
                        {heightPanel}
                        {diodePanel}
                        {modalDialog}
                        {this.state.isPrinterSelectorOpen ? printerSelector : ''}
                    </div>
                </div>
            );
        }

    });


});
