
import Modal from '../../../widgets/Modal';
import DropDownControl from '../../../widgets/Dropdown-Control';
import SwitchControl from '../../../widgets/Switch-Control';
import BeamboxActions from '../../../actions/beambox';
import BeamboxPreference from '../../../actions/beambox/beambox-preference';
import Constant from '../../../actions/beambox/constant';
import OpenBottomBoundaryDrawer from '../../../actions/beambox/open-bottom-boundary-drawer';
import PreviewModeBackgroundDrawer from '../../../actions/beambox/preview-mode-background-drawer';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
const React = requireNode('react');
const LANG = i18n.lang.beambox.document_panel;

// value is one of low, medium, high
// onChange() will get one of low, medium, high
const EngraveDpiSlider = ({value, onChange, onClick}) => {
    const dpiMap = [
        'low',
        'medium',
        'high',
        'ultra',
    ];

    const dpiValueMap = {
        low: 100,
        medium: 250,
        high: 500,
        ultra: 1000,
    };

    const sliderValue = dpiMap.indexOf(value);

    const onSliderValueChange = (e) => {
        const newSliderValue = e.target.value;
        const dpi = dpiMap[newSliderValue];
        onChange(dpi);
    };

    return (
        <div className='controls' onClick={onClick}>
            <div className='control'>
                <span className='label pull-left'>{LANG.engrave_dpi}</span>
                <input
                    className='slider'
                    type='range'
                    min={0}
                    max={3}
                    value={sliderValue}
                    onChange={onSliderValueChange}
                />
                <input
                    className='value'
                    type='text'
                    value={LANG[value] + ` (${dpiValueMap[value]} DPI)`}
                    disabled={true}
                />
            </div>
        </div>
    );
};

const workareaOptions = [
    {label: 'beamo', value: 'fbm1'},
    {label: 'Beambox', value: 'fbb1b'},
    {label: 'Beambox Pro', value: 'fbb1p'},
]

if (window['FLUX'].dev) {
    workareaOptions.push({ label: 'Beambox2', value: 'fbb2b' });
}

export default class DocumentPanel extends React.PureComponent {
    constructor() {
        super();
        this.state = {
            engraveDpi: BeamboxPreference.read('engrave_dpi'),
            workarea: BeamboxPreference.read('workarea') || 'fbb1b',
            rotaryMode: BeamboxPreference.read('rotary_mode'),
            borderlessMode: BeamboxPreference.read('borderless') === true,
            enableDiode: BeamboxPreference.read('enable-diode') === true,
            enableAutofocus: BeamboxPreference.read('enable-autofocus') === true,
        };
    }

    _handleEngraveDpiChange(value) {
        this.setState({
            engraveDpi: value
        });
    }

    _handleWorkareaChange(value) {
        this.setState({
            workarea: value
        });
    }

    _handleRotaryModeChange(value) {
        this.setState({
            rotaryMode: value
        });
        svgCanvas.setRotaryMode(value);
        svgCanvas.runExtensions('updateRotaryAxis');
    }

    _handleBorderlessModeChange(value) {
        this.setState({
            borderlessMode: value
        });
    }

    _handleDiodeModuleChange(value) {
        this.setState({
            enableDiode: value
        });
    }

    _handleAutofocusModuleChange(value) {
        this.setState({
            enableAutofocus: value
        });
    }

    save() {
        BeamboxPreference.write('engrave_dpi', this.state.engraveDpi);
        BeamboxPreference.write('rotary_mode', this.state.rotaryMode);
        BeamboxPreference.write('borderless', this.state.borderlessMode);
        BeamboxPreference.write('enable-diode', this.state.enableDiode);
        BeamboxPreference.write('enable-autofocus', this.state.enableAutofocus);
        if (this.state.workarea !== BeamboxPreference.read('workarea')) {
            BeamboxPreference.write('workarea', this.state.workarea);
            svgCanvas.setResolution(Constant.dimension.getWidth(BeamboxPreference.read('model')), Constant.dimension.getHeight(BeamboxPreference.read('model')));
            svgEditor.resetView();
            PreviewModeBackgroundDrawer.updateCanvasSize();
        }
        OpenBottomBoundaryDrawer.update();
        BeamboxActions.updateLaserPanel();
    }

    render() {
        const doesSupportOpenBottom = Constant.addonsSupportList.openBottom.includes(this.state.workarea);
        const doesSupportHybrid = Constant.addonsSupportList.hybridLaser.includes(this.state.workarea);
        const doesSupportAutofocus = Constant.addonsSupportList.autoFocus.includes(this.state.workarea);
        return (
            <Modal onClose={() => this.props.unmount()}>
                <div className='document-panel'>
                    <section className='main-content'>
                        <div className='title'>{LANG.document_settings}</div>
                        <EngraveDpiSlider
                            value={this.state.engraveDpi}
                            onClick={() => {}}
                            onChange={val => this._handleEngraveDpiChange(val)}
                        />
                        <DropDownControl
                            id="workarea_dropdown"
                            label={LANG.workarea}
                            options={workareaOptions}
                            value={this.state.workarea}
                            onChange={(id, val) => this._handleWorkareaChange(val)} />
                        <div className='sub-title'>{LANG.add_on}</div>
                        <SwitchControl
                            id="rotary_mode"
                            name="rotary_mode"
                            onText={LANG.enable}
                            offText={LANG.disable}
                            label={LANG.rotary_mode}
                            default={this.state.rotaryMode}
                            onChange={(id, val) => this._handleRotaryModeChange(val)} />
                        <SwitchControl
                            id="borderless_mode"
                            name="borderless_mode"
                            onText={LANG.enable}
                            offText={LANG.disable}
                            label={LANG.borderless_mode}
                            default={doesSupportOpenBottom && this.state.borderlessMode}
                            isDisabled={!doesSupportOpenBottom}
                            onChange={(id, val) => this._handleBorderlessModeChange(val)} />
                        <SwitchControl
                            id="autofocus-module"
                            name="autofocus-module"
                            onText={LANG.enable}
                            offText={LANG.disable}
                            label={LANG.enable_autofocus}
                            default={doesSupportAutofocus && this.state.enableAutofocus}
                            isDisabled={!doesSupportAutofocus}
                            onChange={(id, val) => this._handleAutofocusModuleChange(val)}
                        />
                        <SwitchControl
                            id="diode_module"
                            name="diode_module"
                            onText={LANG.enable}
                            offText={LANG.disable}
                            label={LANG.enable_diode}
                            default={doesSupportHybrid && this.state.enableDiode}
                            isDisabled={!doesSupportHybrid}
                            onChange={(id, val) => this._handleDiodeModuleChange(val)}
                        />
                    </section>
                    <section className='footer'>
                        <button
                            className='btn btn-default pull-right'
                            onClick={() => this.props.unmount()}
                        >{LANG.cancel}
                        </button>
                        <button
                            className='btn btn-default primary pull-right'
                            onClick={() => {
                                this.save();
                                this.props.unmount();
                            }}
                        >{LANG.save}
                        </button>
                    </section>
                </div>
            </Modal>
        );
    }
};
