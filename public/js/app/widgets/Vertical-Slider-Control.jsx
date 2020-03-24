define([
    'plugins/classnames/index',
    'app/constants/keycode-constants',
], function(
    ClassNames,
    keyCodeConstants
) {
    'use strict';
    const React = require('react');
    const ReactDOM = require('react-dom');

    class VerticalSlider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                value: this.props.defaultValue,
                displayValue: this.props.defaultValue
            };
            this.isDragging = false;
        }

        componentDidMount() {
            let sliderHeight = $(ReactDOM.findDOMNode(this.refs.sliderTrack)).height();
            let sliderBarRadius = $(ReactDOM.findDOMNode(this.refs.sliderBar)).css('border-width');
            //This is a hack: Assuming unit is "px", may cause problem
            sliderBarRadius = parseFloat(sliderBarRadius.match(/[0-9]*/)[0]);
            let sliderTop = (this.props.max - this.state.value) / (this.props.max - this.props.min) * sliderHeight - sliderBarRadius;
            $(ReactDOM.findDOMNode(this.refs.sliderBar)).css({top: sliderTop});
        }

        componentDidUpdate() {
            let sliderHeight = $(ReactDOM.findDOMNode(this.refs.sliderTrack)).height();
            let sliderBarRadius = $(ReactDOM.findDOMNode(this.refs.sliderBar)).css('border-width');
            //This is a hack: Assuming unit is "px", may cause problem
            sliderBarRadius = parseFloat(sliderBarRadius.match(/[0-9]*/)[0]);
            let sliderTop = (this.props.max - this.state.value) / (this.props.max - this.props.min) * sliderHeight - sliderBarRadius;
            $(ReactDOM.findDOMNode(this.refs.sliderBar)).css({top: sliderTop});
        }

        _handleMouseDown(e) {
            //console.log(e.clientY, $(e.target).position().top);
            let top = $(ReactDOM.findDOMNode(this.refs.verticalSlider)).position().top;
            let height = $(ReactDOM.findDOMNode(this.refs.verticalSlider)).height();
            let newValue = this.props.max - (e.clientY - top) / (height) * (this.props.max - this.props.min);
            newValue = Math.round(newValue / this.props.step) * this.props.step;
            newValue = Math.max(Math.min(this.props.max, newValue), this.props.min);
            if (newValue != this.state.value) {
                this.props.onChange(newValue);
                this.setState({
                    value: newValue,
                    displayValue: newValue
                });
            }
            this.isDragging = true;
        }

        _handleMouseMove(e) {
            if (this.isDragging) {
                let top = $(ReactDOM.findDOMNode(this.refs.verticalSlider)).position().top;
                let height = $(ReactDOM.findDOMNode(this.refs.verticalSlider)).height();
                let newValue = this.props.max - (e.clientY - top) / (height) * (this.props.max - this.props.min);
                newValue = Math.round(newValue / this.props.step) * this.props.step;
                newValue = Math.max(Math.min(this.props.max, newValue), this.props.min);
                if (newValue != this.state.value) {
                    this.props.onChange(newValue);
                    this.setState({
                        value: newValue,
                        displayValue: newValue
                    });
                }
            }
        }

        _handleMouseUp(e) {
            if (this.isDragging) {
                this.isDragging = false;
            }
        }

        _handleInputChange(e) {
            this.setState({displayValue: e.target.value});
        }

        _handleInputBlur(e) {
            this._validateAndUpdateValue(e.target.value);
        }

        _handleInputKeydown(e) {
            e.stopPropagation();

            switch (e.keyCode) {
                case keyCodeConstants.KEY_RETURN:
                    const activeElement = document.activeElement;
                    this._validateAndUpdateValue(e.target.value);
                    if (activeElement.tagName === 'INPUT') {
                        activeElement.blur();
                    }

                    return;
                case keyCodeConstants.KEY_ESC:
                    this.setState({displayValue: this.state.value});
                    return;
                default:
                    return;
            }
        }

        _validateAndUpdateValue(val) {
            val = this._validateValue(val);
            if (val !== this.state.value) {
                this.props.onChange(val);
            }
            this.setState({
                value: val,
                displayValue: val
            });
        }

        _validateValue(val) {
            let value = parseFloat(val);

            if(isNaN(value)) {
                if (this.state) {
                    value = this.state.value;
                }
            } else {
                // check value boundary
                value = Math.round(value / this.props.step) * this.props.step;
                value = Math.max(Math.min(value, this.props.max), this.props.min);
            }
            return value;
        }

        render() {
            return (
                <div id={this.props.id} className='vertical-slider-control'>
                    <div className="vertical-slider"
                        ref="verticalSlider"
                        onMouseDown={e => this._handleMouseDown(e)}
                        onMouseMove={e => this._handleMouseMove(e)}
                        onMouseUp={e => this._handleMouseUp(e)}
                        onMouseLeave={e => this._handleMouseUp(e)}>
                        <div className="slider-track" ref="sliderTrack">
                            <div className="slider-bar" ref="sliderBar">
                            </div>
                        </div>
                    </div>
                    <div className="input-value">
                        <input
                            ref="speedInput"
                            type="text"
                            value={this.state.displayValue}
                            onBlur={e => this._handleInputBlur(e)}
                            onChange={e => this._handleInputChange(e)}
                            onKeyDown={e => this._handleInputKeydown(e)}
                        />
                    </div>
                </div>
            );
        }

    }

    VerticalSlider.defaultProps = {
        onChange: ()=>{}
    }
    
    return VerticalSlider;
});
