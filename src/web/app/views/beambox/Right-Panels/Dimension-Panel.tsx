import UnitInput from 'app/widgets/Unit-Input-v2';
import Constant from 'app/actions/beambox/constant';
import KeycodeConstants from 'app/constants/keycode-constants';
import SymbolMaker from 'helpers/symbol-maker';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IBatchCommand } from 'interfaces/IHistory';

let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgedit = globalSVG.Edit; });

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const LANG = i18n.lang.beambox.right_panel.object_panel;

const panelMap = {
  g: ['x', 'y', 'rot', 'w', 'h', 'lock'],
  path: ['x', 'y', 'rot', 'w', 'h', 'lock'],
  polygon: ['x', 'y', 'rot', 'w', 'h', 'lock'],
  rect: ['x', 'y', 'rot', 'w', 'h', 'lock'],
  ellipse: ['cx', 'cy', 'rot', 'rx', 'ry', 'lock'],
  line: ['x1', 'y1', 'rot', 'x2', 'y2'],
  image: ['x', 'y', 'rot', 'w', 'h', 'lock'],
  text: ['x', 'y', 'rot', 'w', 'h', 'lock'],
  use: ['x', 'y', 'rot', 'w', 'h', 'lock'],
};

const fixedSizeMapping = {
  width: 'height',
  height: 'width',
  rx: 'ry',
  ry: 'rx',
};

interface Props {
  elem: { [key: string]: string; },
  getDimensionValues: () => number,
  updateDimensionValues: (newDimensionValue: { [key: string]: string }) => void,
}

class DimensionPanel extends React.Component {
  constructor(props: Props) {
    super(props);
    this.state = {
    };
    this.unit = storage.get('default-units') === 'inches' ? 'in' : 'mm';
    this.unitInputClass = { 'dimension-input': true };
  }

  componentWillUnmount(): void {
    this.handleSizeBlur();
  }

  handlePositionChange = (type:string, val:number): void => {
    const { elem, updateDimensionValues } = this.props;
    const posVal = val * Constant.dpmm;
    if (!['use', 'text'].includes(elem.tagName)) {
      svgCanvas.changeSelectedAttribute(type, posVal, [elem]);
    } else {
      svgCanvas.setSvgElemPosition(type, posVal);
    }
    const newDimensionValue = {};
    newDimensionValue[type] = posVal;
    updateDimensionValues(newDimensionValue);
    this.forceUpdate();
  };

  handleRotationChange = (val: number): void => {
    const { elem, updateDimensionValues } = this.props;
    let rotationDeg = val % 360;
    if (rotationDeg > 180) rotationDeg -= 360;
    svgCanvas.setRotationAngle(rotationDeg, false, elem);
    updateDimensionValues({ rotation: rotationDeg });
    this.forceUpdate();
  };

