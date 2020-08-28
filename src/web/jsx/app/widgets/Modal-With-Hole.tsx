define(['jsx!widgets/Modal'], function (Modal) {
  const React = require('react');

  const classNames = require('classnames');

  class ModalWithHole extends React.Component {
    constructor(props) {
      super(props);
    }

    componentDidMount() {
      window.addEventListener('resize', () => this.handleResizeWindow());
    }

    componentWillUnmount() {
      window.removeEventListener('resize', () => this.handleResizeWindow());
    }

    handleResizeWindow() {
      this.setState({});
    }

    render() {
      const {
        className,
        holePosition,
        holeSize
      } = this.props;

      if (!holePosition) {
        return /*#__PURE__*/React.createElement(Modal, {
          className: {
            'with-hole': true
          }
        }, this.props.children || this.props.content);
      }

      const backgroundClass = classNames('modal-window', 'with-hole', className);
      let {
        width,
        height
      } = holeSize;

      if (!height) {
        height = window.innerHeight - (holePosition.top || 0 + holePosition.bottom || 0);
      }

      if (!width) {
        width = window.innerWidth - (holePosition.left || 0 + holePosition.right || 0);
      }

      const bottom = holePosition.top !== undefined ? `calc(100% - ${holePosition.top}px)` : holePosition.bottom + height;
      const top = holePosition.bottom !== undefined ? `calc(100% - ${holePosition.bottom}px)` : holePosition.top + height;
      const right = holePosition.left !== undefined ? `calc(100% - ${holePosition.left}px)` : holePosition.right + width;
      const left = holePosition.right !== undefined ? `calc(100% - ${holePosition.right}px)` : holePosition.left + width;
      return /*#__PURE__*/React.createElement("div", {
        className: backgroundClass
      }, /*#__PURE__*/React.createElement("div", {
        className: "modal-background",
        style: {
          top
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "modal-background",
        style: {
          bottom
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "modal-background",
        style: {
          left
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "modal-background",
        style: {
          right
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "modal-body"
      }, this.props.children || this.props.content));
    }

  }

  ;
  return ModalWithHole;
});