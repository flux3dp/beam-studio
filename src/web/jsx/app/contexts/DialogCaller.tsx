function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

const {
  resolve
} = require('q');

define(['jsx!widgets/Modal', 'jsx!views/dialogs/Dialog', 'jsx!views/dialogs/Prompt', 'jsx!views/dialogs/Confirm-Prompt', 'jsx!views/tutorials/Tutorial', 'jsx!views/beambox/About-Beam-Studio', 'jsx!views/beambox/Camera-Calibration', 'jsx!views/beambox/Diode-Calibration', 'jsx!views/beambox/Document-Panels/Document-Panel', 'jsx!views/beambox/Network-Testing-Panel', 'jsx!views/beambox/Photo-Edit-Panel', 'jsx!views/beambox/Layer-Color-Config', 'jsx!views/beambox/Svg-Nest-Buttons', 'helpers/i18n'], function (Modal, Dialog, Prompt, ConfirmPrompt, {
  Tutorial
}, AboutBeamStudio, CameraCalibration, DiodeCalibration, DocumentPanel, NetworkTestingPanel, PhotoEditPanel, LayerColorConfigPanel, SvgNestButtons, i18n) {
  const React = require('react');

  const electronRemote = require('electron').remote;

  const {
    dialog
  } = electronRemote;

  const addDialogComponent = (id, component) => {
    if (!Dialog.DialogContextCaller) {
      console.log('Dialog context not loaded Yet');
    } else {
      Dialog.DialogContextCaller.addDialogComponent(id, component);
    }
  };

  const isIdExist = id => {
    if (!Dialog.DialogContextCaller) {
      console.log('Dialog context not loaded Yet');
    } else {
      const isExist = Dialog.DialogContextCaller.isIdExist(id);
      return isExist;
    }
  };

  const popDialogById = id => {
    if (!Dialog.DialogContextCaller) {
      console.log('Dialog context not loaded Yet');
    } else {
      Dialog.DialogContextCaller.popDialogById(id);
    }
  };

  let promptIndex = 0;
  return {
    addDialogComponent,
    popDialogById,
    showAboutBeamStudio: () => {
      if (isIdExist('about-bs')) return;
      addDialogComponent('about-bs', /*#__PURE__*/React.createElement(AboutBeamStudio, {
        onClose: () => {
          popDialogById('about-bs');
        }
      }));
    },
    showCameraCalibration: (device, isBorderless) => {
      if (isIdExist('camera-cali')) return;
      addDialogComponent('camera-cali', /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement(CameraCalibration, {
        device: device,
        model: 'beamo',
        borderless: isBorderless,
        onClose: () => {
          popDialogById('camera-cali');
        }
      })));
    },
    showDiodeCalibration: device => {
      if (isIdExist('diode-cali')) return;
      addDialogComponent('diode-cali', /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement(DiodeCalibration, {
        device: device,
        model: 'beamo',
        onClose: () => {
          popDialogById('diode-cali');
        }
      })));
    },
    showDocumentSettings: () => {
      if (isIdExist('docu-setting')) return;
      addDialogComponent('docu-setting', /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement(DocumentPanel, {
        unmount: () => {
          popDialogById('docu-setting');
        }
      })));
    },
    showNetworkTestingPanel: ip => {
      if (isIdExist('network-test')) return;
      addDialogComponent('network-test', /*#__PURE__*/React.createElement(NetworkTestingPanel, {
        ip: ip,
        onClose: () => {
          popDialogById('network-test');
        }
      }));
    },
    showPhotoEditPanel: mode => {
      if (isIdExist('photo-edit')) return;
      const selectedElements = svgCanvas.getSelectedElems();
      let len = selectedElements.length;

      for (let i = 0; i < selectedElements.length; ++i) {
        if (!selectedElements[i]) {
          len = i;
          break;
        }
      }

      if (len > 1) {
        return;
      }

      element = selectedElements[0];
      const src = element.getAttribute('origImage') || element.getAttribute('xlink:href');
      addDialogComponent('photo-edit', /*#__PURE__*/React.createElement(PhotoEditPanel, {
        mode: mode,
        element: element,
        src: src,
        unmount: () => {
          popDialogById('photo-edit');
        }
      }));
    },
    showLayerColorConfig: () => {
      if (isIdExist('layer-color-config')) return;
      addDialogComponent('layer-color-config', /*#__PURE__*/React.createElement(LayerColorConfigPanel, {
        onClose: () => {
          popDialogById('layer-color-config');
        }
      }));
    },
    showSvgNestButtons: () => {
      if (isIdExist('svg-nest')) return;
      addDialogComponent('svg-nest', /*#__PURE__*/React.createElement(SvgNestButtons, {
        onClose: () => {
          popDialogById('svg-nest');
        }
      }));
    },
    showTutorial: (tutorial, callback) => {
      const {
        id
      } = tutorial;
      if (isIdExist(id)) return;
      addDialogComponent(id, /*#__PURE__*/React.createElement(Tutorial, _extends({}, tutorial, {
        onClose: () => {
          popDialogById(id);
          callback();
        }
      })));
    },
    promptDialog: args => {
      const id = `prompt-${promptIndex}`;
      promptIndex = (promptIndex + 1) % 10000;
      addDialogComponent(id, /*#__PURE__*/React.createElement(Prompt, _extends({}, args, {
        onClose: () => {
          popDialogById(id);
        }
      })));
    },
    showConfirmPromptDialog: async args => {
      return await new Promise(resolve => {
        const id = `prompt-${promptIndex}`;
        promptIndex = (promptIndex + 1) % 10000;
        addDialogComponent(id, /*#__PURE__*/React.createElement(ConfirmPrompt, {
          caption: args.caption,
          message: args.message,
          confirmValue: args.confirmValue,
          onConfirmed: () => {
            resolve(true);
          },
          onCanceled: () => {
            resolve(false);
          },
          onClose: () => {
            popDialogById(id);
          }
        }));
      });
    },
    saveFileDialog: (title, filename, filters, isAllfileAvailable) => {
      const isMac = process.platform === 'darwin';
      const langFile = i18n.lang.topmenu.file;
      filters = filters.map(filter => {
        const {
          extensionName,
          extensions
        } = filter;
        return {
          name: isMac ? `${extensionName} (*.${extensions[0]})` : extensionName,
          extensions: extensions
        };
      });

      if (isAllfileAvailable) {
        filters.push({
          name: langFile.all_files,
          extensions: ['*']
        });
      }

      const options = {
        defaultPath: filename,
        title,
        filters
      };
      return new Promise(resolve => {
        dialog.showSaveDialog(options, filePath => {
          resolve(filePath);
        });
      });
    }
  };
});