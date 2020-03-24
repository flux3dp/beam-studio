define([
    'jquery',
    'app/actions/beambox/svgeditor-function-wrapper',
    'helpers/i18n',
], function($, FnWrapper, i18n) {
    const React = require('react');

    const LANG = i18n.lang.beambox.object_panels;

    class FillPanel extends React.Component{

        constructor(props) {
            super(props);
            let isFillable = svgCanvas.isElemFillable(props.$me[0]);
            let {isAnyFilled, isAllFilled} = svgCanvas.calcElemFilledInfo(props.$me[0]);
            this.state = {
                isAnyFilled,
                isAllFilled,
                isFillable
            };
            this._handleClick = this._handleClick.bind(this);
        }

        _handleClick() {
            if (this.state.isAnyFilled) {
                svgCanvas.setElemsUnfill(this.props.$me);
            } else {
                svgCanvas.setElemsFill(this.props.$me);
            }
            this.setState({
                isAnyFilled: !this.state.isAnyFilled,
                isAllFilled: !this.state.isAnyFilled
            });
        }

        render() {
            let isPartiallyFilled = this.state.isAnyFilled && !this.state.isAllFilled;
            let checkBoxClassName = `${this.state.isAnyFilled ? 'fa fa-toggle-on' : 'fa fa-toggle-off'} ${(this.props.type === 'g' && isPartiallyFilled) ? 'partially-filled' : ''}`
            return this.state.isFillable ? (
                <div className='object-panel'>
                    <label className='controls accordion' onClick={this._handleClick}>
                        <p className='caption'>
                            {LANG.fill}
                            <label className='shading-checkbox' onClick={this._handleClick}>
                                <i className={checkBoxClassName} />
                            </label>
                        </p>
                    </label>
                </div>
            ) : null;
        }
    };

    return FillPanel;
});
