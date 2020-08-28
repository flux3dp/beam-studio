define([
    'reactPropTypes'
], function(PropTypes) {
    'use strict';
    const React = require('react');
    const ReactDOM = require('react-dom');

    return class TextInput extends React.Component{
        static propTypes = {
            defaultValue: PropTypes.string
        }

        // Public
        value = () => {
            return ReactDOM.findDOMNode(this.refs.textInput).value;
        }

        // Lifecycle
        render() {
            return (
                <input
                    ref="textInput"
                    className="ui ui-control-text-input"
                    type="text"
                    defaultValue={this.props.displayValue}
                />
            );
        }
    };
});
