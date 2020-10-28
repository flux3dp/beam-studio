/* eslint-disable react/no-multi-comp */
import $ from 'jquery';
import i18n from '../../../helpers/i18n';
import Config from '../../../helpers/api/config';
import SelectView from '../../widgets/Select';
import UnitInput from '../../widgets/Unit-Input-v2';
import AlertActions from '../../actions/alert-actions';
import LocalStorage from '../../../helpers/local-storage';
import BeamboxConstant from '../../actions/beambox/constant';
import BeamboxPreference from '../../actions/beambox/beambox-preference';
import FontFuncs from '../../actions/beambox/font-funcs';
import initializeMachine from '../../actions/initialize-machine';
import { IFont } from '../../../interfaces/IFont';
import { IDeviceInfo } from '../../../interfaces/IDevice';

const React = requireNode('react');
const FontScanner = requireNode('font-scanner');

const Controls = props => {
    const style = { width: 'calc(100% / 10 * 3 - 10px)' };
    const innerHtml = {__html: props.label};
    return (
        <div className='row-fluid'>
            <div className='span3 no-left-margin' style={style}>
                <label className='font2'
                    dangerouslySetInnerHTML={innerHtml}
                />
            </div>
            <div className='span8 font3'>
                {props.children}
            </div>

        </div>
    );
};

