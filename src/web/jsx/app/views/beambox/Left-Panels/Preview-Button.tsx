function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'jsx!widgets/Modal', 'jsx!views/beambox/Left-Panels/Image-Trace-Button', 'jsx!views/Printer-Selector', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'app/actions/beambox/svgeditor-function-wrapper', 'app/actions/beambox/preview-mode-background-drawer', 'app/actions/beambox/preview-mode-controller', 'app/actions/beambox/beambox-preference', 'app/actions/beambox', 'app/actions/global-actions', 'app/actions/progress-actions', 'app/constants/progress-constants', 'app/stores/beambox-store', 'jsx!app/actions/beambox/Image-Trace-Panel-Controller', 'plugins/classnames/index', 'helpers/shortcuts', 'helpers/version-checker', 'helpers/api/config', 'helpers/i18n'], function ($, Modal, ImageTraceButton, PrinterSelector, Alert, AlertConstants, FnWrapper, PreviewModeBackgroundDrawer, PreviewModeController, BeamboxPreference, BeamboxActions, GlobalActions, ProgressActions, ProgressConstants, BeamboxStore, ImageTracePanelController, classNames, shortcuts, VersionChecker, Config, i18n) {
  var _temp;

  const React = require('react');

  const ReactDOM = require('react-dom');

  const LANG = i18n.lang.beambox.left_panel;
  return _temp = class PreviewButton extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "onClearPreviewGraffitiClick", () => {
        if (!PreviewModeBackgroundDrawer.isClean()) {
          PreviewModeBackgroundDrawer.resetCoordinates();
          PreviewModeBackgroundDrawer.clear();
          BeamboxActions.clearCameraCanvas();
        }

        this.endPreviewMode();
        $('.svg-nest-buttons').removeClass('previewing');
        this.setState({
          isClearPreviewButtonShowing: false
        });
      });

      _defineProperty(this, "renderClearPreviewButton", () => {
        const {
          isClearPreviewButtonShowing,
          isClearPreviewButtonActive
        } = this.state;
        const borderless = BeamboxPreference.read('borderless') || false;

        if (!isClearPreviewButtonShowing) {
          return null;
        }

        return /*#__PURE__*/React.createElement("div", {
          id: "clear-preview-graffiti-button-placeholder",
          className: classNames('preview-control-button', {
            'active': isClearPreviewButtonActive
          }),
          onClick: () => {
            this.onClearPreviewGraffitiClick();
          }
        }, /*#__PURE__*/React.createElement("img", {
          src: 'img/left-bar/icon-camera.svg'
        }), /*#__PURE__*/React.createElement("div", {
          className: "text with-img"
        }, `${LANG.preview} ${borderless ? LANG.borderless : ''}`), /*#__PURE__*/React.createElement("div", {
          className: "cross-wrapper"
        }, /*#__PURE__*/React.createElement("div", {
          className: "bars bar1 shadow"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bars bar2 shadow"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bars bar1"
        })));
      });

      _defineProperty(this, "renderImageTraceButton", () => {
        const {
          isDrawing,
          isPreviewMode
        } = this.state;
        const imageTraceActive = !(PreviewModeBackgroundDrawer.isClean() || isDrawing);
        const imageTraceShow = isPreviewMode || !PreviewModeBackgroundDrawer.isClean();
        return /*#__PURE__*/React.createElement(ImageTraceButton, {
          onClick: imageTraceActive ? () => this.handleImageTraceClick() : () => {},
          active: imageTraceActive,
          show: imageTraceShow
        });
      });

      this.state = {
        isPreviewMode: false,
        isImageTraceMode: false,
        isDrawing: false,
        isDrawn: false,
        isClearPreviewButtonShowing: false,
        isClearPreviewButtonActive: false
      };
    }

    componentDidMount() {
      BeamboxStore.onStartDrawingPreviewBlob(() => this.startDrawing());
      BeamboxStore.onEndDrawingPreviewBlob(() => this.endDrawing());
      BeamboxStore.onClearCameraCanvas(() => this.hideImageTraceButton());
      BeamboxStore.onEndImageTrace(() => {
        this.endImageTrace();
        this.endPreviewMode();
      });
      BeamboxStore.onResetPreviewButton(() => this.resetPreviewButton());
    }

    componentWillUnmount() {
      BeamboxStore.removeStartDrawingPreviewBlobListener(() => this.startDrawing());
      BeamboxStore.removeEndDrawingPreviewBlobListener(() => this.endDrawing());
      BeamboxStore.removeClearCameraCanvasListener(() => this.hideImageTraceButton());
      BeamboxStore.removeEndImageTraceListener(() => this.endImageTrace());
      BeamboxStore.removeResetPreviewButton(() => this.resetPreviewButton());
    }

    endImageTrace() {
      this.setState({
        isPreviewMode: false,
        isImageTraceMode: false
      });
    }

    hideImageTraceButton() {
      this.setState({
        isDrawn: false
      });
    }

    handleImageTraceClick() {
      try {
        if (this.state.isPreviewMode) {
          PreviewModeController.end();
        }
      } catch (error) {
        console.log(error);
      } finally {
        FnWrapper.enterPreviewMode();
        FnWrapper.clearSelection();
        BeamboxActions.closeInsertObjectSubmenu();
        GlobalActions.monitorClosed();
        this.setState({
          isPreviewMode: false,
          isImageTraceMode: true
        });
      }
    }

    endDrawing() {
      this.setState({
        isDrawing: false,
        isDrawn: true
      });
    }

    startDrawing() {
      this.setState({
        isDrawing: true,
        isDrawn: false
      });
    }

    _handlePreviewClick() {
      if (!document.getElementById('image-trace-panel-outer')) {
        ImageTracePanelController.render();
      }

      const tryToStartPreviewMode = async () => {
        const isAlreadyRemindUserToCalibrateCamera = () => {
          return !BeamboxPreference.read('should_remind_calibrate_camera');
        };

        const remindCalibrateCamera = () => {
          Alert.popUp({
            type: AlertConstants.SHOW_INFO,
            message: LANG.suggest_calibrate_camera_first
          });
          BeamboxPreference.write('should_remind_calibrate_camera', false);
        };

        const isFirmwareVersionValid = device => {
          const vc = VersionChecker(device.version);
          return vc.meetRequirement('USABLE_VERSION');
        };

        const alertUserToUpdateFirmware = () => {
          Alert.popUp({
            type: AlertConstants.SHOW_POPUP_ERROR,
            message: i18n.lang.beambox.popup.should_update_firmware_to_continue
          });
        };

        const isFirmwareBorderlessAvailable = device => {
          const isAvailableVersion = function (version, targetVersion) {
            version = version.split('.').map(i => parseInt(i));
            targetVersion = targetVersion.split('.').map(i => parseInt(i));

            for (let i = 0; i < Math.min(version.length, targetVersion.length); ++i) {
              if (version[i] > targetVersion[i]) {
                return true;
              } else if (targetVersion[i] > version[i]) {
                return false;
              }
            }

            return true;
          }(device.version, '2.5.1');

          return isAvailableVersion;
        }; // return device or false


        const getDeviceToUse = async () => {
          const d = $.Deferred();
          const root = document.getElementById('printer-selector-placeholder');
          const button = $('.preview-btn');
          const top = button.position().top - button.height() / 2;
          const printerSelector = /*#__PURE__*/React.createElement(Modal, {
            onClose: d.reject
          }, /*#__PURE__*/React.createElement(PrinterSelector, {
            uniqleId: "laser",
            className: "preview-printer-selector",
            modelFilter: PrinterSelector.BEAMBOX_FILTER,
            onClose: d.reject,
            onGettingPrinter: device => d.resolve(device),
            WindowStyle: {
              top: `${top}px`,
              left: '80px'
            },
            arrowDirection: "left"
          }));

          try {
            ReactDOM.render(printerSelector, root);
            const device = await d;
            ReactDOM.unmountComponentAtNode(root);
            return device;
          } catch (error) {
            console.log(error);
            ReactDOM.unmountComponentAtNode(root);
            return false;
          }
        };

        const startPreviewMode = async device => {
          const errorCallback = errMessage => {
            Alert.popUp({
              type: AlertConstants.SHOW_POPUP_ERROR,
              message: `#803 ${errMessage}`
            });
            this.setState({
              isPreviewMode: false
            });
            $(workarea).css('cursor', 'auto');
          };

          $(workarea).css('cursor', 'wait');

          try {
            await PreviewModeController.start(device, errorCallback);
            $('.tool-btn').removeClass('active');
            this.setState({
              isPreviewMode: true
            });
            $(workarea).css('cursor', 'url(img/camera-cursor.svg), cell');
          } catch (error) {
            console.log(error);
            Alert.popUp({
              type: AlertConstants.SHOW_POPUP_ERROR,
              message: '#803 ' + (error.message || 'Fail to start preview mode')
            });
            FnWrapper.useSelectTool();
          }
        }; // MAIN PROCESS HERE


        FnWrapper.useSelectTool();

        if (!isAlreadyRemindUserToCalibrateCamera()) {
          remindCalibrateCamera();
          return;
        }

        const device = await getDeviceToUse();

        if (!device) {
          return;
        }

        ;

        if (BeamboxPreference.read('borderless')) {
          if (!isFirmwareBorderlessAvailable(device)) {
            const message = `#814 ${i18n.lang.camera_calibration.update_firmware_msg1} 2.5.1 ${i18n.lang.camera_calibration.update_firmware_msg2} ${i18n.lang.beambox.popup.or_turn_off_borderless_mode}`;
            const caption = i18n.lang.beambox.left_panel.borderless_preview;
            Alert.popUp({
              type: AlertConstants.SHOW_POPUP_ERROR,
              message,
              caption
            });
            return;
          }
        }

        ProgressActions.open(ProgressConstants.NONSTOP, i18n.lang.message.tryingToConenctMachine);

        if (!isFirmwareVersionValid(device)) {
          alertUserToUpdateFirmware();
          ProgressActions.close();
          return;
        }

        ProgressActions.close();
        await startPreviewMode(device);
        this.props.passEndPreview(this.endPreviewMode.bind(this));
        shortcuts.on(['esc'], this.endPreviewMode.bind(this));
        const self = this;
        $('#workarea').contextMenu({
          menu: []
        }, () => {});
        $('#workarea').contextmenu(function () {
          //console.log(self.endPreviewMode);
          self.endPreviewMode();
          return false;
        });
        this.setState({
          isClearPreviewButtonShowing: true,
          isClearPreviewButtonActive: true
        });
      };

      FnWrapper.clearSelection();
      BeamboxActions.closeInsertObjectSubmenu();
      GlobalActions.monitorClosed();

      if (!this.state.isPreviewMode) {
        tryToStartPreviewMode();
      } else {
        this.endPreviewMode();
      }
    }

    _renderImageTraceButton() {
      if (this.state.isImageTraceMode) {
        return;
      } else {
        return null;
      }
    }

    resetPreviewButton() {
      FnWrapper.useSelectTool();
      this.setState({
        isClearPreviewButtonActive: false,
        isClearPreviewButtonShowing: !PreviewModeBackgroundDrawer.isClean(),
        isPreviewMode: false,
        isImageTraceMode: false
      });
    }

    endPreviewMode() {
      try {
        if (PreviewModeController.isPreviewMode()) {
          PreviewModeController.end();
        }
      } catch (error) {
        console.log(error);
      } finally {
        this.resetPreviewButton();
        this.props.passEndPreview(() => {});
        shortcuts.off(['esc']);
        $('#workarea').off('contextmenu');
        svgEditor.setWorkAreaContextMenu();
      }
    }

    render() {
      const {
        isPreviewMode
      } = this.state;
      const clearButton = this.renderClearPreviewButton();
      const imageTraceButton = this.renderImageTraceButton();
      return /*#__PURE__*/React.createElement("div", {
        className: "preview"
      }, /*#__PURE__*/React.createElement("div", {
        className: classNames('tool-btn', 'preview-btn', {
          'active': isPreviewMode
        }),
        onClick: () => this._handlePreviewClick(),
        title: LANG.label.preview
      }, /*#__PURE__*/React.createElement("img", {
        src: 'img/left-bar/icon-camera.svg',
        draggable: "false"
      })), /*#__PURE__*/React.createElement("span", {
        id: "printer-selector-placeholder"
      }), /*#__PURE__*/React.createElement("div", {
        className: "preview-buttons"
      }, clearButton, imageTraceButton));
    }

  }, _temp;
});