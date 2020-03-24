define([
    'jquery',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'jsx!widgets/Unit-Input-v2',
    'helpers/i18n',
], function($, PropTypes, FnWrapper, UnitInput, i18n) {
    'use strict';
    const React = require('react');

    const LANG = i18n.lang.beambox.object_panels;
    
    class Rotation extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                angle: this.props.angle
            };
        }
        
        componentWillReceiveProps(nextProps) {
            this.setState({
                angle: nextProps.angle
            });
        }

        _update_angle_handler = (angle) => {
            FnWrapper.update_angle(angle);
            this.setState({angle: angle});
        }

        render() {
            return (
                <div className="object-panel">
                    <label className="controls accordion" onClick={() => {FnWrapper.resetObjectPanel()}}>
                        <input type="checkbox" className="accordion-switcher"/>
                        <p className="caption">
                            {LANG.rotation}
                            <span className="value">{this.state.angle}°</span>
                        </p>
                        <label className="accordion-body">
                            <div className="control">
                                <UnitInput
                                    min={-180}
                                    max={180}
                                    defaultUnitType="angle"
                                    defaultUnit="°"
                                    defaultValue={this.state.angle}
                                    getValue={this._update_angle_handler}
                                />
                            </div>
                        </label>
                    </label>
                </div>
            );
        }
        
    };

    Rotation.propTypes = {
        angle: PropTypes.number.isRequired
    };

    return Rotation;
});