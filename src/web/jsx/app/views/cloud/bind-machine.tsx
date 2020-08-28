function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'helpers/i18n', 'helpers/device-master', 'helpers/device-list', 'helpers/pad-string', 'plugins/classnames/index', 'helpers/api/cloud', 'app/actions/alert-actions', 'helpers/firmware-version-checker'], function ($, i18n, DeviceMaster, DeviceList, PadString, ClassNames, CloudApi, AlertActions, FirmwareVersionChecker) {
  var _temp;

  const React = require('react');

  return _temp = class BindMachine extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleSignout", async () => {
        await CloudApi.signOut();
        location.hash = '#studio/cloud/sign-in';
      });

      _defineProperty(this, "_handleSelectDevice", async device => {
        const allowCloud = await FirmwareVersionChecker.check(device, 'CLOUD');

        if (allowCloud) {
          this.setState({
            meetVersionRequirement: allowCloud,
            selectedDevice: device
          });
        } else {
          let lang = this.props.lang.settings.flux_cloud;
          AlertActions.showPopupError('error-vcredist', lang.not_supported_firmware);
        }
      });

      _defineProperty(this, "_handleCancel", () => {
        location.hash = '#/studio/print';
      });

      _defineProperty(this, "_handleCancelBinding", () => {
        this.setState({
          bindingInProgress: false
        });
      });

      _defineProperty(this, "_handleBind", async () => {
        this.setState({
          bindingInProgress: true
        });
        const status = await DeviceMaster.selectDevice(this.state.selectedDevice);

        if (status === 'TIMEOUT') {
          location.hash = '#/studio/cloud/bind-fail';
        } else {
          const waitForDevice = deferred => {
            deferred = deferred || $.Deferred();
            DeviceMaster.getDeviceInfo().then(response => {
              let result = response.cloud[1].join('_');

              if (response.cloud[0] === false && result === 'DISABLE') {
                setTimeout(() => {
                  waitForDevice(deferred);
                }, 2 * 1000);
              } else {
                let error = response.cloud[1];
                error.unshift('CLOUD');
                this.props.onError(error);
              }
            });
            return deferred.promise();
          };

          const response = await DeviceMaster.getDeviceInfo();
          let tried = 0;

          const bindDevice = async (uuid, token, accessId, signature) => {
            const r = await CloudApi.bindDevice(uuid, token, accessId, signature);

            if (r.ok) {
              this.setState({
                bindingInProgress: false
              });
              location.hash = '#/studio/cloud/bind-success';
            } else {
              if (tried > 2) {
                location.hash = '#/studio/cloud/bind-fail';
              } else {
                tried++; // try another time

                setTimeout(() => {
                  bindDevice(uuid, token, accessId, signature);
                }, 2 * 1000);
              }
            }
          };

          const processEnableCloudResult = cloudResult => {
            if (typeof cloudResult === 'undefined') {
              return;
            }

            if (cloudResult.status === 'ok') {
              waitForDevice().then(() => {
                getCloudValidationCodeAndBind();
              }).fail(error => {
                this.props.onError(error);
              });
            } else {
              location.hash = '#/studio/cloud/bind-fail';
            }
          };

          const getCloudValidationCodeAndBind = async uuid => {
            const r = await DeviceMaster.getCloudValidationCode();
            console.log('Got cloud validation code', r);
            let {
              token,
              signature
            } = r.code,
                accessId = r.code.access_id;
            signature = encodeURIComponent(signature);
            bindDevice(uuid, token, accessId, signature);
          };

          if (response.cloud[0] === true) {
            getCloudValidationCodeAndBind(response.uuid);
          } else {
            if (response.cloud[1].join('') === 'DISABLE') {
              const resp = await DeviceMaster.enableCloud();
              await processEnableCloudResult(resp);
            } else {
              let error = response.cloud[1];
              error.unshift('CLOUD');
              this.props.onError(error);
            }
          }
        }
      });

      _defineProperty(this, "_handleUnbind", uuid => {
        let lang = this.props.lang.settings.flux_cloud;
        console.log('unbind', uuid);

        const removeDevice = () => {
          let me = this.state.me;
          delete me.devices[uuid];
          this.setState({
            me
          });
        };

        if (confirm(lang.unbind_device)) {
          CloudApi.unbindDevice(uuid).then(r => {
            if (r.ok) {
              removeDevice(uuid);
            }
          });
        }
      });

      _defineProperty(this, "_renderBindingWindow", () => {
        let lang = this.props.lang.settings.flux_cloud,
            bindingWindow;
        bindingWindow = /*#__PURE__*/React.createElement("div", {
          className: "binding-window"
        }, /*#__PURE__*/React.createElement("h1", null, lang.binding), /*#__PURE__*/React.createElement("div", {
          className: "spinner-roller absolute-center"
        }), /*#__PURE__*/React.createElement("div", {
          className: "footer"
        }, /*#__PURE__*/React.createElement("a", {
          onClick: this._handleCancelBinding
        }, lang.cancel)));
        return this.state.bindingInProgress ? bindingWindow : '';
      });

      _defineProperty(this, "_renderBlind", () => {
        let blind = /*#__PURE__*/React.createElement("div", {
          className: "blind"
        });
        return this.state.bindingInProgress ? blind : '';
      });

      this.state = {
        selectedDevice: {},
        bindingInProgress: false,
        me: {}
      };
      this.lang = {};
    }

    UNSAFE_componentWillMount() {
      this.lang = i18n.get();
    }

    componentDidMount() {
      let getList = () => {
        let deviceList = DeviceList(DeviceMaster.getDeviceList());
        this.setState({
          deviceList
        });
      };

      getList();
      setInterval(() => {
        getList();
      }, 2000);
      CloudApi.getMe().then(response => {
        if (response.ok) {
          response.json().then(content => {
            this.setState({
              me: content
            });

            if (content.needPasswordReset) {
              location.hash = '#/studio/cloud/change-password';
            }
          });
        }
      });
    }

    render() {
      let lang = this.props.lang.settings.flux_cloud,
          deviceList,
          bindingWindow,
          blind;
      bindingWindow = this._renderBindingWindow();
      blind = this._renderBlind();

      if (!this.state.deviceList) {
        deviceList = /*#__PURE__*/React.createElement("div", null, this.lang.device.please_wait);
      } else {
        deviceList = this.state.deviceList.map(d => {
          let {
            me
          } = this.state,
              uuid = d.source === 'h2h' ? d.h2h_uuid : d.uuid,
              rowClass,
              linkedClass;

          const isLinked = () => {
            return Object.keys(me.devices || {}).indexOf(uuid) !== -1;
          };

          rowClass = ClassNames('device', {
            'selected': this.state.selectedDevice.name === d.name
          });
          linkedClass = ClassNames({
            'linked': isLinked()
          });
          return /*#__PURE__*/React.createElement("div", {
            className: rowClass,
            onClick: () => this._handleSelectDevice(d)
          }, /*#__PURE__*/React.createElement("div", {
            className: "name"
          }, d.name), /*#__PURE__*/React.createElement("div", {
            className: "status"
          }, this.lang.machine_status[d.st_id]), /*#__PURE__*/React.createElement("div", {
            className: linkedClass,
            onClick: this._handleUnbind.bind(null, uuid)
          }));
        });
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "cloud"
      }, /*#__PURE__*/React.createElement("div", {
        className: "container bind-machine"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("h3", null, lang.select_to_bind)), /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", {
        className: "select"
      }, deviceList), /*#__PURE__*/React.createElement("div", {
        className: "user-info"
      }, /*#__PURE__*/React.createElement("div", {
        className: "name"
      }, this.state.me.nickname), /*#__PURE__*/React.createElement("div", {
        className: "email"
      }, this.state.me.email), /*#__PURE__*/React.createElement("div", {
        className: "change-password-link"
      }, /*#__PURE__*/React.createElement("a", {
        href: "#/studio/cloud/change-password"
      }, lang.change_password), " / ", /*#__PURE__*/React.createElement("a", {
        href: "#/studio/cloud/bind-machine",
        onClick: this._handleSignout
      }, lang.sign_out))))), /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, /*#__PURE__*/React.createElement("div", {
        className: "divider"
      }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
        className: "actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-cancel",
        onClick: this._handleCancel
      }, lang.back), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        disabled: !this.state.meetVersionRequirement,
        onClick: this._handleBind
      }, lang.bind))), bindingWindow, blind);
    }

  }, _temp;
});