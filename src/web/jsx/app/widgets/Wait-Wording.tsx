function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n'], function (i18n) {
  var _temp;

  const React = require('react');

  let lang = i18n.get();
  return _temp = class WaitWording extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "componentDidMount", () => {
        let {
          interval
        } = this.props;
        setInterval(() => {
          this.setState(this.next());
        }, interval || 1000);
      });

      _defineProperty(this, "next", () => {
        let {
          animationString,
          interval
        } = this.props,
            {
          counter
        } = this.state,
            arr,
            str;
        animationString = animationString || '...';
        interval = interval || 1000;
        str = animationString.split('').slice(0, this.state.counter).join('');
        counter = (counter + 1) % (animationString.length + 1) === 0 ? 0 : counter + 1;
        return {
          str,
          counter
        };
      });

      this.state = {
        str,
        counter: 0
      };
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "processing"
      }, /*#__PURE__*/React.createElement("label", null, lang.general.wait + this.state.str));
    }

  }, _temp;
});