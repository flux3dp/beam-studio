const React = requireNode('react');
const ClassNames = requireNode('classnames');
const PropTypes = requireNode('prop-types');

export default class CheckboxControl extends React.Component{
    static propTypes = {
        id: PropTypes.string,
        label: PropTypes.string,
        default: PropTypes.array,
        options: PropTypes.array.isRequired,
        onChange: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);
        let selected = this.props.default;
        this.state = { selected };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        let _new = JSON.stringify(nextProps.default),
            _old = JSON.stringify(this.state.selected);

        if(_new !== _old) { this.setState({ selected: nextProps.default }); }
    }

    _handleToggleChange = (id) => {
        let { selected } = this.state;
        if(selected.indexOf(id) === -1) {
            selected.push(id);
        }
        else {
            let i = selected.indexOf(id);
            selected = selected.slice(0, i).concat(selected.slice(i + 1));
        }

        this.props.onChange(this.props.id, selected, id);
    }

    render() {
        var _options = this.props.options.map(function(option) {
            var checkboxClass = ClassNames(
                { 'selected': this.state.selected.indexOf(option.id) !== -1 }
            );
            return (
                <div className="checkbox" onClick={this._handleToggleChange.bind(null, option.id)}>
                    <div className={checkboxClass}></div>
                    <span>{option.name}</span>
                </div>
            );
        }.bind(this));

        return (
            <div className="controls">
                <div className="label">{this.props.label}</div>
                <div className="control">
                    {_options}
                </div>
            </div>
        );
    }
};
