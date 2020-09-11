const React = requireNode('react');

export default class TextToggle extends React.Component{
    static defaultProps = {
        title: '',
        textOn: '',
        textOff: '',
        defaultChecked: false,
        defaultValue: '',
        displayText: '',
        className: '',
        // events
        onClick: function() {}
    }

    constructor(props) {
        super(props);
        this.state = {
            checked: this.props.defaultChecked
        };
    }

    // UI events
    _onClick = (e) => {
        this.state.checked = !this.state.checked;

        this.setState({
            checked: this.state.checked
        });

        this.props.onClick(e);
    }

    // Public function
    isChecked = () => {
        return this.state.checked;
    }

    // Lifecycle
    render() {
        var props = this.props,
            lang = props.lang,
            stateStyle = (true === this.state.checked ? 'on' : 'off'),
            defaultClassName = 'ui ui-control-text-toggle',
            className = defaultClassName + ('string' === typeof this.props.className ? ' ' + this.props.className : '');

        return (
            <label className={className} title={props.title}>
                <span className="caption">{props.displayText}</span>
                <input
                    refs="toggle"
                    type="checkbox"
                    className={stateStyle}
                    defaultValue={props.defaultValue}
                    checked={this.state.checked}
                    onClick={this._onClick}
                />
                <span className="status" data-text-on={props.textOn} data-text-off={props.textOff}></span>
            </label>
        );
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            checked: nextProps.defaultChecked
        });
    }
};
