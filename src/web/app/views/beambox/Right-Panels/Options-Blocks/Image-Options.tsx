/* eslint-disable react/sort-comp */
import UnitInput from 'app/widgets/Unit-Input-v2';
import ImageData from 'helpers/image-data';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import * as i18n from 'helpers/i18n';
import { IBatchCommand } from 'interfaces/IHistory';
import { IImageDataResult } from 'interfaces/IImageData';

let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const React = requireNode('react');
const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

interface IProps {
  elem: Element,
  updateObjectPanel: () => void,
}

class ImageOptions extends React.Component<IProps> {
  changeAttribute = (changes: { [key: string]: string | number | boolean }): void => {
    const { elem } = this.props as IProps;
    const batchCommand: IBatchCommand = new svgedit.history.BatchCommand('Image Option Panel');
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

  generateImageData = (isShading: boolean, threshold: number): Promise<IImageDataResult> => {
    const { elem } = this.props as IProps;
    return new Promise<IImageDataResult>((resolve) => {
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
          onComplete: (result: IImageDataResult) => {
            resolve(result);
          },
        },
      );
    });
  };

  handleGradientClick = async (): Promise<void> => {
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
  };

  renderGradientBlock(): Element {
    const { elem } = this.props;
    const isGradient = elem.getAttribute('data-shading') === 'true';
    return (
      <div className="option-block" key="gradient">
        <div className="label">{LANG.shading}</div>
        <div className="onoffswitch" onClick={this.handleGradientClick}>
          <input type="checkbox" className="onoffswitch-checkbox" checked={isGradient} readOnly />
          <label className="onoffswitch-label">
            <span className="onoffswitch-inner" />
            <span className="onoffswitch-switch" />
          </label>
        </div>
      </div>
    );
  }

  handleSliderChange = (e: InputEvent): void => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    this.handleThresholdChange(value);
  };

  handleThresholdChange = async (val: number): Promise<void> => {
    const { elem } = this.props;
    const isShading = elem.getAttribute('data-shading') === 'true';
    const imageData = await this.generateImageData(isShading, val);
    const { pngBase64 } = imageData;
    this.changeAttribute({
      'data-threshold': val,
      'xlink:href': pngBase64,
    });
    this.forceUpdate();
  };

  renderThresholdBlock(): Element {
    const { elem } = this.props;
    const isGradient = elem.getAttribute('data-shading') === 'true';
    if (isGradient) {
      return null;
    }
    const threshold = parseInt(elem.getAttribute('data-threshold'), 10) || 128;
    return (
      <div key="threshold">
        <div className="option-block with-slider">
          <div className="label">{LANG.threshold}</div>
          <UnitInput
            min={1}
            max={255}
            decimal={0}
            unit=""
            className={{ 'option-input': true }}
            defaultValue={threshold}
            getValue={this.handleThresholdChange}
          />
        </div>
        <div className="option-block slider-container">
          <input
            className="threshold-slider"
            type="range"
            min={1}
            max={255}
            step={1}
            value={threshold}
            onChange={this.handleSliderChange}
          />
        </div>
      </div>
    );
  }

  render(): Element {
    return (
      <div>
        {this.renderGradientBlock()}
        {this.renderThresholdBlock()}
      </div>
    );
  }
}

export default ImageOptions;
