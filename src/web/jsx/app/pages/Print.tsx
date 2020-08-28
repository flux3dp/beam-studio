function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'app/actions/print', 'plugins/classnames/index', 'jsx!views/print/Advanced', 'jsx!views/print/Left-Panel', 'jsx!views/print/Right-Panel', 'jsx!views/print/Monitor', 'jsx!views/print/Object-Dialogue', 'jsx!widgets/Modal', 'helpers/api/config', 'jsx!views/Printer-Selector', 'helpers/device-master', 'app/stores/global-store', 'app/actions/global-actions', 'app/constants/global-constants', 'app/constants/device-constants', 'jsx!widgets/Tour-Guide', 'app/actions/alert-actions', 'app/stores/alert-store', 'helpers/object-assign', 'helpers/sprintf', 'app/actions/initialize-machine', 'app/actions/progress-actions', 'app/constants/progress-constants', 'helpers/shortcuts', 'helpers/packer', 'app/default-print-settings', 'app/actions/input-lightbox-actions', 'app/constants/input-lightbox-constants', 'helpers/local-storage', 'helpers/api/cloud', 'helpers/i18n', 'app/tutorial-steps', 'helpers/slicer-settings', 'helpers/get-device'], function ($, director, ClassNames, AdvancedPanel, LeftPanel, RightPanel, Monitor, ObjectDialogue, Modal, Config, PrinterSelector, DeviceMaster, GlobalStore, GlobalActions, GlobalConstants, DeviceConstants, TourGuide, AlertActions, AlertStore, ObjectAssign, sprintf, InitializeMachine, ProgressActions, ProgressConstants, shortcuts, packer, DefaultPrintSettings, InputLightboxActions, InputLightboxConstants, LocalStorage, CloudApi, i18n, TutorialSteps, SlicerSettings, GetDevice) {
  const React = require('react');

  const ReactDOM = require('react-dom');

  return function (args) {
    'use strict';

    args = args || {};
    var advancedSettings = new SlicerSettings('main'),
        fineAdvancedSettings = {},
        _scale = {
      locked: true,
      x: 1,
      y: 1,
      z: 1
    },
        _rotation = {
      x: 0,
      y: 0,
      z: 0
    },
        lang = args.state.lang,
        selectedPrinter,
        $importBtn,
        finishedSnapshot = false,
        listeningToCancel = false,
        defaultRaftLayer = 4,
        allowDeleteObject = true,
        tutorialMode = false,
        defaultSlicingEngine = 'cura2',
        tourGuide = TutorialSteps;

    class Print extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_startTutorial", () => {
          this.setState({
            currentTutorialStep: 0
          }, () => {
            this._handleYes('tour');
          });
        });

        _defineProperty(this, "_registerKeyEvents", () => {
          // delete event
          shortcuts.on(['del'], () => {
            if (allowDeleteObject && !this._isMonitorOn()) {
              director.removeSelected();
            }
          });
        });

        _defineProperty(this, "_registerTutorial", () => {
          if (tutorialMode) {
            AlertActions.showPopupYesNo('tour', lang.tutorial.startTour);
          }
        });

        _defineProperty(this, "_registerTracking", () => {
          let allowTracking = Config().read('allow-tracking');

          if (allowTracking === '') {
            AlertActions.showPopupYesNo('allow_tracking', lang.settings.allow_tracking);
          }
        });

        _defineProperty(this, "showSpinner", caption => {
          ProgressActions.open(ProgressConstants.NONSTOP, caption);
        });

        _defineProperty(this, "hideSpinner", () => {
          ProgressActions.close();
        });

        _defineProperty(this, "_updateAdvancedSettings", opts => {
          let uploadingConfig = {};
          Object.keys(opts).map(key => {
            let value = opts[key];
            let filteredParam = advancedSettings.filter({
              key: key,
              value: value
            });

            if (filteredParam) {
              if (filteredParam.key instanceof Array) {
                for (let i = 0; i < filteredParam.key.length; i++) {
                  uploadingConfig[filteredParam.key[i]] = filteredParam.value[i];
                }
              } else {
                uploadingConfig[filteredParam.key] = filteredParam.value;
              }
            }

            ;
          });
          console.log("Uploading config", uploadingConfig);
          director.setParameters(uploadingConfig);
          advancedSettings.update(opts); // update dom state

          this.setState(opts);

          this._saveSetting();
        });

        _defineProperty(this, "_getDevice", () => {
          return GetDevice();
        });

        _defineProperty(this, "_handleYes", (answer, args) => {
          console.log('answer', answer);

          if (answer === 'tour') {
            let activeLang = i18n.getActiveLang();
            console.log('activeLang', activeLang);

            if (this.state.hasObject) {
              director.clearScene();
            }

            ;

            const startTutorial = () => {
              this.setState({
                tutorialOn: true
              });
              tutorialMode = true;
            };

            const befaultTutorial = () => {
              let d = $.Deferred();

              const callback = () => {
                var shell = require('electron').shell;

                var href = activeLang === 'en' ? 'https://flux3dp.zendesk.com/hc/en-us/articles/115003538848-FLUX-Delta-Unboxing-Guide' : 'https://flux3dp.zendesk.com/hc/zh-tw/articles/115003538848-FLUX-Delta-開箱導引';
                shell.openExternal(href);
                d.resolve();
              };

              AlertActions.showPopupCustom('tutorial-welcome', lang.tutorial.befaultTutorialWelcome, lang.tutorial.openBrowser, 'WELCOME', null, callback);
              return d.promise();
            };

            const showTutorialImage = () => {
              let d = $.Deferred();

              const callback = () => {
                d.resolve();
              };

              const imageObject = {
                images: ['img/tutorial/' + activeLang + '/n01.png', 'img/tutorial/' + activeLang + '/n02.png', 'img/tutorial/' + activeLang + '/n03.png', 'img/tutorial/' + activeLang + '/n04.png', 'img/tutorial/' + activeLang + '/n05.png', 'img/tutorial/' + activeLang + '/n06.png'],
                imgClass: 'img640x480'
              };
              setTimeout(() => {
                AlertActions.showPopupCustom('tutorial-images', 'Test Message', 'custom_text', null, imageObject, callback);
              }, 1);
              return d.promise();
            };

            befaultTutorial().done(showTutorialImage).done(startTutorial);
          } else if (answer === 'set_default') {
            Config().write('default-model', Config().read('configured-model'));
            this.setState({
              displayModelControl: false
            });
            this.showSpinner();
            let self = this,
                device = {},
                callback;

            if (Config().read('configured-printer') !== '') {
              device = Config().read('configured-printer');
            }

            callback = {
              timeout: 20000,
              onSuccess: function (printer) {
                ProgressActions.close();
                InitializeMachine.defaultPrinter.set({
                  name: printer.name,
                  serial: printer.serial,
                  uuid: printer.uuid
                });
                setTimeout(function () {
                  AlertActions.showInfo(sprintf(lang.set_default.success, device.name));
                }, 100); //Start tutorial

                setTimeout(function () {
                  this._registerTutorial();
                }.bind(this), 100);
              }.bind(this),
              onTimeout: function () {
                self.hideSpinner();
                setTimeout(function () {
                  AlertActions.showWarning(sprintf(lang.set_default.error, device.name));
                }, 100);
              }
            };
            let addr = parseInt(device.addr || '-1');
            DeviceMaster.getDeviceBySerial(device.serial, false, callback);
          } else if (answer === 'print-setting-version') {
            advancedSettings.load(DefaultPrintSettings.cura2);
            Config().write('slicing-config', advancedSettings.toString());
            Config().write('print-setting-version', GlobalConstants.DEFAULT_PRINT_SETTING_VERSION);
          } else if (answer === GlobalConstants.EXIT_PREVIEW) {
            director.cancelPreview();
          } else if (answer === GlobalConstants.IMPORT_FCODE) {
            director.doFCodeImport(args);
          } else if (answer === GlobalConstants.IMPORT_SCENE) {
            director.loadScene();
          } else if (answer === 'allow_tracking') {
            Config().write('allow-tracking', 'true');
          }
        });

        _defineProperty(this, "_handleNo", (answer, args) => {
          console.log(answer);
        });

        _defineProperty(this, "_handleCancelTutorial", answer => {
          if (answer === 'tour') {
            this.setState({
              tutorialOn: false
            });
            tutorialMode = false;
            Config().write('tutorial-finished', true);
          }
        });

        _defineProperty(this, "_handleRaftClick", () => {
          this.setState({
            leftPanelReady: false
          });
          var isOn = !this.state.raftOn;
          director.setParameter('raft', isOn ? '1' : '0').then(function () {
            this.setState({
              leftPanelReady: true,
              raftOn: isOn
            });
          }.bind(this));
          advancedSettings.set('raft', isOn ? 1 : 0, true);

          this._saveSetting();
        });

        _defineProperty(this, "_handleSupportClick", () => {
          this.setState({
            leftPanelReady: false
          });
          var isOn = !this.state.supportOn;
          let filteredItem = advancedSettings.filter({
            key: 'support_material',
            value: isOn ? 1 : 0
          });
          director.setParameter(filteredItem.key, filteredItem.value ? 1 : 0).then(function () {
            this.setState({
              leftPanelReady: true,
              supportOn: isOn
            });
          }.bind(this));
          let configStr = advancedSettings.configStr;
          advancedSettings.set('support_enable', isOn ? 1 : 0, true);

          this._saveSetting();
        });

        _defineProperty(this, "_handleToggleAdvancedSettingPanel", () => {
          this.setState({
            showAdvancedSettings: !this.state.showAdvancedSettings
          }, function () {
            allowDeleteObject = !this.state.showAdvancedSettings;
          });
        });

        _defineProperty(this, "_handleGoClick", () => {
          AlertStore.removeCancelListener(this._handleDefaultCancel);
          listeningToCancel = false;
          finishedSnapshot = false;
          director.takeSnapShot().then(() => {
            finishedSnapshot = true;
            director.clearSelection();
          });
          this.setState({
            openPrinterSelectorWindow: true
          });
        });

        _defineProperty(this, "_handleRotationChange", rotation => {
          director.addHistory();
          director.setRotation(rotation.enteredX, rotation.enteredY, rotation.enteredZ, true);
        });

        _defineProperty(this, "_handleResetRotation", () => {
          _rotation.x = 0;
          _rotation.y = 0;
          _rotation.z = 0;
          this.setState({
            rotation: _rotation
          });
          director.setRotation(0, 0, 0, true);
        });

        _defineProperty(this, "_handleScaleChange", src => {
          var axis = src.target.id;
          _scale[axis] = src.type === 'blur' && !$.isNumeric(src.target.value) ? 1 : src.target.value;
          director.setScale(scale.x, scale.y, scale.z, scale.locked, true);
        });

        _defineProperty(this, "_handleToggleScaleLock", (size, isLocked) => {
          _scale.locked = isLocked;
          this.setState({
            scale: _scale
          });
          director.toggleScaleLock(isLocked);
        });

        _defineProperty(this, "_handleResize", (size, isLocked) => {
          director.addHistory();
          director.setSize(size, isLocked);
        });

        _defineProperty(this, "_handleResetScale", () => {
          director.setScale(1, 1, 1, true);
        });

        _defineProperty(this, "_handleCloseAdvancedSetting", () => {
          this.setState({
            showAdvancedSettings: false
          });
          allowDeleteObject = true;
        });

        _defineProperty(this, "_handleApplyAdvancedSetting", setting => {
          let d = $.Deferred(),
              quality = 'custom',
              supportOn;
          advancedSettings.load(setting || {}, true); // remove old properties

          delete advancedSettings.config.raft_on;

          this._saveSetting();

          ['high', 'med', 'low'].forEach(q => {
            // Do comparsion with default settings
            let params = DefaultPrintSettings[this.state.model][q];

            for (var i in params) {
              if (params[i] !== advancedSettings.config[i]) {
                return;
              }
            } // No difference then quality equals q


            quality = q;
          });
          this.setState({
            supportOn: advancedSettings.config.support_enable === 1,
            layerHeight: advancedSettings.config.layer_height,
            raftOn: advancedSettings.config.raft === 1,
            quality: quality
          });

          if (!setting) {
            let self = this;

            let uploadSettings = () => {
              console.log("Uploading Settings", advancedSettings);
              director.setAdvanceParameter(advancedSettings.deepClone()).then(() => {
                fineAdvancedSettings = advancedSettings.deepClone();
              }).fail(() => {
                console.log("Uploading Settings Failed", advancedSettings);
                advancedSettings.load(fineAdvancedSettings);
                director.setAdvanceParameter(advancedSettings);

                self._saveSetting();
              }).always(() => {
                d.resolve();
              });
            };

            this._handleSlicingEngineChange('cura2').then(uploadSettings).fail(() => {
              d.reject();
            });
          } else {
            this._handleSlicingEngineChange('cura2').then(() => {
              director.setAdvanceParameter(advancedSettings).then(() => {
                Object.assign(fineAdvancedSettings, advancedSettings);
              }).fail(() => {
                advancedSettings.load(fineAdvancedSettings);
                director.setAdvanceParameter(advancedSettings);

                this._saveSetting();
              }).always(() => {
                d.resolve();
              });
            });
          }

          return d.promise();
        });

        _defineProperty(this, "_handleImport", e => {
          var t = e.target;
          director.appendModels(t.files, 0, function () {
            t.value = null;
          }.bind(this));
        });

        _defineProperty(this, "_handleDownloadGCode", () => {
          if (director.getModelCount() !== 0) {
            director.downloadGCode().then(function () {
              this.setState({
                openWaitWindow: false
              });
            });
          }
        });

        _defineProperty(this, "_handleDownloadFCode", () => {
          director.downloadFCode();
        });

        _defineProperty(this, "_handleDownloadScene", () => {
          allowDeleteObject = true;
          director.downloadScene();
        });

        _defineProperty(this, "_handlePreview", isOn => {
          if (this.state.previewMode !== isOn) {
            this.setState({
              previewMode: isOn
            }, function () {
              director.togglePreview();
            });
          }
        });

        _defineProperty(this, "_handlePrinterSelectorWindowClose", () => {
          this.setState({
            openPrinterSelectorWindow: false
          });
        });

        _defineProperty(this, "_handlePrinterSelectorUnmount", () => {
          AlertStore.onCancel(this._handleDefaultCancel);
          listeningToCancel = true;
        });

        _defineProperty(this, "_handleDeviceSelected", printer => {
          if (printer === 'export_fcode') {
            if (director.getModelCount() !== 0) {
              director.downloadFCode().then(() => {
                this.setState({
                  openWaitWindow: false
                });
              });
            }

            return;
          }

          selectedPrinter = printer;
          this.setState({
            openPrinterSelectorWindow: false
          }, () => {
            let go = () => {
              if (director.getSlicingStatus().isComplete && finishedSnapshot) {
                clearInterval(t);
                director.getFCode().then((fcode, previewUrl) => {
                  if (!(fcode instanceof Blob)) {
                    AlertActions.showPopupError('', lang.print.out_of_range_message, lang.print.out_of_range);
                    return;
                  }

                  AlertStore.removeCancelListener(this._handleDefaultCancel);
                  GlobalActions.showMonitor(selectedPrinter, fcode, previewUrl, GlobalConstants.PRINT); //Tour popout after show monitor delay

                  const tour = () => {
                    if (tutorialMode) {
                      this.setState({
                        tutorialOn: true,
                        currentTutorialStep: 6
                      }); //Insert into root html

                      $('.tour-overlay').append($('.tour'));
                      $('.tour').click(() => {
                        $('.print-studio').append($('.tour'));

                        this._handleTutorialComplete();
                      });
                    }

                    ;
                  };

                  setTimeout(tour, 1000);
                });
              }
            };

            let t = setInterval(go, 100);
          });
        });

        _defineProperty(this, "_handlePreviewLayerChange", targetLayer => {
          director.changePreviewLayer(targetLayer);
        });

        _defineProperty(this, "_handleCameraPositionChange", (position, rotation) => {
          director.setCameraPosition(position, rotation);
        });

        _defineProperty(this, "_handleMonitorClosed", () => {
          if (!listeningToCancel) {
            AlertStore.removeCancelListener(this._handleDefaultCancel);
            listeningToCancel = true;
          }
        });

        _defineProperty(this, "_handleModeChange", mode => {
          this.setState({
            mode: mode
          });

          if (mode === 'rotate') {
            director.setRotateMode();
          } else {
            director.setScaleMode();
          }
        });

        _defineProperty(this, "_handleQualityModelSelected", (quality, machineModel) => {
          if (['high', 'med', 'low'].indexOf(quality) < 0) {
            quality = 'med';
          }

          var parameters = DefaultPrintSettings[machineModel || 'fd1'][quality];
          this.setState({
            model: machineModel,
            quality: quality
          });
          Config().write('preferred-model', machineModel);

          this._updateAdvancedSettings(parameters);

          this._saveSetting();
        });

        _defineProperty(this, "_handleTutorialStep", () => {
          if (!tutorialMode) {
            return;
          }

          this.setState({
            currentTutorialStep: this.state.currentTutorialStep + 1
          }, function () {
            if (this.state.currentTutorialStep === 1) {
              let selectedDevice = this._getDevice();

              const isNotEmptyObject = o => Object.keys(o).length > 0;

              if (isNotEmptyObject(selectedDevice)) {
                let addr = parseInt(selectedDevice.addr || '-1'),
                    callback;
                callback = {
                  timeout: 20000,
                  onSuccess: function (printer) {
                    //Found ya default printer
                    ProgressActions.close();
                    setTimeout(function () {
                      AlertActions.showChangeFilament(printer, 'TUTORIAL');
                    }, 100);
                  }.bind(this),
                  onTimeout: function () {
                    //Unable to find configured printer...
                    ProgressActions.close();
                    setTimeout(function () {
                      AlertActions.showWarning(sprintf(lang.set_default.error, selectedDevice.name));
                    }, 100);
                  }
                };
                DeviceMaster.getDeviceBySerial(selectedDevice.serial, false, callback);
              }
            } else if (this.state.currentTutorialStep === 3) {
              var fileEntry = {};
              fileEntry.name = 'guide-example.stl';

              fileEntry.toURL = function () {
                return 'guide-example.stl';
              };

              var oReq = new XMLHttpRequest();
              oReq.open('GET', 'guide-example.stl', true);
              oReq.responseType = 'blob';

              oReq.onload = function (oEvent) {
                var blob = oReq.response;
                var url = URL.createObjectURL(blob);
                blob.name = 'guide-example.stl';
                director.appendModel(url, blob, 'st', () => {
                  director.startSlicing();
                });
              };

              oReq.send();
              AlertStore.removeCancelListener(this._handleDefaultCancel);
            } else if (this.state.currentTutorialStep === 5) {
              this.setState({
                tutorialOn: false
              });
              $('.btn-go').click();
            }
          });
        });

        _defineProperty(this, "_handleTutorialComplete", () => {
          tutorialMode = false;
          Config().write('tutorial-finished', true);
          $('.tour').hide();
          this.setState({
            tutorialOn: false
          });
        });

        _defineProperty(this, "_handleCloseAllView", () => {
          GlobalActions.closeAllView();
        });

        _defineProperty(this, "_handleObjectDialogueFocus", isFocused => {
          allowDeleteObject = !isFocused;
        });

        _defineProperty(this, "_handleDefaultCancel", ans => {
          //Use setTimeout to avoid multiple modal display conflict
          console.log('ans', ans);

          if (ans === 'set_default') {
            AlertStore.removeYesListener(this._handleYes);
            setTimeout(function () {
              this._registerTutorial();
            }.bind(this), 10);
          } else if (ans === 'tour') {
            this.setState({
              tutorialOn: false
            });
            tutorialMode = false;
            Config().write('tutorial-finished', true);
          } else if (ans === 'change-filament-device-busy') {
            this.setState({
              tutorialOn: false
            });
            tutorialMode = false;
          } else if (ans === 'print-setting-version') {
            Config().write('print-setting-version', GlobalConstants.DEFAULT_PRINT_SETTING_VERSION);
          } else if (ans === 'allow_tracking') {
            Config().write('allow-tracking', 'false');
            window.location.reload();
          }
        });

        _defineProperty(this, "_handleSliceReport", data => {
          this.setState({
            slicingStatus: data.report
          });
        });

        _defineProperty(this, "_handleCancelPreview", () => {
          director.cancelPreview();
        });

        _defineProperty(this, "_handleClearScene", () => {
          director.clearScene();
        });

        _defineProperty(this, "_handleSlicingEngineChange", engineName => {
          engineName = engineName || defaultSlicingEngine;
          var d = $.Deferred(),
              path = 'default';
          director.changeEngine(engineName).then(error => {
            if (error) {
              AlertActions.showPopupWarning('engine-change', lang.settings.engine_change_fail[error.error] + ', ' + error.info, `${lang.settings.engine_change_fail.caption}`);
            }

            d.resolve();
          }).fail(error => {
            d.reject(error);
          });
          return d.promise();
        });

        _defineProperty(this, "_saveSetting", () => {
          // extra process for raft (because it's a direct control on left panel)
          Config().write('slicing-config', advancedSettings.toString());
        });

        _defineProperty(this, "_checkDefaultPrintSettingsVersion", () => {
          var version = Config().read('print-setting-version');

          if (version !== GlobalConstants.DEFAULT_PRINT_SETTING_VERSION) {
            AlertActions.showPopupYesNo('print-setting-version', lang.monitor.updatePrintPresetSetting);
          }
        });

        _defineProperty(this, "_isMonitorOn", () => {
          // yuk! needs to be changed when redux is fully implemented
          return $('.flux-monitor').length > 0;
        });

        _defineProperty(this, "_renderAdvancedPanel", () => {
          return /*#__PURE__*/React.createElement(AdvancedPanel, {
            lang: lang,
            setting: advancedSettings,
            raftLayers: this.state.raftLayers,
            onClose: this._handleCloseAdvancedSetting,
            onApply: this._handleApplyAdvancedSetting
          });
        });

        _defineProperty(this, "_renderPrinterSelectorWindow", () => {
          var content = /*#__PURE__*/React.createElement(PrinterSelector, {
            uniqleId: "print",
            lang: lang,
            modelFilter: PrinterSelector.DELTA_FILTER,
            showExport: true,
            onClose: this._handlePrinterSelectorWindowClose,
            onUnmount: this._handlePrinterSelectorUnmount,
            onGettingPrinter: this._handleDeviceSelected
          });
          return /*#__PURE__*/React.createElement(Modal, _extends({}, this.props, {
            content: content,
            onClose: this._handlePrinterSelectorWindowClose
          }));
        });

        _defineProperty(this, "_renderImportWindow", () => {
          var importWindowClass = ClassNames('importWindow', {
            'hide': !this.state.openImportWindow
          });
          return /*#__PURE__*/React.createElement("div", {
            className: importWindowClass
          }, /*#__PURE__*/React.createElement("div", {
            className: "arrowBox",
            onClick: this._handleCloseAllView
          }, /*#__PURE__*/React.createElement("div", {
            title: lang.print.importTitle,
            className: "file-importer"
          }, /*#__PURE__*/React.createElement("div", {
            className: "import-btn"
          }, lang.print.import), /*#__PURE__*/React.createElement("input", {
            ref: "import",
            type: "file",
            "data-file-input": "stl_import",
            accept: ".stl,.fc,.gcode,.obj,.fsc",
            onChange: this._handleImport,
            multiple: true
          }))));
        });

        _defineProperty(this, "_renderLeftPanel", () => {
          return /*#__PURE__*/React.createElement(LeftPanel, {
            lang: lang,
            enable: this.state.leftPanelReady,
            hasObject: this.state.hasObject,
            hasOutOfBoundsObject: this.state.hasOutOfBoundsObject,
            previewMode: this.state.previewMode,
            previewModeOnly: this.state.previewModeOnly,
            previewLayerCount: this.state.previewLayerCount,
            disablePreview: this.state.disablePreview,
            displayModelControl: this.state.displayModelControl,
            raftOn: this.state.raftOn,
            supportOn: this.state.supportOn,
            quality: this.state.quality,
            model: this.state.model,
            onQualityModelSelected: this._handleQualityModelSelected,
            onRaftClick: this._handleRaftClick,
            onSupportClick: this._handleSupportClick,
            onPreviewClick: this._handlePreview,
            onPreviewLayerChange: this._handlePreviewLayerChange,
            onShowAdvancedSettingPanel: this._handleToggleAdvancedSettingPanel
          });
        });

        _defineProperty(this, "_renderRightPanel", () => {
          return /*#__PURE__*/React.createElement(RightPanel, {
            lang: lang,
            slicingPercentage: this.state.slicingPercentage,
            slicingStatus: this.state.slicingStatus,
            camera: this.state.camera,
            updateCamera: this.state.updateCamera,
            hasObject: this.state.hasObject,
            disableGoButtons: this.state.disableGoButtons,
            hasOutOfBoundsObject: this.state.hasOutOfBoundsObject,
            onGoClick: this._handleGoClick,
            onDownloadGCode: this._handleDownloadGCode,
            onCameraPositionChange: this._handleCameraPositionChange,
            onDownloadFCode: this._handleDownloadFCode
          });
        });

        _defineProperty(this, "_renderObjectDialogue", () => {
          return /*#__PURE__*/React.createElement(ObjectDialogue, {
            lang: lang,
            model: this.state.modelSelected,
            style: this.state.objectDialogueStyle,
            mode: this.state.mode,
            isTransforming: this.state.isTransforming,
            scaleLocked: _scale.locked,
            onRotate: this._handleRotationChange,
            onResize: this._handleResize,
            onScaleLock: this._handleToggleScaleLock,
            onFocus: this._handleObjectDialogueFocus,
            onModeChange: this._handleModeChange
          });
        });

        _defineProperty(this, "_renderWaitWindow", () => {
          var spinner = /*#__PURE__*/React.createElement("div", {
            className: "spinner-flip spinner-reverse"
          });
          return /*#__PURE__*/React.createElement(Modal, {
            content: spinner
          });
        });

        _defineProperty(this, "_renderProgressWindow", () => {
          var content = /*#__PURE__*/React.createElement("div", {
            className: "progressWindow"
          }, /*#__PURE__*/React.createElement("div", {
            className: "message"
          }, this.state.progressMessage), /*#__PURE__*/React.createElement("div", {
            className: "spinner-flip spinner-reverse"
          }));
          return /*#__PURE__*/React.createElement(Modal, {
            content: content
          });
        });

        _defineProperty(this, "_renderPercentageBar", () => {
          let {
            slicingPercentage
          } = this.state;

          if (slicingPercentage === 1 || slicingPercentage === 0) {
            return '';
          }

          var computed_style = {
            width: this.state.slicingPercentage * 100 + '%'
          };
          return /*#__PURE__*/React.createElement("div", {
            className: "slicingProgressBar"
          }, /*#__PURE__*/React.createElement("div", {
            className: "slicingProgressBarInner",
            style: computed_style
          }));
        });

        _defineProperty(this, "_renderTourGuide", () => {
          return /*#__PURE__*/React.createElement(TourGuide, {
            lang: lang,
            enable: this.state.tutorialOn,
            guides: tourGuide,
            step: this.state.currentTutorialStep,
            onNextClick: this._handleTutorialStep,
            onComplete: this._handleTutorialComplete
          });
        });

        var storedSlicingConfig = Config().read('slicing-config'),
            tutorialFinished = Config().read('tutorial-finished'),
            configuredPrinter = Config().read('configured-printer');

        this._checkDefaultPrintSettingsVersion();

        if (!storedSlicingConfig) {
          advancedSettings.load(DefaultPrintSettings.cura2);
          var defaultMedium = DefaultPrintSettings[Config().read('default-model') || Config().read('preferred-model') || 'fd1']['med'];
          console.log("loading default medium", defaultMedium);
          advancedSettings.update(defaultMedium);
        } else {
          advancedSettings.load(storedSlicingConfig, true);
        }

        if (tutorialFinished !== 'true' && configuredPrinter !== '') {
          tutorialMode = true;
        } // processing support


        let supportOn = advancedSettings.config.support_enable === 1;
        this.state = {
          showAdvancedSettings: false,
          modelSelected: null,
          openPrinterSelectorWindow: false,
          openObjectDialogue: false,
          openWaitWindow: false,
          openImportWindow: true,
          isTransforming: false,
          hasOutOfBoundsObject: false,
          hasObject: false,
          tutorialOn: false,
          leftPanelReady: true,
          previewMode: false,
          previewModeOnly: false,
          disablePreview: false,
          disableGoButtons: false,
          slicingPercentage: 0,
          currentTutorialStep: 0,
          layerHeight: 0.1,
          raftOn: advancedSettings.config.raft === 1,
          supportOn: supportOn,
          displayModelControl: !Config().read('default-model'),
          model: Config().read('default-model') || Config().read('preferred-model') || 'fd1',
          quality: 'high',
          mode: 'scale',
          previewLayerCount: 0,
          progressMessage: '',
          fcode: {},
          objectDialogueStyle: {},
          camera: {},
          rotation: {},
          scale: _scale,
          printerControllerStatus: '',
          me: {}
        };
      }

      UNSAFE_componentWillMount() {
        if (window["electron"]) {
          let {
            ipc,
            events
          } = window.electron;
          CloudApi.getMe().then(response => {
            if (response.ok) {
              response.json().then(content => {
                let {
                  nickname,
                  email
                } = content || {};
                let displayName = nickname || email || '';
                console.log('account is', content);
                ipc.send(events.UPDATE_ACCOUNT, content);
              });
            } else {
              ipc.send(events.UPDATE_ACCOUNT, {});
            }
          });
          ipc.send(events.UPDATE_ACCOUNT, {});
        }
      }

      componentDidMount() {
        director.init(this); // prevent user to operate before settings are set

        this.showSpinner();

        this._handleApplyAdvancedSetting().always(() => {
          this.hideSpinner();
        }); // events


        $importBtn = ReactDOM.findDOMNode(this.refs.importBtn);

        if (!window.customEvent) {
          window.customEvent = {};
        }

        window.customEvent.onTutorialClick = () => {
          this.setState({
            currentTutorialStep: 0
          }, () => {
            this._handleYes('tour');
          });
        };

        this._registerKeyEvents();

        this._registerTracking();

        if (tutorialMode) {
          let name = '';

          if (Config().read('configured-printer') !== '') {
            name = Config().read('configured-printer').name;
          } //First time using, with usb-configured printer..


          AlertActions.showPopupYesNo('set_default', sprintf(lang.tutorial.set_first_default, name), lang.tutorial.set_first_default_caption);
        }

        AlertStore.onYes(this._handleYes);
        AlertStore.onNo(this._handleNo);
        AlertStore.onCancel(this._handleDefaultCancel);
        listeningToCancel = true;
        GlobalStore.onCancelPreview(this._handleCancelPreview);
        GlobalStore.onMonitorClosed(this._handleMonitorClosed);
        GlobalStore.onSliceComplete(this._handleSliceReport);
        $('.print-studio').mouseup(() => {
          GlobalActions.resetDialogMenuIndex();
        });
        document.addEventListener('mouseup', () => {
          GlobalActions.monitorClosed();
        });
      }

      componentWillUnmount() {
        director.clear();
        director.willUnmount();
        AlertStore.removeYesListener(this._handleYes);
        AlertStore.removeCancelListener(this._handleDefaultCancel);
        GlobalStore.removeCancelPreviewListener(this._handleCancelPreview);
        GlobalStore.removeMonitorClosedListener(this._handleMonitorClosed);
        GlobalStore.removeSliceCompleteListener(this._handleSliceReport);
        document.removeEventListener('mouseup', () => {
          GlobalActions.monitorClosed(); //GlobalActions.resetDialogMenuIndex();
        });
      }

      render() {
        var advancedPanel = this.state.showAdvancedSettings ? this._renderAdvancedPanel() : '',
            importWindow = this._renderImportWindow(),
            leftPanel = this._renderLeftPanel(),
            rightPanel = this._renderRightPanel(),
            objectDialogue = this.state.openObjectDialogue ? this._renderObjectDialogue() : '',
            printerSelectorWindow = this.state.openPrinterSelectorWindow ? this._renderPrinterSelectorWindow() : '',
            waitWindow = this.state.openWaitWindow ? this._renderWaitWindow() : '',
            progressWindow = this.state.progressMessage ? this._renderProgressWindow() : '',
            percentageBar = this._renderPercentageBar(),
            tourGuideSection = this.state.tutorialOn ? this._renderTourGuide() : '';

        return /*#__PURE__*/React.createElement("div", {
          className: "studio-container print-studio"
        }, importWindow, leftPanel, percentageBar, rightPanel, objectDialogue, printerSelectorWindow, advancedPanel, waitWindow, progressWindow, /*#__PURE__*/React.createElement("div", {
          id: "model-displayer",
          className: "model-displayer"
        }, /*#__PURE__*/React.createElement("div", {
          className: "import-indicator"
        })), /*#__PURE__*/React.createElement("input", {
          className: "hide",
          ref: "importBtn",
          type: "file",
          accept: ".stl,.fc,.gcode,.obj",
          onChange: this._handleImport,
          multiple: true
        }), tourGuideSection);
      }

    }

    ;
    return view;
  };
});