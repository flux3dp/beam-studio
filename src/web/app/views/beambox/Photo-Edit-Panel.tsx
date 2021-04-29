/* eslint-disable react/sort-comp, no-console */
import $ from 'jquery';
import Constants from 'app/actions/beambox/constant';
import * as i18n from 'helpers/i18n';
import ImageData from 'helpers/image-data';
import jimpHelper from 'helpers/jimp-helper';
import Progress from 'app/actions/progress-caller';
import Modal from 'app/widgets/Modal';
import ButtonGroup from 'app/widgets/Button-Group';
import CurveControl from 'app/widgets/Curve-Control';
import SliderControl from 'app/widgets/Slider-Control';
import OpenCVWebSocket from 'helpers/api/open-cv';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IButton } from 'interfaces/IButton';
import { IImageDataResult } from 'interfaces/IImageData';

let svgCanvas;
let svgedit;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgedit = globalSVG.Edit;
});

const classNames = requireNode('classnames');
const Cropper = requireNode('cropperjs');
const React = requireNode('react');
const jimp = requireNode('jimp');

const opencvWS = new OpenCVWebSocket();
let LANG = i18n.lang.beambox.photo_edit_panel;
const updateLang = () => {
  LANG = i18n.lang.beambox.photo_edit_panel;
};

export type PhotoEditMode = 'sharpen' | 'crop' | 'curve';

interface IProps {
  element: HTMLElement,
  src: string,
  mode: PhotoEditMode,
  unmount: () => void,
}

