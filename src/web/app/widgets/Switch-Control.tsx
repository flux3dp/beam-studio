const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const classNames = requireNode('classnames');

    class SwitchControl extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                checked: this.props.default,
            }
        }

        shouldComponentUpdate(nextProps, nextState) {
            var newPropIsDifferent = (nextProps.default !== this.state.checked) || (nextProps.isDisabled !== this.props.isDisabled),
                newStateIsDifferent = this.state.checked !== nextState.checked;

            return newPropIsDifferent || newStateIsDifferent;
        }

        _fireChange = (newValue) => {
            this.props.onChange(this.props.id, newValue);
        }

        _handleToggle = (e) => {
            const { isDisabled } = this.props;
            if (isDisabled) {
                return;
            }
            var isChecked = e.target.checked;
            this.setState({ checked: isChecked }, function() {
                this._fireChange(isChecked);
            });
        }

        render() {
            const { isDisabled } = this.props;
            const containerClass = classNames('controls', {disabled: isDisabled});
            return (
                <div className={containerClass} name={this.props.id}>
                    <div className="label pull-left">{this.props.label}</div>
                    <div className="control">
                        <div className="switch-container">

                            <div className="switch-status">{this.state.checked ? this.props.onText : this.props.offText}</div>

                            <div className="onoffswitch" name={this.props.name || ''}>

                                <input type="checkbox" name="onoffswitch" className="onoffswitch-checkbox" id={this.props.id}
                                    onChange={this._handleToggle}
                                    checked={isDisabled ? this.props.default : this.state.checked} />

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
        onText: PropTypes.string,
        offText: PropTypes.string,
        default: PropTypes.bool,
        onChange: PropTypes.func.isRequired
    };

    SwitchControl.defaultProps = {
        onText: 'ON',
        offText: 'OFF',
    }

    export default SwitchControl;