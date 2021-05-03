const React = requireNode('react');
const classNames = requireNode('classnames');

interface Props {
  id: string;
  name: string;
  onText?: string;
  offText?: string;
  label: string;
  default: boolean;
  onChange: (string, boolean) => void;
  isDisabled?: boolean;
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
    return (nextProps.default !== checked)
      || (nextProps.isDisabled !== isDisabled)
      || (checked !== nextState.checked);
  }

  fireChange = (newValue): void => {
    const { id, onChange } = this.props;
    onChange(id, newValue);
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
    const {
      id,
      label,
      name,
      isDisabled = false,
      onText = 'ON',
      offText = 'OFF',
      default: defaultChecked,
    } = this.props;
    const { checked } = this.state;
    return (
      <div className={classNames('controls', { disabled: isDisabled })} name={id}>
        <div className="label pull-left">{label}</div>
        <div className="control">
          <div className="switch-container">
            <div className="switch-status">{checked ? onText : offText}</div>
            <div className="onoffswitch" name={name || ''}>
              <input
                type="checkbox"
                name="onoffswitch"
                className="onoffswitch-checkbox"
                id={id}
                onChange={this.handleToggle}
                checked={isDisabled ? defaultChecked : checked}
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
