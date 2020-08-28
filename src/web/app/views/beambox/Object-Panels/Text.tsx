define([
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
    'jsx!views/beambox/Object-Panels/text/FontCheckbox',
    'app/actions/beambox/beambox-preference',
    'helpers/i18n',
], function(
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
    FontCheckbox,
    BeamboxPreference,
    i18n
) {
    const React = require('react');
    if (!window.electron) {
        console.log('font is not supported in web browser');
        return () => null;
    }

    const LANG = i18n.lang.beambox.object_panels;
    class Text extends React.Component {
        constructor(props) {
            super(props);
            console.log(props.postscriptName);
            let font;
            if (props.postscriptName) {
                font = FontFuncs.getFontOfPostscriptName(props.postscriptName);
            } else {
                font = FontFuncs.requestFontByFamilyAndStyle({
                    family: props.fontFamily,
                    weight: props.fontWeight,
                    italic: props.italic
                });
            }

            console.log(font);
            const sanitizedDefaultFontFamily = (() => {
                // use these font if postscriptName cannot find in user PC
                const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', FontFuncs.availableFontFamilies[0]];
                const sanitizedFontFamily = [font.family, ...fontFamilyFallback].find(
                    f => FontFuncs.availableFontFamilies.includes(f)
                );

                return sanitizedFontFamily;
            })();

            if (sanitizedDefaultFontFamily !== font.family) {
                console.log(`unsupported font ${font.family}, fallback to ${sanitizedDefaultFontFamily}`);
                svgCanvas.setFontFamily(sanitizedDefaultFontFamily, true);
                svgCanvas.setFontPostscriptName(newFont.postscriptName, true);
                const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedDefaultFontFamily)[0];
            }

            this.state = {
                fontFamily: sanitizedDefaultFontFamily,
                fontStyle: font.style,
                fontSize: props.fontSize,
                letterSpacing: props.letterSpacing,
                lineSpacing: props.lineSpacing,
                isFill: props.isFill,
                isVertical: props.isVertical,
            };
        }

        handleFontFamilyChange(newFamily) {
            const newFont = FontFuncs.requestFontsOfTheFontFamily(newFamily)[0];
            // update family
            const batchCmd = new svgedit.history.BatchCommand('Change Font family');
            let cmd = svgCanvas.setFontPostscriptName(newFont.postscriptName, true);
            batchCmd.addSubCommand(cmd);
            cmd = svgCanvas.setItalic(newFont.italic, true);
            batchCmd.addSubCommand(cmd);
            cmd = svgCanvas.setFontWeight(newFont.weight, true);
            batchCmd.addSubCommand(cmd);
            cmd = svgCanvas.setFontFamily(newFamily, true);
            batchCmd.addSubCommand(cmd);
            svgCanvas.undoMgr.addCommandToHistory(batchCmd);
            const newStyle = newFont.style;
            this.setState({
                fontFamily: newFamily,
                fontStyle: newStyle
            });
        }
        handleFontStyleChange(val) {
            const font = FontFuncs.requestFontByFamilyAndStyle({
                family: this.state.fontFamily,
                style: val
            });
            const batchCmd = new svgedit.history.BatchCommand('Change Font Style');
            let cmd = svgCanvas.setFontPostscriptName(font.postscriptName, true);
            batchCmd.addSubCommand(cmd);
            cmd = svgCanvas.setItalic(font.italic, true);
            batchCmd.addSubCommand(cmd);
            cmd = svgCanvas.setFontWeight(font.weight, true);
            batchCmd.addSubCommand(cmd);
            svgCanvas.undoMgr.addCommandToHistory(batchCmd);
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
        handleisVerticalChange(val) {
            svgCanvas.setTextIsVertical(val);
            this.setState({
                isVertical: val
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
                        await FontFuncs.requestToConvertTextToPath(this.props.$me, {
                            family: this.state.fontFamily,
                            weight: this.props.fontWeight,
                            style: this.state.fontStyle
                        });
                        resolve();
                    }, 50);
                });
            }
            FnWrapper.reset_select_mode();
            ProgressActions.close();

        }

        render() {
            const fontStyles = FontFuncs.requestFontsOfTheFontFamily(this.state.fontFamily).map((f) => f.style);
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
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.line_spacing}</div>
                                    <LineSpacingPanel
                                        lineSpacing={this.state.lineSpacing}
                                        onChange={val => this.handleLineSpacingChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.fill}</div>
                                    <FontCheckbox
                                        isChecked={this.state.isFill}
                                        onChange={val => this.handleIsFillChange(val)}
                                    />
                                </div>
                                <div className='control'>
                                    <div className='text-center header' style={{fontSize: '16px'}}>{LANG.vertical_text}</div>
                                    <FontCheckbox
                                        isChecked={this.state.isVertical}
                                        onChange={val => this.handleisVerticalChange(val)}
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
