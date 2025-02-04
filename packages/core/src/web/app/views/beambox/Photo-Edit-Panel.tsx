import * as React from 'react';

import Icon from '@ant-design/icons';
import { Button, Col, ConfigProvider, InputNumber, Modal, Row, Slider } from 'antd';

import Progress from '@core/app/actions/progress-caller';
import layoutConstants from '@core/app/constants/layout-constants';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import CurveControl from '@core/app/widgets/Curve-Control';
import SliderControl from '@core/app/widgets/Slider-Control';
import OpenCVWebSocket from '@core/helpers/api/open-cv';
import i18n from '@core/helpers/i18n';
import imageEdit from '@core/helpers/image-edit';
import calculateBase64 from '@core/helpers/image-edit-panel/calculate-base64';
import jimpHelper from '@core/helpers/jimp-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import imageProcessor from '@core/implementations/imageProcessor';

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

export type PhotoEditMode = 'curve' | 'sharpen';

interface Props {
  element: HTMLElement;
  mode: PhotoEditMode;
  src: string;
  unmount: () => void;
}

interface State {
  brightness: number;
  contrast: number;
  displayBase64: string;
  displaySrc: string;
  imageHeight?: number;
  imageWidth?: number;
  isFullColor: boolean;
  isImageDataGenerated: boolean;
  isShowingOriginal: boolean;
  origHeight?: number;
  origSrc: string;
  origWidth?: number;
  previewSrc: string;
  shading: boolean;
  sharpness: number;
  sharpRadius: number;
  threshold: number;
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
      brightness: 0,
      contrast: 0,
      displayBase64: null,
      displaySrc: src,
      isFullColor: element.getAttribute('data-fullcolor') === '1',
      isImageDataGenerated: false,
      isShowingOriginal: false,
      origSrc: src,
      previewSrc: src,
      shading: element.getAttribute('data-shading') === 'true',
      sharpness: 0,
      sharpRadius: 1,
      threshold: Number.parseInt(element.getAttribute('data-threshold'), 10),
    };
  }

  componentDidMount(): void {
    const { mode, unmount } = this.props;

    if (!['curve', 'sharpen'].includes(mode)) {
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
      const { height: origHeight, width: origWidth } = image.bitmap;

      if (Math.max(origWidth, origHeight) > 600) {
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
        displaySrc: imgBlobUrl,
        imageHeight: image.bitmap.height,
        imageWidth: image.bitmap.width,
        origHeight,
        origWidth,
        previewSrc: imgBlobUrl,
      });
    } catch (err) {
      console.log(err);
    } finally {
      Progress.popById('photo-edit-processing');
    }
  }

  handleCancel = (): void => {
    const { src } = this.props;
    const { displaySrc, previewSrc } = this.state;
    const { unmount } = this.props;

    if (displaySrc !== src) {
      URL.revokeObjectURL(displaySrc);
    }

    if (previewSrc !== src) {
      URL.revokeObjectURL(previewSrc);
    }

    ObjectPanelController.updateActiveKey(null);
    unmount();
  };

  async handleComplete(): Promise<void> {
    Progress.openNonstopProgress({
      id: 'photo-edit-processing',
      message: LANG.processing,
    });

    const { displaySrc, origSrc, previewSrc } = this.state;
    const { element, mode, unmount } = this.props;

    if (previewSrc !== origSrc) {
      URL.revokeObjectURL(previewSrc);
    }

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

    const { displaySrc, imageWidth, origSrc, origWidth, previewSrc, sharpness } = this.state;
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

  async handleCurve(isPreview: boolean): Promise<void> {
    const { displaySrc, origSrc, previewSrc } = this.state;
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
    const { displayBase64, displaySrc } = this.state;

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
    const { isFullColor, shading, threshold } = this.state;
    const resultBase64 = calculateBase64(src, shading, threshold, isFullColor);

    return resultBase64;
  }

  renderPhotoEditeModal(): React.JSX.Element {
    const { mode } = this.props;
    const { displayBase64, imageHeight, imageWidth, isShowingOriginal } = this.state;

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
    const maxAllowableHeight = window.innerHeight - 2 * layoutConstants.topBarHeightWithoutTitleBar - 180;
    const imgSizeStyle =
      imageWidth / maxAllowableWidth > imageHeight / maxAllowableHeight
        ? { width: maxAllowableWidth }
        : { height: maxAllowableHeight };
    const imgWidth = imgSizeStyle.width ? maxAllowableWidth : imgSizeStyle.height * (imageWidth / imageHeight);

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
            centered
            className={styles.modal}
            closeIcon={<Icon className={styles['close-icon']} component={ActionPanelIcons.Delete} />}
            footer={footerButtons}
            onCancel={() => this.handleCancel()}
            open
          >
            <div className={styles.title}>{title}</div>
            <div className={styles['preview-btn']}>{previewButton}</div>
            <div className={styles.preview}>
              <img id="original-image" src={isShowingOriginal ? this.compareBase64 : displayBase64} />
            </div>
            {panelContent}
          </Modal>
        </ConfigProvider>
      );
    }

    return (
      <Modal
        centered
        footer={this.renderPhotoEditFooter()}
        onCancel={this.handleCancel}
        open
        title={title}
        width={imgWidth + rightWidth}
      >
        <Row gutter={10}>
          <Col flex={`1 1 ${imgSizeStyle.width}`}>
            <img
              id="original-image"
              src={isShowingOriginal ? this.compareBase64 : displayBase64}
              style={imgSizeStyle}
            />
          </Col>
          <Col flex="1 1 260px">{panelContent}</Col>
        </Row>
      </Modal>
    );
  }

  renderSharpenPanel(): React.JSX.Element {
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
            controls={false}
            max={20}
            min={0}
            onBlur={() => this.handleSharp(true)}
            onChange={(val) => this.setState({ ...state, sharpness: val })}
            type="number"
            value={sharpness}
          />
          <Slider
            className={styles.slider}
            max={20}
            min={0}
            onAfterChange={() => this.handleSharp(true)}
            onChange={(val) => this.setState({ ...state, sharpness: val })}
            value={sharpness}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.radius}</span>
          <InputNumber
            className={styles.input}
            controls={false}
            max={100}
            min={0}
            onBlur={() => this.handleSharp(true)}
            onChange={(val) => this.setState({ ...state, sharpRadius: val })}
            type="number"
            value={sharpRadius}
          />
          <Slider
            className={styles.slider}
            max={100}
            min={0}
            onAfterChange={() => this.handleSharp(true)}
            onChange={(val) => this.setState({ ...state, sharpRadius: val })}
            value={sharpRadius}
          />
        </div>
      </>
    ) : (
      <div className="right-part">
        <div className="scroll-bar-container sharpen">
          <div className="sub-functions with-slider">
            <SliderControl
              default={0}
              doOnlyOnBlur
              doOnlyOnMouseUp
              id="sharpen-intensity"
              label={LANG.sharpness}
              max={20}
              min={0}
              onChange={(id: string, val: string) => setStateAndPreview('sharpness', Number.parseFloat(val))}
              step={1}
            />
            <SliderControl
              default={1}
              doOnlyOnBlur
              doOnlyOnMouseUp
              id="sharpen-radius"
              label={LANG.radius}
              max={100}
              min={0}
              onChange={(id: string, val: string) => setStateAndPreview('sharpRadius', Number.parseInt(val, 10))}
              step={1}
            />
          </div>
        </div>
      </div>
    );
  }

  renderCurvePanel(): React.JSX.Element {
    const updateCurveFunction = (curvefunction) => this.updateCurveFunction(curvefunction);
    const handleCurve = () => this.handleCurve(true);
    const { brightness, contrast } = this.state;
    const onChange = (type: string, val: number) => {
      this.setState((state) => ({ ...state, [type]: val }));

      const currentBrightness = type === 'brightness' ? val : brightness;
      const currentContrast = type === 'contrast' ? val : contrast;
      const a = currentContrast < 0 ? currentContrast / 200 + 1 : currentContrast / 50 + 1;

      updateCurveFunction((n) => Math.max(Math.min(a * (n - 127.5) + currentBrightness + 127.5, 255), 0));
    };

    return isMobile() ? (
      <>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.brightness}</span>
          <InputNumber
            className={styles.input}
            controls={false}
            max={100}
            min={-100}
            onBlur={handleCurve}
            onChange={(val) => onChange('brightness', val)}
            precision={0}
            type="number"
            value={brightness}
          />
          <Slider
            className={styles.slider}
            marks={{ 0: '0' }}
            max={100}
            min={-100}
            onAfterChange={handleCurve}
            onChange={(val) => onChange('brightness', val)}
            step={1}
            value={brightness}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{LANG.contrast}</span>
          <InputNumber
            className={styles.input}
            controls={false}
            max={100}
            min={-100}
            onBlur={handleCurve}
            onChange={(val) => onChange('contrast', val)}
            precision={0}
            type="number"
            value={contrast}
          />
          <Slider
            className={styles.slider}
            marks={{ 0: '0' }}
            max={100}
            min={-100}
            onAfterChange={handleCurve}
            onChange={(val) => onChange('contrast', val)}
            step={1}
            value={contrast}
          />
        </div>
      </>
    ) : (
      <div style={{ height: 260, width: 260 }}>
        <CurveControl updateCurveFunction={updateCurveFunction} updateImage={handleCurve} />
      </div>
    );
  }

  renderPhotoEditFooter(): React.JSX.Element[] {
    const { mode } = this.props;
    const previewButton = (
      <Button
        key="preview"
        onMouseDown={() => this.setState({ isShowingOriginal: true })}
        onMouseLeave={() => this.setState({ isShowingOriginal: false })}
        onMouseUp={() => this.setState({ isShowingOriginal: false })}
        onTouchEnd={() => this.setState({ isShowingOriginal: false })}
        onTouchStart={() => this.setState({ isShowingOriginal: true })}
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

  render(): React.JSX.Element {
    const { mode } = this.props;

    if (['curve', 'sharpen'].includes(mode)) {
      return this.renderPhotoEditeModal();
    }

    return null;
  }
}

export default PhotoEditPanel;
