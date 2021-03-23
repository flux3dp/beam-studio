import InFillBlock from 'app/views/beambox/Right-Panels/Options-Blocks/Infill-Block';
import UnitInput from 'app/widgets/Unit-Input-v2';
import Constant from 'app/actions/beambox/constant';
import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
const React = requireNode('react');
const classNames = requireNode('classnames');
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
        const unit = storage.get('default-units') || 'mm';
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

export default RectOptions;
