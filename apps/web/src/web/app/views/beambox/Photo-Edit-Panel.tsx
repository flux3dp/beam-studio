import * as React from 'react';
import Icon from '@ant-design/icons';
import { Button, Col, ConfigProvider, InputNumber, Modal, Row, Slider } from 'antd';

import ActionPanelIcons from 'app/icons/action-panel/ActionPanelIcons';
import calculateBase64 from 'helpers/image-edit-panel/calculate-base64';
import CurveControl from 'app/widgets/Curve-Control';
import i18n from 'helpers/i18n';
import imageEdit from 'helpers/image-edit';
import imageProcessor from 'implementations/imageProcessor';
import jimpHelper from 'helpers/jimp-helper';
import layoutConstants from 'app/constants/layout-constants';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import OpenCVWebSocket from 'helpers/api/open-cv';
import Progress from 'app/actions/progress-caller';
import SliderControl from 'app/widgets/Slider-Control';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { isMobile } from 'helpers/system-helper';

import styles from './Photo-Edit-Panel.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const opencvWS = new OpenCVWebSocket();
let LANG = i18n.lang.beambox.photo_edit_panel;
const updateLang = () => {
  LANG = i18n.lang.beambox.photo_edit_panel;
};

export type PhotoEditMode = 'sharpen' | 'curve';

interface Props {
  element: HTMLElement;
  src: string;
  mode: PhotoEditMode;
  unmount: () => void;
}

interface State {
  origWidth?: number;
  origHeight?: number;
  imageWidth?: number;
  imageHeight?: number;
  origSrc: string;
  previewSrc: string;
  displaySrc: string;
  sharpness: number;
  sharpRadius: number;
  threshold: number;
  shading: boolean;
  brightness: number;
  contrast: number;
  isFullColor: boolean;
  displayBase64: string;
  isImageDataGenerated: boolean;
  isShowingOriginal: boolean;
}

// TODO: refactor this component, seperate different function into different component

class PhotoEditPanel extends React.Component<Props, State> {
  private compareBase64: string;

  private curvefunction: (n: number) => number;

  constructor(props: Props) {
    super(props);
    updateLang();
    const { element, src } = this.props;
    this.state = {
      origSrc: src,
      previewSrc: src,
      displaySrc: src,
      sharpness: 0,
      sharpRadius: 1,
      threshold: parseInt(element.getAttribute('data-threshold'), 10),
      shading: element.getAttribute('data-shading') === 'true',
      isFullColor: element.getAttribute('data-fullcolor') === '1',
      brightness: 0,
      contrast: 0,
      displayBase64: null,
      isImageDataGenerated: false,
      isShowingOriginal: false,
    };
  }

