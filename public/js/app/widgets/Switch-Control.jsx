define([
    'reactPropTypes',
    'plugins/classnames/index'
], function(PropTypes, ClassNames) {
    'use strict';
    const React = require('react');

    class SwitchControl extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                checked: this.props.default
            }
        }

        shouldComponentUpdate(nextProps, nextState) {
            var newPropIsDifferent = nextProps.default !== this.state.checked,
                newStateIsDifferent = this.state.checked !== nextState.checked;

            return newPropIsDifferent || newStateIsDifferent;
        }

        _fireChange(newValue) {
            this.props.onChange(this.props.id, newValue);
        }

        _handleToggle(e) {
            var isChecked = e.target.checked;
            this.setState({ checked: isChecked }, function() {
                this._fireChange(isChecked);
            });
        }

        render() {
            return (
                <div className="controls" name={this.props.id}>
                    <div className="label pull-left">{this.props.label}</div>
                    <div className="control">
                        <div className="switch-container">

                            <div className="switch-status">{this.state.checked ? 'ON' : 'OFF'}</div>

                            <div className="onoffswitch" name={this.props.name || ''}>

                                <input type="checkbox" name="onoffswitch" className="onoffswitch-checkbox" id={this.props.id}
                                    onChange={this._handleToggle}
                                    checked={this.state.checked} />

                                <label className="onoffswitch-label" htmlFor={this.props.id}>
                                    <span className="onoffswitch-inner"></span>
                                    <span className="onoffswitch-switch"></span>
                                </label>

                            </div>

                        </div>
                    </div>
                </div>
            );
        }

    };

    SwitchControl.propTypes = {
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        default: PropTypes.bool,
        onChange: PropTypes.func.isRequired
    };

    return SwitchControl;
});
