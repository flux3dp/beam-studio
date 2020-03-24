define([
    'jquery',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'jsx!widgets/Unit-Input-v2',
    'helpers/i18n',
    'app/actions/beambox/constant'
], function($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
    'use strict';
    const React = require('react');;

    const LANG = i18n.lang.beambox.object_panels;

    class PositionPanel extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                x: this.props.x,
                y: this.props.y
            };
        }

        componentWillReceiveProps(nextProps) {
            this.setState({
                x: nextProps.x,
                y: nextProps.y
            });
        }

        _update_x_handler = (x) => {
            if(this.props.type === 'use') {
                svgCanvas.setSvgElemPosition('x', x * Constant.dpmm);
            } else {
                FnWrapper.update_selected_x(x);
            }
            this.setState({x: x});
        }

        _update_y_handler = (y) => {
            if(this.props.type === 'use') {
                svgCanvas.setSvgElemPosition('y', y * Constant.dpmm);
            } else {
                FnWrapper.update_selected_y(y);
            }
            this.setState({y: y});
        }

        getValueCaption() {
            const x = this.state.x, 
                y = this.state.y,
                units = localStorage.getItem('default-units', 'mm') ;
            if (units === 'inches') {
                return `${Number(x/25.4).toFixed(3)}\", ${Number(y/25.4).toFixed(3)}\"`;
            } else {
                return `${x}, ${y} mm`;
            }
        }

        render() {
            return (
                <div className="object-panel">
                    <label className="controls accordion" onClick={() => {FnWrapper.resetObjectPanel()}}>
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true}/>
                    <p className="caption">
                        {LANG.position}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                    <label className="accordion-body">
                        <div className="control">
                            <span className="text-center header">X</span>
                            <UnitInput
                                unit="mm"
                                defaultValue={this.state.x}
                                getValue={this._update_x_handler}
                            />
                        </div>
                        <div className="control">
                            <span className="text-center header">Y</span>
                            <UnitInput
                                unit="mm"
                                defaultValue={this.state.y}
                                getValue={this._update_y_handler}
                            />
                        </div>
                    </label>
                </label>
            </div>
            );
        }
    };

    PositionPanel.propTypes = {
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
    };

    return PositionPanel;

});
