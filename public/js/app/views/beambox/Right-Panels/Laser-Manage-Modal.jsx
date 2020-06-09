define([
    'jsx!widgets/Modal',
    'jsx!widgets/Unit-Input-v2',
    'app/actions/beambox/beambox-preference',
    'app/constants/right-panel-constants',
    'helpers/local-storage',
    'helpers/i18n'
], function(
    Modal,
    UnitInput,
    BeamboxPreference,
    RightPanelConstants,
    LocalStorage,
    i18n
) {
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

    class LaserManageModal extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                isSelectingCustomized: true,
                selectedItem: props.selectedItem,
                displaySpeed: null,
                displayPower: null
            };
            this.customizedLaserConfigs = LocalStorage.get('customizedLaserConfigs') || [];
            this.defaultLaserConfigsInUse = LocalStorage.get('defaultLaserConfigsInUse');
            this.unit = localStorage.getItem('default-units') || 'mm';
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

        handleCustomizedEntryClick = (name) => {
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === name);
            this.setState({
                isSelectingCustomized: true,
                selectedItem: name,
                displaySpeed: selectedConfig.speed,
                displayPower: selectedConfig.power
            });
        }

        handleDefaultEntryClick = (name) => {
            const {speed, power, repeat} = this._getDefaultParameters(name);
            this.setState({
                isSelectingCustomized: false,
                selectedItem: name,
                displaySpeed: speed,
                displayPower: power
            });
        }

        addSelectDefaultsToCustom = () => {
            if (!this.state.isSelectingCustomized && this.state.selectedItem != '') {
                if (this.defaultLaserConfigsInUse[this.state.selectedItem]) {
                    this.setState({
                        selectedItem: LANG.dropdown[this.unit][this.state.selectedItem],
                        isSelectingCustomized: true});
                    return;
                }
                const {speed, power, repeat} = this._getDefaultParameters(this.state.selectedItem);
                this.defaultLaserConfigsInUse[this.state.selectedItem] = true;
                this.customizedLaserConfigs.push({
                    name: LANG.dropdown[this.unit][this.state.selectedItem],
                    speed: speed,
                    power: power,
                    repeat: repeat,
                    isDefault: true,
                    key: this.state.selectedItem
                });
                LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                LocalStorage.set('defaultLaserConfigsInUse', this.defaultLaserConfigsInUse);
                this.setState({
                    selectedItem: LANG.dropdown[this.unit][this.state.selectedItem],
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
                    this.setState({isSelectingCustomized: false, selectedItem: key},
                        () => {$('#default-config-list').scrollTop((index - 1) * 20)});
                }
            }
        };

        onEntryDragStart = (e) => {
            this.draggingEntry = $(e.target).closest('.config-entry')[0];
            const name = $(this.draggingEntry).children('span').first().text();
            const index = this.customizedLaserConfigs.findIndex((e) => e.name === name);
            this.draggingIndex = index;
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === name);
            this.setState({
                isSelectingCustomized: true,
                selectedItem: name,
                displaySpeed: selectedConfig.speed,
                displayPower: selectedConfig.power
            });
        };

        onEntryDragOver = (e) => {
            if (this.draggingEntry) {
                if ($(e.target).closest('.config-entry')[0] != this.draggingEntry) {
                    const name = $(e.target).closest('.config-entry').children('span').first().text();
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

        onControlClick = (selectedConfig) => {
            if (!selectedConfig) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: 'Not selecting',
                });
            }
        };

        renderCustomizedEntries = () => {
            const customizedEntries = this.customizedLaserConfigs.map((entry) => {
                const entryClass = classNames('config-entry', {'selected': (this.state.isSelectingCustomized && this.state.selectedItem === entry.name)});
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
                        <span>{entry.name}</span>
                        <span className='sub-text'>{entry.isDefault ? LANG.default : ''}</span>
                    </div>
                );
            });
            return customizedEntries;
        }

        renderDefaultEntries = () => {
            const defaultEntries = defaultLaserOptions.slice(1).map((entry) => {
                const inUse = this.defaultLaserConfigsInUse[entry];
                const entryClass = classNames('config-entry', {'selected': (!this.state.isSelectingCustomized && this.state.selectedItem === entry)});
                return (
                    <div className={entryClass} key={entry} onClick={()=>{this.handleDefaultEntryClick(entry)}}>
                        <span>{LANG.dropdown[this.unit][entry]}</span>
                        <span className='sub-text'>{inUse ? LANG.inuse : ''}</span>
                    </div>
                );
            });
            return defaultEntries;
        }



        _handleDelete = () => {
            const index = this.customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
            if (index > -1) {
                if (this.customizedLaserConfigs[index].isDefault) {
                    this.defaultLaserConfigsInUse[this.customizedLaserConfigs[index].key] = false;
                    LocalStorage.set('defaultLaserConfigsInUse', this.defaultLaserConfigsInUse);
                }
                this.customizedLaserConfigs.splice(index, 1);
                LocalStorage.set('customizedLaserConfigs', this.customizedLaserConfigs);
                this.setState({ selectedItem: this.customizedLaserConfigs[0] ? this.customizedLaserConfigs[0].name : '' });
            }
        }

        _handleSave = () => {
            if (this.state.selectedItem != '') {
                let newSpeed = this.refs.configSpeed.value;
                let newPower = this.refs.configPower.value;
                const index = this.customizedLaserConfigs.findIndex((e) => e.name === this.state.selectedItem);
                if (!this.customizedLaserConfigs[index].isDefault) {
                    this.customizedLaserConfigs[index].speed = newSpeed;
                    this.customizedLaserConfigs[index].power = newPower;
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
                this.props.onApply(speed, power, repeat, this.state.selectedItem);

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

        render() {
            const selectedConfig = this.customizedLaserConfigs.find((e) => e.name === this.state.selectedItem);
            const disableControl = Boolean(!this.state.isSelectingCustomized) || Boolean(!selectedConfig) || Boolean(selectedConfig.isDefault);
            this.state.displaySpeed = this.state.displaySpeed || (selectedConfig ? selectedConfig.speed : 0);
            this.state.displayPower = this.state.displayPower || (selectedConfig ? selectedConfig.power : 0);
            const defaultEntries = this.renderDefaultEntries();
            const customizedEntries = this.renderCustomizedEntries();

            const maxValueDisplay = {mm: 300, inches: 12}[this.unit];
            const minValueDisplay = {mm: 3, inches: 0.118}[this.unit];
            const unitDisplay = {mm: 'mm/s', inches: 'in/s'}[this.unit];
            const valueDisplay = this.state.displaySpeed / {mm: 1, inches: 25.4}[this.unit];
            const decimalDisplay = {mm: 1, inches: 3}[this.unit];

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
                        <div className={`controls ${disableControl ? 'disable' : ''}`} >
                            <div className="control" onClick={() => {this.onControlClick(selectedConfig)}}>
                                <span className="label">{LANG.power.text}</span>
                                <input
                                    type="range"
                                    ref="configPower"
                                    disabled={disableControl}
                                    min={1}
                                    max={100}
                                    step={0.1}
                                    value={this.state.displayPower}
                                    onChange={(e) => {this.setState({displayPower: e.target.value})}}
                                />
                                <UnitInput
                                    min={1}
                                    max={100}
                                    disabled={disableControl}
                                    unit={'%'}
                                    getValue={(val) => {this.setState({displayPower: val})}}
                                    defaultValue={this.state.displayPower}
                                    decimal={1}
                                    step={0.1}
                                />
                            </div>
                            <div className="control" onClick={() => {this.onControlClick(selectedConfig)}}>
                                <span className="label">{LANG.laser_speed.text}</span>
                                <input
                                    type="range"
                                    ref="configSpeed"
                                    disabled={disableControl}
                                    min={3}
                                    max={300}
                                    step={0.1}
                                    value={this.state.displaySpeed}
                                    onChange={(e) => {this.setState({displaySpeed: e.target.value})}}
                                />
                                <UnitInput
                                    min={minValueDisplay}
                                    max={maxValueDisplay}
                                    disabled={disableControl}
                                    unit={unitDisplay}
                                    getValue={(val) => {this.handleSpeedInputChange(val)}}
                                    defaultValue={valueDisplay}
                                    decimal={decimalDisplay}
                                    step={0.1}
                                />
                            </div>
                        </div>
                        <div className="footer">
                            <div className="left">
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => this._handleDelete()}
                                >
                                    {LANG.delete}
                                </button>
                            </div>
                            <div className="right">
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