  changeSize = (type:string, val:number): IBatchCommand => {
    const { elem } = this.props;
    const elemSize = val > 0.1 ? val : 0.1;
    let cmd = null;

    switch (elem.tagName) {
      case 'ellipse':
      case 'rect':
      case 'image':
        svgCanvas.undoMgr.beginUndoableChange(type, [elem]);
        svgCanvas.changeSelectedAttributeNoUndo(type, elemSize, [elem]);
        cmd = svgCanvas.undoMgr.finishUndoableChange();
        break;
      case 'g':
      case 'polygon':
      case 'path':
      case 'text':
      case 'use':
        cmd = svgCanvas.setSvgElemSize(type, elemSize);
        break;
      default:
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
  };

  handleSizeChange = (type:string, val:number): void => {
    const batchCmd = new svgedit.history.BatchCommand('Object Panel Size Change');
    const { updateDimensionValues, getDimensionValues } = this.props;
    const dimensionValues = getDimensionValues();
    const isRatioFixed = dimensionValues.isRatioFixed || false;

    const newDimensionValue = {};
    const sizeVal = val * Constant.dpmm;
    if (isRatioFixed) {
      const ratio = sizeVal / parseFloat(dimensionValues[type]);
      const otherType = fixedSizeMapping[type];
      const newOtherTypeVal = ratio * parseFloat(dimensionValues[otherType]);

      let cmd = this.changeSize(type, sizeVal);
      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
      cmd = this.changeSize(otherType, newOtherTypeVal);
      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
      newDimensionValue[type] = sizeVal;
      newDimensionValue[otherType] = newOtherTypeVal;
    } else {
      const cmd = this.changeSize(type, sizeVal);
      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
      newDimensionValue[type] = sizeVal;
    }
    if (batchCmd && !batchCmd.isEmpty()) {
      svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    }
    updateDimensionValues(newDimensionValue);
    this.forceUpdate();
  };

  handleSizeKeyUp = (e: KeyboardEvent): void => {
    const { elem } = this.props;
    if (elem.tagName === 'use' && (e.keyCode === KeycodeConstants.KEY_UP || e.keyCode === KeycodeConstants.KEY_DOWN)) {
      SymbolMaker.reRenderImageSymbol(elem);
    }
  };

  handleSizeBlur = async (): Promise<void> => {
    const { elem } = this.props;
    if (elem.tagName === 'use') {
      SymbolMaker.reRenderImageSymbol(elem);
    } else if (elem.tagName === 'g') {
      const allUses = Array.from(elem.querySelectorAll('use'));
      SymbolMaker.reRenderImageSymbolArray(allUses);
    }
  };

  handleFixRatio = (): void => {
    const { elem, updateDimensionValues } = this.props;
    const isRatioFixed = elem.getAttribute('data-ratiofixed') === 'true' || false;
    elem.setAttribute('data-ratiofixed', !isRatioFixed);
    updateDimensionValues({ isRatioFixed: !isRatioFixed });
    this.forceUpdate();
  };

  getDisplayValue = (val: number): number => {
    if (!val) {
      return 0;
    }
    return val / Constant.dpmm;
  };

  renderDimensionPanel = (type: string): Element => {
    const { getDimensionValues } = this.props;
    const dimensionValues = getDimensionValues();
    const isRatioFixed = dimensionValues.isRatioFixed || false;

    switch (type) {
      case 'x':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">X</div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.x)}
              getValue={(val) => this.handlePositionChange('x', val)}
            />
          </div>
        );
      case 'y':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">Y</div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.y)}
              getValue={(val) => this.handlePositionChange('y', val)}
            />
          </div>
        );
      case 'x1':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">
              X
              <sub>1</sub>
            </div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.x1)}
              getValue={(val) => this.handlePositionChange('x1', val)}
            />
          </div>
        );
      case 'y1':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">
              Y
              <sub>1</sub>
            </div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.y1)}
              getValue={(val) => this.handlePositionChange('y1', val)}
            />
          </div>
        );
      case 'x2':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">
              X
              <sub>2</sub>
            </div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.x2)}
              getValue={(val) => this.handlePositionChange('x2', val)}
            />
          </div>
        );
      case 'y2':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">
              Y
              <sub>2</sub>
            </div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.y2)}
              getValue={(val) => this.handlePositionChange('y2', val)}
            />
          </div>
        );
      case 'cx':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">
              X
              <sub>C</sub>
            </div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.cx)}
              getValue={(val) => this.handlePositionChange('cx', val)}
            />
          </div>
        );
      case 'cy':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">
              Y
              <sub>C</sub>
            </div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.cy)}
              getValue={(val) => this.handlePositionChange('cy', val)}
            />
          </div>
        );
      case 'rot':
        return (
          <div className="dimension-container" key={type}>
            <div className="label img">
              <img src="img/right-panel/icon-rotate.svg" alt="" />
            </div>
            <UnitInput
              unit="deg"
              className={this.unitInputClass}
              defaultValue={dimensionValues.rotation}
              getValue={(val) => this.handleRotationChange(val)}
            />
          </div>
        );
      case 'w':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">W</div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
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
            <div className="label">H</div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
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
            <div className="label">W</div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.rx * 2)}
              getValue={(val) => this.handleSizeChange('rx', val / 2)}
            />
          </div>
        );
      case 'ry':
        return (
          <div className="dimension-container" key={type}>
            <div className="label">H</div>
            <UnitInput
              unit={this.unit}
              className={this.unitInputClass}
              defaultValue={this.getDisplayValue(dimensionValues.ry * 2)}
              getValue={(val) => this.handleSizeChange('ry', val / 2)}
            />
          </div>
        );
      case 'lock':
        return (
          <div className="dimension-lock" key={type} onClick={() => this.handleFixRatio()}>
            <img src={isRatioFixed ? 'img/right-panel/icon-lock.svg' : 'img/right-panel/icon-unlock.svg'} alt="" />
          </div>
        );
      default:
        break;
    }
    return null;
  };

  renderDimensionPanels = (panels:Array<string>): Array<Element> => {
    const ret = [];
    for (let i = 0; i < panels.length; i += 1) {
      ret.push(this.renderDimensionPanel(panels[i]));
    }
    return ret;
  };

  renderFlipButtons = (): Element => (
    <div className="flip-btn-container">
      <div className="tool-btn" onClick={() => { svgCanvas.flipSelectedElements(-1, 1); }} title={LANG.hflip}>
        <img src="img/right-panel/icon-hflip.svg" alt="" />
      </div>
      <div className="tool-btn" onClick={() => { svgCanvas.flipSelectedElements(1, -1); }} title={LANG.vflip}>
        <img src="img/right-panel/icon-vflip.svg" alt="" />
      </div>
    </div>
  );

  render(): Element {
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

DimensionPanel.propTypes = {
  elem: PropTypes.shape({
    tagName: PropTypes.string,
    getAttribute: PropTypes.func,
    setAttribute: PropTypes.func,
    querySelectorAll: PropTypes.func,
  }),
  getDimensionValues: PropTypes.func,
  updateDimensionValues: PropTypes.func,
};

DimensionPanel.defaultProps = {
  elem: {},
  getDimensionValues: () => {},
  updateDimensionValues: () => {},
};

export default DimensionPanel;
