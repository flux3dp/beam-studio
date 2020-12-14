
/* eslint-disable react/no-multi-comp */
import $ from 'jquery';
import Constants from '../../actions/beambox/constant'
import * as i18n from '../../../helpers/i18n';
import ImageData from '../../../helpers/image-data';
import JimpHelper from '../../../helpers/JimpHelper';
import Progress from '../../contexts/ProgressCaller';
import Modal from '../../widgets/Modal';
import ButtonGroup from '../../widgets/Button-Group';
import CurveControl from '../../widgets/Curve-Control';
import SliderControl from '../../widgets/Slider-Control';
import { getSVGAsync } from '../../../helpers/svg-editor-helper';

let svgCanvas, svgedit;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit
});

const React = requireNode('react');
const Cropper = requireNode('cropperjs');
const jimp = requireNode('jimp');

const LANG = i18n.lang.beambox.photo_edit_panel;

let cropper = null;
class PhotoEditPanel extends React.Component {
    constructor(props) {
        super(props);
        Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
        });
        this.state = {
            origSrc: this.props.src,
            previewSrc: this.props.src,
            src: this.props.src,
            srcHistory: [],
            isCropping: false,
            wRatio: 1,
            hRatio: 1,
            threshold: $(this.props.element).attr('data-threshold'),
            shading: ($(this.props.element).attr('data-shading') === 'true'),
            hadPreprocessDone: false,
            grayScaleUrl: null,
            isGrayScale: false,
        };
        this.sharpenIntensity = 0;
    }

    componentDidMount() {
        switch(this.props.mode) {
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
        let imgBlobUrl = this.state.origSrc;
        try {
            const res = await fetch(imgBlobUrl)
            const blob = await res.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer(); 
            const image = await jimp.read(arrayBuffer);
            let w = image.bitmap.width;
            let h = image.bitmap.height;
            if (['sharpen', 'curve'].includes(this.props.mode)){
                if( Math.max(image.bitmap.width, image.bitmap.height) > 600 ) {
                    console.log('Down Sampling');
                    if (image.bitmap.width >= image.bitmap.height) {
                        image.resize(600, jimp.AUTO);
                    } else {
                        image.resize(jimp.AUTO, 600);
                    }
                    const buffer = await image.getBufferAsync(jimp.MIME_PNG);
                    const newBlob = new Blob([buffer]);
                    const src = URL.createObjectURL(newBlob);
                    if (this.state.src !== this.state.origSrc) {
                        URL.revokeObjectURL(this.state.src);
                    }
                    this.state.previewSrc= src;
                    this.setState({
                        imageWidth: w,
                        imageHeight: h,
                        previewSrc: src,
                        src: src,
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
                Progress.popById('photo-edit-processing');

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
            console.log(err)
            Progress.popById('photo-edit-processing');
        }
    }

    _handleCancel() {
        let src = this.state.src
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
            const image = document.getElementById('original-image') as HTMLImageElement;
            if (this.state.origWidth !== image.naturalWidth) {
                let ratio = image.naturalWidth / this.state.origWidth;
                this._handleSetAttribute('width', parseFloat($(elem).attr('width')) * ratio);
            }
            if (this.state.origHeight !== image.naturalHeight) {
                let ratio = image.naturalHeight / this.state.origHeight;
                this._handleSetAttribute('height', parseFloat($(elem).attr('height')) * ratio);
            }
        }
        if (this.props.mode === 'invert') {
            this._handleSetAttribute('data-threshold', this.state.threshold);
        }
        if (this.props.mode === 'stamp') {
            this._handleSetAttribute('data-threshold', 255);
            this._handleSetAttribute('data-shading', true);
        }

        Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
        });
        ImageData(
            this.state.src, {
                grayscale: {
                    is_rgba: true,
                    is_shading: this.state.shading,
                    threshold: this.state.threshold,
                    is_svg: false,
                },
                isFullResolution: true,
                onComplete: function (result) {
                    self._handleSetAttribute('xlink:href', result.pngBase64);
                    svgCanvas.undoMgr.addCommandToHistory(self.batchCmd);
                    svgCanvas.selectOnly([elem], true);

                    Progress.popById('photo-edit-processing');
                }
            }
        );
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
            isGrayScale: false,
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
        const maxAllowableWidth = window.innerWidth - rightWidth;
        const maxAllowableHieght = window.innerHeight - 2 * Constants.topBarHeightWithoutTitleBar - 180;
        const containerStyle = (this.state.imageWidth / maxAllowableWidth > this.state.imageHeight / maxAllowableHieght) ? 
            {width: `${maxAllowableWidth}px`} : {height: `${maxAllowableHieght}px`};
        const footer = this._renderPhotoEditFooter();
        const onImgLoad = () => {
            if (this.props.mode === 'crop' && !this.state.isCropping) {
                this._handleStartCrop();
            }
            Progress.popById('photo-edit-processing');
        };
        return (
            <Modal>
                <div className='photo-edit-panel'>
                    <div className='main-content'>
                        <div className='image-container' style={containerStyle} >
                            <img 
                                id='original-image'
                                style={containerStyle}
                                src={this.state.grayScaleUrl}
                                onLoad={() => onImgLoad()}/>
                        </div>
                        {panelContent}
                    </div>
                    {footer}
                </div>
            </Modal>
        );
    }

    _handleGrayScale = () => {
        Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
        });
        ImageData(
            this.state.src,
            {
                grayscale: {
                    is_rgba: true,
                    is_shading: this.state.shading,
                    threshold: this.state.threshold,
                    is_svg: false
                },
                isFullResolution: true,
                onComplete: (result) => {
                    Progress.popById('photo-edit-processing');
                    if (this.state.grayScaleUrl) {
                        URL.revokeObjectURL(this.state.grayScaleUrl);
                    }
                    this.setState({
                        grayScaleUrl: result.pngBase64,
                        isGrayScale: true
                    });
                }
            }
        );
    }

    // SHARPEN
    _renderSharpenPanel() {
        return (
            <div className='right-part'>
                <div className={`scroll-bar-container ${this.props.mode}`}>
                    <div className='sub-functions with-slider'> 
                    <div className='title'>{LANG.sharpen}</div>
                    <SliderControl
                        id='sharpen-intensity'
                        key='sharpen-intensity'
                        label={LANG.sharpness}
                        min={0}
                        max={20}
                        step={1}
                        default={0}
                        onChange={(id, val) => this._handleSharp(true, val)}
                    />
                    </div>
                </div>
            </div>    
        );
    }

    async _handleSharp(isPreview?: boolean, val?: string) {
        const imgBlobUrl = isPreview ? this.state.previewSrc : this.state.origSrc;
        const sharpness = isPreview ? parseInt(val) : this.state.sharpness;
        const k_edge = -sharpness / 2;
        const k_corner = -sharpness / 4;
        const k_m = -4 * (k_edge + k_corner) + 1;
        const kernel = [[k_corner, k_edge, k_corner], [k_edge, k_m, k_edge], [k_corner, k_edge, k_corner]];
        Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
        });
        try {
            const resp = await fetch(imgBlobUrl);
            const respData = await resp.blob();
            const imageData = await new Response(respData).arrayBuffer(); 
            const jimpImage = await jimp.read(imageData);
            jimpImage.convolute(kernel);
            const convolutedData = await jimpImage.getBufferAsync(jimp.MIME_PNG);
            const convolutedBlob = new Blob([convolutedData]);
            const src = URL.createObjectURL(convolutedBlob);
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
                this.setState({src: src}, () => this._handleComplete());
            }
            
            Progress.popById('photo-edit-processing');
        } catch(e) {
            console.error(e);
            Progress.popById('photo-edit-processing');
        }
    }

    // CROP
    _handleStartCrop = () => {
        if (this.state.isCropping) {
            return;
        }
        const image = document.getElementById('original-image') as HTMLImageElement;
        cropper = new Cropper(
            image,
            {
                autoCropArea: 1,
                zoomable: false,
                viewMode: 0,
                targetWidth: image.width,
                targetHeight: image.height
            }
        );
        this.setState({isCropping: true});
    }

    async _handleCrop(complete=false) {
        const image = document.getElementById('original-image') as HTMLImageElement;
        const cropData = cropper.getData();
        const x = Math.max(0, cropData.x);
        const y = Math.max(0, cropData.y);
        const w = Math.min(image.naturalWidth - x, cropData.width);
        const h = Math.min(image.naturalHeight - y, cropData.height);

        let imgBlobUrl = this.state.src;
        Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
        });
        try {
            const resp = await fetch(imgBlobUrl);
            const respData = await resp.blob();
            const imageData = await new Response(respData).arrayBuffer(); 
            const jimpImage = await jimp.read(imageData);
            jimpImage.crop(x, y, w, h);
            const jimpData = await jimpImage.getBufferAsync(jimp.MIME_PNG);
            const jimpBlob = new Blob([jimpData]);
            const src = URL.createObjectURL(jimpBlob);
            this.state.srcHistory.push(this.state.src);
            this._destroyCropper();
            this.setState({
                src: src,
                isCropping: false,
                isGrayScale: false,
                imageWidth: cropData.width,
                imageHeight: cropData.height
            }, () => {
                Progress.popById('photo-edit-processing');
                if (complete) {
                    Progress.openNonstopProgress({
                        id: 'photo-edit-processing',
                        message: LANG.processing,
                    });
                    let timeout = window.setTimeout(this._handleComplete.bind(this) , 500);
                }
            });
            
        } catch(e) {
            console.error(e);
            Progress.popById('photo-edit-processing');
        }
    }

    _handleCancelCrop() {
        this._destroyCropper();
        this.setState({isCropping: false});
    }

    _destroyCropper() {
        if(cropper) {
            cropper.destroy();
        }
    }

    // INVERT
    async _handleInvertAndComplete() {
        let imgBlobUrl = this.state.src;
        try {
            const resp = await fetch(imgBlobUrl);
            const respData = await resp.blob();
            const imageData = await new Response(respData).arrayBuffer(); 
            const jimpImage = await jimp.read(imageData);
            jimpImage.invert();
            const jimpData = await jimpImage.getBufferAsync(jimp.MIME_PNG);
            const jimpBlob = new Blob([jimpData]);
            const src = URL.createObjectURL(jimpBlob);
            if (!this.state.shading) {
                this.state.threshold = 256 - this.state.threshold;
            }
            this.state.srcHistory.push(this.state.src);
            this.state.src = src;
            Progress.popById('photo-edit-processing');
            this._handleComplete();
        } catch(e) {
            console.error(e);
            Progress.popById('photo-edit-processing');
        }
    }

    // STAMP
    _handleStamp = async () => {
        let imgBlobUrl = this.state.src;
        try {
            const resp = await fetch(imgBlobUrl);
            const respData = await resp.blob();
            const imageData = await new Response(respData).arrayBuffer(); 
            const jimpImage = await jimp.read(imageData);
            const w = jimpImage.bitmap.width;
            const h = jimpImage.bitmap.height;
            await JimpHelper.binarizeImage(jimpImage, this.state.shading ? 128 : this.state.threshold);
            const origImage = jimpImage.clone();
            await JimpHelper.stampBlur(origImage, Math.ceil(Math.min(w, h) / 30));
            // await origImage.blur(Math.ceil(Math.min(w, h) / 40));
            JimpHelper.regulateBlurredImage(origImage);
            await jimpImage.composite(origImage, 0, 0, {
                mode: jimp.BLEND_OVERLAY
            });
            const jimpData = await jimpImage.getBufferAsync(jimp.MIME_PNG);
            const jimpBlob = new Blob([jimpData]);
            const src = URL.createObjectURL(jimpBlob);
            this.state.srcHistory.push(this.state.src);
            this.state.shading = true;
            this.state.threshold = 255;
            this.state.src = src;
            Progress.popById('photo-edit-processing');
            this._handleComplete();
        } catch(e) {
            console.error(e);
            Progress.popById('photo-edit-processing');
        }
    }

    // CURVE
    _renderCurvePanel() {
        const updateCurveFunction = (curvefunction) => {this._updateCurveFunction(curvefunction)};
        const handleCurve = () => {this._handleCurve(true)};
        return (
            <div className='right-part'>
                <div className='curve-panel'>
                    <div className='title'>{LANG.curve}</div>
                    <CurveControl
                        updateCurveFunction={updateCurveFunction}
                        updateImage={handleCurve}
                    />
                </div>
            </div>
        );
    }

    _updateCurveFunction(curvefunction) {
        console.log(curvefunction);
        this.curvefunction = curvefunction;
    }

    async _handleCurve(isPreview) {
        const curveFunc = [...Array(256).keys()].map(e => Math.round(this.curvefunction(e)));
        let imgBlobUrl = isPreview ? this.state.previewSrc : this.state.origSrc;
        Progress.openNonstopProgress({
            id: 'photo-edit-processing',
            message: LANG.processing,
        });
        try {
            const resp = await fetch(imgBlobUrl);
            const respBlob = await resp.blob();
            const respData = await new Response(respBlob).arrayBuffer(); 
            const jimgImage = await jimp.read(respData);
            for (let i = 0; i < jimgImage.bitmap.data.length; i++) {
                if (i % 4 != 3) {
                    jimgImage.bitmap.data[i] =  curveFunc[jimgImage.bitmap.data[i]];
                }
            }
            const jimpData = await jimgImage.getBufferAsync(jimp.MIME_PNG);
            const jimpBlob = new Blob([jimpData]);
            const src = URL.createObjectURL(jimpBlob);
            if (this.state.src !== this.state.previewSrc) {
                URL.revokeObjectURL(this.state.src);
            }
            if (isPreview) {
                this.setState({
                    src: src,
                    isGrayScale: false,
                });
            } else {
                this.setState({src: src}, () => this._handleComplete());
            }
            Progress.popById('photo-edit-processing');
        } catch(e) {
            console.error(e);
            Progress.popById('photo-edit-processing');
        }
    }

    _handleCurveComplete() {
        this._handleCurve(false);
    }

    _renderPhotoEditFooter() {
        if (this.props.mode === 'sharpen') {
            let buttons = [
                {
                    label: LANG.okay,
                    onClick: () => {this._handleSharp(false)},
                    className: 'btn btn-default primary'
                },
                {
                    label: LANG.cancel,
                    onClick: () => {this._handleCancel()},
                    className: 'btn btn-default'
                }
            ];
            return (
            <div className='footer'>
                <ButtonGroup buttons={buttons}/>
            </div>
            );
        } 
        if (this.props.mode === 'crop') {
            const disableGoBack = (this.state.srcHistory.length === 0);
            let buttons = [
                {
                    label: LANG.okay,
                    onClick: () => {this._handleCrop(true)},
                    className: 'btn btn-default pull-right primary'
                },
                {
                    label: LANG.apply,
                    onClick: () => {this._handleCrop()},
                    className: 'btn btn-default pull-right'
                },
                {
                    label: LANG.back,
                    onClick: disableGoBack ? () => {} : () => {this._handleGoBack()},
                    className: `btn btn-default pull-right${disableGoBack ? ' disabled':''}`
                },
                {
                    label: LANG.cancel,
                    onClick: () => {this._handleCancel()},
                    className: 'btn btn-default pull-right'
                }
            ];
            return (
                <div className='footer'>
                    <ButtonGroup buttons={buttons}/>
                </div>
            );
        }
        if (this.props.mode === 'curve') {
            let buttons = [
                {
                    label: LANG.okay,
                    onClick: () => {this._handleCurveComplete()},
                    className: 'btn btn-default primary'
                },
                {
                    label: LANG.cancel,
                    onClick: () => {this._handleCancel()},
                    className: 'btn btn-default'
                }
            ];
            return (
                <div className='footer'>
                    <ButtonGroup buttons={buttons}/>
                </div>
            );
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
                renderContent = (<div/>)
                break;
            default:
                renderContent = (<div/>)
                break;
        }
        return renderContent;
    }
};

export default PhotoEditPanel;
