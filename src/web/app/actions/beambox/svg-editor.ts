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

/*
TODOS
1. JSDoc
*/
import ToolPanelsController from './Tool-Panels-Controller';
import RightPanelController from 'app/views/beambox/Right-Panels/contexts/RightPanelController';
import LayerPanelController from 'app/views/beambox/Right-Panels/contexts/LayerPanelController';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import TopBarController from 'app/views/beambox/Top-Bar/contexts/Top-Bar-Controller';
import { getNextStepRequirement } from 'app/views/tutorials/Tutorial-Controller';
import { NounProjectPanelController } from 'app/views/beambox/Noun-Project-Panel';
import BeamboxPreference from './beambox-preference';
import Constant from './constant';
import OpenBottomBoundaryDrawer from './open-bottom-boundary-drawer';
import PreviewModeController from './preview-mode-controller';
import Alert from '../alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import TutorialConstants from 'app/constants/tutorial-constants';
import Progress from '../progress-caller';
import Dialog from 'app/actions/dialog-caller';
import AwsHelper from 'helpers/aws-helper';
import BeamFileHelper from 'helpers/beam-file-helper';
import ImageData from 'helpers/image-data';
import storage from 'helpers/storage-helper';
import PdfHelper from 'helpers/pdf-helper';
import Shortcuts from 'helpers/shortcuts';
import SymbolMaker from 'helpers/symbol-maker';
import * as i18n from 'helpers/i18n';

import AlertConfig from 'helpers/api/alert-config';
import Config from 'helpers/api/config';
import SvgLaserParser from 'helpers/api/svg-laser-parser';
import { IFont } from 'interfaces/IFont';
import { IIcon } from 'interfaces/INoun-Project'
import { IStorage } from 'interfaces/IStorage';

// @ts-expect-error
import Dxf2Svg = require('dxf2svg');
// @ts-expect-error
import ImageTracer = require('imagetracer');

const React = requireNode('react');
const electron = requireNode('electron');
const LANG = i18n.lang.beambox;
const svgWebSocket = SvgLaserParser({ type: 'svgeditor' });
// TODO: change to require('svgedit')
const svgedit = window['svgedit'];

//todo preven running multiple times
/*if (window['svgEditor']) {
    return;
}*/

declare global {
  interface JQueryStatic {
    pref: any
    jGraduate: any
    confirm: any
    getSvgIcon: any
    select: any
    prompt: any
    alert: any
    svgIcons: any
    SvgCanvas: any
    deparam: any
    process_cancel: any
  }

  interface JQuery {
    andSelf(): JQuery
    SpinButton(options: any): JQuery
    slider(arg0?: any, arg1?: any, arg3?: any): JQuery
    draggable(options: any): JQuery
    enableContextMenuItems(options: any): JQuery
    disableContextMenuItems(options: any): JQuery
    disableContextMenu(): JQuery
    contextMenu: any
    jGraduate: any
  }
}

interface ISVGEditor {
  addDropDown(elem: string, callback: JQuery.EventHandler<HTMLLIElement, JQuery.MouseUpEvent<HTMLLIElement>>, dropUp?: boolean)
  addExtension: () => void
  canvas: any
  clickSelect: (clearSelection?: boolean) => void
  curConfig: ISVGConfig
  curPrefs: ISVGPref
  disableUI: (featList: any) => void
  getExifRotationFlag: any
  importSvg: (file: any, args: { skipVersionWarning?: boolean, skipByLayer?: boolean }) => Promise<void>
  init: () => void
  loadFromDataURI: (str: any) => void
  loadFromURL: (url: any, opts?: any) => void
  putLocale(lang: string | number | string[], good_langs: any[])
  randomizeIds: () => void
  readSVG: (blob: any, type: any, layerName: any) => Promise<unknown>
  readImage: (file: any, scale?: number, offset?: any) => Promise<unknown>,
  replaceBitmap: any
  runCallbacks: () => void
  savePreferences: () => void
  setConfig: (opts: any, cfgCfg: any) => void
  setCustomHandlers: (opts: any) => void
  setIcon: (elem: any, icon_id: any) => void
  setIconSize: (size: any) => void
  setImageURL: (url: any) => void
  setLang: (lang: any, allStrings: any) => void
  setPanning: (active: any) => void
  setWorkAreaContextMenu: () => void
  setZoomWithWindow: () => void
  storage: IStorage
  toolButtonClick: (button: any, noHiding: any) => boolean
  updateRulers: () => void
  updateCanvas: (zoomData?: { autoCenter?: boolean; staticPoint?: { x: number; y: number } }) => void
  triggerGridTool: () => void
  triggerOffsetTool: () => void
  loadFromStringAsync(arg0: any)
  importBvgStringAsync: (str: any) => Promise<void>
  handleFile: (file: any) => void
  loadFromString(arg0: any)
  importBvg: (file: any) => Promise<void>
  importLaserConfig: (file: any) => Promise<void>
  openPrep(arg0: (ok: any) => void)
  resetView: () => void
  zoomIn: () => void
  zoomChanged(window: Window & typeof globalThis, arg1: { zoomLevel: number })
  zoomOut: () => void
  ready(arg0: () => void)
  clickUndo: () => void
  clickRedo: () => void
  clipboardData: any
  isClipboardDataReady: any
  triggerNestTool: () => void
  loadContentAndPrefs: () => void
  tool_scale: number
  exportWindowCt: number
  langChanged: boolean
  showSaveWarning: boolean
  storagePromptClosed: boolean
  dimensions: number[]
  uiStrings: any
  updateContextPanel: () => void
  clearScene: () => void
}

interface ISVGPref {
  // EDITOR OPTIONS (DIALOG)
  lang?: string, // Default to "en" if locale.js detection does not detect another language
  iconsize?: string, // Will default to 's' if the window height is smaller than the minimum height and 'm' otherwise
  bkgd_color?: string,
  bkgd_url?: string,
  // DOCUMENT PROPERTIES (DIALOG)
  img_save?: string,
  // ALERT NOTICES
  // Only shows in UI as far as alert notices, but useful to remember, so keeping as pref
  save_notice_done?: boolean,
  export_notice_done?: boolean
}

interface ISVGConfig {
  // Todo: svgcanvas.js also sets and checks: show_outside_canvas, selectNew; add here?
  // Change the following to preferences and add pref controls to the UI (e.g., initTool, wireframe, showlayers)?
  canvasName?: string
  canvas_expansion?: number
  initFill?: {
    color: string,
    opacity: number
  }
  initStroke?: {
    width: number,
    color: string, // solid black
    opacity: number
  }
  text?: {
    stroke_width: 1,
    font_size: 100,
    font_family: string,
    font_postscriptName: string,
    fill: string,
    fill_opacity: string,
    text_anchor: string
  },
  initOpacity?: number,
  colorPickerCSS?: any, // Defaults to 'left' with a position equal to that of the fill_color or stroke_color element minus 140, and a 'bottom' equal to 40
  initTool?: string,
  exportWindowType?: string, // 'same' (todo: also support 'download')
  wireframe?: boolean,
  showlayers?: boolean,
  no_save_warning?: boolean,
  // PATH CONFIGURATION
  // The following path configuration items are disallowed in the URL (as should any future path configurations)
  imgPath?: string,
  langPath?: string,
  extPath?: string,
  jGraduatePath?: string,
  // DOCUMENT PROPERTIES
  // Change the following to a preference (already in the Document Properties dialog)?
  dimensions?: number[],
  // EDITOR OPTIONS
  // Change the following to preferences (already in the Editor Options dialog)?
  gridSnapping?: boolean,
  gridColor?: string,
  baseUnit?: string,
  defaultUnit?: string,
  snappingStep?: number,
  showRulers?: boolean,
  // URL BEHAVIOR CONFIGURATION
  preventAllURLConfig?: boolean,
  preventURLContentLoading?: boolean,
  // EXTENSION CONFIGURATION (see also preventAllURLConfig)
  lockExtensions?: boolean, // Disallowed in URL setting
  noDefaultExtensions?: boolean, // noDefaultExtensions can only be meaningfully used in config.js or in the URL
  // EXTENSION-RELATED (GRID)
  showGrid?: true, // Set by ext-grid.js
  // EXTENSION-RELATED (STORAGE)
  noStorageOnLoad?: boolean, // Some interaction with ext-storage.js; prevent even the loading of previously saved local storage
  forceStorage?: boolean, // Some interaction with ext-storage.js; strongly discouraged from modification as it bypasses user privacy by preventing them from choosing whether to keep local storage or not
  emptyStorageOnDecline?: boolean // Used by ext-storage.js; empty any prior storage if the user declines to store
  extensions?: any[],
  allowedOrigins?: string[]
}

