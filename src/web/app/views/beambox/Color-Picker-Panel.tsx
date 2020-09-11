
/* eslint-disable react/no-multi-comp */
import $ from 'jquery'
import * as i18n from '../../../helpers/i18n'
import { getSVGAsync } from '../../../helpers/svg-editor-helper'
let svgCanvas;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas });

    const LANG = i18n.lang.beambox.photo_edit_panel;
    const React = requireNode('react');;
    const ReactDOM = requireNode('react-dom');
    const classNames = requireNode('classnames');
    
    class ColorPickerPanel extends React.Component{
        constructor(props?) {
            super(props);
            this.reactRoot = '';
            this.me = null;
            this.layer = null;
            this.unmount = this.unmount.bind(this);
            this.width = 200;
        }

        init(reactRoot, layer, $me, callBack) {
            this.reactRoot = reactRoot;
            this.layer = layer;
            this.$me = $me;
            this.callBack = callBack;
        }

        render() {
            if(this.layer) {
                this._render();
            } else {
                this.unmount();
            }
        }

        renderPickr() {
            const Pickr = requireNode('@simonwep/pickr');
            const origColor = $(this.layer).attr('data-color');
            this.pickr = Pickr.create({
                el: '.pickr',
                theme: 'monolith', // or 'monolith', or 'nano'
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

        setPosition(left, top) {
            left -= this.width;
            this.style =  {
                top,
                left
            }
        }

        onApply() {
            const hexColor = this.pickr.getColor().toHEXA().toString();
            $(this.layer).attr('data-color', hexColor);
            if (svgCanvas.isUseLayerColor) {
                svgCanvas.updateLayerColor(this.layer);
            }
            this.callBack();
            this.unmount();
        }

        unmount() {
            this.element = null;
            ReactDOM.unmountComponentAtNode(document.getElementById(this.reactRoot));
        }

        _renderfooter() {
            return (
                <div className='footer'>
                    {this._renderFooterButton(LANG.cancel, this.unmount.bind(this), classNames('btn', 'btn-default', 'pull-right'))}
                    {this._renderFooterButton(LANG.okay, this.onApply.bind(this), classNames('btn', 'btn-default', 'pull-right', 'primary'))}
                </div>
            );
        }

        _renderFooterButton(label, onClick, className) {
            return(
                <button
                        className={className}
                        onClick={() => {onClick()}}
                    >
                        {label}
                </button>
            )
        }

        _render() {
            const footer = this._renderfooter();
            ReactDOM.render(
                    <div className='color-picker-panel' style={this.style}>
                        <div className='modal-background' onClick={this.unmount}></div>
                        <div className='pickr'></div>
                        {footer}
                    </div>, document.getElementById(this.reactRoot)
            );
        }
    }

    const instance = new ColorPickerPanel();

    export default instance;
