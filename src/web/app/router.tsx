import * as i18n from '../helpers/i18n';
import $ from 'jquery';
import Backbone from 'backbone';
import config from '../helpers/api/config';
import appSettings from './app-settings';
import Home from './pages/Home';
import SelectMachineType from './pages/Select-Machine-Type';
import SelectConnectionType from './pages/Select-Connection-Type';
import SkipConnectMachine from './pages/Skip-Connect-Machine';
import ConnectWiFi from './pages/Connect-Wi-Fi';
import ConnectWired from './pages/Connect-Wired';
import ConnectEthernet from './pages/Connect-Ethernet';
import ConnectMachineIp from './pages/Connect-Machine-Ip';
import FluxIdLogin from './pages/FluxIdLogin';
import Settings from './pages/Settings';
import Beambox from './pages/Beambox';
import { AlertsAndProgress } from './views/dialogs/Alerts-And-Progress';
import { Dialog } from './views/dialogs/Dialog';
import { AlertProgressContextProvider } from './contexts/Alert-Progress-Context';
import { DialogContextProvider } from './contexts/Dialog-Context';
import NotificationCollection from './views/Notification-Collection';
const React = requireNode('react');
const ReactDOM = requireNode('react-dom');

const _display = function(view: Function, args?, el?) {
    el = el || $('section.content')[0];
    args = args || {};
    args.props = args.props || {};
    args.state = args.state || {};

    args.state.lang = i18n.lang;
    // Shpuldn;t pass props and state using args.
    const elem = view(args);
    const component = React.createElement(elem, args.props);
    const wrappedComponent = (
        <AlertProgressContextProvider>
            <DialogContextProvider>
                { component }
                <Dialog index={0}/>
                <AlertsAndProgress/>
            </DialogContextProvider>
        </AlertProgressContextProvider>
    );
    ReactDOM.render(wrappedComponent, el);
};

export default Backbone.Router.extend({
    routes: {},

    initialize: function() {
        var router = this,
            routes = [
                // catch no match route, 404
                [/^.*$/, 'e404', this.e404],
                // initialize Flux Printer
                [
                    /^initialize\/connect\/?(flux-id-login|select-machine-type|select-connection-type|skip-connect-machine|connect-wi-fi|connect-wired|connect-ethernet|connect-machine-ip)\/?(.*)?/,
                    'initial',
                    this.initial
                ],
                // go to studio
                [
                    /^studio\/?(print|beambox|laser|scan|usb|settings|draw|cut|mill|cloud)\/?(.*)?/,
                    'studio',
                    this.studio
                ],
                // flux home
                [/^$/, 'home', this.home]
            ];

        routes.forEach(function(route) {
            router.route.apply(router, route);
        });

        this.appendNotificationCollection();
    },

    home: function(name) {
        _display(Home, {
            props: {
                supported_langs: appSettings.i18n.supported_langs
            }
        });
    },

    initial: function(step, other) {
        switch(step) {
            case 'flux-id-login':
                _display(FluxIdLogin);
                break;
            case 'select-machine-type':
                _display(
                    SelectMachineType,
                    {
                        props: {
                            other: other
                        }
                    }
                );
                break;
            case 'select-connection-type':
                _display(
                    SelectConnectionType,
                    {
                        props: {
                            other: other
                        }
                    }
                );
                break;
            case 'skip-connect-machine':
                _display(
                    SkipConnectMachine,
                    {
                        props: {
                            other: other
                        }
                    }
                )
                break;
            case 'connect-wi-fi':
                _display(
                    ConnectWiFi,
                    {
                        props: {
                            other: other
                        }
                    }
                )
                break;
            case 'connect-wired':
                _display(
                    ConnectWired,
                    {
                        props: {
                            other: other
                        }
                    }
                )
                break;
            case 'connect-ethernet':
                _display(
                    ConnectEthernet,
                    {
                        props: {
                            other: other
                        }
                    }
                )
                break;
            case 'connect-machine-ip':
                _display(
                    ConnectMachineIp,
                    {
                        props: {
                            other: other
                        }
                    }
                )
                break;
        }
    },

    appendNotificationCollection: function() {
        _display(NotificationCollection, {}, $('.notification')[0]);
    },

    studio: function(page, args) {
        args = args || '';

        var requests = args.split('/'),
            child_view = requests.splice(0, 1)[0],
            // if something needs webgl then add to the list below
            needWebGL = appSettings.needWebGL,
            map = {
                'beambox': this.beambox,
                'settings': this.settings,
                'usb': this.usb,
                'device': this.device
            },
            func = this.beambox;

        if (true === map.hasOwnProperty(page)) {
            func = map[page];
        }

        func(child_view, requests);
    },

    beambox: function() {
        _display(Beambox);
    },

    settings: function(child, requests) {
        child = (child || 'general').toLowerCase();

            var childView,
                args = {
                    child: child,
                    requests: requests
                };

            _display(Settings, args);
    },

    e404: function() {
        // TODO: handle 404
        alert('404');
    }
});
