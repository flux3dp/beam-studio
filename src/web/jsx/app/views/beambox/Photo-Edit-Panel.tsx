function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable react/no-multi-comp */
define(['jquery', 'helpers/i18n', 'helpers/image-data', 'helpers/JimpHelper', 'app/actions/progress-actions', 'app/constants/progress-constants', 'jsx!widgets/Modal', 'jsx!widgets/Button-Group', 'jsx!widgets/Curve-Control', 'jsx!widgets/Slider-Control', 'lib/cropper'], function ($, i18n, ImageData, JimpHelper, ProgressActions, ProgressConstants, Modal, ButtonGroup, CurveControl, SliderControl, Cropper) {
  const React = require('react');

  const LANG = i18n.lang.beambox.photo_edit_panel;

  const jimp = require('jimp');

  let cropper = null;

  class PhotoEditPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleGrayScale", () => {
        ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);
        ImageData(this.state.src, {
          grayscale: {
            is_rgba: true,
            is_shading: this.state.shading,
            threshold: this.state.threshold,
            is_svg: false
          },
          isFullResolution: true,
          onComplete: result => {
            ProgressActions.close();

            if (this.state.grayScaleUrl) {
              URL.revokeObjectURL(this.state.grayScaleUrl);
            }

            this.setState({
              grayScaleUrl: result.canvas.toDataURL('image/png'),
              isGrayScale: true
            });
          }
        });
      });

      _defineProperty(this, "_handleStartCrop", () => {
        if (this.state.isCropping) {
          return;
        }

        const image = document.getElementById('original-image');
        cropper = new Cropper(image, {
          autoCropArea: 1,
          zoomable: false,
          viewMode: 0,
          targetWidth: image.width,
          targetHeight: image.height
        });
        this.setState({
          isCropping: true
        });
      });

      _defineProperty(this, "_handleStamp", async () => {
        let imgBlobUrl = this.state.src;

        try {
          let image = await fetch(imgBlobUrl);
          image = await image.blob();
          image = await new Response(image).arrayBuffer();
          image = await jimp.read(image);
          const w = image.bitmap.width;
          const h = image.bitmap.height;
          await JimpHelper.binarizeImage(image, this.state.shading ? 128 : this.state.threshold);
          const origImage = image.clone();
          await JimpHelper.stampBlur(origImage, Math.ceil(Math.min(w, h) / 30)); // await origImage.blur(Math.ceil(Math.min(w, h) / 40));

          JimpHelper.regulateBlurredImage(origImage);
          await image.composite(origImage, 0, 0, {
            mode: jimp.BLEND_OVERLAY
          });
          image = await image.getBufferAsync(jimp.MIME_PNG);
          image = new Blob([image]);
          const src = URL.createObjectURL(image);
          this.state.srcHistory.push(this.state.src);
          this.state.shading = true;
          this.state.threshold = 255;
          this.state.src = src;
          ProgressActions.close();

          this._handleComplete();
        } catch (e) {
          console.error(e);
          ProgressActions.close();
        }
      });

      ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);
      this.state = {
        origSrc: this.props.src,
        previewSrc: this.props.src,
        src: this.props.src,
        srcHistory: [],
        isCropping: false,
        wRatio: 1,
        hRatio: 1,
        threshold: $(this.props.element).attr('data-threshold'),
        shading: $(this.props.element).attr('data-shading') === 'true',
        hadPreprocessDone: false,
        grayScaleUrl: null,
        isGrayScale: false
      };
      this.sharpenIntensity = 0;
    }

    componentDidMount() {
      switch (this.props.mode) {
        case 'sharpen':
        case 'curve':
        case 'crop':
          this._handlePreprocess();

          break;

        case 'invert':
          this._handleInvertAndComplete();

          break;

        case 'stamp':
          this._handleStamp();

          break;

        default:
          break;
      }
    }

    async _handlePreprocess() {
      let imgBlobUrl = this.state.origSrc;
      ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);

      try {
        const res = await fetch(imgBlobUrl);
        const blob = await res.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const image = await jimp.read(arrayBuffer);
        let w = image.bitmap.width;
        let h = image.bitmap.height;

        if (['sharpen', 'curve'].includes(this.props.mode)) {
          if (Math.max(image.bitmap.width, image.bitmap.height) > 600) {
            console.log('Down Sampling');

            if (image.bitmap.width >= image.bitmap.height) {
              image.resize(600, jimp.AUTO);
            } else {
              image.resize(jimp.AUTO, 600);
            }

            const buffer = await image.getBufferAsync(jimp.MIME_PNG);
            const newBlob = new Blob([buffer]);
            const src = URL.createObjectURL(newBlob);

            if (this.state.src !== this.state.origSrc) {
              URL.revokeObjectURL(this.state.src);
            }

            this.state.previewSrc = src;
            this.setState({
              imageWidth: w,
              imageHeight: h,
              previewSrc: src,
              src: src,
              hadPreprocessDone: true
            });
          } else {
            this.setState({
              imageWidth: w,
              imageHeight: h,
              previewSrc: imgBlobUrl,
              src: imgBlobUrl,
              hadPreprocessDone: true
            });
          }
        } else if (this.props.mode === 'crop') {
          ProgressActions.close();
          this.setState({
            imageWidth: w,
            origWidth: w,
            imageHeight: h,
            origHeight: h,
            hadPreprocessDone: true
          });
        } else {
          throw new Error(`Unknown Mode ${this.props.mode}`);
        }
      } catch (err) {
        console.log(err);
        ProgressActions.close();
      }
    }

    _handleCancel() {
      let src = this.state.src;

      while (this.state.srcHistory.length > 0) {
        URL.revokeObjectURL(src);
        src = this.state.srcHistory.pop();
      }

      this.props.unmount();
    }

    _handleComplete() {
      let self = this;
      this.batchCmd = new svgedit.history.BatchCommand('Photo edit');
      let elem = this.props.element;

      this._handleSetAttribute('origImage', this.state.src);

      if (this.props.mode === 'crop') {
        const image = document.getElementById('original-image');

        if (this.state.origWidth !== image.naturalWidth) {
          let ratio = image.naturalWidth / this.state.origWidth;

          this._handleSetAttribute('width', $(elem).attr('width') * ratio);
        }

        if (this.state.origHeight !== image.naturalHeight) {
          let ratio = image.naturalHeight / this.state.origHeight;

          this._handleSetAttribute('height', $(elem).attr('height') * ratio);
        }
      }

      if (this.props.mode === 'invert') {
        this._handleSetAttribute('data-threshold', this.state.threshold);
      }

      if (this.props.mode === 'stamp') {
        this._handleSetAttribute('data-threshold', 255);

        this._handleSetAttribute('data-shading', true);
      }

      ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);
      ImageData(this.state.src, {
        grayscale: {
          is_rgba: true,
          is_shading: this.state.shading,
          threshold: this.state.threshold,
          is_svg: false
        },
        isFullResolution: true,
        onComplete: function (result) {
          self._handleSetAttribute('xlink:href', result.canvas.toDataURL());

          svgCanvas.undoMgr.addCommandToHistory(self.batchCmd);
          svgCanvas.selectOnly([elem], true);
          ProgressActions.close();
        }
      });
      let src;

      while (this.state.srcHistory.length > 0) {
        URL.revokeObjectURL(src);
        src = this.state.srcHistory.pop();
      }

      if (this.state.previewSrc !== this.state.origSrc) {
        URL.revokeObjectURL(this.state.previewSrc);
      }

      this.props.unmount();
    }

    _handleSetAttribute(attr, value) {
      let elem = this.props.element;
      svgCanvas.undoMgr.beginUndoableChange(attr, [elem]);
      elem.setAttribute(attr, value);
      let cmd = svgCanvas.undoMgr.finishUndoableChange();

      if (!cmd.isEmpty()) {
        this.batchCmd.addSubCommand(cmd);
      }
    }

    _handleGoBack() {
      if (this.state.isCropping) {
        this._destroyCropper();
      }

      URL.revokeObjectURL(this.state.src);
      const src = this.state.srcHistory.pop();
      this.setState({
        src: src,
        isCropping: false,
        isGrayScale: false
      });
    }

    _renderPhotoEditeModal() {
      if (!this.state.isGrayScale && this.state.hadPreprocessDone) {
        this._handleGrayScale();
      }

      let panelContent;
      let rightWidth = 40;

      switch (this.props.mode) {
        case 'sharpen':
          panelContent = this._renderSharpenPanel();
          rightWidth = 390;
          break;

        case 'curve':
          panelContent = this._renderCurvePanel();
          rightWidth = 390;
          break;

        default:
          break;
      }

      const maxAllowableWidth = $('.top-bar').width() - rightWidth;
      const maxAllowableHieght = $(window).height() - 2 * $('.top-bar').height() - 180;
      const containerStyle = this.state.imageWidth / maxAllowableWidth > this.state.imageHeight / maxAllowableHieght ? {
        width: `${maxAllowableWidth}px`
      } : {
        height: `${maxAllowableHieght}px`
      };

      const footer = this._renderPhotoEditFooter();

      const onImgLoad = () => {
        if (this.props.mode === 'crop' && !this.state.isCropping) {
          this._handleStartCrop();
        }

        ProgressActions.close();
      };

      return /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement("div", {
        className: "photo-edit-panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "main-content"
      }, /*#__PURE__*/React.createElement("div", {
        className: "image-container",
        style: containerStyle
      }, /*#__PURE__*/React.createElement("img", {
        id: "original-image",
        style: containerStyle,
        src: this.state.grayScaleUrl,
        onLoad: () => onImgLoad()
      })), panelContent), footer));
    }

    // SHARPEN
    _renderSharpenPanel() {
      return /*#__PURE__*/React.createElement("div", {
        className: "right-part"
      }, /*#__PURE__*/React.createElement("div", {
        className: `scroll-bar-container ${this.props.mode}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "sub-functions with-slider"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, LANG.sharpen), /*#__PURE__*/React.createElement(SliderControl, {
        id: "sharpen-intensity",
        key: "sharpen-intensity",
        label: LANG.sharpness,
        min: 0,
        max: 20,
        step: 1,
        default: 0,
        onChange: (id, val) => this._handleSharp(true, val)
      }))));
    }

    async _handleSharp(isPreview, val) {
      const imgBlobUrl = isPreview ? this.state.previewSrc : this.state.origSrc;
      const sharpness = isPreview ? parseInt(val) : this.state.sharpness;
      const k_edge = -sharpness / 2;
      const k_corner = -sharpness / 4;
      const k_m = -4 * (k_edge + k_corner) + 1;
      const kernal = [[k_corner, k_edge, k_corner], [k_edge, k_m, k_edge], [k_corner, k_edge, k_corner]];
      ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);

      try {
        let imageData = await fetch(imgBlobUrl);
        imageData = await imageData.blob();
        imageData = await new Response(imageData).arrayBuffer();
        imageData = await jimp.read(imageData);
        imageData.convolute(kernal);
        imageData = await imageData.getBufferAsync(jimp.MIME_PNG);
        imageData = new Blob([imageData]);
        const src = URL.createObjectURL(imageData);

        if (this.state.src !== this.state.previewSrc) {
          URL.revokeObjectURL(this.state.src);
        }

        if (isPreview) {
          this.setState({
            src: src,
            isGrayScale: false,
            sharpness: sharpness
          });
        } else {
          this.setState({
            src: src
          }, () => this._handleComplete());
        }

        ProgressActions.close();
      } catch (e) {
        console.error(e);
        ProgressActions.close();
      }
    } // CROP


    async _handleCrop(complete = false) {
      const image = document.getElementById('original-image');
      const cropData = cropper.getData();
      ;
      const x = Math.max(0, cropData.x);
      const y = Math.max(0, cropData.y);
      const w = Math.min(image.naturalWidth - x, cropData.width);
      const h = Math.min(image.naturalHeight - y, cropData.height);
      let imgBlobUrl = this.state.src;
      ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);

      try {
        let imageData = await fetch(imgBlobUrl);
        imageData = await imageData.blob();
        imageData = await new Response(imageData).arrayBuffer();
        imageData = await jimp.read(imageData);
        imageData.crop(x, y, w, h);
        imageData = await imageData.getBufferAsync(jimp.MIME_PNG);
        imageData = new Blob([imageData]);
        const src = URL.createObjectURL(imageData);
        this.state.srcHistory.push(this.state.src);

        this._destroyCropper();

        this.setState({
          src: src,
          isCropping: false,
          isGrayScale: false,
          imageWidth: cropData.width,
          imageHeight: cropData.height
        }, () => {
          ProgressActions.close();

          if (complete) {
            ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);
            let timeout = window.setTimeout(this._handleComplete.bind(this), 500);
          }
        });
      } catch (e) {
        console.error(e);
        ProgressActions.close();
      }
    }

    _handleCancelCrop() {
      this._destroyCropper();

      this.setState({
        isCropping: false
      });
    }

    _destroyCropper() {
      if (cropper) {
        cropper.destroy();
      }
    } // INVERT


    async _handleInvertAndComplete() {
      let imgBlobUrl = this.state.src;

      try {
        let imageData = await fetch(imgBlobUrl);
        imageData = await imageData.blob();
        imageData = await new Response(imageData).arrayBuffer();
        imageData = await jimp.read(imageData);
        imageData.invert();
        imageData = await imageData.getBufferAsync(jimp.MIME_PNG);
        imageData = new Blob([imageData]);
        const src = URL.createObjectURL(imageData);

        if (!this.state.shading) {
          this.state.threshold = 256 - this.state.threshold;
        }

        this.state.srcHistory.push(this.state.src);
        this.state.src = src;
        ProgressActions.close();

        this._handleComplete();
      } catch (e) {
        console.error(e);
        ProgressActions.close();
      }
    } // STAMP


    // CURVE
    _renderCurvePanel() {
      return /*#__PURE__*/React.createElement("div", {
        className: "right-part"
      }, /*#__PURE__*/React.createElement("div", {
        className: "curve-panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, LANG.curve), /*#__PURE__*/React.createElement(CurveControl, {
        updateCurveFunction: this._updateCurveFunction.bind(this),
        updateImage: () => {
          this._handleCurve(true);
        }
      })));
    }

    _updateCurveFunction(curvefunction) {
      this.curvefunction = curvefunction;
    }

    async _handleCurve(isPreview) {
      const curveFunc = [...Array(256).keys()].map(e => Math.round(this.curvefunction(e)));
      let imgBlobUrl = isPreview ? this.state.previewSrc : this.state.origSrc;
      ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);

      try {
        let imageData = await fetch(imgBlobUrl);
        imageData = await imageData.blob();
        imageData = await new Response(imageData).arrayBuffer();
        imageData = await jimp.read(imageData);

        for (let i = 0; i < imageData.bitmap.data.length; i++) {
          if (i % 4 != 3) {
            imageData.bitmap.data[i] = curveFunc[imageData.bitmap.data[i]];
          }
        }

        imageData = await imageData.getBufferAsync(jimp.MIME_PNG);
        imageData = new Blob([imageData]);
        const src = URL.createObjectURL(imageData);

        if (this.state.src !== this.state.previewSrc) {
          URL.revokeObjectURL(this.state.src);
        }

        if (isPreview) {
          this.setState({
            src: src,
            isGrayScale: false
          });
        } else {
          this.setState({
            src: src
          }, () => this._handleComplete());
        }

        ProgressActions.close();
      } catch (e) {
        console.error(e);
        ProgressActions.close();
      }
    }

    _handleCurveComplete() {
      this._handleCurve(false);
    }

    _renderPhotoEditFooter() {
      if (this.props.mode === 'sharpen') {
        let buttons = [{
          label: LANG.okay,
          onClick: () => {
            this._handleSharp(false);
          },
          className: 'btn btn-default primary'
        }, {
          label: LANG.cancel,
          onClick: () => {
            this._handleCancel();
          },
          className: 'btn btn-default'
        }];
        return /*#__PURE__*/React.createElement("div", {
          className: "footer"
        }, /*#__PURE__*/React.createElement(ButtonGroup, {
          buttons: buttons
        }));
      }

      if (this.props.mode === 'crop') {
        const disableGoBack = this.state.srcHistory.length === 0;
        let buttons = [{
          label: LANG.okay,
          onClick: () => {
            this._handleCrop(true);
          },
          className: 'btn btn-default pull-right primary'
        }, {
          label: LANG.apply,
          onClick: () => {
            this._handleCrop();
          },
          className: 'btn btn-default pull-right'
        }, {
          label: LANG.back,
          onClick: disableGoBack ? () => {} : () => {
            this._handleGoBack();
          },
          className: `btn btn-default pull-right${disableGoBack ? ' disabled' : ''}`
        }, {
          label: LANG.cancel,
          onClick: () => {
            this._handleCancel();
          },
          className: 'btn btn-default pull-right'
        }];
        return /*#__PURE__*/React.createElement("div", {
          className: "footer"
        }, /*#__PURE__*/React.createElement(ButtonGroup, {
          buttons: buttons
        }));
      }

      if (this.props.mode === 'curve') {
        let buttons = [{
          label: LANG.okay,
          onClick: () => {
            this._handleCurveComplete();
          },
          className: 'btn btn-default primary'
        }, {
          label: LANG.cancel,
          onClick: () => {
            this._handleCancel();
          },
          className: 'btn btn-default'
        }];
        return /*#__PURE__*/React.createElement("div", {
          className: "footer"
        }, /*#__PURE__*/React.createElement(ButtonGroup, {
          buttons: buttons
        }));
      }
    }

    render() {
      let renderContent;

      switch (this.props.mode) {
        case 'sharpen':
        case 'crop':
        case 'curve':
          renderContent = this._renderPhotoEditeModal();
          break;

        case 'invert':
        case 'stamp':
          ProgressActions.open(ProgressConstants.NONSTOP_WITH_MESSAGE, LANG.processing);
          renderContent = /*#__PURE__*/React.createElement("div", null);
          break;

        default:
          renderContent = /*#__PURE__*/React.createElement("div", null);
          break;
      }

      return renderContent;
    }

  }

  ;
  return PhotoEditPanel;
});