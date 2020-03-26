define([
    'jquery',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'jsx!widgets/Unit-Input-v2',
    'helpers/i18n',
    'app/actions/beambox/constant',
], function($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
    'use strict';
    const React = require('react');

    const LANG = i18n.lang.beambox.object_panels;
    
    class EllipseRadius extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                rx: this.props.rx,
                ry: this.props.ry,
                isRatioPreserve: false
            };
        }
        
        UNSAFE_componentWillReceiveProps(nextProps) {
            this.setState({
                rx: nextProps.rx,
                ry: nextProps.ry
            });
        }

        _update_rx_handler = (val) => {
            val = val / 2;
            if(this.state.isRatioPreserve) {
                const ry = val * (this.state.ry/this.state.rx);
                FnWrapper.update_ellipse_ry(ry);
                this.setState({ry: ry}); 
            }
            FnWrapper.update_ellipse_rx(val);
            this.setState({rx: val});
        }

        _update_ry_handler = (val) => {
            val = val / 2;
            if(this.state.isRatioPreserve) {
                const rx = val * (this.state.rx/this.state.ry);
                FnWrapper.update_ellipse_rx(rx);
                this.setState({rx: rx}); 
            }
            FnWrapper.update_ellipse_ry(val);
            this.setState({ry: val});            
        }

        _ratio_handler = (e) => {
            this.setState({
                isRatioPreserve: e.target.checked
            });
        }

        getValueCaption() {
            const rx = this.state.rx, 
                ry = this.state.ry,
                units = localStorage.getItem('default-units', 'mm') ;
            if (units === 'inches') {
                return `${Number(rx*2/25.4).toFixed(3)}\", ${Number(ry*2/25.4).toFixed(3)}\"`;
            } else {
                return `${rx*2}, ${ry*2} mm`;
            }
        }

        render() {
            return (
                <div className="object-panel">
                    <label className="controls accordion" onClick={() => {FnWrapper.resetObjectPanel()}}>
                        <input type="checkbox" className="accordion-switcher" defaultChecked={true} />
                        <p className="caption">
                            {LANG.ellipse_radius}
                            <span className="value">{this.getValueCaption()}</span>
                        </p>
                        <label className="accordion-body  with-lock">
                            <div>
                                <div className="control">
                                    <span className="text-center header">X</span>
                                    <UnitInput
                                        min={0}
                                        max={Constant.dimension.width/Constant.dpmm}
                                        unit="mm"
                                        defaultValue={this.state.rx * 2}
                                        getValue={this._update_rx_handler}
                                    />
                                </div>
                                <div className="control">
                                    <span className="text-center header">Y</span>
                                    <UnitInput
                                        min={0}
                                        max={Constant.dimension.height/Constant.dpmm}
                                        unit="mm"
                                        defaultValue={this.state.ry * 2}
                                        getValue={this._update_ry_handler}
                                    />
                                </div>
                            </div>
                            <div className='lock'>
                                <input type="checkbox" checked={this.state.isRatioPreserve} id="togglePreserveRatio" onChange={this._ratio_handler} hidden/>
                                <label htmlFor="togglePreserveRatio" title={LANG.lock_desc}><div>┐</div><i className={this.state.isRatioPreserve?"fa fa-lock locked":"fa fa-unlock-alt unlocked"}></i><div>┘</div></label>
                            </div>
                        </label>
                    </label>
                </div>
            );
        }
    };

    EllipseRadius.propTypes = {
        rx: PropTypes.number.isRequired,
        ry: PropTypes.number.isRequired
    };

    return EllipseRadius;
});