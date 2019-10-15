define([
    'jquery',
    'react',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'jsx!widgets/Unit-Input-v2',
    'helpers/i18n',
    'app/actions/beambox/constant'
], function($, React, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
    'use strict';

    const LANG = i18n.lang.beambox.object_panels;


    return React.createClass({
        propTypes: {
            cx: PropTypes.number.isRequired,
            cy: PropTypes.number.isRequired
        },

        getInitialState: function() {
            return {
                cx: this.props.cx,
                cy: this.props.cy
            };
        },
        
        componentWillReceiveProps: function(nextProps) {
            this.setState({
                cx: nextProps.cx,
                cy: nextProps.cy
            });
        },

        _update_cx_handler: function(val) {
            FnWrapper.update_ellipse_cx(val);
            this.setState({cx: val});
        },
        _update_cy_handler: function(val) {
            FnWrapper.update_ellipse_cy(val);
            this.setState({cy: val});            
        },
        getValueCaption: function() {
            const cx = this.state.cx, 
                cy = this.state.cy,
                units = localStorage.getItem('default-units', 'mm') ;
            if (units === 'inches') {
                return `${Number(cx/25.4).toFixed(3)}\", ${Number(cy/25.4).toFixed(3)}\"`;
            } else {
                return `${cx}, ${cy} mm`;
            }
        },
        render: function() {
            return (
                <div className="object-panel">
                    <label className="controls accordion" onClick={() => {FnWrapper.reset_object_panel()}}>
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                    <p className="caption">
                        {LANG.center}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                    <label className="accordion-body">
                        <div className="control">
                            <span className="text-center header">X</span>
                            <UnitInput
                                min={0}
                                max={Constant.dimension.width/Constant.dpmm}
                                unit="mm"
                                defaultValue={this.state.cx}
                                getValue={this._update_cx_handler}
                            />
                        </div>
                        <div className="control">
                            <span className="text-center header">Y</span>
                            <UnitInput
                                min={0}
                                max={Constant.dimension.height/Constant.dpmm}
                                unit="mm"
                                defaultValue={this.state.cy}
                                getValue={this._update_cy_handler}
                            />
                        </div>
                    </label>
                </label>
            </div>
            );
        }
        
    });

});