import $ from 'jquery'
import * as i18n from '../../helpers/i18n'
import config from '../../helpers/api/config'
import settings from '../app-settings'
import DeviceSetting from '../views/settings/Setting-Device'
import GeneralSetting from '../views/settings/Setting-General'
const ClassNames = requireNode('classnames')
const React = requireNode('react');;

    export default function(args) {
        args = args || {};

        class HomeView extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    lang: args.state.lang
                };
            }

            _handleDone = () => {
                location.hash = 'studio/' + (config().read('default-app')||'beambox');
                location.reload();
            }

            _onLangChange = () => {
                this.setState({
                    lang: i18n.lang
                });
            }

            _renderContent = () => {
                let view = args.child;

                if (view == 'device') {
                    return (
                        <DeviceSetting lang={this.state.lang} />
                    );
                } 

                return (
                    <GeneralSetting
                        lang={this.state.lang}
                        supported_langs={settings.i18n.supported_langs}
                        onLangChange={this._onLangChange} />
                )
            }

            render() {
                var lang = this.state.lang,
                    menu_item = 'nav-item',
                    generalClass = ClassNames( menu_item, {active: args.child === 'general'}),
                    deviceClass = ClassNames( menu_item, {active: args.child === 'device'}),
                    // printerClass = ClassNames( menu_item, {active: 'printer' === args.child}),
                    // tabContainerClass = ClassNames( 'tab-container', {'no-top-margin': !this.state.displayMenu}),
                    tabs,
                    footer;

                footer = (
                    <footer className="sticky-bottom">
                        <div className="actions">
                            <a className="btn btn-done" onClick={this._handleDone}>{lang.settings.done}</a>
                        </div>
                    </footer>
                );

                return (
                    <div className="studio-container settings-studio">
                        <div className="settings-gradient-overlay"/>
                        {this._renderContent()}
                    </div>
                );
            }

        };

        return HomeView;
    };
