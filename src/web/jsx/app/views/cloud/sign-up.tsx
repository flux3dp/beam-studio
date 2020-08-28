function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'helpers/api/cloud'], function (i18n, CloudApi) {
  var _temp;

  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;

  const Controls = ({
    id,
    value,
    label,
    errorOn,
    errorMessage,
    type,
    onChange,
    onBlur
  }) => {
    return /*#__PURE__*/React.createElement("div", {
      className: "controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, label), /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("input", {
      type: type || 'text',
      onChange: e => {
        onChange(id, e.target.value);
      },
      onBlur: e => {
        // somehow pressing delete key in my mac did delete input field but not trigger onChange event. So wierd..
        onChange(id, e.target.value);
        onBlur(id);
      },
      value: value
    })), /*#__PURE__*/React.createElement("div", {
      className: "error"
    }, errorOn ? errorMessage : ' '));
  };

  return _temp = class SignUp extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleControlChange", (id, val) => {
        this.setState({
          [id]: val
        });
      });

      _defineProperty(this, "_checkValue", id => {
        switch (id) {
          case 'nickname':
            this.setState({
              userNameError: this.state.nickname === ''
            });
            break;

          case 'email':
            if (this.state.email === '') {
              this.setState({
                emailError: true,
                emailErrorMessage: LANG.error_blank_email
              });
              break;
            }

            let emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

            if (!emailRegex.test(this.state.email)) {
              this.setState({
                emailError: true,
                emailErrorMessage: LANG.error_email_format
              });
              break;
            }

            this.setState({
              emailError: false,
              emailErrorMessage: ''
            });
            break;

          case 'password':
          case 'rePassword':
            if (this.state.password !== '' || this.state.rePassword !== '') {
              let mismatch = this.state.password !== this.state.rePassword;
              this.setState({
                passwordMismatch: mismatch
              });
            }

            break;
        }
      });

      _defineProperty(this, "_allValid", () => {
        const {
          userNameError,
          emailError,
          passwordMismatch,
          password,
          agreeToTerms
        } = this.state;
        this.setState({
          agreeToTermError: !agreeToTerms
        });
        return !userNameError && !emailError && !passwordMismatch && password !== '' && agreeToTerms === true;
      });

      _defineProperty(this, "_handleAgreementChange", e => {
        this.setState({
          agreeToTerms: e.target.checked
        });
      });

      _defineProperty(this, "_handleSignUp", async () => {
        if (this._allValid()) {
          this.setState({
            processing: true
          });
          let {
            nickname,
            email,
            password
          } = this.state;
          const response = await CloudApi.signUp(nickname, email, password);

          if (response.ok) {
            this.setState({
              processing: false
            });
            alert(LANG.check_email);
            location.hash = '#studio/cloud/sign-in';
          } else {
            const error = await response.json();
            this.setState({
              processing: false,
              emailError: true,
              emailErrorMessage: LANG[error.message.toLowerCase()]
            });
          }
        }
      });

      _defineProperty(this, "_handleCancel", () => {
        location.hash = '#studio/cloud/sign-in';
      });

      this.state = {
        nickname: '',
        email: '',
        password: '',
        rePassword: '',
        agreeToTerms: false,
        userNameError: false,
        emailError: false,
        agreeToTermError: false,
        passwordMismatch: false
      };
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "cloud"
      }, /*#__PURE__*/React.createElement("div", {
        className: "container"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("h3", null, LANG.sign_up), /*#__PURE__*/React.createElement("h2", null, LANG.flux_cloud)), /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement(Controls, {
        id: "nickname",
        label: LANG.nickname,
        errorMessage: LANG.error_blank_username,
        errorOn: this.state.userNameError,
        value: this.state.nickname,
        onChange: this._handleControlChange,
        onBlur: this._checkValue
      }), /*#__PURE__*/React.createElement(Controls, {
        id: "email",
        label: LANG.email,
        errorMessage: this.state.emailErrorMessage,
        errorOn: this.state.emailError,
        value: this.state.email,
        onChange: this._handleControlChange,
        onBlur: this._checkValue
      })), /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement(Controls, {
        id: "password",
        type: "password",
        label: LANG.password,
        value: this.state.password,
        onChange: this._handleControlChange,
        onBlur: this._checkValue
      }), /*#__PURE__*/React.createElement(Controls, {
        id: "rePassword",
        type: "password",
        label: LANG.re_enter_password,
        errorMessage: LANG.error_password_not_match,
        errorOn: this.state.passwordMismatch,
        value: this.state.rePassword,
        onChange: this._handleControlChange,
        onBlur: this._checkValue
      })), /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("input", {
        id: "agreeToTerms",
        className: "pointer",
        type: "checkbox",
        checked: this.state.agreeToTerms,
        onChange: this._handleAgreementChange
      }), /*#__PURE__*/React.createElement("label", {
        dangerouslySetInnerHTML: {
          __html: LANG.agreement
        }
      }))), /*#__PURE__*/React.createElement("div", {
        className: "processing-error"
      }, /*#__PURE__*/React.createElement("label", null, this.state.agreeToTermError ? LANG.agree_to_terms : ''), /*#__PURE__*/React.createElement("br", null))), /*#__PURE__*/React.createElement("div", {
        className: "processing"
      }, /*#__PURE__*/React.createElement("label", null, this.state.processing ? LANG.processing : '')), /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, /*#__PURE__*/React.createElement("div", {
        className: "divider"
      }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
        className: "actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-cancel",
        onClick: this._handleCancel
      }, LANG.cancel), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        onClick: this._handleSignUp
      }, LANG.sign_up))));
    }

  }, _temp;
});