import $ from 'jquery'
import * as i18n from '../../../helpers/i18n'
import config from '../../../helpers/api/config'
import DeviceMaster from '../../../helpers/device-master'
import DropdownControl from '../../widgets/Dropdown-Control'
import RadioControl from '../../widgets/Radio-Control'
import CheckboxControl from '../../widgets/Checkbox-Control'

    const React = requireNode('react');;

    'use strict';

    let lang = i18n.lang;

    class SettingDevice extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                config: {},
                showBacklash: false,
                postbackUrl: 'http://your-domain/flux-status-changed?st_id=%(st_id)i',
            };
        }

        UNSAFE_componentWillMount() {
            this.devices = [];
        }

        componentDidMount() {
            this.t = setInterval(() => {
                let d = DeviceMaster.getAvailableDevices();

                if(this.devices.length !== d.length) {
                    this.devices = [];
                    this.forceUpdate(() => {
                        this.devices = d;
                        this.setState({
                            config: {}
                        });
                    });
                }
            }, 3000);
        }

        componentWillUnmount() {
            clearTimeout(this.t);
        }

        _handleDeviceChange = (dropdownId, deviceName, selectedIndex) => {
            if(selectedIndex === 0) {
                this.setState({ config: {} });
                return;
            }

            let usingUSB = deviceName.indexOf('(USB)') !== -1;
            let device = DeviceMaster.getAvailableDevices().filter(d => {
                let a = d.name === deviceName.replace(' (USB)', '');
                if(usingUSB) {
                    a = a && d.source === 'h2h';
                };
                return a;
            })[0];

            this.setState({ device }, ()=>{
                if((['fbm1', 'mozu1', 'fbb1b', 'fbb1p', 'laser-b1', 'darwin-dev'].includes(device.model))) {

                } else {
                    this._getDeviceConfig();
                }
            });


        }

        _handleComponentValueChange = (id, value, source) => {
            let config = Object.assign({}, this.state.config);

            if(id === 'head_error_level') {
                let v: string | number = 'delete';
                if(source === 'delete') {
                    value = ['delete'];
                }
                else if(source === 'N') {
                    value = ['N'];
                    v = 0;
                }
                else {
                    let i = value.indexOf('delete');
                    if(i !== -1) {
                        value = value.slice(0, i).concat(value.slice(i + 1));
                    }

                    i = value.indexOf('N');
                    if(i !== -1) {
                        value = value.slice(0, i).concat(value.slice(i + 1));
                    }

                    const types = ['LASER_DOWN', 'FAN_FAILURE', 'TILT', 'SHAKE'];
                    let configInBinary = (types.map(o => value.indexOf(o) !== -1 ? '1' : '0')).join('');
                    configInBinary = configInBinary + '0000';
                    v = parseInt(configInBinary, 2);
                }

                DeviceMaster.setDeviceSetting(id, v);
            }
            else {
                DeviceMaster.setDeviceSetting(id, value);
            }

            config[id] = value;
            this.setState({ config });
        }

         _updateBacklash = (e) => {
            if (e.type === 'blur') {
                let v = parseFloat(e.target.value);
                if(v > 0.2) { v = 0.2; }
                this.setState({ backlash: v });
                v = v * 80; // 80 is the offset value for backend
                DeviceMaster.setDeviceSetting('backlash', `"A:${v} B:${v} C:${v}"`);
            } else {
                this.setState({ backlash: e.target.value });
            }
        }

        _updateMachineRadius = (e) => {
            if(e.type === 'blur') {
                let v = parseFloat(e.target.value);

                if(v > 99.7) { v = 99.7; }
                if(v < 93.7) { v = 93.7; }

                this.setState({ machine_radius: v });
                DeviceMaster.setDeviceSetting('leveling', `R:${v}`);
            } else {
                this.setState({ machine_radius: e.target.value });
            }
        }

        _updatePostBackUrl = (e) => {
            let url = e.target.value || this.getInitialState().postbackUrl;
            this.setState({ postbackUrl: url });
            if(e.type === 'blur') {
                DeviceMaster.setDeviceSetting('player_postback_url', url);
            }
        }

        _getDeviceList = () => {
            let nameList;

            nameList = this.devices.map(d => {
                return d.source === 'h2h' ? `${d.name} (USB)` : d.name;
            });

            if(nameList.length === 0) {
                return (
                    <div style={{
                        'margin-top': '20px',
                        'color': '#333'
                    }}>{lang.device.please_wait}</div>
                );
            }

            nameList.unshift(lang.device.select);

            return (
                <DropdownControl
                    id="device-list"
                    label={lang.device.deviceList}
                    onChange={this._handleDeviceChange}
                    options={nameList}/>
            );
        }

        _getDeviceConfig = () => {
            const types = ['LASER_DOWN', 'FAN_FAILURE', 'TILT', 'SHAKE'];
            const pad = (num, size) => {
                var s = num + '';
                while(s.length < size) {
                    s = '0' + s;
                }
                return s;
            };
            const mapNumberToTypeArray = (num) => {
                if(num === 0) { return ['N']; }
                let t = [],
                    configs;

                configs = pad(num.toString(2), 8).slice(0, 4).split('');
                for(let i = 0; i < types.length; i++) {
                    if(configs[i] !== '0') {
                        t.push(types[i]);
                    }
                }

                return t;
            };

            const device = this.state.device;

        }

        _renderCorrectionSetting = () => {
            let options,
                content;

            options = [
                { id: 'A', name: lang.device.calibration.A},
                { id: 'H', name: lang.device.calibration.H},
                { id: 'N', name: lang.device.calibration.N},
                { id: 'delete', name: lang.device.calibration.byFile}
            ];

            content = (
                <div className="controls">
                    <div className="label">{lang.device.calibration.title}</div>
                    <RadioControl
                        id="correction"
                        options={options}
                        default={this.state.config['correction'] || 'delete'}
                        onChange={this._handleComponentValueChange}
                    />
                </div>
            );

            return Object.keys(this.state.config).length > 0 ? content : '';
        }

        _renderDetectFilamentSetting = () => {
            let options,
                content;

            options = [
                { id: 'Y', name: lang.device.detectFilament.on},
                { id: 'N', name: lang.device.detectFilament.off},
                { id: 'delete', name: lang.device.detectFilament.byFile}
            ];

            content = (
                <div className="controls">
                    <div className="label">{lang.device.detectFilament.title}</div>
                    <RadioControl
                        id="filament_detect"
                        options={options}
                        default={this.state.config['filament_detect'] || 'delete'}
                        onChange={this._handleComponentValueChange}
                    />
                </div>
            );

            return Object.keys(this.state.config).length > 0 ? content : '';
        }

        _renderFilterHeadErrorSetting = () => {
            let options,
                content;

            options = [
                { id: 'LASER_DOWN', name: lang.device.filterHeadError.laser_down},
                { id: 'FAN_FAILURE', name: lang.device.filterHeadError.fan_failure},
                { id: 'TILT', name: lang.device.filterHeadError.tilt},
                { id: 'SHAKE', name: lang.device.filterHeadError.shake},
                { id: 'N', name: lang.device.filterHeadError.no},
                { id: 'delete', name: lang.device.filterHeadError.byFile}
            ];

            content = (

                <div className="controls">
                    <div className="label">{lang.device.filterHeadError.title}</div>
                    <CheckboxControl
                        id="head_error_level"
                        options={options}
                        default={this.state.config['head_error_level'] || ['delete']}
                        onChange={this._handleComponentValueChange}
                    />
                </div>
            );

            return Object.keys(this.state.config).length > 0 ? content : '';
        }

        _renderAutoResumeSetting = () => {
            let options,
                content;

            options = [
                { id: 'Y', name: lang.device.autoresume.on},
                { id: 'N', name: lang.device.autoresume.off}
            ];

            content = (
                <div className="controls">
                    <div className="label">{lang.device.autoresume.title}</div>
                    <RadioControl
                        id="autoresume"
                        options={options}
                        default={this.state.config['autoresume'] || 'N'}
                        onChange={this._handleComponentValueChange}
                    />
                </div>
            );

            return Object.keys(this.state.config).length > 0 ? content : '';
        }

        _renderBroadcast = () => {
            let options,
                content;

            options = [
                { id: 'L', name: lang.device.broadcast.L},
                { id: 'A', name: lang.device.broadcast.A},
                { id: 'N', name: lang.device.broadcast.N}
            ];

            content = (
                <div className="controls">
                    <div className="label">{lang.device.broadcast.title}</div>
                    <RadioControl
                        id="broadcast"
                        options={options}
                        default={this.state.config['broadcast'] || 'L'}
                        onChange={this._handleComponentValueChange}
                    />
                </div>
            );

            return Object.keys(this.state.config).length > 0 ? content : '';
        }

        _renderEnableCloud = () => {
            let options,
                content;

            options = [
                { id: 'A', name: lang.device.enableCloud.A},
                { id: 'N', name: lang.device.enableCloud.N}
            ];

            content = (
                <div className="controls">
                    <div className="label">{lang.device.enableCloud.title}</div>
                    <RadioControl
                        id="enable_cloud"
                        options={options}
                        default={this.state.config['enable_cloud'] || 'N'}
                        onChange={this._handleComponentValueChange}
                    />
                </div>
            );

            return Object.keys(this.state.config).length > 0 ? content : '';
        }

        _renderBackLash = () => {
            let content;

            content = (
                <div className="controls">
                    <div className="label">{lang.device.backlash}</div>
                    <input
                        id="backlash"
                        value={this.state.backlash}
                        onChange={this._updateBacklash}
                        onBlur={this._updateBacklash}
                    />
                    <label>mm</label>
                </div>
            );

            return (this.state.showBacklash && Object.keys(this.state.config).length > 0) ? content : '';
        }

        _renderCamera = () => {
            if(this.state.allowUpgradeKit) {
                let options,
                    content;

                options = [
                    { id: '0', name: lang.device.disable},
                    { id: '1', name: lang.device.enable}
                ];

                content = (
                    <div className="controls">
                        <div className="label">{lang.device.plus_camera}</div>
                        <RadioControl
                            id="camera_version"
                            options={options}
                            default={this.state.config['camera_version'] || '0'}
                            onChange={this._handleComponentValueChange}
                        />
                    </div>
                );

                return Object.keys(this.state.config).length > 0 ? content : '';
            }
            else {
                return (<div></div>);
            }
        }

        _renderPlusExtrusion = () => {
            if(this.state.allowUpgradeKit) {
                let options,
                    content;

                options = [
                    { id: 'N', name: lang.device.disable},
                    { id: 'Y', name: lang.device.enable}
                ];

                content = (
                    <div className="controls">
                        <div className="label">{lang.device.plus_extrusion}</div>
                        <RadioControl
                            id="plus_extrusion"
                            options={options}
                            default={this.state.config['plus_extrusion'] || 'N'}
                            onChange={this._handleComponentValueChange}
                        />
                    </div>
                );

                return Object.keys(this.state.config).length > 0 ? content : '';
            }
            else {
                return (<div></div>);
            }
        }

        _renderPlayerPostBack = () => {
            if(this.state.allowUpgradeKit) {
                let content = (
                    <div className="controls">
                        <div className="label">{lang.device.postback_url}</div>
                        <input
                            className="url"
                            id="player_postback_url"
                            value={this.state.postbackUrl}
                            onChange={this._updatePostBackUrl}
                            onBlur={this._updatePostBackUrl}
                        />
                    </div>
                );

                return Object.keys(this.state.config).length > 0 ? content : '';
            }
            else {
                return (<div></div>);
            }
        }

        _renderMovementTest = () => {
            if(this.state.allowM666R_MMTest) {
                let options,
                    content;

                options = [
                    { id: 'N', name: lang.device.disable},
                    { id: 'Y', name: lang.device.enable}
                ];

                content = (
                    <div className="controls">
                        <div className="label">{lang.device.movement_test}</div>
                        <RadioControl
                            id="movement_test"
                            options={options}
                            default={this.state.config['movement_test'] || 'Y'}
                            onChange={this._handleComponentValueChange}
                        />
                    </div>
                );

                return Object.keys(this.state.config).length > 0 ? content : '';
            }
            else {
                return (<div></div>);
            }
        }


        _renderMachineRadius = () => {
           let content = (
                <div className="controls">
                    <div className="label">{lang.device.machine_radius}</div>
                    <input
                        id="machine_radius"
                        value={this.state.machine_radius}
                        onChange={this._updateMachineRadius}
                        onBlur={this._updateMachineRadius}
                    />
                    <label>mm</label>
                </div>
            );

            return (this.state.allowM666R_MMTest && Object.keys(this.state.config).length > 0) ? content : '';
        }

        render() {
            const isBeamoxSeries = this.state.device && ['fbb1b', 'fbb1p', 'laser-b1', 'darwin-dev'].includes(this.state.device.model);
            let correction      = this._renderCorrectionSetting(),
                detectFilament  = this._renderDetectFilamentSetting(),
                filterHeadError = this._renderFilterHeadErrorSetting(),
                autoResume      = this._renderAutoResumeSetting(),
                broadcast       = this._renderBroadcast(),
                cloud           = this._renderEnableCloud(),
                backlash        = this._renderBackLash(),
                camera          = this._renderCamera(),
                plusExtrusion   = this._renderPlusExtrusion(),
                playerPostBack  = this._renderPlayerPostBack(),
                movementTest    = this._renderMovementTest(),
                machineRadius   = this._renderMachineRadius();
            const deltaPanel = (
                <div>
                    {correction}
                    {detectFilament}
                    {filterHeadError}
                    {autoResume}
                    {broadcast}
                    {cloud}
                    {backlash}
                    {camera}
                    {plusExtrusion}
                    {playerPostBack}
                    {movementTest}
                    {machineRadius}
                </div>
            );
            const beamboxPanel = (
                <div style={{
                    'margin-top': '20px',
                    'color': '#333'
                }}>
                    {lang.device.beambox_should_use_touch_panel_to_adjust}
                </div>
            );
            return (
                <div className="form general">
                    {this.state.device?isBeamoxSeries?beamboxPanel:deltaPanel:''}
                </div>
            );
        }

    };

    SettingDevice.defaultProps = {
        lang: {},
        supported_langs: '',
        onLangChange: function() {}
    };

    export default SettingDevice;
