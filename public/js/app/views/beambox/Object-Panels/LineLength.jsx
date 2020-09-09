define([
    'jquery',
    'reactPropTypes',
    'app/actions/beambox/svgeditor-function-wrapper',
    'helpers/local-storage',
    'helpers/i18n'
], function($, PropTypes, FnWrapper, LocalStorage, i18n) {
    'use strict';
    const React = require('react');

    const LANG = i18n.lang.beambox.object_panels;
    
    class LineLengthPanel extends React.Component {
        constructor(props) {
            super(props);
        }
        

        getValueCaption() {
            let x1 = this.props.x1, 
                y1 = this.props.y1,
                x2 = this.props.x2, 
                y2 = this.props.y2,
                units = LocalStorage.get('default-units') || 'mm';
            if (units === 'inches') {
                x1 /= 25.4;
                x2 /= 25.4;
                y1 /= 25.4;
                y2 /= 25.4;
                units = '"';
            }
                return `${Math.hypot(x1 - x2, y1 - y2).toFixed(2)} ${units}`;
        }
        render () {
            return (
                <div className="object-panel">
                    <label className="controls accordion" onClick={() => {FnWrapper.resetObjectPanel()}}>
                    <input type="checkbox" className="accordion-switcher" defaultChecked={true}/>
                    <p className="caption">
                        {LANG.length}
                        <span className="value">{this.getValueCaption()}</span>
                    </p>
                </label>
            </div>
            );
        }
        
    }
    LineLengthPanel.propTypes = {
        x1: PropTypes.number.isRequired,
        y1: PropTypes.number.isRequired,
        x2: PropTypes.number.isRequired,
        y2: PropTypes.number.isRequired
    }

    return LineLengthPanel;

});