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
import { addPolygonSides, decreasePolygonSides } from '@core/app/svgedit/polygon';
import selectionManager from '@core/app/svgedit/selection';
import {
  copySelectedElements,
  cutSelectedElements,
  pasteWithDefaultPosition,
} from '@core/app/svgedit/operations/clipboard';
import { deleteSelectedElements } from '@core/app/svgedit/operations/delete';
import importBitmap from '@core/app/svgedit/operations/import/importBitmap';
import importBvg from '@core/app/svgedit/operations/import/importBvg';
import importDxf from '@core/app/svgedit/operations/import/importDxf';
import { importDxfFromText, looksLikeDxfText } from '@core/app/svgedit/operations/import/importDxfFromClipboard';
import importSvg from '@core/app/svgedit/operations/import/importSvg';
import { moveSelectedElements } from '@core/app/svgedit/operations/move';
import svgCanvasClass from '@core/app/svgedit/svgcanvas';
import textActions from '@core/app/svgedit/text/textactions';
import textEdit from '@core/app/svgedit/text/textedit';
import workareaManager from '@core/app/svgedit/workarea';
import ObjectPanelController from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelController';
import RightPanelController from '@core/app/components/beambox/RightPanel/contexts/RightPanelController';
import { getNextStepRequirement } from '@core/app/components/tutorials/tutorialController';
import BeamFileHelper from '@core/helpers/beam-file-helper';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import { toggleUnsavedChangedDialog } from '@core/helpers/file/export';
import { updateRecentFiles } from '@core/helpers/file/recentFiles';
import i18n from '@core/helpers/i18n';
import getExifRotationFlag from '@core/helpers/image/getExifRotationFlag';
import ImageData from '@core/helpers/image-data';
import isWeb from '@core/helpers/is-web';
import { importPresets } from '@core/helpers/presets/preset-helper';
import Shortcuts, { isFocusingOnInputs } from '@core/helpers/shortcuts';
import { isMobile } from '@core/app/stores/screenStore';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type ISVGConfig from '@core/interfaces/ISVGConfig';

import { pdfHelper } from '@core/implementations/pdfHelper';

import Alert from '../alert-caller';
import Progress from '../progress-caller';

import fileSystem from '@core/implementations/fileSystem';
import { FileData } from '@core/helpers/fileImportHelper';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getStorage } from '@core/app/stores/storageStore';
import {
  getMouseMode,
  setCursor,
  setCursorAccordingToMouseMode,
  setMouseMode,
} from '@core/app/stores/canvas/utils/mouseMode';
import useLayerStore from '@core/app/stores/layer/layerStore';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import { showPanel } from '@core/app/widgets/dockable/utils';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';
import { resizeSelector } from '@core/app/svgedit/selector';

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
    pref: any;
    process_cancel: any;
    prompt: any;
    select: any;
    SvgCanvas: any;
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
  canvas: any;
  clearScene: () => Promise<void>;
  clickSelect: (clearSelection?: boolean) => void;
  copySelected: () => void;
  curConfig: ISVGConfig;
  cutSelected: () => void;
  deleteSelected: () => void;
  handleFile: (file: any) => Promise<void>;
  init: () => void;
  readSVG: (blob: any, type: any, layerName: any) => Promise<unknown>;
  replaceBitmap: any;
  setPanning: (active: any) => void;
  updateContextPanel: () => void;
}

