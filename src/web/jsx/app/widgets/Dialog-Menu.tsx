function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'reactClassset', 'app/stores/global-store', 'jsx!widgets/List', // non-return
'helpers/object-assign'], function ($, PropTypes, ReactCx, GlobalStore, List) {
  var _class, _temp;

  const React = require('react');

  const ReactDOM = require('react-dom');

  return _temp = _class = class DialogMenu extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "resetCheckedItem", () => {
        this.setState({
          checkedItem: -1
        });
      });

      _defineProperty(this, "toggleSubPopup", (itemIndex, isChecked) => {
        this.setState({
          checkedItem: isChecked ? itemIndex : -1
        });
      });

      _defineProperty(this, "_renderItem", () => {
        const arrowClassName = ReactCx.cx({
          'arrow': true,
          'arrow-left': 'LEFT' === this.props.arrowDirection,
          'arrow-right': 'RIGHT' === this.props.arrowDirection,
          'arrow-up': 'UP' === this.props.arrowDirection,
          'arrow-bottom': 'BOTTOM' === this.props.arrowDirection
        });
        return this.props.items.filter(item => !!item.label).map((item, index) => {
          const {
            content,
            disable,
            forceKeepOpen,
            label,
            labelClass,
            previewOn
          } = item;
          const {
            checkedItem
          } = this.state;
          const disablePopup = disable || !content;
          const checked = forceKeepOpen || previewOn || checkedItem === index && !disablePopup;
          let itemLabelClassName = {
            'dialog-label': true,
            'disable': disable === true
          };
          itemLabelClassName = Object.assign(itemLabelClassName, labelClass || {});
          return {
            label: /*#__PURE__*/React.createElement("label", {
              className: "ui-dialog-menu-item"
            }, /*#__PURE__*/React.createElement("input", {
              name: "dialog-opener",
              className: "dialog-opener",
              type: "checkbox",
              disabled: disablePopup,
              checked: checked,
              onClick: e => {
                if (!forceKeepOpen) {
                  this.toggleSubPopup(index, e.target.checked);
                }
              }
            }), /*#__PURE__*/React.createElement("div", {
              className: ReactCx.cx(itemLabelClassName)
            }, label), /*#__PURE__*/React.createElement("label", {
              className: "dialog-window"
            }, /*#__PURE__*/React.createElement("div", {
              className: arrowClassName
            }), /*#__PURE__*/React.createElement("div", {
              className: "dialog-window-content"
            }, content)))
          };
        });
      });

      this.state = {
        checkedItem: -1
      };
    }

    componentDidMount() {
      GlobalStore.onResetDialogMenuIndex(() => this.resetCheckedItem());
    }

    componentWillUnmount() {
      GlobalStore.removeResetDialogMenuIndexListener(() => this.resetCheckedItem());
    }

    // Lifecycle
    render() {
      const className = this.props.className;
      className['ui ui-dialog-menu'] = true;
      return /*#__PURE__*/React.createElement(List, {
        ref: "uiDialogMenu",
        items: this._renderItem(),
        className: ReactCx.cx(className)
      });
    }

  }, _defineProperty(_class, "propTypes", {
    arrowDirection: PropTypes.oneOf(['LEFT', 'RIGHT', 'UP', 'BOTTOM']),
    className: PropTypes.object,
    items: PropTypes.array
  }), _defineProperty(_class, "defaultProps", {
    arrowDirection: 'LEFT',
    className: {},
    items: []
  }), _temp;
});