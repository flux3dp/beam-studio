import { getLayerElementByName } from '../../../helpers/layer-helper';
import * as i18n from '../../../helpers/i18n';
import { getSVGAsync } from '../../../helpers/svg-editor-helper';
let svgCanvas;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas });

const LANG = i18n.lang.beambox.photo_edit_panel;
const React = requireNode('react');
const Pickr = requireNode('@simonwep/pickr');
const classNames = requireNode('classnames');

export default class ColorPickerPanel extends React.Component{
    private layer: Element
    constructor(props?) {
        super(props);
        this.width = 200;
        this.layer = getLayerElementByName(props.layerName);
    }

    componentDidMount() {
        this.renderPickr();
    }

    renderPickr() {
        const origColor = this.layer.getAttribute('data-color') || '#333333';
        this.pickr = Pickr.create({
            el: '.pickr',
            theme: 'monolith',
            inline: true,
            default: origColor,
            swatches: [
            ],
            components: {
                // Main components
                preview: true,
                opacity: false,
                hue: true,
                // Input / output Options
                interaction: {
                    input: false,
                    cancel: false,
                    save: false
                }
            }
        });
    }

    onApply() {
        const hexColor = this.pickr.getColor().toHEXA().toString();
        this.props.onColorChanged(hexColor);
        this.props.onClose();
    }

    renderfooter() {
        return (
            <div className='footer'>
                {this.renderFooterButton(LANG.cancel, () => this.props.onClose(), classNames('btn', 'btn-default', 'pull-right'))}
                {this.renderFooterButton(LANG.okay, () => this.onApply(), classNames('btn', 'btn-default', 'pull-right', 'primary'))}
            </div>
        );
    }

    renderFooterButton(label, onClick, className) {
        return(
            <button className={className} onClick={() => {onClick()}}>
                    {label}
            </button>
        )
    }

    render() {
        const footer = this.renderfooter();
        const style = { top: this.props.top, left: this.props.left - this.width };
        return(
            <div className='color-picker-panel' style={style}>
                <div className='modal-background' onClick={this.props.onClose}></div>
                <div className='pickr'></div>
                {footer}
            </div>
        );
    }
}


