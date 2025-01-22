import * as React from 'react';

import classNames from 'classnames';

interface Props {
  default: number;
  doOnlyOnBlur?: boolean;
  doOnlyOnMouseUp?: boolean;
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (id: string, value: number | string) => void;
  step: number;
  unit?: string;
}

interface State {
  inputValue?: number | string;
  lastValidValue?: number | string;
  sliderValue?: number | string;
}

function isValueValid(value: number | string): boolean {
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
      lastValidValue: defaultValue,
      sliderValue: defaultValue,
    };
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const { sliderValue } = this.state;
    const newPropIsDifferent = nextProps.default !== sliderValue;
    const newStateIsDifferent = sliderValue !== nextState.sliderValue;

    return newPropIsDifferent || newStateIsDifferent;
  }

  fireChange = (newValue: number | string): void => {
    const { id, onChange } = this.props;

    onChange(id, newValue);
  };

  getValidatedValue = (value: number | string): number | string => {
    const { max, min } = this.props;
    const { lastValidValue } = this.state;

    if (!isValueValid(value)) {
      return lastValidValue;
    }

    const validatedValue = Number(value);

    return Math.max(min, Math.min(max, validatedValue));
  };

  handleSliderChange = (value: number | string): void => {
    const { doOnlyOnMouseUp = false } = this.props;

    this.setState(
      {
        inputValue: value,
        lastValidValue: value,
        sliderValue: value,
      },
      () => {
        if (!doOnlyOnMouseUp) {
          this.fireChange(value);
        }
      },
    );
  };

  handleSliderMouseUp = (value: number | string): void => {
    const { doOnlyOnMouseUp = false } = this.props;

    if (doOnlyOnMouseUp) {
      this.fireChange(value);
    }
  };

  handleInputBlur = (): void => {
    const { doOnlyOnBlur = false } = this.props;
    const { inputValue, lastValidValue } = this.state;

    if (isValueValid(inputValue)) {
      const validatedValue = this.getValidatedValue(inputValue);

      if (doOnlyOnBlur) {
        this.setState({
          inputValue: validatedValue,
          lastValidValue: validatedValue,
          sliderValue: validatedValue,
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
          inputValue: newValue,
          lastValidValue: validatedValue,
          sliderValue: validatedValue,
        });
        this.fireChange(newValue);

        return;
      }

      this.setState({
        inputValue: newValue,
        sliderValue: validatedValue,
      });
    }
  };

  render(): React.JSX.Element {
    const { id, label = '', max, min, step, unit = '' } = this.props;
    const unitClass = classNames('control', 'pull-right', `unit-${unit}`);
    const { inputValue, sliderValue } = this.state;

    return (
      <div className="controls">
        <div className="label pull-left">{label}</div>
        <div className={unitClass}>
          <div className="slider-container">
            <input
              className="slider"
              max={max}
              min={min}
              onChange={(e) => this.handleSliderChange(e.target.value)}
              onMouseUp={(e: any) => this.handleSliderMouseUp(e.target.value)}
              step={step}
              type="range"
              value={sliderValue}
            />
          </div>
          <input
            id={id}
            onBlur={this.handleInputBlur}
            onChange={this.handleEditValue}
            onFocus={this.handleEditValue}
            onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
            type="text"
            value={inputValue}
          />
        </div>
      </div>
    );
  }
}

export default SliderControl;
