define([
    'reactPropTypes',
    'app/constants/keycode-constants',
    'helpers/round',
    'plugins/classnames/index'
], function(
    PropTypes,
    keyCodeConstants,
    round,
    ClassNames
) {
    'use strict';
    const React = require('react');

    class UnitInput extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                displayValue:   this.getTransformedValue(this._validateValue(this.props.defaultValue)),
                savedValue:     Number(this.props.defaultValue).toFixed(this.props.decimal)
            };
            this._handleBlur = this._handleBlur.bind(this);
            this._handleKeyDown = this._handleKeyDown.bind(this);
            this._handleChange = this._handleChange.bind(this);
            this._handleInput = this._handleInput.bind(this);
        }

        UNSAFE_componentWillReceiveProps (nextProps) {
            const val = this._validateValue(nextProps.defaultValue);

            this.setState({
                displayValue: this.getTransformedValue(Number(val)),
                savedValue: val
            });
        }

        //always return valid value
        _validateValue(val) {
            let value = parseFloat(val);

            if(isNaN(value)) {
                if (this.state) {
                    value = this.state.savedValue;
                } else {
                    value = Number(this.props.defaultValue).toFixed(this.props.decimal);
                }
            } else {
                // check value boundary
                value = Math.min(value, this.props.max);
                value = Math.max(value, this.props.min);
            }

            return Number(value).toFixed(this.props.decimal);
        }

        _updateValue(newVal) {
            if (this.getLengthUnit() === 'in') {
                newVal *= 25.4;
            }
            const newValue = this._validateValue(newVal);

            this.setState({displayValue: this.getTransformedValue(newValue)});

            if(newValue!==this.state.savedValue) {
                this.setState({savedValue: newValue});
                this.props.getValue(Number(newValue));
            }
        }

        // UI Events
        _handleBlur(e) {
            this._updateValue(e.target.value);
        }

        _handleChange(e) {
            this.setState({displayValue: e.target.value});
        }

        _handleInput(e) {
            if (this.props.isDoOnInput && !e.nativeEvent.inputType) {
                this._updateValue(e.target.value);
            }
        }

        _handleKeyDown(e) {
            const step = Math.abs(this.props.step);

            e.stopPropagation();

            switch (e.keyCode) {
                case keyCodeConstants.KEY_RETURN:
                    const activeElement = document.activeElement;

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
                    if (!this.props.isDoOnInput) this._updateValue(Math.round( parseFloat(this.state.savedValue / step) ) * step + step);
                    return;
                case keyCodeConstants.KEY_DOWN:
                    if (!this.props.isDoOnInput) this._updateValue(Math.round( parseFloat(this.state.savedValue / step) ) * step - step);
                    return;
                default:
                    return;
            }
        }

        getLengthUnit() {
            if (this.props.unit === 'mm') {
                let unit = localStorage.getItem('default-units') || 'mm';
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
            if (this.getLengthUnit() === 'in') {
                return Number(value / 25.4).toFixed(4);
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

            return (
                <div className={ClassNames(className)}>
                    <input
                        type={this.props.type}
                        step={this.props.step}
                        value={this.state.displayValue}
                        onBlur={this._handleBlur}
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
        defaultValue: PropTypes.number.isRequired,
        className: PropTypes.object,
        type: PropTypes.string,
        unit: PropTypes.string,
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
        decimal: PropTypes.number,
        disabled: PropTypes.bool,
        abbr: PropTypes.bool,
        isDoOnInput: PropTypes.bool
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
        decimal: 2,
        disabled: false,
        abbr: false,
        isDoOnInput: false
    };
    return UnitInput;
});
