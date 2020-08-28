function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'jsx!widgets/Select', 'jsx!widgets/Modal'], function (i18n, SelectView, Modal) {
  'use strict';

  const React = require('react');

  return function (args) {
    args = args || {};

    class Home extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_getLanguageOptions", () => {
          var options = [];

          for (var lang_code in args.props.supported_langs) {
            options.push({
              value: lang_code,
              label: args.props.supported_langs[lang_code],
              selected: lang_code === i18n.getActiveLang()
            });
          }

          return options;
        });

        _defineProperty(this, "_changeActiveLang", e => {
          i18n.setActiveLang(e.currentTarget.value);
          this.setState({
            lang: i18n.get()
          });
        });

        this.state = {
          lang: args.state.lang
        };
      } // Private methods


      // Lifecycle
      render() {
        var lang = this.state.lang,
            options = this._getLanguageOptions(),
            wrapperClassName = {
          'initialization': true
        },
            content = /*#__PURE__*/React.createElement("div", {
          className: "home text-center"
        }, /*#__PURE__*/React.createElement("img", {
          className: "brand-image",
          src: "img/menu/main_logo.svg"
        }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
          className: "headline"
        }, lang.initialize.select_language), /*#__PURE__*/React.createElement("div", {
          className: "language"
        }, /*#__PURE__*/React.createElement(SelectView, {
          id: "select-lang",
          options: options,
          onChange: this._changeActiveLang
        })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
          href: "#initialize/connect/select-connection-type",
          className: "btn btn-action btn-large"
        }, lang.initialize.next))));

        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }

    ;
    return Home;
  };
});