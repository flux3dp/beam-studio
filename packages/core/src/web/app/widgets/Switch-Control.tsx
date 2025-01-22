import * as React from 'react';

import classNames from 'classnames';

interface Props {
  default: boolean;
  id: string;
  isDisabled?: boolean;
  label: string;
  name: string;
  offText?: string;
  onChange: (value: boolean) => void;
  onText?: string;
}

interface State {
  checked: boolean;
}
class SwitchControl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { default: defaultChecked } = this.props;

    this.state = {
      checked: defaultChecked,
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const { isDisabled } = this.props;
    const { checked } = this.state;

    return nextProps.default !== checked || nextProps.isDisabled !== isDisabled || checked !== nextState.checked;
  }

  fireChange = (newValue): void => {
    const { onChange } = this.props;

    onChange(newValue);
  };

  handleToggle = (e): void => {
    const { isDisabled } = this.props;

    if (isDisabled) {
      return;
    }

    const isChecked = e.target.checked;

    this.setState({ checked: isChecked }, function () {
      this.fireChange(isChecked);
    });
  };

  render() {
    const { default: defaultChecked, id, isDisabled = false, label, name, offText = 'OFF', onText = 'ON' } = this.props;
    let { checked } = this.state;

    if (isDisabled) {
      checked = defaultChecked;
    }

    return (
      <div className={classNames('controls', { disabled: isDisabled })} data-name={id}>
        <div className="label pull-left">{label}</div>
        <div className="control">
          <div className="switch-container">
            <div className="switch-status">{checked ? onText : offText}</div>
            <div className="onoffswitch" data-name={name || ''}>
              <input
                checked={checked}
                className="onoffswitch-checkbox"
                id={id}
                name="onoffswitch"
                onChange={this.handleToggle}
                type="checkbox"
              />
              <label className="onoffswitch-label" htmlFor={id}>
                <span className="onoffswitch-inner" />
                <span className="onoffswitch-switch" />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SwitchControl;
