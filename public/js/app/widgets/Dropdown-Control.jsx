define([
    'reactPropTypes',
    'plugins/classnames/index'
], function(PropTypes, ClassNames) {
    'use strict';
    const React = require('react');

    class DropDownControl extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                selectedValue: this.props.default
            }
        }

        shouldComponentUpdate(nextProps, nextState) {
            var newPropIsDifferent = nextProps.default !== this.state.sliderValue,
                newStateIsDifferent = this.state.selectedValue !== nextState.selectedValue;

            return newPropIsDifferent || newStateIsDifferent;
        }

        _fireChange = (newValue, selectedIndex) => {
            if (this.props.id) {
                this.props.onChange(this.props.id, newValue, selectedIndex);
            } else {
                this.props.onChange(newValue, selectedIndex);
            }
        }

        _handleChange = (e) => {
            let { value, selectedIndex } = e.target;
            this.setState({ selectedValue: value }, function() {
                this._fireChange(value, selectedIndex);
            });
        }

        componentWillReceiveProps(nextProps) {
            if(nextProps.options.length !== this.props.options.length) {
                this.forceUpdate();
            }
        }

        render() {
            var self = this,
                _options;

            _options = this.props.options.map(function(option) {
                if (typeof option === 'object') {
                    return (<option key={option.value} value={option.value}>{option.label}</option>);
                } else {
                    return (<option key={option} value={option}>{option}</option>);
                }
            });

            const firstChildSelected = this.props.options ? (this.state.selectedValue === this.props.options[0].value) : false ;
            const classNames =  (firstChildSelected) ? 'dropdown-container first-child-selected' : 'dropdown-container';

            return (
                <div className="controls">
                    <div className="label pull-left">{this.props.label}</div>
                    <div className="control">
                        <div className={classNames}>
                            <select id={this.props.id} onChange={this._handleChange} defaultValue={self.props.default}>
                                {_options}
                            </select>
                        </div>
                    </div>
                </div>
            );
        }
    };
    DropDownControl.propTypes = {
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        options: PropTypes.array,
        default: PropTypes.string,
        onChange: PropTypes.func.isRequired
    };
    return DropDownControl;
});
