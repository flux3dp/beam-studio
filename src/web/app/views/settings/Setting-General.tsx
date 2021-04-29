/* eslint-disable react/no-multi-comp */
import PathInput, { InputType } from 'app/widgets/PathInput';
import SelectView from 'app/widgets/Select';
import UnitInput from 'app/widgets/Unit-Input-v2';
import alert from 'app/actions/alert-caller';
import alertConstants from 'app/constants/alert-constants';
import BeamboxConstant from 'app/actions/beambox/constant';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import FontFuncs from 'app/actions/beambox/font-funcs';
import Config from 'helpers/api/config';
import autoSaveHelper from 'helpers/auto-save-helper';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';
import { IConfig } from 'interfaces/IAutosave';
import { IFont } from 'interfaces/IFont';
import { ILang } from 'interfaces/ILang';

const React = requireNode('react');
const classNames = requireNode('classnames');

const Controls = (props) => {
    const style = { width: 'calc(100% / 10 * 3 - 10px)' };
    const innerHtml = { __html: props.label };

    const warningIcon = () => {
        if (props.warningText) {
            return (<img src='img/warning.svg' title={props.warningText}/>);
        }
        return null;
    }

    return (
        <div className='row-fluid'>
            <div className='span3 no-left-margin' style={style}>
                <label className='font2'
                    dangerouslySetInnerHTML={innerHtml}
                />
            </div>
            <div className='span8 font3'>
                {props.children}
                {warningIcon()}
            </div>
        </div>
    );
};

enum OptionValues {
    TRUE = 'TRUE',
    FALSE = 'FALSE',
};

interface ISelectControlProps {
    id?: string,
    label: string,
    onChange: (e) => void,
    options: any[],
}
const SelectControl = ({ id, label, onChange, options }: ISelectControlProps) => {
    return (
        <Controls label={label}>
            <SelectView
                id={id}
                className='font3'
                options={options}
                onChange={onChange}
            />
        </Controls>
    );
}

