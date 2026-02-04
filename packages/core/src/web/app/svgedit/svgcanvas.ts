/* eslint-disable no-case-declarations */
/* eslint-disable unicorn/no-new-array */
/* eslint-disable ts/no-unused-vars */
/* jslint vars: true, eqeq: true, todo: true, bitwise: true, continue: true, forin: true  */
/*
 * svgcanvas.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 * Copyright(c) 2010 Pavol Rusnak
 * Copyright(c) 2010 Jeff Schiller
 *
 */

// Dependencies:
// 1) jQuery
// 2) pathseg.js
// 3) browser.js
// 4) svgtransformlist.js
// 5) math.js
// 6) units.js
// 7) svgutils.js
// 8) sanitize.js
// 9) history.js
// 10) select.js
// 11) draw.js
// 12) path.js
// 13) coords.js
// 14) recalculate.js
// svgedit libs

import Alert from '@core/app/actions/alert-caller';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import grid from '@core/app/actions/canvas/grid';
import { guideLineDrawer } from '@core/app/actions/canvas/guideLines';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import rotaryAxis from '@core/app/actions/canvas/rotary-axis';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import * as TutorialController from '@core/app/components/tutorials/tutorialController';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { CanvasElements } from '@core/app/constants/canvasElements';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getMouseMode, setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import updateElementColor from '@core/helpers/color/updateElementColor';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import jimpHelper from '@core/helpers/jimp-helper';
import { initLayerConfig } from '@core/helpers/layer/layer-config-helper';
import * as LayerHelper from '@core/helpers/layer/layer-helper';
import round from '@core/helpers/math/round';
import viewMenu from '@core/helpers/menubar/view';
import randomColor from '@core/helpers/randomColor';
import sanitizeXmlString from '@core/helpers/sanitize-xml-string';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { Units } from '@core/helpers/units';
import units from '@core/helpers/units';
import imageProcessor from '@core/implementations/imageProcessor';
import recentMenuUpdater from '@core/implementations/recentMenuUpdater';
import storage from '@core/implementations/storage';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { IPoint, IRect } from '@core/interfaces/ISVGCanvas';
import type ISVGConfig from '@core/interfaces/ISVGConfig';

import canvasBackground from './canvasBackground';
import currentFileManager from './currentFileManager';
import { ungroupElement } from './group/ungroup';
import type { BaseHistoryCommand } from './history/history';
import history from './history/history';
import historyRecording from './history/historyrecording';
import undoManager from './history/undoManager';
import { MouseInteraction } from './interaction/mouse';
import layerManager from './layer/layerManager';
import disassembleUse from './operations/disassembleUse';
import setSvgContent from './operations/import/setSvgContent';
import { moveElements, moveSelectedElements } from './operations/move';
import PathActions from './operations/pathActions';
import selector from './selector';
import textActions from './text/textactions';
import textEdit from './text/textedit';
import { setRotationAngle } from './transform/rotation';
import { binarySearchLowerBoundIndex } from './utils/binarySearchIndex';
import findDefs from './utils/findDef';
import { findNearestAndFarthestAlignPoints } from './utils/findNearestAndFarthestAlignPoints';
import { isLineCoincide } from './utils/isLineCoincide';
import { rotateBBox } from './utils/rotateBBox';
import workareaManager from './workarea';

let svgCanvas: ISVGCanvas;
let svgEditor: any;

const { $, svgedit } = window;

getSVGAsync(({ Canvas, Editor }) => {
  svgCanvas = Canvas;
  svgEditor = Editor;
});

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');

