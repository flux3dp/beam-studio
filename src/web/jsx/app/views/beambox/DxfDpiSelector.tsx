define(['jsx!widgets/Button-Group', 'app/constants/keycode-constants', 'helpers/i18n'], function (ButtonGroup, KeyCodeConstants, i18n) {
  const React = require('react');

  const lang = i18n.lang;

  const DxfDpiSelector = ({
    defaultDpiValue,
    onSubmit,
    onCancel
  }) => {
    const submitValue = () => {
      const dpi = Number($('#dpi-input').val());
      onSubmit(dpi);
    };

    const _handleKeyDown = e => {
      if (e.keyCode === KeyCodeConstants.KEY_RETURN) {
        submitValue();
      }
    };

    const clearInputValue = () => {
      $('#dpi-input').val('');
    };

    const buttons = [{
      key: 'cancel',
      label: lang.alert.cancel,
      right: true,
      onClick: () => onCancel()
    }, {
      key: 'ok',
      className: 'btn-default primary',
      label: lang.alert.ok,
      right: true,
      onClick: () => submitValue()
    }];
    const style = {
      padding: '3px 10px',
      width: '120px',
      textAlign: 'left'
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "caption"
    }, lang.message.please_enter_dpi, /*#__PURE__*/React.createElement("br", null), "2.54, 25.4, 72, 96 etc."), /*#__PURE__*/React.createElement("div", {
      className: "message",
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("input", {
      id: "dpi-input",
      defaultValue: defaultDpiValue,
      onClick: clearInputValue,
      onKeyDown: _handleKeyDown,
      style: style
    })), /*#__PURE__*/React.createElement(ButtonGroup, {
      buttons: buttons
    }));
  };

  return DxfDpiSelector;
});