const svgEditor = (window['svgEditor'] = (function () {
  // STATE MAINTENANCE PROPERTIES
  const editor: ISVGEditor = {
    canvas: null,
    clearScene: async () => {},
    clickSelect: () => {},
    copySelected: () => {},
    curConfig: null as any,
    cutSelected: () => {},
    deleteSelected: () => {},
    handleFile: async (file) => {},
    init: () => {},
    readSVG: async (blob: any, type: any, layerName: any) => {},
    replaceBitmap: null,
    setPanning: (active: any) => {},
    updateContextPanel: () => {},
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
  /**
   * PREFS AND CONFIG
   */
  let curConfig: ISVGConfig = {};
  const defaultConfig: ISVGConfig = {
    initFill: {
      color: 'FFFFFF',
      opacity: 0,
    },
    initOpacity: 1,
    initStroke: {
      color: '000000',
      opacity: 1,
      width: 1,
    },
  };

  editor.init = function () {
    // Todo: Avoid var-defined functions and group functions together, etc. where possible

    function setupCurConfig() {
      curConfig = $.extend(true, {}, defaultConfig, curConfig); // Now safe to merge with priority for curConfig in the event any are already set
      // Export updated config
      editor.curConfig = curConfig;
    }
    setupCurConfig();

    window['svgCanvas'] = editor.canvas = svgCanvas = new $.SvgCanvas(document.getElementById('svgcanvas'), curConfig);

    var Actions,
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

    var clickSelect = (editor.clickSelect = function (clearSelection: boolean = true) {
      if ([TutorialConstants.DRAW_A_CIRCLE, TutorialConstants.DRAW_A_RECT].includes(getNextStepRequirement())) return;

      setMouseMode('select');

      if (clearSelection) {
        selectionManager.clearSelection();
      }
    });

    // updates the context panel tools based on the selected element
    var updateContextPanel = function () {
      let elem: SVGElement | null = selectionManager.getSelectedElements()[0] ?? null;

      // If element has just been deleted, consider it null
      if (elem && !elem.parentNode) {
        elem = null;
      }

      const currentMode = getMouseMode();

      if (currentMode === 'pathedit') {
        canvasEvents.setPathEditing(true);
        canvasEvents.setSelectedElement(null);
        RightPanelController.updatePathEditPanel();
      } else {
        canvasEvents.setPathEditing(false);
        canvasEvents.setSelectedElement(elem);
      }

      if (elem != null) {
        const { tagName } = elem;
        const angle = getRotationAngle(elem);

        ObjectPanelController.updateDimensionValues({ rotation: angle });

        if (currentMode !== 'pathedit') {
          // Elements in this array already have coord fields
          if (['circle', 'ellipse', 'line'].includes(tagName)) {
          } else {
            let x = 0;
            let y = 0;

            // Get BBox vals for g, polyline and path
            if (['g', 'path', 'polygon', 'polyline'].includes(tagName)) {
              const bb = getBBox(elem, { withStroke: true, ignoreRotation: false });

              if (bb) {
                x = bb.x;
                y = bb.y;

                if (tagName !== 'polyline') {
                  let bbox = elem.getBBox();

                  ObjectPanelController.updateDimensionValues({
                    height: bbox.height,
                    width: bbox.width,
                  });
                }
              }
            } else if (['text'].includes(tagName)) {
              const bb = getBBox(elem);

              x = bb.x;
              y = bb.y;
              ObjectPanelController.updateDimensionValues({
                height: bb.height,
                width: bb.width,
              });
            } else {
              x = Number(elem.getAttribute('x') || 0);
              y = Number(elem.getAttribute('y') || 0);
            }

            ObjectPanelController.updateDimensionValues({ x, y });

            resizeSelector(elem);
          }
        } else {
          return;
        }

        // update contextual tools here
        const panels: Record<string, string[]> = {
          circle: ['cx', 'cy', 'r'],
          ellipse: ['cx', 'cy', 'rx', 'ry'],
          image: ['width', 'height'],
          line: ['x1', 'y1', 'x2', 'y2'],
          rect: ['rx', 'width', 'height'],
        };

        if (panels[tagName]) {
          const curPanels = panels[tagName];

          const newDimensionValue: Record<string, string | number> = {};

          curPanels.forEach((item) => {
            newDimensionValue[item] = Number(elem.getAttribute(item) || 0);
          });
          ObjectPanelController.updateDimensionValues(newDimensionValue);
        }

        if (tagName === 'text') {
          textActions.setFontSize(textEdit.getFontSize(elem));
          textActions.setIsVertical(textEdit.getIsVertical(elem));
        } else if (tagName === 'use') {
          const bbox = getBBox(elem);

          ObjectPanelController.updateDimensionValues({
            height: bbox.height,
            width: bbox.width,
            x: bbox.x,
            y: bbox.y,
          });
        } else if (tagName === 'polygon') {
          const sides = parseInt(elem.getAttribute('sides') || '0', 10);
          ObjectPanelController.updatePolygonSides(sides);
        }

        const isRatioFixed = elem.getAttribute('data-ratiofixed') === 'true';

        ObjectPanelController.updateDimensionValues({ isRatioFixed });
      } else {
        workareaEvents.emit('update-context-menu', {
          select: false,
        });
      }

      if (elem && currentMode !== 'pathedit') {
        // Enable regular menu options
        workareaEvents.emit('update-context-menu', {
          select: true,
        });
      }

      ObjectPanelController.updateObjectPanel();
    };

    editor.updateContextPanel = updateContextPanel;

    // bind the selected event to our function that handles updates to the UI
    svgCanvas.bind('selected', updateContextPanel);
    svgCanvas.bind('changed', updateContextPanel);
    textActions.setInputElem($('#text')[0]);

    // Lose focus for select elements when changed (Allows keyboard shortcuts to work better)
    $('select').change(function () {
      $(this).blur();
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
        if (isFocusingOnInputs()) return;
        if (evt.key === ' ') {
          svgCanvas.spaceKey = keypan = true;
          setCursor('grab');
          evt.preventDefault(); // prevent page from scrolling
        }
      });
      // FIXME: use document.addEventListener('keyup', (evt) => { ... })
      // because shortcuts are not providing keyup event now
      document.addEventListener('keyup', (evt) => {
        if (isFocusingOnInputs()) return;
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
      if (selectionManager.getSelectedElements().length > 0) {
        textActions.clear();
        deleteSelectedElements();
      }

      if (svgedit.path.path) {
        svgedit.path.path.onDelete(textEdit, textPathEdit);
      }
    };

    editor.deleteSelected = deleteSelected;

    const cutSelected = function () {
      // disabled when focusing input element
      if (document.activeElement?.tagName.toLowerCase() === 'input') {
        return;
      }

      if (!textActions.isEditing && selectionManager.getSelectedElements().length > 0) {
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

    const copySelected = function () {
      // disabled when focusing input element
      const activeElementTagName = document.activeElement?.tagName?.toLowerCase() ?? '';
      if (['input', 'textarea'].includes(activeElementTagName)) {
        return;
      }

      if (!textActions.isEditing && selectionManager.getSelectedElements().length > 0) {
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

      const activeElementTagName = document.activeElement?.tagName?.toLowerCase() ?? '';
      // disabled when focusing input element
      if (['input', 'textarea'].includes(activeElementTagName)) {
        return;
      }

      if (['Shift', 'Control', 'V'].every((key) => pressedKey.includes(key))) {
        return;
      }

      const clipboardData = e.clipboardData;
      let importedFromClipboard = false;

      if (clipboardData) {
        // Detect DXF text placed on the clipboard by a CAD app (e.g. AutoCAD via clip.exe / BeamCopy.lsp).
        const plainText = clipboardData.types.includes('text/plain') ? clipboardData.getData('text/plain') : '';

        if (clipboardData.types.includes('Files')) {
          console.log('handle clip board file');
          for (let i = 0; i < clipboardData.files.length; i++) {
            let file = clipboardData.files[i];

            svgEditor.handleFile(file);
            importedFromClipboard = true;
          }
        } else if (looksLikeDxfText(plainText)) {
          importedFromClipboard = await importDxfFromText(plainText);

          if (!importedFromClipboard) {
            Alert.popUpError({ message: i18n.lang.beambox.popup.dxf_paste_failed });
          }

          return;
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

    var clearScene = async function () {
      const res = await toggleUnsavedChangedDialog();

      if (!res) {
        return;
      }

      setMouseMode('select');
      svgCanvas.clear();
      workareaManager.resetView();
      RightPanelController.setPanelType(isMobile() ? PanelType.None : PanelType.Layer);
      useLayerStore.getState().forceUpdate();
      updateContextPanel();
      svgedit.transformlist.resetListMap();
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

    useLayerStore.getState().forceUpdate();

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
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([0], [-moveUnit]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollTop -= 5;
            }
          });
          Shortcuts.on(['Shift+ArrowUp'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([0], [-moveUnit * 10]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollTop -= 50;
            }
          });
          Shortcuts.on(['ArrowDown'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([0], [moveUnit]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollTop += 5;
            }
          });
          Shortcuts.on(['Shift+ArrowDown'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([0], [moveUnit * 10]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollTop += 50;
            }
          });
          Shortcuts.on(['ArrowLeft'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([-moveUnit], [0]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollLeft -= 5;
            }
          });
          Shortcuts.on(['Shift+ArrowLeft'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([-moveUnit * 10], [0]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollLeft -= 50;
            }
          });
          Shortcuts.on(['ArrowRight'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([moveUnit], [0]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollLeft += 5;
            }
          });
          Shortcuts.on(['Shift+ArrowRight'], (e) => {
            if (selectionManager.getSelectedElements().length > 0) {
              moveSelectedElements([moveUnit * 10], [0]);
            } else {
              const workArea = document.getElementById('workarea')!;

              workArea.scrollLeft += 50;
            }
          });
          Shortcuts.on(
            ['+', '='],
            () => {
              const selectedElement = selectionManager.getSelectedElements()[0];
              if (selectedElement?.tagName === 'polygon') {
                const newSides = addPolygonSides();
                ObjectPanelController.updatePolygonSides(newSides);
              }
            },
            { splitKey: '-' },
          );
          Shortcuts.on(['-'], () => {
            const selectedElement = selectionManager.getSelectedElements()[0];
            if (selectedElement?.tagName === 'polygon') {
              const newSides = decreasePolygonSides();
              ObjectPanelController.updatePolygonSides(newSides);
            }
          });
          Shortcuts.on(['l'], () => {
            RightPanelController.setPanelType(PanelType.Layer);
            showPanel('panelLayerControls');
          });
          Shortcuts.on(['o'], () => {
            RightPanelController.setPanelType(PanelType.Object);
            showPanel('panelObjectProperties');
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
      e.preventDefault();
      // and indicator should be displayed here, such as "drop files here"
    }

    function onDragOver(e) {
      e.preventDefault();
    }

    function onDragLeave(e) {
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

      const handleFile = async (file: File) => {
        const lang = i18n.lang.beambox;
        const path = fileSystem.getPathForFile(file as File);
        await Progress.openNonstopProgress({
          caption: lang.popup.loading_image,
          id: 'loading_image',
        });
        selectionManager.clearSelection();

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
            useLayerStore.getState().forceUpdate();
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
              updateRecentFiles(path);
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

    // For Compatibility with older extensions
    $(function () {
      window['svgCanvas'] = svgCanvas;
    });

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

  return editor;
})());

// Run init once DOM is loaded
// $(svgEditor.init);
//replaced by componentDidMount()
export default window['svgEditor'];
