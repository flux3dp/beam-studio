define([
    'react',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/actions/beambox/font-funcs',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'jsx!views/beambox/Object-Panels/text/FontFamily',
    'jsx!views/beambox/Object-Panels/text/FontStyle',
    'jsx!views/beambox/Object-Panels/text/FontSize',
    'jsx!views/beambox/Object-Panels/text/LetterSpacing',
    'jsx!views/beambox/Object-Panels/text/LineSpacing',
    'jsx!views/beambox/Object-Panels/text/FontFill',
    'app/actions/beambox/beambox-preference',
    'helpers/i18n',
], function(
    React,
    PropTypes,
    FnWrapper,
    FontFuncs,
    ProgressActions,
    ProgressConstants,
    FontFamilySelector,
    FontStyleSelector,
    FontSizeInput,
    LetterSpacingInput,
    LineSpacingPanel,
    IsFillCheckbox,
    BeamboxPreference,
    i18n
) {
    if (!window.electron) {
        console.log('font is not supported in web browser');
        return () => null;
    }

    const LANG = i18n.lang.beambox.object_panels;
    class Text extends React.Component {
        constructor(props) {
            super(props);

            //should handle imported unusable font in other place,
            //font should e sanitized when user import new file

            const sanitizedDefaultFontFamily = (() => {
                // use these font if props.fontFamily cannot find in user PC
                const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', FontFuncs.availableFontFamilies[0]];

                const sanitizedFontFamily = [props.fontFamily, ...fontFamilyFallback].find(
                    f => FontFuncs.availableFontFamilies.includes(f)
                );

                return sanitizedFontFamily;
            })();

            if (sanitizedDefaultFontFamily !== props.fontFamily) {
                console.log(`unsupported font ${props.fontFamily}, fallback to ${sanitizedDefaultFontFamily}`);
                FnWrapper.update_font_family(sanitizedDefaultFontFamily);
            }

            this.state = {
                fontFamily: sanitizedDefaultFontFamily,
                fontStyle: FontFuncs.requestFontByFamilyAndStyle({
                    family: props.fontFamily,
                    weight: props.fontWeight,
                    italic: props.italic
                }).style,
                fontSize: props.fontSize,
                letterSpacing: props.letterSpacing,
                lineSpacing: props.lineSpacing,
                isFill: props.isFill
            };
            // this.state = {
            //     fontFamily: props.fontFamily,
            //     fontStyle: FontFuncs.requestFontByFamilyAndStyle({
            //         family: props.fontFamily,
            //         weight: props.fontWeight,
            //         italic: props.italic
            //     }).style,
            //     fontSize: props.fontSize,
            //     letterSpacing: props.letterSpacing,
            //     isFill: props.isFill
            // };
        }

        handleFontFamilyChange(newFamily) {
            // update family
            FnWrapper.update_font_family(newFamily);

            // new style
            const newStyle = FontFuncs.requestFontStylesOfTheFontFamily(newFamily)[0];

            // set fontFamily and change fontStyle
            this.setState({
                fontFamily: newFamily
            }, () => {this.handleFontStyleChange(newStyle)});
        }
        handleFontStyleChange(val) {
            const font = FontFuncs.requestFontByFamilyAndStyle({
                family: this.state.fontFamily,
                style: val
            });
            FnWrapper.update_font_italic(font.italic);
            FnWrapper.update_font_weight(font.weight);
            this.setState({
                fontStyle: val
            });
        }
        handleFontSizeChange(val) {
            FnWrapper.update_font_size(val);
            this.setState({
                fontSize: val
            });
        }
        handleLetterSpacingChange(val) {
            FnWrapper.update_letter_spacing(val);
            this.setState({
                letterSpacing: val
            });
        }
        handleLineSpacingChange(val) {
            svgCanvas.setTextLineSpacing(val);
            this.setState({
                lineSpacing: val
            });
        }
        handleIsFillChange(val) {
            FnWrapper.update_font_is_fill(val);
            this.setState({
                isFill: val
            });
        }

        async convertToPath() {
            ProgressActions.open(ProgressConstants.WAITING, LANG.wait_for_parsing_font);
            const bbox = svgCanvas.calculateTransformedBBox(this.props.$me[0]);
            
            const convertByFluxsvg = BeamboxPreference.read('TextbyFluxsvg') !== false;

            if (convertByFluxsvg) {
                await FontFuncs.convertTextToPathFluxsvg(this.props.$me, bbox);
            } else {
                //delay FontFuncs.requestToConvertTextToPath() to ensure ProgressActions has already popup
                await new Promise(resolve => {
                    setTimeout(async () => {
                        await FontFuncs.requestToConvertTextToPath(this.props.$me, this.state.fontFamily, this.props.fontWeight, this.state.fontStyle);
                        resolve();
                    }, 50);
                });
            }
            FnWrapper.reset_select_mode();
            ProgressActions.close();

        }

        render() {
            const fontStyles = FontFuncs.requestFontStylesOfTheFontFamily(this.state.fontFamily);
            return (
                <div className='object-panel text-panel'>
                    <label className='controls accordion'>
                        <input type='checkbox' className='accordion-switcher' defaultChecked={true} />
                        <p className='caption'>
                            {LANG.text}
                            <span className='value'>{FontFuncs.fontNameMap.get(this.state.fontFamily)}, {this.state.fontStyle}</span>
                        </p>
                        <label className='accordion-body'>
                            <div>
                                <div className='control'>
                                    <FontFamilySelector
                                        currentFontFamily={this.state.fontFamily}
                                        fontFamilyOptions={FontFuncs.availableFontFamilies}
                                        onChange={val => this.handleFontFamilyChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <FontStyleSelector
                                        currentFontStyle={this.state.fontStyle}
                                        fontStyleOptions={fontStyles}
                                        onChange={val => this.handleFontStyleChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.font_size}</div>
                                    <FontSizeInput
                                        currentFontSize={this.state.fontSize}
                                        onChange={val => this.handleFontSizeChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.letter_spacing}</div>
                                    <LetterSpacingInput
                                        currentLetterSpacing={this.state.letterSpacing}
                                        onChange={val => this.handleLetterSpacingChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.letter_spacing}</div>
                                    <LineSpacingPanel
                                        lineSpacing={this.state.lineSpacing}
                                        onChange={val => this.handleLineSpacingChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.fill}</div>
                                    <IsFillCheckbox
                                        currentIsFill={this.state.isFill}
                                        onChange={val => this.handleIsFillChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <button
                                        className='btn-default'
                                        onClick={() => this.convertToPath()}
                                        title={LANG.convert_to_path_to_get_precise_result}
                                        style={{
                                            width: '100%',
                                            lineHeight: '1.5em'
                                        }}
                                    >
                                        {LANG.convert_to_path}
                                    </button>
                                </div>
                            </div>
                        </label>
                    </label>
                </div>
            );
        }
    }
    Text.propTypes = {
        fontFamily: PropTypes.string.isRequired,
        fontWeight: PropTypes.number.isRequired,
        italic: PropTypes.bool.isRequired,
        fontSize: PropTypes.number.isRequired,
        letterSpacing: PropTypes.number.isRequired
    };

    return Text;
});