class PhotoEditPanel extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
    updateLang();
    const { element, src } = this.props;
    this.cropper = null;
    this.state = {
      origSrc: src,
      previewSrc: src,
      displaySrc: src,
      sharpness: 1,
      sharpRadius: 0,
      srcHistory: [],
      isCropping: false,
      threshold: $(element).attr('data-threshold'),
      shading: (element.getAttribute('data-shading') === 'true'),
      displayBase64: null,
      isImageDataGenerated: false,
      isShowingOriginal: false,
    };
  }

  componentDidMount(): void {
    const { mode, unmount } = this.props;
    if (!['sharpen', 'crop', 'curve'].includes(mode)) {
      unmount();
      return;
    }
    this.handlePreprocess();
  }

  componentDidUpdate(): void {
    const { isImageDataGenerated } = this.state;
    if (!isImageDataGenerated) {
      this.generateImageData();
    }
  }

  async handlePreprocess(): Promise<void> {
    const setCompareBase64 = async (imgUrl: string) => {
      const result = await this.calculateImageData(imgUrl);
      this.compareBase64 = result.pngBase64;
    };

    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const { mode } = this.props;
    const { origSrc } = this.state;
    let imgBlobUrl = origSrc;
    try {
      const image = await jimpHelper.urlToImage(imgBlobUrl);
      const { width: origWidth, height: origHeight } = image.bitmap;
      if (['sharpen', 'curve'].includes(mode)) {
        if (Math.max(origWidth, origHeight) > 600) {
          console.log('Down Sampling');
          if (origWidth >= origHeight) {
            image.resize(600, jimp.AUTO);
          } else {
            image.resize(jimp.AUTO, 600);
          }
          imgBlobUrl = await jimpHelper.imageToUrl(image);
        }
        setCompareBase64(imgBlobUrl);
        this.setState({
          origWidth,
          origHeight,
          imageWidth: image.bitmap.width,
          imageHeight: image.bitmap.height,
          previewSrc: imgBlobUrl,
          displaySrc: imgBlobUrl,
        });
      } else if (mode === 'crop') {
        this.setState({
          origWidth,
          origHeight,
          imageWidth: origWidth,
          imageHeight: origHeight,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      Progress.popById('photo-edit-processing');
    }
  }

  handleCancel(): void {
    const { displaySrc, srcHistory } = this.state;
    const { unmount } = this.props;
    let src = displaySrc;
    while (srcHistory.length > 0) {
      URL.revokeObjectURL(src);
      src = srcHistory.pop();
    }
    unmount();
  }

  async handleComplete(): Promise<void> {
    const clearHistory = () => {
      const { srcHistory, previewSrc, origSrc } = this.state;
      let src = '';
      while (srcHistory.length > 0) {
        URL.revokeObjectURL(src);
        src = srcHistory.pop();
      }
      if (previewSrc !== origSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };

    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const { displaySrc, origWidth, origHeight } = this.state;
    const { element, mode, unmount } = this.props;
    const batchCmd = new svgedit.history.BatchCommand('Photo edit');

    const handleSetAttribute = (attr: string, value) => {
      svgCanvas.undoMgr.beginUndoableChange(attr, [element]);
      element.setAttribute(attr, value);
      const cmd = svgCanvas.undoMgr.finishUndoableChange();
      if (!cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
    };

    handleSetAttribute('origImage', displaySrc);
    if (mode === 'crop') {
      const image = document.getElementById('original-image') as HTMLImageElement;
      if (origWidth !== image.naturalWidth) {
        const ratio = image.naturalWidth / origWidth;
        handleSetAttribute('width', parseFloat($(element).attr('width')) * ratio);
      }
      if (origHeight !== image.naturalHeight) {
        const ratio = image.naturalHeight / origHeight;
        handleSetAttribute('height', parseFloat($(element).attr('height')) * ratio);
      }
    }

    clearHistory();
    const result = await this.calculateImageData(displaySrc);
    handleSetAttribute('xlink:href', result.pngBase64);
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);
    svgCanvas.selectOnly([element], true);
    unmount();
    Progress.popById('photo-edit-processing');
  }

  async handleSharp(isPreview?: boolean): Promise<void> {
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const {
      sharpness, displaySrc, previewSrc, origSrc, origWidth, imageWidth,
    } = this.state;
    let { sharpRadius } = this.state;
    sharpRadius = isPreview ? Math.ceil(sharpRadius * (imageWidth / origWidth)) : sharpRadius;
    const imgBlobUrl = isPreview ? previewSrc : origSrc;
    try {
      let newImgUrl = imgBlobUrl;
      if (sharpRadius * sharpness > 0) {
        const blob = await opencvWS.sharpen(imgBlobUrl, sharpness, sharpRadius);
        newImgUrl = URL.createObjectURL(blob);
      }
      if (displaySrc !== previewSrc) {
        URL.revokeObjectURL(displaySrc);
      }
      Progress.popById('photo-edit-processing');
      if (isPreview) {
        this.setState({
          displaySrc: newImgUrl,
          isImageDataGenerated: false,
        });
      } else {
        this.setState({ displaySrc: newImgUrl }, () => this.handleComplete());
      }
    } catch (error) {
      console.log('Error when sharpening image', error);
      Progress.popById('photo-edit-processing');
    }
  }

  handleStartCrop = (): void => {
    const { isCropping } = this.state;
    if (isCropping) {
      return;
    }
    const image = document.getElementById('original-image') as HTMLImageElement;
    this.cropper = new Cropper(
      image,
      {
        autoCropArea: 1,
        zoomable: false,
        viewMode: 0,
        targetWidth: image.width,
        targetHeight: image.height,
      },
    );
    this.setState({ isCropping: true });
  };

  async handleCrop(complete = false): Promise<void> {
    const { displaySrc, srcHistory } = this.state;
    const image = document.getElementById('original-image') as HTMLImageElement;
    const cropData = this.cropper.getData();
    const x = Math.max(0, Math.round(cropData.x));
    const y = Math.max(0, Math.round(cropData.y));
    const w = Math.min(image.naturalWidth - x, Math.round(cropData.width));
    const h = Math.min(image.naturalHeight - y, Math.round(cropData.height));
    if (x === 0 && y === 0 && w === image.naturalWidth && h === image.naturalHeight && !complete) {
      return;
    }

    const imgBlobUrl = displaySrc;
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const newImgUrl = await jimpHelper.cropImage(imgBlobUrl, x, y, w, h);
    if (newImgUrl) {
      srcHistory.push(displaySrc);
      this.destroyCropper();
      this.setState({
        displaySrc: newImgUrl,
        srcHistory,
        isCropping: false,
        isImageDataGenerated: false,
        imageWidth: cropData.width,
        imageHeight: cropData.height,
      }, () => {
        Progress.popById('photo-edit-processing');
        if (complete) {
          Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
          });
          setTimeout(() => this.handleComplete(), 500);
        }
      });
    } else {
      Progress.popById('photo-edit-processing');
    }
  }

  destroyCropper(): void {
    if (this.cropper) {
      this.cropper.destroy();
    }
  }

  updateCurveFunction(curvefunction: (n: number) => number): void {
    this.curvefunction = curvefunction;
  }

  async handleCurve(isPreview: boolean): Promise<void> {
    const { displaySrc, previewSrc, origSrc } = this.state;
    const curveMap = [...Array(256).keys()].map((e: number) => Math.round(this.curvefunction(e)));
    const imgBlobUrl = isPreview ? previewSrc : origSrc;
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const newImgUrl = await jimpHelper.curveOperate(imgBlobUrl, curveMap);
    if (newImgUrl) {
      if (displaySrc !== previewSrc) {
        URL.revokeObjectURL(displaySrc);
      }
      Progress.popById('photo-edit-processing');
      if (isPreview) {
        this.setState({
          displaySrc: newImgUrl,
          isImageDataGenerated: false,
        });
      } else {
        this.setState({ displaySrc: newImgUrl }, () => this.handleComplete());
      }
    } else {
      Progress.popById('photo-edit-processing');
    }
  }

  generateImageData = async (): Promise<void> => {
    const { displaySrc, displayBase64 } = this.state;
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const result = await this.calculateImageData(displaySrc);
    Progress.popById('photo-edit-processing');
    if (displayBase64) {
      URL.revokeObjectURL(displayBase64);
    }
    this.setState({
      displayBase64: result.pngBase64,
      isImageDataGenerated: true,
    });
  };

  async calculateImageData(src: string): Promise<IImageDataResult> {
    const { shading, threshold } = this.state;
    return new Promise<IImageDataResult>((resolve) => {
      ImageData(src, {
        grayscale: {
          is_rgba: true,
          is_shading: shading,
          threshold,
          is_svg: false,
        },
        isFullResolution: true,
        onComplete: (result: IImageDataResult) => {
          resolve(result);
        },
      });
    });
  }

  handleGoBack(): void {
    const { isCropping, displaySrc, srcHistory } = this.state;
    if (isCropping) {
      this.destroyCropper();
    }
    URL.revokeObjectURL(displaySrc);
    const src = srcHistory.pop();
    this.setState({
      displaySrc: src,
      isCropping: false,
      isImageDataGenerated: false,
    });
  }

  renderPhotoEditeModal(): Element {
    const { mode } = this.props;
    const {
      imageWidth, imageHeight, isCropping, isShowingOriginal, displayBase64,
    } = this.state;

    let panelContent = null;
    let rightWidth = 40;
    switch (mode) {
      case 'sharpen':
        panelContent = this.renderSharpenPanel();
        rightWidth = 390;
        break;
      case 'curve':
        panelContent = this.renderCurvePanel();
        rightWidth = 390;
        break;
      default:
        break;
    }
    const maxAllowableWidth = window.innerWidth - rightWidth;
    const maxAllowableHieght = window.innerHeight - 2 * Constants.topBarHeightWithoutTitleBar - 180;
    const containerStyle = (imageWidth / maxAllowableWidth > imageHeight / maxAllowableHieght)
      ? { width: `${maxAllowableWidth}px` } : { height: `${maxAllowableHieght}px` };
    const onImgLoad = () => {
      if (mode === 'crop' && !isCropping) {
        this.handleStartCrop();
      }
    };
    return (
      <Modal>
        <div className="photo-edit-panel">
          <div className="main-content">
            <div className="image-container" style={containerStyle}>
              <img
                id="original-image"
                style={containerStyle}
                src={isShowingOriginal ? this.compareBase64 : displayBase64}
                onLoad={() => onImgLoad()}
              />
            </div>
            {panelContent}
          </div>
          {this.renderPhotoEditFooter()}
        </div>
      </Modal>
    );
  }

  renderSharpenPanel(): Element {
    const setStateAndPreview = (key: string, value: number) => {
      const { state } = this;
      if (state[key] === value) {
        return;
      }
      state[key] = value;
      this.setState(state, () => {
        this.handleSharp(true);
      });
    };

    return (
      <div className="right-part">
        <div className="scroll-bar-container sharpen">
          <div className="sub-functions with-slider">
            <div className="title">{LANG.sharpen}</div>
            <SliderControl
              id="sharpen-intensity"
              label={LANG.sharpness}
              min={0}
              max={20}
              step={1}
              default={1}
              onChange={(id: string, val: string) => setStateAndPreview('sharpness', parseFloat(val))}
              doOnlyOnMouseUp
              doOnlyOnBlur
            />
            <SliderControl
              id="sharpen-radius"
              label={LANG.radius}
              min={0}
              max={100}
              step={1}
              default={0}
              onChange={(id: string, val: string) => setStateAndPreview('sharpRadius', parseInt(val, 10))}
              doOnlyOnMouseUp
              doOnlyOnBlur
            />
          </div>
        </div>
      </div>
    );
  }

  renderCurvePanel(): Element {
    const updateCurveFunction = (curvefunction) => this.updateCurveFunction(curvefunction);
    const handleCurve = () => this.handleCurve(true);
    return (
      <div className="right-part">
        <div className="curve-panel">
          <div className="title">{LANG.curve}</div>
          <CurveControl
            updateCurveFunction={updateCurveFunction}
            updateImage={handleCurve}
          />
        </div>
      </div>
    );
  }

  renderPhotoEditFooter(): Element {
    const { mode } = this.props;
    const { srcHistory } = this.state;
    const previewButton = {
      label: LANG.compare,
      onMouseDown: () => this.setState({ isShowingOriginal: true }),
      onMouseUp: () => this.setState({ isShowingOriginal: false }),
      onMouseLeave: () => this.setState({ isShowingOriginal: false }),
      className: 'btn btn-default pull-left',
    };
    const buttons: IButton[] = [
      {
        label: LANG.cancel,
        onClick: () => this.handleCancel(),
        className: 'btn btn-default pull-right',
      },
    ];
    if (mode === 'sharpen') {
      buttons.push(...[
        previewButton,
        {
          label: LANG.okay,
          onClick: () => this.handleSharp(false),
          className: 'btn btn-default pull-right primary',
        },
      ]);
    } else if (mode === 'crop') {
      const disableGoBack = srcHistory.length === 0;
      buttons.push(...[
        {
          label: LANG.okay,
          onClick: () => this.handleCrop(true),
          className: 'btn btn-default pull-right primary',
        },
        {
          label: LANG.apply,
          onClick: () => this.handleCrop(),
          className: 'btn btn-default pull-right',
        },
        {
          label: LANG.back,
          onClick: disableGoBack ? () => { } : () => this.handleGoBack(),
          className: classNames('btn btn-default pull-right', { disabled: disableGoBack }),
        },
      ]);
    } else if (mode === 'curve') {
      buttons.push(...[
        previewButton,
        {
          label: LANG.okay,
          onClick: () => this.handleCurve(false),
          className: 'btn btn-default pull-right primary',
        },
      ]);
    }
    return (
      <div className="footer">
        <ButtonGroup buttons={buttons} />
      </div>
    );
  }

  render(): Element {
    const { mode } = this.props;
    if (['sharpen', 'crop', 'curve'].includes(mode)) {
      return this.renderPhotoEditeModal();
    }
    return null;
  }
}

export default PhotoEditPanel;