  componentDidMount(): void {
    const { mode, unmount } = this.props;
    if (!['sharpen', 'curve'].includes(mode)) {
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
      this.compareBase64 = result;
    };

    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const { origSrc } = this.state;
    let imgBlobUrl = origSrc;
    try {
      const image = await jimpHelper.urlToImage(imgBlobUrl);
      const { width: origWidth, height: origHeight } = image.bitmap;
      if (Math.max(origWidth, origHeight) > 600) {
        // eslint-disable-next-line no-console
        console.log('Down Sampling');
        if (origWidth >= origHeight) {
          image.resize(600, imageProcessor.AUTO);
        } else {
          image.resize(imageProcessor.AUTO, 600);
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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    } finally {
      Progress.popById('photo-edit-processing');
    }
  }

  handleCancel = (): void => {
    const { src } = this.props;
    const { displaySrc, previewSrc } = this.state;
    const { unmount } = this.props;
    if (displaySrc !== src) URL.revokeObjectURL(displaySrc);
    if (previewSrc !== src) URL.revokeObjectURL(previewSrc);
    ObjectPanelController.updateActiveKey(null);
    unmount();
  };

  async handleComplete(): Promise<void> {
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const { displaySrc, previewSrc, origSrc } = this.state;
    const { element, mode, unmount } = this.props;
    if (previewSrc !== origSrc) URL.revokeObjectURL(previewSrc);
    const result = await this.calculateImageData(displaySrc);
    imageEdit.addBatchCommand(`Photo edit ${mode}`, element, {
      origImage: displaySrc,
      'xlink:href': result,
    });
    svgCanvas.selectOnly([element], true);
    unmount();
    Progress.popById('photo-edit-processing');
  }

  async handleSharp(isPreview?: boolean): Promise<void> {
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });
    const { sharpness, displaySrc, previewSrc, origSrc, origWidth, imageWidth } = this.state;
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
      // eslint-disable-next-line no-console
      console.log('Error when sharpening image', error);
      Progress.popById('photo-edit-processing');
    }
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
      displayBase64: result,
      isImageDataGenerated: true,
    });
  };

  updateCurveFunction(curvefunction: (n: number) => number): void {
    this.curvefunction = curvefunction;
  }

  async calculateImageData(src: string): Promise<string> {
    const { shading, threshold, isFullColor } = this.state;
    const resultBase64 = calculateBase64(src, shading, threshold, isFullColor);
    return resultBase64;
  }

  renderPhotoEditeModal(): JSX.Element {
    const { mode } = this.props;
    const { imageWidth, imageHeight, isShowingOriginal, displayBase64 } = this.state;

    let panelContent = null;
    let rightWidth = 60;
    let title = '';
    switch (mode) {
      case 'sharpen':
        panelContent = this.renderSharpenPanel();
        title = LANG.sharpen;
        rightWidth = 390;
        break;
      case 'curve':
        panelContent = this.renderCurvePanel();
        title = isMobile() ? LANG.brightness_and_contrast : LANG.curve;
        rightWidth = 390;
        break;
      default:
        break;
    }
    const maxAllowableWidth = window.innerWidth - rightWidth;
    const maxAllowableHeight =
      window.innerHeight - 2 * layoutConstants.topBarHeightWithoutTitleBar - 180;
    const imgSizeStyle =
      imageWidth / maxAllowableWidth > imageHeight / maxAllowableHeight
        ? { width: maxAllowableWidth }
        : { height: maxAllowableHeight };
    const imgWidth = imgSizeStyle.width
      ? maxAllowableWidth
      : imgSizeStyle.height * (imageWidth / imageHeight);
    if (isMobile()) {
      const [previewButton, ...footerButtons] = this.renderPhotoEditFooter();
      return (
        <ConfigProvider
          theme={{
            components: {
              Button: { borderRadius: 100 },
              InputNumber: { borderRadius: 100 },
            },
          }}
        >
          <Modal
            className={styles.modal}
            closeIcon={
              <Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />
            }
            footer={footerButtons}
            onCancel={() => this.handleCancel()}
            centered
            open
          >
            <div className={styles.title}>{title}</div>
            <div className={styles['preview-btn']}>{previewButton}</div>
            <div className={styles.preview}>
              <img
                id="original-image"
                src={isShowingOriginal ? this.compareBase64 : displayBase64}
              />
            </div>
            {panelContent}
          </Modal>
        </ConfigProvider>
      );
    }
    return (
      <Modal
        open
        centered
        width={imgWidth + rightWidth}
        title={title}
        footer={this.renderPhotoEditFooter()}
        onCancel={this.handleCancel}
      >
        <Row gutter={10}>
          <Col flex={`1 1 ${imgSizeStyle.width}`}>
            <img
              id="original-image"
              style={imgSizeStyle}
              src={isShowingOriginal ? this.compareBase64 : displayBase64}
            />
          </Col>
          <Col flex="1 1 260px">{panelContent}</Col>
        </Row>
      </Modal>
    );
  }

  renderSharpenPanel(): JSX.Element {
    const { state } = this;
    const { sharpness, sharpRadius } = state;
    const setStateAndPreview = (key: string, value: number) => {
      if (state[key] === value) {
        return;
      }
      state[key] = value;
      this.setState(state, () => {
        this.handleSharp(true);
      });
    };

    return isMobile() ? (
      <>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.sharpness}</span>
          <InputNumber
            className={styles.input}
            type="number"
            min={0}
            max={20}
            value={sharpness}
            onChange={(val) => this.setState({ ...state, sharpness: val })}
            onBlur={() => this.handleSharp(true)}
            controls={false}
          />
          <Slider
            className={styles.slider}
            min={0}
            max={20}
            value={sharpness}
            onChange={(val) => this.setState({ ...state, sharpness: val })}
            onAfterChange={() => this.handleSharp(true)}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.radius}</span>
          <InputNumber
            className={styles.input}
            type="number"
            min={0}
            max={100}
            value={sharpRadius}
            onChange={(val) => this.setState({ ...state, sharpRadius: val })}
            onBlur={() => this.handleSharp(true)}
            controls={false}
          />
          <Slider
            className={styles.slider}
            min={0}
            max={100}
            value={sharpRadius}
            onChange={(val) => this.setState({ ...state, sharpRadius: val })}
            onAfterChange={() => this.handleSharp(true)}
          />
        </div>
      </>
    ) : (
      <div className="right-part">
        <div className="scroll-bar-container sharpen">
          <div className="sub-functions with-slider">
            <SliderControl
              id="sharpen-intensity"
              label={LANG.sharpness}
              min={0}
              max={20}
              step={1}
              default={0}
              onChange={(id: string, val: string) =>
                setStateAndPreview('sharpness', parseFloat(val))
              }
              doOnlyOnMouseUp
              doOnlyOnBlur
            />
            <SliderControl
              id="sharpen-radius"
              label={LANG.radius}
              min={0}
              max={100}
              step={1}
              default={1}
              onChange={(id: string, val: string) =>
                setStateAndPreview('sharpRadius', parseInt(val, 10))
              }
              doOnlyOnMouseUp
              doOnlyOnBlur
            />
          </div>
        </div>
      </div>
    );
  }

  renderCurvePanel(): JSX.Element {
    const updateCurveFunction = (curvefunction) => this.updateCurveFunction(curvefunction);
    const handleCurve = () => this.handleCurve(true);
    const { brightness, contrast } = this.state;
    const onChange = (type: string, val: number) => {
      this.setState((state) => ({ ...state, [type]: val }));
      const currentBrightness = type === 'brightness' ? val : brightness;
      const currentContrast = type === 'contrast' ? val : contrast;
      const a = currentContrast < 0 ? currentContrast / 200 + 1 : currentContrast / 50 + 1;
      updateCurveFunction((n) =>
        Math.max(Math.min(a * (n - 127.5) + currentBrightness + 127.5, 255), 0)
      );
    };
    return isMobile() ? (
      <>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.brightness}</span>
          <InputNumber
            className={styles.input}
            type="number"
            min={-100}
            max={100}
            value={brightness}
            precision={0}
            onChange={(val) => onChange('brightness', val)}
            onBlur={handleCurve}
            controls={false}
          />
          <Slider
            className={styles.slider}
            min={-100}
            max={100}
            step={1}
            marks={{ 0: '0' }}
            value={brightness}
            onChange={(val) => onChange('brightness', val)}
            onAfterChange={handleCurve}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.contrast}</span>
          <InputNumber
            className={styles.input}
            type="number"
            min={-100}
            max={100}
            value={contrast}
            precision={0}
            onChange={(val) => onChange('contrast', val)}
            onBlur={handleCurve}
            controls={false}
          />
          <Slider
            className={styles.slider}
            min={-100}
            max={100}
            step={1}
            marks={{ 0: '0' }}
            value={contrast}
            onChange={(val) => onChange('contrast', val)}
            onAfterChange={handleCurve}
          />
        </div>
      </>
    ) : (
      <div style={{ width: 260, height: 260 }}>
        <CurveControl updateCurveFunction={updateCurveFunction} updateImage={handleCurve} />
      </div>
    );
  }

  renderPhotoEditFooter(): JSX.Element[] {
    const { mode } = this.props;
    const previewButton = (
      <Button
        key="preview"
        onTouchStart={() => this.setState({ isShowingOriginal: true })}
        onTouchEnd={() => this.setState({ isShowingOriginal: false })}
        onMouseDown={() => this.setState({ isShowingOriginal: true })}
        onMouseUp={() => this.setState({ isShowingOriginal: false })}
        onMouseLeave={() => this.setState({ isShowingOriginal: false })}
        type="dashed"
      >
        {LANG.compare}
      </Button>
    );
    const handleOk = async () => {
      if (mode === 'sharpen') {
        await this.handleSharp(false);
      } else if (mode === 'curve') {
        await this.handleCurve(false);
      }
      ObjectPanelController.updateActiveKey(null);
    };

    const cancelButton = (
      <Button key="cancel" onClick={this.handleCancel}>
        {LANG.cancel}
      </Button>
    );
    const okButton = (
      <Button key="ok" onClick={() => handleOk()} type="primary">
        {LANG.okay}
      </Button>
    );
    return [previewButton, cancelButton, okButton];
  }

  render(): JSX.Element {
    const { mode } = this.props;
    if (['sharpen', 'curve'].includes(mode)) {
      return this.renderPhotoEditeModal();
    }
    return null;
  }
}

export default PhotoEditPanel;
