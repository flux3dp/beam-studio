/*globals $, svgedit, svgCanvas, jsPDF*/
/*jslint vars: true, eqeq: true, todo: true, bitwise: true, continue: true, forin: true */
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
define([
  'helpers/i18n',
  'app/actions/beambox/beambox-preference',
  'app/actions/alert-caller',
  'app/constants/alert-constants',
  'app/actions/beambox/preview-mode-controller',
  'app/views/beambox/Right-Panels/contexts/LayerPanelController',
  'app/views/beambox/Right-Panels/contexts/ObjectPanelController',
  'app/views/beambox/Top-Bar/contexts/Top-Bar-Controller',
  'app/views/beambox/Top-Bar/contexts/Top-Bar-Hints-Controller',
  'app/views/beambox/Top-Bar/Top-Bar-Hints',
  'app/views/beambox/Time-Estimation-Button/Time-Estimation-Button-Controller',
  'app/views/tutorials/Tutorial-Controller',
  'app/constants/tutorial-constants',
  'app/views/beambox/Zoom-Block/contexts/Zoom-Block-Controller',
  'app/actions/beambox',
  'app/actions/beambox/constant',
  'app/actions/beambox/open-bottom-boundary-drawer',
  'app/actions/progress-caller',
  'helpers/api/config',
  'helpers/auto-save-helper',
  'helpers/beam-file-helper',
  'helpers/bezier-fit-curve',
  'helpers/file-export-helper',
  'helpers/image-data',
  'helpers/laser-config-helper',
  'helpers/layer-helper',
  'helpers/storage-helper',
  'helpers/shortcuts',
  'helpers/symbol-maker',
  'imagetracer'
], function (
  i18n,
  BeamboxPreference,
  Alert,
  AlertConstants,
  PreviewModeController,
  LayerPanelController,
  ObjectPanelController,
  TopBarController,
  TopBarHintsController,
  TopBarHints,
  TimeEstimationButtonController,
  TutorialController,
  TutorialConstants,
  ZoomBlockController,
  BeamboxActions,
  Constant,
  OpenBottomBoundaryDrawer,
  Progress,
  Config,
  autoSaveHelper,
  BeamFileHelper,
  BezierFitCurve,
  FileExportHelper,
  ImageData,
  LaserConfigHelper,
  LayerHelper,
  storage,
  shortcuts,
  SymbolMaker,
  ImageTracer
) {
  i18n = __importStar(i18n);
  BeamboxPreference = BeamboxPreference.default;
  Alert = Alert.default;
  AlertConstants = AlertConstants.default;
  PreviewModeController = PreviewModeController.default;
  LayerPanelController = LayerPanelController.default;
  ObjectPanelController = ObjectPanelController.default;
  TopBarController = TopBarController.default;
  TopBarHintsController = TopBarHintsController.default;
  TopBarHints = __importStar(TopBarHints);
  TimeEstimationButtonController = TimeEstimationButtonController.default;
  TutorialController = __importStar(TutorialController);
  TutorialConstants = TutorialConstants.default;
  ZoomBlockController = ZoomBlockController.default;
  BeamboxActions = BeamboxActions.default;
  Constant = Constant.default;
  OpenBottomBoundaryDrawer = OpenBottomBoundaryDrawer.default;
  Progress = Progress.default;
  Config = Config.default;
  autoSaveHelper = autoSaveHelper.default;
  BeamFileHelper = BeamFileHelper.default;
  BezierFitCurve = __importStar(BezierFitCurve);
  FileExportHelper = FileExportHelper.default;
  ImageData = ImageData.default;
  LayerHelper = __importStar(LayerHelper);
  storage = storage.default;
  shortcuts = shortcuts.default;
  SymbolMaker = SymbolMaker.default;
  const LANG = i18n.lang.beambox;
  // Class: SvgCanvas
  // The main SvgCanvas class that manages all SVG-related functions
  //
  // Parameters:
  // container - The container HTML element that should hold the SVG root element
  // config - An object that contains configuration data
  $.SvgCanvas = function (container, config) {
    // Alias Namespace constants
    var NS = svgedit.NS;

    // Default configuration options
    var curConfig = {
      show_outside_canvas: true,
      selectNew: true,
      dimensions: [640, 480]
    };

    // Update config with new one if given
    if (config) {
      $.extend(curConfig, config);
    }

    // Array with width/height of canvas
    var dimensions = curConfig.dimensions;

    var canvas = this;

    // "document" element associated with the container (same as window.document using default svg-editor.js)
    // NOTE: This is not actually a SVG document, but a HTML document.
    var svgdoc = container.ownerDocument;

    // This is a container for the document being edited, not the document itself.
    var svgroot = svgdoc.importNode(svgedit.utilities.text2xml(
      '<svg id="svgroot" xmlns="' + NS.SVG + '" xlinkns="' + NS.XLINK + '" ' +
      'width="' + dimensions[0] + '" height="' + dimensions[1] + '" x="' + dimensions[0] + '" y="' + dimensions[1] + '" overflow="visible">' +
      '<defs>' +
      '<filter id="canvashadow" filterUnits="objectBoundingBox">' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>' +
      '<feOffset in="blur" dx="5" dy="5" result="offsetBlur"/>' +
      '<feMerge>' +
      '<feMergeNode in="offsetBlur"/>' +
      '<feMergeNode in="SourceGraphic"/>' +
      '</feMerge>' +
      '</filter>' +
      //(BeamboxPreference.read('enable_mask') ? ('<clipPath id="scene_mask"><rect x="0" y="0" width="' + dimensions[0] + '" height="' + dimensions[1] + '" /></clipPath>') : '') +
      '</defs>' +
      '</svg>').documentElement, true);
    container.appendChild(svgroot);

    // The actual element that represents the final output SVG element
    var svgcontent = svgdoc.createElementNS(NS.SVG, 'svg');

    // This function resets the svgcontent element while keeping it in the DOM.
    var clearSvgContentElement = canvas.clearSvgContentElement = function () {
      while (svgcontent.firstChild) {
        svgcontent.removeChild(svgcontent.firstChild);
      }

      // TODO: Clear out all other attributes first?
      $(svgcontent).attr({
        id: 'svgcontent',
        width: dimensions[0],
        height: dimensions[1],
        x: dimensions[0],
        y: dimensions[1],
        overflow: curConfig.show_outside_canvas ? 'visible' : 'hidden',
        xmlns: NS.SVG,
        'xmlns:se': NS.SE,
        'xmlns:xlink': NS.XLINK,
        style: 'will-change: scroll-position, contents, transform;'
      }).appendTo(svgroot);

    };
    clearSvgContentElement();

    // Prefix string for element IDs
    var idprefix = 'svg_';

    // Function: setIdPrefix
    // Changes the ID prefix to the given value
    //
    // Parameters:
    // p - String with the new prefix
    canvas.setIdPrefix = function (p) {
      idprefix = p;
    };

    // Current svgedit.draw.Drawing object
    // @type {svgedit.draw.Drawing}
    canvas.current_drawing_ = new svgedit.draw.Drawing(svgcontent, idprefix);

    // Function: getCurrentDrawing
    // Returns the current Drawing.
    // @return {svgedit.draw.Drawing}
    var getCurrentDrawing = canvas.getCurrentDrawing = function () {
      return canvas.current_drawing_;
    };

    // Float displaying the current zoom level (1 = 100%, .5 = 50%, etc)
    var current_zoom = 1;

    // pointer to current group (for in-group editing)
    var current_group = null;

    // Object containing data for the currently selected styles
    var all_properties = {
      shape: {
        fill: (curConfig.initFill.color === 'none' ? '' : '#') + curConfig.initFill.color,
        fill_paint: null,
        fill_opacity: curConfig.initFill.opacity,
        stroke: '#' + curConfig.initStroke.color,
        stroke_paint: null,
        stroke_opacity: curConfig.initStroke.opacity,
        stroke_width: curConfig.initStroke.width,
        stroke_dasharray: 'none',
        stroke_linejoin: 'miter',
        stroke_linecap: 'butt',
        opacity: curConfig.initOpacity
      }
    };

    all_properties.text = $.extend(true, {}, all_properties.shape);
    $.extend(all_properties.text, {
      fill: curConfig.text.fill,
      fill_opacity: curConfig.text.fill_opacity,
      stroke_width: curConfig.text.stroke_width,
      font_size: curConfig.text.font_size,
      font_family: curConfig.text.font_family,
      font_postscriptName: curConfig.text.font_postscriptName
    });

    // Current shape style properties
    var cur_shape = all_properties.shape;

    // Array with all the currently selected elements
    // default size of 1 until it needs to grow bigger
    var selectedElements = [];
    let tempGroup = null;

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
    var addSvgElementFromJson = this.addSvgElementFromJson = function (data) {
      if (typeof (data) === 'string') { return svgdoc.createTextNode(data); }

      var shape = svgedit.utilities.getElem(data.attr.id);
      // if shape is a path but we need to create a rect/ellipse, then remove the path
      var current_layer = getCurrentDrawing().getCurrentLayer();
      if (shape && data.element !== shape.tagName) {
        current_layer.removeChild(shape);
        shape = null;
      }
      if (!shape) {
        shape = svgdoc.createElementNS(NS.SVG, data.element);
        if (current_layer) {
          (current_group || current_layer).appendChild(shape);
        }
      }
      if (data.curStyles) {
        svgedit.utilities.assignAttributes(shape, {
          'fill': cur_shape.fill,
          'stroke': cur_shape.stroke,
          'stroke-width': cur_shape.stroke_width,
          'stroke-dasharray': cur_shape.stroke_dasharray,
          'stroke-linejoin': cur_shape.stroke_linejoin,
          'stroke-linecap': cur_shape.stroke_linecap,
          'stroke-opacity': cur_shape.stroke_opacity,
          'fill-opacity': cur_shape.fill_opacity,
          'opacity': cur_shape.opacity / 2,
          'style': 'pointer-events:inherit'
        }, 100);
      }
      svgedit.utilities.assignAttributes(shape, data.attr, 100);
      svgedit.utilities.assignAttributes(shape, {
        'vector-effect': 'non-scaling-stroke'
      }, 100);
      svgedit.utilities.cleanupElement(shape);

      // Children
      if (data.children) {
        data.children.forEach(function (child) {
          shape.appendChild(addSvgElementFromJson(child));
        });
      }
      $(shape).mouseover(canvas.handleGenerateSensorArea).mouseleave(canvas.handleGenerateSensorArea);

      return shape;
    };

    // import svgtransformlist.js
    var getTransformList = canvas.getTransformList = svgedit.transformlist.getTransformList;

    // import from math.js.
    var transformPoint = svgedit.math.transformPoint;
    var matrixMultiply = canvas.matrixMultiply = svgedit.math.matrixMultiply;
    var hasMatrixTransform = canvas.hasMatrixTransform = svgedit.math.hasMatrixTransform;
    var transformListToTransform = canvas.transformListToTransform = svgedit.math.transformListToTransform;
    var snapToAngle = svgedit.math.snapToAngle;
    var getMatrix = svgedit.math.getMatrix;
    const SENSOR_AREA_RADIUS = 10;

    // initialize from units.js
    // send in an object implementing the ElementContainer interface (see units.js)
    svgedit.units.init({
      getBaseUnit: function () {
        return curConfig.baseUnit;
      },
      getElement: svgedit.utilities.getElem,
      getHeight: function () {
        return svgcontent.getAttribute('height') / current_zoom;
      },
      getWidth: function () {
        return svgcontent.getAttribute('width') / current_zoom;
      },
      getRoundDigits: function () {
        return save_options.round_digits;
      }
    });
    // import from units.js
    var convertToNum = canvas.convertToNum = svgedit.units.convertToNum;

    // import from svgutils.js
    svgedit.utilities.init({
      getDOMDocument: function () {
        return svgdoc;
      },
      getDOMContainer: function () {
        return container;
      },
      getSVGRoot: function () {
        return svgroot;
      },
      // TODO: replace this mostly with a way to get the current drawing.
      getSelectedElements: function () {
        return selectedElements;
      },
      getSVGContent: function () {
        return svgcontent;
      },
      getBaseUnit: function () {
        return curConfig.baseUnit;
      },
      getSnappingStep: function () {
        return curConfig.snappingStep;
      }
    });
    var findDefs = canvas.findDefs = svgedit.utilities.findDefs;
    var getUrlFromAttr = canvas.getUrlFromAttr = svgedit.utilities.getUrlFromAttr;
    var getHref = canvas.getHref = svgedit.utilities.getHref;
    var setHref = canvas.setHref = svgedit.utilities.setHref;
    var getPathBBox = svgedit.utilities.getPathBBox;
    var getBBox = canvas.getBBox = svgedit.utilities.getBBox;
    var getRotationAngle = canvas.getRotationAngle = svgedit.utilities.getRotationAngle;
    var getElem = canvas.getElem = svgedit.utilities.getElem;
    var getRefElem = canvas.getRefElem = svgedit.utilities.getRefElem;
    var assignAttributes = canvas.assignAttributes = svgedit.utilities.assignAttributes;
    var cleanupElement = this.cleanupElement = svgedit.utilities.cleanupElement;

    // import from coords.js
    svgedit.coords.init({
      getDrawing: function () {
        return getCurrentDrawing();
      },
      getGridSnapping: function () {
        return curConfig.gridSnapping;
      }
    });
    var remapElement = this.remapElement = svgedit.coords.remapElement;

    // import from recalculate.js
    svgedit.recalculate.init({
      getSVGRoot: function () {
        return svgroot;
      },
      getStartTransform: function () {
        return startTransform;
      },
      setStartTransform: function (transform) {
        startTransform = transform;
      }
    });
    var recalculateDimensions = this.recalculateDimensions = svgedit.recalculate.recalculateDimensions;

    // import from sanitize.js
    var nsMap = svgedit.getReverseNS();
    var sanitizeSvg = canvas.sanitizeSvg = svgedit.sanitize.sanitizeSvg;

    // import from history.js
    var MoveElementCommand = svgedit.history.MoveElementCommand;
    var InsertElementCommand = svgedit.history.InsertElementCommand;
    var RemoveElementCommand = svgedit.history.RemoveElementCommand;
    var ChangeElementCommand = svgedit.history.ChangeElementCommand;
    var BatchCommand = svgedit.history.BatchCommand;
    var call;
    // Implement the svgedit.history.HistoryEventHandler interface.
    canvas.undoMgr = new svgedit.history.UndoManager({
      handleHistoryEvent: function (eventType, cmd) {
        var EventTypes = svgedit.history.HistoryEventTypes;
        // TODO: handle setBlurOffsets.
        if (eventType === EventTypes.BEFORE_UNAPPLY || eventType === EventTypes.BEFORE_APPLY) {
          canvas.clearSelection();
        } else if (eventType === EventTypes.AFTER_APPLY || eventType === EventTypes.AFTER_UNAPPLY) {
          var elems = cmd.elements();
          canvas.pathActions.clear();
          call('changed', elems);
          var cmdType = cmd.type();
          var isApply = (eventType === EventTypes.AFTER_APPLY);
          if (cmdType === MoveElementCommand.type()) {
            var parent = isApply ? cmd.newParent : cmd.oldParent;
            if (parent === svgcontent) {
              canvas.identifyLayers();
            }
            elems.forEach((elem) => {
              if (elem.classList.contains('layer')) {
                LayerPanelController.setSelectedLayers([]);
              } else {
                canvas.updateElementColor(elem);
              }
            });
          } else if (cmdType === InsertElementCommand.type() ||
            cmdType === RemoveElementCommand.type()) {
            if (cmdType === InsertElementCommand.type()) {
              if (isApply) {
                restoreRefElems(cmd.elem);
                if (cmd.elem.id === 'svgcontent') {
                  svgcontent = cmd.elem;
                }
              }
            } else {
              if (!isApply) {
                restoreRefElems(cmd.elem);
                if (cmd.elem.id === 'svgcontent') {
                  svgcontent = cmd.elem;
                }
              }
            }
            if (cmd.elem.tagName === 'use') {
              setUseData(cmd.elem);
            }
          } else if (cmdType === ChangeElementCommand.type()) {
            // if we are changing layer names, re-identify all layers
            if (cmd.elem.tagName === 'title' && cmd.elem.parentNode.parentNode === svgcontent) {
              canvas.identifyLayers();
            }
            var values = isApply ? cmd.newValues : cmd.oldValues;
            // If stdDeviation was changed, update the blur.
            if (values.stdDeviation) {
              canvas.setBlurOffsets(cmd.elem.parentNode, values.stdDeviation);
            }
            // This is resolved in later versions of webkit, perhaps we should
            // have a featured detection for correct 'use' behavior?
            // ——————————
            // Remove & Re-add hack for Webkit (issue 775)
            //if (cmd.elem.tagName === 'use' && svgedit.browser.isWebkit()) {
            //	var elem = cmd.elem;
            //	if (!elem.getAttribute('x') && !elem.getAttribute('y')) {
            //		var parent = elem.parentNode;
            //		var sib = elem.nextSibling;
            //		parent.removeChild(elem);
            //		parent.insertBefore(elem, sib);
            //	}
            //}
          } else if (cmdType === BatchCommand.type()) {
            if (['Delete Layer(s)', 'Clone Layer(s)', 'Merge Layer', 'Merge Layer(s)'].includes(cmd.text)) {
              canvas.identifyLayers();
              LayerPanelController.setSelectedLayers([]);
            }

            const textElems = elems.filter((elem) => elem.tagName === 'text');
            for (let i = 0; i < textElems.length; i++) {
              const textElem = textElems[i];
              const angle = svgedit.utilities.getRotationAngle(textElem);
              canvas.setRotationAngle(0, true, textElem);
              canvas.updateMultiLineTextElem(textElem);
              canvas.setRotationAngle(angle, true, textElem);
              if (textElem.getAttribute('stroke-width') === '2') {
                textElem.setAttribute('stroke-width', 2.01);
              } else {
                textElem.setAttribute('stroke-width', 2);
              }
            }
          }
        }
      }
    });
    var addCommandToHistory = function (cmd) {
      canvas.undoMgr.addCommandToHistory(cmd);
    };

    /**
     * Get a HistoryRecordingService.
     * @param {svgedit.history.HistoryRecordingService=} hrService - if exists, return it instead of creating a new service.
     * @returns {svgedit.history.HistoryRecordingService}
     */
    function historyRecordingService(hrService) {
      return hrService ? hrService : new svgedit.history.HistoryRecordingService(canvas.undoMgr);
    }

    // import from select.js
    svgedit.select.init(curConfig, {
      createSVGElement: function (jsonMap) {
        return canvas.addSvgElementFromJson(jsonMap);
      },
      svgRoot: function () {
        return svgroot;
      },
      svgContent: function () {
        return svgcontent;
      },
      currentZoom: function () {
        return current_zoom;
      },
      // TODO(codedread): Remove when getStrokedBBox() has been put into svgutils.js.
      getStrokedBBox: function (elems) {
        return canvas.getStrokedBBox([elems]);
      }
    });
    // this object manages selectors for us
    var selectorManager = this.selectorManager = svgedit.select.getSelectorManager();

    // Import from path.js
    svgedit.path.init({
      getCurrentZoom: function () {
        return current_zoom;
      },
      getSVGRoot: function () {
        return svgroot;
      }
    });

    // Interface strings, usually for title elements
    var uiStrings = {
      exportNoBlur: 'Blurred elements will appear as un-blurred',
      exportNoforeignObject: 'foreignObject elements will not appear',
      exportNoDashArray: 'Strokes will appear filled',
      exportNoText: 'Text may not appear as expected'
    };

    var visElems = 'a,circle,ellipse,foreignObject,g,image,line,path,polygon,polyline,rect,svg,text,tspan,use';
    var ref_attrs = ['clip-path', 'fill', 'filter', 'marker-end', 'marker-mid', 'marker-start', 'mask', 'stroke'];

    var elData = $.data;

    // Animation element to change the opacity of any newly created element
    var opac_ani = document.createElementNS(NS.SVG, 'animate');
    $(opac_ani).attr({
      attributeName: 'opacity',
      begin: 'indefinite',
      dur: 1,
      fill: 'freeze'
    }).appendTo(svgroot);

    var restoreRefElems = function (elem) {
      // Look for missing reference elements, restore any found
      if (!elem || elem.tagName === 'STYLE' || elem.classList.contains('layer')) {
        return;
      }
      var o, i, l,
        attrs = $(elem).attr(ref_attrs);
      for (o in attrs) {
        if (o === 'filter' && elem.tagName === 'image') {
          continue;
        }
        var val = attrs[o];
        if (val && val.indexOf('url(') === 0) {
          var id = svgedit.utilities.getUrlFromAttr(val).substr(1);
          var ref = getElem(id);
          if (!ref) {
            svgedit.utilities.findDefs().appendChild(removedElements[id]);
            delete removedElements[id];
          }
        }
      }

      var childs = elem.getElementsByTagName('*');

      if (childs.length) {
        for (i = 0, l = childs.length; i < l; i++) {
          restoreRefElems(childs[i]);
        }
      }
    };

    // Object to contain image data for raster images that were found encodable
    var encodableImages = {},

      // String with image URL of last loadable image
      last_good_img_url = curConfig.imgPath + 'logo.png',

      // Array with current disabled elements (for in-group editing)
      disabled_elems = [],

      // Object with save options
      save_options = {
        round_digits: 5
      },

      // Boolean indicating whether or not a dragging action has been started
      started = false,

      // String with an element's initial transform attribute value
      startTransform = null,

      // String indicating the current editor mode
      current_mode = 'select',

      // String with the current direction in which an element is being resized
      current_resize_mode = 'none',

      // Object with IDs for imported files, to see if one was already added
      import_ids = {},

      // Current text style properties
      cur_text = all_properties.text,

      // Current general properties
      cur_properties = cur_shape,

      // Array with selected elements' Bounding box object
      //	selectedBBoxes = new Array(1),

      // The DOM element that was just selected
      justSelected = null,

      // DOM element for selection rectangle drawn by the user
      rubberBox = null,

      // Array of current BBoxes, used in getIntersectionList().
      curBBoxes = [],

      // Object to contain all included extensions
      extensions = {},

      // Canvas point for the most recent right click
      lastClickPoint = null,

      // Map of deleted reference elements
      removedElements = {},

      // Rotary Mode
      rotaryMode = BeamboxPreference.read('rotary_mode');

    const defaultFont = Config().read('default-font');
    if (defaultFont) {
      cur_text.font_family = defaultFont.family;
      cur_text.font_postscriptName = defaultFont.postscriptName;
    }

    const { Menu, MenuItem } = requireNode('electron').remote;
    this.isUsingLayerColor = BeamboxPreference.read('use_layer_color');
    Menu.getApplicationMenu().items.filter(i => i.id === '_view')[0].submenu.items.filter(i => i.id === 'SHOW_LAYER_COLOR')[0].checked = this.isUsingLayerColor;
    this.isBorderlessMode = BeamboxPreference.read('borderless');
    // Clipboard for cut, copy&pasted elements
    canvas.clipBoard = [];

    // State for save before close warning
    canvas.changed = false;

    // Should this return an array by default, so extension results aren't overwritten?
    var runExtensions = this.runExtensions = function (action, vars, returnArray) {
      var result = returnArray ? [] : false;
      $.each(extensions, function (name, opts) {
        if (opts && action in opts) {
          if (returnArray) {
            result.push(opts[action](vars));
          } else {
            result = opts[action](vars);
          }
        }
      });
      return result;
    };

    // Function: addExtension
    // Add an extension to the editor
    //
    // Parameters:
    // name - String with the ID of the extension
    // ext_func - Function supplied by the extension with its data
    this.importIds = function () {
      return import_ids;
    };

    this.addExtension = function (name, ext_func) {
      var ext;
      if (!(name in extensions)) {
        // Provide private vars/funcs here. Is there a better way to do this?
        if ($.isFunction(ext_func)) {
          ext = ext_func($.extend(canvas.getPrivateMethods(), {
            svgroot: svgroot,
            svgcontent: svgcontent,
            nonce: getCurrentDrawing().getNonce(),
            selectorManager: selectorManager,
            ObjectPanelController: ObjectPanelController,
          }));
        } else {
          ext = ext_func;
        }
        extensions[name] = ext;
        call('extension_added', ext);
      } else {
        console.log('Cannot add extension "' + name + '", an extension by that name already exists.');
      }
    };

    // This method rounds the incoming value to the nearest value based on the current_zoom
    var round = this.round = function (val) {
      return parseInt(val * current_zoom, 10) / current_zoom;
    };

    // This method sends back an array or a NodeList full of elements that
    // intersect the multi-select rubber-band-box on the current_layer only.
    //
    // We brute-force getIntersectionList for browsers that do not support it (Firefox).
    //
    // Reference:
    // Firefox does not implement getIntersectionList(), see https://bugzilla.mozilla.org/show_bug.cgi?id=501421
    var getIntersectionList = this.getIntersectionList = function (rect) {
      if (rubberBox == null) {
        return null;
      }

      var parent = current_group || getCurrentDrawing().getCurrentLayer();

      var rubberBBox;
      if (!rect) {
        rubberBBox = rubberBox.getBBox();
        var o, bb = svgcontent.createSVGRect();

        for (o in rubberBBox) {
          bb[o] = rubberBBox[o] / current_zoom;
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

      // Fail when selecting <use>, another method is pretty fast anyway
      if (!svgedit.browser.isIE() && false) {
        if (typeof (svgcontent.getIntersectionList) === 'function') {
          // Offset the bbox of the rubber box by the offset of the svgcontent element.
          rubberBBox.x = rubberBBox.x * current_zoom + parseInt(svgcontent.getAttribute('x'), 10);
          rubberBBox.y = rubberBBox.y * current_zoom + parseInt(svgcontent.getAttribute('y'), 10);
          rubberBBox.width *= current_zoom;
          rubberBBox.height *= current_zoom;

          resultList = Array.from(svgcontent.getIntersectionList(rubberBBox, null));
        }
      }

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
    };

    // TODO(codedread): Migrate this into svgutils.js
    // Function: getStrokedBBox
    // Get the bounding box for one or more stroked and/or transformed elements
    //
    // Parameters:
    // elems - Array with DOM elements to check
    //
    // Returns:
    // A single bounding box object
    var getStrokedBBox = this.getStrokedBBox = function (elems) {
      if (!elems) {
        elems = getVisibleElements();
      }
      return svgedit.utilities.getStrokedBBox(elems, addSvgElementFromJson, pathActions);
    };

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
    var getVisibleElements = this.getVisibleElements = function (parent) {
      if (!parent) {
        parent = $(svgcontent).children(); // Prevent layers from being included
      }

      var contentElems = [];
      $(parent).children().each(function (i, elem) {
        if (elem.getBBox) {
          contentElems.push(elem);
        }
      });
      return contentElems.reverse();
    };

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
    var getVisibleElementsAndBBoxes = this.getVisibleElementsAndBBoxes = function (parent) {
      if (!parent) {
        parent = $(svgcontent).children(); // Prevent layers from being included
      }
      const contentElems = [];
      for (let i = 0; i < parent.length; i++) {
        const childNodes = parent[i].childNodes;
        if (childNodes) {
          for (let j = 0; j < childNodes.length; j++) {
            const elem = childNodes[j];
            if (elem.getBBox) {
              let bbox;
              if (elem.tagName === 'use') {
                bbox = canvas.getSvgRealLocation(elem);
              } else {
                bbox = canvas.calculateTransformedBBox(elem);
              }
              const angle = svgedit.utilities.getRotationAngle(elem);
              bbox = canvas.calculateRotatedBBox(bbox, angle);
              contentElems.push({
                elem,
                bbox,
              });

            }
          }
        }
      }
      return contentElems.reverse();
    };

    // Function: groupSvgElem
    // Wrap an SVG element into a group element, mark the group as 'gsvg'
    //
    // Parameters:
    // elem - SVG element to wrap
    var groupSvgElem = this.groupSvgElem = function (elem) {
      var g = document.createElementNS(NS.SVG, 'g');
      elem.parentNode.replaceChild(g, elem);
      $(g).append(elem).data('gsvg', elem)[0].id = getNextId();
    };


    // Set scope for these functions
    var getId, getNextId;
    var textActions;

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
      var i, path, len,
        paths = newDoc.getElementsByTagNameNS(NS.SVG, 'path');
      for (i = 0, len = paths.length; i < len; ++i) {
        path = paths[i];
        path.setAttribute('d', pathActions.convertPath(path));
        pathActions.fixEnd(path);
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
      selectorManager.requestSelector(clone).showGrips(true);
      return clone;
    };

    this.getObjectLayer = LayerHelper.getObjectLayer;

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
      val = parseFloat(val);
      elem = elem || selectedElements[0];
      var oldTransform = elem.getAttribute('transform');
      var bbox = svgedit.utilities.getBBox(elem);
      var cx = bbox.x + bbox.width / 2,
        cy = bbox.y + bbox.height / 2;
      var tlist = svgedit.transformlist.getTransformList(elem);

      // only remove the real rotational transform if present (i.e. at index=0)
      if (tlist.numberOfItems > 0) {
        var xform = tlist.getItem(0);
        if (xform.type == 4) {
          tlist.removeItem(0);
        }
      }
      // find R_nc and insert it
      if (val != 0) {
        var center = svgedit.math.transformPoint(cx, cy, svgedit.math.transformListToTransform(tlist).matrix);
        var R_nc = svgroot.createSVGTransform();
        R_nc.setRotate(val, center.x, center.y);
        if (tlist.numberOfItems) {
          tlist.insertItemBefore(R_nc, 0);
        } else {
          tlist.appendItem(R_nc);
        }
      } else if (tlist.numberOfItems === 0) {
        elem.removeAttribute('transform');
      }

      if (!preventUndo) {
        // we need to undo it, then redo it so it can be undo-able! :)
        // TODO: figure out how to make changes to transform list undo-able cross-browser?
        var newTransform = elem.getAttribute('transform');
        if (oldTransform) {
          elem.setAttribute('transform', oldTransform);
        } else {
          elem.removeAttribute('transform');
        }
        changeSelectedAttribute('transform', newTransform, [elem]);
        call('changed', [elem]);
      }
      var pointGripContainer = svgedit.utilities.getElem('pathpointgrip_container');
      //		if (elem.nodeName === 'path' && pointGripContainer) {
      //			pathActions.setPointContainerTransform(elem.getAttribute('transform'));
      //		}
      var selector = selectorManager.requestSelector(selectedElements[0]);
      if (selector) {
        selector.resize();
        selector.updateGripCursors(val);
      }
    };

    // Function: recalculateAllSelectedDimensions
    // Runs recalculateDimensions on the selected elements,
    // adding the changes to a single batch command
    var recalculateAllSelectedDimensions = this.recalculateAllSelectedDimensions = function (isSubCommand = false) {
      var text = (current_resize_mode === 'none' ? 'position' : 'size');
      var batchCmd = new svgedit.history.BatchCommand(text);

      var i = selectedElements.length;
      while (i--) {
        var elem = selectedElements[i];
        //			if (svgedit.utilities.getRotationAngle(elem) && !svgedit.math.hasMatrixTransform(getTransformList(elem))) {continue;}
        var cmd = svgedit.recalculate.recalculateDimensions(elem);
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
    };


    // Debug tool to easily see the current matrix in the browser's console
    var logMatrix = function (m) {
      console.log([m.a, m.b, m.c, m.d, m.e, m.f]);
    };

    // Root Current Transformation Matrix in user units
    var root_sctm = null;

    // Group: Selection

    // Function: clearSelection
    // Clears the selection. The 'selected' handler is then called.
    // Parameters:
    // noCall - Optional boolean that when true does not call the "selected" handler
    var clearSelection = this.clearSelection = function (noCall) {
      if (selectedElements[0] != null) {
        if (tempGroup) {
          svgCanvas.ungroupTempGroup();
        }
        var i, elem,
          len = selectedElements.length;
        for (i = 0; i < len; ++i) {
          elem = selectedElements[i];
          if (!elem) {
            break;
          }
          selectorManager.releaseSelector(elem);

          selectedElements[i] = null;
        }

        selectedElements = [];
        if (!noCall) {
          call('selected', selectedElements);
        }
      }
    };

    // TODO: do we need to worry about selectedBBoxes here?


    // Function: addToSelection
    // Adds a list of elements to the selection. The 'selected' handler is then called.
    //
    // Parameters:
    // elemsToAdd - an array of DOM elements to add to the selection
    // showGrips - a boolean flag indicating whether the resize grips should be shown
    var addToSelection = this.addToSelection = function (elemsToAdd, showGrips, noCall) {
      if (elemsToAdd.length === 0) {
        return;
      }
      // find the first null in our selectedElements array
      var j = 0;

      while (j < selectedElements.length) {
        if (selectedElements[j] == null) {
          break;
        }
        ++j;
      }

      // now add each element consecutively
      var i = elemsToAdd.length;
      while (i--) {
        var elem = elemsToAdd[i];
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
        if (selectedElements.indexOf(elem) === -1) {

          selectedElements[j] = elem;

          // only the first selectedBBoxes element is ever used in the codebase these days
          //			if (j == 0) selectedBBoxes[0] = svgedit.utilities.getBBox(elem);
          j++;
          var sel = selectorManager.requestSelector(elem, bbox);

          if (selectedElements.length > 1) {
            sel.showGrips(false);
          }
        }
      }
      if (!noCall) {
        call('selected', selectedElements);
      }
      if (showGrips || selectedElements.length === 1) {
        selectorManager.requestSelector(selectedElements[0]).showGrips(true);
      } else {
        selectorManager.requestSelector(selectedElements[0]).showGrips(false);
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
      selectedElements = selectedElements.filter((elem) => elem);
      // while (selectedElements[0] == null) {
      //     selectedElements.shift(0);
      // }
      LayerPanelController.updateLayerPanel();
    };

    // Function: selectOnly()
    // Selects only the given elements, shortcut for clearSelection(); addToSelection()
    //
    // Parameters:
    // elems - an array of DOM elements to be selected
    var selectOnly = this.selectOnly = function (elems, showGrips) {
      clearSelection(true);
      addToSelection(elems, showGrips);
    };

    // TODO: could use slice here to make this faster?
    // TODO: should the 'selected' handler

    // Function: removeFromSelection
    // Removes elements from the selection.
    //
    // Parameters:
    // elemsToRemove - an array of elements to remove from selection
    var removeFromSelection = this.removeFromSelection = function (elemsToRemove, noCall) {
      if (selectedElements[0] == null) {
        return;
      }
      if (elemsToRemove.length === 0) {
        return;
      }

      // find every element and remove it from our array copy
      var i,
        j = 0,
        newSelectedItems = [],
        len = selectedElements.length;
      newSelectedItems.length = len;
      for (i = 0; i < len; ++i) {
        var elem = selectedElements[i];
        if (elem) {
          // keep the item
          if (elemsToRemove.indexOf(elem) === -1) {
            newSelectedItems[j] = elem;
            j++;
          } else { // remove the item and its selector
            selectorManager.releaseSelector(elem);
          }
        }
      }
      // the copy becomes the master now
      selectedElements = newSelectedItems.filter((elem) => elem);
      if (selectedElements.length === 0 && !noCall) {
        call('selected', selectedElements);
      }
    };

    // Function: selectAllInCurrentLayer
    // Clears the selection, then adds all elements in the current layer to the selection.
    this.selectAllInCurrentLayer = function () {
      var current_layer = getCurrentDrawing().getCurrentLayer();
      if (current_layer && current_layer.getAttribute('data-lock') !== 'true') {
        current_mode = 'select';
        $('.tool-btn').removeClass('active');
        $('#left-Cursor').addClass('active');
        const elemsToAdd = Array.from($(current_group || current_layer).children()).filter(c => !['title', 'filter'].includes(c.tagName));
        if (elemsToAdd < 1) {
          console.warn('Selecting empty layer in "selectAllInCurrentLayer"');
          return;
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
      const drawing = getCurrentDrawing();
      const allLayers = drawing.all_layers;
      const elemsToSelect = [];
      for (let i = allLayers.length - 1; i >= 0; i--) {
        const layerElement = allLayers[i].group_;
        if (layerElement && layerElement.parentNode && layerElement.getAttribute('data-lock') !== 'true' && layerElement.getAttribute('display') !== 'none') {
          const elemsToAdd = Array.from(layerElement.childNodes).filter((node) => !['title', 'filter'].includes(node.tagName));
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
    }

    /**
     * Gets the desired element from a mouse event
     * @param {MouseEvent} evt Event object from the mouse event
     * @param {boolean} allowTempGroup (deafult true) allow to return temp group, else return child of temp group
     * @returns {Element} mouse target element
     */
    var getMouseTarget = this.getMouseTarget = function (evt, allowTempGroup = true) {
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

      const root_sctm = $('#svgcontent')[0].getScreenCTM().inverse();
      let pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm);

      // bbox center at x, y width, hieght 10px
      const selectionRegion = {
        x: pt.x - 50,
        y: pt.y - 50,
        width: 100,
        height: 100,
      }
      const intersectList = getIntersectionList(selectionRegion).reverse();
      curBBoxes = [];
      const clickPoint = svgcontent.createSVGPoint();
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
        elem.setAttribute('stroke-width', 20);
        if (elem.isPointInStroke(clickPoint)) {
          mouseTarget = elem;
          pointInStroke = true;
        }
        if (originalStrokeWidth) {
          elem.setAttribute('stroke-width', originalStrokeWidth);
        } else {
          elem.removeAttribute('stroke-width');
        }
        if (pointInStroke) {
          break;
        }
      }

      if (mouseTarget === svgroot) {
        const mouse_x = pt.x * current_zoom;
        const mouse_y = pt.y * current_zoom;
        if (canvas.sensorAreaInfo && !PreviewModeController.isPreviewMode()) {
          let dist = Math.hypot(canvas.sensorAreaInfo.x - mouse_x, canvas.sensorAreaInfo.y - mouse_y);
          if (dist < SENSOR_AREA_RADIUS) {
            mouseTarget = canvas.sensorAreaInfo.elem;
          }
        }
      }

      // if it was a <use>, Opera and WebKit return the SVGElementInstance
      if (mouseTarget.correspondingUseElement) {
        mouseTarget = mouseTarget.correspondingUseElement;
      }

      // for foreign content, go up until we find the foreignObject
      // WebKit browsers set the mouse target to the svgcanvas div
      if ([NS.MATH, NS.HTML].indexOf(mouseTarget.namespaceURI) >= 0 &&
        mouseTarget.id !== 'svgcanvas') {
        while (mouseTarget.nodeName !== 'foreignObject') {
          mouseTarget = mouseTarget.parentNode;
          if (!mouseTarget) {
            return svgroot;
          }
        }
      }

      // Get the desired mouseTarget with jQuery selector-fu
      // If it's root-like, select the root
      var current_layer = getCurrentDrawing().getCurrentLayer();
      if ([svgroot, container, svgcontent, current_layer].indexOf(mouseTarget) >= 0) {
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

    // Function: handleGenerateSensorArea
    // handle for pure contour elements, enlarge sensor area;
    this.handleGenerateSensorArea = (evt) => {
      // if dx or dy !== 0, then we are moving elements. Don't update sensor area info.
      if (current_mode === 'select' && (!this.sensorAreaInfo || (this.sensorAreaInfo.dx === 0 && this.sensorAreaInfo.dy === 0))) {
        if (evt.target.id.match(/grip/i) || evt.target.id.includes('stretch')) {
          return;
        }
        const root_sctm = $('#svgcontent')[0].getScreenCTM().inverse();
        let pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm),
          mouse_x = pt.x * current_zoom,
          mouse_y = pt.y * current_zoom;
        this.sensorAreaInfo = { x: mouse_x, y: mouse_y, dx: 0, dy: 0, elem: evt.target };
      }
    }

    // Mouse events
    (function () {
      var d_attr = null,
        start_x = null,
        start_y = null,
        r_start_x = null,
        r_start_y = null,
        init_bbox = {},
        selectedBBox = null,
        freehand = {
          minx: null,
          miny: null,
          maxx: null,
          maxy: null
        },
        sumDistance = 0,
        controllPoint2 = {
          x: 0,
          y: 0
        },
        controllPoint1 = {
          x: 0,
          y: 0
        },
        start = {
          x: 0,
          y: 0
        },
        end = {
          x: 0,
          y: 0
        },
        parameter,
        nextParameter,
        bSpline = {
          x: 0,
          y: 0
        },
        nextPos = {
          x: 0,
          y: 0
        },
        THRESHOLD_DIST = 0.8,
        STEP_COUNT = 10;

      var getBsplinePoint = function (t) {
        var spline = {
          x: 0,
          y: 0
        },
          p0 = controllPoint2,
          p1 = controllPoint1,
          p2 = start,
          p3 = end,
          S = 1.0 / 6.0,
          t2 = t * t,
          t3 = t2 * t;

        var m = [
          [-1, 3, -3, 1],
          [3, -6, 3, 0],
          [-3, 0, 3, 0],
          [1, 4, 1, 0]
        ];

        spline.x = S * (
          (p0.x * m[0][0] + p1.x * m[0][1] + p2.x * m[0][2] + p3.x * m[0][3]) * t3 +
          (p0.x * m[1][0] + p1.x * m[1][1] + p2.x * m[1][2] + p3.x * m[1][3]) * t2 +
          (p0.x * m[2][0] + p1.x * m[2][1] + p2.x * m[2][2] + p3.x * m[2][3]) * t +
          (p0.x * m[3][0] + p1.x * m[3][1] + p2.x * m[3][2] + p3.x * m[3][3])
        );
        spline.y = S * (
          (p0.y * m[0][0] + p1.y * m[0][1] + p2.y * m[0][2] + p3.y * m[0][3]) * t3 +
          (p0.y * m[1][0] + p1.y * m[1][1] + p2.y * m[1][2] + p3.y * m[1][3]) * t2 +
          (p0.y * m[2][0] + p1.y * m[2][1] + p2.y * m[2][2] + p3.y * m[2][3]) * t +
          (p0.y * m[3][0] + p1.y * m[3][1] + p2.y * m[3][2] + p3.y * m[3][3])
        );

        return {
          x: spline.x,
          y: spline.y
        };
      };

      /**
       * Add transform for resizing operation
       * @param {Element} element svg element to init transform
       */
      const initResizeTransform = (element) => {
        const tlist = svgedit.transformlist.getTransformList(element);
        const pos = svgedit.utilities.getRotationAngle(element) ? 1 : 0;

        if (svgedit.math.hasMatrixTransform(tlist)) {
          tlist.insertItemBefore(svgroot.createSVGTransform(), pos);
          tlist.insertItemBefore(svgroot.createSVGTransform(), pos);
          tlist.insertItemBefore(svgroot.createSVGTransform(), pos);
        } else {
          tlist.appendItem(svgroot.createSVGTransform());
          tlist.appendItem(svgroot.createSVGTransform());
          tlist.appendItem(svgroot.createSVGTransform());
        }
      };

      let mouseSelectModeCmds;
      // - when we are in a create mode, the element is added to the canvas
      // but the action is not recorded until mousing up
      // - when we are in select mode, select the element, remember the position
      // and do nothing else
      var mouseDown = function (evt) {
        if (canvas.spaceKey || evt.button === 1) {
          return;
        }
        mouseSelectModeCmds = [];

        var right_click = evt.button === 2;

        root_sctm = $('#svgcontent')[0].getScreenCTM().inverse();

        var pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm),
          mouse_x = pt.x * current_zoom,
          mouse_y = pt.y * current_zoom;
        var ext_result = null;

        evt.preventDefault();
        document.activeElement.blur();
        if (right_click) {
          if (started) {
            return;
          }
          if (current_mode === 'path') {
            pathActions.finishPath(false);
            $('#workarea').css('cursor', 'default');
            current_mode = 'select';
            return;
          }
          svgEditor.clickSelect(false);
          lastClickPoint = pt;
          return;
        }

        // This would seem to be unnecessary...
        //		if (['select', 'resize'].indexOf(current_mode) == -1) {
        //			setGradient();
        //		}
        var x = mouse_x / current_zoom;
        y = mouse_y / current_zoom;

        let mouseTarget = getMouseTarget(evt);

        if (mouseTarget.tagName === 'a' && mouseTarget.childNodes.length === 1) {
          mouseTarget = mouseTarget.firstChild;
        }

        // real_x/y ignores grid-snap value
        var real_x = x;
        r_start_x = start_x = x;
        var real_y = y;
        r_start_y = start_y = y;

        if (curConfig.gridSnapping) {
          x = svgedit.utilities.snapToGrid(x);
          y = svgedit.utilities.snapToGrid(y);
          start_x = svgedit.utilities.snapToGrid(start_x);
          start_y = svgedit.utilities.snapToGrid(start_y);
        }

        if (mouseTarget === selectorManager.selectorParentGroup && selectedElements[0] != null) {
          // if it is a selector grip, then it must be a single element selected,
          // set the mouseTarget to that and update the mode to rotate/resize
          var grip = evt.target;
          var griptype = elData(grip, 'type');
          // rotating
          if (griptype === 'rotate') {
            current_mode = 'rotate';
          }
          // resizing
          else if (griptype === 'resize') {
            current_mode = 'resize';
            current_resize_mode = elData(grip, 'dir');
          }
          mouseTarget = selectedElements[0];
        } else if (canvas.textActions.isEditing) {
          current_mode = 'textedit';
        }

        if (ext_result = runExtensions('checkMouseTarget', { mouseTarget: mouseTarget }, true)) {
          let extensionEvent = false;
          $.each(ext_result, function (i, r) {
            started = started || (r && r.started);
          });
          if (started && current_mode !== 'path') {
            return;
          }
        }

        startTransform = mouseTarget.getAttribute('transform');
        var i, stroke_w,
          tlist = svgedit.transformlist.getTransformList(mouseTarget);

        switch (current_mode) {
          case 'select':
            started = true;
            current_resize_mode = 'none';
            if (right_click) {
              started = false;
            } else {
              // End layer multiselect
              const selectedLayers = LayerPanelController.getSelectedLayers();
              if (selectedLayers && selectedLayers.length > 1) {
                const currentLayerName = getCurrentDrawing().getCurrentLayerName();
                if (currentLayerName) LayerPanelController.setSelectedLayers([currentLayerName]);
              }
            }

            const setRubberBoxStart = () => {
              if (rubberBox == null) {
                rubberBox = selectorManager.getRubberBandBox();
              }
              r_start_x *= current_zoom;
              r_start_y *= current_zoom;

              svgedit.utilities.assignAttributes(rubberBox, {
                'x': r_start_x,
                'y': r_start_y,
                'width': 0,
                'height': 0,
                'display': 'inline'
              }, 100);
            };

            if (PreviewModeController.isPreviewMode() || TopBarController.getTopBarPreviewMode()) {
              // preview mode
              clearSelection();
              if (PreviewModeController.isPreviewMode()) {
                current_mode = 'preview';
              } else {
                // i.e. TopBarController.getTopBarPreviewMode()
                current_mode = 'pre_preview';
              }
              setRubberBoxStart();
            } else {
              const mouseTargetObjectLayer = LayerHelper.getObjectLayer(mouseTarget);
              const isElemTempGroup = mouseTarget.getAttribute('data-tempgroup') === 'true';
              let layerSelectable = false;
              if (mouseTargetObjectLayer &&
                mouseTargetObjectLayer.elem &&
                mouseTargetObjectLayer.elem.getAttribute('display') !== 'none' &&
                !mouseTargetObjectLayer.elem.getAttribute('data-lock')) {
                layerSelectable = true;
              }
              if (mouseTarget !== svgroot && (isElemTempGroup || layerSelectable)) {
                // Mouse down on element
                if (!selectedElements.includes(mouseTarget)) {
                  if (!evt.shiftKey) {
                    clearSelection(true);
                  }
                  addToSelection([mouseTarget]);
                  if (selectedElements.length > 1) {
                    canvas.tempGroupSelectedElements();
                  }
                  justSelected = mouseTarget;
                  pathActions.clear();
                } else {
                  if (evt.shiftKey) {
                    if (mouseTarget === tempGroup) {
                      const elemToRemove = getMouseTarget(evt, false);
                      canvas.removeFromTempGroup(elemToRemove);
                    } else {
                      clearSelection();
                    }
                  }
                }
                if (!right_click) {
                  if (evt.altKey) {
                    const cmd = canvas.cloneSelectedElements(0, 0, true);
                    if (cmd && !cmd.isEmpty()) {
                      mouseSelectModeCmds.push(cmd);
                    }
                  }
                  for (i = 0; i < selectedElements.length; ++i) {
                    // insert a dummy transform so if the element(s) are moved it will have
                    // a transform to use for its translate
                    if (selectedElements[i] == null) {
                      continue;
                    }
                    var slist = svgedit.transformlist.getTransformList(selectedElements[i]);
                    if (slist.numberOfItems) {
                      slist.insertItemBefore(svgroot.createSVGTransform(), 0);
                    } else {
                      slist.appendItem(svgroot.createSVGTransform());
                    }
                  }
                }
              } else if (!right_click) {
                // Mouse down on svg root
                clearSelection();
                current_mode = 'multiselect';
                setRubberBoxStart();
              }
            }
            break;
          case 'zoom':
            started = true;
            if (rubberBox == null) {
              rubberBox = selectorManager.getRubberBandBox();
            }
            svgedit.utilities.assignAttributes(rubberBox, {
              'x': real_x * current_zoom,
              'y': real_x * current_zoom,
              'width': 0,
              'height': 0,
              'display': 'inline'
            }, 100);
            break;
          case 'resize':
            started = true;
            start_x = x;
            start_y = y;

            // Getting the BBox from the selection box, since we know we
            // want to orient around it
            init_bbox = svgedit.utilities.getBBox($('#selectedBox0')[0]);
            var bb = {};
            $.each(init_bbox, function (key, val) {
              bb[key] = val / current_zoom;
            });
            init_bbox = (mouseTarget.tagName === 'use') ? svgCanvas.getSvgRealLocation(mouseTarget) : bb;

            // append three dummy transforms to the tlist so that
            // we can translate,scale,translate in mousemove

            initResizeTransform(mouseTarget);
            if (svgedit.browser.supportsNonScalingStroke()) {
              // Handle crash for newer Chrome and Safari 6 (Mobile and Desktop):
              // https://code.google.com/p/svg-edit/issues/detail?id=904
              // Chromium issue: https://code.google.com/p/chromium/issues/detail?id=114625
              // TODO: Remove this workaround once vendor fixes the issue
              var isWebkit = svgedit.browser.isWebkit();

              if (isWebkit) {
                var delayedStroke = function (ele) {
                  var _stroke = ele.getAttributeNS(null, 'stroke');
                  ele.removeAttributeNS(null, 'stroke');
                  // Re-apply stroke after delay. Anything higher than 1 seems to cause flicker
                  if (_stroke !== null) {
                    setTimeout(function () {
                      ele.setAttributeNS(null, 'stroke', _stroke);
                    }, 0);
                  }
                };
              }
              mouseTarget.style.vectorEffect = 'non-scaling-stroke';
              if (isWebkit) {
                delayedStroke(mouseTarget);
              }

              var all = mouseTarget.getElementsByTagName('*'),
                len = all.length;
              for (i = 0; i < len; i++) {
                all[i].style.vectorEffect = 'non-scaling-stroke';
                if (isWebkit) {
                  delayedStroke(all[i]);
                }
              }
            }
            break;
          case 'fhellipse':
          case 'fhrect':
          case 'fhpath':
            start.x = real_x;
            start.y = real_y;
            started = true;
            d_attr = real_x + ',' + real_y + ' ';
            stroke_w = cur_shape.stroke_width == 0 ? 1 : cur_shape.stroke_width;
            addSvgElementFromJson({
              element: 'polyline',
              curStyles: true,
              attr: {
                points: d_attr,
                id: getNextId(),
                fill: 'none',
                opacity: cur_shape.opacity / 2,
                'stroke-linecap': 'round',
                style: 'pointer-events:none'
              }
            });
            freehand.minx = real_x;
            freehand.maxx = real_x;
            freehand.miny = real_y;
            freehand.maxy = real_y;
            break;
          case 'image':
            started = true;
            var newImage = addSvgElementFromJson({
              element: 'image',
              attr: {
                x: x,
                y: y,
                width: 0,
                height: 0,
                id: getNextId(),
                opacity: cur_shape.opacity / 2,
                style: 'pointer-events:inherit'
              }
            });
            setHref(newImage, last_good_img_url);
            svgedit.utilities.preventClickDefault(newImage);
            break;
          case 'square':
          // FIXME: once we create the rect, we lose information that this was a square
          // (for resizing purposes this could be important)
          case 'rect':
            started = true;
            start_x = x;
            start_y = y;
            const newRect = addSvgElementFromJson({
              element: 'rect',
              curStyles: false,
              attr: {
                x: x,
                y: y,
                width: 0,
                height: 0,
                stroke: '#000',
                id: getNextId(),
                fill: 'none',
                'fill-opacity': 0,
                opacity: cur_shape.opacity / 2
              }
            });
            if (canvas.isUsingLayerColor) {
              canvas.updateElementColor(newRect);
            }
            selectOnly([newRect], true);
            break;
          case 'line':
            started = true;
            const newLine = addSvgElementFromJson({
              element: 'line',
              curStyles: false,
              attr: {
                x1: x,
                y1: y,
                x2: x,
                y2: y,
                id: getNextId(),
                stroke: '#000',
                'stroke-width': 1,
                'stroke-dasharray': cur_shape.stroke_dasharray,
                'stroke-linejoin': cur_shape.stroke_linejoin,
                'stroke-linecap': cur_shape.stroke_linecap,
                fill: 'none',
                opacity: cur_shape.opacity / 2,
                style: 'pointer-events:none'
              }
            });
            if (canvas.isUsingLayerColor) {
              canvas.updateElementColor(newLine);
            }
            selectOnly([newLine], true);
            break;
          case 'circle':
            started = true;
            addSvgElementFromJson({
              element: 'circle',
              curStyles: false,
              attr: {
                cx: x,
                cy: y,
                r: 0,
                id: getNextId(),
                stroke: '#000',
                opacity: cur_shape.opacity / 2
              }
            });
            break;
          case 'ellipse':
            started = true;
            const newElli = addSvgElementFromJson({
              element: 'ellipse',
              curStyles: false,
              attr: {
                cx: x,
                cy: y,
                rx: 0,
                ry: 0,
                id: getNextId(),
                stroke: '#000',
                'fill-opacity': 0,
                fill: 'none',
                opacity: cur_shape.opacity / 2
              }
            });
            if (canvas.isUsingLayerColor) {
              canvas.updateElementColor(newElli);
            }
            selectOnly([newElli], true);
            break;
          case 'text':
            started = true;
            const isMac = process.platform === 'darwin';
            var newText = addSvgElementFromJson({
              element: 'text',
              curStyles: true,
              attr: {
                x: x,
                y: y,
                id: getNextId(),
                fill: 'none',
                'fill-opacity': cur_text.fill_opacity,
                'stroke-width': 2,
                'font-size': cur_text.font_size,
                'font-family': isMac ? cur_text.font_postscriptName : cur_text.font_family,
                'font-postscript': cur_text.font_postscriptName,
                'text-anchor': cur_text.text_anchor,
                'xml:space': 'preserve',
                opacity: cur_shape.opacity
              }
            });
            if (isMac) newText.setAttribute('data-font-family', cur_text.font_family);
            if (canvas.isUsingLayerColor) {
              canvas.updateElementColor(newText);
            }
            break;
          case 'polygon':
            // Polygon is created in ext-polygon.js
            TopBarHintsController.setHint(TopBarHints.Constants.POLYGON);
            break;
          case 'path':
          // Fall through
          case 'pathedit':
            start_x *= current_zoom;
            start_y *= current_zoom;
            if (canvas.isBezierPathAlignToEdge) {
              let { xMatchPoint, yMatchPoint } = canvas.findMatchPoint(mouse_x, mouse_y);
              start_x = xMatchPoint ? xMatchPoint.x * current_zoom : start_x;
              start_y = yMatchPoint ? yMatchPoint.y * current_zoom : start_y;
            }
            pathActions.mouseDown(evt, mouseTarget, start_x, start_y);
            started = true;
            break;
          case 'textedit':
            start_x *= current_zoom;
            start_y *= current_zoom;
            textActions.mouseDown(evt, mouseTarget, start_x, start_y);
            started = true;
            break;
          case 'rotate':
            started = true;
            // we are starting an undoable change (a drag-rotation)
            if (!tempGroup) {
              canvas.undoMgr.beginUndoableChange('transform', selectedElements);
            } else {
              canvas.undoMgr.beginUndoableChange('transform', tempGroup.childNodes);
            }
            break;
          default:
            // This could occur in an extension
            break;
        }

        ext_result = runExtensions('mouseDown', {
          event: evt,
          start_x: start_x,
          start_y: start_y,
          selectedElements: selectedElements,
          ObjectPanelController: ObjectPanelController,
        }, true);

        if (selectedElements.length > 0 && selectedElements[0]) {
          selectedBBox = canvas.getSvgRealLocation(selectedElements[0]);
        } else {
          selectedBBox = null;
        }

        $.each(ext_result, function (i, r) {
          if (r && r.started) {
            started = true;
          }
        });
      };

      // in this function we do not record any state changes yet (but we do update
      // any elements that are still being created, moved or resized on the canvas)
      var mouseMove = function (evt) {
        if (evt.button === 1 || canvas.spaceKey) {
          return;
        }

        root_sctm = $('#svgcontent')[0].getScreenCTM().inverse();
        var i, xya, c, cx, cy, dx, dy, len, angle, box,
          selected = selectedElements[0],
          pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm),
          mouse_x = pt.x * current_zoom,
          mouse_y = pt.y * current_zoom,
          shape = svgedit.utilities.getElem(getId());

        var real_x = mouse_x / current_zoom;
        x = real_x;
        var real_y = mouse_y / current_zoom;
        y = real_y;

        if (!started) {
          if (canvas.isBezierPathAlignToEdge) {
            if (current_mode === 'path') {
              let { xMatchPoint, yMatchPoint } = canvas.findMatchPoint(mouse_x, mouse_y);
              let x = xMatchPoint ? xMatchPoint.x * current_zoom : mouse_x;
              let y = yMatchPoint ? yMatchPoint.y * current_zoom : mouse_y;
              canvas.drawAlignLine(x, y, xMatchPoint, yMatchPoint);
            }
          }

          if (canvas.sensorAreaInfo) {
            if (current_mode === 'select' && !PreviewModeController.isPreviewMode()) {
              let dist = Math.hypot(canvas.sensorAreaInfo.x - mouse_x, canvas.sensorAreaInfo.y - mouse_y);
              if (dist < SENSOR_AREA_RADIUS) {
                $('#workarea').css('cursor', 'move');
              } else {
                if ($('#workarea').css('cursor') === 'move') {
                  if (PreviewModeController.isPreviewMode() || TopBarController.getTopBarPreviewMode()) {
                    $('#workarea').css('cursor', 'url(img/camera-cursor.svg), cell');
                  } else {
                    $('#workarea').css('cursor', 'auto');
                  }
                }
              }
            }
          }

          return;
        }

        if (curConfig.gridSnapping) {
          x = svgedit.utilities.snapToGrid(x);
          y = svgedit.utilities.snapToGrid(y);
        }

        evt.preventDefault();
        var tlist;
        switch (current_mode) {
          case 'select':
            // we temporarily use a translate on the element(s) being dragged
            // this transform is removed upon mousing up and the element is
            // relocated to the new location
            if (selectedElements[0] !== null) {
              dx = x - start_x;
              dy = y - start_y;

              if (curConfig.gridSnapping) {
                dx = svgedit.utilities.snapToGrid(dx);
                dy = svgedit.utilities.snapToGrid(dy);
              }

              if (evt.shiftKey) {
                xya = svgedit.math.snapToAngle(start_x, start_y, x, y);
                dx = xya.x - start_x;
                dy = xya.y - start_y;
              }

              if (dx !== 0 || dy !== 0) {
                len = selectedElements.length;
                for (i = 0; i < len; ++i) {
                  selected = selectedElements[i];
                  if (selected == null) {
                    break;
                  }
                  //							if (i==0) {
                  //								var box = svgedit.utilities.getBBox(selected);
                  //									selectedBBoxes[i].x = box.x + dx;
                  //									selectedBBoxes[i].y = box.y + dy;
                  //							}

                  // update the dummy transform in our transform list
                  // to be a translate
                  var xform = svgroot.createSVGTransform();
                  tlist = svgedit.transformlist.getTransformList(selected);
                  // Note that if Webkit and there's no ID for this
                  // element, the dummy transform may have gotten lost.
                  // This results in unexpected behaviour

                  xform.setTranslate(dx, dy);
                  if (tlist.numberOfItems) {
                    tlist.replaceItem(xform, 0);
                  } else {
                    tlist.appendItem(xform);
                  }

                  // update our internal bbox that we're tracking while dragging
                  // if (tempGroup) {
                  //     Array.from(tempGroup.childNodes).forEach((child) => {
                  //         selectorManager.requestSelector(child).resize();
                  //     });
                  // }
                  selectorManager.requestSelector(selected).resize();
                }
                if (canvas.sensorAreaInfo) {
                  canvas.sensorAreaInfo.dx = dx * current_zoom;
                  canvas.sensorAreaInfo.dy = dy * current_zoom;
                }

                if (selectedBBox) {
                  if (selectedElements[0].tagName === 'ellipse') {
                    ObjectPanelController.updateDimensionValues({
                      cx: selectedBBox.x + selectedBBox.width / 2 + dx,
                      cy: selectedBBox.y + selectedBBox.height / 2 + dy
                    });
                  } else {
                    ObjectPanelController.updateDimensionValues({ x: selectedBBox.x + dx, y: selectedBBox.y + dy });
                  }
                }
                ObjectPanelController.updateObjectPanel();

                call('transition', selectedElements);
              }
            }
            break;
          case 'pre_preview':
          case 'preview':
            real_x *= current_zoom;
            real_y *= current_zoom;
            svgedit.utilities.assignAttributes(rubberBox, {
              'x': Math.min(r_start_x, real_x),
              'y': Math.min(r_start_y, real_y),
              'width': Math.abs(real_x - r_start_x),
              'height': Math.abs(real_y - r_start_y)
            }, 100);
            break;
          case 'multiselect':
            real_x *= current_zoom;
            real_y *= current_zoom;
            svgedit.utilities.assignAttributes(rubberBox, {
              'x': Math.min(r_start_x, real_x),
              'y': Math.min(r_start_y, real_y),
              'width': Math.abs(real_x - r_start_x),
              'height': Math.abs(real_y - r_start_y)
            }, 100);

            // Stop adding elements to selection when mouse moving
            // Select all intersected elements when mouse up

            break;
          case 'resize':
            // we track the resize bounding box and translate/scale the selected element
            // while the mouse is down, when mouse goes up, we use this to recalculate
            // the shape's coordinates
            tlist = svgedit.transformlist.getTransformList(selected);
            var hasMatrix = svgedit.math.hasMatrixTransform(tlist);
            box = hasMatrix ? init_bbox : svgedit.utilities.getBBox(selected);
            let left = box.x;
            let top = box.y;
            let width = box.width;
            let height = box.height;
            dx = (x - start_x);
            dy = (y - start_y);

            if (curConfig.gridSnapping) {
              dx = svgedit.utilities.snapToGrid(dx);
              dy = svgedit.utilities.snapToGrid(dy);
              height = svgedit.utilities.snapToGrid(height);
              width = svgedit.utilities.snapToGrid(width);
            }

            // if rotated, adjust the dx,dy values
            angle = svgedit.utilities.getRotationAngle(selected);
            if (angle) {
              var r = Math.sqrt(dx * dx + dy * dy),
                theta = Math.atan2(dy, dx) - angle * Math.PI / 180.0;
              dx = r * Math.cos(theta);
              dy = r * Math.sin(theta);
            }

            // if not stretching in y direction, set dy to 0
            // if not stretching in x direction, set dx to 0
            if (current_resize_mode.indexOf('n') === -1 && current_resize_mode.indexOf('s') === -1) {
              dy = 0;
            }
            if (current_resize_mode.indexOf('e') === -1 && current_resize_mode.indexOf('w') === -1) {
              dx = 0;
            }

            var ts = null,
              tx = 0,
              ty = 0,
              sy = height ? (height + dy) / height : 1,
              sx = width ? (width + dx) / width : 1;
            // if we are dragging on the north side, then adjust the scale factor and ty
            if (current_resize_mode.indexOf('n') >= 0) {
              sy = height ? (height - dy) / height : 1;
              ty = height;
            }

            // if we dragging on the east side, then adjust the scale factor and tx
            if (current_resize_mode.indexOf('w') >= 0) {
              sx = width ? (width - dx) / width : 1;
              tx = width;
            }

            // update the transform list with translate,scale,translate
            var translateOrigin = svgroot.createSVGTransform(),
              scale = svgroot.createSVGTransform(),
              translateBack = svgroot.createSVGTransform();

            if (curConfig.gridSnapping) {
              left = svgedit.utilities.snapToGrid(left);
              tx = svgedit.utilities.snapToGrid(tx);
              top = svgedit.utilities.snapToGrid(top);
              ty = svgedit.utilities.snapToGrid(ty);
            }
            const isRatioFixed = ObjectPanelController.getDimensionValues('isRatioFixed');
            translateOrigin.setTranslate(-(left + tx), -(top + ty));
            if (isRatioFixed ^ evt.shiftKey) {
              if (sx === 1) {
                sx = sy;
              } else {
                sy = sx;
              }
            }
            scale.setScale(sx, sy);
            translateBack.setTranslate(left + tx, top + ty);
            if (hasMatrix) {
              var diff = angle ? 1 : 0;
              tlist.replaceItem(translateOrigin, 2 + diff);
              tlist.replaceItem(scale, 1 + diff);
              tlist.replaceItem(translateBack, Number(diff));
            } else {
              var N = tlist.numberOfItems;
              tlist.replaceItem(translateBack, N - 3);
              tlist.replaceItem(scale, N - 2);
              tlist.replaceItem(translateOrigin, N - 1);
            }

            //Bounding box calculation
            switch (selected.tagName) {
              case 'rect':
              case 'path':
              case 'use':
              case 'polygon':
              case 'image':
              case 'ellipse':
              case 'g':
                const dCx = tx === 0 ? 0.5 * width * (sx - 1) : 0.5 * width * (1 - sx);
                const dCy = ty === 0 ? 0.5 * height * (sy - 1) : 0.5 * height * (1 - sy);
                theta = angle * Math.PI / 180;
                const newCx = left + width / 2 + dCx * Math.cos(theta) - dCy * Math.sin(theta);
                const newCy = top + height / 2 + dCx * Math.sin(theta) + dCy * Math.cos(theta);
                const newWidth = Math.abs(width * sx);
                const newHeight = Math.abs(height * sy);
                const newLeft = newCx - 0.5 * newWidth;
                const newTop = newCy - 0.5 * newHeight;

                if (selected.tagName === 'ellipse') {
                  ObjectPanelController.updateDimensionValues({ cx: newCx, cy: newCy, rx: newWidth / 2, ry: newHeight / 2 });
                } else {
                  ObjectPanelController.updateDimensionValues({ x: newLeft, y: newTop, width: newWidth, height: newHeight });
                }
                break;
              case 'text':
                //This is a bad hack because vector-effect seems not working when resize text, but work after receiving new stroke width value
                if (selected.getAttribute('stroke-width') === '2') {
                  selected.setAttribute('stroke-width', 2.01);
                } else {
                  selected.setAttribute('stroke-width', 2);
                }
                break;
            }

            if (['rect', 'path, ellipse'].includes(selected.tagName)) {
              if ((width < 0.01 && Math.abs(width * sx) >= 0.01) || (height < 0.01 && Math.abs(height * sy) >= 0.01)) {
                console.log('recal', width, height, width * sx, height * sy);
                svgedit.recalculate.recalculateDimensions(selected);
                initResizeTransform(selected);
                start_x = x;
                start_y = y;
              }
            }

            selectorManager.requestSelector(selected).resize();
            call('transition', selectedElements);
            ObjectPanelController.updateObjectPanel();
            if (svgedit.utilities.getElem('text_cursor')) {
              svgCanvas.textActions.init();
            }
            break;
          case 'zoom':
            real_x *= current_zoom;
            real_y *= current_zoom;
            svgedit.utilities.assignAttributes(rubberBox, {
              'x': Math.min(r_start_x * current_zoom, real_x),
              'y': Math.min(r_start_y * current_zoom, real_y),
              'width': Math.abs(real_x - r_start_x * current_zoom),
              'height': Math.abs(real_y - r_start_y * current_zoom)
            }, 100);
            break;
          case 'text':
            svgedit.utilities.assignAttributes(shape, {
              'x': x,
              'y': y
            }, 1000);
            break;
          case 'line':
            if (curConfig.gridSnapping) {
              x = svgedit.utilities.snapToGrid(x);
              y = svgedit.utilities.snapToGrid(y);
            }

            var x2 = x;
            var y2 = y;

            if (evt.shiftKey) {
              xya = svgedit.math.snapToAngle(start_x, start_y, x2, y2);
              x2 = xya.x;
              y2 = xya.y;
            }
            selectorManager.requestSelector(selected).resize();
            shape.setAttributeNS(null, 'x2', x2);
            shape.setAttributeNS(null, 'y2', y2);
            ObjectPanelController.updateDimensionValues({ x2, y2 });
            ObjectPanelController.updateObjectPanel();
            break;
          case 'foreignObject':
          // fall through
          case 'square':
          // fall through
          case 'rect':
          // fall through
          case 'image':
            var square = (current_mode === 'square') || evt.shiftKey,
              w = Math.abs(x - start_x),
              h = Math.abs(y - start_y),
              new_x, new_y;
            if (square) {
              w = h = Math.max(w, h);
              new_x = start_x < x ? start_x : start_x - w;
              new_y = start_y < y ? start_y : start_y - h;
            } else {
              new_x = Math.min(start_x, x);
              new_y = Math.min(start_y, y);
            }

            if (curConfig.gridSnapping) {
              w = svgedit.utilities.snapToGrid(w);
              h = svgedit.utilities.snapToGrid(h);
              new_x = svgedit.utilities.snapToGrid(new_x);
              new_y = svgedit.utilities.snapToGrid(new_y);
            }

            svgedit.utilities.assignAttributes(shape, {
              'width': w,
              'height': h,
              'x': new_x,
              'y': new_y
            }, 1000);
            ObjectPanelController.updateDimensionValues({ x: new_x, y: new_y, width: w, height: h });
            ObjectPanelController.updateObjectPanel();
            selectorManager.requestSelector(selected).resize();
            break;
          case 'circle':
            c = $(shape).attr(['cx', 'cy']);
            cx = c.cx;
            cy = c.cy;
            var rad = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
            if (curConfig.gridSnapping) {
              rad = svgedit.utilities.snapToGrid(rad);
            }
            shape.setAttributeNS(null, 'r', rad);
            break;
          case 'ellipse':
            c = $(shape).attr(['cx', 'cy']);
            cx = c.cx;
            cy = c.cy;

            shape.setAttributeNS(null, 'rx', Math.abs(x - cx));
            var ry = Math.abs(evt.shiftKey ? (x - cx) : (y - cy));
            shape.setAttributeNS(null, 'ry', ry);

            ObjectPanelController.updateDimensionValues({ rx: Math.abs(x - cx), ry: ry });
            ObjectPanelController.updateObjectPanel();
            selectorManager.requestSelector(selected).resize();
            break;
          case 'fhellipse':
          case 'fhrect':
            freehand.minx = Math.min(real_x, freehand.minx);
            freehand.maxx = Math.max(real_x, freehand.maxx);
            freehand.miny = Math.min(real_y, freehand.miny);
            freehand.maxy = Math.max(real_y, freehand.maxy);
          // break; missing on purpose
          case 'fhpath':
            //				d_attr += + real_x + ',' + real_y + ' ';
            //				shape.setAttributeNS(null, 'points', d_attr);
            end.x = real_x;
            end.y = real_y;
            if (controllPoint2.x && controllPoint2.y) {
              for (i = 0; i < STEP_COUNT - 1; i++) {
                parameter = i / STEP_COUNT;
                nextParameter = (i + 1) / STEP_COUNT;
                bSpline = getBsplinePoint(nextParameter);
                nextPos = bSpline;
                bSpline = getBsplinePoint(parameter);
                sumDistance += Math.sqrt((nextPos.x - bSpline.x) * (nextPos.x - bSpline.x) + (nextPos.y - bSpline.y) * (nextPos.y - bSpline.y));
                if (sumDistance > THRESHOLD_DIST) {
                  d_attr += +bSpline.x + ',' + bSpline.y + ' ';
                  shape.setAttributeNS(null, 'points', d_attr);
                  sumDistance -= THRESHOLD_DIST;
                }
              }
            }
            controllPoint2 = {
              x: controllPoint1.x,
              y: controllPoint1.y
            };
            controllPoint1 = {
              x: start.x,
              y: start.y
            };
            start = {
              x: end.x,
              y: end.y
            };
            break;
          // update path stretch line coordinates
          case 'path':
          // fall through
          case 'pathedit':
            x *= current_zoom;
            y *= current_zoom;

            if (curConfig.gridSnapping) {
              x = svgedit.utilities.snapToGrid(x);
              y = svgedit.utilities.snapToGrid(y);
              start_x = svgedit.utilities.snapToGrid(start_x);
              start_y = svgedit.utilities.snapToGrid(start_y);
            }
            if (evt.shiftKey) {
              var path = svgedit.path.path;
              var x1, y1;
              if (path) {
                x1 = path.dragging ? path.dragging[0] : start_x;
                y1 = path.dragging ? path.dragging[1] : start_y;
              } else {
                x1 = start_x;
                y1 = start_y;
              }
              xya = svgedit.math.snapToAngle(x1, y1, x, y);
              x = xya.x;
              y = xya.y;
            }

            if (rubberBox && rubberBox.getAttribute('display') !== 'none') {
              real_x *= current_zoom;
              real_y *= current_zoom;
              svgedit.utilities.assignAttributes(rubberBox, {
                'x': Math.min(r_start_x * current_zoom, real_x),
                'y': Math.min(r_start_y * current_zoom, real_y),
                'width': Math.abs(real_x - r_start_x * current_zoom),
                'height': Math.abs(real_y - r_start_y * current_zoom)
              }, 100);
            }
            if (canvas.isBezierPathAlignToEdge) {
              let { xMatchPoint, yMatchPoint } = canvas.findMatchPoint(mouse_x, mouse_y);
              x = xMatchPoint ? xMatchPoint.x * current_zoom : x;
              y = yMatchPoint ? yMatchPoint.y * current_zoom : y;
              canvas.drawAlignLine(x, y, xMatchPoint, yMatchPoint);
            }
            pathActions.mouseMove(x, y);

            break;
          case 'textedit':
            x *= current_zoom;
            y *= current_zoom;
            //					if (rubberBox && rubberBox.getAttribute('display') !== 'none') {
            //						svgedit.utilities.assignAttributes(rubberBox, {
            //							'x': Math.min(start_x,x),
            //							'y': Math.min(start_y,y),
            //							'width': Math.abs(x-start_x),
            //							'height': Math.abs(y-start_y)
            //						},100);
            //					}

            textActions.mouseMove(mouse_x, mouse_y);

            break;
          case 'rotate':
            box = svgedit.utilities.getBBox(selected);
            cx = box.x + box.width / 2;
            cy = box.y + box.height / 2;
            var m = svgedit.math.getMatrix(selected),
              center = svgedit.math.transformPoint(cx, cy, m);
            cx = center.x;
            cy = center.y;
            angle = ((Math.atan2(cy - y, cx - x) * (180 / Math.PI)) - 90) % 360;
            if (curConfig.gridSnapping) {
              angle = svgedit.utilities.snapToGrid(angle);
            }
            if (evt.shiftKey) { // restrict rotations to nice angles (WRS)
              var snap = 45;
              angle = Math.round(angle / snap) * snap;
            }

            canvas.setRotationAngle(angle < -180 ? (360 + angle) : angle, true);
            call('transition', selectedElements);
            ObjectPanelController.updateDimensionValues({ rotation: angle < -180 ? (360 + angle) : angle });
            ObjectPanelController.updateObjectPanel();
            if (svgedit.utilities.getElem('text_cursor')) {
              svgCanvas.textActions.init();
            }
            break;
          default:
            break;
        }

        runExtensions('mouseMove', {
          event: evt,
          mouse_x: mouse_x,
          mouse_y: mouse_y,
          selected: selected,
          ObjectPanelController: ObjectPanelController,
        });

      }; // mouseMove()

      // - in create mode, the element's opacity is set properly, we create an InsertElementCommand
      // and store it on the Undo stack
      // - in move/resize mode, the element's attributes which were affected by the move/resize are
      // identified, a ChangeElementCommand is created and stored on the stack for those attrs
      // this is done in when we recalculate the selected dimensions()
      var mouseUp = async function (evt) {
        if (evt.button === 2) {
          return;
        }
        var tempJustSelected = justSelected;
        justSelected = null;
        if (!started) {
          return;
        }
        var pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm),
          mouse_x = pt.x * current_zoom,
          mouse_y = pt.y * current_zoom,
          x = mouse_x / current_zoom,
          y = mouse_y / current_zoom,
          element = svgedit.utilities.getElem(getId()),
          keep = false;

        var real_x = x;
        var real_y = y;

        // TODO: Make true when in multi-unit mode
        var useUnit = false; // (curConfig.baseUnit !== 'px');
        started = false;
        var attrs, t;
        selectedElements = selectedElements.filter((e) => e !== null);
        const isContinuousDrawing = BeamboxPreference.read('continuous_drawing');

        const doPreview = (start_x, start_y, real_x, real_y) => {
          const callback = () => {
            TopBarController.updateTopBar();
            if (TutorialController.getNextStepRequirement() === TutorialConstants.PREVIEW_PLATFORM) {
              TutorialController.handleNextStep();
            }
          };
          BeamboxActions.startDrawingPreviewBlob();
          if (PreviewModeController.isPreviewMode()) {
            if (start_x === real_x && start_y === real_y) {
              PreviewModeController.preview(real_x, real_y, true, () => callback());
            } else {
              PreviewModeController.previewRegion(start_x, start_y, real_x, real_y, () => callback());
            }
          }
        };

        switch (current_mode) {
          case 'pre_preview':
            if (rubberBox != null) {
              rubberBox.setAttribute('display', 'none');
              curBBoxes = [];
            };
            current_mode = 'select';
            TopBarController.setStartPreviewCallback(() => {
              doPreview(start_x, start_y, real_x, real_y);
            });
            TopBarController.setShouldStartPreviewController(true);
            return;
          case 'preview':
            if (rubberBox != null) {
              rubberBox.setAttribute('display', 'none');
              curBBoxes = [];
            };
            doPreview(start_x, start_y, real_x, real_y);
            current_mode = 'select';
          // intentionally fall-through to select here
          case 'resize':
          case 'multiselect':
            if (current_mode === 'multiselect') {
              curBBoxes = [];
              let intersectedElements = getIntersectionList();
              intersectedElements = intersectedElements.filter((elem) => {
                const layer = LayerHelper.getObjectLayer(elem);
                if (!layer) {
                  return false;
                }
                const layerElem = layer.elem;
                if (layerElem.getAttribute('data-lock') || layerElem.getAttribute('display') === 'none') {
                  return false;
                }
                return true;
              });
              selectedElements = intersectedElements;
              call('selected', selectedElements);
            }
            if (rubberBox != null) {
              rubberBox.setAttribute('display', 'none');
              curBBoxes = [];
            }
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
            $('#left-Shoot').addClass('active');
          case 'select':
            if (selectedElements[0] != null) {
              // if we only have one selected element
              if (selectedElements[1] == null) {
                // set our current stroke/fill properties to the element's
                var selected = selectedElements[0];
                switch (selected.tagName) {
                  case 'g':
                  case 'use':
                  case 'image':
                  case 'foreignObject':
                    break;
                  default:
                    let val = selected.getAttribute('fill');
                    if (val !== null) cur_properties.fill = val;
                    val = selected.getAttribute('fill-opacity');
                    if (val !== null) cur_properties.fill_opacity = val;
                    val = selected.getAttribute('stroke');
                    if (val !== null) cur_properties.stroke = val;
                    val = selected.getAttribute('stroke-opacity');
                    if (val !== null) cur_properties.stroke_opacity = val;
                    val = selected.getAttribute('stroke-width');
                    if (val !== null) cur_properties.stroke_width = val;
                    val = selected.getAttribute('stroke-dasharray');
                    if (val !== null) cur_properties.stroke_dasharray = val;
                    val = selected.getAttribute('stroke-linejoin');
                    if (val !== null) cur_properties.stroke_linejoin = val;
                    val = selected.getAttribute('stroke-linecap');
                    if (val !== null) cur_properties.stroke_linecap = val;
                }

                if (selected.tagName === 'text') {
                  cur_text.font_size = selected.getAttribute('font-size');
                  if (process.platform === 'mac') {
                    cur_text.font_family = selected.getAttribute('data-font-family');
                  } else {
                    cur_text.font_family = selected.getAttribute('font-family');
                  }
                  cur_text.font_postscriptName = selected.getAttribute('font-postscript');
                }
                selectorManager.requestSelector(selected).showGrips(true);

                const targetLayer = LayerHelper.getObjectLayer(selected);
                const currentLayer = getCurrentDrawing().getCurrentLayer();
                if (targetLayer && !selectedElements.includes(targetLayer.elem) && targetLayer.elem !== currentLayer) {
                  svgCanvas.setCurrentLayer(targetLayer.title);
                  LayerPanelController.setSelectedLayers([targetLayer.title]);
                }
              }
              // always recalculate dimensions to strip off stray identity transforms
              const cmd = recalculateAllSelectedDimensions(true);
              if (cmd && !cmd.isEmpty()) {
                mouseSelectModeCmds.push(cmd);
              }
              // if it was being dragged/resized
              if (real_x !== r_start_x || real_y !== r_start_y) {
                var i, len = selectedElements.length;
                if (current_mode === 'resize') {
                  const allSelectedUses = [];
                  selectedElements.forEach((e) => {
                    if (e.tagName === 'use') {
                      allSelectedUses.push(e);
                    } else if (e.tagName === 'g') {
                      allSelectedUses.push(...Array.from(e.querySelectorAll('use')));
                    }
                  });
                  SymbolMaker.reRenderImageSymbolArray(allSelectedUses);
                }
                if (current_mode !== 'multiselect') {
                  // Not sure if this is necessary, but multiselect does not need this
                  for (i = 0; i < len; ++i) {
                    if (selectedElements[i] == null) {
                      break;
                    }
                    if (!selectedElements[i].firstChild && selectedElements[i].tagName !== 'use') {
                      // Not needed for groups (incorrectly resizes elems), possibly not needed at all?
                      selectorManager.requestSelector(selectedElements[i]).resize();
                    }
                  }
                }
                current_mode = 'select';
              }
              // no change in position/size, so maybe we should move to pathedit
              else {
                current_mode = 'select';
                t = evt.target;
                if (selectedElements[0].nodeName === 'path' && selectedElements[1] == null) {
                  pathActions.select(selectedElements[0]);
                } // if it was a path
                // else, if it was selected and this is a shift-click, remove it from selection
                else if (evt.shiftKey) {
                  if (tempJustSelected !== t) {
                    canvas.removeFromSelection([t]);
                  }
                }
              } // no change in mouse position

              // Remove non-scaling stroke
              if (svgedit.browser.supportsNonScalingStroke()) {
                var elem = selectedElements[0];
                if (elem) {
                  elem.removeAttribute('style');
                  svgedit.utilities.walkTree(elem, function (elem) {
                    elem.removeAttribute('style');
                  });
                }
              }
              if (canvas.sensorAreaInfo) {
                canvas.sensorAreaInfo.x += canvas.sensorAreaInfo.dx;
                canvas.sensorAreaInfo.y += canvas.sensorAreaInfo.dy;
                canvas.sensorAreaInfo.dx = 0;
                canvas.sensorAreaInfo.dy = 0;
              }
            } else {
              current_mode = 'select';
            }

            if (selectedElements.length > 1) {
              svgCanvas.tempGroupSelectedElements();
              svgEditor.updateContextPanel();
            }

            if (mouseSelectModeCmds.length > 1) {
              const batchCmd = new svgedit.history.BatchCommand('Mouse Event');
              for (let i = 0; i < mouseSelectModeCmds.length; i++) {
                batchCmd.addSubCommand(mouseSelectModeCmds[i]);
              }
              addCommandToHistory(batchCmd);
            } else if (mouseSelectModeCmds.length === 1) {
              addCommandToHistory(mouseSelectModeCmds[0]);
            }

            return;
          //zoom is broken
          case 'zoom':
            if (rubberBox != null) {
              rubberBox.setAttribute('display', 'none');
            }
            call('zoomed');
            return;
          case 'fhpath':
            // Check that the path contains at least 2 points; a degenerate one-point path
            // causes problems.
            // Webkit ignores how we set the points attribute with commas and uses space
            // to separate all coordinates, see https://bugs.webkit.org/show_bug.cgi?id=29870
            sumDistance = 0;
            controllPoint2 = {
              x: 0,
              y: 0
            };
            controllPoint1 = {
              x: 0,
              y: 0
            };
            start = {
              x: 0,
              y: 0
            };
            end = {
              x: 0,
              y: 0
            };
            var coords = element.getAttribute('points');
            var commaIndex = coords.indexOf(',');
            if (commaIndex >= 0) {
              keep = coords.indexOf(',', commaIndex + 1) >= 0;
            } else {
              keep = coords.indexOf(' ', coords.indexOf(' ') + 1) >= 0;
            }
            if (keep) {
              element = pathActions.smoothPolylineIntoPath(element);
            }
            break;
          case 'line':
            attrs = $(element).attr(['x1', 'x2', 'y1', 'y2']);
            keep = (attrs.x1 !== attrs.x2 || attrs.y1 !== attrs.y2);
            if (!isContinuousDrawing) {
              canvas.setMode('select');
            }
            break;
          case 'foreignObject':
          case 'square':
          case 'rect':
            attrs = $(element).attr(['width', 'height']);
            keep = (attrs.width != 0 && attrs.height != 0);
            if (TutorialController.getNextStepRequirement() === TutorialConstants.DRAW_A_RECT && keep) {
              TutorialController.handleNextStep();
              canvas.setMode('select');
            } else {
              if (!isContinuousDrawing) {
                canvas.setMode('select');
              }
            }
            break;
          case 'image':
            // Image should be kept regardless of size (use inherit dimensions later)
            keep = true;
            current_mode = 'select';
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
            break;
          case 'circle':
            keep = (element.getAttribute('r') != 0);
            break;
          case 'ellipse':
            attrs = $(element).attr(['rx', 'ry']);
            keep = (attrs.rx > 0 && attrs.ry > 0);
            if (TutorialController.getNextStepRequirement() === TutorialConstants.DRAW_A_CIRCLE && keep) {
              TutorialController.handleNextStep();
              canvas.setMode('select');
            } else {
              if (!isContinuousDrawing) {
                canvas.setMode('select');
              }
            }
            break;
          case 'fhellipse':
            if ((freehand.maxx - freehand.minx) > 0 &&
              (freehand.maxy - freehand.miny) > 0) {
              element = addSvgElementFromJson({
                element: 'ellipse',
                curStyles: true,
                attr: {
                  cx: (freehand.minx + freehand.maxx) / 2,
                  cy: (freehand.miny + freehand.maxy) / 2,
                  rx: (freehand.maxx - freehand.minx) / 2,
                  ry: (freehand.maxy - freehand.miny) / 2,
                  id: getId()
                }
              });
              call('changed', [element]);
              keep = true;
            }
            break;
          case 'fhrect':
            if ((freehand.maxx - freehand.minx) > 0 &&
              (freehand.maxy - freehand.miny) > 0) {
              element = addSvgElementFromJson({
                element: 'rect',
                curStyles: true,
                attr: {
                  x: freehand.minx,
                  y: freehand.miny,
                  width: (freehand.maxx - freehand.minx),
                  height: (freehand.maxy - freehand.miny),
                  id: getId()
                }
              });
              call('changed', [element]);
              keep = true;
            }
            break;
          case 'text':
            keep = true;
            selectOnly([element]);
            textActions.start(element);
            break;
          case 'polygon':
            //Polygon creation is in ext-polygon.js
            TopBarHintsController.removeHint();
            break;
          case 'path':
            // set element to null here so that it is not removed nor finalized
            element = null;
            // continue to be set to true so that mouseMove happens
            started = true;
            $('#x_align_line').remove();
            $('#y_align_line').remove();

            var res = pathActions.mouseUp(evt, element, mouse_x, mouse_y);
            element = res.element;
            keep = res.keep;
            break;
          case 'pathedit':
            keep = true;
            element = null;
            $('#x_align_line').remove();
            $('#y_align_line').remove();
            pathActions.mouseUp(evt);
            break;
          case 'textedit':
            keep = false;
            element = null;
            textActions.mouseUp(evt, mouse_x, mouse_y);
            break;
          case 'rotate':
            keep = true;
            element = null;
            current_mode = 'select';
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
            var batchCmd = canvas.undoMgr.finishUndoableChange();
            if (!batchCmd.isEmpty()) {
              addCommandToHistory(batchCmd);
            }
            // perform recalculation to weed out any stray identity transforms that might get stuck
            recalculateAllSelectedDimensions();
            call('changed', selectedElements);
            break;
          default:
            // This could occur in an extension
            break;
        }

        if (selectedElements.length > 1) {
          svgCanvas.tempGroupSelectedElements();
          svgEditor.updateContextPanel();
        }

        var ext_result = runExtensions('mouseUp', {
          event: evt,
          mouse_x: mouse_x,
          mouse_y: mouse_y,
          isContinuousDrawing
        }, true);

        $.each(ext_result, function (i, r) {
          if (r) {
            keep = r.keep || keep;
            element = r.element;
            started = r.started || started;
          }
        });

        if (!keep && element != null) {
          getCurrentDrawing().releaseId(getId());
          svgedit.transformlist.removeElementFromListMap(element);
          selectorManager.releaseSelector(element);
          element.parentNode.removeChild(element);
          element = null;
          t = evt.target;
          clearSelection();

          // if this element is in a group, go up until we reach the top-level group
          // just below the layer groups
          // TODO: once we implement links, we also would have to check for <a> elements
          while (t.parentNode.parentNode.tagName === 'g') {
            t = t.parentNode;
          }
          // if we are not in the middle of creating a path, and we've clicked on some shape,
          // then go to Select mode.
          // WebKit returns <div> when the canvas is clicked, Firefox/Opera return <svg>
          if ((current_mode !== 'path' || !drawn_path) &&
            t.parentNode.id !== 'selectorParentGroup' &&
            t.id !== 'svgcanvas' && t.id !== 'svgroot') {
            // switch into "select" mode if we've clicked on an element
            canvas.setMode('select');
            selectOnly([t], true);
          }

        } else if (element != null) {
          canvas.addedNew = true;

          if (useUnit) {
            svgedit.units.convertAttrs(element);
          }

          var ani_dur = 0.2,
            c_ani;
          if (opac_ani.beginElement && element.getAttribute('opacity') != cur_shape.opacity) {
            c_ani = $(opac_ani).clone().attr({
              to: cur_shape.opacity,
              dur: ani_dur
            }).appendTo(element);
            try {
              // Fails in FF4 on foreignObject
              c_ani[0].beginElement();
            } catch (e) { }
          } else {
            ani_dur = 0;
          }

          // Ideally this would be done on the endEvent of the animation,
          // but that doesn't seem to be supported in Webkit
          setTimeout(function () {
            if (c_ani) {
              c_ani.remove();
            }
            element.setAttribute('opacity', cur_shape.opacity);
            element.setAttribute('style', 'pointer-events:inherit');
            cleanupElement(element);
            addCommandToHistory(new svgedit.history.InsertElementCommand(element));
            if (curConfig.selectNew && !isContinuousDrawing) {
              if (current_mode === 'textedit') {
                selectorManager.requestSelector(element).showGrips(true);
              } else {
                if (element.parentNode) {
                  selectOnly([element], true);
                  call('changed', [element]);
                }
              }
            }
          }, ani_dur * 1000);
        }
        if (isContinuousDrawing && current_mode !== 'textedit') {
          clearSelection();
        }

        startTransform = null;
      };

      const mouseEnter = (evt) => {
        if (started && (evt.buttons & 1) === 0) {
          mouseUp(evt);
        }
      }

      var dblClick = function (evt) {
        var evt_target = evt.target;
        var parent = evt_target.parentNode;

        // Do nothing if already in current group
        if (parent === current_group) {
          return;
        }

        var mouseTarget = getMouseTarget(evt);
        var tagName = mouseTarget.tagName;

        if (tagName === 'text' && !['textedit', 'text'].includes(current_mode)) {
          var pt = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm);
          textActions.select(mouseTarget, pt.x, pt.y);
        }

        if ((tagName === 'g' || tagName === 'a') && svgedit.utilities.getRotationAngle(mouseTarget)) {
          // TODO: Ingroup Edit Mode

          // Ungroup and regroup
          // pushGroupProperties(mouseTarget);
          // mouseTarget = selectedElements[0];
          // clearSelection(true);
          return;
        }
        // Reset context
        if (current_group) {
          leaveContext();
        }

        if ((parent.tagName !== 'g' && parent.tagName !== 'a') ||
          parent === getCurrentDrawing().getCurrentLayer() ||
          mouseTarget === selectorManager.selectorParentGroup) {
          // Escape from in-group edit
          return;
        }
        // setContext(mouseTarget);
      };

      // prevent links from being followed in the canvas
      var handleLinkInCanvas = function (e) {
        e.preventDefault();
        return false;
      };

      // Added mouseup to the container here.
      // TODO(codedread): Figure out why after the Closure compiler, the window mouseup is ignored.
      container.addEventListener('mousedown', mouseDown);
      container.addEventListener('mousemove', mouseMove);
      container.addEventListener('mouseup', mouseUp);
      container.addEventListener('mouseenter', mouseEnter);
      container.addEventListener('click', handleLinkInCanvas);
      container.addEventListener('dblclick', dblClick);

      //TODO(rafaelcastrocouto): User preference for shift key and zoom factor

      $(container).bind('wheel DOMMouseScroll', (function () {
        let targetZoom;
        let timer;
        let trigger = Date.now();

        return function (e) {
          e.stopImmediatePropagation();
          e.preventDefault();
          const evt = e.originalEvent;
          evt.stopImmediatePropagation();
          evt.preventDefault();

          targetZoom = svgCanvas.getZoom();

          const mouseInputDevice = BeamboxPreference.read('mouse_input_device');
          const isTouchpad = (mouseInputDevice === 'TOUCHPAD');

          if (isTouchpad) {
            if (e.ctrlKey) {
              _zoomAsIllustrator();
            } else {
              _panAsIllustrator();
            }
          } else {
            _zoomAsIllustrator();
            //panning is default behavior when pressing middle button
          }

          function _zoomProcess() {
            // End of animation
            const currentZoom = svgCanvas.getZoom();
            if ((currentZoom === targetZoom) || (Date.now() - trigger > 500)) {
              clearInterval(timer);
              timer = undefined;
              return;
            }

            // Calculate next animation zoom level
            var nextZoom = currentZoom + (targetZoom - currentZoom) / 5;

            if (Math.abs(targetZoom - currentZoom) < 0.005) {
              nextZoom = targetZoom;
            }

            const cursorPosition = {
              x: evt.pageX,
              y: evt.pageY
            };

            call('zoomed', {
              zoomLevel: nextZoom,
              staticPoint: cursorPosition
            });
          }

          function _zoomAsIllustrator() {
            const delta = (evt.wheelDelta) ? evt.wheelDelta : (evt.detail) ? -evt.detail : 0;
            if (isTouchpad) {
              targetZoom = targetZoom * 1.1 ** (delta / 100);
            } else {
              targetZoom = targetZoom * 1.1 ** (delta / 50);
            }

            targetZoom = Math.min(20, targetZoom);
            targetZoom = Math.max(0.1, targetZoom);
            if ((targetZoom > 19) && (delta > 0)) {
              return;
            }

            if (!timer) {
              const interval = 20;
              timer = setInterval(_zoomProcess, interval);
            }

            // due to wheel event bug (which zoom gesture will sometimes block all other processes), we trigger the zoomProcess about every few miliseconds
            if (Date.now() - trigger > 20) {
              _zoomProcess();
              trigger = Date.now();
            }
          }

          function _panAsIllustrator() {
            requestAnimationFrame(() => {
              const scrollLeft = $('#workarea').scrollLeft() + evt.deltaX / 2.0;
              const scrollTop = $('#workarea').scrollTop() + evt.deltaY / 2.0;
              $('#workarea').scrollLeft(scrollLeft);
              $('#workarea').scrollTop(scrollTop);
            });
          }
        };
      })());

    })();


    // Group: Text edit functions
    // Functions relating to editing text elements
    // TODO: split textAction to an independent file
    textActions = canvas.textActions = (function () {
      var curtext;
      var textinput;
      var cursor;
      var selblock;
      var blinker;
      var chardata = [];
      var textbb, transbb;
      var matrix;
      var last_x, last_y;
      var allow_dbl;
      let lineSpacing = 1;
      let isVertical = false;
      let previousMode = 'select';
      let valueBeforeEdit = '';
      let isEditing = false;

      function setCursor(index) {
        var empty = (textinput.value === '');
        $(textinput).focus();
        if (!arguments.length) {
          if (empty) {
            index = 0;
          } else {
            if (textinput.selectionEnd !== textinput.selectionStart) {
              return;
            }
            index = textinput.selectionEnd;
          }
        }

        if (!empty) {
          textinput.setSelectionRange(index, index);
        }
        let charbb;
        let { rowIndex, index: columnIndex } = indexToRowAndIndex(index);
        charbb = chardata[rowIndex][columnIndex];
        if (!charbb) {
          return;
        }

        cursor = svgedit.utilities.getElem('text_cursor');

        if (!cursor) {
          cursor = document.createElementNS(NS.SVG, 'line');
          svgedit.utilities.assignAttributes(cursor, {
            id: 'text_cursor',
            stroke: '#333',
            'stroke-width': 1
          });
          cursor = svgedit.utilities.getElem('selectorParentGroup').appendChild(cursor);
        }

        if (!blinker) {
          blinker = setInterval(function () {
            var show = (cursor.getAttribute('display') === 'none');
            cursor.setAttribute('display', show ? 'inline' : 'none');
          }, 600);
        }
        var start_pt = ptToScreen(charbb.x, charbb.y);
        var end_pt = isVertical ? ptToScreen(charbb.x + charbb.width, charbb.y) : ptToScreen(charbb.x, charbb.y + charbb.height);
        svgedit.utilities.assignAttributes(cursor, {
          x1: start_pt.x,
          y1: start_pt.y,
          x2: end_pt.x,
          y2: end_pt.y,
          visibility: 'visible',
          display: 'inline'
        });

        if (selblock) {
          selblock.setAttribute('d', '');
        }
      }

      const calculateCharbb = () => {
        if (!curtext) {
          let bb = { x: 0, y: 0, width: 0, height: 0 };
          chardata.push([bb]);
          return;
        }
        let tspans = Array.from(curtext.childNodes).filter((child) => child.tagName === 'tspan');
        let rowNumbers = tspans.length;
        const charHeight = parseFloat(canvas.getFontSize());
        let lines = textinput.value.split('\x0b');
        let lastRowX = null;

        // No contents
        if (rowNumbers === 0) {
          let bb = isVertical ? { x: textbb.x, y: textbb.y + (textbb.height / 2), width: charHeight, height: 0 }
            : { x: textbb.x + (textbb.width / 2), y: textbb.y, width: 0, height: charHeight };
          chardata.push([bb]);
          return;
        }

        // When text is vertical, we use the widest char as first row's width
        let firstRowMaxWidth = 0;
        if (isVertical && rowNumbers > 0) {
          for (let i = 0; i < tspans[0].textContent.length; i++) {
            let start = tspans[0].getStartPositionOfChar(i);
            let end = tspans[0].getEndPositionOfChar(i);
            firstRowMaxWidth = Math.max(firstRowMaxWidth, end.x - start.x);
          }
        }

        for (let i = 0; i < rowNumbers; ++i) {
          chardata.push([]);
          let start, end;
          let tspanbb = svgedit.utilities.getBBox(tspans[i]);
          if (lines[i] === '') {
            tspans[i].textContent = ' ';
          };

          for (let j = 0; j < tspans[i].textContent.length; ++j) {
            start = tspans[i].getStartPositionOfChar(j);
            end = tspans[i].getEndPositionOfChar(j);

            if (!svgedit.browser.supportsGoodTextCharPos()) {
              var offset = canvas.contentW * current_zoom;
              start.x -= offset;
              end.x -= offset;

              start.x /= current_zoom;
              end.x /= current_zoom;
            }
            chardata[i].push({
              x: start.x,
              y: isVertical ? start.y - charHeight : tspanbb.y,
              width: isVertical ? (i === 0 ? firstRowMaxWidth : lastRowX - start.x) : end.x - start.x,
              height: charHeight
            });
          }
          // Add a last bbox for cursor at end of text
          // Because we insert a space for empty line, we don't add last bbox for empty line
          if (lines[i] !== '') {
            chardata[i].push({
              x: isVertical ? start.x : end.x,
              y: isVertical ? end.y : tspanbb.y,
              width: isVertical ? (i === 0 ? firstRowMaxWidth : lastRowX - start.x) : 0,
              height: isVertical ? 0 : charHeight
            });
          } else {
            tspans[i].textContent = '';
          }
          lastRowX = start.x;
        };
      };

      function indexToRowAndIndex(index) {
        let rowIndex = 0;
        if (!chardata || chardata.length === 0) {
          calculateCharbb();
        }
        while (index >= chardata[rowIndex].length) {
          index -= chardata[rowIndex].length;
          rowIndex += 1;
        }
        return { rowIndex, index };
      }

      function setSelection(start, end, skipInput) {
        if (start === end) {
          setCursor(end);
          return;
        }

        if (!skipInput) {
          textinput.setSelectionRange(start, end);
        }

        selblock = svgedit.utilities.getElem('text_selectblock');
        if (!selblock && document.getElementById('text_cursor')) {
          selblock = document.createElementNS(NS.SVG, 'path');
          svgedit.utilities.assignAttributes(selblock, {
            id: 'text_selectblock',
            fill: 'green',
            opacity: 0.5,
            style: 'pointer-events:none'
          });
          svgedit.utilities.getElem('selectorParentGroup').appendChild(selblock);
        }

        let { rowIndex: startRowIndex, index: startIndex } = indexToRowAndIndex(start);
        let { rowIndex: endRowIndex, index: endIndex } = indexToRowAndIndex(end);

        var startbb = chardata[startRowIndex][startIndex];
        var endbb = chardata[endRowIndex][endIndex];

        cursor.setAttribute('visibility', 'hidden');

        let dString;
        let points = [];
        //drawing selection block
        if (startRowIndex === endRowIndex) {
          if (isVertical) {
            points = [[startbb.x, startbb.y], [endbb.x, endbb.y], [endbb.x + endbb.width, endbb.y], [startbb.x + startbb.width, startbb.y]];
          } else {
            points = [[startbb.x, startbb.y], [endbb.x, endbb.y], [endbb.x, endbb.y + endbb.height], [startbb.x, startbb.y + startbb.height]];
          }
        } else {
          if (isVertical) {
            points = [[startbb.x + startbb.width, startbb.y], [startbb.x + startbb.width, textbb.y + textbb.height], [endbb.x + endbb.width, textbb.y + textbb.height],
            [endbb.x + endbb.width, endbb.y], [endbb.x, endbb.y], [endbb.x, textbb.y], [startbb.x, textbb.y], [startbb.x, startbb.y]];
          } else {
            points = [[startbb.x, startbb.y], [textbb.x + textbb.width, startbb.y], [textbb.x + textbb.width, endbb.y], [endbb.x, endbb.y],
            [endbb.x, endbb.y + endbb.height], [textbb.x, endbb.y + endbb.height], [textbb.x, startbb.y + startbb.height], [startbb.x, startbb.y + startbb.height]];
          }
        }
        points = points.map(p => ptToScreen(p[0], p[1]));
        points = points.map(p => `${p.x},${p.y}`);
        dString = `M ${points.join(' L ')} z`;

        if (selblock) {
          svgedit.utilities.assignAttributes(selblock, {
            d: dString,
            'display': 'inline'
          });
        }
      }

      function getIndexFromPoint(mouse_x, mouse_y) {
        // Position cursor here
        var pt = svgroot.createSVGPoint();
        pt.x = mouse_x;
        pt.y = mouse_y;

        // No content, so return 0
        if (chardata.length === 1 && chardata[0].length === 1) {
          return 0;
        }
        // Determine if cursor should be on left or right of character
        var charpos = curtext.getCharNumAtPosition(pt);
        let rowIndex = 0;
        textbb = svgedit.utilities.getBBox(curtext);
        //console.log(textbb);
        if (charpos < 0) {
          // Out of text range, look at mouse coords
          const totalLength = chardata.reduce((acc, cur) => acc + cur.length, 0);
          charpos = totalLength - 1;
          if (mouse_x <= chardata[0][0].x) {
            charpos = 0;
          }
          if (textbb.x < mouse_x && mouse_x < textbb.x + textbb.width && textbb.y < mouse_y && mouse_y < textbb.y + textbb.height) {
            return false;
          }
        } else {
          let index = charpos;
          while (index >= chardata[rowIndex].length - 1) {
            index -= chardata[rowIndex].length - 1;
            rowIndex += 1;
          }
          const charbb = chardata[rowIndex][index];
          if (isVertical) {
            const mid = charbb.y + (charbb.height / 2);
            if (mouse_y > mid) {
              charpos++;
            }
          } else {
            const mid = charbb.x + (charbb.width / 2);
            if (mouse_x > mid) {
              charpos++;
            }
          }
        }
        //Add rowIndex because charbb = charnum + 1 in every row
        return charpos + rowIndex;
      }

      function setCursorFromPoint(mouse_x, mouse_y) {
        setCursor(getIndexFromPoint(mouse_x, mouse_y));
      }

      function setEndSelectionFromPoint(x, y, apply) {
        let i1 = textinput.selectionStart;
        let i2 = getIndexFromPoint(x, y);
        if (i2 === false) {
          return;
        }
        let start = Math.min(i1, i2);
        let end = Math.max(i1, i2);
        setSelection(start, end, !apply);
      }

      function screenToPt(x_in, y_in) {
        var out = {
          x: x_in,
          y: y_in
        };

        out.x /= current_zoom;
        out.y /= current_zoom;

        if (matrix) {
          var pt = svgedit.math.transformPoint(out.x, out.y, matrix.inverse());
          out.x = pt.x;
          out.y = pt.y;
        }

        return out;
      }

      function ptToScreen(x_in, y_in) {
        var out = {
          x: x_in,
          y: y_in
        };

        if (matrix) {
          var pt = svgedit.math.transformPoint(out.x, out.y, matrix);
          out.x = pt.x;
          out.y = pt.y;
        }

        out.x *= current_zoom;
        out.y *= current_zoom;

        return out;
      }

      function hideCursor() {
        clearInterval(blinker);
        blinker = null;
        document.getElementById('text_cursor')?.remove();
        document.getElementById('text_selectblock')?.remove();
      }

      let moveCursorLastRow = () => {
        let { rowIndex, index } = indexToRowAndIndex(textinput.selectionEnd);
        if (rowIndex === 0) {
          textinput.selectionEnd = textinput.selectionStart = 0;
        } else {
          let newCursorIndex = 0;
          rowIndex -= 1;
          for (let i = 0; i < rowIndex; i++) {
            newCursorIndex += chardata[i].length;
          }
          newCursorIndex += Math.min(chardata[rowIndex].length - 1, index);
          textinput.selectionEnd = textinput.selectionStart = newCursorIndex;
        }
      };

      let moveCursorNextRow = () => {
        let { rowIndex, index } = indexToRowAndIndex(textinput.selectionEnd);
        if (rowIndex === chardata.length - 1) {
          textinput.selectionEnd += chardata[rowIndex].length - index - 1;
          textinput.selectionStart = textinput.selectionEnd;
        } else {
          let newCursorIndex = 0;
          rowIndex += 1;
          for (let i = 0; i < rowIndex; i++) {
            newCursorIndex += chardata[i].length;
          }
          newCursorIndex += Math.min(chardata[rowIndex].length - 1, index);
          textinput.selectionEnd = textinput.selectionStart = newCursorIndex;
        }
      };

      function selectAll(evt) {
        setSelection(0, curtext.textContent.length);
        $(this).unbind(evt);
      }

      function selectWord(evt) {
        if (!allow_dbl || !curtext) {
          return;
        }

        var ept = svgedit.math.transformPoint(evt.pageX, evt.pageY, root_sctm),
          mouse_x = ept.x * current_zoom,
          mouse_y = ept.y * current_zoom;
        var pt = screenToPt(mouse_x, mouse_y);

        var index = getIndexFromPoint(pt.x, pt.y);
        var str = curtext.textContent;
        var first = str.substr(0, index).replace(/[a-z0-9]+$/i, '').length;
        var m = str.substr(index).match(/^[a-z0-9]+/i);
        var last = (m ? m[0].length : 0) + index;
        setSelection(first, last);

        // Set tripleclick
        $(evt.target).click(selectAll);
        setTimeout(function () {
          $(evt.target).unbind('click', selectAll);
        }, 300);
      }

      class ChangeTextCommand {
        constructor(elem, oldText, newText) {
          this.elem = elem;
          this.desc = `Change ${elem.id || elem.tagName} from ${oldText} to ${newText}`
          this.oldText = oldText;
          this.newText = newText;
        }

        type() { return 'svgcanvas.textAction.ChangeTextCommand'; }

        elements() { return [this.elem]; }

        getText() { return this.desc; }

        apply(handler) {
          if (handler) {
            handler.handleHistoryEvent(svgedit.history.HistoryEventTypes.BEFORE_APPLY, this);
          }
          canvas.textActions.renderMultiLineText(this.elem, this.newText, false);
          if (handler) {
            handler.handleHistoryEvent(svgedit.history.HistoryEventTypes.AFTER_APPLY, this);
          }
        }

        unapply(handler) {
          if (handler) {
            handler.handleHistoryEvent(svgedit.history.HistoryEventTypes.BEFORE_UNAPPLY, this);
          }

          canvas.textActions.renderMultiLineText(this.elem, this.oldText, false);

          if (handler) {
            handler.handleHistoryEvent(svgedit.history.HistoryEventTypes.AFTER_UNAPPLY, this);
          }
        }
      };

      return {
        select: function (target, x, y) {
          curtext = target;
          textActions.toEditMode(x, y);
        },
        start: function (elem) {
          curtext = elem;
          textActions.toEditMode();
        },
        mouseDown: function (evt, mouseTarget, start_x, start_y) {
          var pt = screenToPt(start_x, start_y);
          console.log('textaction mousedown');

          textinput.focus();
          setCursorFromPoint(pt.x, pt.y);
          last_x = start_x;
          last_y = start_y;

          // TODO: Find way to block native selection
        },
        mouseMove: function (mouse_x, mouse_y) {
          var pt = screenToPt(mouse_x, mouse_y);
          setEndSelectionFromPoint(pt.x, pt.y);
        },
        mouseUp: function (evt, mouse_x, mouse_y) {
          var pt = screenToPt(mouse_x, mouse_y);

          setEndSelectionFromPoint(pt.x, pt.y, true);

          // TODO: Find a way to make this work: Use transformed BBox instead of evt.target
          //				if (last_x === mouse_x && last_y === mouse_y
          //					&& !svgedit.math.rectsIntersect(transbb, {x: pt.x, y: pt.y, width:0, height:0})) {
          //					textActions.toSelectMode(true);
          //				}

          if (
            evt.target !== curtext &&
            evt.target.parentNode !== curtext &&
            mouse_x < last_x + 2 &&
            mouse_x > last_x - 2 &&
            mouse_y < last_y + 2 &&
            mouse_y > last_y - 2) {
            textActions.toSelectMode(true);
          }

        },
        setCursor: setCursor,
        hideCursor,
        onUpKey: () => {
          if (isVertical) {
            textinput.selectionEnd = Math.max(textinput.selectionEnd - 1, 0);
            textinput.selectionStart = textinput.selectionEnd;
          } else {
            moveCursorLastRow();
          }
        },
        onDownKey: () => {
          if (isVertical) {
            textinput.selectionEnd += 1;
            textinput.selectionStart = textinput.selectionEnd;
          } else {
            moveCursorNextRow();
          }
        },
        onLeftKey: () => {
          if (isVertical) {
            moveCursorNextRow();
          } else {
            textinput.selectionEnd = Math.max(textinput.selectionEnd - 1, 0);
            textinput.selectionStart = textinput.selectionEnd;
          }
        },
        onRightKey: () => {
          if (isVertical) {
            moveCursorLastRow();
          } else {
            textinput.selectionEnd += 1;
            textinput.selectionStart = textinput.selectionEnd;
          }
        },
        newLine: () => {
          let oldSelectionStart = textinput.selectionStart;
          textinput.value = textinput.value.substring(0, textinput.selectionStart) + '\x0b' + textinput.value.substring(textinput.selectionEnd);
          textinput.selectionStart = oldSelectionStart + 1;
          textinput.selectionEnd = oldSelectionStart + 1;
          svgCanvas.setTextContent(textinput.value);
        },
        copyText: async () => {
          if (textinput.selectionStart === textinput.selectionEnd) {
            console.log('No selection');
            return;
          }
          const selectedText = textinput.value.substring(textinput.selectionStart, textinput.selectionEnd);
          try {
            await navigator.clipboard.writeText(selectedText);
            console.log('Copying to clipboard was successful!', selectedText);
          } catch (err) {
            console.error('Async: Could not copy text: ', err);
          }
        },
        cutText: async () => {
          if (textinput.selectionStart === textinput.selectionEnd) {
            console.log('No selection');
            return;
          }
          const selectedText = textinput.value.substring(textinput.selectionStart, textinput.selectionEnd);
          const start = textinput.selectionStart;
          try {
            await navigator.clipboard.writeText(selectedText);
            console.log('Copying to clipboard was successful!', selectedText);
          } catch (err) {
            console.error('Async: Could not copy text: ', err);
          }
          textinput.value = textinput.value.substring(0, textinput.selectionStart) + textinput.value.substring(textinput.selectionEnd);
          textinput.selectionStart = textinput.selectionEnd = start;
          svgCanvas.setTextContent(textinput.value);
        },
        pasteText: async () => {
          let clipboardText = await navigator.clipboard.readText();
          const start = textinput.selectionStart;
          textinput.value = textinput.value.substring(0, textinput.selectionStart) + clipboardText + textinput.value.substring(textinput.selectionEnd);
          textinput.selectionStart = textinput.selectionEnd = start + clipboardText.length;
          svgCanvas.setTextContent(textinput.value);
        },
        selectAll: () => {
          textinput.selectionStart = 0;
          textinput.selectionEnd = textinput.value.length;
          svgCanvas.setTextContent(textinput.value);
        },
        get isEditing() { return isEditing; },
        toEditMode: function (x, y) {
          isEditing = true;
          allow_dbl = false;
          const isContinuousDrawing = BeamboxPreference.read('continuous_drawing');
          previousMode = isContinuousDrawing ? current_mode : 'select';
          current_mode = 'textedit';
          selectorManager.requestSelector(curtext).showGrips(false);
          // Make selector group accept clicks
          var sel = selectorManager.requestSelector(curtext).selectorRect;
          textActions.init();
          valueBeforeEdit = textinput.value;

          $(curtext).css('cursor', 'text');

          if (!arguments.length) {
            setCursor();
          } else {
            var pt = screenToPt(x, y);
            setCursorFromPoint(pt.x, pt.y);
          }

          setTimeout(function () {
            allow_dbl = true;
          }, 300);
        },
        toSelectMode: function (shouldSelectElem) {
          isEditing = false;
          current_mode = previousMode;
          hideCursor();
          $(curtext).css('cursor', 'move');

          if (shouldSelectElem) {
            clearSelection();
            $(curtext).css('cursor', 'move');
            call('selected', [curtext]);
            addToSelection([curtext], true);
            svgedit.recalculate.recalculateDimensions(curtext);
          } else if (curtext) {
            $(curtext).css('cursor', 'move');
            call('selected', [curtext]);
            addToSelection([curtext], true);
            svgedit.recalculate.recalculateDimensions(curtext);
          }
          const batchCmd = new svgedit.history.BatchCommand('Edit Text');
          if (curtext && !curtext.textContent.length) {
            // No content, so delete
            const cmd = canvas.deleteSelectedElements(true);
            if (valueBeforeEdit && cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
          }
          if (valueBeforeEdit && valueBeforeEdit !== textinput.value) {
            const cmd = new ChangeTextCommand(curtext, valueBeforeEdit, textinput.value);
            batchCmd.addSubCommand(cmd);
            canvas.setHasUnsavedChange(true, true);
          }
          if (!batchCmd.isEmpty()) addCommandToHistory(batchCmd);

          $(textinput).trigger('blur');
          curtext = null;
          //				if (svgedit.browser.supportsEditableText()) {
          //					curtext.removeAttribute('editable');
          //				}
        },
        setInputElem: function (elem) {
          textinput = elem;
          //			$(textinput).blur(hideCursor);
        },
        renderMultiLineText: (textElem, val, showGrips) => {
          let lines = val.split('\x0b');
          if (!textElem) {
            return;
          }
          let tspans = Array.from(textElem.childNodes).filter((child) => child.tagName === 'tspan');
          const charHeight = parseFloat(canvas.getFontSize());
          const letterSpacing = canvas.getLetterSpacing();
          for (let i = 0; i < Math.max(lines.length, tspans.length); i++) {
            if (i < lines.length) {
              // Add a space for empty line to render select bbox
              if (lines[i] === '') lines[i] = ' ';
              let tspan;
              let x = [];
              let y = [];
              if (tspans[i]) {
                tspan = tspans[i];
              } else {
                tspan = document.createElementNS(NS.SVG, 'tspan');
                textElem.appendChild(tspan);
              }
              tspan.textContent = lines[i];

              if (isVertical) {
                const xPos = $(textElem).attr('x') - i * lineSpacing * charHeight;
                let yPos = $(textElem).attr('y');
                for (let j = 0; j < lines[i].length; j++) {
                  x.push(xPos.toFixed(2));
                  y.push(yPos.toFixed(2));
                  yPos += (1 + letterSpacing) * charHeight;// text spacing
                }
                $(tspan).attr({
                  'x': x.join(' '),
                  'y': y.join(' '),
                  'vector-effect': 'non-scaling-stroke',
                });
              } else {
                $(tspan).attr({
                  'x': $(textElem).attr('x'),
                  'y': $(textElem).attr('y') + i * lineSpacing * charHeight,
                  'vector-effect': 'non-scaling-stroke',
                });
                tspan.textContent = lines[i];
                textElem.appendChild(tspan);
              }
            } else {
              if (tspans[i]) {
                tspans[i].remove();
              }
            }
          }
          svgedit.recalculate.recalculateDimensions(textElem);
          if (showGrips) {
            selectorManager.requestSelector(textElem).resize();
          }
        },
        setIsVertical: (val) => {
          isVertical = val;
        },
        setLineSpacing: (val) => {
          lineSpacing = val;
        },
        clear: function () {
          if (current_mode === 'textedit') {
            textActions.toSelectMode();
          } else {
            if (cursor) {
              $(cursor).attr('visibility', 'hidden');
            }
          }
        },
        init: function () {
          if (!curtext) {
            return;
          }
          //				if (svgedit.browser.supportsEditableText()) {
          //					curtext.select();
          //					return;
          //				}

          if (!curtext.parentNode) {
            // Result of the ffClone, need to get correct element
            curtext = selectedElements[0];
            selectorManager.requestSelector(curtext).showGrips(false);
          }
          chardata = [];
          const xform = curtext.getAttribute('transform');
          textbb = svgedit.utilities.getBBox(curtext);
          matrix = xform ? svgedit.math.getMatrix(curtext) : null;

          calculateCharbb();

          textinput.focus();
          $(curtext).unbind('dblclick', selectWord).dblclick(selectWord);

          setSelection(textinput.selectionStart, textinput.selectionEnd, true);
        }
      };
    })();

    this.updateMultiLineTextElem = (textElem) => {
      let tspans = Array.from(textElem.childNodes).filter((child) => child.tagName === 'tspan');
      const isVertical = this.getTextIsVertical(textElem);
      const lineSpacing = parseFloat(this.getTextLineSpacing(textElem));
      const charHeight = parseFloat(this.getFontSize(textElem));
      const letterSpacing = this.getLetterSpacing();
      for (let i = 0; i < tspans.length; i++) {
        if (isVertical) {
          let x = [];
          let y = [];
          const textContent = tspans[i].textContent;
          const xPos = $(textElem).attr('x') - i * lineSpacing * charHeight;
          let yPos = $(textElem).attr('y');
          for (let j = 0; j < textContent.length; j++) {
            x.push(xPos.toFixed(2));
            y.push(yPos.toFixed(2));
            yPos += (1 + letterSpacing) * charHeight;// text spacing
          }
          $(tspans[i]).attr({
            'x': x.join(' '),
            'y': y.join(' '),
            'vector-effect': 'non-scaling-stroke',
          });
        } else {
          $(tspans[i]).attr({
            'x': $(textElem).attr('x'),
            'y': $(textElem).attr('y') + i * lineSpacing * charHeight,
            'vector-effect': 'non-scaling-stroke',
          });
        }
      }
      svgedit.recalculate.recalculateDimensions(textElem);
    };

    // TODO: Migrate all of this code into path.js
    // Group: Path edit functions
    // Functions relating to editing path elements
    let pathActions = canvas.pathActions = (function () {
      var subpath = false;
      var current_path;
      var newPoint, firstCtrl;
      let previousMode = 'select';
      let modeOnMouseDown = '';

      function resetD(p) {
        p.setAttribute('d', pathActions.convertPath(p));
      }

      // TODO: Move into path.js
      svgedit.path.Path.prototype.endChanges = function (text, isSub = false) {
        if (svgedit.browser.isWebkit()) {
          resetD(this.elem);
        }
        var cmd = new svgedit.history.ChangeElementCommand(this.elem, {
          d: this.last_d
        }, text);
        if (!isSub) {
          addCommandToHistory(cmd);
        }
        call('changed', [this.elem]);
        return isSub ? cmd : null;
      };

      current_path = null;
      var drawn_path = null,
        hasMoved = false;

      // This function converts a polyline (created by the fh_path tool) into
      // a path element and coverts every three line segments into a single bezier
      // curve in an attempt to smooth out the free-hand
      var smoothPolylineIntoPath = function (element) {
        var i, points = element.points;
        var N = points.numberOfItems;
        if (N >= 4) {
          // loop through every 3 points and convert to a cubic bezier curve segment
          //
          // NOTE: this is cheating, it means that every 3 points has the potential to
          // be a corner instead of treating each point in an equal manner. In general,
          // this technique does not look that good.
          //
          // I am open to better ideas!
          //
          // Reading:
          // - http://www.efg2.com/Lab/Graphics/Jean-YvesQueinecBezierCurves.htm
          // - http://www.codeproject.com/KB/graphics/BezierSpline.aspx?msg=2956963
          // - http://www.ian-ko.com/ET_GeoWizards/UserGuide/smooth.htm
          // - http://www.cs.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-der.html
          var curpos = points.getItem(0),
            prevCtlPt = null;
          var d = [];
          d.push(['M', curpos.x, ',', curpos.y, ' C'].join(''));
          for (i = 1; i <= (N - 4); i += 3) {
            var ct1 = points.getItem(i);
            var ct2 = points.getItem(i + 1);
            var end = points.getItem(i + 2);

            // if the previous segment had a control point, we want to smooth out
            // the control points on both sides
            if (prevCtlPt) {
              var newpts = svgedit.path.smoothControlPoints(prevCtlPt, ct1, curpos);
              if (newpts && newpts.length === 2) {
                var prevArr = d[d.length - 1].split(',');
                prevArr[2] = newpts[0].x;
                prevArr[3] = newpts[0].y;
                d[d.length - 1] = prevArr.join(',');
                ct1 = newpts[1];
              }
            }

            d.push([ct1.x, ct1.y, ct2.x, ct2.y, end.x, end.y].join(','));

            curpos = end;
            prevCtlPt = ct2;
          }
          // handle remaining line segments
          d.push('L');
          while (i < N) {
            var pt = points.getItem(i);
            d.push([pt.x, pt.y].join(','));
            i++;
          }
          d = d.join(' ');

          // create new path element
          element = addSvgElementFromJson({
            element: 'path',
            curStyles: true,
            attr: {
              id: getId(),
              d: d,
              fill: 'none'
            }
          });
          // No need to call "changed", as this is already done under mouseUp
        }
        return element;
      };

      const finishPath = (toEditMode = true) => {
        const xAlignLine = document.getElementById('x_align_line');
        if (xAlignLine) xAlignLine.remove();
        const yAlignLine = document.getElementById('y_align_line');
        if (yAlignLine) yAlignLine.remove();
        if (!drawn_path) {
          const pathPointGripContainer = document.getElementById('pathpointgrip_container');
          if (pathPointGripContainer) pathPointGripContainer.remove();
          return;
        }

        const stretchy = document.getElementById('path_stretch_line');
        let id = getId();
        firstCtrl = null;
        svgedit.path.removePath_(id);

        let element = document.getElementById(id);
        if (stretchy) stretchy.remove();
        let len = drawn_path.pathSegList.numberOfItems;
        drawn_path = null;
        started = false;
        if (len > 1) {
          element.setAttribute('opacity', cur_shape.opacity);
          element.setAttribute('style', 'pointer-events:inherit');
          cleanupElement(element);
          addCommandToHistory(new svgedit.history.InsertElementCommand(element));
          if (toEditMode) {
            pathActions.toEditMode(element);
            call('changed', [element]);
            $('#workarea').css('cursor', 'default');
          } else {
            const pathPointGripContainer = document.getElementById('pathpointgrip_container');
            if (pathPointGripContainer) pathPointGripContainer.remove();
          }
        } else {
          if (element) element.remove();
          canvas.setMode(previousMode);
          if (previousMode === 'select') $('#workarea').css('cursor', 'default');
        }

        shortcuts.off(['esc']);
        shortcuts.on(['esc'], svgEditor.clickSelect);
      }

      return {
        mouseDown: function (evt, mouseTarget, start_x, start_y) {
          const xAlignLine = document.getElementById('x_align_line');
          if (xAlignLine) xAlignLine.remove();
          const yAlignLine = document.getElementById('y_align_line');
          if (yAlignLine) yAlignLine.remove();

          modeOnMouseDown = current_mode;

          if (current_mode === 'path') {
            const isContinuousDrawing = BeamboxPreference.read('continuous_drawing');
            previousMode = isContinuousDrawing ? 'path' : 'select';
            mouse_x = start_x;
            mouse_y = start_y;

            var x = mouse_x / current_zoom,
              y = mouse_y / current_zoom,
              stretchy = svgedit.utilities.getElem('path_stretch_line');
            newPoint = [x, y];
            if (canvas.isBezierPathAlignToEdge) {
              canvas.addAlignPoint(x, y);
            }
            if (curConfig.gridSnapping) {
              x = svgedit.utilities.snapToGrid(x);
              y = svgedit.utilities.snapToGrid(y);
              mouse_x = svgedit.utilities.snapToGrid(mouse_x);
              mouse_y = svgedit.utilities.snapToGrid(mouse_y);
            }

            if (!stretchy) {
              stretchy = document.createElementNS(NS.SVG, 'path');
              svgedit.utilities.assignAttributes(stretchy, {
                id: 'path_stretch_line',
                stroke: '#22C',
                'stroke-width': '0.5',
                fill: 'none'
              });
              stretchy = svgedit.utilities.getElem('selectorParentGroup').appendChild(stretchy);
            }
            stretchy.setAttribute('display', 'inline');

            var keep = null;
            var index;
            // if pts array is empty, create path element with M at current point
            if (!drawn_path) {
              d_attr = 'M' + x + ',' + y + ' ';
              drawn_path = addSvgElementFromJson({
                element: 'path',
                curStyles: true,
                attr: {
                  d: d_attr,
                  id: getNextId(),
                  'stroke-width': 1,
                  fill: 'none',
                  opacity: cur_shape.opacity / 2
                }
              });
              if (canvas.isUsingLayerColor) {
                canvas.updateElementColor(drawn_path);
              }
              // set stretchy line to first point
              stretchy.setAttribute('d', ['M', mouse_x, mouse_y, mouse_x, mouse_y].join(' '));
              index = subpath ? svgedit.path.path.segs.length : 0;
              svgedit.path.addDrawingPoint(index, mouse_x, mouse_y, x, y);
              shortcuts.off(['esc']);
              shortcuts.on(['esc'], () => finishPath(!isContinuousDrawing));
            } else {
              // determine if we clicked on an existing point
              var seglist = drawn_path.pathSegList;
              var i = seglist.numberOfItems;
              var FUZZ = 6 / current_zoom;
              var clickOnPoint = false;
              while (i) {
                i--;
                var item = seglist.getItem(i);
                var px = item.x,
                  py = item.y;
                // found a matching point
                if (x >= (px - FUZZ) && x <= (px + FUZZ) && y >= (py - FUZZ) && y <= (py + FUZZ)) {
                  clickOnPoint = true;
                  break;
                }
              }

              // get path element that we are in the process of creating
              let id = getId();

              // Remove previous path object if previously created
              svgedit.path.removePath_(id);

              var newpath = svgedit.utilities.getElem(id);
              var newseg;
              var s_seg;
              var len = seglist.numberOfItems;
              // if we clicked on an existing point, then we are done this path, commit it
              // (i, i+1) are the x,y that were clicked on
              if (clickOnPoint) {
                // if clicked on any other point but the first OR
                // the first point was clicked on and there are less than 3 points
                // then leave the path open
                // otherwise, close the path
                if (i === 0 && len >= 2) {
                  // Create end segment
                  var abs_x = seglist.getItem(0).x;
                  var abs_y = seglist.getItem(0).y;


                  s_seg = stretchy.pathSegList.getItem(1);
                  if (s_seg.pathSegType === 4) {
                    newseg = drawn_path.createSVGPathSegLinetoAbs(abs_x, abs_y);
                  } else {
                    newseg = drawn_path.createSVGPathSegCurvetoCubicAbs(
                      abs_x,
                      abs_y,
                      s_seg.x1 / current_zoom,
                      s_seg.y1 / current_zoom,
                      abs_x,
                      abs_y
                    );
                  }

                  var endseg = drawn_path.createSVGPathSegClosePath();
                  seglist.appendItem(newseg);
                  seglist.appendItem(endseg);
                } else if (len < 2) {
                  keep = false;
                  return keep;
                }
                finishPath(!isContinuousDrawing);

                if (subpath) {
                  if (svgedit.path.path.matrix) {
                    svgedit.coords.remapElement(newpath, {}, svgedit.path.path.matrix.inverse());
                  }

                  var new_d = newpath.getAttribute('d');
                  var orig_d = $(svgedit.path.path.elem).attr('d');
                  $(svgedit.path.path.elem).attr('d', orig_d + new_d);
                  $(newpath).remove();
                  if (svgedit.path.path.matrix) {
                    svgedit.path.recalcRotatedPath();
                  }
                  svgedit.path.path.init();
                  pathActions.toEditMode(svgedit.path.path.elem);
                  svgedit.path.path.selectPt();
                  return false;
                }
              }
              // else, create a new point, update path element
              else {
                // Checks if current target or parents are #svgcontent
                if (!$.contains(container, getMouseTarget(evt))) {
                  // Clicked outside canvas, so don't make point
                  console.log('Clicked outside canvas');
                  return false;
                }

                var num = drawn_path.pathSegList.numberOfItems;
                var last = drawn_path.pathSegList.getItem(num - 1);
                var lastx = last.x,
                  lasty = last.y;

                if (evt.shiftKey) {
                  var xya = svgedit.math.snapToAngle(lastx, lasty, x, y);
                  x = xya.x;
                  y = xya.y;
                }

                // Use the segment defined by stretchy
                s_seg = stretchy.pathSegList.getItem(1);
                if (s_seg.pathSegType === 4) {
                  newseg = drawn_path.createSVGPathSegLinetoAbs(round(x), round(y));
                } else {
                  newseg = drawn_path.createSVGPathSegCurvetoCubicAbs(
                    round(x),
                    round(y),
                    s_seg.x1 / current_zoom,
                    s_seg.y1 / current_zoom,
                    s_seg.x2 / current_zoom,
                    s_seg.y2 / current_zoom
                  );
                }

                drawn_path.pathSegList.appendItem(newseg);

                // set stretchy line to latest point
                stretchy.setAttribute('d', ['M', mouse_x, mouse_y, mouse_x, mouse_y].join(' '));
                index = num;
                if (subpath) {
                  index += svgedit.path.path.segs.length;
                }
                svgedit.path.addDrawingPoint(index, mouse_x, mouse_y, x, y);
              }
              //					keep = true;
            }
            return;
          } else if (current_mode === 'pathedit') {
            // TODO: Make sure current_path isn't null at this point
            if (!svgedit.path.path) return;

            svgedit.path.path.storeD();

            id = evt.target.id;
            var pointIndex;
            if (id.substr(0, 14) === 'pathpointgrip_') {
              pointIndex = svgedit.path.path.selectedPointIndex = parseInt(id.substr(14));
              svgedit.path.path.dragging = [start_x, start_y];
              let point = svgedit.path.path.nodePoints[pointIndex];

              if (!evt.shiftKey) {
                // if not selected: select this point only
                if (!point.isSelected || svgedit.path.path.selectedControlPoint) {
                  svgedit.path.path.clearSelection();
                  svgedit.path.path.addPtsToSelection(pointIndex);
                }
              } else {
                if (point.isSelected && !svgedit.path.path.selectedControlPoint) {
                  svgedit.path.path.removePtFromSelection(pointIndex);
                } else {
                  svgedit.path.path.addPtsToSelection(pointIndex);
                }
              }
              svgEditor.updateContextPanel();
            } else if (id.indexOf('ctrlpointgrip_') === 0) {
              svgedit.path.path.dragging = [start_x, start_y];

              var parts = id.split('_')[1].split('c');
              svgedit.path.path.selectCtrlPoint(parts[0], parts[1]);
              svgEditor.updateContextPanel();
            }

            // Start selection box
            if (!svgedit.path.path.dragging) {
              if (rubberBox == null) {
                rubberBox = selectorManager.getRubberBandBox();
              }
              svgedit.utilities.assignAttributes(rubberBox, {
                'x': start_x * current_zoom,
                'y': start_y * current_zoom,
                'width': 0,
                'height': 0,
                'display': 'inline'
              }, 100);
            }
          }
        },
        mouseMove: function (mouse_x, mouse_y) {
          hasMoved = true;
          if (modeOnMouseDown === 'path') {
            if (!drawn_path) {
              return;
            }
            var seglist = drawn_path.pathSegList;
            var index = seglist.numberOfItems - 1;

            if (newPoint) {
              // First point
              //					if (!index) {return;}

              var pt_x = newPoint[0];
              var pt_y = newPoint[1];

              // set curve
              var seg = seglist.getItem(index);
              var cur_x = mouse_x / current_zoom;
              var cur_y = mouse_y / current_zoom;
              var alt_x = (pt_x + (pt_x - cur_x));
              var alt_y = (pt_y + (pt_y - cur_y));

              // Set control points
              var pointGrip1 = svgedit.path.addDrawingCtrlGrip('1c1');
              var pointGrip2 = svgedit.path.addDrawingCtrlGrip('0c2');

              // dragging pointGrip1
              pointGrip1.setAttribute('cx', mouse_x);
              pointGrip1.setAttribute('cy', mouse_y);
              pointGrip1.setAttribute('data-x', cur_x);
              pointGrip1.setAttribute('data-y', cur_y);
              pointGrip1.setAttribute('display', 'inline');

              pointGrip2.setAttribute('cx', alt_x * current_zoom);
              pointGrip2.setAttribute('cy', alt_y * current_zoom);
              pointGrip2.setAttribute('data-x', alt_x);
              pointGrip2.setAttribute('data-y', alt_y);
              pointGrip2.setAttribute('display', 'inline');

              var ctrlLine = svgedit.path.getCtrlLine(1);
              svgedit.utilities.assignAttributes(ctrlLine, {
                x1: mouse_x,
                y1: mouse_y,
                x2: alt_x * current_zoom,
                y2: alt_y * current_zoom,
                'data-x1': cur_x,
                'data-y1': cur_y,
                'data-x2': alt_x,
                'data-y2': alt_y,
                display: 'inline'
              });

              if (index === 0) {
                firstCtrl = [mouse_x, mouse_y];
              } else {
                var last = seglist.getItem(index - 1);
                var last_x = last.x;
                var last_y = last.y;

                if (last.pathSegType === 6) {
                  last_x += (last_x - last.x2);
                  last_y += (last_y - last.y2);
                } else if (firstCtrl) {
                  last_x = firstCtrl[0] / current_zoom;
                  last_y = firstCtrl[1] / current_zoom;
                }
                svgedit.path.replacePathSeg(6, index, [pt_x, pt_y, last_x, last_y, alt_x, alt_y], drawn_path);
              }
            } else {
              var stretchy = svgedit.utilities.getElem('path_stretch_line');
              if (stretchy) {
                var prev = seglist.getItem(index);
                if (prev.pathSegType === 6) {
                  var prev_x = prev.x + (prev.x - prev.x2);
                  var prev_y = prev.y + (prev.y - prev.y2);
                  svgedit.path.replacePathSeg(6, 1, [mouse_x, mouse_y, prev_x * current_zoom, prev_y * current_zoom, mouse_x, mouse_y], stretchy);
                } else if (firstCtrl) {
                  svgedit.path.replacePathSeg(6, 1, [mouse_x, mouse_y, firstCtrl[0], firstCtrl[1], mouse_x, mouse_y], stretchy);
                } else {
                  svgedit.path.replacePathSeg(4, 1, [mouse_x, mouse_y], stretchy);
                }
              }
            }
            return;
          }
          // if we are dragging a point, let's move it
          if (svgedit.path.path.dragging) {
            var pt = svgedit.path.getPointFromGrip({
              x: svgedit.path.path.dragging[0],
              y: svgedit.path.path.dragging[1]
            }, svgedit.path.path);
            var mpt = svgedit.path.getPointFromGrip({
              x: mouse_x,
              y: mouse_y
            }, svgedit.path.path);
            var diff_x = mpt.x - pt.x;
            var diff_y = mpt.y - pt.y;
            svgedit.path.path.dragging = [mouse_x, mouse_y];
            if (svgedit.path.path.selectedControlPoint) {
              svgedit.path.path.moveCtrl(diff_x, diff_y);
            } else {
              svgedit.path.path.movePts(diff_x, diff_y);
            }
          } else {
            svgedit.path.path.selected_pts = [];
            svgedit.path.path.eachSeg(function (i) {
              var seg = this;
              if (!seg.next && !seg.prev) {
                return;
              }

              var item = seg.item;
              var rbb = rubberBox.getBBox();

              var pt = svgedit.path.getGripPt(seg);
              var pt_bb = {
                x: pt.x,
                y: pt.y,
                width: 0,
                height: 0
              };

              var sel = svgedit.math.rectsIntersect(rbb, pt_bb);

              this.select(sel);
              //Note that addPtsToSelection is not being run
              if (sel) {
                svgedit.path.path.selected_pts.push(seg.index);
              }
            });

          }
        },
        mouseUp: function (evt, element, mouse_x, mouse_y) {
          // Create mode
          if (modeOnMouseDown === 'path') {
            newPoint = null;
            if (!drawn_path) {
              element = svgedit.utilities.getElem(getId());
              started = false;
              firstCtrl = null;
            }

            return {
              keep: true,
              element: element
            };
          }

          // Edit mode

          if (svgedit.path.path.dragging) {
            var last_pt = svgedit.path.path.selectedPointIndex;

            svgedit.path.path.dragging = false;
            svgedit.path.path.dragctrl = false;
            svgedit.path.path.update();

            if (hasMoved) {
              svgedit.path.path.endChanges('Move path point(s)');
            } else {
              if (!evt.shiftKey) {
                id = evt.target.id;
                if (id.substr(0, 14) === 'pathpointgrip_') {
                  // Select this point if not moved
                  pointIndex = svgedit.path.path.selectedPointIndex = parseInt(id.substr(14));
                  svgedit.path.path.clearSelection();
                  svgedit.path.path.addPtsToSelection(pointIndex);
                }
              }
            }
          } else if (rubberBox && rubberBox.getAttribute('display') !== 'none') {
            // Done with multi-node-select
            rubberBox.setAttribute('display', 'none');

            if (rubberBox.getAttribute('width') <= 2 && rubberBox.getAttribute('height') <= 2) {
              pathActions.toSelectMode(evt.target);
            }

            // else, move back to select mode
          } else {
            pathActions.toSelectMode(evt.target);
          }
          hasMoved = false;
        },
        finishPath: finishPath,
        toEditMode: function (element) {
          svgedit.path.path = svgedit.path.getPath_(element);
          const isContinuousDrawing = BeamboxPreference.read('continuous_drawing');
          previousMode = isContinuousDrawing ? current_mode : 'select';
          current_mode = 'pathedit';
          clearSelection();
          svgedit.path.path.show(true).update();
          svgedit.path.path.oldbbox = svgedit.utilities.getBBox(svgedit.path.path.elem);
          subpath = false;
        },
        toSelectMode: function (elem) {
          var selPath = (elem === svgedit.path.path.elem);
          current_mode = previousMode;
          if (current_mode === 'select') {
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
          } else if (current_mode === 'path') {
            $('#workarea').css('cursor', 'crosshair');
          }
          svgedit.path.path.show(false);
          svgedit.path.path.saveSegmentControlPointInfo();
          svgedit.path.path.saveNodeTypeInfo();
          current_path = false;
          clearSelection();

          if (svgedit.path.path.matrix) {
            // Rotated, so may need to re-calculate the center
            svgedit.path.recalcRotatedPath();
          }

          if (selPath) {
            call('selected', [elem]);
            addToSelection([elem], true);
          }
          svgedit.path.path = null;
          svgEditor.updateContextPanel();
        },
        addSubPath: function (on) {
          if (on) {
            // Internally we go into "path" mode, but in the UI it will
            // still appear as if in "pathedit" mode.
            current_mode = 'path';
            subpath = true;
          } else {
            pathActions.clear(true);
            pathActions.toEditMode(svgedit.path.path.elem);
          }
        },
        select: function (target) {
          if (current_path === target) {
            pathActions.toEditMode(target);
            current_mode = 'pathedit';
          } // going into pathedit mode
          else {
            current_path = target;
          }
        },
        reorient: function () {
          var elem = selectedElements[0];
          if (!elem) {
            return;
          }
          var angle = svgedit.utilities.getRotationAngle(elem);
          if (angle == 0) {
            return;
          }

          var batchCmd = new svgedit.history.BatchCommand('Reorient path');
          var changes = {
            d: elem.getAttribute('d'),
            transform: elem.getAttribute('transform')
          };
          batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(elem, changes));
          clearSelection();
          this.resetOrientation(elem);

          addCommandToHistory(batchCmd);

          // Set matrix to null
          svgedit.path.getPath_(elem).show(false).matrix = null;

          this.clear();

          addToSelection([elem], true);
          call('changed', selectedElements);
        },

        clear: function (remove) {
          current_path = null;
          if (drawn_path) {
            var elem = svgedit.utilities.getElem(getId());
            $(svgedit.utilities.getElem('path_stretch_line')).remove();
            $(elem).remove();
            $(svgedit.utilities.getElem('pathpointgrip_container')).find('*').attr('display', 'none');
            drawn_path = firstCtrl = null;
            started = false;
          } else if (current_mode === 'pathedit') {
            this.toSelectMode();
          }
          if (svgedit.path.path) {
            svgedit.path.path.init().show(false);
          }
          $('#x_align_line').remove();
          $('#y_align_line').remove();
        },
        resetOrientation: function (path) {
          if (path == null || path.nodeName !== 'path') {
            return false;
          }
          var tlist = svgedit.transformlist.getTransformList(path);
          var m = svgedit.math.transformListToTransform(tlist).matrix;
          tlist.clear();
          path.removeAttribute('transform');
          var segList = path.pathSegList;

          // Opera/win/non-EN throws an error here.
          // TODO: Find out why!
          // Presumed fixed in Opera 10.5, so commented out for now

          //			try {
          var len = segList.numberOfItems;
          //			} catch(err) {
          //				var fixed_d = pathActions.convertPath(path);
          //				path.setAttribute('d', fixed_d);
          //				segList = path.pathSegList;
          //				var len = segList.numberOfItems;
          //			}
          var i, last_x, last_y;

          for (i = 0; i < len; ++i) {
            var seg = segList.getItem(i);
            var type = seg.pathSegType;
            if (type == 1) {
              continue;
            }
            var pts = [];
            $.each(['', 1, 2], function (j, n) {
              var x = seg['x' + n],
                y = seg['y' + n];
              if (x !== undefined && y !== undefined) {
                var pt = svgedit.math.transformPoint(x, y, m);
                pts.splice(pts.length, 0, pt.x, pt.y);
              }
            });
            svgedit.path.replacePathSeg(type, i, pts, path);
          }

          reorientGrads(path, m);
        },
        zoomChange: function (oldZoom) {
          if (current_mode === 'pathedit') {
            svgedit.path.path.update();
          } else if (current_mode === 'path') {
            if (drawn_path) {
              svgedit.path.updateDrawingPoints();
              svgedit.path.updateControlLines();
              const stretchy = document.getElementById('path_stretch_line');
              if (stretchy) {
                const seglist = stretchy.pathSegList;
                const seg0 = seglist.getItem(0);
                const seg1 = seglist.getItem(1);
                const zoomRatio = current_zoom / oldZoom;
                svgedit.path.replacePathSeg(2, 0, [seg0.x * zoomRatio, seg0.y * zoomRatio], stretchy);
                if (seg1.pathSegType === 6) {
                  svgedit.path.replacePathSeg(6, 1, [seg1.x * zoomRatio, seg1.y * zoomRatio, seg1.x1 * zoomRatio, seg1.y1 * zoomRatio, seg1.x2 * zoomRatio, seg1.y2 * zoomRatio], stretchy);
                } else {
                  svgedit.path.replacePathSeg(4, 1, [seg1.x * zoomRatio, seg1.y * zoomRatio], stretchy);
                }
              }
            }
          }
        },
        getNodePoint: function () {
          var sel_pt = svgedit.path.path.selected_pts.length ? svgedit.path.path.selected_pts[0] : 1;

          var seg = svgedit.path.path.segs[sel_pt];
          return {
            x: seg.item.x,
            y: seg.item.y,
            type: seg.type
          };
        },
        linkControlPoints: function (linkPoints) {
          svgedit.path.setLinkControlPoints(linkPoints);
        },
        clonePathNode: function () {
          svgedit.path.path.storeD();

          var sel_pts = svgedit.path.path.selected_pts;
          var segs = svgedit.path.path.segs;

          var i = sel_pts.length;
          var nums = [];

          while (i--) {
            var pt = sel_pts[i];
            svgedit.path.path.addSeg(pt);

            nums.push(pt + i);
            nums.push(pt + i + 1);
          }
          svgedit.path.path.init().addPtsToSelection(nums);

          svgedit.path.path.endChanges('Clone path node(s)');
        },
        opencloseSubPath: function () {
          var sel_pts = svgedit.path.path.selected_pts;
          // Only allow one selected node for now
          if (sel_pts.length !== 1) {
            return;
          }

          var elem = svgedit.path.path.elem;
          var list = elem.pathSegList;

          var len = list.numberOfItems;

          var index = sel_pts[0];

          var open_pt = null;
          var start_item = null;

          // Check if subpath is already open
          svgedit.path.path.eachSeg(function (i) {
            if (this.type === 2 && i <= index) {
              start_item = this.item;
            }
            if (i <= index) {
              return true;
            }
            if (this.type === 2) {
              // Found M first, so open
              open_pt = i;
              return false;
            }
            if (this.type === 1) {
              // Found Z first, so closed
              open_pt = false;
              return false;
            }
          });

          if (open_pt == null) {
            // Single path, so close last seg
            open_pt = svgedit.path.path.segs.length - 1;
          }

          if (open_pt !== false) {
            // Close this path

            // Create a line going to the previous "M"
            var newseg = elem.createSVGPathSegLinetoAbs(start_item.x, start_item.y);

            var closer = elem.createSVGPathSegClosePath();
            if (open_pt == svgedit.path.path.segs.length - 1) {
              list.appendItem(newseg);
              list.appendItem(closer);
            } else {
              svgedit.path.insertItemBefore(elem, closer, open_pt);
              svgedit.path.insertItemBefore(elem, newseg, open_pt);
            }

            svgedit.path.path.init().selectPt(open_pt + 1);
            return;
          }

          // M 1,1 L 2,2 L 3,3 L 1,1 z // open at 2,2
          // M 2,2 L 3,3 L 1,1

          // M 1,1 L 2,2 L 1,1 z M 4,4 L 5,5 L6,6 L 5,5 z
          // M 1,1 L 2,2 L 1,1 z [M 4,4] L 5,5 L(M)6,6 L 5,5 z

          var seg = svgedit.path.path.segs[index];

          if (seg.mate) {
            list.removeItem(index); // Removes last "L"
            list.removeItem(index); // Removes the "Z"
            svgedit.path.path.init().selectPt(index - 1);
            return;
          }

          var i, last_m, z_seg;

          // Find this sub-path's closing point and remove
          for (i = 0; i < list.numberOfItems; i++) {
            var item = list.getItem(i);

            if (item.pathSegType === 2) {
              // Find the preceding M
              last_m = i;
            } else if (i === index) {
              // Remove it
              list.removeItem(last_m);
              //						index--;
            } else if (item.pathSegType === 1 && index < i) {
              // Remove the closing seg of this subpath
              z_seg = i - 1;
              list.removeItem(i);
              break;
            }
          }

          var num = (index - last_m) - 1;

          while (num--) {
            svgedit.path.insertItemBefore(elem, list.getItem(last_m), z_seg);
          }

          var pt = list.getItem(last_m);

          // Make this point the new "M"
          svgedit.path.replacePathSeg(2, last_m, [pt.x, pt.y]);

          i = index; // i is local here, so has no effect; what is the reason for this?

          svgedit.path.path.init().selectPt(0);
        },
        deletePathNode: function () {
          if (!pathActions.canDeleteNodes) {
            return;
          }
          svgedit.path.path.storeD();

          var sel_pts = svgedit.path.path.selected_pts;
          var i = sel_pts.length;

          while (i--) {
            var pt = sel_pts[i];
            svgedit.path.path.deleteSeg(pt);
          }

          // Cleanup
          var cleanup = function () {
            var segList = svgedit.path.path.elem.pathSegList;
            var len = segList.numberOfItems;

            var remItems = function (pos, count) {
              while (count--) {
                segList.removeItem(pos);
              }
            };

            if (len <= 1) {
              return true;
            }

            while (len--) {
              var item = segList.getItem(len);
              if (item.pathSegType === 1) {
                var prev = segList.getItem(len - 1);
                var nprev = segList.getItem(len - 2);
                if (prev.pathSegType === 2) {
                  remItems(len - 1, 2);
                  cleanup();
                  break;
                } else if (nprev.pathSegType === 2) {
                  remItems(len - 2, 3);
                  cleanup();
                  break;
                }

              } else if (item.pathSegType === 2) {
                if (len > 0) {
                  var prev_type = segList.getItem(len - 1).pathSegType;
                  // Path has M M
                  if (prev_type === 2) {
                    remItems(len - 1, 1);
                    cleanup();
                    break;
                    // Entire path ends with Z M
                  } else if (prev_type === 1 && segList.numberOfItems - 1 === len) {
                    remItems(len, 1);
                    cleanup();
                    break;
                  }
                }
              }
            }
            return false;
          };

          cleanup();

          // Completely delete a path with 1 or 0 segments
          if (svgedit.path.path.elem.pathSegList.numberOfItems <= 1) {
            pathActions.toSelectMode(svgedit.path.path.elem);
            canvas.deleteSelectedElements();
            return;
          }

          svgedit.path.path.init();
          svgedit.path.path.clearSelection();

          // TODO: Find right way to select point now
          // path.selectPt(sel_pt);
          if (window.opera) { // Opera repaints incorrectly
            var cp = $(svgedit.path.path.elem);
            cp.attr('d', cp.attr('d'));
          }
          svgedit.path.path.endChanges('Delete path node(s)');
        },
        smoothPolylineIntoPath: smoothPolylineIntoPath,
        moveNode: function (attr, newValue) {
          var sel_pts = svgedit.path.path.selected_pts;
          if (!sel_pts.length) {
            return;
          }

          svgedit.path.path.storeD();

          // Get first selected point
          var seg = svgedit.path.path.segs[sel_pts[0]];
          var diff = {
            x: 0,
            y: 0
          };
          diff[attr] = newValue - seg.item[attr];

          seg.move(diff.x, diff.y);
          svgedit.path.path.endChanges('Move path point');
        },
        fixEnd: function (elem) {
          // Adds an extra segment if the last seg before a Z doesn't end
          // at its M point
          // M0,0 L0,100 L100,100 z
          let last_m;
          for (let i = 0; i < elem.pathSegList.numberOfItems; ++i) {
            let seg = elem.pathSegList.getItem(i);
            if (seg.pathSegType === 2) {
              last_m = seg;
            }

            if (seg.pathSegType === 1 && i > 0) {
              let prev = elem.pathSegList.getItem(i - 1);
              if (prev.x != last_m.x || prev.y != last_m.y) {
                // Add an L segment here
                var newseg = elem.createSVGPathSegLinetoAbs(last_m.x, last_m.y);
                svgedit.path.insertItemBefore(elem, newseg, i);
                i++;
              }
            }
          }
          if (svgedit.browser.isWebkit()) {
            resetD(elem);
          }
        },
        // Convert a path to one with only absolute or relative values
        convertPath: svgedit.utilities.convertPath
      };
    })();
    // end pathActions

    // Group: Serialization

    // Function: removeUnusedDefElems
    // Looks at DOM elements inside the <defs> to see if they are referred to,
    // removes them from the DOM if they are not.
    //
    // Returns:
    // The amount of elements that were removed
    var removeUnusedDefElems = this.removeUnusedDefElems = function () {
      var defs = svgcontent.getElementsByTagNameNS(NS.SVG, 'defs');
      if (!defs || !defs.length) {
        return 0;
      }

      //	if (!defs.firstChild) {return;}

      var defelem_uses = [],
        numRemoved = 0;
      var attrs = ['fill', 'stroke', 'filter', 'marker-start', 'marker-mid', 'marker-end'];
      var alen = attrs.length;

      var all_els = svgcontent.getElementsByTagNameNS(NS.SVG, '*');
      var all_len = all_els.length;

      var i, j;
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

      const isDefUsed = node => {
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
      const removeUnusedDef = node => {
        let shouldIStay = false;
        const children = node.childNodes;

        if (isDefUsed(node)) {
          shouldIStay = true;
        } else if (children.length > 0) {
          shouldIStay = Array.from(children)
            .map(child => removeUnusedDef(child))
            .reduce((acc, cur) => (acc && cur));
        }

        if (shouldIStay) {
          return true;
        } else {
          // Good bye node
          removedElements[node.id] = node;
          node.parentNode.removeChild(node);
          numRemoved++;

          return false;
        }
      };
      $(defs)
        .children('linearGradient, radialGradient, filter, marker, svg, symbol')
        .toArray()
        .map(def => removeUnusedDef(def));

      return numRemoved;
    };

    // Function: svgCanvasToString
    // Main function to set up the SVG content for output
    //
    // Returns:
    // String containing the SVG image for output
    this.svgCanvasToString = function () {
      // keep calling it until there are none to remove
      svgedit.utilities.moveDefsIntoSvgContent();
      while (removeUnusedDefElems() > 0) { }
      pathActions.clear(true);

      // Keep SVG-Edit comment on top
      $.each(svgcontent.childNodes, function (i, node) {
        if (i && node.nodeType === 8 && node.data.indexOf('Created with') >= 0) {
          svgcontent.insertBefore(node, svgcontent.firstChild);
        }
      });

      // Move out of in-group editing mode
      if (current_group) {
        leaveContext();
        selectOnly([current_group]);
      }

      var naked_svgs = [];

      // Unwrap gsvg if it has no special attributes (only id and style)
      $(svgcontent).find('g:data(gsvg)').each(function () {
        var attrs = this.attributes;
        var len = attrs.length;
        var i;
        for (i = 0; i < len; i++) {
          if (attrs[i].nodeName === 'id' || attrs[i].nodeName === 'style') {
            len--;
          }
        }
        // No significant attributes, so ungroup
        if (len <= 0) {
          var svg = this.firstChild;
          naked_svgs.push(svg);
          $(this).replaceWith(svg);
        }
      });
      engraveDpi = BeamboxPreference.read('engrave_dpi');
      rotaryMode = BeamboxPreference.read('rotary_mode');
      const isUsingDiode = BeamboxPreference.read('enable-diode') && Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'));
      const isUsingAF = BeamboxPreference.read('enable-autofocus');
      svgcontent.setAttribute('data-engrave_dpi', engraveDpi);
      svgcontent.setAttribute('data-rotary_mode', rotaryMode);
      svgcontent.setAttribute('data-en_diode', isUsingDiode);
      svgcontent.setAttribute('data-en_af', isUsingAF);
      const x = $('#workarea').scrollLeft() / current_zoom - Constant.dimension.getWidth(BeamboxPreference.read('model'));
      const y = $('#workarea').scrollTop() / current_zoom - Constant.dimension.getHeight(BeamboxPreference.read('model'));
      svgcontent.setAttribute('data-zoom', (Math.round(current_zoom * 1000) / 1000));
      svgcontent.setAttribute('data-left', Math.round(x));
      svgcontent.setAttribute('data-top', Math.round(y));
      var output = this.svgToString(svgcontent, 0);

      // Rewrap gsvg
      if (naked_svgs.length) {
        $(naked_svgs).each(function () {
          groupSvgElem(this);
        });
      }
      svgedit.utilities.moveDefsOutfromSvgContent();
      output = sanitizeXmlString(output);
      console.log(output);

      return output;
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
    this.svgToString = function (elem, indent) {
      var out = [],
        toXml = svgedit.utilities.toXml;
      var unit = curConfig.baseUnit;
      var unit_re = new RegExp('^-?[\\d\\.]+' + unit + '$');

      if (elem) {
        cleanupElement(elem);
        var attrs = elem.attributes,
          attr,
          i,
          childs = elem.childNodes;

        for (i = 0; i < indent; i++) {
          out.push(' ');
        }
        out.push('<');
        out.push(elem.nodeName);
        if (elem.id === 'svgcontent') {
          // Process root element separately
          var res = getResolution();

          var vb = '';
          // TODO: Allow this by dividing all values by current baseVal
          // Note that this also means we should properly deal with this on import
          //			if (curConfig.baseUnit !== 'px') {
          //				var unit = curConfig.baseUnit;
          //				var unit_m = svgedit.units.getTypeMap()[unit];
          //				res.w = svgedit.units.shortFloat(res.w / unit_m)
          //				res.h = svgedit.units.shortFloat(res.h / unit_m)
          //				vb = ' viewBox="' + [0, 0, res.w, res.h].join(' ') + '"';
          //				res.w += unit;
          //				res.h += unit;
          //			}

          if (unit !== 'px') {
            res.w = svgedit.units.convertUnit(res.w, unit) + unit;
            res.h = svgedit.units.convertUnit(res.h, unit) + unit;
          }

          out.push(' id="svgcontent" width="' + res.w + '" height="' + res.h + '"' + vb + ' xmlns="' + NS.SVG + '"');

          var nsuris = {};

          // Check elements for namespaces, add if found
          $(elem).find('*').andSelf().each(function () {
            var el = this;
            // for some elements have no attribute
            var uri = this.namespaceURI;
            if (uri && !nsuris[uri] && nsMap[uri] && nsMap[uri] !== 'xmlns' && nsMap[uri] !== 'xml') {
              nsuris[uri] = true;
              out.push(' xmlns:' + nsMap[uri] + '="' + uri + '"');
            }

            $.each(this.attributes, function (i, attr) {
              var uri = attr.namespaceURI;
              if (uri && !nsuris[uri] && nsMap[uri] !== 'xmlns' && nsMap[uri] !== 'xml') {
                nsuris[uri] = true;
                out.push(' xmlns:' + nsMap[uri] + '="' + uri + '"');
              }
            });
          });

          i = attrs.length;
          var attr_names = ['width', 'height', 'xmlns', 'x', 'y', 'viewBox', 'id', 'overflow'];
          while (i--) {
            attr = attrs.item(i);
            var attrVal = toXml(attr.value);

            // Namespaces have already been dealt with, so skip
            if (attr.nodeName.indexOf('xmlns:') === 0) {
              continue;
            }

            // only serialize attributes we don't use internally
            if (attrVal != '' && attr_names.indexOf(attr.localName) === -1) {

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
            return;
          }

          var moz_attrs = ['-moz-math-font-style', '_moz-math-font-style'];
          for (i = attrs.length - 1; i >= 0; i--) {
            attr = attrs.item(i);
            var attrVal = toXml(attr.value);
            //remove bogus attributes added by Gecko
            if (moz_attrs.indexOf(attr.localName) >= 0) {
              continue;
            }
            if (attrVal != '') {
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
              if (!isNaN(attrVal)) {
                attrVal = svgedit.units.shortFloat(attrVal);
              } else if (unit_re.test(attrVal)) {
                attrVal = svgedit.units.shortFloat(attrVal) + unit;
              }

              // Embed images when saving
              if (save_options.apply &&
                elem.nodeName === 'image' &&
                attr.localName === 'href' &&
                save_options.images &&
                save_options.images === 'embed') {
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
          var bOneLine = false;

          for (i = 0; i < childs.length; i++) {
            var child = childs.item(i);
            switch (child.nodeType) {
              case 1: // element node
                out.push('\n');
                out.push(this.svgToString(childs.item(i), indent));
                break;
              case 3: // text node
                // to keep the spaces before a line
                var str = elem.tagName === 'tspan' ? child.nodeValue : child.nodeValue.replace(/^\s+|\s+$/g, '');
                if (str != '') {
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
            } // switch on node type
          }
          indent--;
          if (!bOneLine) {
            out.push('\n');
            for (i = 0; i < indent; i++) {
              out.push(' ');
            }
          }
          out.push('</');
          out.push(elem.nodeName);
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
      let ret = {};
      for (let i = 0; i < images.length; i++) {
        let blobUrl = images[i].getAttributeNS(null, 'origImage');
        let id = images[i].getAttributeNS(null, 'id');
        if (blobUrl) {
          const res = await fetch(blobUrl);
          const blob = await res.blob();
          const arrayBuffer = await new Response(blob).arrayBuffer();
          ret[id] = arrayBuffer;
        }
      }
      return ret;
    }


    // Function: embedImage
    // Converts a given image file to a data URL when possible, then runs a given callback
    //
    // Parameters:
    // val - String with the path/URL of the image
    // callback - Optional function to run when image data is found, supplies the
    // result (data URL or false) as first parameter.
    this.embedImage = function (val, callback) {
      // load in the image and once it's loaded, get the dimensions
      $(new Image()).load(function () {
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
        last_good_img_url = val;
        if (callback) {
          callback(encodableImages[val]);
        }
      }).attr('src', val);
    };

    // Function: setGoodImage
    // Sets a given URL to be a "last good image" URL
    this.setGoodImage = function (val) {
      last_good_img_url = val;
    };

    this.open = function () {
      // Nothing by default, handled by optional widget/extension
    };

    // Function: save
    // Serializes the current drawing into SVG XML text and returns it to the 'saved' handler.
    // This function also includes the XML prolog. Clients of the SvgCanvas bind their save
    // function to the 'saved' event.
    //
    // Returns:
    // Nothing
    this.save = function (opts) {
      // remove the selected outline before serializing
      clearSelection();
      // Update save options if provided
      if (opts) {
        $.extend(save_options, opts);
      }
      save_options.apply = true;

      // no need for doctype, see http://jwatt.org/svg/authoring/#doctype-declaration
      var str = this.svgCanvasToString();
      call('saved', str);
    };

    function getIssues() {
      // remove the selected outline before serializing
      clearSelection();

      // Check for known CanVG issues
      var issues = [];

      // Selector and notice
      var issue_list = {
        'feGaussianBlur': uiStrings.exportNoBlur,
        'foreignObject': uiStrings.exportNoforeignObject,
        '[stroke-dasharray]': uiStrings.exportNoDashArray
      };
      var content = $(svgcontent);

      // Add font/text check if Canvas Text API is not implemented
      if (!('font' in $('<canvas>')[0].getContext('2d'))) {
        issue_list.text = uiStrings.exportNoText;
      }

      $.each(issue_list, function (sel, descr) {
        if (content.find(sel).length) {
          issues.push(descr);
        }
      });
      return issues;
    }

    // Function: rasterExport
    // Generates a Data URL based on the current image, then calls "exported"
    // with an object including the string, image information, and any issues found
    this.rasterExport = function (imgType, quality, exportWindowName) {
      var mimeType = 'image/' + imgType.toLowerCase();
      var issues = getIssues();
      var str = this.svgCanvasToString();

      svgedit.utilities.buildCanvgCallback(function () {
        var type = imgType || 'PNG';
        if (!$('#export_canvas').length) {
          $('<canvas>', {
            id: 'export_canvas'
          }).hide().appendTo('body');
        }
        var c = $('#export_canvas')[0];
        c.width = svgCanvas.contentW;
        c.height = svgCanvas.contentH;

        canvg(c, str, {
          renderCallback: function () {
            var dataURLType = (type === 'ICO' ? 'BMP' : type).toLowerCase();
            var datauri = quality ? c.toDataURL('image/' + dataURLType, quality) : c.toDataURL('image/' + dataURLType);

            call('exported', {
              datauri: datauri,
              svg: str,
              issues: issues,
              type: imgType,
              mimeType: mimeType,
              quality: quality,
              exportWindowName: exportWindowName
            });
          }
        });
      })();
    };

    this.exportPDF = function (exportWindowName, outputType) {
      var that = this;
      svgedit.utilities.buildJSPDFCallback(function () {
        var res = getResolution();
        var orientation = res.w > res.h ? 'landscape' : 'portrait';
        var units = 'pt'; // curConfig.baseUnit; // We could use baseUnit, but that is presumably not intended for export purposes
        var doc = jsPDF({
          orientation: orientation,
          unit: units,
          format: [res.w, res.h]
          // , compressPdf: true
        }); // Todo: Give options to use predefined jsPDF formats like "a4", etc. from pull-down (with option to keep customizable)
        var docTitle = getDocumentTitle();
        doc.setProperties({
          title: docTitle
          /*,
                subject: '',
                author: '',
                keywords: '',
                creator: ''*/
        });
        var issues = getIssues();
        var str = that.svgCanvasToString();
        doc.addSVG(str, 0, 0);

        // doc.output('save'); // Works to open in a new
        //  window; todo: configure this and other export
        //  options to optionally work in this manner as
        //  opposed to opening a new tab
        var obj = {
          svg: str,
          issues: issues,
          exportWindowName: exportWindowName
        };
        var method = outputType || 'dataurlstring';
        obj[method] = doc.output(method);
        call('exportedPDF', obj);
      })();
    };

    // Function: getSvgString
    // Returns the current drawing as raw SVG XML text.
    //
    // Returns:
    // The current drawing as raw SVG XML text.
    this.getSvgString = function () {
      if (tempGroup) {
        this.ungroupTempGroup();
      }
      this.ungroupAllTempGroup();
      save_options.apply = false;
      return this.svgCanvasToString();
    };

    // Function: svgStringToImage
    // Parameters: type: canvas to dataurl type: image/png, image/jpeg...
    // Returns:
    // The image for svg from string.
    this.svgStringToImage = function (type, svgString) {
      return new Promise((resolve, reject) => {
        try {
          const [width, height] = dimensions;
          let canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          let ctx = canvas.getContext('2d');
          const svgUrl = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgString);
          let img = new Image();
          img.onload = function () {
            ctx.drawImage(this, 0, 0);
            URL.revokeObjectURL(svgUrl);
            switch (type) {
              case 'png':
                resolve(canvas.toDataURL('image/png'));
                break;
              case 'jpg':
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 1.0));
                break;
              default:
                resolve(false);
                break;
            }
          }
          img.src = svgUrl;
        } catch (err) {
          reject(err);
        }
      });
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
      if (arguments.length > 0 && enableRandomization == false) {
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
    var uniquifyElems = this.uniquifyElems = function (g) {
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
                elem: null,
                attrs: [],
                hrefs: []
              };
            }
            ids[n.id].elem = n;
          }

          // now search for all attributes on this element that might refer
          // to other elements
          $.each(ref_attrs, function (i, attr) {
            var attrnode = n.getAttributeNode(attr);
            if (attrnode) {
              // the incoming file has been sanitized, so we should be able to safely just strip off the leading #
              var url = svgedit.utilities.getUrlFromAttr(attrnode.value),
                refid = url ? url.substr(1) : null;
              if (refid) {
                if (!(refid in ids)) {
                  // add this id to our map
                  ids[refid] = {
                    elem: null,
                    attrs: [],
                    hrefs: []
                  };
                }
                ids[refid].attrs.push(attrnode);
              }
            }
          });

          // check xlink:href now
          var href = svgedit.utilities.getHref(n);
          // TODO: what if an <image> or <a> element refers to an element internally?
          if (href && ref_elems.indexOf(n.nodeName) >= 0) {
            var refid = href.substr(1);
            if (refid) {
              if (!(refid in ids)) {
                // add this id to our map
                ids[refid] = {
                  elem: null,
                  attrs: [],
                  hrefs: []
                };
              }
              ids[refid].hrefs.push(n);
            }
          }
        }
      });

      // in ids, we now have a map of ids, elements and attributes, let's re-identify
      var oldid;
      for (oldid in ids) {
        break;
        if (!oldid) {
          continue;
        }
        var elem = ids[oldid].elem;
        if (elem) {
          var newid = getNextId();

          // assign element its new id
          elem.id = newid;

          // remap all url() attributes
          var attrs = ids[oldid].attrs;
          var j = attrs.length;
          while (j--) {
            var attr = attrs[j];
            attr.ownerElement.setAttribute(attr.name, 'url(#' + newid + ')');
          }

          // remap all href attributes
          var hreffers = ids[oldid].hrefs;
          var k = hreffers.length;
          while (k--) {
            var hreffer = hreffers[k];
            svgedit.utilities.setHref(hreffer, '#' + newid);
          }
        }
      }
    };

    // Function setUseData
    // Assigns reference data for each use element
    var setUseData = this.setUseData = function (parent) {
      var elems = $(parent);

      if (parent.tagName !== 'use') {
        elems = elems.find('use');
      }

      elems.each(function () {
        var id = getHref(this).substr(1);
        var ref_elem = svgedit.utilities.getElem(id);
        if (!ref_elem) {
          return;
        }
        $(this).data('ref', ref_elem);
        if (ref_elem.tagName === 'symbol' || ref_elem.tagName === 'svg') {
          $(this).data('symbol', ref_elem).data('ref', ref_elem);
        }
      });
    };

    // Function convertGradients
    // Converts gradients from userSpaceOnUse to objectBoundingBox
    var convertGradients = this.convertGradients = function (elem) {
      var elems = $(elem).find('linearGradient, radialGradient');
      if (!elems.length && svgedit.browser.isWebkit()) {
        // Bug in webkit prevents regular *Gradient selector search
        elems = $(elem).find('*').filter(function () {
          return (this.tagName.indexOf('Gradient') >= 0);
        });
      }

      elems.each(function () {
        var grad = this;
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
            var g_coords = $(grad).attr(['x1', 'y1', 'x2', 'y2']);

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
              y1: (g_coords.y1 - bb.y) / bb.height,
              x2: (g_coords.x2 - bb.x) / bb.width,
              y2: (g_coords.y2 - bb.y) / bb.height
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
    };

    // Function: convertToGroup
    // Converts selected/given <use> or child SVG element to a group
    var convertToGroup = this.convertToGroup = function (elem) {
      if (!elem) {
        elem = selectedElements[0];
      }
      var $elem = $(elem);
      var batchCmd = new svgedit.history.BatchCommand();
      var ts;

      if ($elem.data('gsvg')) {
        // Use the gsvg as the new group
        var svg = elem.firstChild;
        var pt = $(svg).attr(['x', 'y']);

        $(elem.firstChild.firstChild).unwrap();
        $(elem).removeData('gsvg');

        var tlist = svgedit.transformlist.getTransformList(elem);
        var xform = svgroot.createSVGTransform();
        xform.setTranslate(pt.x, pt.y);
        tlist.appendItem(xform);
        svgedit.recalculate.recalculateDimensions(elem);
        call('selected', [elem]);
      } else if ($elem.data('symbol')) {
        elem = $elem.data('symbol');

        ts = $elem.attr('transform') || '';
        var pos = $elem.attr(['x', 'y']);

        var vb = elem.getAttribute('viewBox');

        if (vb) {
          var nums = vb.split(' ');
          pos.x -= +nums[0];
          pos.y -= +nums[1];
        }

        // Not ideal, but works
        ts += ' translate(' + (pos.x || 0) + ',' + (pos.y || 0) + ')';

        var prev = $elem.prev();

        // Remove <use> element
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand($elem[0], $elem[0].nextSibling, $elem[0].parentNode));
        $elem.remove();

        // See if other elements reference this symbol
        var has_more = $(svgcontent).find('use:data(symbol)').length;

        var g = svgdoc.createElementNS(NS.SVG, 'g');
        var childs = elem.childNodes;

        var i;
        for (i = 0; i < childs.length; i++) {
          if (childs[i].tagName !== 'defs') {
            g.appendChild(childs[i].cloneNode(true));
          }
        }

        // Duplicate the gradients for Gecko, since they weren't included in the <symbol>
        if (svgedit.browser.isGecko()) {
          var dupeGrads = $(svgedit.utilities.findDefs()).children('linearGradient,radialGradient,pattern').clone();
          $(g).append(dupeGrads);
        }

        if (ts) {
          g.setAttribute('transform', ts);
        }

        var parent = elem.parentNode;

        uniquifyElems(g);

        // Put the dupe gradients back into <defs> (after uniquifying them)
        if (svgedit.browser.isGecko()) {
          $(findDefs()).append($(g).find('linearGradient,radialGradient,pattern'));
        }

        // now give the g itself a new id
        g.id = getNextId();

        prev.after(g);

        if (parent) {
          if (!has_more) {
            // remove symbol/svg element
            var nextSibling = elem.nextSibling;
            parent.removeChild(elem);
            batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, nextSibling, parent));
          }
          batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(g));
        }

        setUseData(g);

        if (svgedit.browser.isGecko()) {
          convertGradients(svgedit.utilities.findDefs());
        } else {
          convertGradients(g);
        }

        // recalculate dimensions on the top-level children so that unnecessary transforms
        // are removed
        svgedit.utilities.walkTreePost(g, function (n) {
          try {
            svgedit.recalculate.recalculateDimensions(n);
          } catch (e) {
            console.log(e);
          }
        });

        // Give ID for any visible element missing one
        $(g).find(visElems).each(function () {
          if (!this.id) {
            this.id = getNextId();
          }
        });

        selectOnly([g]);

        var cm = pushGroupProperties(g, true);
        if (cm) {
          batchCmd.addSubCommand(cm);
        }

        addCommandToHistory(batchCmd);

      } else {
        console.log('Unexpected element to ungroup:', elem);
      }
    };

    const sanitizeXmlString = (xmlString) => {
      // ref: https://stackoverflow.com/questions/29031792/detect-non-valid-xml-characters-javascript
      const res = [];
      const re = /([\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF])+/g;
      let i = 0;
      while (i < xmlString.length) {
        // Prevent Maximum call stack size exceeded, split xmlString and process
        let end = Math.min(i + 1000000, xmlString.length);
        if (end !== xmlString.length && xmlString[end - 1].match(/[\uD800-\uDBFF]/)) {
          end -= 1;
        }
        const matchResult = xmlString.substring(i, end).match(re);
        i = end;
        if (matchResult) {
          res.push(...matchResult);
        }
      }
      return res.join('');
    }

    //
    // Function: setSvgString
    // This function sets the current drawing as the input SVG XML.
    //
    // Parameters:
    // xmlString - The SVG as XML text.
    //
    // Returns:
    // This function returns false if the set was unsuccessful, true otherwise.
    this.setSvgString = function (xmlString) {
      try {
        // convert string into XML document
        xmlString = sanitizeXmlString(xmlString);
        console.log(xmlString);
        var newDoc = svgedit.utilities.text2xml(xmlString);

        this.prepareSvg(newDoc);

        var batchCmd = new svgedit.history.BatchCommand('Change Source');

        // remove old svg document
        var nextSibling = svgcontent.nextSibling;
        var oldzoom = svgroot.removeChild(svgcontent);
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(oldzoom, nextSibling, svgroot));

        // set new svg document
        // If DOM3 adoptNode() available, use it. Otherwise fall back to DOM2 importNode()
        if (svgdoc.adoptNode) {
          svgcontent = svgdoc.adoptNode(newDoc.documentElement);
        } else {
          svgcontent = svgdoc.importNode(newDoc.documentElement, true);
        }

        svgroot.appendChild(svgcontent);
        var content = $(svgcontent);

        canvas.current_drawing_ = new svgedit.draw.Drawing(svgcontent, idprefix);

        // retrieve or set the nonce
        var nonce = getCurrentDrawing().getNonce();
        if (nonce) {
          call('setnonce', nonce);
        } else {
          call('unsetnonce');
        }

        // change image href vals if possible
        content.find('image').each(function () {
          var image = this;
          svgedit.utilities.preventClickDefault(image);
          var val = getHref(this);
          if (val) {
            if (val.indexOf('data:') === 0) {
              // Check if an SVG-edit data URI
              var m = val.match(/svgedit_url=(.*?);/);
              if (m) {
                var url = decodeURIComponent(m[1]);
                $(new Image()).load(function () {
                  image.setAttributeNS(NS.XLINK, 'xlink:href', url);
                }).attr('src', url);
              }
            }
            // Add to encodableImages if it loads
            canvas.embedImage(val);
          }
        });

        // Wrap child SVGs in group elements
        content.find('svg').each(function () {
          // Skip if it's in a <defs>
          if ($(this).closest('defs').length) {
            return;
          }

          uniquifyElems(this);

          // Check if it already has a gsvg group
          var pa = this.parentNode;
          if (pa.childNodes.length === 1 && pa.nodeName === 'g') {
            $(pa).data('gsvg', this);
            pa.id = pa.id || getNextId();
          } else {
            groupSvgElem(this);
          }
        });

        // For Firefox: Put all paint elems in defs
        if (svgedit.browser.isGecko()) {
          content.find('linearGradient, radialGradient, pattern').appendTo(svgedit.utilities.findDefs());
        }

        // Set ref element for <use> elements

        // TODO: This should also be done if the object is re-added through "redo"
        setUseData(content);

        convertGradients(content[0]);

        var attrs = {
          id: 'svgcontent',
          overflow: curConfig.show_outside_canvas ? 'visible' : 'hidden'
        };

        var percs = false;

        // determine proper size
        if (content.attr('viewBox')) {
          var vb = content.attr('viewBox').split(' ');
          attrs.width = vb[2];
          attrs.height = vb[3];
        }
        // handle content that doesn't have a viewBox
        else {
          $.each(['width', 'height'], function (i, dim) {
            // Set to 100 if not given
            var val = content.attr(dim);

            if (!val) {
              val = '100%';
            }

            if (String(val).substr(-1) === '%') {
              // Use user units if percentage given
              percs = true;
            } else {
              attrs[dim] = svgedit.units.convertToNum(dim, val);
            }
          });
        }

        // Percentage width/height, so let's base it on visible elements
        if (percs) {
          var bb = getStrokedBBox();
          attrs.width = bb.width + bb.x;
          attrs.height = bb.height + bb.y;
        }

        // Just in case negative numbers are given or
        // result from the percs calculation
        if (attrs.width <= 0) {
          attrs.width = 100;
        }
        if (attrs.height <= 0) {
          attrs.height = 100;
        }

        // Keep workarea size after loading external svg
        attrs.width = Constant.dimension.getWidth(BeamboxPreference.read('model'));
        attrs.height = Constant.dimension.getHeight(BeamboxPreference.read('model'));

        // identify layers
        identifyLayers();

        // Give ID for any visible layer children missing one
        content.children().find(visElems).each(function () {
          if (!this.id) {
            this.id = getNextId();
          }
        });

        content.attr(attrs);
        this.contentW = attrs.width;
        this.contentH = attrs.height;

        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(svgcontent));
        // update root to the correct size
        var changes = content.attr(['width', 'height']);
        batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(svgroot, changes));

        // reset zoom
        current_zoom = 1;

        // reset transform lists
        svgedit.transformlist.resetListMap();
        clearSelection();
        svgedit.path.clearData();
        svgroot.appendChild(selectorManager.selectorParentGroup);

        addCommandToHistory(batchCmd);
        call('changed', [svgcontent]);
        const layers = $('#svgcontent > g.layer').toArray();
        layers.forEach(layer => {
          this.updateLayerColor(layer);
          const childNodes = Array.from(layer.childNodes);
          while (childNodes.length > 0) {
            const child = childNodes.pop();
            if (child.tagName !== 'g') {
              $(child).mouseover(this.handleGenerateSensorArea).mouseleave(this.handleGenerateSensorArea);
            } else {
              childNodes.push(...Array.from(child.childNodes));
            }
          }
        });
      } catch (e) {
        console.log(e);
        return false;
      }

      return true;
    };

    this.removeDefaultLayerIfEmpty = removeDefaultLayerIfEmpty = () => {
      const defaultLayerName = LANG.right_panel.layer_panel.layer1;
      const drawing = getCurrentDrawing();
      const layer = drawing.getLayerByName(defaultLayerName);
      if (layer) {
        const childNodes = Array.from(layer.childNodes);
        const isEmpty = childNodes.every((node) => {
          return ['title', 'filter'].includes(node.tagName)
        });
        if (isEmpty) {
          console.log('default layer is empty. delete it!');
          svgCanvas.setCurrentLayer(defaultLayerName);
          svgCanvas.deleteCurrentLayer();
          svgEditor.updateContextPanel();
          LayerPanelController.updateLayerPanel();
        }
      }
    }

    // Function: importSvgString
    // This function imports the input SVG XML as a <symbol> in the <defs>, then adds a
    // <use> to the current layer.
    //
    // Parameters:
    // xmlString - The SVG as XML text.
    //
    // Returns:
    // This function returns null if the import was unsuccessful, or the element otherwise.
    // TODO:
    // * properly handle if namespace is introduced by imported content (must add to svgcontent
    // and update all prefixes in the imported node)
    // * properly handle recalculating dimensions, recalculateDimensions() doesn't handle
    // arbitrary transform lists, but makes some assumptions about how the transform list
    // was obtained
    // * import should happen in top-left of current zoomed viewport
    this.importSvgString = async function (xmlString, _type, layerName) {
      const batchCmd = new svgedit.history.BatchCommand('Import Image');

      function parseSvg(svg, type) {
        function _removeSvgText() {
          if ($(svg).find('text').length) {
            Alert.popUp({
              type: AlertConstants.SHOW_POPUP_INFO,
              message: LANG.popup.no_support_text,
            });
            $(svg).find('text').remove();
          }
        }
        function _removeComments() {
          // only remove comment which level is svg.children.
          // should traverse all svg level and remove all comments if you have time
          $(svg).contents().each(function () {
            if (this.nodeType === Node.COMMENT_NODE) {
              $(this).remove();
            }
          });
        }
        function _symbolWrapper(symbolContents, unit) {
          if (symbolContents.tagName === 'g' && symbolContents.childNodes.length === 0) {
            console.log('wrapping empty group, return null');
            return null;
          }
          const rootViewBox = svg.getAttribute('viewBox');
          const rootWidth = unit2Pixel(svg.getAttribute('width'), unit);
          const rootHeight = unit2Pixel(svg.getAttribute('height'), unit);
          const rootTransform = svg.getAttribute('transform') || '';

          const transformList = [];
          transformList.unshift(rootTransform);

          if (rootWidth && rootHeight && rootViewBox) {
            console.log('resize with width height viewbox');

            const resizeW = rootWidth / rootViewBox.split(' ')[2];
            const resizeH = rootHeight / rootViewBox.split(' ')[3];
            transformList.unshift(`scale(${resizeW}, ${resizeH})`);
          } else {
            // console.log('resize with 72 dpi');

            const svgUnitScaling = unit2Pixel('1px');
            transformList.unshift(`scale(${svgUnitScaling})`);
          }

          const wrappedSymbolContent = svgdoc.createElementNS(NS.SVG, 'g');
          if (symbolContents.length) {
            symbolContents.map(content => {
              wrappedSymbolContent.appendChild(content);
            });
          } else {
            try {
              wrappedSymbolContent.appendChild(symbolContents);
            } catch (e) {
              console.log(e);
            }
          }
          wrappedSymbolContent.setAttribute('viewBox', rootViewBox);
          wrappedSymbolContent.setAttribute('transform', transformList.join(' '));

          return wrappedSymbolContent;
        }
        function _parseSvgByLayer() {
          const defNodes = Array.from(svg.childNodes).filter(node => 'defs' === node.tagName);
          let defChildren = [];
          defNodes.map(def => {
            defChildren = defChildren.concat(Array.from(def.childNodes));
          });

          const layerNodes = Array.from(svg.childNodes).filter(node => !['defs', 'title', 'style', 'metadata', 'sodipodi:namedview'].includes(node.tagName));

          const isValidLayeredSvg = layerNodes.every(node => {
            // if svg draw some object at first level, return false
            if (['a', 'circle', 'clipPath', 'ellipse', 'feGaussianBlur', 'foreignObject', 'image', 'line', 'linearGradient', 'marker', 'mask', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'switch', 'symbol', 'text', 'textPath', 'tspan', 'use'].includes(node.tagName)) {
              return false;
            }

            // if it is a group, it need to have an id to ensure it is a layer
            if (node.tagName === 'g' && node.id === null) {
              return false;
            }

            // svg software like inkscape may add additioal tag like "sodipodi:namedview", so we return true as default
            return true;
          });

          const symbols = layerNodes.map(node => {
            const symbol = SymbolMaker.makeSymbol(_symbolWrapper(node), [], batchCmd, defChildren, 'layer');
            return symbol;
          });

          return symbols;
        }
        function _parseSvgByColor(svg) {
          function getColorOfElement(node) {
            let color;
            color = node.getAttribute('stroke');
            if (color === 'none') {
              color = node.getAttribute('fill');
            }
            color = color || 'rgb(0%,0%,0%)';
            return color;

          }
          function getAllColorInNodes(nodes) {
            const allColorsInNodes = new Set();

            function traverseToGetAllColor(frontierNode) {
              Array.from(frontierNode.childNodes).map(child => {
                if (['polygon', 'path', 'line', 'rect', 'ellipse', 'circle'].includes(child.tagName)) {
                  allColorsInNodes.add(getColorOfElement(child));
                } else if ('g' === child.tagName) {
                  traverseToGetAllColor(child);
                }
              });
            }

            nodes.map(node => traverseToGetAllColor(node));

            return allColorsInNodes;
          }

          function filterColor(filter, node) {
            const children = Array.from(node.childNodes);
            children.map((grandchild) => {
              if (['polygon', 'path', 'line', 'rect', 'ellipse', 'circle'].indexOf(grandchild.tagName) >= 0) {
                var color = getColorOfElement(grandchild);
                if (color !== filter) {
                  node.removeChild(grandchild);
                } else {
                  node.setAttribute('data-color', color);
                }
              } else if (grandchild.tagName === 'g') {
                grandchild.setAttribute('data-color', color);
                filterColor(filter, grandchild);
              }
            });
          }

          const defNodes = Array.from(svg.childNodes).filter(node => 'defs' === node.tagName);
          let defChildren = [];
          defNodes.map(def => {
            defChildren = defChildren.concat(Array.from(def.childNodes));
          });

          const originLayerNodes = Array.from(svg.childNodes).filter(child => child.tagName === 'g');
          originLayerNodes.forEach((node) => {
            const uses = Array.from(node.getElementsByTagName('use'));
            uses.forEach((use) => {
              const href = $(svg).find(use.getAttribute('xlink:href'));
              if (href.length > 0) {
                const newElem = href[0].cloneNode(true);
                use.parentNode.appendChild(newElem);
                use.remove();
              }
            });
          });
          const availableColors = getAllColorInNodes(originLayerNodes);
          // re-classify elements by their color
          const groupColorMap = {};
          originLayerNodes.map(child => {
            Array.from(availableColors).map(strokeColor => {
              const clonedGroup = child.cloneNode(true);
              filterColor(strokeColor, clonedGroup);
              if (!groupColorMap[strokeColor]) {
                groupColorMap[strokeColor] = svgdoc.createElementNS(NS.SVG, 'g');
                groupColorMap[strokeColor].setAttribute('data-color', strokeColor);
              }
              groupColorMap[strokeColor].appendChild(clonedGroup);
            });
          });

          const coloredLayerNodes = Object.values(groupColorMap);

          const symbols = coloredLayerNodes.map(node => {
            const wrappedSymbolContent = _symbolWrapper(node);
            const color = node.getAttribute('data-color');
            if (color) {
              wrappedSymbolContent.setAttribute('data-color', color);
            }
            const symbol = SymbolMaker.makeSymbol(wrappedSymbolContent, [], batchCmd, defChildren, 'color');
            return symbol;
          });
          return symbols;
        }
        function _parseSvgByNolayer(svg) {
          //this is same as parseByLayer .....
          const defNodes = Array.from(svg.childNodes).filter(node => 'defs' === node.tagName);
          const styleNodes = Array.from(svg.childNodes).filter(node => 'style' === node.tagName);
          let defChildren = [];
          defNodes.map(def => {
            defChildren = defChildren.concat(Array.from(def.childNodes));
          });
          defChildren = defChildren.concat(styleNodes);

          const layerNodes = Array.from(svg.childNodes).filter(node => !['defs', 'title', 'style', 'metadata', 'sodipodi:namedview'].includes(node.tagName));
          const symbol = SymbolMaker.makeSymbol(_symbolWrapper(layerNodes), [], batchCmd, defChildren, type);

          return [symbol];
        }
        // return symbols
        // _removeSvgText();
        _removeComments();
        switch (type) {
          case 'color':
            return {
              symbols: _parseSvgByColor(svg),
              confirmedType: 'color'
            };

          case 'nolayer':
            return {
              symbols: _parseSvgByNolayer(svg),
              confirmedType: 'nolayer'
            };
          case 'layer':
            let symbols = _parseSvgByLayer(svg);
            if (symbols) {
              return {
                symbols: symbols,
                confirmedType: 'layer'
              };
            } else {
              console.log('Not valid layer. Use nolayer parsing option instead');
              return {
                symbols: _parseSvgByNolayer(svg),
                confirmedType: 'nolayer'
              };
            }
          case 'image-trace':
            return {
              symbols: _parseSvgByColor(svg),
              confirmedType: 'color'
            };
        }
      }
      async function appendUseElement(symbol, type, layerName) {
        // create a use element
        if (!symbol) {
          return null;
        }
        const use_el = svgdoc.createElementNS(NS.SVG, 'use');
        use_el.id = getNextId();
        setHref(use_el, '#' + symbol.id);
        //switch currentLayer, and create layer if necessary
        if ((type === 'layer' && layerName) || (type === 'color' && symbol.getAttribute('data-color') || (type === 'image-trace'))) {

          const color = symbol.getAttribute('data-color');
          if (type === 'image-trace') {
            layerName = 'Traced Path';
          } else if (type === 'color') {
            layerName = rgbToHex(color);
          }

          const isLayerExist = svgCanvas.setCurrentLayer(layerName);
          if (!isLayerExist) {
            const layer = svgCanvas.createLayer(layerName);
            layer.color = color;

            if (type === 'layer' && layerName) {
              let matchPara = layerName.match(/(?<=#)[-SP0-9\.]*\b/i);
              if (matchPara) {
                let matchPower = matchPara[0].match(/(?<=P)[-0-9\.]*/i);
                let matchSpeed = matchPara[0].match(/(?<=S)[-0-9\.]*/i);
                let parsePower = matchPower ? parseFloat(matchPower) : NaN;
                let parseSpeed = matchSpeed ? parseFloat(matchSpeed) : NaN;
                let laserConst = LANG.right_panel.laser_panel;
                if (!isNaN(parsePower)) {
                  parsePower = Math.round(parsePower * 10) / 10;
                  parsePower = Math.max(Math.min(parsePower, laserConst.power.max), laserConst.power.min);
                  $(layer).attr('data-strength', parsePower);
                }
                if (!isNaN(parseSpeed)) {
                  parseSpeed = Math.round(parseSpeed * 10) / 10;
                  parseSpeed = Math.max(Math.min(parseSpeed, laserConst.laser_speed.max), laserConst.laser_speed.min);
                  $(layer).attr('data-speed', parseSpeed);
                }
              }
            } else if (type === 'color') {
              let layerColorConfig = storage.get('layer-color-config') || {};
              let index = layerColorConfig.dict ? layerColorConfig.dict[layerName] : undefined;
              let laserConst = LANG.right_panel.laser_panel;
              if (index !== undefined) {
                $(layer).attr('data-strength', Math.max(Math.min(layerColorConfig.array[index].power, laserConst.power.max), laserConst.power.min));
                $(layer).attr('data-speed', Math.max(Math.min(layerColorConfig.array[index].speed, laserConst.laser_speed.max), laserConst.laser_speed.min));
                $(layer).attr('data-repeat', layerColorConfig.array[index].repeat);
              }
            }
          }
        }
        if (type === 'text') {
          svgCanvas.setCurrentLayer(layerName);
        }

        getCurrentDrawing().getCurrentLayer().appendChild(use_el);

        $(use_el).data('symbol', symbol).data('ref', symbol);

        use_el.setAttribute('data-symbol', symbol);
        use_el.setAttribute('data-ref', symbol);
        use_el.setAttribute('data-svg', true);
        use_el.setAttribute('data-ratiofixed', true);

        if (type === 'nolayer') {
          use_el.setAttribute('data-wireframe', true);
          let iterationStack = [symbol];
          while (iterationStack.length > 0) {
            let node = iterationStack.pop();
            if (node.nodeType === 1 && node.tagName !== 'STYLE') {
              node.setAttribute('data-wireframe', true);
              node.setAttribute('stroke', '#000');
              node.setAttribute('fill-opacity', '0');
              iterationStack.push(...Array.from(node.childNodes));
            }
          }
        }

        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(use_el));

        return use_el;
      }
      function rgbToHex(rgbStr) {
        const rgb = rgbStr.substring(4).split(',');
        let hex = (Math.floor(parseFloat(rgb[0]) * 2.55) * 65536 + Math.floor(parseFloat(rgb[1]) * 2.55) * 256 + Math.floor(parseFloat(rgb[2]) * 2.55)).toString(16);
        if (hex === 'NaN') {
          hex = '0';
        }
        while (hex.length < 6) {
          hex = '0' + hex;
        }
        return '#' + hex.toUpperCase(); // ex: #0A23C5
      }
      function setDataXform(use_el, it) {
        const bb = svgedit.utilities.getBBox(use_el);
        let dataXform = '';

        if (it) {
          dataXform = `x=0 y=0 width=${bb.width} height=${bb.height}`
        } else {
          $.each(bb, function (key, value) {
            dataXform += key + '=' + value + ' ';
          });
        }

        use_el.setAttribute('data-xform', dataXform);
        return use_el;
      }
      function unit2Pixel(val, unit) {
        if ((val === false) || (val === undefined) || (val === null)) {
          return false;
        }

        // is percentage
        if (val.substr(-1) === '%') {
          console.log('unsupported unit "%" for', val);
          return;
        }

        const dpi = 72;
        const svgUnitScaling = 254 / dpi; //本來 72 個點代表 1 inch, 現在 254 個點代表 1 inch.
        const unitMap = {
          'in': 25.4 * 10,
          'cm': 10 * 10,
          'mm': 10,
          'px': svgUnitScaling,
          'pt': 1,
          'text': 1
        };

        if (!isNaN(val)) {
          return val * unitMap['px'];
        }

        unit = unit || val.substr(-2);
        const num = val.substr(0, val.length - 2);
        if (!unitMap[unit]) {
          console.log('unsupported unit', unit, 'for', val, ' use pixel instead');
        }

        // use pixel if unit is unsupport
        return num * (unitMap[unit] || unitMap['px']);
      }

      const newDoc = svgedit.utilities.text2xml(xmlString);
      svgCanvas.prepareSvg(newDoc);
      const svg = svgdoc.adoptNode(newDoc.documentElement);
      const { symbols, confirmedType } = parseSvg(svg, _type);

      const use_elements = (await Promise.all(symbols.map(async (symbol) => await appendUseElement(symbol, _type, layerName)))).filter((elem) => elem);
      use_elements.forEach(elem => {
        $(use_elements).mouseover(this.handleGenerateSensorArea).mouseleave(this.handleGenerateSensorArea);
      });

      use_elements.forEach(element => setDataXform(element, _type === 'image-trace'));
      await Promise.all(use_elements.map(async (element) => {
        const ref_id = this.getHref(element);
        const symbol = document.querySelector(ref_id);
        const imageSymbol = await SymbolMaker.makeImageSymbol(symbol);
        setHref(element, '#' + imageSymbol.id);
        if (this.isUsingLayerColor) {
          this.updateElementColor(element);
        }
      }));

      removeDefaultLayerIfEmpty();

      addCommandToHistory(batchCmd);
      call('changed', [svgcontent]);

      // we want to return the element so we can automatically select it
      return use_elements[use_elements.length - 1];

    };

    // TODO(codedread): Move all layer/context functions in draw.js
    // Layer API Functions

    // Group: Layers

    // Function: identifyLayers
    // Updates layer system
    var identifyLayers = canvas.identifyLayers = function () {
      leaveContext();
      getCurrentDrawing().identifyLayers();
    };

    let randomColors = ['#333333', '#3F51B5', '#F44336', '#FFC107', '#8BC34A', '#2196F3', '#009688', '#FF9800', '#CDDC39', '#00BCD4', '#FFEB3B', '#E91E63', '#673AB7', '#03A9F4', '#9C27B0', '#607D8B', '#9E9E9E'];

    canvas.resetRandomColors = () => {
      randomColors = ['#333333', '#3F51B5', '#F44336', '#FFC107', '#8BC34A', '#2196F3', '#009688', '#FF9800', '#CDDC39', '#00BCD4', '#FFEB3B', '#E91E63', '#673AB7', '#03A9F4', '#9C27B0', '#607D8B', '#9E9E9E'];
    }

    var getRandomLayerColor = canvas.getRandomLayerColor = function () {
      if (randomColors.length === 0) {
        canvas.resetRandomColors();
      }
      return randomColors.shift();
    };

    // Function: createLayer
    // Creates a new top-level layer in the drawing with the given name, sets the current layer
    // to it, and then clears the selection. This function then calls the 'changed' handler.
    // This is an undoable action.
    //
    // Parameters:
    // name - The given name
    this.createLayer = function (name, hrService, hexCode) {
      let drawing = getCurrentDrawing();
      let new_layer = drawing.createLayer(name, historyRecordingService(hrService));
      if (drawing.layer_map[name]) {
        if (name && name.indexOf('#') === 0) {
          drawing.layer_map[name].setColor(name);
        } else if (hexCode) {
          drawing.layer_map[name].setColor(hexCode);
        } else {
          drawing.layer_map[name].setColor(getRandomLayerColor());
        }
      }
      this.updateLayerColorFilter(new_layer);
      clearSelection();
      call('changed', [new_layer]);
      return new_layer;
    };

    /**
     * Creates a new top-level layer in the drawing with the given name, copies all the current layer's contents
     * to it, and then clears the selection. This function then calls the 'changed' handler.
     * This is an undoable action.
     * @param {string} name - The given name. If the layer name exists, a new name will be generated.
     * @param {svgedit.history.HistoryRecordingService} hrService - History recording service
     */
    this.cloneLayer = function (name, hrService) {
      // Clone the current layer and make the cloned layer the new current layer
      var new_layer = getCurrentDrawing().cloneLayer(name, historyRecordingService(hrService));

      clearSelection();
      leaveContext();
      call('changed', [new_layer]);
    };

    // Function: deleteCurrentLayer
    // Deletes the current layer from the drawing and then clears the selection. This function
    // then calls the 'changed' handler. This is an undoable action.
    this.deleteCurrentLayer = function () {
      var current_layer = getCurrentDrawing().getCurrentLayer();
      var nextSibling = current_layer.nextSibling;
      var parent = current_layer.parentNode;
      current_layer = getCurrentDrawing().deleteCurrentLayer();
      if (current_layer) {
        var batchCmd = new svgedit.history.BatchCommand('Delete Layer');
        // store in our Undo History
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(current_layer, nextSibling, parent));
        addCommandToHistory(batchCmd);
        clearSelection();
        call('changed', [parent]);
        return true;
      }
      return false;
    };

    // Function: setCurrentLayer
    // Sets the current layer. If the name is not a valid layer name, then this function returns
    // false. Otherwise it returns true. This is not an undo-able action.
    //
    // Parameters:
    // name - the name of the layer you want to switch to.
    //
    // Returns:
    // true if the current layer was switched, otherwise false
    this.setCurrentLayer = function (name) {
      var result = getCurrentDrawing().setCurrentLayer(svgedit.utilities.toXml(name));
      if (result) {
        //clearSelection();
      }
      return result;
    };

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
    this.renameCurrentLayer = function (newname) {
      var drawing = getCurrentDrawing();
      var layer = drawing.getCurrentLayer();
      if (layer) {
        var result = drawing.setCurrentLayerName(newname, historyRecordingService());
        if (result) {
          call('changed', [layer]);
          return true;
        }
      }
      return false;
    };

    // Function: setCurrentLayerPosition
    // Changes the position of the current layer to the new value. If the new index is not valid,
    // this function does nothing and returns false, otherwise it returns true. This is an
    // undo-able action.
    //
    // Parameters:
    // newpos - The zero-based index of the new position of the layer. This should be between
    // 0 and (number of layers - 1)
    //
    // Returns:
    // true if the current layer position was changed, false otherwise.
    this.setCurrentLayerPosition = function (newpos) {
      var oldpos, drawing = getCurrentDrawing();
      var result = drawing.setCurrentLayerPosition(newpos);
      if (result) {
        addCommandToHistory(new svgedit.history.MoveElementCommand(result.currentGroup, result.oldNextSibling, svgcontent));
        return true;
      }
      return false;
    };

    this.sortTempGroupByLayer = () => {
      if (!tempGroup) return;
      const drawing = getCurrentDrawing();
      const allLayerNames = drawing.all_layers.map((layer) => layer.name_);
      for (let i = 0; i < allLayerNames.length; i++) {
        const elems = tempGroup.querySelectorAll(`[data-original-layer="${allLayerNames[i]}"]`);
        for (let j = 0; j < elems.length; j++) {
          tempGroup.appendChild(elems[j]);
        }
      }
    }

    // Function: setLayerVisibility
    // Sets the visibility of the layer. If the layer name is not valid, this function return
    // false, otherwise it returns true. This is an undo-able action.
    //
    // Parameters:
    // layername - the name of the layer to change the visibility
    // bVisible - true/false, whether the layer should be visible
    //
    // Returns:
    // true if the layer's visibility was set, false otherwise
    this.setLayerVisibility = function (layername, bVisible) {
      var drawing = getCurrentDrawing();
      var prevVisibility = drawing.getLayerVisibility(layername);
      var layer = drawing.setLayerVisibility(layername, bVisible);
      if (layer) {
        var oldDisplay = prevVisibility ? 'inline' : 'none';
        addCommandToHistory(new svgedit.history.ChangeElementCommand(layer, {
          'display': oldDisplay
        }, 'Layer Visibility'));
      } else {
        return false;
      }

      if (layer === drawing.getCurrentLayer()) {
        clearSelection();
        pathActions.clear();
      }
      //		call('changed', [selected]);
      return true;
    };

    // Function: moveSelectedToLayer
    // Moves the selected elements to layername. If the name is not a valid layer name, then false
    // is returned. Otherwise it returns true. This is an undo-able action.
    //
    // Parameters:
    // layername - the name of the layer you want to which you want to move the selected elements
    //
    // Returns:
    // true if the selected elements were moved to the layer, false otherwise.
    this.moveSelectedToLayer = function (layername) {
      // find the layer
      var i;
      var drawing = getCurrentDrawing();
      var layer = drawing.getLayerByName(layername);
      if (!layer) {
        return false;
      }

      var batchCmd = new svgedit.history.BatchCommand('Move Elements to Layer');

      // loop for each selected element and move it
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }

      var selElems = selectedElements;
      i = selElems.length;
      while (i--) {
        var elem = selElems[i];
        if (!elem) {
          continue;
        }
        const descendants = [...elem.querySelectorAll('*')];
        for (let j = 0; j < descendants.length; j += 1) {
          descendants[j].removeAttribute('data-original-layer');
        }
        var oldNextSibling = elem.nextSibling;
        // TODO: this is pretty brittle!
        var oldLayer = elem.parentNode;
        layer.appendChild(elem);
        if (this.isUsingLayerColor) {
          this.updateElementColor(elem);
        }
        batchCmd.addSubCommand(new svgedit.history.MoveElementCommand(elem, oldNextSibling, oldLayer));
      }

      addCommandToHistory(batchCmd);
      this.tempGroupSelectedElements();
      return true;
    };

    this.mergeLayer = function (hrService) {
      getCurrentDrawing().mergeLayer(historyRecordingService(hrService));
      clearSelection();
      leaveContext();
      const currentLayer = getCurrentDrawing().getCurrentLayer();
      this.updateLayerColor(currentLayer);
      call('changed', [svgcontent]);
    };

    this.mergeAllLayers = function (hrService) {
      getCurrentDrawing().mergeAllLayers(historyRecordingService(hrService));
      clearSelection();
      leaveContext();
      const currentLayer = getCurrentDrawing().getCurrentLayer();
      this.updateLayerColor(currentLayer);
      call('changed', [svgcontent]);
    };

    this.toggleUseLayerColor = () => {
      this.isUsingLayerColor = !(this.isUsingLayerColor);
      BeamboxPreference.write('use_layer_color', this.isUsingLayerColor);
      Menu.getApplicationMenu().items.find(i => i.id === '_view').submenu.items.find(i => i.id === 'SHOW_LAYER_COLOR').checked = this.isUsingLayerColor;
      const layers = Array.from(document.querySelectorAll('g.layer'));
      layers.forEach(layer => {
        this.updateLayerColor(layer);
      });
    };

    let hexToRgb = (hexColorCode) => {
      let res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColorCode);
      if (res) {
        return {
          r: parseInt(res[1], 16),
          g: parseInt(res[2], 16),
          b: parseInt(res[3], 16),
        }
      }
      return { r: 0, g: 0, b: 0 };
    };

    this.updateLayerColorFilter = (layer) => {
      const color = this.isUsingLayerColor ? $(layer).attr('data-color') : '#000';
      const { r, g, b } = hexToRgb(color);
      let filter = Array.from(layer.childNodes).filter((child) => child.tagName === 'filter')[0];
      if (filter) {
        filter.setAttribute('id', `filter${color}`);
        let colorMatrix = Array.from(filter.childNodes).filter((child) => child.tagName === 'feColorMatrix')[0];
        if (colorMatrix) {
          colorMatrix.setAttribute('values', `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`);
        } else {
          colorMatrix = svgdoc.createElementNS(NS.SVG, 'feColorMatrix');
          svgedit.utilities.assignAttributes(colorMatrix, {
            'type': 'matrix',
            'values': `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`,
          });
          filter.appendChild(colorMatrix);
        }
      } else {
        const colorFilter = svgdoc.createElementNS(NS.SVG, 'filter');
        const colorMatrix = svgdoc.createElementNS(NS.SVG, 'feColorMatrix');
        svgedit.utilities.assignAttributes(colorFilter, {
          'id': `filter${color}`,
          'filterUnits': 'objectBoundingBox',
          'primitiveUnits': 'userSpaceOnUse',
          'color-interpolation-filters': 'sRGB'
        });
        svgedit.utilities.assignAttributes(colorMatrix, {
          'type': 'matrix',
          'values': `1 0 0 0 ${r / 255}, 0 1 0 0 ${g / 255}, 0 0 1 0 ${b / 255}, 0 0 0 1 0`,
        });
        colorFilter.appendChild(colorMatrix);
        layer.appendChild(colorFilter);
      }
    }

    this.updateLayerColor = function (layer) {
      const color = this.isUsingLayerColor ? $(layer).attr('data-color') : '#000';
      this.updateLayerColorFilter(layer);
      const elems = Array.from(layer.childNodes);
      if (tempGroup) {
        const layerName = LayerHelper.getLayerName(layer);
        const multiSelectedElems = tempGroup.querySelectorAll(`[data-original-layer="${layerName}"]`);
        elems.push(...multiSelectedElems);
      }
      this.setElementsColor(elems, color);
    };

    this.updateElementColor = function (elem) {
      const color = this.isUsingLayerColor ? $(LayerHelper.getObjectLayer(elem).elem).attr('data-color') : '#000';
      this.setElementsColor([elem], color);
    }

    this.setElementsColor = function (elems, color) {
      let descendants = [...elems];
      let svg_by_color = 0;
      let svg_by_layer = false;
      while (descendants.length > 0) {
        const elem = descendants.pop();
        if (elem === 'end datacolor') {
          svg_by_color -= 1;
          continue;
        }
        if (elem === 'end by_layer') {
          svg_by_layer = false;
          continue;
        }
        const attrStroke = $(elem).attr('stroke');
        const attrFill = $(elem).attr('fill');
        if (['rect', 'circle', 'ellipse', 'path', 'polygon', 'text', 'line'].includes(elem.tagName)) {
          if (((svg_by_layer && svg_by_color === 0) || attrStroke) && attrStroke !== 'none') {
            $(elem).attr('stroke', color);
          }
          if (attrFill !== 'none') {
            $(elem).attr('fill', color);
          }
        } else if (elem.tagName === 'image') {
          if (color === '#000') {
            elem.removeAttribute('filter');
          } else {
            $(elem).attr('filter', `url(#filter${color})`);
          }
        } else if (['g', 'svg', 'symbol'].includes(elem.tagName)) {
          if ($(elem).data('color')) {
            descendants.push('end datacolor');
            svg_by_color += 1;
          }
          descendants.push(...elem.childNodes);
        } else if (elem.tagName === 'use') {
          if ($(elem).data('wireframe')) {
            descendants.push('end by_layer');
            svg_by_layer = true;
          }
          descendants.push(...elem.childNodes);
          const href = $(elem).attr('href') || $(elem).attr('xlink:href');
          const shadow_root = $(href).toArray();
          descendants.push(...shadow_root);
        } else {
          //console.log(`setElementsColor: unsupported element type ${elem.tagName}`);
        }
      }
    }

    this.toggleRulers = () => {
      const shouldShowRulers = !BeamboxPreference.read('show_rulers');
      Menu.getApplicationMenu().items.find(i => i.id === '_view').submenu.items.find(i => i.id === 'SHOW_RULERS').checked = shouldShowRulers;
      document.getElementById('rulers').style.display = shouldShowRulers ? '' : 'none';
      if (shouldShowRulers) {
        svgEditor.updateRulers();
      }
      BeamboxPreference.write('show_rulers', shouldShowRulers);
    };

    // Function: leaveContext
    // Return from a group context to the regular kind, make any previously
    // disabled elements enabled again
    var leaveContext = this.leaveContext = function () {
      var i, len = disabled_elems.length;
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
    };

    // Function: setContext
    // Set the current context (for in-group editing)
    var setContext = this.setContext = function (elem) {
      leaveContext();
      if (typeof elem === 'string') {
        elem = svgedit.utilities.getElem(elem);
      }

      // Edit inside this group
      current_group = elem;

      // Disable other elements
      $(elem).parentsUntil('#svgcontent').andSelf().siblings().each(function () {
        var opac = this.getAttribute('opacity') || 1;
        // Store the original's opacity
        elData(this, 'orig_opac', opac);
        this.setAttribute('opacity', opac * 0.33);
        this.setAttribute('style', 'pointer-events: none');
        disabled_elems.push(this);
      });

      clearSelection();
      call('contextset', current_group);
    };

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
      canvas.current_drawing_ = new svgedit.draw.Drawing(svgcontent);

      // Reset Used Layer colors
      canvas.resetRandomColors();

      // create empty first layer
      canvas.createLayer(LANG.right_panel.layer_panel.layer1);
      LaserConfigHelper.initLayerConfig(LANG.right_panel.layer_panel.layer1);

      // clear the undo stack
      canvas.undoMgr.resetUndoStack();

      // reset the selector manager
      selectorManager.initGroup();

      // reset the rubber band box
      rubberBox = selectorManager.getRubberBandBox();

      call('cleared');
    };

    // Function: linkControlPoints
    // Alias function
    this.linkControlPoints = pathActions.linkControlPoints;

    // Function: getContentElem
    // Returns the content DOM element
    this.getContentElem = function () {
      return svgcontent;
    };

    // Function: getRootElem
    // Returns the root DOM element
    this.getRootElem = function () {
      return svgroot;
    };

    // Function: getSelectedElems
    // Returns the array with selected DOM elements
    this.getSelectedElems = function () {
      return selectedElements;
    };

    // Function: getTempGroup
    // Returns flag denoted the state of temp group
    this.getTempGroup = function () {
      return tempGroup;
    };

    // Function: getResolution
    // Returns the current dimensions and zoom level in an object
    var getResolution = this.getResolution = function () {
      //		var vb = svgcontent.getAttribute('viewBox').split(' ');
      //		return {'w':vb[2], 'h':vb[3], 'zoom': current_zoom};

      var width = svgcontent.getAttribute('width') / current_zoom;
      var height = svgcontent.getAttribute('height') / current_zoom;

      return {
        'w': width,
        'h': height,
        'zoom': current_zoom
      };
    };

    // Function: getZoom
    // Returns the current zoom level
    this.getZoom = function () {
      return current_zoom;
    };

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

    // Function: setUiStrings
    // Update interface strings with given values
    //
    // Parameters:
    // strs - Object with strings (see uiStrings for examples)
    this.setUiStrings = function (strs) {
      $.extend(uiStrings, strs.notification);
    };

    // Function: toggleBorderless
    // switch Borderless mode if no input, set to turnOnBorderless if passed
    //
    // Parameters:
    // turnOnBorderless - turn on borderless mode or not
    this.toggleBorderless = function (turnOnBorderless) {
      let borderless;
      if (turnOnBorderless === undefined) {
        borderless = BeamboxPreference.read('borderless') || false;
        borderless = !borderless;
      } else {
        borderless = turnOnBorderless;
      }
      BeamboxPreference.write('borderless', borderless);
      OpenBottomBoundaryDrawer.update();
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
      elem = $(elem).data('gsvg') || $(elem).data('symbol') || elem;
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

      var ts = $(elem).children('title');

      var batchCmd = new svgedit.history.BatchCommand('Set Label');

      if (!val.length) {
        // Remove title element
        var tsNextSibling = ts.nextSibling;
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(ts[0], tsNextSibling, elem));
        ts.remove();
      } else if (ts.length) {
        // Change title contents
        var title = ts[0];
        batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(title, {
          '#text': title.textContent
        }));
        title.textContent = val;
      } else {
        // Add title element
        title = svgdoc.createElementNS(NS.SVG, 'title');
        title.textContent = val;
        $(elem).prepend(title);
        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(title));
      }

      addCommandToHistory(batchCmd);
    };

    // Function: getDocumentTitle
    // Returns the current document title or an empty string if not found
    var getDocumentTitle = this.getDocumentTitle = function () {
      return canvas.getTitle(svgcontent);
    };

    // Function: setDocumentTitle
    // Adds/updates a title element for the document with the given name.
    // This is an undoable action
    //
    // Parameters:
    // newtitle - String with the new title
    this.setDocumentTitle = function (newtitle) {
      var i;
      var childs = svgcontent.childNodes,
        doc_title = false,
        old_title = '';

      var batchCmd = new svgedit.history.BatchCommand('Change Image Title');

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
      batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(doc_title, {
        '#text': old_title
      }));
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

    // Function: setResolution
    // Changes the document's dimensions to the given size
    //
    // Parameters:
    // x - Number with the width of the new dimensions in user units.
    // Can also be the string "fit" to indicate "fit to content"
    // y - Number with the height of the new dimensions in user units.
    //
    // Returns:
    // Boolean to indicate if resolution change was succesful.
    // It will fail on "fit to content" option with no content to fit to.
    this.setResolution = function (x, y) {
      var res = getResolution();
      var w = res.w,
        h = res.h;
      var batchCmd;

      svgroot.setAttribute('x', x);
      svgroot.setAttribute('y', y);

      if (x === 'fit') {
        // Get bounding box
        var bbox = getStrokedBBox();

        if (bbox) {
          batchCmd = new svgedit.history.BatchCommand('Fit Canvas to Content');
          var visEls = getVisibleElements();
          addToSelection(visEls);
          var dx = [],
            dy = [];
          $.each(visEls, function (i, item) {
            dx.push(bbox.x * -1);
            dy.push(bbox.y * -1);
          });

          var cmd = canvas.moveSelectedElements(dx, dy, true);
          batchCmd.addSubCommand(cmd);
          clearSelection();

          x = Math.round(bbox.width);
          y = Math.round(bbox.height);
        } else {
          return false;
        }
      }
      if (x !== w || y !== h) {
        if (!batchCmd) {
          batchCmd = new svgedit.history.BatchCommand('Change Image Dimensions');
        }

        x = svgedit.units.convertToNum('width', x);
        y = svgedit.units.convertToNum('height', y);

        svgcontent.setAttribute('width', x);
        svgcontent.setAttribute('height', y);

        this.contentW = x;
        this.contentH = y;
        batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(svgcontent, {
          'width': w,
          'height': h
        }));

        svgcontent.setAttribute('viewBox', [0, 0, x / current_zoom, y / current_zoom].join(' '));
        batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(svgcontent, {
          'viewBox': ['0 0', w, h].join(' ')
        }));

        addCommandToHistory(batchCmd);
        call('changed', [svgcontent]);
      }
      return true;
    };

    // Function: getOffset
    // Returns an object with x, y values indicating the svgcontent element's
    // position in the editor's canvas.
    this.getOffset = function () {
      return $(svgcontent).attr(['x', 'y']);
    };

    // Function: setBBoxZoom
    // Sets the zoom level on the canvas-side based on the given value
    //
    // Parameters:
    // val - Bounding box object to zoom to or string indicating zoom option
    // editor_w - Integer with the editor's workarea box's width
    // editor_h - Integer with the editor's workarea box's height
    // this.setBBoxZoom = function(val, editor_w, editor_h) {
    // var spacer = 0.85;
    // var bb;
    // var calcZoom = function(bb) {
    // 	if (!bb) {return false;}
    // 	var w_zoom = Math.round((editor_w / bb.width)*100 * spacer)/100;
    // 	var h_zoom = Math.round((editor_h / bb.height)*100 * spacer)/100;
    // 	var zoomlevel = Math.min(w_zoom, h_zoom);
    // 	canvas.setZoom(zoomlevel);
    // 	return {'zoom': zoomlevel, 'bbox': bb};
    // };

    // if (typeof val === 'object') {
    // 	bb = val;
    // 	if (bb.width == 0 || bb.height == 0) {
    // 		var newzoom = bb.zoom ? bb.zoom : current_zoom * bb.factor;
    // 		canvas.setZoom(newzoom);
    // 		return {'zoom': current_zoom, 'bbox': bb};
    // 	}
    // 	return calcZoom(bb);
    // }

    // switch (val) {
    // 	case 'selection':
    // 		if (!selectedElements[0]) {return;}
    // 		var sel_elems = $.map(selectedElements, function(n){ if (n) {return n;} });
    // 		bb = getStrokedBBox(sel_elems);
    // 		break;
    // 	case 'canvas':
    // 		var res = getResolution();
    // 		spacer = 0.95;
    // 		bb = {width:res.w, height:res.h , x:0, y:0};
    // 		break;
    // 	case 'content':
    // 		bb = getStrokedBBox();
    // 		break;
    // 	case 'layer':
    // 		bb = getStrokedBBox(getVisibleElements(getCurrentDrawing().getCurrentLayer()));
    // 		break;
    // 	default:
    // 		return;
    // }
    // return calcZoom(bb);
    // };

    // Function: setZoom
    // Sets the zoom to the given level
    //
    // Parameters:
    // zoomlevel - Float indicating the zoom level to change to
    this.setZoom = function (zoomlevel) {
      var res = getResolution();
      svgcontent.setAttribute('viewBox', '0 0 ' + res.w / zoomlevel + ' ' + res.h / zoomlevel);
      const oldZoom = current_zoom;
      current_zoom = zoomlevel;
      $.each(selectedElements, function (i, elem) {
        if (!elem) {
          return;
        }
        selectorManager.requestSelector(elem).resize();
      });
      pathActions.zoomChange(oldZoom);
      ZoomBlockController.updateZoomBlock();
      runExtensions('zoomChanged', zoomlevel);
    };

    // Function: getMode
    // Returns the current editor mode string
    this.getMode = function () {
      return current_mode;
    };

    // Function: setMode
    // Sets the editor's mode to the given string
    //
    // Parameters:
    // name - String with the new mode to change to
    this.setMode = function (name) {
      if (current_mode === 'path') {
        pathActions.finishPath(false);
      }
      pathActions.clear(true);
      textActions.clear();
      cur_properties = (selectedElements[0] && selectedElements[0].nodeName === 'text') ? cur_text : cur_shape;
      current_mode = name;
      if (name === 'path') {
        this.collectAlignPoints();
      }
      $('.tool-btn').removeClass('active');
      switch (name) {
        case 'select':
          $('#svg_editor g').css('cursor', 'move');
          $('#left-Shoot').addClass('active');
          $('#left-Cursor').addClass('active');
          break;
        case 'text':
          $('#left-Text').addClass('active');
          break;
        case 'line':
          $('#left-Line').addClass('active');
          break;
        case 'rect':
          $('#left-Rectangle').addClass('active');
          break;
        case 'ellipse':
          $('#left-Ellipse').addClass('active');
          break;
        case 'polygon':
          $('#left-Polygon').addClass('active');
          break;
        case 'path':
          $('#left-Pen').addClass('active');
          break;
      };
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
        type: 'solidColor'
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
          } else {
            if (type === 'fill') {
              if (elem.tagName !== 'polyline' && elem.tagName !== 'line') {
                elems.push(elem);
              }
            } else {
              elems.push(elem);
            }
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
    var setGradient = this.setGradient = function (type) {
      if (!cur_properties[type + '_paint'] || cur_properties[type + '_paint'].type === 'solidColor') {
        return;
      }
      var grad = canvas[type + 'Grad'];
      // find out if there is a duplicate gradient already in the defs
      var duplicate_grad = findDuplicateGradient(grad);
      var defs = svgedit.utilities.findDefs();
      // no duplicate found, so import gradient into defs
      if (!duplicate_grad) {
        var orig_grad = grad;
        grad = defs.appendChild(svgdoc.importNode(grad, true));
        // get next id and set it on the grad
        grad.id = getNextId();
      } else { // use existing gradient
        grad = duplicate_grad;
      }
      canvas.setColor(type, 'url(#' + grad.id + ')');
    };

    // Function: findDuplicateGradient
    // Check if exact gradient already exists
    //
    // Parameters:
    // grad - The gradient DOM element to compare to others
    //
    // Returns:
    // The existing gradient if found, null if not
    var findDuplicateGradient = function (grad) {
      var defs = svgedit.utilities.findDefs();
      var existing_grads = $(defs).find('linearGradient, radialGradient');
      var i = existing_grads.length;
      var rad_attrs = ['r', 'cx', 'cy', 'fx', 'fy'];
      while (i--) {
        var og = existing_grads[i];
        if (grad.tagName === 'linearGradient') {
          if (grad.getAttribute('x1') != og.getAttribute('x1') ||
            grad.getAttribute('y1') != og.getAttribute('y1') ||
            grad.getAttribute('x2') != og.getAttribute('x2') ||
            grad.getAttribute('y2') != og.getAttribute('y2')) {
            continue;
          }
        } else {
          var grad_attrs = $(grad).attr(rad_attrs);
          var og_attrs = $(og).attr(rad_attrs);

          var diff = false;
          $.each(rad_attrs, function (i, attr) {
            if (grad_attrs[attr] != og_attrs[attr]) {
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

          if (stop.getAttribute('offset') != ostop.getAttribute('offset') ||
            stop.getAttribute('stop-opacity') != ostop.getAttribute('stop-opacity') ||
            stop.getAttribute('stop-color') != ostop.getAttribute('stop-color')) {
            break;
          }
        }

        if (j === -1) {
          return og;
        }
      } // for each gradient in defs

      return null;
    };

    function reorientGrads(elem, m) {
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
            x1 = (bb.width * x1) + bb.x;
            y1 = (bb.height * y1) + bb.y;
            x2 = (bb.width * x2) + bb.x;
            y2 = (bb.height * y2) + bb.y;

            // Transform those points
            var pt1 = svgedit.math.transformPoint(x1, y1, m);
            var pt2 = svgedit.math.transformPoint(x2, y2, m);

            // Convert back to BB points
            var g_coords = {};

            g_coords.x1 = (pt1.x - bb.x) / bb.width;
            g_coords.y1 = (pt1.y - bb.y) / bb.height;
            g_coords.x2 = (pt2.x - bb.x) / bb.width;
            g_coords.y2 = (pt2.y - bb.y) / bb.height;

            var newgrad = grad.cloneNode(true);
            $(newgrad).attr(g_coords);

            newgrad.id = getNextId();
            svgedit.utilities.findDefs().appendChild(newgrad);
            elem.setAttribute(type, 'url(#' + newgrad.id + ')');
          }
        }
      }
    }

    // Function: setPaint
    // Set a color/gradient to a fill/stroke
    //
    // Parameters:
    // type - String with "fill" or "stroke"
    // paint - The jGraduate paint object to apply
    this.setPaint = function (type, paint) {
      // make a copy
      var p = new $.jGraduate.Paint(paint);
      this.setPaintOpacity(type, p.alpha / 100, true);

      // now set the current paint object
      cur_properties[type + '_paint'] = p;
      switch (p.type) {
        case 'solidColor':
          this.setColor(type, p.solidColor !== 'none' ? '#' + p.solidColor : 'none');
          break;
        case 'linearGradient':
        case 'radialGradient':
          canvas[type + 'Grad'] = p[p.type];
          setGradient(type);
          break;
      }
    };

    // alias
    this.setStrokePaint = function (paint) {
      this.setPaint('stroke', paint);
    };

    this.setFillPaint = function (paint) {
      this.setPaint('fill', paint);
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
      if (val == 0 && ['line', 'path'].indexOf(current_mode) >= 0) {
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
          svgedit.utilities.assignAttributes(filter, {
            x: '-50%',
            y: '-50%',
            width: '200%',
            height: '200%'
          }, 100);
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

        var batchCmd = new svgedit.history.BatchCommand();

        // Blur found!
        if (filter) {
          if (val === 0) {
            filter = null;
          }
        } else {
          // Not found, so create
          var newblur = addSvgElementFromJson({
            'element': 'feGaussianBlur',
            'attr': {
              'in': 'SourceGraphic',
              'stdDeviation': val
            }
          });

          filter = addSvgElementFromJson({
            'element': 'filter',
            'attr': {
              'id': elem_id + '_blur'
            }
          });

          filter.appendChild(newblur);
          svgedit.utilities.findDefs().appendChild(filter);

          batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(filter));
        }

        var changes = {
          filter: elem.getAttribute('filter')
        };

        if (val === 0) {
          elem.removeAttribute('filter');
          batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(elem, changes));
          return;
        }

        changeSelectedAttribute('filter', 'url(#' + elem_id + '_blur)');
        batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(elem, changes));
        canvas.setBlurOffsets(filter, val);

        cur_command = batchCmd;
        canvas.undoMgr.beginUndoableChange('stdDeviation', [filter ? filter.firstChild : null]);
        if (complete) {
          canvas.setBlurNoUndo(val);
          finishChange();
        }
      };
    })();

    // Function: getBold
    // Check whether selected element is bold or not
    //
    // Returns:
    // Boolean indicating whether or not element is bold
    this.getBold = function () {
      // should only have one element selected
      var selected = selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        return (selected.getAttribute('font-weight') === 'bold');
      }
      return false;
    };

    // Function: setBold
    // Make the selected element bold or normal
    //
    // Parameters:
    // b - Boolean indicating bold (true) or normal (false)
    this.setBold = function (b) {
      var selected = selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        changeSelectedAttribute('font-weight', b ? 'bold' : 'normal');
      }
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
    };

    // Function: getItalic
    // Check whether selected element is italic or not
    //
    // Returns:
    // Boolean indicating whether or not element is italic
    this.getItalic = function (elem) {
      var selected = elem || selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        return (selected.getAttribute('font-style') === 'italic');
      }
      return false;
    };

    // Function: setItalic
    // Make the selected element italic or normal
    //
    // Parameters:
    // b - Boolean indicating italic (true) or normal (false)
    this.setItalic = function (i, isSubCmd) {
      var selected = selectedElements[0];
      let cmd = null;
      if (selected != null && selected.tagName === 'text' && selectedElements[1] == null) {
        if (isSubCmd) {
          canvas.undoMgr.beginUndoableChange('font-style', [selected]);
          changeSelectedAttributeNoUndo('font-style', i ? 'italic' : 'normal', [selected]);
          cmd = canvas.undoMgr.finishUndoableChange();
        } else {
          changeSelectedAttribute('font-style', i ? 'italic' : 'normal');
        }
      }
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
      return cmd;
    };

    this.getFontWeight = function (elem) {
      var selected = elem || selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        return selected.getAttribute('font-weight');
      }
      return false;
    };

    this.setFontWeight = function (i, isSubCmd) {
      var selected = selectedElements[0];
      let cmd = null;
      if (selected != null && selected.tagName === 'text' && selectedElements[1] == null) {
        if (isSubCmd) {
          canvas.undoMgr.beginUndoableChange('font-weight', [selected]);
          changeSelectedAttributeNoUndo('font-weight', i ? i : 'normal', [selected]);
          cmd = canvas.undoMgr.finishUndoableChange();
        } else {
          changeSelectedAttribute('font-weight', i ? i : 'normal');
        }
      }
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
      return cmd;
    };

    this.getFontIsFill = function () {
      var selected = selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        const fillAttr = selected.getAttribute('fill');
        if (selected.getAttribute('fill-opacity') === '0') {
          return false;
        }
        if (['#fff', '#ffffff', 'none'].includes(fillAttr)) {
          return false;
        } else if (fillAttr || fillAttr === null) {
          return true;
        } else {
          return false;
        }
      }
      return false;
    };

    this.setFontIsFill = function (isFill) {
      var selected = selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        const color = this.isUsingLayerColor ? $(LayerHelper.getObjectLayer(selected).elem).attr('data-color') : '#000';
        changeSelectedAttribute('fill', isFill ? color : '#fff');
        changeSelectedAttribute('fill-opacity', isFill ? 1 : 0);
        changeSelectedAttribute('stroke', isFill ? 'none' : color);
      }
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
    };

    this.getLetterSpacing = function (textElem) {
      if (!textElem) textElem = selectedElements[0];
      if (textElem != null && textElem.tagName === 'text' &&
        selectedElements[1] == null) {
        let val = textElem.getAttribute('letter-spacing');
        if (val) {
          if (val.toLowerCase().endsWith('em')) {
            return parseFloat(val.slice(0, -2));
          } else {
            console.warn('letter-spacing should be em!');
            return 0;
          }
        } else {
          return 0;
        }
      }
      return false;
    };

    this.setLetterSpacing = function (val) {
      var selected = selectedElements[0];
      if (selected != null && selected.tagName === 'text' &&
        selectedElements[1] == null) {
        changeSelectedAttribute('letter-spacing', val ? (val.toString() + 'em') : '0em');
        this.updateMultiLineTextElem(selectedElements[0]);
      }
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
    };

    /**
     * Returns the current font family
     * @param {Element | null} elem
     * @returns {string} the font family of element
     */
    this.getFontFamily = function (elem) {
      const selected = elem || selectedElements[0];
      if (selected) {
        return selected.getAttribute('font-family');
      }
      return cur_text.font_family;
    };

    /**
     * Set the new font family, in macOS value will be postscript to make text correctly rendered
     * @param {string} val New font family
     * @param {boolean} isSubCmd Whether this operation is a sub command or a sole command
     */
    this.setFontFamily = function (val, isSubCmd) {
      let cmd = null;
      if (process.platform !== 'darwin') cur_text.font_family = val;
      if (isSubCmd) {
        canvas.undoMgr.beginUndoableChange('font-family', selectedElements);
        changeSelectedAttributeNoUndo('font-family', val, selectedElements);
        cmd = canvas.undoMgr.finishUndoableChange();
      } else {
        changeSelectedAttribute('font-family', val);
      }
      if (selectedElements[0] && !selectedElements[0].textContent) {
        textActions.setCursor();
      }
      return cmd;
    };

    /**
     * Returns the font family data of element
     * @param {Element | null} elem
     * @returns {string} the font family data of element
     */
    this.getFontFamilyData = (elem) => {
      const selected = elem || selectedElements[0];
      if (selected) {
        if (!selected.getAttribute('data-font-family')) {
          return this.getFontFamily(elem);
        }
        return selected.getAttribute('data-font-family');
      }
      return cur_text.font_family;
    };

    /**
     * Set the data font family (Used for MacOS only)
     * In MacOS font-family would be set same as font-postscript to make sure text would be rendered correctly.
     * So addition attribution is needed to record it's font family data.
     * @param {string} val New font family
     * @param {boolean} isSubCmd Whether this operation is a sub command or a sole command
     */
    this.setFontFamilyData = (val, isSubCmd) => {
      let cmd = null;
      cur_text.font_family = val;
      if (isSubCmd) {
        canvas.undoMgr.beginUndoableChange('data-font-family', selectedElements);
        changeSelectedAttributeNoUndo('data-font-family', val, selectedElements);
        cmd = canvas.undoMgr.finishUndoableChange();
      } else {
        changeSelectedAttribute('data-font-family', val);
      }
      return cmd;
    }

    this.getFontPostscriptName = function (elem) {
      const selected = elem || selectedElements[0];
      if (selected) {
        return selected.getAttribute('font-postscript');
      }
      return cur_text.font_postscriptName;
    };

    this.setFontPostscriptName = function (val, isSubCmd) {
      let cmd = null;
      cur_text.font_postscriptName = val;
      if (isSubCmd) {
        canvas.undoMgr.beginUndoableChange('font-postscript', selectedElements);
        changeSelectedAttributeNoUndo('font-postscript', val, selectedElements);
        cmd = canvas.undoMgr.finishUndoableChange();
      } else {
        changeSelectedAttribute('font-postscript', val);
      }
      return cmd;
    };

    this.setTextLineSpacing = function (val) {
      changeSelectedAttribute('data-line-spacing', val);
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
      textActions.setLineSpacing(val);
      const elem = selectedElements[0];
      const angle = svgedit.utilities.getRotationAngle(elem);
      this.setRotationAngle(0, true, elem);
      this.updateMultiLineTextElem(selectedElements[0]);
      this.setRotationAngle(angle, true, elem);
    };

    this.getTextLineSpacing = (textElem) => {
      if (!textElem) textElem = selectedElements[0];
      if (textElem != null && textElem.tagName === 'text' &&
        selectedElements[1] == null) {
        let val = textElem.getAttribute('data-line-spacing') || '1';
        textActions.setLineSpacing(parseFloat(val));
        return val;
      }
      return false;
    }

    this.setTextIsVertical = (val) => {
      changeSelectedAttribute('data-verti', val);
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
      textActions.setIsVertical(val);
      const elem = selectedElements[0];
      const angle = svgedit.utilities.getRotationAngle(elem);
      this.setRotationAngle(0, true, elem);
      this.updateMultiLineTextElem(elem);
      this.setRotationAngle(angle, true, elem);
      svgEditor.updateContextPanel();
    }

    this.getTextIsVertical = (textElem) => {
      if (!textElem) textElem = selectedElements[0];
      if (textElem != null && textElem.tagName === 'text' &&
        selectedElements[1] == null) {
        let val = textElem.getAttribute('data-verti') === 'true';
        textActions.setIsVertical(val);
        return val;
      }
      return false;
    }

    // Function: setFontColor
    // Set the new font color
    //
    // Parameters:
    // val - String with the new font color
    this.setFontColor = function (val) {
      cur_text.fill = val;
      changeSelectedAttribute('fill', val);
    };

    // Function: getFontColor
    // Returns the current font color
    this.getFontColor = function () {
      return cur_text.fill;
    };

    // Function: getFontSize
    // Returns the current font size
    this.getFontSize = function (textElem) {
      if (!textElem) textElem = selectedElements[0];
      if (textElem) {
        return textElem.getAttribute('font-size');
      }
      return cur_text.font_size;
    };

    // Function: setFontSize
    // Applies the given font size to the selected element
    //
    // Parameters:
    // val - Float with the new font size
    this.setFontSize = function (val) {
      cur_text.font_size = val;
      changeSelectedAttribute('font-size', val);
      if (!selectedElements[0].textContent) {
        textActions.setCursor();
      }
      this.updateMultiLineTextElem(selectedElements[0]);
    };

    // Function: getText
    // Returns the current text (textContent) of the selected element
    this.getText = function () {
      var selected = selectedElements[0];
      if (selected == null) {
        return '';
      }
      return selected.textContent;
    };

    // Function: setTextContent
    // Updates the text element with the given string
    //
    // Parameters:
    // val - String with the new text
    this.setTextContent = function (val) {
      let textElement = selectedElements[0];
      textActions.renderMultiLineText(textElement, val, true);
      textActions.init(textElement);
      textActions.setCursor();
    };

    // Function: setImageURL
    // Sets the new image URL for the selected image element. Updates its size if
    // a new URL is given
    //
    // Parameters:
    // val - String with the image URL/path
    this.setImageURL = function (val) {
      var elem = selectedElements[0];
      if (!elem) {
        return;
      }

      var attrs = $(elem).attr(['width', 'height']);
      var setsize = (!attrs.width || !attrs.height);

      var cur_href = getHref(elem);

      // Do nothing if no URL change or size change
      if (cur_href !== val) {
        setsize = true;
      } else if (!setsize) {
        return;
      }

      var batchCmd = new svgedit.history.BatchCommand('Change Image URL');

      setHref(elem, val);
      batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(elem, {
        '#href': cur_href
      }));

      if (setsize) {
        $(new Image()).load(function () {
          var changes = $(elem).attr(['width', 'height']);

          $(elem).attr({
            width: this.width,
            height: this.height
          });

          selectorManager.requestSelector(elem).resize();

          batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(elem, changes));
          addCommandToHistory(batchCmd);
          call('changed', [elem]);
        }).attr('src', val);
      } else {
        addCommandToHistory(batchCmd);
      }
    };

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

      var batchCmd = new svgedit.history.BatchCommand('Change Link URL');

      setHref(elem, val);
      batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(elem, {
        '#href': cur_href
      }));

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
        if (r != val) {
          selected.setAttribute('rx', val);
          selected.setAttribute('ry', val);
          addCommandToHistory(new svgedit.history.ChangeElementCommand(selected, {
            'rx': r,
            'ry': r
          }, 'Radius'));
          call('changed', [selected]);
        }
      }
    };

    this.isElemFillable = (elem) => {
      let fillableTags = ['rect', 'ellipse', 'path', 'text', 'polygon', 'g'];
      if (!fillableTags.includes(elem.tagName)) {
        return false;
      };
      if (elem.tagName === 'g') {
        let childNodes = elem.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          if (!this.isElemFillable(childNodes[i])) {
            return false;
          }
        }
        return true;
      }

      return elem.tagName === 'path' ? this.calcPathClosed(elem) : true;
    }

    this.calcPathClosed = (pathElem) => {
      let segList = pathElem.pathSegList._list;
      let [startX, startY, currentX, currentY, isDrawing, isClosed] = [0, 0, 0, 0, false, true];
      for (let i = 0; i < segList.length; i++) {
        let seg = segList[i];
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
    }

    this.calcElemFilledInfo = (elem) => {
      let fillableTags = ['rect', 'ellipse', 'path', 'text', 'polygon', 'g'];
      if (!fillableTags.includes(elem.tagName)) {
        return {
          isAnyFilled: false,
          isAllFilled: false
        };
      };
      if (elem.tagName === 'g') {
        let childNodes = elem.childNodes;
        let isAnyFilled;
        let isAllFilled = true;
        for (let i = 0; i < childNodes.length; i++) {
          let childFilledInfo = this.calcElemFilledInfo(childNodes[i]);
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
        return { isAnyFilled, isAllFilled };
      }
      let isFilled = ($(elem).attr('fill-opacity') !== 0) && $(elem).attr('fill') !== 'none';
      return {
        isAnyFilled: isFilled,
        isAllFilled: isFilled
      };
    }

    this.setElemsFill = function (elems) {
      let batchCmd = new svgedit.history.BatchCommand('set elems fill');
      for (let i = 0; i < elems.length; ++i) {
        elem = elems[i];
        if (elem == null) {
          break;
        }

        const availableType = ['rect', 'ellipse', 'path', 'text', 'polygon'];
        if (availableType.includes(elem.tagName)) {
          if (this.calcElemFilledInfo(elem).isAllFilled) {
            continue;
          }
          const color = $(elem).attr('stroke') || '#333';
          let cmd = this.setElementFill(elem, color);
          if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
        } else if (elem.tagName === 'g') {
          this.setElemsFill(elem.childNodes);
        } else {
          console.log(`Not support type: ${elem.tagName}`)
        }
      }
      if (TutorialController.getNextStepRequirement() === TutorialConstants.INFILL) {
        TutorialController.handleNextStep();
      }
      if (!batchCmd.isEmpty()) addCommandToHistory(batchCmd);
    }

    this.setElementFill = function (elem, color) {
      let batchCmd = new svgedit.history.BatchCommand('set elem fill');
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
    }

    this.setElemsUnfill = function (elems) {
      let batchCmd = new svgedit.history.BatchCommand('set elems unfill');
      for (let i = 0; i < elems.length; ++i) {
        elem = elems[i];
        if (elem == null) {
          break;
        }
        const availableType = ['rect', 'ellipse', 'path', 'text', 'polygon'];

        if (availableType.includes(elem.tagName)) {
          if (!this.calcElemFilledInfo(elem).isAnyFilled) {
            continue;
          }
          const color = $(elem).attr('fill') || '#333';
          let cmd = this.setElementUnfill(elem, color);
          if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
        } else if (elem.tagName === 'g') {
          this.setElemsUnfill(elem.childNodes);
        } else {
          console.log(`Not support type: ${elem.tagName}`)
        }
      }
      if (!batchCmd.isEmpty()) addCommandToHistory(batchCmd);
    }

    this.setElementUnfill = function (elem, color) {
      let batchCmd = new svgedit.history.BatchCommand('set elem unfill');
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
    }

    // Function: makeHyperlink
    // Wraps the selected element(s) in an anchor element or converts group to one
    this.makeHyperlink = function (url) {
      canvas.groupSelectedElements('a', url);

      // TODO: If element is a single "g", convert to "a"
      //	if (selectedElements.length > 1 && selectedElements[1]) {

    };

    // Function: removeHyperlink
    this.removeHyperlink = function () {
      canvas.ungroupSelectedElement();
    };

    // TODO(codedread): Remove the getBBox argument and split this function into two.
    // Function: convertToPath
    // Convert selected element to a path, or get the BBox of an element-as-path
    //
    // Parameters:
    // elem - The DOM element to be converted
    // getBBox - Boolean on whether or not to only return the path's BBox
    //
    // Returns:
    // If the getBBox flag is true, the resulting path's bounding box object.
    // Otherwise the resulting path element is returned.
    this.convertToPath = function (elem, getBBox) {
      if (elem == null) {
        var elems = selectedElements;
        $.each(elems, function (i, elem) {
          if (elem) {
            canvas.convertToPath(elem);
          }
        });
        return;
      }
      if (getBBox) {
        return svgedit.utilities.getBBoxOfElementAsPath(elem, addSvgElementFromJson, pathActions);
      } else {
        // TODO: Why is this applying attributes from cur_shape, then inside utilities.convertToPath it's pulling addition attributes from elem?
        // TODO: If convertToPath is called with one elem, cur_shape and elem are probably the same; but calling with multiple is a bug or cool feature.
        var attrs = {
          'fill': cur_shape.fill,
          'fill-opacity': cur_shape.fill_opacity,
          'stroke': cur_shape.stroke,
          'stroke-width': cur_shape.stroke_width,
          'stroke-dasharray': cur_shape.stroke_dasharray,
          'stroke-linejoin': cur_shape.stroke_linejoin,
          'stroke-linecap': cur_shape.stroke_linecap,
          'stroke-opacity': cur_shape.stroke_opacity,
          'opacity': cur_shape.opacity,
          'visibility': 'hidden'
        };
        return svgedit.utilities.convertToPath(elem, attrs, addSvgElementFromJson, pathActions, clearSelection, addToSelection, svgedit.history, addCommandToHistory);
      }
    };


    // Function: changeSelectedAttributeNoUndo
    // This function makes the changes to the elements. It does not add the change
    // to the history stack.
    //
    // Parameters:
    // attr - String with the attribute name
    // newValue - String or number with the new attribute value
    // elems - The DOM elements to apply the change to
    var changeSelectedAttributeNoUndo = this.changeSelectedAttributeNoUndo = function (attr, newValue, elems) {
      if (current_mode === 'pathedit') {
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
        if ((attr === 'x' || attr === 'y') && no_xy_elems.indexOf(elem.tagName) >= 0) {
          var bbox = getStrokedBBox([elem]);
          var diff_x = attr === 'x' ? newValue - bbox.x : 0;
          var diff_y = attr === 'y' ? newValue - bbox.y : 0;
          canvas.moveSelectedElements(diff_x * current_zoom, diff_y * current_zoom, true);
          continue;
        }

        // only allow the transform/opacity/filter attribute to change on <g> elements, slightly hacky
        // TODO: FIXME: This doesn't seem right. Where's the body of this if statement?
        if (elem.tagName === 'g' && good_g_attrs.indexOf(attr) >= 0) { }
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
          if (current_mode === 'textedit' && attr !== '#text' && elem.textContent.length) {
            textActions.toSelectMode(elem);
          }

          //			if (i==0)
          //				selectedBBoxes[0] = svgedit.utilities.getBBox(elem);
          // Use the Firefox ffClone hack for text elements with gradients or
          // where other text attributes are changed.
          if (svgedit.browser.isGecko() && elem.nodeName === 'text' && /rotate/.test(elem.getAttribute('transform'))) {
            if (String(newValue).indexOf('url') === 0 || (['font-size', 'font-family', 'x', 'y'].indexOf(attr) >= 0 && elem.textContent)) {
              elem = ffClone(elem);
            }
          }
          // Timeout needed for Opera & Firefox
          // codedread: it is now possible for this function to be called with elements
          // that are not in the selectedElements array, we need to only request a
          // selector if the element is in that array
          if (selectedElements.indexOf(elem) >= 0) {
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
              if (xform.type == 4) {
                // remove old rotate
                tlist.removeItem(n);

                var box = svgedit.utilities.getBBox(elem);
                var center = svgedit.math.transformPoint(box.x + box.width / 2, box.y + box.height / 2, svgedit.math.transformListToTransform(tlist).matrix);
                var cx = center.x,
                  cy = center.y;
                var newrot = svgroot.createSVGTransform();
                newrot.setRotate(angle, cx, cy);
                tlist.insertItemBefore(newrot, n);
                break;
              }
            }
          }
        } // if oldValue != newValue
      } // for each elem
    };

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
    var changeSelectedAttribute = this.changeSelectedAttribute = function (attr, val, elems) {
      elems = elems || selectedElements;
      canvas.undoMgr.beginUndoableChange(attr, elems);
      var i = elems.length;

      changeSelectedAttributeNoUndo(attr, val, elems);

      var batchCmd = canvas.undoMgr.finishUndoableChange();
      if (!batchCmd.isEmpty()) {
        addCommandToHistory(batchCmd);
      }
    };

    /** Function: deleteSelectedElements
     * Removes all selected elements from the DOM
     * @param {boolean} isSub whether this operation is a subcmd
     */
    this.deleteSelectedElements = function (isSub = false) {
      textActions.toSelectMode();
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      var i;
      var batchCmd = new svgedit.history.BatchCommand('Delete Elements');
      var len = selectedElements.length;
      var selectedCopy = []; //selectedElements is being deleted
      for (i = 0; i < len; ++i) {
        var selected = selectedElements[i];
        if (selected == null) {
          break;
        }

        var parent = selected.parentNode;
        var t = selected;

        // this will unselect the element and remove the selectedOutline
        selectorManager.releaseSelector(t);

        // Remove the path if present.
        svgedit.path.removePath_(t.id);

        // Get the parent if it's a single-child anchor
        if (parent.tagName === 'a' && parent.childNodes.length === 1) {
          t = parent;
          parent = parent.parentNode;
        }

        var nextSibling = t.nextSibling;
        if (parent == null) {
          console.log("The element has no parent", elem);
        } else {
          var elem = parent.removeChild(t);
          selectedCopy.push(selected); //for the copy
          selectedElements[i] = null;
          batchCmd.addSubCommand(new RemoveElementCommand(elem, nextSibling, parent));
        }
        if (selected.tagName === 'use') {
          const ref_id = this.getHref(selected);
          //const ref = $(this.getHref(selected)).toArray()[0];
          console.log(ref_id);
          let use_elems = svgcontent.getElementsByTagName('use');
          let shouldDeleteRef = true;
          for (let j = 0; j < use_elems.length; j++) {
            if (ref_id === this.getHref(use_elems[j])) {
              shouldDeleteRef = false;
              break;
            }
          }
          if (shouldDeleteRef) {
            const ref = $(this.getHref(selected)).toArray()[0];
            parent = ref.parentNode;
            nextSibling = ref.nextSibling;
            let elem = parent.removeChild(ref);
            selectedCopy.push(ref); //for the copy
            batchCmd.addSubCommand(new RemoveElementCommand(elem, nextSibling, parent));
          }
        }
      }
      if (!batchCmd.isEmpty() && !isSub) {
        addCommandToHistory(batchCmd);
      }
      call('changed', selectedCopy);
      clearSelection();

      return batchCmd;
    };

    // Function: cutSelectedElements
    // Removes all selected elements from the DOM and adds the change to the
    // history stack. Remembers removed elements on the clipboard

    // TODO: Combine similar code with deleteSelectedElements
    this.cutSelectedElements = async function () {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      var i;
      var batchCmd = new svgedit.history.BatchCommand('Cut Elements');
      var len = selectedElements.length;
      var selectedCopy = []; //selectedElements is being deleted
      var layerDict = {}, layerCount = 0;
      let clipBoardText = 'BS Cut: ';

      for (i = 0; i < len && selectedElements[i]; ++i) {
        var selected = selectedElements[i],
          selectedRef = selectedElements[i];

        var layerName = $(selected.parentNode).find('title').text();
        selected.setAttribute("data-origin-layer", layerName);
        clipBoardText += $(selected).attr('id') + ', ';
        if (!layerDict[layerName]) {
          layerDict[layerName] = true;
          layerCount++;
        }

        // this will unselect the element and remove the selectedOutline
        selectorManager.releaseSelector(selectedRef);

        // Remove the path if present.
        svgedit.path.removePath_(selectedRef.id);

        var nextSibling = selectedRef.nextSibling;
        var parent = selectedRef.parentNode;
        var elem = parent.removeChild(selectedRef);
        selectedCopy.push(selected); //for the copy
        selectedElements[i] = null;
        batchCmd.addSubCommand(new RemoveElementCommand(elem, nextSibling, parent));
      }

      // If there is only one layer selected, don't force user to paste on the same layer
      if (layerCount == 1) {
        for (i = 0; i < selectedCopy.length; i++) {
          selectedCopy[i].removeAttribute("data-origin-layer");
        }
      }
      try {
        await navigator.clipboard.writeText(clipBoardText);
        console.log('Write to clipboard was successful!', clipBoardText);
      } catch (err) {
        console.error('Async: Could not copy text: ', err);
      }

      if (!batchCmd.isEmpty()) {
        addCommandToHistory(batchCmd);
      }
      call('changed', selectedCopy);
      clearSelection();

      canvas.clipBoard = selectedCopy;
    };

    // Function: copySelectedElements
    // Remembers the current selected elements on the clipboard
    this.copySelectedElements = async function () {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      var layerDict = {}, layerCount = 0;
      let clipBoardText = 'BS Copy: ';

      for (var i = 0; i < selectedElements.length && selectedElements[i]; ++i) {
        var selected = selectedElements[i],
          layerName = $(selected.parentNode).find('title').text();
        selected.setAttribute("data-origin-layer", layerName);
        clipBoardText += $(selected).attr('id') + ', ';
        if (!layerDict[layerName]) {
          layerDict[layerName] = true;
          layerCount++;
        }
      }

      // If there is only one layer selected, don't force user to paste on the same layer
      if (layerCount == 1) {
        for (i = 0; i < selectedElements.length; i++) {
          if (selectedElements[i]) {
            selectedElements[i].removeAttribute("data-origin-layer");
          }
        }
      }
      try {
        await navigator.clipboard.writeText(clipBoardText);
        console.log('Write to clipboard was successful!', clipBoardText);
      } catch (err) {
        console.error('Async: Could not copy text: ', err);
      }
      canvas.clipBoard = $.merge([], selectedElements);
      this.tempGroupSelectedElements();
    };

    this.pasteElements = async function (type, x, y) {
      var cb = canvas.clipBoard;
      var len = cb.length;
      if (!len) {
        return;
      }

      var pasted = [];
      var batchCmd = new svgedit.history.BatchCommand('Paste elements');
      var drawing = getCurrentDrawing();

      // Move elements to lastClickPoint
      while (len--) {
        var elem = cb[len];
        if (!elem) {
          continue;
        }
        var copy = drawing.copyElem(elem);

        // See if elem with elem ID is in the DOM already
        if (!svgedit.utilities.getElem(elem.id)) {
          copy.id = elem.id;
        }

        pasted.push(copy);
        if (copy.getAttribute("data-origin-layer") && cb.length > 1) {
          var layer = drawing.getLayerByName(copy.getAttribute("data-origin-layer")) || (current_group || drawing.getCurrentLayer());
          layer.appendChild(copy);
        } else {
          (current_group || drawing.getCurrentLayer()).appendChild(copy);
        }
        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(copy));
        restoreRefElems(copy);
        this.updateElementColor(copy);
      }

      selectOnly(pasted, true);

      if (type !== 'in_place') {

        var ctr_x, ctr_y;

        if (!type) {
          ctr_x = lastClickPoint.x;
          ctr_y = lastClickPoint.y;
        } else if (type === 'point') {
          ctr_x = x;
          ctr_y = y;
        }

        var bbox = getStrokedBBox(pasted);
        var cx = ctr_x - (bbox.x + bbox.width / 2),
          cy = ctr_y - (bbox.y + bbox.height / 2),
          dx = [],
          dy = [];

        $.each(pasted, function (i, item) {
          dx.push(cx);
          dy.push(cy);
        });

        var cmd = canvas.moveSelectedElements(dx, dy, false);
        batchCmd.addSubCommand(cmd);
      }

      addCommandToHistory(batchCmd);
      call('changed', pasted);
      this.tempGroupSelectedElements();
    };

    // Function: set
    this.setHasUnsavedChange = (hasUnsaveChanged, shouldClearEstTime = true) => {
      canvas.changed = hasUnsaveChanged;
      TopBarController.setHasUnsavedChange(hasUnsaveChanged);
      if (shouldClearEstTime) {
        TimeEstimationButtonController.clearEstimatedTime();
      }
      autoSaveHelper.toggleAutoSave(hasUnsaveChanged);
    }

    this.getHasUnsaveChanged = () => {
      return canvas.changed;
    }

    // Function: getLatestImportFileName
    // Get latest imported file name
    this.setLatestImportFileName = (fileName) => {
      this.latestImportFileName = fileName;
      this.currentFileName = fileName;
      TopBarController.setFileName(fileName);
      if (process.platform === 'win32') {
        window.titlebar.updateTitle(fileName);
      } else {
        $('#svgcanvas').trigger('mouseup'); //update file title
      }
    }

    // Function: getLatestImportFileName
    // Get latest imported file name
    this.getLatestImportFileName = function () {
      return this.latestImportFileName;
    }

    this.loadRecentFile = async (filePath) => {
      const fs = requireNode('fs');
      if (fs.existsSync(filePath)) {
        let fileName;
        if (process.platform === 'win32') {
          fileName = filePath.split('\\');
        } else {
          fileName = filePath.split('/');
        }
        Alert.popUp({
          id: 'load-recent',
          message: LANG.popup.loading_image,
        });
        fileName = fileName[fileName.length - 1];
        fileName = fileName.slice(0, fileName.lastIndexOf('.')).replace(':', "/");
        this.setLatestImportFileName(fileName);
        this.currentFilePath = filePath;
        this.updateRecentFiles(filePath);
        try {
          svgCanvas.clearSelection();
          if (filePath.endsWith('beam')) {
            await BeamFileHelper.readBeam(filePath);
          } else if (filePath.endsWith('bvg')) {
            let res = await fetch(filePath);
            res = await res.blob();
            svgEditor.importBvg(res);
          }
          this.setHasUnsavedChange(false);
        } finally {
          Alert.popById('load-recent');
        }
      } else {
        Alert.popUp({
          id: 'load-recent',
          type: AlertConstants.SHOW_POP_ERROR,
          message: i18n.lang.topmenu.file.path_not_exit,
        });
        const recent_files = Config().read('recent_files').filter((path) => path !== filePath);
        Config().write('recent_files', recent_files);
        this.updateRecentMenu();
      }
    }

    this.cleanRecentFiles = () => {
      storage.set('recent_files', []);
      this.updateRecentMenu();
    }

    this.updateRecentMenu = () => {
      const recentFiles = storage.get('recent_files') || [];
      let recentMenu = Menu.getApplicationMenu().items.filter(i => i.id === '_file')[0].submenu.items.filter(i => i.id === 'RECENT')[0].submenu;
      recentMenu.items = [];
      recentMenu.clear();
      recentFiles.forEach(filePath => {
        let label = filePath
        if (process.platform !== 'win32') {
          label = filePath.replace(':', '/');
        }
        recentMenu.append(new MenuItem({
          'id': label, label: label, click: async () => {
            const res = await FileExportHelper.toggleUnsavedChangedDialog();
            if (res) this.loadRecentFile(filePath);
          }
        }));
      });
      recentMenu.append(new MenuItem({ type: 'separator' }));
      recentMenu.append(new MenuItem({ 'id': 'CLEAR_RECENT', label: i18n.lang.topmenu.file.clear_recent, click: () => { this.cleanRecentFiles() } }));
      Menu.setApplicationMenu(Menu.getApplicationMenu());
      if (process.platform === 'win32') {
        window.titlebar.updateMenu(Menu.getApplicationMenu());
      }
    }

    this.updateRecentFiles = (filePath) => {
      let recentFiles = storage.get('recent_files') || [];
      const i = recentFiles.indexOf(filePath);
      if (i > 0) {
        recentFiles.splice(i, 1);
        recentFiles.unshift(filePath);
      } else if (i < 0) {
        let l = recentFiles.unshift(filePath);
        if (l > 10) {
          recentFiles.pop();
        }
      }
      storage.set('recent_files', recentFiles);
      this.updateRecentMenu();
    }

    this.updateRecentMenu();

    /**
     * Create grid array of selected element
     * @param {{dx: number, dy: number}} interval
     * @param {{row: number, column: number}} arraySize
     */
    this.gridArraySelectedElement = (interval, arraySize) => {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }

      const originElements = selectedElements;
      if (originElements.length == 0) {
        return;
      }
      const newElements = [];
      const dx = [];
      const dy = [];
      const batchCmd = new svgedit.history.BatchCommand('Grid elements');
      const drawing = getCurrentDrawing();
      for (let i = 0; i < originElements.length; ++i) {
        const elem = originElements[i];
        if (!elem) {
          break;
        }
        for (let j = 0; j < arraySize.column; ++j) {
          for (let k = 0; k < arraySize.row; ++k) {
            if (j == 0 && k == 0) continue;
            const copy = drawing.copyElem(elem);
            if (!svgedit.utilities.getElem(elem.id)) {
              copy.id = elem.id;
            }
            const layerName = $(elem.parentNode).find('title').text();
            const layer = drawing.getLayerByName(layerName);
            layer.appendChild(copy);
            batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(copy));
            restoreRefElems(copy);
            dx.push(j * interval.dx);
            dy.push(k * interval.dy);
            newElements.push(copy);
          }
        }
      }
      const cmd = canvas.moveElements(dx, dy, newElements, false);
      if (cmd) {
        batchCmd.addSubCommand(cmd);
      }
      this.tempGroupSelectedElements();
      canvas.undoMgr.undoStackPointer -= 1;
      canvas.undoMgr.undoStack.pop();
      addCommandToHistory(batchCmd);
      if (newElements.length > 0) {
        call('changed', newElements);
      }
    };

    /**
     * Boolean Operate elements
     * @param {string} mode one of ['intersect', 'union', 'diff', 'xor']
     * @param {boolean} isSubCmd whether this operation is subcmd
     */
    this.booleanOperationSelectedElements = function (mode, isSubCmd = false) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      let len = selectedElements.length;
      for (let i = 0; i < selectedElements.length; ++i) {
        if (!selectedElements[i]) {
          len = i;
          break;
        }
      }
      if (len < 2) {
        Alert.popUp({
          id: 'Boolean Operate',
          type: AlertConstants.SHOW_POP_ERROR,
          message: LANG.popup.select_at_least_two,
        });
        return;
      }
      if (len > 2 && mode === 'diff') {
        Alert.popUp({
          id: 'Boolean Operate',
          type: AlertConstants.SHOW_POP_ERROR,
          message: LANG.popup.more_than_two_object,
        });
        return;
      }
      let batchCmd = new svgedit.history.BatchCommand(`${mode} Elements`);
      // clipper needs integer input so scale up path with a big const.
      const scale = 100;
      let solution_paths = [];
      const modemap = { 'intersect': 0, 'union': 1, 'diff': 2, 'xor': 3 };
      const clipType = modemap[mode];
      const subject_fillType = 1;
      const clip_fillType = 1;
      let succeeded = true;
      for (let i = len - 1; i >= 0; --i) {
        let clipper = new ClipperLib.Clipper();
        const elem = selectedElements[i];
        if (!['rect', 'path', 'polygon', 'ellipse', 'line'].includes(elem.tagName)) {
          tagNameMap = {
            'g': LANG.tag.g,
            'use': LANG.tag.use,
            'image': LANG.tag.image,
            'text': LANG.tag.text
          };
          Alert.popUp({
            id: 'Boolean Operate',
            type: AlertConstants.SHOW_POP_ERROR,
            message: `${LANG.popup.not_support_object_type}: ${tagNameMap[elem.tagName]}`,
          });
          return;
        }
        const dpath = svgedit.utilities.getPathDFromElement(elem);
        const bbox = svgedit.utilities.getBBox(elem);
        let rotation = {
          angle: svgedit.utilities.getRotationAngle(elem),
          cx: bbox.x + bbox.width / 2,
          cy: bbox.y + bbox.height / 2
        };
        const paths = ClipperLib.dPathtoPointPathsAndScale(dpath, rotation, scale);
        if (i === len - 1) {
          solution_paths = paths;
        } else {
          clipper.AddPaths(solution_paths, ClipperLib.PolyType.ptSubject, true);
          clipper.AddPaths(paths, ClipperLib.PolyType.ptClip, true);
          succeeded = clipper.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
        }
        if (!succeeded) {
          break;
        }
      }

      if (!succeeded) {
        console.log('Clipper not succeeded');
        return;
      }
      let d = '';
      for (let i = 0; i < solution_paths.length; ++i) {
        d += 'M';
        if (BeamboxPreference.read('simplify_clipper_path')) {
          const points = solution_paths[i].map(p => {
            return { x: Math.floor(100 * (p.X / scale)) / 100, y: Math.floor(100 * (p.Y / scale)) / 100 };
          });
          const segs = BezierFitCurve.fitPath(points);
          for (let j = 0; j < segs.length; j++) {
            const seg = segs[j];
            if (j === 0) {
              d += `${seg.points[0].x},${seg.points[0].y}`;
            }
            const pointsString = seg.points.slice(1).map((p) => `${p.x},${p.y}`).join(' ');
            d += `${seg.type}${pointsString}`;
          }
        } else {
          d += solution_paths[i].map(x => `${x.X / scale},${x.Y / scale}`).join(' L');
        }
        d += ' Z';
      }
      const base = selectedElements[len - 1];
      const fill = base.getAttribute('fill');
      const fill_opacity = base.getAttribute('fill-opacity');
      const element = addSvgElementFromJson({
        element: 'path',
        curStyles: false,
        attr: {
          id: getNextId(),
          d: d,
          stroke: '#000',
          fill: fill,
          'fill-opacity': fill_opacity,
          opacity: cur_shape.opacity
        }
      });
      pathActions.fixEnd(element);
      if (this.isUsingLayerColor) {
        this.updateElementColor(element);
      }

      batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(element));
      let cmd = this.deleteSelectedElements(true);
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      if (!isSubCmd) addCommandToHistory(batchCmd);
      this.selectOnly([element], true);
      return batchCmd;
    }

    /** Function: offsetElements
     * Create offset of elements
     * @param {number} dir direction 0: inward 1: outward;
     * @param {number} dist offset distance;
     * @param {string} cornerType 'round' or 'sharp';
     * @param {SVGElement} elem target, selected if not passed;
     */
    this.offsetElements = async (dir, dist, cornerType, elems) => {
      Progress.openNonstopProgress({
        id: 'offset-path',
        message: LANG.popup.progress.calculating,
      });
      await new Promise((resolve) => {
        setTimeout(() => resolve(), 100);
      });
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      elems = elems || selectedElements;
      let batchCmd = new svgedit.history.BatchCommand('Create Offset Elements');
      let solution_paths = [];
      const scale = 100;

      if (dir === 0) {
        dist *= -1
      };
      let isContainNotSupportTag = false;
      let co = new ClipperLib.ClipperOffset(2, 0.25);
      elems.forEach(elem => {
        if (!elem) {
          return;
        }
        if (['g', 'use', 'image', 'text'].indexOf(elem.tagName) >= 0) {
          isContainNotSupportTag = true;
          console.log(elem.tagName);
          return;
        }
        const dpath = svgedit.utilities.getPathDFromElement(elem);
        const bbox = svgedit.utilities.getBBox(elem);
        let rotation = {
          angle: svgedit.utilities.getRotationAngle(elem),
          cx: bbox.x + bbox.width / 2,
          cy: bbox.y + bbox.height / 2
        };

        const paths = ClipperLib.dPathtoPointPathsAndScale(dpath, rotation, scale);
        let closed = true;
        for (let j = 0; j < paths.length; ++j) {
          if (!(paths[j][0].X === paths[j][paths[j].length - 1].X && paths[j][0].Y === paths[j][paths[j].length - 1].Y)) {
            closed = false;
            break;
          }
        }
        if (cornerType === 'round') {
          co.AddPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound);
        } else if (cornerType === 'sharp') {
          if (closed) {
            co.AddPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedLine);
          } else {
            co.AddPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etOpenSquare);
          }
        }
      });
      co.Execute(solution_paths, Math.abs(dist * scale));
      if (dir === 1) {
        if (solution_paths.length > 0) {
          let clipper = new ClipperLib.Clipper();
          let res = [solution_paths[0]];
          let succeeded = true;
          for (let i = 1; i < solution_paths.length; i++) {
            clipper.AddPaths(res, ClipperLib.PolyType.ptSubject, true);
            clipper.AddPaths([solution_paths[i]], ClipperLib.PolyType.ptClip, true);
            succeeded = clipper.Execute(1, res, 1, 1);
          }
          solution_paths = res;
        }
      } else {
        solution_paths = solution_paths.slice(1);
      }
      Progress.popById('offset-path');
      if (solution_paths.length === 0 || !solution_paths[0]) {
        if (isContainNotSupportTag) {
          Alert.popUp({
            id: 'Offset',
            type: AlertConstants.SHOW_POPUP_WARNING,
            message: LANG.tool_panels._offset.not_support_message,
          });
        } else {
          Alert.popUp({
            id: 'Offset',
            type: AlertConstants.SHOW_POPUP_WARNING,
            message: LANG.tool_panels._offset.fail_message,
          });
        }
        console.log('clipper.co failed');
        return;
      }
      if (isContainNotSupportTag) {
        Alert.popUp({
          id: 'Offset',
          type: AlertConstants.SHOW_POP_WARNING,
          message: LANG.tool_panels._offset.not_support_message,
        });
      }
      let d = '';
      for (let i = 0; i < solution_paths.length; ++i) {
        if (!BeamboxPreference.read('simplify_clipper_path')) {
          d += 'M';
          d += solution_paths[i].map(x => `${x.X / scale},${x.Y / scale}`).join(' L');
          d += ' Z';
        } else {
          d += 'M';
          const points = solution_paths[i].map(p => {
            return { x: Math.floor(100 * (p.X / scale)) / 100, y: Math.floor(100 * (p.Y / scale)) / 100 };
          });
          const segs = BezierFitCurve.fitPath(points);
          for (let j = 0; j < segs.length; j++) {
            const seg = segs[j];
            if (j === 0) {
              d += `${seg.points[0].x},${seg.points[0].y}`;
            }
            const pointsString = seg.points.slice(1).map((p) => `${p.x},${p.y}`).join(' ');
            d += `${seg.type}${pointsString}`;
          }
          d += 'Z';
        }
      }
      const newElem = addSvgElementFromJson({
        element: 'path',
        curStyles: false,
        attr: {
          id: getNextId(),
          d: d,
          stroke: '#000',
          fill: 'none',
          'fill-opacity': 0,
        }
      });
      pathActions.fixEnd(newElem);
      batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(newElem));
      if (this.isUsingLayerColor) {
        this.updateElementColor(newElem);
      }

      selectOnly([newElem], true);
      addCommandToHistory(batchCmd);
    };

    this.decomposePath = (elems) => {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      let allNewPaths = [];
      let batchCmd = new svgedit.history.BatchCommand('Decompose Image');
      elems = elems || selectedElements;
      elems.forEach(elem => {
        if (!elem || elem.tagName != 'path') {
          return;
        }
        let newPaths = [];
        const angle = svgedit.utilities.getRotationAngle(elem);
        this.setRotationAngle(0, true, elem);
        const layer = LayerHelper.getObjectLayer(elem).elem;
        const attrs = {
          'stroke': $(elem).attr('stroke') || '#333333',
          'fill': $(elem).attr('fill') || 'none',
          'transform': $(elem).attr('transform') || '',
          'stroke-opacity': $(elem).attr('stroke-opacity') || '1',
          'fill-opacity': $(elem).attr('fill-opacity') || '0',
        }
        const dAbs = svgedit.utilities.convertPath(elem);
        // Make sure all pathseg is abs
        const segList = elem.pathSegList._parsePath(dAbs);

        let startIndex = 0;
        for (let i = 0; i < segList.length + 1; i++) {
          if (i === segList.length || segList[i].pathSegType === 2) {
            if (i > startIndex + 1) {
              const d = SVGPathSegList._pathSegArrayAsString(segList.slice(startIndex, i));
              const id = getNextId();
              const path = addSvgElementFromJson({
                'element': 'path',
                'attr': {
                  ...attrs,
                  'id': id,
                  'd': d,
                  'vector-effect': 'non-scaling-stroke'
                }
              });
              layer.appendChild(path);
              newPaths.push(path);
              batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(path));
            }
            startIndex = i;
          }
        }
        const parent = elem.parentNode;
        const nextSibling = elem.nextSibling;
        parent.removeChild(elem);
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, nextSibling, parent));

        if (newPaths.length > 0) {
          selectOnly(newPaths, false);
          let g = this.tempGroupSelectedElements();
          this.setRotationAngle(angle, true, g);
          allNewPaths.push(...newPaths);
        }
      });
      if (!batchCmd.isEmpty()) {
        addCommandToHistory(batchCmd);
      }
      if (allNewPaths.length > 0) {
        selectOnly(allNewPaths, false);
        let g = this.tempGroupSelectedElements();
      }
    };

    /**
     * tracing an image element, convert it to svg object
     * using ImageTracer https://github.com/jankovicsandras/imagetracerjs
     * @param {SVGImageElement} img img to trace
    */
    this.imageToSVG = async function (img) {
      if (img == null) {
        img = selectedElements[0];
      }
      if (!img.tagName || img.tagName !== 'image') {
        return;
      }
      const isShading = img.getAttribute('data-shading') === 'true';
      const threshold = parseInt(img.getAttribute('data-threshold'));
      if (isShading) {
        Alert.popUp({
          message: LANG.popup.vectorize_shading_image,
        });
        return;
      }
      let batchCmd = new svgedit.history.BatchCommand('Vectorize Image');
      Progress.openNonstopProgress({
        id: 'vectorize-image',
        message: LANG.photo_edit_panel.processing,
      });
      const imgBBox = img.getBBox();
      const angle = svgedit.utilities.getRotationAngle(img);
      const imgUrl = await new Promise((resolve) => {
        ImageData(
          $(img).attr("origImage"),
          {
            height: $(img).height(),
            width: $(img).width(),
            grayscale: {
              is_rgba: true,
              is_shading: false,
              threshold: isShading ? 128 : threshold,
              is_svg: false
            },
            onComplete: function (result) {
              resolve(result.pngBase64);
            }
          }
        );
      });
      let svgStr = await new Promise((resolve) => {
        ImageTracer.imageToSVG(imgUrl, svgstr => {
          resolve(svgstr);
        });
      });
      svgStr = svgStr.replace(/<\/?svg[^>]*>/g, '');
      const gId = getNextId();
      const g = addSvgElementFromJson({
        'element': 'g',
        'attr': {
          'id': gId
        }
      });
      ImageTracer.appendSVGString(svgStr, gId);

      const path = addSvgElementFromJson({
        'element': 'path',
        'attr': {
          'id': getNextId(),
          'fill': '#000000',
          'stroke-width': 1,
          'vector-effect': 'non-scaling-stroke',
        }
      });
      path.addEventListener('mouseover', this.handleGenerateSensorArea);
      path.addEventListener('mouseleave', this.handleGenerateSensorArea);
      batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(path));
      let cmd = this.deleteSelectedElements(true);
      if (cmd && !cmd.isEmpty()) batchCmd.addSubCommand(cmd);
      this.selectOnly([g], false);
      let gBBox = g.getBBox();
      if (imgBBox.width !== gBBox.width) {
        this.setSvgElemSize('width', imgBBox.width);
      }
      if (imgBBox.height !== gBBox.height) {
        this.setSvgElemSize('height', imgBBox.height);
      }
      gBBox = g.getBBox();
      dx = (imgBBox.x + 0.5 * imgBBox.width) - (gBBox.x + 0.5 * gBBox.width);
      dy = (imgBBox.y + 0.5 * imgBBox.height) - (gBBox.y + 0.5 * gBBox.height);
      let d = '';
      for (let i = 0; i < g.childNodes.length; i++) {
        let child = g.childNodes[i];
        if (child.getAttribute('opacity') !== '0') {
          d += child.getAttribute('d');
        }
        child.remove();
        i--;
      }
      g.remove();
      path.setAttribute('d', d);
      this.moveElements([dx], [dy], [path], false);
      this.setRotationAngle(angle, true, path);
      if (this.isUsingLayerColor) {
        this.updateElementColor(path);
      }
      this.selectOnly([path], true);
      addCommandToHistory(batchCmd);
      Progress.popById('vectorize-image');
    };

    this.disassembleUse2Group = async function (elems = null) {
      if (!elems) {
        elems = selectedElements;
      }
      const confirm = await new Promise((resolve) => {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_WARNING,
          message: LANG.popup.ungroup_use,
          buttonType: AlertConstants.YES_NO,
          onYes: () => {
            resolve(true);
          },
          onNo: () => {
            resolve(false);
          }
        });
      });
      if (!confirm) {
        return;
      }
      //Wait for alert close
      await new Promise((resolve) => setTimeout(resolve, 20));
      let batchCmd = new svgedit.history.BatchCommand('Disassemble Use');
      for (let i = 0; i < elems.length; ++i) {
        elem = elems[i];
        if (!elem || elem.tagName !== 'use') {
          continue;
        }

        const isFromNP = elem.getAttribute('data-np') === '1';
        const cmd = SymbolMaker.switchImageSymbol(elem, false);
        if (cmd && !cmd.isEmpty()) {
          batchCmd.addSubCommand(cmd);
        }

        const { elem: layer, title: layerTitle } = LayerHelper.getObjectLayer(elem);
        svgCanvas.setCurrentLayer(layerTitle);
        LayerPanelController.updateLayerPanel();
        const color = this.isUsingLayerColor ? $(layer).data('color') : '#333';
        const drawing = getCurrentDrawing();

        const wireframe = $(elem).data('wireframe');
        let transform = $(elem).attr('transform') || '';
        const translate = `translate(${$(elem).attr('x') || 0},${$(elem).attr('y') || 0})`
        transform = `${transform} ${translate}`;
        const href = this.getHref(elem);
        const svg = $(href).toArray()[0];
        let children = [...Array.from(svg.childNodes).reverse()];
        let g = addSvgElementFromJson({
          'element': 'g',
          'attr': {
            'id': getNextId(),
            'transform': transform,
          }
        });
        while (children.length > 0) {
          let topChild = children.pop();
          let copy = drawing.copyElem(topChild);
          if (topChild.tagName !== 'defs') {
            g.appendChild(copy);
          }
        }
        // apply style
        const descendants = Array.from(g.querySelectorAll('*'));
        const nodeNumbers = descendants.length;
        Progress.openSteppingProgress({
          id: 'disassemble-use',
          message: `${LANG.right_panel.object_panel.actions_panel.disassembling} - 0%`,
        })
        //Wait for progress open
        await new Promise((resolve) => { setTimeout(resolve, 50) });
        let currentProgress = 0;
        for (let j = 0; j < descendants.length; j++) {
          const child = descendants[j];
          if (child.tagName !== 'g' && wireframe) {
            child.setAttribute('stroke', color);
            child.setAttribute('fill', '#FFF');
            child.setAttribute('fill-opacity', 0);
          }
          if (isFromNP) child.setAttribute('data-np', 1);
          child.setAttribute('id', getNextId());
          child.setAttribute('vector-effect', 'non-scaling-stroke');
          child.removeAttribute('stroke-width');

          child.addEventListener('mouseover', this.handleGenerateSensorArea);
          child.addEventListener('mouseleave', this.handleGenerateSensorArea);
          svgedit.recalculate.recalculateDimensions(child);
          const progress = Math.round(200 * j / nodeNumbers) / 2;
          if (progress > currentProgress) {
            Progress.update('disassemble-use', {
              message: `${LANG.right_panel.object_panel.actions_panel.disassembling} - ${Math.round(9000 * j / nodeNumbers) / 100}%`,
              percentage: progress * 0.9,
            });
            //Wait for progress update
            await new Promise((resolve) => { setTimeout(resolve, 50) });
            currentProgress = progress;
          }
        }
        Progress.update('disassemble-use', {
          message: `${LANG.right_panel.object_panel.actions_panel.ungrouping} - 90%`,
          percentage: 90,
        });
        await new Promise((resolve) => { setTimeout(resolve, 50) });
        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(g));
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, elem.nextSibling, elem.parentNode));
        elem.parentNode.removeChild(elem);
        let angle = svgedit.utilities.getRotationAngle(g);
        if (angle) canvas.setRotationAngle(0, true, g);
        svgedit.recalculate.recalculateDimensions(g);
        if (angle) canvas.setRotationAngle(angle, true, g);
        selectOnly([g], true);
        // This is a hack, because when import, we pack svg in 2~3 <g>, so we have to ungroup it when disassemble
        for (let j = 0; j < 3; j++) {
          const res = this.ungroupSelectedElement(true);
          const cmd = res ? res.batchCmd : null;
          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }
        }
        Progress.update('disassemble-use', {
          message: `${LANG.right_panel.object_panel.actions_panel.ungrouping} - 100%`,
          percentage: 100,
        });
        Progress.popById('disassemble-use');
        if (!tempGroup) {
          this.tempGroupSelectedElements();
        }
        svgCanvas.setHasUnsavedChange(true);
      }
      if (batchCmd && !batchCmd.isEmpty()) {
        addCommandToHistory(batchCmd);
      }
    }

    this.toggleBezierPathAlignToEdge = () => {
      isBezierPathAlignToEdge = !(this.isBezierPathAlignToEdge || false);
      this.isBezierPathAlignToEdge = isBezierPathAlignToEdge;
      Menu.getApplicationMenu().items.filter(i => i.id === '_edit')[0].submenu.items.filter(i => i.id === 'ALIGN_TO_EDGES')[0].checked = this.isBezierPathAlignToEdge;
      $('#x_align_line').remove();
      $('#y_align_line').remove();
    }

    this.drawAlignLine = function (x, y, xMatchPoint, yMatchPoint) {
      let xAlignLine = svgedit.utilities.getElem('x_align_line');
      if (xMatchPoint) {
        if (!xAlignLine) {
          xAlignLine = document.createElementNS(NS.SVG, 'path');
          svgedit.utilities.assignAttributes(xAlignLine, {
            id: 'x_align_line',
            stroke: '#FA6161',
            'stroke-width': '0.5',
            fill: 'none',
            'vector-effect': "non-scaling-stroke"
          });
          svgedit.utilities.getElem('svgcontent').appendChild(xAlignLine);
        }
        xAlignLine.setAttribute('d', `M ${xMatchPoint.x} ${xMatchPoint.y} L ${xMatchPoint.x} ${yMatchPoint ? yMatchPoint.y : y / current_zoom}`)
        xAlignLine.setAttribute('display', 'inline');
      } else {
        if (xAlignLine) {
          xAlignLine.setAttribute('display', 'none');
        }
      }
      let yAlignLine = svgedit.utilities.getElem('y_align_line');
      if (yMatchPoint) {
        if (!yAlignLine) {
          yAlignLine = document.createElementNS(NS.SVG, 'path');
          svgedit.utilities.assignAttributes(yAlignLine, {
            id: 'y_align_line',
            stroke: '#FA6161',
            'stroke-width': '0.5',
            fill: 'none',
            'vector-effect': "non-scaling-stroke"
          });
          svgedit.utilities.getElem('svgcontent').appendChild(yAlignLine);
        }
        yAlignLine.setAttribute('d', `M ${yMatchPoint.x} ${yMatchPoint.y} L ${xMatchPoint ? xMatchPoint.x : x / current_zoom} ${yMatchPoint.y}`)
        yAlignLine.setAttribute('display', 'inline');
      } else {
        if (yAlignLine) {
          yAlignLine.setAttribute('display', 'none');
        }
      }
    }

    this.findMatchPoint = function (x, y) {
      const FUZZY_RANGE = 7;
      const bsFindNearest = function (array, val) {
        let l = 0,
          u = array.length - 1;
        if (val <= array[l]) {
          return l;
        } else if (val >= array[u]) {
          return u;
        }
        let m;
        while (u > l) {
          m = parseInt(l + 0.5 * (u - l));
          if (array[m] === val) {
            return m;
          } else if (array[m] > val) {
            u = m - 1;
          } else {
            if (m === array.length - 1) {
              return m;
            } else if (array[m + 1] > val) {
              return array[m + 1] + array[m] > 2 * val ? m : m + 1
            } else {
              l = m + 1;
            }
          }
        }
        if (u === array.length - 1) {
          return u;
        } else {
          return array[u + 1] + array[u] > 2 * val ? u : u + 1
        }
      }
      let nearestX = bsFindNearest(this.pathAlignPointsSortByX.map(p => p.x), x / current_zoom);
      nearestX = this.pathAlignPointsSortByX[nearestX];
      let xMatchPoint = nearestX ? (Math.abs(nearestX.x * current_zoom - x) < FUZZY_RANGE ? nearestX : null) : null;
      let nearestY = bsFindNearest(this.pathAlignPointsSortByY.map(p => p.y), y / current_zoom);
      nearestY = this.pathAlignPointsSortByY[nearestY];
      let yMatchPoint = nearestY ? (Math.abs(nearestY.y * current_zoom - y) < FUZZY_RANGE ? nearestY : null) : null;
      return { xMatchPoint, yMatchPoint };
    }

    this.collectAlignPoints = () => {
      let elems = [];
      const layers = $('#svgcontent > g.layer').toArray();
      layers.forEach(layer => {
        elems.push(...layer.childNodes);
      });
      let points = [];
      while (elems.length > 0) {
        const elem = elems.pop();
        points.push(...this.getElemAlignPoints(elem));
      }
      this.pathAlignPointsSortByX = points.sort(function (a, b) {
        return a.x > b.x ? 1 : -1;
      });
      this.pathAlignPointsSortByY = [...points].sort(function (a, b) {
        return a.y > b.y ? 1 : -1;
      });
    };

    this.addAlignPoint = function (x, y) {
      const newPoint = { x, y };
      let p = 0;
      for (let i = 0; i < this.pathAlignPointsSortByX.length; ++i) {
        if (x <= this.pathAlignPointsSortByX[i].x) {
          break;
        }
        p += 1;
      }
      this.pathAlignPointsSortByX.splice(p, 0, newPoint);
      p = 0;
      for (let i = 0; i < this.pathAlignPointsSortByY.length; ++i) {
        if (y <= this.pathAlignPointsSortByY[i].y) {
          break;
        }
        p += 1;
      }
      this.pathAlignPointsSortByY.splice(p, 0, newPoint);
    };

    this.getElemAlignPoints = function (elem) {
      if (['rect', 'ellipse', 'polygon', 'path', 'image', 'use'].includes(elem.tagName)) {
        let bbox;
        if (elem.tagName === 'use') {
          bbox = this.getSvgRealLocation(elem);
        } else {
          bbox = elem.getBBox();
        }
        const center = { x: bbox.x + 0.5 * bbox.width, y: bbox.y + 0.5 * bbox.height };
        const angle = svgedit.utilities.getRotationAngle(elem, true);
        let points = [];
        switch (elem.tagName) {
          case 'rect':
          case 'image':
          case 'use':
            points = [
              { x: bbox.x, y: bbox.y },
              { x: bbox.x + bbox.width, y: bbox.y },
              { x: bbox.x, y: bbox.y + bbox.height },
              { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
              { x: bbox.x, y: bbox.y + 0.5 * bbox.height },
              { x: bbox.x + bbox.width, y: bbox.y + 0.5 * bbox.height },
              { x: bbox.x + 0.5 * bbox.width, y: bbox.y + bbox.height },
              { x: bbox.x + 0.5 * bbox.width, y: bbox.y + bbox.height },
            ];
            break;
          case 'ellipse':
            points = [];
            let a = 0.5 * bbox.width;
            let b = 0.5 * bbox.height;
            let theta = Math.atan2(-b * Math.tan(angle), a);
            points.push({ x: center.x + a * Math.cos(theta), y: center.y + b * Math.sin(theta) });
            theta = Math.atan2(b * Math.tan(angle), -a);
            points.push({ x: center.x + a * Math.cos(theta), y: center.y + b * Math.sin(theta) });
            theta = Math.atan2(b * Math.cos(angle), a * Math.sin(angle));
            points.push({ x: center.x + a * Math.cos(theta), y: center.y + b * Math.sin(theta) });
            theta = Math.atan2(-b * Math.cos(angle), -a * Math.sin(angle));
            points.push({ x: center.x + a * Math.cos(theta), y: center.y + b * Math.sin(theta) });
            points.push(center);
            break;
          case 'polygon':
            points = elem.getAttribute('points').split(' ');
            points = points.slice(0, points.length - 1);
            points = points.map(i => {
              i = i.split(',');
              return { x: parseFloat(i[0]), y: parseFloat(i[1]) };
            });
            break;
          case 'path':
            points = [];
            elem.pathSegList._list.forEach(seg => {
              if (seg.x) {
                points.push({ x: parseFloat(seg.x), y: parseFloat(seg.y) })
              }
            });
            break;
          default:
            break;
        }

        points.forEach(p => {
          const newX = center.x + (p.x - center.x) * Math.cos(angle) - (p.y - center.y) * Math.sin(angle);
          const newY = center.y + (p.x - center.x) * Math.sin(angle) + (p.y - center.y) * Math.cos(angle);
          p.x = newX;
          p.y = newY;
        });
        return points;
      } else {
        return [];
      }
    };

    /**
     * Wraps all the selected elements in a group (g) element
     * @param {string} type type of element to group into 'a' or 'g', defaults to 'g'
     * @param {string} urlArg url if type if 'a'
     */
     this.groupSelectedElements = function (type, urlArg) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }

      if (selectedElements.length < 1) {
        return;
      }
      if (!type) {
        type = 'g';
      }
      var cmd_str = '';

      switch (type) {
        case 'a':
          cmd_str = 'Make hyperlink';
          var url = '';
          if (urlArg) {
            url = urlArg;
          }
          break;
        default:
          type = 'g';
          cmd_str = 'Group Elements';
          break;
      }

      var batchCmd = new svgedit.history.BatchCommand(cmd_str);

      let layerNames = [];
      for (let i = 0; i < selectedElements.length; i++) {
        const elem = selectedElements[i];
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
        svgCanvas.setCurrentLayer(topLayer);
      }

      // create and insert the group element
      const group = addSvgElementFromJson({
        'element': type,
        'attr': {
          'id': getNextId(),
          'data-ratiofixed': true,
        }
      });
      if (type === 'a') {
        setHref(group, url);
      }
      batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(group));


      for (let i = 0; i < selectedElements.length; i++) {
        const elem = selectedElements[i];
        if (elem.parentNode.tagName === 'a' && elem.parentNode.childNodes.length === 1) {
          elem = elem.parentNode;
        }
        const { nextSibling, parentNode } = elem;
        group.appendChild(elem);
        batchCmd.addSubCommand(new svgedit.history.MoveElementCommand(elem, nextSibling, parentNode));
      }
      if (!batchCmd.isEmpty()) {
        addCommandToHistory(batchCmd);
      }

      if (canvas.isUsingLayerColor) {
        canvas.updateElementColor(group);
      }

      // update selection
      selectOnly([group], true);
    };

    // Function: pushGroupProperties
    // Pushes all appropriate parent group properties down to its children, then
    // removes them from the group
    var pushGroupProperties = this.pushGroupProperties = function (g, undoable) {

      var children = g.childNodes;
      var len = children.length;
      var xform = g.getAttribute('transform');

      var glist = svgedit.transformlist.getTransformList(g);
      var m = svgedit.math.transformListToTransform(glist).matrix;

      var batchCmd = new svgedit.history.BatchCommand('Push group properties');

      // TODO: get all fill/stroke properties from the group that we are about to destroy
      // "fill", "fill-opacity", "fill-rule", "stroke", "stroke-dasharray", "stroke-dashoffset",
      // "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity",
      // "stroke-width"
      // and then for each child, if they do not have the attribute (or the value is 'inherit')
      // then set the child's attribute

      var i = 0;
      var gangle = svgedit.utilities.getRotationAngle(g);

      var gattrs = $(g).attr(['filter', 'opacity']);
      var gfilter, gblur, changes;
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
              svgedit.utilities.findDefs().appendChild(gfilter);
            }
          } else {
            gfilter = svgedit.utilities.getRefElem(elem.getAttribute('filter'));
          }

          // Change this in future for different filters
          var suffix = (gfilter.firstChild.tagName === 'feGaussianBlur') ? 'blur' : 'filter';
          gfilter.id = elem.id + '_' + suffix;
          changeSelectedAttribute('filter', 'url(#' + gfilter.id + ')', [elem]);

          // Update blur value
          if (cblur) {
            changeSelectedAttribute('stdDeviation', cblur, [gfilter.firstChild]);
            canvas.setBlurOffsets(gfilter, cblur);
          }
        }

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
          } else { // more complicated than just a rotate

            // transfer the group's transform down to each child and then
            // call svgedit.recalculate.recalculateDimensions()
            var oldxform = elem.getAttribute('transform');
            changes = {};
            changes.transform = oldxform || '';

            var newxform = svgroot.createSVGTransform();

            // [ gm ] [ chm ] = [ chm ] [ gm' ]
            // [ gm' ] = [ chm_inv ] [ gm ] [ chm ]
            var chm = svgedit.math.transformListToTransform(chtlist).matrix,
              chm_inv = chm.inverse();
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


      // remove transform and make it undo-able
      if (xform) {
        changes = {};
        changes.transform = xform;
        g.setAttribute('transform', '');
        g.removeAttribute('transform');
        batchCmd.addSubCommand(new svgedit.history.ChangeElementCommand(g, changes));
      }

      if (undoable && !batchCmd.isEmpty()) {
        return batchCmd;
      }
    };

    // Function: ungroupSelectedElement
    // Unwraps all the elements in a selected group (g) element. This requires
    // significant recalculations to apply group's transforms, etc to its children
    this.ungroupSelectedElement = function (isSubCmd = false) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      var g = selectedElements[0];
      if (!g) {
        return;
      }

      if (g.tagName === 'use') {
        this.disassembleUse2Group([g]);
        return;
      }
      if ($(g).data('gsvg') || $(g).data('symbol')) {
        // Is svg, so actually convert to group
        convertToGroup(g);
        return;
      }
      var parents_a = $(g).parents('a');
      if (parents_a.length) {
        g = parents_a[0];
      }

      // Look for parent "a"
      if (g.tagName === 'g' || g.tagName === 'a') {

        var batchCmd = new svgedit.history.BatchCommand('Ungroup Elements');
        var cmd = pushGroupProperties(g, true);
        if (cmd) {
          batchCmd.addSubCommand(cmd);
        }

        var parent = g.parentNode;
        var anchor = g.nextSibling;
        var children = new Array(g.childNodes.length);

        var i = 0;
        console.log(`Ungrouped ${g.childNodes.length} nodes`);
        while (g.firstChild) {
          var elem = g.firstChild;
          var oldNextSibling = elem.nextSibling;
          var oldParent = elem.parentNode;
          if (elem.getAttribute('data-imageborder') === 'true') {
            elem.remove();
            continue;
          }

          // Remove child title elements
          if (elem.tagName === 'title') {
            var nextSibling = elem.nextSibling;
            batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(elem, nextSibling, oldParent));
            oldParent.removeChild(elem);
            continue;
          }

          const originalLayer = getCurrentDrawing().getLayerByName(elem.getAttribute('data-original-layer'));
          if (originalLayer) {
            originalLayer.appendChild(elem);
            if (this.isUsingLayerColor) {
              this.updateElementColor(elem);
            }
          } else {
            elem = parent.insertBefore(elem, anchor);
          }
          children[i++] = elem;
          batchCmd.addSubCommand(new svgedit.history.MoveElementCommand(elem, oldNextSibling, oldParent));
        }

        // remove the group from the selection
        clearSelection();

        // delete the group element (but make undo-able)
        var gNextSibling = g.nextSibling;
        g = parent.removeChild(g);
        batchCmd.addSubCommand(new svgedit.history.RemoveElementCommand(g, gNextSibling, parent));
        // update selection
        addToSelection(children);
        this.tempGroupSelectedElements();
        if (!batchCmd.isEmpty() && !isSubCmd) {
          addCommandToHistory(batchCmd);
        }

        return { batchCmd, children };
      }
    };

    this.tempGroupSelectedElements = function () {
      if (selectedElements.length <= 1) {
        return;
      }

      const hasAlreadyTempGroup = selectedElements[0].getAttribute('data-tempgroup');
      const type = 'g';
      let g;

      if (hasAlreadyTempGroup) {
        g = selectedElements[0];
      } else {
        // create and insert the group element
        g = addSvgElementFromJson({
          'element': type,
          'attr': {
            'id': getNextId(),
            'data-tempgroup': true,
            'data-ratiofixed': true,
          }
        });

        // Move to direct under svgcontent to avoid group under invisible layer
        const svgcontent = document.getElementById('svgcontent');
        svgcontent.appendChild(g);
      }

      // now move all children into the group
      var len = selectedElements.length;
      for (let i = 0; i < len; i++) {
        if (hasAlreadyTempGroup && i === 0) {
          continue;
        }
        var elem = selectedElements[i];
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
              x: elem.getAttribute('x'),
              y: elem.getAttribute('y'),
              width: elem.getAttribute('width'),
              height: elem.getAttribute('height'),
              transform: elem.getAttribute('transform') || '',
            });
          } else if (elem.tagName === 'use') {
            const realLocation = this.getUseElementLocationBeforeTransform(elem);
            svgedit.utilities.assignAttributes(imageBorder, {
              x: realLocation.x,
              y: realLocation.y,
              width: realLocation.width,
              height: realLocation.height,
              transform: elem.getAttribute('transform') || '',
            });
          }
          svgedit.utilities.assignAttributes(imageBorder, {
            fill: 'none',
            stroke: 'none',
            'vector-effect': 'non-scaling-stroke',
            style: 'pointer-events:none',
            'data-imageborder': true,
          });
          g.appendChild(imageBorder);
        }
      }

      if (hasAlreadyTempGroup) {
        tempGroup = null;
      }

      // update selection
      selectOnly([g], true);
      tempGroup = g;
      console.log('temp group created');
      return g;
    };

    /**
     * remove elemt from temp group
     * @param {Element} elem element to remove
     */
    this.removeFromTempGroup = (elem) => {
      if (!tempGroup || !tempGroup.contains(elem)) {
        return;
      }
      const originalLayer = getCurrentDrawing().getLayerByName(elem.getAttribute('data-original-layer'));
      const currentLayer = getCurrentDrawing().getCurrentLayer();
      const targetLayer = originalLayer || currentLayer;
      let nextSiblingId = elem.getAttribute('data-next-sibling');
      if (nextSiblingId) {
        nextSiblingId = nextSiblingId.replace('#', '\\#');
        const nextSibling = targetLayer.querySelector(`#${nextSiblingId}`);
        if (nextSibling) {
          targetLayer.insertBefore(elem, nextSibling);
        } else {
          targetLayer.appendChild(elem)
        }
        elem.removeAttribute('data-next-sibling')
      } else {
        targetLayer.appendChild(elem);
      }
      if (this.isUsingLayerColor) {
        this.updateElementColor(elem);
      }
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

      let g = (elem || selectedElements[0]) || tempGroup;
      if (!g) {
        return;
      }

      // Look for parent "a"
      if (g.tagName === 'g' || g.tagName === 'a') {

        let batchCmd = new svgedit.history.BatchCommand('Ungroup Temp Group');
        let cmd = pushGroupProperties(g, true);
        if (cmd) {
          batchCmd.addSubCommand(cmd);
        }
        var parent = g.parentNode;
        var children = new Array(g.childNodes.length);

        var i = 0;

        while (g.lastChild) {
          var elem = g.lastChild;
          var oldParent = elem.parentNode;

          if (elem.getAttribute('data-imageborder') === 'true') {
            elem.remove();
            continue;
          }

          // Remove child title elements
          if (elem.tagName === 'title') {
            oldParent.removeChild(elem);
            continue;
          }
          const originalLayer = getCurrentDrawing().getLayerByName(elem.getAttribute('data-original-layer'));
          const currentLayer = getCurrentDrawing().getCurrentLayer();
          const targetLayer = originalLayer || currentLayer;
          let nextSiblingId = elem.getAttribute('data-next-sibling');
          if (nextSiblingId) {
            nextSiblingId = nextSiblingId.replace('#', '\\#');
            const nextSibling = targetLayer.querySelector(`#${nextSiblingId}`);
            if (nextSibling) {
              targetLayer.insertBefore(elem, nextSibling);
            } else {
              targetLayer.appendChild(elem)
            }
            elem.removeAttribute('data-next-sibling')
          } else {
            targetLayer.appendChild(elem);
          }
          if (this.isUsingLayerColor) {
            this.updateElementColor(elem);
          }
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

    this.getTempGroup = () => {
      return tempGroup;
    };

    // Function: moveUpSelectedElement
    // Move selected element up in layer
    this.moveUpSelectedElement = function () {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      let selected = selectedElements[0];
      if (selected != null) {
        let t = selected;
        let oldParent = t.parentNode;
        let oldNextSibling = t.nextSibling;
        let nextSibling = t.nextSibling;
        if (nextSibling) {
          nextSibling = nextSibling.nextSibling;
          t = t.parentNode.insertBefore(t, nextSibling);
          // If the element actually moved position, add the command and fire the changed
          // event handler.
          if (oldNextSibling !== t.nextSibling) {
            addCommandToHistory(new svgedit.history.MoveElementCommand(t, oldNextSibling, oldParent, 'up'));
            call('changed', [t]);
          }
        }
      }
    };

    // Function: moveDownSelectedElement
    // Move selected element back in layer
    this.moveDownSelectedElement = function () {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      let selected = selectedElements[0];
      if (selected != null) {
        let t = selected;
        let oldParent = t.parentNode;
        let oldNextSibling = t.nextSibling;
        let prevSibling = t.previousSibling;
        if (prevSibling && !['title', 'filter'].includes(prevSibling.tagName)) {
          t = t.parentNode.insertBefore(t, prevSibling);
          // If the element actually moved position, add the command and fire the changed
          // event handler.
          if (oldNextSibling !== t.nextSibling) {
            addCommandToHistory(new svgedit.history.MoveElementCommand(t, oldNextSibling, oldParent, 'down'));
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
        let children = this.ungroupTempGroup();
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
        while (['title', 'filter'].includes(firstChild.tagName)) {
          firstChild = firstChild.nextSibling;
        }
        t = t.parentNode.insertBefore(t, firstChild);
      } else {
        t = t.parentNode.appendChild(t);
      }

      if (oldNextSibling != t.nextSibling) {
        addCommandToHistory(new svgedit.history.MoveElementCommand(t, oldNextSibling, oldParent, 'Move ' + dir));
        call('changed', [t]);
      }
    };

    // Function: moveSelectedElements
    // Moves selected elements on the X/Y axis
    //
    // Parameters:
    // dx - Float with the distance to move on the x-axis
    // dy - Float with the distance to move on the y-axis
    // undoable - Boolean indicating whether or not the action should be undoable
    //
    // Returns:
    // Batch command for the move
    this.moveSelectedElements = function (dx, dy, undoable) {
      // if undoable is not sent, default to true
      // if single values, scale them to the zoom
      if (dx.constructor != Array) {
        dx /= current_zoom;
        dy /= current_zoom;
      }
      undoable = undoable || true;
      var batchCmd = new svgedit.history.BatchCommand('position');
      var i = selectedElements.length;
      while (i--) {
        var selected = selectedElements[i];
        if (selected != null) {
          //			if (i==0)
          //				selectedBBoxes[0] = svgedit.utilities.getBBox(selected);

          //			var b = {};
          //			for (var j in selectedBBoxes[i]) b[j] = selectedBBoxes[i][j];
          //			selectedBBoxes[i] = b;

          var xform = svgroot.createSVGTransform();
          var tlist = svgedit.transformlist.getTransformList(selected);
          let x = 0;
          let y = 0;
          // dx and dy could be arrays
          if (dx.constructor == Array) {
            xform.setTranslate(dx[i], dy[i]);
            x = dx[i];
            y = dy[i];
          } else {
            xform.setTranslate(dx, dy);
            x = dx;
            y = dy;
          }

          if (tlist.numberOfItems) {
            tlist.insertItemBefore(xform, 0);
          } else {
            tlist.appendItem(xform);
          }

          var cmd = svgedit.recalculate.recalculateDimensions(selected);
          if (cmd && !cmd.isEmpty() && (x !== 0 || y !== 0)) {
            batchCmd.addSubCommand(cmd);
          }

          selectorManager.requestSelector(selected).resize();
        }
      }
      if (!batchCmd.isEmpty()) {
        if (undoable) {
          addCommandToHistory(batchCmd);
        }
        call('changed', selectedElements);
        return batchCmd;
      }
    };

    /**
     * move given elements
     * @param {number[] | number} dx
     * @param {number[] | number} dy
     * @param {Element[]} elems
     * @param {undoable} boolean whether this operation is undoable, return cmd if false
     */
    this.moveElements = function (dx, dy, elems, undoable) {
      if (dx.constructor != Array) {
        dx /= current_zoom;
        dy /= current_zoom;
      }
      undoable = (undoable == null) ? true : undoable;
      const batchCmd = new svgedit.history.BatchCommand('position');
      var i = elems.length;
      while (i--) {
        var selected = elems[i];
        if (selected != null) {
          var xform = svgroot.createSVGTransform();
          var tlist = svgedit.transformlist.getTransformList(selected);
          // dx and dy could be arrays
          if (dx.constructor == Array) {
            xform.setTranslate(dx[i], dy[i]);
          } else {
            xform.setTranslate(dx, dy);
          }
          if (tlist.numberOfItems) {
            tlist.insertItemBefore(xform, 0);
          } else {
            tlist.appendItem(xform);
          }

          var cmd = svgedit.recalculate.recalculateDimensions(selected);
          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }
          //selectorManager.requestSelector(selected).resize();
        }
      }

      if (!batchCmd.isEmpty()) {
        if (undoable) {
          addCommandToHistory(batchCmd);
        }
        call('changed', elems);
        return batchCmd;
      }
    };

    this.getCenter = function (elem) {
      let centerX, centerY;
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
          let realLocation = this.getSvgRealLocation(elem);
          centerX = realLocation.x + realLocation.width / 2;
          centerY = realLocation.y + realLocation.height / 2;
          break;
      }
      return {
        x: centerX,
        y: centerY
      };
    };

    this.distHori = function (isSubCmd) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }

      const realSelectedElements = selectedElements.filter(e => e);
      const len = realSelectedElements.length;

      if (len < 3) {
        this.tempGroupSelectedElements();
        return;
      }

      const batchCmd = new svgedit.history.BatchCommand('Dist Hori');

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
        let cmd = this.moveElements([minX + dx * i - x], [0], [realSelectedElements[i]], false);
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

    this.distVert = function (isSubCmd) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }

      const realSelectedElements = selectedElements.filter(e => e);
      const len = realSelectedElements.length;

      if (len < 3) {
        this.tempGroupSelectedElements();
        return;
      }

      const batchCmd = new svgedit.history.BatchCommand('Dist Verti');

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
        let cmd = this.moveElements([0], [minY + dy * i - y], [realSelectedElements[i]], false);
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
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      const centerXs = [];
      const centerYs = [];
      let minX = Number.MAX_VALUE,
        minY = Number.MAX_VALUE,
        maxX = Number.MIN_VALUE,
        maxY = Number.MIN_VALUE;
      let indexMinX = -1,
        indexMinY = -1,
        indexMaxX = -1,
        indexMaxY = -1;

      const realSelectedElements = selectedElements.filter(e => e);
      const len = realSelectedElements.length;

      if (len < 3) {
        return;
      }

      for (let i = 0; i < len; i = i + 1) {
        if (realSelectedElements[i] == null) {
          console.error('distributing null');
          break;
        }
        const elem = realSelectedElements[i];

        let center = this.getCenter(elem);
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

      if ((indexMinX === indexMaxX) && (indexMinY === indexMaxY)) {
        return;
      }
      const diffX = maxX - minX;
      const diffY = maxY - minY;

      let start = -1,
        end = -1;

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

      for (let i = start + 1; i < len + start; i = i + 1) {
        if ((i === end) || (i - len) === end) {
          continue;
        }
        if (i < len) {
          this.moveElemPosition((startX + dx * j) - centerXs[i], (startY + dy * j) - centerYs[i], realSelectedElements[i]);
        } else {
          this.moveElemPosition((startX + dx * j) - centerXs[i - len], (startY + dy * j) - centerYs[i - len], realSelectedElements[i - len]);
        }
        j = j + 1;
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
      let batchCmd = new svgedit.history.BatchCommand('Flip Elements');

      for (let i = 0; i < len; ++i) {
        elem = selectedElements[i];
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
        let stack = [{ elem }];
        while (stack.length > 0) {
          ({ elem: topElem, originalAngle } = stack.pop());
          if (topElem.tagName !== 'g') {
            cmd = await this.flipElementWithRespectToCenter(topElem, centers[centers.length - 1], flipPara);
            if (cmd && !cmd.isEmpty()) {
              batchCmd.addSubCommand(cmd);
            }
          } else {
            if (originalAngle == null) {
              let angle = svgedit.utilities.getRotationAngle(topElem);
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
              ({ x, y } = centers[centers.length - 1]);
              for (let i = 0; i < tlist.numberOfItems; i++) {
                const t = tlist.getItem(i);
                //type 4 does not matter
                if (t.type === 4) {
                  continue;
                }
                ({ a, b, c, d, e, f } = t.matrix);
                const delta = a * d - b * c;
                x = (d * x - c * y + c * f - d * e) / delta;
                y = (-b * x + a * y - a * f + b * e) / delta;
              };
              centers.push({ x, y });
              topElem.childNodes.forEach((e) => {
                stack.push({ elem: e });
              });
            } else {
              centers.pop();
              canvas.setRotationAngle(-originalAngle, true, topElem);
            }
          }
        }
        selectorManager.requestSelector(elem).resize();
        selectorManager.requestSelector(elem).showGrips(len === 1);
        svgEditor.updateContextPanel();
      }
      addCommandToHistory(batchCmd);
    }

    this.flipElementWithRespectToCenter = async function (elem, center, flipPara) {
      let batchCmd = new svgedit.history.BatchCommand('Flip Single Element');

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
        let translateOrigin = svgroot.createSVGTransform();
        let scale = svgroot.createSVGTransform();
        let translateBack = svgroot.createSVGTransform();

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
      cmd = this.moveElements([dx], [dy], [elem], false);
      batchCmd.addSubCommand(cmd);
      return batchCmd;
    }

    this._flipImage = async function (image, horizon = 1, vertical = 1) {
      let batchCmd = new svgedit.history.BatchCommand('Flip image');
      if (horizon === 1 && vertical === 1) {
        return;
      }
      let cmd;
      const origImage = $(image).attr('origImage');
      if (origImage) {
        const jimp = requireNode('jimp');
        let data = await fetch(origImage);
        data = await data.blob();
        data = await new Response(data).arrayBuffer();
        data = await jimp.read(data);
        data.flip(horizon === -1, vertical === -1);
        data = await data.getBufferAsync(jimp.MIME_PNG);
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
      flipCanvas.width = $(image).attr('width');
      flipCanvas.height = $(image).attr('height');
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

    // Function: cloneSelectedElements
    // Create deep DOM copies (clones) of all selected elements and move them slightly
    // from their originals
    this.cloneSelectedElements = function (x, y, isSubCmd = false) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }

      var i, elem;
      var batchCmd = new svgedit.history.BatchCommand('Clone Elements');
      // find all the elements selected (stop at first null)
      var len = selectedElements.length;

      function sortfunction(a, b) {
        return ($(b).index() - $(a).index()); //causes an array to be sorted numerically and ascending
      }
      selectedElements.sort(sortfunction);
      for (i = 0; i < len; ++i) {
        elem = selectedElements[i];
        if (elem == null) {
          break;
        }
      }
      // use slice to quickly get the subset of elements we need
      var copiedElements = selectedElements.slice(0, i);
      this.clearSelection(true);
      // note that we loop in the reverse way because of the way elements are added
      // to the selectedElements array (top-first)
      const drawing = getCurrentDrawing();
      const currentLayer = drawing.getCurrentLayer();
      i = copiedElements.length;
      while (i--) {
        const elemLayer = LayerHelper.getObjectLayer(copiedElements[i]);
        const destLayer = elemLayer ? elemLayer.elem : currentLayer;

        // clone each element and replace it within copiedElements
        elem = copiedElements[i] = drawing.copyElem(copiedElements[i]);
        destLayer.appendChild(elem);
        batchCmd.addSubCommand(new svgedit.history.InsertElementCommand(elem));
      }

      if (!batchCmd.isEmpty()) {
        // Need to reverse for correct selection-adding
        addToSelection(copiedElements.reverse());
        this.tempGroupSelectedElements();
        this.moveSelectedElements(x, y, false);
        if (!isSubCmd) {
          addCommandToHistory(batchCmd);
        }
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
    this.alignSelectedElements = function (type, relative_to) {
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      var i, elem;
      var bboxes = [];
      var minx = Number.MAX_VALUE,
        maxx = Number.MIN_VALUE,
        miny = Number.MAX_VALUE,
        maxy = Number.MIN_VALUE;
      var curwidth = Number.MIN_VALUE,
        curheight = Number.MIN_VALUE;
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
        switch (relative_to) {
          case 'smallest':
            if ((type === 'l' || type === 'c' || type === 'r') && (curwidth === Number.MIN_VALUE || curwidth > bboxes[i].width) ||
              (type === 't' || type === 'm' || type === 'b') && (curheight === Number.MIN_VALUE || curheight > bboxes[i].height)) {
              minx = bboxes[i].x;
              miny = bboxes[i].y;
              maxx = bboxes[i].x + bboxes[i].width;
              maxy = bboxes[i].y + bboxes[i].height;
              curwidth = bboxes[i].width;
              curheight = bboxes[i].height;
            }
            break;
          case 'largest':
            if ((type === 'l' || type === 'c' || type === 'r') && (curwidth === Number.MIN_VALUE || curwidth < bboxes[i].width) ||
              (type === 't' || type === 'm' || type === 'b') && (curheight === Number.MIN_VALUE || curheight < bboxes[i].height)) {
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

      if (relative_to === 'page') {
        minx = 0;
        miny = 0;
        maxx = canvas.contentW;
        maxy = canvas.contentH;
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
      this.moveSelectedElements(dx, dy);
    };

    // Group: Additional editor tools

    this.contentW = getResolution().w;
    this.contentH = getResolution().h;

    // Function: updateCanvas
    // Updates the editor canvas width/height/position after a zoom has occurred
    //
    // Parameters:
    // w - Float with the new width
    // h - Float with the new height
    //
    // Returns:
    // Object with the following values:
    // * x - The canvas' new x coordinate
    // * y - The canvas' new y coordinate
    // * old_x - The canvas' old x coordinate
    // * old_y - The canvas' old y coordinate
    // * d_x - The x position difference
    // * d_y - The y position difference
    this.updateCanvas = function (w, h) {
      svgroot.setAttribute('width', w);
      svgroot.setAttribute('height', h);
      var bg = $('#canvasBackground')[0];
      var old_x = svgcontent.getAttribute('x');
      var old_y = svgcontent.getAttribute('y');
      var x = (w / 2 - this.contentW * current_zoom / 2);
      var y = (h / 2 - this.contentH * current_zoom / 2);

      svgedit.utilities.assignAttributes(svgcontent, {
        width: this.contentW * current_zoom,
        height: this.contentH * current_zoom,
        'x': x,
        'y': y,
        'viewBox': '0 0 ' + this.contentW + ' ' + this.contentH
      });

      svgedit.utilities.assignAttributes(bg, {
        width: svgcontent.getAttribute('width'),
        height: svgcontent.getAttribute('height'),
        x: x,
        y: y
      });

      var bg_img = svgedit.utilities.getElem('background_image');
      if (bg_img) {
        svgedit.utilities.assignAttributes(bg_img, {
          'width': '100%',
          'height': '100%'
        });
      }

      selectorManager.selectorParentGroup.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      runExtensions('canvasUpdated', {
        new_x: x,
        new_y: y,
        old_x: old_x,
        old_y: old_y,
        d_x: x - old_x,
        d_y: y - old_y
      });

      clearTimeout(this.renderSymbolTimeout);
      this.renderSymbolTimeout = setTimeout(() => {
        SymbolMaker.reRenderAllImageSymbol();
      }, 1000);

      return {
        x: x,
        y: y,
        old_x: old_x,
        old_y: old_y,
        d_x: x - old_x,
        d_y: y - old_y
      };
    };

    // Function: setBackground
    // Set the background of the editor (NOT the actual document)
    //
    // Parameters:
    // color - String with fill color to apply
    // url - URL or path to image to use
    this.setBackground = function (color, url) {
      var bg = svgedit.utilities.getElem('canvasBackground');
      var border = $(bg).find('rect')[0];
      var bg_img = svgedit.utilities.getElem('background_image');
      border.setAttribute('fill', color);
      if (url) {
        if (!bg_img) {
          bg_img = svgdoc.createElementNS(NS.SVG, 'image');
          svgedit.utilities.assignAttributes(bg_img, {
            'id': 'background_image',
            'width': '100%',
            'height': '100%',
            'preserveAspectRatio': 'xMinYMin',
            'style': 'pointer-events:none; opacity: 1;',
          });
          const rotaryAxis = svgedit.utilities.getElem('rotaryAxis');
          if (rotaryAxis) {
            bg.insertBefore(bg_img, rotaryAxis);
          } else {
            bg.appendChild(bg_img);
          }
        }
        setHref(bg_img, url);
      } else if (bg_img) {
        bg_img.parentNode.removeChild(bg_img);
      }
    };

    // Function: cycleElement
    // Select the next/previous element within the current layer
    //
    // Parameters:
    // next - Boolean where true = next and false = previous element
    this.cycleElement = function (next) {
      var num;
      if (tempGroup) {
        let children = this.ungroupTempGroup();
        this.selectOnly(children, false);
      }
      var cur_elem = selectedElements[0];
      var elem = false;
      var all_elems = getVisibleElements(current_group || getCurrentDrawing().getCurrentLayer());
      if (!all_elems.length) {
        return;
      }
      if (cur_elem == null) {
        num = next ? all_elems.length - 1 : 0;
        elem = all_elems[num];
      } else {
        var i = all_elems.length;
        while (i--) {
          if (all_elems[i] == cur_elem) {
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


    // DEPRECATED: getPrivateMethods
    // Since all methods are/should be public somehow, this function should be removed

    // Being able to access private methods publicly seems wrong somehow,
    // but currently appears to be the best way to allow testing and provide
    // access to them to plugins.
    this.getPrivateMethods = function () {
      var obj = {
        addCommandToHistory: addCommandToHistory,
        setGradient: setGradient,
        addSvgElementFromJson: addSvgElementFromJson,
        assignAttributes: assignAttributes,
        BatchCommand: BatchCommand,
        call: call,
        ChangeElementCommand: ChangeElementCommand,
        copyElem: function (elem) {
          return getCurrentDrawing().copyElem(elem);
        },
        ffClone: ffClone,
        findDefs: findDefs,
        findDuplicateGradient: findDuplicateGradient,
        getElem: getElem,
        getId: getId,
        getIntersectionList: getIntersectionList,
        getMouseTarget: getMouseTarget,
        getNextId: getNextId,
        getPathBBox: getPathBBox,
        getUrlFromAttr: getUrlFromAttr,
        hasMatrixTransform: hasMatrixTransform,
        identifyLayers: identifyLayers,
        InsertElementCommand: InsertElementCommand,
        isIdentity: svgedit.math.isIdentity,
        logMatrix: logMatrix,
        matrixMultiply: matrixMultiply,
        MoveElementCommand: MoveElementCommand,
        preventClickDefault: svgedit.utilities.preventClickDefault,
        recalculateAllSelectedDimensions: recalculateAllSelectedDimensions,
        recalculateDimensions: recalculateDimensions,
        remapElement: remapElement,
        RemoveElementCommand: RemoveElementCommand,
        removeUnusedDefElems: removeUnusedDefElems,
        round: round,
        runExtensions: runExtensions,
        sanitizeSvg: sanitizeSvg,
        SVGEditTransformList: svgedit.transformlist.SVGTransformList,
        toString: toString,
        transformBox: svgedit.math.transformBox,
        transformListToTransform: transformListToTransform,
        transformPoint: transformPoint,
        walkTree: svgedit.utilities.walkTree
      };
      return obj;
    };

    this.getUseElementLocationBeforeTransform = function (elem) {
      const xform = $(elem).attr('data-xform');
      const elemX = parseFloat($(elem).attr('x') || '0');
      const elemY = parseFloat($(elem).attr('y') || '0');
      let obj = {};
      if (xform) {
        xform.split(' ').forEach((pair) => {
          [key, value] = pair.split('=');
          if (value === undefined) {
            return;
          };
          obj[key] = parseFloat(value);
        });
      } else {
        obj = elem.getBBox();
        obj.x = 0;
        obj.y = 0;
      }
      obj.x += elemX;
      obj.y += elemY;
      return obj;
    }

    this.getSvgRealLocation = function (elem) {
      if (elem.tagName === 'text') {
        return this.calculateTransformedBBox(elem);
      }
      if (elem.tagName !== 'use') {
        return elem.getBBox();
      }
      const ts = $(elem).attr('transform') || '';
      const xform = $(elem).attr('data-xform');
      const elemX = parseFloat($(elem).attr('x') || '0');
      const elemY = parseFloat($(elem).attr('y') || '0');

      let obj = {};
      if (xform) {
        xform.split(' ').forEach((pair) => {
          [key, value] = pair.split('=');
          if (value === undefined) {
            return;
          };
          obj[key] = parseFloat(value);
        });
      } else {
        obj = elem.getBBox();
        obj.x = 0;
        obj.y = 0;
      }
      const matrix = ts.match(/matrix\(.*?\)/g);

      const matr = matrix ? matrix[0].substring(7, matrix[0].length - 1) : '1,0,0,1,0,0';
      [a, b, c, d, e, f] = matr.split(',').map(parseFloat);
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
      return {
        x: x,
        y: y,
        width: width,
        height: height
      };
    };

    this.calculateTransformedBBox = function (elem) {
      const tlist = svgedit.transformlist.getTransformList(elem);
      const bbox = elem.getBBox();
      points = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y },
        { x: bbox.x, y: bbox.y + bbox.height },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      ];
      for (let i = tlist.numberOfItems - 1; i >= 0; i--) {
        const t = tlist.getItem(i);
        if (t.type === 4) {
          break;
        }
        points = points.map(p => {
          const x = t.matrix.a * p.x + t.matrix.c * p.y + t.matrix.e;
          const y = t.matrix.b * p.x + t.matrix.d * p.y + t.matrix.f;
          return { x, y };
        });
      };
      let [minX, minY, maxX, maxY] = [points[0].x, points[0].y, points[0].x, points[0].y];
      points.forEach(p => {
        minX = Math.min(p.x, minX);
        maxX = Math.max(p.x, maxX);
        minY = Math.min(p.y, minY);
        maxY = Math.max(p.y, maxY);
      });
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    };

    this.calculateRotatedBBox = (bbox, angle) => {
      let points = [
        { x: bbox.x, y: bbox.y },
        { x: bbox.x + bbox.width, y: bbox.y },
        { x: bbox.x, y: bbox.y + bbox.height },
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      ];

      const rad = angle * Math.PI / 180;
      const cx = bbox.x + 0.5 * bbox.width;
      const cy = bbox.y + 0.5 * bbox.height;
      points.forEach((p) => {
        const x = p.x - cx;
        const y = p.y - cy;
        p.x = cx + x * Math.cos(rad) - y * Math.sin(rad);
        p.y = cy + x * Math.sin(rad) + y * Math.cos(rad);
      });
      let [minX, minY, maxX, maxY] = [points[0].x, points[0].y, points[0].x, points[0].y];
      points.forEach(p => {
        minX = Math.min(p.x, minX);
        maxX = Math.max(p.x, maxX);
        minY = Math.min(p.y, minY);
        maxY = Math.max(p.y, maxY);
      });

      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    String.prototype.format = function () {
      a = this;
      for (k in arguments) {
        a = a.replace('{' + k + '}', arguments[k]);
      }
      return a;
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
          let xform = svgroot.createSVGTransform();
          let tlist = svgedit.transformlist.getTransformList(elem);

          xform.setTranslate(dx, dy);
          if (tlist.numberOfItems) {
            tlist.insertItemBefore(xform, 0);
          } else {
            tlist.appendItem(xform);
          }
          break;
      }

      selectorManager.requestSelector(elem).resize();
      recalculateAllSelectedDimensions();

    };

    this.setSvgElemPosition = function (para, val) {
      const selected = selectedElements[0];
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

      let xform = svgroot.createSVGTransform();
      let tlist = svgedit.transformlist.getTransformList(selected);

      xform.setTranslate(dx, dy);
      if (tlist.numberOfItems) {
        tlist.insertItemBefore(xform, 0);
      } else {
        tlist.appendItem(xform);
      }

      selectorManager.requestSelector(selected).resize();
      recalculateAllSelectedDimensions();

    };
    // refer to resize behavior in mouseup mousemove mousedown
    this.setSvgElemSize = function (para, val, undoable) {
      let batchCmd = new svgedit.history.BatchCommand('set size');
      const selected = selectedElements[0];
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

      startTransform = selected.getAttribute('transform'); //???maybe non need

      const tlist = svgedit.transformlist.getTransformList(selected);
      const left = realLocation.x;
      const top = realLocation.y;

      // update the transform list with translate,scale,translate
      let translateOrigin = svgroot.createSVGTransform();
      let scale = svgroot.createSVGTransform();
      let translateBack = svgroot.createSVGTransform();

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

      selectorManager.requestSelector(selected).showGrips(true);

      let cmd = svgedit.recalculate.recalculateDimensions(selected);
      svgEditor.updateContextPanel();
      if (cmd && !cmd.isEmpty()) {
        batchCmd.addSubCommand(cmd);
      }
      if (!batchCmd.isEmpty()) {
        if (undoable) {
          addCommandToHistory(batchCmd);
        }
        return batchCmd;
      }
    };

    this.toggleGrid = function () {
      const showGrid = !(svgEditor.curConfig.showGrid || false);
      svgEditor.curConfig.showGrid = showGrid;
      Menu.getApplicationMenu().items.find(i => i.id === '_view').submenu.items.find(i => i.id === 'SHOW_GRIDS').checked = showGrid;
      const canvasGridDisplay = showGrid ? 'inline' : 'none';
      $('#canvasGrid').attr('style', `display: ${canvasGridDisplay}`);
    }

    this.toggleRulers = () => {
      const shouldShowRulers = !BeamboxPreference.read('show_rulers');
      BeamboxPreference.write('show_rulers', shouldShowRulers);
      Menu.getApplicationMenu().items.find(i => i.id === '_view').submenu.items.find(i => i.id === 'SHOW_RULERS').checked = shouldShowRulers;
      document.getElementById('rulers').style.display = shouldShowRulers ? '' : 'none';
      svgEditor.updateRulers();
    }

    this.setRotaryMode = function (val) {
      // True or false
      rotaryMode = val;
    };
    this.getRotaryMode = function () {
      return rotaryMode;
    };

    this.setRotaryDisplayCoord = function (val) {
      BeamboxPreference.write('rotary_y_coord', val);
    };

    this.getRotaryDisplayCoord = function () {
      return BeamboxPreference.read('rotary_y_coord') || 5;
    }

    this.zoomSvgElem = function (zoomScale) {
      const selected = selectedElements[0];
      const realLocation = this.getSvgRealLocation(selected);

      startTransform = selected.getAttribute('transform'); //???maybe non need

      const tlist = svgedit.transformlist.getTransformList(selected);
      const left = realLocation.x;
      const top = realLocation.y;

      // update the transform list with translate,scale,translate
      let translateOrigin = svgroot.createSVGTransform();
      let scale = svgroot.createSVGTransform();
      let translateBack = svgroot.createSVGTransform();

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

      selectorManager.requestSelector(selected).showGrips(true);

      svgedit.recalculate.recalculateDimensions(selected);
    };
  };


});
