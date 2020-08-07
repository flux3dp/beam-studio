define([
    'jsx!widgets/Modal',
    'jsx!widgets/Unit-Input-v2',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/beambox/beambox-preference',
    'app/constants/right-panel-constants',
    'helpers/local-storage',
    'helpers/i18n'
], function(
    Modal,
    UnitInput,
    Alert,
    AlertConstants,
    BeamboxPreference,
    RightPanelConstants,
    LocalStorage,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const LANG = i18n.lang.beambox.right_panel.laser_panel;
    const defaultLaserOptions = [
        'wood_3mm_cutting',
        'wood_5mm_cutting',
        'wood_engraving',
        'acrylic_3mm_cutting',
        'acrylic_5mm_cutting',
        'acrylic_engraving',
        'leather_3mm_cutting',
        'leather_5mm_cutting',
        'leather_engraving',
        'fabric_3mm_cutting',
        'fabric_5mm_cutting',
        'fabric_engraving',
        'rubber_bw_engraving',
        'glass_bw_engraving',
        'metal_bw_engraving',
        'stainless_steel_bw_engraving_diode',
    ];

    class LaserManageModal extends React.Component {
        constructor(props) {
            super(props);
            this.customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs') || [];
            this.defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse');
            this.unit = localStorage.getItem('default-units') || 'mm';
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === props.selectedItem);
            this.state = {
                isSelectingCustomized: true,
                selectedItem: props.selectedItem,
                displaySpeed: selectedConfig ? selectedConfig.speed : 0,
                displayPower: selectedConfig ? selectedConfig.power : 0,
                displayRepeat: selectedConfig ? (selectedConfig.repeat || 1) : 1,
                displayZStep: selectedConfig ? (selectedConfig.zStep || 0) : 0,
            };
        }

        _getDefaultParameters = (para_name) => {
            const model = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
            let speed, power, repeat, zStep;
            switch(model) {
                case 'fbm1':
                    speed = RightPanelConstants.BEAMO[para_name].speed;
                    power = RightPanelConstants.BEAMO[para_name].power;
                    repeat = RightPanelConstants.BEAMO[para_name].repeat || 1;
                    zStep = RightPanelConstants.BEAMO[para_name].zStep || 0;
                    break;
                case 'fbb1b':
                    speed = RightPanelConstants.BEAMBOX[para_name].speed;
                    power = RightPanelConstants.BEAMBOX[para_name].power;
                    repeat = RightPanelConstants.BEAMBOX[para_name].repeat || 1;
                    zStep = RightPanelConstants.BEAMBOX[para_name].zStep || 0;
                    break;
                case 'fbb1p':
                    speed = RightPanelConstants.BEAMBOX_PRO[para_name].speed;
                    power = RightPanelConstants.BEAMBOX_PRO[para_name].power;
                    repeat = RightPanelConstants.BEAMBOX_PRO[para_name].repeat || 1;
                    zStep = RightPanelConstants.BEAMBOX_PRO[para_name].zStep || 0;
                    break;
            }
            return {speed, power, repeat, zStep};
        }

        handleCustomizedEntryClick = (name) => {
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === name);
            this.setState({
                isSelectingCustomized: true,
                selectedItem: name,
                displaySpeed: selectedConfig.speed,
                displayPower: selectedConfig.power,
                displayRepeat: selectedConfig.repeat || 1,
                displayZStep: selectedConfig.zStep || 0,
            });
        }

        handleDefaultEntryClick = (name) => {
            const {speed, power, repeat, zStep} = this._getDefaultParameters(name);
            this.setState({
                isSelectingCustomized: false,
                selectedItem: name,
                displaySpeed: speed,
                displayPower: power,
                displayRepeat: repeat || 1,
                displayZStep: zStep || 0,
            });
        }

        addSelectDefaultsToCustom = () => {
            const { isSelectingCustomized, selectedItem } = this.state;
            if (!isSelectingCustomized && selectedItem != '') {
                if (this.defaultLaserConfigsInUse[selectedItem]) {
                    this.setState({
                        selectedItem: LANG.dropdown[this.unit][selectedItem],
                        isSelectingCustomized: true});
                    return;
                }
                const {speed, power, repeat, zStep} = this._getDefaultParameters(selectedItem);
                this.defaultLaserConfigsInUse[selectedItem] = true;
                this.customizedLaserConfigs.push({
                    name: LANG.dropdown[this.unit][selectedItem],
                    speed: speed,
                    power: power,
                    repeat: repeat,
                    zStep: zStep,
                    isDefault: true,
                    key: selectedItem
                });
                LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                LocalStorage.set('defaultLaserConfigsInUse', this.defaultLaserConfigsInUse);
                this.setState({
                    selectedItem: LANG.dropdown[this.unit][selectedItem],
                    isSelectingCustomized: true,
                }, () => {$('#custom-config-list').scrollTop(this.customizedLaserConfigs.length * 20)});
            }
        };

        removeDefaultfromCustom = () => {
            if (this.state.selectedItem != '') {
                let index;
                if (this.state.isSelectingCustomized) {
                    index = this.customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
                } else {
                    index = this.customizedLaserConfigs.findIndex((e) => e.name === LANG.dropdown[this.unit][this.state.selectedItem]);
                }
                if (index > -1 && this.customizedLaserConfigs[index].isDefault) {
                    const key = this.customizedLaserConfigs[index].key;
                    this.defaultLaserConfigsInUse[key] = false;
                    LocalStorage.set('defaultLaserConfigsInUse', this.defaultLaserConfigsInUse);
                    this.customizedLaserConfigs.splice(index, 1);
                    LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                    if (this.customizedLaserConfigs.length > 0) {
                        const nextCustomizedConfig = this.customizedLaserConfigs[Math.min(index, this.customizedLaserConfigs.length - 1)];
                        this.setState({
                            selectedItem: nextCustomizedConfig ? nextCustomizedConfig.name : '',
                            displayPower:  nextCustomizedConfig ? nextCustomizedConfig.power : 0,
                            displaySpeed: nextCustomizedConfig ? nextCustomizedConfig.speed : 0,
                            displayRepeat: nextCustomizedConfig ? nextCustomizedConfig.repeat : 1,
                            displayZStep: nextCustomizedConfig ? nextCustomizedConfig.zStep : 0,
                        });
                    } else {
                        const index = defaultLaserOptions.findIndex((e) => e === key);
                        this.setState({isSelectingCustomized: false, selectedItem: key},
                            () => {$('#default-config-list').scrollTop((index) * 20)});
                    }
                }
            }
        };

        onEntryDragStart = (e) => {
            this.draggingEntry = $(e.target).closest('.config-entry')[0];
            const name = $(this.draggingEntry).children('.entry-name').text();
            const index = this.customizedLaserConfigs.findIndex((e) => e.name === name);
            this.draggingIndex = index;
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === name);
            this.setState({
                isSelectingCustomized: true,
                selectedItem: name,
                displaySpeed: selectedConfig.speed,
                displayPower: selectedConfig.power,
                displayRepeat: selectedConfig.repeat || 1,
                displayZStep: selectedConfig.zStep || 0,
            });
        };

        onEntryDragOver = (e) => {
            if (this.draggingEntry) {
                if ($(e.target).closest('.config-entry')[0] != this.draggingEntry) {
                    const name = $(e.target).closest('.config-entry').children('.entry-name').text();
                    const index = this.customizedLaserConfigs.findIndex((e) => e.name === name);
                    const temp = this.customizedLaserConfigs[index];
                    this.customizedLaserConfigs[index] = this.customizedLaserConfigs[this.draggingIndex];
                    this.customizedLaserConfigs[this.draggingIndex] = temp;
                    this.draggingIndex = index;
                    LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                    this.setState(this.state);
                }
            }
        };

        onEntryDragEnd = (e) => {
            this.draggingEntry = false;
        }

        renderCustomizedEntries = () => {
            const customizedEntries = this.customizedLaserConfigs.map((entry, index) => {
                const entryClass = classNames({
                    'config-entry': true,
                    'selected': (this.state.isSelectingCustomized && this.state.selectedItem === entry.name),
                    'no-border': this.customizedLaserConfigs.length >= 8 && index === this.customizedLaserConfigs.length - 1
                });
                return (
                    <div
                        className={entryClass}
                        key={entry.name}
                        onClick={()=>{this.handleCustomizedEntryClick(entry.name)}}
                        draggable={true}
                        onDragStart={this.onEntryDragStart.bind(this)}
                        onDragOver={this.onEntryDragOver.bind(this)}
                        onDragEnd={this.onEntryDragEnd.bind(this)}
                    >
                        <div className='entry-name'>{entry.name}</div>
                        <span className='sub-text'>{entry.isDefault ? LANG.default : ''}</span>
                    </div>
                );
            });
            return customizedEntries;
        }

        renderDefaultEntries = () => {
            const defaultEntries = defaultLaserOptions.map((entry, index) => {
                const inUse = this.defaultLaserConfigsInUse[entry];
                const entryClass = classNames({
                    'config-entry': true,
                    'selected': (!this.state.isSelectingCustomized && this.state.selectedItem === entry),
                    'no-border': defaultLaserOptions.length >= 8 && index === defaultLaserOptions.length - 1
                });
                return (
                    <div className={entryClass} key={entry} onClick={()=>{this.handleDefaultEntryClick(entry)}}>
                        <div className='entry-name'>{LANG.dropdown[this.unit][entry]}</div>
                        <span className='sub-text'>{inUse ? LANG.inuse : ''}</span>
                    </div>
                );
            });
            return defaultEntries;
        }

        _handleReset = () => {
            Alert.popUp({
                buttonType: AlertConstants.YES_NO,
                message: LANG.sure_to_reset,
                onYes: () => {
                    LocalStorage.removeAt('defaultLaserConfigsInUse');
                    this.props.initDefaultConfig();
                    this.customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs') || [];
                    this.defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse');
                    this.setState(this.state);
                }
            });
        }

        _handleDelete = () => {
            const index = this.customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
            if (index > -1) {
                if (this.customizedLaserConfigs[index].isDefault) {
                    this.removeDefaultfromCustom();
                    return;
                }
                this.customizedLaserConfigs.splice(index, 1);
                LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                if (this.customizedLaserConfigs.length > 0) {
                    const nextCustomizedConfig = this.customizedLaserConfigs[Math.min(index, this.customizedLaserConfigs.length - 1)];
                    this.setState({
                        selectedItem: nextCustomizedConfig ? nextCustomizedConfig.name : '',
                        displayPower:  nextCustomizedConfig ? nextCustomizedConfig.power : 0,
                        displaySpeed: nextCustomizedConfig ? nextCustomizedConfig.speed : 0,
                        displayRepeat: nextCustomizedConfig ? nextCustomizedConfig.repeat : 1,
                        displayZStep: nextCustomizedConfig ? nextCustomizedConfig.zStep : 0,
                    });
                } else {
                    const firstDefaultConfig = defaultLaserOptions[0];
                    this.handleDefaultEntryClick(firstDefaultConfig);
                }
            }
        }

        _handleSave = () => {
            if (this.state.selectedItem != '') {
                const {displaySpeed, displayPower, displayRepeat, displayZStep} = this.state;
                const index = this.customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
                if (!this.customizedLaserConfigs[index].isDefault) {
                    this.customizedLaserConfigs[index].speed = displaySpeed;
                    this.customizedLaserConfigs[index].power = displayPower;
                    this.customizedLaserConfigs[index].repeat = displayRepeat;
                    this.customizedLaserConfigs[index].zStep = displayZStep;
                    LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                }
            }
        }

        _handleApply = () => {
            if (this.state.isSelectingCustomized && this.state.selectedItem != '') {
                this._handleSave();
                document.getElementById('laser-config-dropdown').value = this.state.selectedItem;
                const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === this.state.selectedItem);

                const speed = selectedConfig.speed;
                const power = selectedConfig.power;
                const repeat = selectedConfig.repeat || 1;
                const zStep = selectedConfig.zStep || 0;
                this.props.onApply(speed, power, repeat, zStep, this.state.selectedItem);

            } else {
                this.props.onClose();
            }
        }

        handleSpeedInputChange = (val) => {
            if (this.unit === 'inches') {
                val *= 25.4;
            }
            this.setState({displaySpeed: val});
        }

        handleZStepInputChange = (val) => {
            if (this.unit === 'inches') {
                val *= 25.4;
            }
            this.setState({displayZStep: val});
        }

        render() {
            const { isSelectingCustomized, selectedItem, displaySpeed, displayPower, displayRepeat, displayZStep} = this.state;
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === selectedItem);
            const disableControl = Boolean(!isSelectingCustomized) || Boolean(!selectedConfig) || Boolean(selectedConfig.isDefault);
            const defaultEntries = this.renderDefaultEntries();
            const customizedEntries = this.renderCustomizedEntries();

            const unitMaxSpeed = {mm: 300, inches: 12}[this.unit];
            const unitMinSpeed = {mm: 3, inches: 0.118}[this.unit];
            const speedUnit = {mm: 'mm/s', inches: 'in/s'}[this.unit];
            const unitDisplaySpeed = displaySpeed / {mm: 1, inches: 25.4}[this.unit];
            const unitSpeedDecimal = {mm: 1, inches: 3}[this.unit];
            const zStepUnit = {mm: 'mm', inches: 'in'}[this.unit];
            const unitZStepDcimal = {mm: 2, inches: 4}[this.unit];
            const unitZStepStep = {mm: 0.5, inches: 0.01}[this.unit];

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
                                <div className='operation-button' onClick={() => {this.addSelectDefaultsToCustom()}}>{'>>'}</div>
                                <div className='operation-button' onClick={() => {this.removeDefaultfromCustom()}}>{'<<'}</div>
                            </div>
                            <div className='config-list-column'>
                                <div className='title'>{LANG.customized}</div>
                                <div id='custom-config-list' className="config-list" >
                                    {customizedEntries}
                                </div>
                            </div>
                        </div>
                        <div className='config-name'>
                            {isSelectingCustomized ? selectedItem : LANG.dropdown[this.unit][selectedItem]}
                        </div>
                        <div className={classNames('controls', {disable: disableControl})} >
                            <div className='controls-column'>
                                <div className='control'>
                                    <span className='label'>{LANG.power.text}</span>
                                    <UnitInput
                                        min={1}
                                        max={100}
                                        disabled={disableControl}
                                        unit={'%'}
                                        getValue={(val) => {this.setState({displayPower: val})}}
                                        defaultValue={displayPower}
                                        decimal={1}
                                        step={1}
                                    />
                                </div>
                                <div className='control'>
                                    <span className='label'>{LANG.laser_speed.text}</span>
                                    <UnitInput
                                        min={unitMinSpeed}
                                        max={unitMaxSpeed}
                                        disabled={disableControl}
                                        unit={speedUnit}
                                        getValue={(val) => {this.handleSpeedInputChange(val)}}
                                        defaultValue={unitDisplaySpeed}
                                        decimal={unitSpeedDecimal}
                                        step={1}
                                    />
                                </div>
                            </div>
                            <div className='controls-column'>
                                <div className='control'>
                                    <span className='label'>{LANG.repeat}</span>
                                    <UnitInput
                                        min={1}
                                        max={100}
                                        disabled={disableControl}
                                        unit={LANG.times}
                                        getValue={(val) => {this.setState({displayRepeat: val})}}
                                        defaultValue={displayRepeat}
                                        decimal={0}
                                        step={1}
                                    />
                                </div>
                                <div className='control'>
                                    <span className='label'>{LANG.z_step}</span>
                                    <UnitInput
                                        min={0}
                                        max={20}
                                        disabled={disableControl}
                                        unit={zStepUnit}
                                        getValue={(val) => {this.setState({displayZStep: val})}}
                                        defaultValue={displayZStep}
                                        decimal={unitZStepDcimal}
                                        step={unitZStepStep}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='footer'>
                            <div className='left'>
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => this._handleDelete()}
                                >
                                    {LANG.delete}
                                </button>
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => this._handleReset()}
                                >
                                    {LANG.reset}
                                </button>
                            </div>
                            <div className='right'>
                                <button
                                    className='btn btn-default primary'
                                    onClick={() => this._handleApply()}
                                >
                                    {LANG.apply}
                                </button>
                                <button
                                    className='btn btn-default'
                                    onClick={() => this._handleSave()}
                                >
                                    {LANG.save}
                                </button>
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => this.props._handleCancelModal()}
                                >
                                    {LANG.cancel}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            );
        }
    }

    return LaserManageModal;
});
