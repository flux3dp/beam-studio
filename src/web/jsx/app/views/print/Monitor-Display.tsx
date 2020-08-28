function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'app/action-creators/monitor', 'app/constants/global-constants', 'app/constants/device-constants', 'helpers/device-master', 'helpers/duration-formatter', 'plugins/classnames/index', 'jsx!app/widgets/Raw-Move-Panel', 'helpers/version-checker'], (PropTypes, MonitorActionCreator, GlobalConstants, DeviceConstants, DeviceMaster, FormatDuration, ClassNames, RawMovePanel, VersionChecker) => {
  const React = require('react');

  'use strict';

  const defaultImage = 'img/ph_l.png';
  const maxFileNameLength = 12;
  let selectedItem = '',
      previewUrl = defaultImage,
      previewBlob = null,
      hdChecked = {};

  const findObjectContainsProperty = (infoArray = [], propertyName) => {
    return infoArray.filter(o => Object.keys(o).some(n => n === propertyName));
  };

  const getImageSize = (url, onSize) => {
    var img = new Image();

    img.onload = () => {
      onSize([img.naturalWidth, img.naturalHeight]);
    };

    img.src = url;
  };

  class MonitorDisplay extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_getPreviewUrl", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();

        const setUrl = info => {
          let blobIndex = info.findIndex(o => o instanceof Blob);
          previewUrl = blobIndex > 0 ? window.URL.createObjectURL(info[blobIndex]) : defaultImage;
        };

        if (previewUrl === defaultImage || !previewUrl) {
          if (Monitor.mode === GlobalConstants.FILE_PREVIEW) {
            setUrl(Monitor.selectedFileInfo);
          } else if (Device.jobInfo.length > 0) {
            setUrl(Device.jobInfo);
          } else {
            previewUrl = this.props.previewUrl;
          }
        }

        if (!previewUrl) {
          return '';
        }

        return `url(${previewUrl})`;
      });

      _defineProperty(this, "_showPreview", () => {
        let divStyle = {
          borderRadius: '2px',
          backgroundColor: '#F0F0F0',
          backgroundImage: this._getPreviewUrl(),
          backgroundSize: '100% auto',
          backgroundPosition: '50% 50%',
          backgroundRepeatY: 'no-repeat',
          width: '100%',
          height: '100%'
        };
        return /*#__PURE__*/React.createElement("div", {
          style: divStyle
        });
      });

      _defineProperty(this, "_imageError", src => {
        src.target.src = 'img/ph_s.png';
      });

      _defineProperty(this, "_listFolderContent", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        let {
          files,
          directories
        } = Monitor.currentFolderContent;
        previewUrl = defaultImage; // reset preview image

        if (!directories || !files) {
          return;
        } // console.log(directories);


        let _folders = directories.map(folder => {
          let folderNameClass = ClassNames('name', {
            'selected': Monitor.selectedItem.name === folder
          });
          return /*#__PURE__*/React.createElement("div", {
            className: "folder",
            "data-foldername": folder,
            onClick: this.props.onFolderClick,
            onDoubleClick: this.props.onFolderDoubleClick
          }, /*#__PURE__*/React.createElement("div", {
            className: folderNameClass
          }, folder));
        });

        let _files = files.map((item, i) => {
          if (!item[0]) {
            item = [result.files[i]];
          }

          let imgSrc = item[2] instanceof Blob ? URL.createObjectURL(item[2]) : 'img/ph_s.png';
          let selected = Monitor.selectedItem.name === item[0],
              fileNameClass = ClassNames('name', {
            'selected': selected
          }),
              iNameClass = ClassNames('fa', 'fa-times-circle-o', {
            'selected': selected
          });
          return /*#__PURE__*/React.createElement("div", {
            title: item[0],
            className: "file",
            "data-test-key": item[0],
            "data-filename": item[0],
            onClick: this.props.onFileClick,
            onDoubleClick: this.props.onFileDoubleClick
          }, /*#__PURE__*/React.createElement("div", {
            className: "image-wrapper"
          }, /*#__PURE__*/React.createElement("img", {
            src: imgSrc,
            onError: this._imageError
          }), /*#__PURE__*/React.createElement("i", {
            className: iNameClass,
            onClick: this.props.onFileCrossIconClick
          })), /*#__PURE__*/React.createElement("div", {
            className: fileNameClass
          }, item[0].length > maxFileNameLength ? item[0].substring(0, maxFileNameLength) + '...' : item[0]));
        });

        return /*#__PURE__*/React.createElement("div", {
          className: "wrapper"
        }, _folders, _files);
      });

      _defineProperty(this, "_retrieveFileInfo", () => {});

      _defineProperty(this, "_streamCamera", () => {
        if (!this.cameraStream) {
          let {
            selectedDevice
          } = this.props;
          DeviceMaster.streamCamera(selectedDevice).then(stream => {
            this.cameraStream = stream;
            this.cameraStream.subscribe(this._processImage);
          });
        }

        let cameraClass = ClassNames('camera-image', {
          'hd': this.state.isHd
        }, {
          'beambox-camera': ['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'laser-b1', 'darwin-dev'].includes(this.props.selectedDevice.model)
        });
        return /*#__PURE__*/React.createElement("img", {
          className: cameraClass
        });
      });

      _defineProperty(this, "_renderOriginMark", () => {
        const {
          Monitor
        } = this.props.context.store.getState();
        const {
          cameraOffset,
          currentPosition
        } = Monitor;
        const cameraStreamImg = this.refs.cameraStreamImg;

        if (!cameraStreamImg || !cameraOffset) {
          return;
        }

        const x = currentPosition.x + cameraOffset.x;
        const y = currentPosition.y + cameraOffset.y;
        const imageScale = cameraStreamImg.width / cameraStreamImg.naturalWidth;
        let dx = x * 10 * imageScale / cameraOffset.scaleRatioX;
        let dy = y * 10 * imageScale / cameraOffset.scaleRatioY;

        if (dx > 100) {
          // compensation when x is too large, calculated by regression
          let compensationX = (dx - 100) / 100 ^ 2 + 3.9 * ((dx - 100) / 100) + 0.95;
          dx -= compensationX;
        }

        const centerX = cameraStreamImg.width / 2 - dx;
        const centerY = cameraStreamImg.height / 2 - dy;

        if (centerX < 0 || centerY < 0) {
          return null;
        }

        return /*#__PURE__*/React.createElement("div", {
          className: "origin-mark-wrapper",
          style: {
            left: centerX,
            top: centerY
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "bars bar1 shadow"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bars bar2 shadow"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bars bar1"
        }));
      });

      _defineProperty(this, "_renderRelocateOrigin", () => {
        const {
          Monitor
        } = this.props.context.store.getState();
        const {
          cameraOffset,
          currentPosition
        } = Monitor;
        const cameraStreamImg = this.refs.cameraStreamImg;

        if (!cameraStreamImg || !cameraOffset) {
          return;
        }

        const imageScale = cameraStreamImg.width / cameraStreamImg.naturalWidth;
        const dx = cameraOffset.x * 10 * imageScale / cameraOffset.scaleRatioX;
        const dy = cameraOffset.y * 10 * imageScale / cameraOffset.scaleRatioY;
        const centerX = cameraStreamImg.width / 2 - dx;
        const centerY = cameraStreamImg.height / 2 - dy;
        return /*#__PURE__*/React.createElement("div", {
          className: "relocate-origin-mark-wrapper",
          style: {
            left: centerX,
            top: centerY
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "bars bar1 shadow"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bars bar2 shadow"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bars bar1"
        }), /*#__PURE__*/React.createElement("div", {
          className: "relocate-origin"
        }, `${currentPosition.x}, ${currentPosition.y}`));
      });

      _defineProperty(this, "_handleMoveStart", () => {
        const {
          store
        } = this.props.context;
        store.dispatch(MonitorActionCreator.setMaintainMoving());
      });

      _defineProperty(this, "_handleMoveEnd", (x, y) => {
        x = Math.round(x * 10) / 10;
        y = Math.round(y * 10) / 10;
        const {
          store
        } = this.props.context;
        const currentPosition = {
          x,
          y
        };
        store.dispatch(MonitorActionCreator.setCurrentPosition(currentPosition));
      });

      _defineProperty(this, "_streamCameraRelocate", () => {
        if (!this.cameraStream) {
          let {
            selectedDevice
          } = this.props;
          DeviceMaster.streamCamera(selectedDevice, false).then(stream => {
            this.cameraStream = stream;
            this.cameraStream.subscribe(this._processImage);
          });
        }

        let cameraClass = ClassNames('camera-image', {
          'hd': this.state.isHd
        }, {
          'beambox-camera': ['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'laser-b1', 'darwin-dev'].includes(this.props.selectedDevice.model)
        });
        return /*#__PURE__*/React.createElement("div", {
          className: "camera-relocate-container"
        }, /*#__PURE__*/React.createElement("div", {
          className: "img-container"
        }, /*#__PURE__*/React.createElement("img", {
          className: cameraClass,
          ref: "cameraStreamImg"
        })), this._renderOriginMark(), this._renderRelocateOrigin(), /*#__PURE__*/React.createElement(RawMovePanel, {
          onMoveStart: this._handleMoveStart,
          onMoveEnd: this._handleMoveEnd
        }));
      });

      _defineProperty(this, "_processImage", imageBlob => {
        let targetDevice = this.props.selectedDevice;

        if (targetDevice) {
          if (!hdChecked[targetDevice.serial]) {
            getImageSize(URL.createObjectURL(imageBlob), size => {
              console.log('image size', size);

              if (size[0] > 720) {
                hdChecked[targetDevice.serial] = 2;
              } else if (size[0] > 0) {
                hdChecked[targetDevice.serial] = 1;
              }
            });
          }

          this.setState({
            isHd: hdChecked[targetDevice.serial] !== 1
          });
        }

        previewBlob = imageBlob;
        $('.camera-image').attr('src', URL.createObjectURL(imageBlob));
      });

      _defineProperty(this, "_getJobType", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        let {
          lang
        } = this.props.context,
            jobInfo,
            headProp,
            taskProp;
        jobInfo = Monitor.mode === GlobalConstants.FILE_PREVIEW ? Monitor.selectedFileInfo : Device.jobInfo;
        headProp = findObjectContainsProperty(jobInfo, 'HEAD_TYPE');
        taskProp = findObjectContainsProperty(jobInfo, 'TASK_TYPE');

        if (headProp.length === 0) {
          // From Bottom Right Start Button
          let operatingFunction = location.hash.split('/')[1];
          return lang.monitor.task[operatingFunction.toUpperCase()];
        } else if (taskProp.length > 0) {
          // Selected Task in File Browser
          return lang.monitor.task[taskProp[0].TASK_TYPE.toUpperCase()];
        }

        return lang.monitor.task[headProp[0].HEAD_TYPE.toUpperCase()];
      });

      _defineProperty(this, "_getJobTime", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        let jobInfo, o;
        jobInfo = Monitor.mode === GlobalConstants.FILE_PREVIEW ? Monitor.selectedFileInfo : Device.jobInfo;
        o = findObjectContainsProperty(jobInfo, 'TIME_COST');
        return o.length > 0 ? o[0].TIME_COST : '';
      });

      _defineProperty(this, "_getJobProgress", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();

        if (Monitor.mode === GlobalConstants.FILE_PREVIEW || this._isAbortedOrCompleted()) {
          return '';
        }

        return Device.status.prog ? `${parseInt(Device.status.prog * 100)}%` : '';
      });

      _defineProperty(this, "_isAbortedOrCompleted", () => {
        let {
          Device
        } = this.props.context.store.getState();
        return Device.status.st_id === DeviceConstants.status.ABORTED || Device.status.st_id === DeviceConstants.status.COMPLETED;
      });

      _defineProperty(this, "_renderDisplay", mode => {
        if (mode !== GlobalConstants.CAMERA && mode !== GlobalConstants.CAMERA_RELOCATE) {
          this.cameraStream = null;
        }

        let doMode = {};
        doMode[GlobalConstants.PREVIEW] = this._showPreview;
        doMode[GlobalConstants.PRINT] = this._showPreview;
        doMode[GlobalConstants.FILE] = this._listFolderContent;
        doMode[GlobalConstants.CAMERA] = this._streamCamera;
        doMode[GlobalConstants.CAMERA_RELOCATE] = this._streamCameraRelocate;
        doMode[GlobalConstants.FILE_PREVIEW] = this._showPreview;

        if (typeof doMode[mode] !== 'function') {
          return /*#__PURE__*/React.createElement("div", null);
        }

        return doMode[mode]();
      });

      _defineProperty(this, "_renderRelocateButton", Monitor => {
        const {
          selectedDevice
        } = this.props;
        const {
          mode,
          relocateOrigin
        } = Monitor;
        const vc = VersionChecker(selectedDevice.version);

        if ([GlobalConstants.PREVIEW, GlobalConstants.FILE_PREVIEW].includes(mode) && !this._isAbortedOrCompleted() && vc.meetRequirement('RELOCATE_ORIGIN')) {
          return /*#__PURE__*/React.createElement("div", {
            className: "btn-relocate-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "btn-relocate",
            onClick: () => this.props.onToggleRelocate()
          }, /*#__PURE__*/React.createElement("img", {
            src: "img/beambox/icon-target.svg"
          }), relocateOrigin.x !== 0 || relocateOrigin.y !== 0 ? /*#__PURE__*/React.createElement("div", {
            className: "relocate-origin"
          }, `(${relocateOrigin.x}, ${relocateOrigin.y})`) : null));
        } else {
          return null;
        }
      });

      _defineProperty(this, "_renderJobInfo", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();
        const {
          selectedDevice
        } = this.props;

        if ([GlobalConstants.FILE, GlobalConstants.CAMERA, GlobalConstants.CAMERA_RELOCATE].includes(Monitor.mode)) {
          return '';
        }

        let {
          slicingResult
        } = this.props.context,
            jobTime = FormatDuration(this._getJobTime()) || '',
            jobProgress = this._getJobProgress(),
            jobType = this._getJobType(),
            infoClass;

        infoClass = ClassNames('status-info', {
          'running': Monitor.mode === GlobalConstants.PRINT || (Monitor.mode === GlobalConstants.PREVIEW || jobTime !== '') && jobType !== ''
        }, {
          'hide': (Monitor.mode === GlobalConstants.CAMERA || this._isAbortedOrCompleted()) && Monitor.selectedItem.name === ''
        }); // if job is not active, render from slicing result

        if (jobTime === '' && slicingResult) {
          let time = slicingResult.time || slicingResult.metadata.TIME_COST;
          jobTime = FormatDuration(time);
        }

        const relocateButton = this._renderRelocateButton(Monitor);

        return /*#__PURE__*/React.createElement("div", {
          className: infoClass
        }, /*#__PURE__*/React.createElement("div", {
          className: "verticle-align"
        }, /*#__PURE__*/React.createElement("div", null, jobType), /*#__PURE__*/React.createElement("div", {
          className: "status-info-duration"
        }, jobTime)), relocateButton, /*#__PURE__*/React.createElement("div", {
          className: "status-info-progress"
        }, jobProgress));
      });

      _defineProperty(this, "_handleSnapshot", () => {
        if (previewBlob == null) return;
        let targetDevice = DeviceMaster.getSelectedDevice(),
            fileName = (targetDevice ? targetDevice.name + ' ' : '') + new Date().toLocaleString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/(\d+)\/(\d+)\/(\d+)\, (\d+):(\d+):(\d+)/, '$3-$1-$2 $4-$5-$6') + ".jpg";
        saveAs(previewBlob, fileName);
      });

      _defineProperty(this, "_renderSpinner", () => {
        return /*#__PURE__*/React.createElement("div", {
          className: "spinner-wrapper"
        }, /*#__PURE__*/React.createElement("div", {
          className: "spinner-flip"
        }));
      });

      const {
        store: _store
      } = this.props.context;
      this.unsubscribe = _store.subscribe(() => {
        this.forceUpdate();
      });
      this.state = {
        isHd: false
      };
    }

    UNSAFE_componentWillUpdate() {
      return false;
    }

    componentWillUnmount() {
      previewUrl = '';
      this.unsubscribe();
    }

    render() {
      let {
        Monitor
      } = this.props.context.store.getState();

      let content = this._renderDisplay(Monitor.mode),
          jobInfo = this._renderJobInfo(),
          specialBtn = Monitor.mode == GlobalConstants.CAMERA ? /*#__PURE__*/React.createElement("div", {
        className: "btn-snap",
        onClick: this._handleSnapshot
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa fa-camera"
      })) : "";

      if (Monitor.isWaiting) {
        content = this._renderSpinner();
        jobInfo = '';
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "device-content"
      }, specialBtn, content, jobInfo));
    }

  }

  ;
  return MonitorDisplay;
});