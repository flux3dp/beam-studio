import UnitInput from 'app/widgets/Unit-Input-v2';
import ImageData from 'helpers/image-data';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import * as i18n from 'helpers/i18n';

let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

class ImageOptions extends React.Component {
  changeAttribute = (changes: { [key: string]: string | number | boolean }): void => {
    const { elem } = this.props;
    const batchCommand = new svgedit.history.BatchCommand('Image Option Panel');
    const setAttribute = (key: string, value: string | number | boolean) => {
      svgCanvas.undoMgr.beginUndoableChange(key, [elem]);
      elem.setAttribute(key, value as string);
      const cmd = svgCanvas.undoMgr.finishUndoableChange();
      if (!cmd.isEmpty()) {
        batchCommand.addSubCommand(cmd);
      }
    };
    const keys = Object.keys(changes);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      setAttribute(key, changes[key]);
    }
    if (!batchCommand.isEmpty()) {
      svgCanvas.undoMgr.addCommandToHistory(batchCommand);
    }
  };

  generateImageData = (isShading: boolean, threshold: number) => {
    const { elem } = this.props;
    return new Promise<{ pngBase64: string }>((resolve) => {
      ImageData(
        $(elem).attr('origImage'),
        {
          height: $(elem).height(),
          width: $(elem).width(),
          grayscale: {
            is_rgba: true,
            is_shading: isShading,
            threshold,
            is_svg: false,
          },
          onComplete: (result) => {
            resolve(result);
          },
        },
      );
    });
  };

  handleGradientClick = async () => {
    const { elem, updateObjectPanel } = this.props;
    let isShading = elem.getAttribute('data-shading') === 'true';
    isShading = !isShading;
    const threshold = isShading ? 254 : 128;
    const imageData = await this.generateImageData(isShading, threshold);
    const { pngBase64 } = imageData;
    this.changeAttribute({
      'data-shading': isShading,
      'data-threshold': isShading ? 254 : 128,
      'xlink:href': pngBase64,
    });
    this.forceUpdate();
    updateObjectPanel();
  }

  renderGradientBlock() {
    const { elem } = this.props;
    const isGradient = elem.getAttribute('data-shading') === 'true';
    return (
      <div className="option-block" key="gradient">
        <div className="label">{LANG.shading}</div>
        <div className="onoffswitch" onClick={() => this.handleGradientClick()}>
          <input type="checkbox" className="onoffswitch-checkbox" checked={isGradient} readOnly={true} />
          <label className="onoffswitch-label">
            <span className="onoffswitch-inner"></span>
            <span className="onoffswitch-switch"></span>
          </label>
        </div>
      </div>
    );
  }

  handleThresholdChange = async (val) => {
    const { elem } = this.props;
    const isShading = elem.getAttribute('data-shading') === 'true';
    const imageData = await this.generateImageData(isShading, val);
    const { pngBase64 } = imageData;
    this.changeAttribute({
      'data-threshold': val,
      'xlink:href': pngBase64,
    });
    this.forceUpdate();
  }

  renderThresholdBlock() {
    const { elem } = this.props;
    const isGradient = elem.getAttribute('data-shading') === 'true';
    if (isGradient) {
      return null;
    }
    const threshold = parseInt(elem.getAttribute('data-threshold')) || 128;
    return (
      <div key="threshold">
        <div className="option-block with-slider">
          <div className="label">{LANG.threshold}</div>
          <UnitInput
            min={1}
            max={255}
            decimal={0}
            unit={''}
            className={{ 'option-input': true }}
            defaultValue={threshold}
            getValue={(val) => this.handleThresholdChange(val)}
          />
        </div>
        <div className="option-block slider-container">
          <input className="threshold-slider" type="range"
            min={1}
            max={255}
            step={1}
            value={threshold}
            onChange={(e) => { this.handleThresholdChange(parseInt(e.target.value)) }}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.renderGradientBlock()}
        { this.renderThresholdBlock()}
      </div>
    );
  }
}

export default ImageOptions;
