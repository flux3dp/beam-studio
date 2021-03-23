import Modal from 'app/widgets/Modal';
import UnitInput from 'app/widgets/Unit-Input-v2';
import Dialog from 'app/actions/dialog-caller';
import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import RightPanelConstants from 'app/constants/right-panel-constants';
import isObjectEmpty from 'helpers/is-object-empty';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.laser_panel;
const defaultLaserOptions = RightPanelConstants.laserPresetKeys;

class LaserManageModal extends React.Component {
    constructor(props) {
        super(props);
        this.editingCustomizedLaserConfigs = storage.get('customizedLaserConfigs') || [];
        this.editingDefaultLaserConfigsInUse = storage.get('defaultLaserConfigsInUse');
        this.unit = storage.get('default-units') || 'mm';
        const selectedConfig = this.editingCustomizedLaserConfigs.find((e) => e.name === props.selectedItem);
        this.unsavedChanges = {};
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
        } else {
            speed = RightPanelConstants[modelName][para_name].speed;
            power = RightPanelConstants[modelName][para_name].power;
            repeat = RightPanelConstants[modelName][para_name].repeat || 1;
            zStep = RightPanelConstants[modelName][para_name].zStep || 0;
        }
        return {speed, power, repeat, zStep};
    }

    handleCustomizedEntryClick = (name) => {
        const selectedConfig = this.editingCustomizedLaserConfigs.find((e) => e.name === name);
        const editingValue = {...selectedConfig, ...this.unsavedChanges[name]};
        this.setState({
            isSelectingCustomized: true,
            selectedItem: name,
            displaySpeed: editingValue.speed,
            displayPower: editingValue.power,
            displayRepeat: editingValue.repeat || 1,
            displayZStep: editingValue.zStep || 0,
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
            if (this.editingDefaultLaserConfigsInUse[selectedItem]) {
                this.setState({
                    selectedItem: LANG.dropdown[this.unit][selectedItem],
                    isSelectingCustomized: true});
                return;
            }
            const {speed, power, repeat, zStep} = this._getDefaultParameters(selectedItem);
            this.editingDefaultLaserConfigsInUse[selectedItem] = true;
            this.editingCustomizedLaserConfigs.push({
                name: LANG.dropdown[this.unit][selectedItem],
                speed: speed,
                power: power,
                repeat: repeat,
                zStep: zStep,
                isDefault: true,
                key: selectedItem
            });
            this.setState({
                selectedItem: LANG.dropdown[this.unit][selectedItem],
                isSelectingCustomized: true,
            }, () => {$('#custom-config-list').scrollTop(this.editingCustomizedLaserConfigs.length * 20)});
        }
    };

    removeDefaultfromCustom = () => {
        if (this.state.selectedItem != '') {
            let index;
            if (this.state.isSelectingCustomized) {
                index = this.editingCustomizedLaserConfigs.findIndex((config) => config.name === this.state.selectedItem);
            } else {
                index = this.editingCustomizedLaserConfigs.findIndex((config) => config.name === LANG.dropdown[this.unit][this.state.selectedItem]);
            }
            if (index > -1 && this.editingCustomizedLaserConfigs[index].isDefault) {
                const key = this.editingCustomizedLaserConfigs[index].key;
                this.editingDefaultLaserConfigsInUse[key] = false;
                this.editingCustomizedLaserConfigs.splice(index, 1);
                if (this.editingCustomizedLaserConfigs.length > 0) {
                    const nextCustomizedConfig = this.editingCustomizedLaserConfigs[Math.min(index, this.editingCustomizedLaserConfigs.length - 1)];
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

    onEntryDragStart = (entry, index) => {
        this.draggingEntry = entry;
        this.draggingIndex = index;
        const selectedConfig = this.editingCustomizedLaserConfigs[index];
        const name = entry.name;
        this.setState({
            isSelectingCustomized: true,
            selectedItem: name,
            displaySpeed: selectedConfig.speed,
            displayPower: selectedConfig.power,
            displayRepeat: selectedConfig.repeat || 1,
            displayZStep: selectedConfig.zStep || 0,
        });
    };

    onEntryDragOver = (entry, index) => {
        if (this.draggingEntry) {
            if (entry.name != this.draggingEntry.name) {
                const temp = this.editingCustomizedLaserConfigs[index];
                this.editingCustomizedLaserConfigs[index] = this.editingCustomizedLaserConfigs[this.draggingIndex];
                this.editingCustomizedLaserConfigs[this.draggingIndex] = temp;
                this.draggingIndex = index;
                this.setState(this.state);
            }
        }
    };

    onEntryDragEnd = () => {
        this.draggingEntry = false;
    }

    renderCustomizedEntries = () => {
        const customizedEntries = this.editingCustomizedLaserConfigs.map((entry, index) => {
            const hasUnsavedChanges = this.unsavedChanges.hasOwnProperty(entry.name);
            const entryClass = classNames({
                'config-entry': true,
                'selected': (this.state.isSelectingCustomized && this.state.selectedItem === entry.name),
                'no-border': this.editingCustomizedLaserConfigs.length >= 8 && index === this.editingCustomizedLaserConfigs.length - 1
            });
            return (
                <div
                    className={entryClass}
                    key={entry.name}
                    onClick={()=>{this.handleCustomizedEntryClick(entry.name)}}
                    draggable={true}
                    onDragStart={() => this.onEntryDragStart(entry, index)}
                    onDragOver={() => this.onEntryDragOver(entry, index)}
                    onDragEnd={() => this.onEntryDragEnd()}
                >
                    <div className='entry-name'>{`${entry.name + (hasUnsavedChanges ? ' *' : '')}`}</div>
                    <span className='sub-text'>{entry.isDefault ? LANG.default : ''}</span>
                </div>
            );
        });
        return customizedEntries;
    }

    renderDefaultEntries = () => {
        const defaultEntries = defaultLaserOptions.map((entry, index) => {
            const inUse = this.editingDefaultLaserConfigsInUse[entry];
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

    renderAddButton() {
        return (
            <div className="add-btn" onClick={() => this.addConfig()}>
                <div className= "bar bar1"/>
                <div className= "bar bar2"/>
                <div className= "bar bar3"/>
            </div>
        );
    }

    addConfig = () => {
        Dialog.promptDialog({
            caption: LANG.new_config_name,
            defaultValue: '',
            onYes: (newName) => {
                if (!newName) {
                    return;
                }
                const isPresetNameUsed = this.editingCustomizedLaserConfigs.some((preset) => preset.name === newName);
                if (isPresetNameUsed) {
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: LANG.existing_name,
                    });
                } else {
                    this.editingCustomizedLaserConfigs.push({
                        name: newName,
                        speed: 20,
                        power: 15,
                        repeat: 1,
                        zStep: 0,
                    });
                    this.setState({
                        isSelectingCustomized: true,
                        selectedItem: newName,
                        displaySpeed: 20,
                        displayPower: 15,
                        displayRepeat: 1,
                        displayZStep: 0,
                    }, () => {$('#custom-config-list').scrollTop(this.editingCustomizedLaserConfigs.length * 20)});
                }
            },
        });
    }

    handleUnsavedChange = (configName, configKey, newValue) => {
        const selectedConfig = this.editingCustomizedLaserConfigs.find((e) => e.name === configName);
        if (selectedConfig[configKey] !== newValue) {
            if (!this.unsavedChanges[configName]) {
                const unsavedChange = {};
                unsavedChange[configKey] = newValue;
                this.unsavedChanges[configName] = unsavedChange;
            } else {
                this.unsavedChanges[configName][configKey] = newValue;
            }
        } else {
            if (!this.unsavedChanges[configName]) {
                console.log('doesnt make sense');
            } else {
                delete this.unsavedChanges[configName][configKey];
                if (isObjectEmpty(this.unsavedChanges[configName])) {
                    delete this.unsavedChanges[configName];
                }
            }
        }

        if (configKey === 'power') {
            this.setState({displayPower: newValue});
        } else if (configKey === 'repeat') {
            this.setState({displayRepeat: newValue});
        } else if (configKey === 'speed') {
            this.setState({displaySpeed: newValue});
        } else if (configKey === 'zStep') {
            this.setState({displayZStep: newValue});
        }
    }

    _handleReset = () => {
        Alert.popUp({
            buttonType: AlertConstants.YES_NO,
            message: LANG.sure_to_reset,
            onYes: () => {
                storage.removeAt('defaultLaserConfigsInUse');
                this.props.initDefaultConfig();
                this.editingCustomizedLaserConfigs = storage.get('customizedLaserConfigs') || [];
                this.editingDefaultLaserConfigsInUse = storage.get('defaultLaserConfigsInUse');
                this.setState(this.state);
            }
        });
    }

    _handleDelete = () => {
        const index = this.editingCustomizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
        if (index > -1) {
            if (this.editingCustomizedLaserConfigs[index].isDefault) {
                this.removeDefaultfromCustom();
                return;
            }
            this.editingCustomizedLaserConfigs.splice(index, 1);
            if (this.editingCustomizedLaserConfigs.length > 0) {
                const nextCustomizedConfig = this.editingCustomizedLaserConfigs[Math.min(index, this.editingCustomizedLaserConfigs.length - 1)];
                this.setState({
                    selectedItem: nextCustomizedConfig ? nextCustomizedConfig.name : '',
                    displayPower: nextCustomizedConfig ? nextCustomizedConfig.power : 0,
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

    _handleSaveAndExit = () => {
        for (let i = 0; i < this.editingCustomizedLaserConfigs.length; i++) {
            let config = this.editingCustomizedLaserConfigs[i];
            if (this.unsavedChanges.hasOwnProperty(config.name)) {
                config = {...config, ...this.unsavedChanges[config.name]};
                this.editingCustomizedLaserConfigs[i] = config;
            }
        }
        this.unsavedChanges = {};
        storage.set('customizedLaserConfigs', this.editingCustomizedLaserConfigs);
        storage.set('defaultLaserConfigsInUse', this.editingDefaultLaserConfigsInUse);
        this.props.onClose();
    }

    _handleCancel = () => {
        this.props.onClose();
    }

    render() {
        const { isSelectingCustomized, selectedItem, displaySpeed, displayPower, displayRepeat, displayZStep} = this.state;
        const selectedConfig = this.editingCustomizedLaserConfigs.find((e) => e.name === selectedItem);
        const disableControl = Boolean(!isSelectingCustomized) || Boolean(!selectedConfig) || Boolean(selectedConfig.isDefault);
        const defaultEntries = this.renderDefaultEntries();
        const customizedEntries = this.renderCustomizedEntries();

        const speedUnit = {mm: 'mm/s', inches: 'in/s'}[this.unit];
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
                            <div className='title'>
                                {LANG.customized}
                                {this.renderAddButton()}
                            </div>
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
                                    getValue={(val) => {this.handleUnsavedChange(selectedItem, 'power', val)}}
                                    defaultValue={displayPower}
                                    decimal={1}
                                    step={1}
                                />
                            </div>
                            <div className='control'>
                                <span className='label'>{LANG.laser_speed.text}</span>
                                <UnitInput
                                    min={3}
                                    max={300}
                                    disabled={disableControl}
                                    unit={speedUnit}
                                    getValue={(val) => {this.handleUnsavedChange(selectedItem, 'speed', val)}}
                                    defaultValue={displaySpeed}
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
                                    getValue={(val) => {this.handleUnsavedChange(selectedItem, 'repeat', val)}}
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
                                    getValue={(val) => {this.handleUnsavedChange(selectedItem, 'zStep', val)}}
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
                                onClick={() => this._handleSaveAndExit()}
                            >
                                {LANG.save_and_exit}
                            </button>
                            <button
                                className='btn btn-default pull-right'
                                onClick={() => this._handleCancel()}
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

export default LaserManageModal;
