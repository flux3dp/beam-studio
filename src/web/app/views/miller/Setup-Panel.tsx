define([
    'jquery',
    'jsx!widgets/Select',
    'jsx!widgets/List',
    'jsx!widgets/Modal',
    'jsx!views/laser/Advanced-Panel',
    'jsx!widgets/Text-Toggle',
    'jsx!widgets/Unit-Input',
    'jsx!widgets/Button-Group',
    'jsx!widgets/Alert',
    'jsx!widgets/Dialog-Menu',
    'helpers/api/config',
    'helpers/i18n',
    'helpers/round',
    'plugins/classnames/index'
], function(
    $,
    SelectView,
    List,
    Modal,
    AdvancedPanel,
    TextToggle,
    UnitInput,
    ButtonGroup,
    Alert,
    DialogMenu,
    ConfigHelper,
    i18n,
    round,
    ClassNames
) {
    'use strict';
    const React = require('react');

    let Config = ConfigHelper(),
        lang = i18n.lang;

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
                    zOffset: refs.zOffset.value(),
                    overcut: refs.overcut.value(),
                    speed: refs.speed.value(),
                    repeat: refs.repeat.value(),
                    stepHeight: refs.stepHeight.value()
                },
                state = {
                    defaults: opts
                };

            Config.write('mill-defaults', opts);

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
        _renderZOffset = () => {
            var min = -1;

            return {
                label: (
                    <div title={lang.cut.zOffsetTip}>
                        <span className="caption">{lang.cut.zOffset}</span>
                        <span>{this.state.defaults.zOffset}</span>
                        <span>{lang.draw.units.mm}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="zOffset"
                            defaultUnit="mm"
                            defaultValue={this.state.defaults.zOffset}
                            getValue={this._updateDefaults}
                            min={min}
                            max={150}
                        />
                    </div>
                )
            };
        }

        _renderOvercut = () => {
            return {
                label: (
                    <div title={lang.cut.overcutTip}>
                        <span className="caption">{lang.cut.overcut}</span>
                        <span>{this.state.defaults.overcut}</span>
                        <span>{lang.draw.units.mm}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="overcut"
                            defaultUnit="mm"
                            defaultValue={this.state.defaults.overcut}
                            getValue={this._updateDefaults}
                            min={0}
                            max={10}
                        />
                    </div>
                )
            };
        }

        _renderSpeed = () => {
            return {
                label: (
                    <div title={lang.cut.speedTip}>
                        <span className="caption">{lang.cut.speed}</span>
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

        _renderRepeat = () => {

            return {
                label: (
                    <div title={lang.cut.repeatTip}>
                        <span className="caption">{lang.mill.repeat}</span>
                        <span>{this.state.defaults.repeat}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="repeat"
                            defaultUnit="mm"
                            defaultValue={this.state.defaults.repeat}
                            getValue={this._updateDefaults}
                            min={0}
                            max={50}
                        />
                    </div>
                )
            };
        }

        _renderStepHeight = () => {

            return {
                label: (
                    <div title={lang.cut.repeatTip}>
                        <span className="caption">{lang.mill.stepHeight}</span>
                        <span>{this.state.defaults.stepHeight}</span>
                        <span>{lang.draw.units.mm}</span>
                    </div>
                ),
                content: (
                    <div className="object-height-input">
                        <UnitInput
                            ref="stepHeight"
                            defaultUnit="mm"
                            defaultValue={this.state.defaults.stepHeight}
                            getValue={this._updateDefaults}
                            min={0}
                            max={50}
                        />
                    </div>
                )
            };
        }

        render() {
            let items = [ 
                    this._renderZOffset(),
                    this._renderOvercut(),
                    this._renderSpeed(),
                    this._renderRepeat(),
                    this._renderStepHeight()
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