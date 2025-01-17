import * as React from 'react';
import $ from 'jquery';
import keyCodeConstants from 'app/constants/keycode-constants';

interface Props {
  defaultValue: any;
  validation: (any) => any;
  getValue: (any) => void;
}

interface State {
  displayValue: any;
  value: any;
}

class ValidationTextInput extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { defaultValue } = this.props;
    this.state = {
      displayValue: defaultValue,
      value: defaultValue,
    };
  }

  componentDidUpdate(prevProps) {
    const { defaultValue } = this.props;
    if (defaultValue !== prevProps.defaultValue) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        displayValue: defaultValue,
        value: defaultValue,
      });
    }
  }

  handleBlur(e) {
    this.validateAndUpdateValue(e.target.value);
  }

  handleChange(e) {
    this.setState({ displayValue: e.target.value });
  }

  handleKeyDown(e) {
    e.stopPropagation();
    switch (e.keyCode) {
      case keyCodeConstants.KEY_RETURN:
        this.validateAndUpdateValue(e.target.value);
        $(e.target)[0].blur();
        break;
      case keyCodeConstants.KEY_ESC:
        this.setState((prevState) => ({ displayValue: prevState.value }));
        break;
      default:
        break;
    }
  }

  validateAndUpdateValue(val) {
    const { validation = (s) => s, getValue = () => {} } = this.props;
    const res = validation(val);
    if (res || res === '') {
      this.setState({
        displayValue: res,
        value: res,
      }, () => getValue(res));
    } else {
      this.setState((prevState) => ({ displayValue: prevState.value }));
    }
  }

  render() {
    const { displayValue } = this.state;
    return (
      <input
        type="text"
        value={displayValue}
        onBlur={this.handleBlur.bind(this)}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
      />
    );
  }
}

export default ValidationTextInput;
