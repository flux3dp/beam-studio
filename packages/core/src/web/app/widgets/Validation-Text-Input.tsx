import * as React from 'react';

import keyCodeConstants from '@core/app/constants/keycode-constants';

interface Props {
  defaultValue: any;
  getValue: (any) => void;
  validation: (any) => any;
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
        e.target.blur();
        break;
      case keyCodeConstants.KEY_ESC:
        this.setState((prevState) => ({ displayValue: prevState.value }));
        break;
      default:
        break;
    }
  }

  validateAndUpdateValue(val) {
    const { getValue = () => {}, validation = (s) => s } = this.props;
    const res = validation(val);

    if (res || res === '') {
      this.setState(
        {
          displayValue: res,
          value: res,
        },
        () => getValue(res),
      );
    } else {
      this.setState((prevState) => ({ displayValue: prevState.value }));
    }
  }

  render() {
    const { displayValue } = this.state;

    return (
      <input
        onBlur={this.handleBlur.bind(this)}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
        type="text"
        value={displayValue}
      />
    );
  }
}

export default ValidationTextInput;
