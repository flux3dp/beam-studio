import Constant from './constant';
import Progress from '../progress-caller';
import ImageData from '../../../helpers/image-data';
import BeamFileHelper from '../../../helpers/beam-file-helper';
import Alert from '../alert-caller';
import * as TutorialController from '../../views/tutorials/Tutorial-Controller';
import TutorialConstants from '../../constants/tutorial-constants';
import SymbolMaker from '../../../helpers/symbol-maker';
import * as i18n from '../../../helpers/i18n';
import { getSVGAsync } from '../../../helpers/svg-editor-helper';

let svgCanvas;
let svgedit;
let svgEditor;
getSVGAsync((globalSVG) => {
    svgCanvas = globalSVG.Canvas;
    svgedit = globalSVG.Edit;
    svgEditor = globalSVG.Editor;
});
const LANG = i18n.lang.beambox;
const electron = window['electron'];

let _setCrosshairCursor = function() {
    $('#workarea').css('cursor', 'crosshair');
    $('#svg_editor g').css('cursor', 'crosshair');
};

let _align = function(types) {
    if (svgCanvas.getTempGroup()) {
        const childeren = svgCanvas.ungroupTempGroup();
        svgCanvas.selectOnly(childeren, false);
    }
    const selectedElements = svgCanvas.getSelectedElems();
    const len = selectedElements.filter(e => e).length;
    const mode = len > 1 ? 'selected' : 'page';
    svgCanvas.alignSelectedElements(types, mode);
    svgCanvas.tempGroupSelectedElements();
};

const funcs = {
    clearSelection: function() {
        svgCanvas.clearSelection();
    },
    isAnyElementSelected: function() {
        if (!svgCanvas) {
            return false;
        }

        const selectedElements = svgCanvas.getSelectedElems();

        return ((selectedElements.length > 0) && (selectedElements[0] !== null));
    },
    cloneSelectedElement: function() {
        svgCanvas.cloneSelectedElements(20, 20);
    },
    undo: function() {
        svgEditor.clickUndo();
    },

    //main panel
    importImage: () => {
        $('#tool_import input').click();
        funcs.useSelectTool();
    },

    insertSvg: function(svgString?:string, callback?:any) {
        svgEditor.importSvg(
            new Blob([svgString], { type: 'text/plain' }),
            { skipVersionWarning: true, isFromAI: true }
        );

        setTimeout(callback, 1500);
    },
    insertImage: function(insertedImageSrc, cropData, preCrop, sizeFactor = 1, threshold = 255, imageTrace = false) {

        // let's insert the new image until we know its dimensions
        const insertNewImage = function (img, cropData, preCrop, sizeFactor, threshold) {
            const { x, y, width, height } = cropData;
            const { offsetX, offsetY } = preCrop;
            const scale = (imageTrace ? 1 : 3.5277777);
            const newImage = svgCanvas.addSvgElementFromJson({
                element: 'image',
                attr: {
                    x: (offsetX + x) * scale,
                    y: (offsetY + y) * scale,
                    width: width * scale * sizeFactor,
                    height: height * scale * sizeFactor,
                    id: svgCanvas.getNextId(),
                    style: 'pointer-events:inherit',
                    preserveAspectRatio: 'none',
                    'data-threshold': parseInt(threshold),
                    'data-shading': true,
                    origImage: img.src
                }
            });

            ImageData(
                newImage.getAttribute('origImage'), {
                    height,
                    width,
                    grayscale: {
                        is_rgba: true,
                        is_shading: true,
                        threshold: parseInt(threshold),
                        is_svg: false
                    },
                    onComplete: function (result) {
                        svgCanvas.setHref(newImage, result.pngBase64);
                    }
                }
            );

            svgCanvas.selectOnly([newImage]);

            window['updateContextPanel']();
            $('#dialog_box').hide();
        };

        // create dummy img so we know the default dimensions
        const img = new Image();
        const layerName = LANG.right_panel.layer_panel.layer_bitmap;

        img.src = insertedImageSrc;
        img.style.opacity = '0';
        img.onload = function () {
            if (!svgCanvas.setCurrentLayer(layerName)) {
                svgCanvas.createLayer(layerName);
            }

            insertNewImage(img, cropData, preCrop, sizeFactor, threshold);
        };
    },

    getCurrentLayerData: function() {
        const drawing = svgCanvas.getCurrentDrawing();
        const currentLayer = drawing.getCurrentLayer();
        const layerData = {
            speed: currentLayer.getAttribute('data-speed'),
            power: currentLayer.getAttribute('data-strength'),
            repeat: currentLayer.getAttribute('data-repeat'),
            height: currentLayer.getAttribute('data-height'),
            zStep: currentLayer.getAttribute('data-zstep'),
            isDiode: currentLayer.getAttribute('data-diode'),
            configName: currentLayer.getAttribute('data-configName'),
        };

        return layerData;
    },

    renameLayer: function(oldName, newName) {
        if (svgCanvas.setCurrentLayer(oldName)) {
            svgCanvas.renameCurrentLayer(newName);
        }
    },

    //top menu
    groupSelected: function() {
        svgCanvas.groupSelectedElements();
    },
    ungroupSelected: function() {
        svgCanvas.ungroupSelectedElement();
    },

    //align toolbox
    alignLeft: function() {
        _align('l');
    },
    alignCenter: function(){
        _align('c');
    },
    alignRight: function() {
        _align('r');
    },
    alignTop: function() {
        _align('t');
    },
    alignMiddle: function() {
        _align('m');
    },
    alignBottom: function() {
        _align('b');
    },
    // distribute toolbox
    distHori: function() {
        svgCanvas.distHori();
    },
    distVert: function() {
        svgCanvas.distVert();
    },
    distEven: function() {
        svgCanvas.distEven();
    },
    flipHorizontal: function() {
        svgCanvas.flipSelectedElements(-1, 1);
    },
    flipVertical: function() {
        svgCanvas.flipSelectedElements(1, -1);
    },
    //left panel
    useSelectTool: function() {
        $('#tool_select').click();
    },
    insertRectangle: function() {
        if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_RECT) {
            TutorialController.handleNextStep();
        }
        $('#tool_rect').mouseup();
        _setCrosshairCursor();
    },
    insertEllipse: function() {
        if (TutorialController.getNextStepRequirement() === TutorialConstants.SELECT_CIRCLE) {
            TutorialController.handleNextStep();
        }
        $('#tool_ellipse').mouseup();
        _setCrosshairCursor();
    },
    insertPath: function() {
        $('#tool_path').mouseup();
        _setCrosshairCursor();
    },
    insertPolygon: function() {
        svgCanvas.setMode('polygon');
        _setCrosshairCursor();
    },
    insertLine: function() {
        $('#tool_line').mouseup();
        _setCrosshairCursor();
    },
    insertText: function() {
        $('#tool_text').click();
        if (svgedit.browser.isTouch()) {
            $('#tool_text').mousedown();
        }
        $('#workarea').css('cursor', 'text');
    },
    gridArraySelected: function() {
        $('#tool_grid').mouseup();
    },

    enterPreviewMode: function() {
        svgCanvas.setMode('preview');
    },

    // others
    getLatestImportFileName: function() {
        return svgCanvas.getLatestImportFileName();
    },
};

export default funcs;
