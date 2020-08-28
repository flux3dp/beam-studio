define([
    'jsx!views/beambox/Right-Panels/Options-Blocks/Infill-Block',
    'jsx!widgets/Unit-Input-v2',
    'jsx!contexts/DialogCaller',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/beambox/constant',
    'helpers/i18n'
], function(
    InFillBlock,
    UnitInput,
    DialogCaller,
    Alert,
    AlertConstants,
    Constant,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

    class RectOptions extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
            };
        }

        handleRoundedCornerChange = (val) => {
            const { elem, updateDimensionValues } = this.props;
            val *= Constant.dpmm;
            svgCanvas.changeSelectedAttribute('rx', val, [elem]);
            updateDimensionValues({rx: val});
        }

        renderRoundCornerBlock() {
            const { dimensionValues } = this.props;
            const unit = localStorage.getItem('default-units') || 'mm';
            const isInch = unit === 'inches';
            return (
                <div className="option-block" key="rounded-corner">
                    <div className="label">{LANG.rounded_corner}</div>
                    <UnitInput
                        min={0}
                        unit={isInch ? 'in' : 'mm'}
                        className={{'option-input': true}}
                        defaultValue={dimensionValues.rx / Constant.dpmm || 0}
                        getValue={(val) => this.handleRoundedCornerChange(val)}
                    />
                </div>
            );
        }

        render() {
            const { elem } = this.props;
            return (
                <div className="rect-options">
                    {this.renderRoundCornerBlock()}
                    <InFillBlock elem={elem}/>
                </div>
            );
        }
    }

    return RectOptions;
});
