import keyCodeConstants from '../constants/keycode-constants';
import storage from 'helpers/storage-helper';

const ClassNames = requireNode('classnames');
const React = requireNode('react');
const PropTypes = requireNode('prop-types');

class UnitInput extends React.Component{
    private decimal: number = 0;
    constructor(props) {
        super(props);
        this.setDecimal();

        this.state = {
            isEditing: false,
            displayValue:   this.getTransformedValue(this._validateValue(this.props.defaultValue)),
            savedValue:     Number(this.props.defaultValue).toFixed(this.decimal)
        };
        this._handleBlur = this._handleBlur.bind(this);
        this._handleKeyUp = this._handleKeyUp.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleChange = this._handleChange.bind(this);
        this._handleInput = this._handleInput.bind(this);
    }

    componentDidUpdate(prevProps, prepStates) {
        if (prevProps.unit !== this.props.unit) {
            this.setDecimal();
            const val = this._validateValue(this.props.defaultValue);
            this.setState({
                displayValue: this.getTransformedValue(Number(val)),
                savedValue: val
            });
        }
    }

    UNSAFE_componentWillReceiveProps (nextProps) {
        const val = this._validateValue(nextProps.defaultValue);

        this.setState({
            displayValue: this.getTransformedValue(Number(val)),
            savedValue: val
        });
    }

    setDecimal() {
        if (this.props.decimal !== undefined) {
            this.decimal = this.props.decimal;
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
        let value: string | number = parseFloat(val);

        if(isNaN(value)) {
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

        if(newValue!==this.state.savedValue) {
            this.setState({savedValue: newValue});
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
            isEditing: true
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
                const activeElement = document.activeElement as HTMLElement;

                // this seems unnecessary
                // this._updateValue(e.target.value);

                if (activeElement.tagName === 'INPUT') {
                    activeElement.blur();
                }

                return;
            case keyCodeConstants.KEY_ESC:
                this.setState({displayValue: this.getTransformedValue(this.state.savedValue)});
                return;
            case keyCodeConstants.KEY_UP:
                if (!this.props.isDoOnInput) this._updateValue(Math.round(this.getTransformedValue(parseFloat(this.state.savedValue)) / step) * step + step);
                return;
            case keyCodeConstants.KEY_DOWN:
                if (!this.props.isDoOnInput) this._updateValue(Math.round(this.getTransformedValue(parseFloat(this.state.savedValue)) / step) * step - step);
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
                return this.props.abbr ? '\"' : 'in';
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
        let _renderUnit = '';
        if(this.props.unit !== '') {
            _renderUnit = <span className="unit">{this.getLengthUnit()}</span>;
        }

        let className = this.props.className;
        className['ui ui-control-unit-input-v2'] = true;

        const shouldHideValue = (this.props.displayMultiValue && !this.state.isEditing);

        return (
            <div className={ClassNames(className)}>
                <input
                    type={this.props.type}
                    step={this.props.step}
                    value={shouldHideValue ? '-' : this.state.displayValue}
                    onFocus={(e) => {this._handleFocus(e)}}
                    onBlur={this._handleBlur}
                    onKeyUp={this._handleKeyUp}
                    onKeyDown={this._handleKeyDown}
                    onChange={this._handleChange}
                    onInput={this._handleInput}
                    disabled={this.props.disabled}
                />
                {_renderUnit}
            </div>
        );
    }
};

UnitInput.propTypes = {
    getValue: PropTypes.func.isRequired,
    defaultValue: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([null]),
    ]),
    className: PropTypes.object,
    type: PropTypes.string,
    unit: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    decimal: PropTypes.number,
    disabled: PropTypes.bool,
    abbr: PropTypes.bool,
    isDoOnInput: PropTypes.bool,
    displayMultiValue: PropTypes.bool,
    forceUsePropsUnit: PropTypes.bool,
    onKeyUp: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
};

UnitInput.defaultProps = {
    getValue: function(NewValue) {},
    defaultValue: 0,
    className: {},
    type: 'text',
    unit: '',
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    step: 1,
    disabled: false,
    abbr: false,
    isDoOnInput: false,
    displayMultiValue: false,
    forceUsePropsUnit: false,
    onKeyUp: () => {},
    onBlur: () => {},
    onFocus: () => {},
};

export default UnitInput;