// Class: SvgCanvas
// The main SvgCanvas class that manages all SVG-related functions
//
// Parameters:
// container - The container HTML element that should hold the SVG root element
// config - An object that contains configuration data
export default $.SvgCanvas = function (container: SVGElement, config: ISVGConfig) {
  // Alias Namespace constants
  const NS = svgedit.NS;

  // Default configuration options
  const curConfig: { [key: string]: any } = { dimensions: [640, 480], ...config };
  var canvas = this;
  const pathActions = PathActions(this);

  // "document" element associated with the container (same as window.document using default svg-editor.js)
  // NOTE: This is not actually a SVG document, but a HTML document.
  var svgdoc = container.ownerDocument;

  this.svgdoc = svgdoc;

  // This is a container for the document being edited, not the document itself.
  var svgroot = svgdoc.importNode(
    svgedit.utilities.text2xml(
      '<svg id="svgroot" xmlns="' +
        NS.SVG +
        '" xlinkns="' +
        NS.XLINK +
        '" ' +
        'width="' +
        curConfig.dimensions[0] +
        '" height="' +
        curConfig.dimensions[1] +
        '" overflow="visible">' +
        '<defs>' +
        '<filter id="canvashadow" filterUnits="objectBoundingBox">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>' +
        '<feOffset in="blur" dx="5" dy="5" result="offsetBlur"/>' +
        '<feMerge>' +
        '<feMergeNode in="offsetBlur"/>' +
        '<feMergeNode in="SourceGraphic"/>' +
        '</feMerge>' +
        '</filter>' +
        '</defs>' +
        '</svg>',
    ).documentElement,
    true,
  );

  container.appendChild(svgroot);

  // The actual element that represents the final output SVG element
  var svgcontent = svgdoc.createElementNS(NS.SVG, 'svg');

  // CUSTOM VARIABLES
  const alignPoints: Record<'x' | 'y', Array<Record<'x' | 'y', number>>> = { x: [], y: [] };
  let alignEdges: Array<Record<'x1' | 'x2' | 'y1' | 'y2', number>> = [];
  const WORKAREA_ALIGN_POINTS = Array.of<IPoint>();
  const updateWorkAreaAlignPoints = () => {
    const {
      boundary: { maxX, maxY, minX, minY },
    } = workareaManager;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const points = [
      // Top row
      { x: minX, y: minY },
      { x: midX, y: minY },
      { x: maxX, y: minY },
      // Middle side
      { x: minX, y: midY },
      { x: maxX, y: midY },
      // Bottom row
      { x: minX, y: maxY },
      { x: midX, y: maxY },
      { x: maxX, y: maxY },
    ];

    WORKAREA_ALIGN_POINTS.length = 0;
    WORKAREA_ALIGN_POINTS.push(...points);
  };

  canvasEventEmitter.on('boundary-updated', () => {
    updateWorkAreaAlignPoints();
    this.collectAlignPoints();
  });

  // This function resets the svgcontent element while keeping it in the DOM.
  var clearSvgContentElement = (canvas.clearSvgContentElement = function () {
    while (svgcontent.firstChild) {
      svgcontent.removeChild(svgcontent.firstChild);
    }
    // TODO: Clear out all other attributes first?
    $(svgcontent)
      .attr({
        height: workareaManager.height ?? curConfig.dimensions[1],
        id: 'svgcontent',
        overflow: 'visible',
        style: 'will-change: scroll-position, contents, transform;',
        width: workareaManager.width ?? curConfig.dimensions[0],
        x: workareaManager.width ?? curConfig.dimensions[0],
        xmlns: NS.SVG,
        'xmlns:se': NS.SE,
        'xmlns:xlink': NS.XLINK,
        y: workareaManager.height ?? curConfig.dimensions[1],
      })
      .appendTo(svgroot);

    viewMenu.initAntiAliasing();
  });

  clearSvgContentElement();

  // Prefix string for element IDs
  var idprefix = 'svg_';

  // Function: setIdPrefix
  // Changes the ID prefix to the given value
  //
  // Parameters:
  // p - String with the new prefix
  canvas.setIdPrefix = function (p: string) {
    idprefix = p;
  };

  // Current svgedit.draw.Drawing object
  // @type {svgedit.draw.Drawing}
  const resetCurrentDrawing = (canvas.resetCurrentDrawing = (content = svgcontent): void => {
    canvas.currentDrawing = new svgedit.draw.Drawing(content, idprefix);
  });

  layerManager.reset(svgcontent as unknown as SVGSVGElement);
  resetCurrentDrawing();

  // Function: getCurrentDrawing
  // Returns the current Drawing.
  // @return {svgedit.draw.Drawing}
  var getCurrentDrawing = (canvas.getCurrentDrawing = function () {
    return canvas.currentDrawing;
  });

  // pointer to current group (for in-group editing)
  var current_group = null;

  // Object containing data for the currently selected styles
  var all_properties: { [key: string]: any } = {
    shape: {
      fill: (curConfig.initFill.color === 'none' ? '' : '#') + curConfig.initFill.color,
      fill_opacity: curConfig.initFill.opacity,
      fill_paint: null,
      opacity: curConfig.initOpacity,
      stroke: '#' + curConfig.initStroke.color,
      stroke_dasharray: 'none',
      stroke_linecap: 'butt',
      stroke_linejoin: 'miter',
      stroke_opacity: curConfig.initStroke.opacity,
      stroke_paint: null,
      stroke_width: curConfig.initStroke.width,
    },
  };

  // Current shape style properties
  var cur_shape = all_properties.shape;

  // Array with all the currently selected elements
  // default size of 1 until it needs to grow bigger
  let selectedElements = Array.of<SVGElement>();
  let selectedLayers = Array.of<string>();
  let tempGroup: Element | null = null;

  // Function: addSvgElementFromJson
  // Create a new SVG element based on the given object keys/values and add it to the current layer
  // The element will be ran through cleanupElement before being returned
  //
  // Parameters:
  // data - Object with the following keys/values:
  // * element - tag name of the SVG element to create
  // * attr - Object with attributes key-values to assign to the new element
  // * curStyles - Boolean indicating that current style attributes should be applied first
  // * children - Optional array with data objects to be added recursively as children
  //
  // Returns: The new element
  var addSvgElementFromJson = (this.addSvgElementFromJson = function (data) {
    if (typeof data === 'string') {
      return svgdoc.createTextNode(data);
    }

    var shape = svgedit.utilities.getElem(data.attr.id);
    // if shape is a path but we need to create a rect/ellipse, then remove the path
    const currentLayer = layerManager.getCurrentLayerElement()!;

    if (shape && data.element !== shape.tagName) {
      currentLayer.removeChild(shape);
      shape = null;
    }

    if (!shape) {
      shape = svgdoc.createElementNS(NS.SVG, data.element);

      if (currentLayer) {
        (current_group || currentLayer).appendChild(shape);
      }
    }

    if (data.curStyles) {
      svgedit.utilities.assignAttributes(
        shape,
        {
          fill: cur_shape.fill,
          'fill-opacity': cur_shape.fill_opacity,
          opacity: cur_shape.opacity / 2,
          stroke: cur_shape.stroke,
          'stroke-dasharray': cur_shape.stroke_dasharray,
          'stroke-linecap': cur_shape.stroke_linecap,
          'stroke-linejoin': cur_shape.stroke_linejoin,
          'stroke-opacity': cur_shape.stroke_opacity,
          'stroke-width': cur_shape.stroke_width,
          style: 'pointer-events:inherit',
        },
        100,
      );
    }

    svgedit.utilities.assignAttributes(shape, data.attr, 100);
    svgedit.utilities.cleanupElement(shape);

    // Children
    if (data.children) {
      data.children.forEach(function (child) {
        shape.appendChild(addSvgElementFromJson(child));
      });
    }

    $(shape).mouseover(canvas.handleGenerateSensorArea).mouseleave(canvas.handleGenerateSensorArea);

    if (shape.tagName === 'image') {
      useLayerStore.getState().checkGradient();
    } else {
      useLayerStore.getState().checkVector();
    }

    return shape;
  });

  // import svgtransformlist.js
  var getTransformList = (canvas.getTransformList = svgedit.transformlist.getTransformList);

  // import from math.js.
  var transformPoint = svgedit.math.transformPoint;
  var matrixMultiply = (canvas.matrixMultiply = svgedit.math.matrixMultiply);

  canvas.hasMatrixTransform = svgedit.math.hasMatrixTransform;

  var transformListToTransform = (canvas.transformListToTransform = svgedit.math.transformListToTransform);
  const SENSOR_AREA_RADIUS = 10;

  // initialize from units.js
  // send in an object implementing the ElementContainer interface (see units.js)
  svgedit.units.init({
    getBaseUnit: function () {
      return curConfig.baseUnit;
    },
    getElement: svgedit.utilities.getElem,
    getHeight: () => workareaManager.height,
    getRoundDigits: function () {
      return save_options.round_digits;
    },
    getWidth: () => workareaManager.width,
  });
  // import from units.js
  canvas.convertToNum = svgedit.units.convertToNum;

  // import from svgutils.js
  svgedit.utilities.init({
    getBaseUnit: function () {
      return curConfig.baseUnit;
    },
    getDOMContainer: function () {
      return container;
    },
    getDOMDocument: function () {
      return svgdoc;
    },
    // TODO: replace this mostly with a way to get the current drawing.
    getSelectedElements: function () {
      return selectedElements;
    },
    getSnappingStep: function () {
      return curConfig.snappingStep;
    },
    getSVGContent: function () {
      return svgcontent;
    },
    getSVGRoot: function () {
      return svgroot;
    },
  });
  canvas.findDefs = findDefs;
  canvas.getUrlFromAttr = svgedit.utilities.getUrlFromAttr;

  var getHref = (canvas.getHref = svgedit.utilities.getHref);
  var setHref = (canvas.setHref = svgedit.utilities.setHref);
  var getPathBBox = svgedit.utilities.getPathBBox;

  canvas.getBBox = svgedit.utilities.getBBox;
  canvas.getRotationAngle = svgedit.utilities.getRotationAngle;

  var getElem = (canvas.getElem = svgedit.utilities.getElem);

  canvas.getRefElem = svgedit.utilities.getRefElem;
  canvas.assignAttributes = svgedit.utilities.assignAttributes;

  var cleanupElement = (this.cleanupElement = svgedit.utilities.cleanupElement);

  // Map of deleted reference elements
  const removedElements = {};

  // import from coords.js
  svgedit.coords.init({
    getDrawing: function () {
      return getCurrentDrawing();
    },
    getGridSnapping: function () {
      return curConfig.gridSnapping;
    },
  });
  this.remapElement = svgedit.coords.remapElement;

  let startTransform = null;

  // import from recalculate.js
  svgedit.recalculate.init({
    getStartTransform: function () {
      return startTransform;
    },
    getSVGRoot: function () {
      return svgroot;
    },
    setStartTransform: function (transform) {
      startTransform = transform;
    },
  });
  this.recalculateDimensions = svgedit.recalculate.recalculateDimensions;

  // import from sanitize.js
  var nsMap = svgedit.getReverseNS();

  canvas.sanitizeSvg = svgedit.sanitize.sanitizeSvg;

  // import from history.js
  var MoveElementCommand = history.MoveElementCommand;
  var InsertElementCommand = history.InsertElementCommand;
  var RemoveElementCommand = history.RemoveElementCommand;
  var ChangeElementCommand = history.ChangeElementCommand;
  var BatchCommand = history.BatchCommand;
  var call: any;

  const cmdElements = new Set<Element>();
  let cmdDepth = 0;
  const onBefore = () => {
    if (cmdDepth === 0) {
      cmdElements.clear();
    }

    cmdDepth += 1;
  };

  const onAfter = () => {
    cmdDepth -= 1;

    if (cmdDepth === 0) {
      const elems = Array.from(cmdElements);

      call('changed', elems);
      cmdElements.clear();
    }
  };

  undoManager.setHandler({
    handleHistoryEvent: (eventType, cmd) => {
      const EventTypes = history.HistoryEventTypes;

      if (eventType === EventTypes.BEFORE_UNAPPLY || eventType === EventTypes.BEFORE_APPLY) {
        onBefore();
        canvas.clearSelection();
      } else if (eventType === EventTypes.AFTER_APPLY || eventType === EventTypes.AFTER_UNAPPLY) {
        try {
          var elems = cmd.elements();

          canvas.pathActions.handleHistoryEvent(eventType, cmd);
          elems.forEach((elem) => cmdElements.add(elem));

          var cmdType = cmd.type();
          var isApply = eventType === EventTypes.AFTER_APPLY;

          if (cmdType === MoveElementCommand.type()) {
            var parent = isApply ? cmd.newParent : cmd.oldParent;

            if (parent === svgcontent) {
              layerManager.identifyLayers();
            }

            let shouldUpdateLayerStore = false;

            elems.forEach((elem) => {
              if (elem.classList.contains('layer')) {
                shouldUpdateLayerStore = true;
              } else {
                updateElementColor(elem);
              }
            });

            if (shouldUpdateLayerStore) {
              useLayerStore.getState().forceUpdate();
            }
          } else if (cmdType === InsertElementCommand.type() || cmdType === RemoveElementCommand.type()) {
            if (cmdType === InsertElementCommand.type()) {
              if (isApply) {
                restoreRefElems(cmd.elem);

                if (cmd.elem.id === 'svgcontent') {
                  svgcontent = cmd.elem;
                }
              }
            } else if (!isApply) {
              restoreRefElems(cmd.elem);

              if (cmd.elem.id === 'svgcontent') {
                svgcontent = cmd.elem;
              }
            }
          } else if (cmdType === ChangeElementCommand.type()) {
            // if we are changing layer names, re-identify all layers
            if (cmd.elem.tagName === 'title' && cmd.elem.parentNode?.parentNode === svgcontent) {
              layerManager.identifyLayers();
            }

            var values = isApply ? cmd.newValues : cmd.oldValues;
            const changedValues = Object.keys(values);

            // If stdDeviation was changed, update the blur.
            if (values.stdDeviation) {
              canvas.setBlurOffsets(cmd.elem.parentNode, values.stdDeviation);
            }

            if (changedValues.includes('transform')) {
              svgedit.transformlist.removeElementFromListMap(cmd.elem);
            }
            // This is resolved in later versions of webkit, perhaps we should
            // have a featured detection for correct 'use' behavior?
            // ——————————
            // Remove & Re-add hack for Webkit (issue 775)
            // if (cmd.elem.tagName === 'use' && svgedit.browser.isWebkit()) {
            //	var elem = cmd.elem;
            //	if (!elem.getAttribute('x') && !elem.getAttribute('y')) {
            //		var parent = elem.parentNode;
            //		var sib = elem.nextSibling;
            //		parent.removeChild(elem);
            //		parent.insertBefore(elem, sib);
            //	}
            // }
          } else if (cmdType === BatchCommand.type()) {
            // Actions may create or remove layers
            if (
              [
                'Clone Layer(s)',
                'Create Layer',
                'Delete Layer(s)',
                'Import DXF',
                'Import SVG',
                'Merge Layer',
                'Merge Layer(s)',
                'Split Full Color Layer',
              ].includes(cmd.text)
            ) {
              layerManager.identifyLayers();
              useLayerStore.getState().setSelectedLayers([]);
              presprayArea.togglePresprayArea();
            }

            const textElems = elems.filter((elem) => elem.tagName === 'text');

            for (let i = 0; i < textElems.length; i++) {
              const textElem = textElems[i];
              const angle = svgedit.utilities.getRotationAngle(textElem);

              if (angle !== 0) canvas.setRotationAngle(0, true, textElem);

              textEdit.renderText(textElem as SVGTextElement);

              if (angle !== 0) canvas.setRotationAngle(angle, true, textElem);
            }
          }
        } finally {
          onAfter();
        }
      }
    },
    renderText: textEdit.renderText,
  });
  canvas.undoMgr = undoManager;

  const addCommandToHistory = function (cmd) {
    canvas.undoMgr.addCommandToHistory(cmd);
  };

  this.addCommandToHistory = addCommandToHistory;

  function historyRecordingService(hrService?) {
    return hrService || new historyRecording.HistoryRecordingService(canvas.undoMgr);
  }

  canvasBackground.setupBackground(
    curConfig.dimensions,
    () => svgroot,
    () => svgcontent,
  );

  workareaManager.init(useDocumentStore.getState()['workarea']);
  grid.init(workareaManager.zoomRatio);
  guideLineDrawer.init();
  updateWorkAreaAlignPoints();
  presprayArea.generatePresprayArea();
  rotaryAxis.init();

  // import from select.js
  selector.init({
    createSVGElement: function (jsonMap) {
      return canvas.addSvgElementFromJson(jsonMap);
    },
    currentZoom: () => workareaManager.zoomRatio,
    // TODO(codedread): Remove when getStrokedBBox() has been put into svgutils.js.
    getStrokedBBox: function (elems) {
      return canvas.getStrokedBBox([elems]);
    },
    svgContent: () => svgcontent,
    svgRoot: () => svgroot,
  });

  // this object manages selectors for us
  var selectorManager = (this.selectorManager = selector.getSelectorManager());

  // Import from path.js
  svgedit.path.init({
    getCurrentZoom: () => workareaManager.zoomRatio,
    getSVGRoot: () => svgroot,
  });

  const refAttrs = ['clip-path', 'fill', 'filter', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'stroke'];

  var elData = $.data;

  // Animation element to change the opacity of any newly created element
  this.opacityAnimation = document.createElementNS(NS.SVG, 'animate') as unknown as SVGAnimateElement;
  $(this.opacityAnimation)
    .attr({
      attributeName: 'opacity',
      begin: 'indefinite',
      dur: 1,
      fill: 'freeze',
    })
    .appendTo(svgroot);

  var restoreRefElems = (canvas.restoreRefElems = function (elem) {
    // Look for missing reference elements, restore any found
    if (!elem || elem.tagName === 'STYLE' || elem.classList.contains('layer')) {
      return;
    }

    for (let i = 0; i < refAttrs.length; i += 1) {
      const attrName = refAttrs[i];

      if (attrName === 'filter' && ['image', 'use'].includes(elem.tagName)) {
        continue;
      }

      const attrVal = elem.getAttribute(attrName);

      if (attrVal && attrVal.indexOf('url(') === 0) {
        const id = svgedit.utilities.getUrlFromAttr(attrVal).substr(1);
        const ref = getElem(id);

        if (!ref && removedElements[id]) {
          findDefs()?.appendChild(removedElements[id]);
          delete removedElements[id];
        }
      }
    }

    const childs = elem.getElementsByTagName('*');

    if (childs.length) {
      for (let i = 0; i < childs.length; i++) {
        restoreRefElems(childs[i]);
      }
    }
  });

  // Object to contain image data for raster images that were found encodable
  const encodableImages = {};

  // Array with current disabled elements (for in-group editing)
  let disabled_elems = [];

  // Object with save options
  const save_options: { [key: string]: any } = {
    round_digits: 5,
  };

  let started = false;

  // String with an element's initial transform attribute value

  // String indicating the current editor mode

  // String with the current direction in which an element is being resized
  let current_resize_mode = 'none';

  // Object with IDs for imported files, to see if one was already added
  const import_ids = {};

  // Current general properties
  let cur_properties = cur_shape;

  // Array with selected elements' Bounding box object
  //	selectedBBoxes = new Array(1),

  // The DOM element that was just selected

  // DOM element for selection rectangle drawn by the user
  let rubberBox: SVGRectElement = null;

  let curBBoxes = [];

  // Object to contain all included extensions
  const extensions = {};

  // Canvas point for the most recent right click
  let lastClickPoint = null;

  this.isAutoAlign = useGlobalPreferenceStore.getState().auto_align;

  let root_sctm = null;

  this.clearBoundingBox = () => {
    curBBoxes = [];
  };
  this.getContainer = () => container;
  this.getContentElem = () => svgcontent;
  this.setContentElem = (content) => {
    svgcontent = content;
  };
  this.getCurrentConfig = () => curConfig;
  this.getCurrentGroup = () => current_group;
  this.getCurrentResizeMode = () => current_resize_mode;
  this.getCurrentShape = () => cur_shape;
  this.getCurrentZoom = () => workareaManager.zoomRatio;
  this.getLastClickPoint = () => lastClickPoint;
  // TODO: keep for ext-polygon.js, can remove after refactoring it
  this.getMode = function () {
    return getMouseMode();
  };
  this.getRoot = () => svgroot;
  this.getRootElem = () => svgroot;
  this.getRootScreenMatrix = () => root_sctm;
  this.getRubberBox = () => rubberBox;
  this.getSelectedElems = (ungroupTempGroup = false) => {
    if (ungroupTempGroup && tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    return selectedElements;
  };
  this.getStarted = () => started;
  this.getStartTransform = () => startTransform;
  this.getTempGroup = () => tempGroup;
  this.setRootScreenMatrix = (matrix: SVGMatrix) => {
    root_sctm = matrix;
  };
  this.setCurrentResizeMode = (mode: string) => {
    current_resize_mode = mode;
  };
  this.setCurrentStyleProperties = (key: string, value: number | string) => {
    cur_properties[key] = value;
  };
  this.setLastClickPoint = (point) => {
    lastClickPoint = point;
  };

  this.unsafeAccess = {
    setRubberBox: (v) => {
      rubberBox = v;
    },
    setSelectedElements: (elems: SVGElement[]) => {
      selectedElements = elems;
    },
    setStarted: (v: boolean) => {
      started = v;
    },
    setStartTransform: (transform) => {
      startTransform = transform;
    },
  };

  // Should this return an array by default, so extension results aren't overwritten?
  var runExtensions = (this.runExtensions = function (action, vars, returnArray = false) {
    let result = returnArray ? [] : false;

    $.each(extensions, function (name: string, opts: any) {
      if (opts && action in opts) {
        if (returnArray) {
          (result as any[]).push(opts[action](vars));
        } else {
          result = opts[action](vars);
        }
      }
    });

    return result;
  });

  this.importIds = function () {
    return import_ids;
  };

  // This method rounds the incoming value to the nearest value based on the zoom value
  this.round = function (val) {
    return Math.round(val * workareaManager.zoomRatio) / workareaManager.zoomRatio;
  };

  // This method sends back an array or a NodeList full of elements that
  // intersect the multi-select rubber-band-box on the current_layer only.
  //
  // We brute-force getIntersectionList for browsers that do not support it (Firefox).
  //
  // Reference:
  // Firefox does not implement getIntersectionList(), see https://bugzilla.mozilla.org/show_bug.cgi?id=501421
  var getIntersectionList = (this.getIntersectionList = function (rect?) {
    if (rubberBox == null) {
      return null;
    }

    var rubberBBox;

    if (!rect) {
      rubberBBox = rubberBox.getBBox();

      var o;
      var bb = svgcontent.createSVGRect();

      for (o in rubberBBox) {
        bb[o] = rubberBBox[o] / workareaManager.zoomRatio;
      }
      rubberBBox = bb;
    } else {
      rubberBBox = svgcontent.createSVGRect();
      rubberBBox.x = rect.x;
      rubberBBox.y = rect.y;
      rubberBBox.width = rect.width;
      rubberBBox.height = rect.height;
    }

    var resultList = null;

    if (resultList == null) {
      resultList = [];

      if (!curBBoxes.length) {
        // Cache all bboxes
        curBBoxes = getVisibleElementsAndBBoxes();
      }

      var i = curBBoxes.length;

      while (i--) {
        if (!rubberBBox.width) {
          continue;
        }

        if (svgedit.math.rectsIntersect(rubberBBox, curBBoxes[i].bbox)) {
          resultList.push(curBBoxes[i].elem);
        }
      }
    }

    // addToSelection expects an array, but it's ok to pass a NodeList
    // because using square-bracket notation is allowed:
    // http://www.w3.org/TR/DOM-Level-2-Core/ecma-script-binding.html
    return resultList;
  });

  // TODO(codedread): Migrate this into svgutils.js
  // Function: getStrokedBBox
  // Get the bounding box for one or more stroked and/or transformed elements
  //
  // Parameters:
  // elems - Array with DOM elements to check
  //
  // Returns:
  // A single bounding box object
  var getStrokedBBox = (this.getStrokedBBox = function (elems?: Element | Element[]) {
    if (!elems) {
      elems = getVisibleElements();
    }

    return svgedit.utilities.getStrokedBBox(elems, addSvgElementFromJson, pathActions);
  });

  // Function: getVisibleElements
  // Get all elements that have a BBox (excludes <defs>, <title>, etc).
  // Note that 0-opacity, off-screen etc elements are still considered "visible"
  // for this function
  //
  // Parameters:
  // parent - The parent DOM element to search within
  //
  // Returns:
  // An array with all "visible" elements.
  var getVisibleElements = (this.getVisibleElements = function (parent?) {
    if (!parent) {
      parent = $(svgcontent).children(); // Prevent layers from being included
    }

    var contentElems = [];

    $(parent)
      .children()
      .each(function (i, elem) {
        if (elem.getBBox) {
          contentElems.push(elem);
        }
      });

    return contentElems.reverse();
  });

  // Function: getVisibleElementsAndBBoxes
  // Get all elements that have a BBox (excludes <defs>, <title>, etc).
  // Note that 0-opacity, off-screen etc elements are still considered "visible"
  // for this function
  //
  // Parameters:
  // parent - The parent DOM element to search within
  //
  // Returns:
  // An array with objects that include:
  // * elem - The element
  // * bbox - The element's BBox as retrieved from getStrokedBBox
  var getVisibleElementsAndBBoxes = (this.getVisibleElementsAndBBoxes = function (parent?) {
    if (!parent) {
      parent = $(svgcontent).children(); // Prevent layers from being included
    }

    const contentElems = [];

    for (let i = 0; i < parent.length; i++) {
      const childNodes = parent[i].childNodes;

      if (childNodes) {
        for (let j = 0; j < childNodes.length; j++) {
          const elem = childNodes[j];

          if (
            [
              'clipPath',
              'defs',
              'feGaussianBlur',
              'linearGradient',
              'marker',
              'mask',
              'pattern',
              'radialGradient',
              'stop',
              'switch',
              'symbol',
            ].includes(elem.tagName)
          ) {
            continue;
          }

          if (elem.getBBox) {
            let bbox;

            if (elem.tagName === 'use') {
              bbox = canvas.getSvgRealLocation(elem);
            } else {
              bbox = canvas.calculateTransformedBBox(elem);
            }

            const angle = svgedit.utilities.getRotationAngle(elem);

            bbox = rotateBBox(bbox, angle);
            contentElems.push({
              bbox,
              elem,
            });
          }
        }
      }
    }

    return contentElems.reverse();
  });

  // Function: groupSvgElem
  // Wrap an SVG element into a group element, mark the group as 'gsvg'
  //
  // Parameters:
  // elem - SVG element to wrap
  var groupSvgElem = (this.groupSvgElem = function (elem: any) {
    var g = document.createElementNS(NS.SVG, 'g');

    elem.parentNode.replaceChild(g, elem);
    $(g).append(elem).data('gsvg', elem)[0].id = getNextId();
  });

  // Set scope for these functions
  var getId: any;
  var getNextId: any;

  (function (c) {
    // Object to contain editor event names and callback functions
    var events = {};

    getId = c.getId = function () {
      return getCurrentDrawing().getId();
    };
    getNextId = c.getNextId = function () {
      return getCurrentDrawing().getNextId();
    };

    // Function: call
    // Run the callback function associated with the given event
    //
    // Parameters:
    // event - String with the event name
    // arg - Argument to pass through to the callback function
    call = c.call = function (event, arg) {
      if (events[event]) {
        return events[event](this, arg);
      }
    };

    // Function: bind
    // Attaches a callback function to an event
    //
    // Parameters:
    // event - String indicating the name of the event
    // f - The callback function to bind to the event
    //
    // Return:
    // The previous event
    c.bind = function (event, f) {
      var old = events[event];

      events[event] = f;

      return old;
    };
  })(canvas);

  // Function: canvas.prepareSvg
  // Runs the SVG Document through the sanitizer and then updates its paths.
  //
  // Parameters:
  // newDoc - The SVG DOM document
  this.prepareSvg = function (newDoc) {
    this.sanitizeSvg(newDoc.documentElement);

    // convert paths into absolute commands
    const paths = newDoc.getElementsByTagNameNS(NS.SVG, 'path');

    for (let i = 0; i < paths.length; ++i) {
      const path = paths[i];

      path.setAttribute('d', pathActions.convertPath(path));
      pathActions.fixEnd(path);
      svgedit.recalculate.recalculateDimensions(path);
    }
  };

  // Function: ffClone
  // Hack for Firefox bugs where text element features aren't updated or get
  // messed up. See issue 136 and issue 137.
  // This function clones the element and re-selects it
  // TODO: Test for this bug on load and add it to "support" object instead of
  // browser sniffing
  //
  // Parameters:
  // elem - The (text) DOM element to clone
  var ffClone = function (elem) {
    if (!svgedit.browser.isGecko()) {
      return elem;
    }

    var clone = elem.cloneNode(true);

    elem.parentNode.insertBefore(clone, elem);
    elem.parentNode.removeChild(elem);
    selectorManager.releaseSelector(elem);
    selectedElements[0] = clone;
    selectorManager.requestSelector(clone).show(true);

    return clone;
  };

  // this.each is deprecated, if any extension used this it can be recreated by doing this:
  // $(canvas.getRootElem()).children().each(...)

  // this.each = function(cb) {
  //	$(svgroot).children().each(cb);
  // };

  // Function: setRotationAngle
  // Removes any old rotations if present, prepends a new rotation at the
  // transformed center
  //
  // Parameters:
  // val - The new rotation angle in degrees
  // preventUndo - Boolean indicating whether the action should be undoable or not
  this.setRotationAngle = function (val, preventUndo, elem) {
    // ensure val is the proper type
    val = Number.parseFloat(val);
    elem = elem || selectedElements[0];

    setRotationAngle(elem, val, { addToHistory: !preventUndo });

    if (!preventUndo) {
      call('changed', [elem]);
    }

    const elemSelector = selectorManager.requestSelector(selectedElements[0]);

    if (elemSelector) {
      elemSelector.resize();
      elemSelector.updateGripCursors();
    }
  };

  // Function: recalculateAllSelectedDimensions
  // Runs recalculateDimensions on the selected elements,
  // adding the changes to a single batch command
  var recalculateAllSelectedDimensions = (this.recalculateAllSelectedDimensions = function (isSubCommand = false) {
    var text = current_resize_mode === 'none' ? 'position' : 'size';
    var batchCmd = new history.BatchCommand(text);

    var i = selectedElements.length;

    while (i--) {
      var elem = selectedElements[i];
      //			if (svgedit.utilities.getRotationAngle(elem) && !svgedit.math.hasMatrixTransform(getTransformList(elem))) {continue;}
      const cmd = svgedit.recalculate.recalculateDimensions(elem);

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
    }

    if (!batchCmd.isEmpty()) {
      if (!isSubCommand) {
        addCommandToHistory(batchCmd);
      }

      call('changed', selectedElements);
    }

    return batchCmd;
  });

  // Debug tool to easily see the current matrix in the browser's console
  const logMatrix = function (m: SVGMatrix) {
    console.log([m.a, m.b, m.c, m.d, m.e, m.f]);
  };

  // Group: Selection

  // Function: clearSelection
  // Clears the selection. The 'selected' handler is then called.
  // Parameters:
  // noCall - Optional boolean that when true does not call the "selected" handler
  const clearSelection = (this.clearSelection = (noCall = false) => {
    if (selectedElements[0]) {
      if (tempGroup) svgCanvas.ungroupTempGroup();

      for (const element of selectedElements) {
        if (!element) break;

        selectorManager.releaseSelector(element);
      }

      selectedElements.length = 0;

      this.collectAlignPoints();

      if (!noCall) call('selected', selectedElements);
    }
  });

  // TODO: do we need to worry about selectedBBoxes here?

  // Function: addToSelection
  // Adds a list of elements to the selection. The 'selected' handler is then called.
  //
  // Parameters:
  // elemsToAdd - an array of DOM elements to add to the selection
  // showGrips - a boolean flag indicating whether the resize grips should be shown
  const addToSelection = (this.addToSelection = (elemsToAdd, showGrips?, noCall?) => {
    elemsToAdd = elemsToAdd.filter(Boolean);

    if (elemsToAdd.length === 0) return;

    // now add each element consecutively
    for (let i = elemsToAdd.length - 1; i >= 0; i -= 1) {
      let elem = elemsToAdd[i];

      if (!elem) {
        continue;
      }

      var bbox = svgedit.utilities.getBBox(elem);

      if (!bbox) {
        continue;
      }

      if (elem.tagName === 'a' && elem.childNodes.length === 1) {
        // Make "a" element's child be the selected element
        elem = elem.firstChild;
      }

      // if it's not already there, add it
      if (!selectedElements.includes(elem)) {
        selectedElements.push(elem);
      }
    }

    if (!noCall) {
      call('selected', selectedElements);
    }

    if (showGrips || selectedElements.length === 1) {
      selectorManager.requestSelector(selectedElements[0]).show(true);
    } else {
      selectorManager.requestSelector(selectedElements[0]).show(true, false);
    }

    // make sure the elements are in the correct order
    // See: http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-compareDocumentPosition

    selectedElements.sort(function (a, b) {
      if (a && b && a.compareDocumentPosition) {
        return (b.compareDocumentPosition(a) & 6) - 3;
      }

      if (a == null) {
        return 1;
      }
    });

    // Make sure first elements are not null
    selectedElements = selectedElements.filter(Boolean);

    this.collectAlignPoints();
  });

  // Function: selectOnly()
  // Selects only the given elements, shortcut for clearSelection(); addToSelection()
  //
  // Parameters:
  // elems - an array of DOM elements to be selected
  const selectOnly = (this.selectOnly = function (elems, showGrips?) {
    clearSelection(true);
    addToSelection(elems, showGrips);
  });

  this.multiSelect = (elems) => {
    clearSelection(true);
    addToSelection(elems, true);

    if (elems.length > 1) {
      this.tempGroupSelectedElements();
    }
  };

  // TODO: could use slice here to make this faster?
  // TODO: should the 'selected' handler

  // Function: removeFromSelection
  // Removes elements from the selection.
  //
  // Parameters:
  // elemsToRemove - an array of elements to remove from selection
  var removeFromSelection = (this.removeFromSelection = function (elemsToRemove, noCall) {
    if (selectedElements[0] == null) {
      return;
    }

    if (elemsToRemove.length === 0) {
      return;
    }

    // find every element and remove it from our array copy
    var i;
    var j = 0;
    var newSelectedItems = [];
    var len = selectedElements.length;

    newSelectedItems.length = len;
    for (i = 0; i < len; ++i) {
      var elem = selectedElements[i];

      if (elem) {
        // keep the item
        if (!elemsToRemove.includes(elem)) {
          newSelectedItems[j] = elem;
          j++;
        } else {
          // remove the item and its selector
          selectorManager.releaseSelector(elem);
        }
      }
    }
    // the copy becomes the master now
    selectedElements = newSelectedItems.filter((elem) => elem);

    if (selectedElements.length === 0 && !noCall) {
      call('selected', selectedElements);
    }
  });

  // Function: selectAllInCurrentLayer
  // Clears the selection, then adds all elements in the current layer to the selection.
  this.selectAllInCurrentLayer = function () {
    const currentLayer = layerManager.getCurrentLayerElement();

    if (currentLayer && currentLayer.getAttribute('data-lock') !== 'true') {
      setMouseMode('select');

      const elemsToAdd = (Array.from((current_group || currentLayer).childNodes) as Element[]).filter(
        (c: Element) => !CanvasElements.defElems.includes(c.tagName),
      );

      if (elemsToAdd.length < 1) {
        console.warn('Selecting empty layer in "selectAllInCurrentLayer"');
      } else {
        selectOnly(elemsToAdd, false);

        if (elemsToAdd.length > 1) {
          svgCanvas.tempGroupSelectedElements();
        }

        svgEditor.updateContextPanel();
      }
    }
  };

  /**
   * Select All element in canvas except locked layer
   * @returns {null}
   */
  this.selectAll = () => {
    clearSelection();
    setMouseMode('select');

    const allLayers = layerManager.getAllLayers();
    const elemsToSelect = [];

    for (let i = allLayers.length - 1; i >= 0; i--) {
      const layerElement = allLayers[i].getGroup();

      if (
        layerElement &&
        layerElement.parentNode &&
        layerElement.getAttribute('data-lock') !== 'true' &&
        layerElement.getAttribute('display') !== 'none'
      ) {
        const elemsToAdd = (Array.from(layerElement.childNodes) as Element[]).filter(
          (node: Element) => !CanvasElements.defElems.includes(node.tagName),
        );

        elemsToSelect.push(...elemsToAdd);
      }
    }

    if (elemsToSelect.length > 0) {
      selectOnly(elemsToSelect, false);

      if (elemsToSelect.length > 1) {
        svgCanvas.tempGroupSelectedElements();
      }

      svgEditor.updateContextPanel();
    }
  };

  /**
   * Gets the desired element from a mouse event
   * @param {MouseEvent} evt Event object from the mouse event
   * @param {boolean} allowTempGroup (deafult true) allow to return temp group, else return child of temp group
   * @returns {Element} mouse target element
   */
  const getMouseTarget = function (evt, allowTempGroup = true) {
    if (evt == null) {
      return null;
    }

    var mouseTarget = evt.target;

    var $target = $(mouseTarget);

    // If it's a selection grip, return the grip parent
    if ($target.closest('#selectorParentGroup').length) {
      // While we could instead have just returned mouseTarget,
      // this makes it easier to indentify as being a selector grip
      return selectorManager.selectorParentGroup;
    }

    const root_sctm = ($('#svgcontent')[0] as any).getScreenCTM().inverse();
    const pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm);

    // bbox center at x, y width, hieght 10px
    const selectionRegion = {
      height: 100,
      width: 100,
      x: pt.x - 50,
      y: pt.y - 50,
    };
    const intersectList = getIntersectionList(selectionRegion).reverse();

    curBBoxes = [];

    const clickPoint = svgcontent.createSVGPoint();
    const zoom = workareaManager.zoomRatio;

    for (let i = 0; i < intersectList.length; i++) {
      let pointInStroke = false;
      const elem = intersectList[i];

      if (elem === mouseTarget) {
        break;
      }

      if (!elem.isPointInStroke || typeof elem.isPointInStroke !== 'function') {
        continue;
      }

      const layer = LayerHelper.getObjectLayer(elem);

      if (layer && layer.elem) {
        const layerElement = layer.elem;

        if (layerElement.getAttribute('display') === 'none' || layerElement.getAttribute('data-lock') === 'true') {
          continue;
        }
      }

      const tlist = svgedit.transformlist.getTransformList(elem);
      const tm = svgedit.math.transformListToTransform(tlist).matrix.inverse();
      const x = tm.a * pt.x + tm.c * pt.y + tm.e;
      const y = tm.b * pt.x + tm.d * pt.y + tm.f;

      clickPoint.x = x;
      clickPoint.y = y;

      const originalStrokeWidth = elem.getAttribute('stroke-width');
      const originalVectorEffect = elem.getAttribute('vector-effect');
      const sensorRadius = svgedit.browser.isTouch() ? 25 : 20;

      elem.setAttribute('stroke-width', sensorRadius / zoom);
      elem.removeAttribute('vector-effect');

      if (elem.isPointInStroke(clickPoint)) {
        mouseTarget = elem;
        pointInStroke = true;
      }

      if (originalStrokeWidth) {
        elem.setAttribute('stroke-width', originalStrokeWidth);
      } else {
        elem.removeAttribute('stroke-width');
      }

      if (originalVectorEffect) elem.setAttribute('vector-effect', originalVectorEffect);

      if (pointInStroke) {
        break;
      }
    }

    if (mouseTarget === svgroot) {
      const mouseX = pt.x * zoom;
      const mouseY = pt.y * zoom;

      if (canvas.sensorAreaInfo && !PreviewModeController.isPreviewMode) {
        if (document.body.contains(canvas.sensorAreaInfo.elem)) {
          const dist = Math.hypot(canvas.sensorAreaInfo.x - mouseX, canvas.sensorAreaInfo.y - mouseY);

          if (dist < SENSOR_AREA_RADIUS) {
            mouseTarget = canvas.sensorAreaInfo.elem;
          }
        } else {
          canvas.sensorAreaInfo = null;
        }
      }
    }

    // if it was a <use>, Opera and WebKit return the SVGElementInstance
    if (mouseTarget.correspondingUseElement) {
      mouseTarget = mouseTarget.correspondingUseElement;
    }

    // for foreign content, go up until we find the foreignObject
    // WebKit browsers set the mouse target to the svgcanvas div
    if ([NS.HTML, NS.MATH].includes(mouseTarget.namespaceURI) && mouseTarget.id !== 'svgcanvas') {
      while (mouseTarget.nodeName !== 'foreignObject') {
        mouseTarget = mouseTarget.parentNode;

        if (!mouseTarget) {
          return svgroot;
        }
      }
    }

    // Get the desired mouseTarget with jQuery selector-fu
    // If it's root-like, select the root
    const currentLayer = layerManager.getCurrentLayerElement();

    if ([container, currentLayer, svgcontent, svgroot].includes(mouseTarget)) {
      return svgroot;
    }

    if (!mouseTarget) {
      return svgroot;
    }

    // // go up until we hit a child of a layer
    while (mouseTarget.parentNode.parentNode.tagName === 'g') {
      mouseTarget = mouseTarget.parentNode;
    }

    if (allowTempGroup && mouseTarget.parentNode.getAttribute('data-tempgroup') === 'true') {
      mouseTarget = mouseTarget.parentNode;
    }
    // Webkit bubbles the mouse event all the way up to the div, so we
    // set the mouseTarget to the svgroot like the other browsers
    // if (mouseTarget.nodeName.toLowerCase() === 'div') {
    //     mouseTarget = svgroot;
    // }

    return mouseTarget;
  };

  this.getMouseTarget = getMouseTarget;

  // Function: handleGenerateSensorArea
  // handle for pure contour elements, enlarge sensor area;
  this.handleGenerateSensorArea = (evt) => {
    // if dx or dy !== 0, then we are moving elements. Don't update sensor area info.
    if (
      getMouseMode() === 'select' &&
      (!this.sensorAreaInfo || (this.sensorAreaInfo.dx === 0 && this.sensorAreaInfo.dy === 0))
    ) {
      if (evt.target.id.match(/grip/i) || evt.target.id.includes('stretch')) {
        return;
      }

      const zoom = workareaManager.zoomRatio;
      const rootSctm = ($('#svgcontent')[0] as any).getScreenCTM().inverse();
      const pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, rootSctm);
      const mouseX = pt.x * zoom;
      const mouseY = pt.y * zoom;

      this.sensorAreaInfo = { dx: 0, dy: 0, elem: evt.target, x: mouseX, y: mouseY };
    }
  };

  MouseInteraction.register(this);

  canvas.textActions = textActions;

  // TODO: Migrate all of this code into path.js
  // Group: Path edit functions
  canvas.pathActions = pathActions;
  // end pathActions

  // Group: Serialization

  // Function: removeUnusedDefElems
  // Looks at DOM elements inside the <defs> to see if they are referred to,
  // removes them from the DOM if they are not.
  //
  // Returns:
  // The amount of elements that were removed
  var removeUnusedDefElems = (this.removeUnusedDefElems = function () {
    var defs = svgcontent.getElementsByTagNameNS(NS.SVG, 'defs');

    if (!defs || !defs.length) {
      return 0;
    }

    //	if (!defs.firstChild) {return;}

    var defelem_uses = [];
    var numRemoved = 0;
    var attrs = ['fill', 'stroke', 'filter', 'marker-start', 'marker-mid', 'marker-end'];
    var alen = attrs.length;

    var all_els = svgcontent.getElementsByTagNameNS(NS.SVG, '*');
    var all_len = all_els.length;

    var i;
    var j;

    for (i = 0; i < all_len; i++) {
      var el = all_els[i];

      for (j = 0; j < alen; j++) {
        var ref = svgedit.utilities.getUrlFromAttr(el.getAttribute(attrs[j]));

        if (ref) {
          defelem_uses.push(ref.substr(1));
        }
      }

      // gradients can refer to other gradients
      var href = getHref(el);

      if (href && href.indexOf('#') === 0) {
        defelem_uses.push(href.substr(1));
      }
    }

    const isDefUsed = (node) => {
      const id = node.id;

      if (id && defelem_uses.includes(id)) {
        return true;
      }

      if (node.nodeType === 3 || !node.getAttribute) {
        return false;
      }

      const originSymbol = node.getAttribute('data-origin-symbol');

      if (originSymbol && defelem_uses.includes(originSymbol)) {
        return true;
      }

      const imageSymbol = node.getAttribute('data-image-symbol');

      if (imageSymbol && defelem_uses.includes(imageSymbol)) {
        return true;
      }

      return false;
    };

    // remove if both itself and all its children are unused.
    const removeUnusedDef = (node) => {
      let shouldIStay = false;
      const children = node.childNodes;

      if (isDefUsed(node)) {
        shouldIStay = true;
      } else if (children.length > 0) {
        shouldIStay = Array.from(children)
          .map((child) => removeUnusedDef(child))
          .reduce((acc, cur) => acc && cur);
      }

      if (shouldIStay) {
        return true;
      }

      // Good bye node
      removedElements[node.id] = node;

      if (node.parentNode) {
        node.parentNode.removeChild(node);
      } else {
        node.remove();
      }

      numRemoved++;

      return false;
    };

    $(defs)
      .children('linearGradient, radialGradient, filter, marker, svg, symbol')
      .toArray()
      .map((def) => removeUnusedDef(def));

    return numRemoved;
  });

  // Function: svgCanvasToString
  // Main function to set up the SVG content for output
  //
  // Returns:
  // String containing the SVG image for output
  this.svgCanvasToString = function (opts: { fixTopExpansion?: boolean; unit?: Units } = {}) {
    // keep calling it until there are none to remove
    const { fixTopExpansion, unit } = opts;

    svgedit.utilities.moveDefsIntoSvgContent();
    pathActions.clear();

    // Keep SVG-Edit comment on top
    $.each(svgcontent.childNodes, function (i, node) {
      if (i && node.nodeType === 8 && node.data.includes('Created with')) {
        svgcontent.insertBefore(node, svgcontent.firstChild);
      }
    });

    // Move out of in-group editing mode
    if (current_group) {
      leaveContext();
      selectOnly([current_group]);
    }

    const documentState = useDocumentStore.getState();
    const workarea: WorkAreaModel = documentState.workarea;
    const addOnInfo = getAddOnInfo(workarea);
    const isUsingDiode = !!(documentState['enable-diode'] && addOnInfo.hybridLaser);
    const isUsingAF = !!documentState['enable-autofocus'];

    svgcontent.setAttribute('data-rotary_mode', documentState.rotary_mode ? 'true' : 'false');
    svgcontent.setAttribute('data-en_diode', String(isUsingDiode));
    svgcontent.setAttribute('data-en_af', String(isUsingAF));

    if (getAutoFeeder(addOnInfo)) {
      svgcontent.setAttribute('data-auto-feeder-height', documentState['auto-feeder-height']!.toFixed(2));
    }

    if (getPassThrough(addOnInfo)) {
      svgcontent.setAttribute('data-pass_through', documentState['pass-through-height']!.toFixed(2));
    }

    svgcontent.setAttribute('data-workarea', workarea);

    const output = this.svgToString(svgcontent, 0, unit, fixTopExpansion);

    svgedit.utilities.moveDefsOutfromSvgContent();

    const outputSanitized = sanitizeXmlString(output);

    console.log('Sanitized Result', output.length, outputSanitized.length);
    console.log(outputSanitized);

    return outputSanitized;
  };

  // Function: svgToString
  // Sub function ran on each SVG element to convert it to a string as desired
  //
  // Parameters:
  // elem - The SVG element to convert
  // indent - Integer with the amount of spaces to indent this tag
  //
  // Returns:
  // String with the given element as an SVG tag
  this.svgToString = function (elem, indent, unit: Units = 'pt', fixTopExpansion = false) {
    const out = [];
    const toXml = svgedit.utilities.toXml;
    const unitRe = new RegExp('^-?[\\d\\.]+' + unit + '$');
    const { minY } = workareaManager;

    if (elem) {
      cleanupElement(elem);

      const attrs = elem.attributes;
      let attr;
      const childs = elem.childNodes;

      for (let i = 0; i < indent; i++) {
        out.push(' ');
      }
      out.push('<');

      let { nodeName } = elem;

      if (nodeName === 'STYLE' && elem.parentNode?.nodeName === 'defs') nodeName = 'style';

      out.push(nodeName);

      if (elem.id === 'svgcontent') {
        // Process root element separately
        const { height, width } = workareaManager;
        const vb = `viewBox="0 ${fixTopExpansion ? 0 : minY} ${width} ${height}"`;
        let w = units.convertUnit(width, unit).toString();
        let h = units.convertUnit(height, unit).toString();

        if (unit !== 'pt') {
          w += unit;
          h += unit;
        }

        out.push(` id="svgcontent" width="${w}" height="${h}" ${vb} xmlns="${NS.SVG}"`);

        var nsuris = {};

        // Check elements for namespaces, add if found
        const allElems = [elem, ...elem.querySelectorAll('*')];

        allElems.forEach((el: Element) => {
          // for some elements have no attribute
          const uri = el.namespaceURI;

          if (uri && !nsuris[uri] && nsMap[uri] && nsMap[uri] !== 'xmlns' && nsMap[uri] !== 'xml') {
            nsuris[uri] = true;
            out.push(` xmlns:${nsMap[uri]}="${uri}"`);
          }

          Object.values(el.attributes).forEach((att) => {
            const attrUri = att.namespaceURI;

            if (attrUri && !nsuris[attrUri] && nsMap[attrUri] !== 'xmlns' && nsMap[attrUri] !== 'xml') {
              nsuris[attrUri] = true;
              out.push(` xmlns:${nsMap[attrUri]}="${attrUri}"`);
            }
          });
        });

        let i = attrs.length;
        const attrNames = ['width', 'height', 'xmlns', 'x', 'y', 'viewBox', 'id', 'overflow'];

        while (i--) {
          attr = attrs.item(i);

          const attrVal = toXml(attr.value);

          // Namespaces have already been dealt with, so skip
          if (attr.nodeName.indexOf('xmlns:') === 0) {
            continue;
          }

          // only serialize attributes we don't use internally
          if (attrVal && !attrNames.includes(attr.localName)) {
            if (!attr.namespaceURI || nsMap[attr.namespaceURI]) {
              out.push(' ');
              out.push(attr.nodeName);
              out.push('="');
              out.push(attrVal);
              out.push('"');
            }
          }
        }
      } else {
        // Skip empty defs
        if (elem.nodeName === 'defs' && !elem.firstChild) {
          return '';
        }

        const mozAttrs = ['-moz-math-font-style', '_moz-math-font-style'];

        for (let i = attrs.length - 1; i >= 0; i--) {
          attr = attrs.item(i);

          let attrVal = toXml(attr.value);

          // remove bogus attributes added by Gecko
          if (mozAttrs.includes(attr.localName)) {
            continue;
          }

          if (attrVal) {
            if (attrVal.indexOf('pointer-events') === 0) {
              continue;
            }

            if (attr.localName === 'class' && attrVal.indexOf('se_') === 0) {
              continue;
            }

            out.push(' ');

            if (elem.tagName === 'path' && attr.localName === 'd') {
              attrVal = pathActions.convertPath(elem, true);
            }

            const floatValue = svgedit.units.shortFloat(attrVal);

            if (!Number.isNaN(Number(attrVal))) {
              attrVal = floatValue;
            } else if (unitRe.test(attrVal)) {
              attrVal = floatValue + unit;
            }

            // Embed images when saving
            if (
              save_options.apply &&
              elem.nodeName === 'image' &&
              attr.localName === 'href' &&
              save_options.images &&
              save_options.images === 'embed'
            ) {
              var img = encodableImages[attrVal];

              if (img) {
                attrVal = img;
              }
            }

            // map various namespaces to our fixed namespace prefixes
            // (the default xmlns attribute itself does not get a prefix)
            if (!attr.namespaceURI || attr.namespaceURI === NS.SVG || nsMap[attr.namespaceURI]) {
              out.push(attr.nodeName);
              out.push('="');
              out.push(attrVal);
              out.push('"');
            }
          }
        }
      }

      if (elem.hasChildNodes()) {
        out.push('>');
        indent++;

        const needFix = fixTopExpansion && minY < 0 && elem.nodeName === 'g' && elem.classList.contains('layer');
        let fixed = !needFix;
        var bOneLine = false;

        for (let i = 0; i < childs.length; i++) {
          const child = childs.item(i);

          switch (child.nodeType) {
            case 1: // element node
              if (!fixed) {
                if (!CanvasElements.defElems.includes(child.nodeName.toLowerCase())) {
                  out.push('\n');
                  for (let i = 0; i < indent; i++) {
                    out.push(' ');
                  }
                  out.push(`<g transform="translate(0, ${-minY})">`);
                  fixed = true;
                  indent++;
                }
              }

              out.push('\n');
              out.push(this.svgToString(childs.item(i), indent, undefined, fixTopExpansion));
              break;
            case 3: // text node
              // to keep the spaces before a line
              const str = elem.tagName === 'tspan' ? child.nodeValue : child.nodeValue.replace(/^\s+|\s+$/g, '');

              if (str) {
                bOneLine = true;
                out.push(String(toXml(str)));
              }

              break;
            case 4: // cdata node
              out.push('\n');
              out.push(new Array(indent + 1).join(' '));
              out.push('<![CDATA[');
              out.push(child.nodeValue);
              out.push(']]>');
              break;
            case 8: // comment
              out.push('\n');
              out.push(new Array(indent + 1).join(' '));
              out.push('<!--');
              out.push(child.data);
              out.push('-->');
              break;
            default:
              break;
          }
        }
        indent--;

        if (!bOneLine) {
          out.push('\n');
          for (let i = 0; i < indent; i++) {
            out.push(' ');
          }
        }

        if (needFix && fixed) {
          out.push('</g>\n');
          indent--;
        }

        out.push('</');
        out.push(nodeName);
        out.push('>');
      } else {
        out.push('/>');
      }
    }

    return out.join('');
  }; // end svgToString()

  // Function: getImageSource
  // When saving svg string, we need to get image source data such that we can edits image again after loading
  //
  // Parameters:
  // Do it for all svgcanvas so no parameters needed
  // Returns:
  // String or Binary containing image ids and image sources
  this.getImageSource = async () => {
    const images = $('#svgcontent').find('image').toArray();
    const ret = {};

    for (let i = 0; i < images.length; i++) {
      const blobUrl = images[i].getAttributeNS(null, 'origImage');
      const id = images[i].getAttributeNS(null, 'id');

      if (blobUrl) {
        const res = await fetch(blobUrl);
        const blob = await res.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        ret[id] = arrayBuffer;
      }
    }

    return ret;
  };

  // Function: embedImage
  // Converts a given image file to a data URL when possible, then runs a given callback
  //
  // Parameters:
  // val - String with the path/URL of the image
  // callback - Optional function to run when image data is found, supplies the
  // result (data URL or false) as first parameter.
  this.embedImage = function (val, callback) {
    // load in the image and once it's loaded, get the dimensions
    ($(new Image()) as any)
      .load(function () {
        // create a canvas the same size as the raster image
        var canvas = document.createElement('canvas');

        canvas.width = this.width;
        canvas.height = this.height;
        // load the raster image into the canvas
        canvas.getContext('2d').drawImage(this, 0, 0);
        // retrieve the data: URL
        try {
          var urldata = ';svgedit_url=' + encodeURIComponent(val);

          urldata = canvas.toDataURL().replace(';base64', urldata + ';base64');
          encodableImages[val] = urldata;
        } catch (e) {
          encodableImages[val] = false;
        }

        if (callback) {
          callback(encodableImages[val]);
        }
      })
      .attr('src', val);
  };

  this.open = function () {
    // Nothing by default, handled by optional widget/extension
  };

  this.removeUnusedDefs = () => {
    while (removeUnusedDefElems() > 0) {
      null;
    }
  };

  // Function: getSvgString
  // Returns the current drawing as raw SVG XML text.
  //
  // Returns:
  // The current drawing as raw SVG XML text.
  this.getSvgString = function (opts: { unit?: Units } = {}) {
    if (tempGroup) {
      this.ungroupTempGroup();
    }

    this.ungroupAllTempGroup();
    save_options.apply = false;

    return this.svgCanvasToString(opts);
  };

  // Function: randomizeIds
  // This function determines whether to use a nonce in the prefix, when
  // generating IDs for future documents in SVG-Edit.
  //
  // Parameters:
  // an optional boolean, which, if true, adds a nonce to the prefix. Thus
  // svgCanvas.randomizeIds() <==> svgCanvas.randomizeIds(true)
  //
  // if you're controlling SVG-Edit externally, and want randomized IDs, call
  // this BEFORE calling svgCanvas.setSvgString
  //
  this.randomizeIds = function (enableRandomization) {
    if (arguments.length > 0 && !enableRandomization) {
      svgedit.draw.randomizeIds(false, getCurrentDrawing());
    } else {
      svgedit.draw.randomizeIds(true, getCurrentDrawing());
    }
  };

  // Function: uniquifyElems
  // Ensure each element has a unique ID
  //
  // Parameters:
  // g - The parent element of the tree to give unique IDs
  var uniquifyElems = (this.uniquifyElems = function (g) {
    var ids = {};
    // TODO: Handle markers and connectors. These are not yet re-identified properly
    // as their referring elements do not get remapped.
    //
    // <marker id='se_marker_end_svg_7'/>
    // <polyline id='svg_7' se:connector='svg_1 svg_6' marker-end='url(#se_marker_end_svg_7)'/>
    //
    // Problem #1: if svg_1 gets renamed, we do not update the polyline's se:connector attribute
    // Problem #2: if the polyline svg_7 gets renamed, we do not update the marker id nor the polyline's marker-end attribute
    var ref_elems = ['filter', 'linearGradient', 'pattern', 'radialGradient', 'symbol', 'textPath', 'use'];

    svgedit.utilities.walkTree(g, function (n) {
      // if it's an element node
      if (n.nodeType == 1) {
        // and the element has an ID
        if (n.id) {
          // and we haven't tracked this ID yet
          if (!(n.id in ids)) {
            // add this id to our map
            ids[n.id] = {
              attrs: [],
              elem: null,
              hrefs: [],
            };
          }

          ids[n.id].elem = n;
        }

        // now search for all attributes on this element that might refer
        // to other elements
        $.each(refAttrs, function (i, attr) {
          var attrnode = n.getAttributeNode(attr);

          if (attrnode) {
            // the incoming file has been sanitized, so we should be able to safely just strip off the leading #
            var url = svgedit.utilities.getUrlFromAttr(attrnode.value);
            var refid = url ? url.substr(1) : null;

            if (refid) {
              if (!(refid in ids)) {
                // add this id to our map
                ids[refid] = {
                  attrs: [],
                  elem: null,
                  hrefs: [],
                };
              }

              ids[refid].attrs.push(attrnode);
            }
          }
        });

        // check xlink:href now
        var href = svgedit.utilities.getHref(n);

        // TODO: what if an <image> or <a> element refers to an element internally?
        if (href && ref_elems.includes(n.nodeName)) {
          var refid = href.substr(1);

          if (refid) {
            if (!(refid in ids)) {
              // add this id to our map
              ids[refid] = {
                attrs: [],
                elem: null,
                hrefs: [],
              };
            }

            ids[refid].hrefs.push(n);
          }
        }
      }
    });
  });

  // Function convertGradients
  // Converts gradients from userSpaceOnUse to objectBoundingBox
  var convertGradients = (this.convertGradients = function (elem) {
    var elems = $(elem).find('linearGradient, radialGradient');

    if (!elems.length && svgedit.browser.isWebkit()) {
      // Bug in webkit prevents regular *Gradient selector search
      elems = $(elem)
        .find('*')
        .filter(function () {
          return this.tagName.includes('Gradient');
        });
    }

    elems.each(function () {
      var grad = this as any;

      if ($(grad).attr('gradientUnits') === 'userSpaceOnUse') {
        // TODO: Support more than one element with this ref by duplicating parent grad
        var elems = $(svgcontent).find('[fill="url(#' + grad.id + ')"],[stroke="url(#' + grad.id + ')"]');

        if (!elems.length) {
          return;
        }

        // get object's bounding box
        var bb = svgedit.utilities.getBBox(elems[0]);

        // This will occur if the element is inside a <defs> or a <symbol>,
        // in which we shouldn't need to convert anyway.
        if (!bb) {
          return;
        }

        if (grad.tagName === 'linearGradient') {
          var g_coords = $(grad).attr(['x1', 'y1', 'x2', 'y2']) as any;

          // If has transform, convert
          var tlist = grad.gradientTransform.baseVal;

          if (tlist && tlist.numberOfItems > 0) {
            var m = svgedit.math.transformListToTransform(tlist).matrix;
            var pt1 = svgedit.math.transformPoint(g_coords.x1, g_coords.y1, m);
            var pt2 = svgedit.math.transformPoint(g_coords.x2, g_coords.y2, m);

            g_coords.x1 = pt1.x;
            g_coords.y1 = pt1.y;
            g_coords.x2 = pt2.x;
            g_coords.y2 = pt2.y;
            grad.removeAttribute('gradientTransform');
          }

          $(grad).attr({
            x1: (g_coords.x1 - bb.x) / bb.width,
            x2: (g_coords.x2 - bb.x) / bb.width,
            y1: (g_coords.y1 - bb.y) / bb.height,
            y2: (g_coords.y2 - bb.y) / bb.height,
          });
          grad.removeAttribute('gradientUnits');
        }
        // else {
        // Note: radialGradient elements cannot be easily converted
        // because userSpaceOnUse will keep circular gradients, while
        // objectBoundingBox will x/y scale the gradient according to
        // its bbox.

        // For now we'll do nothing, though we should probably have
        // the gradient be updated as the element is moved, as
        // inkscape/illustrator do.

        //						var g_coords = $(grad).attr(['cx', 'cy', 'r']);
        //
        //						$(grad).attr({
        //							cx: (g_coords.cx - bb.x) / bb.width,
        //							cy: (g_coords.cy - bb.y) / bb.height,
        //							r: g_coords.r
        //						});
        //
        //						grad.removeAttribute('gradientUnits');
        // }
      }
    });
  });

  //
  // Function: setSvgString
  // This function sets the current drawing as the input SVG XML.
  //
  // Parameters:
  // xmlString - The SVG as XML text.
  //
  // Returns:
  // This function returns false if the set was unsuccessful, true otherwise.
  this.setSvgString = setSvgContent;

  // TODO(codedread): Move all layer/context functions in draw.js
  // Layer API Functions

  // Group: Layers

  // Function: renameCurrentLayer
  // Renames the current layer. If the layer name is not valid (i.e. unique), then this function
  // does nothing and returns false, otherwise it returns true. This is an undo-able action.
  //
  // Parameters:
  // newname - the new name you want to give the current layer. This name must be unique
  // among all layer names.
  //
  // Returns:
  // true if the rename succeeded, false otherwise.
  this.renameCurrentLayer = function (name) {
    const layer = layerManager.getCurrentLayer();

    if (!layer) return;

    const result = layerManager.setCurrentLayerName(name);

    if (result) {
      call('changed', [layer.getGroup()]);

      return true;
    }

    return false;
  };

  this.sortTempGroupByLayer = () => {
    if (!tempGroup) return;

    const allLayerNames = layerManager.getAllLayerNames();

    for (let i = 0; i < allLayerNames.length; i++) {
      const elems = tempGroup.querySelectorAll(`[data-original-layer="${allLayerNames[i]}"]`);

      for (let j = 0; j < elems.length; j++) {
        tempGroup.appendChild(elems[j]);
      }
    }
  };

  this.updateElementColor = updateElementColor;

  // Function: leaveContext
  // Return from a group context to the regular kind, make any previously
  // disabled elements enabled again
  var leaveContext = (this.leaveContext = function () {
    var i;
    var len = disabled_elems.length;

    if (len) {
      for (i = 0; i < len; i++) {
        var elem = disabled_elems[i];
        var orig = elData(elem, 'orig_opac');

        if (orig !== 1) {
          elem.setAttribute('opacity', orig);
        } else {
          elem.removeAttribute('opacity');
        }

        elem.setAttribute('style', 'pointer-events: inherit');
      }
      disabled_elems = [];
      clearSelection(true);
      call('contextset', null);
    }

    current_group = null;
  });

  // Function: setContext
  // Set the current context (for in-group editing)
  var setContext = (this.setContext = function (elem) {
    leaveContext();

    if (typeof elem === 'string') {
      elem = svgedit.utilities.getElem(elem);
    }

    // Edit inside this group
    current_group = elem;

    // Disable other elements
    $(elem)
      .parentsUntil('#svgcontent')
      .andSelf()
      .siblings()
      .each(function () {
        var opac = Number(this.getAttribute('opacity')) || 1;

        // Store the original's opacity
        elData(this, 'orig_opac', opac);
        this.setAttribute('opacity', (opac * 0.33).toString());
        this.setAttribute('style', 'pointer-events: none');
        disabled_elems.push(this);
      });

    clearSelection();
    call('contextset', current_group);
  });

  // Group: Document functions

  // Function: clear
  // Clears the current document. This is not an undoable action.
  this.clear = function () {
    pathActions.clear();

    clearSelection();

    svgedit.utilities.clearDefs();

    // clear the svgcontent node
    canvas.clearSvgContentElement();

    // create new document
    canvas.resetCurrentDrawing();
    layerManager.reset(svgcontent as unknown as SVGSVGElement);

    // Reset Used Layer colors
    randomColor.reset();

    // create empty first layer
    const defaultLayerName = i18n.lang.beambox.right_panel.layer_panel.layer1;

    LayerHelper.createLayer(defaultLayerName);

    const defaultLayer = layerManager.getLayerElementByName(defaultLayerName)!;

    initLayerConfig(defaultLayer);

    // force update selected layers
    useLayerStore.getState().setSelectedLayers([defaultLayerName]);
    presprayArea.togglePresprayArea();

    // clear the undo stack
    canvas.undoMgr.resetUndoStack();

    // clear current file
    currentFileManager.clear();

    // reset the selector manager
    selectorManager.initGroup();

    // reset the rubber band box
    rubberBox = selectorManager.getRubberBandBox();

    call('cleared');
  };

  // Function: linkControlPoints
  // Alias function
  this.linkControlPoints = pathActions.linkControlPoints;

  this.getSelectedWithoutTempGroup = () => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    return selectedElements;
  };

  // Function: getZoom
  // keep for ext-xxxx.js
  this.getZoom = () => workareaManager.zoomRatio;

  // Function: getSnapToGrid
  // Returns the current snap to grid setting
  this.getSnapToGrid = function () {
    return curConfig.gridSnapping;
  };

  // Function: getVersion
  // Returns a string which describes the revision number of SvgCanvas.
  this.getVersion = function () {
    return 'svgcanvas.js ($Rev$)';
  };

  // Function: setConfig
  // Update configuration options with given values
  //
  // Parameters:
  // opts - Object with options (see curConfig for examples)
  this.setConfig = function (opts) {
    $.extend(curConfig, opts);
  };

  // Function: getTitle
  // Returns the current group/SVG's title contents
  this.getTitle = function (elem) {
    var i;

    elem = elem || selectedElements[0];

    if (!elem) {
      return;
    }

    var childs = elem.childNodes;

    for (i = 0; i < childs.length; i++) {
      if (childs[i].nodeName === 'title') {
        return childs[i].textContent;
      }
    }

    return '';
  };

  // Function: setGroupTitle
  // Sets the group/SVG's title content
  // TODO: Combine this with setDocumentTitle
  this.setGroupTitle = function (val) {
    var elem = selectedElements[0];

    elem = $(elem).data('gsvg') || elem;

    var ts: any = $(elem).children('title');

    var batchCmd = new history.BatchCommand('Set Label');

    if (!val.length) {
      // Remove title element
      var tsNextSibling = ts.nextSibling;

      batchCmd.addSubCommand(new history.RemoveElementCommand(ts[0], tsNextSibling, elem));
      ts.remove();
    } else if (ts.length) {
      // Change title contents
      var title = ts[0];

      batchCmd.addSubCommand(
        new history.ChangeElementCommand(title, {
          '#text': title.textContent,
        }),
      );
      title.textContent = val;
    } else {
      // Add title element
      title = svgdoc.createElementNS(NS.SVG, 'title');
      title.textContent = val;
      $(elem).prepend(title);
      batchCmd.addSubCommand(new history.InsertElementCommand(title));
    }

    addCommandToHistory(batchCmd);
  };

  // Function: getDocumentTitle
  // Returns the current document title or an empty string if not found
  var getDocumentTitle = (this.getDocumentTitle = function () {
    return canvas.getTitle(svgcontent);
  });

  // Function: setDocumentTitle
  // Adds/updates a title element for the document with the given name.
  // This is an undoable action
  //
  // Parameters:
  // newtitle - String with the new title
  this.setDocumentTitle = function (newtitle) {
    var i;
    var childs = svgcontent.childNodes;
    var doc_title: any = false;
    var old_title = '';

    var batchCmd = new history.BatchCommand('Change Image Title');

    for (i = 0; i < childs.length; i++) {
      if (childs[i].nodeName === 'title') {
        doc_title = childs[i];
        old_title = doc_title.textContent;
        break;
      }
    }

    if (!doc_title) {
      doc_title = svgdoc.createElementNS(NS.SVG, 'title');
      svgcontent.insertBefore(doc_title, svgcontent.firstChild);
    }

    if (newtitle.length) {
      doc_title.textContent = newtitle;
    } else {
      // No title given, so element is not necessary
      doc_title.parentNode.removeChild(doc_title);
    }

    batchCmd.addSubCommand(
      new history.ChangeElementCommand(doc_title, {
        '#text': old_title,
      }),
    );
    addCommandToHistory(batchCmd);
  };

  // Function: getEditorNS
  // Returns the editor's namespace URL, optionally adds it to root element
  //
  // Parameters:
  // add - Boolean to indicate whether or not to add the namespace value
  this.getEditorNS = function (add) {
    if (add) {
      svgcontent.setAttribute('xmlns:se', NS.SE);
    }

    return NS.SE;
  };

  // Function: getOffset
  // Returns an object with x, y values indicating the svgcontent element's
  // position in the editor's canvas.
  this.getOffset = function () {
    return $(svgcontent).attr(['x', 'y']);
  };

  // Function: setMode
  // Sets the editor's mode to the given string
  //
  // Parameters:
  // name - String with the new mode to change to
  this.setMode = function (name) {
    // TODO: keep for ext-polygon.js, can remove after refactoring it
    setMouseMode(name);
  };

  // Group: Element Styling

  // Function: getColor
  // Returns the current fill/stroke option
  this.getColor = function (type) {
    return cur_properties[type];
  };

  // Function: setColor
  // Change the current stroke/fill color/gradient value
  //
  // Parameters:
  // type - String indicating fill or stroke
  // val - The value to set the stroke attribute to
  // preventUndo - Boolean indicating whether or not this should be and undoable option
  this.setColor = function (type, val, preventUndo) {
    cur_shape[type] = val;
    cur_properties[type + '_paint'] = {
      type: 'solidColor',
    };

    var elems = [];

    function addNonG(e) {
      if (e.nodeName !== 'g') {
        elems.push(e);
      }
    }

    var i = selectedElements.length;

    while (i--) {
      var elem = selectedElements[i];

      if (elem) {
        if (elem.tagName === 'g') {
          svgedit.utilities.walkTree(elem, addNonG);
        } else if (type === 'fill') {
          if (elem.tagName !== 'polyline' && elem.tagName !== 'line') {
            elems.push(elem);
          }
        } else {
          elems.push(elem);
        }
      }
    }

    if (elems.length > 0) {
      if (!preventUndo) {
        changeSelectedAttribute(type, val, elems);
        call('changed', elems);
      } else {
        changeSelectedAttributeNoUndo(type, val, elems);
      }
    }
  };

  // Function: setGradient
  // Apply the current gradient to selected element's fill or stroke
  //
  // Parameters
  // type - String indicating "fill" or "stroke" to apply to an element
  var setGradient = (this.setGradient = function (type) {
    if (!cur_properties[type + '_paint'] || cur_properties[type + '_paint'].type === 'solidColor') {
      return;
    }

    var grad = canvas[type + 'Grad'];
    // find out if there is a duplicate gradient already in the defs
    var duplicate_grad = findDuplicateGradient(grad);
    var defs = findDefs();

    // no duplicate found, so import gradient into defs
    if (!duplicate_grad) {
      var orig_grad = grad;

      grad = defs.appendChild(svgdoc.importNode(grad, true));
      // get next id and set it on the grad
      grad.id = getNextId();
    } else {
      // use existing gradient
      grad = duplicate_grad;
    }

    canvas.setColor(type, 'url(#' + grad.id + ')');
  });

  // Function: findDuplicateGradient
  // Check if exact gradient already exists
  //
  // Parameters:
  // grad - The gradient DOM element to compare to others
  //
  // Returns:
  // The existing gradient if found, null if not
  var findDuplicateGradient = function (grad) {
    var defs = findDefs();
    var existing_grads = $(defs).find('linearGradient, radialGradient');
    var i = existing_grads.length;
    var rad_attrs = ['r', 'cx', 'cy', 'fx', 'fy'];

    while (i--) {
      var og = existing_grads[i];

      if (grad.tagName === 'linearGradient') {
        if (
          grad.getAttribute('x1') !== og.getAttribute('x1') ||
          grad.getAttribute('y1') !== og.getAttribute('y1') ||
          grad.getAttribute('x2') !== og.getAttribute('x2') ||
          grad.getAttribute('y2') !== og.getAttribute('y2')
        ) {
          continue;
        }
      } else {
        const gradAttrs = $(grad).attr(rad_attrs);
        const ogAttrs = $(og).attr(rad_attrs);
        let diff = false;

        $.each(rad_attrs, function (i, attr) {
          if (gradAttrs[attr] !== ogAttrs[attr]) {
            diff = true;
          }
        });

        if (diff) {
          continue;
        }
      }

      // else could be a duplicate, iterate through stops
      var stops = grad.getElementsByTagNameNS(NS.SVG, 'stop');
      var ostops = og.getElementsByTagNameNS(NS.SVG, 'stop');

      if (stops.length !== ostops.length) {
        continue;
      }

      var j = stops.length;

      while (j--) {
        var stop = stops[j];
        var ostop = ostops[j];

        if (
          stop.getAttribute('offset') !== ostop.getAttribute('offset') ||
          stop.getAttribute('stop-opacity') !== ostop.getAttribute('stop-opacity') ||
          stop.getAttribute('stop-color') !== ostop.getAttribute('stop-color')
        ) {
          break;
        }
      }

      if (j === -1) {
        return og;
      }
    } // for each gradient in defs

    return null;
  };

  this.reorientGrads = function reorientGrads(elem, m) {
    var i;
    var bb = svgedit.utilities.getBBox(elem);

    for (i = 0; i < 2; i++) {
      var type = i === 0 ? 'fill' : 'stroke';
      var attrVal = elem.getAttribute(type);

      if (attrVal && attrVal.indexOf('url(') === 0) {
        var grad = svgedit.utilities.getRefElem(attrVal);

        if (grad.tagName === 'linearGradient') {
          var x1 = grad.getAttribute('x1') || 0;
          var y1 = grad.getAttribute('y1') || 0;
          var x2 = grad.getAttribute('x2') || 1;
          var y2 = grad.getAttribute('y2') || 0;

          // Convert to USOU points
          x1 = bb.width * x1 + bb.x;
          y1 = bb.height * y1 + bb.y;
          x2 = bb.width * x2 + bb.x;
          y2 = bb.height * y2 + bb.y;

          // Transform those points
          var pt1 = svgedit.math.transformPoint(x1, y1, m);
          var pt2 = svgedit.math.transformPoint(x2, y2, m);

          // Convert back to BB points
          var g_coords: { [key: string]: number | string } = {};

          g_coords.x1 = (pt1.x - bb.x) / bb.width;
          g_coords.y1 = (pt1.y - bb.y) / bb.height;
          g_coords.x2 = (pt2.x - bb.x) / bb.width;
          g_coords.y2 = (pt2.y - bb.y) / bb.height;

          var newgrad = grad.cloneNode(true);

          $(newgrad).attr(g_coords);

          newgrad.id = getNextId();
          findDefs().appendChild(newgrad);
          elem.setAttribute(type, 'url(#' + newgrad.id + ')');
        }
      }
    }
  };

  // Function: getStrokeWidth
  // Returns the current stroke-width value
  this.getStrokeWidth = function () {
    return cur_properties.stroke_width;
  };

  // Function: setStrokeWidth
  // Sets the stroke width for the current selected elements
  // When attempting to set a line's width to 0, this changes it to 1 instead
  //
  // Parameters:
  // val - A Float indicating the new stroke width value
  this.setStrokeWidth = function (val) {
    if (val == 0 && ['line', 'path'].includes(getMouseMode())) {
      canvas.setStrokeWidth(1);

      return;
    }

    cur_properties.stroke_width = val;

    var elems = [];

    function addNonG(e) {
      if (e.nodeName !== 'g') {
        elems.push(e);
      }
    }

    var i = selectedElements.length;

    while (i--) {
      var elem = selectedElements[i];

      if (elem) {
        if (elem.tagName === 'g') {
          svgedit.utilities.walkTree(elem, addNonG);
        } else {
          elems.push(elem);
        }
      }
    }

    if (elems.length > 0) {
      changeSelectedAttribute('stroke-width', val, elems);
      call('changed', selectedElements);
    }
  };

  // Function: setStrokeAttr
  // Set the given stroke-related attribute the given value for selected elements
  //
  // Parameters:
  // attr - String with the attribute name
  // val - String or number with the attribute value
  this.setStrokeAttr = function (attr, val) {
    cur_shape[attr.replace('-', '_')] = val;

    var elems = [];

    function addNonG(e) {
      if (e.nodeName !== 'g') {
        elems.push(e);
      }
    }

    var i = selectedElements.length;

    while (i--) {
      var elem = selectedElements[i];

      if (elem) {
        if (elem.tagName === 'g') {
          svgedit.utilities.walkTree(elem, function (e) {
            if (e.nodeName !== 'g') {
              elems.push(e);
            }
          });
        } else {
          elems.push(elem);
        }
      }
    }

    if (elems.length > 0) {
      changeSelectedAttribute(attr, val, elems);
      call('changed', selectedElements);
    }
  };

  // Function: getStyle
  // Returns current style options
  this.getStyle = function () {
    return cur_shape;
  };

  // Function: getOpacity
  // Returns the current opacity
  this.getOpacity = function () {
    return cur_shape.opacity;
  };

  // Function: setOpacity
  // Sets the given opacity to the current selected elements
  this.setOpacity = function (val) {
    cur_shape.opacity = val;
    changeSelectedAttribute('opacity', val);
  };

  // Function: getOpacity
  // Returns the current fill opacity
  this.getFillOpacity = function () {
    return cur_shape.fill_opacity;
  };

  // Function: getStrokeOpacity
  // Returns the current stroke opacity
  this.getStrokeOpacity = function () {
    return cur_shape.stroke_opacity;
  };

  // Function: setPaintOpacity
  // Sets the current fill/stroke opacity
  //
  // Parameters:
  // type - String with "fill" or "stroke"
  // val - Float with the new opacity value
  // preventUndo - Boolean indicating whether or not this should be an undoable action
  this.setPaintOpacity = function (type, val, preventUndo) {
    cur_shape[type + '_opacity'] = val;

    if (!preventUndo) {
      changeSelectedAttribute(type + '-opacity', val);
    } else {
      changeSelectedAttributeNoUndo(type + '-opacity', val);
    }
  };

  // Function: getPaintOpacity
  // Gets the current fill/stroke opacity
  //
  // Parameters:
  // type - String with "fill" or "stroke"
  this.getPaintOpacity = function (type) {
    return type === 'fill' ? this.getFillOpacity() : this.getStrokeOpacity();
  };

  // Function: getBlur
  // Gets the stdDeviation blur value of the given element
  //
  // Parameters:
  // elem - The element to check the blur value for
  this.getBlur = function (elem) {
    var val = 0;
    //	var elem = selectedElements[0];

    if (elem) {
      var filter_url = elem.getAttribute('filter');

      if (filter_url) {
        var blur = svgedit.utilities.getElem(elem.id + '_blur');

        if (blur) {
          val = blur.firstChild.getAttribute('stdDeviation');
        }
      }
    }

    return val;
  };

  (function () {
    var cur_command = null;
    var filter = null;
    var filterHidden = false;

    // Function: setBlurNoUndo
    // Sets the stdDeviation blur value on the selected element without being undoable
    //
    // Parameters:
    // val - The new stdDeviation value
    canvas.setBlurNoUndo = function (val) {
      if (!filter) {
        canvas.setBlur(val);

        return;
      }

      if (val === 0) {
        // Don't change the StdDev, as that will hide the element.
        // Instead, just remove the value for "filter"
        changeSelectedAttributeNoUndo('filter', '');
        filterHidden = true;
      } else {
        var elem = selectedElements[0];

        if (filterHidden) {
          changeSelectedAttributeNoUndo('filter', 'url(#' + elem.id + '_blur)');
        }

        if (svgedit.browser.isWebkit()) {
          console.log('e', elem);
          elem.removeAttribute('filter');
          elem.setAttribute('filter', 'url(#' + elem.id + '_blur)');
        }

        changeSelectedAttributeNoUndo('stdDeviation', val, [filter.firstChild]);
        canvas.setBlurOffsets(filter, val);
      }
    };

    function finishChange() {
      var bCmd = canvas.undoMgr.finishUndoableChange();

      cur_command.addSubCommand(bCmd);
      addCommandToHistory(cur_command);
      cur_command = null;
      filter = null;
    }

    // Function: setBlurOffsets
    // Sets the x, y, with, height values of the filter element in order to
    // make the blur not be clipped. Removes them if not neeeded
    //
    // Parameters:
    // filter - The filter DOM element to update
    // stdDev - The standard deviation value on which to base the offset size
    canvas.setBlurOffsets = function (filter, stdDev) {
      if (stdDev > 3) {
        // TODO: Create algorithm here where size is based on expected blur
        svgedit.utilities.assignAttributes(
          filter,
          {
            height: '200%',
            width: '200%',
            x: '-50%',
            y: '-50%',
          },
          100,
        );
      } else {
        // Removing these attributes hides text in Chrome (see Issue 579)
        if (!svgedit.browser.isWebkit()) {
          filter.removeAttribute('x');
          filter.removeAttribute('y');
          filter.removeAttribute('width');
          filter.removeAttribute('height');
        }
      }
    };

    // Function: setBlur
    // Adds/updates the blur filter to the selected element
    //
    // Parameters:
    // val - Float with the new stdDeviation blur value
    // complete - Boolean indicating whether or not the action should be completed (to add to the undo manager)
    canvas.setBlur = function (val, complete) {
      if (cur_command) {
        finishChange();

        return;
      }

      // Looks for associated blur, creates one if not found
      var elem = selectedElements[0];
      var elem_id = elem.id;

      filter = svgedit.utilities.getElem(elem_id + '_blur');

      val -= 0;

      var batchCmd = new history.BatchCommand();

      // Blur found!
      if (filter) {
        if (val === 0) {
          filter = null;
        }
      } else {
        // Not found, so create
        var newblur = addSvgElementFromJson({
          attr: {
            in: 'SourceGraphic',
            stdDeviation: val,
          },
          element: 'feGaussianBlur',
        });

        filter = addSvgElementFromJson({
          attr: {
            id: elem_id + '_blur',
          },
          element: 'filter',
        });

        filter.appendChild(newblur);
        findDefs().appendChild(filter);

        batchCmd.addSubCommand(new history.InsertElementCommand(filter));
      }

      var changes = {
        filter: elem.getAttribute('filter'),
      };

      if (val === 0) {
        elem.removeAttribute('filter');
        batchCmd.addSubCommand(new history.ChangeElementCommand(elem, changes));

        return;
      }

      changeSelectedAttribute('filter', 'url(#' + elem_id + '_blur)');
      batchCmd.addSubCommand(new history.ChangeElementCommand(elem, changes));
      canvas.setBlurOffsets(filter, val);

      cur_command = batchCmd;
      canvas.undoMgr.beginUndoableChange('stdDeviation', [filter ? filter.firstChild : null]);

      if (complete) {
        canvas.setBlurNoUndo(val);
        finishChange();
      }
    };
  })();

  // Useless for beambox
  // Function: setLinkURL
  // Sets the new link URL for the selected anchor element.
  //
  // Parameters:
  // val - String with the link URL/path
  this.setLinkURL = function (val) {
    var elem = selectedElements[0];

    if (!elem) {
      return;
    }

    if (elem.tagName !== 'a') {
      // See if parent is an anchor
      var parents_a = $(elem).parents('a');

      if (parents_a.length) {
        elem = parents_a[0];
      } else {
        return;
      }
    }

    var cur_href = getHref(elem);

    if (cur_href === val) {
      return;
    }

    var batchCmd = new history.BatchCommand('Change Link URL');

    setHref(elem, val);
    batchCmd.addSubCommand(
      new history.ChangeElementCommand(elem, {
        '#href': cur_href,
      }),
    );

    addCommandToHistory(batchCmd);
  };

  // Function: setRectRadius
  // Sets the rx & ry values to the selected rect element to change its corner radius
  //
  // Parameters:
  // val - The new radius
  this.setRectRadius = function (val) {
    var selected = selectedElements[0];

    if (selected != null && selected.tagName === 'rect') {
      var r = selected.getAttribute('rx');

      if (String(r) !== String(val)) {
        selected.setAttribute('rx', val);
        selected.setAttribute('ry', val);
        addCommandToHistory(
          new history.ChangeElementCommand(
            selected,
            {
              rx: r,
              ry: r,
            },
            'Radius',
          ),
        );
        call('changed', [selected]);
      }
    }
  };

  this.isElemFillable = (elem: Element) => {
    if (elem.tagName === 'g') {
      const childNodes = elem.childNodes;

      for (let i = 0; i < childNodes.length; i++) {
        if (!this.isElemFillable(childNodes[i])) {
          return false;
        }
      }

      return true;
    }

    if (!CanvasElements.fillableElems.includes(elem.tagName)) {
      return false;
    }

    return elem.tagName === 'path' ? this.calcPathClosed(elem) : true;
  };

  this.calcPathClosed = (pathElem) => {
    const segList = pathElem.pathSegList._list || pathElem.pathSegList;
    let [startX, startY, currentX, currentY, isDrawing, isClosed] = [0, 0, 0, 0, false, true];

    for (let i = 0; i < segList.length; i++) {
      const seg = segList[i];

      switch (seg.pathSegType) {
        case 1:
          [currentX, currentY] = [startX, startY];
          isDrawing = false;
          break;
        case 2:
        case 3:
          if (isDrawing) {
            if (seg.x !== currentX || seg.y !== currentY) {
              isClosed = false;
            } else {
              [startX, startY, currentX, currentY] = [seg.x, seg.y, seg.x, seg.y];
            }
          } else {
            [startX, startY, currentX, currentY] = [seg.x, seg.y, seg.x, seg.y];
          }

          break;
        default:
          isDrawing = true;
          [currentX, currentY] = [seg.x, seg.y];
          break;
      }

      if (!isClosed) {
        break;
      }
    }

    if (isDrawing && (startX !== currentX || startY !== currentY)) {
      isClosed = false;
    }

    return isClosed;
  };

  this.calcElemFilledInfo = (elem: Element) => {
    if (elem.tagName === 'g') {
      const childNodes = elem.childNodes;
      let isAnyFilled;
      let isAllFilled = true;

      for (let i = 0; i < childNodes.length; i++) {
        const childFilledInfo = this.calcElemFilledInfo(childNodes[i]);

        if (childFilledInfo.isAnyFilled) {
          isAnyFilled = true;
        }

        if (!childFilledInfo.isAllFilled) {
          isAllFilled = false;
        }

        if (isAnyFilled && isAllFilled === false) {
          break;
        }
      }

      return { isAllFilled, isAnyFilled };
    }

    if (!CanvasElements.fillableElems.includes(elem.tagName)) {
      return {
        isAllFilled: false,
        isAnyFilled: false,
      };
    }

    const isFilled = Number.parseFloat(elem.getAttribute('fill-opacity')) !== 0 && $(elem).attr('fill') !== 'none';

    return {
      isAllFilled: isFilled,
      isAnyFilled: isFilled,
    };
  };

  this.setElemsFill = function (elems: Element[]) {
    const batchCmd = new history.BatchCommand('set elems fill');

    for (let i = 0; i < elems.length; ++i) {
      const elem = elems[i];

      if (elem == null) {
        break;
      }

      if (CanvasElements.fillableElems.includes(elem.tagName)) {
        if (this.calcElemFilledInfo(elem).isAllFilled) {
          continue;
        }

        const color = $(elem).attr('stroke') || '#333';
        const cmd = this.setElementFill(elem, color);

        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      } else if (elem.tagName === 'g') {
        this.setElemsFill(elem.childNodes);
      } else {
        console.log(`Not support type: ${elem.tagName}`);
      }
    }

    if (TutorialController.getNextStepRequirement() === TutorialConstants.INFILL) {
      TutorialController.handleNextStep();
    }

    if (!batchCmd.isEmpty()) addCommandToHistory(batchCmd);
  };

  this.setElementFill = function (elem, color) {
    const batchCmd = new history.BatchCommand('set elem fill');
    let cmd;

    canvas.undoMgr.beginUndoableChange('fill', [elem]);
    elem.setAttribute('fill', color);
    cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    canvas.undoMgr.beginUndoableChange('fill-opacity', [elem]);
    elem.setAttribute('fill-opacity', 1);
    cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    return batchCmd;
  };

  this.setElemsUnfill = function (elems: Element[]) {
    const batchCmd = new history.BatchCommand('set elems unfill');

    for (let i = 0; i < elems.length; ++i) {
      const elem = elems[i];

      if (elem == null) {
        break;
      }

      if (CanvasElements.fillableElems.includes(elem.tagName)) {
        if (!this.calcElemFilledInfo(elem).isAnyFilled) {
          continue;
        }

        const color = $(elem).attr('fill') || '#333';
        const cmd = this.setElementUnfill(elem, color);

        if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      } else if (elem.tagName === 'g') {
        this.setElemsUnfill(elem.childNodes);
      } else {
        console.log(`Not support type: ${elem.tagName}`);
      }
    }

    if (!batchCmd.isEmpty()) addCommandToHistory(batchCmd);
  };

  this.setElementUnfill = function (elem, color) {
    const batchCmd = new history.BatchCommand('set elem unfill');
    let cmd;

    canvas.undoMgr.beginUndoableChange('stroke', [elem]);
    elem.setAttribute('stroke', color);
    cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    canvas.undoMgr.beginUndoableChange('fill-opacity', [elem]);
    elem.setAttribute('fill-opacity', 0);
    cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    canvas.undoMgr.beginUndoableChange('fill', [elem]);
    elem.setAttribute('fill', 'none');
    cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);

    return batchCmd;
  };

  /**
   * Function: convertToPath
   * Convert selected element to a path.
   *
   * Parameters:
   * elem - The DOM element to be converted
   * isSubCmd - Boolean indicating whether the call is part of a further operation
   *
   * Returns:
   * path - path element
   * cmd - history command
   */
  this.convertToPath = (elem: Element, isSubCmd = false) => {
    // TODO: Why is this applying attributes from cur_shape, then inside utilities.convertToPath it's pulling addition attributes from elem?
    // TODO: If convertToPath is called with one elem, cur_shape and elem are probably the same; but calling with multiple is a bug or cool feature.
    const attrs = {
      fill: elem.getAttribute('fill'),
      'fill-opacity': elem.getAttribute('fill-opacity'),
      opacity: cur_shape.opacity,
      stroke: elem.getAttribute('stroke'),
      'stroke-dasharray': cur_shape.stroke_dasharray,
      'stroke-linecap': cur_shape.stroke_linecap,
      'stroke-linejoin': cur_shape.stroke_linejoin,
      'stroke-opacity': cur_shape.stroke_opacity,
      'stroke-width': elem.getAttribute('stroke-width') || 1,
    };
    const { cmd, path } = svgedit.utilities.convertToPath(
      elem,
      attrs,
      addSvgElementFromJson,
      pathActions,
      svgedit.history,
    );

    if (path) {
      if (selectedElements.includes(elem)) selectOnly([path]);

      if (cmd && !cmd.isEmpty() && !isSubCmd) {
        addCommandToHistory(cmd);

        return { cmd, path };
      }
    }

    return { cmd, path };
  };

  /**
   * Function: getConvertedPathBBox
   * The BBox of an element-as-path
   *
   * Parameters:
   * elem - The DOM element to be converted to path and getting bbox from.
   *
   * Returns:
   * The path's bounding box object
   */
  this.getConvertedPathBBox = (elem: Element) =>
    svgedit.utilities.getBBoxOfElementAsPath(elem, addSvgElementFromJson, pathActions);

  // Function: changeSelectedAttributeNoUndo
  // This function makes the changes to the elements. It does not add the change
  // to the history stack.
  //
  // Parameters:
  // attr - String with the attribute name
  // newValue - String or number with the new attribute value
  // elems - The DOM elements to apply the change to
  var changeSelectedAttributeNoUndo = (this.changeSelectedAttributeNoUndo = function (attr, newValue, elems?) {
    if (getMouseMode() === 'pathedit') {
      // Editing node
      pathActions.moveNode(attr, newValue);
    }

    elems = elems || selectedElements;

    var i = elems.length;
    var no_xy_elems = ['g', 'polyline', 'path', 'polygon'];
    var good_g_attrs = ['transform', 'opacity', 'filter'];

    while (i--) {
      var elem = elems[i];

      if (elem == null) {
        continue;
      }

      // Set x,y vals on elements that don't have them
      if ((attr === 'x' || attr === 'y') && no_xy_elems.includes(elem.tagName)) {
        const bbox = getStrokedBBox([elem]);
        const diffX = attr === 'x' ? newValue - bbox.x : 0;
        const diffY = attr === 'y' ? newValue - bbox.y : 0;
        const zoom = workareaManager.zoomRatio;

        moveSelectedElements(diffX * zoom, diffY * zoom, true);
        continue;
      }

      var oldval = attr === '#text' ? elem.textContent : elem.getAttribute(attr);

      if (oldval == null) {
        oldval = '';
      }

      if (oldval !== String(newValue)) {
        if (attr === '#text') {
          var old_w = svgedit.utilities.getBBox(elem).width;

          elem.textContent = newValue;

          // FF bug occurs on on rotated elements
          if (/rotate/.test(elem.getAttribute('transform'))) {
            elem = ffClone(elem);
          }

          // Hoped to solve the issue of moving text with text-anchor="start",
          // but this doesn't actually fix it. Hopefully on the right track, though. -Fyrd

          //					var box=getBBox(elem), left=box.x, top=box.y, width=box.width,
          //						height=box.height, dx = width - old_w, dy=0;
          //					var angle = svgedit.utilities.getRotationAngle(elem, true);
          //					if (angle) {
          //						var r = Math.sqrt( dx*dx + dy*dy );
          //						var theta = Math.atan2(dy,dx) - angle;
          //						dx = r * Math.cos(theta);
          //						dy = r * Math.sin(theta);
          //
          //						elem.setAttribute('x', elem.getAttribute('x')-dx);
          //						elem.setAttribute('y', elem.getAttribute('y')-dy);
          //					}
        } else if (attr === '#href') {
          setHref(elem, newValue);
        } else {
          elem.setAttribute(attr, newValue);
        }

        // Go into "select" mode for text changes
        // NOTE: Important that this happens AFTER elem.setAttribute() or else attributes like
        // font-size can get reset to their old value, ultimately by svgEditor.updateContextPanel(),
        // after calling textActions.toSelectMode() below
        if (getMouseMode() === 'textedit' && attr !== '#text' && elem.textContent.length) {
          textActions.toSelectMode(elem);
        }

        //			if (i==0)
        //				selectedBBoxes[0] = svgedit.utilities.getBBox(elem);
        // Use the Firefox ffClone hack for text elements with gradients or
        // where other text attributes are changed.
        if (svgedit.browser.isGecko() && elem.nodeName === 'text' && /rotate/.test(elem.getAttribute('transform'))) {
          if (
            String(newValue).indexOf('url') === 0 ||
            (['font-family', 'font-size', 'x', 'y'].includes(attr) && elem.textContent)
          ) {
            elem = ffClone(elem);
          }
        }

        // Timeout needed for Opera & Firefox
        // codedread: it is now possible for this function to be called with elements
        // that are not in the selectedElements array, we need to only request a
        // selector if the element is in that array
        if (selectedElements.includes(elem)) {
          setTimeout(() => {
            // Due to element replacement, this element may no longer
            // be part of the DOM
            if (!elem.parentNode) {
              return;
            }

            if (selectedElements.includes(elem)) {
              selectorManager.requestSelector(elem).resize();
            } else {
              selectorManager.releaseSelector(elem);
            }
          }, 0);
        }

        // if this element was rotated, and we changed the position of this element
        // we need to update the rotational transform attribute
        var angle = svgedit.utilities.getRotationAngle(elem);

        if (angle != 0 && attr !== 'transform') {
          var tlist = svgedit.transformlist.getTransformList(elem);
          var n = tlist.numberOfItems;

          while (n--) {
            var xform = tlist.getItem(n);

            if (String(xform.type) === '4') {
              // remove old rotate
              tlist.removeItem(n);

              var box = svgedit.utilities.getBBox(elem);
              var center = svgedit.math.transformPoint(
                box.x + box.width / 2,
                box.y + box.height / 2,
                svgedit.math.transformListToTransform(tlist).matrix,
              );
              var cx = center.x;
              var cy = center.y;
              var newrot = svgroot.createSVGTransform();

              newrot.setRotate(angle, cx, cy);
              tlist.insertItemBefore(newrot, n);
              break;
            }
          }
        }
      } // if oldValue != newValue
    } // for each elem
  });

  // Function: changeSelectedAttribute
  // Change the given/selected element and add the original value to the history stack
  // If you want to change all selectedElements, ignore the elems argument.
  // If you want to change only a subset of selectedElements, then send the
  // subset to this function in the elems argument.
  //
  // Parameters:
  // attr - String with the attribute name
  // newValue - String or number with the new attribute value
  // elems - The DOM elements to apply the change to
  var changeSelectedAttribute = (this.changeSelectedAttribute = function (attr, val, elems?) {
    elems = elems || selectedElements;
    canvas.undoMgr.beginUndoableChange(attr, elems);

    var i = elems.length;

    changeSelectedAttributeNoUndo(attr, val, elems);

    var batchCmd = canvas.undoMgr.finishUndoableChange();

    if (!batchCmd.isEmpty()) {
      addCommandToHistory(batchCmd);
    }
  });

  this.updateRecentFiles = (filePath: string) => {
    const recentFiles = storage.get('recent_files') || [];
    const i = recentFiles.indexOf(filePath);

    if (i > 0) {
      recentFiles.splice(i, 1);
      recentFiles.unshift(filePath);
    } else if (i < 0) {
      const l = recentFiles.unshift(filePath);

      if (l > 10) {
        recentFiles.pop();
      }
    }

    storage.set('recent_files', recentFiles);
    recentMenuUpdater.update();
  };

  this.simplifyPath = (elems?: Element[]) => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const batchCmd = new history.BatchCommand('Simplify Path');

    elems = elems || [...selectedElements];
    elems.forEach((elem) => {
      if (elem?.tagName !== 'path') return;

      const originD = elem.getAttribute('d')!;
      const d = pathActions.simplifyPath(elem);

      elem.setAttribute('d', d);
      batchCmd.addSubCommand(new history.ChangeElementCommand(elem, { d: originD }));
      console.log('Path compressed', (d.length / originD.length).toFixed(3));
    });

    addCommandToHistory(batchCmd);
    this.multiSelect(elems);

    return batchCmd;
  };

  this.decomposePath = (elems) => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const allNewPaths = [];
    const batchCmd = new history.BatchCommand('Decompose Image');

    elems = elems || selectedElements;
    elems.forEach((elem) => {
      if (!elem || elem.tagName !== 'path') {
        return;
      }

      const angle = svgedit.utilities.getRotationAngle(elem);

      this.setRotationAngle(0, true, elem);

      const dAbs: string = svgedit.utilities.convertPath(elem);
      const subPaths = dAbs.split('M').filter((d) => d.length);

      if (subPaths.length === 1) return;

      const newPaths: SVGPathElement[] = [];
      const layer = LayerHelper.getObjectLayer(elem)!.elem;
      const attrs = {
        fill: $(elem).attr('fill') || 'none',
        'fill-opacity': $(elem).attr('fill-opacity') || '0',
        stroke: $(elem).attr('stroke') || '#333333',
        'stroke-opacity': $(elem).attr('stroke-opacity') || '1',
        transform: $(elem).attr('transform') || '',
      };

      subPaths.forEach((d) => {
        const id = getNextId();
        const path = addSvgElementFromJson({
          attr: {
            ...attrs,
            d: `M${d}`,
            id,
            'vector-effect': 'non-scaling-stroke',
          },
          element: 'path',
        });

        layer.appendChild(path);
        newPaths.push(path);
        batchCmd.addSubCommand(new history.InsertElementCommand(path));
      });

      const parent = elem.parentNode;
      const nextSibling = elem.nextSibling;

      parent.removeChild(elem);
      batchCmd.addSubCommand(new history.RemoveElementCommand(elem, nextSibling, parent));

      if (newPaths.length > 0) {
        selectOnly(newPaths, false);

        const g = this.tempGroupSelectedElements();

        this.setRotationAngle(angle, true, g);
        allNewPaths.push(...newPaths);
      }
    });

    if (!batchCmd.isEmpty()) {
      addCommandToHistory(batchCmd);
    } else {
      Alert.popUpError({
        caption: 'Unable to decompose',
        message: 'The path contains only one sub-path.',
      });
    }

    if (allNewPaths.length > 0) {
      selectOnly(allNewPaths, false);
      this.tempGroupSelectedElements();
    }
  };

  this.clearAlignLines = () => {
    $('[id^="align_line"]').remove();
    $('[id^="align_text"]').remove();
  };

  const onAutoAlignChanged = () => {
    const { auto_align: value } = useGlobalPreferenceStore.getState();

    this.isAutoAlign = value;

    if (!this.isAutoAlign) {
      this.clearAlignLines();
    }
  };

  useGlobalPreferenceStore.subscribe((state) => state.auto_align, onAutoAlignChanged);

  this.toggleAutoAlign = () => {
    const { auto_align: value, set } = useGlobalPreferenceStore.getState();
    const newValue = !value;

    set('auto_align', newValue);

    return newValue;
  };

  this.drawAlignLine = function (tx: number, ty: number, x: IPoint | null, y: IPoint | null, index: number = 0) {
    const points: [number[], number[]] = [[], []];
    const stroke: Record<'nearest' | 'normal', string> = { nearest: '#F707F0', normal: '#1890EF' };

    WORKAREA_ALIGN_POINTS.forEach(({ x, y }) => {
      points[0].push(x);
      points[1].push(y);
    });

    const detectIfLineCoincide = (line: { x1: number; x2: number; y1: number; y2: number }) => {
      if (!line.x1 || !line.x2 || !line.y1 || !line.y2) return false;

      for (const line2 of alignEdges) {
        if (isLineCoincide(line, line2)) return true;
      }

      return false;
    };

    const draw = (by: 'x' | 'y') => {
      let alignLine = svgedit.utilities.getElem(`align_line_${by}_${index}`);
      let alignText = svgedit.utilities.getElem(`align_text_${by}_${index}`);
      const [major, minor] = by === 'x' ? [x, y] : [y, x];

      if (!major) return;

      const isCanvas = points[0].includes(major.x) && points[1].includes(major.y);
      const startPoints = by === 'x' ? [major.x, minor ? minor.y : ty] : [minor ? minor.x : tx, major.y];
      const line = { x1: startPoints[0], x2: major.x, y1: startPoints[1], y2: major.y };
      const needText = !isCanvas && index < 10 && !detectIfLineCoincide(line);

      alignLine = document.createElementNS(NS.SVG, 'path');
      alignText = document.createElementNS(NS.SVG, 'text');

      svgedit.utilities.getElem('svgcontent').appendChild(alignLine);
      svgedit.utilities.getElem('svgcontent').appendChild(alignText);

      svgedit.utilities.assignAttributes(alignLine, {
        fill: 'none',
        id: `align_line_${by}_${index}`,
        stroke: needText ? stroke.nearest : stroke.normal,
        'stroke-width': isCanvas ? '2' : '1',
        'vector-effect': 'non-scaling-stroke',
      });
      svgedit.utilities.assignAttributes(alignText, {
        fill: stroke.nearest,
        'font-family': 'Arial',
        'font-size': 20 / Math.sqrt(workareaManager.zoomRatio),
        id: `align_text_${by}_${index}`,
        stroke: stroke.nearest,
        'stroke-width': '1',
        'vector-effect': 'non-scaling-stroke',
      });

      const distance = Math.max(Math.abs(major.x - startPoints[0]), Math.abs(major.y - startPoints[1]));
      const offset = 5 / workareaManager.zoomRatio;

      alignLine.setAttribute('d', `M ${major.x} ${major.y} L ${startPoints[0]} ${startPoints[1]}`);
      alignLine.setAttribute('display', 'inline');

      alignText.setAttribute('x', (major.x + startPoints[0]) / 2 + (by === 'x' ? offset : -2 * offset));
      alignText.setAttribute('y', (major.y + startPoints[1]) / 2 + (by === 'y' ? -offset : 0));

      if (distance < 10 || !needText) {
        alignText.setAttribute('display', 'none');
      } else {
        textEdit.renderText(
          alignText,
          round(Math.max(Math.abs(major.x - startPoints[0]), Math.abs(major.y - startPoints[1])) / 10, 2).toString(),
        );
      }
    };

    draw('x');
    draw('y');
  };

  this.findMatchedAlignPoints = function (x: number, y: number) {
    // for consistent align experience
    const FUZZY_RANGE = 8 / workareaManager.zoomRatio;

    // if no alignPoints, return null
    if (!alignPoints.x.length) return { farthest: { x: null, y: null }, nearest: { x: null, y: null } };

    const [nearestX, farthestX] = findNearestAndFarthestAlignPoints(alignPoints, { x, y }, 'x', FUZZY_RANGE);
    const [nearestY, farthestY] = findNearestAndFarthestAlignPoints(alignPoints, { x, y }, 'y', FUZZY_RANGE);

    return {
      farthest: { x: farthestX, y: farthestY },
      nearest: { x: nearestX, y: nearestY },
    };
  };

  this.collectAlignPoints = () => {
    const elements = Array.of<SVGGraphicsElement>();
    const layers: Element[] = $('#svgcontent > g.layer').toArray();

    for (const layer of layers) {
      if (layer?.getAttribute('display') === 'none' || !layer?.childNodes.length) continue;

      elements.push(...(layer.childNodes as unknown as SVGGraphicsElement[]));
    }

    const unSelectedElements = elements.filter((elem) => !selectedElements.includes(elem));
    const unFlatedPoints = unSelectedElements.map((elem) => getElemAlignPoints(elem));
    const edges = unFlatedPoints
      .filter(({ length }) => length === 8)
      .flatMap((points) => {
        const [{ x: sx, y: sy }, { x: ex, y: ey }] = [points[0], points[7]];

        return [
          { x1: sx, x2: ex, y1: sy, y2: sy },
          { x1: sx, x2: sx, y1: sy, y2: ey },
          { x1: ex, x2: ex, y1: sy, y2: ey },
          { x1: sx, x2: ex, y1: ey, y2: ey },
        ];
      });
    const points = unFlatedPoints.flat();

    WORKAREA_ALIGN_POINTS.forEach((point) => {
      points.push(point);
    });

    alignPoints.x = points.toSorted((a, b) => a.x - b.x);
    alignPoints.y = points.toSorted((a, b) => a.y - b.y);
    alignEdges = edges;
  };

  this.addAlignEdges = (edges: Array<{ x1: number; x2: number; y1: number; y2: number }>) => {
    alignEdges.push(...edges);
  };

  this.removeAlignEdges = (n: number) => {
    for (let i = 0; i < n; i++) {
      alignEdges.pop();
    }
  };

  this.getSelectedElementsAlignPoints = () =>
    selectedElements.flatMap((elem) => getElemAlignPoints(elem as SVGGraphicsElement));

  this.addAlignPoint = function (x: number, y: number) {
    const { length } = alignPoints.x;
    const newPoint = { x, y };
    const insertToAlignPoints = (points: IPoint[], newPoint: IPoint, dimension: 'x' | 'y') => {
      const pos = binarySearchLowerBoundIndex(
        points.map((point) => point[dimension]),
        newPoint[dimension],
      );

      if (pos === length - 1 && newPoint[dimension] > points[pos]?.[dimension]) {
        points.push(newPoint);
      } else {
        points.splice(pos, 0, newPoint);
      }
    };

    insertToAlignPoints(alignPoints.x, newPoint, 'x');
    insertToAlignPoints(alignPoints.y, newPoint, 'y');
  };

  const getElemAlignPoints = (elem: SVGGraphicsElement): Array<{ x: number; y: number }> => {
    const { tagName } = elem;
    const angle: number = svgedit.utilities.getRotationAngle(elem, true);

    if (!CanvasElements.visibleElems.includes(tagName) || angle) return [];

    const bbox = ['text', 'use'].includes(elem.tagName) ? this.getSvgRealLocation(elem) : elem.getBBox();
    const getPoints = (bbox: DOMRect) => {
      const points = Array.of<IPoint>();
      const levels = [0, 0.5, 1] as const;

      for (const col of levels) {
        for (const row of levels) {
          // skip center point
          if (col === 0.5 && row === 0.5) continue;

          points.push({ x: bbox.x + row * bbox.width, y: bbox.y + col * bbox.height });
        }
      }

      return points;
    };

    return getPoints(bbox);
  };

  this.groupSelectedElements = (isSubCmd = false): void | { command: BaseHistoryCommand; group: SVGGElement } => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    if (selectedElements.length < 1) return;

    if (selectedElements.length === 1 && selectedElements[0].tagName === 'g') return;

    const cmd_str = 'Group Elements';
    const batchCmd = new history.BatchCommand(cmd_str);

    const layerNames = [];

    for (let i = 0; i < selectedElements.length; i++) {
      let elem = selectedElements[i] as any;

      if (elem.parentNode.tagName === 'a' && elem.parentNode.childNodes.length === 1) {
        elem = elem.parentNode;
      }

      const layer = LayerHelper.getObjectLayer(elem);

      if (layer) {
        const { title } = layer;

        layerNames.push(title);
        elem.setAttribute('data-original-layer', title);
      }
    }

    if (layerNames.length > 0) {
      const sortedLayerNames = LayerHelper.sortLayerNamesByPosition([...new Set(layerNames)]);
      const topLayer = sortedLayerNames[sortedLayerNames.length - 1];

      layerManager.setCurrentLayer(topLayer);
    }

    // create and insert the group element
    const group = addSvgElementFromJson({ attr: { 'data-ratiofixed': true, id: getNextId() }, element: 'g' });

    batchCmd.addSubCommand(new history.InsertElementCommand(group));

    for (let i = 0; i < selectedElements.length; i++) {
      let elem = selectedElements[i] as any;

      if (elem.parentNode.tagName === 'a' && elem.parentNode.childNodes.length === 1) {
        elem = elem.parentNode;
      }

      const { nextSibling, parentNode } = elem;

      group.appendChild(elem);
      batchCmd.addSubCommand(new history.MoveElementCommand(elem, nextSibling, parentNode));
    }

    if (!batchCmd.isEmpty() && !isSubCmd) addCommandToHistory(batchCmd);

    updateElementColor(group);

    // update selection
    selectOnly([group], true);

    return { command: batchCmd, group };
  };

  // Function: pushGroupProperties
  // Pushes all appropriate parent group properties down to its children, then
  // removes them from the group
  var pushGroupProperties = (this.pushGroupProperties = function (g, undoable) {
    const origTransform = startTransform;
    var children = g.childNodes;
    var len = children.length;
    var xform = g.getAttribute('transform');

    const glist = svgedit.transformlist.getTransformList(g);
    const m = svgedit.math.transformListToTransform(glist).matrix;
    const batchCmd = new history.BatchCommand('Push group properties');

    // TODO: get all fill/stroke properties from the group that we are about to destroy
    // "fill", "fill-opacity", "fill-rule", "stroke", "stroke-dasharray", "stroke-dashoffset",
    // "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity",
    // "stroke-width"
    // and then for each child, if they do not have the attribute (or the value is 'inherit')
    // then set the child's attribute

    var i = 0;
    var gangle = svgedit.utilities.getRotationAngle(g);

    var gattrs: { [key: string]: any } = $(g).attr(['filter', 'opacity']);
    var gfilter;
    var gblur;
    var changes;
    var drawing = getCurrentDrawing();

    for (i = 0; i < len; i++) {
      var elem = children[i];

      if (elem.nodeType !== 1) {
        continue;
      }

      if (gattrs.opacity !== null && gattrs.opacity !== 1) {
        var c_opac = elem.getAttribute('opacity') || 1;
        var new_opac = Math.round((elem.getAttribute('opacity') || 1) * gattrs.opacity * 100) / 100;

        changeSelectedAttribute('opacity', new_opac, [elem]);
      }

      if (gattrs.filter) {
        var cblur = this.getBlur(elem);
        var orig_cblur = cblur;

        if (!gblur) {
          gblur = this.getBlur(g);
        }

        if (cblur) {
          // Is this formula correct?
          cblur = Number(gblur) + Number(cblur);
        } else if (cblur === 0) {
          cblur = gblur;
        }

        // If child has no current filter, get group's filter or clone it.
        if (!orig_cblur) {
          // Set group's filter to use first child's ID
          if (!gfilter) {
            gfilter = svgedit.utilities.getRefElem(gattrs.filter);
          } else {
            // Clone the group's filter
            gfilter = drawing.copyElem(gfilter);
            findDefs().appendChild(gfilter);
          }
        } else {
          gfilter = svgedit.utilities.getRefElem(elem.getAttribute('filter'));
        }

        // Change this in future for different filters
        var suffix = gfilter.firstChild.tagName === 'feGaussianBlur' ? 'blur' : 'filter';

        gfilter.id = elem.id + '_' + suffix;
        changeSelectedAttribute('filter', 'url(#' + gfilter.id + ')', [elem]);

        // Update blur value
        if (cblur) {
          changeSelectedAttribute('stdDeviation', cblur, [gfilter.firstChild]);
          canvas.setBlurOffsets(gfilter, cblur);
        }
      }

      startTransform = elem.getAttribute('transform');

      var chtlist = svgedit.transformlist.getTransformList(elem);

      // Don't process gradient transforms
      if (~elem.tagName.indexOf('Gradient')) {
        chtlist = null;
      }

      // Hopefully not a problem to add this. Necessary for elements like <desc/>
      if (!chtlist) {
        continue;
      }

      // Apparently <defs> can get get a transformlist, but we don't want it to have one!
      if (elem.tagName === 'defs') {
        continue;
      }

      if (glist.numberOfItems) {
        // TODO: if the group's transform is just a rotate, we can always transfer the
        // rotate() down to the children (collapsing consecutive rotates and factoring
        // out any translates)
        if (gangle && glist.numberOfItems === 1) {
          // [Rg] [Rc] [Mc]
          // we want [Tr] [Rc2] [Mc] where:
          //	- [Rc2] is at the child's current center but has the
          // sum of the group and child's rotation angles
          //	- [Tr] is the equivalent translation that this child
          // undergoes if the group wasn't there

          // [Tr] = [Rg] [Rc] [Rc2_inv]

          // get group's rotation matrix (Rg)
          var rgm = glist.getItem(0).matrix;

          // get child's rotation matrix (Rc)
          var rcm = svgroot.createSVGMatrix();
          var cangle = svgedit.utilities.getRotationAngle(elem);

          if (cangle) {
            rcm = chtlist.getItem(0).matrix;
          }

          // get child's old center of rotation
          var cbox = svgedit.utilities.getBBox(elem);
          var ceqm = svgedit.math.transformListToTransform(chtlist).matrix;
          var coldc = svgedit.math.transformPoint(cbox.x + cbox.width / 2, cbox.y + cbox.height / 2, ceqm);

          // sum group and child's angles
          var sangle = (gangle + cangle) % 360;

          if (sangle > 180) {
            sangle -= 360;
          } else if (sangle < -180) {
            sangle += 360;
          }

          // get child's rotation at the old center (Rc2_inv)
          var r2 = svgroot.createSVGTransform();

          r2.setRotate(sangle, coldc.x, coldc.y);

          // calculate equivalent translate
          var trm = svgedit.math.matrixMultiply(rgm, rcm, r2.matrix.inverse());

          // set up tlist
          if (cangle) {
            chtlist.removeItem(0);
          }

          if (sangle) {
            if (chtlist.numberOfItems) {
              chtlist.insertItemBefore(r2, 0);
            } else {
              chtlist.appendItem(r2);
            }
          }

          if (trm.e || trm.f) {
            var tr = svgroot.createSVGTransform();

            tr.setTranslate(trm.e, trm.f);

            if (chtlist.numberOfItems) {
              chtlist.insertItemBefore(tr, 0);
            } else {
              chtlist.appendItem(tr);
            }
          }
        } else {
          // more complicated than just a rotate

          // transfer the group's transform down to each child and then
          // call svgedit.recalculate.recalculateDimensions()
          var oldxform = elem.getAttribute('transform');

          changes = {};
          changes.transform = oldxform || '';

          var newxform = svgroot.createSVGTransform();

          // [ gm ] [ chm ] = [ chm ] [ gm' ]
          // [ gm' ] = [ chm_inv ] [ gm ] [ chm ]
          var chm = svgedit.math.transformListToTransform(chtlist).matrix;
          var chm_inv = chm.inverse();
          var gm = svgedit.math.matrixMultiply(chm_inv, m, chm);

          newxform.setMatrix(gm);
          chtlist.appendItem(newxform);
        }

        var cmd = svgedit.recalculate.recalculateDimensions(elem);

        if (cmd && !cmd.isEmpty()) {
          batchCmd.addSubCommand(cmd);
        }
      }
    }
    startTransform = origTransform;

    // remove transform and make it undo-able
    if (xform) {
      changes = {};
      changes.transform = xform;
      g.setAttribute('transform', '');
      g.removeAttribute('transform');
      svgedit.transformlist.removeElementFromListMap(g);
      batchCmd.addSubCommand(new history.ChangeElementCommand(g, changes));
    }

    if (undoable && !batchCmd.isEmpty()) {
      return batchCmd;
    }
  });

  // Function: ungroupSelectedElement
  // Unwraps all the elements in a selected group (g) element. This requires
  // significant recalculations to apply group's transforms, etc to its children
  this.ungroupSelectedElement = (isSubCmd = false) => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    var g = selectedElements[0];

    if (!g) {
      return;
    }

    if (g.tagName === 'use') {
      disassembleUse([g]);

      return;
    }

    var parents_a = $(g).parents('a');

    if (parents_a.length) {
      g = parents_a[0];
    }

    const res = ungroupElement(g);

    if (res) {
      const { batchCmd, children } = res;

      clearSelection();
      addToSelection(children);
      this.tempGroupSelectedElements();

      if (!batchCmd.isEmpty() && !isSubCmd) addCommandToHistory(batchCmd);

      return res;
    }
  };

  this.tempGroupSelectedElements = function () {
    if (selectedElements.length <= 1) {
      return selectedElements;
    }

    const hasAlreadyTempGroup = selectedElements[0].getAttribute('data-tempgroup');
    let g;

    if (hasAlreadyTempGroup) {
      g = selectedElements[0];
    } else {
      // create and insert the group element
      g = addSvgElementFromJson({
        attr: { 'data-ratiofixed': true, 'data-tempgroup': true, id: getNextId() },
        element: 'g',
      });

      // Move to direct under svgcontent to avoid group under invisible layer
      const svgcontent = document.getElementById('svgcontent');

      svgcontent.appendChild(g);
    }

    // now move all children into the group
    const len = selectedElements.length;

    for (let i = 0; i < len; i++) {
      if (hasAlreadyTempGroup && i === 0) {
        continue;
      }

      let elem = selectedElements[i];

      if (elem == null) {
        continue;
      }

      if (elem.parentNode && elem.parentNode.tagName === 'a' && elem.parentNode.childNodes.length === 1) {
        elem = elem.parentNode;
      }

      if (elem === tempGroup || elem.getAttribute('data-tempgroup') === 'true') {
        while (elem.childNodes.length > 0) {
          g.appendChild(elem.childNodes[0]);
        }

        elem.remove();
      } else {
        const originalLayer = LayerHelper.getObjectLayer(elem);

        if (originalLayer && originalLayer.title) {
          const title = originalLayer.title;

          $(elem).attr('data-original-layer', title);

          if (elem.nextSibling) {
            $(elem).attr('data-next-sibling', elem.nextSibling.id);
          }
        }

        g.appendChild(elem);
      }

      if (['image', 'use'].includes(elem.tagName)) {
        const imageBorder = svgdoc.createElementNS(NS.SVG, 'rect');

        if (elem.tagName === 'image') {
          svgedit.utilities.assignAttributes(imageBorder, {
            height: elem.getAttribute('height'),
            transform: elem.getAttribute('transform') || '',
            width: elem.getAttribute('width'),
            x: elem.getAttribute('x') || 0,
            y: elem.getAttribute('y') || 0,
          });
        } else if (elem.tagName === 'use') {
          const realLocation = this.getUseElementLocationBeforeTransform(elem);

          svgedit.utilities.assignAttributes(imageBorder, {
            height: realLocation.height,
            transform: elem.getAttribute('transform') || '',
            width: realLocation.width,
            x: realLocation.x,
            y: realLocation.y,
          });
        }

        svgedit.utilities.assignAttributes(imageBorder, {
          'data-imageborder': true,
          fill: 'none',
          stroke: 'none',
          style: 'pointer-events:none',
          'vector-effect': 'non-scaling-stroke',
        });

        g.appendChild(imageBorder);
      }
    }

    if (hasAlreadyTempGroup) {
      tempGroup = null;
    }

    // update selection
    const layers = selectedElements
      .flatMap((elem) =>
        elem.getAttribute('data-tempgroup') === 'true' ? selectedLayers : LayerHelper.getObjectLayer(elem)?.title,
      )
      .filter(Boolean);

    // set the newst added layer as currentLayer
    layerManager.setCurrentLayer(layers[0]);
    // the uniq process is performed `here` to avoid duplicate layer in layer panel,
    // and remain the selected layers contains information if there are multiple elements in same layer
    useLayerStore.getState().setSelectedLayers([...new Set(layers)]);

    selectedLayers = layers;

    selectOnly([g], true);
    tempGroup = g;

    console.log('temp group created');

    return g;
  };

  /**
   * remove elemt from temp group
   * @param {Element} elem element to remove
   */
  this.removeFromTempGroup = (elem: Element) => {
    if (!tempGroup || !tempGroup.contains(elem)) {
      return;
    }

    const originalLayerName = elem.getAttribute('data-original-layer')!;
    const originalLayer = layerManager.getLayerElementByName(originalLayerName);
    const currentLayer = layerManager.getCurrentLayerElement()!;
    const targetLayer = originalLayer || currentLayer;

    // explicitly remove one element from the temp group layers
    const idx = selectedLayers.indexOf(originalLayerName);

    if (idx >= 0) {
      selectedLayers.splice(idx, 1);
    }

    // set the current layer from the remaining layers
    layerManager.setCurrentLayer(selectedLayers[0]);
    useLayerStore.getState().setSelectedLayers([...new Set(selectedLayers)]);

    if (elem.nextSibling && (elem.nextSibling as Element).getAttribute('data-imageborder') === 'true') {
      elem.nextSibling.remove();
    }

    let nextSiblingId = elem.getAttribute('data-next-sibling');

    if (nextSiblingId) {
      nextSiblingId = nextSiblingId.replace('#', '\\#');

      const nextSibling = targetLayer.querySelector(`#${nextSiblingId}`);

      if (nextSibling) {
        targetLayer.insertBefore(elem, nextSibling);
      } else {
        targetLayer.appendChild(elem);
      }

      elem.removeAttribute('data-next-sibling');
    } else {
      targetLayer.appendChild(elem);
    }

    updateElementColor(elem);

    if (tempGroup.childNodes.length > 1) {
      selectorManager.requestSelector(tempGroup).resize();
      svgEditor.updateContextPanel();
    } else if (tempGroup.childNodes.length === 1) {
      const lastElem = tempGroup.firstChild;

      this.ungroupTempGroup();
      this.selectOnly([lastElem], true);
    } else {
      console.warn('Removing last child from temp group. This should not happen, should find out why');
      this.ungroupTempGroup();
    }
  };

  this.ungroupAllTempGroup = function () {
    const allTempGroups = Array.from(document.querySelectorAll('[data-tempgroup="true"]'));

    allTempGroups.forEach((g) => {
      this.ungroupTempGroup(g);
    });
  };

  // Function: ungroupTempGroup
  // Unwraps all the elements in a selected group (g) element. This requires
  // significant recalculations to apply group's transforms, etc to its children
  this.ungroupTempGroup = function (elem = null) {
    let g = elem || selectedElements[0] || tempGroup;

    if (!g) {
      return;
    }

    // Look for parent "a"
    if (g.tagName === 'g' || g.tagName === 'a') {
      const batchCmd = new history.BatchCommand('Ungroup Temp Group');
      const cmd = pushGroupProperties(g, true);

      if (cmd) {
        batchCmd.addSubCommand(cmd);
      }

      var parent = g.parentNode;
      var children = Array.from({ length: g.childNodes.length });

      var i = 0;

      while (g.lastChild) {
        const elem = g.lastChild as Element;
        var oldParent = elem.parentNode;

        if (elem.getAttribute('data-imageborder') === 'true') {
          elem.remove();
          continue;
        }

        // Remove child title elements
        if (elem.tagName === 'title') {
          oldParent!.removeChild(elem);
          continue;
        }

        const originalLayer = layerManager.getLayerElementByName(elem.getAttribute('data-original-layer')!);
        const currentLayer = layerManager.getCurrentLayerElement()!;
        const targetLayer = originalLayer || currentLayer;
        let nextSiblingId = elem.getAttribute('data-next-sibling');

        if (nextSiblingId) {
          nextSiblingId = nextSiblingId.replace('#', '\\#');

          const nextSibling = targetLayer.querySelector(`#${nextSiblingId}`);

          if (nextSibling) {
            targetLayer.insertBefore(elem, nextSibling);
          } else {
            targetLayer.appendChild(elem);
          }

          elem.removeAttribute('data-next-sibling');
        } else {
          targetLayer.appendChild(elem);
        }

        updateElementColor(elem as SVGElement);

        children[i++] = elem;
      }

      if (!batchCmd.isEmpty()) {
        addCommandToHistory(batchCmd);
      }

      tempGroup = null;
      g = parent.removeChild(g);
      // remove the group from the selection
      clearSelection();
    }

    return children;
  };

  this.getTempGroup = () => tempGroup;

  // Function: moveUpSelectedElement
  // Move selected element up in layer
  this.moveUpSelectedElement = function () {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const selected = selectedElements[0];

    if (selected != null) {
      let t = selected;
      const oldParent = t.parentNode;
      const oldNextSibling = t.nextSibling;
      let nextSibling = t.nextSibling;

      if (nextSibling) {
        nextSibling = nextSibling.nextSibling;
        t = t.parentNode.insertBefore(t, nextSibling);

        // If the element actually moved position, add the command and fire the changed
        // event handler.
        if (oldNextSibling !== t.nextSibling) {
          addCommandToHistory(new history.MoveElementCommand(t, oldNextSibling, oldParent, 'up'));
          call('changed', [t]);
        }
      }
    }
  };

  // Function: moveDownSelectedElement
  // Move selected element back in layer
  this.moveDownSelectedElement = function () {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const selected = selectedElements[0];

    if (selected != null) {
      let t = selected;
      const oldParent = t.parentNode;
      const oldNextSibling = t.nextSibling;
      const prevSibling = t.previousSibling;

      if (prevSibling && !CanvasElements.defElems.includes(prevSibling.tagName)) {
        t = t.parentNode.insertBefore(t, prevSibling);

        // If the element actually moved position, add the command and fire the changed
        // event handler.
        if (oldNextSibling !== t.nextSibling) {
          addCommandToHistory(new history.MoveElementCommand(t, oldNextSibling, oldParent, 'down'));
          call('changed', [t]);
        }
      }
    }
  };

  // Function: moveTopBottomSelected
  // Moves the select element to the top or bottom in group
  //
  // Parameters:
  // dir - String that's either 'top' or 'bottom'
  this.moveTopBottomSelected = function (dir) {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    var selected = selectedElements[0];

    if (!selected) {
      return;
    }

    let t = selected;
    const oldParent = t.parentNode;
    const oldNextSibling = t.nextSibling;

    if (dir === 'bottom') {
      let firstChild = t.parentNode.firstChild;

      while (CanvasElements.defElems.includes(firstChild.tagName)) {
        firstChild = firstChild.nextSibling;
      }
      t = t.parentNode.insertBefore(t, firstChild);
    } else {
      t = t.parentNode.appendChild(t);
    }

    if (oldNextSibling !== t.nextSibling) {
      addCommandToHistory(new history.MoveElementCommand(t, oldNextSibling, oldParent, 'Move ' + dir));
      call('changed', [t]);
    }
  };

  this.moveSelectedElements = moveSelectedElements;

  this.moveElements = moveElements;

  this.getCenter = function (elem) {
    let centerX;
    let centerY;

    switch (elem.tagName) {
      case 'image':
      case 'rect':
        centerX = elem.x.baseVal.value + elem.width.baseVal.value / 2;
        centerY = elem.y.baseVal.value + elem.height.baseVal.value / 2;
        break;
      case 'line':
        centerX = (elem.x1.baseVal.value + elem.x2.baseVal.value) / 2;
        centerY = (elem.y1.baseVal.value + elem.y2.baseVal.value) / 2;
        break;
      case 'ellipse':
        centerX = elem.cx.baseVal.value;
        centerY = elem.cy.baseVal.value;
        break;
      case 'polygon':
      case 'path':
      case 'use':
      case 'text':
        const realLocation = this.getSvgRealLocation(elem);

        centerX = realLocation.x + realLocation.width / 2;
        centerY = realLocation.y + realLocation.height / 2;
        break;
      default:
        break;
    }

    return {
      x: centerX,
      y: centerY,
    };
  };

  this.distHori = (isSubCmd) => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const realSelectedElements = selectedElements.filter((e) => e);
    const len = realSelectedElements.length;

    if (len < 3) {
      this.tempGroupSelectedElements();

      return;
    }

    const batchCmd = new history.BatchCommand('Dist Hori');

    realSelectedElements.sort((a, b) => {
      const xa = this.getCenter(a).x;
      const xb = this.getCenter(b).x;

      return xa - xb;
    });

    const minX = this.getCenter(realSelectedElements[0]).x;
    const maxX = this.getCenter(realSelectedElements[len - 1]).x;

    if (maxX === minX) {
      this.tempGroupSelectedElements();

      return;
    }

    const dx = (maxX - minX) / (len - 1);

    for (let i = 1; i < len - 1; i++) {
      const x = this.getCenter(realSelectedElements[i]).x;
      const cmd = moveElements([minX + dx * i - x], [0], [realSelectedElements[i]], false);

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
    }

    if (!batchCmd.isEmpty() && !isSubCmd) {
      addCommandToHistory(batchCmd);
    }

    this.tempGroupSelectedElements();

    return batchCmd;
  };

  this.distVert = (isSubCmd) => {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const realSelectedElements = selectedElements.filter((e) => e);
    const len = realSelectedElements.length;

    if (len < 3) {
      this.tempGroupSelectedElements();

      return;
    }

    const batchCmd = new history.BatchCommand('Dist Verti');

    realSelectedElements.sort((a, b) => {
      const ya = this.getCenter(a).y;
      const yb = this.getCenter(b).y;

      return ya - yb;
    });

    const minY = this.getCenter(realSelectedElements[0]).y;
    const maxY = this.getCenter(realSelectedElements[len - 1]).y;

    if (maxY === minY) {
      this.tempGroupSelectedElements();

      return;
    }

    const dy = (maxY - minY) / (len - 1);

    for (let i = 1; i < len - 1; i++) {
      const y = this.getCenter(realSelectedElements[i]).y;
      const cmd = moveElements([0], [minY + dy * i - y], [realSelectedElements[i]], false);

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
    }

    if (!batchCmd.isEmpty() && !isSubCmd) {
      addCommandToHistory(batchCmd);
    }

    this.tempGroupSelectedElements();

    return batchCmd;
  };

  this.distEven = function () {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    const centerXs = [];
    const centerYs = [];
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    let indexMinX = -1;
    let indexMinY = -1;
    let indexMaxX = -1;
    let indexMaxY = -1;

    const realSelectedElements = selectedElements.filter((e) => e);
    const len = realSelectedElements.length;

    if (len < 3) {
      return;
    }

    for (let i = 0; i < len; i += 1) {
      if (realSelectedElements[i] == null) {
        console.error('distributing null');
        break;
      }

      const elem = realSelectedElements[i];

      const center = this.getCenter(elem);

      centerXs[i] = center.x;
      centerYs[i] = center.y;

      if (center.x < minX) {
        minX = center.x;
        indexMinX = i;
      }

      if (center.x > maxX) {
        maxX = center.x;
        indexMaxX = i;
      }

      if (center.y < minY) {
        minY = center.y;
        indexMinY = i;
      }

      if (center.y > maxY) {
        maxY = center.y;
        indexMaxY = i;
      }
    }

    if (indexMinX === indexMaxX && indexMinY === indexMaxY) {
      return;
    }

    const diffX = maxX - minX;
    const diffY = maxY - minY;

    let start = -1;
    let end = -1;

    if (diffX >= diffY) {
      start = indexMinX;
      end = indexMaxX;
    } else {
      start = indexMinY;
      end = indexMaxY;
    }

    const startX = centerXs[start];
    const startY = centerYs[start];
    const dx = (centerXs[end] - startX) / (len - 1);
    const dy = (centerYs[end] - startY) / (len - 1);
    let j = 1;

    for (let i = start + 1; i < len + start; i += 1) {
      if (i === end || i - len === end) {
        continue;
      }

      if (i < len) {
        this.moveElemPosition(startX + dx * j - centerXs[i], startY + dy * j - centerYs[i], realSelectedElements[i]);
      } else {
        this.moveElemPosition(
          startX + dx * j - centerXs[i - len],
          startY + dy * j - centerYs[i - len],
          realSelectedElements[i - len],
        );
      }

      j += 1;
    }
  };

  this.flipSelectedElements = async function (horizon = 1, vertical = 1) {
    let len = selectedElements.length;

    for (let i = 0; i < selectedElements.length; ++i) {
      if (!selectedElements[i]) {
        len = i;
        break;
      }
    }

    const batchCmd = new history.BatchCommand('Flip Elements');

    for (let i = 0; i < len; ++i) {
      const elem = selectedElements[i];
      let bbox;

      if (elem.tagName === 'use') {
        bbox = this.getSvgRealLocation(elem);
      } else {
        bbox = this.calculateTransformedBBox(elem);
      }

      const center = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
      const centers = [center];
      const flipPara = { horizon, vertical };

      startTransform = elem.getAttribute('transform'); // maybe not need

      let cmd;
      const stack: Array<{ elem?: Element; originalAngle?: number }> = [{ elem }];

      while (stack.length > 0) {
        const { elem: topElem, originalAngle } = stack.pop()!;

        if (topElem!.tagName !== 'g') {
          cmd = await this.flipElementWithRespectToCenter(topElem, centers[centers.length - 1], flipPara);

          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }
        } else if (originalAngle == null) {
          const angle = svgedit.utilities.getRotationAngle(topElem);

          if (angle !== 0) {
            canvas.undoMgr.beginUndoableChange('transform', [topElem]);
            canvas.setRotationAngle(0, true, topElem);
            cmd = canvas.undoMgr.finishUndoableChange();

            if (cmd && !cmd.isEmpty()) {
              batchCmd.addSubCommand(cmd);
            }

            stack.push({ elem: topElem, originalAngle: angle });
          }

          // if g has tlist, inverse to flip element inside
          const tlist = svgedit.transformlist.getTransformList(topElem);
          let { x, y } = centers[centers.length - 1];

          for (let j = 0; j < tlist.numberOfItems; j++) {
            const t = tlist.getItem(j);

            // type 4 does not matter
            if (t.type === 4) {
              continue;
            }

            const { a, b, c, d, e, f } = t.matrix;
            const delta = a * d - b * c;

            x = (d * x - c * y + c * f - d * e) / delta;
            y = (-b * x + a * y - a * f + b * e) / delta;
          }
          centers.push({ x, y });
          topElem.childNodes.forEach((e: Element) => {
            stack.push({ elem: e });
          });
        } else {
          centers.pop();
          canvas.setRotationAngle(-originalAngle, true, topElem);
        }
      }
      selectorManager.requestSelector(elem)?.resize();
      selectorManager.requestSelector(elem)?.show(len === 1);
      svgEditor.updateContextPanel();
    }
    addCommandToHistory(batchCmd);
  };

  this.flipElementWithRespectToCenter = async function (elem, center, flipPara) {
    const batchCmd = new history.BatchCommand('Flip Single Element');

    const angle = svgedit.utilities.getRotationAngle(elem);

    canvas.undoMgr.beginUndoableChange('transform', [elem]);
    canvas.setRotationAngle(0, true, elem);
    svgedit.recalculate.recalculateDimensions(elem);
    canvas.setRotationAngle(-angle, true, elem);

    let cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    let bbox;

    if (elem.tagName === 'use') {
      bbox = this.getSvgRealLocation(elem);
    } else {
      bbox = this.calculateTransformedBBox(elem);
    }

    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    const dx = flipPara.horizon < 0 ? 2 * (center.x - cx) : 0;
    const dy = flipPara.vertical < 0 ? 2 * (center.y - cy) : 0;
    const tlist = svgedit.transformlist.getTransformList(elem);

    if (elem.tagName !== 'image') {
      startTransform = elem.getAttribute('transform');

      const translateOrigin = svgroot.createSVGTransform();
      const scale = svgroot.createSVGTransform();
      const translateBack = svgroot.createSVGTransform();

      translateOrigin.setTranslate(-cx, -cy);
      scale.setScale(flipPara.horizon, flipPara.vertical);
      translateBack.setTranslate(cx, cy);

      const hasMatrix = svgedit.math.hasMatrixTransform(tlist);

      if (hasMatrix) {
        const pos = angle ? 1 : 0;

        tlist.insertItemBefore(translateOrigin, pos);
        tlist.insertItemBefore(scale, pos);
        tlist.insertItemBefore(translateBack, pos);
      } else {
        tlist.appendItem(translateBack);
        tlist.appendItem(scale);
        tlist.appendItem(translateOrigin);
      }

      cmd = svgedit.recalculate.recalculateDimensions(elem);
    } else {
      cmd = await this._flipImage(elem, flipPara.horizon, flipPara.vertical);
    }

    if (cmd && !cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    cmd = moveElements([dx], [dy], [elem], false);
    batchCmd.addSubCommand(cmd);

    return batchCmd;
  };

  this._flipImage = async function (image, horizon = 1, vertical = 1) {
    const batchCmd = new history.BatchCommand('Flip image');

    if (horizon === 1 && vertical === 1) {
      return;
    }

    let cmd;
    const origImage = $(image).attr('origImage');

    if (origImage) {
      let data: any = await jimpHelper.urlToImage(origImage);

      data.flip(horizon === -1, vertical === -1);
      data = await data.getBufferAsync(imageProcessor.MIME_PNG);
      data = new Blob([data]);

      const src = URL.createObjectURL(data);

      canvas.undoMgr.beginUndoableChange('origImage', [image]);
      image.setAttribute('origImage', src);
      cmd = canvas.undoMgr.finishUndoableChange();

      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
    }

    const flipCanvas = document.createElement('canvas');
    const flipContext = flipCanvas.getContext('2d');

    flipCanvas.width = Number(image.getAttribute('width'));
    flipCanvas.height = Number(image.getAttribute('height'));
    flipContext.translate(horizon < 0 ? flipCanvas.width : 0, vertical < 0 ? flipCanvas.height : 0);
    flipContext.scale(horizon, vertical);
    flipContext.drawImage(image, 0, 0, flipCanvas.width, flipCanvas.height);

    canvas.undoMgr.beginUndoableChange('xlink:href', [image]);
    image.setAttribute('xlink:href', flipCanvas.toDataURL());
    cmd = canvas.undoMgr.finishUndoableChange();

    if (cmd && !cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    return batchCmd;
  };

  // Function: alignSelectedElements
  // Aligns selected elements
  //
  // Parameters:
  // type - String with single character indicating the alignment type
  // relative_to - String that must be one of the following:
  // "selected", "largest", "smallest", "page"
  this.alignSelectedElements = function (type, relativeTo) {
    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    var i;
    var elem;
    var bboxes = [];
    var minx = Number.MAX_VALUE;
    var maxx = Number.MIN_VALUE;
    var miny = Number.MAX_VALUE;
    var maxy = Number.MIN_VALUE;
    var curwidth = Number.MIN_VALUE;
    var curheight = Number.MIN_VALUE;
    var len = selectedElements.length;

    if (!len) {
      return;
    }

    for (i = 0; i < len; ++i) {
      if (selectedElements[i] == null) {
        break;
      }

      elem = selectedElements[i];
      bboxes[i] = getStrokedBBox([elem]);

      // now bbox is axis-aligned and handles rotation
      switch (relativeTo) {
        case 'smallest':
          if (
            ((type === 'l' || type === 'c' || type === 'r') &&
              (curwidth === Number.MIN_VALUE || curwidth > bboxes[i].width)) ||
            ((type === 't' || type === 'm' || type === 'b') &&
              (curheight === Number.MIN_VALUE || curheight > bboxes[i].height))
          ) {
            minx = bboxes[i].x;
            miny = bboxes[i].y;
            maxx = bboxes[i].x + bboxes[i].width;
            maxy = bboxes[i].y + bboxes[i].height;
            curwidth = bboxes[i].width;
            curheight = bboxes[i].height;
          }

          break;
        case 'largest':
          if (
            ((type === 'l' || type === 'c' || type === 'r') &&
              (curwidth === Number.MIN_VALUE || curwidth < bboxes[i].width)) ||
            ((type === 't' || type === 'm' || type === 'b') &&
              (curheight === Number.MIN_VALUE || curheight < bboxes[i].height))
          ) {
            minx = bboxes[i].x;
            miny = bboxes[i].y;
            maxx = bboxes[i].x + bboxes[i].width;
            maxy = bboxes[i].y + bboxes[i].height;
            curwidth = bboxes[i].width;
            curheight = bboxes[i].height;
          }

          break;
        default: // 'selected'
          if (bboxes[i].x < minx) {
            minx = bboxes[i].x;
          }

          if (bboxes[i].y < miny) {
            miny = bboxes[i].y;
          }

          if (bboxes[i].x + bboxes[i].width > maxx) {
            maxx = bboxes[i].x + bboxes[i].width;
          }

          if (bboxes[i].y + bboxes[i].height > maxy) {
            maxy = bboxes[i].y + bboxes[i].height;
          }

          break;
      }
    } // loop for each element to find the bbox and adjust min/max

    if (relativeTo === 'page') {
      const {
        boundary: { maxX, maxY, minX, minY },
      } = workareaManager;

      minx = minX;
      miny = minY;
      maxx = maxX;
      maxy = maxY;
    }

    var dx = new Array(len);
    var dy = new Array(len);

    for (i = 0; i < len; ++i) {
      if (selectedElements[i] == null) {
        break;
      }

      elem = selectedElements[i];

      var bbox = bboxes[i];

      dx[i] = 0;
      dy[i] = 0;
      switch (type) {
        case 'l': // left (horizontal)
          dx[i] = minx - bbox.x;
          break;
        case 'c': // center (horizontal)
          dx[i] = (minx + maxx) / 2 - (bbox.x + bbox.width / 2);
          break;
        case 'r': // right (horizontal)
          dx[i] = maxx - (bbox.x + bbox.width);
          break;
        case 't': // top (vertical)
          dy[i] = miny - bbox.y;
          break;
        case 'm': // middle (vertical)
          dy[i] = (miny + maxy) / 2 - (bbox.y + bbox.height / 2);
          break;
        case 'b': // bottom (vertical)
          dy[i] = maxy - (bbox.y + bbox.height);
          break;
      }
    }
    moveSelectedElements(dx, dy);
  };

  // Group: Additional editor tools

  // Function: cycleElement
  // Select the next/previous element within the current layer
  //
  // Parameters:
  // next - Boolean where true = next and false = previous element
  this.cycleElement = function (next) {
    var num;

    if (tempGroup) {
      const children = this.ungroupTempGroup();

      this.selectOnly(children, false);
    }

    var cur_elem = selectedElements[0];
    var elem = false;
    var all_elems = getVisibleElements(current_group || layerManager.getCurrentLayerElement());

    if (!all_elems.length) {
      return;
    }

    if (cur_elem == null) {
      num = next ? all_elems.length - 1 : 0;
      elem = all_elems[num];
    } else {
      var i = all_elems.length;

      while (i--) {
        if (all_elems[i] === cur_elem) {
          num = next ? i - 1 : i + 1;

          if (num >= all_elems.length) {
            num = 0;
          } else if (num < 0) {
            num = all_elems.length - 1;
          }

          elem = all_elems[num];
          break;
        }
      }
    }

    selectOnly([elem], true);
    call('selected', selectedElements);
  };

  this.clear();

  this.getUseElementLocationBeforeTransform = function (elem) {
    const xform = $(elem).attr('data-xform');
    const elemX = Number.parseFloat($(elem).attr('x') || '0');
    const elemY = Number.parseFloat($(elem).attr('y') || '0');
    let obj: { [key: string]: number } = {};

    if (xform) {
      xform.split(' ').forEach((pair) => {
        const [key, value] = pair.split('=');

        if (value === undefined) {
          return;
        }

        obj[key] = Number.parseFloat(value);
      });
    } else {
      obj = elem.getBBox();
      obj.x = 0;
      obj.y = 0;
    }

    obj.x += elemX;
    obj.y += elemY;

    return obj;
  };

  this.getSvgRealLocation = function (elem: SVGGraphicsElement): IRect {
    if (elem.tagName === 'text') return this.calculateTransformedBBox(elem);

    if (elem.tagName !== 'use') return elem.getBBox();

    const xform = $(elem).attr('data-xform');
    const elemX = Number.parseFloat($(elem).attr('x') || '0');
    const elemY = Number.parseFloat($(elem).attr('y') || '0');

    let obj: { [key: string]: number } = {};

    if (xform) {
      xform.split(' ').forEach((pair: any) => {
        const [key, value] = pair.split('=');

        if (value === undefined) {
          return;
        }

        obj[key] = Number.parseFloat(value);
      });
    } else {
      obj = elem.getBBox() as any;
      obj.x = 0;
      obj.y = 0;
    }

    const tlist = svgedit.transformlist.getTransformList(elem);
    let rotationIndex = -1;

    for (let i = tlist.numberOfItems - 1; i >= 0; i--) {
      if (tlist.getItem(i).type === 4) {
        rotationIndex = i;
        break;
      }
    }

    // ignore rotation
    const { matrix: { a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = {} } =
      rotationIndex === tlist.numberOfItems - 1 ? {} : svgedit.math.transformListToTransform(tlist, rotationIndex + 1);

    obj.x += elemX;
    obj.y += elemY;

    let x = a * obj.x + c * obj.y + e;
    let y = b * obj.x + d * obj.y + f;
    let width = obj.width * a + obj.height * c;
    let height = obj.width * b + obj.height * d;

    if (width < 0) {
      x += width;
      width *= -1;
    }

    if (height < 0) {
      y += height;
      height *= -1;
    }

    height = round(height, 4);
    width = round(width, 4);
    x = round(x, 4);
    y = round(y, 4);

    return { height, width, x, y };
  };

  this.calculateTransformedBBox = function (elem: Element, ignoreRotation = true): IRect {
    const tlist = svgedit.transformlist.getTransformList(elem);
    const bbox = elem.getBBox();
    let points = [
      { x: bbox.x, y: bbox.y },
      { x: bbox.x + bbox.width, y: bbox.y },
      { x: bbox.x, y: bbox.y + bbox.height },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
    ];

    for (let i = tlist.numberOfItems - 1; i >= 0; i--) {
      const t = tlist.getItem(i);

      if (ignoreRotation && t.type === 4) {
        break;
      }

      points = points.map((p) => {
        const x = t.matrix.a * p.x + t.matrix.c * p.y + t.matrix.e;
        const y = t.matrix.b * p.x + t.matrix.d * p.y + t.matrix.f;

        return { x, y };
      });
    }

    let [minX, minY, maxX, maxY] = [points[0].x, points[0].y, points[0].x, points[0].y];

    points.forEach((p) => {
      minX = Math.min(p.x, minX);
      maxX = Math.max(p.x, maxX);
      minY = Math.min(p.y, minY);
      maxY = Math.max(p.y, maxY);
    });

    return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
  };

  this.moveElemPosition = function (dx, dy, elem) {
    if (elem === null) {
      return;
    }

    switch (elem.tagName) {
      case 'image':
      case 'rect':
        if (dx !== 0) {
          elem.setAttribute('x', elem.x.baseVal.value + dx);
        }

        if (dy !== 0) {
          elem.setAttribute('y', elem.y.baseVal.value + dy);
        }

        break;
      case 'line':
        if (dx !== 0) {
          elem.setAttribute('x1', elem.x1.baseVal.value + dx);
          elem.setAttribute('x2', elem.x2.baseVal.value + dx);
        }

        if (dy !== 0) {
          elem.setAttribute('y1', elem.y1.baseVal.value + dy);
          elem.setAttribute('y2', elem.y2.baseVal.value + dy);
        }

        break;
      case 'ellipse':
        if (dx !== 0) {
          elem.setAttribute('cx', elem.cx.baseVal.value + dx);
        }

        if (dy !== 0) {
          elem.setAttribute('cy', elem.cy.baseVal.value + dy);
        }

        break;
      case 'use':
        const xform = svgroot.createSVGTransform();
        const tlist = svgedit.transformlist.getTransformList(elem);

        xform.setTranslate(dx, dy);

        if (tlist.numberOfItems) {
          tlist.insertItemBefore(xform, 0);
        } else {
          tlist.appendItem(xform);
        }

        break;
      default:
        break;
    }

    selectorManager.requestSelector(elem).resize();
    recalculateAllSelectedDimensions();
  };

  this.setSvgElemPosition = function (para, val, elem?, addToHistory = true) {
    const selected = elem || selectedElements[0];
    const realLocation = this.getSvgRealLocation(selected);
    let dx = 0;
    let dy = 0;

    switch (para) {
      case 'x':
        dx = val - realLocation.x;
        break;
      case 'y':
        dy = val - realLocation.y;
        break;
    }

    const xform = svgroot.createSVGTransform();
    const tlist = svgedit.transformlist.getTransformList(selected);

    xform.setTranslate(dx, dy);

    if (tlist.numberOfItems) {
      tlist.insertItemBefore(xform, 0);
    } else {
      tlist.appendItem(xform);
    }

    selectorManager.requestSelector(selected).resize();

    const cmd = recalculateAllSelectedDimensions(!addToHistory);

    return cmd;
  };
  // refer to resize behavior in mouseup mousemove mousedown
  this.setSvgElemSize = function (para: string, val: number, addToHistory = false) {
    const batchCmd = new history.BatchCommand('set size');
    const selected = selectedElements[0];

    if (!selected) return;

    const realLocation = this.getSvgRealLocation(selected);
    let sx = 1;
    let sy = 1;

    switch (para) {
      case 'width':
        sx = val / realLocation.width;
        break;
      case 'height':
        sy = val / realLocation.height;
        break;
    }

    startTransform = selected.getAttribute('transform'); // ???maybe non need

    const tlist = svgedit.transformlist.getTransformList(selected);
    const left = realLocation.x;
    const top = realLocation.y;

    // update the transform list with translate,scale,translate
    const translateOrigin = svgroot.createSVGTransform();
    const scale = svgroot.createSVGTransform();
    const translateBack = svgroot.createSVGTransform();

    translateOrigin.setTranslate(-left, -top);
    scale.setScale(sx, sy);
    translateBack.setTranslate(left, top);

    const hasMatrix = svgedit.math.hasMatrixTransform(tlist);

    if (hasMatrix) {
      const pos = svgedit.utilities.getRotationAngle(selected) ? 1 : 0;

      tlist.insertItemBefore(translateOrigin, pos);
      tlist.insertItemBefore(scale, pos);
      tlist.insertItemBefore(translateBack, pos);
    } else {
      tlist.appendItem(translateBack);
      tlist.appendItem(scale);
      tlist.appendItem(translateOrigin);
    }

    selectorManager.requestSelector(selected).resize();

    selectorManager.requestSelector(selected).show(true);

    const cmd = svgedit.recalculate.recalculateDimensions(selected);

    svgEditor.updateContextPanel();

    if (cmd && !cmd.isEmpty()) {
      batchCmd.addSubCommand(cmd);
    }

    if (!batchCmd.isEmpty()) {
      if (addToHistory) addCommandToHistory(batchCmd);

      return batchCmd;
    }
  };

  this.zoomSvgElem = function (zoomScale) {
    const selected = selectedElements[0];
    const realLocation = this.getSvgRealLocation(selected);

    startTransform = selected.getAttribute('transform'); // ???maybe non need

    const tlist = svgedit.transformlist.getTransformList(selected);
    const left = realLocation.x;
    const top = realLocation.y;

    // update the transform list with translate,scale,translate
    const translateOrigin = svgroot.createSVGTransform();
    const scale = svgroot.createSVGTransform();
    const translateBack = svgroot.createSVGTransform();

    translateOrigin.setTranslate(-left, -top);
    scale.setScale(zoomScale, zoomScale);
    translateBack.setTranslate(left, top);

    const hasMatrix = svgedit.math.hasMatrixTransform(tlist);

    if (hasMatrix) {
      const pos = svgedit.utilities.getRotationAngle(selected) ? 1 : 0;

      tlist.insertItemBefore(translateOrigin, pos);
      tlist.insertItemBefore(scale, pos);
      tlist.insertItemBefore(translateBack, pos);
    } else {
      tlist.appendItem(translateBack);
      tlist.appendItem(scale);
      tlist.appendItem(translateOrigin);
    }

    selectorManager.requestSelector(selected).resize();

    selectorManager.requestSelector(selected).show(true);

    svgedit.recalculate.recalculateDimensions(selected);
  };

  // Function: addExtension
  // Add an extension to the editor
  //
  // Parameters:
  // name - String with the ID of the extension
  // ext_func - Function supplied by the extension with its data

  this.addExtension = function (name, ext_func) {
    var ext;

    if (!(name in extensions)) {
      // Provide private vars/funcs here. Is there a better way to do this?
      if ($.isFunction(ext_func)) {
        ext = ext_func({
          ...canvas,
          BatchCommand,
          call,
          ChangeElementCommand,
          copyElem: function (elem) {
            return getCurrentDrawing().copyElem(elem);
          },
          ffClone,
          findDuplicateGradient,
          getId,
          getNextId,
          getPathBBox,
          InsertElementCommand,
          isIdentity: svgedit.math.isIdentity,
          logMatrix,
          MoveElementCommand,
          nonce: getCurrentDrawing().getNonce(),
          ObjectPanelController,
          preventClickDefault: svgedit.utilities.preventClickDefault,
          RemoveElementCommand,
          svgcontent,
          SVGEditTransformList: svgedit.transformlist.SVGTransformList,
          svgroot,
          toString,
          transformBox: svgedit.math.transformBox,
          transformPoint,
          walkTree: svgedit.utilities.walkTree,
        });
      } else {
        ext = ext_func;
      }

      extensions[name] = ext;
      call('extension_added', ext);
    } else {
      console.log('Cannot add extension "' + name + '", an extension by that name already exists.');
    }
  };
};
