/* eslint-disable ts/no-unused-vars */
import React from 'react';

import ClassNames from 'classnames';

import keyCodeConstants from '@core/app/constants/keycode-constants';

import storage from '@app/implementations/storage';

interface Props {
  abbr?: boolean;
  className?: string | { [key: string]: boolean };
  decimal?: number;
  defaultValue: number;
  disabled?: boolean;
  displayMultiValue?: boolean;
  forceUsePropsUnit?: boolean;
  getValue: (value: number) => void;
  id?: string;
  isDoOnInput?: boolean;
  max?: number;
  min?: number;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyUp?: (e?: any) => void;
  step?: number;
  type?: string;
  unit?: string;
}

interface States {
  displayValue: number | string;
  id?: string;
  isEditing: boolean;
  savedValue: string;
}

/**
 * @deprecated use UnitInput from '@core/app/widgets/UnitInput'
 */
class UnitInput extends React.Component<Props, States> {
  static defaultProps = {
    abbr: false,
    className: {},
    defaultValue: 0,
    disabled: false,
    displayMultiValue: false,
    forceUsePropsUnit: false,
    getValue: function (value) {},
    isDoOnInput: false,
    max: Number.MAX_SAFE_INTEGER,
    min: Number.MIN_SAFE_INTEGER,
    onBlur: () => {},
    onFocus: () => {},
    onKeyUp: () => {},
    step: 1,
    type: 'text',
    unit: '',
  };

  private decimal: number = 0;

  constructor(props) {
    super(props);

    const { defaultValue } = this.props;

    this.setDecimal();
    this.state = {
      displayValue: this.getTransformedValue(this._validateValue(defaultValue)),
      isEditing: false,
      savedValue: Number(defaultValue).toFixed(this.decimal),
    };
    this._handleBlur = this._handleBlur.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._handleInput = this._handleInput.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    const { defaultValue, max, unit } = this.props;

    if (prevProps.unit !== unit) {
      this.setDecimal();

      const val = this._validateValue(defaultValue);

      this.setState({
        displayValue: this.getTransformedValue(Number(val)),
        savedValue: val,
      });
    }

    if (prevProps.max !== max) {
      const { displayValue } = this.state;
      const val = this._validateValue(displayValue);

      this._updateValue(val);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const val = this._validateValue(nextProps.defaultValue);

    this.setState({
      displayValue: this.getTransformedValue(Number(val)),
      savedValue: val,
    });
  }

  setDecimal() {
    const { decimal } = this.props;

    if (decimal !== undefined) {
      this.decimal = decimal;

      return;
    }

    if (['in', 'in/s'].includes(this.getLengthUnit())) {
      this.decimal = 4;

      return;
    }

    this.decimal = 2;

    return;
  }

  //always return valid value
  _validateValue(val) {
    let value: number | string = Number.parseFloat(val);

    if (Number.isNaN(value)) {
      if (this.state) {
        value = this.state.savedValue;
      } else {
        value = Number(this.props.defaultValue).toFixed(this.decimal);
      }
    } else {
      // check value boundary
      value = Math.min(value, this.props.max);
      value = Math.max(value, this.props.min);
    }

    return Number(value).toFixed(this.decimal);
  }

  _updateValue(newVal) {
    if (['in', 'in/s'].includes(this.getLengthUnit())) {
      newVal *= 25.4;
    }

    const newValue = this._validateValue(newVal);

    this.setState({
      displayValue: this.getTransformedValue(newValue),
      isEditing: false,
    });

    if (newValue !== this.state.savedValue) {
      this.setState({ savedValue: newValue });
      this.props.getValue(Number(newValue));
    }
  }

  // UI Events
  _handleBlur(e) {
    this._updateValue(e.target.value);
    this.props.onBlur();
  }

  _handleFocus(e) {
    this.props.onFocus();
  }

  _handleChange(e) {
    this.setState({
      displayValue: e.target.value,
      isEditing: true,
    });
  }

  _handleInput(e) {
    if (this.props.isDoOnInput && !e.nativeEvent.inputType) {
      this._updateValue(e.target.value);
    }
  }

  _handleKeyUp(e) {
    e.stopPropagation();
    this.props.onKeyUp(e);
  }

  _handleKeyDown(e) {
    const step = Math.abs(this.props.step);

    e.stopPropagation();

    switch (e.keyCode) {
      case keyCodeConstants.KEY_RETURN:
        // eslint-disable-next-line no-case-declarations
        const activeElement = document.activeElement as HTMLElement;

        // this seems unnecessary
        // this._updateValue(e.target.value);
        if (activeElement.tagName === 'INPUT') {
          activeElement.blur();
        }

        return;
      case keyCodeConstants.KEY_ESC:
        this.setState({ displayValue: this.getTransformedValue(this.state.savedValue) });

        return;
      case keyCodeConstants.KEY_UP:
        if (!this.props.isDoOnInput) {
          this._updateValue(
            Math.round(this.getTransformedValue(Number.parseFloat(this.state.savedValue)) / step) * step + step,
          );
        }

        return;
      case keyCodeConstants.KEY_DOWN:
        if (!this.props.isDoOnInput) {
          this._updateValue(
            Math.round(this.getTransformedValue(Number.parseFloat(this.state.savedValue)) / step) * step - step,
          );
        }

        return;
      default:
        return;
    }
  }

  getLengthUnit() {
    if (this.props.unit === 'mm') {
      let unit = 'mm';

      if (!this.props.forceUsePropsUnit) {
        unit = storage.get('default-units') || 'mm';
      }

      if (unit === 'mm') {
        return this.props.abbr ? '' : 'mm';
      } else {
        return this.props.abbr ? '"' : 'in';
      }
    } else {
      return this.props.abbr ? '' : this.props.unit;
    }
  }

  getTransformedValue(value) {
    if (['in', 'in/s'].includes(this.getLengthUnit())) {
      return Number(value / 25.4).toFixed(this.decimal);
    } else {
      return value;
    }
  }

  render() {
    const { className, disabled, displayMultiValue, id, step, type, unit } = this.props;
    let renderUnit: React.JSX.Element | string = '';
    const { displayValue, isEditing } = this.state;

    if (unit !== '') {
      renderUnit = <span className="unit">{this.getLengthUnit()}</span>;
    }

    className['ui ui-control-unit-input-v2'] = true;

    const shouldHideValue = displayMultiValue && !isEditing;

    return (
      <div className={ClassNames(className)}>
        <input
          disabled={disabled}
          id={id}
          onBlur={this._handleBlur}
          onChange={this._handleChange}
          onFocus={(e) => {
            this._handleFocus(e);
          }}
          onInput={this._handleInput}
          onKeyDown={this._handleKeyDown}
          onKeyUp={this._handleKeyUp}
          step={step}
          type={type}
          value={shouldHideValue ? '-' : displayValue}
        />
        {renderUnit}
      </div>
    );
  }
}

export default UnitInput;
