define([
    'jquery',
    'jsx!widgets/Unit-Input',
    'jsx!widgets/Dialog-Menu',
    'helpers/api/config',
    'helpers/i18n',
], function(
    $,
    UnitInput,
    DialogMenu,
    config,
    i18n
) {
    'use strict';
    const React = require('react');

    let lang = i18n.lang;

    class SetupPanel extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                defaults: this.props.defaults
            };
        }

        isShading = () => {
            return false;
        }

        // UI Events
        _saveLastestSet = () => {
            var self = this,
                refs = self.refs,
                opts = {
                    liftHeight: refs.liftHeight.value(),
                    drawHeight: refs.drawHeight.value(),
                    speed: refs.speed.value()
                },
                state = {
                    defaults: opts
                };

            config().write('draw-defaults', opts);

            self.setState(state);
        }

        openSubPopup = (e) => {
            this.refs.dialogMenu.toggleSubPopup(e);
        }

        _updateDefaults = (e, value) => {
            this._saveLastestSet();
            this.openSubPopup(e);
        }

        // Lifecycle
        _renderLiftHeight = () => {
            var min = Math.max(5, this.state.defaults.drawHeight);

            return {
                label: (
                    <div title={lang.draw.pen_up_title}>
                        <span className="caption">{lang.draw.pen_up}</span>
                        <span>{this.state.defaults.liftHeight}</span>
                        <span>{lang.draw.units.mm}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="liftHeight"
                            defaultUnit="mm"
                            defaultValue={this.state.defaults.liftHeight}
                            getValue={this._updateDefaults}
                            min={min}
                            max={150}
                        />
                    </div>
                )
            };
        }

        _renderDrawHeight = () => {
            var max = Math.min(150, this.state.defaults.liftHeight);

            return {
                label: (
                    <div title={lang.draw.pen_down_title}>
                        <span className="caption">{lang.draw.pen_down}</span>
                        <span>{this.state.defaults.drawHeight}</span>
                        <span>{lang.draw.units.mm}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="drawHeight"
                            defaultUnit="mm"
                            defaultValue={this.state.defaults.drawHeight}
                            getValue={this._updateDefaults}
                            min={5}
                            max={max}
                        />
                    </div>
                )
            };
        }

        _renderSpeed = () => {
            return {
                label: (
                    <div title={lang.draw.speed_title}>
                        <span className="caption">{lang.draw.speed}</span>
                        <span>{this.state.defaults.speed}</span>
                        <span>{lang.draw.units.mms}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="speed"
                            defaultUnit="mm/s"
                            defaultUnitType="speed"
                            defaultValue={this.state.defaults.speed}
                            getValue={this._updateDefaults}
                            min={0.8}
                            max={150}
                        />
                    </div>
                )
            };
        }

        render() {
            var liftHeight = this._renderLiftHeight(),
                drawHeight = this._renderDrawHeight(),
                speed = this._renderSpeed(),
                items = [
                    liftHeight,
                    drawHeight,
                    speed
                ];

            return (
                <div className="setup-panel operating-panel">
                    <DialogMenu ref="dialogMenu" items={items}/>
                </div>
            );
        }

    };

    SetupPanel.defaultProps = {
        defaults: {},
        imageFormat: 'svg'  // svg, bitmap
    };

    return SetupPanel;
});
