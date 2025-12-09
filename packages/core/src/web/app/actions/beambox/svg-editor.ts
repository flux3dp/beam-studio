/*globals svgEditor:true, globalStorage, widget, svgedit, canvg, jQuery, $, DOMParser, FileReader */
/*jslint vars: true, eqeq: true, todo: true, forin: true, continue: true, regexp: true */
/*
 * svg-editor.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2010 Alexis Deveria
 * Copyright(c) 2010 Pavol Rusnak
 * Copyright(c) 2010 Jeff Schiller
 * Copyright(c) 2010 Narendra Sisodiya
 * Copyright(c) 2014 Brett Zamir
 *
 */

// Dependencies:
// 1) units.js
// 2) browser.js
// 3) svgcanvas.js

import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import canvasEvents from '@core/app/actions/canvas/canvasEvents';
import AlertConstants from '@core/app/constants/alert-constants';
import { PanelType } from '@core/app/constants/right-panel-types';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import history from '@core/app/svgedit/history/history';
import historyUtils from '@core/app/svgedit/history/utils';
import {
  copySelectedElements,
  cutSelectedElements,
  pasteWithDefaultPosition,
} from '@core/app/svgedit/operations/clipboard';
import { deleteSelectedElements } from '@core/app/svgedit/operations/delete';
import importBitmap from '@core/app/svgedit/operations/import/importBitmap';
import importBvg from '@core/app/svgedit/operations/import/importBvg';
import importDxf from '@core/app/svgedit/operations/import/importDxf';
import importSvg from '@core/app/svgedit/operations/import/importSvg';
import { moveSelectedElements } from '@core/app/svgedit/operations/move';
import svgCanvasClass from '@core/app/svgedit/svgcanvas';
import textActions from '@core/app/svgedit/text/textactions';
import textEdit from '@core/app/svgedit/text/textedit';
import workareaManager from '@core/app/svgedit/workarea';
import LayerPanelController from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import RightPanelController from '@core/app/views/beambox/Right-Panels/contexts/RightPanelController';
import { getNextStepRequirement } from '@core/app/views/tutorials/tutorialController';
import BeamFileHelper from '@core/helpers/beam-file-helper';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import i18n from '@core/helpers/i18n';
import getExifRotationFlag from '@core/helpers/image/getExifRotationFlag';
import ImageData from '@core/helpers/image-data';
import isWeb from '@core/helpers/is-web';
import { importPresets } from '@core/helpers/presets/preset-helper';
import Shortcuts from '@core/helpers/shortcuts';
import { isMobile } from '@core/helpers/system-helper';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type ISVGConfig from '@core/interfaces/ISVGConfig';

import { pdfHelper } from '@core/implementations/pdfHelper';
import storage from '@core/implementations/storage';

import Alert from '../alert-caller';
import Progress from '../progress-caller';

import fileSystem from '@core/implementations/fileSystem';
import { FileData } from '@core/helpers/fileImportHelper';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getStorage } from '@core/app/stores/storageStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import {
  getMouseMode,
  setCursor,
  setCursorAccordingToMouseMode,
  setMouseMode,
} from '@core/app/stores/canvas/utils/mouseMode';

// @ts-expect-error this line is required to load svgedit
if (svgCanvasClass) {
  console.log('svgCanvas loaded successfully');
}
// TODO: change to require('svgedit')
const { $, svgedit } = window;

const workareaEvents = eventEmitterFactory.createEventEmitter('workarea');

declare global {
  interface JQueryStatic {
    alert: any;
    confirm: any;
    deparam: any;
    getSvgIcon: any;
    pref: any;
    process_cancel: any;
    prompt: any;
    select: any;
    SvgCanvas: any;
    svgIcons: any;
  }

  interface JQuery {
    andSelf(): JQuery;
    contextMenu: any;
    draggable(options: any): JQuery;
    slider(arg0?: any, arg1?: any, arg3?: any): JQuery;
    SpinButton(options: any): JQuery;
  }

  interface Window {
    importingFile?: FileData;
    homePage?: string;
  }
}

export interface ISVGEditor {
  addExtension: () => void;
  canvas: any;
  clearScene: () => Promise<void>;
  clickSelect: (clearSelection?: boolean) => void;
  clipboardData: any;
  copySelected: () => void;
  curConfig: ISVGConfig;
  curPrefs: ISVGPref;
  cutSelected: () => void;
  deleteSelected: () => void;
  dimensions: number[];
  handleFile: (file: any) => Promise<void>;
  init: () => void;
  isClipboardDataReady: any;
  putLocale: (lang: number | string | string[], good_langs: any[]) => void;
  readSVG: (blob: any, type: any, layerName: any) => Promise<unknown>;
  replaceBitmap: any;
  setConfig: (opts: any, cfgCfg: any) => void;
  setIcon: (elem: any, icon_id: any) => void;
  setLang: (lang: any, allStrings: any) => void;
  setPanning: (active: any) => void;
  storagePromptClosed: boolean;
  tool_scale: number;
  toolButtonClick: (button: any, noHiding: any) => boolean;
  uiStrings: any;
  updateContextPanel: () => void;
}

interface ISVGPref {
  bkgd_color?: string;
  bkgd_url?: string;
  export_notice_done?: boolean;
  // EDITOR OPTIONS (DIALOG)
  lang?: string; // Default to "en" if locale.js detection does not detect another language
  // DOCUMENT PROPERTIES (DIALOG)
  // ALERT NOTICES
  // Only shows in UI as far as alert notices, but useful to remember, so keeping as pref
  save_notice_done?: boolean;
}

