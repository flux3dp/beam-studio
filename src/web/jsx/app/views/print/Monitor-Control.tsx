function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'app/constants/global-constants', 'app/constants/device-constants', 'plugins/classnames/index'], (PropTypes, GlobalConstants, DeviceConstants, ClassNames) => {
  const React = require('react');

  'use strict';

  const findObjectContainsProperty = (infoArray = [], propertyName) => {
    return infoArray.filter(o => Object.keys(o).some(n => n === propertyName));
  };

  const type = {
    FILE: 'FILE',
    FOLDER: 'FOLDER'
  };

  class MonitorControl extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_operation", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        let {
          lang
        } = this.props.context;
        let cameraClass = ClassNames('btn-camera btn-control', {
          'on': Monitor.mode === GlobalConstants.CAMERA
        }),
            cameraDescriptionClass = ClassNames('description', {
          'on': Monitor.mode === GlobalConstants.CAMERA
        }),
            className;
        return {
          go: enable => {
            className = ClassNames('controls center', {
              'disabled': !enable
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className,
              onClick: this.props.onGo
            }, /*#__PURE__*/React.createElement("div", {
              className: "btn-go btn-control"
            }), /*#__PURE__*/React.createElement("div", {
              className: "description"
            }, lang.monitor.go));
          },
          pause: enable => {
            className = ClassNames('controls center', {
              'disabled': !enable
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className,
              onClick: this.props.onPause
            }, /*#__PURE__*/React.createElement("div", {
              className: "btn-pause btn-control"
            }), /*#__PURE__*/React.createElement("div", {
              className: "description"
            }, lang.monitor.pause));
          },
          stop: enable => {
            className = ClassNames('controls left', {
              'disabled': !enable
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className,
              onClick: this.props.onStop
            }, /*#__PURE__*/React.createElement("div", {
              className: "btn-stop btn-control"
            }), /*#__PURE__*/React.createElement("div", {
              className: "description"
            }, lang.monitor.stop));
          },
          upload: enable => {
            className = ClassNames('controls left', {
              'disabled': !enable
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className,
              onClick: this.props.onUpload
            }, /*#__PURE__*/React.createElement("div", {
              className: "btn-upload btn-control"
            }), /*#__PURE__*/React.createElement("input", {
              className: "upload-control",
              type: "file",
              accept: ".fc, .gcode",
              onChange: this.props.onUpload
            }), /*#__PURE__*/React.createElement("div", {
              className: "description"
            }, lang.monitor.upload));
          },
          download: enable => {
            className = ClassNames('controls center', {
              'disabled': !enable
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className,
              onClick: this.props.onDownload
            }, /*#__PURE__*/React.createElement("div", {
              className: "btn-download btn-control"
            }), /*#__PURE__*/React.createElement("div", {
              className: "description"
            }, lang.monitor.download));
          },
          camera: enable => {
            className = ClassNames('controls right', {
              'disabled': !enable
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className,
              onClick: this.props.onToggleCamera
            }, /*#__PURE__*/React.createElement("div", {
              className: cameraClass
            }), /*#__PURE__*/React.createElement("div", {
              className: cameraDescriptionClass
            }, lang.monitor.camera));
          },
          preparing: enable => {
            className = ClassNames('controls center', {
              'disabled': true
            });
            return /*#__PURE__*/React.createElement("div", {
              className: className
            }, /*#__PURE__*/React.createElement("div", {
              className: "btn-pause btn-control"
            }), /*#__PURE__*/React.createElement("div", {
              className: "description"
            }, lang.monitor.pause));
          }
        };
      });

      _defineProperty(this, "_renderRelocateButton", () => {
        const {
          lang
        } = this.props.context;
        const {
          Monitor
        } = this.props.context.store.getState();
        const {
          isMaintainMoving
        } = Monitor;
        const className = ClassNames('controls right', {
          'disabled': isMaintainMoving
        });
        return /*#__PURE__*/React.createElement("div", {
          className: className,
          onClick: this.props.onRelocate
        }, /*#__PURE__*/React.createElement("div", {
          className: "btn-control btn-relocate"
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/beambox/icon-target.svg"
        })), /*#__PURE__*/React.createElement("div", {
          className: "description"
        }, lang.monitor.relocate));
      });

      _defineProperty(this, "_renderCancelButton", () => {
        const {
          lang
        } = this.props.context;
        const className = ClassNames('controls left');
        return /*#__PURE__*/React.createElement("div", {
          className: className,
          onClick: this.props.onCancelRelocate
        }, /*#__PURE__*/React.createElement("div", {
          className: "btn-control btn-cancel"
        }), /*#__PURE__*/React.createElement("div", {
          className: "description"
        }, lang.monitor.cancel));
      });

      _defineProperty(this, "_isAbortedOrCompleted", statusId => {
        let {
          Device
        } = this.props.context.store.getState();
        statusId = statusId || Device.status.st_id;
        return statusId === DeviceConstants.status.ABORTED || statusId === DeviceConstants.status.COMPLETED;
      });

      _defineProperty(this, "_getJobType", () => {
        let {
          lang
        } = this.props.context,
            jobInfo,
            o;
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        jobInfo = Monitor.mode === GlobalConstants.FILE_PREVIEW ? Monitor.selectedFileInfo : Device.jobInfo;
        o = findObjectContainsProperty(jobInfo, 'HEAD_TYPE'); // this should be updated when slicer returns the same info as play info

        if (jobInfo.length === 0 && this.props.previewUrl) {
          return lang.monitor.task['EXTRUDER'];
        }

        return o.length > 0 ? lang.monitor.task[o[0].HEAD_TYPE.toUpperCase()] : '';
      });

      _defineProperty(this, "_renderButtons", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        let {
          selectedItem
        } = Monitor;
        let commands, action, statusId, currentStatus;
        let leftButtonOn = false,
            middleButtonOn = false,
            rightButtonOn = true;
        statusId = Device.status.st_id;
        currentStatus = Device.status.st_label;
        commands = {
          'IDLE': () => {
            return this._operation().go;
          },
          'RUNNING': () => {
            return this._operation().pause;
          },
          'STARTING': () => {
            return this._operation().preparing;
          },
          'INIT': () => {
            return this._operation().preparing;
          },
          'WAITING_HEAD': () => {
            return this._operation().preparing;
          },
          'CORRECTING': () => {
            return this._operation().preparing;
          },
          'PAUSING': () => {
            return this._operation().go;
          },
          'PAUSED': () => {
            return this._operation().go;
          },
          'ABORTED': () => {
            return this._operation().go;
          },
          'HEATING': () => {
            return this._operation().preparing;
          },
          'CALIBRATING': () => {
            return this._operation().preparing;
          },
          'RESUMING': () => {
            return this._operation().pause;
          },
          'COMPLETED': () => {
            return this._operation().go;
          }
        };
        action = !!commands[currentStatus] ? commands[currentStatus]() : ''; // CAMERA mode

        if (Monitor.mode === GlobalConstants.CAMERA) {
          if (statusId === DeviceConstants.status.MAINTAIN || this._getJobType() === '') {
            middleButtonOn = false;
          } else {
            middleButtonOn = true;
          }

          if (statusId === DeviceConstants.status.IDLE || statusId === DeviceConstants.status.COMPLETED || statusId === DeviceConstants.status.ABORTED) {
            leftButtonOn = false;

            if (this.props.source === 'DEVICE_LIST') {
              middleButtonOn = false;
            }
          } else {
            leftButtonOn = true;
          }
        } // FILE mode
        else if (Monitor.mode === GlobalConstants.FILE) {
            leftButtonOn = Monitor.currentPath !== '';
            middleButtonOn = selectedItem.type === type.FILE;
          } // PRINT mode
          else if (Monitor.mode === GlobalConstants.PRINT) {
              leftButtonOn = true;

              if (currentStatus === DeviceConstants.IDLE || currentStatus === DeviceConstants.STARTING || currentStatus === DeviceConstants.RESUMING || statusId === DeviceConstants.status.PAUSING_FROM_RUNNING || statusId === DeviceConstants.status.MAINTAIN || statusId === DeviceConstants.status.SCAN || this._getJobType() === '' || this._isAbortedOrCompleted()) {
                middleButtonOn = false;
                leftButtonOn = false;
              } else {
                middleButtonOn = true;
              }

              if (this.props.source === GlobalConstants.DEVICE_LIST && statusId === DeviceConstants.status.IDLE) {
                leftButtonOn = false;
                middleButtonOn = false;
              }

              if (statusId === DeviceConstants.status.INIT) {
                leftButtonOn = false;
              }
            } // PREVIEW mode
            else if (Monitor.mode === GlobalConstants.PREVIEW) {
                middleButtonOn = true;

                if (statusId === DeviceConstants.status.IDLE || statusId === DeviceConstants.status.COMPLETED || statusId === DeviceConstants.status.ABORTED) {
                  leftButtonOn = false;
                }

                if (statusId === DeviceConstants.status.MAINTAIN || statusId === DeviceConstants.status.SCAN || this._isAbortedOrCompleted(statusId)) {
                  middleButtonOn = false;
                } else {
                  middleButtonOn = true;
                }
              } // FILE PREVIEW mode
              else if (Monitor.mode === GlobalConstants.FILE_PREVIEW) {
                  leftButtonOn = true;
                  middleButtonOn = true;

                  if (currentStatus === DeviceConstants.IDLE) {
                    leftButtonOn = false;
                  }
                }

        if (Object.keys(Device.status).length === 0) {
          leftButtonOn = false;
          middleButtonOn = false;
        }

        let leftButton = Monitor.mode === GlobalConstants.FILE ? this._operation().upload : this._operation().stop,
            middleButton = Monitor.mode === GlobalConstants.FILE ? this._operation().download : action,
            rightButton = this._operation().camera;

        if (Monitor.mode !== GlobalConstants.CAMERA_RELOCATE) {
          if (leftButton !== '') {
            leftButton = leftButton(leftButtonOn);
          }

          if (middleButton !== '') {
            middleButton = middleButton(middleButtonOn);
          }

          if (rightButton !== '') {
            rightButton = rightButton(rightButtonOn);
          }
        } else {
          leftButton = this._renderCancelButton();
          middleButton = null;
          rightButton = this._renderRelocateButton();
        }

        return {
          leftButton,
          middleButton,
          rightButton
        };
      });

      let {
        store
      } = this.props.context;
      this.unsubscribe = store.subscribe(() => {
        this.forceUpdate();
      });
    }

    UNSAFE_componentWillUpdate() {
      return false;
    }

    componentWillUnmount() {
      this.unsubscribe();
    }

    render() {
      let {
        leftButton,
        middleButton,
        rightButton
      } = this._renderButtons();

      return /*#__PURE__*/React.createElement("div", {
        className: "operation"
      }, leftButton, middleButton, rightButton);
    }

  }

  ;
  return MonitorControl;
});