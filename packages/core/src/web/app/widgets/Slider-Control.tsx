import * as React from 'react';
import classNames from 'classnames';

interface Props {
  id: string,
  label: string,
  min: number,
  max: number,
  step: number,
  default: number,
  onChange: (id: string, value: string | number) => void,
  unit?: string,
  doOnlyOnMouseUp?: boolean,
  doOnlyOnBlur?: boolean,
}

interface State {
  inputValue?: string | number,
  sliderValue?: string | number,
  lastValidValue?: string | number,
}

function isValueValid(value: string | number): boolean {
  if (typeof value === 'string') {
    return value.length > 0 && !Number.isNaN(Number(value));
  }
  return true;
}

class SliderControl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { default: defaultValue } = this.props;
    this.state = {
      inputValue: defaultValue,
      sliderValue: defaultValue,
      lastValidValue: defaultValue,
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const { sliderValue } = this.state;
    const newPropIsDifferent = nextProps.default !== sliderValue;
    const newStateIsDifferent = sliderValue !== nextState.sliderValue;

    return newPropIsDifferent || newStateIsDifferent;
  }

  fireChange = (newValue: string | number): void => {
    const { id, onChange } = this.props;
    onChange(id, newValue);
  };

  getValidatedValue = (value: string | number): string | number => {
    const { max, min } = this.props;
    const { lastValidValue } = this.state;
    if (!isValueValid(value)) {
      return lastValidValue;
    }
    const validatedValue = Number(value);
    return Math.max(min, Math.min(max, validatedValue));
  };

  handleSliderChange = (value: string | number): void => {
    const { doOnlyOnMouseUp = false } = this.props;
    this.setState({
      inputValue: value,
      sliderValue: value,
      lastValidValue: value,
    }, () => {
      if (!doOnlyOnMouseUp) {
        this.fireChange(value);
      }
    });
  };

  handleSliderMouseUp = (value: string | number): void => {
    const { doOnlyOnMouseUp = false } = this.props;
    if (doOnlyOnMouseUp) {
      this.fireChange(value);
    }
  };

  handleInputBlur = (): void => {
    const { doOnlyOnBlur = false } = this.props;
    const { lastValidValue, inputValue } = this.state;
    if (isValueValid(inputValue)) {
      const validatedValue = this.getValidatedValue(inputValue);
      if (doOnlyOnBlur) {
        this.setState({
          inputValue: validatedValue,
          sliderValue: validatedValue,
          lastValidValue: validatedValue,
        });
        this.fireChange(validatedValue);
      }
    } else {
      this.setState({
        inputValue: lastValidValue,
        sliderValue: lastValidValue,
      });
      if (!doOnlyOnBlur) {
        this.fireChange(lastValidValue);
      }
    }
  };

  handleEditValue = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    this.setState({ inputValue: newValue });

    if (isValueValid(newValue)) {
      const { doOnlyOnBlur = false } = this.props;
      const validatedValue = this.getValidatedValue(newValue);
      if (!doOnlyOnBlur) {
        this.setState({
          lastValidValue: validatedValue,
          sliderValue: validatedValue,
          inputValue: newValue,
        });
        this.fireChange(newValue);
        return;
      }
      this.setState({
        sliderValue: validatedValue,
        inputValue: newValue,
      });
    }
  };

  render(): JSX.Element {
    const {
      id, unit = '', label = '', min, max, step,
    } = this.props;
    const unitClass = classNames('control', 'pull-right', `unit-${unit}`);
    const { sliderValue, inputValue } = this.state;
    return (
      <div className="controls">
        <div className="label pull-left">{label}</div>
        <div className={unitClass}>
          <div className="slider-container">
            <input
              className="slider"
              type="range"
              min={min}
              max={max}
              step={step}
              value={sliderValue}
              onChange={(e) => this.handleSliderChange(e.target.value)}
              onMouseUp={(e: any) => this.handleSliderMouseUp(e.target.value)}
            />
          </div>
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={this.handleEditValue}
            onFocus={this.handleEditValue}
            onBlur={this.handleInputBlur}
            onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }
}

export default SliderControl;
