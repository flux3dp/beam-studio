function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/api/cloud'], function (CloudApi) {
  var _temp;

  const React = require('react');

  const Controls = props => {
    const _handleEntered = e => props.onEntered(props.id, e.target.value);

    const {
      label,
      errorMessage,
      errorOn,
      type
    } = props;
    return /*#__PURE__*/React.createElement("div", {
      className: "controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, label), /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("input", {
      type: type || 'text',
      onBlur: _handleEntered
    })), /*#__PURE__*/React.createElement("div", {
      className: "error"
    }, errorOn ? errorMessage : ' '));
  };

  return _temp = class changePassword extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_checkValue", (id, value) => {
        const lang = this.props.lang.settings.flux_cloud,
              f = {};

        f['currentPassword'] = () => {
          this.values['currentPassword'] = value;
          this.setState({
            emptyCurrentPassword: value === '',
            currentPasswordError: value === '' ? lang.empty_password_warning : ''
          });
        };

        f['newPassword'] = () => {
          this.values['newPassword'] = value;
          this.setState({
            emptyNewPassword: value === '',
            newPasswordError: value === '' ? lang.empty_password_warning : ''
          });
        };

        f['confirmPassword'] = () => {
          this.values['confirmPassword'] = value;
          this.setState({
            emptyConfirmPassword: value === '',
            confirmPasswordError: value === '' ? lang.empty_password_warning : ''
          });
        };

        if (typeof f[id] !== 'undefined') {
          f[id]();
        }

        ;

        if (this.values.newPassword !== '' && this.values.confirmPassword !== '') {
          const mismatch = this.values.newPassword !== this.values.confirmPassword;
          this.setState({
            confirmPasswordError: mismatch ? lang.error_password_not_match : ''
          });
        }
      });

      _defineProperty(this, "allValid", () => {
        const {
          currentPasswordError,
          newPasswordError,
          confirmPasswordError
        } = this.state;
        return currentPasswordError === '' && newPasswordError === '' && confirmPasswordError === '';
      });

      _defineProperty(this, "_handleCancel", () => {
        location.hash = '#/studio/cloud/bind-machine';
      });

      _defineProperty(this, "_handleChangePassword", async () => {
        if (!this.allValid()) {
          return;
        }

        let lang = this.props.lang.settings.flux_cloud;
        const info = {
          password: this.values.newPassword,
          oldPassword: this.values.currentPassword
        };
        const j = (await CloudApi.changePassword(info)).json();

        if (j.status === 'error') {
          this.setState({
            responseError: lang[j.message]
          });
        } else {
          location.hash = '#/studio/cloud/bind-machine';
        }
      });

      this.values = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.state = {
        currentPasswordError: '',
        newPasswordError: '',
        confirmPasswordError: '',
        passwordMismatch: false,
        emptyCurrentPassword: false,
        emptyNewPassword: false,
        emptyConfirmPassword: false
      };
    }

    async componentDidMount() {
      const resp = await CloudApi.getMe();

      if (!resp.ok) {
        location.hash = '#/studio/cloud';
      }
    }

    render() {
      const lang = this.props.lang.settings.flux_cloud;
      return /*#__PURE__*/React.createElement("div", {
        className: "cloud"
      }, /*#__PURE__*/React.createElement("div", {
        className: "change-password container"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("h3", null, lang.change_password.toUpperCase())), /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement(Controls, {
        id: "currentPassword",
        type: "password",
        label: lang.current_password,
        errorMessage: this.state.currentPasswordError,
        errorOn: this.state.currentPasswordError !== '',
        onEntered: this._checkValue
      })), /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement(Controls, {
        id: "newPassword",
        type: "password",
        label: lang.new_password,
        errorMessage: this.state.newPasswordError,
        errorOn: this.state.newPasswordError !== '',
        onEntered: this._checkValue
      })), /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement(Controls, {
        id: "confirmPassword",
        type: "password",
        label: lang.confirm_password,
        errorMessage: this.state.confirmPasswordError,
        errorOn: this.state.confirmPasswordError !== '',
        onEntered: this._checkValue
      }))), /*#__PURE__*/React.createElement("div", {
        className: "change-password footer"
      }, /*#__PURE__*/React.createElement("div", {
        className: "divider"
      }, /*#__PURE__*/React.createElement("span", {
        className: "error"
      }, this.state.responseError), /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
        className: "actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-cancel",
        onClick: this._handleCancel
      }, lang.cancel), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        onClick: this._handleChangePassword
      }, lang.submit))));
    }

  }, _temp;
});