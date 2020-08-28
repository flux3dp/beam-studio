define([
    'jquery',
    'reactPropTypes',
    'jsx!views/cutter/Setup-Panel',
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

        class Cut extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    options: {
                        zOffset: 0,
                        overcut: 2,
                        speed: 30,
                        bladeRadius: 0.5
                    }
                };
            }

            componentDidMount() {
                let options = Config.read('cut-defaults') || {};
                options = {
                    zOffset: options.zOffset || 0,
                    overcut: options.overcut || 2,
                    speed: options.speed || 30,
                    bladeRadius: options.bladeRadius || 0.5,
                };
                if (!Config.read('cut-defaults')) {
                    Config.write('cut-defaults', options);
                }
                this.setState({options});
            }

            _fetchFormalSettings = () => {
                let options = Config.read('cut-defaults') || {};
                return {
                    cutting_zheight: options.zOffset || 0,
                    overcut: options.overcut || 2,
                    speed: options.speed || 30,
                    blade_radius: options.bladeRadius || 0.5,
                };
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

        Cut.propTypes = {
            page: PropTypes.string
        };

        return Cut;
    };
});
