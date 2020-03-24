define([
    'jquery',
    'reactPropTypes',
    'jsx!views/holder/Setup-Panel',
    'jsx!pages/Holder',
    'helpers/api/config',
    'helpers/i18n',
], function(
    $,
    PropTypes,
    HolderSetupPanel,
    HolderGenerator,
    ConfigHelper,
    i18n
) {
    const React = require('react');
    let Config = ConfigHelper(),
        lang = i18n.lang;

    'use strict';

    return function(args) {
        args = args || {};

        let Holder = HolderGenerator(args);

        class Draw extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    options:{
                        liftHeight: 55,
                        drawHeight: 50,
                        speed: 20
                    }
                };
            }

            componentDidMount() {
                let options = Config.read('draw-defaults') || {};
                options = {
                    liftHeight: options.liftHeight || 55,
                    drawHeight: options.drawHeight || 50,
                    speed: options.speed || 20
                };
                if (!Config.read('draw-defaults')) {
                    Config.write('draw-defaults', options);
                }
                this.setState({options});
            }

            _fetchFormalSettings = (holder) => {
                let options = Config.read('draw-defaults') || {};
                return {
                    lift_height: options.liftHeight || 0.1,
                    draw_height: options.drawHeight || 0.1,
                    speed: options.speed || 20
                };;
            }

            _renderSetupPanel = (holder) => {
                return <HolderSetupPanel
                    page={holder.props.page}
                    className="operating-panel"
                    imageFormat={holder.state.fileFormat}
                    defaults={holder.state.panelOptions}
                    ref="setupPanel"
                />;
            }

            render() {
                console.log('Load Holder', Holder);
                // return <div />;

                return <Holder
                    page={this.props.page}
                    acceptFormat={'image/svg'}
                    panelOptions={this.state.options}
                    fetchFormalSettings={this._fetchFormalSettings}
                    renderSetupPanel={this._renderSetupPanel}
                />;
            }
        };

        Draw.propTypes = {
            page: PropTypes.string
        };

        return Draw;
    };
});