const svgEditor = (window['svgEditor'] = (function () {
  // EDITOR PROPERTIES: (defined below)
  //		curPrefs, curConfig, canvas, storage, uiStrings
  //
  // STATE MAINTENANCE PROPERTIES
  const workarea = useDocumentStore.getState().workarea;
  const { pxDisplayHeight, pxHeight, pxWidth } = getWorkarea(workarea);
  const editor: ISVGEditor = {
    addExtension: () => {},
    canvas: null,
    clearScene: async () => {},
    clickSelect: () => {},
    clipboardData: null,
    copySelected: () => {},
    curConfig: null as any,
    curPrefs: null as any,
    cutSelected: () => {},
    deleteSelected: () => {},
    dimensions: [pxWidth, pxDisplayHeight ?? pxHeight],
    handleFile: async (file) => {},
    init: () => {},
    isClipboardDataReady: false,
    putLocale: (lang: number | string | string[], good_langs: any[]) => {},
    readSVG: async (blob: any, type: any, layerName: any) => {},
    ready: () => {},
    replaceBitmap: null,
    setConfig: (opts: any, cfgCfg: any) => {},
    setIcon: (elem: any, icon_id: any) => {},
    setLang: (lang: any, allStrings: any) => {},
    setPanning: (active: any) => {},
    storage: storage,
    tool_scale: 1, // Dependent on icon size, so any use to making configurable instead? Used by JQuerySpinBtn.js
    toolButtonClick: (button: any, noHiding: any) => {
      return false;
    },
    uiStrings: {},
    updateContextPanel: () => {},
  };

  const availableLangMap = {
    da: 'da',
    de: 'de',
    el: 'el',
    en: 'en',
    es: 'es',
    fi: 'fi',
    fr: 'fr',
    id: 'id',
    it: 'it',
    ja: 'ja',
    kr: 'kr',
    ms: 'ms',
    nl: 'nl',
    no: 'no',
    pl: 'pl',
    pt: 'pt',
    se: 'se',
    th: 'th',
    vi: 'vi',
    'zh-cn': 'zh-CN',
    'zh-tw': 'zh-TW',
  };
  let pressedKey: string[] = [];

  document.addEventListener('keydown', (e) => {
    if (!pressedKey.includes(e.key)) {
      pressedKey.push(e.key);
    }
  });

  document.addEventListener('keyup', (e) => {
    const index = pressedKey.findIndex((key) => key === e.key);

    if (index > 0) {
      pressedKey.splice(index, 1);
    }
  });

  window.addEventListener('blur', (e) => {
    pressedKey = [];
  });

  let svgCanvas: ISVGCanvas;
  var urldata,
    Utils = window['svgedit'].utilities,
    /**
     * PREFS AND CONFIG
     */
    // The iteration algorithm for defaultPrefs does not currently support array/objects
    defaultPrefs: ISVGPref = {
      bkgd_color: '#FFF',
      bkgd_url: '',
      export_notice_done: false,
      // EDITOR OPTIONS (DIALOG)
      lang: availableLangMap[i18n.getActiveLang()] || 'en', // Default to "en" if locale.js detection does not detect another language
      // DOCUMENT PROPERTIES (DIALOG)
      // ALERT NOTICES
      // Only shows in UI as far as alert notices, but useful to remember, so keeping as pref
      save_notice_done: false,
    },
    curPrefs: ISVGPref = {},
    // Note: The difference between Prefs and Config is that Prefs
    //   can be changed in the UI and are stored in the browser,
    //   while config cannot
    curConfig: ISVGConfig = {
      /**
       * Can use window.location.origin to indicate the current
       * origin. Can contain a '*' to allow all domains or 'null' (as
       * a string) to support all file:// URLs. Cannot be set by
       * URL for security reasons (not safe, at least for
       * privacy or data integrity of SVG content).
       * Might have been fairly safe to allow
       *   `new URL(window.location.href).origin` by default but
       *   avoiding it ensures some more security that even third
       *   party apps on the same domain also cannot communicate
       *   with this app by default.
       * For use with ext-xdomain-messaging.js
       * @todo We might instead make as a user-facing preference.
       */
      allowedOrigins: [],
      // We do not put on defaultConfig to simplify object copying
      //   procedures (we obtain instead from defaultExtensions)
      extensions: [],
    },
    defaultExtensions = ['ext-polygon.js'],
    defaultConfig: ISVGConfig = {
      baseUnit: 'px',
      // Change the following to preferences and add pref controls to the UI (e.g., initTool, wireframe, showlayers)?
      canvasName: 'default',
      // DOCUMENT PROPERTIES
      // Change the following to a preference (already in the Document Properties dialog)?
      dimensions: editor.dimensions,
      extPath: 'js/lib/svgeditor/extensions/',
      // EDITOR OPTIONS
      // Change the following to preferences (already in the Editor Options dialog)?
      gridSnapping: false,
      // PATH CONFIGURATION
      // The following path configuration items are disallowed in the URL (as should any future path configurations)
      initFill: {
        color: 'FFFFFF',
        opacity: 0,
      },
      initOpacity: 1,
      initStroke: {
        color: '000000', // solid black
        opacity: 1,
        width: 1,
      },
      initTool: 'select',
      langPath: 'js/lib/svgeditor/locale/',
      // EXTENSION CONFIGURATION (see also preventAllURLConfig)
      lockExtensions: false, // Disallowed in URL setting
      no_save_warning: true,
      noDefaultExtensions: false, // noDefaultExtensions can only be meaningfully used in config.js or in the URL
      // URL BEHAVIOR CONFIGURATION
      preventAllURLConfig: true,
      preventURLContentLoading: true,
      // EXTENSION-RELATED (GRID)
      showlayers: true,
      snappingStep: 10,
    },
    /**
     * LOCALE
     * @todo Can we remove now that we are always loading even English? (unless locale is set to null)
     */
    uiStrings = (editor.uiStrings = {
      common: {
        cancel: 'Cancel',
        key_backspace: 'Backspace',
        key_del: 'Del',
        key_down: 'Down',
        key_up: 'Up',
        ok: 'OK',
      },
      // This is needed if the locale is English, since the locale strings are not read in that instance.
      layers: {
        layer: 'Layer',
      },
      notification: {
        defsFailOnSave:
          'NOTE: Due to a bug in your browser, this image may appear wrong (missing gradients or elements). It will however appear correct once actually saved.',
        dupeLayerName: 'There is already a layer named that!',
        enterNewImgURL: 'Enter the new image URL',
        enterNewLayerName: 'Please enter the new layer name',
        enterNewLinkURL: 'Enter the new hyperlink URL',
        enterUniqueLayerName: 'Please enter a unique layer name',
        featNotSupported: 'Feature not supported',
        invalidAttrValGiven: 'Invalid value given',
        layerHasThatName: 'Layer already has that name',
        noContentToFitTo: 'No content to fit to',
        noteTheseIssues: 'Also note the following issues: ',
        QerrorsRevertToSource: 'There were parsing errors in your SVG source.\nRevert back to original SVG source?',
        QignoreSourceChanges: 'Ignore changes made to SVG source?',
        QwantToOpen: 'Do you want to open a new file?\nThis will also erase your undo history!',
        retrieving: "Retrieving '%s' ...",
        saveFromBrowser: "Select 'Save As...' in your browser to save this image as a %s file.",
        URLloadFail: 'Unable to load from URL',
      },
    });
  /**
   * EXPORTS
   */

  /**
   * Store and retrieve preferences
   * @param {string} key The preference name to be retrieved or set
   * @param {string} [val] The value. If the value supplied is missing or falsey, no change to the preference will be made.
   * @returns {string} If val is missing or falsey, the value of the previously stored preference will be returned.
   * @todo Can we change setting on the jQuery namespace (onto editor) to avoid conflicts?
   * @todo Review whether any remaining existing direct references to
   *	getting curPrefs can be changed to use $.pref() getting to ensure
   *	defaultPrefs fallback (also for sake of allowInitialUserOverride); specifically, bkgd_color could be changed so that
   *	the pref dialog has a button to auto-calculate background, but otherwise uses $.pref() to be able to get default prefs
   *	or overridable settings
   */
  $.pref = function (key, val) {
    if (val) {
      curPrefs[key] = val;
      editor.curPrefs = curPrefs; // Update exported value

      return;
    }

    return key in curPrefs ? curPrefs[key] : defaultPrefs[key];
  };

  /**
   * EDITOR PUBLIC METHODS
   * locale.js also adds "putLang" and "readLang" as editor methods
   * @todo Sort these methods per invocation order, ideally with init at the end
   * @todo Prevent execution until init executes if dependent on it?
   */

  /**
   * Allows setting of preferences or configuration (including extensions).
   * @param {object} opts The preferences or configuration (including extensions)
   * @param {object} [cfgCfg] Describes configuration which applies to the particular batch of supplied options
   * @param {boolean} [cfgCfg.allowInitialUserOverride=false] Set to true if you wish
   *	to allow initial overriding of settings by the user via the URL
   *	(if permitted) or previously stored preferences (if permitted);
   *	note that it will be too late if you make such calls in extension
   *	code because the URL or preference storage settings will
   *   have already taken place.
   * @param {boolean} [cfgCfg.overwrite=true] Set to false if you wish to
   *	prevent the overwriting of prior-set preferences or configuration
   *	(URL settings will always follow this requirement for security
   *	reasons, so config.js settings cannot be overridden unless it
   *	explicitly permits via "allowInitialUserOverride" but extension config
   *	can be overridden as they will run after URL settings). Should
   *   not be needed in config.js.
   */
  editor.setConfig = function (opts, cfgCfg) {
    cfgCfg = cfgCfg || {};

    function extendOrAdd(cfgObj, key, val) {
      if (cfgObj[key] && typeof cfgObj[key] === 'object') {
        $.extend(true, cfgObj[key], val);
      } else {
        cfgObj[key] = val;
      }

      return;
    }
    $.each(opts, function (key: string, val) {
      if (opts.hasOwnProperty(key)) {
        // Only allow prefs defined in defaultPrefs
        if (defaultPrefs.hasOwnProperty(key)) {
          if (cfgCfg.overwrite === false && (curConfig.preventAllURLConfig || curPrefs.hasOwnProperty(key))) {
            return;
          }

          if (cfgCfg.allowInitialUserOverride === true) {
            defaultPrefs[key] = val;
          } else {
            $.pref(key, val);
          }
        } else if (['allowedOrigins', 'extensions'].includes(key)) {
          if (
            cfgCfg.overwrite === false &&
            (curConfig.preventAllURLConfig ||
              key === 'allowedOrigins' ||
              (key === 'extensions' && curConfig.lockExtensions))
          ) {
            return;
          }

          curConfig[key] = curConfig[key].concat(val); // We will handle any dupes later
        }
        // Only allow other curConfig if defined in defaultConfig
        else if (defaultConfig.hasOwnProperty(key)) {
          if (cfgCfg.overwrite === false && (curConfig.preventAllURLConfig || curConfig.hasOwnProperty(key))) {
            return;
          }

          // Potentially overwriting of previously set config
          if (curConfig.hasOwnProperty(key)) {
            if (cfgCfg.overwrite === false) {
              return;
            }

            extendOrAdd(curConfig, key, val);
          } else {
            if (cfgCfg.allowInitialUserOverride === true) {
              extendOrAdd(defaultConfig, key, val);
            } else {
              if (defaultConfig[key] && typeof defaultConfig[key] === 'object') {
                curConfig[key] = {};
                $.extend(true, curConfig[key], val); // Merge properties recursively, e.g., on initFill, initStroke objects
              } else {
                curConfig[key] = val;
              }
            }
          }
        }
      }
    });
    editor.curConfig = curConfig; // Update exported value
  };

  editor.init = function () {
    // Todo: Avoid var-defined functions and group functions together, etc. where possible
    var good_langs = [];

    $('#lang_select option').each(function (this: HTMLOptionElement) {
      good_langs.push(this.value);
    });

    function setupCurPrefs() {
      curPrefs = $.extend(true, {}, defaultPrefs, curPrefs); // Now safe to merge with priority for curPrefs in the event any are already set
      // Export updated prefs
      editor.curPrefs = curPrefs;
    }

    function setupCurConfig() {
      curConfig = $.extend(true, {}, defaultConfig, curConfig); // Now safe to merge with priority for curConfig in the event any are already set

      // Now deal with extensions and other array config
      if (!curConfig.noDefaultExtensions) {
        curConfig.extensions = curConfig.extensions.concat(defaultExtensions);
      }

      // ...and remove any dupes
      $.each(['extensions', 'allowedOrigins'], function (i, cfg) {
        curConfig[cfg] = $.grep(curConfig[cfg], function (n, i) {
          return i === curConfig[cfg].indexOf(n);
        });
      });
      // Export updated config
      editor.curConfig = curConfig;
    }
    setupCurConfig();
    setupCurPrefs();

    var setIcon = (editor.setIcon = function (elem, icon_id) {
      var icon = typeof icon_id === 'string' ? $.getSvgIcon(icon_id, true) : icon_id.clone();

      if (!icon) {
        console.log('NOTE: Icon image missing: ' + icon_id);

        return;
      }

      $(elem).empty().append(icon);
    });

    var extFunc = function () {
      $.each(curConfig.extensions, function () {
        var extname = this;

        if (!extname.match(/^ext-.*\.js/)) {
          // Ensure URL cannot specify some other unintended file in the extPath
          return;
        }

        $.getScript(curConfig.extPath + extname, function (d) {
          // Fails locally in Chrome 5
          if (!d) {
            var s = document.createElement('script');

            s.src = curConfig.extPath + extname;
            document.querySelector('head').appendChild(s);
          }
        }).fail(function (jqxhr, settings, exception) {
          console.log(exception);
        });
      });

      // var lang = ('lang' in curPrefs) ? curPrefs.lang : null;
      editor.putLocale(null, good_langs);
    };

    // Load extensions
    // Bit of a hack to run extensions in local Opera/IE9
    if (document.location.protocol === 'file:') {
      setTimeout(extFunc, 100);
    } else {
      extFunc();
    }

    window['svgCanvas'] = editor.canvas = svgCanvas = new $.SvgCanvas(document.getElementById('svgcanvas'), curConfig);

    var resize_timer,
      Actions,
      path = svgCanvas.pathActions,
      workarea = $('#workarea');

    // For external openers
    (function () {
      // let the opener know SVG Edit is ready (now that config is set up)
      var svgEditorReadyEvent,
        w = window.opener || window.parent;

      if (w) {
        try {
          svgEditorReadyEvent = w.document.createEvent('Event');
          svgEditorReadyEvent.initEvent('svgEditorReady', true, true);
          w.document.documentElement.dispatchEvent(svgEditorReadyEvent);
        } catch (e) {
          console.log(e);
        }
      }
    })();

    // used to make the flyouts stay on the screen longer the very first time
    // var flyoutspeed = 1250; // Currently unused
    var selectedElement: any = null;
    var multiselected = false;
    var origTitle = $('title:first').text();

    var togglePathEditMode = function (editmode, elems) {
      if (editmode) {
        multiselected = false;

        if (elems.length) {
          selectedElement = elems[0];
        }
      }
    };

    var clickSelect = (editor.clickSelect = function (clearSelection: boolean = true) {
      if ([TutorialConstants.DRAW_A_CIRCLE, TutorialConstants.DRAW_A_RECT].includes(getNextStepRequirement())) return;

      setMouseMode('select');

      if (clearSelection) {
        svgCanvas.clearSelection();
      }
    });

    // updates the context panel tools based on the selected element
    var updateContextPanel = function () {
      var elem = selectedElement;

      // If element has just been deleted, consider it null
      if (elem != null && !elem.parentNode) {
        elem = null;
      }

      var currentMode = getMouseMode();
      var unit = curConfig.baseUnit !== 'px' ? curConfig.baseUnit : null;

      var is_node = currentMode === 'pathedit'; //elem ? (elem.id && elem.id.indexOf('pathpointgrip') == 0) : false;

      if (is_node) {
        canvasEvents.setPathEditing(true);
        canvasEvents.setSelectedElement(null);
        RightPanelController.updatePathEditPanel();
      } else {
        canvasEvents.setPathEditing(false);
        canvasEvents.setSelectedElement(elem);
      }

      if (elem != null) {
        var elname = elem.nodeName;
        // If this is a link with no transform and one child, pretend
        // its child is selected
        //					if (elname === 'a') { // && !$(elem).attr('transform')) {
        //						elem = elem.firstChild;
        //					}

        var angle = svgCanvas.getRotationAngle(elem);

        ObjectPanelController.updateDimensionValues({ rotation: angle });

        if (!is_node && currentMode !== 'pathedit') {
          //$('#selected_panel').show();
          // Elements in this array already have coord fields
          if (['circle', 'ellipse', 'line'].includes(elname)) {
          } else {
            var x, y;

            // Get BBox vals for g, polyline and path
            if (['g', 'path', 'polygon', 'polyline'].includes(elname)) {
              var bb = svgCanvas.getStrokedBBox([elem]);

              if (bb) {
                x = bb.x;
                y = bb.y;

                if (elname !== 'polyline') {
                  let bbox = elem.getBBox();

                  ObjectPanelController.updateDimensionValues({
                    height: bbox.height,
                    width: bbox.width,
                  });
                }
              }
            } else if (['text'].includes(elname)) {
              const bb = svgCanvas.calculateTransformedBBox(elem);

              x = bb.x;
              y = bb.y;
              ObjectPanelController.updateDimensionValues({
                height: bb.height,
                width: bb.width,
              });
            } else {
              x = elem.getAttribute('x');
              y = elem.getAttribute('y');
            }

            if (unit) {
              x = svgedit.units.convertUnit(x);
              y = svgedit.units.convertUnit(y);
            }

            ObjectPanelController.updateDimensionValues({
              x: Number.parseFloat(x) || 0,
              y: Number.parseFloat(y) || 0,
            });

            svgCanvas.selectorManager.requestSelector(elem).resize();
          }
        } else {
          var point = path.getNodePoint();

          if (point) {
            if (unit) {
              point.x = svgedit.units.convertUnit(point.x);
              point.y = svgedit.units.convertUnit(point.y);
            }
          }

          return;
        }

        // update contextual tools here
        var panels = {
          a: [],
          circle: ['cx', 'cy', 'r'],
          ellipse: ['cx', 'cy', 'rx', 'ry'],
          g: [],
          image: ['width', 'height'],
          line: ['x1', 'y1', 'x2', 'y2'],
          path: [],
          polygon: [],
          rect: ['rx', 'width', 'height'],
          text: [],
          use: [],
        };

        var el_name = elem.tagName;

        /*
        var link_href = null;
        if (el_name === 'a') {
            link_href = svgCanvas.getHref(elem);
            $('#g_panel').show();
        }

        if (elem.parentNode.tagName === 'a') {
            if (!$(elem).siblings().length) {
                $('#a_panel').show();
                link_href = svgCanvas.getHref(elem.parentNode);
            }
        }
        */

        if (panels[el_name]) {
          const cur_panels = panels[el_name];

          //$('#' + el_name + '_panel').show();
          const newDimensionValue = {};

          $.each(cur_panels, function (i, item) {
            var attrVal = elem.getAttribute(item);

            if (curConfig.baseUnit !== 'px' && elem[item]) {
              var bv = elem[item].baseVal.value;

              attrVal = svgedit.units.convertUnit(bv);
            }

            $('#' + el_name + '_' + item).val(attrVal || 0);
            newDimensionValue[item] = attrVal;
          });
          ObjectPanelController.updateDimensionValues(newDimensionValue);

          switch (el_name) {
            case 'text':
              if (svgCanvas.addedNew) {
                // Timeout needed for IE9
                setTimeout(function () {
                  $('#text').focus().select();
                }, 100);
              }

              textActions.setFontSize(textEdit.getFontSize(elem));
              textActions.setIsVertical(textEdit.getIsVertical(elem));
              break;
            case 'image':
              break;
            case 'g':
            case 'use':
              $('#container_panel').show();

              if (el_name === 'use' && $(elem).attr('data-xform')) {
                const location = svgCanvas.getSvgRealLocation(elem);

                ObjectPanelController.updateDimensionValues({
                  height: location.height,
                  width: location.width,
                  x: location.x,
                  y: location.y,
                });
              }

              break;
            case 'path':
              //$('#container_panel').show();
              break;
            default:
              break;
          }
        }

        if (svgCanvas.getTempGroup()) {
          workareaEvents.emit('update-context-menu', {
            group: true,
            ungroup: false,
          });
        } else {
          workareaEvents.emit('update-context-menu', {
            group: multiselected && el_name !== 'g',
            ungroup: el_name === 'g' && !elem?.getAttribute('data-pass-through'),
          });
        }

        const isRatioFixed = elem.getAttribute('data-ratiofixed') === 'true';

        ObjectPanelController.updateDimensionValues({ isRatioFixed });
      } else if (multiselected) {
        workareaEvents.emit('update-context-menu', {
          group: true,
          ungroup: false,
        });
      } else {
        workareaEvents.emit('update-context-menu', {
          select: false,
        });
      }

      svgCanvas.addedNew = false;

      if ((elem && !is_node) || multiselected) {
        // Enable regular menu options
        workareaEvents.emit('update-context-menu', {
          select: true,
        });
      }

      ObjectPanelController.updateObjectPanel();
    };

    editor.updateContextPanel = updateContextPanel;

    var updateTitle = function (title?: string) {
      title = title || svgCanvas.getDocumentTitle();

      var newTitle = origTitle + (title ? ': ' + title : '');

      // Remove title update with current context info, isn't really necessary
      //				if (cur_context) {
      //					new_title = new_title + cur_context;
      //				}
      $('title:first').text(newTitle);
    };

    // called when we've selected a different element
    var selectedChanged = function (win, elems) {
      var mode = getMouseMode();

      // TODO: is this needed?
      if (mode === 'select') setMouseMode('select');

      var is_node = mode === 'pathedit';

      // if elems[1] is present, then we have more than one element
      selectedElement = elems.length === 1 || elems[1] == null ? elems[0] : null;
      multiselected = elems.length >= 2 && elems[1] != null;
      // Deal with pathedit mode
      togglePathEditMode(is_node, elems);
      updateContextPanel();
      svgCanvas.runExtensions('selectedChanged', {
        elems: elems,
        multiselected: multiselected,
        selectedElement: selectedElement,
      });

      if (elems.length === 1 && elems[0]?.tagName === 'polygon') {
        ObjectPanelController.updatePolygonSides($(selectedElement).attr('sides'));
      }
    };

    // called when any element has changed
    const elementChanged = function () {
      updateContextPanel();
    };

    $('#cur_context_panel').delegate('a', 'click', function () {
      var link = $(this);

      if (link.attr('data-root')) {
        svgCanvas.leaveContext();
      } else {
        svgCanvas.setContext(link.text());
      }

      svgCanvas.clearSelection();

      return false;
    });

    var contextChanged = function (win, context) {
      var link_str = '';

      if (context) {
        var str = '';

        link_str = '<a href="#" data-root="y">' + layerManager.getCurrentLayerName() + '</a>';

        $(context)
          .parentsUntil('#svgcontent > g')
          .andSelf()
          .each(function () {
            if (this.id) {
              str += ' > ' + this.id;

              if (this !== context) {
                link_str += ' > <a href="#">' + this.id + '</a>';
              } else {
                link_str += ' > ' + this.id;
              }
            }
          });
      }

      $('#cur_context_panel').toggle(!!context).html(link_str);

      updateTitle();
    };

    var uaPrefix = (function () {
      var prop;
      var regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/;
      var someScript = document.getElementsByTagName('script')[0];

      for (prop in someScript.style) {
        if (regex.test(prop)) {
          // test is faster than match, so it's better to perform
          // that on the lot and match only when necessary
          return prop.match(regex)[0];
        }
      }

      // Nothing found so far?
      if ('WebkitOpacity' in someScript.style) {
        return 'Webkit';
      }

      if ('KhtmlOpacity' in someScript.style) {
        return 'Khtml';
      }

      return '';
    })();

    // bind the selected event to our function that handles updates to the UI
    svgCanvas.bind('selected', selectedChanged);
    svgCanvas.bind('changed', elementChanged);
    svgCanvas.bind('contextset', contextChanged);
    textActions.setInputElem($('#text')[0]);

    var changeStrokeWidth = function (ctl) {
      var val = ctl.value;

      if (val == 0 && selectedElement && ['line', 'polyline'].includes(selectedElement.nodeName)) {
        val = ctl.value = 1;
      }

      svgCanvas.setStrokeWidth(val);
    };

    // Maybe useful
    var changeBlur = function (ctl, val?, noUndo?: boolean) {
      if (val == null) {
        val = ctl.value;
      }

      var complete = false;

      if (!ctl || !ctl.handle) {
        complete = true;
      }

      if (noUndo) {
        svgCanvas.setBlurNoUndo(val);
      } else {
        svgCanvas.setBlur(val, complete);
      }
    };

    // Lose focus for select elements when changed (Allows keyboard shortcuts to work better)
    $('select').change(function () {
      $(this).blur();
    });

    const textInput = document.getElementById('text') as HTMLInputElement;
    let wasNewLineAdded = false;
    const checkFunctionKeyPressed = (evt: KeyboardEvent) => {
      return (window.os === 'MacOS' && evt.metaKey) || (window.os !== 'MacOS' && evt.ctrlKey);
    };

    window.addEventListener(
      'input',
      (e) => {
        if (Shortcuts.isInBaseScope()) {
          const evt = e as InputEvent;

          if (evt.inputType === 'historyRedo' || evt.inputType === 'historyUndo') {
            evt.preventDefault();
            evt.stopPropagation();
            if (evt.inputType === 'historyRedo') historyUtils.redo();
            else if (evt.inputType === 'historyUndo') historyUtils.undo();
          }
        }
      },
      { capture: true },
    );

    $('#text').on('keyup input', function (this: HTMLInputElement, evt) {
      evt.stopPropagation();

      if (!textActions.isEditing && evt.type === 'input') {
        // Hack: Windows input event will some how block undo/redo event
        // So do undo/redo when not entering & input event triggered
        evt.preventDefault();

        const originalEvent = evt.originalEvent as InputEvent;

        if (originalEvent.inputType === 'historyUndo') {
          historyUtils.undo();
        } else if (originalEvent.inputType === 'historyRedo') {
          historyUtils.redo();
        }

        return;
      }

      if (evt.key === 'Enter' && !wasNewLineAdded) {
        textActions.toSelectMode(true);
      } else if (textActions.isEditing) {
        textEdit.setTextContent(this.value);
      }

      if (evt.key !== 'Shift') {
        wasNewLineAdded = false;
      }
    });
    textInput.addEventListener('keydown', (evt: KeyboardEvent) => {
      evt.stopPropagation();

      if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        textActions.onUpKey();
      } else if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        textActions.onDownKey();
      } else if (evt.key === 'ArrowLeft') {
        evt.preventDefault();
        textActions.onLeftKey();
      } else if (evt.key === 'ArrowRight') {
        evt.preventDefault();
        textActions.onRightKey();
      } else if (evt.key === 'Escape') {
        clickSelect();
      }

      const isFunctionKeyPressed = checkFunctionKeyPressed(evt);

      if ((isMobile() || evt.shiftKey) && evt.key === 'Enter') {
        evt.preventDefault();
        textActions.newLine();
        textEdit.setTextContent(textInput.value);
        wasNewLineAdded = true;
      } else if (isFunctionKeyPressed && evt.key === 'c') {
        evt.preventDefault();
        textActions.copyText();
      } else if (isFunctionKeyPressed && evt.key === 'x') {
        evt.preventDefault();
        textActions.cutText();
        textEdit.setTextContent(textInput.value);
      } else if (isFunctionKeyPressed && evt.key === 'v') {
        evt.preventDefault();
        textActions.pasteText();
        textEdit.setTextContent(textInput.value);
      } else if (isFunctionKeyPressed && evt.key === 'a') {
        evt.preventDefault();
        textActions.selectAll();
        textEdit.setTextContent(textInput.value);
      } else if (isFunctionKeyPressed && evt.key === 'z') {
        if (window.os === 'MacOS') {
          evt.preventDefault();
        }
      }
    });

    (function () {
      var last_x = null,
        last_y = null,
        w_area = workarea[0],
        panning = false,
        keypan = false;

      window['w_area'] = workarea[0];

      $('#svgcanvas')
        .bind('mousemove mouseup', function (evt) {
          if (panning === false) {
            return;
          }

          w_area.scrollLeft -= evt.clientX - last_x;
          w_area.scrollTop -= evt.clientY - last_y;

          last_x = evt.clientX;
          last_y = evt.clientY;

          if (evt.type === 'mouseup') {
            panning = false;
          }

          return false;
        })
        .mousedown(function (evt) {
          if (evt.button === 1 || keypan === true) {
            panning = true;
            last_x = evt.clientX;
            last_y = evt.clientY;

            return false;
          }
        });

      $(window).mouseup(function () {
        panning = false;
      });

      // FIXME: use document.addEventListener('keydown', (evt) => { ... })
      // because shortcuts only works with a strict key combinations match
      document.addEventListener('keydown', (evt) => {
        if (evt.key === ' ') {
          svgCanvas.spaceKey = keypan = true;
          setCursor('grab');
          evt.preventDefault(); // prevent page from scrolling
        }
      });
      // FIXME: use document.addEventListener('keyup', (evt) => { ... })
      // because shortcuts are not providing keyup event now
      document.addEventListener('keyup', (evt) => {
        if (evt.key === ' ') {
          setCursorAccordingToMouseMode();
          svgCanvas.spaceKey = keypan = false;
        }
      });

      editor.setPanning = function (active) {
        svgCanvas.spaceKey = keypan = active;
      };
    })();
    // Unfocus text input when workarea is mousedowned.
    (function () {
      var inp: any;
      var unfocus = function () {
        $(inp).blur();
      };

      $('#svg_editor')
        .find('button, select, input:not(#text)')
        .focus(function () {
          inp = this;
          workarea.mousedown(unfocus);
        })
        .blur(function () {
          workarea.unbind('mousedown', unfocus);

          // Go back to selecting text if in textedit mode
          if (getMouseMode() === 'textedit') {
            $('#text').focus();
          }
        });
    })();

    // Delete is a contextual tool that only appears in the ribbon if
    // an element has been selected
    var deleteSelected = function () {
      if (selectedElement != null || multiselected) {
        textActions.clear();
        deleteSelectedElements();
      }

      if (svgedit.path.path) {
        svgedit.path.path.onDelete(textEdit, textPathEdit);
      }
    };

    editor.deleteSelected = deleteSelected;

    var cutSelected = function () {
      // disabled when focusing input element
      if (document.activeElement.tagName.toLowerCase() === 'input') {
        return;
      }

      if (!textActions.isEditing && (selectedElement != null || multiselected)) {
        cutSelectedElements();
      }
    };

    editor.cutSelected = cutSelected;
    document.addEventListener(
      'cut',
      () => {
        if (Shortcuts.isInBaseScope()) {
          cutSelected();
        }
      },
      false,
    );

    var copySelected = function () {
      // disabled when focusing input element
      if (document.activeElement.tagName.toLowerCase() === 'input') {
        return;
      }

      if (!textActions.isEditing && (selectedElement != null || multiselected)) {
        copySelectedElements();
      }
    };

    editor.copySelected = copySelected;
    document.addEventListener(
      'copy',
      () => {
        if (Shortcuts.isInBaseScope()) {
          copySelected();
        }
      },
      false,
    );

    // handle paste
    document.addEventListener('paste', async (e) => {
      // disabled when not in base scope
      if (!Shortcuts.isInBaseScope()) {
        return;
      }

      // disabled when focusing input element
      if (document.activeElement.tagName.toLowerCase() === 'input') {
        return;
      }

      if (['Shift', 'Control', 'V'].every((key) => pressedKey.includes(key))) {
        return;
      }

      const clipboardData = e.clipboardData;
      let importedFromClipboard = false;

      if (clipboardData) {
        if (clipboardData.types.includes('Files')) {
          console.log('handle clip board file');
          for (let i = 0; i < clipboardData.files.length; i++) {
            let file = clipboardData.files[i];

            svgEditor.handleFile(file);
            importedFromClipboard = true;
          }
        } else if (clipboardData.types.includes('text/html')) {
          const htmlData = clipboardData.getData('text/html');
          const matchImgs = htmlData.match(/<img[^>]+>/);

          if (matchImgs) {
            console.log('handle clip board html img');
            for (let i = 0; i < matchImgs.length; i++) {
              const matchSrc = matchImgs[i].match(/src="([^"]+)"/);

              if (matchSrc && matchSrc[1]) {
                importedFromClipboard = true;
                console.log(matchSrc[1]);

                let res = await fetch(matchSrc[1]);

                if (res.ok) {
                  const resBlob = await res.blob();
                  const blobSrc = URL.createObjectURL(resBlob);

                  ImageData(blobSrc, {
                    grayscale: {
                      is_rgba: true,
                      is_shading: true,
                      is_svg: false,
                      threshold: 254,
                    },
                    onComplete: function (result) {
                      let newImage = svgCanvas.addSvgElementFromJson({
                        attr: {
                          'data-ratiofixed': true,
                          'data-shading': true,
                          'data-threshold': 254,
                          height: result.canvas.height,
                          id: svgCanvas.getNextId(),
                          origImage: blobSrc,
                          preserveAspectRatio: 'none',
                          style: 'pointer-events:inherit',
                          width: result.canvas.width,
                          x: 0,
                          'xlink:href': result.pngBase64,
                          y: 0,
                        },
                        element: 'image',
                      });

                      svgCanvas.updateElementColor(newImage);
                    },
                  });
                } else {
                  Alert.popUp({
                    message: i18n.lang.beambox.svg_editor.unable_to_fetch_clipboard_img,
                    type: AlertConstants.SHOW_POPUP_WARNING,
                  });
                }
              }
            }
          }
        }
      }

      if (!importedFromClipboard) {
        pasteWithDefaultPosition();
      }
    });

    var moveSelected = function (dx, dy) {
      if (selectedElement != null || multiselected) {
        if (curConfig.gridSnapping) {
          // Use grid snap value regardless of zoom level
          var multi = workareaManager.zoomRatio * curConfig.snappingStep;

          dx *= multi;
          dy *= multi;
        }

        moveSelectedElements(dx, dy);
      }
    };

    var clearScene = async function () {
      const res = await toggleUnsavedChangedDialog();

      if (!res) {
        return;
      }

      setMouseMode('select');
      svgCanvas.clear();
      workareaManager.resetView();
      RightPanelController.setPanelType(PanelType.None); // will be updated to PanelType.Layer automatically if is not mobile
      LayerPanelController.updateLayerPanel();
      updateContextPanel();
      svgedit.transformlist.resetListMap();
      svgCanvas.runExtensions('onNewDocument');
    };

    editor.clearScene = clearScene;

    (function () {
      workarea.scroll(function () {
        // TODO: jQuery's scrollLeft/Top() wouldn't require a null check
        if ($('#ruler_x').length !== 0) {
          $('#ruler_x')[0].scrollLeft = workarea[0].scrollLeft;
        }

        if ($('#ruler_y').length !== 0) {
          $('#ruler_y')[0].scrollTop = workarea[0].scrollTop - workarea[0].offsetTop;
        }
      });
    })();

    LayerPanelController.updateLayerPanel();

    var centerCanvas = function () {
      // this centers the canvas vertically in the workarea (horizontal handled in CSS)
      workarea.css('line-height', workarea.height() + 'px');
    };

    $(window).bind('load resize', centerCanvas);

    //Prevent browser from erroneously repopulating fields
    $('input,select').attr('autocomplete', 'off');

    // Associate all button actions as well as non-button keyboard shortcuts
    Actions = (function () {
      return {
        setAll: function () {
          const moveUnit = getStorage('isInch') ? 25.4 : 10; // 0.1 in : 1 mm

          Shortcuts.on(['Delete', 'Backspace'], () => deleteSelected());
          Shortcuts.on(['Fnkey+a'], (e) => {
            e.stopPropagation();
            svgCanvas.selectAll();
          });
          Shortcuts.on(['ArrowUp'], (e) => {
            if (selectedElement) {
              moveSelected([0], [-moveUnit]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollTop -= 5;
            }
          });
          Shortcuts.on(['Shift+ArrowUp'], (e) => {
            if (selectedElement) {
              moveSelected([0], [-moveUnit * 10]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollTop -= 50;
            }
          });
          Shortcuts.on(['ArrowDown'], (e) => {
            if (selectedElement) {
              moveSelected([0], [moveUnit]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollTop += 5;
            }
          });
          Shortcuts.on(['Shift+ArrowDown'], (e) => {
            if (selectedElement) {
              moveSelected([0], [moveUnit * 10]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollTop += 50;
            }
          });
          Shortcuts.on(['ArrowLeft'], (e) => {
            if (selectedElement) {
              moveSelected([-moveUnit], [0]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollLeft -= 5;
            }
          });
          Shortcuts.on(['Shift+ArrowLeft'], (e) => {
            if (selectedElement) {
              moveSelected([-moveUnit * 10], [0]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollLeft -= 50;
            }
          });
          Shortcuts.on(['ArrowRight'], (e) => {
            if (selectedElement) {
              moveSelected([moveUnit], [0]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollLeft += 5;
            }
          });
          Shortcuts.on(['Shift+ArrowRight'], (e) => {
            if (selectedElement) {
              moveSelected([moveUnit * 10], [0]);
            } else {
              const workArea = document.getElementById('workarea');

              workArea.scrollLeft += 50;
            }
          });
          Shortcuts.on(
            ['+', '='],
            () => {
              window['polygonAddSides']?.();
              ObjectPanelController.updatePolygonSides($(selectedElement).attr('sides'));
            },
            { splitKey: '-' },
          );
          Shortcuts.on(['-'], () => {
            window['polygonDecreaseSides']?.();
            ObjectPanelController.updatePolygonSides($(selectedElement).attr('sides'));
          });
          Shortcuts.on(['l'], () => RightPanelController.setPanelType(PanelType.Layer));
          Shortcuts.on(['o'], () => {
            const isPathEdit = getMouseMode() === 'pathedit';

            RightPanelController.setPanelType(isPathEdit ? PanelType.PathEdit : PanelType.Object);
          });
          Shortcuts.on(['Escape'], () => clickSelect());
        },
      };
    })();

    Actions.setAll();

    window.addEventListener(
      'beforeunload',
      (e) => {
        if (!isWeb()) {
          return null;
        }

        if (!currentFileManager.getHasUnsavedChanges()) {
          return null;
        }

        e.preventDefault();
        e.returnValue = '';

        return '';
      },
      false,
    );

    function onDragEnter(e) {
      e.stopPropagation();
      e.preventDefault();
      // and indicator should be displayed here, such as "drop files here"
    }

    function onDragOver(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function onDragLeave(e) {
      e.stopPropagation();
      e.preventDefault();
      // hypothetical indicator should be removed here
    }

    // Use HTML5 File API: http://www.w3.org/TR/FileAPI/
    // if browser has HTML5 File API support, then we will show the open menu item
    // and provide a file input to click. When that change event fires, it will
    // get the text contents of the file and send it to the canvas
    if (window.FileReader) {
      const replaceBitmap = async (file, imageElem) => {
        Progress.openNonstopProgress({ caption: i18n.lang.beambox.popup.loading_image, id: 'loading_image' });

        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();

          reader.onloadend = async function (e) {
            let rotationFlag = getExifRotationFlag(e.target.result as string);

            console.log(rotationFlag);

            var img = new Image();
            var blob = new Blob([reader.result]);
            const src = URL.createObjectURL(blob);

            img.src = src;
            img.style.opacity = '0';
            img.onload = function () {
              let imgWidth = img.width;
              let imgHeight = img.height;
              const isFullColor = imageElem.getAttribute('data-fullcolor') === '1';

              ImageData(src, {
                grayscale: isFullColor
                  ? undefined
                  : {
                      is_rgba: true,
                      is_shading: imageElem.getAttribute('data-shading') === 'true',
                      is_svg: false,
                      threshold: Number.parseInt(imageElem.getAttribute('data-threshold')),
                    },
                height: imgHeight,
                onComplete: function (result) {
                  const batchCmd = new history.BatchCommand('Replace Image');
                  let cmd;

                  svgCanvas.undoMgr.beginUndoableChange('origImage', [imageElem]);
                  imageElem.setAttribute('origImage', src);
                  cmd = svgCanvas.undoMgr.finishUndoableChange();

                  if (!cmd.isEmpty()) {
                    batchCmd.addSubCommand(cmd);
                  }

                  svgCanvas.undoMgr.beginUndoableChange('xlink:href', [imageElem]);
                  imageElem.setAttribute('xlink:href', result.pngBase64);
                  cmd = svgCanvas.undoMgr.finishUndoableChange();

                  if (!cmd.isEmpty()) {
                    batchCmd.addSubCommand(cmd);
                  }

                  svgCanvas.undoMgr.addCommandToHistory(batchCmd);
                  updateContextPanel();
                  Progress.popById('loading_image');
                  resolve(null);
                },
                rotationFlag,
                width: imgWidth,
              });
            };
          };
          reader.readAsArrayBuffer(file);
        });
      };

      editor.replaceBitmap = replaceBitmap;

      const importJsScript = async (file) => {
        Progress.popById('loading_image');

        const reader = new FileReader();

        reader.onloadend = (evt) => {
          const script = evt.target.result as string;

          Function(script)();
        };
        reader.readAsText(file);
      };

      var importImage = function (e) {
        e.stopPropagation();
        e.preventDefault();
        $('#workarea').removeAttr('style');

        const file = e.type === 'drop' ? e.dataTransfer.files[0] : this.files[0];

        if (!file) {
          return;
        }

        handleFile(file);
        // let file input import same file again.
        // Beacause function 'importImage' is triggered by onChange event, so we remove the value to ensure onChange event fire
        $(this).attr('value', '');
      };

      const handleFile = async (file) => {
        const lang = i18n.lang.beambox;
        const path = fileSystem.getPathForFile(file as File);
        await Progress.openNonstopProgress({
          caption: lang.popup.loading_image,
          id: 'loading_image',
        });
        svgCanvas.clearSelection();

        const fileType = (() => {
          if (file.name.toLowerCase().endsWith('.beam')) {
            return 'beam';
          }

          if (file.name.toLowerCase().endsWith('.bvg')) {
            return 'bvg';
          }

          if (file.name.toLowerCase().endsWith('.dxf')) {
            return 'dxf';
          }

          if (file.type.toLowerCase().includes('image')) {
            if (file.type.toLowerCase().includes('svg')) {
              return 'svg';
            } else if (file.type.toLowerCase().endsWith('dxf')) {
              return 'dxf';
            } else {
              return 'bitmap';
            }
          }

          if (file.name.toLowerCase().endsWith('.json')) {
            return 'json';
          }

          if (file.name.toLowerCase().endsWith('.js')) {
            return 'js';
          }

          if (file.name.toLowerCase().endsWith('.pdf') || path?.toLowerCase().endsWith('.pdf')) {
            return 'pdf';
          }

          if (file.name.toLowerCase().endsWith('.ai') || path?.toLowerCase().endsWith('.ai')) {
            return 'ai';
          }

          return 'unknown';
        })();

        console.log('File type name:', fileType);

        switch (fileType) {
          case 'bvg':
            await importBvg(file);
            Progress.popById('loading_image');
          case 'beam':
            BeamFileHelper.readBeam(file);
            break;
          case 'svg':
            await webNeedConnectionWrapper(async () => {
              await importSvg(file);
            });
            // remove the loading toast if loaded or no machine connection
            Progress.popById('loading_image');
            break;
          case 'bitmap':
            await importBitmap(file);
            Progress.popById('loading_image');
            break;
          case 'dxf':
            await importDxf(file);
            Progress.popById('loading_image');
            break;
          case 'pdf':
          case 'ai':
            const { blob, errorMessage } = await pdfHelper.pdfToSvgBlob(file);

            if (blob) {
              Object.assign(blob, { name: file.name });
              await importSvg(blob as File, { skipByLayer: true });
              Progress.popById('loading_image');
            } else {
              Progress.popById('loading_image');
              Alert.popUp({ message: errorMessage!, type: AlertConstants.SHOW_POPUP_ERROR });
            }

            break;
          case 'js':
            importJsScript(file);
            break;
          case 'json':
            Progress.popById('loading_image');
            await importPresets(file);
            LayerPanelController.updateLayerPanel();
            break;
          case 'unknown':
            Progress.popById('loading_image');
            Alert.popUp({
              id: 'import_unknown',
              message: lang.svg_editor.unnsupported_file_type,
              type: AlertConstants.SHOW_POPUP_WARNING,
            });
            break;
        }
        switch (fileType) {
          case 'bvg':
          case 'beam':
            if (path) {
              currentFileManager.setLocalFile(path);
              svgCanvas.updateRecentFiles(path);
            } else {
              currentFileManager.setFileName(file.name, { extractFromPath: true });
            }

            currentFileManager.setHasUnsavedChanges(false);
            break;
          case 'dxf':
          case 'svg':
          case 'bitmap':
          case 'ai':
            if (!currentFileManager.getName()) {
              currentFileManager.setFileName(file.name, { extractFromPath: true });
            }

            currentFileManager.setHasUnsavedChanges(true);
            break;
        }
        canvasEvents.addImage();
      };

      editor.handleFile = handleFile;

      workarea[0].addEventListener('dragenter', onDragEnter, false);
      workarea[0].addEventListener('dragover', onDragOver, false);
      workarea[0].addEventListener('dragleave', onDragLeave, false);
      workarea[0].addEventListener('drop', importImage, false);

      // Keep for e2e import image
      // enable beambox-global-interaction to click (data-file-input, trigger_file_input_click)
      var imgImport = $(
        '<input type="file" accept=".svg,.bvg,.jpg,.png,.dxf,.js,.beam,.ai,.pdf" data-file-input="import_image">',
      ).change(importImage);

      $('#tool_import').show().prepend(imgImport);

      window['updateContextPanel'] = updateContextPanel;
    }

    //			$(function() {
    //			});

    //	var revnums = "svg-editor.js ($Rev$) ";
    //	revnums += svgCanvas.getVersion();
    //	$('#copyright')[0].setAttribute('title', revnums);

    // For Compatibility with older extensions
    $(function () {
      window['svgCanvas'] = svgCanvas;
    });

    editor.setLang = function (lang, allStrings) {
      $.pref('lang', lang);
      $('#lang_select').val(lang);

      if (!allStrings) {
        return;
      }

      // var notif = allStrings.notification; // Currently unused
      // $.extend will only replace the given strings
      var oldLayerName = $('#layerlist tr.layersel td.layername').text();
      var rename_layer = oldLayerName === uiStrings.layers.layer + ' 1';

      $.extend(uiStrings, allStrings);
      svgCanvas.setUiStrings(allStrings);

      if (rename_layer) {
        svgCanvas.renameCurrentLayer(uiStrings.layers.layer + ' 1');
        LayerPanelController.updateLayerPanel();
      }
    };

    //greyscale all svgContent
    (function () {
      const svgdoc = document.getElementById('svgcanvas').ownerDocument;
      const greyscaleFilter = svgdoc.createElementNS(svgedit.NS.SVG, 'filter');

      svgCanvas.assignAttributes(greyscaleFilter, {
        id: 'greyscaleFilter',
      });

      const greyscaleMatrix = svgdoc.createElementNS(svgedit.NS.SVG, 'feColorMatrix');

      svgCanvas.assignAttributes(greyscaleMatrix, {
        type: 'matrix',
        values:
          '0.3333 0.3333 0.3333 0  0\
							0.3333 0.3333 0.3333 0  0\
							0.3333 0.3333 0.3333 0  0\
							0 	   0      0      1  0',
      });
      greyscaleFilter.appendChild(greyscaleMatrix);
      //$('#svgroot defs').append(greyscaleFilter);
      // $(svgcontent).attr({
      //     filter: 'url(#greyscaleFilter)'
      // });
    })();
  };

  // TODO: only ext-polygon are used now, once we port ext-polygon to module, we can remove this
  editor.addExtension = function () {
    var args = arguments;

    // Note that we don't want this on editor.ready since some extensions
    // may want to run before then (like server_opensave).
    $(function () {
      if (svgCanvas) {
        svgCanvas.addExtension.apply(this, args);
      }
    });
  };

  return editor;
})());

// Run init once DOM is loaded
// $(svgEditor.init);
//replaced by componentDidMount()
export default window['svgEditor'];
