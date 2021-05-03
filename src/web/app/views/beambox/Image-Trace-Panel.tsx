
/* eslint-disable react/no-multi-comp */
import $ from 'jquery';
import BeamboxActions from '../../actions/beambox';
import BeamboxPreference from '../../actions/beambox/beambox-preference';
import Constants from '../../actions/beambox/constant';
import PreviewModeBackgroundDrawer from '../../actions/beambox/preview-mode-background-drawer';
import FnWrapper from '../../actions/beambox/svgeditor-function-wrapper';
import BeamboxStore from '../../stores/beambox-store';
import * as i18n from '../../../helpers/i18n';
import ImageData from '../../../helpers/image-data';
import ImageTracerApi from '../../../helpers/api/image-tracer';
import Modal from '../../widgets/Modal';
import SliderControl from '../../widgets/Slider-Control';

// @ts-expect-error
import ImageTracer = require('imagetracer');
import { getSVGAsync } from '../../../helpers/svg-editor-helper';
let svgCanvas, svgedit;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit;
});

const React = requireNode('react');
const Cropper = requireNode('cropperjs');
const LANG = i18n.lang.beambox.image_trace_panel;

const imageTracerWebSocket = ImageTracerApi();

const TESTING_IT = false;

//View render the following steps
const STEP_NONE = Symbol();
const STEP_OPEN = Symbol();
const STEP_CROP = Symbol();
const STEP_TUNE = Symbol();
const STEP_APPLY = Symbol();

let cropper = null;
let grayscaleCroppedImg = null;

const TestImg = 'img/hehe.png';

const PANEL_PADDING = 100;
let maxAllowableWidth: number;
let maxAllowableHieght: number;

class ImageTracePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentStep: STEP_NONE,
            croppedBlobUrl: '',
            croppedCameraCanvasBlobUrl: '',
            imageTrace: '',
            cropData: {},
            preCrop: {},
            threshold: 128,
            cropperStyle: {},
        };
        maxAllowableWidth = window.innerWidth - 2 * PANEL_PADDING;
        maxAllowableHieght = window.innerHeight - 2 * PANEL_PADDING;
    }

    componentDidMount() {
        BeamboxStore.onCropperShown(() => this.openCropper());

        if (TESTING_IT) {
            console.log('dev ! testing it-panel');
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d');

            const img = new Image();
            img.src = TestImg;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const croppedBlobUrl = URL.createObjectURL(blob);

                    this.setState({ croppedBlobUrl });
                    ImageData(
                        croppedBlobUrl,
                        {
                            height: 0,
                            width: 0,
                            grayscale: {
                                is_binary: true,
                                is_rgba: true,
                                is_shading: false,
                                threshold: 128,
                                is_svg: false
                            },
                            onComplete: (result) => {
                                grayscaleCroppedImg = result.pngBase64;
                                this.setState({ currentStep : STEP_TUNE })
                            }
                        }
                    );
                });
            };
        }
    }

    componentWillUnmount() {
        BeamboxStore.removeCropperShownListener(() => this.openCropper());
    }

    _getImageTrace(imageTrace) {
        this.setState({ imageTrace });

        if(this.state.currentStep === STEP_TUNE) {
            this.next();
        }
    }

    openCropper() {
        if( this.state.currentStep === STEP_NONE) {
            this.next();
        }
    }

    next() {
        switch(this.state.currentStep) {
            case STEP_NONE:
                this.setState({ currentStep: STEP_OPEN });
                break;
            case STEP_OPEN:
                this.setState({ currentStep: STEP_CROP });
                break;
            case STEP_CROP:
                this.setState({ currentStep: STEP_APPLY });
                this._destroyCropper();
                break;
            case STEP_TUNE:
                this.setState({ currentStep: STEP_APPLY });
                break;
            case STEP_APPLY:
                this.setState({ currentStep: STEP_NONE });
                break;
        }
    }

    prev() {
        switch(this.state.currentStep) {
            case STEP_CROP:
                this.setState({ currentStep: STEP_NONE })
                break;
            case STEP_TUNE:
                this.setState({ currentStep: STEP_CROP })
                break;
            case STEP_APPLY:
                this.setState({ currentStep: STEP_CROP })
                break;
            default:
                break;
        }
    }

    _backToCropper() {
        this.prev();
        URL.revokeObjectURL(this.state.croppedBlobUrl);
        this.setState({
            threshold: 128
        });
    }

    _backToTune() {
        this.prev();
        this.setState({ imageTrace: '' });
    }

    async _calculateImageTrace() {
        const {
            croppedBlobUrl,
            threshold
        } = this.state;
        const d = $.Deferred();
        const img = document.getElementById('tunedImage');
        if(this.state.currentStep === STEP_TUNE) {
            this.next();
        }
    }

    _handleCropping() {
        const cropData = cropper.getData();
        const croppedCanvas = cropper.getCroppedCanvas();

        croppedCanvas.toBlob((blob) => {
            const croppedBlobUrl = URL.createObjectURL(blob);

            this.setState({ cropData, croppedBlobUrl });

            ImageData(
                croppedBlobUrl,
                {
                    height: 0,
                    width: 0,
                    grayscale: {
                        is_rgba: true,
                        is_shading: false,
                        threshold: 128,
                        is_svg: false
                    },
                    onComplete: (result) => {
                        if (grayscaleCroppedImg) {
                            URL.revokeObjectURL(grayscaleCroppedImg);
                        }
                        grayscaleCroppedImg = result.pngBase64;
                        this.next();
                    }
                }
            );
        });


    }

    _handleCropperCancel() {
        this._destroyCropper();
        this.prev();
        BeamboxActions.endImageTrace();
    }

    _handleParameterChange(id, value) {
        switch(id) {
            case 'threshold':
                ImageData(
                    this.state.croppedBlobUrl,
                    {
                        height: 0,
                        width: 0,
                        grayscale: {
                            is_rgba: true,
                            is_shading: false,
                            threshold: parseInt(value),
                            is_svg: false
                        },
                        onComplete: (result) => {
                            if (grayscaleCroppedImg) {
                                URL.revokeObjectURL(grayscaleCroppedImg);
                            }
                            grayscaleCroppedImg = result.pngBase64;
                            this.setState({ threshold: value });
                        }
                    }
                );
                break;
        }
    }

    _destroyCropper() {
        if(cropper) {
            cropper.destroy();
        }
    }

    _handleImageTraceCancel() {
        URL.revokeObjectURL(this.state.croppedBlobUrl);
        if (this.state.croppedCameraCanvasBlobUrl != '') {
            URL.revokeObjectURL(this.state.croppedCameraCanvasBlobUrl);
        }
        this.setState({
            currentStep: STEP_NONE,
            croppedBlobUrl: '',
            croppedCameraCanvasBlobUrl: '',
            imageTrace: '',
            threshold: 128
        });
        BeamboxActions.endImageTrace();
    }

    _handleImageTraceComplete() {
        this.next();
    }

    async _pushImageTrace() {
        const {
            cropData,
            preCrop,
            imageTrace,
            threshold,
            croppedBlobUrl
        } = this.state;
        const tunedImage = document.getElementById('tunedImage') as HTMLImageElement;

        const d = $.Deferred();

        if (TESTING_IT) {
            const testingCropData = {
                x: tunedImage.x,
                y: tunedImage.y,
                width: 1150,
                height: 918
            }
            const testingPreCrop = {
                offsetX: 100,
                offsetY: 100
            }

            FnWrapper.insertImage(croppedBlobUrl, testingCropData, testingPreCrop, 1, threshold, true);
            //FnWrapper.insertSvg(imageTrace, 'image-trace', testingCropData, testingPreCrop);
        } else {
            FnWrapper.insertImage(croppedBlobUrl, cropData, preCrop, 1, threshold, true);
            await this._traceImageAndAppend(grayscaleCroppedImg, cropData, preCrop);
        }

        URL.revokeObjectURL(grayscaleCroppedImg);
        if (this.state.croppedCameraCanvasBlobUrl != '') {
            URL.revokeObjectURL(this.state.croppedCameraCanvasBlobUrl);
        }
        this.setState({
            currentStep: STEP_NONE,
            croppedBlobUrl: '',
            croppedCameraCanvasBlobUrl: '',
            imageTrace: '',
            threshold: 128
        });
        BeamboxActions.endImageTrace();
    }

    _traceImageAndAppend (imgUrl, cropData, preCrop) {
        return new Promise ((resolve, reject) => {
            ImageTracer.imageToSVG(imgUrl, svgstr => {
                const gId = svgCanvas.getNextId();
                const batchCmd = new svgedit.history.BatchCommand('Add Image Trace');
                const g = svgCanvas.addSvgElementFromJson({
                    'element': 'g',
                    'attr': {
                        'id': gId
                    }
                }) as SVGGElement;
                const path = svgCanvas.addSvgElementFromJson({
                    'element': 'path',
                    'attr': {
                        'id': svgCanvas.getNextId(),
                        'fill': '#000000',
                        'stroke-width': 1,
                        'vector-effect': 'non-scaling-stroke',
                    }
                }) as SVGPathElement;
                path.addEventListener('mouseover', svgCanvas.handleGenerateSensorArea);
                path.addEventListener('mouseleave', svgCanvas.handleGenerateSensorArea);
                batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(path));
                svgCanvas.selectOnly([g]);
                svgstr = svgstr.replace(/<\/?svg[^>]*>/g, '');
                ImageTracer.appendSVGString(svgstr, gId);
                const gBBox = g.getBBox();
                if (cropData.width !== gBBox.width) {
                    svgCanvas.setSvgElemSize('width', cropData.width);
                }
                if (cropData.height !== gBBox.height) {
                    svgCanvas.setSvgElemSize('height', cropData.height);
                }
                let d = '';
                for (let i = 0; i < g.childNodes.length; i++) {
                    let child = g.childNodes[i] as Element;
                    if (child.getAttribute('opacity') !== '0') {
                        d += child.getAttribute('d');
                    }
                    child.remove();
                    i--;
                }
                g.remove();
                path.setAttribute('d', d);
                let dx = cropData.x + preCrop.offsetX;
                let dy = cropData.y + preCrop.offsetY;
                svgCanvas.moveElements([dx], [dy], [path], false);
                svgCanvas.selectOnly([path], true);
                svgCanvas.undoMgr.addCommandToHistory(batchCmd);
                resolve(true);
            });
        });
    }

    _renderImageToCrop() {
        const previewBlobUrl = PreviewModeBackgroundDrawer.getCameraCanvasUrl();

        return (
            <img
                id= 'previewForCropper'
                onLoad={()=> this._renderCropper()}
                src={previewBlobUrl}
            />
        );
    }

    _renderCropper() {
        const imageObj = document.getElementById('previewForCropper');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const coordinates = PreviewModeBackgroundDrawer.getCoordinates();
        const sourceWidth = coordinates.maxX - coordinates.minX;
        const sourceHeight = coordinates.maxY - coordinates.minY;
        const ratio = Math.min(maxAllowableHieght / sourceHeight, maxAllowableWidth / sourceWidth);
        const destWidth = sourceWidth * ratio;
        const destHeight = sourceHeight * ratio;

        this.setState({
            preCrop: {
                offsetX: coordinates.minX,
                offsetY: coordinates.minY,
            },
        });
        cropper = new Cropper(
            imageObj,
            {
                zoomable: false,
                viewMode: 0,
                targetWidth: destWidth,
                targetHeight: destHeight
            }
        );
    }

    _renderCropperModal() {
        const coordinates = PreviewModeBackgroundDrawer.getCoordinates();
        const sourceWidth = coordinates.maxX - coordinates.minX;
        const sourceHeight = coordinates.maxY - coordinates.minY;
        const containerStyle = (sourceWidth / maxAllowableWidth > sourceHeight / maxAllowableHieght) ?
            {width: `${maxAllowableWidth}px`} : {height: `${maxAllowableHieght}px`};

        return (
            <Modal>
                <div className='cropper-panel'>
                    <div className='main-content' style={{width: maxAllowableWidth, height: maxAllowableHieght}}>
                        <img
                            id= 'previewForCropper'
                            onLoad={()=> this._renderCropper()}
                            src={this.state.croppedCameraCanvasBlobUrl}
                            style={containerStyle}
                        />
                    </div>
                    <div className='footer'>
                        <button
                            className='btn btn-default pull-right'
                            onClick={() => this._handleCropperCancel()}
                        >
                            {LANG.cancel}
                        </button>
                        <button
                            className='btn btn-default pull-right primary'
                            onClick={() => this._handleCropping()}
                        >
                            {LANG.next}
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    _getImageTraceDom() {
        const tunedImage = document.getElementById('tunedImage') as HTMLImageElement;
        const x = tunedImage.x;
        const y = tunedImage.y;
        const w = tunedImage.width;
        const h = tunedImage.height;

        const imgStyle = {
            left: `${x}px`,
            top: `${y}px`,
            width: `${w}px`,
            height: `${h}px`
        };

        if (this.state.imageTrace === null) {
            return null;
        }

        return (
            <img
                id = 'imageTrace'
                style = {imgStyle}
                src = {'data:image/svg+xml; utf8, ' + encodeURIComponent(this.state.imageTrace)}
            />
        );

    }

    _cropCameraCanvas() {
        const imageObj = document.getElementById('cameraCanvas') as HTMLCanvasElement;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const canvasBackground = document.getElementById('canvasBackground');
        const coordinates = PreviewModeBackgroundDrawer.getCoordinates();
        const sourceX = coordinates.minX;
        const sourceY = coordinates.minY;
        const sourceWidth = (coordinates.maxX - coordinates.minX)  + 465.17;
        const sourceHeight = (coordinates.maxY - coordinates.minY) + 465.17 ;
        const destX = 0;
        const destY = 0;

        canvas.width = sourceWidth;
        canvas.height = sourceHeight;

        context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, sourceWidth, sourceHeight);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);

            if (this.state.croppedCameraCanvasBlobUrl != '') {
                URL.revokeObjectURL(this.state.croppedCameraCanvasBlobUrl);
            }

            this.setState({ croppedCameraCanvasBlobUrl: url });

            if (this.state.currentStep === STEP_OPEN) {
                this.next();
            }
        });
    }


    _renderImageTraceModal() {
        const {
            threshold,
            currentStep,
            imageTrace,
            cropData
        } = this.state;
        const footer = this._renderImageTraceFooter();
        const it = ((currentStep === STEP_APPLY) && (imageTrace!=='')) ? this._getImageTraceDom() : null;
        let containerStyle: {width?: string, height?: string};

        if (TESTING_IT) {
            containerStyle = {width: `${maxAllowableWidth}px`};
        } else {
            const containerMaxWidth = maxAllowableWidth - 330;
            const containerMaxHeight = maxAllowableHieght - 40;
            containerStyle = (cropData.width / containerMaxWidth > cropData.height / containerMaxHeight) ?
            {width: `${containerMaxWidth}px`} : {height: `${containerMaxHeight}px`};
        }

        return (
            <Modal>
                <div className='image-trace-panel'>
                    <div className='main-content'>
                            <div className='cropped-container' style={containerStyle} >
                                <img id='tunedImage' src={grayscaleCroppedImg} />
                                {it}
                            </div>
                            <div className='right-part'>
                            <div className='scroll-bar-container'>
                                <div className='title'>{LANG.tuning}</div>
                                <SliderControl
                                    id='threshold'
                                    label={LANG.threshold}
                                    min={0}
                                    max={255}
                                    step={1}
                                    default={parseInt(threshold)}
                                    onChange={(id, val) => this._handleParameterChange(id, val)}
                                />
                            </div>
                            </div>
                    </div>
                    {footer}
                </div>
            </Modal>
        );
    }

    _renderImageTraceFooter() {
        if (this.state.currentStep === STEP_TUNE) {
            return (
                <div className='footer'>
                    <button
                        className='btn btn-default pull-right'
                        onClick={() => this._handleImageTraceCancel()}
                    >
                        {LANG.cancel}
                    </button>
                    <button
                        className='btn btn-default pull-right'
                        onClick={() => this._backToCropper()}
                    >
                        {LANG.back}
                    </button>
                    <button
                        className='btn btn-default pull-right primary'
                        onClick={() => this._calculateImageTrace()}
                    >
                        {LANG.apply}
                    </button>
                </div>
            );
        } else {
            return (
                <div className='footer'>
                    <button
                        className='btn btn-default pull-right'
                        onClick={() => this._handleImageTraceCancel()}
                    >
                        {LANG.cancel}
                    </button>
                    <button
                        className='btn btn-default pull-right'
                        onClick={() => this.prev()}
                    >
                        {LANG.back}
                    </button>
                    <button
                        className='btn btn-default pull-right primary'
                        onClick={() => this._pushImageTrace()}
                    >
                        {LANG.okay}
                    </button>
                </div>
            );
        }
    }

    _renderContent() {
        let renderContent = null;
        const canvasBackgroundUrl = PreviewModeBackgroundDrawer.getCameraCanvasUrl() || ''  ;

        switch(this.state.currentStep) {
            case STEP_OPEN:
                renderContent = (
                    <img
                        id= 'cameraCanvas'
                        onLoad={() => this._cropCameraCanvas()}
                        src={canvasBackgroundUrl}
                    />
                );
                break;
            case STEP_CROP:
                renderContent = this._renderCropperModal();
                break;
            case STEP_TUNE:
                renderContent = this. _renderImageTraceModal();
                break;
            case STEP_APPLY:
                renderContent = this. _renderImageTraceModal();
                break;
            default:
                break;
        }

        return renderContent;
    }

    render() {
        const renderContent = this._renderContent();
        const canvasBackgroundUrl = PreviewModeBackgroundDrawer.getCameraCanvasUrl() || ''  ;

        return (
            <div id='image-trace-panel-outer'>
                {renderContent}
            </div>
        );
    }
};

export default ImageTracePanel;
