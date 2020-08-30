import UnitInput from '../../../widgets/Unit-Input-v2'
import Constant from '../../../actions/beambox/constant'
import KeycodeConstants from '../../../constants/keycode-constants'
import SymbolMaker from '../../../../helpers/symbol-maker'
import * as i18n from '../../../../helpers/i18n'

const svgCanvas = window['svgCanvas'];
const svgedit = window['svgedit'];

    const React = requireNode('react');;
    const classNames = requireNode('classnames');
    const LANG = i18n.lang.beambox.right_panel.object_panel;

    const panelMap = {
        'g': ['x', 'y', 'rot', 'w', 'h', 'lock'],
        'path': ['x', 'y', 'rot', 'w', 'h', 'lock'],
        'polygon': ['x', 'y', 'rot', 'w', 'h', 'lock'],
        'rect': ['x', 'y', 'rot', 'w', 'h', 'lock'],
        'ellipse': ['cx', 'cy', 'rot', 'rx', 'ry', 'lock',],
        'line': ['x1', 'y1', 'rot', 'x2', 'y2'],
        'image': ['x', 'y', 'rot', 'w', 'h', 'lock'],
        'text': ['x', 'y', 'rot', 'w', 'h', 'lock'],
        'use': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    };

    const fixedSizeMapping = {
        'width': 'height',
        'height': 'width',
        'rx': 'ry',
        'ry': 'rx'
    };

    class DimensionPanel extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            };
        }

        componentWillUnmount() {
            this.handleSizeBlur();
        }

        handleInputFocus = (type) => {
            const { elem } = this.props;
            this.focusedInputType = type;
            switch (type) {
                case 'x':
                    svgCanvas.undoMgr.beginUndoableChange('x', [elem]);
                break;
            }
        }

        handleInputBlur = (type) => {
            let cmd = svgCanvas.undoMgr.finishUndoableChange();
            console.log(cmd);
            if (cmd && !cmd.isEmpty()) {
                svgCanvas.undoMgr.addCommandToHistory(cmd);
            }
            this.focusedInputType = null;
        }

        handlePositionChange = (type, val) => {
            const { elem, updateDimensionValues } = this.props;
            val *= Constant.dpmm;
            if (!['use', 'text'].includes(elem.tagName)) {
                svgCanvas.changeSelectedAttribute(type, val, [elem]);
            } else {
                svgCanvas.setSvgElemPosition(type, val);
            }
            const newDimensionValue = {};
            newDimensionValue[type] = val;
            updateDimensionValues(newDimensionValue);
            this.setState(this.state);
        }

        handleRotationChange = (val) => {
            const { elem, updateDimensionValues } = this.props;
            svgCanvas.setRotationAngle(val, false, elem);
            updateDimensionValues({rotation: val});
            this.setState(this.state);
        }

        changeSize = (type, val) => {
            const { elem } = this.props;
            let cmd = null;
            switch(elem.tagName) {
                case 'ellipse':
                case 'rect':
                case 'image':
                    svgCanvas.undoMgr.beginUndoableChange(type, [elem]);
                    svgCanvas.changeSelectedAttributeNoUndo(type, val, [elem]);
                    cmd = svgCanvas.undoMgr.finishUndoableChange();
                    break;
                case 'g':
                case 'polygon':
                case 'path':
                case 'text':
                case 'use':
                    cmd = svgCanvas.setSvgElemSize(type, val);
                    break;
            }
            if (elem.tagName === 'text') {
                if (elem.getAttribute('stroke-width') === '2') {
                    elem.setAttribute('stroke-width', 2.01);
                } else {
                    elem.setAttribute('stroke-width', 2);
                }
            }
            return cmd;
        }

        handleSizeChange = (type, val) => {
            const batchCmd = new svgedit.history.BatchCommand('Object Panel Size Change');
            const { updateDimensionValues, getDimensionValues } = this.props;
            const dimensionValues = getDimensionValues();
            const isRatioFixed = dimensionValues.isRatioFixed || false;

            const newDimensionValue = {};
            val *= Constant.dpmm;
            if (isRatioFixed) {
                const ratio = val / parseFloat(dimensionValues[type]);
                const otherType = fixedSizeMapping[type];
                const newOtherTypeVal = ratio * parseFloat(dimensionValues[otherType]);

                let cmd = this.changeSize(type, val);
                if (cmd && !cmd.isEmpty()) {
                    batchCmd.addSubCommand(cmd);
                }
                cmd = this.changeSize(otherType, newOtherTypeVal);
                if (cmd && !cmd.isEmpty()) {
                    batchCmd.addSubCommand(cmd);
                }
                newDimensionValue[type] = val;
                newDimensionValue[otherType] = newOtherTypeVal;
            } else {
                let cmd = this.changeSize(type, val);
                if (cmd && !cmd.isEmpty()) {
                    batchCmd.addSubCommand(cmd);
                }
                newDimensionValue[type] = val;
            }
            if (batchCmd && !batchCmd.isEmpty()) {
                svgCanvas.undoMgr.addCommandToHistory(batchCmd);
            }
            updateDimensionValues(newDimensionValue);
            this.setState(this.state);
        }

        handleSizeKeyUp = (e) => {
            const { elem } = this.props;
            if (elem.tagName === 'use' && (e.keyCode === KeycodeConstants.KEY_UP || e.keyCode === KeycodeConstants.KEY_DOWN)) {
                SymbolMaker.reRenderImageSymbol(elem);
            }
        }

        handleSizeBlur = async () => {
            const { elem } = this.props;
            if (elem.tagName === 'use') {
                SymbolMaker.reRenderImageSymbol(elem);
            } else if (elem.tagName === 'g') {
                const allUses = Array.from(elem.querySelectorAll('use'));
                SymbolMaker.reRenderImageSymbolArray(allUses);
            }
        }

        handleFixRatio = () => {
            const { elem, updateDimensionValues } = this.props;
            const isRatioFixed = elem.getAttribute('data-ratiofixed') === 'true' || false;
            elem.setAttribute('data-ratiofixed', !isRatioFixed);
            updateDimensionValues({isRatioFixed: !isRatioFixed});
            this.setState(this.state);
        }

        getDisplayValue = (val) => {
            if (!val) {
                return 0;
            }
            return val / Constant.dpmm;
        }

        renderDimensionPanel = (type) => {
            const { getDimensionValues } = this.props;
            const dimensionValues = getDimensionValues();
            const isRatioFixed = dimensionValues.isRatioFixed || false;
            const unit = localStorage.getItem('default-units') || 'mm';
            const isInch = unit === 'inches';
            switch(type) {
                case 'x':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'X'}</div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.x)}
                                getValue={(val) => this.handlePositionChange('x', val)}
                            />
                        </div>
                    );
                case 'y':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'Y'}</div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.y)}
                                getValue={(val) => this.handlePositionChange('y', val)}
                            />
                        </div>
                    );
                case 'x1':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'X'}
                                <sub>{'1'}</sub>
                            </div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.x1)}
                                getValue={(val) => this.handlePositionChange('x1', val)}
                            />
                        </div>
                    );
                case 'y1':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'Y'}
                                <sub>{'1'}</sub>
                            </div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.y1)}
                                getValue={(val) => this.handlePositionChange('y1', val)}
                            />
                        </div>
                    );
                case 'x2':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'X'}
                                <sub>{'2'}</sub>
                            </div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.x2)}
                                getValue={(val) => this.handlePositionChange('x2', val)}
                            />
                        </div>
                    );
                case 'y2':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'Y'}
                                <sub>{'2'}</sub>
                            </div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.y2)}
                                getValue={(val) => this.handlePositionChange('y2', val)}
                            />
                        </div>
                    );
                case 'cx':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'X'}
                                <sub>{'C'}</sub>
                            </div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.cx)}
                                getValue={(val) => this.handlePositionChange('cx', val)}
                            />
                        </div>
                    );
                case 'cy':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'Y'}
                                <sub>{'C'}</sub>
                            </div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.cy)}
                                getValue={(val) => this.handlePositionChange('cy', val)}
                            />
                        </div>
                    );
                case 'rot':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label img">
                                <img src="img/right-panel/icon-rotate.svg"/>
                            </div>
                            <UnitInput
                                unit='deg'
                                className={{'dimension-input': true}}
                                defaultValue={dimensionValues.rotation}
                                getValue={(val) => this.handleRotationChange(val)}
                            />
                        </div>
                    )
                case 'w':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'W'}</div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                onBlur={() => this.handleSizeBlur()}
                                onKeyUp={(e) => this.handleSizeKeyUp(e)}
                                defaultValue={this.getDisplayValue(dimensionValues.width)}
                                getValue={(val) => this.handleSizeChange('width', val)}
                            />
                        </div>
                    );
                case 'h':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'H'}</div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                onBlur={() => this.handleSizeBlur()}
                                onKeyUp={(e) => this.handleSizeKeyUp(e)}
                                defaultValue={this.getDisplayValue(dimensionValues.height)}
                                getValue={(val) => this.handleSizeChange('height', val)}
                            />
                        </div>
                    );
                case 'rx':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'W'}</div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.rx * 2)}
                                getValue={(val) => this.handleSizeChange('rx', val / 2)}
                            />
                        </div>
                    );
                case 'ry':
                    return (
                        <div className="dimension-container" key={type}>
                            <div className="label">{'H'}</div>
                            <UnitInput
                                unit={isInch ? 'in' : 'mm'}
                                className={{'dimension-input': true}}
                                defaultValue={this.getDisplayValue(dimensionValues.ry * 2)}
                                getValue={(val) => this.handleSizeChange('ry', val / 2)}
                            />
                        </div>
                    );
                case 'lock':
                    return (
                        <div className='dimension-lock' key={type} onClick={() => this.handleFixRatio()}>
                            <img src={isRatioFixed ? "img/right-panel/icon-lock.svg" : "img/right-panel/icon-padlock.svg"}/>
                        </div>
                    );
                default:
                    break;
            }
            return null;
        }

        renderDimensionPanels = (panels) => {
            const ret = [];
            for (let i = 0; i < panels.length; i++) {
                ret.push(this.renderDimensionPanel(panels[i]));
            }
            return ret;
        }

        renderFlipButtons = () => {
            return (
                <div className="flip-btn-container">
                    <div className="tool-btn" onClick={() => {svgCanvas.flipSelectedElements(-1, 1)}} title={LANG.hflip}>
                        <img src="img/right-panel/icon-hflip.svg"/>
                    </div>
                    <div className="tool-btn" onClick={() => {svgCanvas.flipSelectedElements(1, -1)}} title={LANG.vflip}>
                        <img src="img/right-panel/icon-vflip.svg"/>
                    </div>
                </div>
            );
        }

        render() {
            const { elem } = this.props;
            let panels = ['x', 'y', 'rot', 'w', 'h'];
            if (elem) {
                panels = panelMap[elem.tagName] || ['x', 'y', 'rot', 'w', 'h'];
            }
            return (
                <div className="dimension-panel">
                    {this.renderDimensionPanels(panels)}
                    {this.renderFlipButtons()}
                </div>
            );
        }
    }
    export default DimensionPanel;