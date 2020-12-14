import keyCodeConstants from '../constants/keycode-constants';

const React = requireNode('react');
const ReactDOM = requireNode('react-dom');

class ValidationTextInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            displayValue: this.props.defaultValue,
            value: this.props.defaultValue
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.defaultValue !== prevProps.defaultValue) {
            this.setState({
                displayValue: this.props.defaultValue,
                value: this.props.defaultValue
            });
        }
    }

    validateAndUpdateValue(val) {
        let res = this.props.validation(val);
        if (res || res === '') {
            this.setState({
                displayValue: res,
                value: res
            }, this.props.getValue(res));

        } else {
            this.setState({displayValue: this.state.value});
        }
    }

    handleBlur(e) {
        this.validateAndUpdateValue(e.target.value);
    }

    handleChange(e) {
        this.setState({displayValue: e.target.value});
    }

    handleKeyDown(e) {
        e.stopPropagation();

        switch (e.keyCode) {
            case keyCodeConstants.KEY_RETURN:
                this.validateAndUpdateValue(e.target.value);
                $(e.target)[0].blur();

                break;
            case keyCodeConstants.KEY_ESC:
                this.setState({displayValue: this.state.value});
                break;
            default:
                break;
        }
    }

    render() {
        return (
            <input
                type='text'
                value={this.state.displayValue}
                onBlur={this.handleBlur.bind(this)}
                onChange={this.handleChange.bind(this)}
                onKeyDown={this.handleKeyDown.bind(this)}
            />
        );
    }
    
};

ValidationTextInput.defaultProps = {
    validation: (s) => {return s},
    getValue: () => {}
};

export default ValidationTextInput;
