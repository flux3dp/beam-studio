const React = requireNode('react');
const classNames = requireNode('classnames');
const PropTypes = requireNode('prop-types');

// Full controlled component, value is controlled by props.value, rerender parent componet to change display value
class DropDownControl extends React.Component{
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

    _fireChange = (newValue, selectedIndex) => {
        if (this.props.id) {
            this.props.onChange(this.props.id, newValue, selectedIndex);
        } else {
            this.props.onChange(newValue, selectedIndex);
        }
    }

    _handleChange = (e) => {
        let { value, selectedIndex } = e.target;
        this.selectedValue = value;
        this._fireChange(value, selectedIndex);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if(nextProps.options.length !== this.props.options.length) {
            this.forceUpdate();
        }
    }

    render() {
        let _options = [];

        if (this.props.hiddenOptions) {
            this.props.hiddenOptions.forEach((option) => {
                if (typeof option === 'object') {
                    _options.push(<option disabled hidden={option.value !== this.props.value} key={option.value} value={option.value}>{option.label}</option>);
                } else {
                    _options.push(<option disabled hidden={option !== this.props.value} key={option} value={option}>{option}</option>);
                }
            });
        }

        this.props.options.forEach(function(option) {
            if (typeof option === 'object') {
                _options.push(<option key={option.value} value={option.value}>{option.label}</option>);
            } else {
                _options.push(<option key={option} value={option}>{option}</option>);
            }
        });

        const firstChildSelected = this.props.options ? (this.selectedValue === this.props.options[0].value) : false ;
        const className = classNames('dropdown-container', { 'first-child-selected': firstChildSelected, 'more-than-one': this.props.options.length > 1});
        return (
            <div className="controls">
                <div className="label pull-left">{this.props.label}</div>
                <div className="control">
                    <div className={className}>
                        <select id={this.props.id} onChange={this._handleChange} value={this.props.value}>
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
    onChange: PropTypes.func.isRequired,
    hiddenOptions: PropTypes.array,
};

export default DropDownControl;