const svgEditor = window['svgEditor'] = (function ($) {
  // set workarea according to default model.
  const defaultModel = BeamboxPreference.read('model');
  if (defaultModel !== undefined) {
    BeamboxPreference.write('workarea', defaultModel);
  }
  // EDITOR PROPERTIES: (defined below)
  //		curPrefs, curConfig, canvas, storage, uiStrings
  //
  // STATE MAINTENANCE PROPERTIES
  const editor: ISVGEditor = {
    addDropDown: () => { },
    addExtension: () => { },
    canvas: null,
    clickSelect: () => { },
    curConfig: null,
    curPrefs: null,
    disableUI: (featList: any) => { },
    getExifRotationFlag: null,
    importSvg: async (file: any, args: { skipVersionWarning?: boolean, skipByLayer?: boolean } = {}) => { },
    init: () => { },
    loadFromDataURI: (str: any) => { },
    loadFromURL: (url: any, opts: any) => { },
    putLocale: (lang: string | number | string[], good_langs: any[]) => { },
    randomizeIds: () => { },
    readSVG: async (blob: any, type: any, layerName: any) => { },
    readImage: async (file: any, scale?: number, offset?: any) => { },
    replaceBitmap: null,
    runCallbacks: () => { },
    savePreferences: () => { },
    setConfig: (opts: any, cfgCfg: any) => { },
    setCustomHandlers: (opts: any) => { },
    setIcon: (elem: any, icon_id: any) => { },
    setIconSize: (size: any) => { },
    setImageURL: (url: any) => { },
    setLang: (lang: any, allStrings: any) => { },
    setPanning: (active: any) => { },
    setWorkAreaContextMenu: () => { },
    setZoomWithWindow: () => { },
    storage: storage,
    toolButtonClick: (button: any, noHiding: any) => { return false },
    updateRulers: () => { },
    updateCanvas: (zoomData?: { autoCenter?: boolean; staticPoint?: { x: number; y: number } }) => { },
    triggerGridTool: () => { },
    triggerOffsetTool: () => { },
    loadFromStringAsync: () => { },
    importBvgStringAsync: async (str) => { },
    handleFile: (file) => { },
    loadFromString: (arg0) => { },
    importBvg: async (file) => { },
    importLaserConfig: async (file) => { },
    openPrep: () => { },
    resetView: () => { },
    zoomIn: () => { },
    zoomChanged: () => { },
    zoomOut: () => { },
    ready: () => { },
    clickUndo: () => { },
    clickRedo: () => { },
    clipboardData: null,
    isClipboardDataReady: false,
    triggerNestTool: () => { },
    loadContentAndPrefs: () => { },
    tool_scale: 1, // Dependent on icon size, so any use to making configurable instead? Used by JQuerySpinBtn.js
    exportWindowCt: 0,
    langChanged: false,
    showSaveWarning: false,
    storagePromptClosed: false, // For use with ext-storage.js
    dimensions: [Constant.dimension.getWidth(BeamboxPreference.read('model')), Constant.dimension.getHeight(BeamboxPreference.read('model'))],
    uiStrings: {},
    updateContextPanel: () => {},
    clearScene: () => {},
  };

  const availableLangMap = {
    'de': 'de',
    'en': 'en',
    'es': 'es',
    'ja': 'ja',
    'zh-tw': 'zh-TW',
    'zh-cn': 'zh-CN',
  }
  const config = Config();
  const defaultFont = config.read('default-font') as IFont;
  let pressedKey = [];

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

  var svgCanvas, urldata,
    Utils = window['svgedit'].utilities,
    isReady = false,
    customExportImage = false,
    customExportPDF = false,
    callbacks = [],
    /**
         * PREFS AND CONFIG
         */
    // The iteration algorithm for defaultPrefs does not currently support array/objects
    defaultPrefs: ISVGPref = {
      // EDITOR OPTIONS (DIALOG)
      lang: availableLangMap[i18n.getActiveLang()] || 'en', // Default to "en" if locale.js detection does not detect another language
      iconsize: '', // Will default to 's' if the window height is smaller than the minimum height and 'm' otherwise
      bkgd_color: '#FFF',
      bkgd_url: '',
      // DOCUMENT PROPERTIES (DIALOG)
      img_save: 'embed',
      // ALERT NOTICES
      // Only shows in UI as far as alert notices, but useful to remember, so keeping as pref
      save_notice_done: false,
      export_notice_done: false
    },
    curPrefs: ISVGPref = {},
    // Note: The difference between Prefs and Config is that Prefs
    //   can be changed in the UI and are stored in the browser,
    //   while config cannot
    curConfig: ISVGConfig = {
      // We do not put on defaultConfig to simplify object copying
      //   procedures (we obtain instead from defaultExtensions)
      extensions: [],
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
      allowedOrigins: []
    },
    defaultExtensions = [
      'ext-rotary_mode.js',
      'ext-markers.js',
      'ext-connector.js',
      'ext-shapes.js',
      'ext-imagelib.js',
      'ext-grid.js',
      'ext-polygon.js',
      'ext-star.js',
      'ext-panning.js',
      'ext-multiselect.js',
      // 'ext-storage.js',
      // 'ext-eyedropper.js',
      'ext-closepath.js',
    ],
    defaultConfig: ISVGConfig = {
      // Todo: svgcanvas.js also sets and checks: show_outside_canvas, selectNew; add here?
      // Change the following to preferences and add pref controls to the UI (e.g., initTool, wireframe, showlayers)?
      canvasName: 'default',
      canvas_expansion: 3,
      initFill: {
        color: 'FFFFFF',
        opacity: 0
      },
      initStroke: {
        width: 1,
        color: '000000', // solid black
        opacity: 1
      },
      text: {
        stroke_width: 1,
        font_size: 100,
        font_family: defaultFont ? defaultFont.family : 'Arial',
        font_postscriptName: defaultFont ? defaultFont.postscriptName : 'ArialMT',
        fill: '#fff',
        fill_opacity: '0',
        text_anchor: 'start'
      },
      initOpacity: 1,
      colorPickerCSS: null, // Defaults to 'left' with a position equal to that of the fill_color or stroke_color element minus 140, and a 'bottom' equal to 40
      initTool: 'select',
      exportWindowType: 'new', // 'same' (todo: also support 'download')
      wireframe: true,
      showlayers: true,
      no_save_warning: true,
      // PATH CONFIGURATION
      // The following path configuration items are disallowed in the URL (as should any future path configurations)
      imgPath: 'js/lib/svgeditor/images/',
      langPath: 'js/lib/svgeditor/locale/',
      extPath: 'js/lib/svgeditor/extensions/',
      jGraduatePath: 'js/lib/svgeditor/jgraduate/images/',
      // DOCUMENT PROPERTIES
      // Change the following to a preference (already in the Document Properties dialog)?
      dimensions: editor.dimensions,
      // EDITOR OPTIONS
      // Change the following to preferences (already in the Editor Options dialog)?
      gridSnapping: false,
      gridColor: 'rgba(0,0,0,0.18)',
      baseUnit: 'px',
      defaultUnit: storage.get('default-units') || 'mm',
      snappingStep: 10,
      showRulers: true,
      // URL BEHAVIOR CONFIGURATION
      preventAllURLConfig: true,
      preventURLContentLoading: true,
      // EXTENSION CONFIGURATION (see also preventAllURLConfig)
      lockExtensions: false, // Disallowed in URL setting
      noDefaultExtensions: false, // noDefaultExtensions can only be meaningfully used in config.js or in the URL
      // EXTENSION-RELATED (GRID)
      showGrid: true, // Set by ext-grid.js
      // EXTENSION-RELATED (STORAGE)
      noStorageOnLoad: false, // Some interaction with ext-storage.js; prevent even the loading of previously saved local storage
      forceStorage: false, // Some interaction with ext-storage.js; strongly discouraged from modification as it bypasses user privacy by preventing them from choosing whether to keep local storage or not
      emptyStorageOnDecline: false // Used by ext-storage.js; empty any prior storage if the user declines to store
    },
    /**
         * LOCALE
         * @todo Can we remove now that we are always loading even English? (unless locale is set to null)
         */
    uiStrings = editor.uiStrings = {
      common: {
        ok: 'OK',
        cancel: 'Cancel',
        key_up: 'Up',
        key_down: 'Down',
        key_backspace: 'Backspace',
        key_del: 'Del'
      },
      // This is needed if the locale is English, since the locale strings are not read in that instance.
      layers: {
        layer: 'Layer'
      },
      notification: {
        invalidAttrValGiven: 'Invalid value given',
        noContentToFitTo: 'No content to fit to',
        dupeLayerName: 'There is already a layer named that!',
        enterUniqueLayerName: 'Please enter a unique layer name',
        enterNewLayerName: 'Please enter the new layer name',
        layerHasThatName: 'Layer already has that name',
        QmoveElemsToLayer: 'Move selected elements to layer \'%s\'?',
        QwantToClear: 'Do you want to clear the drawing?\nThis will also erase your undo history!',
        QwantToOpen: 'Do you want to open a new file?\nThis will also erase your undo history!',
        QerrorsRevertToSource: 'There were parsing errors in your SVG source.\nRevert back to original SVG source?',
        QignoreSourceChanges: 'Ignore changes made to SVG source?',
        featNotSupported: 'Feature not supported',
        enterNewImgURL: 'Enter the new image URL',
        defsFailOnSave: 'NOTE: Due to a bug in your browser, this image may appear wrong (missing gradients or elements). It will however appear correct once actually saved.',
        loadingImage: 'Loading image, please wait...',
        saveFromBrowser: 'Select \'Save As...\' in your browser to save this image as a %s file.',
        noteTheseIssues: 'Also note the following issues: ',
        unsavedChanges: 'There are unsaved changes.',
        enterNewLinkURL: 'Enter the new hyperlink URL',
        errorLoadingSVG: 'Error: Unable to load SVG data',
        URLloadFail: 'Unable to load from URL',
        retrieving: 'Retrieving \'%s\' ...'
      }
    };

  function loadSvgString(str, callback?) {
    var success = svgCanvas.setSvgString(str) !== false;
    callback = callback || $.noop;
    if (success) {
      callback(true);
    } else {
      Alert.popUp({
        id: 'load SVG fail',
        type: AlertConstants.SHOW_POPUP_WARNING,
        message: uiStrings.notification.errorLoadingSVG,
        callbacks: () => {
          callback(false);
        }
      });
    }
  };

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
    return (key in curPrefs) ? curPrefs[key] : defaultPrefs[key];
  };

  /**
       * EDITOR PUBLIC METHODS
       * locale.js also adds "putLang" and "readLang" as editor methods
       * @todo Sort these methods per invocation order, ideally with init at the end
       * @todo Prevent execution until init executes if dependent on it?
       */

  /**
       * Where permitted, sets canvas and/or defaultPrefs based on previous
       *	storage. This will override URL settings (for security reasons) but
       *	not config.js configuration (unless initial user overriding is explicitly
       *	permitted there via allowInitialUserOverride).
       * @todo Split allowInitialUserOverride into allowOverrideByURL and
       *	allowOverrideByUserStorage so config.js can disallow some
       *	individual items for URL setting but allow for user storage AND/OR
       *	change URL setting so that it always uses a different namespace,
       *	so it won't affect pre-existing user storage (but then if users saves
       *	that, it will then be subject to tampering
       */
  editor.loadContentAndPrefs = function () {
    if (!curConfig.forceStorage && (curConfig.noStorageOnLoad || !document.cookie.match(/(?:^|;\s*)store=(?:prefsAndContent|prefsOnly)/))) {
      return;
    }

    // LOAD CONTENT
    if (editor.storage && // Cookies do not have enough available memory to hold large documents
      (curConfig.forceStorage || (!curConfig.noStorageOnLoad && document.cookie.match(/(?:^|;\s*)store=prefsAndContent/)))
    ) {
      var name = 'svgedit-' + curConfig.canvasName;
      var cached = editor.storage.get(name);
      if (cached) {
        editor.loadFromString(cached);
      }
    }

    // LOAD PREFS
    var key;
    for (key in defaultPrefs) {
      if (defaultPrefs.hasOwnProperty(key)) { // It's our own config, so we don't need to iterate up the prototype chain
        var storeKey = 'svg-edit-' + key;
        if (editor.storage) {
          var val = editor.storage.get(storeKey);
          if (val) {
            defaultPrefs[key] = String(val); // Convert to string for FF (.value fails in Webkit)
          }
        } else if (window['widget']) {
          defaultPrefs[key] = window['widget'].preferenceForKey(storeKey);
        } else {
          var result = document.cookie.match(new RegExp('(?:^|;\\s*)' + Utils.preg_quote(encodeURIComponent(storeKey)) + '=([^;]+)'));
          defaultPrefs[key] = result ? decodeURIComponent(result[1]) : '';
        }
      }
    }
  };

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
          if (cfgCfg.overwrite === false && (
            curConfig.preventAllURLConfig ||
            curPrefs.hasOwnProperty(key)
          )) {
            return;
          }
          if (cfgCfg.allowInitialUserOverride === true) {
            defaultPrefs[key] = val;
          } else {
            $.pref(key, val);
          }
        } else if (['extensions', 'allowedOrigins'].indexOf(key) > -1) {
          if (cfgCfg.overwrite === false &&
            (
              curConfig.preventAllURLConfig ||
              key === 'allowedOrigins' ||
              (key === 'extensions' && curConfig.lockExtensions)
            )
          ) {
            return;
          }
          curConfig[key] = curConfig[key].concat(val); // We will handle any dupes later
        }
        // Only allow other curConfig if defined in defaultConfig
        else if (defaultConfig.hasOwnProperty(key)) {
          if (cfgCfg.overwrite === false && (
            curConfig.preventAllURLConfig ||
            curConfig.hasOwnProperty(key)
          )) {
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

  /**
       * @param {object} opts Extension mechanisms may call setCustomHandlers with three functions: opts.open, opts.save, and opts.exportImage
       * opts.open's responsibilities are:
       *	- invoke a file chooser dialog in 'open' mode
       *	- let user pick a SVG file
       *	- calls svgCanvas.setSvgString() with the string contents of that file
       *  opts.save's responsibilities are:
       *	- accept the string contents of the current document
       *	- invoke a file chooser dialog in 'save' mode
       *	- save the file to location chosen by the user
       *  opts.exportImage's responsibilities (with regard to the object it is supplied in its 2nd argument) are:
       *	- inform user of any issues supplied via the "issues" property
       *	- convert the "svg" property SVG string into an image for export;
       *		utilize the properties "type" (currently 'PNG', 'JPEG', 'BMP',
       *		'WEBP', 'PDF'), "mimeType", and "quality" (for 'JPEG' and 'WEBP'
       *		types) to determine the proper output.
       */
  editor.setCustomHandlers = function (opts) {
    editor.ready(function () {
      if (opts.open) {
        $('#tool_open > input[type="file"]').remove();
        $('#tool_open').show();
        svgCanvas.open = opts.open;
      }
      if (opts.save) {
        editor.showSaveWarning = false;
        svgCanvas.bind('saved', opts.save);
      }
      if (opts.exportImage) {
        customExportImage = opts.exportImage;
        svgCanvas.bind('exported', customExportImage); // canvg and our RGBColor will be available to the method
      }
      if (opts.exportPDF) {
        customExportPDF = opts.exportPDF;
        svgCanvas.bind('exportedPDF', customExportPDF); // jsPDF and our RGBColor will be available to the method
      }
    });
  };

  editor.randomizeIds = function () {
    svgCanvas.randomizeIds(arguments);
  };

  editor.init = function () {

    // var host = location.hostname,
    //	onWeb = host && host.indexOf('.') >= 0;
    // Some FF versions throw security errors here when directly accessing
    try {
      if ('localStorage' in window) { // && onWeb removed so Webkit works locally
        editor.storage = storage;
      }
    } catch (err) { console.log(err); }

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
    editor.loadContentAndPrefs();
    setupCurPrefs();

    const shouldShowRulers = !!BeamboxPreference.read('show_rulers');
    const { Menu } = electron.remote;
    curConfig.showRulers = shouldShowRulers;
    Menu.getApplicationMenu().items.find(i => i.id === '_view').submenu.items.find(i => i.id === 'SHOW_RULERS').checked = shouldShowRulers;
    document.getElementById('rulers').style.display = shouldShowRulers ? '' : 'none';

    var setIcon = editor.setIcon = function (elem, icon_id) {
      var icon = (typeof icon_id === 'string') ? $.getSvgIcon(icon_id, true) : icon_id.clone();
      if (!icon) {
        console.log('NOTE: Icon image missing: ' + icon_id);
        return;
      }
      $(elem).empty().append(icon);
    };

    var extFunc = function () {
      $.each(curConfig.extensions, function () {
        var extname = this;
        if (!extname.match(/^ext-.*\.js/)) { // Ensure URL cannot specify some other unintended file in the extPath
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
    $.svgIcons(curConfig.imgPath + 'svg_edit_icons.svg', {
      w: 24,
      h: 24,
      id_match: false,
      no_img: !svgedit.browser.isWebkit(), // Opera & Firefox 4 gives odd behavior w/images
      fallback_path: curConfig.imgPath,
      fallback: {
        'new_image': 'clear.png',
        'save': 'save.png',
        'open': 'open.png',
        'source': 'source.png',
        'docprops': 'document-properties.png',
        'wireframe': 'wireframe.png',

        'undo': 'undo.png',
        'redo': 'redo.png',

        'select': 'select.png',
        'select_node': 'select_node.png',
        'pencil': 'fhpath.png',
        'pen': 'line.png',
        'square': 'square.png',
        'rect': 'rect.png',
        'fh_rect': 'freehand-square.png',
        'circle': 'circle.png',
        'ellipse': 'ellipse.png',
        'fh_ellipse': 'freehand-circle.png',
        'path': 'path.png',
        'text': 'text.png',
        'image': 'image.png',
        'zoom': 'zoom.png',

        'clone': 'clone.png',
        'node_clone': 'node_clone.png',
        'delete': 'delete.png',
        'node_delete': 'node_delete.png',
        'group': 'shape_group_elements.png',
        'ungroup': 'shape_ungroup.png',
        'move_top': 'move_top.png',
        'move_bottom': 'move_bottom.png',
        'to_path': 'to_path.png',
        'link_controls': 'link_controls.png',
        'reorient': 'reorient.png',

        'align_left': 'align-left.png',
        'align_center': 'align-center.png',
        'align_right': 'align-right.png',
        'align_top': 'align-top.png',
        'align_middle': 'align-middle.png',
        'align_bottom': 'align-bottom.png',

        'go_up': 'go-up.png',
        'go_down': 'go-down.png',

        'ok': 'save.png',
        'cancel': 'cancel.png',

        'arrow_right': 'flyouth.png',
        'arrow_down': 'dropdown.gif'
      },
      placement: {
        '#logo': 'logo',

        '#tool_clear div': 'new_image',
        '#tool_save div': 'save',
        '#tool_export div': 'export',
        '#tool_open div div': 'open',
        '#tool_import div div': 'import',
        '#tool_source': 'source',
        '#tool_docprops > div': 'docprops',
        '#tool_wireframe': 'wireframe',

        '#tool_undo': 'undo',
        '#tool_redo': 'redo',

        '#tool_select': 'select',
        '#tool_fhpath': 'pencil',
        '#tool_line': 'pen',
        '#tool_rect,#tools_rect_show': 'rect',
        '#tool_square': 'square',
        '#tool_fhrect': 'fh_rect',
        '#tool_ellipse,#tools_ellipse_show': 'ellipse',
        '#tool_circle': 'circle',
        '#tool_fhellipse': 'fh_ellipse',
        '#tool_path': 'path',
        '#tool_text': 'text',
        '#tool_image': 'image',
        '#tool_zoom': 'zoom',

        '#tool_clone,#tool_clone_multi': 'clone',
        '#tool_node_clone': 'node_clone',
        '#tool_delete,#tool_delete_multi': 'delete',
        '#tool_node_delete': 'node_delete',
        '#tool_add_subpath': 'add_subpath',
        '#tool_openclose_path': 'open_path',
        '#tool_move_top': 'move_top',
        '#tool_move_bottom': 'move_bottom',
        '#tool_topath': 'to_path',
        '#tool_node_link': 'link_controls',
        '#tool_reorient': 'reorient',
        '#tool_group_elements': 'group_elements',
        '#tool_ungroup': 'ungroup',
        '#tool_unlink_use': 'unlink_use',

        '#tool_alignleft, #tool_posleft': 'align_left',
        '#tool_aligncenter, #tool_poscenter': 'align_center',
        '#tool_alignright, #tool_posright': 'align_right',
        '#tool_aligntop, #tool_postop': 'align_top',
        '#tool_alignmiddle, #tool_posmiddle': 'align_middle',
        '#tool_alignbottom, #tool_posbottom': 'align_bottom',
        '#cur_position': 'align',

        '#linecap_butt,#cur_linecap': 'linecap_butt',
        '#linecap_round': 'linecap_round',
        '#linecap_square': 'linecap_square',

        '#linejoin_miter,#cur_linejoin': 'linejoin_miter',
        '#linejoin_round': 'linejoin_round',
        '#linejoin_bevel': 'linejoin_bevel',

        '#url_notice': 'warning',

        '#tool_source_save,#tool_docprops_save,#tool_prefs_save': 'ok',
        '#tool_source_cancel,#tool_docprops_cancel,#tool_prefs_cancel': 'cancel',

        '#rwidthLabel, #iwidthLabel': 'width',
        '#rheightLabel, #iheightLabel': 'height',
        '#cornerRadiusLabel span': 'c_radius',
        '#angleLabel': 'angle',
        '#linkLabel,#tool_make_link,#tool_make_link_multi': 'globe_link',
        '#zoomLabel': 'zoom',
        '#tool_fill label': 'fill',
        '#tool_stroke .icon_label': 'stroke',
        '#group_opacityLabel': 'opacity',
        '#blurLabel': 'blur',
        '#font_sizeLabel': 'fontsize',

        '.flyout_arrow_horiz': 'arrow_right',
        '.dropdown button, #main_button .dropdown': 'arrow_down',
        '#palette .palette_item:first, #fill_bg, #stroke_bg': 'no_color'
      },
      resize: {
        '#logo .svg_icon': 28,
        '.flyout_arrow_horiz .svg_icon': 5,
        '.layer_button .svg_icon, #layerlist .svg_icon': 14,
        '.dropdown button .svg_icon': 7,
        '#main_button .dropdown .svg_icon': 9,
        '.palette_item:first .svg_icon': 15,
        '#fill_bg .svg_icon, #stroke_bg .svg_icon': 16,
        '.toolbar_button button .svg_icon': 16,
        '.stroke_tool div div .svg_icon': 20,
        '#tools_bottom label .svg_icon': 18
      },
      callback: function (icons) {
        $('.toolbar_button button > svg, .toolbar_button button > img').each(function () {
          $(this).parent().prepend(this);
        });

        var min_height,
          tleft = $('#tools_left');
        if (tleft.length !== 0) {
          min_height = tleft.offset().top + tleft.outerHeight();
        }

        var size = $.pref('iconsize');
        editor.setIconSize(size || ($(window).height() < min_height ? 's' : 'm'));

        // Look for any missing flyout icons from plugins
        $('.tools_flyout').each(function () {
          var shower = $('#' + this.id + '_show');
          var sel = shower.attr('data-curopt');
          // Check if there's an icon here
          if (!shower.children('svg, img').length) {
            var clone = $(sel).children().clone();
            if (clone.length) {
              clone[0].removeAttribute('style'); //Needed for Opera
              shower.append(clone);
            }
          }
        });

        editor.runCallbacks();

        setTimeout(function () {
          $('.flyout_arrow_horiz:empty').each(function () {
            $(this).append($.getSvgIcon('arrow_right').width(5).height(5));
          });
        }, 1);
      }
    });

    window['svgCanvas'] = editor.canvas = svgCanvas = new $.SvgCanvas(document.getElementById('svgcanvas'), curConfig);
    OpenBottomBoundaryDrawer.update();
    var supportsNonSS, resize_timer, Actions, curScrollPos,
      palette = [ // Todo: Make into configuration item?
        '#000000', '#3f3f3f', '#7f7f7f', '#bfbfbf', '#ffffff',
        '#ff0000', '#ff7f00', '#ffff00', '#7fff00',
        '#00ff00', '#00ff7f', '#00ffff', '#007fff',
        '#0000ff', '#7f00ff', '#ff00ff', '#ff007f',
        '#7f0000', '#7f3f00', '#7f7f00', '#3f7f00',
        '#007f00', '#007f3f', '#007f7f', '#003f7f',
        '#00007f', '#3f007f', '#7f007f', '#7f003f',
        '#ffaaaa', '#ffd4aa', '#ffffaa', '#d4ffaa',
        '#aaffaa', '#aaffd4', '#aaffff', '#aad4ff',
        '#aaaaff', '#d4aaff', '#ffaaff', '#ffaad4'
      ],
      modKey = (svgedit.browser.isMac() ? 'meta+' : 'ctrl+'), // ⌘
      path = svgCanvas.pathActions,
      undoMgr = svgCanvas.undoMgr,
      defaultImageURL = curConfig.imgPath + 'logo.png',
      workarea = $('#workarea'),
      canv_menu = $('#cmenu_canvas'),
      // layer_menu = $('#cmenu_layers'), // Unused
      exportWindow = null,
      zoomInIcon = 'crosshair',
      zoomOutIcon = 'crosshair',
      ui_context = 'toolbars',
      origSource = '',
      paintBox = {
        fill: null,
        stroke: null
      };

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
        } catch (e) { console.log(e); }
      }
    })();

    // This sets up alternative dialog boxes. They mostly work the same way as
    // their UI counterparts, expect instead of returning the result, a callback
    // needs to be included that returns the result as its first parameter.
    // In the future we may want to add additional types of dialog boxes, since
    // they should be easy to handle this way.
    (function () {
      $('#dialog_container').draggable({
        cancel: '#dialog_content, #dialog_buttons *',
        containment: 'window'
      });
      var box = $('#dialog_box'),
        btn_holder = $('#dialog_buttons'),
        dialog_content = $('#dialog_content'),
        dbox = function (type, msg?, callback?, defaultVal?, opts?, changeCb?, checkbox?) {
          var ok, ctrl, chkbx;
          dialog_content.html('<p>' + msg.replace(/\n/g, '</p><p>') + '</p>')
            .toggleClass('prompt', (type === 'prompt'));
          btn_holder.empty();

          ok = $('<input type="button" value="' + uiStrings.common.ok + '">').appendTo(btn_holder);

          if (type !== 'alert') {
            $('<input type="button" value="' + uiStrings.common.cancel + '">')
              .appendTo(btn_holder)
              .click(function () {
                box.hide();
                if (callback) {
                  callback(false);
                }
              });
          }

          if (type === 'prompt') {
            ctrl = $('<input type="text">').prependTo(btn_holder);
            ctrl.val(defaultVal || '');
            ctrl.bind('keydown', 'return', function () {
              ok.click();
            });
          } else if (type === 'select') {
            var div = $('<div style="text-align:center;">');
            ctrl = $('<select>').appendTo(div);
            if (checkbox) {
              var label = $('<label>').text(checkbox.label);
              chkbx = $('<input type="checkbox">').appendTo(label);
              chkbx.val(checkbox.value);
              if (checkbox.tooltip) {
                label.attr('title', checkbox.tooltip);
              }
              chkbx.prop('checked', !!checkbox.checked);
              div.append($('<div>').append(label));
            }
            $.each(opts || [], function (opt, val) {
              if (typeof val === 'object') {
                ctrl.append($('<option>').val(val.value).html(val.text));
              } else {
                ctrl.append($('<option>').html(val));
              }
            });
            dialog_content.append(div);
            if (defaultVal) {
              ctrl.val(defaultVal);
            }
            if (changeCb) {
              ctrl.bind('change', 'return', changeCb);
            }
            ctrl.bind('keydown', 'return', function () {
              ok.click();
            });
          } else if (type === 'process') {
            ok.hide();
          }

          box.show();

          ok.click(function () {
            box.hide();
            var resp = (type === 'prompt' || type === 'select') ? ctrl.val() : true;
            if (callback) {
              if (chkbx) {
                callback(resp, chkbx.prop('checked'));
              } else {
                callback(resp);
              }
            }
          }).focus();

          if (type === 'prompt' || type === 'select') {
            ctrl.focus();
          }
        };

      $.alert = function (msg, cb) {
        dbox('alert', msg, cb);
      };
      $.confirm = function (msg, cb) {
        dbox('confirm', msg, cb);
      };
      $.process_cancel = function (msg, cb) {
        dbox('process', msg, cb);
      };
      $.prompt = function (msg, txt, cb) {
        dbox('prompt', msg, cb, txt);
      };
      $.select = function (msg, opts, cb, changeCb, txt, checkbox) {
        dbox('select', msg, cb, txt, opts, changeCb, checkbox);
      };
    })();

    var setSelectMode = function () {
      var curr = $('.tool_button_current');
      if (curr.length && curr[0].id !== 'tool_select') {
        curr.removeClass('tool_button_current').addClass('tool_button');
        $('#tool_select').addClass('tool_button_current').removeClass('tool_button');
        //$('#styleoverrides').text('#svgcanvas svg *{cursor:move;pointer-events:all} #svgcanvas svg{cursor:default}');
      }
      svgCanvas.setMode('select');
      workarea.css('cursor', 'auto');
      if (PreviewModeController.isPreviewMode() || TopBarController.getTopBarPreviewMode()) {
        $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');
      }
    };

    // used to make the flyouts stay on the screen longer the very first time
    // var flyoutspeed = 1250; // Currently unused
    var textBeingEntered = false;
    var selectedElement = null;
    var multiselected = false;
    var editingsource = false;
    var docprops = false;
    var preferences = false;
    var cur_context = '';
    var origTitle = $('title:first').text();

    const displayChangeLayerBlock = function (maybeVisible) {
      const block = $('.selLayerBlock');

      const isHide = (function () {
        if (!maybeVisible) { return true; }
        if (svgCanvas.getCurrentDrawing().getNumLayers() <= 1) { return true; }

        if (multiselected) { return false; }
        if (selectedElement) { return false; }

        if (!(multiselected && selectedElement)) { return true; }

        return true;
      })();

      if (isHide) {
        $('#sidepanels').removeClass('layerblock-activated');
        block.hide();
      } else {
        $('#sidepanels').addClass('layerblock-activated');
        block.show();
      }
    };

    // This function highlights the layer passed in (by fading out the other layers)
    // if no layer is passed in, this function restores the other layers
    var toggleHighlightLayer = function (layerNameToHighlight) {
      var i, curNames = [],
        numLayers = svgCanvas.getCurrentDrawing().getNumLayers();
      for (i = 0; i < numLayers; i++) {
        curNames[i] = svgCanvas.getCurrentDrawing().getLayerName(i);
      }

      if (layerNameToHighlight) {
        for (i = 0; i < numLayers; ++i) {
          if (curNames[i] !== layerNameToHighlight) {
            svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 0.5);
          }
        }
      } else {
        for (i = 0; i < numLayers; ++i) {
          svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 1.0);
        }
      }
    };

    var showSourceEditor = function (e, forSaving) {
      if (editingsource) {
        return;
      }

      editingsource = true;
      origSource = svgCanvas.getSvgString();
      $('#save_output_btns').toggle(!!forSaving);
      $('#tool_source_back').toggle(!forSaving);
      $('#svg_source_textarea').val(origSource);
      $('#svg_source_editor').fadeIn();
      $('#svg_source_textarea').focus();
    };

    var togglePathEditMode = function (editmode, elems) {
      $('#path_node_panel').toggle(editmode);
      $('#tools_bottom_2,#tools_bottom_3').toggle(!editmode);
      if (editmode) {
        // Change select icon
        $('.tool_button_current').removeClass('tool_button_current').addClass('tool_button');
        $('#tool_select').addClass('tool_button_current').removeClass('tool_button');
        setIcon('#tool_select', 'select_node');
        multiselected = false;
        if (elems.length) {
          selectedElement = elems[0];
        }
      } else {
        setTimeout(function () {
          setIcon('#tool_select', 'select');
        }, 1000);
      }
    };

    var saveHandler = function (wind, svg) {
      editor.showSaveWarning = false;

      // by default, we add the XML prolog back, systems integrating SVG-edit (wikis, CMSs)
      // can just provide their own custom save handler and might not want the XML prolog
      svg = '<?xml version="1.0"?>\n' + svg;

      // IE9 doesn't allow standalone Data URLs
      // https://connect.microsoft.com/IE/feedback/details/542600/data-uri-images-fail-when-loaded-by-themselves
      if (svgedit.browser.isIE()) {
        showSourceEditor(0, true);
        return;
      }

      // Opens the SVG in new window
      var win = wind.open('data:image/svg+xml;base64,' + Utils.encode64(svg));

      // Alert will only appear the first time saved OR the first time the bug is encountered
      var done = $.pref('save_notice_done');
      if (done !== 'all') {
        var note = uiStrings.notification.saveFromBrowser.replace('%s', 'SVG');

        // Check if FF and has <defs/>
        if (svgedit.browser.isGecko()) {
          if (svg.indexOf('<defs') !== -1) {
            // warning about Mozilla bug #308590 when applicable (seems to be fixed now in Feb 2013)
            note += '\n\n' + uiStrings.notification.defsFailOnSave;
            $.pref('save_notice_done', 'all');
            done = 'all';
          } else {
            $.pref('save_notice_done', 'part');
          }
        } else {
          $.pref('save_notice_done', 'all');
        }
        if (done !== 'part') {
          win.alert(note);
        }
      }
    };

    var exportHandler = function (win, data) {
      var issues = data.issues,
        exportWindowName = data.exportWindowName;

      if (exportWindowName) {
        exportWindow = window.open('', exportWindowName); // A hack to get the window via JSON-able name without opening a new one
      }

      exportWindow.location.href = data.datauri;
      var done = $.pref('export_notice_done');
      if (done !== 'all') {
        var note = uiStrings.notification.saveFromBrowser.replace('%s', data.type);

        // Check if there's issues
        if (issues.length) {
          var pre = '\n \u2022 ';
          note += ('\n\n' + uiStrings.notification.noteTheseIssues + pre + issues.join(pre));
        }

        // Note that this will also prevent the notice even though new issues may appear later.
        // May want to find a way to deal with that without annoying the user
        $.pref('export_notice_done', 'all');
        exportWindow.alert(note);
      }
    };

    function setStrokeOpt(opt, changeElem?: boolean) {
      var id = opt.id;
      var bits = id.split('_');
      var pre = bits[0];
      var val = bits[1];

      if (changeElem) {
        svgCanvas.setStrokeAttr('stroke-' + pre, val);
      }
      setIcon('#cur_' + pre, id);
      $(opt).addClass('current').siblings().removeClass('current');
    }

    // This is a common function used when a tool has been clicked (chosen)
    // It does several common things:
    // - removes the tool_button_current class from whatever tool currently has it
    // - hides any flyouts
    // - adds the tool_button_current class to the button passed in
    var toolButtonClick = editor.toolButtonClick = function (button, noHiding?: boolean) {
      if ($(button).hasClass('disabled')) {
        return false;
      }
      if ($(button).parent().hasClass('tools_flyout')) {
        return true;
      }
      var fadeFlyouts = 'normal';
      if (!noHiding) {
        $('.tools_flyout').fadeOut(fadeFlyouts);
      }
      $('#styleoverrides').text('');
      workarea.css('cursor', 'auto');
      $('.tool_button_current').removeClass('tool_button_current').addClass('tool_button');
      $(button).addClass('tool_button_current').removeClass('tool_button');
      return true;
    };

    var clickSelect = editor.clickSelect = function (clearSelection: boolean = true) {
      if ([TutorialConstants.DRAW_A_CIRCLE, TutorialConstants.DRAW_A_RECT].includes(getNextStepRequirement())) {
        return;
      }
      if (toolButtonClick('#tool_select')) {
        svgCanvas.setMode('select');
        $('#styleoverrides').text('#svgcanvas svg *:not(#previewBoundary *){cursor:move;pointer-events:all;stroke-width:1px;vector-effect:non-scaling-stroke;}, #svgcanvas svg{cursor:default}');
      }
      if (clearSelection) svgCanvas.clearSelection();
    };

    var setImageURL = editor.setImageURL = function (url) {
      if (!url) {
        url = defaultImageURL;
      }
      svgCanvas.setImageURL(url);
      $('#image_url').val(url);

      if (url.indexOf('data:') === 0) {
        // data URI found
        $('#image_url').hide();
        $('#change_image_url').show();
      } else {
        // regular URL
        svgCanvas.embedImage(url, function (dataURI) {
          // Couldn't embed, so show warning
          $('#url_notice').toggle(!dataURI);
          defaultImageURL = url;
        });
        $('#image_url').show();
        $('#change_image_url').hide();
      }
    };

    function setBackground(color, url) {
      // if (color == $.pref('bkgd_color') && url == $.pref('bkgd_url')) {return;}
      $.pref('bkgd_color', color);
      $.pref('bkgd_url', url);

      // This should be done in svgcanvas.js for the borderRect fill
      svgCanvas.setBackground(color, url);
    }

    function promptImgURL() {
      var curhref = svgCanvas.getHref(selectedElement);
      curhref = curhref.indexOf('data:') === 0 ? '' : curhref;
      $.prompt(uiStrings.notification.enterNewImgURL, curhref, function (url) {
        if (url) {
          setImageURL(url);
        }
      });
    }

    var setInputWidth = function (elem) {
      var w = Math.min(Math.max(12 + elem.value.length * 6, 50), 300);
      $(elem).width(w);
    };

    function updateRulers() {
      // draw x ruler then y ruler
      /* 這裡code很亂 值得注意的點有：
          1. ruler的位置由css下 如top和margin
          2. 當超過limit時 會畫很多個canvas 因瀏覽器canvas不能畫太長 (大約30000px) 第一個canvas畫不下時就比第二個canvas拿出來繼續畫
          3. 上述這些canvas根據css margin排列 因某種神秘原因ruler_y的canvas要加上margin-top:-3px
      */
      const unit = storage.get('default-units');

      function updateRuler(axis: string) {
        // axis = x or y
        const isX = (axis === 'x');
        const side = isX ? 'width' : 'height';
        const otherSide = isX ? 'height' : 'width';

        const $rulersWrapper = $('#ruler_' + axis + ' > div');
        const total_len = $('#svgcanvas')[side]();
        const limit = 3000;
        const rulersCount = parseInt(String(total_len / limit), 10) + 1;


        $rulersWrapper.empty();
        $rulersWrapper[side](total_len + 'px');

        const rulers = (new Array(rulersCount))
          .fill(null)
          .map(x => document.createElement('canvas'));
        (function generateEmptyCanvas() {
          const devicePixelRatio = window.devicePixelRatio; // Retina support
          rulers.map((ruler, index) => {
            if (index > 0) {
              if (isX) {
                $(ruler).css('margin-left', 0);
              } else {
                $(ruler).css('margin-top', -3); //magic number
              }
            }
            return ruler;
          }).map((ruler, index) => {
            const lastIndex = rulersCount - 1;
            if (index < lastIndex) {
              ruler[side] = limit;
            } else {
              ruler[side] = total_len % limit;
            }
            return ruler;
          }).map((ruler) => {
            //support retina
            const isRetina = (devicePixelRatio > 1);
            if (isRetina) {
              const ruler_len = ruler[side];

              ruler.style[side] = ruler_len + 'px';
              ruler[side] = ruler_len * devicePixelRatio;

              ruler.style[otherSide] = 15 + 'px';
              ruler[otherSide] = 15 * devicePixelRatio;

              ruler.getContext('2d').scale(devicePixelRatio, devicePixelRatio);
            }
            return ruler;
          }).map((ruler) => {
            $rulersWrapper.append(ruler);
            return ruler;
          });
        })();

        (function drawRules() {
          const contentPosition = Number($('#svgcontent').attr(axis));
          const zoom = svgCanvas.getZoom();

          const ctxs = rulers
            .map(ruler => ruler.getContext('2d'))
            .map(ctx => {
              ctx.fillStyle = '#333';
              ctx.strokeStyle = '#000';
              ctx.font = '12px sans-serif';
              return ctx;
            });

          // Calculate the main number calibration in pixel
          const calibration = (function () {
            const size = 100 / (zoom * (unit === 'inches' ? 25.4 : 1));
            const digit = Math.ceil(Math.log10(size));
            const intervals = [2, 5, 10].map(x => x * 10 ** (digit - 1));
            const interval = intervals.find(x => x >= size);
            return interval;
          })() * (unit === 'inches' ? 25.4 : 1);

          const big_interval = calibration * zoom;
          const small_interval = big_interval / 10;

          let currentCtxIndex = 0;
          let ctx = ctxs[currentCtxIndex];

          // position correspond to root
          let label_pos = ((contentPosition / zoom) % calibration) * zoom;
          // position correspond to ruler
          let ruler_pos = label_pos;

          drawAll:
          while (label_pos < total_len) {

            //draw the big intervals
            //draw line
            const cur_d = Math.round(ruler_pos) + 0.5;
            if (isX) {
              ctx.moveTo(cur_d, 15);
              ctx.lineTo(cur_d, 0);
            } else {
              ctx.moveTo(15, cur_d);
              ctx.lineTo(0, cur_d);
            }
            //draw big label
            let label;
            const labelNum = (label_pos - contentPosition) / (zoom * 10 * (unit === 'inches' ? 25.4 : 1));
            if ((calibration / (unit === 'inches' ? 25.4 : 1)) >= 10) {
              label = Math.round(labelNum);
            } else {
              var decimalPlace = String(calibration / 10).split('.')[1].length;
              label = labelNum.toFixed(decimalPlace);
            }

            // Change 1000s to Ks
            if (label !== 0 && label !== 1000 && label % 1000 === 0) {
              label = (label / 1000) + 'K';
            }

            if (isX) {
              ctx.fillText(label, ruler_pos + 2, 10);
            } else {
              // draw label vertically
              const str = String(label).split('');
              let i;
              for (i = 0; i < str.length; i++) {
                if (str[i] === '.') {
                  break;
                }
                ctx.textAlign = 'center';
                ctx.fillText(str[i], 5, (ruler_pos + 12) + i * 12);
              }
              if (i < str.length) {
                ctx.textAlign = 'left';
                ctx.fillText('.', 5, ruler_pos + 12 + i * 12 - 8);
                i++;
                for (; i < str.length; i++) {
                  ctx.textAlign = 'center';
                  ctx.fillText(str[i], 5, ruler_pos + 12 + i * 12 - 8);
                }
              }
            }

            // draw the small intervals
            for (let i = 1; i < 10; i++) {
              let sub_d = Math.round(ruler_pos + small_interval * i) + 0.5;

              // maybe switch to next canvas to continue drawing
              if (sub_d > limit) {
                if (currentCtxIndex === rulersCount - 1) {
                  // end of all drawing
                  break drawAll;
                }
                currentCtxIndex++;
                ctx = ctxs[currentCtxIndex];
                ruler_pos -= limit;
                sub_d -= limit;
              }

              // odd lines are slighly longer
              const line_size = (i % 2) ? 12 : 10;
              if (isX) {
                ctx.moveTo(sub_d, 15);
                ctx.lineTo(sub_d, line_size);
              } else {
                ctx.moveTo(15, sub_d);
                ctx.lineTo(line_size, sub_d);
              }
            }
            label_pos += big_interval;
            ruler_pos += big_interval;
          }
          ctxs.map(ctx => ctx.stroke());

        })();
      }
      updateRuler('x');
      updateRuler('y');
      const workArea = document.getElementById('workarea');
      if (workArea) {
        const rulerX = document.getElementById('ruler_x');
        const rulerY = document.getElementById('ruler_y');
        if (rulerX) {
          rulerX.scrollLeft = workArea.scrollLeft;
        }
        if (rulerY) {
          rulerY.scrollTop = workArea.scrollTop - workArea.offsetTop;
        }
      }
    }
    editor.updateRulers = updateRulers;


    var updateCanvas = editor.updateCanvas = function (zoomData?: {
      autoCenter?: boolean,
      staticPoint?: { x: number, y: number }
    }) {
      let autoCenter = zoomData ? zoomData.autoCenter : undefined;
      const staticPoint = zoomData ? zoomData.staticPoint : null;
      const w_orig = workarea.width(),
        h_orig = workarea.height(); //固定的工作區大小 只跟視窗大小有關 目前為全視窗
      var zoom = svgCanvas.getZoom(); //1 for 100%, 0.5 for 50%
      var cnvs = $('#svgcanvas');

      const old_scroll = {
        left: workarea.scrollLeft(),
        top: workarea.scrollTop()
      };

      var multi = curConfig.canvas_expansion;
      const w = Math.max(w_orig, svgCanvas.contentW * zoom * multi);
      const h = Math.max(h_orig, svgCanvas.contentH * zoom * multi);

      if ((w_orig >= svgCanvas.contentW * zoom * multi) || (h_orig >= svgCanvas.contentH * zoom * multi)) {
        autoCenter = true;
      }

      const old_canvas_width = cnvs.width();
      cnvs.width(w).height(h);
      const new_canvas_width = cnvs.width();

      svgCanvas.updateCanvas(w, h);

      const zoomRatio = new_canvas_width / old_canvas_width;

      function _scrollToMakeItCenter(workarea, svgcanvas) {
        workarea.scrollLeft(svgcanvas.width() / 2 - workarea.width() / 2 - 124);
        workarea.scrollTop(svgcanvas.height() / 2 - workarea.height() / 2 - 85);
      }

      function _scrollToMakePointStatic(workarea, staticPoint, zoomRatio, old_scroll) {
        const left_cvs = old_scroll.left + staticPoint.x; //related to canvas
        const newScrollLeft = left_cvs * zoomRatio - staticPoint.x;
        workarea.scrollLeft(newScrollLeft);

        const top_cvs = old_scroll.top + staticPoint.y; //related to canvas
        const newScrollTop = top_cvs * zoomRatio - staticPoint.y;
        workarea.scrollTop(newScrollTop);
      }

      if (autoCenter) {
        _scrollToMakeItCenter(workarea, cnvs);
      } else if (staticPoint) {
        _scrollToMakePointStatic(workarea, staticPoint, zoomRatio, old_scroll);
      }
      const shouldShowRulers = !!BeamboxPreference.read('show_rulers');
      if (shouldShowRulers) {
        updateRulers();
      }
    };

    var updateToolButtonState = function () {
      var index, button;
      var bNoFill = (svgCanvas.getColor('fill') === 'none');
      var bNoStroke = (svgCanvas.getColor('stroke') === 'none');
      var buttonsNeedingStroke = ['#tool_fhpath', '#tool_line'];
      var buttonsNeedingFillAndStroke = ['#tools_rect .tool_button', '#tools_ellipse .tool_button', '#tool_text', '#tool_path'];
      if (bNoStroke) {
        buttonsNeedingStroke.map(btn => {
          if ($(btn).hasClass('tool_button_current')) {
            clickSelect();
          }
          $(btn).addClass('disabled');
        });
      } else {
        buttonsNeedingStroke.map(btn => {
          $(btn).removeClass('disabled');
        });
      }

      if (bNoStroke && bNoFill) {
        buttonsNeedingFillAndStroke.map(btn => {
          if ($(btn).hasClass('tool_button_current')) {
            clickSelect();
          }
          $(btn).addClass('disabled');
        });
      } else {
        buttonsNeedingFillAndStroke.map(btn => {
          $(btn).removeClass('disabled');
        });
      }

      svgCanvas.runExtensions('toolButtonStateUpdate', {
        nofill: bNoFill,
        nostroke: bNoStroke
      });

      // Disable flyouts if all inside are disabled
      $('.tools_flyout').each(function () {
        var shower = $('#' + this.id + '_show');
        var has_enabled = false;
        $(this).children().each(function () {
          if (!$(this).hasClass('disabled')) {
            has_enabled = true;
          }
        });
        shower.toggleClass('disabled', !has_enabled);
      });

    };

    // Updates the toolbar (colors, opacity, etc) based on the selected element
    // This function also updates the opacity and id elements that are in the context panel
    var updateToolbar = function () {
      var i, len;
      if (selectedElement != null) {
        switch (selectedElement.tagName) {
          case 'text':
          case 'use':
          case 'image':
          case 'foreignObject':
            break;
          case 'g':
          case 'a':
            // Look for common styles
            var gWidth = null;
            var childs = selectedElement.getElementsByTagName('*');
            for (i = 0, len = childs.length; i < len; i++) {
              var swidth = childs[i].getAttribute('stroke-width');

              if (i === 0) {
                gWidth = swidth;
              } else if (gWidth !== swidth) {
                gWidth = null;
              }
            }

            $('#stroke_width').val(gWidth === null ? '' : gWidth);

            paintBox.fill.update(true);
            paintBox.stroke.update(true);

            break;
          default:
            paintBox.fill.update(true);
            paintBox.stroke.update(true);

            $('#stroke_width').val(selectedElement.getAttribute('stroke-width') || 1);
            $('#stroke_style').val(selectedElement.getAttribute('stroke-dasharray') || 'none');

            var attr = selectedElement.getAttribute('stroke-linejoin') || 'miter';

            if ($('#linejoin_' + attr).length !== 0) {
              setStrokeOpt($('#linejoin_' + attr)[0]);
            }

            attr = selectedElement.getAttribute('stroke-linecap') || 'butt';

            if ($('#linecap_' + attr).length !== 0) {
              setStrokeOpt($('#linecap_' + attr)[0]);
            }
        }
      }

      // All elements including image and group have opacity
      if (selectedElement != null) {
        var opac_perc = ((selectedElement.getAttribute('opacity') || 1.0) * 100);
        $('#group_opacity').val(opac_perc);
        $('#opac_slider').slider('option', 'value', opac_perc);
        $('#elem_id').val(selectedElement.id);
        $('#elem_class').val(selectedElement.getAttribute('class'));
      }

      updateToolButtonState();
    };

    // updates the context panel tools based on the selected element
    var updateContextPanel = function () {
      var elem = selectedElement;
      // If element has just been deleted, consider it null
      if (elem != null && !elem.parentNode) {
        elem = null;
      }
      var currentLayerName = svgCanvas.getCurrentDrawing().getCurrentLayerName();
      var currentMode = svgCanvas.getMode();
      var unit = curConfig.baseUnit !== 'px' ? curConfig.baseUnit : null;

      var is_node = currentMode === 'pathedit'; //elem ? (elem.id && elem.id.indexOf('pathpointgrip') == 0) : false;
      if (is_node) {
        RightPanelController.toPathEditMode();
        // RightPanelController.setSelectedElement(null);
        TopBarController.setElement(null);
      } else {
        RightPanelController.toElementMode();
        RightPanelController.setSelectedElement(elem);
        TopBarController.setElement(elem);
      }
      LayerPanelController.updateLayerPanel();
      var menu_items = $('#cmenu_canvas li');
      /*
      $('#selected_panel, #multiselected_panel, #g_panel, #rect_panel, #circle_panel,' +
      '#ellipse_panel, #line_panel, #text_panel, #image_panel, #container_panel,' +
      ' #use_panel, #a_panel').hide();
      */
      if (elem != null) {
        var elname = elem.nodeName;
        // If this is a link with no transform and one child, pretend
        // its child is selected
        //					if (elname === 'a') { // && !$(elem).attr('transform')) {
        //						elem = elem.firstChild;
        //					}

        var angle = svgCanvas.getRotationAngle(elem);
        $('#angle').val(angle);
        ObjectPanelController.updateDimensionValues({ rotation: angle });

        var blurval = svgCanvas.getBlur(elem);
        $('#blur').val(blurval);
        $('#blur_slider').slider('option', 'value', blurval);

        if (svgCanvas.addedNew) {
          if (elname === 'image' && svgCanvas.getMode() === 'image') {
            // Prompt for URL if not a data URL
            if (svgCanvas.getHref(elem).indexOf('data:') !== 0) {
              promptImgURL();
            }
          }
          /*else if (elname === 'text') {
                  // TODO: Do something here for new text
              }*/
        }

        if (!is_node && currentMode !== 'pathedit') {
          //$('#selected_panel').show();
          // Elements in this array already have coord fields
          if (['line', 'circle', 'ellipse'].indexOf(elname) >= 0) {
            $('#xy_panel').hide();
          } else {
            var x, y;

            // Get BBox vals for g, polyline and path
            if (['g', 'polyline', 'path', 'polygon'].indexOf(elname) >= 0) {
              var bb = svgCanvas.getStrokedBBox([elem]);
              if (bb) {
                x = bb.x;
                y = bb.y;
                if (elname !== 'polyline') {
                  let bbox = elem.getBBox();
                  ObjectPanelController.updateDimensionValues({
                    width: bbox.width,
                    height: bbox.height
                  });
                }
              }
            } else if (['text'].includes(elname)) {
              const bb = svgCanvas.calculateTransformedBBox(elem);
              x = bb.x;
              y = bb.y;
              ObjectPanelController.updateDimensionValues({
                width: bb.width,
                height: bb.height
              });
            } else {
              x = elem.getAttribute('x');
              y = elem.getAttribute('y');
            }

            if (unit) {
              x = svgedit.units.convertUnit(x);
              y = svgedit.units.convertUnit(y);
            }

            $('#selected_x').val(x || 0);
            $('#selected_y').val(y || 0);
            $('#xy_panel').show();
            ObjectPanelController.updateDimensionValues({
              x: parseFloat(x) || 0,
              y: parseFloat(y) || 0
            });
          }

          // Elements in this array cannot be converted to a path
          var no_path = ['image', 'text', 'path', 'g', 'use'].indexOf(elname) === -1;
          $('#tool_topath').toggle(no_path);
          $('#tool_reorient').toggle(elname === 'path');
          $('#tool_reorient').toggleClass('disabled', angle === 0);
        } else {
          var point = path.getNodePoint();
          $('#tool_add_subpath').removeClass('push_button_pressed').addClass('tool_button');
          $('#tool_node_delete').toggleClass('disabled', !path.canDeleteNodes);

          // Show open/close button based on selected point
          setIcon('#tool_openclose_path', path.closed_subpath ? 'open_path' : 'close_path');

          if (point) {
            var seg_type = $('#seg_type');
            if (unit) {
              point.x = svgedit.units.convertUnit(point.x);
              point.y = svgedit.units.convertUnit(point.y);
            }
            $('#path_node_x').val(point.x);
            $('#path_node_y').val(point.y);
            if (point.type) {
              seg_type.val(point.type).removeAttr('disabled');
            } else {
              seg_type.val(4).attr('disabled', 'disabled');
            }
          }
          return;
        }

        // update contextual tools here
        var panels = {
          g: [],
          a: [],
          rect: ['rx', 'width', 'height'],
          image: ['width', 'height'],
          circle: ['cx', 'cy', 'r'],
          ellipse: ['cx', 'cy', 'rx', 'ry'],
          line: ['x1', 'y1', 'x2', 'y2'],
          path: [],
          polygon: [],
          text: [],
          use: []
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

        // Hide/show the make_link buttons
        $('#tool_make_link, #tool_make_link').toggle(!link_href);

        if (link_href) {
            $('#link_url').val(link_href);
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
              $('#text_panel').css('display', 'inline');
              $('#tool_font_size').css('display', 'inline');
              if (svgCanvas.getItalic()) {
                $('#tool_italic').addClass('push_button_pressed').removeClass('tool_button');
              } else {
                $('#tool_italic').removeClass('push_button_pressed').addClass('tool_button');
              }
              if (svgCanvas.getBold()) {
                $('#tool_bold').addClass('push_button_pressed').removeClass('tool_button');
              } else {
                $('#tool_bold').removeClass('push_button_pressed').addClass('tool_button');
              }
              // TODO: Check the elem type if it's really svg text element
              const textElem: SVGTextElement = elem;
              $('#font_size').val(elem.getAttribute('font-size'));
              let multiLineTextContent = Array.from(textElem.childNodes).map(child => child.textContent).join('\x0b');
              const textInput = document.getElementById('text') as HTMLInputElement;
              textInput.value = multiLineTextContent;
              if (svgCanvas.addedNew) {
                // Timeout needed for IE9
                setTimeout(function () {
                  $('#text').focus().select();
                }, 100);
              }
              svgCanvas.textActions.setIsVertical((elem.getAttribute('data-verti') === 'true'));
              break;
            case 'image':
              if (svgCanvas.getMode() === 'image') {
                setImageURL(svgCanvas.getHref(elem));
              }
              break;
            case 'g':
            case 'use':
              $('#container_panel').show();
              var title = svgCanvas.getTitle();
              var label = $('#g_title')[0] as HTMLInputElement;
              label.value = title;
              setInputWidth(label);
              $('#g_title').prop('disabled', el_name === 'use');

              if ((el_name === 'use') && ($(elem).attr('data-xform'))) {
                const location = svgCanvas.getSvgRealLocation(elem);
                ObjectPanelController.updateDimensionValues({
                  x: location.x,
                  y: location.y,
                  width: location.width,
                  height: location.height
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
          menu_items
            .enableContextMenuItems('#group')
            .disableContextMenuItems('#ungroup');
        } else {
          menu_items[(el_name === 'g' ? 'en' : 'dis') + 'ableContextMenuItems']('#ungroup');
          menu_items[((el_name === 'g' || !multiselected) ? 'dis' : 'en') + 'ableContextMenuItems']('#group');
        }
        const isRatioFixed = elem.getAttribute('data-ratiofixed') === 'true';
        ObjectPanelController.updateDimensionValues({ isRatioFixed });
      } // if (elem != null)
      else if (multiselected) {
        //$('#multiselected_panel').show();
        menu_items
          .enableContextMenuItems('#group')
          .disableContextMenuItems('#ungroup');
      } else {
        menu_items.disableContextMenuItems('#delete,#cut,#copy,#group,#ungroup,#move_front,#move_up,#move_down,#move_back');
      }

      // update history buttons
      $('#tool_undo').toggleClass('disabled', undoMgr.getUndoStackSize() === 0);
      $('#tool_redo').toggleClass('disabled', undoMgr.getRedoStackSize() === 0);

      svgCanvas.addedNew = false;

      if ((elem && !is_node) || multiselected) {
        // update the selected elements' layer
        $('#selLayerNames').removeAttr('disabled').val(currentLayerName);
        displayChangeLayerBlock(true);
        // Enable regular menu options
        canv_menu.enableContextMenuItems('#delete,#cut,#copy,#move_front,#move_up,#move_down,#move_back');
      } else {
        $('#selLayerNames').attr('disabled', 'disabled');
        displayChangeLayerBlock(false);
      }

      ObjectPanelController.updateObjectPanel();
    };
    editor.updateContextPanel = updateContextPanel;

    var updateWireFrame = function () {
      // Test support
      if (supportsNonSS) {
        return;
      }
      // console.warn("Wireframe disabled by FLUX Studio")
      var rule = '#workarea.wireframe #svgcontent * { stroke-width: ' + 1 / svgCanvas.getZoom() + 'px; }';
      $('#wireframe_rules').text(workarea.hasClass('wireframe') ? rule : '');
    };

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
      var mode = svgCanvas.getMode();
      if (mode === 'select') {
        setSelectMode();
      }
      var is_node = (mode === 'pathedit');
      // if elems[1] is present, then we have more than one element
      selectedElement = (elems.length === 1 || elems[1] == null ? elems[0] : null);
      multiselected = (elems.length >= 2 && elems[1] != null);
      if (selectedElement != null) {
        // unless we're already in always set the mode of the editor to select because
        // upon creation of a text element the editor is switched into
        // select mode and this event fires - we need our UI to be in sync

        // updateToolbar is for svgeditor, seems not to be used anymore.
        // if (!is_node) {
        //     updateToolbar();
        // }
      }
      // Deal with pathedit mode
      togglePathEditMode(is_node, elems);
      updateContextPanel();
      svgCanvas.runExtensions('selectedChanged', {
        elems: elems,
        selectedElement: selectedElement,
        multiselected: multiselected
      });
    };

    // Call when part of element is in process of changing, generally
    // on mousemove actions like rotate, move, etc.
    var elementTransition = function (win, elems) {
      var mode = svgCanvas.getMode();
      var elem = elems[0];

      if (!elem) {
        return;
      }

      multiselected = (elems.length >= 2 && elems[1] != null);
      // Only updating fields for single elements for now
      if (!multiselected) {
        switch (mode) {
          case 'rotate':
            var ang = svgCanvas.getRotationAngle(elem);
            $('#angle').val(ang);
            $('#tool_reorient').toggleClass('disabled', ang === 0);
            break;

          // TODO: Update values that change on move/resize, etc
          //						case "select":
          //						case "resize":
          //							break;
        }
      }
      svgCanvas.runExtensions('elementTransition', {
        elems: elems
      });
    };

    /**
     * Test whether an element is a layer or not.
     * @param {SVGGElement} elem - The SVGGElement to test.
     * @returns {boolean} True if the element is a layer
     */
    function isLayer(elem) {
      return elem && elem.tagName === 'g' && svgedit.draw.Layer.CLASS_REGEX.test(elem.getAttribute('class'));
    }

    // called when any element has changed
    var elementChanged = function (win, elems) {
      var i,
        mode = svgCanvas.getMode();
      if (mode === 'select') {
        setSelectMode();
      }

      for (i = 0; i < elems.length; ++i) {
        var elem = elems[i];

        var isSvgElem = (elem && elem.tagName === 'svg');
        if (isSvgElem || isLayer(elem)) {
          LayerPanelController.updateLayerPanel();
          // if the element changed was the svg, then it could be a resolution change
          if (isSvgElem) {
            updateCanvas();
          }
        }
        // Update selectedElement if element is no longer part of the image.
        // This occurs for the text elements in Firefox
        else if (elem && selectedElement && selectedElement.parentNode == null) {
          //						|| elem && elem.tagName == "path" && !multiselected) { // This was added in r1430, but not sure why
          selectedElement = elem;
        }
      }

      editor.showSaveWarning = true;

      // we update the contextual panel with potentially new
      // positional/sizing information (we DON'T want to update the
      // toolbar here as that creates an infinite loop)
      // also this updates the history buttons

      // we tell it to skip focusing the text control if the
      // text element was previously in focus
      updateContextPanel();

      // In the event a gradient was flipped:
      if (selectedElement && mode === 'select') {
        paintBox.fill.update();
        paintBox.stroke.update();
      }

      svgCanvas.runExtensions('elementChanged', {
        elems: elems
      });
    };

    var zoomChanged = function (win, zoomData) {
      const defaultZoomData = {
        zoomLevel: undefined,
        factor: 1,
        staticPoint: {
          x: (($(window).width() - 268) / 2),
          y: (($(window).height() - 135) / 2)
        },
        autoCenter: false
      };
      const data = $.extend({}, defaultZoomData, zoomData);
      data.zoomLevel = Math.max(data.zoomLevel || svgCanvas.getZoom() * data.factor, 0.01);

      svgCanvas.setZoom(data.zoomLevel);

      if (data.autoCenter) {
        updateCanvas({
          autoCenter: true
        });
      } else {
        updateCanvas({
          staticPoint: data.staticPoint
        });
      }

      updateWireFrame();
    };
    editor.zoomChanged = zoomChanged;

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
        link_str = '<a href="#" data-root="y">' + svgCanvas.getCurrentDrawing().getCurrentLayerName() + '</a>';

        $(context).parentsUntil('#svgcontent > g').andSelf().each(function () {
          if (this.id) {
            str += ' > ' + this.id;
            if (this !== context) {
              link_str += ' > <a href="#">' + this.id + '</a>';
            } else {
              link_str += ' > ' + this.id;
            }
          }
        });

        cur_context = str;
      } else {
        cur_context = null;
      }
      $('#cur_context_panel').toggle(!!context).html(link_str);

      updateTitle();
    };

    // Makes sure the current selected paint is available to work with
    var prepPaints = function () {
      paintBox.fill.prep();
      paintBox.stroke.prep();
    };

    var flyout_funcs = {};

    var setFlyoutTitles = function () {
      $('.tools_flyout').each(function () {
        var shower = $('#' + this.id + '_show');
        if (shower.data('isLibrary')) {
          return;
        }

        var tooltips = [];
        $(this).children().each(function () {
          tooltips.push(this.title);
        });
        shower[0].title = tooltips.join(' / ');
      });
    };

    var setFlyoutPositions = function () {
      $('.tools_flyout').each(function () {
        var shower = $('#' + this.id + '_show');
        var pos = shower.offset();
        var w = shower.outerWidth();
        $(this).css({
          left: (pos.left + w) * editor.tool_scale,
          top: pos.top
        });
      });
    };

    var setupFlyouts = function (holders) {
      $.each(holders, function (hold_sel: string, btn_opts) {
        var buttons = $(hold_sel).children();
        var show_sel = hold_sel + '_show';
        var shower = $(show_sel);
        let defaultIndex: number = -1;
        buttons.addClass('tool_button')
          .unbind('click mousedown mouseup') // may not be necessary
          .each(function (i) {
            // Get this buttons options
            var opts = btn_opts[i];

            // Remember the function that goes with this ID
            flyout_funcs[opts.sel] = opts.fn;

            if (opts.isDefault) {
              defaultIndex = i;
            }

            // Clicking the icon in flyout should set this set's icon
            var func = function (event) {
              var options = opts;
              //find the currently selected tool if comes from keystroke
              // if (event.type === 'keydown') {
              // 	var flyoutIsSelected = $(options.parent + '_show').hasClass('tool_button_current');
              // 	var currentOperation = $(options.parent + '_show').attr('data-curopt');
              // 	$.each(holders[opts.parent], function(i, tool) {
              // 		if (tool.sel == currentOperation) {
              // 			if (!event.shiftKey || !flyoutIsSelected) {
              // 				options = tool;
              // 			} else {
              // 				options = holders[opts.parent][i+1] || holders[opts.parent][0];
              // 			}
              // 		}
              // 	});
              // }
              if ($(this).hasClass('disabled')) {
                return false;
              }
              if (toolButtonClick(show_sel)) {
                options.fn();
              }
              var icon;
              if (options.icon) {
                icon = $.getSvgIcon(options.icon, true);
              } else {
                icon = $(options.sel).children().eq(0).clone();
              }

              icon[0].setAttribute('width', shower.width());
              icon[0].setAttribute('height', shower.height());
              shower.children(':not(.flyout_arrow_horiz)').remove();
              shower.append(icon).attr('data-curopt', options.sel); // This sets the current mode
            };

            $(this).mouseup(func);

            if (opts.key) {
              $(document).bind('keydown', opts.key[0] + ' shift+' + opts.key[0], func);
            }
          });

        if (defaultIndex >= 0) {
          shower.attr('data-curopt', btn_opts[defaultIndex].sel);
        } else if (!shower.attr('data-curopt')) {
          // Set first as default
          shower.attr('data-curopt', btn_opts[0].sel);
        }

        var timer;
        var pos = $(show_sel).position();

        // Clicking the "show" icon should set the current mode
        shower.mousedown(function (evt) {
          if (shower.hasClass('disabled')) {
            return false;
          }
          var holder = $(hold_sel as string);
          var l = pos.left + 34;
          var w = holder.width() * -1;
          var time = holder.data('shown_popop') ? 200 : 0;
          timer = setTimeout(function () {
            // Show corresponding menu
            if (!shower.data('isLibrary')) {
              holder.css('left', w).show().animate({
                left: l
              }, 150);
            } else {
              holder.css('left', l).show();
            }
            holder.data('shown_popop', true);
          }, time);
          evt.preventDefault();
        }).mouseup(function (evt) {
          clearTimeout(timer);
          var opt = $(this).attr('data-curopt');
          // Is library and popped up, so do nothing
          if (shower.data('isLibrary') && $(show_sel.replace('_show', '')).is(':visible')) {
            toolButtonClick(show_sel, true);
            return;
          }
          if (toolButtonClick(show_sel) && flyout_funcs[opt]) {
            flyout_funcs[opt]();
          }
        });
        // $('#tools_rect').mouseleave(function(){$('#tools_rect').fadeOut();});
      });
      setFlyoutTitles();
      setFlyoutPositions();
    };

    var makeFlyoutHolder = function (id, child?) {
      var div = $('<div>', {
        'class': 'tools_flyout',
        id: id
      }).appendTo('#svg_editor').append(child);

      return div;
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

    var scaleElements = function (elems, scale) {
      // var prefix = '-' + uaPrefix.toLowerCase() + '-'; // Currently unused
      var sides = ['top', 'left', 'bottom', 'right'];

      elems.each(function () {
        // Handled in CSS
        // this.style[uaPrefix + 'Transform'] = 'scale(' + scale + ')';
        var i;
        var el = $(this);
        var w = el.outerWidth() * (scale - 1);
        var h = el.outerHeight() * (scale - 1);
        // var margins = {}; // Currently unused

        for (i = 0; i < 4; i++) {
          var s = sides[i];
          var cur = el.data('orig_margin-' + s);
          if (cur == null) {
            cur = parseInt(el.css('margin-' + s), 10);
            // Cache the original margin
            el.data('orig_margin-' + s, cur);
          }
          var val = cur * scale;
          if (s === 'right') {
            val += w;
          } else if (s === 'bottom') {
            val += h;
          }

          el.css('margin-' + s, val);
          // el.css('outline', '1px solid red');
        }
      });
    };

    var setIconSize = editor.setIconSize = function (size) {

      //				var elems = $('.tool_button, .push_button, .tool_button_current, .disabled, .icon_label, #url_notice, #tool_open');
      var sel_toscale = '#tools_top .toolset, #editor_panel > *, #history_panel > *,' +
        '				#main_button, #tools_left > *, #path_node_panel > *, #multiselected_panel > *,' +
        '				#g_panel > *, #tool_font_size > *, .tools_flyout';

      var elems = $(sel_toscale);
      var scale = 1;

      if (typeof size === 'number') {
        scale = size;
      } else {
        var icon_sizes = {
          s: 0.75,
          m: 1,
          l: 1.25,
          xl: 1.5
        };
        scale = icon_sizes[size];
      }

      editor.tool_scale = scale;

      setFlyoutPositions();
      // $('.tools_flyout').each(function() {
      //					var pos = $(this).position();
      //					console.log($(this), pos.left+(34 * scale));
      //					$(this).css({'left': pos.left+(34 * scale), 'top': pos.top+(77 * scale)});
      //					console.log('l', $(this).css('left'));
      //				});

      //				var scale = .75;

      var hidden_ps = elems.parents(':hidden');
      hidden_ps.css('visibility', 'hidden').show();
      scaleElements(elems, scale);
      hidden_ps.css('visibility', 'visible').hide();
      //				return;

      $.pref('iconsize', size);
      $('#iconsize').val(size);

      // Change icon size
      //				$('.tool_button, .push_button, .tool_button_current, .disabled, .icon_label, #url_notice, #tool_open')
      //				.find('> svg, > img').each(function() {
      //					this.setAttribute('width',size_num);
      //					this.setAttribute('height',size_num);
      //				});
      //
      //				$.resizeSvgIcons({
      //					'.flyout_arrow_horiz > svg, .flyout_arrow_horiz > img': size_num / 5,
      //					'#logo > svg, #logo > img': size_num * 1.3,
      //					'#tools_bottom .icon_label > *': (size_num === 16 ? 18 : size_num * .75)
      //				});
      //				if (size !== 's') {
      //					$.resizeSvgIcons({'#layerbuttons svg, #layerbuttons img': size_num * .6});
      //				}

      // Note that all rules will be prefixed with '#svg_editor' when parsed
      var cssResizeRules = {
        //					'.tool_button,\
        //					.push_button,\
        //					.tool_button_current,\
        //					.push_button_pressed,\
        //					.disabled,\
        //					.icon_label,\
        //					.tools_flyout .tool_button': {
        //						'width': {s: '16px', l: '32px', xl: '48px'},
        //						'height': {s: '16px', l: '32px', xl: '48px'},
        //						'padding': {s: '1px', l: '2px', xl: '3px'}
        //					},
        //					'.tool_sep': {
        //						'height': {s: '16px', l: '32px', xl: '48px'},
        //						'margin': {s: '2px 2px', l: '2px 5px', xl: '2px 8px'}
        //					},
        //					'#main_icon': {
        //						'width': {s: '31px', l: '53px', xl: '75px'},
        //						'height': {s: '22px', l: '42px', xl: '64px'}
        //					},
        '#tools_top': {
          'left': 50 + $('#main_button').width(),
          'height': 72
        },
        '#tools_left': {
          'width': 31,
          'top': 74
        },
        'div#workarea': {
          'left': 38,
          'top': 74
        }
        //					'#tools_bottom': {
        //						'left': {s: '27px', l: '46px', xl: '65px'},
        //						'height': {s: '58px', l: '98px', xl: '145px'}
        //					},
        //					'#color_tools': {
        //						'border-spacing': {s: '0 1px'},
        //						'margin-top': {s: '-1px'}
        //					},
        //					'#color_tools .icon_label': {
        //						'width': {l:'43px', xl: '60px'}
        //					},
        //					'.color_tool': {
        //						'height': {s: '20px'}
        //					},
        //					'#tool_opacity': {
        //						'top': {s: '1px'},
        //						'height': {s: 'auto', l:'auto', xl:'auto'}
        //					},
        //					'#tools_top input, #tools_bottom input': {
        //						'margin-top': {s: '2px', l: '4px', xl: '5px'},
        //						'height': {s: 'auto', l: 'auto', xl: 'auto'},
        //						'border': {s: '1px solid #555', l: 'auto', xl: 'auto'},
        //						'font-size': {s: '.9em', l: '1.2em', xl: '1.4em'}
        //					},
        //					'#zoom_panel': {
        //						'margin-top': {s: '3px', l: '4px', xl: '5px'}
        //					},
        //					'#copyright, #tools_bottom .label': {
        //						'font-size': {l: '1.5em', xl: '2em'},
        //						'line-height': {s: '15px'}
        //					},
        //					'#tools_bottom_2': {
        //						'width': {l: '295px', xl: '355px'},
        //						'top': {s: '4px'}
        //					},
        //					'#tools_top > div, #tools_top': {
        //						'line-height': {s: '17px', l: '34px', xl: '50px'}
        //					},
        //					'.dropdown button': {
        //						'height': {s: '18px', l: '34px', xl: '40px'},
        //						'line-height': {s: '18px', l: '34px', xl: '40px'},
        //						'margin-top': {s: '3px'}
        //					},
        //					'#tools_top label, #tools_bottom label': {
        //						'font-size': {s: '1em', l: '1.5em', xl: '2em'},
        //						'height': {s: '25px', l: '42px', xl: '64px'}
        //					},
        //					'div.toolset': {
        //						'height': {s: '25px', l: '42px', xl: '64px'}
        //					},
        //					'#tool_bold, #tool_italic': {
        //						'font-size': {s: '1.5em', l: '3em', xl: '4.5em'}
        //					},
        //					'#sidepanels': {
        //						'top': {s: '50px', l: '88px', xl: '125px'},
        //						'bottom': {s: '51px', l: '68px', xl: '65px'}
        //					},
        //					'#layerbuttons': {
        //						'width': {l: '130px', xl: '175px'},
        //						'height': {l: '24px', xl: '30px'}
        //					},
        //					'#layerlist': {
        //						'width': {l: '128px', xl: '150px'}
        //					},
        //					'.layer_button': {
        //						'width': {l: '19px', xl: '28px'},
        //						'height': {l: '19px', xl: '28px'}
        //					},
        //					'input.spin-button': {
        //						'background-image': {l: 'url('images/spinbtn_updn_big.png')', xl: 'url('images/spinbtn_updn_big.png')'},
        //						'background-position': {l: '100% -5px', xl: '100% -2px'},
        //						'padding-right': {l: '24px', xl: '24px' }
        //					},
        //					'input.spin-button.up': {
        //						'background-position': {l: '100% -45px', xl: '100% -42px'}
        //					},
        //					'input.spin-button.down': {
        //						'background-position': {l: '100% -85px', xl: '100% -82px'}
        //					},
        //					'#position_opts': {
        //						'width': {all: (size_num*4) +'px'}
        //					}
      };

      var rule_elem = $('#tool_size_rules');
      if (!rule_elem.length) {
        rule_elem = $('<style id="tool_size_rules"></style>').appendTo('head');
      } else {
        rule_elem.empty();
      }

      if (size !== 'm') {
        var styleStr = '';
        $.each(cssResizeRules, function (origSelector: string, rules) {
          let selector = '#svg_editor ' + origSelector.replace(/,/g, ', #svg_editor');
          styleStr += selector + '{';
          $.each(rules, function (prop, values: any) {
            var val;
            if (typeof values === 'number') {
              val = (values * scale) + 'px';
            } else if (values[size] || values.all) {
              val = (values[size] || values.all);
            }
            styleStr += (prop + ':' + val + ';');
          });
          styleStr += '}';
        });
        //this.style[uaPrefix + 'Transform'] = 'scale(' + scale + ')';
        var prefix = '-' + uaPrefix.toLowerCase() + '-';
        styleStr += (sel_toscale + '{' + prefix + 'transform: scale(' + scale + ');}' +
          ' #svg_editor div.toolset .toolset {' + prefix + 'transform: scale(1); margin: 1px !important;}' // Hack for markers
          +
          ' #svg_editor .ui-slider {' + prefix + 'transform: scale(' + (1 / scale) + ');}' // Hack for sliders
        );
        rule_elem.text(styleStr);
      }

      setFlyoutPositions();
    };

    // TODO: Combine this with addDropDown or find other way to optimize
    var addAltDropDown = function (elem, list, callback, opts) {
      var button = $(elem);
      list = $(list);
      var on_button = false;
      var dropUp = opts.dropUp;
      if (dropUp) {
        $(elem).addClass('dropup');
      }
      list.find('li').bind('mouseup', function () {
        if (opts.seticon) {
          setIcon('#cur_' + button[0].id, $(this).children());
          $(this).addClass('current').siblings().removeClass('current');
        }
        callback.apply(this, arguments);

      });

      $(window).mouseup(function (evt) {
        if (!on_button) {
          button.removeClass('down');
          list.hide();
          list.css({
            top: 0,
            left: 0
          });
        }
        on_button = false;
      });

      // var height = list.height(); // Currently unused
      button.bind('mousedown', function () {
        var off = button.offset();
        if (dropUp) {
          off.top -= list.height();
          off.left += 8;
        } else {
          off.top += button.height();
        }
        list.offset(off);

        if (!button.hasClass('down')) {
          list.show();
          on_button = true;
        } else {
          // CSS position must be reset for Webkit
          list.hide();
          list.css({
            top: 0,
            left: 0
          });
        }
        button.toggleClass('down');
      }).hover(function () {
        on_button = true;
      }).mouseout(function () {
        on_button = false;
      });

      if (opts.multiclick) {
        list.mousedown(function () {
          on_button = true;
        });
      }
    };

    var extsPreLang = [];
    var extAdded = function (win, ext) {
      if (!ext) {
        return;
      }
      var cb_called = false;
      var resize_done = false;
      var cb_ready = true; // Set to false to delay callback (e.g. wait for $.svgIcons)

      if (ext.langReady) {
        if (editor.langChanged) { // We check for this since the "lang" pref could have been set by storage
          var lang = $.pref('lang');
          ext.langReady({
            lang: lang,
            uiStrings: uiStrings
          });
        } else {
          extsPreLang.push(ext);
        }
      }

      function prepResize() {
        if (resize_timer) {
          clearTimeout(resize_timer);
          resize_timer = null;
        }
        if (!resize_done) {
          resize_timer = setTimeout(function () {
            resize_done = true;
            setIconSize($.pref('iconsize'));
          }, 50);
        }
      }

      var runCallback = function () {
        if (ext.callback && !cb_called && cb_ready) {
          cb_called = true;
          ext.callback();
        }
      };

      var btn_selects = [];

      if (ext.context_tools) {
        $.each(ext.context_tools, function (i, tool) {
          // Add select tool
          var html;
          var cont_id = tool.container_id ? (' id="' + tool.container_id + '"') : '';
          var panel = $('#' + tool.panel);

          // create the panel if it doesn't exist
          if (!panel.length) {
            panel = $('<div>', {
              id: tool.panel
            }).appendTo('#tools_top');
          }

          // TODO: Allow support for other types, or adding to existing tool
          switch (tool.type) {
            case 'tool_button':
              html = '<div class="tool_button">' + tool.id + '</div>';
              var div = $(html).appendTo(panel);
              if (tool.events) {
                $.each(tool.events, function (evt: string, func) {
                  $(div).bind(evt, func);
                });
              }
              break;
            case 'select':
              html = '<label' + cont_id + '>' +
                '<select id="' + tool.id + '">';
              $.each(tool.options, function (val: string, text) {
                var sel = (val == tool.defval) ? ' selected' : '';
                html += '<option value="' + val + '"' + sel + '>' + text + '</option>';
              });
              html += '</select></label>';
              // Creates the tool, hides & adds it, returns the select element
              var sel = $(html).appendTo(panel).find('select');

              $.each(tool.events, function (evt: string, func) {
                $(sel).bind(evt, func);
              });
              break;
            case 'button-select':
              html = '<div id="' + tool.id + '" class="dropdown toolset" title="' + tool.title + '">' +
                '<div id="cur_' + tool.id + '" class="icon_label"></div><button></button></div>';

              var list = $('<ul id="' + tool.id + '_opts"></ul>').appendTo('#option_lists');

              if (tool.colnum) {
                list.addClass('optcols' + tool.colnum);
              }

              // Creates the tool, hides & adds it, returns the select element
              var dropdown = $(html).appendTo(panel).children();

              btn_selects.push({
                elem: ('#' + tool.id),
                list: ('#' + tool.id + '_opts'),
                title: tool.title,
                callback: tool.events.change,
                cur: ('#cur_' + tool.id)
              });

              break;
            case 'input':
              html = '<label' + cont_id + '>' +
                '<span id="' + tool.id + '_label">' +
                tool.label + ':</span>' +
                '<input id="' + tool.id + '" title="' + tool.title +
                '" size="' + (tool.size || '4') + '" value="' + (tool.defval || '') + '" type="text"/></label>';

              // Creates the tool, hides & adds it, returns the select element

              // Add to given tool.panel
              var inp = $(html).appendTo(panel).find('input');

              if (tool.spindata) {
                inp.SpinButton(tool.spindata);
              }

              if (tool.events) {
                $.each(tool.events, function (evt: string, func) {
                  inp.bind(evt, func);
                });
              }
              break;

            default:
              break;
          }
        });
      }

      if (ext.buttons) {
        var fallback_obj = {},
          placement_obj = {},
          svgicons = ext.svgicons,
          holders = {};

        // Add buttons given by extension
        $.each(ext.buttons, function (i: number, btn) {
          var icon, svgicon, tls_id;
          var id = btn.id;
          let num = i;

          // Give button a unique ID
          while ($('#' + id).length) {
            id = btn.id + '_' + (++num);
          }

          if (!svgicons) {
            icon = $('<img src="' + btn.icon + '">');
          } else {
            fallback_obj[id] = btn.icon;
            svgicon = btn.svgicon || btn.id;
            if (btn.type === 'app_menu') {
              placement_obj['#' + id + ' > div'] = svgicon;
            } else {
              placement_obj['#' + id] = svgicon;
            }
          }

          var cls, parent;

          // Set button up according to its type
          switch (btn.type) {
            case 'mode_flyout':
            case 'mode':
              cls = 'tool_button';
              parent = '#tools_left';
              break;
            case 'context':
              cls = 'tool_button';
              parent = '#' + btn.panel;
              // create the panel if it doesn't exist
              if (!$(parent).length) {
                $('<div>', {
                  id: btn.panel
                }).appendTo('#tools_top');
              }
              break;
            case 'app_menu':
              cls = '';
              parent = '#main_menu ul';
              break;
          }
          var flyout_holder, cur_h, show_btn, ref_data, ref_btn;
          var button = $((btn.list || btn.type === 'app_menu') ? '<li/>' : '<div/>')
            .attr('id', id)
            .attr('title', btn.title)
            .addClass(cls);
          if (!btn.includeWith && !btn.list) {
            if ('position' in btn) {
              if ($(parent).children().eq(btn.position).length) {
                $(parent).children().eq(btn.position).before(button);
              } else {
                $(parent).children().last().before(button);
              }
            } else {
              button.appendTo(parent);
            }

            if (btn.type === 'mode_flyout') {
              // Add to flyout menu / make flyout menu
              //							var opts = btn.includeWith;
              //							// opts.button, default, position
              ref_btn = $(button);

              flyout_holder = ref_btn.parent();
              // Create a flyout menu if there isn't one already
              if (!ref_btn.parent().hasClass('tools_flyout')) {
                // Create flyout placeholder
                tls_id = ref_btn[0].id.replace('tool_', 'tools_');
                show_btn = ref_btn.clone()
                  .attr('id', tls_id + '_show')
                  .append($('<div>', {
                    'class': 'flyout_arrow_horiz'
                  }));

                ref_btn.before(show_btn);

                // Create a flyout div
                flyout_holder = makeFlyoutHolder(tls_id, ref_btn);
                flyout_holder.data('isLibrary', true);
                show_btn.data('isLibrary', true);
              }
              //							ref_data = Actions.getButtonData(opts.button);

              placement_obj['#' + tls_id + '_show'] = btn.id;
              // TODO: Find way to set the current icon using the iconloader if this is not default

              // Include data for extension button as well as ref button
              cur_h = holders['#' + flyout_holder[0].id] = [{
                sel: '#' + id,
                fn: btn.events.click,
                icon: btn.id,
                //									key: btn.key,
                isDefault: true
              }, ref_data];
              //
              //							// {sel:'#tool_rect', fn: clickRect, evt: 'mouseup', key: 4, parent: '#tools_rect', icon: 'rect'}
              //
              //							var pos = ('position' in opts)?opts.position:'last';
              //							var len = flyout_holder.children().length;
              //
              //							// Add at given position or end
              //							if (!isNaN(pos) && pos >= 0 && pos < len) {
              //								flyout_holder.children().eq(pos).before(button);
              //							} else {
              //								flyout_holder.append(button);
              //								cur_h.reverse();
              //							}
            } else if (btn.type === 'app_menu') {
              button.append('<div>').append(btn.title);
            }

          } else if (btn.list) {
            // Add button to list
            button.addClass('push_button');
            $('#' + btn.list + '_opts').append(button);
            if (btn.isDefault) {
              $('#cur_' + btn.list).append(button.children().clone());
              svgicon = btn.svgicon || btn.id;
              placement_obj['#cur_' + btn.list] = svgicon;
            }
          } else if (btn.includeWith) {
            // Add to flyout menu / make flyout menu
            var opts = btn.includeWith;
            // opts.button, default, position
            ref_btn = $(opts.button);

            flyout_holder = ref_btn.parent();
            // Create a flyout menu if there isn't one already
            if (!ref_btn.parent().hasClass('tools_flyout')) {
              // Create flyout placeholder
              tls_id = ref_btn[0].id.replace('tool_', 'tools_');
              show_btn = ref_btn.clone()
                .attr('id', tls_id + '_show')
                .append($('<div>', {
                  'class': 'flyout_arrow_horiz'
                }));

              ref_btn.before(show_btn);

              // Create a flyout div
              flyout_holder = makeFlyoutHolder(tls_id, ref_btn);
            }

            ref_data = Actions.getButtonData(opts.button);

            if (opts.isDefault) {
              placement_obj['#' + tls_id + '_show'] = btn.id;
            }
            // TODO: Find way to set the current icon using the iconloader if this is not default

            // Include data for extension button as well as ref button
            cur_h = holders['#' + flyout_holder[0].id] = [{
              sel: '#' + id,
              fn: btn.events.click,
              icon: btn.id,
              key: btn.key,
              isDefault: btn.includeWith ? btn.includeWith.isDefault : 0
            }, ref_data];

            // {sel:'#tool_rect', fn: clickRect, evt: 'mouseup', key: 4, parent: '#tools_rect', icon: 'rect'}

            var pos = ('position' in opts) ? opts.position : 'last';
            var len = flyout_holder.children().length;

            // Add at given position or end
            if (!isNaN(pos) && pos >= 0 && pos < len) {
              flyout_holder.children().eq(pos).before(button);
            } else {
              flyout_holder.append(button);
              cur_h.reverse();
            }
          }

          if (!svgicons) {
            button.append(icon);
          }

          if (!btn.list) {
            // Add given events to button
            $.each(btn.events, function (name: string, func) {
              if (name === 'click' && btn.type === 'mode') {
                if (btn.includeWith) {
                  button.bind(name, func);
                } else {
                  button.bind(name, function () {
                    if (toolButtonClick(button)) {
                      func();
                    }
                  });
                }
                if (btn.key) {
                  $(document).bind('keydown', btn.key, func);
                  if (btn.title) {
                    button.attr('title', btn.title + ' [' + btn.key + ']');
                  }
                }
              } else {
                button.bind(name, func);
              }
            });
          }

          setupFlyouts(holders);
        });

        $.each(btn_selects, function () {
          addAltDropDown(this.elem, this.list, this.callback, {
            seticon: true
          });
        });

        if (svgicons) {
          cb_ready = false; // Delay callback
        }

        $.svgIcons(svgicons, {
          w: 24,
          h: 24,
          id_match: false,
          no_img: (!svgedit.browser.isWebkit()),
          fallback: fallback_obj,
          placement: placement_obj,
          callback: function (icons) {
            // Non-ideal hack to make the icon match the current size
            //if (curPrefs.iconsize && curPrefs.iconsize !== 'm') {
            if ($.pref('iconsize') !== 'm') {
              prepResize();
            }
            cb_ready = true; // Ready for callback
            runCallback();
          }
        });
      }

      runCallback();
    };

    var getPaint = function (color, opac, type) {
      // update the editor's fill paint
      var opts: {
        alpha: number,
        solidColor?: string
      } = {
        alpha: opac
      };
      if (color.indexOf('url(#') === 0) {
        var refElem = svgCanvas.getRefElem(color);
        if (refElem) {
          refElem = refElem.cloneNode(true);
        } else {
          refElem = $('#' + type + '_color defs *')[0];
        }
        opts[refElem.tagName] = refElem;
      } else if (color.indexOf('#') === 0) {
        opts.solidColor = color.substr(1);
      } else {
        opts.solidColor = 'none';
      }
      return new $.jGraduate.Paint(opts);
    };

    $('#text').focus(function () {
      textBeingEntered = true;
    });
    $('#text').blur(function () {
      textBeingEntered = false;
    });

    // bind the selected event to our function that handles updates to the UI
    svgCanvas.bind('selected', selectedChanged);
    svgCanvas.bind('transition', elementTransition);
    svgCanvas.bind('changed', elementChanged);
    svgCanvas.bind('saved', saveHandler);
    svgCanvas.bind('exported', exportHandler);
    svgCanvas.bind('exportedPDF', function (win, data) {
      var exportWindowName = data.exportWindowName;
      if (exportWindowName) {
        exportWindow = window.open('', exportWindowName); // A hack to get the window via JSON-able name without opening a new one
      }
      exportWindow.location.href = data.dataurlstring;
    });
    svgCanvas.bind('zoomed', zoomChanged);
    svgCanvas.bind('contextset', contextChanged);
    svgCanvas.bind('extension_added', extAdded);
    svgCanvas.textActions.setInputElem($('#text')[0]);

    var str = '<div class="palette_item" data-rgb="none"></div>';
    $.each(palette, function (i, item) {
      str += '<div class="palette_item" style="background-color: ' + item + ';" data-rgb="' + item + '"></div>';
    });
    $('#palette').append(str);

    // Set up editor background functionality
    // TODO add checkerboard as "pattern"
    var color_blocks = ['#FFF', '#888', '#000']; // ,'url(data:image/gif;base64,R0lGODlhEAAQAIAAAP%2F%2F%2F9bW1iH5BAAAAAAALAAAAAAQABAAAAIfjG%2Bgq4jM3IFLJgpswNly%2FXkcBpIiVaInlLJr9FZWAQA7)'];
    str = '';
    $.each(color_blocks, function () {
      str += '<div class="color_block" style="background-color:' + this + ';"></div>';
    });
    $('#bg_blocks').append(str);
    var blocks = $('#bg_blocks div');
    var cur_bg = 'cur_background';
    blocks.each(function () {
      var blk = $(this);
      blk.click(function () {
        blocks.removeClass(cur_bg);
        $(this).addClass(cur_bg);
      });
    });

    setBackground($.pref('bkgd_color'), $.pref('bkgd_url'));

    $('#image_save_opts input').val([$.pref('img_save')]);

    var changeRectRadius = function (ctl) {
      svgCanvas.setRectRadius(ctl.value);
    };

    var changeFontSize = function (ctl) {
      svgCanvas.setFontSize(ctl.value);
    };

    var changeStrokeWidth = function (ctl) {
      var val = ctl.value;
      if (val == 0 && selectedElement && ['line', 'polyline'].indexOf(selectedElement.nodeName) >= 0) {
        val = ctl.value = 1;
      }
      svgCanvas.setStrokeWidth(val);
    };

    var changeRotationAngle = function (ctl) {
      svgCanvas.setRotationAngle(ctl.value);
      $('#tool_reorient').toggleClass('disabled', parseInt(ctl.value, 10) === 0);
    };

    // TODO: what is ctl, what is val?
    var changeOpacity = function (ctl, val?: number) {
      if (val == null) {
        val = ctl.value;
      }
      $('#group_opacity').val(val);
      if (!ctl || !ctl.handle) {
        $('#opac_slider').slider('option', 'value', val);
      }
      svgCanvas.setOpacity(val / 100);
    };

    var changeBlur = function (ctl, val?, noUndo?: boolean) {
      if (val == null) {
        val = ctl.value;
      }
      $('#blur').val(val);
      var complete = false;
      if (!ctl || !ctl.handle) {
        $('#blur_slider').slider('option', 'value', val);
        complete = true;
      }
      if (noUndo) {
        svgCanvas.setBlurNoUndo(val);
      } else {
        svgCanvas.setBlur(val, complete);
      }
    };

    $('#stroke_style').change(function () {
      svgCanvas.setStrokeAttr('stroke-dasharray', $(this).val());
    });

    $('#stroke_linejoin').change(function () {
      svgCanvas.setStrokeAttr('stroke-linejoin', $(this).val());
    });

    // Lose focus for select elements when changed (Allows keyboard shortcuts to work better)
    $('select').change(function () {
      $(this).blur();
    });

    // fired when user wants to move elements to another layer
    var promptMoveLayerOnce = false;
    $('#selLayerNames').change(function (this: HTMLSelectElement) {
      var destLayer = this.options[this.selectedIndex].value;
      var confirmStr = uiStrings.notification.QmoveElemsToLayer.replace('%s', destLayer);
      var moveToLayer = function (ok) {
        if (!ok) {
          return;
        }
        promptMoveLayerOnce = true;
        svgCanvas.moveSelectedToLayer(destLayer);
        svgCanvas.clearSelection();
        LayerPanelController.updateLayerPanel();
      };
      if (destLayer) {
        if (promptMoveLayerOnce) {
          moveToLayer(true);
        } else {
          Alert.popUp({
            id: 'load SVG fail',
            buttonType: AlertConstants.YES_NO,
            message: confirmStr,
            onYes: moveToLayer
          });
        }
      }
    });

    $('#font_family').change(function (this: HTMLInputElement) {
      svgCanvas.setFontFamily(this.value);
    });

    const textInput = document.getElementById('text');
    let wasNewLineAdded = false;
    const checkFunctionKeyPressed = (evt: KeyboardEvent) => {
      return (process.platform === 'darwin' && evt.metaKey) || (process.platform !== 'darwin' && evt.ctrlKey);
    }

    $('#text').on('keyup input', function (this: HTMLInputElement, evt) {
      evt.stopPropagation();
      if (!svgCanvas.textActions.isEditing && evt.type === 'input') {
        // Hack: Windows input event will some how block undo/redo event
        // So do undo/redo when not entering & input event triggered
        evt.preventDefault();
        const originalEvent = evt.originalEvent as InputEvent;
        if (originalEvent.inputType === 'historyUndo') {
          clickUndo();
        } else if (originalEvent.inputType === 'historyRedo') {
          clickRedo();
        }
        return;
      }
      if (evt.key === 'Enter' && !wasNewLineAdded) {
        svgCanvas.textActions.toSelectMode(true);
      } else if (svgCanvas.textActions.isEditing) {
        svgCanvas.setTextContent(this.value);
      }
      if (evt.key !== 'Shift') {
        wasNewLineAdded = false;
      }
    });
    textInput.addEventListener('keydown', (evt: KeyboardEvent) => {
      evt.stopPropagation();
      if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        svgCanvas.textActions.onUpKey();
      } else if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        svgCanvas.textActions.onDownKey();
      } else if (evt.key === 'ArrowLeft') {
        evt.preventDefault();
        svgCanvas.textActions.onLeftKey();
      } else if (evt.key === 'ArrowRight') {
        evt.preventDefault();
        svgCanvas.textActions.onRightKey();
      }
      const isFunctionKeyPressed = checkFunctionKeyPressed(evt);
      if (evt.shiftKey && evt.key === 'Enter') {
        evt.preventDefault();
        svgCanvas.textActions.newLine();
        wasNewLineAdded = true;
      } else if (isFunctionKeyPressed && evt.key === 'c') {
        evt.preventDefault();
        svgCanvas.textActions.copyText();
      } else if (isFunctionKeyPressed && evt.key === 'x') {
        evt.preventDefault();
        svgCanvas.textActions.cutText();
      } else if (isFunctionKeyPressed && evt.key === 'v') {
        evt.preventDefault();
        svgCanvas.textActions.pasteText();
      } else if (isFunctionKeyPressed && evt.key === 'a') {
        evt.preventDefault();
        svgCanvas.textActions.selectAll();
      } else if (isFunctionKeyPressed && evt.key === 'z') {
        if (process.platform === 'darwin') evt.preventDefault();
      }
    });

    $('#image_url').change(function (this: HTMLInputElement) {
      setImageURL(this.value);
    });

    $('#link_url').change(function (this: HTMLInputElement) {
      if (this.value.length) {
        svgCanvas.setLinkURL(this.value);
      } else {
        svgCanvas.removeHyperlink();
      }
    });

    $('#g_title').change(function (this: HTMLInputElement) {
      svgCanvas.setGroupTitle(this.value);
    });

    $('.attr_changer').change(function (this: HTMLInputElement) {
      var attr = this.getAttribute('data-attr');
      var val = parseFloat(this.value);
      var valid = svgedit.units.isValidUnit(attr, val, selectedElement);

      if (!valid) {
        Alert.popUp({
          message: uiStrings.notification.invalidAttrValGiven,
        });
        this.value = selectedElement.getAttribute(attr);
        return false;
      }

      if (attr !== 'id' && attr !== 'class') {
        if (isNaN(val)) {
          val = svgCanvas.convertToNum(attr, val);
        } else if (curConfig.baseUnit !== 'px') {
          // Convert unitless value to one with given unit

          var unitData = svgedit.units.getTypeMap();

          if (selectedElement[attr] || svgCanvas.getMode() === 'pathedit' || attr === 'x' || attr === 'y') {
            val = val * unitData[curConfig.baseUnit];
          }
        }
      }

      // if the user is changing the id, then de-select the element first
      // change the ID, then re-select it with the new ID
      if (attr === 'id') {
        var elem = selectedElement;
        svgCanvas.clearSelection();
        elem.id = val;
        svgCanvas.addToSelection([elem], true);
      } else {
        svgCanvas.changeSelectedAttribute(attr, val);
      }
      this.blur();
      updateContextPanel();
    });

    // Prevent selection of elements when shift-clicking
    $('#palette').mouseover(function () {
      var inp = $('<input type="hidden">');
      $(this).append(inp);
      inp.focus().remove();
    });

    $('.palette_item').mousedown(function (evt) {
      // shift key or right click for stroke
      var picker = evt.shiftKey || evt.button === 2 ? 'stroke' : 'fill';
      var color = $(this).data('rgb');
      var paint;

      // Webkit-based browsers returned 'initial' here for no stroke
      if (color === 'none' || color === 'transparent' || color === 'initial') {
        color = 'none';
        paint = new $.jGraduate.Paint();
      } else {
        paint = new $.jGraduate.Paint({
          alpha: 100,
          solidColor: color.substr(1)
        });
      }

      paintBox[picker].setPaint(paint);
      svgCanvas.setColor(picker, color);

      if (color !== 'none' && svgCanvas.getPaintOpacity(picker) !== 1) {
        svgCanvas.setPaintOpacity(picker, 1.0);
      }
      updateToolButtonState();
    }).bind('contextmenu', function (e) {
      e.preventDefault();
    });

    $('#toggle_stroke_tools').on('click', function () {
      $('#tools_bottom').toggleClass('expanded');
    });

    (function () {
      var last_x = null,
        last_y = null,
        w_area = workarea[0],
        panning = false,
        keypan = false;
      window['w_area'] = workarea[0];

      $('#svgcanvas').bind('mousemove mouseup', function (evt) {
        if (panning === false) {
          return;
        }

        w_area.scrollLeft -= (evt.clientX - last_x);
        w_area.scrollTop -= (evt.clientY - last_y);

        last_x = evt.clientX;
        last_y = evt.clientY;

        if (evt.type === 'mouseup') {
          panning = false;
        }
        return false;
      }).mousedown(function (evt) {
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

      $(document).bind('keydown', 'space', function (evt) {
        svgCanvas.spaceKey = keypan = true;
        evt.preventDefault();
      }).bind('keyup', 'space', function (evt) {
        evt.preventDefault();
        svgCanvas.spaceKey = keypan = false;
      }).bind('keydown', 'shift', function (evt) {
        if (svgCanvas.getMode() === 'zoom') {
          workarea.css('cursor', zoomOutIcon);
        }
      }).bind('keyup', 'shift', function (evt) {
        if (svgCanvas.getMode() === 'zoom') {
          workarea.css('cursor', zoomInIcon);
        }
      });

      editor.setPanning = function (active) {
        svgCanvas.spaceKey = keypan = active;
      };
    })();

    (function () {
      var button = $('#main_icon');
      var overlay = $('#main_icon span');
      var list = $('#main_menu');
      var on_button = false;
      var height = 0;
      var js_hover = true;
      var set_click = false;

      /*
          // Currently unused
          var hideMenu = function() {
              list.fadeOut(200);
          };
          */

      $(window).mouseup(function (evt) {
        if (!on_button) {
          button.removeClass('buttondown');
          // do not hide if it was the file input as that input needs to be visible
          // for its change event to fire
          // @ts-ignore only the "window" will fire this event?
          if (evt.target.tagName !== 'INPUT') {
            list.fadeOut(200);
          } else if (!set_click) {
            set_click = true;
            $(evt.target).click(function () {
              list.css('margin-left', '-9999px').show();
            });
          }
        }
        on_button = false;
      }).mousedown(function (evt) {
        //					$('.contextMenu').hide();
        var islib = $(evt.target).closest('div.tools_flyout, .contextMenu').length;
        if (!islib) {
          $('.tools_flyout:visible,.contextMenu').fadeOut(250);
        }
      });

      overlay.bind('mousedown', function () {
        if (!button.hasClass('buttondown')) {
          // Margin must be reset in case it was changed before;
          list.css('margin-left', 0).show();
          if (!height) {
            height = list.height();
          }
          // Using custom animation as slideDown has annoying 'bounce effect'
          list.css('height', 0).animate({
            'height': height
          }, 200);
          on_button = true;
        } else {
          list.fadeOut(200);
        }
        button.toggleClass('buttondown buttonup');
      }).hover(function () {
        on_button = true;
      }).mouseout(function () {
        on_button = false;
      });

      var list_items = $('#main_menu li');

      // Check if JS method of hovering needs to be used (Webkit bug)
      list_items.mouseover(function () {
        js_hover = ($(this).css('background-color') === 'rgba(0, 0, 0, 0)');

        list_items.unbind('mouseover');
        if (js_hover) {
          list_items.mouseover(function () {
            this.style.backgroundColor = '#FFC';
          }).mouseout(function () {
            this.style.backgroundColor = 'transparent';
            return true;
          });
        }
      });
    })();
    // Made public for UI customization.
    // TODO: Group UI functions into a public editor.ui interface.
    editor.addDropDown = function (elem, callback, dropUp) {
      if ($(elem).length === 0) {
        return;
      } // Quit if called on non-existant element
      var button = $(elem).find('button');
      var list = $(elem).find('ul').attr('id', $(elem)[0].id + '-list');
      var on_button = false;
      if (dropUp) {
        $(elem).addClass('dropup');
      } else {
        // Move list to place where it can overflow container
        $('#option_lists').append(list);
      }
      list.find('li').bind('mouseup', callback);

      $(window).mouseup(function (evt) {
        if (!on_button) {
          button.removeClass('down');
          list.hide();
        }
        on_button = false;
      });

      button.bind('mousedown', function () {
        if (!button.hasClass('down')) {
          if (!dropUp) {
            var pos = $(elem).position();
            list.css({
              top: pos.top + 24,
              left: pos.left - 10
            });
          }
          list.show();
          on_button = true;
        } else {
          list.hide();
        }
        button.toggleClass('down');
      }).hover(function () {
        on_button = true;
      }).mouseout(function () {
        on_button = false;
      });
    };

    editor.addDropDown('#font_family_dropdown', function () {
      $('#font_family').val($(this).text()).change();
    });

    editor.addDropDown('#opacity_dropdown', function () {
      if ($(this).find('div').length) {
        return;
      }
      var perc = parseInt($(this).text().split('%')[0], 10);
      changeOpacity(false, perc);
    }, true);

    // For slider usage, see: http://jqueryui.com/demos/slider/
    $('#opac_slider').slider({
      start: function () {
        $('#opacity_dropdown li:not(.special)').hide();
      },
      stop: function () {
        $('#opacity_dropdown li').show();
        $(window).mouseup();
      },
      slide: function (evt, ui) {
        changeOpacity(ui);
      }
    });

    editor.addDropDown('#blur_dropdown', $.noop);

    var slideStart = false;

    $('#blur_slider').slider({
      max: 10,
      step: 0.1,
      stop: function (evt, ui) {
        slideStart = false;
        changeBlur(ui);
        $('#blur_dropdown li').show();
        $(window).mouseup();
      },
      start: function () {
        slideStart = true;
      },
      slide: function (evt, ui) {
        changeBlur(ui, null, slideStart);
      }
    });

    addAltDropDown('#stroke_linecap', '#linecap_opts', function () {
      setStrokeOpt(this, true);
    }, {
      dropUp: true
    });

    addAltDropDown('#stroke_linejoin', '#linejoin_opts', function () {
      setStrokeOpt(this, true);
    }, {
      dropUp: true
    });

    addAltDropDown('#tool_position', '#position_opts', function () {
      var letter = this.id.replace('tool_pos', '').charAt(0);
      svgCanvas.alignSelectedElements(letter, 'page');
    }, {
      multiclick: true
    });

    /*

        When a flyout icon is selected
            (if flyout) {
            - Change the icon
            - Make pressing the button run its stuff
            }
            - Run its stuff

        When its shortcut key is pressed
            - If not current in list, do as above
            , else:
            - Just run its stuff

        */

    // Unfocus text input when workarea is mousedowned.
    (function () {
      var inp;
      var unfocus = function () {
        $(inp).blur();
      };

      $('#svg_editor').find('button, select, input:not(#text)').focus(function () {
        inp = this;
        ui_context = 'toolbars';
        workarea.mousedown(unfocus);
      }).blur(function () {
        ui_context = 'canvas';
        workarea.unbind('mousedown', unfocus);
        // Go back to selecting text if in textedit mode
        if (svgCanvas.getMode() === 'textedit') {
          $('#text').focus();
        }
      });
    })();

    var clickFHPath = function () {
      if (toolButtonClick('#tool_fhpath')) {
        svgCanvas.setMode('fhpath');
      }
    };

    var clickLine = function () {
      if (toolButtonClick('#tool_line')) {
        svgCanvas.setMode('line');
      }
    };

    var clickSquare = function () {
      if (toolButtonClick('#tool_square')) {
        svgCanvas.setMode('square');
      }
    };

    var clickRect = function () {
      if (toolButtonClick('#tool_rect')) {
        svgCanvas.setMode('rect');
      }
    };

    var clickFHRect = function () {
      if (toolButtonClick('#tool_fhrect')) {
        svgCanvas.setMode('fhrect');
      }
    };

    var clickCircle = function () {
      if (toolButtonClick('#tool_circle')) {
        svgCanvas.setMode('circle');
      }
    };

    var clickEllipse = function () {
      if (toolButtonClick('#tool_ellipse')) {
        svgCanvas.setMode('ellipse');
      }
    };

    var clickFHEllipse = function () {
      if (toolButtonClick('#tool_fhellipse')) {
        svgCanvas.setMode('fhellipse');
      }
    };

    var clickImage = function () {
      if (toolButtonClick('#tool_image')) {
        svgCanvas.setMode('image');
      }
    };

    var unzoom = function () {
      editor.resetView();
    };

    var clickText = function () {
      if (toolButtonClick('#tool_text')) {
        svgCanvas.setMode('text');
      }
    };

    var clickPath = function () {
      if (toolButtonClick('#tool_path')) {
        svgCanvas.setMode('path');
      }
    };

    var triggerGridTool = function () {
      if (toolButtonClick('#tool_grid')) {
        if (selectedElement != null || multiselected) {
          ToolPanelsController.setVisibility(ToolPanelsController.type != 'gridArray' || !ToolPanelsController.isVisible);
          ToolPanelsController.setType('gridArray');
          ToolPanelsController.render();
        } else {
          Alert.popUp({
            id: 'select first',
            message: LANG.popup.select_first,
            caption: LANG.left_panel.label.array
          });
        }
      }
    }
    editor.triggerGridTool = triggerGridTool;

    let triggerOffsetTool = function () {
      if (selectedElement.tagName === 'g' && selectedElement.getAttribute('data-tempgroup') === 'true') {
        const childs: HTMLElement[] = Array.from(selectedElement.childNodes);
        const supportOffset = childs.every((child) => { return !['g', 'text', 'image', 'use'].includes(child.tagName) });
        if (!supportOffset) {
          Alert.popUp({
            id: 'Offset not support',
            message: LANG.tool_panels._offset.not_support_message,
            caption: LANG.tool_panels.offset,
          });
          return;
        }
      }
      if (selectedElement != null || multiselected) {
        ToolPanelsController.setVisibility(ToolPanelsController.type != 'offset' || !ToolPanelsController.isVisible);
        ToolPanelsController.setType('offset');
        ToolPanelsController.render();
      } else {
        Alert.popUp({
          id: 'select first',
          message: LANG.popup.select_first,
          caption: LANG.tool_panels.offset,
        });
      }
    }
    editor.triggerOffsetTool = triggerOffsetTool;

    let triggerNestTool = function () {
      if (selectedElement != null || multiselected) {
        ToolPanelsController.setVisibility(ToolPanelsController.type != 'nest' || !ToolPanelsController.isVisible);
        ToolPanelsController.setType('nest');
        ToolPanelsController.render();
      } else {
        Alert.popUp({
          id: 'select first',
          message: LANG.popup.select_first,
          caption: LANG.tool_panels.nest
        });
      }
    }
    editor.triggerNestTool = triggerNestTool;

    // Delete is a contextual tool that only appears in the ribbon if
    // an element has been selected
    var deleteSelected = function () {
      if (selectedElement != null || multiselected) {
        svgCanvas.deleteSelectedElements();
      }
      if (svgedit.path.path) {
        svgedit.path.path.onDelete();
      }
    };

    var cutSelected = function () {
      // disabled when focusing input element
      if (document.activeElement.tagName.toLowerCase() === 'input') {
        return;
      }
      if (!svgCanvas.textActions.isEditing && (selectedElement != null || multiselected)) {
        svgCanvas.cutSelectedElements();
        canv_menu.enableContextMenuItems('#paste,#paste_in_place');
      }
    };
    document.addEventListener('cut', cutSelected, false);

    var copySelected = function () {
      // disabled when focusing input element
      if (document.activeElement.tagName.toLowerCase() === 'input') {
        return;
      }
      if (!svgCanvas.textActions.isEditing && (selectedElement != null || multiselected)) {
        svgCanvas.copySelectedElements();
        canv_menu.enableContextMenuItems('#paste,#paste_in_place');
      }
    };
    document.addEventListener('copy', copySelected, false);

    // handle paste
    document.addEventListener('paste', async (e) => {
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
                  ImageData(
                    blobSrc,
                    {
                      grayscale: {
                        is_rgba: true,
                        is_shading: true,
                        is_svg: false,
                        threshold: 254,
                      },
                      onComplete: function (result) {
                        let newImage = svgCanvas.addSvgElementFromJson({
                          element: 'image',
                          attr: {
                            x: 0,
                            y: 0,
                            width: result.canvas.width,
                            height: result.canvas.height,
                            id: svgCanvas.getNextId(),
                            style: 'pointer-events:inherit',
                            preserveAspectRatio: 'none',
                            'data-threshold': 254,
                            'data-shading': true,
                            'data-ratiofixed': true,
                            origImage: blobSrc,
                            'xlink:href': result.pngBase64,
                          }
                        });
                        svgCanvas.updateElementColor(newImage);
                      }
                    }
                  );
                } else {
                  Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    message: LANG.svg_editor.unable_to_fetch_clipboard_img,
                  });
                }
              }
            }
          }
        }
      }
      if (!importedFromClipboard) {
        pasteInCenter();
      }
    });

    var pasteInCenter = function () {
      var zoom = svgCanvas.getZoom();
      var x = (workarea[0].scrollLeft + workarea.width() / 2) / zoom - svgCanvas.contentW;
      var y = (workarea[0].scrollTop + workarea.height() / 2) / zoom - svgCanvas.contentH;
      svgCanvas.pasteElements('point', x, y);
    };

    var moveUpSelectedElement = function () {
      if (selectedElement != null) {
        svgCanvas.moveUpSelectedElement();
      }
    };

    var moveDownSelectedElement = function () {
      if (selectedElement != null) {
        svgCanvas.moveDownSelectedElement();
      }
    };

    var moveTopSelectedElement = function () {
      if (selectedElement != null) {
        svgCanvas.moveTopBottomSelected('top');
      }
    };

    var moveBottomSelectedElement = function () {
      if (selectedElement != null) {
        svgCanvas.moveTopBottomSelected('bottom');
      }
    };

    var convertToPath = function () {
      if (selectedElement != null) {
        svgCanvas.convertToPath();
      }
    };

    var reorientPath = function () {
      if (selectedElement != null) {
        path.reorient();
      }
    };

    var makeHyperlink = function () {
      if (selectedElement != null || multiselected) {
        $.prompt(uiStrings.notification.enterNewLinkURL, 'http://', function (url) {
          if (url) {
            svgCanvas.makeHyperlink(url);
          }
        });
      }
    };

    var moveSelected = function (dx, dy) {
      if (selectedElement != null || multiselected) {
        if (curConfig.gridSnapping) {
          // Use grid snap value regardless of zoom level
          var multi = svgCanvas.getZoom() * curConfig.snappingStep;
          dx *= multi;
          dy *= multi;
        }
        svgCanvas.moveSelectedElements(dx, dy);
      }
    };

    var linkControlPoints = function () {
      $('#tool_node_link').toggleClass('push_button_pressed tool_button');
      var linked = $('#tool_node_link').hasClass('push_button_pressed');
      path.linkControlPoints(linked);
    };

    var clonePathNode = function () {
      if (path.getNodePoint()) {
        path.clonePathNode();
      }
    };

    var deletePathNode = function () {
      if (path.getNodePoint()) {
        path.deletePathNode();
      }
    };

    var addSubPath = function () {
      var button = $('#tool_add_subpath');
      var sp = !button.hasClass('push_button_pressed');
      button.toggleClass('push_button_pressed tool_button');
      path.addSubPath(sp);
    };

    var opencloseSubPath = function () {
      path.opencloseSubPath();
    };

    var clearScene = function () {
      Alert.popById('clear-scene');
      Alert.popUp({
        id: 'clear-scene',
        message: uiStrings.notification.QwantToClear,
        buttonType: AlertConstants.YES_NO,
        onYes: () => {
          setSelectMode();
          svgCanvas.clear();
          updateCanvas({
            autoCenter: true
          });
          unzoom();
          LayerPanelController.updateLayerPanel();
          updateContextPanel();
          prepPaints();
          svgedit.transformlist.resetListMap();
          svgCanvas.runExtensions('onNewDocument');
        }
      });
    };

    editor.clearScene = clearScene;

    var clickBold = function () {
      svgCanvas.setBold(!svgCanvas.getBold());
      updateContextPanel();
      return false;
    };

    var clickItalic = function () {
      svgCanvas.setItalic(!svgCanvas.getItalic());
      updateContextPanel();
      return false;
    };

    var clickSave = function () {
      // In the future, more options can be provided here
      var saveOpts = {
        'images': $.pref('img_save'),
        'round_digits': 6
      };
      svgCanvas.save(saveOpts);
    };

    var clickExport = function () {
      $.select('Select an image type for export: ', [
        // See http://kangax.github.io/jstests/toDataUrl_mime_type_test/ for a useful list of MIME types and browser support
        // 'ICO', // Todo: Find a way to preserve transparency in SVG-Edit if not working presently and do full packaging for x-icon; then switch back to position after 'PNG'
        'PNG',
        'JPEG', 'BMP', 'WEBP', 'PDF'
      ], function (imgType) { // todo: replace hard-coded msg with uiStrings.notification.
        if (!imgType) {
          return;
        }
        // Open placeholder window (prevents popup)
        var exportWindowName;

        function openExportWindow() {
          var str = uiStrings.notification.loadingImage;
          if (curConfig.exportWindowType === 'new') {
            editor.exportWindowCt++;
          }
          exportWindowName = curConfig.canvasName + editor.exportWindowCt;
          exportWindow = window.open(
            'data:text/html;charset=utf-8,' + encodeURIComponent('<title>' + str + '</title><h1>' + str + '</h1>'),
            exportWindowName
          );
        }
        if (imgType === 'PDF') {
          if (!customExportPDF) {
            openExportWindow();
          }
          svgCanvas.exportPDF(exportWindowName);
        } else {
          if (!customExportImage) {
            openExportWindow();
          }
          var quality = parseInt($('#image-slider').val() as string, 10) / 100;
          svgCanvas.rasterExport(imgType, quality, exportWindowName);
        }
      }, function () {
        var sel = $(this);
        if (sel.val() === 'JPEG' || sel.val() === 'WEBP') {
          if (!$('#image-slider').length) {
            $('<div><label>Quality: <input id="image-slider" type="range" min="1" max="100" value="92" /></label></div>').appendTo(sel.parent()); // Todo: i18n-ize label
          }
        } else {
          $('#image-slider').parent().remove();
        }
      });
    };

    // by default, svgCanvas.open() is a no-op.
    // it is up to an extension mechanism (opera widget, etc)
    // to call setCustomHandlers() which will make it do something
    var clickOpen = function () {
      svgCanvas.open();
    };

    var clickImport = function () { };

    var clickUndo = function () {
      if (undoMgr.getUndoStackSize() > 0) {
        undoMgr.undo();
        LayerPanelController.updateLayerPanel();
      }
    };
    editor.clickUndo = clickUndo;
    //hack QQ. to let svgeditor-function-wrapper get this function

    var clickRedo = function () {
      if (undoMgr.getRedoStackSize() > 0) {
        undoMgr.redo();
        LayerPanelController.updateLayerPanel();
      }
    };
    editor.clickRedo = clickRedo;

    var clickGroup = function () {
      // group
      if (multiselected) {
        svgCanvas.groupSelectedElements();
      }
      // ungroup
      else if (selectedElement) {
        svgCanvas.ungroupSelectedElement();
      }
    };

    var clickClone = function () {
      svgCanvas.cloneSelectedElements(20, 20);
    };

    var clickAlign = function () {
      var letter = this.id.replace('tool_align', '').charAt(0);
      svgCanvas.alignSelectedElements(letter, $('#align_relative_to').val());
    };

    var clickWireframe = function () {
      $('#tool_wireframe').toggleClass('push_button_pressed tool_button');
      workarea.toggleClass('wireframe');

      if (supportsNonSS) {
        return;
      }
      var wf_rules = $('#wireframe_rules');
      if (!wf_rules.length) {
        wf_rules = $('<style id="wireframe_rules"></style>').appendTo('head');
      } else {
        wf_rules.empty();
      }

      updateWireFrame();
    };

    $('#svg_docprops_container, #svg_prefs_container').draggable({
      cancel: 'button,fieldset',
      containment: 'window'
    });

    var showDocProperties = function () {
      if (docprops) {
        return;
      }
      docprops = true;

      // This selects the correct radio button by using the array notation
      $('#image_save_opts input').val([$.pref('img_save')]);

      // update resolution option with actual resolution
      var res = svgCanvas.getResolution();
      if (curConfig.baseUnit !== 'px') {
        res.w = svgedit.units.convertUnit(res.w) + curConfig.baseUnit;
        res.h = svgedit.units.convertUnit(res.h) + curConfig.baseUnit;
      }

      $('#canvas_width').val(res.w);
      $('#canvas_height').val(res.h);
      $('#canvas_title').val(svgCanvas.getDocumentTitle());

      $('#svg_docprops').show();
    };

    var showPreferences = function () {
      if (preferences) {
        return;
      }
      preferences = true;
      $('#main_menu').hide();

      // Update background color with current one
      var blocks = $('#bg_blocks div');
      var cur_bg = 'cur_background';
      var canvas_bg = curPrefs.bkgd_color;
      var url = $.pref('bkgd_url');
      blocks.each(function () {
        var blk = $(this);
        var is_bg = blk.css('background-color') === canvas_bg;
        blk.toggleClass(cur_bg, is_bg);
        if (is_bg) {
          $('#canvas_bg_url').removeClass(cur_bg);
        }
      });
      if (!canvas_bg) {
        blocks.eq(0).addClass(cur_bg);
      }
      if (url) {
        $('#canvas_bg_url').val(url);
      }
      $('#grid_snapping_on').prop('checked', curConfig.gridSnapping);
      $('#grid_snapping_step').attr('value', curConfig.snappingStep);
      $('#grid_color').attr('value', curConfig.gridColor);

      $('#svg_prefs').show();
    };

    var hideSourceEditor = function () {
      $('#svg_source_editor').hide();
      editingsource = false;
      $('#svg_source_textarea').blur();
    };

    var saveSourceEditor = function () {
      if (!editingsource) {
        return;
      }

      var saveChanges = function () {
        svgCanvas.clearSelection();
        hideSourceEditor();
        unzoom();
        LayerPanelController.updateLayerPanel();
        updateTitle();
        prepPaints();
      };

      if (!svgCanvas.setSvgString($('#svg_source_textarea').val())) {
        $.confirm(uiStrings.notification.QerrorsRevertToSource, function (ok) {
          if (!ok) {
            return false;
          }
          saveChanges();
        });
      } else {
        saveChanges();
      }
      setSelectMode();
    };

    var hideDocProperties = function () {
      $('#svg_docprops').hide();
      $('#canvas_width,#canvas_height').removeAttr('disabled');
      ($('#resolution')[0] as HTMLSelectElement).selectedIndex = 0;
      $('#image_save_opts input').val([$.pref('img_save')]);
      docprops = false;
    };

    var hidePreferences = function () {
      $('#svg_prefs').hide();
      preferences = false;
    };

    var saveDocProperties = function () {
      // set title
      const newTitle = $('#canvas_title').val() as string;
      updateTitle(newTitle);
      svgCanvas.setDocumentTitle(newTitle);

      // update resolution
      var width = $('#canvas_width'),
        w = width.val();
      var height = $('#canvas_height'),
        h = height.val();

      if (w !== 'fit' && !svgedit.units.isValidUnit('width', w)) {
        Alert.popUp({
          id: 'invalid attr',
          message: uiStrings.notification.invalidAttrValGiven,
        });
        width.parent().addClass('error');
        return false;
      }

      width.parent().removeClass('error');

      if (h !== 'fit' && !svgedit.units.isValidUnit('height', h)) {
        Alert.popUp({
          id: 'invalid attr',
          message: uiStrings.notification.invalidAttrValGiven,
        });
        height.parent().addClass('error');
        return false;
      }

      height.parent().removeClass('error');

      if (!svgCanvas.setResolution(w, h)) {
        Alert.popUp({
          id: 'invalid attr',
          message: uiStrings.notification.noContentToFitTo,
        });
        return false;
      }

      // Set image save option
      $.pref('img_save', $('#image_save_opts :checked').val());
      updateCanvas();
      hideDocProperties();
    };

    var savePreferences = editor.savePreferences = function () {
      // Set background
      var color = $('#bg_blocks div.cur_background').css('background-color') || '#FFF';
      setBackground(color, $('#canvas_bg_url').val());

      // set language
      var lang = $('#lang_select').val();
      if (lang !== $.pref('lang')) {
        editor.putLocale(lang, good_langs);
      }

      // set icon size
      setIconSize($('#iconsize').val());

      // set grid setting
      curConfig.gridSnapping = ($('#grid_snapping_on')[0] as HTMLInputElement).checked;
      curConfig.snappingStep = parseInt($('#grid_snapping_step').val() as string, 10);
      curConfig.gridColor = $('#grid_color').val() as string;
      curConfig.showRulers = ($('#show_rulers')[0] as HTMLInputElement).checked;

      $('#rulers').toggle(curConfig.showRulers);
      if (curConfig.showRulers) {
        updateRulers();
      }
      curConfig.baseUnit = $('#base_unit').val() as string;

      svgCanvas.setConfig(curConfig);

      updateCanvas();
      hidePreferences();
    };

    var resetScrollPos = $.noop;

    var cancelOverlays = function () {
      $('#dialog_box').hide();
      if (!editingsource && !docprops && !preferences) {
        if (cur_context) {
          svgCanvas.leaveContext();
        }
        return;
      }

      if (editingsource) {
        if (origSource !== $('#svg_source_textarea').val()) {
          $.confirm(uiStrings.notification.QignoreSourceChanges, function (ok) {
            if (ok) {
              hideSourceEditor();
            }
          });
        } else {
          hideSourceEditor();
        }
      } else if (docprops) {
        hideDocProperties();
      } else if (preferences) {
        hidePreferences();
      }
      resetScrollPos();
    };

    var win_wh = {
      width: $(window).width(),
      height: $(window).height()
    };

    $(window).resize(function (evt) {
      $.each(win_wh, function (type, val) {
        var curval = $(window)[type]();
        workarea[0]['scroll' + (type === 'width' ? 'Left' : 'Top')] -= (curval - val) / 2;
        win_wh[type] = curval;
      });
      setFlyoutPositions();
    });

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

    $('#url_notice').click(function () {
      Alert.popUp({
        id: 'url notice',
        message: this.title,
      });
    });

    $('#change_image_url').click(promptImgURL);

    // added these event handlers for all the push buttons so they
    // behave more like buttons being pressed-in and not images
    (function () {
      var toolnames = ['clear', 'open', 'save', 'source', 'delete', 'delete_multi', 'paste', 'clone', 'clone_multi', 'move_top', 'move_bottom'];
      var all_tools = '';
      var cur_class = 'tool_button_current';

      $.each(toolnames, function (i, item) {
        all_tools += (i ? ',' : '') + '#tool_' + item;
      });

      $(all_tools).mousedown(function () {
        $(this).addClass(cur_class);
      }).bind('mousedown mouseout', function () {
        $(this).removeClass(cur_class);
      });

      $('#tool_undo, #tool_redo').mousedown(function () {
        if (!$(this).hasClass('disabled')) {
          $(this).addClass(cur_class);
        }
      }).bind('mousedown mouseout', function () {
        $(this).removeClass(cur_class);
      });
    })();

    // switch modifier key in tooltips if mac
    // NOTE: This code is not used yet until I can figure out how to successfully bind ctrl/meta
    // in Opera and Chrome
    if (svgedit.browser.isMac() && !window['opera']) {
      var shortcutButtons = ['tool_clear', 'tool_save', 'tool_source', 'tool_undo', 'tool_redo', 'tool_clone'];
      let i = shortcutButtons.length;
      while (i--) {
        var button = document.getElementById(shortcutButtons[i]);
        if (button) {
          var title = button.title;
          var index = title.indexOf('Ctrl+');
          button.title = [title.substr(0, index), 'Cmd+', title.substr(index + 5)].join('');
        }
      }
    }

    // TODO: go back to the color boxes having white background-color and then setting
    //	background-image to none.png (otherwise partially transparent gradients look weird)
    var colorPicker = function (elem) {
      var picker = elem.attr('id') === 'stroke_color' ? 'stroke' : 'fill';
      //				var opacity = (picker === 'stroke' ? $('#stroke_opacity') : $('#fill_opacity'));
      var paint = paintBox[picker].paint;
      var title = (picker === 'stroke' ? 'Pick a Stroke Paint and Opacity' : 'Pick a Fill Paint and Opacity');
      // var was_none = false; // Currently unused
      var pos = elem.offset();
      $('#color_picker')
        .draggable({
          cancel: '.jGraduate_tabs, .jGraduate_colPick, .jGraduate_gradPick, .jPicker',
          containment: 'window'
        })
        .css(curConfig.colorPickerCSS || {
          'left': pos.left - 140,
          'bottom': 40
        })
        .jGraduate({
          paint: paint,
          window: {
            pickerTitle: title
          },
          images: {
            clientPath: curConfig.jGraduatePath
          },
          newstop: 'inverse'
        },
          function (p) {
            paint = new $.jGraduate.Paint(p);
            paintBox[picker].setPaint(paint);
            svgCanvas.setPaint(picker, paint);
            $('#color_picker').hide();
          },
          function () {
            $('#color_picker').hide();
          });
    };

    var PaintBox = function (container, type) {
      var paintColor, paintOpacity,
        cur = curConfig[type === 'fill' ? 'initFill' : 'initStroke'];
      // set up gradients to be used for the buttons
      var svgdocbox = new DOMParser().parseFromString(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="16.5" height="16.5"' +
        '					fill="#' + cur.color + '" opacity="' + cur.opacity + '"/>' +
        '					<defs><linearGradient id="gradbox_"/></defs></svg>', 'text/xml');
      var docElem = svgdocbox.documentElement;

      docElem = $(container)[0].appendChild(document.importNode(docElem, true));
      docElem.setAttribute('width', '16.5');

      this.rect = docElem.firstChild;
      this.defs = docElem.getElementsByTagName('defs')[0];
      this.grad = this.defs.firstChild;
      this.paint = new $.jGraduate.Paint({
        solidColor: cur.color
      });
      this.type = type;

      this.setPaint = function (paint, apply) {
        this.paint = paint;

        var fillAttr = 'none';
        var ptype = paint.type;
        var opac = paint.alpha / 100;

        switch (ptype) {
          case 'solidColor':
            fillAttr = (paint[ptype] !== 'none') ? '#' + paint[ptype] : paint[ptype];
            break;
          case 'linearGradient':
          case 'radialGradient':
            this.defs.removeChild(this.grad);
            this.grad = this.defs.appendChild(paint[ptype]);
            var id = this.grad.id = 'gradbox_' + this.type;
            fillAttr = 'url(#' + id + ')';
            break;
        }

        this.rect.setAttribute('fill', fillAttr);
        this.rect.setAttribute('opacity', opac);

        if (apply) {
          svgCanvas.setColor(this.type, paintColor, true);
          svgCanvas.setPaintOpacity(this.type, paintOpacity, true);
        }
      };

      this.update = function (apply) {
        if (!selectedElement) {
          return;
        }
        var i, len;
        var type = this.type;
        switch (selectedElement.tagName) {
          case 'use':
          case 'image':
          case 'foreignObject':
            // These elements don't have fill or stroke, so don't change
            // the current value
            return;
          case 'g':
          case 'a':
            var gPaint = null;

            var childs = selectedElement.getElementsByTagName('*');
            for (i = 0, len = childs.length; i < len; i++) {
              var elem = childs[i];
              var p = elem.getAttribute(type);
              if (i === 0) {
                gPaint = p;
              } else if (gPaint !== p) {
                gPaint = null;
                break;
              }
            }

            if (gPaint === null) {
              // No common color, don't update anything
              paintColor = null;
              return;
            }
            paintColor = gPaint;
            paintOpacity = 1;
            break;
          default:
            paintOpacity = parseFloat(selectedElement.getAttribute(type + '-opacity'));
            if (isNaN(paintOpacity)) {
              paintOpacity = 1.0;
            }

            var defColor = type === 'fill' ? 'black' : 'none';
            paintColor = selectedElement.getAttribute(type) || defColor;
        }

        if (apply) {
          svgCanvas.setColor(type, paintColor, true);
          svgCanvas.setPaintOpacity(type, paintOpacity, true);
        }

        paintOpacity *= 100;

        var paint = getPaint(paintColor, paintOpacity, type);
        // update the rect inside #fill_color/#stroke_color
        this.setPaint(paint);
      };

      this.prep = function () {
        var ptype = this.paint.type;

        switch (ptype) {
          case 'linearGradient':
          case 'radialGradient':
            var paint = new $.jGraduate.Paint({
              copy: this.paint
            });
            svgCanvas.setPaint(type, paint);
            break;
        }
      };
    };

    paintBox.fill = new PaintBox('#fill_color', 'fill');
    paintBox.stroke = new PaintBox('#stroke_color', 'stroke');

    $('#stroke_width').val(curConfig.initStroke.width);
    $('#group_opacity').val(curConfig.initOpacity * 100);

    // Use this SVG elem to test vectorEffect support
    var testEl = paintBox.fill.rect.cloneNode(false);
    testEl.setAttribute('style', 'vector-effect:non-scaling-stroke');
    supportsNonSS = (testEl.style.vectorEffect === 'non-scaling-stroke');
    testEl.removeAttribute('style');
    var svgdocbox = paintBox.fill.rect.ownerDocument;
    // Use this to test support for blur element. Seems to work to test support in Webkit
    var blurTest = svgdocbox.createElementNS(svgedit.NS.SVG, 'feGaussianBlur');
    if (blurTest.stdDeviationX === undefined) {
      $('#tool_blur').hide();
    }
    $(blurTest).remove();

    // Test for zoom icon support
    (function () {
      var pre = '-' + uaPrefix.toLowerCase() + '-zoom-';
      var zoom = pre + 'in';
      workarea.css('cursor', zoom);
      if (workarea.css('cursor') === zoom) {
        zoomInIcon = zoom;
        zoomOutIcon = pre + 'out';
      }
      workarea.css('cursor', 'auto');
    })();

    // Test for embedImage support (use timeout to not interfere with page load)
    setTimeout(function () {
      svgCanvas.embedImage('js/lib/svgeditor/images/logo.png', function (datauri) {
        if (!datauri) {
          // Disable option
          $('#image_save_opts [value=embed]').attr('disabled', 'disabled');
          $('#image_save_opts input').val(['ref']);
          $.pref('img_save', 'ref');
          $('#image_opt_embed').css('color', '#666').attr('title', uiStrings.notification.featNotSupported);
        }
      });
    }, 1000);

    $('#fill_color, #tool_fill .icon_label').click(function () {
      colorPicker($('#fill_color'));
      updateToolButtonState();
    });

    $('#stroke_color, #tool_stroke .icon_label').click(function () {
      colorPicker($('#stroke_color'));
      updateToolButtonState();
    });

    $('#group_opacityLabel').click(function () {
      $('#opacity_dropdown button').mousedown();
      $(window).mouseup();
    });

    $('#zoomLabel').click(function () {
      $('#zoom_dropdown button').mousedown();
      $(window).mouseup();
    });

    $('#tool_move_top').mousedown(function (evt) {
      $('#tools_stacking').show();
      evt.preventDefault();
    });

    $('.layer_button').mousedown(function () {
      $(this).addClass('layer_buttonpressed');
    }).mouseout(function () {
      $(this).removeClass('layer_buttonpressed');
    }).mouseup(function () {
      $(this).removeClass('layer_buttonpressed');
    });

    $('.push_button').mousedown(function () {
      if (!$(this).hasClass('disabled')) {
        $(this).addClass('push_button_pressed').removeClass('push_button');
      }
    }).mouseout(function () {
      $(this).removeClass('push_button_pressed').addClass('push_button');
    }).mouseup(function () {
      $(this).removeClass('push_button_pressed').addClass('push_button');
    });

    LayerPanelController.updateLayerPanel();

    //	function changeResolution(x,y) {
    //		var zoom = svgCanvas.getResolution().zoom;
    //		setResolution(x * zoom, y * zoom);
    //	}

    var centerCanvas = function () {
      // this centers the canvas vertically in the workarea (horizontal handled in CSS)
      workarea.css('line-height', workarea.height() + 'px');
    };

    $(window).bind('load resize', centerCanvas);

    function stepFontSize(elem, step) {
      var orig_val = Number(elem.value);
      var sug_val = orig_val + step;
      var increasing = sug_val >= orig_val;
      if (step === 0) {
        return orig_val;
      }

      if (orig_val >= 24) {
        if (increasing) {
          return Math.round(orig_val * 1.1);
        }
        return Math.round(orig_val / 1.1);
      }
      if (orig_val <= 1) {
        if (increasing) {
          return orig_val * 2;
        }
        return orig_val / 2;
      }
      return sug_val;
    }

    //	function setResolution(w, h, center) {
    //		updateCanvas();
    // //		w-=0; h-=0;
    // //		$('#svgcanvas').css( { 'width': w, 'height': h } );
    // //		$('#canvas_width').val(w);
    // //		$('#canvas_height').val(h);
    // //
    // //		if (center) {
    // //			var w_area = workarea;
    // //			var scroll_y = h/2 - w_area.height()/2;
    // //			var scroll_x = w/2 - w_area.width()/2;
    // //			w_area[0].scrollTop = scroll_y;
    // //			w_area[0].scrollLeft = scroll_x;
    // //		}
    //	}

    $('#resolution').change(function (this: HTMLSelectElement) {
      var wh = $('#canvas_width,#canvas_height');
      if (!this.selectedIndex) {
        if ($('#canvas_width').val() === 'fit') {
          wh.removeAttr('disabled').val(100);
        }
      } else if (this.value === 'content') {
        wh.val('fit').attr('disabled', 'disabled');
      } else {
        var dims = this.value.split('x');
        $('#canvas_width').val(dims[0]);
        $('#canvas_height').val(dims[1]);
        wh.removeAttr('disabled');
      }
    });

    //Prevent browser from erroneously repopulating fields
    $('input,select').attr('autocomplete', 'off');

    // Associate all button actions as well as non-button keyboard shortcuts
    Actions = (function () {
      // sel:'selector', fn:function, evt:'event', key:[key, preventDefault, NoDisableInInput]
      var tool_buttons = [{
        sel: '#tool_select',
        fn: clickSelect,
        evt: 'click',
      },
      {
        sel: '#tool_fhpath',
        fn: clickFHPath,
        evt: 'click',
      },
      {
        sel: '#tool_line',
        fn: clickLine,
        evt: 'click',
      },
      {
        sel: '#tool_rect',
        fn: clickRect,
        evt: 'mouseup',
        parent: '#tools_rect',
        icon: 'rect'
      },
      {
        sel: '#tool_square',
        fn: clickSquare,
        evt: 'mouseup',
        parent: '#tools_rect',
        icon: 'square'
      },
      {
        sel: '#tool_fhrect',
        fn: clickFHRect,
        evt: 'mouseup',
        parent: '#tools_rect',
        icon: 'fh_rect'
      },
      {
        sel: '#tool_ellipse',
        fn: clickEllipse,
        evt: 'mouseup',
        parent: '#tools_ellipse',
        icon: 'ellipse'
      },
      {
        sel: '#tool_circle',
        fn: clickCircle,
        evt: 'mouseup',
        parent: '#tools_ellipse',
        icon: 'circle'
      },
      {
        sel: '#tool_fhellipse',
        fn: clickFHEllipse,
        evt: 'mouseup',
        parent: '#tools_ellipse',
        icon: 'fh_ellipse'
      },
      {
        sel: '#tool_path',
        fn: clickPath,
        evt: 'mouseup',
        parent: '#tool_path',
      },
      {
        sel: '#tool_text',
        fn: clickText,
        evt: 'click',
      },
      {
        sel: '#tool_grid',
        fn: triggerGridTool,
        evt: 'mouseup'
      },
      {
        sel: '#tool_image',
        fn: clickImage,
        evt: 'mouseup'
      },
      // {sel: '#tool_zoom', fn: clickZoom, evt: 'mouseup', key: ['Z', true]},
      // {sel: '#tool_clear', fn: clickClear, evt: 'mouseup', key: ['N', true]},
      {
        sel: '#tool_save',
        fn: function () {
          if (editingsource) {
            saveSourceEditor();
          } else {
            clickSave();
          }
        },
        evt: 'mouseup'
      },
      {
        sel: '#tool_export',
        fn: clickExport,
        evt: 'mouseup'
      },
      {
        sel: '#tool_open',
        fn: clickOpen,
        evt: 'mouseup'
      },
      {
        sel: '#tool_import',
        fn: clickImport,
        evt: 'mouseup'
      },
      {
        sel: '#tool_source',
        fn: showSourceEditor,
        evt: 'click'
      },
      {
        sel: '#tool_wireframe',
        fn: clickWireframe,
        evt: 'click'
      },
      {
        sel: '#tool_source_cancel,.overlay,#tool_docprops_cancel,#tool_prefs_cancel',
        fn: cancelOverlays,
        evt: 'click'
      },
      {
        sel: '#tool_source_save',
        fn: saveSourceEditor,
        evt: 'click'
      },
      {
        sel: '#tool_docprops_save',
        fn: saveDocProperties,
        evt: 'click'
      },
      {
        sel: '#tool_docprops',
        fn: showDocProperties,
        evt: 'mouseup'
      },
      {
        sel: '#tool_prefs_save',
        fn: savePreferences,
        evt: 'click'
      },
      {
        sel: '#tool_prefs_option',
        fn: function () {
          showPreferences();
          return false;
        },
        evt: 'mouseup'
      },
      {
        sel: '#tool_delete,#tool_delete_multi',
        fn: deleteSelected,
        evt: 'click'
      },
      {
        sel: '#tool_reorient',
        fn: reorientPath,
        evt: 'click'
      },
      {
        sel: '#tool_node_link',
        fn: linkControlPoints,
        evt: 'click'
      },
      {
        sel: '#tool_node_clone',
        fn: clonePathNode,
        evt: 'click'
      },
      {
        sel: '#tool_node_delete',
        fn: deletePathNode,
        evt: 'click'
      },
      {
        sel: '#tool_openclose_path',
        fn: opencloseSubPath,
        evt: 'click'
      },
      {
        sel: '#tool_add_subpath',
        fn: addSubPath,
        evt: 'click'
      },
      {
        sel: '#tool_move_top',
        fn: moveTopSelectedElement,
        evt: 'click'
      },
      {
        sel: '#tool_move_bottom',
        fn: moveBottomSelectedElement,
        evt: 'click'
      },
      {
        sel: '#tool_topath',
        fn: convertToPath,
        evt: 'click'
      },
      {
        sel: '#tool_make_link,#tool_make_link_multi',
        fn: makeHyperlink,
        evt: 'click'
      },
      {
        sel: '#tool_undo',
        fn: clickUndo,
        evt: 'click'
      },
      {
        sel: '#tool_redo',
        fn: clickRedo,
        evt: 'click'
      },
      {
        sel: '#tool_clone,#tool_clone_multi',
        fn: clickClone,
        evt: 'click'
      },
      {
        sel: '#tool_group_elements',
        fn: clickGroup,
        evt: 'click'
      },
      {
        sel: '#tool_ungroup',
        fn: clickGroup,
        evt: 'click'
      },
      {
        sel: '#tool_unlink_use',
        fn: clickGroup,
        evt: 'click'
      },
      {
        sel: '[id^=tool_align]',
        fn: clickAlign,
        evt: 'click'
      },
      {
        sel: '#tool_bold',
        fn: clickBold,
        evt: 'mousedown'
      },
      {
        sel: '#tool_italic',
        fn: clickItalic,
        evt: 'mousedown'
      },
      {
        sel: '#copy_save_done',
        fn: cancelOverlays,
        evt: 'click'
      },

        // Shortcuts not associated with buttons

        // {key: 'ctrl+left', fn: function(){rotateSelected(0,1);}},
        // {key: 'ctrl+right', fn: function(){rotateSelected(1,1);}},
        // {key: 'ctrl+shift+left', fn: function(){rotateSelected(0,5);}},
        // {key: 'ctrl+shift+right', fn: function(){rotateSelected(1,5);}},
        // {key: 'shift+O', fn: selectPrev},
        // {key: 'shift+P', fn: selectNext},
        // {key: [modKey+'up', true], fn: function(){zoomImage(2);}},
        // {key: [modKey+'down', true], fn: function(){zoomImage(0.5);}},
        // {key: [modKey+']', true], fn: function(){moveTopBottomSelected('Up');}},
        // {key: [modKey+'[', true], fn: function(){moveTopBottomSelected('Down');}},
        // {key: ['up', true], fn: function(){moveSelected(0,-1);}},
        // {key: ['down', true], fn: function(){moveSelected(0,1);}},
        // {key: ['left', true], fn: function(){moveSelected(-1,0);}},
        // {key: ['right', true], fn: function(){moveSelected(1,0);}},
        // {key: 'shift+up', fn: function(){moveSelected(0,-10);}},
        // {key: 'shift+down', fn: function(){moveSelected(0,10);}},
        // {key: 'shift+left', fn: function(){moveSelected(-10,0);}},
        // {key: 'shift+right', fn: function(){moveSelected(10,0);}},
        // {key: ['alt+up', true], fn: function(){svgCanvas.cloneSelectedElements(0,-1);}},
        // {key: ['alt+down', true], fn: function(){svgCanvas.cloneSelectedElements(0,1);}},
        // {key: ['alt+left', true], fn: function(){svgCanvas.cloneSelectedElements(-1,0);}},
        // {key: ['alt+right', true], fn: function(){svgCanvas.cloneSelectedElements(1,0);}},
        // {key: ['alt+shift+up', true], fn: function(){svgCanvas.cloneSelectedElements(0,-10);}},
        // {key: ['alt+shift+down', true], fn: function(){svgCanvas.cloneSelectedElements(0,10);}},
        // {key: ['alt+shift+left', true], fn: function(){svgCanvas.cloneSelectedElements(-10,0);}},
        // {key: ['alt+shift+right', true], fn: function(){svgCanvas.cloneSelectedElements(10,0);}},
      ];

      // Tooltips not directly associated with a single function
      var key_assocs = {
        '4/Shift+4': '#tools_rect_show',
        '5/Shift+5': '#tools_ellipse_show'
      };

      return {
        setAll: function () {
          var flyouts = {};

          $.each(tool_buttons, function (i, opts) {
            // Bind function to button
            var btn;
            if (opts.sel) {
              btn = $(opts.sel);
              if (btn.length === 0) {
                return true;
              } // Skip if markup does not exist
              if (opts.evt) {
                if (svgedit.browser.isTouch() && opts.evt === 'click') {
                  opts.evt = 'mousedown';
                }
                btn[opts.evt](opts.fn);
              }

              // Add to parent flyout menu, if able to be displayed
              if (opts.parent && $(opts.parent + '_show').length !== 0) {
                var f_h = $(opts.parent);
                if (!f_h.length) {
                  f_h = makeFlyoutHolder(opts.parent.substr(1));
                }

                f_h.append(btn);

                if (!$.isArray(flyouts[opts.parent])) {
                  flyouts[opts.parent] = [];
                }
                flyouts[opts.parent].push(opts);
              }
            }
            /*
                // Bind function to shortcut key
                if (opts.key) {
                    // Set shortcut based on options
                    var keyval, disInInp = true, fn = opts.fn, pd = false;
                    if ($.isArray(opts.key)) {
                        keyval = opts.key[0];
                        if (opts.key.length > 1) {pd = opts.key[1];}
                        if (opts.key.length > 2) {disInInp = opts.key[2];}
                    } else {
                        keyval = opts.key;
                    }
                    keyval += '';

                    $.each(keyval.split('/'), function(i, key) {
                        $(document).bind('keydown', key, function(e) {
                            fn();
                            if (pd) {
                                e.preventDefault();
                            }
                            // Prevent default on ALL keys?
                            // return false; //return false in jquery do both preventDefault and stopPropogation
                        });
                    });

                    // Put shortcut in title
                    if (opts.sel && !opts.hidekey && btn.attr('title')) {
                        var newTitle = btn.attr('title').split('[')[0] + ' (' + keyval + ')';
                        key_assocs[keyval] = opts.sel;
                        // Disregard for menu items
                        if (!btn.parents('#main_menu').length) {
                            btn.attr('title', newTitle);
                        }
                    }
                }
                */
          });

          // 'fnkey' means 'cmd' or 'ctrl'
          Shortcuts.on(['del'], deleteSelected);
          //Shortcuts.on(['fnkey', 'z'], clickUndo);
          //if (process.platform === 'darwin') {
          //    Shortcuts.on(['cmd', 'shift', 'z'], clickRedo);
          //} else {
          //    Shortcuts.on(['ctrl', 'y'], clickRedo);
          //}
          //Shortcuts.on(['fnkey', 'd'], clickClone);
          Shortcuts.on(['fnkey', 'a'], (e) => {
            e.preventDefault();
            e.stopPropagation();
            svgCanvas.selectAll();
          });
          const moveUnit = storage.get('default-units') === 'inches' ? 25.4 : 10; // 0.1 in : 1 mm
          Shortcuts.on(['up'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([0], [-moveUnit]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollTop -= 5;
            }
          });
          Shortcuts.on(['shift', 'up'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([0], [-moveUnit * 10]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollTop -= 50;
            }
          });
          Shortcuts.on(['down'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([0], [moveUnit]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollTop += 5;
            }
          });
          Shortcuts.on(['shift', 'down'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([0], [moveUnit * 10]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollTop += 50;
            }
          });
          Shortcuts.on(['left'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([-moveUnit], [0]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollLeft -= 5;
            }
          });
          Shortcuts.on(['shift', 'left'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([-moveUnit * 10], [0]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollLeft -= 50;
            }
          });
          Shortcuts.on(['right'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([moveUnit], [0]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollLeft += 5;
            }
          });
          Shortcuts.on(['shift', 'right'], (e) => {
            e.preventDefault();
            if (selectedElement) {
              moveSelected([moveUnit * 10], [0]);
            } else {
              const workArea = document.getElementById('workarea');
              workArea.scrollLeft += 50;
            }
          });
          // +
          Shortcuts.on(['plus'], () => {
            window['polygonAddSides']();
          });
          // -
          Shortcuts.on(['minus'], () => {
            window['polygonDecreaseSides']();
          });
          Shortcuts.on(['esc'], clickSelect);

          // Setup flyouts
          setupFlyouts(flyouts);

          // Misc additional actions

          // Make 'return' keypress trigger the change event
          $('.attr_changer, #image_url').bind('keydown', 'return',
            function (evt) {
              $(this).change();
              evt.preventDefault();
            }
          );

          // $(window).bind('keydown', 'tab', function(e) {
          // 	if (ui_context === 'canvas') {
          // 		e.preventDefault();
          // 		selectNext();
          // 	}
          // }).bind('keydown', 'shift+tab', function(e) {
          // 	åif (ui_context === 'canvas') {
          // 		e.preventDefault();
          // 		selectPrev();
          // 	}
          // });

        },
        setTitles: function () {
          $.each(key_assocs, function (keyval, sel) {
            var menu = ($(sel).parents('#main_menu').length);

            $(sel).each(function () {
              var t;
              if (menu) {
                t = $(this).text().split(' [')[0];
              } else {
                t = this.title.split(' [')[0];
              }
              var key_str = '';
              // Shift+Up
              $.each(keyval.split('/'), function (i, key) {
                var mod_bits = key.split('+'),
                  mod = '';
                if (mod_bits.length > 1) {
                  mod = mod_bits[0] + '+';
                  key = mod_bits[1];
                }
                key_str += (i ? '/' : '') + mod + (uiStrings['key_' + key] || key);
              });
              if (menu) {
                this.lastChild.textContent = t + ' [' + key_str + ']';
              } else {
                this.title = t + ' [' + key_str + ']';
              }
            });
          });
        },
        getButtonData: function (sel) {
          var b;
          $.each(tool_buttons, function (i, btn) {
            if (btn.sel === sel) {
              b = btn;
            }
          });
          return b;
        }
      };
    })();

    Actions.setAll();

    editor.setWorkAreaContextMenu = function () {
      $('#workarea').contextMenu({
        menu: 'cmenu_canvas',
        inSpeed: 0
      },
        function (action, el, pos) {
          switch (action) {
            case 'delete':
              deleteSelected();
              break;
            case 'cut':
              cutSelected();
              break;
            case 'copy':
              copySelected();
              break;
            case 'paste':
              svgCanvas.pasteElements();
              break;
            case 'paste_in_place':
              svgCanvas.pasteElements('in_place');
              break;
            case 'group':
            case 'group_elements':
              svgCanvas.groupSelectedElements();
              break;
            case 'ungroup':
              svgCanvas.ungroupSelectedElement();
              break;
            case 'move_front':
              moveTopSelectedElement();
              break;
            case 'move_up':
              moveUpSelectedElement();
              break;
            case 'move_down':
              moveDownSelectedElement();
              break;
            case 'move_back':
              moveBottomSelectedElement();
              break;
            default:
              if (svgedit.contextmenu && svgedit.contextmenu.hasCustomHandler(action)) {
                svgedit.contextmenu.getCustomHandler(action).call();
              }
              break;
          }
          if (svgCanvas.clipBoard.length) {
            canv_menu.enableContextMenuItems('#paste,#paste_in_place');
          }
        }
      );
    }

    // Select given tool
    editor.ready(function () {
      var tool,
        itool = curConfig.initTool,
        container = $('#tools_left, #svg_editor .tools_flyout'),
        pre_tool = container.find('#tool_' + itool),
        reg_tool = container.find('#' + itool);
      if (pre_tool.length) {
        tool = pre_tool;
      } else if (reg_tool.length) {
        tool = reg_tool;
      } else {
        tool = $('#tool_select');
      }
      tool.click().mouseup();

      if (curConfig.wireframe) {
        $('#tool_wireframe').click();
      }

      if (curConfig.showRulers) {
        ($('#show_rulers')[0] as HTMLInputElement).checked = true;
      }

      if (curConfig.baseUnit) {
        $('#base_unit').val(curConfig.baseUnit);
      }

      if (curConfig.gridSnapping) {
        ($('#grid_snapping_on')[0] as HTMLInputElement).checked = true;
      }

      if (curConfig.snappingStep) {
        $('#grid_snapping_step').val(curConfig.snappingStep);
      }

      if (curConfig.gridColor) {
        $('#grid_color').val(curConfig.gridColor);
      }
    });

    // init SpinButtons
    $('#rect_rx').SpinButton({
      min: 0,
      max: 1000,
      callback: changeRectRadius
    });
    $('#stroke_width').SpinButton({
      min: 0,
      max: 99,
      smallStep: 0.1,
      callback: changeStrokeWidth
    });
    $('#angle').SpinButton({
      min: -180,
      max: 180,
      step: 5,
      callback: changeRotationAngle
    });
    $('#font_size').SpinButton({
      min: 0.001,
      stepfunc: stepFontSize,
      callback: changeFontSize
    });
    $('#group_opacity').SpinButton({
      min: 0,
      max: 100,
      step: 5,
      callback: changeOpacity
    });
    $('#blur').SpinButton({
      min: 0,
      max: 10,
      step: 0.1,
      callback: changeBlur
    });

    editor.setWorkAreaContextMenu()

    $('.contextMenu li').mousedown(function (ev) {
      ev.preventDefault();
    });

    $('#cmenu_canvas li').disableContextMenu();

    window.addEventListener('beforeunload', function (e) {
      // Suppress warning if page is empty
      if (undoMgr.getUndoStackSize() === 0) {
        editor.showSaveWarning = false;
      }

      // showSaveWarning is set to 'false' when the page is saved.
      if (!curConfig.no_save_warning && editor.showSaveWarning) {
        // Browser already asks question about closing the page
        e.returnValue = uiStrings.notification.unsavedChanges; // Firefox needs this when beforeunload set by addEventListener (even though message is not used)
        return uiStrings.notification.unsavedChanges;
      }
    }, false);

    editor.openPrep = function (func) {
      $('#main_menu').hide();
      if (undoMgr.getUndoStackSize() === 0) {
        func(true);
      } else {
        $.confirm(uiStrings.notification.QwantToOpen, func);
      }
    };

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
      const imageToPngBlob = async (image) => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          canvas.toBlob((blob) => {
            resolve(blob);
          });
        });
      }

      const readImage = (file, scale = 1, offset = null) => {
        return new Promise<void>((resolve, reject) => {
          var defaultX = 0, defaultY = 0;
          if (offset) {
            defaultX = offset[0];
            defaultY = offset[1];
          }
          const reader = new FileReader();
          reader.onloadend = async function (e) {
            let rotationFlag = getExifRotationFlag(e.target.result);

            // let's insert the new image until we know its dimensions
            var insertNewImage = async function (img, width, height) {
              var newImage = svgCanvas.addSvgElementFromJson({
                element: 'image',
                attr: {
                  x: defaultX * scale,
                  y: defaultY * scale,
                  width: (rotationFlag <= 4 ? width : height) * scale,
                  height: (rotationFlag <= 4 ? height : width) * scale,
                  id: svgCanvas.getNextId(),
                  style: 'pointer-events:inherit',
                  preserveAspectRatio: 'none',
                  'data-threshold': 254,
                  'data-shading': true,
                  origImage: img.src,
                  'data-ratiofixed': true,
                }
              });
              if (file.type === 'image/webp') {
                const pngBlob = await imageToPngBlob(img);
                const newSrc = URL.createObjectURL(pngBlob);
                URL.revokeObjectURL(img.src);
                newImage.setAttribute('origImage', newSrc);
              }
              ImageData(
                newImage.getAttribute('origImage'), {
                height: height,
                width: width,
                rotationFlag,
                grayscale: {
                  is_rgba: true,
                  is_shading: true,
                  threshold: 254,
                  is_svg: false
                },
                onComplete: function (result) {
                  svgCanvas.setHref(newImage, result.pngBase64);
                }
              }
              );
              svgCanvas.updateElementColor(newImage);
              svgCanvas.selectOnly([newImage]);
              svgCanvas.undoMgr.addCommandToHistory(new svgedit.history.InsertElementCommand(newImage));
              if (!offset) {
                svgCanvas.alignSelectedElements('l', 'page');
                svgCanvas.alignSelectedElements('t', 'page');
              }
              resolve(null);
              updateContextPanel();
              Progress.popById('loading_image');
            };
            var img = new Image();
            var blob = new Blob([reader.result]);
            img.src = URL.createObjectURL(blob);
            img.style.opacity = '0';
            img.onload = function () {
              let imgWidth = img.width;
              let imgHeight = img.height;
              insertNewImage(img, imgWidth, imgHeight);
            };
          };
          reader.readAsArrayBuffer(file);
        });
      }
      editor.readImage = readImage;
      const replaceBitmap = async (file, imageElem) => {
        Progress.openNonstopProgress({ id: 'loading_image', caption: uiStrings.notification.loadingImage, });
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
              console.log(imgWidth, imgHeight);
              ImageData(
                src, {
                width: imgWidth,
                height: imgHeight,
                rotationFlag,
                grayscale: {
                  is_rgba: true,
                  is_shading: imageElem.getAttribute('data-shading') === 'true',
                  threshold: parseInt(imageElem.getAttribute('data-threshold')),
                  is_svg: false
                },
                onComplete: function (result) {
                  const batchCmd = new svgedit.history.BatchCommand('Replace Image');
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
                }
              }
              );
            };
          };
          reader.readAsArrayBuffer(file);
        });
      }
      editor.replaceBitmap = replaceBitmap;

      // Get exif rotation data ref: https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side
      const getExifRotationFlag = (arrayBuffer) => {
        let view = new DataView(arrayBuffer);
        if (view.getUint16(0, false) != 0xFFD8) {
          return -2;
        }
        let length = view.byteLength, offset = 2;
        while (offset < length) {
          if (view.getUint16(offset + 2, false) <= 8) return -1;
          let marker = view.getUint16(offset, false);
          offset += 2;
          if (marker == 0xFFE1) {
            if (view.getUint32(offset += 2, false) != 0x45786966) {
              return -1;
            }
            let little = view.getUint16(offset += 6, false) == 0x4949;
            offset += view.getUint32(offset + 4, little);
            let tags = view.getUint16(offset, little);
            offset += 2;
            for (var i = 0; i < tags; i++) {
              if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                return view.getUint16(offset + (i * 12) + 8, little);
              }
            }
          }
          else if ((marker & 0xFF00) != 0xFF00) {
            break;
          }
          else {
            offset += view.getUint16(offset, false);
          }
        }
        return -1;
      };
      editor.getExifRotationFlag = getExifRotationFlag;
      const getBasename = (path) => {
        const pathMatch = path.match(/(.+)[\/\\].+/);
        if (pathMatch[1]) return pathMatch[1];
        return "";
      }
      const readSVG = (blob, type, layerName?: string) => {
        return new Promise((resolve, reject) => {
          var reader = new FileReader();
          reader.onloadend = async function (e) {
            let svgString = e.target.result as string;
            if (!['color', 'layer'].includes(type)) {
              svgString = svgString.replace(/<svg[^>]*>/, (svgTagString) => {
                svgTagString = svgTagString.replace(/"([^"]*)pt"/g, (_, valWithoutPt) => {
                  return `"${valWithoutPt}"`
                });
                return svgTagString;
              });
            }

            if (blob.path) {
              svgString = svgString.replace('xlink:href="../', 'xlink:href="' + getBasename(blob.path) + '/../');
              svgString = svgString.replace('xlink:href="./', 'xlink:href="' + getBasename(blob.path) + '/');
            }

            svgString = svgString.replace(/<!\[CDATA\[([^\]]*)\]\]>/g, (match, p1) => {
              return p1;
            });

            if (svgString.indexOf('<switch>') > -1) {
              const indexLeft = svgString.indexOf('<switch>');
              const indexRight = svgString.indexOf('</switch>');

              svgString = svgString.substr(0, indexLeft) + svgString.substring(indexLeft + 8, indexRight) + svgString.substr(indexRight + 9);
            }

            if (!['color', 'layer'].includes(type)) {
              svgString = svgString.replace(/<image[^>]*>[^<]*<[^\/]*\/image>/g, (match) => {
                return '';
              });
              svgString = svgString.replace(/<image[^>]*>/g, (match) => {
                return '';
              });
            }

            const modifiedSvgString = svgString.replace(/fill(: ?#(fff(fff)?|FFF(FFF)?));/g, 'fill: none;').replace(/fill= ?"#(fff(fff)?|FFF(FFF))"/g, 'fill="none"');
            const newElement = await svgCanvas.importSvgString(modifiedSvgString, type, layerName);

            //Apply style
            svgCanvas.svgToString($('#svgcontent')[0], 0);

            resolve(newElement);
          };
          reader.readAsText(blob);
        });
      }
      editor.readSVG = readSVG;
      const importSvg = async (file, args: { skipVersionWarning?: boolean, skipByLayer?: boolean, isFromNounProject?: boolean, isFromAI?: boolean } = {}) => {
        async function importAs(type) {
          const result = await svgWebSocket.uploadPlainSVG(file, args.skipVersionWarning);
          if (result !== 'ok') {
            Progress.popById('loading_image');
            switch (result) {
              case 'invalid_path':
                Alert.popUp({
                  type: AlertConstants.SHOW_POPUP_ERROR,
                  message: LANG.popup.import_file_contain_invalid_path
                });
                break;
            }
            return;
          }
          let outputs;
          if (type === 'layer') {
            outputs = await svgWebSocket.divideSVGbyLayer();
          } else {
            outputs = await svgWebSocket.divideSVG();
          }
          if (!outputs.res) {
            Alert.popUp({
              type: AlertConstants.SHOW_POPUP_ERROR,
              buttonType: AlertConstants.YES_NO,
              message: `#809 ${outputs.data}\n${LANG.popup.import_file_error_ask_for_upload}`,
              onYes: () => {
                let fileReader = new FileReader();
                fileReader.onloadend = function (e) {
                  let svgString = e.target.result;
                  AwsHelper.uploadToS3(file.name, svgString);
                }
                fileReader.readAsText(file);
              }
            });
            return;
          } else {
            outputs = outputs.data;
          }
          let newElements = [];
          let newElement;
          if (type === 'color') {
            newElement = await readSVG(outputs['strokes'], type);
            newElements.push(newElement);
            newElement = await readSVG(outputs['colors'], type);
            newElements.push(newElement);
          } else if (type === 'layer') {
            for (let key in outputs) {
              if (!['bitmap', 'bitmap_offset'].includes(key)) {
                if (key === 'nolayer') {
                  newElement = await readSVG(outputs[key], type);
                } else {
                  newElement = await readSVG(outputs[key], type, key);
                }
                newElements.push(newElement);
              }
            }
          } else {
            newElement = await readSVG(file, type);
            newElements.push(newElement);
          }

          if (outputs['bitmap'].size > 0) {
            const layerName = LANG.right_panel.layer_panel.layer_bitmap;

            if (!svgCanvas.setCurrentLayer(layerName)) {
              svgCanvas.createLayer(layerName);
            }

            await readImage(outputs['bitmap'], 1, outputs['bitmap_offset']); //magic number dpi/ inch/pixel
          }
          Progress.popById('loading_image');
          newElements = newElements.filter((elem) => elem);
          if (args.isFromNounProject) {
            for (let i = 0; i < newElements.length; i++) {
              const elem = newElements[i];
              elem.setAttribute('data-np', '1');
            }
          }
          svgCanvas.selectOnly(newElements);
          if (newElements.length > 1) {
            svgCanvas.tempGroupSelectedElements();
          }
        }
        const buttonLabels = [LANG.popup.layer_by_layer, LANG.popup.layer_by_color, LANG.popup.nolayer];
        const callbacks = [() => importAs('layer'), () => importAs('color'), () => importAs('nolayer')];
        if (args.skipByLayer) {
          buttonLabels.splice(0, 1);
          callbacks.splice(0, 1);
        }

        if (args.isFromAI) {
          importAs('layer');
        } else {
          Alert.popUp({
            id: 'select-import-method',
            message: LANG.popup.select_import_method,
            buttonLabels: buttonLabels,
            callbacks: callbacks,
          });
        }
      };
      editor.importSvg = importSvg;
      const importBitmap = file => {
        readImage(file);
      };
      const importDxf = async file => {
        const { defaultDpiValue, parsed } = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = evt => {
            if (!AlertConfig.read('skip_dxf_version_warning')) {
              let autoCadVersionMatch = (evt.target.result as string).match(/AC\d+/);
              if (autoCadVersionMatch) {
                const autoCadVersion = autoCadVersionMatch[0].substring(2, autoCadVersionMatch[0].length);
                if (autoCadVersion !== '1027') {
                  Alert.popUp({
                    id: 'skip_dxf_version_warning',
                    message: LANG.popup.dxf_version_waring,
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    checkbox: {
                      text: LANG.popup.dont_show_again,
                      callbacks: () => { AlertConfig.write('skip_dxf_version_warning', true) }
                    }
                  });
                }

              }
            }

            let defaultDpiValue = 1;
            let parsed = Dxf2Svg.parseString(evt.target.result);

            if (parsed.header.insunits == '1') {
              defaultDpiValue = 25.4;
            }
            if (parsed.header.insunits == '2') {
              defaultDpiValue = 304.8;
            }
            if (parsed.header.insunits == '4') {
              defaultDpiValue = 1;
            }
            if (parsed.header.insunits == '5') {
              defaultDpiValue = 10;
            }
            if (parsed.header.insunits == '6') {
              defaultDpiValue = 100;
            }
            resolve({ parsed, defaultDpiValue });
          };
          reader.readAsText(file);
        });
        Progress.popById('loading_image');
        if (!parsed) {
          alert("DXF Parsing Error");
          return;
        }
        const unitLength = await Dialog.showDxfDpiSelector(defaultDpiValue);
        if (!unitLength) {
          return;
        }
        Progress.openNonstopProgress({ id: 'loading_image', caption: uiStrings.notification.loadingImage });
        const { outputLayers, svg: resizedSvg, bbox } = Dxf2Svg.toSVG(parsed, unitLength * 10);
        if (!AlertConfig.read('skip_dxf_oversize_warning') && (bbox.width > Constant.dimension.getWidth(BeamboxPreference.read('model')) || bbox.height > Constant.dimension.getHeight(BeamboxPreference.read('model')))) {
          Alert.popUp({
            id: 'dxf_size_over_workarea',
            message: LANG.popup.dxf_bounding_box_size_over,
            type: AlertConstants.SHOW_POPUP_WARNING,
            checkbox: {
              text: LANG.popup.dont_show_again,
              callbacks: () => { AlertConfig.write('skip_dxf_oversize_warning', true) }
            }
          });
        }
        const svgdoc = document.getElementById('svgcanvas').ownerDocument;
        const NS = svgedit.NS;
        for (let i in outputLayers) {
          const layerName = i;
          const layer = outputLayers[i];
          const isLayerExist = svgCanvas.setCurrentLayer(layerName);
          if (!isLayerExist) {
            svgCanvas.getCurrentDrawing();
            svgCanvas.createLayer(layerName, null, layer.rgbCode);
          }
          const id = svgCanvas.getNextId();
          const symbol = svgdoc.createElementNS(NS.SVG, 'symbol') as unknown as SVGSymbolElement;
          symbol.setAttribute('overflow', 'visible');
          symbol.id = id;
          svgedit.utilities.findDefs().appendChild(symbol);
          ImageTracer.appendSVGString(layer.paths.join(''), id);
          for (let j = 0; j < symbol.childNodes.length; j++) {
            let child = symbol.childNodes[j] as unknown as SVGElement;
            if (child.tagName === 'path' && !$(child).attr('d')) {
              child.remove();
              j--;
            } else {
              $(child).attr('id', svgCanvas.getNextId());
            }
          }
          const use_el = svgdoc.createElementNS(NS.SVG, 'use');
          use_el.id = svgCanvas.getNextId();
          svgedit.utilities.setHref(use_el, `#${symbol.id}`);
          svgCanvas.getCurrentDrawing().getCurrentLayer().appendChild(use_el);
          const bb = svgedit.utilities.getBBox(use_el);

          const imageSymbol = await SymbolMaker.makeImageSymbol(symbol);
          svgedit.utilities.setHref(use_el, `#${imageSymbol.id}`);

          let xform = '';
          for (let key in bb) {
            xform += `${key}=${bb[key]} `;
          }
          use_el.setAttribute('data-dxf', 'true');
          use_el.setAttribute('data-ratiofixed', 'true');
          use_el.setAttribute('data-xform', xform);
          svgCanvas.updateElementColor(use_el);
        }
        svgCanvas.removeDefaultLayerIfEmpty();
        Progress.popById('loading_image');
      };

      const importBvgStringAsync = async (str) => {
        svgCanvas.clearSelection();
        await editor.loadFromStringAsync(str.replace(/STYLE>/g, 'style>').replace(/<STYLE/g, '<style'));
        // loadFromString will lose data-xform and data-wireframe of `use` so set it back here
        if (typeof (str) === 'string') {
          let tmp = str.substr(str.indexOf('<use')).split('<use');

          for (let i = 1; i < tmp.length; ++i) {
            let elem, match, id, wireframe, xform;

            tmp[i] = tmp[i].substring(0, tmp[i].indexOf('/>'))
            match = tmp[i].match(/id="svg_\d+"/)[0];
            id = match.substring(match.indexOf('"') + 1, match.lastIndexOf('"'));
            match = tmp[i].match(/data-xform="[^"]*"/);
            if (match) {
              match = match[0];
              xform = match.substring(match.indexOf('"') + 1, match.lastIndexOf('"'));
            }
            match = tmp[i].match(/data-wireframe="[a-z]*"/);
            if (match) {
              match = match[0];
              wireframe = match.substring(match.indexOf('"') + 1, match.lastIndexOf('"'));
            }

            elem = document.getElementById(id);
            elem.setAttribute('data-xform', xform);
            elem.setAttribute('data-wireframe', wireframe === 'true');
          }
          let match = str.match(/data-rotary_mode="[a-zA-Z]+"/);
          if (match) {
            let rotaryMode = 'true' === match[0].substring(18, match[0].length - 1);
            svgCanvas.setRotaryMode(rotaryMode);
            svgCanvas.runExtensions('updateRotaryAxis');
            BeamboxPreference.write('rotary_mode', rotaryMode);
          }
          match = str.match(/data-engrave_dpi="[a-zA-Z]+"/);
          if (match) {
            let engraveDpi = match[0].substring(18, match[0].length - 1);
            BeamboxPreference.write('engrave_dpi', engraveDpi);
          } else {
            BeamboxPreference.write('engrave_dpi', 'medium');
          }
          if (Constant.addonsSupportList.hybridLaser.includes(BeamboxPreference.read('workarea'))) {
            match = str.match(/data-en_diode="([a-zA-Z]+)"/);
            if (match && match[1]) {
              if (match[1] === 'true') {
                BeamboxPreference.write('enable-diode', true);
              } else {
                BeamboxPreference.write('enable-diode', false);
              }
            }
          }
          if (Constant.addonsSupportList.autoFocus.includes(BeamboxPreference.read('workarea'))) {
            match = str.match(/data-en_af="([a-zA-Z]+)"/);
            if (match && match[1]) {
              if (match[1] === 'true') {
                BeamboxPreference.write('enable-autofocus', true);
              } else {
                BeamboxPreference.write('enable-autofocus', false);
              }
            }
          }
          LayerPanelController.updateLayerPanel();
          match = str.match(/data-zoom="[0-9\.]+"/);
          if (match) {
            let zoom = parseFloat(match[0].substring(11, match[0].length - 1));
            zoomChanged(window, { zoomLevel: zoom, staticPoint: { x: 0, y: 0 } });
          }
          match = str.match(/data-left="[-0-9]+"/);
          if (match) {
            let left = parseInt(match[0].substring(11, match[0].length - 1));
            left = Math.round((left + Constant.dimension.getWidth(BeamboxPreference.read('model'))) * svgCanvas.getZoom());
            $('#workarea').scrollLeft(left);
          }
          match = str.match(/data-top="[-0-9]+"/);
          if (match) {
            let top = parseInt(match[0].substring(10, match[0].length - 1));
            top = Math.round((top + Constant.dimension.getHeight(BeamboxPreference.read('model'))) * svgCanvas.getZoom());
            $('#workarea').scrollTop(top);
          }
        }
        svgedit.utilities.findDefs().remove();
        svgedit.utilities.moveDefsOutfromSvgContent();
        await SymbolMaker.reRenderAllImageSymbol();
        LayerPanelController.setSelectedLayers([]);
      }
      editor.importBvgStringAsync = importBvgStringAsync;

      const importBvg = async (file) => {
        Progress.popById('loading_image');
        const parsedSvg = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = (evt) => {
            let str = evt.target.result;
            importBvgStringAsync(str);
          };
          reader.readAsText(file);
        });
        svgCanvas.setHasUnsavedChange(false);
      };

      editor.importBvg = importBvg;

      const importJsScript = async (file) => {
        Progress.popById('loading_image');
        if (require.cache[file.path]) {
          delete require.cache[file.path];
        }
        require(file.path);
      };

      const importLaserConfig = async (file) => {
        Progress.popById('loading_image');
        Alert.popUp({
          buttonType: AlertConstants.CONFIRM_CANCEL,
          message: LANG.right_panel.laser_panel.sure_to_load_config,
          onConfirm: async () => {
            await new Promise<void>(resolve => {
              const reader = new FileReader();
              reader.onloadend = (evt) => {
                const configString = evt.target.result as string;
                const newConfigs = JSON.parse(configString);
                const { customizedLaserConfigs, defaultLaserConfigsInUse } = newConfigs;
                const configNames = new Set(customizedLaserConfigs.filter((config) => !config.isDefault).map((config) => config.name));
                let currentConfig = storage.get('customizedLaserConfigs');
                if (typeof (currentConfig) === 'string') {
                  currentConfig = JSON.parse(currentConfig);
                }
                for (let i = 0; i < currentConfig.length; i++) {
                  const config = currentConfig[i];
                  if (!config.isDefault && !configNames.has(config.name)) {
                    customizedLaserConfigs.push(config);
                  }
                }
                storage.set('customizedLaserConfigs', customizedLaserConfigs);
                storage.set('defaultLaserConfigsInUse', defaultLaserConfigsInUse);
                LayerPanelController.setSelectedLayers(LayerPanelController.getSelectedLayers());
                resolve(null);
              };
              reader.readAsText(file);
            });
          }
        });
      };
      editor.importLaserConfig = importLaserConfig;

      var importImage = function (e) {
        Progress.openNonstopProgress({ id: 'loading_image', caption: uiStrings.notification.loadingImage });
        e.stopPropagation();
        e.preventDefault();
        $('#workarea').removeAttr('style');
        $('#main_menu').hide();
        if (e.dataTransfer && e.dataTransfer.types.includes('text/noun-project-icon')) {
          const nounProjectIcon = JSON.parse(e.dataTransfer.getData('text/noun-project-icon')) as IIcon;
          NounProjectPanelController.emit('insertIcon', nounProjectIcon);
          return;
        }
        const file = (e.type === 'drop') ? e.dataTransfer.files[0] : this.files[0];
        if (!file) {
          Progress.popById('loading_image');
          return;
        }
        handleFile(file);
        // let file input import same file again.
        // Beacause function 'importImage' is triggered by onChange event, so we remove the value to ensure onChange event fire
        $(this).attr('value', '');
      };

      const importIconFromNounProject = async (icon: IIcon) => {
        console.log(icon);
        if (icon.icon_url) {
          const response = await fetch(icon.icon_url);
          const blob = await response.blob();
          importSvg(blob);
        } else {
          const response = await fetch(icon.preview_url);
          const blob = await response.blob();
          readImage(blob);
        }
      };

      const handleFile = (file) => {
        svgCanvas.clearSelection();
        const fileType = (function () {
          if (file.name.toLowerCase().endsWith('.beam')) {
            return 'beam';
          }
          if (file.name.toLowerCase().endsWith('.bvg')) {
            return 'bvg';
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
          if (file.name.toLowerCase().includes('.dxf')) {
            return 'dxf';
          }
          if (file.name.toLowerCase().includes('.json')) {
            return 'json';
          }
          if (file.name.toLowerCase().includes('.js')) {
            return 'js';
          }
          if (file.name.toLowerCase().endsWith('.pdf') || (file.path && file.path.toLowerCase().endsWith('.pdf'))) {
            return 'pdf';
          }
          if (file.name.toLowerCase().endsWith('.ai') || (file.path && file.path.toLowerCase().endsWith('.ai'))) {
            return 'ai';
          }
          return 'unknown';
        })();
        console.log("File type name:", fileType);
        switch (fileType) {
          case 'bvg':
            importBvg(file);
            break;
          case 'beam':
            BeamFileHelper.readBeam(file);
            break;
          case 'svg':
            importSvg(file);
            break;
          case 'bitmap':
            importBitmap(file);
            break;
          case 'dxf':
            importDxf(file);
            break;
          case 'pdf':
          case 'ai':
            PdfHelper.pdf2svg(file);
            break;
          case 'js':
            importJsScript(file);
            break;
          case 'json':
            importLaserConfig(file);
            break;
          case 'unknown':
            Progress.popById('loading_image');
            Alert.popUp({
              id: 'import_unknown',
              message: LANG.svg_editor.unnsupported_file_type,
              type: AlertConstants.SHOW_POPUP_WARNING,
            });
            break;
        }
        let fileName = file.name.slice(0, file.name.lastIndexOf('.')).replace(':', "/");
        switch (fileType) {
          case 'bvg':
          case 'beam':
            svgCanvas.setLatestImportFileName(fileName);
            svgCanvas.currentFilePath = file.path;
            svgCanvas.updateRecentFiles(file.path);
            svgCanvas.setHasUnsavedChange(false);
            break;
          case 'dxf':
            svgCanvas.setLatestImportFileName(fileName);
            svgCanvas.currentFilePath = null;
            svgCanvas.setHasUnsavedChange(true);
            break;
          case 'svg':
          case 'bitmap':
          case 'ai':
            if (!svgCanvas.getLatestImportFileName()) {
              svgCanvas.setLatestImportFileName(fileName);
            }
            svgCanvas.setHasUnsavedChange(true);
            break;
        }
      }
      editor.handleFile = handleFile;

      workarea[0].addEventListener('dragenter', onDragEnter, false);
      workarea[0].addEventListener('dragover', onDragOver, false);
      workarea[0].addEventListener('dragleave', onDragLeave, false);
      workarea[0].addEventListener('drop', importImage, false);

      var open = $('<input type="file">').change(function (this: HTMLInputElement) {
        var f = this;
        editor.openPrep(function (ok) {
          if (!ok) {
            return;
          }
          svgCanvas.clear();
          if (f.files.length === 1) {
            Alert.popUp({
              id: 'loading_image',
              message: uiStrings.notification.loadingImage,
            });
            var reader = new FileReader();
            reader.onloadend = function (e) {
              loadSvgString(e.target.result as string);
              updateCanvas();
            };
            reader.readAsText(f.files[0]);
          }
        });
      });
      $('#tool_open').show().prepend(open);

      // enable beambox-global-interaction to click (data-file-input, trigger_file_input_click)
      var imgImport = $('<input type="file" accept=".svg,.bvg,.jpg,.png,.dxf,.js,.beam,.ai,.pdf" data-file-input="import_image">').change(importImage);
      $('#tool_import').show().prepend(imgImport);

      window['updateContextPanel'] = updateContextPanel;
    }

    //			$(function() {
    updateCanvas({
      autoCenter: true
    });
    //			});

    //	var revnums = "svg-editor.js ($Rev$) ";
    //	revnums += svgCanvas.getVersion();
    //	$('#copyright')[0].setAttribute('title', revnums);

    // For Compatibility with older extensions
    $(function () {
      window['svgCanvas'] = svgCanvas;
      svgCanvas.ready = editor.ready;
    });

    editor.setLang = function (lang, allStrings) {
      editor.langChanged = true;
      $.pref('lang', lang);
      $('#lang_select').val(lang);
      if (!allStrings) {
        return;
      }
      // var notif = allStrings.notification; // Currently unused
      // $.extend will only replace the given strings
      var oldLayerName = $('#layerlist tr.layersel td.layername').text();
      var rename_layer = (oldLayerName === uiStrings.layers.layer + ' 1');

      $.extend(uiStrings, allStrings);
      svgCanvas.setUiStrings(allStrings);
      Actions.setTitles();

      if (rename_layer) {
        svgCanvas.renameCurrentLayer(uiStrings.layers.layer + ' 1');
        LayerPanelController.updateLayerPanel();
      }

      // In case extensions loaded before the locale, now we execute a callback on them
      if (extsPreLang.length) {
        while (extsPreLang.length) {
          var ext = extsPreLang.shift();
          ext.langReady({
            lang: lang,
            uiStrings: uiStrings
          });
        }
      } else {
        svgCanvas.runExtensions('langReady', {
          lang: lang,
          uiStrings: uiStrings
        });
      }
      svgCanvas.runExtensions('langChanged', lang);

      // Update flyout tooltips
      setFlyoutTitles();

      // Copy title for certain tool elements
      var elems = {
        '#stroke_color': '#tool_stroke .icon_label, #tool_stroke .color_block',
        '#fill_color': '#tool_fill label, #tool_fill .color_block',
        '#linejoin_miter': '#cur_linejoin',
        '#linecap_butt': '#cur_linecap'
      };

      $.each(elems, function (source, dest) {
        $(dest).attr('title', $(source)[0].title);
      });

      // Copy alignment titles
      $('#multiselected_panel div[id^=tool_align]').each(function () {
        $('#tool_pos' + this.id.substr(10))[0].title = this.title;
      });
    };


    //initialize the view
    // zoomImage(0.2);
    //$('#fit_to_canvas').mouseup();
    let windowScale = Math.min((($(window).width() - 268) / 1000), (($(window).height() - 105) / 600));
    let workspaceScale = 1 / Math.max(svgEditor.dimensions[0] / 4000, svgEditor.dimensions[1] / 3750);
    const zoomLevel = 0.2 * windowScale * workspaceScale;
    zoomChanged(window, {
      zoomLevel: zoomLevel
    });

    //greyscale all svgContent
    (function () {
      const svgdoc = document.getElementById('svgcanvas').ownerDocument;
      const greyscaleFilter = svgdoc.createElementNS(svgedit.NS.SVG, 'filter');
      svgCanvas.assignAttributes(greyscaleFilter, {
        'id': 'greyscaleFilter'
      });

      const greyscaleMatrix = svgdoc.createElementNS(svgedit.NS.SVG, 'feColorMatrix');
      svgCanvas.assignAttributes(greyscaleMatrix, {
        type: 'matrix',
        values: '0.3333 0.3333 0.3333 0  0\
							0.3333 0.3333 0.3333 0  0\
							0.3333 0.3333 0.3333 0  0\
							0 	   0      0      1  0'
      });
      greyscaleFilter.appendChild(greyscaleMatrix);
      //$('#svgroot defs').append(greyscaleFilter);
      // $(svgcontent).attr({
      //     filter: 'url(#greyscaleFilter)'
      // });
    })();
  };

  editor.resetView = function () {
    const hasRulers = !!BeamboxPreference.read('show_rulers');
    const sidePanelsWidth = Constant.sidePanelsWidth + (hasRulers ? Constant.rulerWidth : 0);
    const topBarHeight = Constant.topBarHeight + (hasRulers ? Constant.rulerWidth : 0);
    const workareaToDimensionRatio = Math.min((window.innerWidth - sidePanelsWidth) / Constant.dimension.getWidth(BeamboxPreference.read('model')), (window.innerHeight - topBarHeight) / Constant.dimension.getHeight(BeamboxPreference.read('model')));
    const zoomLevel = workareaToDimensionRatio * 0.95;
    const workAreaWidth = Constant.dimension.getWidth(BeamboxPreference.read('model')) * zoomLevel;
    const workAreaHeight = Constant.dimension.getHeight(BeamboxPreference.read('model')) * zoomLevel;
    const offsetX = (window.innerWidth - sidePanelsWidth - workAreaWidth) / 2 + (hasRulers ? Constant.rulerWidth : 0);
    const offsetY = (window.innerHeight - topBarHeight - workAreaHeight) / 2 + (hasRulers ? Constant.rulerWidth : 0);
    editor.zoomChanged(window, {
      zoomLevel: zoomLevel
    });
    const background = document.getElementById('canvasBackground');
    if (!background) {
      setTimeout(() => editor.resetView(), 100);
      return;
    }
    const x = parseFloat(background.getAttribute('x'));
    const y = parseFloat(background.getAttribute('y'));
    const defaultScroll = {
      x: (x - offsetX) / zoomLevel,
      y: (y - offsetY) / zoomLevel
    };
    const workArea = document.getElementById('workarea');
    workArea.scrollLeft = defaultScroll.x * zoomLevel;
    workArea.scrollTop = defaultScroll.y * zoomLevel;
  };

  editor.setZoomWithWindow = function () {
    editor.resetView();
    const isZoomWithWindow = !(svgCanvas.isZoomWithWindow || false);
    svgCanvas.isZoomWithWindow = isZoomWithWindow;
    electron.remote.Menu.getApplicationMenu().items.find(i => i.id === '_view')
      .submenu.items.find(i => i.id === 'ZOOM_WITH_WINDOW').checked = isZoomWithWindow;
    if (isZoomWithWindow) {
      window.addEventListener('resize', editor.resetView);
    } else {
      window.removeEventListener('resize', editor.resetView);
    }
  }

  var preventDoubleZoomIn = false;

  editor.zoomIn = function () {
    if (!preventDoubleZoomIn) {
      editor.zoomChanged(window, {
        zoomLevel: svgCanvas.getZoom() * 1.1
      });
      preventDoubleZoomIn = true;

      setTimeout(() => {
        preventDoubleZoomIn = false;
      }, 10);
    }
  };

  editor.zoomOut = function () {
    editor.zoomChanged(window, {
      zoomLevel: svgCanvas.getZoom() / 1.1
    });
  };

  editor.ready = function (cb) {
    if (!isReady) {
      callbacks.push(cb);
    } else {
      cb();
    }
  };

  editor.runCallbacks = function () {
    $.each(callbacks, function () {
      this();
    });
    isReady = true;
  };

  editor.loadFromString = function (str) {
    editor.ready(function () {
      loadSvgString(str, function () {
        editor.resetView();
      });
    });
  };

  editor.loadFromStringAsync = async function (str) {
    return new Promise((resolve) => {
      editor.ready(function () {
        loadSvgString(str, function () {
          editor.resetView();
          resolve(true);
        });
      });
    });
  };

  editor.disableUI = function (featList) {
    //			$(function() {
    //				$('#tool_wireframe, #tool_image, #main_button, #tool_source, #sidepanels').remove();
    //				$('#tools_top').css('left', 5);
    //			});
  };

  editor.loadFromURL = function (url: string, opts?: any) {
    if (!opts) {
      opts = {};
    }

    var cache = opts.cache;
    var cb = opts.callback;

    editor.ready(function () {
      $.ajax({
        'url': url,
        'dataType': 'text',
        cache: !!cache,
        beforeSend: function () {
          Alert.popUp({
            id: 'loading_image',
            message: uiStrings.notification.loadingImage,
          });
        },
        success: function (str) {
          loadSvgString(str, cb);
        },
        error: function (xhr, stat, err) {
          if (xhr.status != 404 && xhr.responseText) {
            loadSvgString(xhr.responseText, cb);
          } else {
            Alert.popUp({
              id: 'url_load_error',
              message: uiStrings.notification.URLloadFail + ': \n' + err,
              type: AlertConstants.SHOW_POPUP_ERROR,
              callbacks: cb
            });
          }
        },
        complete: function () {
          Progress.popById('loading_image');
        }
      });
    });
  };

  editor.loadFromDataURI = function (str) {
    editor.ready(function () {
      var base64 = false;
      var pre = str.match(/^data:image\/svg\+xml;base64,/);
      if (pre) {
        base64 = true;
      } else {
        pre = str.match(/^data:image\/svg\+xml(?:;(?:utf8)?)?,/);
      }
      if (pre) {
        pre = pre[0];
      }
      var src = str.slice(pre.length);
      loadSvgString(base64 ? Utils.decode64(src) : decodeURIComponent(src));
    });
  };

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
})(jQuery);

// Run init once DOM is loaded
// $(svgEditor.init);
//replaced by componentDidMount()
export default window['svgEditor'];
