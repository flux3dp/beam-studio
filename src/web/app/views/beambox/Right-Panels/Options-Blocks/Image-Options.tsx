import UnitInput from '../../../../widgets/Unit-Input-v2';
import Constant from '../../../../actions/beambox/constant';
import ImageData from '../../../../../helpers/image-data';
import * as i18n from '../../../../../helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

class ImageOptions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    updateImage = () => {
        const { elem } = this.props;
        const isShading = elem.getAttribute('data-shading') === 'true';
        const threshold = parseInt(elem.getAttribute('data-threshold'));
        ImageData(
            $(elem).attr("origImage"),
            {
                height: $(elem).height(),
                width: $(elem).width(),
                grayscale: {
                    is_rgba: true,
                    is_shading: isShading,
                    threshold: threshold,
                    is_svg: false
                },
                onComplete: function(result) {
                    $(elem).attr('xlink:href', result.pngBase64);
                }
            }
        );
    }

    handleGradientClick = () => {
        const { elem, updateObjectPanel } = this.props;
        const isGradient = elem.getAttribute('data-shading') === 'true';
        const isTurningOnGradient = !isGradient;
        elem.setAttribute('data-shading', isTurningOnGradient);
        elem.setAttribute('data-threshold', isTurningOnGradient ? 254 : 128);
        this.setState(this.state);
        this.updateImage();
        updateObjectPanel();
    }

    renderGradientBlock() {
        const { elem } = this.props;
        const isGradient = elem.getAttribute('data-shading') === 'true';
        return (
            <div className="option-block" key="gradient">
                <div className="label">{LANG.shading}</div>
                <div className="onoffswitch" onClick={() => this.handleGradientClick()}>
                    <input type="checkbox" className="onoffswitch-checkbox" checked={isGradient} readOnly={true}/>
                    <label className="onoffswitch-label">
                        <span className="onoffswitch-inner"></span>
                        <span className="onoffswitch-switch"></span>
                    </label>
                </div>
            </div>
        );
    }

    handleThresholdChange = (val) => {
        const { elem } = this.props;
        elem.setAttribute('data-threshold', val);
        this.setState(this.state);
        this.updateImage();
    }

    renderThresholdBlock() {
        const { elem } = this.props;
        const isGradient = elem.getAttribute('data-shading') === 'true';
        if (isGradient) {
            return null;
        }
        const threshold = parseInt(elem.getAttribute('data-threshold')) || 128;
        return (
            <div key="threshold">
                <div className="option-block with-slider">
                    <div className="label">{LANG.threshold}</div>
                    <UnitInput
                        min={1}
                        max={255}
                        decimal={0}
                        unit={''}
                        className={{'option-input': true}}
                        defaultValue={threshold}
                        getValue={(val) => this.handleThresholdChange(val)}
                    />
                </div>
                <div className="option-block slider-container">
                    <input className="threshold-slider" type="range"
                        min={1}
                        max={255}
                        step={1}
                        value={threshold}
                        onChange={(e) => {this.handleThresholdChange(parseInt(e.target.value))}}
                    />
                </div>
            </div>
        );
    }

    render() {
        return (
            <div>
                { this.renderGradientBlock() }
                { this.renderThresholdBlock() }
            </div>
        );
    }
}

export default ImageOptions;
