function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'app/actions/beambox/beambox-preference', 'app/constants/keycode-constants', 'helpers/api/discover', 'helpers/device-list', 'helpers/device-master', 'helpers/i18n', 'helpers/websocket'], function (Modal, BeamboxPreference, keyCodeConstants, Discover, DeviceList, DeviceMaster, i18n, Websocket) {
  'use strict';

  const React = require('react');

  const classNames = require('classnames');

  const lang = i18n.lang.initialize;
  const TIMEOUT = 20;
  const ipRex = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/;
  return function () {
    var _temp;

    return _temp = class ConnectMachine extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "checkRpiIp", async () => {
          const dns = require('dns');

          const dnsPromise = dns.promises;

          try {
            const lookupOptions = {
              all: true
            };
            const res = await dnsPromise.lookup('raspberrypi.local', lookupOptions);
            res.forEach(ipAddress => {
              if (ipAddress.family === 4) {
                this.setState({
                  rpiIp: ipAddress.address
                });
              }
            });
          } catch (e) {
            if (e.toString().includes('ENOTFOUND')) {
              console.log('DNS server not found raspberrypi.local');
            } else {
              console.log(`Error when dns looking up raspberrypi:\n${e}`);
            }
          }
        });

        _defineProperty(this, "testCamera", async () => {
          const {
            device
          } = this.state;

          try {
            await DeviceMaster.select(device);
            await DeviceMaster.connectCamera(device);
            const imgBlob = await DeviceMaster.takeOnePicture();
            await DeviceMaster.disconnectCamera(device);

            if (imgBlob.size >= 30) {
              this.setState({
                cameraAvailability: true,
                isTesting: false,
                hadTested: true
              });
            } else {
              throw 'Blob size too small, something wrong with camera';
            }
          } catch (e) {
            console.log(e);
            this.setState({
              cameraAvailability: false,
              isTesting: false,
              hadTested: true
            });
          }
        });

        _defineProperty(this, "renderContent", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "connection-machine-ip"
          }, /*#__PURE__*/React.createElement("div", {
            className: "image-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: classNames('hint-circle', 'ip', {
              wired: this.isWired
            })
          }), /*#__PURE__*/React.createElement("img", {
            className: "touch-panel-icon",
            src: this.isWired ? "img/init-panel/network-panel-wired.png" : "img/init-panel/network-panel-wireless.png",
            draggable: "false"
          })), /*#__PURE__*/React.createElement("div", {
            className: "text-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "title"
          }, lang.connect_machine_ip.enter_ip), /*#__PURE__*/React.createElement("div", {
            className: "contents tutorial"
          }, /*#__PURE__*/React.createElement("input", {
            ref: "ipInput",
            className: "ip-input",
            placeholder: "192.168.0.1",
            type: "text",
            onKeyDown: e => this.handleKeyDown(e),
            defaultValue: this.state.rpiIp
          }), this.renderTestInfos())));
        });

        _defineProperty(this, "renderTestInfos", () => {
          const {
            machineIp,
            isIPValid,
            ipAvailability,
            firmwareVersion,
            cameraAvailability,
            ipTestCountDown
          } = this.state;

          if (machineIp !== null) {
            let ipStatus = `${ipTestCountDown}s`;
            let cameraStatus = '';

            if (ipAvailability !== null) {
              ipStatus = ipAvailability ? 'OK' : 'Fail';
            }

            if (!isIPValid) {
              ipStatus = 'Invalid IP';
            }

            if (cameraAvailability !== null) {
              cameraStatus = cameraAvailability ? 'OK' : 'Fail';
            }

            return /*#__PURE__*/React.createElement("div", {
              className: "test-infos"
            }, /*#__PURE__*/React.createElement("div", {
              className: "test-info"
            }, `${lang.connect_machine_ip.check_ip}... ${ipStatus}`), ipAvailability ? /*#__PURE__*/React.createElement("div", {
              className: "test-info"
            }, `${lang.connect_machine_ip.check_firmware}... ${firmwareVersion}`) : null, ipAvailability ? /*#__PURE__*/React.createElement("div", {
              className: "test-info"
            }, `${lang.connect_machine_ip.check_camera}... ${cameraStatus}`) : null);
          } else {
            return /*#__PURE__*/React.createElement("div", {
              className: "test-infos"
            });
          }
        });

        _defineProperty(this, "handleKeyDown", e => {
          if (e.keyCode === keyCodeConstants.KEY_RETURN) {
            this.startTesting();
          }
        });

        _defineProperty(this, "startTesting", () => {
          const ip = this.refs.ipInput.value;
          const isIPValid = ipRex.test(ip);

          if (!isIPValid) {
            this.setState({
              machineIp: ip,
              isIPValid
            });
            return;
          }

          this.setState({
            machineIp: ip,
            isIPValid,
            ipAvailability: null,
            firmwareVersion: null,
            cameraAvailability: null,
            device: null,
            isTesting: true,
            hadTested: false,
            ipTestCountDown: TIMEOUT
          });
          this.discover.poke(ip);
          clearInterval(this.testCountDown);
          this.testCountDown = setInterval(() => {
            if (this.state.isTesting && this.state.ipAvailability === null) {
              if (this.state.ipTestCountDown > 1) {
                this.setState({
                  ipTestCountDown: this.state.ipTestCountDown - 1
                });
              } else {
                this.setState({
                  ipAvailability: false,
                  isTesting: false,
                  hadTested: true
                });
                clearInterval(this.testCountDown);
              }
            }
          }, 1000);
        });

        _defineProperty(this, "onFinish", () => {
          const {
            device,
            machineIp
          } = this.state;
          const modelMap = {
            fbm1: 'fbm1',
            fbb1b: 'fbb1b',
            fbb1p: 'fbb1p'
          };
          const model = modelMap[device.model] || 'fbb1b';
          BeamboxPreference.write('model', model);
          BeamboxPreference.write('workarea', model);
          let pokeIPs = localStorage.getItem('poke-ip-addr');
          pokeIPs = pokeIPs ? pokeIPs.split(/[,;] ?/) : [];

          if (!pokeIPs.includes(machineIp)) {
            if (pokeIPs.length > 19) {
              pokeIPs = pokeIPs.slice(pokeIPs.length - 19, pokeIPs.length);
            }

            pokeIPs.push(machineIp);
            localStorage.setItem('poke-ip-addr', pokeIPs.join(','));
          }

          if (!localStorage.getItem('printer-is-ready')) {
            localStorage.setItem('new-user', true);
          }

          localStorage.setItem('printer-is-ready', true);
          location.hash = '#studio/beambox';
          location.reload();
        });

        _defineProperty(this, "renderNextButton", () => {
          const {
            isTesting,
            hadTested,
            ipAvailability,
            cameraAvailability,
            device
          } = this.state;
          let onClick, label;
          let className = classNames('btn-page', 'next', 'primary');

          if (!isTesting && !hadTested) {
            label = lang.next;
            onClick = this.startTesting;
          } else if (isTesting) {
            label = lang.next;

            onClick = () => {};

            className = classNames('btn-page', 'next', 'primary', 'disabled');
          } else if (hadTested) {
            if (ipAvailability) {
              label = lang.connect_machine_ip.finish_setting;
              onClick = this.onFinish;
            } else {
              label = lang.retry;
              onClick = this.startTesting;
            }
          }

          return /*#__PURE__*/React.createElement("div", {
            className: className,
            onClick: () => {
              onClick();
            }
          }, label);
        });

        _defineProperty(this, "renderButtons", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "btn-page-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "btn-page",
            onClick: () => {
              history.back();
            }
          }, lang.back), this.renderNextButton());
        });

        this.state = {
          rpiIp: null,
          machineIp: null,
          ipAvailability: null,
          firmwareVersion: null,
          cameraAvailability: null,
          device: null,
          ipTestCountDown: TIMEOUT,
          isTesting: false,
          hadTested: false
        };
        const queryString = location.hash.split('?')[1] || '';
        const urlParams = new URLSearchParams(queryString);
        this.isWired = urlParams.get('wired') === '1';
        this.discover = Discover('connect-machine-ip', machines => {
          const deviceList = DeviceList(machines);
          const {
            ipAvailability,
            machineIp
          } = this.state;

          if (ipAvailability === null && machineIp !== null) {
            for (let i = 0; i < deviceList.length; i++) {
              let device = deviceList[i];

              if (device.ipaddr === machineIp) {
                clearInterval(this.testCountDown);
                this.setState({
                  ipAvailability: true,
                  firmwareVersion: device.version,
                  device: device
                });
              }
            }
          }
        });
      }

      componentDidMount() {
        this.checkRpiIp();
      }

      componentDidUpdate() {
        const {
          ipAvailability,
          cameraAvailability
        } = this.state;

        if (ipAvailability && cameraAvailability === null) {
          this.testCamera();
        }
      }

      componentWillUnmount() {
        this.discover.removeListener('connect-machine-ip');
      }

      render() {
        const wrapperClassName = {
          'initialization': true
        };
        const innerContent = this.renderContent();
        const content = /*#__PURE__*/React.createElement("div", {
          className: "connect-machine"
        }, /*#__PURE__*/React.createElement("div", {
          className: "top-bar"
        }), this.renderButtons(), innerContent);
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});