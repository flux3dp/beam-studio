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
        'rubber_engraving',
        'glass_engraving',
        'metal_engraving'
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
            funcs:      PropTypes.object.isRequired
        },

        getInitialState: function() {
            this._handleStartClick = this._handleStartClick.bind(this);
            this._renderPrinterSelectorWindow = this._renderPrinterSelectorWindow.bind(this);

            return {
                speed:          this.props.speed,
                strength:       this.props.strength,
                repeat:         this.props.repeat,
                original:       defaultLaserOptions[0],
                modal:          '',
                isPrinterSelectorOpen: false,
                selectedItem:   LocalStorage.get('customizedLaserConfigs')[0] ? LocalStorage.get('customizedLaserConfigs')[0].name : ''
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
                repeat:   nextProps.repeat,
                original:       defaultLaserOptions[0],
                modal:          '',
                selectedItem:   LocalStorage.get('customizedLaserConfigs')[0] ? LocalStorage.get('customizedLaserConfigs')[0].name : ''
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
            this.setState({strength: val})
            this.props.funcs.writeStrength(this.props.layerName, val);
        },

        _handleRepeatChange: function(val) {
            this.setState({repeat: val})
            this.props.funcs.writeRepeat(this.props.layerName, val);
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
            } else {
                LocalStorage.set('customizedLaserConfigs' ,customizedConfigs.concat([{
                    name,
                    speed: this.state.speed,
                    power: this.state.strength,
                    repeat: this.state.repeat
                }]));
            }

            this.setState({ modal: '' });
            this.props.funcs.writeConfigName(this.props.layerName, name);
        },

        _handleDeleteConfig: function() {
            const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
            const index = customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
            customizedLaserConfigs.splice(index, 1);

            LocalStorage.set('customizedLaserConfigs', customizedLaserConfigs);

            this.setState({ selectedItem: customizedLaserConfigs[0] ? customizedLaserConfigs[0].name : '' })
        },

        _handleCancelModal: function() {
            document.getElementById('laser-config-dropdown').value = this.state.original;
            this.setState({ modal: '' });
        },

        _handleApply: function() {
            if (this.selectedItem != '') {
                document.getElementById('laser-config-dropdown').value = this.state.selectedItem;
            }
            this.setState({ modal: '' });
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
                            repeat: 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, 1);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    case 'fbb1b':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMBOX[value].speed,
                            strength: RightPanelConstants.BEAMBOX[value].power,
                            repeat: 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, 1);
                        this.props.funcs.writeConfigName(this.props.layerName, value);

                        break;
                    case 'fbb1p':
                        this.setState({
                            original: value,
                            speed: RightPanelConstants.BEAMBOX_PRO[value].speed,
                            strength: RightPanelConstants.BEAMBOX_PRO[value].power,
                            repeat: 1
                        });

                        this.props.funcs.writeSpeed(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].speed);
                        this.props.funcs.writeStrength(this.props.layerName, RightPanelConstants.BEAMBOX_PRO[value].power);
                        this.props.funcs.writeRepeat(this.props.layerName, 1);
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
                <div className='panel'>
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

        _renderMoreModal: function() {
            const customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs');
            const selectedConfig = customizedLaserConfigs.find((e) => e.name === this.state.selectedItem);
            let entries,
                entryClass;

            entries = customizedLaserConfigs.map((entry) => {
                entryClass = ClassNames('config-entry', {'selected': this.state.selectedItem === entry.name});
                return (
                    <div className={entryClass} onClick={()=>{ this.setState({ selectedItem: entry.name })}}>
                        <span>{entry.name}</span>
                    </div>
                );
            });

            return (
                <Modal>
                    <div className="more-config-panel">
                        <div className="title">{LANG.more}</div>
                        <div className="config-list">
                            {entries}
                        </div>
                        <div className="controls">
                            <div className="control">
                                <span className="label">{LANG.laser_speed.text}</span>
                                <input
                                    type="range"
                                    ref="configSpeed"
                                    min={LANG.laser_speed.min}
                                    max={LANG.laser_speed.max}
                                    step={LANG.laser_speed.step}
                                    value={selectedConfig ? selectedConfig.speed : 0}
                                    className="readonly"
                                    onChange={()=>{}}
                                />
                                <span className="value-text" ref="presetSpeedDisplay" data-tail={' ' + LANG.laser_speed.unit}>
                                    {selectedConfig ? selectedConfig.speed : 0}
                                </span>
                            </div>
                            <div className="control">
                                <span className="label">{LANG.power.text}</span>
                                <input
                                    type="range"
                                    ref="configPower"
                                    min={LANG.power.min}
                                    max={LANG.power.max}
                                    step={LANG.power.step}
                                    value={selectedConfig ? selectedConfig.power : 0}
                                    className="readonly"
                                    onChange={()=>{}}
                                />
                                <span className="value-text" ref="presetPowerDisplay" data-tail=" %">
                                    {selectedConfig ? selectedConfig.power : 0}
                                </span>
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
                    defaultOptions.concat(customizedOptions).concat(functionalOptions) :
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
                        {modalDialog}
                        {this.state.isPrinterSelectorOpen ? printerSelector : ''}
                    </div>
                </div>
            );
        }

    });


});
