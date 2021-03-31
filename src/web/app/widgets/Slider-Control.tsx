const React = requireNode('react');
const PropTypes = requireNode('prop-types');

class SliderControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sliderValue: this.props.default,
      lastValidValue: this.props.default
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    var newPropIsDifferent = nextProps.default !== this.state.sliderValue,
      newStateIsDifferent = this.state.sliderValue !== nextState.sliderValue;

    return newPropIsDifferent || newStateIsDifferent;
  }

  fireChange = (newValue) => {
    this.props.onChange(this.props.id, newValue);
  }

  validateValue = (e) => {
    if (!this.isValidValue(this.state.sliderValue)) {
      this.setState({
        sliderValue: this.state.lastValidValue,
      });
      this.fireChange(this.state.lastValidValue);
    }
  }

  isValidValue = (value) => {
    var min = this.props.min,
      max = this.props.max;

    return min <= value && value <= max;
  }

  handleSliderChange = (key, e) => {
    var value = e.target.value;
    this.setState({
      sliderValue: value,
      lastValidValue: value
    }, function () {
      this.fireChange(value);
    });
  }

  handleEditValue = (e) => {
    var newValue = e.target.value;

    if (this.isValidValue(newValue)) {
      this.setState({ lastValidValue: newValue });
      this.fireChange(newValue);
    }

    this.setState({ sliderValue: newValue });
  }

  render() {
    let unitClass = "control pull-right unit-" + this.props.unit;

    return (
      <div className="controls">
        <div className="label pull-left">{this.props.label}</div>
        <div className={unitClass}>

          <div className="slider-container">
            <input className="slider" type="range"
              min={this.props.min}
              max={this.props.max}
              step={this.props.step}
              value={this.state.sliderValue}
              onChange={this.handleSliderChange.bind(null, this.props.id)} />
          </div>

          <input id={this.props.id} type="text" value={this.state.sliderValue}
            onChange={this.handleEditValue}
            onFocus={this.handleEditValue}
            onBlur={this.validateValue}
            onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }

};

SliderControl.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  default: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  unit: PropTypes.string
}

export default SliderControl;