class SettingGeneral extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            lang: i18n.lang
        };
        this.origLang = i18n.getActiveLang();
        this.isDefaultMachineRemoved = false;
        this.beamboxPreferenceChanges = {};
        this.configChanges = {};
    }

    _checkIPFormat = (e) => {
        var me = e.currentTarget,
            lang = this.state.lang,
            originalIP = Config().read('poke-ip-addr'),
            ips = me.value.split(/[,;] ?/),
            ipv4Pattern = /^\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}$/g,
            isCorrectFormat = true;

        ips.forEach((ip) => {
            if ('' !== ip && typeof ips === 'string' && false === ipv4Pattern.test(ip)) {
                me.value = originalIP;
                AlertActions.showPopupError('wrong-ip-error', lang.settings.wrong_ip_format + '\n' + ip);
                isCorrectFormat = false;
                return;
            }
        });

        if(isCorrectFormat) {
            this.configChanges['poke-ip-addr'] = me.value;
        }
    }

    _changeActiveLang = (e) => {
        i18n.setActiveLang(e.currentTarget.value);
        this.setState({
            lang: i18n.lang
        });
        this.props.onLangChange(e);
    }

    _updateConfigChange = (id, val) => {
        if (!isNaN(Number(val))) {
            val = Number(val);
        }
        this.configChanges[id] = val;
        this.forceUpdate();
    }

    _getConfigEditingValue = (key) => {
        if (key in this.configChanges) {
            return this.configChanges[key];
        }
        return Config().read(key);
    }

    _updateBeamboxPreferenceChange = (item_key, val) => {
        if (val === 'true') {
            val = true;
        } else if (val === 'false') {
            val = false;
        }
        this.beamboxPreferenceChanges[item_key] = val;
        this.forceUpdate();
    }

    _getBeamboxPreferenceEditingValue = (key) => {
        if (key in this.beamboxPreferenceChanges) {
            return this.beamboxPreferenceChanges[key];
        }
        return BeamboxPreference.read(key);
    }

    _removeDefaultMachine = () => {
        if(confirm(this.state.lang.settings.confirm_remove_default)) {
            this.isDefaultMachineRemoved = true;
            this.forceUpdate();
        }
    }

    _resetBS = () => {
        if(confirm(this.state.lang.settings.confirm_reset)) {
            LocalStorage.clearAllExceptIP();
            localStorage.clear();
            location.hash = '#';
            location.reload();
        }
    }

    _handleDone = () => {
        for (let key in this.configChanges) {
            Config().write(key, this.configChanges[key]);
        }
        for (let key in this.beamboxPreferenceChanges) {
            BeamboxPreference.write(key, this.beamboxPreferenceChanges[key]);
        }
        if (this.isDefaultMachineRemoved) {
            initializeMachine.defaultPrinter.clear();
        }
        location.hash = 'studio/beambox';
        location.reload();
    }

    _handleCancel = () => {
        i18n.setActiveLang(this.origLang);
        location.hash = 'studio/beambox';
        location.reload();
    }

    render() {
        let { supported_langs } = this.props;
        let printer: IDeviceInfo = (this.isDefaultMachineRemoved ? {} : initializeMachine.defaultPrinter.get()) as IDeviceInfo,
            default_machine_button,
            tableStyle = {width: '70%'},
            pokeIP = Config().read('poke-ip-addr'),
            lang = this.state.lang,
            options = [];

        Object.keys(supported_langs).map(l => {
            options.push({
                value: l,
                label: supported_langs[l],
                selected: l === i18n.getActiveLang()
            });
        });

        const notificationOptions = [
            {
                value: 0,
                label: lang.settings.notification_off,
                selected: this._getConfigEditingValue('notification') === 0
            },
            {
                value: 1,
                label: lang.settings.notification_on,
                selected: this._getConfigEditingValue('notification') === 1
            }
        ];

        const updateNotificationOptions = [
            {
                value: 0,
                label: lang.settings.notification_off,
                selected: this._getConfigEditingValue('auto_check_update') === 0
            },
            {
                value: 1,
                label: lang.settings.notification_on,
                selected: this._getConfigEditingValue('auto_check_update') !== 0
            }
        ];

        const GuessingPokeOptions = [
            {
                value: 0,
                label: lang.settings.off,
                selected: this._getConfigEditingValue('guessing_poke') === 0
            },
            {
                value: 1,
                label: lang.settings.on,
                selected: this._getConfigEditingValue('guessing_poke') !== 0
            }
        ];

        const autoConnectOptions = [
            {
                value: 0,
                label: lang.settings.off,
                selected: this._getConfigEditingValue('auto_connect') === 0
            },
            {
                value: 1,
                label: lang.settings.on,
                selected: this._getConfigEditingValue('auto_connect') !== 0
            }
        ];

        const defaultUnitsOptions = [
            {
                value: 'mm',
                label: lang.menu.mm,
                selected: this._getConfigEditingValue('default-units') === 'mm'
            },
            {
                value: 'inches',
                label: lang.menu.inches,
                selected: this._getConfigEditingValue('default-units') === 'inches'
            },
        ];

        const defaultFont: IFont = Config().read('default-font') || {
            family: 'Arial',
            style: 'Regular'
        };
        const fontOptions = FontFuncs.availableFontFamilies.map((family) => {
            return {
                value: family,
                label: family,
                selected: family === defaultFont.family
            }
        });
        const onSelectFont = (family) => {
            const fonts = FontScanner.findFontsSync({ family });
            const newDefaultFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
            const config = Config();
            config.write('default-font', {
                family: newDefaultFont.family,
                postscriptName: newDefaultFont.postscriptName,
                style: newDefaultFont.style,
            });
            this.setState(this.state);
        }
        const fonts = FontScanner.findFontsSync({family: defaultFont.family});
        const fontStyleOptions = fonts.map((font) => {
            return {
                value: font.postscriptName,
                label: font.style,
                selected: font.style === defaultFont.style
            }
        });
        const onSelectFontStyle = (postscriptName) => {
            const newDefaultFont = FontScanner.findFontSync({ postscriptName });
            const config = Config();
            config.write('default-font', {
                family: newDefaultFont.family,
                postscriptName: newDefaultFont.postscriptName,
                style: newDefaultFont.style,
            });
            this.setState(this.state);
        }

        const guideSelectionOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('show_guides') === false
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('show_guides') !== false
            }
        ];

        const imageDownsamplingOptions = [
            {
                value: 'false',
                label: lang.settings.high,
                selected: this._getBeamboxPreferenceEditingValue('image_downsampling') === false
            },
            {
                value: 'true',
                label: lang.settings.low,
                selected: this._getBeamboxPreferenceEditingValue('image_downsampling') !== false
            }
        ];

        const continuousDrawingOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: !this._getBeamboxPreferenceEditingValue('continuous_drawing')
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('continuous_drawing')
            }
        ];

        const fastGradientOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('fast_gradient') === false
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('fast_gradient') !== false
            }
        ];

        const vectorSpeedConstraintOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('vector_speed_contraint') === false
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('vector_speed_contraint') !== false
            }
        ];
        const precutSwitchOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('blade_precut') !== true
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('blade_precut') === true
            }
        ];

        const defaultBeamboxModelOptions = [
            {
                value: 'fbm1',
                label: 'Beamo',
                selected: this._getBeamboxPreferenceEditingValue('model') === 'fbm1'
            },
            {
                value: 'fbb1b',
                label: 'Beambox',
                selected: this._getBeamboxPreferenceEditingValue('model') === 'fbb1b'
            },
            {
                value: 'fbb1p',
                label: 'Beambox Pro',
                selected: this._getBeamboxPreferenceEditingValue('model') === 'fbb1p'
            }
        ];

        const maskOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('enable_mask') === true
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('enable_mask') !== true
            }
        ];

        const textToPathOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('TextbyFluxsvg') !== false
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('TextbyFluxsvg') === false
            }
        ];

        const fontSubstituteOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('font-substitute') !== false
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('font-substitute') === false
            }
        ];

        const borderlessModeOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this._getBeamboxPreferenceEditingValue('default-borderless') === true
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this._getBeamboxPreferenceEditingValue('default-borderless') !== true
            }
        ];

        const autofocusModuleOptions = [
            {
                value: true,
                label: lang.settings.enabled,
                selected: this._getBeamboxPreferenceEditingValue('default-autofocus') === true
            },
            {
                value: false,
                label: lang.settings.disabled,
                selected: this._getBeamboxPreferenceEditingValue('default-autofocus') !== true
            }
        ];

        const diodeModuleOptions = [
            {
                value: true,
                label: lang.settings.enabled,
                selected: this._getBeamboxPreferenceEditingValue('default-diode') == true
            },
            {
                value: false,
                label: lang.settings.disabled,
                selected: this._getBeamboxPreferenceEditingValue('default-diode') !== true
            }
        ];

        if (printer.name !== undefined) {
            default_machine_button = (
                <a className='font3'
                    onClick={this._removeDefaultMachine}
                >
                    {lang.settings.remove_default_machine_button}
                </a>);
        } else {
            default_machine_button = (<span>{lang.settings.default_machine_button}</span>);
        }

        const cameraMovementSpeed = Math.min(BeamboxConstant.camera.movementSpeed.x, BeamboxConstant.camera.movementSpeed.y);

        return (
            <div className='form general'>
                <div className='subtitle'>{lang.settings.groups.general}</div>

                <Controls label={lang.settings.language}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={options}
                        onChange={this._changeActiveLang}
                    />
                </Controls>

                <Controls label={lang.settings.notifications}>
                    <SelectView
                        className='font3'
                        options={notificationOptions}
                        onChange={(e) => this._updateConfigChange('notification', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.update}</div>
                <Controls label={lang.settings.check_updates}>
                    <SelectView
                        className='font3'
                        options={updateNotificationOptions}
                        onChange={(e) => this._updateConfigChange('auto_check_update', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.connection}</div>

                <Controls label={lang.settings.ip}>
                    <input
                        type='text'
                        autoComplete='false'
                        defaultValue={pokeIP}
                        onBlur={this._checkIPFormat}
                    />
                </Controls>

                <Controls label={lang.settings.guess_poke}>
                    <SelectView
                        className='font3'
                        options={GuessingPokeOptions}
                        onChange={(e) => this._updateConfigChange('guessing_poke', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.auto_connect}>
                    <SelectView
                        className='font3'
                        options={autoConnectOptions}
                        onChange={(e) => this._updateConfigChange('auto_connect', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.camera}</div>
                <Controls label={lang.settings.preview_movement_speed}>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in/s' : 'mm/s'}
                        min={3}
                        max={300}
                        decimal={this._getConfigEditingValue('default-units') === 'inches' ? 2 : 0}
                        defaultValue={(this._getBeamboxPreferenceEditingValue('preview_movement_speed') || cameraMovementSpeed) / 60}
                        getValue={val => this._updateBeamboxPreferenceChange('preview_movement_speed', val * 60)}
                        className={{half: true}}
                    />
                </Controls>

                <Controls label={lang.settings.preview_movement_speed_hl}>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in/s' : 'mm/s'}
                        min={3}
                        max={300}
                        decimal={this._getConfigEditingValue('default-units') === 'inches' ? 2 : 0}
                        defaultValue={(this._getBeamboxPreferenceEditingValue('preview_movement_speed_hl') || (cameraMovementSpeed * 0.6)) / 60}
                        getValue={val => this._updateBeamboxPreferenceChange('preview_movement_speed_hl', val * 60)}
                        className={{half: true}}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.editor}</div>

                <Controls label={lang.settings.default_units}>
                    <SelectView
                        className='font3'
                        options={defaultUnitsOptions}
                        onChange={(e) => this._updateConfigChange('default-units', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_font_family}>
                    <SelectView
                        className='font3'
                        options={fontOptions}
                        onChange={(e) => onSelectFont(e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_font_style}>
                    <SelectView
                        className='font3'
                        options={fontStyleOptions}
                        onChange={(e) => onSelectFontStyle(e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_beambox_model}>
                    <SelectView
                        className='font3'
                        options={defaultBeamboxModelOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('model', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.guides}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={guideSelectionOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('show_guides', e.target.value)}
                    />
                </Controls>
                <Controls label={lang.settings.guides_origin}>
                    <span className='font2' style={{marginRight: '10px'}}>X</span>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getWidth()/10}
                        defaultValue={this._getBeamboxPreferenceEditingValue('guide_x0')}
                        getValue={val => this._updateBeamboxPreferenceChange('guide_x0', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                    <span className='font2' style={{marginRight: '10px'}}>Y</span>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getHeight()/10}
                        defaultValue={this._getBeamboxPreferenceEditingValue('guide_y0')}
                        getValue={val => this._updateBeamboxPreferenceChange('guide_y0', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                </Controls>

                <Controls label={lang.settings.image_downsampling}>
                    <SelectView
                        className='font3'
                        options={imageDownsamplingOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('image_downsampling', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.continuous_drawing}>
                    <SelectView
                        className='font3'
                        options={continuousDrawingOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('continuous_drawing', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.engraving}</div>

                <Controls label={lang.settings.fast_gradient}>
                    <SelectView
                        className='font3'
                        options={fastGradientOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('fast_gradient', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.path}</div>

                <Controls label={lang.settings.vector_speed_constraint}>
                    <SelectView
                        className='font3'
                        options={vectorSpeedConstraintOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('vector_speed_contraint', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.loop_compensation}>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={20}
                        defaultValue={Number(this._getConfigEditingValue('loop_compensation') || '0') / 10}
                        getValue={(val) => this._updateConfigChange('loop_compensation', Number(val) * 10)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                </Controls>

                { i18n.getActiveLang() === 'zh-cn' ?
                    <div>
                        <Controls label={lang.settings.blade_radius}>
                            <UnitInput
                                unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={30}
                                step={0.01}
                                defaultValue={this._getBeamboxPreferenceEditingValue('blade_radius') || 0}
                                getValue={val => this._updateBeamboxPreferenceChange('blade_radius', val)}
                                forceUsePropsUnit={true}
                                className={{half: true}}
                            />
                        </Controls>

                        <Controls label={lang.settings.blade_precut_switch}>
                            <SelectView
                                className='font3'
                                options={precutSwitchOptions}
                                onChange={e => this._updateBeamboxPreferenceChange('blade_precut', e.target.value)}
                            />
                        </Controls>

                        <Controls label={lang.settings.blade_precut_position}>
                            <span className='font2' style={{marginRight: '10px'}}>X</span>
                            <UnitInput
                                unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={BeamboxConstant.dimension.getWidth()/10}
                                defaultValue={this._getBeamboxPreferenceEditingValue('precut_x') || 0}
                                getValue={val => this._updateBeamboxPreferenceChange('precut_x', val)}
                                forceUsePropsUnit={true}
                                className={{half: true}}
                            />
                            <span className='font2' style={{marginRight: '10px'}}>Y</span>
                            <UnitInput
                                unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={BeamboxConstant.dimension.getHeight()/10}
                                defaultValue={this._getBeamboxPreferenceEditingValue('precut_y') || 0}
                                getValue={val => this._updateBeamboxPreferenceChange('precut_y', val)}
                                forceUsePropsUnit={true}
                                className={{half: true}}
                            />
                        </Controls>
                    </div> : null
                }

                <div className='subtitle'>{lang.settings.groups.mask}</div>

                <Controls label={lang.settings.mask}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={maskOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('enable_mask', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.text_to_path}</div>

                <Controls label={lang.settings.text_path_calc_optimization}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={textToPathOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('TextbyFluxsvg', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.font_substitute}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={fontSubstituteOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('font-substitute', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.modules}</div>

                <Controls label={lang.settings.default_borderless_mode}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={borderlessModeOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('default-borderless', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_enable_autofocus_module}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={autofocusModuleOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('default-autofocus', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_enable_diode_module}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={diodeModuleOptions}
                        onChange={e => this._updateBeamboxPreferenceChange('default-diode', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.diode_offset}>
                    <span className='font2' style={{marginRight: '10px'}}>X</span>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getWidth()/10}
                        defaultValue={this._getBeamboxPreferenceEditingValue('diode_offset_x') || 0}
                        getValue={val => this._updateBeamboxPreferenceChange('diode_offset_x', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                    <span className='font2' style={{marginRight: '10px'}}>Y</span>
                    <UnitInput
                        unit={this._getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getHeight()/10}
                        defaultValue={this._getBeamboxPreferenceEditingValue('diode_offset_y') || 0}
                        getValue={val => this._updateBeamboxPreferenceChange('diode_offset_y', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                </Controls>

                <a className='font5' onClick={this._resetBS}>
                    <b>{lang.settings.reset_now}</b>
                </a>
                <div className="clearfix" />
                <a className="btn btn-done" onClick={this._handleDone}>{lang.settings.done}</a>
                <a className="btn btn-cancel" onClick={this._handleCancel}>{lang.settings.cancel}</a>
            </div>
        );
    }
};

SettingGeneral.defaultProps = {
    lang: {},
    supported_langs: '',
    onLangChange: function() {}
};

export default SettingGeneral;
