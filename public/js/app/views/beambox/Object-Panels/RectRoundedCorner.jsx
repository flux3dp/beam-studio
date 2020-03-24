define([
    'jquery',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'jsx!widgets/Unit-Input-v2',
    'helpers/i18n',
    'app/actions/beambox/constant',
], function($, PropTypes, FnWrapper, UnitInput, i18n, Constant) {
    const React = require('react');

    const LANG = i18n.lang.beambox.object_panels;

    class RectRoundedCorner extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                rx: this.props.rx
            }
        }

        componentWillReceiveProps(nextProps) {
            this.setState({
                rx: nextProps.rx
            });
        }

        _update_rx_handler = (val) => {
            FnWrapper.update_ellipse_rx(val);
            this.setState({rx: val});
        }

        getValueCaption = () => {
            const rx = this.state.rx,
                units = localStorage.getItem('default-units', 'mm') ;
            if (units === 'inches') {
                return `${Number(rx/25.4).toFixed(3)}\"`;
            } else {
                return `${rx} mm`;
            }
        }

        render() {
            return (
                <div className="object-panel">
                    <label className="controls accordion" onClick={() => {FnWrapper.resetObjectPanel()}}>
                        <input type="checkbox" className="accordion-switcher" defaultChecked={false} />
                        <p className="caption">
                            {LANG.rounded_corner}
                            <span className="value">{this.getValueCaption()}</span>
                        </p>
                        <label className="accordion-body  with-lock">
                            <div>
                                <div className="control">
                                    <span className="text-center header">{LANG.radius}</span>
                                    <UnitInput
                                        min={0}
                                        max={Constant.dimension.width/Constant.dpmm}
                                        unit="mm"
                                        defaultValue={this.state.rx}
                                        getValue={this._update_rx_handler}
                                    />
                                </div>
                            </div>
                        </label>
                    </label>
                </div>
            );
        }
    };

    RectRoundedCorner.propTypes = {
        rx: PropTypes.number.isRequired
    };

    return RectRoundedCorner;

});
