import * as React from 'react';
import electron from 'electron';

import i18n from 'helpers/i18n';
import Modal from 'app/widgets/Modal';
import SelectView from 'app/widgets/Select';

import communicator from 'implementations/communicator';

const { Menu } = electron.remote;

export default function(args) {
    args = args || {};

    interface State {
      lang: any;
    }

    class Home extends React.Component<any, State> {
        constructor(props) {
            super(props);
            this.state = {
                lang: args.state.lang
            };
        }

        // Private methods
        _getLanguageOptions = () => {
            var options = [];

            for (var lang_code in args.props.supported_langs) {
                options.push({
                    value: lang_code,
                    label: args.props.supported_langs[lang_code],
                    selected: lang_code === i18n.getActiveLang()
                });
            }

            return options;
        }

        _changeActiveLang = (e) => {
            i18n.setActiveLang(e.currentTarget.value);
            communicator.send('NOTIFY_LANGUAGE');
            if (window.os === 'Windows') {
                window['titlebar'].updateMenu(Menu.getApplicationMenu());
            }
            this.setState({
                lang: i18n.lang
            });
        }

        // Lifecycle
        render() {
            var lang = this.state.lang,
                options = this._getLanguageOptions(),
                wrapperClassName = {
                    'initialization': true
                },
                content = (
                    <div className="home text-center">
                        <img className="brand-image" src="img/menu/main_logo.svg"/>
                        <div>
                            <h1 className="headline">{lang.initialize.select_language}</h1>
                            <div className="language">
                                <SelectView id="select-lang" options={options} onChange={this._changeActiveLang}/>
                            </div>
                            <div>
                                <a href="#initialize/connect/flux-id-login" className="btn btn-action btn-large">{lang.initialize.next}</a>
                            </div>
                        </div>
                    </div>
                );

            return (
                <Modal className={wrapperClassName} content={content}/>
            );
        }
    };
    return Home;
};
