/* eslint-disable react/no-multi-comp */
import $ from 'jquery';
import SelectView from 'app/widgets/Select';
import UnitInput from 'app/widgets/Unit-Input-v2';
import alert from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import BeamboxConstant from 'app/actions/beambox/constant';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import FontFuncs from 'app/actions/beambox/font-funcs';
import Config from 'helpers/api/config';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';
import { IFont } from 'interfaces/IFont';
import { IDeviceInfo } from 'interfaces/IDevice';

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

    checkIPFormat = (e) => {
        let me = e.currentTarget,
            lang = this.state.lang,
            originalIP = this.getConfigEditingValue('poke-ip-addr'),
            ips = me.value.split(/[,;] ?/),
            ipv4Pattern = /^\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}$/;

        for (let i = 0; i < ips.length; i++) {
            const ip = ips[i];
            if ('' !== ip && typeof ip === 'string' && false === ipv4Pattern.test(ip)) {
                me.value = originalIP;
                alert.popUp({
                    id: 'wrong-ip-error',
                    type: alertConstants.SHOW_POPUP_ERROR,
                    message: lang.settings.wrong_ip_format + '\n' + ip,
                })
                return;
            }
        }

        this.configChanges['poke-ip-addr'] = me.value;
    }

    changeActiveLang = (e) => {
        i18n.setActiveLang(e.currentTarget.value);
        this.setState({
            lang: i18n.lang
        });
        this.props.onLangChange(e);
    }

    updateConfigChange = (id, val) => {
        if (!isNaN(Number(val))) {
            val = Number(val);
        }
        this.configChanges[id] = val;
        this.forceUpdate();
    }

    getConfigEditingValue = (key) => {
        if (key in this.configChanges) {
            return this.configChanges[key];
        }
        return Config().read(key);
    }

    updateBeamboxPreferenceChange = (item_key, val) => {
        if (val === 'true') {
            val = true;
        } else if (val === 'false') {
            val = false;
        }
        this.beamboxPreferenceChanges[item_key] = val;
        this.forceUpdate();
    }

    getBeamboxPreferenceEditingValue = (key) => {
        if (key in this.beamboxPreferenceChanges) {
            return this.beamboxPreferenceChanges[key];
        }
        return BeamboxPreference.read(key);
    }

    removeDefaultMachine = () => {
        if(confirm(this.state.lang.settings.confirm_remove_default)) {
            this.isDefaultMachineRemoved = true;
            this.forceUpdate();
        }
    }

    resetBS = () => {
        if(confirm(this.state.lang.settings.confirm_reset)) {
            storage.clearAllExceptIP();
            localStorage.clear();
            location.hash = '#';
            location.reload();
        }
    }

    handleDone = () => {
        for (let key in this.configChanges) {
            Config().write(key, this.configChanges[key]);
        }
        for (let key in this.beamboxPreferenceChanges) {
            BeamboxPreference.write(key, this.beamboxPreferenceChanges[key]);
        }
        // if (this.isDefaultMachineRemoved) {
        //     initializeMachine.defaultPrinter.clear();
        // }
        location.hash = 'studio/beambox';
        location.reload();
    }

    _handleCancel = () => {
        i18n.setActiveLang(this.origLang);
        location.hash = 'studio/beambox';
        location.reload();
    }

    render() {
        const { supported_langs } = this.props;
        // const printer: IDeviceInfo = (this.isDefaultMachineRemoved ? {} : initializeMachine.defaultPrinter.get()) as IDeviceInfo;
        // let default_machine_button;
        const pokeIP = Config().read('poke-ip-addr');
        const lang = this.state.lang;
        const options = [];

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
                selected: this.getConfigEditingValue('notification') === 0
            },
            {
                value: 1,
                label: lang.settings.notification_on,
                selected: this.getConfigEditingValue('notification') === 1
            }
        ];

        const updateNotificationOptions = [
            {
                value: 0,
                label: lang.settings.notification_off,
                selected: this.getConfigEditingValue('auto_check_update') === 0
            },
            {
                value: 1,
                label: lang.settings.notification_on,
                selected: this.getConfigEditingValue('auto_check_update') !== 0
            }
        ];

        const guessingPokeOptions = [
            {
                value: 0,
                label: lang.settings.off,
                selected: this.getConfigEditingValue('guessing_poke') === 0
            },
            {
                value: 1,
                label: lang.settings.on,
                selected: this.getConfigEditingValue('guessing_poke') !== 0
            }
        ];

        const autoConnectOptions = [
            {
                value: 0,
                label: lang.settings.off,
                selected: this.getConfigEditingValue('auto_connect') === 0
            },
            {
                value: 1,
                label: lang.settings.on,
                selected: this.getConfigEditingValue('auto_connect') !== 0
            }
        ];

        const defaultUnitsOptions = [
            {
                value: 'mm',
                label: lang.menu.mm,
                selected: this.getConfigEditingValue('default-units') === 'mm'
            },
            {
                value: 'inches',
                label: lang.menu.inches,
                selected: this.getConfigEditingValue('default-units') === 'inches'
            },
        ];

        const defaultFont = Config().read('default-font') as IFont || {
            family: 'Arial',
            style: 'Regular'
        };
        const fontOptions = FontFuncs.availableFontFamilies.map((family) => {
            const fontName = FontFuncs.fontNameMap.get(family);
            const label = typeof fontName === 'string' ? fontName : family;
            return {
                value: family,
                label: label,
                selected: family === defaultFont.family
            }
        });
        const onSelectFont = (family) => {
            const fonts = FontFuncs.requestFontsOfTheFontFamily(family);
            const newDefaultFont = fonts.filter((font) => font.style === 'Regular')[0] || fonts[0];
            const config = Config();
            config.write('default-font', {
                family: newDefaultFont.family,
                postscriptName: newDefaultFont.postscriptName,
                style: newDefaultFont.style,
            });
            this.setState(this.state);
        }
        const fonts = FontFuncs.requestFontsOfTheFontFamily(defaultFont.family);
        const fontStyleOptions = fonts.map((font) => {
            return {
                value: font.postscriptName,
                label: font.style,
                selected: font.style === defaultFont.style
            }
        });
        const onSelectFontStyle = (postscriptName) => {
            const newDefaultFont = FontFuncs.getFontOfPostscriptName(postscriptName);
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
                selected: this.getBeamboxPreferenceEditingValue('show_guides') === false
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('show_guides') !== false
            }
        ];

        const imageDownsamplingOptions = [
            {
                value: 'false',
                label: lang.settings.high,
                selected: this.getBeamboxPreferenceEditingValue('image_downsampling') === false
            },
            {
                value: 'true',
                label: lang.settings.low,
                selected: this.getBeamboxPreferenceEditingValue('image_downsampling') !== false
            }
        ];

        const continuousDrawingOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: !this.getBeamboxPreferenceEditingValue('continuous_drawing')
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('continuous_drawing')
            }
        ];

        const simplifyClipperPath = [
            {
                value: 'true',
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('simplify_clipper_path')
            },
            {
                value: 'false',
                label: lang.settings.off,
                selected: !this.getBeamboxPreferenceEditingValue('simplify_clipper_path')
            }
        ];

        const fastGradientOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('fast_gradient') === false
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('fast_gradient') !== false
            }
        ];

        const vectorSpeedConstraintOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('vector_speed_contraint') === false
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('vector_speed_contraint') !== false
            }
        ];
        const precutSwitchOptions = [
            {
                value: 'false',
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('blade_precut') !== true
            },
            {
                value: 'true',
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('blade_precut') === true
            }
        ];

        const defaultBeamboxModelOptions = [
            {
                value: 'fbm1',
                label: 'beamo',
                selected: this.getBeamboxPreferenceEditingValue('model') === 'fbm1'
            },
            {
                value: 'fbb1b',
                label: 'Beambox',
                selected: this.getBeamboxPreferenceEditingValue('model') === 'fbb1b'
            },
            {
                value: 'fbb1p',
                label: 'Beambox Pro',
                selected: this.getBeamboxPreferenceEditingValue('model') === 'fbb1p'
            }
        ];

        const maskOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('enable_mask') === true
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('enable_mask') !== true
            }
        ];

        const textToPathOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('TextbyFluxsvg') !== false
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('TextbyFluxsvg') === false
            }
        ];

        const fontSubstituteOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('font-substitute') !== false
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('font-substitute') === false
            }
        ];

        const borderlessModeOptions = [
            {
                value: true,
                label: lang.settings.on,
                selected: this.getBeamboxPreferenceEditingValue('default-borderless') === true
            },
            {
                value: false,
                label: lang.settings.off,
                selected: this.getBeamboxPreferenceEditingValue('default-borderless') !== true
            }
        ];

        const autofocusModuleOptions = [
            {
                value: true,
                label: lang.settings.enabled,
                selected: this.getBeamboxPreferenceEditingValue('default-autofocus') === true
            },
            {
                value: false,
                label: lang.settings.disabled,
                selected: this.getBeamboxPreferenceEditingValue('default-autofocus') !== true
            }
        ];

        const diodeModuleOptions = [
            {
                value: true,
                label: lang.settings.enabled,
                selected: this.getBeamboxPreferenceEditingValue('default-diode') === true
            },
            {
                value: false,
                label: lang.settings.disabled,
                selected: this.getBeamboxPreferenceEditingValue('default-diode') !== true
            }
        ];

        const enableSentryOptions = [
            {
                value: 0,
                label: lang.settings.off,
                selected: this.getConfigEditingValue('enable-sentry') !== 1
            },
            {
                value: 1,
                label: lang.settings.on,
                selected: this.getConfigEditingValue('enable-sentry') === 1
            }
        ];

        // if (printer.name !== undefined) {
        //     default_machine_button = (
        //         <a className='font3'
        //             onClick={this.removeDefaultMachine}
        //         >
        //             {lang.settings.remove_default_machine_button}
        //         </a>);
        // } else {
        //     default_machine_button = (<span>{lang.settings.default_machine_button}</span>);
        // }

        const cameraMovementSpeed = Math.min(BeamboxConstant.camera.movementSpeed.x, BeamboxConstant.camera.movementSpeed.y);

        return (
            <div className='form general'>
                <div className='subtitle'>{lang.settings.groups.general}</div>

                <Controls label={lang.settings.language}>
                    <SelectView
                        id='select-lang'
                        className='font3'
                        options={options}
                        onChange={this.changeActiveLang}
                    />
                </Controls>

                <Controls label={lang.settings.notifications}>
                    <SelectView
                        className='font3'
                        options={notificationOptions}
                        onChange={(e) => this.updateConfigChange('notification', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.update}</div>
                <Controls label={lang.settings.check_updates}>
                    <SelectView
                        className='font3'
                        options={updateNotificationOptions}
                        onChange={(e) => this.updateConfigChange('auto_check_update', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.connection}</div>

                <Controls label={lang.settings.ip}>
                    <input
                        type='text'
                        autoComplete='false'
                        defaultValue={pokeIP}
                        onBlur={this.checkIPFormat}
                    />
                </Controls>

                <Controls label={lang.settings.guess_poke}>
                    <SelectView
                        className='font3'
                        options={guessingPokeOptions}
                        onChange={(e) => this.updateConfigChange('guessing_poke', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.auto_connect}>
                    <SelectView
                        className='font3'
                        options={autoConnectOptions}
                        onChange={(e) => this.updateConfigChange('auto_connect', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.camera}</div>
                <Controls label={lang.settings.preview_movement_speed}>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in/s' : 'mm/s'}
                        min={3}
                        max={300}
                        decimal={this.getConfigEditingValue('default-units') === 'inches' ? 2 : 0}
                        defaultValue={(this.getBeamboxPreferenceEditingValue('preview_movement_speed') || cameraMovementSpeed) / 60}
                        getValue={val => this.updateBeamboxPreferenceChange('preview_movement_speed', val * 60)}
                        className={{half: true}}
                    />
                </Controls>

                <Controls label={lang.settings.preview_movement_speed_hl}>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in/s' : 'mm/s'}
                        min={3}
                        max={300}
                        decimal={this.getConfigEditingValue('default-units') === 'inches' ? 2 : 0}
                        defaultValue={(this.getBeamboxPreferenceEditingValue('preview_movement_speed_hl') || (cameraMovementSpeed * 0.6)) / 60}
                        getValue={val => this.updateBeamboxPreferenceChange('preview_movement_speed_hl', val * 60)}
                        className={{half: true}}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.editor}</div>

                <Controls label={lang.settings.default_units}>
                    <SelectView
                        className='font3'
                        options={defaultUnitsOptions}
                        onChange={(e) => this.updateConfigChange('default-units', e.target.value)}
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
                        onChange={(e) => this.updateBeamboxPreferenceChange('model', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.guides}>
                    <SelectView
                        id='set-guide'
                        className='font3'
                        options={guideSelectionOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('show_guides', e.target.value)}
                    />
                </Controls>
                <Controls label={lang.settings.guides_origin}>
                    <span className='font2' style={{marginRight: '10px'}}>X</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getWidth()/10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('guide_x0')}
                        getValue={val => this.updateBeamboxPreferenceChange('guide_x0', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                    <span className='font2' style={{marginRight: '10px'}}>Y</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getHeight()/10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('guide_y0')}
                        getValue={val => this.updateBeamboxPreferenceChange('guide_y0', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                </Controls>

                <Controls label={lang.settings.image_downsampling}>
                    <SelectView
                        className='font3'
                        options={imageDownsamplingOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('image_downsampling', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.continuous_drawing}>
                    <SelectView
                        className='font3'
                        options={continuousDrawingOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('continuous_drawing', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.simplify_clipper_path}>
                    <SelectView
                        className='font3'
                        options={simplifyClipperPath}
                        onChange={(e) => this.updateBeamboxPreferenceChange('simplify_clipper_path', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.engraving}</div>

                <Controls label={lang.settings.fast_gradient}>
                    <SelectView
                        className='font3'
                        options={fastGradientOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('fast_gradient', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.path}</div>

                <Controls label={lang.settings.vector_speed_constraint}>
                    <SelectView
                        className='font3'
                        options={vectorSpeedConstraintOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('vector_speed_contraint', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.loop_compensation}>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={20}
                        defaultValue={Number(this.getConfigEditingValue('loop_compensation') || '0') / 10}
                        getValue={(val) => this.updateConfigChange('loop_compensation', Number(val) * 10)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                </Controls>

                { i18n.getActiveLang() === 'zh-cn' ?
                    <div>
                        <Controls label={lang.settings.blade_radius}>
                            <UnitInput
                                unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={30}
                                step={0.01}
                                defaultValue={this.getBeamboxPreferenceEditingValue('blade_radius') || 0}
                                getValue={val => this.updateBeamboxPreferenceChange('blade_radius', val)}
                                forceUsePropsUnit={true}
                                className={{half: true}}
                            />
                        </Controls>

                        <Controls label={lang.settings.blade_precut_switch}>
                            <SelectView
                                className='font3'
                                options={precutSwitchOptions}
                                onChange={(e) => this.updateBeamboxPreferenceChange('blade_precut', e.target.value)}
                            />
                        </Controls>

                        <Controls label={lang.settings.blade_precut_position}>
                            <span className='font2' style={{marginRight: '10px'}}>X</span>
                            <UnitInput
                                unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={BeamboxConstant.dimension.getWidth()/10}
                                defaultValue={this.getBeamboxPreferenceEditingValue('precut_x') || 0}
                                getValue={val => this.updateBeamboxPreferenceChange('precut_x', val)}
                                forceUsePropsUnit={true}
                                className={{half: true}}
                            />
                            <span className='font2' style={{marginRight: '10px'}}>Y</span>
                            <UnitInput
                                unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={BeamboxConstant.dimension.getHeight()/10}
                                defaultValue={this.getBeamboxPreferenceEditingValue('precut_y') || 0}
                                getValue={val => this.updateBeamboxPreferenceChange('precut_y', val)}
                                forceUsePropsUnit={true}
                                className={{half: true}}
                            />
                        </Controls>
                    </div> : null
                }

                <div className='subtitle'>{lang.settings.groups.mask}</div>

                <Controls label={lang.settings.mask}>
                    <SelectView
                        id='set-mask'
                        className='font3'
                        options={maskOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('enable_mask', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.text_to_path}</div>

                <Controls label={lang.settings.text_path_calc_optimization}>
                    <SelectView
                        id='text-optimize'
                        className='font3'
                        options={textToPathOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('TextbyFluxsvg', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.font_substitute}>
                    <SelectView
                        id='font-substitue'
                        className='font3'
                        options={fontSubstituteOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('font-substitute', e.target.value)}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.modules}</div>

                <Controls label={lang.settings.default_borderless_mode}>
                    <SelectView
                        id='default-open-bottom'
                        className='font3'
                        options={borderlessModeOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('default-borderless', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_enable_autofocus_module}>
                    <SelectView
                        id='default-autofocus'
                        className='font3'
                        options={autofocusModuleOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('default-autofocus', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.default_enable_diode_module}>
                    <SelectView
                        id='default-diode'
                        className='font3'
                        options={diodeModuleOptions}
                        onChange={(e) => this.updateBeamboxPreferenceChange('default-diode', e.target.value)}
                    />
                </Controls>

                <Controls label={lang.settings.diode_offset}>
                    <span className='font2' style={{marginRight: '10px'}}>X</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getWidth()/10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('diode_offset_x') || 0}
                        getValue={val => this.updateBeamboxPreferenceChange('diode_offset_x', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                    <span className='font2' style={{marginRight: '10px'}}>Y</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getHeight()/10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('diode_offset_y') || 0}
                        getValue={val => this.updateBeamboxPreferenceChange('diode_offset_y', val)}
                        forceUsePropsUnit={true}
                        className={{half: true}}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.privacy}</div>

                <Controls label={lang.settings.share_with_flux}>
                    <SelectView
                        id='set-sentry'
                        className='font3'
                        options={enableSentryOptions}
                        onChange={(e) => this.updateConfigChange('enable-sentry', e.target.value)}
                    />
                </Controls>


                <a className='font5' onClick={this.resetBS}>
                    <b>{lang.settings.reset_now}</b>
                </a>
                <div className="clearfix" />
                <a className="btn btn-done" onClick={this.handleDone}>{lang.settings.done}</a>
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
