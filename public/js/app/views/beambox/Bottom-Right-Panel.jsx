define([
    'reactClassset',
    'app/actions/beambox/bottom-right-funcs',
    'app/actions/beambox/preview-mode-controller',
    'app/actions/beambox/beambox-preference',
    'jsx!widgets/Button-Group',
    'helpers/i18n',
    'jsx!widgets/Modal',
    'jsx!views/Printer-Selector',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'helpers/version-checker'
], function (
    ReactCx,
    BottomRightFuncs,
    PreviewModeController,
    BeamboxPreference,
    ButtonGroup,
    i18n,
    Modal,
    PrinterSelector,
    Alert,
    AlertConstants,
    VersionChecker
) {
    const React = require('react');
    const lang = i18n.lang;

    class BottomRightPanel extends React.Component {
        constructor() {
            super();
            console.error("BottomRightPanel is deprecated.")
            this.state = {
                isPrinterSelectorOpen: false
            };

            this._handleStartClick = this._handleStartClick.bind(this);
            this._renderPrinterSelectorWindow = this._renderPrinterSelectorWindow.bind(this);
        }

        async _handleStartClick() {
            if (PreviewModeController.isPreviewMode()) {
                await PreviewModeController.end(); 
            }

            const layers = $('#svgcontent > g.layer').toArray();
            const dpi = BeamboxPreference.read('engrave_dpi');

            const isPowerTooHigh = layers.map(layer => layer.getAttribute('data-strength'))
                    .some(strength => Number(strength) > 80);
            const imageElems = document.querySelectorAll('image');

            let isSpeedTooHigh = false;

            for (let i = 1; i < imageElems.length; i++) {
                if (imageElems[i].getAttribute('data-shading') && (
                        (dpi === 'medium' && imageElems[i].parentNode.getAttribute('data-speed') > 135) ||
                        (dpi === 'high' && imageElems[i].parentNode.getAttribute('data-speed') > 90)
                )) {
                    isSpeedTooHigh = true;
                    break;
                }
            }

            if (isPowerTooHigh && isSpeedTooHigh) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    message: lang.beambox.popup.both_power_and_speed_too_high
                });
            } else if (isPowerTooHigh) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    message: lang.beambox.popup.power_too_high_damage_laser_tube
                });
            } else if (isSpeedTooHigh) {
                Alert.popUp({
                    type: AlertConstants.SHOW_POPUP_WARNING,
                    message: lang.beambox.popup.speed_too_high_lower_the_quality
                });
            }

            this.setState({
                isPrinterSelectorOpen: true
            });
        }

        _renderPrinterSelectorWindow() {
            const onGettingPrinter = async (selected_item) => {
                //export fcode
                if (selected_item === 'export_fcode') {
                    BottomRightFuncs.exportFcode();
                    this.setState({
                        isPrinterSelectorOpen: false
                    });

                    return;
                }

                //check firmware
                const vc = VersionChecker(selected_item.version);
                if (vc.meetRequirement('USABLE_VERSION')) {
                    console.error('Not a valid firmware version');
                    Alert.popUp({
                        type: AlertConstants.SHOW_POPUP_ERROR,
                        message: lang.beambox.popup.should_update_firmware_to_continue
                    });
                    this.setState({
                        isPrinterSelectorOpen: false
                    });

                    return;
                }

                // start task
                this.setState({
                    isPrinterSelectorOpen: false,
                });
                BottomRightFuncs.uploadFcode(selected_item);
            };

            const onClose = () => {
                this.setState({
                    isPrinterSelectorOpen: false
                });
            };

            const content = (
                <PrinterSelector
                    uniqleId="laser"
                    className="laser-device-selection-popup"
                    modelFilter={PrinterSelector.BEAMBOX_FILTER}
                    showExport={true}
                    onClose={onClose}
                    onGettingPrinter={onGettingPrinter}
                />
            );

            return (
                <Modal content={content} onClose={onClose} />
            );
        }
        _renderActionButtons() {
            const buttons = [
                {
                    label: lang.monitor.start,
                    className: ReactCx.cx({
                        'btn-disabled': false,
                        'btn-default': true,
                        'btn-hexagon': true,
                        'btn-go': true
                    }),
                    dataAttrs: {
                        'ga-event': 'laser-goto-monitor'
                    },
                    onClick: this._handleStartClick
                }
            ];

            return (
                <ButtonGroup
                    buttons={buttons}
                    className="beehive-buttons action-buttons"
                />
            );
        }

        render() {
            //const actionButtons = this._renderActionButtons();
            const printerSelector = this._renderPrinterSelectorWindow();

            return (
                <div>
                    {this.state.isPrinterSelectorOpen?printerSelector:''}
                </div>
            );
        }
    }

    return BottomRightPanel;
});