class SettingGeneral extends React.Component {
    private state: {
        lang?: ILang,
        editingAutosaveConfig?: IConfig,
        warnings?: { [key: string]: string},
    }
    constructor(props) {
        super(props);
        this.state = {
            lang: i18n.lang,
            editingAutosaveConfig: autoSaveHelper.getConfig(),
            warnings: {},
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

    getConfigEditingValue = (key: string) => {
        if (key in this.configChanges) {
            return this.configChanges[key];
        }
        return Config().read(key);
    }

    updateBeamboxPreferenceChange = (item_key: string, val) => {
        if (val === OptionValues.TRUE) {
            val = true;
        } else if (val === OptionValues.FALSE) {
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
        if (confirm(this.state.lang.settings.confirm_remove_default)) {
            this.isDefaultMachineRemoved = true;
            this.forceUpdate();
        }
    }

    resetBS = () => {
        if (confirm(this.state.lang.settings.confirm_reset)) {
            storage.clearAllExceptIP();
            localStorage.clear();
            autoSaveHelper.useDefaultConfig();
            location.hash = '#';
            location.reload();
        }
    }

    handleDone = () => {
        const { editingAutosaveConfig } = this.state;
        for (let key in this.configChanges) {
            Config().write(key, this.configChanges[key]);
        }
        for (let key in this.beamboxPreferenceChanges) {
            BeamboxPreference.write(key, this.beamboxPreferenceChanges[key]);
        }
        autoSaveHelper.setConfig(editingAutosaveConfig);
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

    onOffOptionFactory = (isOnSelected: boolean, onValue?, offValue?, onLabel?: string, offLabel?: string) => {
        const { lang } = this.state;
        onLabel = onLabel || lang.settings.on;
        offLabel = offLabel || lang.settings.off;
        onValue = onValue !== undefined ? onValue : OptionValues.TRUE;
        offValue = offValue !== undefined ? offValue : OptionValues.FALSE;

        return [
            {
                value: onValue,
                label: onLabel,
                selected: isOnSelected,
            },
            {
                value: offValue,
                label: offLabel,
                selected: !isOnSelected,
            }
        ];
    }

    renderAutosaveBlock() {
        const { lang, editingAutosaveConfig, warnings } = this.state;
        const isAutoSaveOn = editingAutosaveConfig.enabled;
        const autoSaveOptions = this.onOffOptionFactory(isAutoSaveOn);
        return (
            <div>
                <div className='subtitle'>{lang.settings.groups.autosave}</div>
                <SelectControl
                    label={lang.settings.autosave_enabled}
                    options={autoSaveOptions}
                    onChange={(e) => {
                        const enabled = e.target.value === OptionValues.TRUE;
                        editingAutosaveConfig.enabled = enabled;
                        this.setState({ editingAutosaveConfig });
                    }}
                />
                <Controls
                    label={lang.settings.autosave_path}
                    warningText={warnings['autosave_directory']}
                >
                    <PathInput
                        buttonTitle={lang.general.choose_folder}
                        className={classNames({ 'with-error': !!warnings['autosave_directory'] })}
                        defaultValue={editingAutosaveConfig.directory}
                        forceValidValue={false}
                        getValue={(val: string, isValid: boolean) => {
                            editingAutosaveConfig.directory = val;
                            if (!isValid) {
                                warnings['autosave_directory'] = lang.settings.autosave_path_not_correct;
                            } else {
                                delete warnings['autosave_directory'];
                            }
                            this.setState({ editingAutosaveConfig, warnings });
                        }}
                        type={InputType.FOLDER}
                    />
                </Controls>
                <Controls label={lang.settings.autosave_interval}>
                    <UnitInput
                        unit={lang.monitor.minute}
                        min={1}
                        max={60}
                        decimal={0}
                        defaultValue={editingAutosaveConfig.timeInterval}
                        getValue={(val: number) => {
                            editingAutosaveConfig.timeInterval = val;
                            this.setState({ editingAutosaveConfig });
                        }}
                        className={{ half: true }}
                    />
                </Controls>
                <Controls label={lang.settings.autosave_number}>
                    <UnitInput
                        min={1}
                        max={10}
                        decimal={0}
                        defaultValue={editingAutosaveConfig.fileNumber}
                        getValue={(val: number) => {
                            editingAutosaveConfig.fileNumber = val;
                            this.setState({ editingAutosaveConfig });
                        }}
                        className={{ half: true }}
                    />
                </Controls>
            </div>
        );
    }

    render() {
        const { supported_langs } = this.props;
        const { lang, warnings } = this.state;
        const pokeIP = Config().read('poke-ip-addr');
        const langOptions = [];

        Object.keys(supported_langs).map(l => {
            langOptions.push({
                value: l,
                label: supported_langs[l],
                selected: l === i18n.getActiveLang()
            });
        });

        const isNotificationOn = this.getConfigEditingValue('notification') === 1;
        const notificationOptions = this.onOffOptionFactory(isNotificationOn, 1, 0, lang.settings.notification_on, lang.settings.notification_off);

        const isAutoCheckUpdateOn = this.getConfigEditingValue('auto_check_update') !== 0;
        const updateNotificationOptions = this.onOffOptionFactory(isAutoCheckUpdateOn, 1, 0, lang.settings.notification_on, lang.settings.notification_off);

        const isGuessingPokeOn = this.getConfigEditingValue('guessing_poke') !== 0;
        const guessingPokeOptions = this.onOffOptionFactory(isGuessingPokeOn, 1, 0);

        const isAutoConnectOn = this.getConfigEditingValue('auto_connect') !== 0;
        const autoConnectOptions = this.onOffOptionFactory(isAutoConnectOn, 1, 0);

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

        const isGuideOpened = this.getBeamboxPreferenceEditingValue('show_guides') !== false;
        const guideSelectionOptions = this.onOffOptionFactory(isGuideOpened);

        const isDownsamplingOn = this.getBeamboxPreferenceEditingValue('image_downsampling') !== false;
        const imageDownsamplingOptions = this.onOffOptionFactory(isDownsamplingOn, OptionValues.TRUE, OptionValues.FALSE, lang.settings.low, lang.settings.high);

        const isContinuousDrawingOn = this.getBeamboxPreferenceEditingValue('continuous_drawing');
        const continuousDrawingOptions = this.onOffOptionFactory(isContinuousDrawingOn);

        const isSimplifyClipperPathOn = this.getBeamboxPreferenceEditingValue('simplify_clipper_path');
        const simplifyClipperPath = this.onOffOptionFactory(isSimplifyClipperPathOn);

        const isFastGradientOn = this.getBeamboxPreferenceEditingValue('fast_gradient') !== false;
        const fastGradientOptions = this.onOffOptionFactory(isFastGradientOn);

        const isVectorSpeedConstrainOn = this.getBeamboxPreferenceEditingValue('vector_speed_contraint') !== false;
        const vectorSpeedConstraintOptions = this.onOffOptionFactory(isVectorSpeedConstrainOn);

        const isPrecutSwitchOn = this.getBeamboxPreferenceEditingValue('blade_precut') === true;
        const precutSwitchOptions = this.onOffOptionFactory(isPrecutSwitchOn);

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

        const isMaskEnabled = this.getBeamboxPreferenceEditingValue('enable_mask');
        const maskOptions = this.onOffOptionFactory(isMaskEnabled);

        const isTextByFluxSVGOn = this.getBeamboxPreferenceEditingValue('TextbyFluxsvg') !== false;
        const textToPathOptions = this.onOffOptionFactory(isTextByFluxSVGOn);

        const isFontSubstitutionOn = this.getBeamboxPreferenceEditingValue('font-substitute') !== false;
        const fontSubstituteOptions = this.onOffOptionFactory(isFontSubstitutionOn);

        const isDefaultBorderlessOn = this.getBeamboxPreferenceEditingValue('default-borderless');
        const borderlessModeOptions = this.onOffOptionFactory(isDefaultBorderlessOn);

        const isDefaultAutofocusOn = this.getBeamboxPreferenceEditingValue('default-autofocus');
        const autofocusModuleOptions = this.onOffOptionFactory(isDefaultAutofocusOn);

        const isDefaultDiodeOn = this.getBeamboxPreferenceEditingValue('default-diode');
        const diodeModuleOptions = this.onOffOptionFactory(isDefaultDiodeOn);

        const isSentryEnabled = this.getConfigEditingValue('enable-sentry') === 1;
        const enableSentryOptions = this.onOffOptionFactory(isSentryEnabled, 1, 0);

        const cameraMovementSpeed = Math.min(BeamboxConstant.camera.movementSpeed.x, BeamboxConstant.camera.movementSpeed.y);

        const isAllValid = !warnings || (Object.keys(warnings).length === 0);

        return (
            <div className='form general'>
                <div className='subtitle'>{lang.settings.groups.general}</div>
                <SelectControl
                    label={lang.settings.language}
                    id='select-lang'
                    options={langOptions}
                    onChange={this.changeActiveLang}
                />
                <SelectControl
                    label={lang.settings.notifications}
                    options={notificationOptions}
                    onChange={(e) => this.updateConfigChange('notification', e.target.value)}
                />

                <div className='subtitle'>{lang.settings.groups.update}</div>
                <SelectControl
                    label={lang.settings.check_updates}
                    options={updateNotificationOptions}
                    onChange={(e) => this.updateConfigChange('auto_check_update', e.target.value)}
                />

                <div className='subtitle'>{lang.settings.groups.connection}</div>
                <Controls label={lang.settings.ip}>
                    <input
                        type='text'
                        autoComplete='false'
                        defaultValue={pokeIP}
                        onBlur={this.checkIPFormat}
                    />
                </Controls>
                <SelectControl
                    label={lang.settings.guess_poke}
                    options={guessingPokeOptions}
                    onChange={(e) => this.updateConfigChange('guessing_poke', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.auto_connect}
                    options={autoConnectOptions}
                    onChange={(e) => this.updateConfigChange('auto_connect', e.target.value)}
                />

                {this.renderAutosaveBlock()}

                <div className='subtitle'>{lang.settings.groups.camera}</div>
                <Controls label={lang.settings.preview_movement_speed}>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in/s' : 'mm/s'}
                        min={3}
                        max={300}
                        decimal={this.getConfigEditingValue('default-units') === 'inches' ? 2 : 0}
                        defaultValue={(this.getBeamboxPreferenceEditingValue('preview_movement_speed') || cameraMovementSpeed) / 60}
                        getValue={val => this.updateBeamboxPreferenceChange('preview_movement_speed', val * 60)}
                        className={{ half: true }}
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
                        className={{ half: true }}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.editor}</div>
                <SelectControl
                    label={lang.settings.default_units}
                    options={defaultUnitsOptions}
                    onChange={(e) => this.updateConfigChange('default-units', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.default_font_family}
                    options={fontOptions}
                    onChange={(e) => onSelectFont(e.target.value)}
                />
                <SelectControl
                    label={lang.settings.default_font_style}
                    options={fontStyleOptions}
                    onChange={(e) => onSelectFontStyle(e.target.value)}
                />
                <SelectControl
                    label={lang.settings.default_beambox_model}
                    options={defaultBeamboxModelOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('model', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.guides}
                    id='set-guide'
                    options={guideSelectionOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('show_guides', e.target.value)}
                />
                <Controls label={lang.settings.guides_origin}>
                    <span className='font2' style={{ marginRight: '10px' }}>X</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getWidth(BeamboxPreference.read('model')) / 10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('guide_x0')}
                        getValue={val => this.updateBeamboxPreferenceChange('guide_x0', val)}
                        forceUsePropsUnit={true}
                        className={{ half: true }}
                    />
                    <span className='font2' style={{ marginRight: '10px' }}>Y</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getHeight(BeamboxPreference.read('model')) / 10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('guide_y0')}
                        getValue={val => this.updateBeamboxPreferenceChange('guide_y0', val)}
                        forceUsePropsUnit={true}
                        className={{ half: true }}
                    />
                </Controls>
                <SelectControl
                    label={lang.settings.image_downsampling}
                    options={imageDownsamplingOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('image_downsampling', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.continuous_drawing}
                    options={continuousDrawingOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('continuous_drawing', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.simplify_clipper_path}
                    options={simplifyClipperPath}
                    onChange={(e) => this.updateBeamboxPreferenceChange('simplify_clipper_path', e.target.value)}
                />

                <div className='subtitle'>{lang.settings.groups.engraving}</div>
                <SelectControl
                    label={lang.settings.fast_gradient}
                    options={fastGradientOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('fast_gradient', e.target.value)}
                />

                <div className='subtitle'>{lang.settings.groups.path}</div>
                <SelectControl
                    label={lang.settings.vector_speed_constraint}
                    options={vectorSpeedConstraintOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('vector_speed_contraint', e.target.value)}
                />
                <Controls label={lang.settings.loop_compensation}>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={20}
                        defaultValue={Number(this.getConfigEditingValue('loop_compensation') || '0') / 10}
                        getValue={(val) => this.updateConfigChange('loop_compensation', Number(val) * 10)}
                        forceUsePropsUnit={true}
                        className={{ half: true }}
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
                                className={{ half: true }}
                            />
                        </Controls>
                        <SelectControl
                            label={lang.settings.blade_precut_switch}
                            options={precutSwitchOptions}
                            onChange={(e) => this.updateBeamboxPreferenceChange('blade_precut', e.target.value)}
                        />
                        <Controls label={lang.settings.blade_precut_position}>
                            <span className='font2' style={{ marginRight: '10px' }}>X</span>
                            <UnitInput
                                unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={BeamboxConstant.dimension.getWidth(BeamboxPreference.read('model')) / 10}
                                defaultValue={this.getBeamboxPreferenceEditingValue('precut_x') || 0}
                                getValue={val => this.updateBeamboxPreferenceChange('precut_x', val)}
                                forceUsePropsUnit={true}
                                className={{ half: true }}
                            />
                            <span className='font2' style={{ marginRight: '10px' }}>Y</span>
                            <UnitInput
                                unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                                min={0}
                                max={BeamboxConstant.dimension.getHeight(BeamboxPreference.read('model')) / 10}
                                defaultValue={this.getBeamboxPreferenceEditingValue('precut_y') || 0}
                                getValue={val => this.updateBeamboxPreferenceChange('precut_y', val)}
                                forceUsePropsUnit={true}
                                className={{ half: true }}
                            />
                        </Controls>
                    </div> : null
                }

                <div className='subtitle'>{lang.settings.groups.mask}</div>
                <SelectControl
                    label={lang.settings.mask}
                    id='set-mask'
                    options={maskOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('enable_mask', e.target.value)}
                />

                <div className='subtitle'>{lang.settings.groups.text_to_path}</div>
                <SelectControl
                    label={lang.settings.text_path_calc_optimization}
                    id='text-optimize'
                    options={textToPathOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('TextbyFluxsvg', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.font_substitute}
                    id='font-substitue'
                    options={fontSubstituteOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('font-substitute', e.target.value)}
                />

                <div className='subtitle'>{lang.settings.groups.modules}</div>
                <SelectControl
                    label={lang.settings.default_borderless_mode}
                    id='default-open-bottom'
                    options={borderlessModeOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('default-borderless', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.default_enable_autofocus_module}
                    id='default-autofocus'
                    options={autofocusModuleOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('default-autofocus', e.target.value)}
                />
                <SelectControl
                    label={lang.settings.default_enable_diode_module}
                    id='default-diode'
                    options={diodeModuleOptions}
                    onChange={(e) => this.updateBeamboxPreferenceChange('default-diode', e.target.value)}
                />
                <Controls label={lang.settings.diode_offset}>
                    <span className='font2' style={{ marginRight: '10px' }}>X</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getWidth(BeamboxPreference.read('model')) / 10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('diode_offset_x') || 0}
                        getValue={val => this.updateBeamboxPreferenceChange('diode_offset_x', val)}
                        forceUsePropsUnit={true}
                        className={{ half: true }}
                    />
                    <span className='font2' style={{ marginRight: '10px' }}>Y</span>
                    <UnitInput
                        unit={this.getConfigEditingValue('default-units') === 'inches' ? 'in' : 'mm'}
                        min={0}
                        max={BeamboxConstant.dimension.getHeight(BeamboxPreference.read('model')) / 10}
                        defaultValue={this.getBeamboxPreferenceEditingValue('diode_offset_y') || 0}
                        getValue={val => this.updateBeamboxPreferenceChange('diode_offset_y', val)}
                        forceUsePropsUnit={true}
                        className={{ half: true }}
                    />
                </Controls>

                <div className='subtitle'>{lang.settings.groups.privacy}</div>
                <SelectControl
                    label={lang.settings.share_with_flux}
                    id='set-sentry'
                    options={enableSentryOptions}
                    onChange={(e) => this.updateConfigChange('enable-sentry', e.target.value)}
                />

                <a className='font5' onClick={this.resetBS}>
                    <b>{lang.settings.reset_now}</b>
                </a>
                <div className="clearfix" />
                <a className={classNames('btn btn-done', { disabled: !isAllValid })} onClick={this.handleDone}>{lang.settings.done}</a>
                <a className="btn btn-cancel" onClick={this._handleCancel}>{lang.settings.cancel}</a>
            </div>
        );
    }
};

SettingGeneral.defaultProps = {
    supported_langs: '',
    onLangChange: function () { }
};

export default SettingGeneral;
