function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n'], function (i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

  class InFillBlock extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "onClick", () => {
        const {
          isAnyFilled
        } = this.state;
        const {
          elem
        } = this.props;

        if (isAnyFilled) {
          svgCanvas.setElemsUnfill([elem]);
        } else {
          svgCanvas.setElemsFill([elem]);
        }

        this.setState({
          isAnyFilled: !isAnyFilled,
          isAllFilled: !isAnyFilled
        });
      });

      const {
        elem: _elem
      } = props;
      let isFillable = svgCanvas.isElemFillable(_elem);
      let {
        isAnyFilled: _isAnyFilled,
        isAllFilled
      } = svgCanvas.calcElemFilledInfo(_elem);
      this.state = {
        isAnyFilled: _isAnyFilled,
        isAllFilled,
        isFillable
      };
    }

    componentDidUpdate(prevProps) {
      const lastElem = prevProps.elem;
      const lastId = lastElem.getAttribute('id');
      const {
        elem
      } = this.props;

      if (elem.getAttribute('id') !== lastId) {
        let isFillable = svgCanvas.isElemFillable(elem);
        let {
          isAnyFilled,
          isAllFilled
        } = svgCanvas.calcElemFilledInfo(elem);
        this.setState({
          isAnyFilled,
          isAllFilled,
          isFillable
        });
      }
    }

    render() {
      const {
        elem
      } = this.props;
      const {
        isAnyFilled,
        isAllFilled,
        isFillable
      } = this.state;
      const isPartiallyFilled = isAnyFilled && !isAllFilled;

      if (!isFillable) {
        return null;
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "option-block",
        key: "infill"
      }, /*#__PURE__*/React.createElement("div", {
        className: "label"
      }, LANG.fill), /*#__PURE__*/React.createElement("div", {
        className: classNames('onoffswitch', {
          'partially-filled': elem.tagName === 'g' && isPartiallyFilled
        }),
        onClick: () => this.onClick()
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        className: "onoffswitch-checkbox",
        checked: isAnyFilled || false,
        readOnly: true
      }), /*#__PURE__*/React.createElement("label", {
        className: "onoffswitch-label"
      }, /*#__PURE__*/React.createElement("span", {
        className: "onoffswitch-inner"
      }), /*#__PURE__*/React.createElement("span", {
        className: "onoffswitch-switch"
      }))));
    }

  }

  return InFillBlock;
});