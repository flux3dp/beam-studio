import classNames from 'classnames';
import React from 'react';

interface Props {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: any[];
  hiddenOptions?: any[];
}

interface State {
  sliderValue?: string;
  selectedValue?: string;
}

// Full controlled component, value is controlled by props.value, rerender parent componet to change display value
class DropDownControl extends React.Component<Props, State> {
  private selectedValue: string;

  constructor(props) {
    super(props);
    this.selectedValue = this.props.value;
    this.state = {};
  }

  shouldComponentUpdate(nextProps, nextState) {
    var newPropIsDifferent = nextProps.value !== this.state.sliderValue,
      newStateIsDifferent = this.selectedValue !== nextState.selectedValue;

    return newPropIsDifferent || newStateIsDifferent;
  }

  _fireChange = (newValue) => {
    const { onChange } = this.props;
    onChange(newValue);
  }

  _handleChange = (e) => {
    let { value } = e.target;
    this.selectedValue = value;
    this._fireChange(value);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { options } = this.props;
    if (nextProps.options.length !== options.length) {
      this.forceUpdate();
    }
  }

  render() {
    let _options = [];
    const { hiddenOptions, value, options, label, id } = this.props;

    if (hiddenOptions) {
      hiddenOptions.forEach((option) => {
        if (typeof option === 'object') {
          _options.push(<option disabled hidden={option.value !== value} key={option.value} value={option.value}>{option.label}</option>);
        } else {
          _options.push(<option disabled hidden={option !== value} key={option} value={option}>{option}</option>);
        }
      });
    }

    options.forEach(function (option) {
      if (typeof option === 'object') {
        _options.push(<option key={option.value} value={option.value}>{option.label}</option>);
      } else {
        _options.push(<option key={option} value={option}>{option}</option>);
      }
    });

    const firstChildSelected = options ? (this.selectedValue === options[0]?.value) : false;
    const className = classNames('dropdown-container', { 'first-child-selected': firstChildSelected, 'more-than-one': options.length > 1 });
    return (
      <div className="controls">
        <div className="label pull-left">{label}</div>
        <div className="control">
          <div className={className}>
            <select id={id} onChange={this._handleChange} value={value}>
              {_options}
            </select>
          </div>
        </div>
      </div>
    );
  }
};

export default DropDownControl;
